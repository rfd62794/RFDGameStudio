"""pattern_detector.py — scan for clean matches of cataloged patterns.

Each detector returns one of:
    - clean_match:   a real, unambiguous instance of a cataloged pattern
                     with all required context (manifest entry, etc.)
    - no_clean_match: no instance found, or an instance that's already
                     correct / has no manifest entry
    - ambiguous:     something *almost* matches but doesn't cleanly fit

Detectors never produce a fix, never guess, never batch multiple
findings into one. Each clean_match is a single located instance.
"""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from studio_mcp.pipeline_audit.commit_claim_audit import audit_addition_claim
from studio_mcp.zip_verify.source_resolver import (
    _has_intake_zip,
    find_examples_dir_untracked,
)

from .bound_manifest import BoundEntry, find_entry, load_bound_manifest
from .pattern_catalog import PatternName


class MatchStatus(str, Enum):
    CLEAN_MATCH = "clean_match"
    NO_CLEAN_MATCH = "no_clean_match"
    AMBIGUOUS = "ambiguous"


@dataclass
class DetectionResult:
    status: MatchStatus
    pattern: PatternName
    file: str
    symbol: str | None = None
    line: int | None = None
    current_min: int | None = None
    current_max: int | None = None
    locked_min: int | None = None
    locked_max: int | None = None
    reason: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Pattern 1: bound mismatch
# ---------------------------------------------------------------------------

# Matches: function symbolName(...): number { return Math.max(LIT, Math.min(LIT, ...)); }
# Captures the two literal bounds and the function name.
_CLAMP_RE = re.compile(
    r"function\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)[^{]*\{[^}]*?"
    r"Math\.max\s*\(\s*(?P<lo>[-+]?\d+)\s*,\s*"
    r"Math\.min\s*\(\s*(?P<hi>[-+]?\d+)\s*,",
    re.DOTALL,
)

# Variant: Math.min(LIT, Math.max(LIT, ...)) — reversed nesting
_CLAMP_RE_REVERSED = re.compile(
    r"function\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)[^{]*\{[^}]*?"
    r"Math\.min\s*\(\s*(?P<hi>[-+]?\d+)\s*,\s*"
    r"Math\.max\s*\(\s*(?P<lo>[-+]?\d+)\s*,",
    re.DOTALL,
)


def _find_clamp_functions(text: str) -> list[dict[str, Any]]:
    """Return list of {name, lo, hi, line, start} for clamp-style functions."""
    results: list[dict[str, Any]] = []
    seen_spans: set[int] = set()

    for m in _CLAMP_RE.finditer(text):
        if m.start() in seen_spans:
            continue
        seen_spans.add(m.start())
        line = text.count("\n", 0, m.start()) + 1
        results.append(
            {
                "name": m.group("name"),
                "lo": int(m.group("lo")),
                "hi": int(m.group("hi")),
                "line": line,
                "start": m.start(),
            }
        )

    for m in _CLAMP_RE_REVERSED.finditer(text):
        if m.start() in seen_spans:
            continue
        seen_spans.add(m.start())
        line = text.count("\n", 0, m.start()) + 1
        results.append(
            {
                "name": m.group("name"),
                "lo": int(m.group("lo")),
                "hi": int(m.group("hi")),
                "line": line,
                "start": m.start(),
            }
        )

    return results


