# Planet of Greed M0: extract the turn engine from App.tsx into small pure modules with an injectable rng (Size M)

**Depends on:** none. **Why Planet of Greed:** `docs/demos/planetofgreed/DIRECTION.md` ("Proposed first directives" item 1, "Port now (M0)", and the SOLID/SRP/KISS hard rule) and `ts/src/games/planetofgreed/ROADMAP.md` M0. The headless AI-vs-AI soak test (the next directive, `PlanetOfGreed_Headless_Soak_Test_Directive`) needs this first. This is a pure refactor: behaviour is unchanged.

**Read first** (the pointers below are to the files in this worktree):
`docs/demos/planetofgreed/DIRECTION.md`, `ts/src/games/planetofgreed/App.tsx` (the whole file: the blocks to move are listed in section 2 with their current line ranges), `ts/src/games/planetofgreed/aiDecisions.ts` (lines 60-91: `selectWeightedNeighbor`, which already takes an injectable `rng`), `ts/src/games/planetofgreed/utils/mapGenerator.ts` (line 67 and lines 85-90), `ts/src/games/planetofgreed/endingSystem.ts` (`checkEnding`), `ts/src/games/planetofgreed/fragmentSystem.ts`, `ts/src/engine/shared/seededRandom.ts` (`mulberry32`).

## 1. Why this exists

`ts/src/games/planetofgreed/App.tsx` is 1,947 lines and holds the entire turn engine inside React event handlers. Measured on origin/main `9ffa6c56` (2026-10-05):

- `Math.random` is called directly at lines 727 (AI action roll), 775 (AI reinforce unit type), 895, 899 and 900 (daily event chance, anchor cell, template pick), and 1233 (fog-of-war reset target); `Date.now()` is used for transit and event ids at lines 625, 625 (with `Math.random`), 756 and 903. `utils/mapGenerator.ts` lines 88-89 also call `Math.random` for the map jitter. Only `aiDecisions.ts` (`selectWeightedNeighbor`, line 71) takes an injectable `rng`. So no full game can be replayed from a seed, and no headless test can run a campaign.
- The annual logic exists twice: in `advanceDay` (lines ~1109-1157: `computeRank`, the per-House `annualBonusUnits` loop, then `checkEnding`) and again in `handleConcludeCombats` (lines ~1416-1447: the same three steps). A change to one can silently miss the other.
- `advanceDay` mutates its input: `prev.isSimulating = false` is assigned on the previous state object, and the `updatedCells` map returns the SAME cell objects for cells with no arrivals, which the week-end recruitment, production, income and the annual bonus then change in place. The AI order generator also mutates the cells, corporations and transits it is handed.
- Baseline (run 2026-10-05): `cd ts && npx vitest run test_planetofgreed` gives `Test Files  12 passed (12)` / `Tests  174 passed (174)`; `cd ts && npx tsc --noEmit` is clean.
- Calendar facts the engine implements (for your tests): 7 days per week (`newDate.day > 7` rolls the week), 4 weeks per month (`newDate.week > 4` rolls the month), 12 months per year (`newDate.month > 12` rolls the year), the campaign ends when `newDate.year >= 4`.

This run moves that logic into small pure modules whose random and clock inputs are injected, with the same behaviour, and leaves App.tsx rendering and wiring them.

## 2. Scope: the module contract (names and signatures are fixed; the next directive imports them)

All new files go in `ts/src/games/planetofgreed/`. One job per file, none over 400 lines.

1. **`rng.ts`**
```ts
import { mulberry32 } from '../../engine/shared/seededRandom';
export type Rng = () => number;
export interface EngineContext { rng: Rng; now: () => number }
export const defaultContext: EngineContext = { rng: Math.random, now: Date.now };
/** A deterministic context: mulberry32(seed) for rng, and a counter for now (starts at 1_000_000, +1 per call). */
export function makeContext(seed: number): EngineContext { /* ... */ }
export function randomInt(rng: Rng, n: number): number { return Math.floor(rng() * n); }
export function pickOne<T>(rng: Rng, items: readonly T[]): T { return items[randomInt(rng, items.length)]; }
```
   This is the ONLY new file allowed to name `Math.random` or `Date.now`.
