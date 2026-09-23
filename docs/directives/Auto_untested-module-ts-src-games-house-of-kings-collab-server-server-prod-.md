# ts/src/games/house_of_kings_collab/server/server.prod.ts has no tests while its neighbours do

## 1. Why this exists

This directive was generated from a workspace scan, not written by hand. It matched the
`untested-module` category in `Portfolio/backlog_policy.yaml`, which Robert authorised for
automatic dispatch:

> A module with no test file is the backlog that never empties, and every game added creates more. Purely additive: the directive may create a test file and nothing else, so a bad run costs a deleted file.

Nobody looked at this specific case before it was dispatched. Treat the finding as a
claim to verify, not as an instruction - §5 says what to do if it is wrong.

## 2. Scope

```
ts/src/games/house_of_kings_collab/server/server.prod.ts
```

At most 2 file(s). A change that needs more than that is a
different task: stop and report it rather than widening this one.

## 3. The work

`ts/src/games/house_of_kings_collab/server/server.prod.ts` has no tests, while other modules in the same folder do. Read it, then write
tests for the behaviour it actually has - not the behaviour its name suggests.

Cover the real branches: the success path, each error or empty case the code explicitly
handles, and any boundary the code itself tests for. Do not write a test that only
asserts the module imports, and do not assert on a value you had to read off the current
implementation without understanding why it is that value.

Follow the existing test file conventions in this repo. Read a neighbouring test first.

Verification: `cd ts && npx vitest run` ends with 0 failed, 0 skipped. Run exactly this command to
verify; do not run builds, type-checkers, process listings or other commands.

## Rules for this run

- **Write only inside this worktree.** Never `%TEMP%`, never `/tmp`. Scratch goes in `.devin-scratch/`.
- **Do not delete anything.** `rm` is not permitted in a headless run and ends it silently.
- **One shell command at a time.** No `&&` or `;` chains, no `$(...)`, no heredocs, no `cat`
  piped into a command. Each of these ended a real run without a word.
- Commit with a plain single-line message: `git commit -m "one line"`.
- Use the `python` already on PATH. Do not probe for interpreters or create a venv.
- No servers and no long-running processes.
- Never merge, rebase onto, or push to the default branch.
- **If a command is refused, stop immediately** and report Blocked naming the refused
  command. Working around a refusal is what killed every run that died silently; the
  refusal itself is useful information and reporting it is a successful outcome.
- **If the task turns out to be wrong, stop and say so.** This directive was generated
  automatically from a scan, and a scan can be wrong. Reporting "this was a false
  positive, here is why" is a complete and welcome result - do not invent work to do.
- **This change is purely additive.** Create the new file and change nothing else. If
  making it pass would require editing existing code, stop and report that instead -
  that is a finding worth more than the file.

## 5. If the finding is wrong

The scan that produced this can be wrong: a module may be tested somewhere the scan did
not look, a README may live one level up, a marker may already be resolved. If so, stop,
report Blocked, and state what the scan missed. That report is how the finder gets
fixed, and it is worth more than the work would have been.

## 6. Completion criteria

- [ ] `cd ts && npx vitest run` passes.
- [ ] Nothing outside §2 was modified.
- [ ] Nothing was deleted.
- [ ] If anything was refused or the finding was wrong, it is reported rather than worked around.

## 7. Report

What you changed and why. The real output of the check command, pasted. Anything about
the finding that was inaccurate. And any refused command, verbatim.

<!-- check: cd ts && npx vitest run -->

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-auto-untested-module-ts-src-games-ac5b91 |
| Base branch | - |
| Base commit | e968883d063f8ad4de07b41e5e268810374b87fc |
| Policy | untested-module |

**Status log**
- 2026-09-22 20:33 · backlog-policy · none → Queued — generated from a untested-module finding authorised in backlog_policy.yaml
- 2026-09-22 20:36 · backlog-policy · Queued → Approved
- 2026-09-22 21:19 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-games-ac5b91; base origin/main (local main differs)
- 2026-09-22 21:30 · devin-overseer · In progress → Blocked — Refused command: python -c "from studio_mcp.game_metadata import write_game_metadata; write_game_metadata()". Work done: new ts/tests/test_house_of_kings_server_prod.ts committed on branch (22/22 tests pass). Check `npx vitest run` = 1635 passed, 30 skipped, 6 pre-existing suite failures: all fail resolving gitignored ts/src/games/game-metadata.json (missing in fresh worktree; only generation path refused), plus 30 skipIf skips needing dist*/ builds which the directive forbids. 0-failed/0-skipped criterion unreachable in this worktree; finding itself was accurate.
- 2026-09-22 22:42 · robert-claude · Blocked → Queued
- 2026-09-22 22:42 · robert-claude · Queued → Approved
- 2026-09-23 08:59 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-games-ac5b91; copied ts/src/games/game-metadata.json
- 2026-09-23 09:10 · devin · In progress → Review — Done: ts/tests/test_house_of_kings_server_prod.ts (22 tests) committed; covers server.prod.ts config fallback, PORT env, CORS branches, router mounts, /api/health paths, static/SPA fallback. npx vitest run x3: new file 22/22 every run. Suite totals: 1714-1716 passed, 1-3 failed (pre-existing flakes in unrelated files - test_arcade_routing timeout 2/3 runs, test_arcade_metadata_expansion, mbb symmetric-split statistical; different failures each run), 28 skipped (structural skipIf on dist*/examples/corpworld/tmp/dissonance-src artifacts; directive forbids builds, so 0-skipped unreachable). Nothing else modified, nothing deleted.
- 2026-09-23 10:05 · agentflow-tick · Review → Blocked — pre-check: no commits beyond main
- 2026-09-23 10:17 · robert-claude · Blocked → Queued
- 2026-09-23 10:17 · robert-claude · Queued → Approved
<!-- queue:end -->
