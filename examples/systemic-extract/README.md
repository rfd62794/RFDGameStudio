# Systemic Extract

A 2D top-down systemic extraction sandbox. You deploy from a safe sanctuary
overworld into one of four dungeon sectors, survive spreading hazards and
escalating hives on an ECS-driven simulation, and extract with salvage.

- **Arcade id:** `systemic_extract` → `/arcade/systemic_extract/`
- **Origin:** Google AI Studio export, intake `0.1.0R1` (see
  `intake/systemic-extract/MANIFEST.md`). Commit `75277c70` is the untouched
  baseline; diff against it to see every local change.
- **Stack:** React 19, Vite 6, Tailwind v4, TypeScript. Client-only, with no
  server and no Gemini calls. Saves go to IndexedDB (`systemic_extract_anchor_db`).

## Commands

```bash
npm install
npm run dev        # http://localhost:3000/arcade/systemic_extract/
npm test           # headless Simulation tests (vitest)
npm run lint       # tsc --noEmit
npm run build      # dist/, base /arcade/systemic_extract/
```

Publishing: build here, then `studio_deploy_arcade` (it copies `dist/` into
the site's `static/arcade/systemic_extract/`). Deploying is a separate,
confirmed step.

## Architecture

| Area | Files | Notes |
|---|---|---|
| Entry | `App.tsx` → `components/GameViewport.tsx` → `RaidView.tsx` | One contiguous overworld + dungeon view ("ADR 011 megamap"). |
| Simulation | `game/simulation/simulation.ts` | `Simulation.update(dt)` runs a fixed-rate `Schedule`: 60 Hz input/movement/projectiles/extraction, 30 Hz swarm separation, 10 Hz targeting/AI/overclock/build, 2 Hz hazard spread/escalation/hive spawning. Headless: no DOM needed. |
| ECS | `game/ecs.ts`, `game/systems/*.ts`, `game/core/system-types.ts` | Component maps on `World`; one file per system. |
| Maps | `game/map.ts` | 200×200 overworld (home at center, 4 cardinal gates, 4 corner specialists) and 4 dungeon generators. |
| Rendering | `game/canvas-renderer.ts` | Canvas 2D, camera lerp; reads `Simulation` state only. |
| Meta progression | `backend/hideout-service.ts`, `backend/storage.ts`, `backend/item-registry.ts` | "Backend" is an in-browser service with injected storage; the REST/FastAPI wording in the inspector is simulated. |
| React glue | `hooks/useRaidSimulation.ts` | Owns the Simulation + renderer, the RAF loop, and HUD state. |

## Improvement workflow

Two ways to change this game. Pick one per change; mixing them loses work.

1. **Local (preferred from now on).** Edit here, run `npm test`, `npm run lint`,
   and play it. Add a test next to the system you touch.
2. **Back in AI Studio.** Drop the new export in `intake/systemic-extract/` and
   run intake, then `studio_promote_to_examples`. **Promotion overwrites
   `src/`, `package.json`, and this README with the zip's contents**, so local
   edits must be re-applied. Git has both sides, so a three-way diff against
   the baseline commit shows what to carry forward. Verify every AI Studio
   completion claim by diff, grep, and running it.

## Backlog (from the 0.1.0R1 port audit, 2026-09-18)

Evidence-backed findings, highest impact first:

1. **The hideout meta loop is orphaned.** `components/HideoutView.tsx` is not
   imported anywhere, so the Deconstructor, Research Bench, Fabricator, and
   Deployment Bay panels (and `useHideoutState`) are unreachable. In play,
   only `hideoutBackend.postRaidExtract` runs; `postHideoutDeconstruct`,
   `postResearchBrainstorm`, and `postHideoutCraft` never do. Players collect
   "Inert Scrap Matter … for Faraday deconstruction" with nowhere to spend it.
   This most likely happened when ADR 011 replaced the root view. Decide how
   these reach the megamap (e.g. the corner specialist buildings).
2. **The simulation is nondeterministic.** There are 26 `Math.random()` calls
   in 11 files. A seeded RNG on `Simulation` would make balance tests and
   replays possible.
3. **The ADRs are missing.** Comments cite ADR 002–011 (about 130 times), but
   no ADR documents came with the export. Recover them from the AI Studio chat
   if possible; otherwise write down the rules the code actually enforces.
4. **Loose types:** 19 `any` / `as any` uses.
5. **No favicon:** every page load 404s on `/favicon.ico`. It's harmless, but
   it adds noise to the console.
6. **`metadata.json` claims `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`** even
   though nothing uses Gemini. It only matters if the game goes back to AI Studio.
