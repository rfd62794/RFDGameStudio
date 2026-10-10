# Adopt the playtest contract in scrapcrawl (S)

**Depends on:** `Playtest_Adapter_Contract_Directive` merged (this run needs `ts/src/engine/playtest/*`). If `ts/src/engine/playtest/runner.ts` does not exist, STOP and write that in the Status row.
**Read first:** `docs/superpowers/specs/2026-10-04-automated-playtesting.md` (section c1), `ts/src/engine/playtest/types.ts`, `ts/src/engine/playtest/runner.ts`, `ts/tests/test_scrapcrawl_sim_runs.ts` (the whole file: the loop to wrap; do NOT edit it), `ts/src/games/scrapcrawl/utils/runEnd.ts`.

## 1. Why this exists

`ts/tests/test_scrapcrawl_sim_runs.ts` simulates 200 seeded runs per strategy through the real `games/scrapcrawl/logic.lua` (seeded D20 as the 4th arg of `resolve_fight`, fixed scrap reward as the 5th). Measured on origin/main `0fa83acc` (2026-10-04): `cd ts && npx vitest run test_scrapcrawl_sim_runs.ts` gives `Tests  3 passed (3)` and prints `SIM unarmed=0.350 crafted=0.750` (seeds `5000 + i`, i 0..199). The loop is private to that file, so the report, the invariants and any later sweep cannot reuse it, and its step cap (`step < 400`) is a silent exit rather than a reported finding. This directive wraps the same behaviour in the shared `PlaytestAdapter`, with two policies (unarmed, crafting) that reproduce the same win rates exactly, which proves the wrapping is faithful.

## 2. Scope

1. New `ts/src/games/scrapcrawl/playtest.ts`: `createScrapcrawlAdapter()`, `scrapcrawlPolicy(useCraft: boolean)`.
2. New test `ts/tests/test_playtest_scrapcrawl.ts` <!-- new: ts/tests/test_playtest_scrapcrawl.ts -->.

## 3. The work

**Step 1: `ts/src/games/scrapcrawl/playtest.ts`** <!-- new: ts/src/games/scrapcrawl/playtest.ts --> (first line `// new: ts/src/games/scrapcrawl/playtest.ts`). Copy, do not import, the private `seeded(seed)` function and the `CHAIN` constant (`['home_base', 'scrap_pit', 'vent_stack', 'chemical_leak', 'furnace_core']`) from `test_scrapcrawl_sim_runs.ts`. Import `newRun`, `applyFight`, `applyMove`, `RunOutcome` and the run-progress type from `../scrapcrawl/utils/runEnd`, and `loadGame`, `call` from `../../engine/runtime`.

