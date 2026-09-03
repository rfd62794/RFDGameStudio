"""floor_runner.py — live test execution and summary parsing.

Ports the AsyncTestRunner pattern from OpenAgentMCP: shell=True Popen,
log+PID files under docs/state, followed by synchronous collection and
parsing of the recorded log.
"""

from __future__ import annotations

import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

LOG_FILENAME = "pipeline_audit_pytest.log"
PID_FILENAME = "pipeline_audit_pytest.pid"
TS_LOG_FILENAME = "pipeline_audit_vitest.log"
TS_PID_FILENAME = "pipeline_audit_vitest.pid"
_STATE_DIR = Path("docs") / "state"


def _state_dir(repo_path: Path) -> Path:
    state_dir = repo_path / _STATE_DIR
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir


def start_test_run(
    repo_path: Path | str,
    cmd: str,
    log_filename: str = LOG_FILENAME,
    pid_filename: str = PID_FILENAME,
    cwd: Path | str | None = None,
) -> dict:
    """Spawn cmd as a background process, write a log header and PID file.

    The log and PID files are written under repo_path/docs/state. If `cwd`
    is supplied, the subprocess uses it; otherwise it uses repo_path.

    Returns {"status": "started", "pid": int, "log_path": str, "cmd": str}
    or {"status": "error", "reason": str, "pid": None, "cmd": str}.
    """
    repo = Path(repo_path).resolve()
    state_dir = _state_dir(repo)
    log_path = state_dir / log_filename
    pid_path = state_dir / pid_filename
    proc_cwd = str(Path(cwd).resolve() if cwd else repo)

    try:
        log_file = log_path.open("w", encoding="utf-8")
        log_file.write(f"# Test run started: {datetime.now(timezone.utc).isoformat()}\n")
        log_file.write(f"# Command: {cmd}\n")
        log_file.flush()

        proc = subprocess.Popen(
            cmd,
            shell=True,
            cwd=proc_cwd,
            stdout=log_file,
            stderr=log_file,
        )
        pid_path.write_text(str(proc.pid), encoding="utf-8")

        return {
            "status": "started",
            "pid": proc.pid,
            "log_path": str(log_path),
            "cmd": cmd,
        }
    except Exception as exc:
        return {
            "status": "error",
            "reason": str(exc),
            "pid": None,
            "cmd": cmd,
        }


def _poll_process(pid: int | None, timeout: float = 0.5) -> bool:
    """Return True if the process is still running (or if we cannot determine)."""
    if pid is None:
        return False
    try:
        import psutil
        return psutil.pid_exists(pid)
    except Exception:
        # Without psutil, fall back to a short sleep; callers handle missing data.
        time.sleep(timeout)
        return False


def collect_test_log(
    log_path: Path | str | None,
    pid: int | None,
    timeout: float = 180.0,
) -> str:
    """Wait up to timeout seconds for the process to finish, then return log text."""
    if not log_path:
        return ""
    log_path = Path(log_path)
    if not log_path.exists() or not log_path.is_file():
        return ""

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if not _poll_process(pid, timeout=0.5):
            break
        time.sleep(0.5)

    return log_path.read_text(encoding="utf-8")


def parse_pytest_summary(text: str) -> dict:
    """Extract passed/failed/skipped from a pytest summary line."""
    summary_line = ""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("=") and " passed" in stripped:
            summary_line = stripped
            break

    counts: dict[str, int] = {"passed": 0, "failed": 0, "skipped": 0, "error": 0}
    if summary_line:
        token_pattern = re.compile(r"(\d+)\s+(passed|failed|skipped|error)", re.IGNORECASE)
        for count_str, label in token_pattern.findall(summary_line):
            counts[label.lower()] = int(count_str)

    counts["certified"] = bool(
        summary_line and counts["failed"] == 0 and counts["skipped"] == 0 and counts["error"] == 0
    )
    return counts


def _parse_vitest_line(line: str) -> dict[str, int]:
    """Parse counts from a Vitest summary line like '2 failed | 132 passed (134)'."""
    counts: dict[str, int] = {"failed": 0, "passed": 0, "skipped": 0}
    pattern = re.compile(r"(\d+)\s+(passed|failed|skipped)", re.IGNORECASE)
    for count_str, label in pattern.findall(line):
        counts[label.lower()] = int(count_str)
    return counts


def parse_vitest_summary(text: str) -> dict:
    """Extract passed/failed/skipped from a Vitest summary block."""
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    clean_text = ansi_escape.sub('', text)

    file_line = ""
    test_line = ""
    for line in clean_text.splitlines():
        if line.strip().startswith("Test Files"):
            file_line = line
        elif line.strip().startswith("Tests"):
            test_line = line

    file_counts = _parse_vitest_line(file_line)
    test_counts = _parse_vitest_line(test_line)

    found_summary = bool(file_line or test_line)
    failed = max(file_counts["failed"], test_counts["failed"])
    passed = test_counts["passed"]
    skipped = test_counts["skipped"]

    return {
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "certified": found_summary and failed == 0 and skipped == 0,
    }


def run_tests(
    repo_path: Path | str,
    cmd: str,
    log_filename: str = LOG_FILENAME,
    pid_filename: str = PID_FILENAME,
    collect_timeout: float = 300.0,
) -> dict:
    """Start a test run, wait for completion, and return parsed summary."""
    start = start_test_run(repo_path, cmd, log_filename, pid_filename)
    if start["status"] != "started":
        return {"cmd": cmd, **start, **parse_pytest_summary("")}

    log_text = collect_test_log(Path(start["log_path"]), start.get("pid"), collect_timeout)
    summary = parse_pytest_summary(log_text)
    return {
        "cmd": cmd,
        "log_path": start["log_path"],
        "pid": start["pid"],
        "raw_log": log_text,
        **summary,
    }


def run_vitest(
    repo_path: Path | str,
    cmd: str = "npx vitest run",
    collect_timeout: float = 300.0,
) -> dict:
    """Run the TypeScript suite and return a parsed summary."""
    result = run_tests(
        repo_path,
        cmd,
        log_filename=TS_LOG_FILENAME,
        pid_filename=TS_PID_FILENAME,
        collect_timeout=collect_timeout,
    )
    result.update(parse_vitest_summary(result["raw_log"]))
    return result