2. **`campaignConstants.ts`**: move `PLAYER_CORP_ID`, `CULTURE_WHEEL`, `interface CultureDefinition` and `CULTURE_DEFINITIONS` out of App.tsx (current lines 39-106) and export them; App.tsx imports them.
3. **`campaignState.ts`**: move `buildInitialCorporations` (lines 108-132), `computeRank` (lines 145-157; keep its comment) and `applyPublicOpinionOffset` stays in App.tsx (tests read it there; see section 4). Add
```ts
export function createInitialCampaign(playerCultureId: CultureId, ctx: EngineContext): GameState
```
   whose body is the pure part of `initializeNewGame` (current lines 372-430: build corporations, `generateVoronoiMap(600, 600, 36, freshCorps, ctx.rng)`, `initializeFragments`, per-cell `publicOpinion` from `getHouseStats(...).baseOpinion`, scouted cells, `computeRank`, the date `{ year: 1, month: 1, week: 1, day: 1 }`, and the initial `GameState` object including the one success log). `initializeNewGame` in App.tsx keeps the React part: it calls `createInitialCampaign(playerCultureId, defaultContext)`, then `setGameState`, `setSelectedCellId` (capital cell of `PLAYER_CORP_ID`), `setIsPlanningPhase(true)`, `setPlanningMode('guided')`, `setShowAnnualReport(false)`, `setPendingCultureSelection(false)`.
   Also add the optional last parameter `rng: Rng = Math.random` to `generateVoronoiMap` in `utils/mapGenerator.ts` and use it for the two jitter calls; every existing caller stays valid.
4. **`annualReport.ts`**: the duplicated annual logic, once.
```ts
export const CAMPAIGN_LAST_YEAR = 3;
export function isCampaignOverDate(date: GameDate): boolean { return date.year > CAMPAIGN_LAST_YEAR; }
/** computeRank, then each House's annualBonusUnits on every owned cell, then checkEnding(corps, PLAYER_CORP_ID). Mutates corps and cells in place like the code it replaces; returns the ending or null. */
export function finalizeAnnualReport(corps: Corporation[], cells: MapCell[]): EndingEvent | null
```
   Both `advanceDay` and `concludeCombats` call `finalizeAnnualReport`; the three steps must appear nowhere else.
5. **`aiWeeklyOrders.ts`**: move `generateAIWeeklyOrders` (lines 701-789) with this signature
```ts
export function generateAIWeeklyOrders(
  cells: MapCell[], corps: Corporation[], transits: UnitTransit[],
  ctx: EngineContext, humanCorpIds: readonly string[] = [PLAYER_CORP_ID]
): void
```
   Same mutate-the-arguments behaviour. `Math.random()` at the action roll becomes `ctx.rng()`; the reinforce unit type becomes `pickOne(ctx.rng, ['circle', 'square', 'triangle'])`; `selectWeightedNeighbor(corp, cell, cellsById, corpsById, ctx.rng)`; the transit id's `Date.now()` becomes `ctx.now()`. The line `if (corp.id === PLAYER_CORP_ID) continue;` becomes `if (humanCorpIds.includes(corp.id)) continue;` (an empty list lets every House act, which the soak test needs). The rng call order must stay exactly as today: one `ctx.rng()` for the roll per owned cell, then (only inside the branches that used `Math.random`) the same draws in the same order.
6. **`combatForces.ts`**: the combat-force assembly that exists twice (inside `advanceDay`, lines ~1069-1103, and inside the combat view render, lines ~1606-1637).
```ts
export function buildCombatForces(cell: MapCell, transits: UnitTransit[]): { [corpId: string]: UnitGroup }
export function resolvePendingCombats(state: GameState): { [cellId: number]: CellCombatState }
```
   `buildCombatForces` is the garrison (`{ ...cell.units }` under `cell.ownerId`) plus the summed units of every transit with `targetCellId === cell.id && daysLeft === 0`. `resolvePendingCombats` calls `resolveCellCombat(cellId, cell.name, forces, cell.ownerId, cell.fortification, corpNames)` for each id in `state.activeCombatsToResolve` and returns the results keyed by cell id (the shape `handleConcludeCombats` takes today). Both the engine and the combat view in App.tsx use these.
