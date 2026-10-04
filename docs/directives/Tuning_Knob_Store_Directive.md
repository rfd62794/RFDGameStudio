# Tuning knob registry and dev-only override store (S/M)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open): `docs/superpowers/specs/2026-10-04-tuning-tools.md` (sections b1, b2), `ts/src/engine/runtime.ts`, `ts/src/engine/loader.ts` (lines 140-170, `loadGameFiles`), `ts/src/engine/types.ts`.

## 1. Why this exists

Robert 2026-10-04 17:13: "Tuning will take time so we will need tools for the engine to make tuning per game easier." Balance numbers are scattered: scrapcrawl `PLAYER_MAX_HP = 10` and `LOSS_DAMAGE = 2` are bare TS consts (`ts/src/games/scrapcrawl/utils/runEnd.ts:12-13`), chimera_wilds `baseline_player` power 90 / endurance 85 and horse_racing `race.overround: 1.12` are YAML read by Lua through `loadGame` (`ts/src/engine/runtime.ts:5-9`). There is one place to put a knob declaration and no way to override a number without editing the file. This directive builds the generic store only: the schema types, a registry, a dev-only override store, and an override hook in `loadGame`. The panel, sweep tool and per-game adoption are separate directives that depend on this one.

Measured on origin/main `1f52374a` (scratch worktree, 2026-10-04): `uv run python --version` gives `Python 3.12.12`; `cd ts && npx vitest run test_gameshell.tsx` gives `Tests  8 passed (8)`; `cd ts && npx tsc --noEmit` prints nothing (clean). The test environment is jsdom (`ts/vite.config.ts:80`), so `window` and `localStorage` exist in tests.

## 2. Scope

1. New `ts/src/engine/tuning/types.ts`.
2. New `ts/src/engine/tuning/store.ts`.
3. New `ts/src/engine/tuning/applyData.ts`.
4. New `ts/src/engine/tuning/index.ts` (re-exports).
5. Edit `ts/src/engine/runtime.ts`: `loadGame` gains an optional third argument and applies overrides.
6. New test `ts/tests/test_tuning_store.ts`.

## 3. The work

New-file markers: put `// new: <path>` as the first line of every new `.ts` file.

**Step 1: `ts/src/engine/tuning/types.ts`.** Exactly these exports:

```ts
// new: ts/src/engine/tuning/types.ts
export type KnobSource =
  | { kind: 'data'; file: string; path: string }   // YAML, e.g. file 'games/chimera_wilds/data.yaml', path 'baseline_player.power'
  | { kind: 'const'; file: string; name: string }; // TS const, e.g. file 'ts/src/games/scrapcrawl/utils/runEnd.ts', name 'LOSS_DAMAGE'

export interface KnobDef {
  key: string;      // '<gameId>.<name>'. For kind 'data' the key MUST be '<gameId>.<path>' (the part after the first dot is the dotted path into data.yaml)
  label: string;
  group: string;
  min: number; max: number; step: number;
  default: number;
  affects: string;  // one sentence: what the player feels when this moves
  source: KnobSource;
}
export type Overrides = Record<string, number>;
export interface Target { id: string; metric: string; scenario?: string; min: number; max: number; note: string }
export type Metrics = Record<string, number>;
export interface GameTuning {
  gameId: string;
  knobs: KnobDef[];
  targets: Target[];
  scenarios?: string[];
  simulate?: (ctx: { seed: number; scenario: string }) => Metrics;
}
```

**Step 2: `ts/src/engine/tuning/store.ts`.** Pure module, no React. Exports:

