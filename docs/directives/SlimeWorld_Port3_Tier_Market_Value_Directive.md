# SlimeBreeder absorption, step 2.3: sale prices scale with tier

## 1. The work

Route calculate_tier_value (games/slimeworld/breeding.lua:77-82) into sale pricing: tier value x level scaling x the existing flood multiplier in calculateMarketPrice (ts/src/games/slimeworld/gameLogic.ts:12), with SlimeBreeder's per-slime variance (+/-0.10, archive/slimebreeder/src/utils/slimeGenerator.ts:22) seeded so it is deterministic. Tuning numbers in data.yaml.

Read first: `docs/analysis/slimebreeder-absorption.md` (the audit; this is its step-2 item 3), the
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
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-slimeworld-port3-tier-market-valu-4db720 |
| Base branch | - |
| Base commit | bec77460d65ef854df4873230569ff60c0cc7962 |

**Status log**
- 2026-09-23 09:04 · agentflow-tick · none → Queued — suggested by heartbeat: Self-contained build, exact formula/tests/tool-profile spec'd; Robert already approved audit+step-2 order 2026-09-23; balance/VR sign-off still needed at merge, not build
- 2026-09-24 10:33 · devin-overseer (delegated) · Queued → Approved
- 2026-09-24 10:39 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimeworld-port3-tier-market-valu-4db720; copied ts/src/games/game-metadata.json; lane=strong; model=default
<!-- queue:end -->
