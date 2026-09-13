"""Tests for itch_publisher: registry loading, butler push, publish hook, CLI, report."""

import json
import os
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from click.testing import CliRunner

from itch_publisher import check_butler, load_game_config, push, resolve_config_path
from itch_publisher.cli import cli
from itch_publisher.config import CONFIG_ENV_VAR
from itch_publisher.itchio import _is_dist_stale
from itch_publisher.report import build_report, format_markdown

FIXTURE_CONFIG = Path(__file__).parent / "fixtures" / "games.yaml"
BUTLER_RUN = "itch_publisher.itchio.subprocess.run"


def _utime(path, mtime):
    os.utime(path, times=(mtime, mtime))


def _ok():
    return MagicMock(returncode=0, stdout="ok", stderr="")


@pytest.fixture
def project(tmp_path):
    """Registry with one game ('demo') whose build is newer than its source."""
    build = tmp_path / "builds" / "dist-demo"
    source = tmp_path / "src" / "demo"
    build.mkdir(parents=True)
    source.mkdir(parents=True)
    (build / "index.html").write_text("built", encoding="utf-8")
    (source / "main.ts").write_text("source", encoding="utf-8")
    (source / "VERSION").write_text("2.31.0", encoding="utf-8")
    now = time.time()
    _utime(build / "index.html", now)
    _utime(source / "main.ts", now - 10)
    _utime(source / "VERSION", now - 10)
    config = tmp_path / "games.yaml"
    config.write_text(
        "games:\n"
        "  demo:\n"
        "    itchio_slug: user/demo\n"
        "    channel: html5\n"
        "    build_dir: builds/dist-demo\n"
        "    source_dir: src/demo\n"
        "    version_file: src/demo/VERSION\n",
        encoding="utf-8",
    )
    return config


# --- Registry -----------------------------------------------------------------

def test_load_game_config_resolves_relative_paths():
    config = load_game_config("shoal", FIXTURE_CONFIG)
    assert config["itchio_slug"] == "rdug627/shoal"
    assert config["channel"] == "html5"
    assert Path(config["build_dir"]) == (FIXTURE_CONFIG.parent / "builds" / "dist-shoal").resolve()


def test_load_game_config_keeps_absolute_paths(tmp_path):
    absolute = (tmp_path / "elsewhere" / "pkg").resolve()
    config = tmp_path / "games.yaml"
    config.write_text(
        f"games:\n  demo:\n    itchio_slug: u/demo\n    channel: html5\n    build_dir: '{absolute}'\n",
        encoding="utf-8",
    )
    assert Path(load_game_config("demo", config)["build_dir"]) == absolute


def test_load_game_config_unknown_game():
    with pytest.raises(KeyError):
        load_game_config("nonexistent_game", FIXTURE_CONFIG)


def test_resolve_config_path_order(tmp_path, monkeypatch):
    monkeypatch.setenv(CONFIG_ENV_VAR, str(tmp_path / "from-env.yaml"))
    assert resolve_config_path(tmp_path / "explicit.yaml") == tmp_path / "explicit.yaml"
    assert resolve_config_path() == tmp_path / "from-env.yaml"
    monkeypatch.delenv(CONFIG_ENV_VAR)
    monkeypatch.chdir(tmp_path)
    assert resolve_config_path().resolve() == (tmp_path / "games.yaml").resolve()


# --- Butler push --------------------------------------------------------------

@patch(BUTLER_RUN, side_effect=FileNotFoundError())
def test_check_butler_missing(_run):
    assert check_butler() is False


def test_push_dry_run_does_not_execute_or_notify(project):
    hook = MagicMock()
    with patch(BUTLER_RUN) as run:
        assert push("demo", config_path=project, dry_run=True, on_published=hook)
        run.assert_not_called()
    hook.assert_not_called()


