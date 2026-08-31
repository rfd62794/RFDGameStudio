"""fix_generator.py — call OpenRouter for a scoped, single-location fix.

The fixer never writes to a file under version control directly. It
writes the proposed fix to a scratch path and returns a diff. Applying
that diff to the real file is a separate, explicit step a human or
Claude takes after reviewing the report.
"""

from __future__ import annotations

import difflib
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient

from .pattern_catalog import PatternName
from .pattern_detector import DetectionResult, MatchStatus


@dataclass
class GeneratedFix:
    pattern: PatternName
    file: str
    scratch_path: str
    diff: str
    raw_response: str
    model: str
    error: str | None = None


def _build_prompt_bound_mismatch(result: DetectionResult) -> list[dict[str, str]]:
    """Build the minimal prompt for a bound mismatch fix."""
    file_text = Path(result.file).read_text(encoding="utf-8")
    system = (
        "You are a code repair tool. You produce the minimal diff to fix "
        "exactly one named, located problem. You do not review the file "
        "for other issues. You do not add comments. You output only the "
        "corrected file content, nothing else."
    )
    user = (
        f"File: {result.file}\n"
        f"Function: {result.symbol}\n"
        f"Problem: numeric clamp currently uses bounds "
        f"[{result.current_min}, {result.current_max}], but the locked "
        f"spec requires [{result.locked_min}, {result.locked_max}].\n"
        f"Fix: change the clamp bounds to [{result.locked_min}, {result.locked_max}]. "
        f"Do not change anything else.\n\n"
        f"Current file content:\n```\n{file_text}\n```\n\n"
        f"Output only the corrected file content, no explanation."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _build_prompt_silent_fallback(result: DetectionResult) -> list[dict[str, str]]:
    """Build the minimal prompt for a silent fallback fix."""
    file_text = Path(result.file).read_text(encoding="utf-8")
    system = (
        "You are a code repair tool. You produce the minimal diff to fix "
        "exactly one named, located problem. You do not review the file "
        "for other issues. You do not add comments. You output only the "
        "corrected file content, nothing else."
    )
    user = (
        f"File: {result.file}\n"
        f"Line: {result.line}\n"
        f"Problem: a switch/match default branch returns a value "
        f"({result.extra.get('return_value', 'unknown')}) instead of "
        f"throwing. On an exhaustive union/enum, a silent fallback masks "
        f"unhandled cases.\n"
        f"Fix: replace the return in the default branch with "
        f"`throw new Error('unhandled case');`. Do not change anything else.\n\n"
        f"Current file content:\n```\n{file_text}\n```\n\n"
        f"Output only the corrected file content, no explanation."
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

    Writes the proposed fixed file content to a scratch path (never the
    live file) and returns a diff plus metadata.
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

    if result.pattern == PatternName.BOUND_MISMATCH:
        messages = _build_prompt_bound_mismatch(result)
    elif result.pattern == PatternName.SILENT_FALLBACK:
        messages = _build_prompt_silent_fallback(result)
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
    fixed_content = client.get_content(response)
    model = response.get("model", client.model)

    # Write to scratch, never to the live file.
    if scratch_dir is None:
        scratch_dir = Path(tempfile.gettempdir()) / "import_fixer_scratch"
    scratch_path = Path(scratch_dir)
    scratch_path.mkdir(parents=True, exist_ok=True)

    original_text = Path(result.file).read_text(encoding="utf-8")
    # Strip markdown code fences if the model wrapped its output.
    if fixed_content.startswith("```"):
        lines = fixed_content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        fixed_content = "\n".join(lines)

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
        raw_response=fixed_content,
        model=model,
    )
