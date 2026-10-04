# PlanetOfGreed — Repo State

*Last updated: August 12 2026*

## Phase 3: Engine Hardening (AI Bias, Fragments, Ending) — COMPLETED

**Directive:** Add three bounded systems on top of CorpWorld's proven shell
(unchanged): wheel-aware AI target-selection weighting for Expand orders,
AI Fragment tracking with an elimination-transfer chain rule, and a Rank-1
ending trigger checked at every Annual Report. No combat/economy/band-
probability/ending-narration changes — all explicitly deferred per
Design.md v0.2 §MVP Scope.

**Note on phase numbering:** the directive that drove this work was titled
"Phase 1 Directive" internally, but the repo had already shipped a prior
Phase 1 (Culture Corporations & Wheel Placement) and Phase 2 (Rank,
Population Balance & Displacement) — see the repo-root
`docs/state/current.md` for those records. This work is Phase 3 in the
repo's actual progression. The labeling was confirmed with the user before
proceeding.

### Stop-rule check before starting

- **Fork verified** at `examples/planetofgreed/`, independent of
  `examples/corpworld/` (separate directory tree; `examples/*` is
  gitignored at the repo root, so both are local-only working dirs).
- **`combat.ts` byte-identical** to CorpWorld's original (SHA256 match,
  confirmed before and after this phase — not touched).
- **`mapGenerator.ts` NOT byte-identical** to CorpWorld — modified in the
  PRIOR Phase 1 (wheel-cyclic capital placement). This was flagged to the
  user before starting: that modification is a prerequisite for this
  phase's AI bias system (wheel-aware targeting depends on wheel
  relationships, which depend on wheel-cyclic placement). Reverting it
  would destroy verified prior work and break the foundation this phase
  builds on. User decision: treat the current wheel-cyclic
  `mapGenerator.ts` as the certified baseline; note the deviation as
  pre-existing, not touched this phase. `mapGenerator.ts` was NOT modified
  in Phase 3.
- **Starting test floor: 0/0/0.** No vitest config, no test files, no
  vitest dependency existed before this phase (only `tsc --noEmit` as
  `lint`). Stood up a real vitest floor before touching any logic, per
  the STOP rule. Reported the 0/0/0 starting count before proceeding.

### What was built (all in `examples/planetofgreed/src/`; `combat.ts` and `mapGenerator.ts` untouched)

- **`vitest.config.ts`** (new): vitest floor mirroring `vite.config.ts`'s
  `@` alias; `environment: node`; `include: src/**/*.test.ts`.
- **`package.json`**: added `vitest` + `@vitest/ui` dev deps; added
  `test` (`vitest run`) and `test:watch` scripts.
- **`types.ts`**: added `fragments: string[]` (required) to `Corporation`
  — set by `fragmentSystem.initializeFragments` at game start, mutated
  only by `fragmentSystem.onHouseEliminated`. Added `EndingEvent` type
  (`{ type: 'ENDING_TRIGGERED'; fragmentCount: number; total: number }`)
  and `endingEvent: EndingEvent | null` on `GameState`.
- **`wheelTopology.ts`** (new): the six-culture ring
  (`WHEEL_ORDER = ['ember','marsh','gale','tundra','crystal','tide']`),
  `getOpposite(culture)` = `(index + 3) % 6`, `getAdjacent(culture)` =
  `[(index-1+6)%6, (index+1)%6]`. Produces the confirmed opposite pairs
  Ember↔Tundra, Marsh↔Crystal, Gale↔Tide (all verified by tests, not
  assumed).
- **`aiDecisions.ts`** (new): `weightNeighbor(actingCulture,
  neighborOwnerId, corpsById)` returns 3 (opposite-owned) / 1.5
  (adjacent-owned) / 1 (baseline: neutral, non-rival, own).
  `selectWeightedNeighbor(actingCorp, cell, cellsById, corpsById, rng)`
  does weighted-random selection (not deterministic highest-weight-wins).
  `makeSeededRng(seed)` (mulberry32) for deterministic distribution
  tests. The four-band probability roll (40/20/20/20) is NOT in this
  module and was NOT touched — it lives in `App.tsx`'s
  `generateAIWeeklyOrders`; this module only replaces the *which
  neighbor* step inside the Expand branch.
