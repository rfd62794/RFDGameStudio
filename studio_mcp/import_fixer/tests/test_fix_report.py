"""Tests for import_fixer.fix_report — §3 test anchors."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

from studio_mcp.import_fixer.fix_generator import GeneratedFix
from studio_mcp.import_fixer.fix_report import FixReport, build_fix_report
from studio_mcp.import_fixer.pattern_catalog import PatternName
from studio_mcp.import_fixer.pattern_detector import DetectionResult, MatchStatus


def test_fix_report_includes_before_after_floor_diff(tmp_path: Path) -> None:
    """Mocked full pipeline: report must contain both floor states and no
    self-certification language."""
    live_file = tmp_path / "file.ts"
    live_file.write_text("export function clampTier(v: number): number {\n  return Math.max(0, Math.min(10, Math.trunc(v)));\n}\n", encoding="utf-8")
    fixed_content = "export function clampTier(v: number): number {\n  return Math.max(0, Math.min(3, Math.trunc(v)));\n}\n"

    scratch_file = tmp_path / "scratch" / "file.ts"
    scratch_file.parent.mkdir(parents=True)
    scratch_file.write_text(fixed_content, encoding="utf-8")

    result = DetectionResult(
        status=MatchStatus.CLEAN_MATCH,
        pattern=PatternName.BOUND_MISMATCH,
        file=str(live_file).replace("\\", "/"),
        symbol="clampTier",
        line=1,
        current_min=0,
        current_max=10,
        locked_min=0,
        locked_max=3,
        reason="mismatch",
    )

    fix = GeneratedFix(
        pattern=PatternName.BOUND_MISMATCH,
        file=str(live_file).replace("\\", "/"),
        scratch_path=str(scratch_file),
        diff="--- a\n+++ b\n@@ -1 +1 @@\n-10\n+3",
        raw_response=fixed_content,
        model="deepseek/deepseek-v4-flash-0731",
    )

    # Mock diff_floor_claim to avoid running real tests.
    fake_before = {"matches": False, "real": {"passed": 10, "failed": 1, "skipped": 0}, "mismatch_detail": "before"}
    fake_after = {"matches": True, "real": {"passed": 11, "failed": 0, "skipped": 0}, "mismatch_detail": None}

    with patch("studio_mcp.import_fixer.fix_report.diff_floor_claim", side_effect=[fake_before, fake_after]):
        report = build_fix_report(
            result=result,
            fix=fix,
            test_cmd="echo test",
            claimed_counts={"passed": 11, "failed": 0, "skipped": 0},
            repo_root=tmp_path,
        )

    md = report.to_markdown()

    # Must contain both floor states.
    assert "Before-state floor" in md
    assert "After-state floor" in md

    # Must NOT contain any self-certification language.
    forbidden = ["CERTIFIED", "BLOCKED", "UNVERIFIABLE", "certified", "blocked", "unverifiable"]
    for word in forbidden:
        assert word not in md, f"Report contains forbidden verdict language: {word}"

    # Must contain the review-required disclaimer.
    assert "Review required" in md

    # The live file must be restored to its original state.
    assert "Math.min(10" in live_file.read_text(encoding="utf-8")
