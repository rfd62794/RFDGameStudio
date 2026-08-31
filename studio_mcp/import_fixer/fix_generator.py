"""fix_generator.py — call OpenRouter for a scoped, single-location fix.

The fixer never writes to a file under version control directly. It
writes the proposed fix to a scratch path and returns a diff. Applying
that diff to the real file is a separate, explicit step a human or
Claude takes after reviewing the report.

Structural scoping: the model never sees the full file. It receives only
a bounded window of lines around the match (±WINDOW_SIZE), and is asked
to return only the corrected window. The corrected window is then
spliced back into the original file content deterministically in code —
not by diffing the model's full-file output against the original. This
means the model literally cannot regenerate lines outside the window
even if it wanted to.
"""

from __future__ import annotations

import difflib
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient

from .pattern_catalog import PatternName
from .pattern_detector import DetectionResult, MatchStatus

WINDOW_SIZE = 5  # lines above and below the match line


@dataclass
class GeneratedFix:
    pattern: PatternName
    file: str
    scratch_path: str
    diff: str
    raw_response: str
    model: str
    error: str | None = None


def _extract_window(
    file_text: str, match_line: int, window: int = WINDOW_SIZE
) -> tuple[list[str], int, int]:
    """Return (window_lines, start_line, end_line) around match_line (1-based).

    start_line and end_line are 1-based and inclusive. window_lines is the
    list of lines in that range (without trailing newlines).
    """
    all_lines = file_text.splitlines()
    # match_line is 1-based; convert to 0-based index.
    match_idx = max(0, match_line - 1)
    start_idx = max(0, match_idx - window)
    end_idx = min(len(all_lines), match_idx + window + 1)
    window_lines = all_lines[start_idx:end_idx]
    return window_lines, start_idx + 1, end_idx


def _splice_window(
    original_text: str, corrected_window: str, start_line: int, end_line: int
) -> str:
    """Splice the corrected window back into the original file content.

    start_line and end_line are 1-based and inclusive. The corrected_window
    replaces lines [start_line, end_line] in the original.
    """
    original_lines = original_text.splitlines(keepends=True)
    corrected_lines = corrected_window.splitlines(keepends=True)

    # Ensure corrected lines end with newlines to match original format.
    if corrected_lines and not corrected_lines[-1].endswith("\n"):
        corrected_lines[-1] = corrected_lines[-1] + "\n"

    start_idx = start_line - 1  # 0-based
    end_idx = end_line           # exclusive in 0-based

    new_lines = original_lines[:start_idx] + corrected_lines + original_lines[end_idx:]
    return "".join(new_lines)


def _strip_code_fences(content: str) -> str:
    """Strip markdown code fences if the model wrapped its output."""
    if content.startswith("```"):
        lines = content.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines)
    return content


