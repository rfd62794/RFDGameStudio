"""tracked_dir_diff.py — git-based revision comparison for tracked examples/ dirs.

This is the no-zip counterpart to revision_diff.py: instead of comparing two
zip revisions, it compares the two most recent commits touching a tracked
examples/{slug}/ directory.
"""

from __future__ import annotations

import difflib
import subprocess
from pathlib import Path

from .zip_reader import core_logic_files

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _run_git(args: list[str], cwd: Path) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return result.stdout or ""


def _git_show(commit: str, path: str, repo_root: Path) -> str | None:
    """Return the contents of `path` at `commit`, or None if it did not exist."""
    output = _run_git(["show", f"{commit}:{path}"], cwd=repo_root)
    # git show returns non-empty on success; if the file didn't exist, stderr
    # is non-empty but stdout is empty. We can't easily distinguish "empty file"
    # from "missing file" here, but the diff path only asks for files git reports
    # as changed, so an empty return safely means "not present in prior commit".
    if output == "":
        return None
    return output


def _extract_functions(text: str) -> set[str]:
    """Return function/class names defined in the text."""
    import re

    names: set[str] = set()
    for line in text.splitlines():
        match = re.search(r"(?:^|(?<=\s))(?:function|class|def)\s+([A-Za-z0-9_]+)", line)
        if match:
            names.add(match.group(1))
    return names


def diff_tracked_dir(tracked_dir: Path | str) -> dict[str, object]:
    """Diff the two most recent commits touching tracked_dir.

    Returns a structure matching diff_revision's output so the rest of the
    verifier pipeline can treat zip and tracked-dir sources uniformly.
    """
    tracked_dir = Path(tracked_dir).resolve()
    rel_path = tracked_dir.relative_to(REPO_ROOT).as_posix()
    pathspec = rel_path

    log_output = _run_git(["log", "--oneline", "--", pathspec], cwd=REPO_ROOT)
    commits = [line.split()[0] for line in log_output.strip().splitlines() if line.strip()]

    current_files = core_logic_files(tracked_dir)
    file_list = sorted(
        {str(p.relative_to(tracked_dir)).replace("\\", "/") for p in current_files}
    )

    if len(commits) <= 1:
        return {
            "tracked_path": str(tracked_dir),
            "no_prior_revision": True,
            "prior_path": None,
            "files": file_list,
            "changed_functions": [],
            "diffs": {},
        }

    current_commit = commits[0]
    prior_commit = commits[1]

    changed_files_output = _run_git(
        ["diff", "--name-only", prior_commit, current_commit, "--", pathspec],
        cwd=REPO_ROOT,
    )
    changed_files = [
        line.strip() for line in changed_files_output.splitlines() if line.strip()
    ]

    diffs: dict[str, str] = {}
    changed_functions: set[str] = set()

    for repo_file in changed_files:
        repo_path = Path(repo_file)
        try:
            rel_in_source = str(repo_path.relative_to(rel_path)).replace("\\", "/")
        except ValueError:
            # File is outside the tracked dir somehow; skip.
            continue

        current_text = _git_show(current_commit, repo_file, REPO_ROOT) or ""
        prior_text = _git_show(prior_commit, repo_file, REPO_ROOT) or ""

        if current_text == prior_text:
            continue

        diff = "\n".join(
            difflib.unified_diff(
                prior_text.splitlines(),
                current_text.splitlines(),
                fromfile=f"a/{rel_in_source}",
                tofile=f"b/{rel_in_source}",
                lineterm="",
            )
        )
        if diff:
            diffs[rel_in_source] = diff
            changed_functions.update(_extract_functions(current_text) ^ _extract_functions(prior_text))

    return {
        "tracked_path": str(tracked_dir),
        "no_prior_revision": False,
        "prior_path": prior_commit,
        "files": sorted({*file_list, *diffs.keys()}),
        "changed_functions": sorted(changed_functions),
        "diffs": diffs,
    }
