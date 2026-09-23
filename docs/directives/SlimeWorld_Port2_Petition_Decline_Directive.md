# SlimeBreeder absorption, step 2.2: a Decline button on petitions, and discovered-trait targets

## 1. The work

Restore SlimeBreeder's dismissRequest: a Decline action on a wanderer petition removes it and a replacement is generated immediately (archive behaviour). Lua in games/slimeworld/codex.lua petition functions; UI: a Decline button on the petition card in ts/src/games/slimeworld/components/EconomyTab.tsx. Also, per Robert: petition targets prefer traits the player has discovered, with an occasional aspirational one - the ratio lives in data.yaml (suggest 80/20).

Read first: `docs/analysis/slimebreeder-absorption.md` (the audit; this is its step-2 item 2), the
files it cites for this item, and `archive/slimebreeder/` for the original behaviour. Robert,
2026-09-23 approved the audit and its step-2 order: no display gallery; petitions mostly target
discovered traits with the occasional aspirational one.

Write the tests first (Lua logic: `uv run pytest` tests under `tests/test_slimeworld_*`; TS: vitest).
No new dependencies; do not touch other games; keep `games/slimeworld/data.yaml` the source of any
new numbers. Completion: new tests pass; the full `cd ts && npx vitest run` and the SlimeWorld
pytest files show no new failures against `main`; report before/after counts and commit hashes.

## Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected outright and
  the run ends mid-task. Do not install, download or fetch anything. Do not read outside this
  working directory, and do not use a search, memory or web tool.
- Test commands: `cd ts && npx vitest run <file>` and `uv run pytest -q <file>`.
- Never use `git -C` or `git -c`; run git from the worktree.
- These are the only commands available to you: `npx vitest run`, `uv run pytest`, `git status`,
  `git diff`, `git log`, `git show`, `git add`, `git commit`, `ls`, `cat`, `head`, `tail`, `wc`,
  `grep`, `mkdir`.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never deploy.**
- Update this directive's Status row when you finish or stop partway.
- If a tool call is genuinely blocked, stop and write why in the Status row.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-09-23 09:08 · agentflow-tick · none → Queued — suggested by heartbeat: Self-contained, fully-specified port with verified source/target files and a tests-first spec; matches Devin's build-work profile.
<!-- queue:end -->
