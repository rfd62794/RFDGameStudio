"""import_fixer — Rung 1 of the progressive trust ladder.

Exactly two cataloged repair patterns (bound mismatch against a locked
spec, silent fallback instead of thrown error). The fixer produces a
diff and a report; it never commits, pushes, or self-certifies.
"""

from .pattern_catalog import PatternName, PATTERNS
from .bound_manifest import load_bound_manifest, BoundEntry
from .pattern_detector import (
    MatchStatus,
    detect_bound_mismatch,
    detect_silent_fallback,
)
from .fix_generator import generate_fix
from .fix_report import build_fix_report

__all__ = [
    "PatternName",
    "PATTERNS",
    "BoundEntry",
    "load_bound_manifest",
    "MatchStatus",
    "detect_bound_mismatch",
    "detect_silent_fallback",
    "generate_fix",
    "build_fix_report",
]
