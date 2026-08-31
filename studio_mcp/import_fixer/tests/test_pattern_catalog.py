"""Tests for import_fixer.pattern_catalog — exactly 2 patterns."""

from studio_mcp.import_fixer.pattern_catalog import PATTERNS, PatternName


def test_pattern_catalog_has_exactly_two_patterns() -> None:
    assert len(PATTERNS) == 2


def test_pattern_catalog_contains_bound_mismatch_and_silent_fallback() -> None:
    names = {p.value for p in PATTERNS}
    assert names == {"bound_mismatch", "silent_fallback"}


def test_pattern_name_enum_has_no_third_value() -> None:
    assert len(list(PatternName)) == 2
