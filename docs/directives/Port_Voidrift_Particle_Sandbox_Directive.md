# Port Voidrift Particle Sandbox into ts/src/games/voidrift_particle_sandbox

## Read first

- `AGENTS.md` (repo root): conventions (TS-native default, logic purity, no comment churn).
- `docs/RFDGameStudio_DemoPortingRoadmap.md`, Tier 2 table: `particle_void` = "VoidRift Redux", cellular-automata sandbox, 12 `MaterialType`s, `MaterialDef`, `buildingDefs`; "three separate registry entries when picked up, not one".
- `ts/src/games/slime_coin/config.ts` and `ts/src/games/slime_coin/App.tsx`: the pattern to follow.
- Source to port (read-only): `examples/voidrift-redux-particle-sandbox/` (tracked on this branch by the intake commit).

## 1. Why this exists

The Particle Sandbox is the `particle_void` demo: a cellular-automata sandbox and factory-construction game (physical materials, pipes, containers, processors, tiered reconstruction progression). It is one of three distinct Sandustry-family projects, is not registered, and is the sibling of the already-registered `voiddrift_redux` (a different game: drone FSM). Port it as its own TS-native `dev` game.

## 2. Scope

Create `ts/src/games/voidrift_particle_sandbox/` and `ts/tests/test_voidrift_particle_sandbox_*.ts`, and edit `ts/src/games/registry.ts` (one import, one array entry). Nothing else. Do not reuse the id `voiddrift_redux` or `voidrift_redux`.

Source files (all under `examples/voidrift-redux-particle-sandbox/`; `src/` is the game, the rest is AI Studio scaffolding to ignore):

- `examples/voidrift-redux-particle-sandbox/.env.example` (445 bytes)
- `examples/voidrift-redux-particle-sandbox/.gitignore` (73 bytes)
- `examples/voidrift-redux-particle-sandbox/README.md` (542 bytes)
- `examples/voidrift-redux-particle-sandbox/index.html` (1411 bytes)
- `examples/voidrift-redux-particle-sandbox/metadata.json` (313 bytes)
- `examples/voidrift-redux-particle-sandbox/package.json` (845 bytes)
- `examples/voidrift-redux-particle-sandbox/src/App.tsx` (34177 bytes)
- `examples/voidrift-redux-particle-sandbox/src/components/BuildPanel.tsx` (26568 bytes)
- `examples/voidrift-redux-particle-sandbox/src/components/FilterPopup.tsx` (7430 bytes)
- `examples/voidrift-redux-particle-sandbox/src/components/Header.tsx` (8483 bytes)
- `examples/voidrift-redux-particle-sandbox/src/components/HelpModal.tsx` (9964 bytes)
- `examples/voidrift-redux-particle-sandbox/src/components/InspectPanel.tsx` (6954 bytes)
- `examples/voidrift-redux-particle-sandbox/src/components/ReconstructionCatalog.tsx` (7038 bytes)
- `examples/voidrift-redux-particle-sandbox/src/index.css` (23 bytes)
- `examples/voidrift-redux-particle-sandbox/src/main.tsx` (231 bytes)
- `examples/voidrift-redux-particle-sandbox/src/simulation/asteroids.ts` (3527 bytes)
- `examples/voidrift-redux-particle-sandbox/src/simulation/buildingDefs.ts` (11638 bytes)
- `examples/voidrift-redux-particle-sandbox/src/simulation/buildings.ts` (39814 bytes)
- `examples/voidrift-redux-particle-sandbox/src/simulation/grid.ts` (16973 bytes)
- `examples/voidrift-redux-particle-sandbox/src/simulation/renderer.ts` (24238 bytes)
- `examples/voidrift-redux-particle-sandbox/src/types.ts` (11845 bytes)
- `examples/voidrift-redux-particle-sandbox/tsconfig.json` (508 bytes)
- `examples/voidrift-redux-particle-sandbox/vite.config.ts` (708 bytes)