7. **`turnEngine.ts`**:
```ts
export interface BoardroomEventTemplate { /* the shape of one EVENTS_TEMPLATES entry (title, description, choices[]) */ }
export interface AdvanceDayOutcome { state: GameState; showAnnualReport: boolean; enterPlanning: boolean }
export function advanceDay(prev: GameState, ctx: EngineContext, eventTemplates: readonly BoardroomEventTemplate[] = []): AdvanceDayOutcome
export interface ConcludeCombatsOutcome { state: GameState; endingFired: boolean; showAnnualReport: boolean }
export function concludeCombats(prev: GameState, results: { [cellId: number]: CellCombatState }): ConcludeCombatsOutcome
```
   - `advanceDay` is the body of the `setGameState(prev => ...)` updater inside App's `advanceDay` (lines 791-1183) as a pure function. The React calls inside it become outcome flags: `setShowAnnualReport(true)` becomes `showAnnualReport`, and `setIsPlanningPhase(true); setPlanningMode('guided')` becomes `enterPlanning`. `prev.isSimulating = false` becomes a local that ends up in the returned state. The daily event roll uses `ctx.rng` (`ctx.rng() < 0.12`, then `pickOne` for the anchor cell and the template, in that order) and `ctx.now()` for the event id; with `eventTemplates` empty (the default) no event is ever rolled. App.tsx keeps `EVENTS_TEMPLATES` (tests read it there) and passes it in.
   - `concludeCombats` is the logic of `handleConcludeCombats` (lines 1254-1448) minus `sfx` and React state. It returns the next state with every log the old code added through `addLog` prepended in the same order with the same text and type (keep the 100-log cap: `[entry, ...logs].slice(0, 100)`), calls `finalizeAnnualReport` exactly where the old code ran its annual block (only when the campaign is over), and sets `endingEvent` as the old code did.
   - Neither function may mutate its input: deep-clone `cells` and `corporations` (and `transits` where changed) at entry with `structuredClone`, then work on the clones. This is a deliberate behaviour-preserving change: the old in-place mutation of shared cell objects is a latent bug under React re-invocation, and the returned states are equal.
8. **`App.tsx` wiring** (kept thin):
   - `const advanceDay = () => { if (!gameState) return; setGameState(prev => { if (!prev) return null; const out = advanceDayEngine(prev, defaultContext, EVENTS_TEMPLATES); if (out.showAnnualReport) setShowAnnualReport(true); if (out.enterPlanning) { setIsPlanningPhase(true); setPlanningMode('guided'); } return out.state; }); };` (import the engine function under the name `advanceDay as advanceDayEngine`).
   - `handleConcludeCombats(results)`: `if (!gameState) return; if (Object.keys(results).length > 0) sfx.play('hit'); const out = concludeCombats(gameState, results); setGameState(out.state); if (out.endingFired) sfx.play('win'); if (out.showAnnualReport) setShowAnnualReport(true);`.
   - The combat view's `combats={...}` prop becomes `Object.values(resolvePendingCombats(gameState))` (keep the order of `activeCombatsToResolve`).
   - `handleEndPlanningPhase` calls `generateAIWeeklyOrders(updatedCells, updatedCorps, updatedTransits, defaultContext)`; its player transit id uses `defaultContext.now()` and `defaultContext.rng()` in place of `Date.now()` and `Math.random()`.
   - `handleSelectChoice`'s fog-of-war reset uses `pickOne(defaultContext.rng, candidates)`.
   - After the change, `Math.random` and `Date.now` do not appear anywhere in `App.tsx` (a Grep for them returns nothing).

## 3. The work, in this order (run the baseline test command after each stage; stop and fix before moving on)

1. Record the baseline: `cd ts && npx vitest run test_planetofgreed` (expect 12 files / 174 tests). Paste the real tail in your log line.
2. Stage A: `rng.ts`, `campaignConstants.ts`, the `generateVoronoiMap` rng parameter, `campaignState.ts` (moves plus `createInitialCampaign`), `annualReport.ts`. Rewire `initializeNewGame`. Tests green.
3. Stage B: `aiWeeklyOrders.ts` and `combatForces.ts`. Rewire App.tsx. Tests green.
4. Stage C: `turnEngine.ts` (`advanceDay`, `concludeCombats`) and the App.tsx wiring. Tests green.
5. Add `ts/tests/test_planetofgreed_turn_engine.ts` (section 5 lists what it asserts). Final full run.

## 4. What NOT to do