def detect_bound_mismatch(
    file_path: Path | str,
    manifest_entries: list[BoundEntry] | None = None,
    manifest_path: Path | str = "bound_manifest.yaml",
) -> DetectionResult:
    """Detect a numeric bound mismatch against the locked manifest.

    Returns clean_match only when:
      - a clamp function is found with literal bounds
      - a manifest entry exists for (file, symbol)
      - the current bounds differ from the locked bounds

    Returns no_clean_match when:
      - no clamp function found
      - a clamp is found but no manifest entry exists (no guessing)
      - a clamp is found and already matches the manifest (nothing to fix)

    Returns ambiguous when:
      - a clamp uses a variable bound instead of a literal (regex won't
        match, but if we detect a clamp-shaped function without literal
        bounds we flag it here)
    """
    file_str = str(file_path).replace("\\", "/")
    text = Path(file_path).read_text(encoding="utf-8")

    if manifest_entries is None:
        manifest_entries = load_bound_manifest(manifest_path)

    clamps = _find_clamp_functions(text)

    # Look for clamp-shaped functions the regex didn't match (variable bounds).
    # This check runs before the early "no clamps" return so that a
    # variable-bound clamp is correctly flagged as ambiguous, not silently
    # dropped as "no clamp found". A clamp shape requires BOTH Math.min and
    # Math.max in the same function body — a lone Math.min (like ring_distance)
    # is not a clamp and should not trigger ambiguity.
    loose_clamp_re = re.compile(
        r"function\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)[^{]*\{[^}]*?"
        r"Math\.(?:min|max)\s*\([^}]*?Math\.(?:min|max)\s*\(",
        re.DOTALL,
    )
    loose_names = {m.group("name") for m in loose_clamp_re.finditer(text)}
    matched_names = {c["name"] for c in clamps}
    unmatched_loose = loose_names - matched_names
    if unmatched_loose:
        return DetectionResult(
            status=MatchStatus.AMBIGUOUS,
            pattern=PatternName.BOUND_MISMATCH,
            file=file_str,
            symbol=next(iter(unmatched_loose)),
            reason=(
                f"Clamp-shaped function(s) {sorted(unmatched_loose)} use "
                "non-literal bounds; cannot verify against manifest"
            ),
        )

    if not clamps:
        return DetectionResult(
            status=MatchStatus.NO_CLEAN_MATCH,
            pattern=PatternName.BOUND_MISMATCH,
            file=file_str,
            reason="No clamp-style function found",
        )

    # Check each matched clamp against the manifest
    for c in clamps:
        entry = find_entry(manifest_entries, file_str, c["name"])
        if entry is None:
            # No manifest entry — try matching by symbol name alone across
            # any file, but only if exactly one entry has that symbol.
            same_symbol = [e for e in manifest_entries if e.symbol == c["name"]]
            if len(same_symbol) == 1:
                entry = same_symbol[0]
            else:
                continue

        if c["lo"] == entry.locked_min and c["hi"] == entry.locked_max:
            # Already correct — nothing to fix.
            return DetectionResult(
                status=MatchStatus.NO_CLEAN_MATCH,
                pattern=PatternName.BOUND_MISMATCH,
                file=file_str,
                symbol=c["name"],
                line=c["line"],
                current_min=c["lo"],
                current_max=c["hi"],
                locked_min=entry.locked_min,
                locked_max=entry.locked_max,
                reason="Current bounds already match the manifest",
            )

        # Real mismatch.
        return DetectionResult(
            status=MatchStatus.CLEAN_MATCH,
            pattern=PatternName.BOUND_MISMATCH,
            file=file_str,
            symbol=c["name"],
            line=c["line"],
            current_min=c["lo"],
            current_max=c["hi"],
            locked_min=entry.locked_min,
            locked_max=entry.locked_max,
            reason=(
                f"Current bounds [{c['lo']}, {c['hi']}] vs "
                f"locked [{entry.locked_min}, {entry.locked_max}]"
            ),
        )

    # Clamps found but none have a manifest entry.
    return DetectionResult(
        status=MatchStatus.NO_CLEAN_MATCH,
        pattern=PatternName.BOUND_MISMATCH,
        file=file_str,
        reason="Clamp function(s) found but no manifest entry for any of them",
        extra={"clamp_names": [c["name"] for c in clamps]},
    )


# ---------------------------------------------------------------------------
# Pattern 2: silent fallback
# ---------------------------------------------------------------------------

# Match `default: return <something>;` inside a switch block.
# We deliberately do NOT match `default: throw ...` — that's the correct
# shape, not a bug.
_SILENT_DEFAULT_RE = re.compile(
    r"default\s*:\s*\n?\s*return\s+(?P<retval>[^;]+);",
    re.DOTALL,
)

# Match `default: { ... return <something>; }` block form
_SILENT_DEFAULT_BLOCK_RE = re.compile(
    r"default\s*:\s*\{[^}]*?return\s+(?P<retval>[^;]+);",
    re.DOTALL,
)

# Detect a default branch that logs before returning — that's ambiguous,
# not a clean silent-fallback match.
_DEFAULT_LOGS_RE = re.compile(
    r"default\s*:\s*\n?\s*(?:console\.log|log\w*|console\.\w+)\s*\(",
    re.DOTALL,
)

# Detect a default branch that throws — correct shape, not a bug.
# The throw can appear anywhere in the branch (e.g. after a log statement),
# not just immediately after `default:`.
_DEFAULT_THROWS_RE = re.compile(
    r"throw\s+",
    re.DOTALL,
)

# Match function declarations to extract parameter names, so we can
# distinguish `default: return <param>` (defensive no-op) from
# `default: return <manufactured value>` (silent fallback).
_FUNC_RE = re.compile(
    r"function\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\((?P<params>[^)]*)\)",
    re.DOTALL,
)
_ARROW_FUNC_RE = re.compile(
    r"(?:const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*\s*(?::\s*[^=]+)?\s*=\s*\((?P<params>[^)]*)\)\s*=>",
    re.DOTALL,
)


