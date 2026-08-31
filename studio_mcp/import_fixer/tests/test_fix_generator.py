"""Tests for import_fixer.fix_generator — §3 test anchors."""

from __future__ import annotations

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

    # Mocked OpenRouter client returns the corrected window content.
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


def test_fix_generator_prompt_excludes_file_content_outside_window(
    tmp_path: Path,
) -> None:
    """The constructed prompt must never contain the full file text — only
    the bounded window around the match. This is a structural guard against
    the regression where the model was sent the entire file and asked to
    regenerate it, causing a 120-second stall on a 480-line file.
    """
    # Build a file large enough that the window is clearly smaller.
    lines = [f"// line {i}" for i in range(1, 101)]
    lines.insert(50, "export function clampTier(v: number): number {")
    lines.insert(51, "  return Math.max(0, Math.min(10, Math.trunc(v)));")
    lines.insert(52, "}")
    live_file = tmp_path / "big.ts"
    live_file.write_text("\n".join(lines) + "\n", encoding="utf-8")

    full_text = live_file.read_text(encoding="utf-8")

    result = DetectionResult(
        status=MatchStatus.CLEAN_MATCH,
        pattern=PatternName.BOUND_MISMATCH,
        file=str(live_file).replace("\\", "/"),
        symbol="clampTier",
        line=51,  # the clamp line (1-based after inserts)
        current_min=0,
        current_max=10,
        locked_min=0,
        locked_max=3,
        reason="mismatch",
    )

    # Capture the messages that would be sent to the model.
    mock_client = MagicMock()
    mock_client.complete.return_value = {
        "model": "test",
        "choices": [{"message": {"content": "fixed window"}}],
    }
    mock_client.get_content.return_value = "fixed window"

    generate_fix(result, client=mock_client, scratch_dir=tmp_path / "scratch")

    # Inspect the prompt that was passed to client.complete().
    call_args = mock_client.complete.call_args
    messages = call_args.args[0] if call_args.args else call_args.kwargs.get("messages", [])

    # Combine all prompt text for checking.
    prompt_text = " ".join(m["content"] for m in messages)

    # Lines far outside the window (±5 around line 51, so lines 46-56)
    # must NOT appear in the prompt.
    assert "// line 1\n" not in prompt_text
    assert "// line 100" not in prompt_text
    assert "// line 75" not in prompt_text
    assert "// line 25" not in prompt_text

    # Lines inside the window SHOULD appear.
    assert "// line 47" in prompt_text or "clampTier" in prompt_text
    assert "// line 55" in prompt_text or "Math.min" in prompt_text

    # The full file text must not be in the prompt — check by confirming
    # the prompt is substantially shorter than the full file.
    assert len(prompt_text) < len(full_text)