- `devTuningEnabled(search: string): boolean`: true only when `new URLSearchParams(search).get('dev') === '1'`. Anything else (no `dev`, `dev=0`, `dev=true`) is false.
- `tuningStorageKey(gameId: string): string` returns `` `rfd.tuning.${gameId}` ``.
- `readDevOverrides(gameId: string, search: string, storage?: Pick<Storage,'getItem'>): Overrides`: returns `{}` unless `devTuningEnabled(search)`. Otherwise parses the JSON in `storage.getItem(tuningStorageKey(gameId))` (default `window.localStorage`), keeps only entries whose key starts with `` `${gameId}.` `` and whose value is a finite number, and returns them. Any throw (no storage, bad JSON) returns `{}`. Never throws.
- `writeDevOverrides(gameId: string, overrides: Overrides, storage?)` and `clearDevOverrides(gameId: string, storage?)`: write or remove that key; swallow storage errors.
- `withOverrides<T>(overrides: Overrides, fn: () => T): T`: pushes a module-level scope, runs `fn`, and restores the previous scope in a `finally`. Works with no `window`. It ignores the URL.
- `getOverrides(gameId: string): Overrides`: the scoped overrides (those keys that start with `` `${gameId}.` ``) merged over `readDevOverrides(gameId, window.location.search)` (use `''` when `typeof window === 'undefined'`). The scope wins.
- `defineKnob(def: KnobDef): { get(): number }` registers `def` in a module-level `Map` by `key` (re-defining the same key replaces it; no throw) and returns `{ get: () => tuned(def.key) }`.
- `tuned(key: string): number`: finds the def (throws `Error('unknown knob: ' + key)` when absent), takes `getOverrides(gameId)[key]` where `gameId` is the part of the key before the first `.`, else `def.default`, and clamps the result to `[def.min, def.max]`.
- `registeredKnobs(gameId?: string): KnobDef[]`.

**Step 3: `ts/src/engine/tuning/applyData.ts`.** One exported pure function:

```ts
export function applyDataOverrides(data: Record<string, unknown>, gameId: string, overrides: Overrides): string[]
```
For each override key that starts with `` `${gameId}.` ``, take the rest as a dotted path, split on `.`, walk `data` (numeric segments index arrays, and index objects by their string key, so `waves.1.enemies.0.hp` works on a YAML map keyed `1`), and when the final leaf exists and is a finite number, assign the override and add the key to the returned list. When any segment is missing or the leaf is not a number, skip that key silently (it is probably a TS-const knob). It mutates `data` and never throws.

**Step 4: `ts/src/engine/tuning/index.ts`.** `export * from './types'; export * from './store'; export * from './applyData';`

**Step 5: `ts/src/engine/runtime.ts`.** Change `loadGame` to:

```ts
export function loadGame(gameId: string, seed: number = 42, overrides?: Overrides): GameSession {
  const files: GameFiles = loadGameFiles(gameId);
  applyDataOverrides(files.data, gameId, overrides ?? getOverrides(gameId));
  const executor = new LuaExecutor(files.logic, seed, files.engineSource);
  return { gameId, files, executor };
}
```
with the two new imports from `./tuning`. Nothing else in that file changes. `files.data` is a fresh `yaml.load` result per call (`loader.ts:147`), so mutating it is safe.

**Step 6: `ts/tests/test_tuning_store.ts`.** Cases (each its own `it`, jsdom, use `localStorage` and `window.history.pushState({}, '', '/?dev=1')` to set the URL; reset both in `afterEach`):

1. `devTuningEnabled('?dev=1')` true; `''`, `'?dev=0'`, `'?dev=true'`, `'?game=x'` false.
2. Production gate: write `{"chimera_wilds.baseline_player.power": 50}` to `rfd.tuning.chimera_wilds`; with the URL at `/`, `loadGame('chimera_wilds').files.data` `baseline_player.power` is 90 and `getOverrides('chimera_wilds')` is `{}`.
3. With the URL at `/?dev=1` and the same storage value, `baseline_player.power` is 50 and `endurance` is still 85.
4. `withOverrides({'chimera_wilds.baseline_player.power': 80}, () => loadGame('chimera_wilds'))` has power 80 even with the URL at `/` and storage empty; a `loadGame` after it returns power 90 (scope restored, also when `fn` throws).
5. `readDevOverrides` returns `{}` for bad JSON, for non-finite values, and for keys of another game.
6. `applyDataOverrides` on a literal `{ waves: { 1: { enemies: [{ hp: 4 }] } }, name: 'x' }`: `waves.1.enemies.0.hp` applies; `name` (string leaf) and `nope.deep` (missing) are skipped; the return list names only applied keys.
7. `defineKnob({ key:'t.x', min:1, max:5, default:2, ... source:{kind:'const',file:'f',name:'X'} })`: `get()` is 2; inside `withOverrides({'t.x': 9}, ...)` it is 5 (clamped); `tuned('t.unknown')` throws.