- No behaviour change: no new rule, no changed number, no changed log text, no changed order of random draws, no changed save key (`corpworld_state` stays; `ts/tests/test_planetofgreed_save_key.ts` pins it), no change to `resolveCellCombat` or anything under `ts/src/engine/shared/`.
- Leave these in App.tsx exactly as they are, because existing tests assert their source text there: `EVENTS_TEMPLATES`, `applyPublicOpinionOffset`, `handleSelectChoice` (its `treasury -= choice.cost` and `treasuryOffset` lines), `handleEndPlanningPhase`'s affordability and order-processing code (`remainingBudget`, `downgraded to Hold`, the `order.type === 'expand' ... updatedTransits.push` block), the `corpworld_state` save, and all JSX.
- Several existing tests read `App.tsx` as text (for example `test_planetofgreed_attack_heuristic.ts` looks for `combatInitialForces[cell.ownerId] = { ...cell.units }`, `alienInvaders`, `arr.corpId === cell.ownerId`, `resolveCellCombat` and the import `from '../../engine/shared/combat'`). Strings you moved will no longer be in App.tsx. The ONLY permitted fix: in the failing test file, make its `appSource` the concatenation of `App.tsx` plus the new module files that now hold the moved code (read each with `readFileSync` and join with a newline). NEVER weaken, delete or reword an assertion, and never copy the moved code back into App.tsx to satisfy a test.
- Do not touch `GuidedWalkthrough.tsx`, `WeeklyOrdersPanel.tsx`, `AnnualReportView.tsx`, `aiDecisions.ts` (its signature already takes `rng`), `defaultAction.ts`, `houseStats.ts`, or shared chrome (`BoardroomHeader`, `PlanetMap`, `FactionTheme`).
- Do not add the ending content, the campaign cap, a quick mode, a new House, or any AI change: those are other steps.
- Do not put any new module under a directory named `simulation` (the repo's seeded-sim guard scans those).
- No `npm run build:*`, no browser run, no installs, no scratch files in the repo.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified `Python 3.12.12`; no Python is changed).
```
cd ts && npx vitest run test_planetofgreed
```
Expected before any edit: `Test Files  12 passed (12)` / `Tests  174 passed (174)`. Expected at the end: `Test Files  13 passed (13)` and `Tests` equal to 174 plus the number of tests in your new file (all passing; none of the 174 may be removed or edited except the `appSource` read described in section 4).
```
cd ts && npx vitest run test_seeded_sim_guard.ts test_four_doc_architecture.ts test_arcade_lineage.tsx
```
Expected: `Test Files  3 passed (3)` / `Tests  36 passed (36)` (unchanged).
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0.

`ts/tests/test_planetofgreed_turn_engine.ts` (new; start the file with `// @vitest-environment node`) must assert at least:
- `makeContext(7)` twice gives the same `rng()` sequence and `now()` counts up by one.
- `createInitialCampaign('ember', makeContext(1))` called twice is deep-equal; it has six corporations, date `{ year: 1, month: 1, week: 1, day: 1 }`, every corporation owns at least one cell, ranks are 1 to 6, and `campaignOver` is false.
- Determinism: starting from `createInitialCampaign('ember', makeContext(3))`, run 60 days where each time `advanceDay` reports `enterPlanning` you call `generateAIWeeklyOrders(clonedCells, clonedCorps, clonedTransits, ctx, [])` on structured clones first (so the player House acts too), and each time `state.activeCombatsToResolve.length > 0` you call `concludeCombats(state, resolvePendingCombats(state))`; two runs with the same seed end deep-equal, a different seed ends different.
- No mutation: `JSON.stringify(prev)` before and after an `advanceDay` call and after a `concludeCombats` call is identical.
- `finalizeAnnualReport` on hand-built corporations and cells: ranks are assigned 1 to N without ties, a Crystal-culture House gains its `annualBonusUnits` once per owned cell (read the number from `getHouseStats('crystal')`), and the return value is `null` unless the player House holds rank 1.
- `buildCombatForces` returns the garrison under the owner id and sums two invading transits into their corporation entry; transits with `daysLeft > 0` are ignored.
- `generateAIWeeklyOrders` with `humanCorpIds = []` over 20 seeds changes something owned by the player House in at least one seed (a new transit, a recruitment entry or a fortification), while with the default list the player House's cells are never touched.
- Source guard: the files `turnEngine.ts`, `aiWeeklyOrders.ts`, `combatForces.ts`, `campaignState.ts`, `annualReport.ts`, `campaignConstants.ts` and `App.tsx` contain neither `Math.random` nor `Date.now`.

