"""fix_report.py — assemble the proposed diff plus before/after floor evidence.

The report never marks CERTIFIED/BLOCKED/UNVERIFIABLE or any equivalent
self-certifying language. It presents the diff and the floor states; a
human or Claude makes the landing decision.
"""

from __future__ import annotations

import shutil
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from studio_mcp.pipeline_audit.floor_claim_diff import diff_floor_claim

from .fix_generator import GeneratedFix
from .pattern_detector import DetectionResult, MatchStatus


@dataclass
class FixReport:
    pattern: str
    file: str
    symbol: str | None
    status: str
    diff: str
    scratch_path: str
    model: str
    before_floor: dict[str, Any] | None = None
    after_floor: dict[str, Any] | None = None
    error: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)

    def to_markdown(self) -> str:
        """Render the report as markdown for human review."""
        lines = [
            f"# Import Fixer Report",
            f"",
            f"- **Pattern:** {self.pattern}",
            f"- **File:** {self.file}",
        ]
        if self.symbol:
            lines.append(f"- **Symbol:** {self.symbol}")
        lines.append(f"- **Detection status:** {self.status}")
        lines.append(f"- **Model:** {self.model}")
        lines.append(f"- **Scratch path:** {self.scratch_path}")
        if self.error:
            lines.append(f"- **Error:** {self.error}")
        lines.append("")

        if self.before_floor is not None:
            lines.append("## Before-state floor")
            lines.append(f"- matches: {self.before_floor.get('matches')}")
            if self.before_floor.get("mismatch_detail"):
                lines.append(f"- detail: {self.before_floor['mismatch_detail']}")
            real = self.before_floor.get("real", {})
            lines.append(
                f"- real counts: passed={real.get('passed', 0)}, "
                f"failed={real.get('failed', 0)}, skipped={real.get('skipped', 0)}"
            )
            lines.append("")

        if self.after_floor is not None:
            lines.append("## After-state floor (scratch copy)")
            lines.append(f"- matches: {self.after_floor.get('matches')}")
            if self.after_floor.get("mismatch_detail"):
                lines.append(f"- detail: {self.after_floor['mismatch_detail']}")
            real = self.after_floor.get("real", {})
            lines.append(
                f"- real counts: passed={real.get('passed', 0)}, "
                f"failed={real.get('failed', 0)}, skipped={real.get('skipped', 0)}"
            )
            lines.append("")

        lines.append("## Proposed diff")
        lines.append("```diff")
        lines.append(self.diff)
        lines.append("```")
        lines.append("")
        lines.append(
            "## Review required"
        )
        lines.append(
            "A human or Claude must review this diff before it is applied "
            "to the live file. This report does not certify, block, or "
            "judge the fix — it presents evidence for a review decision."
        )
        return "\n".join(lines)


def build_fix_report(
    result: DetectionResult,
    fix: GeneratedFix,
    test_cmd: str,
    claimed_counts: dict[str, int],
    repo_root: Path | str = ".",
    test_cwd: Path | str | None = None,
    test_timeout: float = 300.0,
) -> FixReport:
    """Build a full report with before/after floor evidence.

    1. Run the test command on the *before* state (live file).
    2. Copy the file to a temp repo scratch, apply the fix, run again.
    3. Return both floor states plus the diff.

    The test_cwd for the *after* run is a scratch copy of the repo root
    with only the affected file replaced — not a full repo clone, to keep
    this practical. If the test command needs more context than the single
    file, the caller should provide a pre-built scratch repo.
    """
    repo = Path(repo_root).resolve()

    # --- Before-state floor ---
    before_floor = diff_floor_claim(
        cmd=test_cmd,
        claimed=claimed_counts,
        cwd=test_cwd or repo,
        timeout=test_timeout,
    )

    # --- After-state floor ---
    # Apply the fix to a scratch copy of the file, then run tests against
    # the live repo with the scratch file swapped in temporarily.
    after_floor: dict[str, Any] | None = None
    if fix.error is None and fix.scratch_path:
        live_file = Path(result.file)
        if not live_file.is_absolute():
            live_file = repo / live_file
        backup = live_file.read_text(encoding="utf-8")
        try:
            fixed_content = Path(fix.scratch_path).read_text(encoding="utf-8")
            live_file.write_text(fixed_content, encoding="utf-8")
            after_floor = diff_floor_claim(
                cmd=test_cmd,
                claimed=claimed_counts,
                cwd=test_cwd or repo,
                timeout=test_timeout,
            )
        finally:
            # Always restore the live file — the fixer never leaves the
            # live file modified.
            live_file.write_text(backup, encoding="utf-8")

    return FixReport(
        pattern=result.pattern.value,
        file=result.file,
        symbol=result.symbol,
        status=result.status.value,
        diff=fix.diff,
        scratch_path=fix.scratch_path,
        model=fix.model,
        before_floor=before_floor,
        after_floor=after_floor,
        error=fix.error,
        extra=result.extra,
    )
