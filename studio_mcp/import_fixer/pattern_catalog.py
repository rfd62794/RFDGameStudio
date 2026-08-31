"""pattern_catalog.py — defines exactly two repair patterns, no more.

Adding a third pattern is a human decision per the trust-ladder design,
not something this file or any caller does programmatically.
"""

from __future__ import annotations

from enum import Enum


class PatternName(str, Enum):
    """The two — and only two — cataloged repair patterns."""

    BOUND_MISMATCH = "bound_mismatch"
    SILENT_FALLBACK = "silent_fallback"


# Frozen catalog. Callers may iterate this; they may not extend it at
# runtime. The deliberate lack of any registration/extension hook is the
# enforcement mechanism for "exactly two patterns".
PATTERNS: tuple[PatternName, ...] = (
    PatternName.BOUND_MISMATCH,
    PatternName.SILENT_FALLBACK,
)
