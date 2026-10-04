# Tuning tools: declare the knobs, sweep them headless, tune from evidence

Date: 2026-10-04. Status: draft for Robert. Authority: Robert 2026-10-04 17:13, "Tuning will take time so we will need tools for the engine to make tuning per game easier."
Inputs read at origin/main `1f52374a`: `ts/src/engine/{types,loader,runtime}.ts`, `ts/src/components/GameShell.tsx`, `ts/src/engine/shared/seededRandom.ts`, `ts/tests/test_scrapcrawl_sim_runs.ts`, `ts/tests/test_chimera_wilds_balance.ts`, `ts/tests/test_horse_racing_headless_balance.ts`, `games/*/data.yaml`, `ts/src/games/gladiator_arena/App.tsx` (the `?dev=1` precedent), the studio redesign and polish specs.
Constraints that stand: TS-native (no Lua or runtime swap), YAML data is the portability hedge, solo-owner scale, Robert is the captain and agents build, small and reusable.

## a. Why

Balance numbers live in three shapes and are edited by hand, then checked by a test whose range was written once:

| Game | Where the number lives | Pin today |
|---|---|---|
| scrapcrawl | TS consts `PLAYER_MAX_HP = 10`, `LOSS_DAMAGE = 2` in `ts/src/games/scrapcrawl/utils/runEnd.ts:12-13` | `test_scrapcrawl_sim_runs.ts`: 200 seeded runs, unarmed 20-50% (measured 35.0%), crafted 60-90% (75.0%) |
| chimera_wilds | YAML `baseline_player` power 90 / endurance 85 (`games/chimera_wilds/data.yaml:131`) | `test_chimera_wilds_balance.ts`: 1000 seeded runs, 35-65% (measured 52.8%) |
| horse_racing | YAML `race.overround: 1.12` (`games/horse_racing/data.yaml:30`) | `test_horse_racing_headless_balance.ts`: house edge near overround, all-in goes bankrupt |
| choke_point, BPO Sim | YAML `waves:`; `examples/bpo-sim/src/data/countries.yaml` (12 countries x 6 attributes) | wave test; BPO is an embed (see f) |

Measured steepness, chimera_wilds, same 1000 seeds (scratch probe, reverted): baseline 90/85 wins 52.8%, 80/75 wins 14.8%, 70/70 wins 1.2%. A ten-point nudge swings the game from fair to hopeless, so tuning by feel needs numbers in seconds, and a retune must not silently leave the intended band. Today finding that out means editing a file, running a 10-second suite, and reading a log line.

## b. Design: five small pieces, each useful alone

### b1. Knob schema (generic engine): `ts/src/engine/tuning/types.ts`
```ts
export interface KnobDef {
  key: string;          // '<gameId>.<name>', unique, e.g. 'scrapcrawl.loss_damage'
  label: string;        // 'Damage per lost fight'
  group: string;        // panel section, e.g. 'Combat'
  min: number; max: number; step: number;
  default: number;      // must equal the live value; a test enforces it
  affects: string;      // one sentence: what the player feels when this moves
  source:               // where the number really lives, for export
    | { kind: 'data'; file: string; path: string }   // YAML, e.g. games/chimera_wilds/data.yaml, 'baseline_player.power'
    | { kind: 'const'; file: string; name: string }; // TS const, e.g. runEnd.ts LOSS_DAMAGE
}
export type Overrides = Record<string, number>;      // key -> value; only changed knobs
export interface Target { id: string; metric: string; scenario?: string; min: number; max: number; note: string }
export type Metrics = Record<string, number>;        // one run: { won: 0|1, steps: 31, ... }
export interface GameTuning {
  gameId: string; knobs: KnobDef[]; targets: Target[];
  scenarios?: string[];                              // default ['default'], scrapcrawl: ['unarmed','crafted']
  simulate?: (ctx: { seed: number; scenario: string }) => Metrics;
}
```
Where a game declares it: `ts/src/games/<id>/tuning.ts`, default export `GameTuning`, next to `config.ts`. Not a `tuning:` block in `data.yaml`: that file is validated by the Lua loader, TS gives types and imports, and `source` already records the exact YAML location, so the YAML hedge is kept. A game with no `tuning.ts` is unaffected.

