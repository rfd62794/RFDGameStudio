"""known_issues.py — deterministic grep-based checks for two tracked open items."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
TOOLS_PATH = REPO_ROOT / "studio_mcp" / "tools.py"
PUBLISHING_ROOT = Path(r"C:\Github\RFD_IT_Publishing")


def _read_text(path: Path) -> str:
    if not path.exists():
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""


def _extract_function_body(text: str, func_name: str) -> str | None:
    """Return the raw body of the named top-level function, or None."""
    match = re.search(
        rf"^def\s+{re.escape(func_name)}\s*\([^)]*\)(?:\s*->[^:]*)?:"
        r"(?:\s*\"\"\"[^\"]*\"\"\")?"
        r"(.*?)\n(?=^def\s+|^class\s+|\Z)",
        text,
        re.MULTILINE | re.DOTALL,
    )
    return match.group(1) if match else None


_SKIP_DIRS = {".git", ".venv", "venv", "node_modules", "__pycache__", ".pytest_cache", "dist", "build"}
_SOURCE_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".md", ".json", ".yaml", ".yml", ".toml"}


def _count_occurrences(root: Path, pattern: str, suffixes: set[str] | None = None) -> int:
    """Return the number of occurrences of pattern under root, mirroring `git grep`.

    Uses git ls-files when root is a git repository so generated audit reports
    and temporary scripts do not inflate the count.
    """
    if not root.exists():
        return 0

    import os
    import subprocess

    # Try git-tracked files first to avoid counting generated audit output.
    try:
        result = subprocess.run(
            ["git", "-c", f"safe.directory={root.resolve()}", "ls-files"],
            capture_output=True,
            text=True,
            cwd=str(root),
            timeout=10,
        )
        if result.returncode == 0:
            files = [root / p for p in result.stdout.splitlines() if p.strip()]
            return _count_in_paths(files, pattern, suffixes)
    except (subprocess.SubprocessError, FileNotFoundError):
        pass

    count = 0
    for dirpath, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
        dirnames[:] = [d for d in dirnames if d not in _SKIP_DIRS]
        for filename in filenames:
            if suffixes and not any(filename.endswith(suf) for suf in suffixes):
                continue
            path = Path(dirpath) / filename
            count += _count_in_file(path, pattern)
    return count


def _count_in_paths(paths: list[Path], pattern: str, suffixes: set[str] | None) -> int:
    count = 0
    for path in paths:
        if suffixes and not any(path.name.endswith(suf) for suf in suffixes):
            continue
        if not path.is_file():
            continue
        count += _count_in_file(path, pattern)
    return count


def _count_in_file(path: Path, pattern: str) -> int:
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return 0
    return len(re.findall(pattern, text))


def check_ensure_node_modules(tools_path: Path = TOOLS_PATH) -> dict:
    """Check whether _ensure_node_modules runs real npm install or returns None."""
    text = _read_text(tools_path)
    body = _extract_function_body(text, "_ensure_node_modules")
    if body is None:
        return {
            "status": "unknown",
            "runs_npm_install": False,
            "returns_none_on_no_match": False,
            "details": "Could not locate _ensure_node_modules function body.",
        }

    runs_npm_install = bool(re.search(r"npm['\"\s,]*install", body))
    returns_none_on_no_match = "return None" in body
    status = "fixed" if runs_npm_install and returns_none_on_no_match else "not_fixed"

    return {
        "status": status,
        "runs_npm_install": runs_npm_install,
        "returns_none_on_no_match": returns_none_on_no_match,
        "details": (
            "_ensure_node_modules contains a real npm install fallback and returns None "
            "only when package.json is missing."
            if status == "fixed"
            else "_ensure_node_modules does not appear to run npm install or does not return None on missing package.json."
        ),
    }


def check_cross_pipeline_version_tracking(
    repo_root: Path = REPO_ROOT,
    publishing_root: Path = PUBLISHING_ROOT,
) -> dict:
    """Check for the three CrossPipeline version tracking strings in code and publishing repo."""
    strings = ["_is_dist_stale", "--userversion", "deployed_version"]
    repo_counts: dict[str, int] = {}
    publishing_counts: dict[str, int] = {}

    for s in strings:
        repo_counts[s] = _count_occurrences(repo_root, re.escape(s))
        publishing_counts[s] = _count_occurrences(publishing_root, re.escape(s))

    total = sum(repo_counts.values()) + sum(publishing_counts.values())
    publishing_total = sum(publishing_counts.values())

    if total == 0:
        status = "not_fixed"
    elif publishing_total == 0:
        status = "partial"
    else:
        status = "fixed"

    return {
        "status": status,
        "repo_counts": repo_counts,
        "publishing_counts": publishing_counts,
        "total_hits": total,
        "details": (
            "No real implementation hits for any of the three version-tracking strings."
            if total == 0
            else "Version-tracking strings found, but not in RFD_IT_Publishing."
            if status == "partial"
            else "Version-tracking strings appear to be implemented."
        ),
    }


def check_known_issues() -> dict:
    """Run all hardcoded known-issue checks and return a structured report."""
    return {
        "ensure_node_modules": check_ensure_node_modules(),
        "cross_pipeline_version_tracking": check_cross_pipeline_version_tracking(),
    }
