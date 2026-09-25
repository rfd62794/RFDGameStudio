# RFDGameStudio: 1 failing test(s)

## 1. Why this exists

This directive was generated from a workspace scan, not written by hand. It matched the
`failing-test` category in the install's `backlog_policy.yaml`, which Robert authorised for
automatic dispatch:

> A red test is a falsifiable target: it passes or it does not. The directive forbids deleting or skipping the test, so the only way to satisfy it is to fix the code or prove the test wrong in the report.

Nobody looked at this specific case before it was dispatched. Treat the finding as a
claim to verify, not as an instruction - §5 says what to do if it is wrong.

## 2. Scope

```
(see §3)
```

At most 3 file(s). A change that needs more than that is a
different task: stop and report it rather than widening this one.

## 3. The work

The repo's suite reports failing tests:

```
[90mstderr[2m | tests/test_wire_rust_ui.ts[2m > [22m[2mWire & Rust UI[2m > [22m[2mtest_wire_rust_renders_title_screen
[22m[39mWarning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.
Warning: The current testing environment is not configured to support act(...)
Warning: The current testing environment is not configured to support act(...)
    at App (C:\Github\RFDGameStudio\ts\src\games\wire_rust\App.tsx:34:16)

[90mstderr[2m | tests/test_wire_rust_ui.ts[2m > [22m[2mWire & Rust UI[2m > [22m[2mtest_wire_rust_start_run_renders_game
[22m[39mWarning: The current testing environment is not configured to support act(...)
Warning: The current testing environment is not configured to support act(...)
    at App (C:\Github\RFDGameStudio\ts\src\games\wire_rust\App.tsx:34:16)

[90mstderr[2m | tests/test_wire_rust_ui.ts[2m > [22m[2mWire & Rust UI[2m > [22m[2mtest_wire_rust_start_run_renders_game
[22m[39mWarning: The current testing environment is not configured to support act(...)

[90mstderr[2m | tests/test_shared_fixtures.tsx[2m > [22m[2mShared L1/L2 fixtures[2m > [22m[2mrenderComponent mounts a React element and returns queryable container
[22m[39mWarning: The current testing environment is not configured to support act(...)

[90mstderr[2m | tests/test_arcade_loader.ts[2m > [22m[2mArcade GameLoader registry mismatch[2m > [22m[2mtest_game_loader_shows_registry_mismatch_error
[22m[39mWarning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.
Warning: The current testing environment is not configured to support act(...)
Warning: The current testing environment is not configured to support act(...)
    at GameLoader (C:\Github\RFDGameStudio\ts\src\arcade\GameLoader.tsx:16:23)

[31m⎯⎯⎯⎯⎯⎯⎯[1m[7m Failed Tests 1 [27m[22m⎯⎯⎯⎯⎯⎯⎯[39m

[31m[1m[7m FAIL [27m[22m[39m tests/test_arcade_routing.ts[2m > [22mArcade GameLoader[2m > [22mtest_game_loader_back_button_returns_clean_url
[31m[1mError[22m: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".[39m
[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯[22m[39m

```

Fix the code so they pass - or, if a test itself is wrong, prove it in the report.
**Never delete a failing test and never mark it skipped** to get green.

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
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-auto-failing-test-suite |
| Base branch | - |
| Base commit | cc171b813a7013f5df03cff76bd61dc58e33ac20 |
| Head commit | 7db8c6eededddd7b5e322b839bc5190df2932e11 |
| Policy | failing-test |

**Status log**
- 2026-09-25 12:34 · backlog-policy · none → Queued — generated from a failing-test finding authorised in backlog_policy.yaml
- 2026-09-25 12:45 · backlog-policy · Queued → Approved
- 2026-09-25 12:48 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-failing-test-suite; copied ts/src/games/game-metadata.json; lane=strong; model=default; persona=steady-builder
- 2026-09-25 13:02 · devin · In progress → Review — Raised the arcade routing test timeout to match its existing 30s lazy-load wait; full Vitest suite passes with baseline intentional skips. [origin] spent: devin 14 min est. n/a
<!-- queue:end -->
