# Port Coin Pusher Arcade into ts/src/games/coin_pusher_arcade

## Read first

- `AGENTS.md` (repo root): conventions (TS-native default, logic purity, no comment churn).
- `docs/RFDGameStudio_DemoPortingRoadmap.md`, Tier 1 table: "Coin Pusher Arcade | Archived, not deployed | Physics-based arcade, no AI agents".
- `ts/src/games/slime_coin/config.ts` and `ts/src/games/slime_coin/App.tsx`: the pattern to follow.
- Source to port (read-only): `examples/coin-pusher-arcade/` (tracked on this branch by the intake commit).

## 1. Why this exists

Coin Pusher Arcade is an AI Studio export: a physics coin-pusher with drops, combos, a reward wheel, special pocket coins, pressure levels and meta-progression. It is Tier 1 on the porting roadmap (real, straightforward TS/React, no unresolved blockers) and is not registered. Porting it gives the arcade a second, distinct pusher next to `slime_coin` (real-time shooter plus two-layer board), as a TS-native `dev` game.

## 2. Scope

Create `ts/src/games/coin_pusher_arcade/` and `ts/tests/test_coin_pusher_arcade_*.ts`, and edit `ts/src/games/registry.ts` (one import, one array entry). Nothing else.

Source files (all under `examples/coin-pusher-arcade/`; `src/` is the game, the rest is AI Studio scaffolding to ignore):

- `examples/coin-pusher-arcade/.env.example` (445 bytes)
- `examples/coin-pusher-arcade/.gitignore` (73 bytes)
- `examples/coin-pusher-arcade/README.md` (542 bytes)
- `examples/coin-pusher-arcade/index.html` (311 bytes)
- `examples/coin-pusher-arcade/metadata.json` (288 bytes)
- `examples/coin-pusher-arcade/package.json` (845 bytes)
- `examples/coin-pusher-arcade/src/App.tsx` (48422 bytes)
- `examples/coin-pusher-arcade/src/components/CoinPusherGame.tsx` (47294 bytes)
- `examples/coin-pusher-arcade/src/components/PocketCoinPickerModal.tsx` (4421 bytes)
- `examples/coin-pusher-arcade/src/components/RewardWheelModal.tsx` (7548 bytes)
- `examples/coin-pusher-arcade/src/data.ts` (7070 bytes)
- `examples/coin-pusher-arcade/src/index.css` (23 bytes)
- `examples/coin-pusher-arcade/src/main.tsx` (231 bytes)
- `examples/coin-pusher-arcade/src/sound.ts` (8225 bytes)
- `examples/coin-pusher-arcade/src/types.ts` (2354 bytes)
- `examples/coin-pusher-arcade/tsconfig.json` (508 bytes)
- `examples/coin-pusher-arcade/vite.config.ts` (708 bytes)

Line counts that matter: `examples/coin-pusher-arcade/src/components/CoinPusherGame.tsx` is 1446 lines and `examples/coin-pusher-arcade/src/App.tsx` is 1029 lines; both are over the 600-line limit and must be split in the port. `examples/coin-pusher-arcade/src/data.ts` (270 lines) exports `COIN_TYPES`, `WHEEL_REWARDS`, `POCKET_COIN_TYPES`, `LEVEL_SETTINGS`, `BOARD_THEMES`. `examples/coin-pusher-arcade/src/types.ts` (113 lines) exports `CoinType`, `WheelReward`, `PocketCoinType`, `PocketCoinInstance`, `BoardObjectType ('peg'|'bumper'|'multiplier'|'tower'|'shield')`, `BoardObject`, `ActiveCoin`, `LevelSettings`, `GameStats`, `BoardTheme`. `examples/coin-pusher-arcade/src/sound.ts` (301 lines) exports a `sound` singleton (`SoundManager`). The source's only imports are `react`, `react-dom/client` and `lucide-react`; it persists `GameStats` via `localStorage` under a `STORAGE_KEY` in `App.tsx`.

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

Target id: `coin_pusher_arcade` (underscore form; the example slug is `coin-pusher-arcade`). Create these files (all new; list them in the report):

