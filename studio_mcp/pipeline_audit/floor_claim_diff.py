"""floor_claim_diff.py — re-run a claimed test command and diff the counts."""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

from .floor_runner import parse_pytest_summary, parse_vitest_summary


def diff_floor_claim(
    cmd: str,
    claimed: dict[str, int],
    cwd: Path | str | None = None,
    timeout: float = 300.0,
) -> dict[str, Any]:
    """Re-run `cmd`, parse the real summary, and compare against `claimed`.

    `claimed` should contain at least "passed", "failed", and "skipped".
    Returns a dict with:
        - matches: bool
        - claimed: the input counts
        - real: the parsed counts
        - mismatch_detail: str | None
        - raw_output: the captured stdout/stderr text
    """
    proc = subprocess.run(
        cmd,
        shell=True,
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )
    text = proc.stdout + proc.stderr

    real = parse_pytest_summary(text)
    # If pytest parser found nothing, try the vitest parser.
    if real["passed"] == 0 and real["failed"] == 0 and real["skipped"] == 0:
        real = parse_vitest_summary(text)

    claimed_passed = claimed.get("passed", 0)
    claimed_failed = claimed.get("failed", 0)
    claimed_skipped = claimed.get("skipped", 0)

    matches = (
        real["passed"] == claimed_passed
        and real["failed"] == claimed_failed
        and real["skipped"] == claimed_skipped
    )

    mismatch_detail: str | None = None
    if not matches:
        mismatch_detail = (
            f"passed {real['passed']} vs {claimed_passed}, "
            f"failed {real['failed']} vs {claimed_failed}, "
            f"skipped {real['skipped']} vs {claimed_skipped}"
        )

    return {
        "matches": matches,
        "claimed": {
            "passed": claimed_passed,
            "failed": claimed_failed,
            "skipped": claimed_skipped,
        },
        "real": real,
        "mismatch_detail": mismatch_detail,
        "raw_output": text,
    }
