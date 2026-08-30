"""Tests for floor_runner.py."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from studio_mcp.pipeline_audit.floor_runner import (
    collect_test_log,
    parse_pytest_summary,
    parse_vitest_summary,
    start_test_run,
)


def test_parse_pytest_summary_with_failed_and_skipped():
    text = "\n==== 123 passed, 4 failed, 2 skipped in 45.67s ====\n"
    result = parse_pytest_summary(text)
    assert result == {"passed": 123, "failed": 4, "skipped": 2, "error": 0, "certified": False}


def test_parse_pytest_summary_with_deselected():
    text = "\n==== 588 passed, 1 failed, 31 deselected, 8 warnings in 123.26s ====\n"
    result = parse_pytest_summary(text)
    assert result["passed"] == 588
    assert result["failed"] == 1
    assert result["skipped"] == 0
    assert result["certified"] is False


def test_parse_pytest_summary_clean():
    text = "\n==== 563 passed in 12.34s ====\n"
    result = parse_pytest_summary(text)
    assert result == {"passed": 563, "failed": 0, "skipped": 0, "error": 0, "certified": True}


def test_parse_pytest_summary_empty():
    result = parse_pytest_summary("")
    assert result == {"passed": 0, "failed": 0, "skipped": 0, "error": 0, "certified": False}


def test_parse_vitest_summary_with_failures():
    text = (
        " Test Files  2 failed | 132 passed (134)\n"
        "      Tests  2 failed | 1644 passed (1646)\n"
    )
    result = parse_vitest_summary(text)
    assert result["passed"] == 1644
    assert result["failed"] == 2
    assert result["skipped"] == 0
    assert result["certified"] is False


def test_parse_vitest_summary_with_skipped():
    text = (
        " Test Files  1 passed (1)\n"
        "      Tests  10 passed | 3 skipped (13)\n"
    )
    result = parse_vitest_summary(text)
    assert result["passed"] == 10
    assert result["failed"] == 0
    assert result["skipped"] == 3
    assert result["certified"] is False


def test_parse_vitest_summary_clean():
    text = (
        " Test Files  132 passed (132)\n"
        "      Tests  1644 passed (1644)\n"
    )
    result = parse_vitest_summary(text)
    assert result["certified"] is True


def test_floor_runner_flags_nonzero_failed_or_skipped():
    assert parse_pytest_summary("==== 1 passed, 1 failed ====")["certified"] is False
    assert parse_pytest_summary("==== 1 passed, 1 skipped ====")["certified"] is False
    assert parse_vitest_summary("Tests 1 failed | 1 passed")["certified"] is False
    assert parse_vitest_summary("Tests 1 skipped | 1 passed")["certified"] is False


def test_collect_test_log_returns_empty_for_missing_path():
    assert collect_test_log(None, None, timeout=0.0) == ""
    assert collect_test_log("/does/not/exist.log", None, timeout=0.0) == ""


def test_start_test_run_uses_popen_and_writes_files(tmp_path: Path):
    repo = tmp_path / "repo"
    repo.mkdir()
    state_dir = repo / "docs" / "state"
    mock_proc = MagicMock()
    mock_proc.pid = 12345

    with patch("studio_mcp.pipeline_audit.floor_runner.subprocess.Popen", return_value=mock_proc) as popen:
        result = start_test_run(repo, "echo hello", "test.log", "test.pid")

    assert result["status"] == "started"
    assert result["pid"] == 12345
    assert (state_dir / "test.log").exists()
    assert (state_dir / "test.pid").read_text(encoding="utf-8") == "12345"
    popen.assert_called_once()
    assert popen.call_args.kwargs["shell"] is True


def test_start_test_run_returns_error_on_exception(tmp_path: Path):
    repo = tmp_path / "repo"
    repo.mkdir()
    with patch("studio_mcp.pipeline_audit.floor_runner.subprocess.Popen", side_effect=OSError("boom")):
        result = start_test_run(repo, "echo hello", "test.log", "test.pid")
    assert result["status"] == "error"
    assert "boom" in result["reason"]
