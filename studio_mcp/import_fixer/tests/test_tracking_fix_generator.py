"""Tests for import_fixer.tracking_fix_generator — §3 test anchors."""

from __future__ import annotations

import subprocess
from pathlib import Path

from studio_mcp.import_fixer.pattern_catalog import PatternName
from studio_mcp.import_fixer.pattern_detector import DetectionResult, MatchStatus
from studio_mcp.import_fixer.tracking_fix_generator import generate_tracking_fix


def test_tracking_fix_generator_flags_node_modules_leak(tmp_path: Path) -> None:
    """A directory containing node_modules/ should downgrade to ambiguous."""
    scratch_repo = tmp_path / "repo"
    scratch_repo.mkdir()
    subprocess.run(["git", "init"], cwd=scratch_repo, capture_output=True)

    target = scratch_repo / "examples" / "game" / "src"
    target.mkdir(parents=True)
    (target / "engine.ts").write_text("export const x = 1;\n", encoding="utf-8")

    # Add node_modules to simulate a leak.
    nm = scratch_repo / "examples" / "game" / "node_modules"
    nm.mkdir(parents=True)
    (nm / "fake.js").write_text("module.exports = {};\n", encoding="utf-8")

    result = DetectionResult(
        status=MatchStatus.CLEAN_MATCH,
        pattern=PatternName.UNTRACKED_REGISTRY_SOURCE,
        file=str(scratch_repo / "examples" / "game"),
        symbol="game",
        reason="Untracked source directory found: game",
    )

    fix = generate_tracking_fix(result, repo_root=scratch_repo)

    assert fix.ambiguous is True
    assert fix.error is not None
    assert "forbidden" in fix.error.lower() or "node_modules" in fix.error.lower()
