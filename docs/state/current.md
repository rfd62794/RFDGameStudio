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

## Phase 1 — Pipeline Audit Module (August 30 2026)

Per the Phase 1 directive, the read-only audit module in `studio_mcp/pipeline_audit/`
is complete. Real observed floors:

- Python (`uv run pytest -m "not slow"`): 588 passed, 1 failed, 31 deselected
- TypeScript (`npx vitest run`): 1644 passed, 2 failed

Open items:

- `_ensure_node_modules` (studio_mcp/tools.py): **fixed** — now runs real `npm install`
  as a fallback and returns `None` only when `package.json` is missing.
- CrossPipeline Version Tracking: **partial** — version-tracking strings appear only
  in RFDGameStudio documentation; RFD_IT_Publishing has zero hits, so the real
  implementation work is not done.

Generated report: [`docs/state/PipelineAuditReport.md`](./PipelineAuditReport.md)
