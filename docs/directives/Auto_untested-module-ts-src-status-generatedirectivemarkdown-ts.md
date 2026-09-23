# ts/src/status/generateDirectiveMarkdown.ts has no tests while its neighbours do

## 1. Why this exists

This directive was generated from a workspace scan, not written by hand. It matched the
`untested-module` category in `Portfolio/backlog_policy.yaml`, which Robert authorised for
automatic dispatch:

> A module with no test file is the backlog that never empties, and every game added creates more. Purely additive: the directive may create a test file and nothing else, so a bad run costs a deleted file.

Nobody looked at this specific case before it was dispatched. Treat the finding as a
claim to verify, not as an instruction - §5 says what to do if it is wrong.

## 2. Scope

```
ts/src/status/generateDirectiveMarkdown.ts
```

At most 2 file(s). A change that needs more than that is a
different task: stop and report it rather than widening this one.

## 3. The work

`ts/src/status/generateDirectiveMarkdown.ts` has no tests, while other modules in the same folder do. Read it, then write
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
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-auto-untested-module-ts-src-statu-3c3ff6 |
| Base branch | - |
| Base commit | 7b2dfc757e5ac0bf4e313da5173ee32cb9ef607f |
| Policy | untested-module |

**Status log**
- 2026-09-23 01:09 · backlog-policy · none → Queued — generated from a untested-module finding authorised in backlog_policy.yaml
- 2026-09-23 01:13 · backlog-policy · Queued → Approved
- 2026-09-23 09:00 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-statu-3c3ff6; base origin/main (local main differs); copied ts/src/games/game-metadata.json
- 2026-09-23 09:10 · devin · In progress → Review — Created ts/tests/test_directive_tracker.ts (11 tests, all pass) covering generateDirectiveMarkdown: skeleton, summary counts/state labels/order, round-history symbols, empty-entry and zero-round cases, pipe escaping, and a real DIRECTIVE_TRACKER smoke test. Purely additive; nothing else modified or deleted. npx vitest run: my file passes; suite overall shows 6 pre-existing failures unrelated to this change (test_dual_target_deploy.ts x5 ENOENT on gitignored ts/dist-shoal build artifacts - would need npm run build:shoal, which the directive forbids; test_arcade_routing.ts x1 flaky 5s timeout under full-suite load, passes in isolation) plus 28 pre-existing skipped tests.
- 2026-09-23 10:05 · agentflow-tick · Review → Blocked — pre-check: no commits beyond main
- 2026-09-23 11:22 · robert-claude · Blocked → Done
<!-- queue:end -->
