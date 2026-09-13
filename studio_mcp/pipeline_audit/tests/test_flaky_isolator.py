"""Tests for flaky_isolator.py: a real passing test in this repo, and a
synthetic test that always fails (so the check does not depend on some repo
test happening to be broken)."""

from pathlib import Path

from studio_mcp.pipeline_audit.flaky_isolator import isolate_failures

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_flaky_isolator_classifies_real_flaky_test() -> None:
    result = isolate_failures(
        ["tests/test_shoal.py::test_breed_thresholds_read_from_data"],
        cwd=REPO_ROOT,
        timeout=120.0,
    )

    assert "tests/test_shoal.py::test_breed_thresholds_read_from_data" in result["flaky"]
    assert "tests/test_shoal.py::test_breed_thresholds_read_from_data" not in result["real"]
    assert result["not_run"] == []


def test_flaky_isolator_classifies_real_failure_as_real(tmp_path: Path) -> None:
    failing = tmp_path / "test_always_fails.py"
    failing.write_text("def test_always_fails():\n    assert False\n", encoding="utf-8")
    test_id = f"{failing.as_posix()}::test_always_fails"

    # Run from the repo so `uv run pytest` uses the project environment.
    result = isolate_failures([test_id], cwd=REPO_ROOT, timeout=60.0)

    assert test_id in result["real"]
    assert result["flaky"] == []
    assert result["not_run"] == []
