"""pattern_catalog.py — defines the cataloged repair patterns.

Adding a pattern is a human decision per the trust-ladder design, not
something this file or any caller does programmatically. Patterns 3 and 4
were added by directive after real evidence was found for both — they
are mechanical (no OpenRouter call), assembled entirely from facts
produced by existing certified tools.
"""

from __future__ import annotations

from enum import Enum


class PatternName(str, Enum):
    """The cataloged repair patterns."""

    BOUND_MISMATCH = "bound_mismatch"
    SILENT_FALLBACK = "silent_fallback"
    UNTRACKED_REGISTRY_SOURCE = "untracked_registry_source"
    MISLABELED_ADD_CLAIM = "mislabeled_add_claim"


# Frozen catalog. Callers may iterate this; they may not extend it at
# runtime. The deliberate lack of any registration/extension hook is the
# enforcement mechanism for the fixed pattern set.
PATTERNS: tuple[PatternName, ...] = (
    PatternName.BOUND_MISMATCH,
    PatternName.SILENT_FALLBACK,
    PatternName.UNTRACKED_REGISTRY_SOURCE,
    PatternName.MISLABELED_ADD_CLAIM,
)
