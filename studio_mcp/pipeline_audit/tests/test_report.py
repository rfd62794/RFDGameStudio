"""Tests for report.py."""

from unittest.mock import patch

from studio_mcp.pipeline_audit.report import PipelineAuditor, _format_as_markdown


def test_format_markdown_contains_all_sections():
    sample = {
        "timestamp": "2026-08-30T00:00:00+00:00",
        "repo_state": {
            "games": [{"id": "a", "pipeline_stage": "ai_studio"}],
            "examples": ["example_a"],
            "game_count": 1,
        },
        "zip_inventory": {
            "total_exports": 1,
            "imported": 0,
            "pending": 1,
            "exports": [{"slug": "example-a", "version": "0.1.0R1", "created": "", "modified": "", "game_id": "example_a", "imported": False, "warnings": [], "path": "intake/example-a/example-a_v0.1.0R1.zip"}],
            "pending_exports": [{"slug": "example-a", "version": "0.1.0R1", "created": "", "modified": "", "game_id": "example_a", "imported": False, "warnings": [], "path": "intake/example-a/example-a_v0.1.0R1.zip"}],
        },
        "known_issues": {
            "ensure_node_modules": {"status": "fixed", "runs_npm_install": True, "returns_none_on_no_match": True, "details": "ok"},
            "cross_pipeline_version_tracking": {
                "status": "not_fixed",
                "repo_counts": {},
                "publishing_counts": {},
                "total_hits": 0,
                "details": "none",
            },
        },
        "floors": {
            "python": {"cmd": "pytest", "passed": 100, "failed": 0, "skipped": 0, "certified": True},
            "typescript": {"cmd": "vitest", "passed": 50, "failed": 0, "skipped": 0, "certified": True},
        },
    }
    md = _format_as_markdown(sample)
    assert "Pipeline Audit Report" in md
    assert "a" in md
    assert "example_a" in md
    assert "example-a" in md
    assert "100" in md
    assert "50" in md


def test_report_assembles_all_four_sources(tmp_path):
    auditor = PipelineAuditor(repo_root=tmp_path)
    with (
        patch("studio_mcp.pipeline_audit.report.read_repo_state") as mock_repo,
        patch("studio_mcp.pipeline_audit.report.read_zip_inventory") as mock_zip,
        patch("studio_mcp.pipeline_audit.report.check_known_issues") as mock_issues,
        patch("studio_mcp.pipeline_audit.report.start_test_run") as mock_start,
        patch("studio_mcp.pipeline_audit.report.collect_test_log") as mock_collect,
        patch("studio_mcp.pipeline_audit.report.parse_pytest_summary") as mock_py,
        patch("studio_mcp.pipeline_audit.report.parse_vitest_summary") as mock_ts,
    ):
        mock_repo.return_value = {"games": [{"id": "a"}], "game_count": 1, "examples": []}
        mock_zip.return_value = {"exports": [], "pending_exports": [], "total_exports": 0, "imported": 0, "pending": 0}
        mock_issues.return_value = {"ensure_node_modules": {}, "cross_pipeline_version_tracking": {}}
        mock_start.return_value = {"status": "started", "pid": 1, "log_path": str(tmp_path / "log")}
        mock_collect.return_value = ""
        mock_py.return_value = {"passed": 1, "failed": 0, "skipped": 0, "certified": True}
        mock_ts.return_value = {"passed": 2, "failed": 0, "skipped": 0, "certified": True}

        report = auditor.collect()

    assert "repo_state" in report
    assert "zip_inventory" in report
    assert "known_issues" in report
    assert "floors" in report
    assert report["floors"]["python"]["passed"] == 1
    assert report["floors"]["typescript"]["passed"] == 2
