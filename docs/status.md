# RFDGameStudio — Status

*Last updated: September 3 2026*

> **This file is a short summary.** For full history see
> [CHANGELOG.md](../CHANGELOG.md). For future plans see
> [ROADMAP.md](../ROADMAP.md). For architectural decisions see
> [docs/adr/](./adr/). For the generated studio-wide rollup see
> [docs/state/StatusBoard.md](./state/StatusBoard.md).

## Test Floor

|**1649/1654 passing** (137 test files). 5 failures in `tests/test_dual_target_deploy.ts` due to a `dist-shoal` build race when `tests/test_shoal_y8_integration.ts` rebuilds the standalone directory mid-suite; the same tests pass when run in isolation.
> Verification directive (Sep 3 2026): `wire_rust` and `choke_point` scaffolds audited, TypeScript build errors fixed, Fengari Lua→JS array crash not reproducible, both wired into Arcade dev server with passing UI tests.

## Active Projects

| Project | Status | Key Milestone | Tests |
|---|---|---|---|
| Shoal | Live (itch.io + arcade) | TS-native migration complete (151.7x speedup) | Full suite passing |
| Planet of Greed | Live (itch.io + arcade) | Standalone build deployed, shell-compliant | Full suite passing |
| Dissonance Depths | Live (itch.io + arcade) | BrewField migration, 106 art assets, 4 stub phases built | Full suite passing |
| SlimeWorld | Live (arcade) | Onboarding, random starting color, options menu, tab gating | Full suite passing |
| Mutant Battle Ball | Dev | Minimal real game loop (match → earn → buy → equip → match) | Full suite passing |
| Chimera Wilds | Dev | Minimal encounter loop + PaperDoll integration | Full suite passing |
| ScrapCrawl | Dev | Core loop port (Phase A) | Full suite passing |
| AntSim Redux | Dev (in `_check/`) | Phase 4g complete — 120 test anchors, delivery relevance + wander | 120/120 anchors |
| Character Viewer | Tool (arcade) | Real arcade entry, live shape controls | Full suite passing |
| Paper Doll | Engine module | 8 ChimeraLab patterns ported, technique comparison POC | Full suite passing |
| Wire & Rust | Dev (arcade) | Lua-backed prototype wired into Arcade, title + run loop render | Full suite passing |
| Choke Point | Dev (arcade) | Lua-backed tower-defense prototype wired into Arcade, title + grid render | Full suite passing |

## Retired (source preserved)

- **CorpWorld** — removed from registry, source preserved in `examples/corpworld/`
- **KingMaker Squads** — removed from registry, source preserved in `examples/kingmaker-squads/`
- **BrewField** — delisted from arcade, source preserved, enemies ported to Dissonance
- **SlimeBreeder** — removed from registry, source preserved in `ts/src/games/slimebreeder/`
- **SlimeGarden** — removed from registry, source preserved in `ts/src/games/slimegarden/`

## Infrastructure

- **Arcade:** Vite + React + TS + Tailwind v4 + Vitest. 32 registry entries.
- **Status Board:** Arcade page (`?page=status`) + Hugo site pages on rfditservices.com.
- **Publishing:** Butler-based via `RFD_IT_Publishing`. Shoal, Planet of Greed, Dissonance published.
- **ADRs:** 16 recorded (ADR-001 through ADR-016). ADR-014 (shared engine modules default) is the current governing rule for shared code.
- **SDD:** v0.4 is current. v0.1-v0.3 archived.

## Open Decisions Awaiting Robert

1. **Paper Doll technique winner** — 10 techniques compared side-by-side at `http://localhost:5200/`. Robert picks.
2. **Bézier curve POC** — `http://localhost:5199/`. Robert judges if organic enough to pursue.
3. **itch.io visibility** — Shoal, Planet of Greed, Dissonance builds are live on Butler. Draft→Public toggle is Robert's call.