### b2. Store and dev-only gating (generic engine): `ts/src/engine/tuning/store.ts`
- `defineKnob(def)` registers a knob and returns `{ get(): number }`; `tuned(key)` reads the live value. Resolution order: scoped override (sweep or test) > dev override (localStorage, only when `?dev=1`) > `default`.
- `withOverrides(overrides, fn)` sets an in-process scope and restores it; used by the sweep and tests, works in node, ignores the URL.
- `devTuningEnabled(search)` is true only for `?dev=1` (same flag as gladiator_arena's Balance Lab, `App.tsx:52`). With anything else the localStorage key `rfd.tuning.<gameId>` is never read, so a stale override on a player's browser changes nothing. A test pins this: seed localStorage, load without `?dev=1`, assert defaults; load with it, assert the override; assert `withOverrides` restores.
- Plug-in A, YAML-data games (Lua reads the data): `loadGame(gameId, seed, overrides?)` in `ts/src/engine/runtime.ts` applies `applyDataOverrides(files.data, knobs, values)` after `yaml.load` (a fresh object per load, so nothing shared is mutated). Path syntax: dotted, numeric segments index arrays and maps (`waves.1.enemies.0.hp`). Lua code is untouched: it simply sees different data.
- Plug-in B, TS-constant games: the bare const becomes `defineKnob('scrapcrawl.loss_damage', {...})` and the call site reads `tuned(...)`. The exported const stays (equal to the default) so existing tests keep importing it.

### b3. Dev panel (generic engine): `ts/src/components/TuningPanel.tsx`, mounted in `GameShell`
Same pattern as the glossary dev panel already in `GameShell.tsx`: rendered only when `devTuningEnabled(window.location.search)`, loaded with `React.lazy` so players download none of it. Per knob a slider plus number input, grouped, `affects` as hint text, the default shown, changed knobs highlighted. Apply = write overrides to localStorage and reload (keeps `?dev=1`; no per-game restart hook). Reset clears them. "Copy as YAML" and "Copy as patch" export ONLY changed knobs via pure `formatExport(changed, knobs)` in `ts/src/engine/tuning/exportFormat.ts`:
```
# games/chimera_wilds/data.yaml
baseline_player:
  power: 80
```
Const knobs export a patch line naming the file and const (`ts/src/games/scrapcrawl/utils/runEnd.ts: LOSS_DAMAGE = 3`). Pasting is the only way a tuning change reaches players: overrides never ship.
Registry: `ts/src/games/tuning-registry.ts` (created by the sweep directive, one line added per adopting game), an explicit import map (not `import.meta.glob`, still unverified under vite-node, see the redesign spec risks).

### b4. Sweep tool (controller-run): `ts/tools/tune-sweep.ts` over pure `ts/src/engine/tuning/sweep.ts`
```
cd ts && npx vite-node tools/tune-sweep.ts -- --game scrapcrawl --knob scrapcrawl.loss_damage --from 1 --to 4 --step 1 --runs 200 [--report]
cd ts && npx vite-node tools/tune-sweep.ts -- --game chimera_wilds --check     # all targets at defaults
```
For each value and scenario it runs `simulate` for `runs` seeds (`mulberry32`, seeds 5000+i like today's tests), averages each metric, and prints a table; `--check` exits non-zero when a target misses. Pure and unit-tested (the sandbox cannot run vite-node, so Devin tests the functions): `parseArgs`, `sweepValues`, `aggregate`, `checkTargets`, `renderTable`, `renderReport`. Games opt in with `simulate`; they reuse what their headless test already does.

### b5. Targets and balance report
`targets` live in `tuning.ts` as intent, for example `{ metric: 'won', scenario: 'unarmed', min: 0.20, max: 0.50 }`. One generic test, `ts/tests/test_tuning_targets.ts`, runs every registered game's targets at defaults, so retuning a knob cannot silently break intent; the hand-written range in each game's test can then be deleted. `--report` writes `docs/state/balance-<gameId>-<date>.md`: the table, the targets with pass/fail, and the knob's `affects` sentence, short enough to read on a phone.

## c. Generic engine versus per-game adapter

| Generic (`ts/src/engine/tuning/*`, `GameShell`, `tune-sweep.ts`) | Per game (`ts/src/games/<id>/tuning.ts`, about 40 lines) |
|---|---|
| Types, store, gating, override application, export formatting, sweep maths, report, panel, targets test | Knob list with `source`, targets, `simulate` (moved or imported from the headless test), registry entry |

## d. Migration order and directives

| Order | Directive | Size | Depends on |
|---|---|---|---|
| 1 | `Tuning_Knob_Store_Directive`: types, store, gating, `loadGame` overrides, tests | S/M | none |
| 2 | `Tuning_Sweep_Tool_Directive`: pure sweep functions, `tune-sweep.ts`, targets test harness | M | 1 |
| 3 | `Tuning_Adopt_Chimera_Wilds_Directive`: YAML-data example (2 knobs, simulate, targets) | S | 1, 2 |
| 4 | `Tuning_Adopt_Scrapcrawl_Directive`: TS-const example (2 knobs, two scenarios) | S | 1, 2 |
| 5 | `Tuning_Dev_Panel_Directive`: panel, export, registry, `GameShell` mount | M | 1, and 3 or 4 to have something to show |

Controller after each merge: run the sweep for the adopted game, paste the table into `docs/state/`. Later, not written yet: horse_racing (`race.overround`, bankruptcy rate), choke_point waves (`waves.N.enemies.M.hp`), then Shoal and others as Robert tunes them. Nothing deploys without Robert.

## e. Risks

- Overrides reaching players: closed by the `?dev=1`-only read, the lazy panel, and the pinned test; export-and-paste is the only path to production.
- `default` drifting from the file: a test per game compares each data knob default to the loaded YAML and each const knob default to its exported const.
- Sweep cost: scrapcrawl is about 22 ms per run (400 runs took 8.9 s), so a 4-value sweep with 200 runs per scenario is about 35 s; chimera is faster. Fine for the controller, too slow for a per-keystroke panel, which is why the panel does not simulate.
- Seeded simulators measure the bot strategy in the test, not human play; targets are a guard rail, not a verdict. Robert still tunes by feel.
- Knob bloat: expose only numbers Robert actually moves (2-6 per game). `tuned()` reads are cheap, but do not put it inside a per-frame loop.
- Two seededRandom helpers exist (`ts/src/engine/shared/seededRandom.ts`, used by chimera, and `ts/src/tests/helpers/seededRandom.ts` with a stale header); new code uses the engine one, no cleanup in this scope.
- Not verified here: `React.lazy` inside `GameShell` under the standalone itch builds, and the panel UI (needs a browser; the controller screenshots it).

## f. Open questions for Robert (default in brackets)

1. Targets: pin today's measured bands (scrapcrawl unarmed 20-50%, crafted 60-90%, chimera 35-65%) or your tighter intent such as 40-60% unarmed? [pin today's, you tighten later by editing one line; a tighter target fails until the knobs move]
2. Panel on the live arcade pages at `?dev=1`, or only local builds? [live, it is inert without the flag and you can tune on your phone]
3. BPO Sim (a Gemini embed under `examples/`): wait until it has a `tuning.ts` seam, or leave embeds out of tuning for now? [leave out; its 12x6 table is already in one YAML]
4. After a tune, who edits the YAML: you paste, or agents apply the exported snippet in a directive? [agents apply it, you read the balance report]
