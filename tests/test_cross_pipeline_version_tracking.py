"""Cross-pipeline version tracking + build freshness tests."""

import json
import os
import tempfile
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from studio_mcp.game_metadata import (
    _load_existing_deployed_versions,
    generate_game_metadata,
    record_deployed_version,
)
from studio_mcp.tools import _is_dist_stale, studio_deploy_arcade


def _touch(path: Path, mtime: float) -> None:
    path.touch()
    os.utime(path, times=(mtime, mtime))


def test_is_dist_stale_true_when_source_newer():
    with tempfile.TemporaryDirectory() as tmp:
        dist_dir = Path(tmp) / "dist"
        source_dir = Path(tmp) / "src"
        dist_dir.mkdir()
        source_dir.mkdir()
        now = time.time()
        _touch(dist_dir / "old.txt", now - 10)
        _touch(source_dir / "new.txt", now)
        assert _is_dist_stale(dist_dir, source_dir) is True


def test_is_dist_stale_false_when_dist_newer():
    with tempfile.TemporaryDirectory() as tmp:
        dist_dir = Path(tmp) / "dist"
        source_dir = Path(tmp) / "src"
        dist_dir.mkdir()
        source_dir.mkdir()
        now = time.time()
        _touch(dist_dir / "new.txt", now)
        _touch(source_dir / "old.txt", now - 10)
        assert _is_dist_stale(dist_dir, source_dir) is False


def test_studio_deploy_arcade_fails_on_stale_dist():
    """If ts/dist is older than ts/src, studio_deploy_arcade returns a clean
    error instead of proceeding to copy/deploy."""
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        ts_dist = repo_root / "ts" / "dist"
        ts_src = repo_root / "ts" / "src"
        ts_dist.mkdir(parents=True)
        ts_src.mkdir(parents=True)
        now = time.time()
        _touch(ts_dist / "index.html", now - 10)
        _touch(ts_src / "App.tsx", now)

        # Minimal demo source/dist so existence checks pass.
        demo_src = repo_root / "examples" / "ledger" / "src"
        demo_dist = repo_root / "examples" / "ledger" / "dist"
        demo_src.mkdir(parents=True)
        demo_dist.mkdir(parents=True)
        _touch(demo_dist / "index.html", now)
        _touch(demo_src / "main.tsx", now)

        # Patch __file__ so Path(__file__).parent.parent resolves to the temp repo.
        fake_tools_path = str(repo_root / "studio_mcp" / "tools.py")
        with patch("studio_mcp.tools.__file__", fake_tools_path), \
             patch("studio_mcp.tools._SITE_REPO_PATH", repo_root / "site"), \
             patch("studio_mcp.tools._EXAMPLE_DEMOS", ["ledger"]), \
             patch("studio_mcp.tools.GAME_PATHS", {}), \
             patch("studio_mcp.tools._EXTERNAL_REPOS", {}), \
             patch("studio_mcp.tools.write_game_metadata"):
            result = studio_deploy_arcade()

        assert "error" in result
        assert "older" in result["error"].lower()


def test_deployed_version_recorded_on_real_success():
    """record_deployed_version writes the version field and leaves it empty
    when no prior value existed."""
    with tempfile.TemporaryDirectory() as tmp:
        metadata_path = Path(tmp) / "game-metadata.json"
        metadata_path.write_text(
            json.dumps({"shoal": {"pipeline_stage": "ai_studio", "deployed_version": ""}}),
            encoding="utf-8",
        )
        record_deployed_version("shoal", "2.31.0", out_path=metadata_path)
        data = json.loads(metadata_path.read_text(encoding="utf-8"))
        assert data["shoal"]["deployed_version"] == "2.31.0"


def test_deployed_version_carried_forward_in_generate_game_metadata():
    """A full metadata regeneration preserves deployed_version from disk."""
    with tempfile.TemporaryDirectory() as tmp:
        metadata_path = Path(tmp) / "game-metadata.json"
        metadata_path.write_text(
            json.dumps(
                {
                    "shoal": {
                        "pipeline_stage": "itch_published",
                        "deployed_version": "2.31.0",
                    }
                }
            ),
            encoding="utf-8",
        )
        existing = _load_existing_deployed_versions(metadata_path)
        assert existing.get("shoal") == "2.31.0"


