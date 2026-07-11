"""test_intake.py — Tests for the AI Studio intake pipeline.

Tests call the intake logic directly and through the MCP tool wrapper.
"""

from __future__ import annotations

import zipfile
from pathlib import Path

import pytest

from studio_mcp.intake import bump_version, content_hash, process_intake
from studio_mcp.tools import studio_process_intake


def _make_zip(path: Path, arcname: str, data: bytes, date_time: tuple | None = None) -> None:
    """Write a zip containing one or more files."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w") as zf:
        if date_time is None:
            zf.writestr(arcname, data)
        else:
            info = zipfile.ZipInfo(filename=arcname, date_time=date_time)
            zf.writestr(info, data)


@pytest.fixture
def intake_concept(tmp_path, monkeypatch):
    """Patch the intake root to a temp directory and provide the concept path."""
    monkeypatch.setattr("studio_mcp.intake.REPO_ROOT", tmp_path)
    concept_dir = tmp_path / "intake" / "testconcept"
    concept_dir.mkdir(parents=True, exist_ok=True)
    return concept_dir


# ---------------------------------------------------------------------------
# Content hashing
# ---------------------------------------------------------------------------


def test_content_hash_ignores_zip_metadata_timestamps(tmp_path) -> None:
    """Two zips with identical extracted contents but different zip timestamps hash the same."""
    zip1 = tmp_path / "a.zip"
    zip2 = tmp_path / "b.zip"
    _make_zip(zip1, "main.txt", b"alpha", date_time=(2026, 1, 1, 0, 0, 0))
    _make_zip(zip2, "main.txt", b"alpha", date_time=(2026, 7, 11, 12, 0, 0))
    assert content_hash(zip1) == content_hash(zip2)


def test_content_hash_differs_with_different_content(tmp_path) -> None:
    """Different extracted content produces a different hash."""
    zip1 = tmp_path / "a.zip"
    zip2 = tmp_path / "b.zip"
    _make_zip(zip1, "main.txt", b"alpha")
    _make_zip(zip2, "main.txt", b"beta")
    assert content_hash(zip1) != content_hash(zip2)


# ---------------------------------------------------------------------------
# Version bumping
# ---------------------------------------------------------------------------


def test_bump_version_first_zip_is_initial_version() -> None:
    assert bump_version(None, None) == "0.1.0R1"


def test_bump_version_default_increments_revision() -> None:
    assert bump_version("0.1.0R1", None) == "0.1.0R2"


def test_bump_version_patch_resets_revision() -> None:
    assert bump_version("0.1.0R2", "patch") == "0.1.1R1"


def test_bump_version_minor_resets_patch_and_revision() -> None:
    assert bump_version("0.2.1R5", "minor") == "0.3.0R1"


def test_bump_version_major_resets_all() -> None:
    assert bump_version("2.3.4R5", "major") == "3.0.0R1"


def test_bump_version_invalid_bump_raises() -> None:
    with pytest.raises(ValueError, match="Invalid bump"):
        bump_version("0.1.0R1", "hotfix")


# ---------------------------------------------------------------------------
# process_intake
# ---------------------------------------------------------------------------


def test_process_intake_creates_first_version(intake_concept: Path) -> None:
    _make_zip(intake_concept / "drop1.zip", "main.txt", b"alpha")
    result = process_intake("testconcept")
    assert result["current_version"] == "0.1.0R1"
    assert len(result["processed"]) == 1
    assert result["processed"][0]["version"] == "0.1.0R1"
    assert (intake_concept / "testconcept_v0.1.0R1.zip").exists()


def test_process_intake_flags_duplicate_of_current_version(intake_concept: Path) -> None:
    _make_zip(intake_concept / "drop1.zip", "main.txt", b"alpha")
    process_intake("testconcept")

    _make_zip(intake_concept / "drop1_again.zip", "main.txt", b"alpha")
    result = process_intake("testconcept")
    assert result["current_version"] == "0.1.0R1"
    assert len(result["duplicates"]) == 1
    assert len(result["processed"]) == 0
    assert (intake_concept / "drop1_again.zip.duplicate").exists()


def test_process_intake_default_bump_is_revision(intake_concept: Path) -> None:
    _make_zip(intake_concept / "drop1.zip", "main.txt", b"alpha")
    process_intake("testconcept")
    _make_zip(intake_concept / "drop2.zip", "main.txt", b"beta")
    result = process_intake("testconcept")
    assert result["current_version"] == "0.1.0R2"


def test_process_intake_minor_bump_resets_patch_and_revision(intake_concept: Path) -> None:
    _make_zip(intake_concept / "drop1.zip", "main.txt", b"alpha")
    process_intake("testconcept")
    _make_zip(intake_concept / "drop2.zip", "main.txt", b"beta")
    result = process_intake("testconcept", bump="minor")
    assert result["current_version"] == "0.2.0R1"


def test_process_intake_patch_bump_resets_revision(intake_concept: Path) -> None:
    _make_zip(intake_concept / "drop1.zip", "main.txt", b"alpha")
    process_intake("testconcept")
    _make_zip(intake_concept / "drop2.zip", "main.txt", b"beta")
    result = process_intake("testconcept", bump="patch")
    assert result["current_version"] == "0.1.1R1"


def test_process_intake_major_bump_resets_all(intake_concept: Path) -> None:
    _make_zip(intake_concept / "drop1.zip", "main.txt", b"alpha")
    process_intake("testconcept")
    _make_zip(intake_concept / "drop2.zip", "main.txt", b"beta")
    result = process_intake("testconcept", bump="major")
    assert result["current_version"] == "1.0.0R1"


def test_process_intake_note_in_manifest(intake_concept: Path) -> None:
    _make_zip(intake_concept / "drop1.zip", "main.txt", b"alpha")
    process_intake("testconcept")
    _make_zip(intake_concept / "drop2.zip", "main.txt", b"beta")
    result = process_intake("testconcept", note="landmark AI Studio export")
    assert result["processed"][0]["note"] == "landmark AI Studio export"
    manifest = (intake_concept / "MANIFEST.md").read_text(encoding="utf-8")
    assert "Current version: 0.1.0R2" in manifest
    assert "landmark AI Studio export" in manifest


def test_process_intake_preserves_existing_status(intake_concept: Path) -> None:
    """The intake tool never overwrites the hand-set Status field."""
    manifest = intake_concept / "MANIFEST.md"
    manifest.write_text(
        "# Testconcept — Intake History\n\n"
        "Current version: 0.1.0R1\n"
        "Status: ready-to-port\n\n"
        "## Version History\n\n"
        "### 0.1.0R1 — 2026-07-11T10:00:00\n"
        "- Hash: abcd\n"
        "- Source file: testconcept_v0.1.0R1.zip\n",
        encoding="utf-8",
    )
    _make_zip(intake_concept / "drop2.zip", "main.txt", b"beta")
    process_intake("testconcept")
    updated = manifest.read_text(encoding="utf-8")
    assert "Status: ready-to-port" in updated


# ---------------------------------------------------------------------------
# Tool wrapper
# ---------------------------------------------------------------------------


def test_studio_process_intake_returns_error_for_invalid_bump(intake_concept: Path) -> None:
    result = studio_process_intake("testconcept", bump="invalid")
    assert "error" in result
    assert result["tool"] == "studio_process_intake"
