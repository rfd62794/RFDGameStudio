"""Studio side of itch.io publishing: the registry at publishing/games.yaml and
the post-publish hook that records a release in game-metadata.json."""

import json
import os
import time
from unittest.mock import MagicMock, patch

import yaml

from studio_mcp.publishing import GAMES_CONFIG_PATH, mark_itch_published, publish_to_itch

BUTLER_RUN = "itch_publisher.itchio.subprocess.run"


def _write_metadata(path, stage="ai_studio"):
    path.write_text(
        json.dumps({"demo": {"pipeline_stage": stage, "deployed_version": ""}}),
        encoding="utf-8",
    )


def _read_entry(path):
    return json.loads(path.read_text(encoding="utf-8"))["demo"]


def _project(tmp_path):
    """Registry with one game whose build is newer than its source."""
    build = tmp_path / "dist-demo"
    source = tmp_path / "src"
    build.mkdir()
    source.mkdir()
    (build / "index.html").write_text("built", encoding="utf-8")
    (source / "VERSION").write_text("1.4.0", encoding="utf-8")
    now = time.time()
    os.utime(build / "index.html", (now, now))
    os.utime(source / "VERSION", (now - 10, now - 10))
    config = tmp_path / "games.yaml"
    config.write_text(
        yaml.safe_dump({"games": {"demo": {
            "itchio_slug": "user/demo",
            "channel": "html5",
            "build_dir": "dist-demo",
            "source_dir": "src",
            "version_file": "src/VERSION",
        }}}),
        encoding="utf-8",
    )
    return config


def test_mark_itch_published_records_stage_and_version(tmp_path):
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata)
    mark_itch_published("demo", "2.0.0", metadata_path=metadata)
    entry = _read_entry(metadata)
    assert entry["pipeline_stage"] == "itch_published"
    assert entry["deployed_version"] == "2.0.0"


def test_mark_itch_published_without_version_keeps_deployed_version(tmp_path):
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata)
    mark_itch_published("demo", None, metadata_path=metadata)
    entry = _read_entry(metadata)
    assert entry["pipeline_stage"] == "itch_published"
    assert entry["deployed_version"] == ""


def test_publish_to_itch_success_marks_published(tmp_path):
    config = _project(tmp_path)
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata)
    with patch("studio_mcp.publishing.check_butler", return_value=True), patch(BUTLER_RUN) as run:
        run.return_value = MagicMock(returncode=0, stdout="ok", stderr="")
        assert publish_to_itch("demo", dry_run=False, config_path=config, metadata_path=metadata)
    entry = _read_entry(metadata)
    assert entry["pipeline_stage"] == "itch_published"
    assert entry["deployed_version"] == "1.4.0"


def test_publish_to_itch_failure_leaves_metadata(tmp_path):
    config = _project(tmp_path)
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata)
    with patch("studio_mcp.publishing.check_butler", return_value=True), patch(BUTLER_RUN) as run:
        run.return_value = MagicMock(returncode=1, stdout="", stderr="upload failed")
        assert not publish_to_itch("demo", dry_run=False, config_path=config, metadata_path=metadata)
    assert _read_entry(metadata)["pipeline_stage"] == "ai_studio"


def test_publish_to_itch_dry_run_leaves_metadata(tmp_path):
    config = _project(tmp_path)
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata)
    with patch(BUTLER_RUN) as run:
        assert publish_to_itch("demo", dry_run=True, config_path=config, metadata_path=metadata)
        run.assert_not_called()
    assert _read_entry(metadata)["pipeline_stage"] == "ai_studio"


def test_publish_to_itch_requires_butler_for_real_push(tmp_path):
    config = _project(tmp_path)
    with patch("studio_mcp.publishing.check_butler", return_value=False), patch(BUTLER_RUN) as run:
        assert not publish_to_itch("demo", dry_run=False, config_path=config)
        run.assert_not_called()


def test_studio_registry_entries_are_complete():
    games = yaml.safe_load(GAMES_CONFIG_PATH.read_text(encoding="utf-8"))["games"]
    assert games
    for name, entry in games.items():
        for key in ("itchio_slug", "channel", "build_dir"):
            assert entry.get(key), f"{name} is missing {key}"
    # Registry keys match game-metadata.json game_ids, so no alias table is needed.
    assert "voiddrift" in games
    assert "voidrift" not in games
