# Adopt tuning in chimera_wilds: 2 YAML knobs, simulate, targets (S)

**Depends on:** `Tuning_Knob_Store_Directive` and `Tuning_Sweep_Tool_Directive` merged. If `ts/src/engine/tuning/store.ts` or `ts/src/games/tuning-registry.ts` is missing, STOP and write that in the Status row. Dispatch this directive and `Tuning_Adopt_Scrapcrawl_Directive` one after the other, not together (both add a line to `ts/src/games/tuning-registry.ts`).
**Read first:** `docs/superpowers/specs/2026-10-04-tuning-tools.md`, `ts/src/engine/tuning/types.ts`, `ts/src/games/tuning-registry.ts`, `ts/tests/test_chimera_wilds_balance.ts`, `games/chimera_wilds/data.yaml` (lines 131-133).

## 1. Why this exists

chimera_wilds is the YAML-data example: Lua reads `baseline_player` from `games/chimera_wilds/data.yaml` through `loadGame`. Measured on origin/main `1f52374a` (scratch worktree, 2026-10-04): `cd ts && npx vitest run test_chimera_wilds_balance.ts` gives `Tests  2 passed (2)`. The file lines are:
```
baseline_player:
  power: 90
  endurance: 85
```
Win rate over the test's 1000 seeded encounters is 52.8% at 90/85, 14.8% at 80/75 and 1.2% at 70/70 (scratch probe, same seeds), so the band 35-65% is narrow in knob terms and worth a sweep. This directive declares the two numbers as knobs, gives the game a `simulate`, and pins the intent as targets.

## 2. Scope

1. New `ts/src/games/chimera_wilds/tuning.ts`.
2. Edit `ts/src/games/tuning-registry.ts`: add the import and the map entry `chimera_wilds`.
3. New test `ts/tests/test_chimera_wilds_tuning.ts`.

## 3. The work

**`tuning.ts`** (first line `// new: ts/src/games/chimera_wilds/tuning.ts`): default export a `GameTuning`:
- `gameId: 'chimera_wilds'`.
- knob `chimera_wilds.baseline_player.power`: label `Starting power`, group `Player`, min 40, max 140, step 5, default 90, affects `How hard the player's chimera hits; the main lever on whether a first encounter is winnable.`, source `{ kind: 'data', file: 'games/chimera_wilds/data.yaml', path: 'baseline_player.power' }`.
- knob `chimera_wilds.baseline_player.endurance`: label `Starting endurance`, group `Player`, min 40, max 140, step 5, default 85, affects `How much punishment the player's chimera survives.`, path `baseline_player.endurance`.
- `targets`: `[{ id: 'fresh_player_win_rate', metric: 'won', min: 0.35, max: 0.65, note: 'A fresh player should win about half of first encounters (matches test_chimera_wilds_balance.ts).' }]`.
- `simulate({ seed })`: build one session with `loadGame('chimera_wilds')` (this applies any active override), read `baseline_player` and `parts` from `session.files.data`, make `rng = mulberry32(seed)` (import from `../../engine/shared/seededRandom`), pick one random part per slot (`head, chest, left_arm, right_arm, left_leg, right_leg`, same as `test_chimera_wilds_balance.ts`), call `generate_chimera` then `resolve_encounter` with `roll = Math.floor(rng() * 20) + 1`, and return `{ won: result.won ? 1 : 0 }`. Copy the call shapes from the existing test exactly.

**Registry**: add `import chimeraWilds from './chimera_wilds/tuning';` and `chimera_wilds: chimeraWilds` in `TUNING_REGISTRY`.

**`test_chimera_wilds_tuning.ts`**: (1) both knob defaults equal the live YAML values read via `loadGame('chimera_wilds').files.data.baseline_player` (this is the drift guard); (2) `withOverrides({'chimera_wilds.baseline_player.power': 70, 'chimera_wilds.baseline_player.endurance': 70}, ...)` makes `simulate`'s win rate over 300 seeds (5000..5299) lower than at defaults, and defaults land inside the target band (log the measured rates with `console.log`); (3) `checkTargets` from `../src/engine/tuning/sweep` over `runRows(tuning, null, [], 300)` passes. The existing `test_chimera_wilds_balance.ts` stays unchanged.

## 4. What NOT to do

- Do not edit `games/chimera_wilds/data.yaml`, any Lua, or `test_chimera_wilds_balance.ts`. Do not change a number: defaults equal today's values.
- Do not add knobs beyond the two named. Do not touch the panel or the sweep files.

## 5. Verification

`cd ts && npx vitest run test_chimera_wilds_tuning.ts` all passed; `cd ts && npx vitest run test_chimera_wilds_balance.ts` still `Tests  2 passed (2)`; `cd ts && npx vitest run test_tuning_targets.ts` passes and now includes `chimera_wilds targets hold at defaults`; `cd ts && npx tsc --noEmit` no new errors. Paste real tails, including the measured rates.
**Controller finish (after merge):** `cd ts && npx vite-node tools/tune-sweep.ts -- --game chimera_wilds --knob chimera_wilds.baseline_player.power --from 60 --to 120 --step 10 --runs 300 --report`.

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

- [ ] `ts/src/games/chimera_wilds/tuning.ts` exists with the 2 knobs, 1 target and `simulate`; the registry has the entry.
- [ ] `test_chimera_wilds_tuning.ts` passes, `test_chimera_wilds_balance.ts` still `Tests  2 passed (2)`, `test_tuning_targets.ts` passes (real tails pasted, measured rates included).
- [ ] `games/chimera_wilds/data.yaml` is unchanged (`git diff` empty for it).
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the measured default win rate, the two knobs, and the drift-guard result. Recommended action: review, merge, then the controller runs the sweep and files the report.

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
| Status | Blocked |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-tuning-adopt-chimera-wilds-directive |
| Base branch | - |
| Base commit | b1bac35661ca192fdc5d824991bafe6b47a419e0 |

**Status log**
- 2026-10-04 17:26 · robert-claude-laptop · none → Queued
- 2026-10-04 20:24 · robert-claude-laptop · Queued → Approved — lint override: path hits are 'do not edit' mentions, a gitignored generated file, or new files this directive creates; verified in earlier directives of the same family
- 2026-10-04 20:24 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-tuning-adopt-chimera-wilds-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 20:25 · dispatcher · In progress → Blocked — setup failed before spawn: setup command 'uv sync --frozen' exited 1: supports. (os error 1142)
<!-- queue:end -->
