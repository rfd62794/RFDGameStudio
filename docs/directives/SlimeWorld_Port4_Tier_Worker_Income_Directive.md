# SlimeBreeder absorption, step 2.4: worker income scales with tier

## 1. The work

Scale calculate_worker_income (games/slimeworld/codex.lua:8-13) by the slime's snapped tier (snap_to_faction / snap_to_shape_name + TIER_VALUE) instead of a flat 5, keeping the autofeeder and culture multipliers. This replaces SlimeBreeder's display rooms (Robert: no gallery screen).

Read first: `docs/analysis/slimebreeder-absorption.md` (the audit; this is its step-2 item 4), the
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
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-09-23 09:06 · agentflow-tick · none → Queued — suggested by heartbeat: Self-contained tested Lua change matching Devin's directive pattern; no protected-repo conflict.
- 2026-09-24 10:44 · devin-overseer (delegated) · Queued → Approved
<!-- queue:end -->
