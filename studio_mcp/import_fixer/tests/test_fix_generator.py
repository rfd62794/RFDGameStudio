"""Tests for import_fixer.fix_generator — §3 test anchors."""

from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import MagicMock

from studio_mcp.import_fixer.fix_generator import generate_fix
from studio_mcp.import_fixer.pattern_catalog import PatternName
from studio_mcp.import_fixer.pattern_detector import DetectionResult, MatchStatus


def test_fix_generator_never_writes_to_live_path(tmp_path: Path) -> None:
    """The fix output must always be under a scratch/temp directory, never
    the live file path."""
    live_file = tmp_path / "live.ts"
    live_file.write_text(
        "export function clampTier(v: number): number {\n"
        "  return Math.max(0, Math.min(10, Math.trunc(v)));\n"
        "}\n",
        encoding="utf-8",
    )
    original_live = live_file.read_text(encoding="utf-8")

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

    # Mocked OpenRouter client returns the corrected file content.
    mock_client = MagicMock()
    mock_client.complete.return_value = {
        "model": "deepseek/deepseek-v4-flash-0731",
        "choices": [
            {
                "message": {
                    "content": (
                        "export function clampTier(v: number): number {\n"
                        "  return Math.max(0, Math.min(3, Math.trunc(v)));\n"
                        "}\n"
                    )
                }
            }
        ],
    }
    mock_client.get_content.return_value = (
        "export function clampTier(v: number): number {\n"
        "  return Math.max(0, Math.min(3, Math.trunc(v)));\n"
        "}\n"
    )

    scratch_dir = tmp_path / "scratch"
    fix = generate_fix(result, client=mock_client, scratch_dir=scratch_dir)

    # The live file must be unchanged.
    assert live_file.read_text(encoding="utf-8") == original_live

    # The scratch path must be under the scratch directory, not the live path.
    assert scratch_dir.exists()
    assert Path(fix.scratch_path).parent == scratch_dir.resolve() or scratch_dir.resolve() in Path(fix.scratch_path).resolve().parents
    assert fix.scratch_path != str(live_file)

    # The diff must contain the bound change.
    assert "10" in fix.diff
    assert "3" in fix.diff
