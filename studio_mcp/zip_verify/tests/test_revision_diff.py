"""Tests for revision_diff.py against real intake fixtures."""

from pathlib import Path
from zipfile import ZipFile

import pytest

from studio_mcp.zip_verify.revision_diff import diff_revision, find_prior_revision

INTAKE_DIR = Path(__file__).resolve().parents[3] / "intake"


def test_revision_diff_handles_single_revision():
    zip_path = INTAKE_DIR / "antsim-redux" / "antsim-redux_v0.1.0R1.zip"
    assert zip_path.exists()
    result = diff_revision(zip_path)
    assert result["no_prior_revision"] is True
    assert result["prior_path"] is None
    assert "simulation" in str(result["files"])


def test_find_prior_revision_for_corpworld():
    r5 = INTAKE_DIR / "corpworld" / "corpworld_v0.1.0R5.zip"
    assert r5.exists()
    prior = find_prior_revision(r5)
    assert prior is not None
    assert "corpworld_v0.1.0R" in prior.name


def test_revision_diff_finds_real_diff_across_revisions():
    r5 = INTAKE_DIR / "corpworld" / "corpworld_v0.1.0R5.zip"
    result = diff_revision(r5)
    assert result["no_prior_revision"] is False
    assert result["prior_path"] is not None
    assert len(result["diffs"]) > 0


def test_revision_diff_no_prior_for_single_fake_zip(tmp_path: Path):
    zip_path = tmp_path / "demo_v0.1.0R1.zip"
    with ZipFile(zip_path, "w") as zf:
        zf.writestr("src/main.ts", "function main() { return 1; }")
    result = diff_revision(zip_path)
    assert result["no_prior_revision"] is True


def test_revision_diff_detects_changed_function(tmp_path: Path):
    dir1 = tmp_path / "a"
    dir2 = tmp_path / "b"
    dir1.mkdir()
    dir2.mkdir()

    z1 = tmp_path / "demo_v0.1.0R1.zip"
    z2 = tmp_path / "demo_v0.1.0R2.zip"
    with ZipFile(z1, "w") as zf:
        zf.writestr("src/main.ts", "function main() { return 1; }")
    with ZipFile(z2, "w") as zf:
        zf.writestr("src/main.ts", "function main() { return 2; }\nfunction newFn() {}")

    result = diff_revision(z2, prior_path=z1)
    assert result["no_prior_revision"] is False
    assert "src/main.ts" in result["diffs"]
    assert "newFn" in result["changed_functions"]