def _build_prompt_bound_mismatch(
    result: DetectionResult, window_lines: list[str], start_line: int, end_line: int
) -> list[dict[str, str]]:
    """Build a window-scoped prompt for a bound mismatch fix.

    The model sees only the bounded window, never the full file.
    """
    window_text = "\n".join(window_lines)
    system = (
        "You are a code repair tool. You are shown a small window of code "
        "containing exactly one known problem. You output only the corrected "
        "version of that window — the same lines, with the one fix applied. "
        "You do not add or remove lines. You do not add comments. You do not "
        "output anything outside the window."
    )
    user = (
        f"Function: {result.symbol}\n"
        f"Problem: numeric clamp currently uses bounds "
        f"[{result.current_min}, {result.current_max}], but the locked "
        f"spec requires [{result.locked_min}, {result.locked_max}].\n"
        f"Fix: change the clamp bounds to [{result.locked_min}, {result.locked_max}]. "
        f"Do not change anything else.\n\n"
        f"Code window (lines {start_line}-{end_line}):\n```\n{window_text}\n```\n\n"
        f"Output only the corrected version of this window, no explanation."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _build_prompt_silent_fallback(
    result: DetectionResult, window_lines: list[str], start_line: int, end_line: int
) -> list[dict[str, str]]:
    """Build a window-scoped prompt for a silent fallback fix.

    The model sees only the bounded window, never the full file.
    """
    window_text = "\n".join(window_lines)
    system = (
        "You are a code repair tool. You are shown a small window of code "
        "containing exactly one known problem. You output only the corrected "
        "version of that window — the same lines, with the one fix applied. "
        "You do not add or remove lines. You do not add comments. You do not "
        "output anything outside the window."
    )
    user = (
        f"Line: {result.line}\n"
        f"Problem: a switch/match default branch returns a value "
        f"({result.extra.get('return_value', 'unknown')}) instead of "
        f"throwing. On an exhaustive union/enum, a silent fallback masks "
        f"unhandled cases.\n"
        f"Fix: replace the return in the default branch with "
        f"`throw new Error('unhandled case');`. Do not change anything else.\n\n"
        f"Code window (lines {start_line}-{end_line}):\n```\n{window_text}\n```\n\n"
        f"Output only the corrected version of this window, no explanation."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def generate_fix(
    result: DetectionResult,
    client: OpenRouterClient | None = None,
    scratch_dir: Path | str | None = None,
) -> GeneratedFix:
    """Generate a fix for a single clean_match detection result.

    The model receives only a bounded window of lines around the match.
    The corrected window is spliced back into the original file content
    deterministically in code. The full corrected file is written to a
    scratch path (never the live file) and a diff is returned.
    """
    if result.status != MatchStatus.CLEAN_MATCH:
        return GeneratedFix(
            pattern=result.pattern,
            file=result.file,
            scratch_path="",
            diff="",
            raw_response="",
            model="",
            error=f"Cannot generate fix for status {result.status.value}",
        )

    if client is None:
        client = OpenRouterClient()

    original_text = Path(result.file).read_text(encoding="utf-8")

    # Extract the window around the match line.
    match_line = result.line or 1
    window_lines, start_line, end_line = _extract_window(
        original_text, match_line, WINDOW_SIZE
    )

    # Build the window-scoped prompt.
    if result.pattern == PatternName.BOUND_MISMATCH:
        messages = _build_prompt_bound_mismatch(
            result, window_lines, start_line, end_line
        )
    elif result.pattern == PatternName.SILENT_FALLBACK:
        messages = _build_prompt_silent_fallback(
            result, window_lines, start_line, end_line
        )
    else:
        return GeneratedFix(
            pattern=result.pattern,
            file=result.file,
            scratch_path="",
            diff="",
            raw_response="",
            model="",
            error=f"Unknown pattern: {result.pattern}",
        )

    response = client.complete(messages)
    corrected_window = client.get_content(response)
    model = response.get("model", client.model)

    # Strip code fences if present.
    corrected_window = _strip_code_fences(corrected_window)

    # Splice the corrected window back into the original file deterministically.
    fixed_content = _splice_window(
        original_text, corrected_window, start_line, end_line
    )

    # Write to scratch, never to the live file.
    if scratch_dir is None:
        scratch_dir = Path(tempfile.gettempdir()) / "import_fixer_scratch"
    scratch_path = Path(scratch_dir)
    scratch_path.mkdir(parents=True, exist_ok=True)

    scratch_file = scratch_path / Path(result.file).name
    scratch_file.write_text(fixed_content, encoding="utf-8")

    diff = "\n".join(
        difflib.unified_diff(
            original_text.splitlines(keepends=True),
            fixed_content.splitlines(keepends=True),
            fromfile=result.file,
            tofile=str(scratch_file),
            n=3,
        )
    )

    return GeneratedFix(
        pattern=result.pattern,
        file=result.file,
        scratch_path=str(scratch_file),
        diff=diff,
        raw_response=corrected_window,
        model=model,
    )
