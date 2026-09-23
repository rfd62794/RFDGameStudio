"""Tests for tracked_dir_diff.py."""

import subprocess
from pathlib import Path

import pytest

from studio_mcp.zip_verify.tracked_dir_diff import diff_tracked_dir
from tests._git_env import isolated_git_env

REPO_ROOT = Path(__file__).resolve().parents[3]


def _make_two_commit_repo(repo: Path) -> Path:
    """Build a scratch repo whose examples/demo dir has two real commits.

    Every git call runs under isolated_git_env so an inherited GIT_DIR (or
    any other GIT_* var) can never redirect them at a real repository, and
    identity comes from GIT_AUTHOR_*/GIT_COMMITTER_* instead of `git config`
    so no git config file is ever written.
    """
    source_dir = repo / "examples" / "demo"
    source_dir.mkdir(parents=True)
    env = isolated_git_env(repo)

    # Initialize a real git repo.
    subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True, env=env)

    # First commit.
    (source_dir / "main.ts").write_text("function main() { return 1; }", encoding="utf-8")
    subprocess.run(["git", "add", "."], cwd=repo, check=True, capture_output=True, env=env)
    subprocess.run(["git", "commit", "-m", "first"], cwd=repo, check=True, capture_output=True, env=env)

    # Second commit: change and add a function.
    (source_dir / "main.ts").write_text(
        "function main() { return 2; }\nfunction helper() { return 3; }", encoding="utf-8"
    )
    subprocess.run(["git", "add", "."], cwd=repo, check=True, capture_output=True, env=env)
    subprocess.run(["git", "commit", "-m", "second"], cwd=repo, check=True, capture_output=True, env=env)
    return source_dir


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
    source_dir = _make_two_commit_repo(repo)

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


def test_fixture_helper_never_touches_repo_named_by_git_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """PR #10 incident: a git hook exports GIT_DIR into the environment, and
    fixture git calls that inherit it commit onto the real repo and rewrite
    its config. The fixture helper must isolate its env so a stray GIT_DIR
    cannot redirect a single git call at the wrong repository."""
    victim = tmp_path / "victim"
    victim.mkdir()
    victim_env = isolated_git_env(victim)
    subprocess.run(
        ["git", "init"], cwd=victim, check=True, capture_output=True, env=victim_env
    )
    config_before = (victim / ".git" / "config").read_bytes()

    monkeypatch.setenv("GIT_DIR", str(victim / ".git"))
    _make_two_commit_repo(tmp_path / "repo")

    head = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=victim, capture_output=True, env=victim_env
    )
    assert head.returncode != 0, "GIT_DIR-named repo gained fixture commits"
    assert (victim / ".git" / "config").read_bytes() == config_before