def test_push_success_passes_userversion_and_calls_hook(project):
    hook = MagicMock()
    with patch(BUTLER_RUN, return_value=_ok()) as run:
        assert push("demo", config_path=project, on_published=hook)
    command = run.call_args[0][0]
    assert command[:2] == ["butler", "push"]
    assert "user/demo:html5" in command
    assert command[-2:] == ["--userversion", "2.31.0"]
    hook.assert_called_once_with("demo", "2.31.0")


def test_push_failure_does_not_call_hook(project):
    hook = MagicMock()
    with patch(BUTLER_RUN, return_value=MagicMock(returncode=1, stdout="", stderr="upload failed")):
        assert not push("demo", config_path=project, on_published=hook)
    hook.assert_not_called()


def test_hook_error_does_not_fail_completed_push(project, capsys):
    def broken_hook(name, version):
        raise RuntimeError("metadata locked")

    with patch(BUTLER_RUN, return_value=_ok()):
        assert push("demo", config_path=project, on_published=broken_hook)
    assert "post-publish hook failed" in capsys.readouterr().out


def test_push_refuses_stale_build(project):
    _utime(project.parent / "src" / "demo" / "main.ts", time.time() + 60)
    hook = MagicMock()
    with patch(BUTLER_RUN) as run:
        assert not push("demo", config_path=project, on_published=hook)
        run.assert_not_called()
    hook.assert_not_called()


def test_push_unknown_game(project):
    assert not push("missing", config_path=project)


def test_is_dist_stale(tmp_path):
    dist_dir = tmp_path / "dist"
    source_dir = tmp_path / "src"
    dist_dir.mkdir()
    source_dir.mkdir()
    (dist_dir / "a.txt").write_text("a", encoding="utf-8")
    (source_dir / "b.txt").write_text("b", encoding="utf-8")
    now = time.time()
    _utime(dist_dir / "a.txt", now - 10)
    _utime(source_dir / "b.txt", now)
    assert _is_dist_stale(dist_dir, source_dir) is True
    _utime(dist_dir / "a.txt", now + 10)
    assert _is_dist_stale(dist_dir, source_dir) is False
    assert _is_dist_stale(tmp_path / "missing", source_dir) is True


# --- CLI ----------------------------------------------------------------------

def test_cli_list(project):
    result = CliRunner().invoke(cli, ["--config", str(project), "list"])
    assert result.exit_code == 0
    assert "demo" in result.output


def test_cli_list_missing_config(tmp_path):
    result = CliRunner().invoke(cli, ["--config", str(tmp_path / "nope.yaml"), "list"])
    assert result.exit_code == 1
    assert "Cannot read" in result.output


def test_cli_deploy_dry_run(project):
    with patch("itch_publisher.cli.check_butler", return_value=True), patch(BUTLER_RUN) as run:
        result = CliRunner().invoke(cli, ["--config", str(project), "deploy", "demo", "--dry-run"])
        run.assert_not_called()
    assert result.exit_code == 0
    assert "Would execute: butler push" in result.output


def test_cli_deploy_unknown_target(project):
    result = CliRunner().invoke(cli, ["--config", str(project), "deploy", "demo", "--target", "steam"])
    assert result.exit_code == 1
    assert "Unknown target" in result.output


# --- Report -------------------------------------------------------------------

def test_report_marks_consistent_versions(project, tmp_path):
    metadata = tmp_path / "metadata.json"
    metadata.write_text(json.dumps({"demo": {"deployed_version": "2.31.0"}}), encoding="utf-8")
    report = build_report(project, metadata, butler_status=lambda slug, channel: {"ok": True, "version": "2.31.0"})
    (row,) = report["games"]
    assert row["source_version"] == "2.31.0"
    assert row["consistent"] is True
    assert "| demo | 2.31.0 | 2.31.0 | 2.31.0 | True |" in format_markdown(report)


def test_report_records_butler_errors(project):
    report = build_report(project, None, butler_status=lambda slug, channel: {"ok": False, "error": "not logged in"})
    assert report["errors"] == ["demo: not logged in"]
    assert report["games"][0]["consistent"] is False
