# Studio State — Retired

**This file is retired.** Per ADR-017 (Four-Document Documentation
Architecture), the monolithic `current.md` has been replaced with four
distinct document types:

| Document | Location | Purpose |
|---|---|---|
| **CHANGELOG.md** | [`/CHANGELOG.md`](../../CHANGELOG.md) | What changed (studio-wide summary) |
| **ROADMAP.md** | [`/ROADMAP.md`](../../ROADMAP.md) | What's next |
| **ADRs** | [`/docs/adr/`](../adr/) | Why decisions were made |
| **Status** | [`/docs/status.md`](../status.md) | Where things stand now |

Full per-project detail is in each project's own `CHANGELOG.md`:

- [`ts/src/engine/paperDoll/CHANGELOG.md`](../../ts/src/engine/paperDoll/CHANGELOG.md)
- [`ts/src/games/planetofgreed/CHANGELOG.md`](../../ts/src/games/planetofgreed/CHANGELOG.md)
- [`games/shoal/CHANGELOG.md`](../../games/shoal/CHANGELOG.md)
- [`games/dissonance/CHANGELOG.md`](../../games/dissonance/CHANGELOG.md)
- [`games/slimeworld/CHANGELOG.md`](../../games/slimeworld/CHANGELOG.md)
- [`ts/src/games/mutant_battle_ball/CHANGELOG.md`](../../ts/src/games/mutant_battle_ball/CHANGELOG.md)
- [`ts/src/games/character_viewer/CHANGELOG.md`](../../ts/src/games/character_viewer/CHANGELOG.md)
- [`_check/antsim-redux/CHANGELOG.md`](../../_check/antsim-redux/CHANGELOG.md)

The full content of this retired file is preserved in git history.

> For the current verified floor, see [`/docs/status.md`](../status.md) (last updated September 3 2026).

## Phase 1 — Pipeline Audit Module (regenerated September 24 2026)

Per the Phase 1 directive, the read-only audit module in `studio_mcp/pipeline_audit/`
is complete. Real observed floors, measured live 2026-09-24 on the directive branch:

- Python (`uv run pytest -m "not slow"`, convention floor): 820 passed, 0 failed,
  8 skipped (all zip_verify conditional skips), 31 deselected
- Python (`uv run pytest`, full suite incl. e2e): 839 passed, 12 failed
  (all `tests/e2e/*` browser tests), 8 skipped
- TypeScript (`npx vitest run`): 1906 passed, 1 failed, 9 skipped — the failure is
  the flaky 5s-timeout `test_game_loader_back_button_returns_clean_url`; a quiet
  standalone run same evening was fully green at 1907 passed, 0 failed, 9 skipped.

Open items (reported, not fixed — per directive):

- `_ensure_node_modules` (studio_mcp/tools.py): **fixed** — real `npm install`
  fallback at tools.py:1015-1024, returns `None` only when `package.json` is missing.
- CrossPipeline Version Tracking: **fixed** — `_is_dist_stale`, `--userversion`,
  `deployed_version` have real hits in both RFDGameStudio and `packages/itch_publisher`
  (the in-repo workspace member that superseded the `C:\Github\RFD_IT_Publishing`
  checkout, which no longer exists on disk).
- OpenAgentMCP (`C:/Github/OpenAgentMCP`): **repo no longer exists on disk** — the
  AsyncTestRunner port into `floor_runner.py` was already committed earlier and
  stands alone; the `openagent` MCP service is also unreachable.
- AI Studio zip exports confirmed at `C:\Github\RFDGameStudio\intake\<slug>\<slug>_v*.zip`
  (gitignored): 14 exports across 8 slugs, all imported — 0 pending.

Generated report: [`docs/state/PipelineAuditReport.md`](./PipelineAuditReport.md)
