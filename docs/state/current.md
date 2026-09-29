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

`studio_mcp/pipeline_audit/` complete. Real floors measured live 2026-09-24:

- Python `uv run pytest -m "not slow"`: 820/0/8 (31 deselected). Full suite incl.
  e2e: 839 passed, 12 failed (all `tests/e2e/*` browser tests), 8 skipped.
- TypeScript `npx vitest run`: 1906/1/9 — sole failure is the flaky 5s
  `test_game_loader_back_button_returns_clean_url`; quiet standalone run: 1907/0/9.
- `_ensure_node_modules`: **fixed** (real `npm install` fallback, `None` only if
  no package.json). CrossPipeline Version Tracking: **fixed** (real hits in repo +
  `packages/itch_publisher`, which superseded the now-absent `RFD_IT_Publishing`).
- `C:/Github/OpenAgentMCP` no longer exists on disk; the AsyncTestRunner port in
  `floor_runner.py` was already committed and stands alone.
- Zip exports confirmed at `C:\Github\RFDGameStudio\intake\<slug>\` — 14 zips, all
  imported, 0 pending.

Report: [`docs/state/PipelineAuditReport.md`](./PipelineAuditReport.md)