1. `ts/src/games/coin_pusher_arcade/types.ts` <!-- new: ts/src/games/coin_pusher_arcade/types.ts -->: the example's types, copied as-is.
2. `ts/src/games/coin_pusher_arcade/data.ts` <!-- new: ts/src/games/coin_pusher_arcade/data.ts -->: the example's constants, copied as-is.
3. `ts/src/games/coin_pusher_arcade/logic/physics.ts` <!-- new: ts/src/games/coin_pusher_arcade/logic/physics.ts --> plus further small modules (`ts/src/games/coin_pusher_arcade/logic/coins.ts` <!-- new: ts/src/games/coin_pusher_arcade/logic/coins.ts -->, `ts/src/games/coin_pusher_arcade/logic/combo.ts` <!-- new: ts/src/games/coin_pusher_arcade/logic/combo.ts -->, `ts/src/games/coin_pusher_arcade/logic/wheel.ts` <!-- new: ts/src/games/coin_pusher_arcade/logic/wheel.ts -->, as the split warrants): the pure simulation extracted from `CoinPusherGame.tsx` (coin motion, collisions with pegs/bumpers/pusher, gutter loss, push-off scoring, combo window, wheel reward application). Pure functions over plain data; no DOM; take an injectable `rng: () => number` instead of calling `Math.random()` so tests are deterministic.
4. `ts/src/games/coin_pusher_arcade/components/BoardCanvas.tsx` <!-- new: ts/src/games/coin_pusher_arcade/components/BoardCanvas.tsx -->, `RewardWheelModal.tsx`, `PocketCoinPickerModal.tsx` (ported from the example, each under 600 lines): rendering and input only; they call the `logic/` modules.
5. `ts/src/games/coin_pusher_arcade/utils/sound.ts` <!-- new: ts/src/games/coin_pusher_arcade/utils/sound.ts -->: port of `examples/coin-pusher-arcade/src/sound.ts` (procedural Web Audio, silent until a user gesture; no audio files).
6. `ts/src/games/coin_pusher_arcade/App.tsx` <!-- new: ts/src/games/coin_pusher_arcade/App.tsx --> (under 600 lines; split state hooks into `hooks/` if needed): the game shell. Wrap in the shared `GameShell`, take `GameRendererProps`, persist `GameStats` with `loadSave`/`writeSave` from `ts/src/engine/shared/persistence.ts` instead of `localStorage`. Reuse shared `TitleScreen`/`EndStateScreen` only where the example already has an equivalent screen.
7. `ts/src/games/coin_pusher_arcade/styles.css` <!-- new: ts/src/games/coin_pusher_arcade/styles.css --> only if the example's `examples/coin-pusher-arcade/src/index.css` (23 bytes) is not enough; keep it small.
8. `ts/src/games/coin_pusher_arcade/config.ts` <!-- new: ts/src/games/coin_pusher_arcade/config.ts -->:
   ```ts
   import React from 'react';
   import type { GameConfig } from '../../engine/types';
   export const coinPusherArcadeConfig: GameConfig = {
     gameId: 'coin_pusher_arcade',
     source: { kind: 'example', slug: 'coin-pusher-arcade' },
     label: 'Coin Pusher Arcade',
     description: 'Arcade-style coin pusher: drops, combos, a reward wheel, special pocket coins, pressure levels and meta-progression.',
     color: '#f59e0b',
     status: 'dev',
     tags: ['coin-pusher', 'arcade'],
     component: React.lazy(() => import('./App')),
   };
   ```
9. Registry: in `ts/src/games/registry.ts` add `import { coinPusherArcadeConfig } from './coin_pusher_arcade/config';` between `demos:imports:begin` and `demos:imports:end`, and `coinPusherArcadeConfig,` just above `// demos:end`. Status stays `dev`.
10. Tests (new): `ts/tests/test_coin_pusher_arcade_logic.ts` <!-- new: ts/tests/test_coin_pusher_arcade_logic.ts --> (data integrity: unique ids in `COIN_TYPES`/`POCKET_COIN_TYPES`/`WHEEL_REWARDS`, `LEVEL_SETTINGS` levels ascending; physics: a coin past the gutter edge is lost, a coin crossing the push-off line scores its `value`, the combo window expires after `comboWindowMs`; seeded rng) and `ts/tests/test_coin_pusher_arcade_registry.ts` <!-- new: ts/tests/test_coin_pusher_arcade_registry.ts --> (entry exists, `status === 'dev'`, `source.slug === 'coin-pusher-arcade'`, `component` defined, `gameId` unique across `GAME_REGISTRY`).

Gameplay must match the example: same coin types, values, levels, wheel rewards. This is a port, not a redesign.

## 4. What NOT to do

- Do not touch `examples/`, `.gitignore`, other games, `ts/src/engine/`, or any `package.json`.
- Do not carry over `@google/genai`, express, dotenv, `vite.config.ts`, `metadata.json`, `.env.example`: the game makes no AI calls.
- Do not change balance numbers or art, or add features. Do not set a status other than `dev`. Do not add the game to `STANDALONE_BUILD_GAMES` or create a `vite.*.config.ts` or standalone entry.
- Do not add or remove comments in files you did not create.
- No file over 600 lines.

## 5. Verification

Run from the worktree root, in this order, and paste the real output tails in the report:

```
cd ts && npx vitest run test_coin_pusher_arcade_logic.ts test_coin_pusher_arcade_registry.ts
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

Done means all of: (a) the files in section 3 exist and `registry.ts` has the one import and one entry; (b) the two new test files pass and the arcade registry/manifest tests still pass; (c) `tsc --noEmit` is clean; (d) every created file is under 600 lines; (e) work is committed on `directive/<slug>` and not pushed. Status row: `Review`, with one line giving test counts. The run does not mark Done and does not merge; Robert merges (end-user visible game).

## 8. Report

Findings first: what was ported, what was split and where, any behaviour you could not preserve. Then evidence: real output tails of the three commands in section 5 and the `wc -l` list. Then one recommended action per open item (for example "playtest the wheel", "decide on standalone build"). List every created file with `<!-- new: path -->`.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; editing `.gitignore` or `examples/`; touching protected repos; installing or fetching anything.

## Required from User

- Nothing before the run. After Review, Robert decides the merge (visual/end-user change).

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-port-coin-pusher-arcade-directive |
| Base branch | - |
| Base commit | b7f3ce3c9433ea94f3d7b6ab51ba5d245f241b68 |

**Status log**
- 2026-10-03 22:44 · robert-claude-laptop · Queued → Approved — lint override: all errors are files the run creates, each marked with new-file markers; main's lint (PR #500) gives 0 errors, this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 01:16 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-port-coin-pusher-arcade-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 01:16 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-port-coin-pusher-arcade-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
