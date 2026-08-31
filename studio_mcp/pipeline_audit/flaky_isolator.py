"""flaky_isolator.py — re-run failing tests individually and classify them."""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

from .floor_runner import parse_pytest_summary, parse_vitest_summary


def _is_pytest_node(test_id: str) -> bool:
    return "::" in test_id


def _run_single(test_id: str, cwd: Path | str | None = None, timeout: float = 120.0) -> dict[str, Any]:
    """Run one test node in isolation and return parsed summary + raw output."""
    if _is_pytest_node(test_id):
        cmd = f"uv run pytest {test_id} -v"
    else:
        # Vitest node ids look like "tests/file.ts > suite > test".
        # Best-effort isolation: run the file with -t for the leaf test name.
        parts = [p.strip() for p in test_id.split(">")]
        file_part = parts[0]
        test_name = parts[-1]
        cmd = f"npx vitest run {file_part} -t \"{test_name}\""

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
    summary = parse_pytest_summary(text)
    if summary["passed"] == 0 and summary["failed"] == 0 and summary["skipped"] == 0:
        summary = parse_vitest_summary(text)
    return {"summary": summary, "raw_output": text, "returncode": proc.returncode}


def isolate_failures(
    test_ids: list[str],
    cwd: Path | str | None = None,
    timeout: float = 120.0,
) -> dict[str, list[str] | dict[str, Any]]:
    """Re-run each failing test alone and classify as flaky or real.

    Returns:
        - flaky: list of test IDs that passed in isolation
        - real: list of test IDs that still failed in isolation
        - not_run: list of test IDs that could not be classified
        - details: per-test-id dict of summary and raw output
    """
    flaky: list[str] = []
    real: list[str] = []
    not_run: list[str] = []
    details: dict[str, Any] = {}

    for test_id in test_ids:
        result = _run_single(test_id, cwd=cwd, timeout=timeout)
        details[test_id] = result
        summary = result["summary"]
        returncode = result.get("returncode", 0)

        failed = summary.get("failed", 0)
        error = summary.get("error", 0)
        passed = summary.get("passed", 0)

        if failed > 0 or error > 0:
            real.append(test_id)
        elif passed > 0 and failed == 0 and error == 0:
            flaky.append(test_id)
        elif returncode != 0:
            # pytest's short summary for a single failed test isn't parsed by
            # the generic summary parser; the non-zero exit code is enough.
            real.append(test_id)
        else:
            not_run.append(test_id)

    return {
        "flaky": flaky,
        "real": real,
        "not_run": not_run,
        "details": details,
    }