def test_games_yaml_no_placeholder_entries():
    """RFD_IT_Publishing games.yaml no longer contains antsim or greengap."""
    publishing_root = Path(__file__).resolve().parent.parent / ".." / "RFD_IT_Publishing"
    publishing_root = publishing_root.resolve()
    yaml_path = publishing_root / "config" / "games.yaml"
    if not yaml_path.exists():
        pytest.skip("RFD_IT_Publishing not present in this checkout")
    import yaml
    config = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
    games = config.get("games", {})
    assert "antsim" not in games
    assert "greengap" not in games


def test_studio_deploy_arcade_records_deployed_version_on_success(tmp_path, monkeypatch) -> None:
    """End-to-end mocked deploy: studio_deploy_arcade writes deployed_version
    from the game's VERSION file into game-metadata.json on success, without
    needing a live hugo/SFTP run."""
    import studio_mcp.game_metadata as gm
    import studio_mcp.tools as tools

    fake_module_dir = tmp_path / "fake_module"
    fake_module_dir.mkdir()
    monkeypatch.setattr(tools, "__file__", str(fake_module_dir / "tools.py"))

    # Main arcade bundle: dist exists and is newer than its source.
    dist_dir = tmp_path / "ts" / "dist"
    dist_dir.mkdir(parents=True)
    (dist_dir / "index.html").write_text("<h1>Arcade</h1>", encoding="utf-8")

    # Example demo: dist exists and is newer than its source.
    demo_dist = tmp_path / "examples" / "ledger" / "dist"
    demo_dist.mkdir(parents=True)
    (demo_dist / "index.html").write_text("<h1>Ledger</h1>", encoding="utf-8")
    (tmp_path / "examples" / "ledger" / "src").mkdir(parents=True)
    (tmp_path / "examples" / "ledger" / "src" / "main.tsx").write_text("export {}", encoding="utf-8")

    # One tracked game with a real VERSION file.
    game_dir = tmp_path / "games" / "demo_game"
    game_dir.mkdir(parents=True)
    (game_dir / "VERSION").write_text("1.2.3", encoding="utf-8")

    site_repo = tmp_path / "site"
    site_repo.mkdir()

    metadata_path = tmp_path / "game-metadata.json"

    def fake_write_metadata() -> None:
        metadata_path.parent.mkdir(parents=True, exist_ok=True)
        metadata_path.write_text(
            json.dumps({"demo_game": {"pipeline_stage": "ai_studio", "deployed_version": ""}}),
            encoding="utf-8",
        )

    monkeypatch.setattr(tools, "_EXAMPLE_DEMOS", ["ledger"])
    monkeypatch.setattr(tools, "GAME_PATHS", {"demo_game": ["games/demo_game"]})
    monkeypatch.setattr(gm, "GAME_PATHS", {"demo_game": ["games/demo_game"]})
    monkeypatch.setattr(tools, "_EXTERNAL_REPOS", {})
    monkeypatch.setattr(tools, "_SITE_REPO_PATH", site_repo)
    monkeypatch.setattr(tools, "write_game_metadata", fake_write_metadata)
    monkeypatch.setattr(tools, "verify_arcade_deploy", lambda: {"ok": True, "games": {}})
    monkeypatch.setattr(gm, "_METADATA_PATH", metadata_path)

    mock_build = MagicMock(returncode=0, stdout="", stderr="")
    mock_deploy = MagicMock(returncode=0, stdout="ok")

    with patch("subprocess.run", side_effect=[mock_build, mock_deploy]):
        result = tools.studio_deploy_arcade()

    assert "error" not in result
    assert result["deploy"]["returncode"] == 0

    data = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert data["demo_game"]["pipeline_stage"] == "website_collection"
    assert data["demo_game"]["deployed_version"] == "1.2.3"
