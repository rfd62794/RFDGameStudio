"""commit_claim_audit.py — check commit messages against real git history."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path
from typing import Any


def _run_git(args: list[str], cwd: Path | str | None = None) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return result.stdout or ""


def _extract_stat_files(stat_text: str) -> set[str]:
    """Extract touched filenames from `git show --stat` output."""
    files: set[str] = set()
    in_stat = False
    for line in stat_text.splitlines():
        stripped = line.strip()
        if stripped.startswith("|"):
            # Summary line at the end; stop collecting.
            break
        if not in_stat:
            # Stat block starts after the commit message blank line.
            if stripped == "":
                in_stat = True
            continue
        if stripped == "":
            continue
        # Lines look like: " path/to/file | 12 +++---"
        if "|" in stripped:
            file_part = stripped.split("|")[0].strip()
            if file_part:
                files.add(file_part)
    return files


def audit_file_list(
    commit_hash: str,
    claimed_files: list[str],
    repo_path: Path | str | None = None,
) -> dict[str, Any]:
    """Compare a claimed touched-file list against the real `git show --stat`.

    Returns:
        - claimed: input list
        - real: set of files actually touched
        - claimed_not_touched: files claimed but absent from the commit
        - touched_not_claimed: files in the commit but not claimed
        - matches: bool
    """
    stat_text = _run_git(["show", "--stat", commit_hash], cwd=repo_path)
    real_files = _extract_stat_files(stat_text)
    claimed_set = set(claimed_files)

    claimed_not_touched = sorted(claimed_set - real_files)
    touched_not_claimed = sorted(real_files - claimed_set)

    return {
        "commit_hash": commit_hash,
        "claimed": claimed_files,
        "real": sorted(real_files),
        "claimed_not_touched": claimed_not_touched,
        "touched_not_claimed": touched_not_claimed,
        "matches": claimed_set == real_files,
    }


def audit_addition_claim(
    symbol: str,
    commit_hash: str,
    file_paths: list[str],
    repo_path: Path | str | None = None,
) -> dict[str, Any]:
    """Check whether `symbol` genuinely first appears in `commit_hash`.

    Uses `git log -S` scoped to `file_paths`. If an earlier commit than
    `commit_hash` already touched the symbol, the "added X" claim is false
    and `pre_existing_since` points to the oldest such commit.
    """
    if not file_paths:
        return {
            "symbol": symbol,
            "commit_hash": commit_hash,
            "confirmed": False,
            "pre_existing_since": None,
            "error": "No file_paths provided for scoped search.",
        }

    # Normalize paths to repo-relative forward slashes.
    rel_paths = [str(Path(p).as_posix()) for p in file_paths]

    log_output = _run_git(
        ["log", "-S", symbol, "--oneline", "--", *rel_paths],
        cwd=repo_path,
    )
    commits = [line.split()[0] for line in log_output.splitlines() if line.strip()]

    if commit_hash not in commits:
        # Symbol may exist from an earlier commit not listed if it was never
        # removed, but git log -S should list all commits that changed the count.
        # If the queried commit isn't in the list, the claim is unsupported.
        return {
            "symbol": symbol,
            "commit_hash": commit_hash,
            "confirmed": False,
            "pre_existing_since": commits[-1] if commits else None,
            "error": None,
        }

    index = commits.index(commit_hash)
    if index == len(commits) - 1:
        # This is the oldest commit touching the symbol -> genuine origin.
        return {
            "symbol": symbol,
            "commit_hash": commit_hash,
            "confirmed": True,
            "pre_existing_since": None,
            "error": None,
        }

    # There are older commits that also touched the symbol -> pre-existing.
    return {
        "symbol": symbol,
        "commit_hash": commit_hash,
        "confirmed": False,
        "pre_existing_since": commits[-1],
        "error": None,
    }
