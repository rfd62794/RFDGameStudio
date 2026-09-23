"""revision_diff.py — diff core logic files between two zip revisions."""

from __future__ import annotations

import difflib
import re
from pathlib import Path

from .zip_reader import core_logic_files, extract_zip

_VERSIONED_ZIP_RE = re.compile(r"^(?P<slug>.+)_v(?P<version>\d+\.\d+\.\d+R\d+)\.zip$")


def find_prior_revision(zip_path: Path | str) -> Path | None:
    """Return the next older versioned zip for the same slug, if any."""
    zip_path = Path(zip_path).resolve()
    match = _VERSIONED_ZIP_RE.match(zip_path.name)
    if not match:
        return None

    slug = match.group("slug")
    concept_dir = zip_path.parent
    candidates: list[tuple[Path, float]] = []
    for p in concept_dir.glob("*.zip"):
        m = _VERSIONED_ZIP_RE.match(p.name)
        if not m or m.group("slug") != slug or p == zip_path:
            continue
        candidates.append((p, p.stat().st_ctime))

    if not candidates:
        return None

    # Sort by creation time descending; pick the first older than the target.
    target_ctime = zip_path.stat().st_ctime
    older = [p for p, ctime in candidates if ctime < target_ctime]
    if not older:
        # Fallback to most recent other revision if timestamps are equal.
        older = [p for p, ctime in candidates]
    return max(older, key=lambda p: p.stat().st_ctime) if older else None


def _relative_paths(files: list[Path], base: Path) -> set[str]:
    return {str(p.relative_to(base)).replace("\\", "/") for p in files}


def _extract_functions(text: str) -> set[str]:
    """Return function/class names defined in the text."""
    names: set[str] = set()
    for line in text.splitlines():
        match = re.search(r"(?:^|(?<=\s))(?:function|class|def)\s+([A-Za-z0-9_]+)", line)
        if match:
            names.add(match.group(1))
    return names


def diff_revision(
    zip_path: Path | str,
    prior_path: Path | str | None = None,
) -> dict:
    """Diff the current zip against the prior revision.

    Returns structured findings including per-file diffs and changed function names.
    """
    zip_path = Path(zip_path).resolve()
    if prior_path is None:
        prior_path = find_prior_revision(zip_path)

    if prior_path is None:
        scratch, files = extract_zip(zip_path)
        return {
            "zip_path": str(zip_path),
            "prior_path": None,
            "scratch_dir": str(scratch),
            "no_prior_revision": True,
            "files": [str(p.relative_to(scratch)).replace("\\", "/") for p in core_logic_files(scratch)],
            "changed_functions": [],
            "diffs": {},
        }

    current_scratch, _ = extract_zip(zip_path)
    prior_scratch, _ = extract_zip(prior_path)

    current_files = {p: str(p.relative_to(current_scratch)).replace("\\", "/") for p in core_logic_files(current_scratch)}
    prior_files = {p: str(p.relative_to(prior_scratch)).replace("\\", "/") for p in core_logic_files(prior_scratch)}

    current_by_rel = {rel: p for p, rel in current_files.items()}
    prior_by_rel = {rel: p for p, rel in prior_files.items()}

    diffs: dict[str, str] = {}
    changed_functions: list[str] = []

    all_rels = sorted(set(current_by_rel) | set(prior_by_rel))
    for rel in all_rels:
        current_text = current_by_rel[rel].read_text(encoding="utf-8", errors="replace") if rel in current_by_rel else ""
        prior_text = prior_by_rel[rel].read_text(encoding="utf-8", errors="replace") if rel in prior_by_rel else ""
        if current_text == prior_text:
            continue
        diff = "\n".join(
            difflib.unified_diff(
                prior_text.splitlines(),
                current_text.splitlines(),
                fromfile=f"a/{rel}",
                tofile=f"b/{rel}",
                lineterm="",
            )
        )
        if diff:
            diffs[rel] = diff
            current_funcs = _extract_functions(current_text) if rel in current_by_rel else set()
            prior_funcs = _extract_functions(prior_text) if rel in prior_by_rel else set()
            changed_functions.extend(sorted(current_funcs ^ prior_funcs))

    return {
        "zip_path": str(zip_path),
        "prior_path": str(prior_path),
        "scratch_dir": str(current_scratch),
        "no_prior_revision": False,
        "files": sorted(all_rels),
        "changed_functions": sorted(set(changed_functions)),
        "diffs": diffs,
    }