## 4. What NOT to do

- No React, no panel, no sweep, no per-game `tuning.ts`: those are other directives.
- Do not change any number in any game or YAML file. Do not touch `ts/src/engine/executor.ts`, Lua, `loader.ts`, or any `ts/src/games/*` file.
- Do not read `localStorage` anywhere except inside `readDevOverrides`, and never when `devTuningEnabled` is false.
- Do not add a dependency. Do not use `import.meta.glob`.

## 5. Verification

`cd ts && npx vitest run test_tuning_store.ts` expects `Tests  7 passed (7)`; paste the real tail.
Then regression: `cd ts && npx vitest run test_chimera_wilds_balance.ts` expects `Tests  2 passed (2)` (baseline today: `Tests  2 passed (2)`), and `cd ts && npx vitest run test_gameshell.tsx` expects `Tests  8 passed (8)`.
Then `cd ts && npx tsc --noEmit`: no new errors (baseline: no output).
Then `git status`: only the 6 files in Scope appear.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do NOT run `npm run build:*`, `vite-node`, `vite build` or any `uv run python -m studio...` module (the sandbox refuses them; the controller
  runs the sweep tool and builds). The only commands you run are `cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`
  (errors that mention only `game-metadata.json` are pre-existing in a fresh worktree: ignore those, fix any other), `git status`, `git diff`, and git add/commit on your branch.
- Do not run `git merge origin/main`. Use `git fetch origin` then `git rev-list --count HEAD..origin/main` to see whether main moved.
- Files you edit keep their existing line endings; new files use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.
- Overrides must never reach players: nothing you write may read localStorage or apply an override unless the URL has `?dev=1` (or an in-process `withOverrides` scope in tests and tools).

## 7. Completion criteria

- [ ] The 6 files in Scope exist; `ts/src/engine/runtime.ts` changes only `loadGame` and its imports.
- [ ] `cd ts && npx vitest run test_tuning_store.ts` shows 7 passed (real tail pasted); the chimera and gameshell regressions are unchanged and green.
- [ ] Reading localStorage happens only inside `readDevOverrides`, and only when the URL has `?dev=1` (test case 2 proves it).
- [ ] No game number or YAML file changed; `cd ts && npx tsc --noEmit` shows no new errors.
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the store API as built (function names), the 7 test results, and a one-line confirmation that case 2 (overrides ignored without `?dev=1`) passes. Recommended action: review, merge, then dispatch the sweep directive.

## Sandbox needs

none (`cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`, git status/diff only)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing Lua files, `games/*/logic.lua`, `ts/src/engine/executor.ts`; editing `docs/children.json`; changing any shipped game number (defaults must equal today's values); adding a runtime or build dependency.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-tuning-knob-store-directive |
| Base branch | - |
| Base commit | e68d17c354f5effdaebacb25dc54c5764eca5d25 |

**Status log**
- 2026-10-04 17:26 · robert-claude-laptop · none → Queued
- 2026-10-04 17:27 · robert-claude-laptop · Queued → Approved — lint override: author ran baseline proofs; Robert 2026-10-04 17:13 asked for per-game tuning tools and approved all recommendations
- 2026-10-04 18:09 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-tuning-knob-store-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 18:10 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-tuning-knob-store-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
