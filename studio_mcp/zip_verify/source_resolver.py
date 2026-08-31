"""source_resolver.py — decide whether a game slug has a zip source, a tracked
examples/ directory source, both, or neither."""

from __future__ import annotations

import re
import subprocess
from enum import Enum
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
INTAKE_DIR = REPO_ROOT / "intake"
EXAMPLES_DIR = REPO_ROOT / "examples"


class SourceType(str, Enum):
    ZIP_SOURCE = "zip_source"
    TRACKED_DIR_SOURCE = "tracked_dir_source"
    BOTH = "both"
    NO_SOURCE_FOUND = "no_source_found"


# Explicit overrides for slugs whose examples/ directory name does not follow
# any simple underscore/hyphen transformation (e.g. camel casing or extra words).
_EXAMPLES_DIR_OVERRIDES: dict[str, str] = {
    "slimebreeder": "SlimeBreeder",
    "horse_racing": "horse-racing-&-breeding",
    "slither_rogue": "slither-rogue_-evolution",
    "voiddrift_redux": "voiddrift-redux-core-loop",
    # Phase2 is treated as the current Factory Idle source; Phase1 is retained
    # as a prior iteration but is not the canonical mapping for verification.
    "factory_idle": "factory-idle-precision-armory-phase2",
}


def _slug_variants(slug: str) -> list[str]:
    """Return the slug plus the two obvious hyphen/underscore swaps."""
    return [slug, slug.replace("_", "-"), slug.replace("-", "_")]


def _normalize_name(name: str) -> str:
    """Strip non-alphanumeric characters for fuzzy matching."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def _is_git_tracked(path: Path) -> bool:
    """Return True if `path` (relative to repo root) has any tracked files."""
    try:
        rel = path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return False
    result = subprocess.run(
        ["git", "ls-files", "--", rel],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return bool(result.stdout.strip())


def _find_examples_dir(slug: str) -> Path | None:
    """Return a real, git-tracked examples/ directory for a registry slug, if any.

    Handles exact matches, hyphen/underscore variants, casing mismatches
    (e.g. SlimeBreeder), and a small explicit override table for names that
    diverge further. A directory is only returned if git actually tracks it —
    an untracked or gitignored directory does not count as a verifiable source.
    """
    candidates: list[Path] = []

    if slug in _EXAMPLES_DIR_OVERRIDES:
        override = EXAMPLES_DIR / _EXAMPLES_DIR_OVERRIDES[slug]
        if override.is_dir():
            candidates.append(override)

    # Exact and simple variant matches, case-insensitive for casing mismatches.
    for variant in _slug_variants(slug):
        for name in [variant, variant.lower(), variant.capitalize()]:
            candidate = EXAMPLES_DIR / name
            if candidate.is_dir():
                candidates.append(candidate)

    # Fuzzy normalized match: only accept an exact normalized equality so we
    # don't accidentally pick a loosely related directory.
    target_norm = _normalize_name(slug)
    for candidate in EXAMPLES_DIR.iterdir():
        if not candidate.is_dir():
            continue
        if _normalize_name(candidate.name) == target_norm:
            candidates.append(candidate)

    for candidate in candidates:
        if _is_git_tracked(candidate):
            return candidate

    return None


def _has_intake_zip(slug: str) -> Path | None:
    """Return the intake directory for the slug if it contains at least one zip.

    Tries the slug directly and hyphen/underscore variants, because registry
    slugs (7_days_to_fry) and intake directories (7-days-to-fry) can differ.
    """
    for variant in _slug_variants(slug):
        intake_path = INTAKE_DIR / variant
        if not intake_path.is_dir():
            continue
        for child in intake_path.iterdir():
            if child.is_file() and child.suffix == ".zip":
                return intake_path
    return None


def resolve_source(slug: str) -> dict[str, object]:
    """Classify where the real source material for a registry slug lives.

    Returns a dict with:
        - slug: the input slug
        - source_type: SourceType value
        - intake_dir: Path | None
        - examples_dir: Path | None
        - resolved_examples_name: str | None
    """
    intake_dir = _has_intake_zip(slug)
    examples_dir = _find_examples_dir(slug)

    if intake_dir and examples_dir:
        source_type = SourceType.BOTH
    elif intake_dir:
        source_type = SourceType.ZIP_SOURCE
    elif examples_dir:
        source_type = SourceType.TRACKED_DIR_SOURCE
    else:
        source_type = SourceType.NO_SOURCE_FOUND

    return {
        "slug": slug,
        "source_type": source_type,
        "intake_dir": intake_dir,
        "examples_dir": examples_dir,
        "resolved_examples_name": examples_dir.name if examples_dir else None,
    }
