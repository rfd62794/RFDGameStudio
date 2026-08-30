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
    pattern = re.compile(
        r"=+\s*"
        r"(?P<passed>\d+)\s+passed"
        r"(?:,\s*(?P<failed>\d+)\s+failed)?"
        r"(?:,\s*(?P<skipped>\d+)\s+skipped)?"
        r"(?:,\s*(?P<deselected>\d+)\s+deselected)?"
        r"(?:,\s*(?P<error>\d+)\s+error)?"
        r"\s*in\s+[^=]+=+",
        re.IGNORECASE,
    )
    match = pattern.search(text)
    if not match:
        return {"passed": 0, "failed": 0, "skipped": 0, "error": 0, "certified": False}

    groups = match.groupdict()
    passed = int(groups.get("passed") or 0)
    failed = int(groups.get("failed") or 0)
    skipped = int(groups.get("skipped") or 0)
    error = int(groups.get("error") or 0)
    return {
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "error": error,
        "certified": failed == 0 and skipped == 0 and error == 0,
    }


def parse_vitest_summary(text: str) -> dict:
    """Extract passed/failed/skipped from a Vitest summary block."""
    file_pattern = re.compile(
        r"Test\s+Files\s+"
        r"(?:(?P<failed>\d+)\s+failed\s*\|\s*)?"
        r"(?:(?P<passed>\d+)\s+passed\s*\|\s*)?"
        r"\(?\d+\)?",
        re.IGNORECASE,
    )
    test_pattern = re.compile(
        r"Tests\s+"
        r"(?:(?P<failed>\d+)\s+failed\s*\|\s*)?"
        r"(?:(?P<passed>\d+)\s+passed\s*\|\s*)?"
        r"(?:(?P<skipped>\d+)\s+skipped\s*\|\s*)?"
        r"\(?\d+\)?",
        re.IGNORECASE,
    )

    file_match = file_pattern.search(text)
    test_match = test_pattern.search(text)

    def _int(m: re.Match | None, name: str) -> int:
        if not m:
            return 0
        value = m.groupdict().get(name)
        return int(value) if value else 0

    passed = _int(test_match, "passed")
    failed = _int(test_match, "failed")
    skipped = _int(test_match, "skipped")
    file_failed = _int(file_match, "failed")
    failed = max(failed, file_failed)

    return {
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "certified": failed == 0 and skipped == 0,
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
