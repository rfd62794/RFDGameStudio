# ts/src/engine/paperDoll/colorResolution.ts has no tests while its neighbours do

## 1. Why this exists

This directive was generated from a workspace scan, not written by hand. It matched the
`untested-module` category in `Portfolio/backlog_policy.yaml`, which Robert authorised for
automatic dispatch:

> A module with no test file is the backlog that never empties, and every game added creates more. Purely additive: the directive may create a test file and nothing else, so a bad run costs a deleted file.

Nobody looked at this specific case before it was dispatched. Treat the finding as a
claim to verify, not as an instruction - §5 says what to do if it is wrong.

## 2. Scope

```
ts/src/engine/paperDoll/colorResolution.ts
```

At most 2 file(s). A change that needs more than that is a
different task: stop and report it rather than widening this one.

## 3. The work

`ts/src/engine/paperDoll/colorResolution.ts` has no tests, while other modules in the same folder do. Read it, then write
tests for the behaviour it actually has - not the behaviour its name suggests.

Cover the real branches: the success path, each error or empty case the code explicitly
handles, and any boundary the code itself tests for. Do not write a test that only
asserts the module imports, and do not assert on a value you had to read off the current
implementation without understanding why it is that value.

Follow the existing test file conventions in this repo. Read a neighbouring test first.

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

- [ ] `python -m pytest -q` passes.
- [ ] Nothing outside §2 was modified.
- [ ] Nothing was deleted.
- [ ] If anything was refused or the finding was wrong, it is reported rather than worked around.

## 7. Report

What you changed and why. The real output of the check command, pasted. Anything about
the finding that was inaccurate. And any refused command, verbatim.

<!-- check: python -m pytest -q -->

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-auto-untested-module-ts-src-engine-paper |
| Base branch | - |
| Policy | untested-module |

**Status log**
- 2026-09-20 15:30 · backlog-policy · none → Queued — generated from a untested-module finding authorised in backlog_policy.yaml
- 2026-09-20 15:30 · backlog-policy · Queued → Approved
- 2026-09-20 15:30 · dispatcher · Approved → In progress — dispatched devin in C:\Github\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-engine-paper
- 2026-09-20 16:00 · claude-heartbeat · In progress → Blocked — run pid 4780 is gone and the directive never moved; started 2026-09-20T15:30:33
- 2026-09-20 20:46 · robert-claude · Blocked → Queued — re-queued: the worktree had no node_modules, so npx tried to download vitest and the confirmation was rejected. Fixed in DirectiveQueueMCP 55a12ee (junction to the main checkout's node_modules).
- 2026-09-20 20:46 · robert-claude · Queued → Approved
- 2026-09-20 20:46 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-engine-paper
- 2026-09-20 20:49 · robert-claude · In progress → Blocked — run died at the same npx confirmation; worktree now has node_modules junctioned, re-queueing
- 2026-09-20 20:49 · robert-claude · Blocked → Queued — worktree now has node_modules + ts/node_modules junctioned (vitest resolves); DirectiveQueueMCP 3f8e2db makes this automatic for future dispatches
- 2026-09-20 20:49 · robert-claude · Queued → Approved
- 2026-09-20 20:49 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-engine-paper
- 2026-09-20 22:30 · claude-heartbeat · In progress → Blocked — run pid 22992 is gone and the directive never moved; started 2026-09-20T20:49:22
- 2026-09-21 14:57 · robert-claude · Blocked → Queued — retry: the run died on 09-19/20, before the dispatch fixes (venv/node_modules junctions); the branch keeps its work
- 2026-09-21 14:57 · robert-claude · Queued → Approved — Robert approved the retry (2026-09-21); the tick dispatches it within the concurrency limit
- 2026-09-22 11:30 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-auto-untested-module-ts-src-engine-paper
- 2026-09-22 11:39 · agentflow-tick · In progress → Blocked — a tool call was rejected: npm run build; resume cap reached (2/2)
- 2026-09-22 12:19 · robert-claude · Blocked → Queued — Robert 2026-09-22: retry after Stall_Guard merges (branch name collides with proportionpresets).
<!-- queue:end -->
