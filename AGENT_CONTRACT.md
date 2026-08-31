# AGENT_CONTRACT.md

Read by RFDGameStudio tooling (OpenAgentMCP's TestCommandResolver among
others) and by any coding agent (Devin, Windsurf, Claude Code) executing
a directive against this repo. This file did not exist before August 31
2026 — TestCommandResolver was falling back to `None` for lack of it.

## Real test commands

| Suite | Command | Working directory |
|---|---|---|
| Python (main) | `uv run pytest -m "not slow"` | repo root |
| TypeScript | `npx vitest run` | `ts/` |
| RFD_IT_Publishing | `python -m pytest -q -p no:anchorpy -p no:logfire` | `RFD_IT_Publishing/` (no `.venv` by default; global interpreter needs these two plugin exclusions or it fails on unrelated import errors) |

Do not trust any floor number from a prior directive without re-running
these yourself. Every stored number in this repo's directives has gone
stale at least once.

## Completion report requirements

Before reporting any phase complete, run the Verification Auditor
(`studio_mcp/pipeline_audit/floor_claim_diff.py`,
`commit_claim_audit.py`, `flaky_isolator.py` — added August 31 2026) on
your own claims and paste the real tool output in the completion report,
not a prose description of what you believe is true:

- **Test floor claims**: run `floor_claim_diff` against the exact command
  and count you're about to report. If it doesn't match, report the real
  number, not the one you expected.
- **Commit message claims**: if your commit message says "Add X" or
  "Fix Y", run `commit_claim_audit.audit_addition_claim` (for "add"
  claims) or `audit_file_list` (to confirm your commit only touched what
  you say it touched) before writing the message, not after being asked.
- **Any test that failed in a full-suite run but you believe is
  unrelated to your change**: run `flaky_isolator` on it and report
  `flaky` or `real` explicitly, don't just assert "pre-existing" from
  memory.

This does not ask you to decide whether your own work is CERTIFIED —
that judgment stays with whoever reviews the report. It asks you to
arrive with the evidence already gathered, the same evidence a reviewer
would otherwise have to independently re-derive by hand. Real, gathered
evidence in the report; final judgment stays external.

## Known, real, currently-open items (do not re-investigate from scratch)

- `tests/test_arcade_routing.ts::test_game_loader_back_button_returns_clean_url` —
  intermittent timeout, root cause not yet diagnosed (checked Aug 30-31,
  likely vitest environment-setup overhead, not test logic — unconfirmed).
- `tests/test_mbb_balanced_zero_score.ts::test_symmetric_opportunity_post_fix` —
  NOT a bug. Documented, deliberate statistical margin test (10 seeds,
  aggregate `<30%` margin) working around known non-determinism in
  combat/disposal systems' raw `Math.random()` calls outside the seeded
  PRNG. Do not "fix" without understanding this is intentional.
- `studio_mcp/zip_verify/source_resolver.py`'s `no_source_found`
  classification includes several games (e.g. `succession`,
  `house_of_kings_collab`, `chimera_wilds`) whose real source lives under
  `ts/src/games/{slug}/`, which this resolver was never scoped to check.
  Not orphaned games — a labeling gap in a tool scoped only to
  `intake/`/`examples/`.

## rfd-method

Directives in this repo follow the RFD Method (Director → Pipeline →
Agent, spec-first, real test floors, raw proof required). See
`docs/directives/` for real, current examples.