```ts
export type ScrapAction = { kind: 'move'; to: string } | { kind: 'walkHome' } | { kind: 'fight' } | { kind: 'craft' };
export interface ScrapObs { room: string; hp: number; scrap: number; hasWeapon: boolean; cleared: string[] }
export function createScrapcrawlAdapter(): PlaytestAdapter<ScrapObs, ScrapAction>
export function scrapcrawlPolicy(useCraft: boolean): Policy<ScrapObs, ScrapAction>
```
Adapter, a port of `simulate`'s body (same Lua calls, same arguments):
- `init(seed)`: `session = loadGame('scrapcrawl')`, `data = session.files.data`, `rooms = data.rooms`, `rnd = seeded(seed)`, `player = call(session, 'init_player')[0]`, `run = newRun()`.
- `isTerminal()`: `run.outcome !== 'playing'`; `outcome()`: `run.outcome` (`'won'`, `'lost'`, `'playing'`).
- `legalActions()`: `[]` when terminal. Otherwise: `{ kind: 'fight' }` always; `{ kind: 'move', to }` for `CHAIN[i + 1]` when it exists and for `CHAIN[i - 1]` when `i > 0`, where `i = CHAIN.indexOf(player.currentRoomId)`, plus `{ kind: 'walkHome' }` whenever the room is not `home_base`; `{ kind: 'craft' }` only when the room is `home_base` and `player.scrap >= 10`.
- `act(a)`: `move`: `player = call(session, 'move_player', data, player, a.to)[0]; run = applyMove(run, rooms, a.to)`. `walkHome` is a multi-hop action that runs to completion inside ONE `act` call, exactly like the old loop's `walkHome` closure (`simulateRun.ts`, `while (player.currentRoomId !== 'home_base')`): repeat `i = CHAIN.indexOf(player.currentRoomId)`, `to = i === CHAIN.length - 1 ? 'home_base' : CHAIN[i - 1]`, then the same `move_player` + `applyMove` pair as `move`, until `player.currentRoomId === 'home_base'` (the last room jumps straight home; it does not check `run.outcome` between hops, as the old loop does not). No rule of the policy runs between the hops, so nothing can interrupt or re-route the walk. `craft`: `player = call(session, 'craft', data, player, rooms.home_base, 'beatStick', 1)[0]`. `fight`: in this exact order, `roll = Math.floor(rnd() * 20) + 1` then `reward = 3 + Math.floor(rnd() * 6)` (the order of the two `rnd()` calls decides every number), `res = call(session, 'resolve_fight', data, player, rooms[player.currentRoomId], roll, reward)[0]`, `player = res.player`, `run = applyFight(run, rooms, player.currentRoomId, res.won)`. `rnd` is called ONLY by `fight`.
- `observe()`: `{ room: player.currentRoomId, hp: run.hp, scrap: player.scrap, hasWeapon: !!player.equipped.weapon && player.equipped.weapon.life !== 0, cleared: run.clearedRoomIds }`.
- `metrics()`: `{ hp: run.hp, scrap: player.scrap, cleared: run.clearedRoomIds.length }`. `fingerprint()`: `JSON.stringify([player.currentRoomId, run.hp, player.scrap, run.clearedRoomIds.length, run.outcome])`. A fight that changes nothing (a won fight that gives 0 scrap in a cleared room) cannot repeat 25 times in a row before the run ends, so the default stall window is fine; if a real run trips `stall`, that is a finding, not a bug in your code.
Policy `scrapcrawlPolicy(useCraft)`: a pure port of one loop iteration of `simulate` (obs and legal given, return one action):
1. `target = CHAIN.find(id => id !== 'home_base' && !obs.cleared.includes(id))`.
2. If `useCraft && obs.room === 'home_base' && !obs.hasWeapon && obs.scrap >= 10` return `{ kind: 'craft' }` (the old loop crafts, then moves in the same iteration; here the move is the next action, which is equivalent because at `home_base` the player is always before `target`).
3. If `CHAIN.indexOf(obs.room) < CHAIN.indexOf(target)` return `{ kind: 'move', to: CHAIN[CHAIN.indexOf(obs.room) + 1] }`.
4. If `useCraft && obs.hp <= 4 && !obs.hasWeapon && obs.scrap >= 10`: return `{ kind: 'walkHome' }` (run-to-completion: the one action walks all the way to `home_base`; do NOT port it as a one-hop `move`, because the next step would re-evaluate rule 3, which sends the player back toward `target`, and the run bounces between rooms until the step cap; that reading measured crafting won=0.51 instead of 0.75). On the next step the player is at `home_base`, where rule 2 crafts, then rule 3 moves out, matching the old loop's `walkHome(); continue;` followed by craft-then-move.
5. Otherwise `{ kind: 'fight' }`.
Rule order matters: rule 3 runs before rule 4 exactly as in the old loop (the `here < indexOf(target)` check precedes the walk-home check). Always return an action that is in `legal` (the policy is only used with this adapter).

**Step 2: `ts/tests/test_playtest_scrapcrawl.ts`.** Exactly these 6 `it` cases, using `playMany` with `seeds = Array.from({ length: 200 }, (_, i) => 5000 + i)` and `{ maxSteps: 800 }`:
1. Unarmed policy over the 200 seeds: no violations at all, every run `terminal: true`, outcomes only `'won'` or `'lost'`.
2. Crafting policy over the 200 seeds: the same.
3. Parity with the old sim: the unarmed win rate is `0.35` and the crafting win rate is `0.75` (`toBeCloseTo(0.35, 3)` and `toBeCloseTo(0.75, 3)` on `rates['won']`). This case pins that the adapter is a faithful wrapper; it is the one place outcome rates are asserted, and only because they already are in `test_scrapcrawl_sim_runs.ts`.
4. Both `'won'` and `'lost'` occur over the 200 unarmed seeds.
5. Determinism: seed 5003 run twice (crafting) gives deeply equal results.
6. Report smoke: `console.log(renderPlaytestReport('scrapcrawl', 'unarmed', summarise(results)))` and `...'crafting'...` for the two result sets; assert only that each report string contains `Runs: 200`.
If case 3 does NOT match exactly, do not loosen it: check the order of the two `rnd()` calls, that `walkHome` runs to completion in one `act` (not one hop per step), and the craft-then-move equivalence, and if it still differs STOP and write the two measured rates in the Status row.