def _parse_param_names(param_str: str) -> set[str]:
    """Extract bare parameter names from a parameter list string.

    Handles typed params (`x: number`), destructuring is not supported
    (returns empty for those — they won't match simple return values).
    """
    names: set[str] = set()
    for part in param_str.split(","):
        part = part.strip()
        if not part:
            continue
        # Strip type annotation: `name: type` → `name`
        name = part.split(":")[0].strip()
        # Strip default value: `name = value` → `name`
        name = name.split("=")[0].strip()
        # Only accept simple identifiers, not destructuring patterns
        if re.match(r"^[A-Za-z_$][A-Za-z0-9_$]*$", name):
            names.add(name)
    return names


def _find_enclosing_function_params(text: str, pos: int) -> set[str]:
    """Find the parameter names of the function enclosing position `pos`.

    Scans backward from `pos` for the nearest function declaration
    whose body contains `pos`. Returns an empty set if not found.
    """
    # Search backward for function declarations before `pos`.
    best_params: set[str] = set()
    best_end: int = -1

    for m in _FUNC_RE.finditer(text, 0, pos + 1):
        # Find the end of this function's body (matching braces).
        brace_start = text.find("{", m.end())
        if brace_start == -1:
            continue
        depth = 0
        end = brace_start
        for i in range(brace_start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if brace_start <= pos <= end and end > best_end:
            best_end = end
            best_params = _parse_param_names(m.group("params"))

    for m in _ARROW_FUNC_RE.finditer(text, 0, pos + 1):
        brace_start = text.find("{", m.end())
        if brace_start == -1:
            continue
        depth = 0
        end = brace_start
        for i in range(brace_start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if brace_start <= pos <= end and end > best_end:
            best_end = end
            best_params = _parse_param_names(m.group("params"))

    return best_params


def detect_silent_fallback(file_path: Path | str) -> list[DetectionResult]:
    """Detect `default: return X` branches in switch/match statements.

    Returns one DetectionResult per located instance. A default that
    throws is no_clean_match (correct shape). A default that logs before
    returning is ambiguous. A plain `default: return X` is clean_match.
    """
    file_str = str(file_path).replace("\\", "/")
    text = Path(file_path).read_text(encoding="utf-8")

    results: list[DetectionResult] = []

    # Find all default branches first, then classify each.
    default_spans: list[tuple[int, int]] = []
    for m in re.finditer(r"default\s*:", text):
        start = m.start()
        # Find the end of this default branch: next `case`, `}`, or end of switch
        rest = text[m.end():]
        end_rel = re.search(r"(\bcase\b|\})", rest)
        end = m.end() + (end_rel.start() if end_rel else len(rest))
        default_spans.append((start, end))

    for start, end in default_spans:
        branch_text = text[start:end]
        line = text.count("\n", 0, start) + 1

        if _DEFAULT_THROWS_RE.search(branch_text):
            results.append(
                DetectionResult(
                    status=MatchStatus.NO_CLEAN_MATCH,
                    pattern=PatternName.SILENT_FALLBACK,
                    file=file_str,
                    line=line,
                    reason="default branch throws — correct shape, not a bug",
                )
            )
            continue

        if _DEFAULT_LOGS_RE.search(branch_text):
            results.append(
                DetectionResult(
                    status=MatchStatus.AMBIGUOUS,
                    pattern=PatternName.SILENT_FALLBACK,
                    file=file_str,
                    line=line,
                    reason="default branch logs before returning — ambiguous",
                )
            )
            continue

        silent = _SILENT_DEFAULT_RE.search(branch_text) or _SILENT_DEFAULT_BLOCK_RE.search(branch_text)
        if silent:
            retval = silent.group("retval").strip()
            extra = {"return_value": retval}

            # Check whether the return value is one of the enclosing
            # function's parameters — a `default: return <param>` is a
            # defensive no-op at a type boundary (preserving the caller's
            # input unchanged), not a silent fallback that discards data.
            # This is excluded from Pattern 2 per the scoping decision:
            # "default returns the caller's own input, unchanged" is a
            # deliberate safety net, not a bug.
            func_params = _find_enclosing_function_params(text, start)
            if func_params and retval in func_params:
                results.append(
                    DetectionResult(
                        status=MatchStatus.NO_CLEAN_MATCH,
                        pattern=PatternName.SILENT_FALLBACK,
                        file=file_str,
                        line=line,
                        reason=(
                            f"default branch returns parameter `{retval}` "
                            "unchanged — defensive no-op at a type boundary, "
                            "not a silent fallback"
                        ),
                        extra=extra,
                    )
                )
                continue

            results.append(
                DetectionResult(
                    status=MatchStatus.CLEAN_MATCH,
                    pattern=PatternName.SILENT_FALLBACK,
                    file=file_str,
                    line=line,
                    reason=f"default branch returns `{retval}` instead of throwing",
                    extra=extra,
                )
            )
        else:
            # default branch with no return and no throw — could be empty
            # fallthrough, ambiguous.
            results.append(
                DetectionResult(
                    status=MatchStatus.AMBIGUOUS,
                    pattern=PatternName.SILENT_FALLBACK,
                    file=file_str,
                    line=line,
                    reason="default branch neither returns nor throws — unclear intent",
                )
            )

    if not results:
        results.append(
            DetectionResult(
                status=MatchStatus.NO_CLEAN_MATCH,
                pattern=PatternName.SILENT_FALLBACK,
                file=file_str,
                reason="No default branches found",
            )
        )

    return results


# ---------------------------------------------------------------------------
# Pattern 3: untracked registry source
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _count_tracked_files(path: Path) -> int:
    """Count git-tracked files under `path` (relative to repo root)."""
    try:
        rel = path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return 0
    result = subprocess.run(
        ["git", "ls-files", "--", rel],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return len([l for l in result.stdout.strip().splitlines() if l])


def detect_untracked_registry_source(
    slug: str, repo_root: Path | str | None = None
) -> DetectionResult:
    """Detect an untracked source directory for a registry-linked game.

    Logic:
      1. If the slug has a zip source → no_clean_match (zip is valid).
      2. If ts/src/games/{slug}/ has >1 tracked file → no_clean_match
         (properly ported).
      3. Use the tracking-agnostic finder to get on-disk candidates.
         Zero → no_clean_match. One untracked → clean_match.
         Multiple untracked → ambiguous.
    """
    root = Path(repo_root) if repo_root else REPO_ROOT

    # 1. Check for zip source.
    intake_dir = _has_intake_zip(slug)
    if intake_dir:
        return DetectionResult(
            status=MatchStatus.NO_CLEAN_MATCH,
            pattern=PatternName.UNTRACKED_REGISTRY_SOURCE,
            file=str(intake_dir),
            reason="Slug has a zip source — untracked examples/ copy is expected",
        )

    # 2. Check ts/src/games/{slug}/ tracked file count.
    for variant in [slug, slug.replace("_", "-"), slug.replace("-", "_")]:
        ts_dir = root / "ts" / "src" / "games" / variant
        if ts_dir.is_dir():
            count = _count_tracked_files(ts_dir)
            if count > 1:
                return DetectionResult(
                    status=MatchStatus.NO_CLEAN_MATCH,
                    pattern=PatternName.UNTRACKED_REGISTRY_SOURCE,
                    file=str(ts_dir),
                    reason=f"ts/src/games/{variant}/ has {count} tracked files — properly ported",
                )
            break

    # 3. Find on-disk candidates (tracking-agnostic).
    examples_dir = root / "examples"
    candidates = find_examples_dir_untracked(slug, examples_dir=examples_dir)
    if not candidates:
        return DetectionResult(
            status=MatchStatus.NO_CLEAN_MATCH,
            pattern=PatternName.UNTRACKED_REGISTRY_SOURCE,
            file="",
            reason="No on-disk examples/ directory found for this slug",
        )

    # Filter to untracked candidates only.
    untracked = [c for c in candidates if not _is_git_tracked_local(c, root)]
    if not untracked:
        return DetectionResult(
            status=MatchStatus.NO_CLEAN_MATCH,
            pattern=PatternName.UNTRACKED_REGISTRY_SOURCE,
            file="",
            reason="All candidate directories are already git-tracked",
        )

    if len(untracked) > 1:
        names = [c.name for c in untracked]
        return DetectionResult(
            status=MatchStatus.AMBIGUOUS,
            pattern=PatternName.UNTRACKED_REGISTRY_SOURCE,
            file="",
            reason=f"Multiple untracked candidate directories: {names} — cannot determine which is canonical",
            extra={"candidates": names},
        )

    # Exactly one untracked candidate.
    c = untracked[0]
    return DetectionResult(
        status=MatchStatus.CLEAN_MATCH,
        pattern=PatternName.UNTRACKED_REGISTRY_SOURCE,
        file=str(c),
        symbol=c.name,
        reason=f"Untracked source directory found: {c.name}",
    )


def _is_git_tracked_local(path: Path, repo_root: Path) -> bool:
    """Check if path has any git-tracked files (local version for Pattern 3)."""
    try:
        rel = path.relative_to(repo_root).as_posix()
    except ValueError:
        return False
    result = subprocess.run(
        ["git", "ls-files", "--", rel],
        cwd=repo_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return bool(result.stdout.strip())


# ---------------------------------------------------------------------------
# Pattern 4: mislabeled add claim
# ---------------------------------------------------------------------------

# Match "add/adds/added <symbol>" in commit messages. Symbol can be
# backtick-quoted or a bare identifier.
_ADD_CLAIM_RE = re.compile(
    r"\b(?:add|adds|added)\s+(?:`(?P<q>[A-Za-z_$][A-Za-z0-9_$]*)`"
    r"|(?P<bare>[A-Za-z_$][A-Za-z0-9_$]*))",
    re.IGNORECASE,
)


def _get_commit_message(commit_hash: str, repo_root: Path | str | None = None) -> str:
    """Return the full commit message for a commit."""
    root = Path(repo_root) if repo_root else REPO_ROOT
    result = subprocess.run(
        ["git", "log", "-1", "--format=%B", commit_hash],
        cwd=root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return result.stdout or ""


def _get_commit_files(commit_hash: str, repo_root: Path | str | None = None) -> list[str]:
    """Return the list of files touched by a commit."""
    root = Path(repo_root) if repo_root else REPO_ROOT
    result = subprocess.run(
        ["git", "show", "--stat", "--format=", commit_hash],
        cwd=root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    files: list[str] = []
    for line in result.stdout.splitlines():
        stripped = line.strip()
        if "|" in stripped:
            file_part = stripped.split("|")[0].strip()
            if file_part:
                files.append(file_part)
    return files


def detect_mislabeled_add_claim(
    commit_hash: str, repo_root: Path | str | None = None
) -> list[DetectionResult]:
    """Detect commit messages that falsely claim to "add" a pre-existing symbol.

    Parses the commit message for "add/adds/added <symbol>" patterns,
    then runs audit_addition_claim for each. Returns one DetectionResult
    per claim found.
    """
    root = Path(repo_root) if repo_root else REPO_ROOT
    message = _get_commit_message(commit_hash, repo_root=root)

    if not message:
        return [
            DetectionResult(
                status=MatchStatus.NO_CLEAN_MATCH,
                pattern=PatternName.MISLABELED_ADD_CLAIM,
                file=commit_hash,
                reason="Commit message is empty or commit not found",
            )
        ]

    claims = _ADD_CLAIM_RE.findall(message)
    if not claims:
        return [
            DetectionResult(
                status=MatchStatus.NO_CLEAN_MATCH,
                pattern=PatternName.MISLABELED_ADD_CLAIM,
                file=commit_hash,
                reason="No 'add <symbol>' claim found in commit message",
            )
        ]

    commit_files = _get_commit_files(commit_hash, repo_root=root)
    results: list[DetectionResult] = []

    for match in claims:
        # findall returns tuples of named groups
        symbol = match[0] if match[0] else match[1]
        if not symbol:
            continue

        audit = audit_addition_claim(
            symbol=symbol,
            commit_hash=commit_hash,
            file_paths=commit_files,
            repo_path=root,
        )

        if audit.get("confirmed"):
            results.append(
                DetectionResult(
                    status=MatchStatus.NO_CLEAN_MATCH,
                    pattern=PatternName.MISLABELED_ADD_CLAIM,
                    file=commit_hash,
                    symbol=symbol,
                    reason=f"Claim 'add {symbol}' is true — symbol genuinely first appears in this commit",
                )
            )
        elif audit.get("pre_existing_since"):
            results.append(
                DetectionResult(
                    status=MatchStatus.CLEAN_MATCH,
                    pattern=PatternName.MISLABELED_ADD_CLAIM,
                    file=commit_hash,
                    symbol=symbol,
                    reason=(
                        f"Claim 'add {symbol}' is false — symbol pre-exists "
                        f"as of {audit['pre_existing_since']}"
                    ),
                    extra={"pre_existing_since": audit["pre_existing_since"]},
                )
            )
        else:
            results.append(
                DetectionResult(
                    status=MatchStatus.AMBIGUOUS,
                    pattern=PatternName.MISLABELED_ADD_CLAIM,
                    file=commit_hash,
                    symbol=symbol,
                    reason=f"Could not verify claim 'add {symbol}' — audit returned no clear result",
                )
            )

    return results
