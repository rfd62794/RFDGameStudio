"""caller_check.py — confirm changed functions are actually invoked."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any


def _find_call_sites(source_text: str, func_name: str) -> list[int]:
    """Return line numbers where func_name is called, excluding its definition."""
    lines = source_text.splitlines()
    calls: list[int] = []
    for i, line in enumerate(lines, start=1):
        # Skip the definition line.
        if re.search(rf"(?:^|(?<=\s))(?:function|class|def)\s+{re.escape(func_name)}\b", line):
            continue
        if re.search(rf"\b{re.escape(func_name)}\s*\(", line):
            calls.append(i)
    return calls


def caller_check(zip_scratch: Path, changed_functions: list[str]) -> dict[str, Any]:
    """For each changed function, report whether it is invoked in the zip source."""
    source_files: list[Path] = []
    for path in zip_scratch.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in {".py", ".ts", ".tsx", ".js", ".jsx"}:
            continue
        if "node_modules" in path.parts or "assets" in path.parts:
            continue
        source_files.append(path)

    findings: dict[str, dict[str, Any]] = {}
    unused: list[str] = []
    for func in changed_functions:
        total_calls = 0
        files_with_calls: list[str] = []
        for source_file in source_files:
            text = source_file.read_text(encoding="utf-8", errors="replace")
            calls = _find_call_sites(text, func)
            if calls:
                total_calls += len(calls)
                files_with_calls.append(str(source_file.relative_to(zip_scratch)).replace("\\", "/"))
        findings[func] = {
            "call_count": total_calls,
            "files": files_with_calls,
        }
        if total_calls == 0:
            unused.append(func)

    return {
        "changed_functions": changed_functions,
        "findings": findings,
        "unused_functions": unused,
        "all_called": len(unused) == 0,
    }
