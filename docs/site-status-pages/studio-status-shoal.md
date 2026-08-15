---
title: "Shoal — Studio Status"
category: Games/Engines/Systems
date: 2026-08-15
tagline: "Wa-Tor-inspired reef sandbox — six-stage performance investigation to production TS-native migration"
type: system
consulting: false
problem: "A Lua-backed ecosystem simulation hit real performance walls under fengari. The question was whether to optimize the Lua runtime, switch to an alternative, or migrate to TypeScript-native — and whether the migration could be done without losing the game's logic."
approach:
  - "Six-stage performance investigation: spatial hash → get_nearby optimization → wasmoon evaluation → TS-native benchmark"
  - "Real production TS-native migration, not a prototype — Lua source preserved, not deleted"
  - "artGen module fully consumed (canvas paths, hunger-aware specs, path caching)"
  - "Devlog posted publicly"
highlights:
  - "151.7x measured speedup after TS-native migration"
  - "Wasmoon evaluated and rejected (loses to fengari in every measured case)"
  - "artGen fully consumed — canvas teardrop fin, radial burst, irregular fragment paths"
  - "Live on itch.io + rfditservices.com arcade with traceable Reddit-driven traffic"
  - "Lua source preserved read-only, not deleted"
stack: ["TypeScript", "Lua", "Vite", "React"]
---

## Current State: Live

Shoal is live on itch.io (Published) and the rfditservices.com arcade. No current open items.

## The Six-Stage Performance Investigation

Shoal started as a Lua-backed game under RFDGameStudio's four-file contract. When it hit real performance walls under fengari (the TypeScript Lua runtime), the investigation went through six real stages:

1. **Spatial hash optimization** — the first real performance work, reducing O(n²) neighbor lookups
2. **get_nearby optimization** — narrowing the spatial query further
3. **Wasmoon evaluation** — tested as an alternative Lua runtime; rejected because it loses to fengari in every measured case
4. **TS-native benchmark** — measured at 130-183x faster than fengari for Shoal's actual workload
5. **Production TS-native migration** — not a prototype, a real migration with 151.7x measured speedup
6. **Lua source preserved** — the original `logic.lua` files remain in the repo, read-only, not deleted

This investigation directly drove ADR-013 (TS-native as the studio default), reinforced with hard measured data rather than preference.

## artGen Consumption

Shoal is one of two real consumers of the shared `artGen` module (the other is SlimeWorld). Direct file verification confirms:

- `ts/src/games/shoal/App.tsx` imports and actively uses `canvasTeardropFinPath`, `canvasRadialBurstPath`, and `canvasIrregularFragmentPath` from `artGen/shapes.ts`
- `ts/src/games/shoal/art/shoal.config.ts` contains hunger-aware spec builders: `buildTeardropFinSpecWithHunger`, `buildAlgaeSpec`, `buildFleshChunkSpec`
- A path-caching/render-profiling layer sits on top (`ts/src/games/shoal/art/pathCache.ts`)

This is ADR-014's realized proof case — shared engine modules consumed by a real production game, not a speculative extraction.

## Deployment

Live on itch.io with a posted devlog. Real traceable Reddit-driven traffic confirmed. Also playable in the rfditservices.com arcade.

---

[&larr; Back to Studio Status](/projects/studio-status/) · [Back to Projects](/projects/)*