Line counts that matter (all in `src/`): `examples/voidrift-redux-particle-sandbox/src/simulation/buildings.ts` 1223 lines, `App.tsx` 943, `examples/voidrift-redux-particle-sandbox/src/simulation/renderer.ts` 761, `examples/voidrift-redux-particle-sandbox/src/components/BuildPanel.tsx` 659 are over the 600-line limit and must be split in the port; `examples/voidrift-redux-particle-sandbox/src/simulation/grid.ts` 579, `types.ts` 441, `examples/voidrift-redux-particle-sandbox/src/simulation/buildingDefs.ts` 382 are under. Exports worth knowing: `types.ts` has `enum MaterialType` (VACUUM=0, DUST, GAS, LIQUID, SOLID, PLASMA, VOID_CRYSTAL, MINERAL_SLURRY, REACTIVE_VAPOR, CONDENSATE, LUMINITE, STRUCTURAL_SOLID=11), `interface MaterialDef`, and `MATERIAL_DEFS: Record<MaterialType, MaterialDef>`; `examples/voidrift-redux-particle-sandbox/src/simulation/grid.ts` has `GRID_WIDTH = 320`, `GRID_HEIGHT = 200`, `TOTAL_CELLS`, `ASTEROID_ZONE_HEIGHT = 40`, `class CellularGrid`; `examples/voidrift-redux-particle-sandbox/src/simulation/buildingDefs.ts` has `BUILDING_TILE = 8`, `BUILDING_DEFS: BuildingDef[]`, `getMaterialState(mat)`, `createDefaultFilter(def, buildingId)`; `examples/voidrift-redux-particle-sandbox/src/simulation/buildings.ts` has `TILES_X = 40`, `TILES_Y = 25`, `snapToTile`, `tileToCA`, `computeRoute`, `computeSegmentDirection`, `updatePipeFlowParticles`, `class BuildingManager`; `examples/voidrift-redux-particle-sandbox/src/simulation/asteroids.ts` has `class AsteroidManager`; `examples/voidrift-redux-particle-sandbox/src/simulation/renderer.ts` has `class GameRenderer`. The source imports only `react`, `react-dom/client`, `lucide-react`; it makes no network or AI calls.

### Repo facts (pasted; do not go looking for them)

- Registry: `ts/src/games/registry.ts` exports `GAME_REGISTRY: GameConfig[]`. Demo
  configs go between the `// demos:imports:begin` / `// demos:imports:end` lines (imports) and
  above the `// demos:end` line (array entry), as `ledgerConfig`, `systemicExtractConfig` do.
- `GameConfig` (from `ts/src/engine/types.ts`): `gameId: string; label: string; description?: string;
  color?: string; status?: GameStatus ('stable'|'beta'|'dev'|'external'|'tool'|'retired');
  component?: React.LazyExoticComponent<React.ComponentType<GameRendererProps>>; genre?: PrimaryGenre;
  tags?: string[]; source?: DemoSource;` where `DemoSource = { kind: 'example'; slug: string } | { kind: 'sibling'; repo: string }`
  and `GameRendererProps = { session: GameSession }`. `PrimaryGenre` is a closed list that includes `'idle-incremental'`;
  if none fits, omit `genre` (slime_coin does this).
- Pattern to copy: `ts/src/games/slime_coin/config.ts`:
  ```ts
  import React from 'react';
  import type { GameConfig } from '../../engine/types';
  export const slimeCoinConfig: GameConfig = {
    gameId: 'slime_coin', label: 'SlimeCoin', description: '...', color: '#a855f7', status: 'dev',
    tags: ['coin-pusher', 'real-time'],
    component: React.lazy(() => import('./App')),
  };
  ```
  Demo-origin configs also carry `source: { kind: 'example', slug: '<examples dir name>' }` (see `ts/src/games/antsim_redux/config.ts`).
  slime_coin's layout: `App.tsx`, `components/`, `config.ts`, `styles.css`, `types.ts`, `ts/src/games/slime_coin/utils/sound.ts`.
- Shared UI to reuse instead of bespoke chrome: `ts/src/ui/components/` (`Badge`, `EndStateScreen`, `StatBar`, `Panel`,
  `MoreGamesByMe`, `TitleScreen`, `OnboardingGate`), `ts/src/components` (`GameShell`), `ts/src/engine/shared/persistence.ts`
  (`loadSave<T>(key, opts?)`, `writeSave<T>(key, value, opts?)`, `clearSave(key)`). Do not use `localStorage` directly.
- Dependencies available in `ts/package.json`: react 18, lucide-react, motion, tailwind v4. Do NOT add dependencies;
  the example's `@google/genai`, express, dotenv are not used by its source and must not be carried over.
- Test layout: vitest, jsdom, `ts/vite.config.ts` includes `tests/**/*.{ts,tsx}` (excludes `tests/_shared`, `tests/_setup`).
  Test files live flat in `ts/tests/` named `test_<topic>.ts` / `.tsx`. Pure-logic tests import from `../src/games/<id>/...`;
  chrome/wiring tests read component source with `readFileSync(resolve(import.meta.dirname, '../src/games/<id>/App.tsx'), 'utf8')`
  (see `ts/tests/test_voiddrift_redux_chrome.ts`). Game logic must be pure (no I/O, no rendering) so it is unit-testable.
