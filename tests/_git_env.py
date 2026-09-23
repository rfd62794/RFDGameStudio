"""Shared environment isolation for tests that spawn real `git` processes.

See docs/directives/Test_Git_Isolation_Directive.md: a git hook exports
GIT_DIR and friends into the environment, and test helpers that call
`subprocess.run(["git", ...])` otherwise inherit them — operating on the
REAL repository instead of their temporary fixture repo (the incident
behind that directive pushed fixture commits to main via PR #10 and
clobbered the checkout's git config).

Every subprocess git call in tests must pass env=isolated_git_env(repo_path).
"""

from __future__ import annotations

import os
from pathlib import Path


def isolated_git_env(repo_path: Path | str) -> dict[str, str]:
    """Return a copy of os.environ safe for running `git` inside `repo_path`.

    - removes every inherited GIT_* variable (GIT_DIR, GIT_WORK_TREE,
      GIT_INDEX_FILE, GIT_CONFIG, ...) so the child git can only see the
      repository at `repo_path`;
    - sets GIT_CEILING_DIRECTORIES to the repo's parent so git never
      discovers a repository above it;
    - sets GIT_CONFIG_NOSYSTEM=1 so machine-level git config is ignored;
    - provides author/committer identity via env vars so tests never need
      `git config user.name` / `git config user.email` — a test must never
      write to any git config file.
    """
    env = {k: v for k, v in os.environ.items() if not k.startswith("GIT_")}
    env["GIT_CEILING_DIRECTORIES"] = Path(repo_path).resolve().parent.as_posix()
    env["GIT_CONFIG_NOSYSTEM"] = "1"
    env["GIT_AUTHOR_NAME"] = "Test"
    env["GIT_AUTHOR_EMAIL"] = "test@test.com"
    env["GIT_COMMITTER_NAME"] = "Test"
    env["GIT_COMMITTER_EMAIL"] = "test@test.com"
    return env
