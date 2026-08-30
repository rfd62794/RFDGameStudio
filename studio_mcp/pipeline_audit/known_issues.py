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
        rf"^def\s+{re.escape(func_name)}\s*\([^)]*\)\s*(?:->[^:]*:)?\s*:"
        r"(?:\s*\"\"\"[^\"]*\"\"\")?"
        r"(.*?)\n(?=^def\s+|^class\s+|\Z)",
        text,
        re.MULTILINE | re.DOTALL,
    )
    return match.group(1) if match else None


def _count_occurrences(root: Path, pattern: str, glob: str = "**/*") -> int:
    """Return the number of files under root whose content contains pattern."""
    if not root.exists():
        return 0
    count = 0
    for path in root.rglob(glob):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if re.search(pattern, text):
            count += 1
    return count


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

    runs_npm_install = "npm install" in body
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
