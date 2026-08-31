"""Tests for tracked_dir_diff.py."""

import subprocess
from pathlib import Path

import pytest

from studio_mcp.zip_verify.tracked_dir_diff import diff_tracked_dir

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_tracked_dir_diff_single_commit_is_no_prior_revision() -> None:
    """Real, current `examples/facility-escape` (1 commit) returns
    `no_prior_revision: True`, not an error."""
    tracked_dir = REPO_ROOT / "examples" / "facility-escape"
    assert tracked_dir.exists()

    result = diff_tracked_dir(tracked_dir)
    assert result["no_prior_revision"] is True
    assert result["prior_path"] is None
    assert len(result["files"]) > 0
    assert result["changed_functions"] == []
    assert result["diffs"] == {}


def test_tracked_dir_diff_finds_real_diff_with_two_commits(tmp_path: Path) -> None:
    """A constructed fixture with 2 real commits on a temp path produces a
    non-empty diff and detects changed functions."""
    repo = tmp_path / "repo"
    repo.mkdir()
    source_dir = repo / "examples" / "demo"
    source_dir.mkdir(parents=True)

    # Initialize a real git repo.
    subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True)
    subprocess.run(
        ["git", "config", "user.email", "test@test.com"],
        cwd=repo, check=True, capture_output=True,
    )
    subprocess.run(
        ["git", "config", "user.name", "Test"],
        cwd=repo, check=True, capture_output=True,
    )

    # First commit.
    (source_dir / "main.ts").write_text("function main() { return 1; }", encoding="utf-8")
    subprocess.run(["git", "add", "."], cwd=repo, check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "first"], cwd=repo, check=True, capture_output=True)

    # Second commit: change and add a function.
    (source_dir / "main.ts").write_text(
        "function main() { return 2; }\nfunction helper() { return 3; }", encoding="utf-8"
    )
    subprocess.run(["git", "add", "."], cwd=repo, check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "second"], cwd=repo, check=True, capture_output=True)

    # tracked_dir_diff expects to be run from inside a real repo whose root
    # contains the tracked path. Point REPO_ROOT by monkeypatching.
    import studio_mcp.zip_verify.tracked_dir_diff as tdd

    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(tdd, "REPO_ROOT", repo)
    try:
        result = diff_tracked_dir(source_dir)
    finally:
        monkeypatch.undo()

    assert result["no_prior_revision"] is False
    assert result["prior_path"] is not None
    assert "main.ts" in result["diffs"]
    assert "helper" in result["changed_functions"]
