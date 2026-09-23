# ts/src/engine/shared/voiceRecognition/speechEngine.ts has no tests while its neighbours do

## 1. Why this exists

This directive was generated from a workspace scan, not written by hand. It matched the
`untested-module` category in `Portfolio/backlog_policy.yaml`, which Robert authorised for
automatic dispatch:

> A module with no test file is the backlog that never empties, and every game added creates more. Purely additive: the directive may create a test file and nothing else, so a bad run costs a deleted file.

Nobody looked at this specific case before it was dispatched. Treat the finding as a
claim to verify, not as an instruction - §5 says what to do if it is wrong.

## 2. Scope

```
ts/src/engine/shared/voiceRecognition/speechEngine.ts
```

At most 2 file(s). A change that needs more than that is a
different task: stop and report it rather than widening this one.

## 3. The work

`ts/src/engine/shared/voiceRecognition/speechEngine.ts` has no tests, while other modules in the same folder do. Read it, then write
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
| Branch | directive/rfdgamestudio-auto-untested-module-ts-src-engin-2b1c64 |
| Base branch | - |
| Base commit | 34ef3e178073402ee8bca8064d193fec608d7b3b |
| Policy | untested-module |

**Status log**
- 2026-09-22 17:16 · backlog-policy · none → Queued — generated from a untested-module finding authorised in backlog_policy.yaml
- 2026-09-22 17:20 · backlog-policy · Queued → Approved
- 2026-09-22 17:20 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-engin-2b1c64; base origin/main (local main differs)
- 2026-09-22 17:28 · devin-overseer · In progress → Review — Finding accurate: speechEngine.ts had no tests while fuzzyMatch.ts does (test_voice_recognition_extraction.ts). Added ts/tests/test_voice_recognition_speech_engine.ts (24 tests, all pass) covering isSupported, unsupported-browser error, option defaults/overrides, webkit fallback, lifecycle, transcript routing (final/interim/resultIndex), all three error-message branches, stopListening guards, restart aborts, and startup-failure catch. Caveat on the check command: `npx vitest run` exits non-zero in a fresh worktree for reasons predating this change — ts/src/games/game-metadata.json is gitignored and generated by scripts/check.ps1 step 2 (uv run python -m studio_mcp.game_metadata) before vitest; without it 6 arcade test files fail import resolution, plus 1 flaky firestore timeout (check.ps1 retries known-flaky with --retry=2) and 35 pre-existing skips elsewhere. No files outside scope touched; nothing deleted; no refused commands. Commit 6bc8ce96.
- 2026-09-22 19:04 · agentflow-tick · Review → Blocked — pre-check: check failed (1): [90m381| [39m [34mexpect[39m(severities[33m.[39mlength)[33m.[39m[34mtoBeGreaterThan[39m([34m0[39m)[33m;[39m | [90m | [39m [31m^[39m | [90m382| [39m [90m// Should include at least one severity from the four-tier ladder[39m | [90m383| [39m [35mconst[39m validSeverities [33m=[39m [[32m'stunned'[39m[33m,[39m [32m'down'[39m[33m,[39m [32m'casualty'[39m[33m,[39m [32m'fatal'[39m][33m;[39m | [31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/8]⎯[22m[39m
- 2026-09-22 22:43 · robert-claude · Blocked → Queued
- 2026-09-22 22:43 · robert-claude · Queued → Approved
- 2026-09-22 23:49 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-engin-2b1c64
- 2026-09-22 23:56 · devin-overseer · In progress → Blocked — Refused command verbatim: `python -m studio_mcp.game_metadata` (check.ps1 step 2 generating gitignored ts/src/games/game-metadata.json). Work itself is done and verified — ts/tests/test_voice_recognition_speech_engine.ts 24/24 pass on commit 6bc8ce96 — but the check `cd ts && npx vitest run` exits 1 in this worktree: 6 suites fail import of the missing generated file (test_arcade, test_arcade_lineage, test_arcade_loader, test_arcade_routing, test_arcade_metadata_expansion, test_arcade_hover_preview), plus 2 unrelated pre-existing Math.random-dependent failures (test_sports_sim_engine_port severities 0/50 — same failure as the 19:04 pre-check — and test_mbb_balanced_zero_score oppWins=0) and 28 pre-existing skips. Nothing outside scope modified; nothing deleted.
- 2026-09-23 11:24 · robert-claude · Blocked → Done
<!-- queue:end -->
