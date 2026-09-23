# SlimeBreeder absorption, step 2.1: discovery earns Regents

## 1. The work

Award typed regents when a bred slime first matches a colour, shape or accent target (and on a region unlock), scaled by target tier along SlimeBreeder's DISCOVERY_REGENT_REWARDS curve (archive/slimebreeder/src/config.ts:21-25), into the existing typed regent inventories (ts/src/games/slimeworld/types.ts:112). Hook points: the match results recorded on the child (games/slimeworld/territory.lua:131-132) and the region-unlock list (games/slimeworld/regionlock.lua:111-125). Reward amounts live in data.yaml. A log line tells the player what they earned.

Read first: `docs/analysis/slimebreeder-absorption.md` (the audit; this is its step-2 item 1), the
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
- 2026-09-23 09:05 · agentflow-tick · none → Queued — suggested by heartbeat: Self-contained Lua/TS logic port with explicit test commands and a non-interactive tool allowlist — matches Devin's dispatch contract.
<!-- queue:end -->