## 4. What NOT to do

- Do not edit `ts/tests/test_scrapcrawl_sim_runs.ts`, `runEnd.ts`, `games/scrapcrawl/logic.lua`, any YAML, or any game number. The old test stays until Robert or the controller retires it.
- Do not change the contract modules in `ts/src/engine/playtest/`; if the contract is missing something, STOP and write what in the Status row.
- No React, no browser, no new dependency.

## 5. Verification

`cd ts && npx vitest run test_playtest_scrapcrawl.ts` expects `Tests  6 passed (6)`; paste the real tail, including the two printed reports.
Then regression: `cd ts && npx vitest run test_scrapcrawl_sim_runs.ts` expects `Tests  3 passed (3)` and prints `SIM unarmed=0.350 crafted=0.750` (baseline today: the same).
Then `cd ts && npx tsc --noEmit`: no new errors (baseline: no output).
Then `git status`: only the 2 files in Scope appear.

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
- Do NOT run `npm run build:*`, `vite-node`, `vite build`, any browser or Playwright command, or any `uv run python -m studio...` module (the sandbox refuses them; the
  controller runs the browser tools and builds). The only commands you run are `cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`
  (errors that mention only `game-metadata.json` are pre-existing in a fresh worktree: ignore those, fix any other), `git status`, `git diff`, and git add/commit on your branch.
- Do not run `git merge origin/main`. Use `git fetch origin` then `git rev-list --count HEAD..origin/main` to see whether main moved.
- Files you edit keep their existing line endings; new files use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.
- Free models only where the work touches model configuration (it does not here). Nothing you write may touch a shipped game's behaviour or numbers.

## 7. Completion criteria

- [ ] The 2 files in Scope exist; `ts/tests/test_scrapcrawl_sim_runs.ts` and `runEnd.ts` are untouched.
- [ ] `cd ts && npx vitest run test_playtest_scrapcrawl.ts` shows 6 passed (real tail and printed reports pasted), including the exact parity of 0.35 and 0.75; the old scrapcrawl suite is unchanged and green.
- [ ] `cd ts && npx tsc --noEmit` shows no new errors; no file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the two printed reports (outcome mix, run length median/p95/max), whether parity held exactly, any violation line. Recommended action: review and merge; the controller decides when to retire the old sim test.

## Sandbox needs

none (`cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`, git status/diff only)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing Lua files, `games/*/logic.lua`, `ts/src/engine/executor.ts`, `docs/children.json`; changing any shipped game number; adding a runtime or build dependency; editing `package.json` or the lockfile; running a browser.

## Required from User

none.

Requeued 2026-10-10: rule 4 now ports walkHome as run-to-completion (sticky until home), matching the old loop; the earlier one-hop reading measured 0.51.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-playtest-adopt-scrapcrawl-directive |
| Base branch | - |
| Base commit | b4667e53ec6daa48e74e4f31d98f9328613fdcb0 |

**Status log**
- 2026-10-04 17:47 · robert-claude-laptop · none → Queued
- 2026-10-09 23:14 · robert-claude-laptop · Queued → Approved
- 2026-10-09 23:14 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-playtest-adopt-scrapcrawl-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4HWWZKVN066VC33V08Q018N
- 2026-10-09 23:15 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-playtest-adopt-scrapcrawl-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen; venv pythonw swap
- 2026-10-09 23:57 · devin · In progress → Blocked — Parity failed as specified: measured unarmed won=0.35 (exact), crafting won=0.51 vs expected 0.75; 66/200 crafting runs bounce home-walk (rule 3 resends the one-hop walk toward target) and hit the 800-step cap. rnd order and craft-then-move checked; the spec's one-hop walkHome port diverges from the old loop's run-to-completion walkHome. Committed as-written on branch.
- 2026-10-10 00:11 · robert-claude-laptop · Blocked → Queued — Spec fixed in PR #264 (merged): walkHome is now a multi-hop action that runs to completion inside one act call, matching the old loop (the one-hop reading bounced between rooms and measured 0.51). Continue on the same branch: replace the one-hop port with the walkHome action per rule 4, re-measure, expect crafted≈0.75 / unarmed=0.35.
- 2026-10-10 00:12 · robert-claude-laptop · Queued → Approved
<!-- queue:end -->
