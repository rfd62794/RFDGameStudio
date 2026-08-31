"""Tests for import_fixer.pattern_catalog — exactly 4 patterns."""

from studio_mcp.import_fixer.pattern_catalog import PATTERNS, PatternName


def test_pattern_catalog_has_exactly_four_patterns() -> None:
    assert len(PATTERNS) == 4


def test_pattern_catalog_contains_all_four_patterns() -> None:
    names = {p.value for p in PATTERNS}
    assert names == {
        "bound_mismatch",
        "silent_fallback",
        "untracked_registry_source",
        "mislabeled_add_claim",
    }


def test_pattern_name_enum_has_no_fifth_value() -> None:
    assert len(list(PatternName)) == 4
