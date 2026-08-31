"""Tests for flaky_isolator.py using real currently-flaky and genuinely
failing tests in this repo."""

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


def test_flaky_isolator_classifies_real_failure_as_real() -> None:
    result = isolate_failures(
        ["tests/test_chimera_wilds.py::test_data_yaml_parts_match_mbb_source_values"],
        cwd=REPO_ROOT,
        timeout=60.0,
    )

    assert (
        "tests/test_chimera_wilds.py::test_data_yaml_parts_match_mbb_source_values"
        in result["real"]
    )
    assert result["flaky"] == []
    assert result["not_run"] == []