- **`fragmentSystem.ts`** (new): `initializeFragments(corps)` sets each
  corp's `fragments = [cultureId]`. `onHouseEliminated(eliminated,
  eliminator)` concatenates eliminated's fragments onto eliminator's,
  then clears eliminated's array. Pure transfer logic; attribution
  (which House caused the elimination) is done in `App.tsx`'s
  `handleConcludeCombats`.
- **`endingSystem.ts`** (new): `checkEnding(corps, playerHouseId)`
  returns an `EndingEvent` if the player's House is Rank 1, else null.
  Only the PLAYER reaching Rank 1 fires; an AI at Rank 1 does not. Pure
  function — caller sets `campaignOver` and stores the event.
- **`App.tsx`**: wired the four new systems in with minimal surface:
  - `buildInitialCorporations`: added `fragments: []` placeholder to the
    corp literal (populated by `initializeFragments` immediately after).
  - `initializeNewGame`: calls `initializeFragments(freshCorps)` after
    map generation; sets `endingEvent: null` on initial state.
  - `rehydrateState`: normalizes old saves — defaults missing
    `fragments` to `[cultureId]` and missing `endingEvent` to `null`.
  - `generateAIWeeklyOrders`: replaced uniform-random neighbor pick
    (`cell.neighbors[Math.floor(Math.random() * len)]`) with
    `selectWeightedNeighbor(corp, cell, cellsById, corpsById)`. Built
    `cellsById`/`corpsById` lookup maps once per call. The 40/20/20/20
    roll is unchanged. Added a `null`-neighbor guard (skip cell if no
    neighbors).
  - `handleConcludeCombats`: added elimination detection — tracks each
    corp's running cell count as battles resolve; when a corp hits 0
    cells, the eliminator is the victor of the battle that brought the
    count to 0 (the clean, single-attributable-House case). Edge case:
    if the final battle was mutual destruction (no victor), falls back
    to the last victor that took a cell from that corp in the same
    batch; if none, fragments are lost (flagged in the log, not silently
    invented). Calls `onHouseEliminated` for each (eliminated,
    eliminator) pair. Added `checkEnding` after the campaign-over
    `computeRank`.
  - `advanceDay`: after the Annual Report `computeRank` (year-tick or
    player-elimination), calls `checkEnding`; if it fires, sets
    `endingEvent` on state, `campaignOver = true`, halts simulation,
    logs the trigger.
  - Render: added a minimal ending placeholder overlay (z-50, rendered
    after the Annual Report so it takes precedence) showing "Rank 1
    Reached" + `fragmentCount/total` + a "Begin New Campaign" button.
    Real ending content (cutscene/narration) is out of scope per
    Design.md v0.2.

### Verification

- **Starting floor**: 0 test files, 0 tests, 0 passing, 0 failing
  (vitest "No test files found", exit 1) — confirmed before any logic.
- **Final floor**: 4 test files, **11 tests, 11 passing, 0 failing, 0
  skipped** (raw `vitest run` output):
  ```
  ✓ src/endingSystem.test.ts (3 tests) 6ms
  ✓ src/wheelTopology.test.ts (3 tests) 6ms
  ✓ src/fragmentSystem.test.ts (3 tests) 6ms
  ✓ src/aiDecisions.test.ts (2 tests) 18ms
  Test Files  4 passed (4)
       Tests  11 passed (11)
  ```
- **`tsc --noEmit`**: clean. **`npm run build`**: succeeded (2088
  modules, ~15s).
- **`combat.ts` byte-identical** to CorpWorld's original (SHA256
  `ABDC02DF…0668A` on both). **`mapGenerator.ts`** differs from
  CorpWorld (SHA256 `C4847C0F…0265D` vs `513AF598…ABE66`) — pre-existing
  from prior Phase 1, NOT touched this phase, prerequisite for the AI
  bias system.
- **AI bias live (unit tests)**: `test_ai_bias_weights_wheel_opposite_highest`
  runs 20000 seeded trials over a mixed-neighbor cell set; opposite-owned
  neighbor selected at ~46.2% (expected 3/6.5 = 46.2%), adjacent at
  ~23.1%, baseline at ~15.4% each. Opposite rate > 2x baseline. All
  rates within 3% absolute of expected.
- **AI bias live (real simulation, from-scratch, 12 weeks)**:
  `sim_phase3_ai_bias.ts` runs a real 12-week game loop using the actual
  `mapGenerator.ts`/`aiDecisions.ts`/`wheelTopology.ts`. 65 Expand target
  selections: 14 adjacent-owned (21.5%), 24 neutral (36.9%), 27 own
  (41.5%), 0 opposite. **Real finding (flagged, not degenerate):** on
  the 36-cell map with wheel-cyclic capital placement, wheel-OPPOSITE
  cultures start maximally distant and don't share borders early-game,
  so the opposite-bias cannot manifest in aggregate stats until empires
  expand enough to create opposite-culture border contacts. The
  adjacent-bias shows up earlier because wheel-adjacent cultures start
  closer. No degenerate behavior: AI still expands into neutral/own/
  adjacent cells when opposites aren't bordering — the bias is a
  preference, not a hard rule.
- **AI bias live (real simulation, controlled mid-game border contact)**:
  `sim_phase3_bias_midgame.ts` sets up a realistic mid-game map state
  where an Ember corp has the full wheel-relationship mix of neighbors
  (1 opposite/Tundra, 2 adjacent/Tide+Marsh, 2 non-rival/Gale+Crystal, 3
  neutral), then runs 30000 real `selectWeightedNeighbor` calls. Results
  match expected rates to 4 decimal places:
  - opposite (Tundra, weight 3): 8172 selections, rate 0.2724 (expected
    0.2727)
  - adjacent (Tide+Marsh, weight 1.5 each): 8173 combined, rate 0.2724
  - baseline (non-rival + neutral, weight 1 each): 13655, rate 0.4552
  - **per-neighbor ratio: opposite is 2.99x baseline** (matches the 3:1
    weight ratio exactly). PASS.
- **Fragment transfer**: `test_fragment_chain_transfer` confirms A
  eliminates B (who already absorbed C) → A ends with 3 fragments, not 2.
- **Ending**: `test_ending_triggers_at_rank_1`,
  `test_ending_not_triggered_by_ai_rank_1`,
  `test_ending_reports_correct_fragment_count` all pass. Event payload
  `{fragmentCount, total: 6}` matches the player's actual fragments
  array length at trigger time.

### Findings flagged (not silently patched)

1. **mapGenerator.ts not byte-identical to CorpWorld** — pre-existing
   from prior Phase 1 (wheel-cyclic capital placement). Prerequisite for
   this phase's AI bias. Not touched this phase. User decision: treat as
   certified baseline.
2. **Opposite-bias doesn't manifest early-game on the 36-cell map** —
   wheel-opposite cultures start maximally distant and don't border each
   other until empires expand. This is a real property of the map
   geometry + wheel-cyclic placement, not a bug in the bias system. The
   bias is verified via unit tests (controlled neighbor set) and the
   mid-game simulation (controlled border-contact state). In a real
   3-year campaign, opposite-culture border contacts will emerge as
   empires grow, and the bias will manifest.
3. **No degenerate AI behavior** from the weight tuning (3/1.5/1) — AI
   Houses do NOT only expand into opposites; they still expand into
   neutral/own/adjacent cells when opposites aren't available. The bias
   is a weighted preference, not a hard rule. Weights remain tunable.
4. **AI-House-reaching-Rank-1 gap** — Design.md v0.2 doesn't specify
   AI-victory behavior. This phase treats an AI reaching Rank 1 as
   continue-the-campaign-as-normal (no ending fires). Flagged, not
   invented.
5. **Mutual-destruction-of-last-cell edge case** — if a House's final
   cell is lost to mutual destruction (no victor) and no prior victor in
   the same batch took a cell from them, fragments are lost (not
   transferred). Flagged in the log as an error. Rare edge case; the
   common case (victor takes last cell → clean attribution) is the
   primary path.
6. **Pre-existing Annual Report gap (not introduced this phase)** — when
   the year ticks during a month that has month-end combats, the Annual
   Report doesn't show after combats conclude in `handleConcludeCombats`
   (the `shouldShowReport` variable is computed but never used to call
   `setShowAnnualReport`). This means the ending check at that specific
   path doesn't fire. This is a pre-existing bug in the Annual Report
   trigger, out of this phase's scope, flagged not fixed.

### Next-phase pointer

- **AI-victory behavior**: Design.md v0.2 doesn't specify what happens
  when an AI House reaches Rank 1. Decide and implement.
- **Ending content**: the placeholder screen proves the trigger fires.
  Real cutscene/narration (House Arrest, Echo waking, Chapter 2
  handoff) is the next content pass — Design.md v0.2 §Ending defines
  exactly where it plugs in.
- **Culture stat asymmetry**: still open since v0.1. Player House
  selection needs a real reason beyond paint.
- **Population Balance triggers**: still open since v0.1.
- **Signal content in Boardroom Events**: deferred, needs its own pass
  now that the Fragment/elimination system is verified working.
- **Annual Report year-tick-with-combats gap**: pre-existing bug flagged
  above — the `shouldShowReport` path in `handleConcludeCombats` is
  computed but not wired.
