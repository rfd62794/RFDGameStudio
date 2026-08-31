"""Tests for source_resolver.py."""

from pathlib import Path

import pytest

from studio_mcp.zip_verify.source_resolver import SourceType, resolve_source

REPO_ROOT = Path(__file__).resolve().parents[3]
INTAKE_DIR = REPO_ROOT / "intake"


@pytest.mark.parametrize("slug", [
    "facility-escape",
    "antsim-redux",
    "7_days_to_fry",
    "slimegarden",
])
def test_source_resolver_reports_both_for_dual_source(slug: str) -> None:
    """Slugs with both an intake zip and a tracked examples/ dir are `both`."""
    result = resolve_source(slug)
    assert result["source_type"] == SourceType.BOTH
    assert result["intake_dir"] is not None
    assert result["intake_dir"].is_dir()
    assert result["examples_dir"] is not None


def test_source_resolver_finds_tracked_dir_source() -> None:
    """A slug with only a tracked examples/ dir resolves to
    `tracked_dir_source`."""
    result = resolve_source("planetforge")
    assert result["source_type"] == SourceType.TRACKED_DIR_SOURCE
    assert result["intake_dir"] is None
    assert result["examples_dir"] == REPO_ROOT / "examples" / "planetforge"
    assert result["resolved_examples_name"] == "planetforge"


def test_source_resolver_reports_no_source_found() -> None:
    """A slug matching neither intake nor examples resolves honestly."""
    result = resolve_source("not-a-real-game-slug-xyz")
    assert result["source_type"] == SourceType.NO_SOURCE_FOUND
    assert result["intake_dir"] is None
    assert result["examples_dir"] is None


def test_source_resolver_handles_naming_mismatch() -> None:
    """`slimebreeder` (registry slug, lowercase underscore) resolves against
    `examples/SlimeBreeder` (real directory casing)."""
    result = resolve_source("slimebreeder")
    assert result["source_type"] == SourceType.TRACKED_DIR_SOURCE
    assert result["examples_dir"] == REPO_ROOT / "examples" / "SlimeBreeder"
    assert result["resolved_examples_name"] == "SlimeBreeder"


def test_source_resolver_finds_zip_source_only(monkeypatch) -> None:
    """If only an intake zip exists, the result is `zip_source`."""
    # Force the examples lookup to miss for a slug known to have an intake zip.
    import studio_mcp.zip_verify.source_resolver as sr

    real_result = resolve_source("corpworld")
    assert real_result["intake_dir"] is not None  # sanity

    monkeypatch.setattr(sr, "_find_examples_dir", lambda _slug: None)
    result = resolve_source("corpworld")
    assert result["source_type"] == SourceType.ZIP_SOURCE
    assert result["intake_dir"] == INTAKE_DIR / "corpworld"
    assert result["examples_dir"] is None
