"""Regression: a standalone build must never be overwritten by an example dist.

<!-- new: tests/test_deploy_arcade_copy_order.py -->

/arcade/slimeworld/ served the SlimeGarden example build because the
example-demo copy loop ran after the standalone copy and overwrote it.
These tests pin the ordering: a standalone build wins, a demo with only an
examples/ dist is still copied, and a registered demo with neither fails
loudly. Fakes are modeled on test_studio_mcp.py's
test_deploy_arcade_copies_files_when_dist_exists.
"""
from unittest.mock import MagicMock, patch

import studio_mcp.tools as tools
from studio_mcp.tools import studio_deploy_arcade


def _fake_repo(tmp_path, monkeypatch, demos, static_names):
    """Fake repo root (via tools.__file__) + fake site repo, with the demo
    lists stubbed so nothing here needs Node or the real registry export."""
    fake_module_dir = tmp_path / "fake_module"
    fake_module_dir.mkdir()
    dist_dir = tmp_path / "ts" / "dist"
    dist_dir.mkdir(parents=True)
    (dist_dir / "index.html").write_text("<h1>Game</h1>", encoding="utf-8")

    site_repo = tmp_path / "site"
    site_repo.mkdir()
    monkeypatch.setattr(tools, "__file__", str(fake_module_dir / "tools.py"))
    monkeypatch.setattr(tools, "_SITE_REPO_PATH", site_repo)
    monkeypatch.setattr(tools, "_example_demos", lambda: demos)
    monkeypatch.setattr(tools, "_demo_static_names", lambda: static_names)
    monkeypatch.setattr(tools, "_external_demo_paths", lambda: {})
    monkeypatch.setattr(tools, "write_game_metadata", lambda: None)
    monkeypatch.setattr(tools, "verify_arcade_deploy", lambda: {"ok": True, "games": {}})
    monkeypatch.setattr(tools, "_prepare_site_arcade", lambda: {"ok": True, "steps": []})
    # Keep the post-deploy pipeline bookkeeping off git and the real registry.
    monkeypatch.setattr(tools, "game_paths", lambda: {})
    monkeypatch.setattr(tools, "external_repos", lambda: {})
    return site_repo


def _run_deploy() -> dict:
    mock_build = MagicMock(returncode=0, stdout="", stderr="")
    mock_deploy = MagicMock(returncode=0, stdout="ok")
    with patch("subprocess.run", side_effect=[mock_build, mock_deploy]):
        return studio_deploy_arcade()


def test_standalone_build_is_not_overwritten_by_example_dist(tmp_path, monkeypatch) -> None:
    """A demo with BOTH a ts/dist-<id>/ standalone build and an examples/ dist
    keeps the standalone build and is reported as skipped."""
    site_repo = _fake_repo(tmp_path, monkeypatch, ["alpha"], {"alpha": "alpha"})
    standalone_dist = tmp_path / "ts" / "dist-alpha"
    standalone_dist.mkdir()
    (standalone_dist / "index.html").write_text("STANDALONE", encoding="utf-8")
    example_dist = tmp_path / "examples" / "alpha" / "dist"
    example_dist.mkdir(parents=True)
    (example_dist / "index.html").write_text("EXAMPLE", encoding="utf-8")

    result = _run_deploy()

    assert "error" not in result
    copied = site_repo / "static" / "arcade" / "alpha" / "index.html"
    assert copied.read_text(encoding="utf-8") == "STANDALONE"
    assert "alpha" in result["skipped_example_demos"]


def test_example_only_demo_is_still_copied(tmp_path, monkeypatch) -> None:
    site_repo = _fake_repo(tmp_path, monkeypatch, ["beta"], {"beta": "beta"})
    example_dist = tmp_path / "examples" / "beta" / "dist"
    example_dist.mkdir(parents=True)
    (example_dist / "index.html").write_text("EXAMPLE-BETA", encoding="utf-8")

    result = _run_deploy()

    assert "error" not in result
    copied = site_repo / "static" / "arcade" / "beta" / "index.html"
    assert copied.read_text(encoding="utf-8") == "EXAMPLE-BETA"
    assert result["skipped_example_demos"] == []


def test_demo_with_neither_dist_fails_loudly(tmp_path, monkeypatch) -> None:
    _fake_repo(tmp_path, monkeypatch, ["gamma"], {"gamma": "gamma"})

    result = _run_deploy()

    assert "gamma" in result["error"]
    assert result["tool"] == "studio_deploy_arcade"


def test_demos_needing_example_copy_filters_on_static_name() -> None:
    assert tools._demos_needing_example_copy(
        ["alpha", "beta", "gamma"],
        {"alpha": "alpha", "beta": "beta", "gamma": "gamma_static"},
        {"alpha", "gamma_static"},
    ) == ["beta"]
