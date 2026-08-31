"""import_fixer — Rung 1 of the progressive trust ladder.

Four cataloged repair patterns:
  1. bound_mismatch — numeric clamp vs locked spec (OpenRouter-scoped fix)
  2. silent_fallback — default: return X instead of throw (OpenRouter-scoped fix)
  3. untracked_registry_source — untracked examples/ for a registry game (mechanical fix)
  4. mislabeled_add_claim — commit message falsely claims to "add" a symbol (mechanical fix)

The fixer produces a diff and a report; it never commits, pushes, or
self-certifies. Patterns 3 and 4 need no OpenRouter call — their fixes
are assembled entirely from facts produced by existing certified tools.
"""

from .pattern_catalog import PatternName, PATTERNS
from .bound_manifest import load_bound_manifest, BoundEntry
from .pattern_detector import (
    MatchStatus,
    detect_bound_mismatch,
    detect_silent_fallback,
    detect_untracked_registry_source,
    detect_mislabeled_add_claim,
)
from .fix_generator import generate_fix
from .fix_report import build_fix_report
from .tracking_fix_generator import generate_tracking_fix
from .commit_note_generator import generate_commit_note

__all__ = [
    "PatternName",
    "PATTERNS",
    "BoundEntry",
    "load_bound_manifest",
    "MatchStatus",
    "detect_bound_mismatch",
    "detect_silent_fallback",
    "detect_untracked_registry_source",
    "detect_mislabeled_add_claim",
    "generate_fix",
    "build_fix_report",
    "generate_tracking_fix",
    "generate_commit_note",
]
