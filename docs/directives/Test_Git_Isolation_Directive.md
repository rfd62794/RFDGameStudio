# Tests that run git must never touch the real repository

## 1. Why this exists

2026-09-22 ~21:53: `git push` from a Devin worktree ran `.githooks/pre-push` -> `scripts/check.ps1`
-> pytest. Git hooks run with `GIT_DIR` (and friends) set in the environment, and the
`subprocess.run(["git", ...], cwd=tmp_repo)` calls in the tests inherit it, so they operated on the
REAL repository instead of their temporary one. They:

- committed `first` / `second` fixture commits onto the branch being pushed, one of which
  (`ac3f6719`) deletes every file - it reached GitHub `main` via PR #10 and had to be restored
  (`a29586d9`);
- set `core.bare = true` in the shared `.git/config`, breaking the main checkout;
- set `user.name = Test` / `user.email = test@test.com` in the repo config, so later real commits
  were authored "Test".

The tests are correct in a plain shell; they are only dangerous under a hook. Both the runner and
the tests must be fixed so neither alone can do this again.

## 2. The work

Read first, inside this worktree: `scripts/check.ps1`, `.githooks/pre-push`,
`studio_mcp/zip_verify/tests/test_tracked_dir_diff.py`,
`studio_mcp/zip_verify/tests/test_source_resolver.py`,
`studio_mcp/pipeline_audit/tests/test_known_issues.py`, and any other test found by
`grep -rln "subprocess" --include=test_*.py .` that runs `git`.

1. **A shared fixture.** Add `tests/_git_env.py` (or the repo's existing conftest location if tests
   already share one - check first) with `isolated_git_env(repo_path) -> dict`: a copy of
   `os.environ` with every `GIT_*` variable removed, plus `GIT_CEILING_DIRECTORIES` set to the temp
   repo's parent and `GIT_CONFIG_NOSYSTEM=1`. Every test that runs `git` passes `env=` from it.
2. **Identity without config writes.** Replace `git config user.name/user.email` calls in tests with
   `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL` in that env, so
   a test never writes to any git config file.
3. **The runner.** In `scripts/check.ps1`, before running pytest and vitest, remove every `GIT_*`
   environment variable from the process (`Get-ChildItem Env:GIT_* | Remove-Item`), with a comment
   pointing at this directive.
4. **A regression test** (write it first, see it fail): set `GIT_DIR` in the environment to a
   *second* temporary repo, run the tracked-dir fixture helper, and assert that second repo gained
   no commits and no config changes.

## 3. What NOT to do

- Do not delete, skip or weaken any existing test. Do not add dependencies.
- Do not touch the real repository's config from tests, ever.

## 4. Completion criteria

- [ ] The regression test fails before the fix and passes after.
- [ ] `uv run pytest -q -p pytest_rerunfailures studio_mcp` passes with no new failures; report
      before/after counts.
- [ ] `grep -rn "\"config\", \"user\." --include=test_*.py .` finds nothing.

## 5. Report

Before/after counts, commit hashes, and the list of test files changed.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected outright and
  the run ends mid-task. Do not install, download or fetch anything. Do not read outside this
  working directory, and do not use a search, memory or web tool.
- The test command for this repo is exactly `uv run pytest -q -p pytest_rerunfailures <path>`.
- Never use `git -C` or `git -c`; run git from the worktree.
- These are the only commands available to you: `uv run pytest`, `git status`, `git diff`,
  `git log`, `git show`, `git add`, `git commit`, `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `mkdir`.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never deploy.**
  Do not run `scripts/check.ps1` yourself.
- Update this directive's Status row when you finish or stop partway.
- If a tool call is genuinely blocked, stop and write why in the Status row instead of trying
  another way around it.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-test-git-isolation-directive |
| Base branch | - |
| Base commit | 66c96a33b383a0377633cdbddc5ae6c2cfe4a402 |

**Status log**
- 2026-09-22 22:21 · robert-claude · none → Queued — Fix after the PR #10 wipe: isolate git env in tests and check.ps1. Top priority for the Studio.
- 2026-09-22 22:23 · robert-claude · Queued → Approved
- 2026-09-22 22:23 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-test-git-isolation-directive; base origin/main (local main differs)
- 2026-09-22 22:34 · devin-overseer · In progress → Review — Done. Tests: 4F/101P/9S before -> 4F/102P/9S after (same 4 pre-existing env failures; +1 regression test). Commits 0f2595e0 (red), ba2983f8 (green).
<!-- queue:end -->
