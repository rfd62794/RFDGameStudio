"""Tests for import_fixer.bound_manifest."""

from __future__ import annotations

from pathlib import Path

from studio_mcp.import_fixer.bound_manifest import BoundEntry, find_entry, load_bound_manifest


def test_load_bound_manifest_loads_real_entry() -> None:
    """The real bound_manifest.yaml at repo root has exactly one entry."""
    entries = load_bound_manifest("bound_manifest.yaml")
    assert len(entries) == 1
    e = entries[0]
    assert e.symbol == "clampTier"
    assert e.locked_min == 0
    assert e.locked_max == 3
    assert "slimeEngine.ts" in e.file


def test_load_bound_manifest_missing_file_returns_empty() -> None:
    entries = load_bound_manifest("/does/not/exist.yaml")
    assert entries == []


def test_find_entry_matches_file_and_symbol() -> None:
    entries = [
        BoundEntry(file="a.ts", symbol="foo", locked_min=0, locked_max=1, source="t"),
        BoundEntry(file="b.ts", symbol="bar", locked_min=0, locked_max=2, source="t"),
    ]
    assert find_entry(entries, "b.ts", "bar") is not None
    assert find_entry(entries, "a.ts", "bar") is None


def test_load_bound_manifest_rejects_missing_field(tmp_path: Path) -> None:
    import yaml

    bad = tmp_path / "bad.yaml"
    bad.write_text(yaml.safe_dump([{"file": "x.ts", "symbol": "x"}]), encoding="utf-8")
    try:
        load_bound_manifest(bad)
        assert False, "should have raised"
    except ValueError as e:
        assert "locked_min" in str(e) or "locked_max" in str(e)