- Real test command (verified on the base commit, run from the worktree root):
  `cd ts && npx vitest run test_artgen_seeded_random.ts` printed `Test Files 1 passed (1)`, `Tests 2 passed (2)`,
  `Duration 23.08s`. Expect ~25-45 s startup per invocation. Run only your own test files, one invocation at a time.
- Type check: `cd ts && npx tsc --noEmit -p .` (npm run build runs `tsc` first). Do not run the full `npm test` suite more than once, at the end.
- Repo convention (AGENTS.md): do not add or remove comments in existing code unless asked; files you write stay under 600 lines;
  new behaviour goes in small new modules (SOLID/SRP/KISS); shared engine code under `ts/src/engine/shared/` is checked before writing new logic (ADR-014).

## 3. The work

Target id: `voidrift_particle_sandbox` (the example slug is `voidrift-redux-particle-sandbox`; its folder keeps the source's "voidrift" spelling). Create these files (all new; list them in the report):

1. `ts/src/games/voidrift_particle_sandbox/types.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/types.ts -->: the example's `examples/voidrift-redux-particle-sandbox/src/types.ts`, copied as-is (441 lines).
2. `ts/src/games/voidrift_particle_sandbox/simulation/grid.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/simulation/grid.ts -->, `asteroids.ts`, `buildingDefs.ts`: copied as-is (imports fixed), they are under 600 lines.
3. `ts/src/games/voidrift_particle_sandbox/simulation/buildings.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/simulation/buildings.ts --> split into small modules, for example `ts/src/games/voidrift_particle_sandbox/simulation/routing.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/simulation/routing.ts --> (`snapToTile`, `tileToCA`, `computeRoute`, `computeSegmentDirection`), `ts/src/games/voidrift_particle_sandbox/simulation/flowParticles.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/simulation/flowParticles.ts --> (`spawnFlowParticle`, `updatePipeFlowParticles`) and `ts/src/games/voidrift_particle_sandbox/simulation/buildingManager.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/simulation/buildingManager.ts --> (`BuildingManager`), each under 600 lines; keep exports and behaviour identical, and re-export from `ts/src/games/voidrift_particle_sandbox/simulation/buildings.ts` only if that keeps the diff smaller.
4. `ts/src/games/voidrift_particle_sandbox/simulation/renderer.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/simulation/renderer.ts --> (761 lines) split into two modules under 600 lines (for example `renderer.ts` plus `rendererOverlays.ts`), canvas drawing only.
5. `ts/src/games/voidrift_particle_sandbox/components/`: port `BuildPanel` (split in two to get under 600), `FilterPopup`, `Header`, `HelpModal`, `InspectPanel`, `ReconstructionCatalog`. Where the example has a Header with menu/exit chrome, wrap the game in the shared `GameShell` and use the shared UI components instead of bespoke copies.
6. `ts/src/games/voidrift_particle_sandbox/App.tsx` <!-- new: ts/src/games/voidrift_particle_sandbox/App.tsx --> (under 600 lines; move the sim loop and input handling into `hooks/` modules): takes `GameRendererProps`. If the source persists anything, use `loadSave`/`writeSave` from `ts/src/engine/shared/persistence.ts`, not `localStorage`. Port `index.html`'s title/meta needs only if the arcade shell requires them (it does not for slime_coin).
7. `ts/src/games/voidrift_particle_sandbox/config.ts` <!-- new: ts/src/games/voidrift_particle_sandbox/config.ts -->:
   ```ts
   import React from 'react';
   import type { GameConfig } from '../../engine/types';
   export const voidriftParticleSandboxConfig: GameConfig = {
     gameId: 'voidrift_particle_sandbox',
     source: { kind: 'example', slug: 'voidrift-redux-particle-sandbox' },
     label: 'Voidrift Particle Sandbox',
     description: 'Cellular-automata sandbox and factory builder: twelve physical materials, pipes, containers, processors and tiered reconstruction.',
     color: '#a78bfa',
     status: 'dev',
     tags: ['cellular-automata', 'sandbox', 'factory'],
     component: React.lazy(() => import('./App')),
   };
   ```
8. Registry: in `ts/src/games/registry.ts` add `import { voidriftParticleSandboxConfig } from './voidrift_particle_sandbox/config';` between `demos:imports:begin` and `demos:imports:end`, and `voidriftParticleSandboxConfig,` just above `// demos:end`. Status stays `dev`.
9. Tests (new): `ts/tests/test_voidrift_particle_sandbox_sim.ts` <!-- new: ts/tests/test_voidrift_particle_sandbox_sim.ts --> (pure logic: `MATERIAL_DEFS` has an entry for each of the 12 `MaterialType` values and ids match keys; `BUILDING_DEFS` ids unique; `snapToTile`/`tileToCA` round-trip on tile corners and stay inside `TILES_X` x `TILES_Y`; `computeRoute` between two free tiles returns a connected path whose consecutive points are adjacent; `new CellularGrid()` has `TOTAL_CELLS` cells and, after placing one `GAS` cell and stepping a bounded number of ticks, material count is conserved) and `ts/tests/test_voidrift_particle_sandbox_registry.ts` <!-- new: ts/tests/test_voidrift_particle_sandbox_registry.ts --> (entry exists, `status === 'dev'`, `source.slug === 'voidrift-redux-particle-sandbox'`, `component` defined, `gameId` unique across `GAME_REGISTRY` and different from `voiddrift_redux`). Read the real signatures before writing assertions; if one assumed above does not hold, assert what the code does and say so in the report.

Gameplay and simulation behaviour must match the example. This is a port, not a redesign.

## 4. What NOT to do

- Do not touch `examples/`, `.gitignore`, other games, `ts/src/engine/`, or any `package.json`.
- Do not carry over `@google/genai`, express, dotenv, `vite.config.ts`, `metadata.json`, `.env.example`.
- Do not change simulation rules, material numbers or art, or add features. Do not set a status other than `dev`. Do not add a standalone build, `vite.*.config.ts`, or entry in `STANDALONE_BUILD_GAMES`.
- Do not modify `ts/src/games/voiddrift_redux/`.
- Do not add or remove comments in files you did not create.
- No file over 600 lines.

## 5. Verification

Run from the worktree root and paste real output tails in the report:

```
cd ts && npx vitest run test_voidrift_particle_sandbox_sim.ts test_voidrift_particle_sandbox_registry.ts
cd ts && npx vitest run test_arcade_registry_directive.ts test_arcade_manifest.ts test_arcade_metadata_expansion.ts
cd ts && npx tsc --noEmit -p .
```

Baseline for the command shape (verified): `cd ts && npx vitest run test_artgen_seeded_random.ts` gives `Tests 2 passed (2)` in about 23 s. Then run `cd ts && npm test` once at the end and report passing and failing counts; failures that also fail on the base commit are reported, not fixed. Also report `wc -l` of every file you created (all under 600).

## 6. Rules for this run

- This run is non-interactive. Any tool call that needs a confirmation prompt kills the run. No installs, no downloads, no network fetches, no `npm install`/`npx` of anything not already in `ts/node_modules`.
- Read and write only inside this worktree. No absolute paths to this repo's own checkout anywhere in code, tests, docs or commit messages; use repo-relative paths.
- Do not search, glob or hunt for files. Every path you need is listed in this directive. If something is missing or a command fails for a reason you cannot fix from the facts here, STOP and write the reason in the Status row; do not improvise.
- Never commit to main, never push, never deploy. Work stays on the branch `directive/<slug>` the dispatcher created. Commit on that branch only.
- No scratch or debug files in the tree. Use `.devin-scratch/` (untracked) for anything temporary.
- Mark every file this run creates with `<!-- new: path -->` in your report (and, for markdown, as the first line); source files created are listed in the report, not marked in code (do not add header comments to code).
- Free models only: if any model configuration is touched, it must name free models only; this directive does not require touching model config, so default to touching none.
- Visual and end-user-facing merges are Robert's. The run stops at Review; it does not merge or mark Done.
- Do not edit `.gitignore`, anything under `examples/` (read-only source), protected repos, or other games' directories.

## 7. Completion criteria

Done means all of: (a) the files in section 3 exist and `registry.ts` has the one import and one entry; (b) the two new test files pass and the arcade registry/manifest tests still pass; (c) `tsc --noEmit` is clean; (d) every created file is under 600 lines; (e) work is committed on `directive/<slug>` and not pushed. Status row: `Review` with one line of test counts. The run does not mark Done and does not merge; Robert merges (end-user visible game).

## 8. Report

Findings first: what was ported, how the four oversized files were split, any behaviour you could not preserve. Then evidence: real output tails of the section 5 commands and the `wc -l` list. Then one recommended action per open item. List every created file with `<!-- new: path -->`.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; editing `.gitignore` or `examples/`; touching protected repos; installing or fetching anything.

## Required from User

- Nothing before the run. After Review, Robert decides the merge (visual/end-user change).

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-03 22:44 · robert-claude-laptop · Queued → Approved — lint override: all errors are files the run creates, each marked with new-file markers; main's lint (PR #500) gives 0 errors, this queue MCP process still runs pre-fix lint until reconnect
<!-- queue:end -->