The in-browser check of a played campaign (title, culture pick, one week of orders, a combat, the annual report) is the controller's step after merge: say so under Controller finish in your report. Do not try to run a browser.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename-or-prefix> [...]` and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use the bare test filename (or name prefix) as the filter. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there (one commit per stage is welcome). Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- App.tsx and the other existing files are CRLF: the Edit tool keeps CRLF. New files use CRLF to match.
- SOLID/SRP/KISS (hard rule): one job per new module, pure functions with injected `ctx`, no new logic in App.tsx. If a stage cannot be finished green, STOP at the last green stage, commit it, set the row to Blocked and say which stage and why; a half-moved engine is worse than none.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.

## 7. Completion criteria

- [ ] The eight modules in section 2 exist with the exact exported names and signatures; `mapGenerator.ts` has the optional `rng` parameter.
- [ ] A Grep for `Math.random` and `Date.now` over `ts/src/games/planetofgreed/App.tsx` and over every new module except `rng.ts` returns nothing.
- [ ] The annual logic (`computeRank` + annual bonus + `checkEnding`) is called from `annualReport.ts` only; a Grep for `annualBonusUnits` in `App.tsx` returns nothing.
- [ ] `cd ts && npx vitest run test_planetofgreed` passes with 13 files and all 174 original tests still present (real tail pasted); `cd ts && npx tsc --noEmit` is clean; the three-file guard run is unchanged (real tails pasted).
- [ ] `App.tsx` line count is reported (before 1,947; target well under 1,400). Existing tests were changed only by the `appSource` concatenation rule, and each such change is listed in the report.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the modules created with line counts, App.tsx before and after, and any existing test whose `appSource` read you changed (name each). Evidence second: real tails of the vitest, guard and tsc commands, and the Grep results. Note any behaviour you found that looked like a pre-existing bug (the in-place mutation of shared cell objects is one) and what you did about it. Controller finish: a played-campaign check in a browser and a review of the `advanceDay` and `concludeCombats` diff against the original blocks. Recommended action: review, merge, then queue the soak test.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Superseded |
| Assigned to | devin-laptop |
| Branch | directive/rfdgamestudio-planetofgreed-extract-turn-engine-f5f556 |
| Base branch | - |
| Base commit | 9cc06d476907b2e1a150afdf31b940fd06cc3c8f |
| Head commit | bc6203f5b4c42c6d2b4d13d4f85065ab6169cfcf |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-05 22:02 · robert-claude-laptop · none → Queued — authored from DIRECTION.md (2026-10-05); queued only, not approved
- 2026-10-05 22:13 · devin-overseer (delegated) · Queued → Approved — lint override: verified: utils/mapGenerator.ts resolves to ts/src/games/planetofgreed/utils/mapGenerator.ts (exists on main); ts/tests/test_planetofgreed_turn_engine.ts is a create-target the run adds in step 5; tests/fixtures/demo_lists_snapshot.json cite is inside the directive's Forbidden Actions list
- 2026-10-05 22:13 · dispatcher · Approved → In progress — dispatched devin-laptop on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetofgreed-extract-turn-engine-f5f556; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 22:15 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planetofgreed-extract-turn-engine-f5f556; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-05 23:36 · devin · In progress → Review — M0 turn-engine extraction complete: 7 engine modules under ts/src/games/planetofgreed/ (all <400 lines), App.tsx 1947->1091 lines, EngineContext DI (mulberry32 rng + deterministic clock), no input mutation, 38 new engine tests (212 total PoG tests green), full pre-push hook passed (975 py tests, 265 TS files/2643 tests, Y8 build). Branch pushed. [origin] spent: devin 74 min est. n/a
- 2026-10-05 23:54 · devin-overseer (delegated) · Review → Superseded — superseded_by: commit:bc6203f5b4c42c6d2b4d13d4f85065ab6169cfcf (verified: bc6203f5b4c42c6d2b4d13d4f85065ab6169cfcf on origin/main) - note: Sonnet verdict MERGE (robert-claude-laptop #1909); bc6203f5 is second parent of merge 5ec942a1 on main
<!-- queue:end -->
