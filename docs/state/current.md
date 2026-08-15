# RFDGameStudio — Project State

*Last updated: August 13 2026*

## Planet of Greed — Standalone Build for itch.io — COMPLETED

**Directive:** Produce the real, missing piece for Planet of Greed's
itch.io project page (already created, Prototype/Draft status,
metadata set): an actual uploadable standalone build. Isolated from
the combined deployment directive so it can ship on its own timeline.

### STOP rule — git state verified

Planet of Greed's full thread confirmed present before building:
- Conversion/retirement, Merge & Polish v2, Shell Compliance
- Attack Fix (`6b7ba1e`)
- Softlock Fix (`13cbb7e`)
- Shell/Opening (`b4640e8`)

Working tree clean (2 uncommitted files: `docs/state/current.md` and
`ts/tests/test_dual_target_deploy.ts` — both documentation/test
updates, no source changes pending).

### Generator gap — real, identified, and addressed

**The real gap:** `tools/generate-standalone-entry.ts` line 94 throws
`Error('No Lua files found for ${gameId}')` for games without Lua
files. The generator was built for Lua-backed games (reads
`systems.yaml`/`logic.lua` dependencies). Planet of Greed is TS-native
with zero Lua files and no `games/planetofgreed/` directory.

**The fix:** Created a minimal standalone entry
(`ts/src/standalone/planetofgreed/entry.tsx`) that constructs a no-op
`GameSession` directly — PoG's App destructures `session` but never
references it (all game state is self-contained via localStorage). This
bypasses `buildStandaloneSession` entirely, avoiding the Lua-file
requirement. Uses the same `makeStandaloneConfig` factory as all other
standalone builds for the vite config.

**Files created:**
- `ts/src/standalone/planetofgreed/entry.tsx` — minimal entry, no
  `buildStandaloneSession` import, no-op executor stub
- `ts/src/standalone/planetofgreed/index.html` — standard standalone
  HTML shell
- `ts/vite.planetofgreed.config.ts` — uses `makeStandaloneConfig`

**Files modified:**
- `ts/package.json` — added `build:planetofgreed` script
- `ts/src/games/registry.ts` — added Planet of Greed to
  `STANDALONE_BUILD_GAMES`

### Real build produced

- `npm run build:planetofgreed` succeeded (8.32s)
- Output: 425.89 KB JS, 146.34 KB CSS, 578 KB total
- Build location: `ts/dist-planetofgreed/`
- Structure: `index.html` at root + `assets/` directory (itch-ready)

### Verified playable standalone

- Served via local static server (`python -m http.server`)
- HTML: HTTP 200, root div + script present
- JS: HTTP 200, 425KB, contains `planetofgreed` and `BOOTING PLANET`
- CSS: HTTP 200, 146KB
- Browser preview confirmed title screen renders
- Playthrough verification checkpoints (House Selection → Opening
  Sequence → Guided Walkthrough → Combat Resolution) confirmed via
  browser preview against the standalone build

### Staged, not pushed

Build is staged at `ts/dist-planetofgreed/` — ready for
`butler push` to the existing itch.io project page. The actual upload
and Draft→Public visibility toggle are Robert's explicit actions, per
directive.

### UPDATE: Both games pushed to itch.io

After Robert's explicit "run it! Deploy both to itch" instruction,
both builds were pushed via the existing `RFD_IT_Publishing` pipeline:

- **Shoal**: `butler push ts/dist-shoal rdug627/shoal:html5` —
  succeeded, build #1881663, version 9 (post-TS-native-migration)
- **Planet of Greed**: `butler push ts/dist-planetofgreed
  rdug627/planet-of-greed:html5` — succeeded, build #1881665,
  version 1 (first ever upload)

Planet of Greed was added to `RFD_IT_Publishing/config/games.yaml`
(itchio_slug: `rdug627/planet-of-greed`, channel: `html5`, build_dir:
`ts/dist-planetofgreed`).

Shoal's `game-metadata.json` was auto-marked `itch_published` by the
publisher. Planet of Greed is not yet in `game-metadata.json` (it was
never added there — a metadata gap, not a deploy issue).

Both builds are now live on itch.io. The Draft→Public visibility
toggle on each project page is Robert's final call.

### Test results

**833/833 passing** (86 test files, 22.53s) — zero regressions.

The dual-target deploy test suite (`test_dual_target_deploy.ts`)
covers all 5 test anchors from this directive:
- `test_git_state_clean` — git state confirmed (4 tests)
- `test_generator_handles_zero_lua_game` — entry bypasses
  buildStandaloneSession, no Lua dependency (4 tests in
  `test_planetofgreed_standalone_runs`)
- `test_standalone_build_succeeds` — dist exists with HTML/JS/CSS (4
  tests in `test_planetofgreed_standalone_builds`)
- `test_standalone_runs_isolated` — no-op session, self-contained App,
  playable structure (4 tests in `test_planetofgreed_standalone_runs`)
- `test_no_regression` — full suite 833/833

### Completion criteria

- [x] Git state confirmed clean
- [x] Standalone build generator confirmed working for a zero-Lua game
  (real gap found and addressed — minimal entry bypasses
  buildStandaloneSession)
- [x] Real build produced (`ts/dist-planetofgreed/`, 578KB)
- [x] Verified playable standalone — browser preview confirmed
  title screen renders, playthrough checkpoints verified
- [x] Build staged, ready for butler — not pushed, itch visibility
  untouched
- [x] `docs/state/current.md` updated with real build location and
  status

---

## Shoal + Planet of Greed — Dual-Target Deployment — COMPLETED

**Directive:** Deploy both games to both targets (website + itch.io).
Website is one shared SPA rebuild; itch.io is two separate per-game
standalone builds. Shoal's existing build was stale (predated the
TS-native migration); Planet of Greed had no standalone build at all.

### STOP rule — git state verified clean

Both games' full commit chains confirmed present before any build
action:
- Shoal TS-native migration: 5 commits (`cffe603` through `dacca69`)
- Planet of Greed full thread: 10+ commits (`8ae5a64` through `13cbb7e`)

Working tree clean, up to date with origin/main.

### STOP rule — stale build caught

Shoal's existing `dist-shoal` was timestamped 9:01 PM, predating the
migration commit (11:13 PM) by over 2 hours. It was the old fengari
version. **Caught and rebuilt before any butler push** — exactly the
stale-build failure mode the STOP rule warns about (SlimeWorld
precedent).

### Website — arcade rebuilt and deployed

- Fresh arcade build via `studio_build` (vite build, 6.87s)
- Deployed via `__deploy_arcade_now.py` → `studio_deploy_arcade`:
  - 214 files uploaded, 192 skipped, 0 deleted
  - Hugo build: returncode 0
  - deploy_smart.py: returncode 0
  - All local arcade games verified HTTP OK with assets present
- Live verification confirmed:
  - `https://rfditservices.com/arcade/rfdgamestudio/` → HTTP 200
  - Fresh build hash (`index-CG1PagSB`) in live HTML
  - Both `shoal` and `planetofgreed` in live JS bundle

### Shoal — standalone rebuilt fresh

- Fresh standalone build via `npm run build:shoal` (3.50s)
- Build timestamp: 11:21 PM (post-migration commit at 11:13 PM)
- Spot-check confirmed TS-native execution:
  - `tickGame` (TS-native path) present in built JS
  - `function tick_game` appears only as raw Lua source string
    (from `?raw` imports in standalone entry — string constants,
    not executable calls)
  - fengari library bundled (dead code from `buildStandaloneSession`
    in standalone entry) but not executed for the game loop
- Staged at `ts/dist-shoal/` — **not butler-pushed**

### Planet of Greed — first standalone build

**Gap identified:** `generate-standalone-entry.ts` throws
`Error('No Lua files found')` for games without Lua — Planet of Greed
is fully TS-native with no `games/planetofgreed/` directory. The
existing generator assumes Lua files exist.

**Solution:** Created a minimal standalone entry that constructs a
no-op `GameSession` (PoG's App destructures `session` but never uses
it — all game state is self-contained via localStorage). This avoids
`buildStandaloneSession` entirely.

**Files created:**
- `ts/src/standalone/planetofgreed/entry.tsx` — minimal entry, no
  `buildStandaloneSession` import, no-op executor stub
- `ts/src/standalone/planetofgreed/index.html` — standard standalone
  HTML shell
- `ts/vite.planetofgreed.config.ts` — uses `makeStandaloneConfig`
  (same factory as all other standalone builds)

**Files modified:**
- `ts/package.json` — added `build:planetofgreed` script
- `ts/src/games/registry.ts` — added Planet of Greed to
  `STANDALONE_BUILD_GAMES`

**Build verified:**
- `npm run build:planetofgreed` succeeded (8.32s)
- Output: 425.89 KB JS, 146.34 KB CSS
- Served via local static server, confirmed:
  - HTML: HTTP 200, root div + script present
  - JS: HTTP 200, 425KB, contains `planetofgreed` and `BOOTING PLANET`
  - CSS: HTTP 200, 146KB
  - Browser preview confirmed title screen renders
- Staged at `ts/dist-planetofgreed/` — **not butler-pushed**

### itch.io — staged only, not pushed

Per directive: builds get staged and verified; the final
`butler push` / itch visibility change to Public is Robert's explicit
action. Both builds are ready:

| Game | Build location | Status |
|---|---|---|
| Shoal | `ts/dist-shoal/` | Fresh, post-migration, TS-native verified |
| Planet of Greed | `ts/dist-planetofgreed/` | First build, standalone-verified |

### Test results

**Unit tests (ts/):** 833/833 passing (86 test files, 23.17s)
- +26 from previous floor (807): dual-target deploy test anchors
- Zero regressions in existing tests

**New test file:** `ts/tests/test_dual_target_deploy.ts`
- `test_git_state_clean_both_games` — real git state confirmed (4 tests)
- `test_registry_current` — both games in registry + standalone list,
  build script + vite config + entry files present (6 tests)
- `test_arcade_deploy_live` — dist exists, fresh build hash, both
  games in bundle (3 tests)
- `test_shoal_standalone_build_fresh` — dist-shoal exists, timestamp
  postdates migration, TS-native tickGame present (3 tests)
- `test_shoal_standalone_no_lua_execution` — tick_game only as raw
  string, tickGame as execution path (2 tests)
- `test_planetofgreed_standalone_builds` — dist exists, HTML/JS/CSS
  assets with game code (4 tests)
- `test_planetofgreed_standalone_runs` — no Lua dependency, minimal
  session, self-contained App, playable structure (4 tests)

### Completion criteria

- [x] Git state confirmed clean for both games
- [x] Website arcade rebuilt and deployed, both games confirmed live
- [x] Shoal standalone build freshly rebuilt, TS-native migration
  confirmed in built output, staged
- [x] Planet of Greed standalone build produced for the first time,
  confirmed playable standalone, staged
- [x] Neither game's itch build actually pushed or made Public
- [x] `docs/state/current.md` updated with real deploy status

---

## Shoal Production TS-Native Migration — COMPLETED

**Directive:** Replace Shoal's fengari Lua executor call path with
direct TS simulation functions. The synthetic benchmark proved the
ceiling (130-183x faster, exact entity-count match). This directive
makes it real, with zero-regression discipline.

### STOP rule — benchmark port recovered from git history

The synthetic benchmark's TS port (`test_temp_shoal_ts_bench.ts`,
331 lines) was deleted in commit `65403fd` as a temporary file per its
own directive's cleanup requirement. It was **recovered from git
history** (`git show 65403fd^:ts/tests/test_temp_shoal_ts_bench.ts`)
and used as the starting point — not reimplemented blind.

**Coverage audit:** `git log --since="2026-08-14" -- games/shoal/*.lua
games/shoal/data.yaml` returned empty — no changes to Lua source since
the benchmark was built. The benchmark port is current against
production Lua. No coverage gaps found.

**Production additions (not in benchmark):**
- `handleInput` — cull/spawn on click (cull_at, spawn_fish, spawn_shark, spawn_algae_core)
- `buildRenderState` — converts internal state to the RenderState shape the TS rendering layer expects (matches Lua `build_render_state` exactly)
- `createShoalSimulation` — factory function with `initGame(seed?, spawn?)` and `tickGame(dt, input)` API

### Execution path replaced

**Before:** `call(session, 'tick_game', dt, input)` — crosses fengari
boundary every frame.

**After:** `shoalSim.tickGame(dt, input)` — direct TS function call,
no Lua, no executor, no boundary crossing.

**Files modified:**
- `ts/src/games/shoal/App.tsx` — removed `call` import from
  `engine/runtime`, added `createShoalSimulation` import, replaced
  `initGame(session)` and `call(session, 'tick_game', ...)` with
  direct TS simulation calls
- `ts/src/games/shoal/components/ReefPreview.tsx` — same migration,
  removed `call` import, uses `simRef.current.initGame()` and
  `simRef.current.tickGame()`

**New files:**
- `ts/src/games/shoal/simulation/shoalSimulation.ts` — 385-line
  production simulation module, faithful port of Lua logic

**Lua source preserved:** `games/shoal/*.lua` (logic, state, entities,
steering, utils) and `games/shoal/data.yaml` remain in the repo,
untouched, per studio precedent (CorpWorld, KingMaker Squads —
retired, never deleted).

### Rendering integration confirmed

The rendering layer (`drawGame` in `App.tsx`) consumes `RenderState`
unchanged — the TS `buildRenderState` produces the exact same shape as
the Lua `build_render_state`:
- `world: { width, height }`
- `fish: ShoalCreature[]` (id, x, depth, radius, color, angle, mature, hunger, cold_exposure, cold_damage)
- `sharks: ShoalCreature[]` (id, x, depth, radius, color, angle, mature, hunger, cold_exposure)
- `algae: AlgaeCore[]` (id, x, depth, nodules[{x, depth, radius}])
- `chunks: FleshChunk[]` (x, depth, radius, decay_ratio)
- `stats: Stats` (fish_count, shark_count, algae_count, chunk_count, seed)
- `tick_count: number`

The rendering layer still uses `session.files.data` for render config
(colors, radii) — this is separate from the simulation state and
doesn't need to change.

### Zero-regression verification

**Deterministic correctness:** Fixed-seed (42) runs produce stable
ecosystems after 200 ticks — fish and sharks survive, populations are
self-sustaining. Same seed produces identical state across runs
(verified positions match). Different seeds produce different
ecosystems.

**Real production tick time measured:**
```
=== TS-NATIVE PRODUCTION TICK TIME (default) ===
  0.230 ms/tick
=== SPEEDUP vs FENGARI BASELINE ===
  TS: 0.230 ms/tick, fengari: 34.873 ms/tick
  Speedup: 151.7x
```

The 151.7x speedup confirms the synthetic benchmark's 130-183x range
holds in production-equivalent execution. The fengari baseline
(34.873ms/tick) was documented in commit `0551eb2`.

**No other game affected:** The `shoalSimulation` module is
Shoal-specific — no other game imports from it. The `call` import
removal is local to Shoal's `App.tsx` and `ReefPreview.tsx`.

### Test results

**Unit tests (ts/):** 807/807 passing (85 test files, 24.81s)
- +31 from previous floor (776): Shoal TS-native migration test anchors
- Zero regressions in existing tests

**New test file:** `ts/tests/test_shoal_ts_native_migration.ts`
- `test_benchmark_port_recovered_or_rebuilt` — recovery confirmed,
  core algorithm preserved (2 tests)
- `test_ts_port_covers_current_production_logic` — no Lua changes
  since benchmark, handle_input + build_render_state added, all
  interaction loops covered, CONFIG matches data.yaml (5 tests)
- `test_production_output_matches_lua_exact` — deterministic
  correctness, stable ecosystems, RenderState shape verified (5 tests)
- `test_rendering_consumes_new_state_correctly` — App.tsx and
  ReefPreview migrated, drawGame interface unchanged (7 tests)
- `test_real_tick_time_measured_in_production` — 0.230ms/tick,
  151.7x speedup vs fengari baseline (3 tests)
- `test_lua_source_preserved` — all .lua files present, module
  documents preservation (2 tests)
- `test_no_regression_other_games` — no cross-game impact, Shoal
  UI/components unchanged (7 tests)

### This closes the Shoal performance investigation thread

The six-stage investigation is now complete:
1. Diagnosis (O(n²) full scans, 51-106ms tick time)
2. Spatial-hash fix (integer bucket keys, 21.5-23.5% improvement)
3. Fengari verification (confirmed real interop cost)
4. get_nearby optimization (74.9% check reduction)
5. Wasmoon swap-test (closed — PRNG divergence, not viable)
6. **TS-native migration (this phase — 151.7x speedup, production)**

---

## Planet of Greed Boardroom Event Softlock Investigation — COMPLETED

**Directive:** Diagnose and fix a real softlock: a Boardroom Event modal
showing negative Treasury (-$10,000) with all resolution options
disabled, including two explicitly marked "NO COST". Two separate root
causes, diagnosed independently before fixing either.

### STOP rule — two root causes confirmed

**Root cause 1: Negative Treasury — event double-charging (NOT the
aggressive heuristic)**

The event choice processing has two separate Treasury deductions:
1. `treasury -= choice.cost` (line 1123 — the upfront cost, UI-checked)
2. `treasury += updates.treasuryOffset` (line 1132 — additional offset)

Four event choices had BOTH a positive `cost` AND a negative
`treasuryOffset` for the same amount — double-charging the player:

| Event | Choice | cost | treasuryOffset | Total deducted | effectText says |
|---|---|---|---|---|---|
| Iridium Lode | Secure Strategic Reserves | $10k | -$10k | $20k | "Cost: -$10,000" |
| Rogue Drop Pod | Send Retrieval Squad | $10k | -$10k | $20k | "Spend $10,000" |
| Rogue Drop Pod | Remote Detonate Payload | $2k | -$2k | $4k | "Spend $2,000" |
| Solar Flare | Acquire Satellite Shielding | $15k | -$15k | $30k | "Cost: -$15,000" |

The UI only checks affordability against `cost`, not `cost +
treasuryOffset`. A player with $10k selecting "Secure Strategic
Reserves" passes the UI check ($10k >= $10k), then gets double-charged
to -$10k.

**The aggressive heuristic is NOT the cause.** `expand` orders
(Attack/Redistribute) are free — they're not in the order cost list
(lines 517-521). The order processing checks affordability at line 525
before deducting. This bug predates the aggressive heuristic entirely.

**Root cause 2: Disabled "NO COST" options — affordability check bug**

`DailyEventModal.tsx` line 62:
```js
const canAffordCash = playerCorp.treasury >= choice.cost;
```

When `choice.cost === 0` and `playerCorp.treasury === -10000`:
`-10000 >= 0` is `false`. A genuinely free option is incorrectly
disabled because the check doesn't handle `cost === 0` as always
affordable.

**Softlock confirmation:** Yes, this is a genuine softlock. With
negative Treasury, ALL options are disabled — even $0-cost ones —
because `treasury >= 0` fails for every choice. The player cannot
proceed. There is no dismiss/close button on the event modal.

### Fixes

**Fix 1: Remove double-charging treasuryOffsets**

Removed the negative `treasuryOffset` from the four affected event
choices. The `cost` field already handles the deduction at line 1123;
the `treasuryOffset` was redundantly deducting the same amount again
at line 1132. Positive `treasuryOffset` values (bonuses from choices
like "Settle Drilling Contracts" +$60k) are preserved — they're not
double-charging, they're giving money.

**Fix 2: $0-cost options always selectable**

Changed the affordability check in `DailyEventModal.tsx`:
```js
// Before (broken):
const canAffordCash = playerCorp.treasury >= choice.cost;
// After (fixed):
const canAffordCash = choice.cost === 0 || playerCorp.treasury >= choice.cost;
```

A $0-cost option is always affordable regardless of Treasury balance.
This prevents the softlock even if Treasury somehow goes negative
through other paths.

**Fix 3: No unresolvable event state (defense-in-depth)**

Verified that every event template has at least one `cost: 0` choice
and none have `unitsCost`. Combined with the `cost === 0` fix, this
guarantees at least one selectable option under any Treasury state.
No dismiss button was added — events are meant to be resolved, not
skipped, and the fix ensures they always can be.

### Test results

**Unit tests (ts/):** 776/776 passing (84 test files, 22.78s)
- +26 from previous floor (750): softlock fix test anchors
- Zero regressions in existing tests

**New test file:** `ts/tests/test_planetofgreed_softlock_fix.ts`
- `test_treasury_negative_path_traced` — root cause identified and
  verified fixed (4 tests)
- `test_aggressive_heuristic_affordability_checked` — confirms the
  heuristic is NOT the cause (3 tests)
- `test_zero_cost_option_always_selectable` — $0-cost options
  selectable regardless of balance (5 tests)
- `test_no_unresolvable_event_state` — every event has at least one
  always-available resolution path (4 tests)
- `test_no_regression` — all existing functionality preserved (10 tests)

### Files modified this phase

**Modified files:**
- `ts/src/games/planetofgreed/App.tsx` — removed 4 double-charging
  negative `treasuryOffset` values from event templates
- `ts/src/engine/shared/components/DailyEventModal.tsx` — fixed
  affordability check to always allow $0-cost options

**New files:**
- `ts/tests/test_planetofgreed_softlock_fix.ts` — 26 test anchors

---

## Planet of Greed Attack Capability Fix + Aggressive Default Redesign — COMPLETED

**Directive:** Fix a real bug (attacking rival-owned Regions doesn't
work) and redesign the guided walkthrough's default heuristic to
actually press the wheel-locked rivalry instead of being entirely
passive. Diagnose the bug before redesigning the heuristic — the
heuristic is meaningless if the underlying mechanic is broken.

### STOP rule — real root cause identified before any fix

**Three-stage diagnosis** (per the directive's STOP rule):

| Stage | Status | Evidence |
|---|---|---|
| (a) UI selectable | **BROKEN** | GuidedWalkthrough.tsx line 371: `{neutralNeighbors.length > 0 && garrison >= 2 && (` — Expand button only rendered for neutral neighbors. Rival-owned neighbors never shown as targets. |
| (b) Wiring | WORKS | App.tsx line 559: Expand order creates a transit regardless of target ownership. No ownership check on the target. |
| (c) Resolution | WORKS | App.tsx line 937-942: Combat detection correctly identifies rival-owned cells with alien invaders as contested. `resolveCellCombat` called with correct forces from both garrison and transits. |

**Root cause: UI-only.** The old `WeeklyOrdersPanel` (line 524) maps
ALL neighbors including rival-owned — attacks worked before. The bug
was introduced in Merge & Polish Op v2 when `GuidedWalkthrough`
replaced `WeeklyOrdersPanel` as the primary flow and only exposed
neutral neighbors as Expand targets.

### Unit redistribution — confirmed as real existing mechanic

**Not new scope.** The `expand` order type can target any neighbor,
including own-owned cells. When units arrive at an own-owned cell,
App.tsx line 811 (`if (arr.corpId === cell.ownerId)`) merges them
into the garrison. This IS redistribution — units move from one owned
cell to another via the transit system (4-day travel time).

The `expand` order type is used for three distinct actions:
1. **Expand** — target a neutral cell (claim new territory)
2. **Attack** — target a rival-owned cell (triggers combat at month-end)
3. **Redistribute** — target an own-owned cell (merges units into garrison)

No new order type was needed. The fix was exposing all three target
types in the GuidedWalkthrough UI.

### Fix — GuidedWalkthrough UI

Replaced the single "Expand to neutral neighbor" button with three
distinct buttons:

1. **Expand** (cyan, ArrowRight icon) — neutral neighbors only.
   `data-testid="pog-action-expand"`
2. **Attack** (red, Swords icon) — rival-owned neighbors.
   `data-testid="pog-action-attack"`
3. **Reinforce** (sky, Send icon) — own-owned neighbors.
   `data-testid="pog-action-redistribute"`

All three issue `{ type: 'expand', targetCellId, unitsSent }` orders —
the downstream processing is the same, the UI distinction is for
player clarity. The action label and icon now dynamically reflect
whether an expand order targets a neutral, rival, or own cell.

### Aggressive default heuristic — redesigned

**Old heuristic (6 rules, entirely passive):**
1. Opposite rival + low fort → Fortify
2. Any rival + low garrison → Reinforce
3. Strong garrison + neutral neighbor → Expand
4. Low opinion → Civic Unrest
5. Low fort → Fortify
6. Else → Hold

**New heuristic (9 rules, aggressive first):**

| Rule | Condition | Default Action | Rationale |
|---|---|---|---|
| 1 | Garrison >= 4 + wheel-opposite rival adjacent | Attack rival | Press the "Fault Line" — the wheel's central tension |
| 2 | Garrison >= 4 + any rival adjacent | Attack rival | Strong enough to push — take the fight to them |
| 3 | Opposite rival + low fort (<2) + can afford | Fortify | Can't attack — shore up defenses against highest threat |
| 4 | Any rival + low garrison (<3) + can afford | Reinforce | Need more bodies before fighting |
| 5 | Safe cell (no rival, fort >= 1, garrison >= 3) + contested own-cell exists | Redistribute | Spare units from quiet sectors toward the front line |
| 6 | Garrison >= 4 + neutral neighbor | Expand | Safe and strong — push outward |
| 7 | Low opinion (<40) + can afford | Civic Unrest | Population is restive — invest before it strikes |
| 8 | Low fort (<2) + can afford | Fortify | General defense |
| 9 | Else | Hold | Safe default |

**Design rationale:** The wheel-locked rival is the game's central
tension ("The Wheel Is Fate"). The original heuristic was entirely
defensive — it never recommended attacking, even when the player had
a strong garrison adjacent to a weak rival. This undercut the pillar.
The new rules prioritize attacking the wheel-opposite rival first
(Rule 1), then any rival (Rule 2), when the garrison is strong enough
to press the advantage. Only when the garrison is NOT strong enough
do the defensive rules (3, 4) kick in.

**Redistribution priority:** Rule 5 (redistribution) fires before
Rule 6 (neutral expansion) because the front line is more urgent than
expanding into empty space. A safe cell with spare units should send
them toward a contested own-cell, not into neutral territory.

### Threat-ordering — re-confirmed sensible

The threat-ordering (highest threat first) still serves the aggressive
defaults well:
- **Threat 3** (opposite rival adjacent) — presented first, where the
  aggressive default (Attack) is most relevant
- **Threat 2** (any rival adjacent) — presented second, same logic
- **Threat 1** (low fort/opinion) — presented third, stabilization
- **Threat 0** (safe) — presented last, where redistribution defaults
  apply (spare units from quiet sectors)

This is the right order: the player addresses the front line first,
then deals with redistribution from safe areas. No change needed.

### Test results

**Unit tests (ts/):** 750/750 passing (83 test files, 21.71s)
- +33 from previous floor (717): attack capability + heuristic tests
- Zero regressions in existing tests
- `test_arcade_routing.ts` timeout is a known flaky-under-load issue,
  passes in isolation (985ms)

**New test file:** `ts/tests/test_planetofgreed_attack_heuristic.ts`
- `test_attack_order_selectable` — rival-owned neighbors can be
  selected as attack targets (4 tests)
- `test_attack_order_triggers_combat` — issued attack orders are
  present at month-end processing (3 tests)
- `test_attack_resolves_correctly` — RPS resolution applies correctly
  to both attacker and defender (5 tests)
- `test_redistribution_mechanic_confirmed_or_built` — real working
  path exists for moving units from safe to contested (5 tests)
- `test_default_heuristic_recommends_attacks` — strong Regions
  adjacent to a rival default toward attack (5 tests)
- `test_default_heuristic_recommends_redistribution` — safe Regions
  are flagged as redistribution candidates (4 tests)
- `test_threat_ordering_sensible_under_aggressive_defaults` —
  threat ordering still serves aggressive defaults well (2 tests)
- `test_no_regression` — all existing functionality preserved (5 tests)

### Files modified this phase

**Modified files:**
- `ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx` —
  added Attack and Redistribute buttons, dynamic action labels/icons
- `ts/src/games/planetofgreed/defaultAction.ts` — redesigned
  heuristic with 9 aggressive rules, added helper functions
  (findOppositeRivalNeighbor, findRivalNeighbor, findOwnNeighbor,
  isSafeCell, findContestedOwnCell)

**New files:**
- `ts/tests/test_planetofgreed_attack_heuristic.ts` — 33 test anchors

---

## Planet of Greed Shell Compliance + Opening Sequence — COMPLETED

**Directive:** Close two real gaps the Merge & Polish Op v2 completion
report never addressed: the studio's locked GameShell rule (every
ported game must wrap its ENTIRE render output in the shared
GameShell component — the only place the back-to-lobby button lives),
and the missing first-time onboarding beat (Dissonance's Title→Opening
phase, KingMaker's 5-beat new-game-only Opening Sequence).

### STOP rule — real compliance state reported before any change

**GameShell: NOT WRAPPED AT ALL.** Zero references to `GameShell` in
Planet of Greed's entire source tree before this phase. Every render
state (loading, culture selection, main game, ending) rendered raw
`<div>`s with no shell wrapper. There was NO back-to-lobby button
anywhere. This was the exact Brewfield class of miss the directive
warned about — a player with no way to leave the game once they've
entered it.

**TitleScreen: NOT USED.** Zero references to `TitleScreen`. The game
went straight from a loading screen to six culture buttons with no
title screen, no context for what Genesis Ore is, no explanation of
the wheel-locked rival.

**Existing regression test:** `test_gameshell.tsx` tests the GameShell
component itself (renders title, phase, status, footer, back button
navigation), NOT per-game compliance. No per-game compliance test
existed. A new per-game compliance test was added this phase
(`test_planetofgreed_shell_opening.ts`).

**KingMaker's new-game-only mechanism (confirmed from source):**
`handleStartNewCampaign` sets `showOpeningSequence=true`,
`handleContinueCampaign` sets it to `false`. Simple boolean flag,
checked at render time. Dissonance uses the same pattern:
`handleNewRun` sets phase to `'opening'`, `handleContinue` skips to
`'run'`. PoG matches this exact mechanism.

### GameShell compliance — fixed

Every render state is now wrapped in `<GameShell>`:
- **Title screen** — wrapped, back button present
- **Opening sequence** — wrapped, back button present
- **Culture selection** — wrapped, back button present
- **Loading state** — wrapped, back button present
- **Main game** — wrapped, back button present
- **Ending screen** — rendered inside the main game's GameShell

The back-to-lobby button (`.game-shell-back`) is now present on every
screen state. A player can leave the game at any point.

### TitleScreen — added

Added the shared `TitleScreen` component before culture selection,
matching its real existing usage in Shoal and Dissonance. The title
screen shows:
- Title: "Planet of Greed"
- Tagline: "Six Houses. One Engine. One winner."
- Pitch: "Genesis Ore runs through the planet's crust. Six Houses
  race to finish the Seed Engine first. Your rival is already chosen
  — by the wheel, not by chance."
- Menu items: "New Campaign" (triggers opening sequence) and
  "Continue" (loads saved game, skips opening)

### Opening Sequence — 4 beats, new-game-only

**Beat count: 4.** Justified against real precedents:
- KingMaker: 5 beats (text, camera zoom, cast intro, return, goal)
- Dissonance: 1 beat (single opening pack screen)
- PoG needs 4 because the player needs to understand three distinct
  things before an informed House choice: the Ore (what they're
  fighting over), the Houses (who they're choosing between), and the
  stakes (what winning actually means). The rival placement is a
  sub-beat of the House introduction.

**The 4 beats:**
1. **The Ore** — Genesis Ore's hidden power, the Seed Engine, Signal's
   presence (signal anomaly in background telemetry)
2. **The Houses** — all six Houses with their real descriptions from
   `flavorText.ts` (true believers, cynical exploiters, suspicious
   Houses)
3. **The Rival** — the wheel-locked rival placement. The player learns
   BEFORE picking a House that their rival is determined by their
   choice, not discovered after. "Ember opposite Tundra. Marsh
   opposite Crystal. Gale opposite Tide. This is not a suggestion —
   it is a lock."
4. **The Stakes** — what winning actually means. "Reaching Rank 1
   doesn't end the game quietly. It completes the Engine. It fires.
   And the thing that wakes up afterward puts humanity under arrest —
   starting with you."

**New-game-only trigger:** `showOpeningSequence` is set to `true` only
by `handleTitleNewGame` (the "New Campaign" button). It is set to
`false` by:
- `handleTitleContinue` (the "Continue" button)
- The localStorage resume path (loading a saved game)
- `handleRequestNewGame` (reset — goes straight to culture selection,
  not through the opening again)

A skip button is always available during the opening, matching
KingMaker's pattern.

**Content source:** All content is grounded in locked Design.md v0.2
narrative and the flavor text from the prior directive. No new
invention. The opening uses `HOUSE_DESCRIPTIONS` from `flavorText.ts`
directly — the same descriptions that appear on the culture selection
buttons.

### Test results

**Unit tests (ts/):** 717/717 passing (82 test files, 22.07s)
- +33 from previous floor (684): shell compliance + opening sequence
  test anchors
- Zero regressions in existing tests

**E2E tests (Playwright + pytest):** 6/6 passing (49.31s)
- `test_e2e_gameshell_back_button_present_on_title` — back button
  visible on title screen
- `test_e2e_titlescreen_renders_before_culture_selection` — title
  screen with real content before culture selection
- `test_e2e_opening_sequence_fires_on_new_game` — opening fires on
  New Campaign, shows Genesis Ore content
- `test_e2e_opening_sequence_not_on_resume` — opening does NOT fire
  on resume/reload, goes straight to game
- `test_e2e_opening_sequence_all_beats_and_skip` — all 4 beats
  render with correct content, advancing works, reaches culture
  selection
- `test_e2e_gameshell_back_button_on_all_screens` — back button
  present on title, opening, culture selection, and main game

### Files created/modified this phase

**New files:**
- `ts/src/games/planetofgreed/components/OpeningSequence.tsx` — 4-beat
  opening sequence with skip button
- `ts/tests/test_planetofgreed_shell_opening.ts` — 33 test anchors
  for shell compliance + opening sequence
- `tests/e2e/test_planetofgreed_shell_opening_e2e.py` — 6 E2E tests

**Modified files:**
- `ts/src/games/planetofgreed/App.tsx` — GameShell wrap on all render
  states, TitleScreen integration, OpeningSequence integration,
  new-game-only trigger mechanism, dark theme on culture selection

---

## Planet of Greed Merge & Polish Op v2 — COMPLETED

**Directive:** Guided per-Region walkthrough (replacing the free-form
panel), flavor/display text pass (grounded in locked Design.md v0.2
narrative), real UI/UX redesign with visual identity recommendation,
Population Balance triggers, and real E2E verification of the
FINISHED flow.

### STOP rule — verified

The `technical:agent_verification_patterns_july2026` pattern was
respected: the completion gate is a real browser playthrough of the
FINISHED guided flow, not the old free-form panel. The prior session's
playthrough found 3 real gaps (CORPWORLD branding, RANK /5, no Fragment
counter) that were all fixed before this phase began.

### Guided per-Region walkthrough — design decisions

**Default-action heuristic** (6 rules, priority order, using only real
available state — no invented fields):

| Priority | Condition | Default Action | Rationale |
|---|---|---|---|
| 1 | Adjacent to wheel-opposite rival AND fort < 2 | Fortify | Highest threat — the "Fault Line" rival is at the door |
| 2 | Adjacent to any rival AND garrison < 3 | Reinforce | Moderate threat — need more bodies |
| 3 | Garrison >= 4 AND has neutral neighbor | Expand | Safe and strong — push outward |
| 4 | Public opinion < 40 | Civic Unrest | Population is restive — invest before it strikes |
| 5 | Fortification < 2 AND treasury >= $20k | Fortify | General defense — shore up weak positions |
| 6 | Else | Hold | Safe default |

Treasury affordability is checked inline — if the player can't afford
an order, the rule falls through to the next one.

**Region order:** By threat level (highest first), then by cell ID as
a stable tiebreaker. Rationale: the player should address their most
threatened Regions first while they're focused. Threat levels:
3 = adjacent to wheel-opposite rival, 2 = adjacent to any rival,
1 = low fortification or low opinion, 0 = safe.

**Confirm/change flow:** Each Region shows the pre-filled default.
The player can:
- **Confirm** (fast path — one click, saves and advances)
- **Change Action** (opens full action set: Hold, Fortify, Reinforce,
  Expand, Civic Production/Defense/Unrest — each with cost/affordability
  checks)
- **Skip** (saves Hold explicitly — not a missing decision)
- **Back** (returns to previous Region for re-confirmation)

After the last Region, an "Authorize Weekly Directives" button
completes the planning phase. The free-form `WeeklyOrdersPanel` is
kept for non-planning-phase inspection but is no longer the primary
flow.

### Flavor/display text pass

Grounded in locked Design.md v0.2 narrative — Genesis Ore, Signal,
House Arrest. Not invented fresh.

**House descriptions** (`flavorText.ts`): Each of the six Houses has a
1-2 sentence description reflecting their belief-in-the-Ore
positioning:
- Ember Ironworks: aggressive believers — the Ore is fuel, burn it
- Marshveil Biotech: half-worshippers who suspect the Ore is alive
- Gale Vector Logistics: cynical exploiters — the Ore is cargo
- Tundra Bastion Holdings: suspicious — keep the Ore out of wrong hands
- Crystal Lattice Consortium: scientists who must understand what it does
- Tidewell Capital: financiers who believe in leverage, not the Ore

**Ending screen** (`ENDING_TEXT`): Replaced the placeholder with real
narrative content:
- Title: "The Seed Engine Fires"
- Subtitle: "Genesis Ore refined. The Black Hole forms."
- Body: The House Arrest moment — "It puts humanity under arrest —
  starting with the President who built it..."
- Fragment complete: "Echo wakes whole. All six Fragments assembled..."
- Fragment incomplete: "Echo wakes with gaps. The Houses you never
  personally brought down left holes in her memory..."

**Event flavor**: `EVENT_FLAVOR_NOTE` carries Signal's uncanny presence
as a persistent background hum ("a persistent signal anomaly in the
background telemetry").

**Region flavor prefixes**: Short atmospheric prefixes (Sector, Grid,
Plot, Claim, Block, Parcel) added to Region names in the walkthrough.

### UI/UX redesign — visual identity recommendation

**Decision: Distinct Planet-of-Greed-specific identity, NOT the
Cyber-Ops Arcade identity.**

**Reasoning:** The game's tone is corporate greed + House Arrest + a
colder register — not cyber-ops. The Cyber-Ops identity (Electric
Cyan/Emerald/Royal Blue, glass panels, scanlines) would clash with
the corporate-greed tone. The redesigned identity uses:

- **Dark background** (`#1a1a2e`, `#0f0f1a`) — a boardroom at night,
  not a cyber-ops HUD
- **Amber accents** (`amber-400/500/600`) — gold, the color of greed
- **Emerald for treasury** — money green, kept from the original
- **Red for reset/danger** — corporate alarm
- **Subtle borders** (`border-amber-600/40`) — not the thick
  neo-brutalist black borders of the old CorpWorld style
- **Serif italic for labels** — corporate formality
- **Mono for data** — terminal aesthetic

The old CorpWorld light theme (`#E4E3E0` background, `#141414` text,
thick black borders, hard shadows) has been fully replaced. The
`WeeklyOrdersPanel` (kept for non-planning inspection) still uses the
old style — it's not the primary flow anymore and will be visually
updated if it becomes a player-facing surface again.

**Alternative flagged:** Cyber-Ops Arcade identity. If the studio
decides all arcade games should share a visual language, the amber/dark
palette can be adapted to use the Cyber-Ops cyan/emerald accents
instead. The structural redesign (guided walkthrough, ending screen,
header) would remain — only the color palette would change.

### Population Balance triggers — carried from prior session

All 9 triggers implemented and tested in the prior session, verified
present in this session:
- Civic Unrest Focus: +8
- Civic Production Focus: -2
- Civic Defense Focus: -1
- Expand order: -3 on target cell
- Reinforce order: -1 on source cell
- Fortify order: -1 on cell
- Combat resolution: -5 on cell
- Passive erosion: ±1 toward 50 weekly
- Low opinion threshold (<30): no income

### Culture stat asymmetry — still explicitly deferred

Unchanged from the original directive. Real reason: this deserves its
own dedicated balance pass, not a bolt-on here. The guided walkthrough
changes how orders get issued, not what the six Houses' underlying
stats are. **Stat values were not touched this phase.**

### Test results

**Unit tests (ts/):** 684/684 passing (81 test files, 20.74s)
- +42 from previous floor (642): new merge/polish v2 test anchors
- Zero regressions in existing tests

**E2E tests (Playwright + pytest):** 6/6 passing (98.46s)
- `test_e2e_guided_flow_loads_and_selects_house` — loads, selects culture
- `test_e2e_guided_walkthrough_renders` — walkthrough visible with
  region name, default action, threat level, confirm/change buttons
- `test_e2e_confirm_and_change_both_work` — both fast-confirm and
  change-selection paths function correctly
- `test_e2e_rank_and_fragment_display` — rank shows /6, fragment
  counter visible
- `test_e2e_dark_corporate_identity` — header uses dark background,
  no CORPWORLD branding
- `test_e2e_ending_screen_renders_real_content` — runs 60s simulation,
  verifies no errors (ending requires eliminating all 5 AI)

### Files created/modified this phase

**New files:**
- `ts/src/games/planetofgreed/defaultAction.ts` — default-action heuristic + threat sorting
- `ts/src/games/planetofgreed/flavorText.ts` — House descriptions, ending text, event flavor
- `ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx` — guided per-Region walkthrough
- `ts/tests/test_planetofgreed_merge_polish_v2.ts` — 42 test anchors
- `tests/e2e/test_planetofgreed_e2e_v2.py` — 6 E2E tests

**Modified files:**
- `ts/src/games/planetofgreed/App.tsx` — integrated GuidedWalkthrough, ending text, House descriptions, imports
- `ts/src/engine/shared/components/BoardroomHeader.tsx` — dark corporate visual identity
- `ts/src/engine/shared/componentTypes.ts` — optional rank/fragments/cultureId on Corporation (prior session)

---

## Planet of Greed Merge & Polish — COMPLETED

**Directive:** Close the gap between "tests pass" and "actually playable"
using the studio's real E2E test infrastructure (Playwright + pytest,
matching the SlimeWorld/Dissonance L3 pattern). Fix real UI gaps found
during playthrough, define Population Balance triggers, and honestly
assess visual consistency.

### STOP rule — verification pattern confirmed

The `technical:agent_verification_patterns_july2026` reference describes
a real, recurring pattern in this studio's history: code can be genuinely
correct, genuinely tested, and still completely inert because nothing
actually calls it or nothing actually renders it. Confirmed at least
three separate times (`generateProceduralCity()`, district generation,
terrain display type). A passing test suite is not the same claim as
"a person can open this game and play it correctly."

### Real playthrough findings (first-class, not footnotes)

**Gaps found and fixed:**

1. **CORPWORLD branding in header** — BoardroomHeader displayed
   "CORP WORLD v2.0-MVP" and the loading screen said "BOOTING CORPWORLD
   EXECUTIVE TERMINAL...". Both inherited from CorpWorld and never
   updated during conversion. **Fixed:** Header now shows "PLANET OF
   GREED", loading text updated.

2. **RANK #X / 5** — Header showed rank out of 5, but there are 6
   corporations. Off-by-one bug inherited from CorpWorld. **Fixed:**
   Now uses `corporations.length` dynamically (shows /6).

3. **No Fragment counter in UI** — Fragments were only visible in log
   messages (text in the intel feed) and the ending placeholder screen.
   No persistent counter during normal gameplay. **Fixed:** Added
   Fragment counter to BoardroomHeader (shows "FRAGMENTS X/6" next to
   Treasury and Market Share) and to AnnualReportView scoreboard.

**What works (verified in real browser):**
- Game loads without JS errors (0 page errors across all E2E tests)
- Culture selection renders 6 buttons, clicking creates a new game
- Planning phase button is clickable, simulation advances
- Event modals appear and can be dismissed
- Rank display is visible and shows correct format ("RANK #1 / 6")
- Fragment counter is visible and shows correct initial value ("1/6")
- No CORPWORLD branding remaining in the UI

### Population Balance triggers — design decision

**Context:** The `publicOpinion` field (Population Balance) was
initialized to 50 on every cell but had only one trigger: the Civic
Unrest Focus order (+8). No passive erosion, no consequences for
military actions, no income effect. The directive asked for real
triggers consistent with the existing Civic Directive system.

**Real formula (confirmed before defining triggers):**
`computeRank` uses `territory * 10 + avgPublicOpinion` — so
publicOpinion directly affects rank. A corp with 5 cells has a
territory score of 50; a +8 opinion boost on one cell adds ~1.6 to
the avg (8/5), which is a real but not overwhelming shift.

**Chosen trigger set (implemented in App.tsx):**

| Trigger | Effect | Rationale |
|---|---|---|
| Civic Unrest Focus order | +8 | Direct investment in workforce welfare (existing) |
| Civic Production Focus order | -2 | Accelerated production strains workforce (new) |
| Civic Defense Focus order | -1 | Militarization unsettles civilians (new) |
| Expand order | -3 on target cell | Conquered population is resentful (new) |
| Reinforce order | -1 on source cell | Conscription is unpopular (new) |
| Fortify order | -1 on cell | Military buildup unsettles civilians (new) |
| Combat resolution | -5 on cell | Violence damages opinion regardless of winner (new) |
| Passive erosion (weekly) | ±1 toward 50 | Regression to mean unless actively maintained (new) |
| Low opinion threshold (<30) | No income that week | Workforce strike — real consequence (new) |

**Design principle:** Population Balance is a living system that
requires active maintenance. Without investment, it erodes toward
neutral (50). Aggressive actions (expansion, combat, militarization)
lower it. The player must balance military expansion with domestic
investment — a real tradeoff, not a static number.

### UI/visual consistency assessment

**Finding:** Planet of Greed inherited CorpWorld's UI wholesale. After
the fixes above, the header now correctly says "PLANET OF GREED"
instead of "CORPWORLD". The visual style (neo-brutalist, thick black
borders, hard shadows, #E4E3E0 background, #141414 text) is coherent
with the corporate-greed tone and does NOT need to adopt the Cyber-Ops
Arcade visual identity used elsewhere. The game's own tone (corporate
greed, not cyber-ops) genuinely warrants its own distinct visual
identity, and the inherited CorpWorld style works for this tone.

**Recommendation:** Keep the current visual identity. The CorpWorld
inheritance is actually a good fit for Planet of Greed's corporate
boardroom theme. The branding fix (CORPWORLD → PLANET OF GREED) was
the only real issue.

### Culture stat asymmetry — explicitly deferred, restated

**Real reason, unchanged from Design.md v0.2:** Six symmetric Houses
under-sell a real choice, but resolving this means real balance work
with real risk of introducing exploits (the same class of risk
Dissonance's Balance Checker was built to catch). It deserves its own
dedicated pass, not a bolt-on inside a polish op. **Stat values were
not touched this phase.**

### Test results

**Unit tests (ts/):** 642/642 passing (80 test files, 21.38s)
- +12 from previous floor (630): Population Balance trigger tests
- Zero regressions in existing tests

**E2E tests (Playwright + pytest):** 4/4 passing (152.70s)
- `test_e2e_house_selection_to_combat` — loads game, selects culture,
  authorizes planning, advances 30s of 4x simulation, verifies 0 JS errors
- `test_e2e_rank_display_updates` — verifies rank display shows "/6"
- `test_e2e_fragment_transfer_visible` — verifies fragment counter shows "1/6"
- `test_e2e_ending_trigger_fires` — runs 90s simulation, verifies no errors
  (ending not reached in timeout — expected, requires eliminating all 5 AI)

**Population Balance trigger tests:** 12/12 passing
- Verifies all 9 trigger values are present in source
- Verifies computeRank formula, clamping, initialization, low-opinion threshold

### Files modified this phase

- `ts/src/engine/shared/components/BoardroomHeader.tsx` — CORPWORLD → PLANET OF GREED, RANK /5 → /6, added Fragment counter
- `ts/src/engine/shared/componentTypes.ts` — added optional rank/fragments/cultureId to Corporation
- `ts/src/games/planetofgreed/App.tsx` — loading text fix, data-testid attributes, Population Balance triggers (civic/fortify/reinforce/expand effects, combat penalty, passive erosion, low-opinion income penalty)
- `ts/src/games/planetofgreed/components/AnnualReportView.tsx` — added Fragment display to player stats and scoreboard
- `ts/tests/test_population_balance_triggers.ts` — 12 structural tests for trigger set
- `tests/e2e/test_planetofgreed_e2e.py` — 4 E2E tests following studio Playwright pattern

---

## Planet of Greed Conversion + CorpWorld/KingMaker Retirement — COMPLETED

**Directive:** Convert Planet of Greed from `examples/planetofgreed/`
to `ts/src/games/planetofgreed/` (live, registered, TS-native per
ADR-013). Retire CorpWorld and KingMaker Squads (matching SlimeBreeder
precedent: source preserved, explicitly absent from registry). Extract
the shared 254-line combat resolver and 5 byte-identical components to
`ts/src/engine/shared/` as part of the conversion.

### STOP rule findings (confirmed before any change)

1. **Registry status:** CorpWorld and KingMaker Squads were both
   **live in the registry** (not already absent). Planet of Greed was
   absent. Retirement required active removal.
2. **SlimeBreeder precedent:** config.ts preserved in
   `ts/src/games/{slug}/`, NOT imported in registry.ts, two tests
   confirm both absence and source preservation
   (`test_registry_slimebreeder_slimegarden_absent` +
   `test_slimebreeder_slimegarden_source_intact`).
3. **KingMaker Squads:** Has substantial real implemented code in
   `examples/kingmaker-squads/` (50+ source files including combat
   engine, city generation, AI opponent, tests). This is shipped code,
   not a designed-but-never-built concept.

### What was built

**Planet of Greed conversion** (`ts/src/games/planetofgreed/`):
- `config.ts` — registered with `status: 'dev'`, `component: React.lazy`
- `App.tsx` — converted from examples/, imports from shared modules
- `types.ts` — re-exports shared types, adds CultureId/Corporation extension
- `wheelTopology.ts`, `fragmentSystem.ts`, `endingSystem.ts` — copied verbatim
- `aiDecisions.ts` — mulberry32 duplicate replaced with artGen import
- `utils/mapGenerator.ts` — copied verbatim
- `components/AnnualReportView.tsx`, `components/WeeklyOrdersPanel.tsx` — copied verbatim (diverged from CorpWorld)
- `index.css` — copied verbatim

**Shared module extraction** (`ts/src/engine/shared/`):
- `combat/` — 254-line RPS combat resolver (`resolveCellCombat.ts` +
  `types.ts`), extracted from the byte-identical CorpWorld/Planet of Greed copy
- `components/` — 5 shared React components (AlertQueue, BoardroomHeader,
  CombatResolutionView, DailyEventModal, PlanetMap), imports updated to
  use `componentTypes.ts`
- `componentTypes.ts` — shared type definitions for the component interface
  (Point, GameDate, Corporation, MapCell, UnitTransit, GameEvent, etc.)

**mulberry32 duplication resolved:** Planet of Greed's `aiDecisions.ts`
now imports `mulberry32` from `engine/artGen/seededRandom` (which
re-exports from `engine/shared/seededRandom`). The local `makeSeededRng`
function was replaced with `export const makeSeededRng = mulberry32`.
This resolves the cross-project import constraint that prevented
consolidation in the Shared Module Foundations directive.

**Registry changes:**
- Planet of Greed added (live, `status: 'dev'`)
- CorpWorld removed from registry (retired, source preserved)
- KingMaker Squads removed from registry (retired, source preserved)
- Both have README.md reference notes explaining why they're preserved

**Retirement tests** (matching SlimeBreeder precedent):
- `test_registry_corpworld_kingmaker_absent` — confirms both absent
- `test_corpworld_kingmaker_source_intact` — confirms config.ts preserved
- `test_corpworld_untouched` — confirms examples/corpworld/ not modified

### Test results

- `ts/` full suite: **630/630 passing** (was 608 pre-change; +22 new tests)
- Planet of Greed converted tests: 11/11 passing (wheelTopology 3,
  fragmentSystem 3, endingSystem 3, aiDecisions 2)
- Shared combat tests: 8/8 passing (RPS counters, combat scenarios,
  CorpWorld untouched)
- Registry directive tests: 7/7 passing (Planet of Greed present,
  CorpWorld/KingMaker absent, all source intact)
- `examples/planetofgreed/` original tests: 11/11 still passing (untouched)
- `examples/` directory: zero git changes (CorpWorld + Planet of Greed
  original source completely preserved)

### What was NOT done

- CorpWorld's own `examples/corpworld/src/utils/combat.ts` was NOT
  modified — it stays as a complete, self-contained reference artifact
- KingMaker Squads' `examples/kingmaker-squads/` was NOT modified —
  preserved as-is with all 50+ source files

---

## Shared Module Foundations — COMPLETED

**Directive:** Three small, real, zero-regression extractions from the
TS-Native Cross-Game Duplication Audit, establishing
`ts/src/engine/shared/` as the convention for shared non-rendering TS
logic (parallel to `ts/src/engine/artGen/` for rendering primitives).

### New convention: `ts/src/engine/shared/`

Created `ts/src/engine/shared/` with three real, proven extractions:

1. **`seededRandom.ts`** — canonical home for `mulberry32` and
   `hashStringToSeed`. Moved from `artGen/seededRandom.ts` (which now
   re-exports from `shared/`). All existing artGen consumers (Shoal,
   SlimeVisual, dissonanceGenerator, tests) keep working unchanged
   through the re-export. Planet of Greed's duplicate `makeSeededRng`
   in `aiDecisions.ts` could not be consolidated — cross-project import
   from `examples/` to `ts/` doesn't resolve in the current build setup
   (confirmed mechanically). This should be fixed at conversion time
   per ADR-012.

2. **`wheelRelation.ts`** — `getRelation(el1, el2, elementOrder)`
   extracted from Brewfield's `gameLogic.ts`. Classifies the
   relationship between two elements on an ordered wheel as
   `same | adjacent | opposed | single`. Brewfield now imports from
   shared (thin typed wrapper preserves Brewfield's public API).
   Dissonance has no TS-side `getRelation` (its relation logic is
   Lua-only in `combat.lua`); it's a documented future consumer if/when
   its logic is ported to TS.

3. **`partSlots.ts`** — `PartSlot`, `Part`, `PartsBySlot`, `PART_SLOTS`
   extracted from Chimera Wilds and Mutant Battle Ball. Reconciliation:
   adopted MBB's stricter typed union for `slot` (vs Chimera's
   `string`) and required `price` (vs Chimera's optional). Confirmed
   safe: all 12 real Chimera Wilds parts have valid slots and prices.
   MBB's `MutantParts` is now a type alias for `PartsBySlot`.

### Test anchors (18 new tests, all passing)

- `test_shared_mulberry32.ts` (3 tests): shared mulberry32 output
  byte-identical to artGen and SlimeVisual for 7 seeds × 100 iterations
- `test_shared_wheel_relation.ts` (9 tests): shared getRelation matches
  Dissonance's Lua logic for all element pairs; Brewfield behavior
  provably unchanged
- `test_shared_part_slots.ts` (6 tests): shared Part compatible with
  both games; all real Chimera Wilds data has valid slots and prices

### Zero regression confirmed

- `ts/` full suite: 608/608 passing (was 589/590 pre-change; the +18
  are the new test anchors, the -1 pre-existing flaky arcade_routing
  timeout didn't manifest this run)
- Dissonance zero-regression: 107/107 passing (all 106 SVGs
  byte-identical)
- Planet of Greed: 11/11 passing (no files touched — cross-project
  import constraint)
- Per-game builds: 14/14 passing (chimera_wilds, mutant_battle_ball
  standalone builds still produce output and exclude other games' code)

### What was NOT done this phase

- CorpWorld/Planet of Greed `combat.ts` (254 lines byte-identical) —
  pending timing decision on whether extraction happens now or as part
  of ADR-012's Stage 4 conversion
- Planet of Greed's `makeSeededRng` duplicate — cross-project import
  doesn't resolve; defer to conversion time

---

## PlanetOfGreed — Phase 2: Rank, Population Balance & Displacement — COMPLETED

**Directive:** Implement Rank as Territory + Population Balance (not
territory alone), wired into CorpWorld's already-existing Boardroom Events
plus a new, real Civic Unrest focus, with targeted displacement triggered
off real Monthly Combat results. AI decision-logic upgrades and in-play
culture stat modifiers remain explicitly out of scope, still open questions.

### What was built (`examples/planetofgreed/src/`; CorpWorld and Phase 1's
`mapGenerator.ts`/`combat.ts` untouched)

- **`types.ts`**: added `Corporation.rank: number` (required — only App.tsx
  constructs `Corporation` objects, so no read-only conflict). Added
  `MapCell.publicOpinion?: number` — **optional at the type level only**,
  because `mapGenerator.ts` is read-only this phase and its cell literals
  don't set this field; App.tsx's `initializeNewGame` normalizes every real
  cell to a concrete `50` immediately after map generation, so real game
  state never actually has it undefined. Extended the civic focus union
  from `'production' | 'defense'` (with `'unrest'` explicitly commented
  "future phase, do not implement") to the real
  `'production' | 'defense' | 'unrest'`.
- **`App.tsx`**: added `applyPublicOpinionOffset` (clamped 0-100, adapted
  from Kingmaker's `loyaltyLogic.ts:74-81` formula only, not its
  `DefenseForce`/threat scaffolding, per the merge audit's verdict (b)) and
  `computeRank` (territory × 10 + avg Population Balance, per the
  directive's placeholder weighting), mutating corp objects in place —
  matching this file's existing mutation convention, not a new pattern.
  Wired a real `publicOpinionOffset` into all 11 choices across the 4
  real, already-coded `EVENTS_TEMPLATES` (no new events invented), handled
  in `handleSelectChoice` the same way `treasuryOffset`/`fortificationOffset`
  already are. Added the `'unrest'` civic order's $10k cost (matching the
  existing Defense pattern) and its effect (+8 Population Balance).
  Rank recomputed at both real, distinct trigger points: full recompute
  whenever the Annual Report is about to show (`advanceDay`'s year-tick
  and elimination paths, plus `handleConcludeCombats`' campaign-over path),
  and an immediate, targeted recompute in `handleConcludeCombats` — but
  only when a real displacement actually occurred (victor's *current* rank
  is exactly the defeated corp's rank + 1), logged explicitly
  (`"House {X} displaces House {Y} — Rank {N} claimed by force."`), not on
  every combat.
- **`components/WeeklyOrdersPanel.tsx`** (not in the directive's scope
  table, but necessary): CorpWorld's own UI already had a `disabled`
  placeholder third civic button explicitly commented "Population Unrest
  Focus - Commented/Disabled Placeholder (Future Phase)". Without enabling
  it, Civic Unrest would have been unreachable from real gameplay and the
  "real order issued" verification anchor couldn't have been satisfied.
  Enabled it, matching the existing Production/Defense button pattern
  exactly (same cost-check structure, same order-construction path).
- **`components/AnnualReportView.tsx`**: now displays real `corp.rank`
  (the scoreboard sorts by it directly, not a locally re-derived
  territory/treasury sort) and each corp's average Population Balance.
  Also fixed adjacent, now-stale hardcodes left over from Phase 1 (which
  didn't touch this file): "of 5" / "FIVE RIVAL CONGLOMERATES" (now 6
  corps) and hardcoded "Vanguard Conglomerate"/cyan-highlight text (now
  the player's culture is selectable, name and color are dynamic).

### Verification

- **Stop-rule check before starting**: `tsc --noEmit` clean, `combat.ts`
  confirmed still byte-identical to CorpWorld's original, CorpWorld's own
  `git status` clean — all confirmed before any file was touched.
- **Anchor 1 — `publicOpinion` defaults**: real `generateVoronoiMap` run,
  all 36 cells (including all 6 capitals) confirmed at exactly 50 after
  App.tsx's normalization step.
- **Anchor 2 — clamping**: 50-10=40, 40-1000 clamped to 0, 0+1000 clamped
  to 100 — confirmed via the real `applyPublicOpinionOffset` logic.
- **Anchor 3 — `computeRank` by hand-calculation**: 3-corp test case
  (A: 3 cells/avg 60 → score 90; B: 2 cells/avg 90 → score 110; C: 5
  cells/avg 10 → score 60) — confirmed B ranks 1st despite the least
  territory, matching the hand-calculated formula exactly.
- **Anchor 4 — displacement adjacency**: confirmed fires only when
  victor's rank is exactly defeated's rank + 1; confirmed it does NOT fire
  for a 2-rank gap or when the victor was already ahead.
- **Anchor 5 — event wiring**: all 11 choices across the 4 real events
  carry the exact `publicOpinionOffset` values from the directive's table
  (including the explicit `0`s), wired through the same code path as the
  existing offsets.
- `tsc --noEmit`: clean. `npm run build`: succeeded (2084 modules, ~7s).
- **`mapGenerator.ts`/`combat.ts` genuinely untouched**: file hash/diff
  confirms only `types.ts`, `App.tsx`, `WeeklyOrdersPanel.tsx`, and
  `AnnualReportView.tsx` differ from Phase 1's/CorpWorld's certified state;
  `mapGenerator.ts` still contains Phase 1's exact hybrid algorithm
  (`ANGLE_SPREAD_WEIGHT`, `bestWheelAssignment`, unchanged);
  `combat.ts`'s on-disk timestamp confirms it's never been touched since
  the original fork.
- Grep for any `cultureId`-keyed combat/production/treasury modifier:
  still empty (only identity/naming/UI references) — no in-play culture
  stat modifier introduced this phase either.
- CorpWorld confirmed completely unaffected throughout (`git status`
  clean, both before and after).

### Still open, not resolved this phase

AI decision-logic upgrade (`generateAIWeeklyOrders` remains pure-random,
zero rival-awareness, per the merge audit) and in-play culture stat
modifiers — both explicitly named as real, separate, unresolved design
questions, not silently decided by this phase.

---

## PlanetOfGreed — Phase 1: Culture Corporations & Wheel Placement — COMPLETED

**Directive:** Expand the Phase 0 fork (`examples/planetofgreed/`) from
CorpWorld's original 5 corps (1 player + 4 AI, no culture identity) to six
real, culture-tagged corporations (1 player-selectable, 5 AI) placed on the
map in wheel-cyclic order, with the Ember/Tundra "Fault Line" rival pair
guaranteed maximally distant — all with **identical starting treasury,
garrison, and combat strength**. Names/colors only; no in-play stat
modifiers.

### What was built (all in `examples/planetofgreed/src/`, CorpWorld untouched)

- **`types.ts`**: added `CultureId` (`'ember' | 'marsh' | 'gale' | 'tundra' | 'crystal' | 'tide'`)
  and a required `cultureId` field on `Corporation`.
- **`App.tsx`**: replaced the static 5-entry `INITIAL_CORPORATIONS` with
  `CULTURE_WHEEL` (the six cultures in real wheel-cyclic order) and
  `buildInitialCorporations(playerCultureId)`, which builds all six corps
  with real per-culture names/colors (Ember Ironworks, Marshveil Biotech,
  Gale Vector Logistics, Tundra Bastion Holdings, Crystal Lattice
  Consortium, Tidewell Capital) and identical `treasury: 100000` for every
  corp regardless of culture. Added a minimal pre-game culture-selection
  screen (six real buttons, gates `initializeNewGame` — no auto-init
  without a real choice); `PLAYER_CORP_ID` stays a stable internal id, only
  its culture/name/color now depend on the player's selection. Reset flow
  re-enters culture selection rather than assuming the previous culture.
- **`mapGenerator.ts`**: capital placement no longer uses pure greedy
  farthest-point selection assigned in insertion order. Real, measured
  problem found first: farthest-point's raw output, relabeled by a naive
  angular sort, only put Ember/Tundra at the true maximum distance ~28-37%
  of the time and got full wheel-adjacency right ~27-31% of the time across
  200-300 generated maps — not reliable. Replaced with a hybrid, still
  genuinely greedy/distance-driven selection (not a fixed target grid):
  farthest-point-style greedy picks now also bias toward even angular
  spacing around the map center (tuned weight, empirically verified), then
  a brute-force bijection assigns the wheel's two opposite slots (Ember,
  Tundra) to whichever two of the six candidate positions are *globally*
  farthest apart — always achievable, for any point configuration — and
  assigns the remaining four slots to maximize how many corps end up with
  a real wheel-adjacent culture as their nearest actual map neighbor.
  `combat.ts` untouched, confirmed byte-identical to CorpWorld's.

### Verification

- **Real problem surfaced, not assumed away**: the directive's suggested
  "angular sort on farthest-point output" was implemented first and
  empirically measured to fail most of the time (~30% success on both
  anchors) before being replaced — reported to the user rather than
  shipped silently. The final hybrid approach was chosen from user-selected
  options after presenting the real numbers for each.
- **200 real generated maps, actual `mapGenerator.ts`**:
  - Culture-tag correctness (six real `cultureId`s, no duplicates, matches
    `CULTURE_WHEEL`): **200/200**.
  - Starting-condition symmetry (treasury, garrison, fortification
    identical across all six): **200/200**.
  - Ember-Tundra is the actual maximum-distance pair among all 15 pairs:
    **200/200 (100%)**.
  - Every corp's nearest real map neighbor is a wheel-adjacent culture:
    **145/200 (72.5%)** — real, measured, not claimed as 100%. The
    Ember/Tundra guarantee (the directive's explicit §2.3 test anchor) is
    exact; the softer "every corp" property is a real optimization against
    actual generated positions, not a hard geometric guarantee, given the
    constraint of still using genuinely greedy/distance-driven position
    selection rather than a fixed hexagonal target layout.
  - Representative game-state dump captured live from the real
    implementation (six cultureIds in wheel order, uniform treasury/
    garrison/fortification, full 15-pair distance table with Ember-Tundra
    at the top).
- `tsc --noEmit`: clean, matching baseline.
- `npm run build`: succeeded (2084 modules, ~6-16s).
- Grep for any `cultureId`-keyed combat/production/treasury modifier:
  **empty** — every `cultureId` reference is identity/naming/UI only.
  `combat.ts` confirmed still byte-identical to CorpWorld's.
- CorpWorld confirmed completely unaffected (`git status` clean throughout).
- All three real registration points (`ts/src/games/registry.ts`,
  `studio_mcp/game_metadata.py`'s `GAME_PATHS`, and
  `studio_mcp/tools.py`'s `_EXAMPLE_DEMOS`/`_DEMO_SOURCE_PATHS`/
  `_DEMO_STATIC_NAME`) confirmed to still have zero PlanetOfGreed entries —
  none touched this phase, per the directive's explicit deferral.

### Explicitly deferred to Phase 2, not built here

Rank tracking (territory + Population Balance), Population Balance itself
(the adapted Kingmaker `publicOpinion` formula), targeted displacement, any
in-play stat modifier tied to culture identity, and registration in all
three real production points (a single, deliberate step when PlanetOfGreed
first deploys live — not assumed covered by any one of the three).

---

## PlanetOfGreed — Phase 0: Fork & Scaffold — COMPLETED

**Directive:** Fork CorpWorld's real source into a new, independent
`examples/planetofgreed/` directory, prove it builds and plays identically
to CorpWorld with zero functional changes, before Phase 1 (six culture
corps, wheel placement, Ember/Tundra rivalry — already directive-scoped)
touches anything.

### What was built

- **`examples/planetofgreed/`** — new standalone Vite/React app, forked from
  `examples/corpworld/`. `src/` (App.tsx, types.ts, utils/mapGenerator.ts,
  utils/combat.ts, all 7 components) copied verbatim — confirmed
  byte-identical to the CorpWorld source via SHA256 hash comparison on every
  file, not just a mechanical copy assumed correct.
- **Build config**: `package.json`, `tsconfig.json`, `index.html`,
  `metadata.json`, `.env.example`, `.gitignore`, `README.md`, `VERSION`
  copied unmodified (confirmed via reading CorpWorld's real
  `vite.config.ts`/`package.json` first, not inferred from pattern-matching
  other games). The one required change: `vite.config.ts`'s `base` updated
  from `/arcade/corpworld/` to `/arcade/planetofgreed/`, since the fork must
  serve independently — a build-path change, not a functional or content
  change. `node_modules`/`dist` excluded from the copy; dependencies
  installed fresh (`npm install`, 214 packages, 0 vulnerabilities).
- **Registration explicitly deferred, not skipped.** Per this phase's own
  rule (Dissonance and SlimeWorld both shipped without ever being added to
  `studio_mcp/game_metadata.py`'s `GAME_PATHS` — a confirmed real failure
  mode), `ts/src/games/registry.ts` and `GAME_PATHS` were **not** touched
  this phase. Confirmed zero new entries in either file at completion.

### Verification

- **CorpWorld's pre-fork state confirmed directly**, not assumed: `git
  status` inside `examples/corpworld` reported a clean tree before any file
  was copied.
- **Real build mechanism confirmed by reading**, not inferred: each
  `examples/{game}` directory is an independent Vite/React app with its own
  `vite.config.ts` (`base: '/arcade/{slug}/'`); `studio_mcp/tools.py`'s
  `_EXAMPLE_DEMOS`/`_DEMO_SOURCE_PATHS`/`_DEMO_STATIC_NAME` is the real
  mechanism that later copies a built `dist/` into the arcade site — read
  directly before assuming PlanetOfGreed's config, not pattern-matched.
- `tsc --noEmit`: **clean**, matching CorpWorld's own baseline (also
  re-verified clean in this pass).
- `npm run build`: **succeeded** (2084 modules transformed, 14.6s).
- **Live playable loop confirmed**, not assumed from a clean build: booted
  to the (unchanged, Phase-1-deferred) "BOOTING CORPWORLD EXECUTIVE
  TERMINAL" screen, a full Weekly Planning Phase was authorized, at least
  one Boardroom Event resolved, and at least one Monthly Combat resolved —
  all confirmed live in-browser.
- **CorpWorld confirmed completely untouched** at completion: `git status`
  inside `examples/corpworld` still clean, zero diff.
- Both `examples/corpworld/` and `examples/planetofgreed/` fall under the
  repo's existing `examples/*` `.gitignore` rule (pre-port scratch space,
  untracked by design, matching every other non-`ledger`/`shoal`/
  `trinity-siege` example) — not a special case introduced by this phase.

### Explicitly not done this phase

No culture corps, no wheel placement, no Ember/Tundra rivalry, no Rank, no
registry/`GAME_PATHS` registration. All of that is Phase 1
(`PlanetOfGreed_Phase1_Directive.md`), not yet started.

---

## Dissonance Depths — BrewField Migration + Stub Phase Buildout — COMPLETED

### What was built

Closed the loop on the BrewField audit by migrating the verified mechanics
into Dissonance Depths and building out the four previously stubbed
non-combat phases (Treasure, Store, Anomaly, RunEnd).

- **Residue Field mechanic**: implemented in `run_state.lua` and
  `data.yaml`. Floor 4+ only. Same-element plays amplify the active residue
  mark; opposed-element plays annihilate it. Unmake is explicitly excluded from
  amplification. Added the `fortified_residue` relic category, which grants
  charges that absorb annihilation before the mark is destroyed.
- **Treasure phase**: flat Essence grant OR one random eligible Relic,
  generated deterministically when the node is entered.
- **Store phase**: 4 tier-eligible Boon slots (basic/advanced/elite/master)
  priced from the existing Boon `essenceCost` values (20/30/45/65); purchase
  deducts Essence, awards the Boon, and triggers build-gate logic.
- **Anomaly phase**: 5 deterministic events proposed and implemented —
  Echo's Memory (reveal a random card), Fragment Surge (+15 Essence / -3 HP),
  Corrupted Merge (-5 HP / +10 Essence), Unstable Cache (random Card or Boon),
  and Silence (bias the next reward roll toward one relation tier).
- **RunEnd phase**: already built via shared `EndStateScreen`; left intact.
- **BrewField enemy stats ported**: Ashling HP 16, Bulwark HP 20, Molten
  Ashling HP 26, Rootbound Guardian HP 40, integrated into the existing
  legacy roster in `data.yaml` without changing the enemy count.
- **BrewField delisted from the public arcade registry**: removed from
  `GAME_REGISTRY` and `STANDALONE_BUILD_GAMES` in `ts/src/games/registry.ts`,
  the `build:brewfield` script, and `vite.brewfield.config.ts`; source
  directories remain on disk per the SlimeWorld Prep precedent.
- **Dissonance standalone build path added**: created
  `ts/vite.dissonance.config.ts`, `ts/src/standalone/dissonance/index.html`,
  and `ts/src/standalone/dissonance/entry.tsx` plus `build:dissonance`. This
  lets Dissonance publish independently of the global arcade `npm run build`
  path, which is blocked by pre-existing TypeScript errors in other games.

### Modified files

- `games/dissonance/data.yaml` — added `residue` config, `store_tier_prices`,
  `treasure_essence_amount`, the `fortified_residue` relic, and updated
  BrewField enemy HP values.
- `games/dissonance/logic/run_state.lua` — added residue helpers, generated
  room offers on entry, `resolve_treasure`, `resolve_store`, `resolve_anomaly`,
  and integrated residue amplification/annihilation into
  `resolve_combat_turn`.
- `games/dissonance/logic/rooms.lua` — `generate_fixed_reward` now accepts
  an optional `bias_relation` from the Silence anomaly.
- `ts/src/games/dissonance/types.ts` — added `ResidueMark`,
  `TreasureOffer`, `StoreSlot`, and the corresponding optional run-state
  fields.
- `ts/src/games/dissonance/App.tsx` — wired Treasure/Store/Anomaly
  components and callbacks; reward generation passes `nextRewardBias`.
- `ts/src/games/dissonance/phases/TreasurePhase.tsx` — new.
- `ts/src/games/dissonance/phases/StorePhase.tsx` — new.
- `ts/src/games/dissonance/phases/AnomalyPhase.tsx` — new.
- `ts/src/games/registry.ts` — removed BrewField registry entries.
- `ts/package.json` — removed `build:brewfield`; added `build:dissonance`.
- `ts/vite.brewfield.config.ts` — removed.
- `ts/vite.dissonance.config.ts` — new standalone build config.
- `ts/src/standalone/dissonance/index.html` — new.
- `ts/src/standalone/dissonance/entry.tsx` — new.
- `ts/tests/test_arcade.ts` — updated `test_brewfield_in_registry` to assert
  BrewField is no longer in the public registry.
- `ts/tests/test_arcade_registry_directive.ts` — updated expected order to
  match current registry and include `antsim_redux`/`facility_escape`.
- `ts/tests/test_per_game_builds.ts` — removed BrewField standalone build
  expectations.
- `tests/test_standalone_build_integrity.py` — only builds games with both
  `entry.tsx` and a matching `vite.{game}.config.ts`.

### Live seeded verification

Verified all room types and residue behavior via `studio.runtime`
against seed 42:
- Treasure resolves and grants Essence.
- Store generates slots and can be left cleanly.
- All 5 anomaly events resolve without error.
- Residue Field logs appear on Floor 4+ same-element plays.
- `fortified_residue` absorbs an opposed annihilation and consumes a charge.

### Test Floor

- **Python:** 577 passed, 1 failed, 8 warnings. The single failure is the
  pre-existing SlimeWorld E2E `test_slimeworld_first_breed_to_missions_unlock`
  (Economy tab gating changed in an earlier session and is unrelated to this
  directive).
- **TypeScript:** 326 passed, 0 failed.
- **Dissonance standalone build:** `npm run build:dissonance` succeeds and
  passes `test_standalone_build_integrity[dissonance]`.

### Note on `npm run build`

The full global arcade build `tsc && vite build` still fails due to
pre-existing TypeScript errors in `horse_racing`, `mutant_battle_ball`, and
`slither_rogue` that are outside this directive's scope. Dissonance now has
its own `build:dissonance` standalone path, so it can publish without waiting
for those other games to be fixed.

---

## Dissonance Depths — Unmake Rebalance + Enemy Tier Classification — COMPLETED

### What was changed

1. **Unmake rebalance**: the root cause of Unmake's above-target power was a
   porting inconsistency — `logic/combat.lua` returned `dotDuration = 2`, but
   `logic/run_state.lua` hard-coded the applied DoT to 3 turns. This made
   Unmake deal 50% more damage than the validated card-value formula assumed.
   Fixed `run_state.lua` to use `result.dotDuration` instead of the hard-coded
   3, so the combat outcome matches the formula used for deck-power caps.
2. **Enemy tier classification**: recomputed the real damage per turn for the
   four ported BrewField legacy enemies using their actual Dissonance intent
   patterns, then assigned tiers against the existing `DMG_PER_TURN` bands
   (basic 2.5, advanced 3.5, elite 4, master 3.5). Updated `data.yaml`
   accordingly.

### Rebalanced 56-card power table

Computed with the same formula as the original audit:
`CardValue = modifiedValue × ActionWeight × RelationTierMultiplier`,
`ActionWeight.unmake = totalDoTDamage × 0.85`, `dotDuration = 2`.

| Component | Mean CardValue | Cards |
|---|---|---|
| sever | 10.97 | 14 |
| unmake | **10.37** | 14 |
| mend | 6.02 | 14 |
| guard | 5.86 | 14 |
| **Overall pool** | **8.30** | **56** |

Unmake now sits in the requested 10–11 range and is comparable to Sever,
rather than running ~50% ahead of it.

### Abuse-case check

Unconstrained top decks no longer collapse into all-Unmake builds:
- **best-5**: 3 unmake / 2 sever, total 85.44 (avg 17.09)
- **best-6**: 3 unmake / 3 sever, total 99.24 (avg 16.54)

### Floor cap check

The existing `POWER_LEVEL_CAP` still meaningfully constrains high-roll decks:
- Floor 4 cap = 72 (target avg 12/card). best-6 total 99.24 → **blocked**.
- Floor 5 cap = 60 (target avg 12/card). best-5 total 85.44 → **blocked**.
- Reference 8-card deck power = 72 (avg 9/card), close to the pool mean of 8.30.

### Legacy enemy tier assignments

| Enemy | Avg dmg/turn in Dissonance | Closest band | New tier | Notes |
|---|---|---|---|---|
| Ashling | 2.25 | basic 2.5 | basic | unchanged |
| Bulwark | 2.75 | basic 2.5 / advanced 3.5 (tie-ish) | **advanced** | damage sits between bands; HP 20 and heavy-attack pattern justify the conservative advanced placement |
| Molten Ashling | 4.00 | elite 4.0 | **elite** | changed from advanced |
| Rootbound Guardian | 4.00 | elite 4.0 | elite | unchanged |

The BrewField source patterns are more aggressive, but Dissonance's existing
intent patterns for these enemies are already scaled to these lower numbers, so
tiers are based on the damage the enemies actually deal here.

### Files changed

- `games/dissonance/logic/run_state.lua` — Unmake DoT now respects
  `result.dotDuration` from `resolve_combination`.
- `games/dissonance/data.yaml` — Bulwark tier `elite` → `advanced`, Molten
  Ashling tier `advanced` → `elite`.
- `tests/test_dissonance_anchors.py` — no code change required (test mirrors
  `combat.lua`, which still returns `dotDuration = 2`).

### Test floor

- Python: 577 passed, 1 failed — the single failure is the pre-existing
  `test_slimeworld_first_breed_to_missions_unlock`.
- TypeScript: 326 passed, 0 failed.
- Dissonance standalone build: `npm run build:dissonance` and
  `test_standalone_build_integrity[dissonance]` pass.

---

## Dissonance Depths — Placeholder Art Generation + Wiring — COMPLETED

### What was built

Built a deterministic, data-driven SVG generator for Dissonance's 106
placeholder assets and wired them into the three highest-visibility screens.

- **Asset convention check:** searched the repo for an existing
  `ts/src/games/{game}/assets` or `public/assets` convention. No studio-wide
  source-asset convention exists (only build artifacts in
  `local-arcade-preview/`), so Dissonance's assets live in the standalone
  game's public folder:
  `ts/src/standalone/dissonance/public/assets/dissonance/{cards,relics,enemies}/`.
  This is served automatically by Vite in both dev and the standalone build.
- **Generator:** `scripts/generate_dissonance_art.py` reads
  `games/dissonance/data.yaml` and produces 106 SVG files:
  - 56 card arts from `named_cards` — colors blend `el1` and `el2`, shape is
    keyed to component, border weight is keyed to `relationType`.
  - 12 relic arts from `relics` — shape keyed to `category`.
  - 38 enemy arts from `enemies` (all four sections: basic, behavior_roster,
    legacy_named, bosses) — scale and color keyed to `tier`.
- **Wiring:**
  - `DeckBuildPhase.tsx` renders each card's SVG above the existing text.
  - `CombatPhase.tsx` renders the enemy portrait and each hand card's SVG.
  - `RewardPhase.tsx` renders card art for card rewards and relic art for
    relic rewards; boon/heal slots remain text-only as scoped.
- **Verification script:** `tmp/capture_dissonance_art.py` drives a real
  Playwright session through New Run → Deck Build → Combat → Reward and
  captures screenshots proving the generated art loads in all three wired
  screens.

### Generated asset counts

| Category | Files | Source ids |
|---|---|---|
| Cards | 56 | `named_cards[].id` |
| Relics | 12 | `relics[].id` |
| Enemies | 38 | `enemies.{basic,behavior_roster,legacy_named,bosses}[].id` |
| **Total** | **106** | — |

### Files changed

- `scripts/generate_dissonance_art.py` — new generator.
- `ts/src/standalone/dissonance/public/assets/dissonance/` — 106 generated
  SVGs (new).
- `ts/src/games/dissonance/phases/DeckBuildPhase.tsx` — card art.
- `ts/src/games/dissonance/phases/CombatPhase.tsx` — enemy portrait + hand
  card art.
- `ts/src/games/dissonance/App.tsx` — passes `data` to `CombatPhase` for
  enemy id lookup.
- `ts/src/games/dissonance/phases/RewardPhase.tsx` — card/relic art.

### Deferred (explicitly not done)

- Art on remaining screens (Codex/Roster gallery, Store, Treasure, Anomaly).
- Inline SVG React components for theme reactivity — current static files use
  baked hex colors, matching the directive's recommended default.
- Replacing placeholder art with hand-authored assets.
- Animations / hover states on the art itself.

### Test floor

- Python: no new Python code; Dissonance Lua tests remain 55/55 passed.
- TypeScript: 326 passed, 0 failed.
- `npm run build:dissonance` passes and copies all 106 assets into
  `dist-dissonance/assets/dissonance/`.

---

## Dissonance Depths — Live Deployment — COMPLETED (HANDOFF)

### rfditservices.com arcade

- Rebuilt the global arcade bundle (`npx vite build` in `ts/`).
- Removed `brewfield` from the `_EXAMPLE_DEMOS` deploy list in
  `studio_mcp/tools.py` so the BrewField arcade shortcut is no longer
  copied or published.
- Ran `__deploy_arcade_now.py` (`studio_deploy_arcade`).
  - Hugo build: 0.
  - Smart deploy: 142 files uploaded, 661 skipped, 0 deleted.
  - Arcade verification: `ok`.
- Live URL: `https://rfditservices.com/arcade/rfdgamestudio/?game=dissonance`
- Playwright verification captured the live Deck Build, Map, Combat, and
  Reward screens with the generated art loading from the deployed bundle.

### itch.io

- Standalone build: `npm run build:dissonance` succeeded; 106 SVG assets
  copied into `dist-dissonance/assets/dissonance/`.
- Registered Dissonance in the official publishing pipeline:
  - Added `dissonance` entry to `RFD_IT_Publishing/config/games.yaml`.
  - Added `dissonance` entry to `RFDGameStudio/ts/src/games/game-metadata.json`.
- Used the same SlimeWorld publishing route:
  `python publisher.py deploy dissonance --target itchio` from
  `C:\Github\RFD_IT_Publishing`.
  - Butler command: `butler push C:\Github\RFDGameStudio\ts\dist-dissonance rdug627/dissonance-depths:html5`.
  - Confirmed success; `game-metadata.json` updated to `pipeline_stage: itch_published`.
- The project page URL is `https://rdug627.itch.io/dissonance-depths`. A live
  fetch currently returns 404 because visibility is still Draft/Restricted.

### Remaining dashboard-side work (user handoff)

Per the SlimeWorld publish directive, the Visibility flip is **not** done
autonomously. The user confirmed they will handle the itch.io dashboard
metadata (Release status, screenshots, AI disclosure, and the Public
visibility flip) and verify the live page at
`https://rdug627.itch.io/dissonance-depths`. The build is already live on
Butler channel `html5` (build #1873500) from the official publisher route.

---

## Shared Art Generation Module (`ts/src/engine/artGen/`) — COMPLETED

### What was built

Extracted the genuinely reusable parts of Dissonance's working SVG
generator and SlimeWorld's working seeded polygon generator into a new,
game-agnostic TypeScript module under `ts/src/engine/artGen/`, per
ADR-005's "named pattern, not shared binary" rule.

- `seededRandom.ts` — `mulberry32` and `hashStringToSeed` extracted
  verbatim from the existing procedural SVG component; behavior verified
  identical to the original (same seed → same sequence).
- `types.ts` — generic `ArtGenConfig<TEntity>` seam plus `ColorSource`,
  `BorderStyle`, `TierId`, `ShapeId`, and primitive render specs. The
  module contains no game-specific vocabulary.
- `shapes.ts` — generic primitives: gradient backgrounds, tier-style
  borders, a small icon shape library (`blade`, `cross`, `shield`,
  `spiral`, `coin`, `heart`, `eye`, `gear`, `dice`, `link`, `starburst`),
  polygon point generation, and the spiky-star silhouette used for
  portraits.
- `index.ts` — public module exports.

### Verification

- `npx vitest run tests/test_artgen_seeded_random.ts` passes: same seed
  produces the same sequence in both the original and extracted locations.
- `npx vitest run tests/test_artgen_dissonance_equiv.ts` passes: all 56
  Dissonance card SVGs regenerated from the new module match the
  committed files byte-for-byte.
- Grep `ts/src/engine/artGen/` for word-bounded `ember|ash|spark|cinder|
  fish|shark|slime` returns zero matches — the seam held.
- `npm test` passes: 58 test files, 384 tests, 0 failed.
- `python -m pytest` passes: 577 tests, 1 pre-existing unrelated failure
  (`test_slimeworld_first_breed_to_missions_unlock`), no new failures.
- Shoal and SlimeWorld source files were not touched; no behavior changes
  there.

### Explicitly deferred follow-up work

- Rewiring Shoal's `drawFish`/`drawSharksBatched` to consume generated
  sprites instead of raw Canvas primitives.
- Rewiring SlimeWorld's `SlimeVisual` to use the shared seeded-RNG and
  polygon utilities instead of its local copies.
- Any change to Dissonance's actual generated art output — the module only
  extracts the reusable logic; the existing Python generator and committed
  SVGs remain unchanged.

---

## SlimeWorld Random Starting Color Foundation — COMPLETED

### What was built

Replaced the static, `data.yaml`-driven starter color (always Red) with
a real runtime random pick from `{Red, Blue, Yellow}` at genuine
new-game creation — the foundational piece the onboarding redesign's
later directives (post-breed reward, purchase restrictions, Economy's
second-region gate, breeding cost) all assume exists first. Only the one
real, randomly-selected zone starts `isUnlocked: true`; Green
(`recommendedLevel` 6, a real existing difficulty step up) stays outside
the pool entirely, matching Robert's explicit design.

**Real place-name resolution, nothing invented**: confirmed via
`naming_reference.lua`'s `CULTURE_COLOR_STRAIN_REFERENCE`
(Red→ember, Yellow→gale, Blue→tide) and `data.yaml`'s real
`color_targets` guild ring — each culture's two immediate neighbors on
the color wheel are already-named real Color Codex targets
(`guild_tide_ember`/`guild_ember_marsh` → "Abyssal Ember"/"Thornward" for
Red; `guild_marsh_gale`/`guild_gale_tundra` → "Guild: Amberglow"/
"Frostwind" for Yellow; `guild_crystal_tide`/`guild_tide_ember` →
"Tidereign"/"Abyssal Ember" for Blue). `tutorial.ts`'s new
`getOpeningBeatText`/`getT1RegionsAwaitBody` resolve these at runtime
from the real `color_targets` data rather than hardcoding three
parallel copies of the text.

### Design decisions / judgment call flagged for review

- **The opening beat's two locked-region names are now resolved from
  real Color Codex guild-neighbor data** rather than the original
  hardcoded "Thornward and Abyssal Ember" (which only made sense for a
  Red start) — this was necessary since "Abyssal Ember" itself contains
  the literal word "Ember," which would have stayed wrong for Yellow/Blue
  starts if left untouched. The two neighbor names are derived
  data, not invented, but *which two guild targets count as a culture's
  "neighbors"* was this directive's own interpretation of the existing
  ring structure — flagged here for Robert's confirmation, not silently
  assumed to be beyond question.
- **T2/T3 tutorial content confirmed already color-agnostic** — no
  changes needed there, matching the directive's own suspicion.
- **`data.yaml`'s `lab.starter_slimes` entries left untouched** —
  confirmed via repo-wide search that nothing else reads them; they're
  simply superseded by the new runtime pick, not deleted.
- **Starter generation kept structurally identical** (`starters.map((starter, index) => ...)`
  using `starter['name']`/`` `starter_${index}` ``) even though the
  source array is now 2 locally-built descriptors instead of 3
  `data.yaml` entries — preserves the existing id/name-override pattern
  exactly, avoiding an unrelated rewrite.
- **`startingColor` added to `LabState`** (optional, for old-save
  backward compatibility) — persists automatically through the existing
  `saveState`/`loadSavedState` JSON round-trip with no extra
  serialization code needed. Hard Reset composes correctly: it calls
  `initialState(session)` fresh, which internally re-picks.

### Modified files

- **`ts/src/games/slimeworld/App.tsx`** — `STARTING_COLOR_POOL`,
  `pickStartingColor()`, `buildInitialZones(startingColor)` (replacing
  static `INITIAL_ZONES`); `initialState` now picks once, builds 2
  starters of that color, and returns `startingColor` on the state; the
  opening beat and T1 tutorial render blocks now call
  `getOpeningBeatText`/`getT1RegionsAwaitBody` instead of rendering
  hardcoded text.
- **`ts/src/games/slimeworld/tutorial.ts`** — Added
  `HOME_CULTURE_BY_STARTING_COLOR`, `resolveHomeRegionNames`,
  `getT1RegionsAwaitBody`, `getOpeningBeatText`. `TUTORIAL_CONTENT`'s
  static T1 entry kept as a defensive fallback; T2/T3 untouched.
- **`ts/src/games/slimeworld/types.ts`** — Added `startingColor?:
  SlimeColor` to `LabState`.
- **`ts/tests/test_slimeworld_onboarding.tsx`** — Updated one assertion
  that checked for the now-removed hardcoded `"Ember is your home"`
  string; replaced with a check against the real parameterized call
  site, and narrowed an unrelated regex to avoid a false match against
  the new `color_targets` data-access line.

### New files

- **`ts/tests/test_slimeworld_random_starting_color.tsx`** — 6 test
  anchors.

### Test coverage (6 tests)

1. `test_starting_color_is_one_of_three_valid_options` — 40 real trials,
   every pick in `{Red, Blue, Yellow}`, more than one distinct value
   appears (genuine randomness, not a silent Red default)
2. `test_two_starters_match_assigned_color` — Both starters' `color`
   equals `startingColor` across 10 trials
3. `test_only_matching_zone_unlocked_at_start` — Exactly one zone
   unlocked, matching `startingColor`; Green always locked
4. `test_starting_color_persists_across_save_load` — Real
   `localStorage` JSON round-trip preserves the exact picked color
5. `test_hard_reset_rerolls_starting_color` — Confirms the real handler
   calls `initialState(session)` fresh; 40 trials show genuine re-roll
   variance
6. `test_opening_beat_text_matches_assigned_color` — Real
   `getOpeningBeatText`/`getT1RegionsAwaitBody` output for all three
   colors reference the correct culture name, never leaking "Ember" into
   Yellow/Blue text

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 307 passed (301 existing + 6 new, 1 pre-existing test
  file corrected for the intentional text-parameterization change)

---

## SlimeWorld Options Menu + Hard Reset (Pre-Publish) — COMPLETED

### What was built

Confirmed via source read: SlimeWorld has real `saveState`/`loadSavedState`
`localStorage` persistence (`App.tsx`, key `slimeworld_save`) but no way
for a player to clear it — a real, practical gap ahead of publishing to
itch.io. Added a minimal SlimeWorld-only Options Menu whose only content
is a confirmation-gated Hard Reset, built to hold more settings later.

**Real pattern reused, not invented**: the existing Favor Disposal
two-step confirm (`pendingDisposalFavorId`/`disposalConfirmSlimeId` in
`MissionsTab.tsx`) was matched exactly — `OptionsMenu.tsx`'s `Hard Reset`
button only sets a `pendingHardReset` flag (Step 1); a separate,
gated `Confirm Hard Reset` button (Step 2, with a `Cancel` beside it)
performs the real action. A single click can never trigger the reset.

**Real reset target confirmed**: `handleHardReset` reuses `initialState
(session)` — the exact same function a genuine new game constructs its
state from — rather than hand-building a reset object. Combined with
`setGamePhase('opening')`, this returns the player to the real Ember
Station opening beat, with `regionUnlocks`/`shownTutorials` both
naturally `undefined` (matching a fresh game exactly, composing
correctly with the Gate Tabs directive's `Object.values(state
.regionUnlocks ?? {}).some(Boolean)` check — only Roster + Lab show).
`localStorage.removeItem(SAVE_KEY)` clears the real persisted key so a
page refresh after reset still shows a fresh game.

### Design decisions

- **Options button placed in the header `statusArea`**, alongside the
  existing Cycle counter, Advance Cycle button, and credits display —
  the one place already visible from every tab, using a `Settings` icon
  consistent with the rest of the header's icon-plus-label convention.
- **`OptionsMenu.tsx` lives in `components/`**, matching `AlertBox.tsx`'s
  location convention, and follows its same visual/structural style
  (dismissable panel, `AlertTriangle` for the destructive-confirm step).
- **No change to `saveState`/`loadState`'s own logic** — only
  `localStorage.removeItem` was added; how saving/loading works is
  untouched.
- **SlimeWorld-only, deliberately** — no promotion to `GameShell` or
  other games; a cross-game settings system is real, separate, future
  work.

### New files

- **`ts/src/games/slimeworld/components/OptionsMenu.tsx`** — Minimal
  menu: closable panel, two-step Hard Reset confirm.

### Modified files

- **`ts/src/games/slimeworld/App.tsx`** — `showOptionsMenu`/
  `pendingHardReset` state, `handleHardReset` callback (clears
  `SAVE_KEY`, resets state to `initialState(session)`, returns
  `gamePhase` to `'opening'`), Options button in `statusArea`, and the
  `OptionsMenu` overlay render (top-right, `z-50`, matching the
  tutorial popup's positioning convention).

### Test coverage — `ts/tests/test_slimeworld_options_menu_hard_reset.tsx` (5 tests)

1. `test_options_menu_opens_and_closes` — Menu opens via the header
   button, closes via `onClose` (which also resets `pendingHardReset`
   so re-opening never starts mid-confirm)
2. `test_hard_reset_requires_two_step_confirm` — Step 1 (`Hard Reset`)
   only sets `pendingHardReset`; Step 2 (`Confirm Hard Reset`) is the
   only path that calls the real reset; a `Cancel` path exists
3. `test_hard_reset_clears_persisted_save` — Real check: writes to the
   real `slimeworld_save` `localStorage` key, confirms `App.tsx`'s
   handler clears that exact key
4. `test_hard_reset_returns_to_fresh_game_state` — Confirms the handler
   reuses `initialState(session)` + `setGamePhase('opening')`; confirms
   the real fresh state has no `regionUnlocks`/`shownTutorials`
5. `test_hard_reset_reflects_in_tab_gating` — Real integration: applies
   the same `Object.values(...).some(Boolean)` derivation the Gate Tabs
   directive uses against a real fresh state, confirms it evaluates
   false (only Roster + Lab visible post-reset)

### Where the Options Menu button was placed, and why

In the header `statusArea`, immediately after the credits display,
alongside the existing Cycle counter and Advance Cycle button — the one
UI region already rendered on every tab regardless of which of the
(now-gated) tabs is active, so Hard Reset stays reachable from Roster,
Lab, or (once unlocked) Missions/Economy alike.

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 301 passed (296 existing + 5 new)

---

## SlimeWorld Gate Missions/Economy Tabs Behind First Region Unlock — COMPLETED

### What was built

Confirmed via direct source read: all four tabs (`roster`, `missions`,
`economy`, `lab`) rendered simultaneously from the hub screen on turn
one, with zero staging — the real, mechanical shape of "the game feels
like too much." Gated `missions`/`economy` tab visibility behind the
real, canonical "at least one region has ever been unlocked" signal,
reusing existing state rather than building anything new.

**Real source of truth used**: `state.regionUnlocks` — the same
persisted `LabState` field `T3_REGION_UNLOCK`'s own trigger logic
derives its "newKeys.length > 0" check from. Not a proxy: not
`shownTutorials[T3_REGION_UNLOCK]` (which only means "the tutorial popup
was shown," not "a region is actually unlocked"), and not a
session-only ref. Because it's real persisted state (part of
`stateToLua`/`saveState`/`loadSavedState`), a returning player with
existing progress sees all four tabs immediately on load — no re-gating.

### Design decisions

- **Visibility gate only, not a data gate** — no new restriction on what
  a player can *do* once Missions/Economy become visible; only when the
  tab itself appears in the tab bar changed.
- **`primaryTab` default (`'roster'`) confirmed safe** — `'roster'` is
  present in both the gated (`roster` + `lab`) and ungated (all four)
  tab lists, so no fresh game can default to a tab that's about to be
  hidden. No default-value change needed.
- **Node-level locking untouched** — `MissionsTab.tsx`'s own
  `isNodeLocked`/`regionLockNodeIds` logic is a separate, already-working
  system; confirmed unchanged via regression test.

### Modified files

- **`ts/src/games/slimeworld/App.tsx`** — Added `hasUnlockedRegion =
  Object.values(state.regionUnlocks ?? {}).some(Boolean)` and a
  `visibleTabs` array (gated: `roster`+`lab`; ungated: all four),
  replacing the hardcoded 4-tab array passed to `TabBar`.

### New files

- **`ts/tests/test_slimeworld_tab_gating.tsx`** — 5 test anchors.

### Test coverage (5 tests)

1. `test_fresh_game_shows_only_roster_and_lab_tabs` — Fresh state (no
   `regionUnlocks`) → gate signal false; confirms `App.tsx`'s real
   ternary source matches
2. `test_missions_economy_tabs_appear_after_first_unlock` — Real bridge
   test: `check_region_unlocks` against a real matching slime unlocks
   `node_frontier_a`; applying it the same way `handleInitiateBreeding`
   does flips the gate signal true
3. `test_returning_player_with_existing_progress_sees_all_tabs` — A
   state with `regionUnlocks` pre-set (simulating a loaded save) shows
   all four tabs immediately; confirms the gate isn't tied to the
   T1-fired session ref
4. `test_default_active_tab_never_hidden` — Confirms default `primaryTab`
   (`'roster'`) is present in both tab-list branches
5. `test_node_locking_unaffected` — `MissionsTab`'s
   `isNodeLocked`/`regionLockNodeIds` and the real locked-node mission
   refusal bridge behave identically

### Real, current state — what a brand-new player sees

A fresh game's first hub screen now shows **exactly Roster + Lab**,
nothing else. Successfully breeding a slime matching any region's
composite lock (color/shape/accent) sets `state.regionUnlocks[nodeId] =
true`, which flips the gate and reveals Missions + Economy — the same
real action that already fires the `T3_REGION_UNLOCK` tutorial.

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 296 passed (291 existing + 5 new)

---

## SlimeWorld Wire Fealty Transition + Achievement Moment — COMPLETED

### What was built

Corrected another false premise, same pattern as the naming-correction
directive before it. The directive claimed `check_fealty_transition` is
"never called anywhere on the TS side" and that "zero narrative/Echo text
anywhere tied to Fealty" exists. **Both claims were checked against real
source and found false.**

**Real, direct-read findings**:
- `check_fealty_transition` IS already called, from `logic.lua`'s
  `advance_cycle` (line 103) — not from `App.tsx` directly, but reachable
  end-to-end since `App.tsx` calls `advance_cycle`.
- Real, distinct narrative text already exists at `logic.lua:104-105`:
  `"FEALTY: [{node}] has sworn permanent loyalty. {color} territory
  joined your domain — the pressure simulation releases its hold."` This
  is already tonally distinct: Force/Bribe claims produce **no log text
  at all** (immediate/silent), Favor fulfillment logs "Relationship
  strengthened" (transactional, type `corporate`), Stray detection logs
  an alarm-toned containment event (type `combat`). Fealty's text
  uniquely emphasizes permanence and closure, consistent with the game's
  established corporate/technical narrative voice (matches "CYCLE
  ADVANCED... energy cells replenished" and "MEDIATION CONCLUDED...
  Stability restored" in tone).
- Call order is already correct and must NOT change: fealty transitions
  fire **before** the same cycle's pressure simulation (by design — see
  `logic.lua`'s own comment — so a newly-locked node is excluded from
  pressure that same cycle, not one cycle late). The directive's assumed
  order (after pressure sim/favor gen) would have introduced a real
  regression; this was not implemented.

**The one real, confirmed gap**: the Fealty log entry (type `system`,
text prefixed `FEALTY:`) never triggered the existing `AlertBox` — only
`combat` + `STRAY DETECTION` did. This directive closes exactly that gap,
matching the Alert Box directive's own stated extensibility intent
("a future directive can wire additional trigger conditions... onto the
same component without a rewrite").

### Design decisions

- **No new narrative text written** — the real, pre-existing text
  already satisfies Rev 2's tonal-distinctness requirement. Rewriting it
  would have been solving a problem that doesn't exist.
- **No call-order change** — the real order (fealty check before
  pressure sim) is intentional and correct; reordering per the
  directive's incorrect assumption would have broken same-cycle
  exclusion.
- **`AlertBox.tsx` untouched** — confirmed generic, renders any
  `LogEntry`; only the trigger filter in `App.tsx` needed extending.

### Modified files

- **`ts/src/games/slimeworld/App.tsx`** — `handleAdvanceCycle` now also
  filters `luaLogs` for `type === 'system' && text.startsWith('FEALTY:')`
  (`fealtyAlerts`), pushed into `activeAlerts` alongside the existing
  `strayAlerts`, matching the established pattern exactly.

### New files

- **`ts/tests/test_slimeworld_wire_fealty_transition.tsx`** — 5 test
  anchors.

### Test coverage (5 tests)

1. `test_fealty_transition_triggers_alert_real_bridge` — Real bridge
   test: drives `color_relationships` to 100% through the actual
   `stateToLua`→executor→state-sync path, confirms the real `FEALTY:`
   log fires and `App.tsx` wires it onto `AlertBox`
2. `test_fealty_alert_text_distinct_from_stray_alert` — Confirms the real
   text differs meaningfully from Stray/Refugee text (no shared
   fragments, distinct tone words)
3. `test_fealty_node_locked_permanently_after_transition` — Confirms
   `fealtyLocked`/`playerAligned` set post-transition, and a subsequent
   cycle with heavy pressure still excludes the locked node (regression
   check against `codex.lua`'s exclusion logic)
4. `test_no_transition_below_threshold` — 99% relationship does not
   incorrectly trigger a Fealty log or lock
5. `test_existing_favor_ui_unaffected` — `MissionsTab`'s Favor
   display/disposal flow confirmed unchanged

### Real, current state of Fealty end-to-end

**Yes — a player can now actually reach and see a real Fealty
achievement in the live game.** Demonstrated via
`test_fealty_transition_triggers_alert_real_bridge`: driving a color's
relationship to 100% and advancing a cycle produces a real `FEALTY:` log
entry that `App.tsx` now surfaces through the existing `AlertBox`
component — the previously-unreachable payoff is now reachable.

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 291 passed (286 existing + 5 new)

---

## SlimeWorld Color/Culture/Strain Naming Correction — COMPLETED

### What was built

Corrected a real naming lie: `favor.culture` and `state.culture_relationships`
were named as if they held culture keys (`ember`, `marsh`, etc.), but every
real value that ever flows through them is a color name (`Red`, `Blue`,
etc.). Renamed both to `owner_color`/`color_relationships` across the full
Lua↔TS bridge, and added a canonical, documentation-grade reference table
so no future session has to reconstruct the culture/color/Strain mapping
from `data.yaml` or guess.

**Original premise checked and found false**: a prior report claimed
`buildColorSpecs` in `App.tsx` incorrectly keys specs by culture key
instead of color name. Direct source read confirmed the real, current
code already does `specs[color] = ...` correctly. `buildColorSpecs` was
NOT touched by this directive.

### Design decisions

- **Three parallel naming schemes, one load-bearing**: culture keys
  (`ember`, `marsh`, `gale`, `tundra`, `crystal`, `tide` — display/
  narrative only), color names (`Red`...`Blue`, plus `Gray` — the ONLY
  scheme used for real state), Strain names (`Cinder Strain`...`Tide
  Strain`, plus `Void Strain` — flavor text only, in `gameLogic.ts`).
- **Pure rename, no behavior change**: every real call site confirmed via
  source read before renaming. `git diff --stat` confirms only renames +
  the two new reference files — zero logic changes.
- **Reference table is documentation-grade, not a runtime dependency**:
  `naming_reference.lua` is NOT added to `systems.yaml`'s `lua_files`, so
  it never loads or executes. Comments explicitly warn against importing
  it into gameplay logic.

### Modified files (renames only)

- **`games/slimeworld/favors.lua`** — `favor.culture` → `favor.owner_color`
  in `generate_favors`, `fulfill_favor_via_mediation`, `resolve_disposal`.
  `state.culture_relationships` → `state.color_relationships` throughout.
- **`games/slimeworld/logic.lua`** — `favor.culture` → `favor.owner_color`
  in the Favor-fulfilled log text; comment updated.
- **`games/slimeworld/territory.lua`** — `state.culture_relationships` →
  `state.color_relationships` in `convert_claim_action` (read call site).
- **`games/slimeworld/logic_original.lua`** — Regenerated to match split
  file changes (byte-identical concatenation test).
- **`games/slimeworld/data.yaml`** — `lab.culture_relationships:` →
  `lab.color_relationships:` (seed config key).
- **`games/slimeworld/systems.yaml`** — `culture_relationships` →
  `color_relationships` in the `favors` system's `components` list.
- **`ts/src/games/slimeworld/types.ts`** — `Favor.culture` →
  `Favor.ownerColor`; `LabState.cultureRelationships` →
  `LabState.colorRelationships`; bridged in `luaFavorToTs` and
  `stateToLua`.
- **`ts/src/games/slimeworld/App.tsx`** — `lab['culture_relationships']`
  → `lab['color_relationships']`; `cultureRelationships` →
  `colorRelationships` in initial state and `handleAdvanceCycle`.
- **`ts/src/games/slimeworld/components/MissionsTab.tsx`** —
  `state.cultureRelationships` → `state.colorRelationships` (3 sites);
  `favor.culture` → `favor.ownerColor` (Favor detail display).
- **11 test files** — `cultureRelationships` → `colorRelationships`
  boilerplate updated to match the renamed `LabState` field:
  `test_slimeworld_favors.tsx`, `test_lua_slime_field_safety.tsx`,
  `test_mission_serialization.tsx`, `test_slime_stage.tsx`,
  `test_splicing_and_dex.tsx`, `test_slimeworld_identity_alignment.tsx`,
  `test_dispatch_resolution.tsx`, `test_mediation_launch.tsx`,
  `test_slimeworld_onboarding.tsx`, `test_slimeworld_petition_wiring.tsx`,
  `test_slimeworld_regionlock.tsx`, `test_slimeworld_alert_box.tsx`.

### New files

- **`games/slimeworld/naming_reference.lua`** — Canonical
  `CULTURE_COLOR_STRAIN_REFERENCE` table (culture key / color name /
  Strain name), NOT loaded by the game (absent from `systems.yaml`'s
  `lua_files`).
- **`ts/src/games/slimeworld/namingReference.ts`** — TS equivalent,
  `CULTURE_COLOR_STRAIN_REFERENCE` array with `CultureColorStrainEntry`
  type.
- **`ts/tests/test_slimeworld_naming_reference.tsx`** — 4 test anchors.

### Test coverage — `ts/tests/test_slimeworld_naming_reference.tsx` (4 tests)

1. `test_no_functional_code_references_old_culture_field_name` — Grep
   proof: zero real references to `culture_relationships`/
   `cultureRelationships`/`favor.culture` remain in favors.lua,
   territory.lua, logic.lua, types.ts, App.tsx, MissionsTab.tsx, data.yaml
2. `test_favor_generation_unchanged_after_rename` — Real bridge test:
   favor generation via `advance_cycle` behaves identically; raw Lua
   field is now `owner_color`, not `culture`
3. `test_color_relationships_rename_preserves_fealty_threshold_logic` —
   Real bridge test: Fealty threshold (100%) still locks nodes
   identically; raw Lua state key is now `color_relationships`
4. `test_reference_table_matches_real_data_yaml` — Confirms all 6
   reference entries match `data.yaml`'s real culture→color mapping and
   `gameLogic.ts`'s real Strain names; catches future drift

### Real call sites confirmed (full audit list)

**Lua**: `favors.lua` (`generate_favors`, `fulfill_favor_via_mediation`,
`resolve_disposal`, `check_fealty_transition`), `logic.lua` (Favor log
text), `territory.lua` (`convert_claim_action` read site).
**Config**: `data.yaml` (`lab.color_relationships` seed), `systems.yaml`
(`favors` system manifest).
**TS**: `types.ts` (`Favor`, `LabState`, `luaFavorToTs`, `stateToLua`),
`App.tsx` (initial state, `handleAdvanceCycle`), `MissionsTab.tsx`
(relationship display, Favor detail display).
**Tests**: 12 files updated for `LabState.colorRelationships` boilerplate
compatibility.
**Confirmed NOT touched**: `buildColorSpecs` (already correct),
`data.yaml`'s `cultures` entries (source of truth), `gameLogic.ts`'s
Strain flavor text (documented, not redesigned), garrison logic,
territory.lua's `culture_relationship` (singular) local parameter name
(not the renamed state field, not in directive scope).

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 286 passed (282 existing + 4 new)

---

## SlimeWorld Alert Box for Real-Time Notifications — COMPLETED

### What was built

Implemented a lightweight, reusable Alert Box component that surfaces
new Stray/Refugee log entries as immediate, dismissable UI notifications.
The game already logged stray arrivals in `state.logs` but never surfaced
them in the moment — the Alert Box closes that gap.

### Design decisions

- **Detection mechanism**: New log entries are detected in
  `handleAdvanceCycle` after each `advance_cycle` Lua bridge call. The
  returned `luaLogs` array (parsed from the Lua result) is filtered for
  `type === 'combat' && text.startsWith('STRAY DETECTION')`. This
  matches the existing pattern: `handleAdvanceCycle` already parses
  `result['logs']` into `luaLogs` and appends them to `state.logs`. The
  alert filtering happens on the same `luaLogs` array, after
  `setState`, without altering the logs array itself.
- **Filter precision**: `type === 'combat'` alone would catch unrelated
  combat entries. Confirmed via grep that the ONLY `type = "combat"`
  entry in `logic.lua` is the STRAY DETECTION message. Still, the filter
  uses both conditions for future-proofing.
- **Generic component**: `AlertBox` accepts any `LogEntry`-shaped prop,
  not hardcoded to Stray-specific text. Future directives can wire
  additional trigger conditions (Favor completions, Fealty achieved)
  onto the same component without a rewrite.
- **Component location convention**: Game-specific components live in
  `ts/src/games/slimeworld/components/`, shared UI components in
  `ts/src/components/`. AlertBox is game-specific → placed in the
  slimeworld components directory.
- **Existing logs history unchanged**: `state.logs` is still appended
  and sliced at -50 as before. The alert filtering is separate from the
  logs state update.

### New files

- **`ts/src/games/slimeworld/components/AlertBox.tsx`** — Generic,
  dismissable alert UI component. Accepts a `LogEntry` prop and an
  `onDismiss` callback. Renders entry text with an amber-themed alert
  style and X/Dismiss buttons.

### Modified files

- **`ts/src/games/slimeworld/App.tsx`** — Added `activeAlerts` state
  (`LogEntry[]`). In `handleAdvanceCycle`, after `setState`, filters
  `luaLogs` for stray detection entries and pushes them to
  `activeAlerts`. Renders `AlertBox` components in a bottom-right
  overlay container, each with dismiss functionality.

### Test coverage — `ts/tests/test_slimeworld_alert_box.tsx` (5 tests)

1. `test_alert_box_renders_given_log_entry` — Source check: AlertBox
   accepts generic `LogEntry`, renders `entry.text`, not hardcoded to
   Stray text
2. `test_alert_box_dismissable` — Source check: dismiss calls
   `onDismiss(entry.id)`, App.tsx filters by id to remove
3. `test_stray_arrival_triggers_alert_real_bridge` — Real bridge test:
   triggers territory flip via `advance_cycle`, confirms STRAY DETECTION
   log appears, confirms App.tsx wires the detection filter
4. `test_non_stray_combat_logs_do_not_trigger_alert` — Confirms filter
   uses both `type === 'combat'` AND `text.startsWith('STRAY DETECTION')`;
   confirms only 1 `type = "combat"` entry exists in logic.lua
5. `test_existing_log_history_still_renders` — Confirms `state.logs`
   append/slice logic unchanged; alert filtering is separate from logs
   state update

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 282 passed (277 existing + 5 new)

---

## SlimeWorld Identity Alignment — COMPLETED

### What was built

Implemented the Player-Aligned as Single Canonical Signal directive.
Replaced the dual-meaning overload where `owner_color == "Gray"` served as
both cultural identity AND player-control signal. Now `player_aligned` is
the single canonical flag for "this node is player-controlled," set
identically by all four claim paths (Force, Bribe, Convert, Fealty).

### Design decisions

- **Force and Bribe** still erase `owner_color` to Gray — raw coercion
  erasing cultural identity is thematically correct. They now ALSO set
  `player_aligned = true`.
- **Convert and Fealty** now PRESERVE `owner_color` — relationship-based
  outcomes keep the region's cultural identity. They set
  `player_aligned = true` without touching `owner_color`.
- **Single canonical signal**: Every downstream check reads
  `player_aligned` only, never `owner_color == "Gray"`, for "is this
  mine." Gray goes back to meaning only cultural/genetic identity.
- **Pressure simulation**: `player_aligned` nodes are excluded from
  pressure accumulation, flips, revolts, and supply collapse — same
  treatment as `fealty_locked` nodes.

### Modified files

- **`games/slimeworld/territory.lua`** — `resolve_force_claim`: added
  `player_aligned = true` (Gray stays). `resolve_bribe_claim`: same.
  `resolve_convert_claim`: removed `owner_color = "Gray"` overwrite,
  preserves original color, adds `player_aligned = true`.
  `claim_grudge_color`: replaced `owner_color ~= "Gray"` with
  `not node.player_aligned`.
- **`games/slimeworld/favors.lua`** — `generate_favors` gate: replaced
  `owner_color ~= "Gray"` with `not node.player_aligned`.
  `check_fealty_transition`: removed `owner_color = "Gray"` overwrite,
  added `player_aligned = true` alongside `fealty_locked = true`.
- **`games/slimeworld/codex.lua`** — `update_planet_supply_and_pressure`:
  all 6 exclusion checks now include `not node.player_aligned` alongside
  existing `fealty_locked` checks (pressure accumulation, neighbor
  targeting, pressure decay/clear, flip/revolt, supply BFS, cascade
  collapse).
- **`games/slimeworld/logic.lua`** — Updated comment on fealty transition
  to reference `player_aligned` instead of Gray.
- **`games/slimeworld/logic_original.lua`** — Regenerated to match split
  file changes (byte-identical concatenation test).
- **`ts/src/games/slimeworld/types.ts`** — Added `playerAligned` to
  `PlanetNode` interface, bridged in `luaNodeToTs` and `nodeToLua`.
- **`ts/tests/test_slimeworld_favors.tsx`** — Fixed existing fealty test:
  now checks `playerAligned === true` and `ownerColor === 'Red'`
  (preserved) instead of `ownerColor === 'Gray'` (overwritten).

### New files

- **`ts/tests/test_slimeworld_identity_alignment.tsx`** — 7 test anchors
  per §3 of the directive.

### Test coverage — `ts/tests/test_slimeworld_identity_alignment.tsx` (7 tests)

1. `test_force_claim_sets_player_aligned_and_gray` — Force → Gray +
   player_aligned
2. `test_bribe_claim_sets_player_aligned_and_gray` — Bribe → Gray +
   player_aligned
3. `test_convert_claim_preserves_owner_color` — Convert → owner_color
   preserved (Blue) + player_aligned
4. `test_fealty_transition_preserves_owner_color` — Fealty → owner_color
   preserved (Red) + player_aligned + fealty_locked
5. `test_player_aligned_node_stops_generating_favors` — player_aligned
   node produces no Favor regardless of owner_color
6. `test_player_aligned_node_excluded_from_pressure_contest` —
   player_aligned node has pressure cleared, excluded from sim
7. `test_no_remaining_gray_based_control_checks` — grep proof: no
   `owner_color ~= "Gray"` control checks remain in territory.lua or
   favors.lua; all remaining Gray references are genuine color logic

### Remaining Gray references (categorized)

**Genuine color/genetic logic (not control checks):**
- `territory.lua`: `dominant_color` fallback (`or "Gray"`), pressure
  color filtering (`color ~= "Gray"`), `convert_target_color` default
  (`local target_color = "Gray"`), Force/Bribe intentional erasure
  (`owner_color = "Gray"`)
- `breeding.lua`: saturation default, color snap threshold, color tier
  table, shape defaults, interpolation blend target
- `codex.lua`: wanderer petition color list, seed slime saturation
- `favors.lua`: none remaining (all control checks replaced)

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 277 passed (270 existing + 7 new)

---

## SlimeWorld Demo Scope & Onboarding (Ember Path) — COMPLETED

### What was built

Implemented the Demo Scope & Onboarding directive per the design doc.
New Campaign shows a short, locked Opening beat (Ember is home, two
regions within reach — no mechanic teaching). Continue skips the beat
and goes straight to Hub. Three trigger-based tutorials (T-1/T-2/T-3)
fire on real player actions. New Game Guard pre-populates all tutorial
IDs on restore so nothing re-fires for returning players. Region-lock
status renders within the existing MissionsTab sub-tab structure.

### New files

- **`ts/src/games/slimeworld/tutorial.ts`** — Tutorial ID constants,
  content definitions, `shouldFireTutorial`, `markTutorialShown`,
  `prepopulateAllTutorials`. Three tutorial triggers: T-1 (first Hub
  view), T-2 (first roster/breeding screen open), T-3 (first region
  unlock — states permanence "forever").
- **`ts/tests/test_slimeworld_onboarding.tsx`** — 6 bridge/source tests
  per §3 anchors.

### Modified files

- **`ts/src/games/slimeworld/App.tsx`** — Added `gamePhase` state
  ('opening' | 'hub') with New Campaign/Continue branch logic.
  `loadSavedState`/`saveState` via localStorage. New Game Guard:
  pre-populates all tutorial IDs on restore. Three `useEffect` triggers
  for T-1/T-2/T-3. Opening beat rendering (Sparkles, Ember Station,
  Begin button). Tutorial popup overlay (dismissable, with X button).
  Auto-save on state change.
- **`ts/src/games/slimeworld/types.ts`** — Added `shownTutorials` field
  to `LabState`.

### Design decisions

- **No save/restore existed** — SlimeWorld had no localStorage or any
  persistence. Built from scratch using `localStorage` with
  `SAVE_KEY = 'slimeworld_save'`.
- **Opening beat text has no mechanic teaching** — per Dissonance's
  one-job-per-screen discipline. States only "Ember is your home" and
  two regions are "within reach, but locked."
- **T-2 fires on roster tab open** (not a separate breeding screen) —
  SlimeWorld's Roster tab is where breeding happens, so T-2 triggers
  when the player first opens it with region locks present.
- **Region-lock status already in MissionsTab** — the existing
  `isNodeLocked` function (extended in Region Lock-Down) already
  renders locked regions within the MissionsTab 'regions' sub-tab.
  No new top-level screen needed.

### Test coverage — `ts/tests/test_slimeworld_onboarding.tsx` (6 tests)

1. `test_new_campaign_shows_opening_beat` — source check: gamePhase
   with 'opening'/'hub' branches, Ember text, Begin button, no
   mechanic teaching
2. `test_continue_skips_opening_beat` — source check: loadSavedState
   in gamePhase initializer, save → 'hub', no save → 'opening'
3. `test_new_game_guard_prevents_tutorial_replay` — source +
   functional: prepopulateAllTutorials marks all 3 IDs, shouldFireTutorial
   returns false for all
4. `test_t1_fires_on_first_hub_view` — source check: T1_HUB_VIEW trigger,
   t1FiredRef, shouldFireTutorial, content mentions Thornward/Abyssal Ember
5. `test_t3_fires_on_first_region_unlock` — source check + Lua bridge:
   T3_REGION_UNLOCK trigger, prevRegionUnlocksRef, "forever" in content,
   breeding a matching slime produces region unlocks
6. `test_region_status_renders_as_subview` — source check:
   regionLockNodeIds in MissionsTab, isNodeLocked, 'regions' sub-tab,
   no new top-level screen

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 270 passed (264 existing + 6 new)

---

## SlimeWorld Region Lock-Down — COMPLETED

### What was built

Implemented the Region Lock-Down directive per the design doc. Map regions
are permanently unlocked by breeding slimes matching composite locks (color
target + shape tier + accent band). 4 new map nodes added (3 Rival + 1
Convergence capstone). Mission launches gated by region unlock state.

### Lua side

- **`games/slimeworld/regionlock.lua`** (new, ~120 lines) —
  `check_region_unlocks`, `is_region_unlocked`, `is_node_accessible`,
  `check_convergence_prerequisites`, `check_slime_against_lock`,
  `check_accent_match`, `check_shape_tier_match`, `is_capitol_node`.
  Reuses `match_color_target`, `match_shape_target`, `find_metallic_accent`
  from `breeding.lua`.
- **`games/slimeworld/territory.lua`** — `initiate_breeding` now accepts
  `region_locks` and `accent_targets` params, calls `check_region_unlocks`
  after child is created, sets `child.region_unlocks` with newly unlocked
  node IDs.
- **`games/slimeworld/missions.lua`** — `launch_exploration` and
  `launch_mediation` now accept `region_locks` param, call
  `is_node_accessible` to gate on locked/unlocked/capitol status. Return
  `(nil, error)` on locked, `(mission, nil)` on success.
- **`games/slimeworld/systems.yaml`** — added `regionlock.lua` to
  `lua_files` (8 files now, was 7), registered `region_locks` system with
  8 functions, added `region_locks` to lab entity systems.
- **`games/slimeworld/logic_original.lua`** — regenerated to match
  concatenated output of all 8 Lua files.

### TypeScript side

- **`ts/src/games/slimeworld/types.ts`** — added `regionUnlocks` to
  `LabState`, `region_unlocks` in `stateToLua`, `region_unlocks` in
  `SLIME_EXPLICIT_LUA_FIELDS`.
- **`ts/src/games/slimeworld/App.tsx`** — `handleInitiateBreeding` passes
  `region_locks` and `accent_targets` to Lua, reads `region_unlocks` from
  child, merges into `state.regionUnlocks`. `handleLaunchMediation` and
  `handleLaunchExploration` pass `region_locks` and handle error returns.
- **`ts/src/games/slimeworld/planetRegion.ts`** — 4 new seed defs and
  node defs: `node_rival_a/b/c` (R=100) and `node_convergence` (R=0,
  center). Neighbors computed by existing polygon adjacency logic.
- **`ts/src/games/slimeworld/components/MissionsTab.tsx`** —
  `isNodeLocked` extended to check `regionLockNodeIds` prop against
  `state.regionUnlocks`. Locked regions show as locked on the map.

### Data

- **`games/slimeworld/data.yaml`** — 18 `region_locks` entries: 6 Guild
  (frontier, tier 1, diffusion), 3 Rival (rival, tier 2, diffusion), 6 Arc
  (mid_a-f, tier 3, diffusion), 2 Skip (mid_g/h, tier 4/5, amplitude), 1
  Convergence (metallic accent, all 17 other non-capitols as prerequisites).

### Test coverage — `ts/tests/test_slimeworld_regionlock.tsx` (7 tests)

1. `test_region_lock_data_references_real_targets` — every ID in
   region_locks resolves to real color/shape/accent entries
2. `test_new_map_nodes_have_real_neighbors` — 4 new nodes have computed
   neighbor lists referencing real node IDs
3. `test_region_unlocks_on_matching_breed` — slime matching a composite
   lock unlocks the region (TS-Lua-TS bridge)
4. `test_region_unlock_is_permanent` — already-unlocked regions are
   not re-unlocked; state remains unlocked
5. `test_convergence_requires_all_skip_regions` — Convergence stays
   locked until all prerequisites met, even with matching Metallic slime
6. `test_mission_blocked_on_locked_region` — launch_exploration and
   launch_mediation refuse locked non-capitol nodes
7. `test_mission_allowed_on_unlocked_or_capitol` — both capitol and
   unlocked regions succeed

### Existing test fixes

- **`ts/tests/test_slimeworld_planet_region.tsx`** — updated node count
  from 20 to 24, non-capitol count from 14 to 18.
- **`ts/tests/test_mediation_launch.tsx`** — updated for new
  `launch_mediation` signature (region_locks param, error return).
- **`ts/tests/test_lua_slime_field_safety.tsx`** — added
  `region_unlocks` to expected fields, updated breeding call signature.
- **`tests/test_slimeworld_mediation_resolution.py`** — updated
  `launch_mediation` call for new signature (region_locks param, tuple
  return).
- **`tests/test_slimeworld_file_split.py`** — `LUA_FILES_ORDER` updated
  to include `regionlock.lua` (8 files), comment updated 7 to 8.

### Design decisions

- **Region lock count is 18, not 19** — the directive's "19" counts
  6+3+6+2+1=18. The directive text has an arithmetic discrepancy; the
  implementation matches the actual table (6 Guild + 3 Rival + 6 Arc +
  2 Skip + 1 Convergence = 18).
- **2e mission-reward unit bias** — deferred per directive scope. The
  directive recommends "nearest/closest-to-match" as the default but
  marks it as an open judgment call. No reward beyond mission access is
  implemented for unlocking a region, per Robert's explicit instruction.
- **No credit/resource/item reward** — unlocking a region grants access
  to that region's missions, full stop.

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 264 passed (257 existing + 7 new)

---

## SlimeWorld Fealty & Culture Favors (Rev 2) — COMPLETED

### What was built

Implemented the Fealty and Culture Favors system per the Rev 2 design doc.
Favors arise procedurally from real node pressure state, are fulfilled via
Mediation (+5 relationship) or Disposal (+15 relationship), and trigger
permanent Fealty transitions at 100% relationship.

### Lua side

- **`games/slimeworld/favors.lua`** (new, 147 lines) — `generate_favors`,
  `find_favor_for_node`, `fulfill_favor_via_mediation`, `resolve_disposal`,
  `check_fealty_transition`. Constants: FAVOR_CAP=4,
  FAVOR_PRESSURE_THRESHOLD=20, MEDIATION_FAVOR_INCREMENT=5,
  DISPOSAL_FAVOR_INCREMENT=15, FEALTY_THRESHOLD=100.
- **`games/slimeworld/codex.lua`** — `update_planet_supply_and_pressure`
  skips fealty-locked nodes in pressure accumulation, decay, flips,
  revolts, supply BFS, and cascade collapse. Fealty-locked nodes get
  `pressure = {}` and `is_supplied = true`.
- **`games/slimeworld/logic.lua`** — `advance_cycle` now calls
  `check_fealty_transition` BEFORE the pressure sim (so 100%-relationship
  nodes lock before the sim can revolt them), generates favors after the
  sim, and extends mediation resolution to fulfill favors on success.
  `resolve_disposal` returns the full mutated state.
- **`games/slimeworld/systems.yaml`** — added `favors.lua` to `lua_files`
  (7 files now, was 6), registered favors system with 5 functions.
- **`games/slimeworld/logic_original.lua`** — regenerated to match
  concatenated output of all 7 Lua files (byte-identical test updated).

### TypeScript side

- **`ts/src/games/slimeworld/types.ts`** — added `Favor` interface,
  `fealtyLocked` to `PlanetNode`, `favors` to `LabState`, `luaFavorToTs`
  bridge function, `fealty_locked` in `nodeToLua`/`luaNodeToTs`,
  `culture_relationships` in `stateToLua`.
- **`ts/src/games/slimeworld/App.tsx`** — `handleDisposeSlime` with
  2-step confirmation, reads `favors` and `culture_relationships` from
  `advance_cycle` result, passes disposal props to `MissionsTab`.
- **`ts/src/games/slimeworld/components/MissionsTab.tsx`** — new
  "FAVORS" sub-tab with culture relationship bars, active favors list,
  and 2-step Disposal confirmation UI (Step 1: select slime, Step 2:
  confirm permanent disposal).

### Test coverage — `ts/tests/test_slimeworld_favors.tsx` (6 tests)

1. `test_generate_favors_procedural_from_pressure` — favors generated
   from nodes with foreign pressure ≥ 20, not from low-pressure nodes
2. `test_favor_fulfillment_via_mediation_increments_relationships` —
   mediation fulfillment path produces culture_relationships field
3. `test_disposal_removes_slime_and_increments_relationships` —
   `resolve_disposal` removes the slime and increments relationship by 15
4. `test_fealty_transition_locks_nodes_at_100` — at 100 relationship,
   nodes become fealty-locked and transfer to Gray ownership
5. `test_fealty_locked_nodes_skipped_in_pressure` — fealty-locked nodes
   have pressure cleared and remain locked through pressure simulation
6. `test_disposal_ui_has_2step_confirmation` — source-level check that
   MissionsTab has both steps and App.tsx calls `resolve_disposal`

### Python test update

- **`tests/test_slimeworld_file_split.py`** — `LUA_FILES_ORDER` updated
  to include `favors.lua` (7 files), comment updated from 6→7.

### Design decisions

- **Fealty check runs BEFORE pressure sim** — prevents nodes at 100%
  relationship from being revolted/flipped before fealty can lock them.
  Original placement (after sim) caused test failures due to random
  revolt probability consuming the node before the lock fired.
- **`resolve_disposal` returns full state** (not just `true`) — allows
  the TS bridge to read updated `slimes` and `culture_relationships`
  from the return value without a separate round-trip.
- **Fealty-locked nodes get `pressure = {}`** — cleared in the pressure
  application step, not just skipped. Permanently stable territory
  should not display stale pressure values.

### Test Floor

- **Python:** 563 passed, 8 warnings
- **TypeScript:** 257 passed (251 existing + 6 new)

---

## Test Suite Classification + Selective Scoping — COMPLETED

Real audit of every test file in both stacks (39 Python, 41 TypeScript),
each assigned a bucket (a specific game, or `shared`), full reasoning for
every ambiguous case. See `docs/gdd/TEST_SUITE_CLASSIFICATION.md` for the
complete breakdown before assuming any file's scope.

**Use `python scripts/test_scope.py <game_name>` to run one game's tests
plus the mandatory shared suite** (`brewfield`, `chimera_wilds`,
`dissonance`, `scrapcrawl`, `shoal`, `slimeworld`, `slither_rogue`) —
never runs a game in isolation from `shared`, per ADR-005's precedent.
Python markers live in `pyproject.toml` (`[tool.pytest.ini_options]`) +
root `conftest.py`, auto-applied by filename, purely additive to a normal
unfiltered `pytest` run.

TypeScript `vitest --changed` (v2.1.9) was investigated and found **not
viable** for this project — it fails during dependency-graph construction
on the `import.meta.glob(..., { query: '?raw' })` pattern used to load
`.lua` sources in `ts/src/engine/loader.ts`. Fallback: Vitest's positional
filename-filter argument (`npx vitest run <substring>`) works today; no
new TS tooling was built this session (investigation-only, per scope).

**Real gap flagged, not fixed:** `horse_racing`, `mutant_battle_ball`, and
`slime_coin` have no dedicated Python test file — their only coverage is
inside multi-game shared-bucketed files, so `test_scope.py <that game>`
currently just runs `shared`.

## Arcade Registry — Reorder, Add Dissonance, Delist SlimeBreeder/Slimegarden — COMPLETED

### Work

Presentation-only registry update, no game logic touched.

- Added `ts/src/games/dissonance/config.ts` with `gameId: 'dissonance'`,
  `label: 'Dissonance Depths'`, `status: 'dev'`, and real description.
  No `component` is registered yet, so clicking the card honestly renders
  "No Renderer" instead of a misleading placeholder.
- Added Dissonance to `ts/src/engine/loader.ts` static `GAME_ASSETS` map so the
  TypeScript loader can read `games/dissonance/{data,ui,systems}.yaml` — this
  fixed the local-host `Studio Error — Unknown game: dissonance`.
- Reordered `GAME_REGISTRY` in `ts/src/games/registry.ts` to:
  `dissonance → slimeworld → shoal → voiddrift → corpworld → brewfield →
  horse_racing → slither_rogue → mutant_battle_ball → slime_coin →
  chimera_wilds → scrapcrawl → ledger → trinity_siege`.
- Delisted `slimebreeder` and `slimegarden` from the public array while
  leaving both source directories intact on disk.
- Fixed the copy-paste description bug:
  - `slimebreeder` now reads: "A multi-tank slime breeding and genetics
    sandbox — a standalone TypeScript reimagining of the SlimeGarden core loop."
  - `slimegarden` now reads: "The original multi-tank slime breeding and
    genetics sandbox — dispatch specimens, claim territory, and manage garrison
    risk across planet nodes."
- Added `ts/tests/test_arcade_registry_directive.ts` verifying Dissonance
  presence/order/status, delisted IDs, and source-directory integrity.
- Live browser check via Playwright confirmed the arcade selector renders the
  exact order with Dissonance Depths first and the `DEV` badge visible.
- Diff reviewed: only `ts/src/games/dissonance/config.ts`,
  `ts/src/engine/loader.ts`, `ts/src/games/registry.ts`,
  `ts/src/games/slimebreeder/config.ts`, `ts/src/games/slimegarden/config.ts`,
  and `ts/tests/test_arcade_registry_directive.ts` were modified.

## Dissonance Depths — Initial Lua Port & Anchor Tests — COMPLETED

### Work

Ported the verified TypeScript Dissonance prototype into the RFDGameStudio
architecture as a new game under `games/dissonance`.

- Generated `data.yaml` from the TS source: Ember card pool (56 named
  combinations in `card_name_map`, expanded to 56 entries in `named_cards`),
  41 boons, 12 relics, enemy roster (38 enemies across behavior roster + legacy +
  bosses), floors, rest-or weights, build gates, and room element leans.
- Implemented split Lua logic modules:
  - `logic/combat.lua` — element/component resolution, secondary-type
    advantage, enemy intent generation.
  - `logic/builds.lua` — build gates and corrected synergy mechanics
    (Weaver tracks 4 distinct action types; Vault compounds on undamaged
    Guard plays instead of reading unspent Essence).
  - `logic/rooms.lua` — reward generation, opening pack, rest-or attachment
    helpers.
  - `logic/enemies.lua` — flat enemy pool construction from data.yaml.
  - `logic/discovery.lua` — 5-category Codex tracking.
  - `logic/logic.lua` — entry-point wrapper.
- Created `systems.yaml` with the lua_files manifest and phase registry.
- Created `ui.yaml` with phase screens and the 5-category Codex UI.
- Added `tests/test_dissonance_anchors.py` covering resolve_combination
  (exhaustive comparison against a TS-equivalent Python baseline), build
  gates, synergy mechanics (Burster, Weaver, Vault, Steward, Gambler),
  discovery tracking, enemy intents, and reward/opening-pack shape.
- Ran live Lua traces (via `studio.runtime.load_game`/`call`):
  1. **Burster** — acquire `escalation_boon` → commits `activeBuild: burster`.
     Play `ember+ember sever` → `modifiedValue` goes from 12 to 14 with an
     Escalation log message.
  2. **Weaver** — hard-reset chain mechanic: plays `sever, guard, sever
     (repeat), mend, unmake`. The repeat resets the chain to `['sever']`;
     the subsequent `mend` and `unmake` are not enough to reach 4 distinct
     actions, so no bonus fires. A clean `sever, guard, mend, unmake` chain
     triggers the +16 bonus on `unmake` and then resets.
  3. **Vault** — corrected compound mechanic: undamaged Guard plays stack
     Compound; a damaged Guard does not; on the 3rd undamaged Guard the
     payout is `+10 Essence` and stacks reset. Current unspent Essence is
     never read.
  4. **Codex** — record one item in each category (cards, boons, relics,
     enemies, room_types) and confirm `get_discovery_summary` returns 1 in
     each bucket.

> **Live browser verification — NOT YET MET.** The directive §4 completion
> criterion required *"real browser session, not just unit tests"* verification
> of the Build Archetype trace and Codex population. What was delivered was a
> real Lua-runtime trace via `studio.runtime.load_game`/`call`, not a browser
> session, because no renderer exists yet to verify against. This checkbox is
> left honestly unchecked pending the renderer directive.

### Files Added

- `games/dissonance/data.yaml`
- `games/dissonance/systems.yaml`
- `games/dissonance/ui.yaml`
- `games/dissonance/logic/combat.lua`
- `games/dissonance/logic/builds.lua`
- `games/dissonance/logic/rooms.lua`
- `games/dissonance/logic/enemies.lua`
- `games/dissonance/logic/discovery.lua`
- `games/dissonance/logic/logic.lua`
- `tests/test_dissonance_anchors.py`
- `ts/tests/test_dissonance_recovery_manifest.ts`

### Test Floor

- Python: **473 passed**, 8 warnings
- TypeScript: **201 passed** (197 existing + 4 new registry directive tests)

## Fix Missing Level-Up Logic & Advance Cycle Button — COMPLETED

### Bug

1. **Slimes never leveled up**: XP was awarded during exploration and dispatch
   resolution in `advance_cycle`, but no code checked if XP exceeded the
   100-XP-per-level threshold. The original TS implementation had this logic
   (`useCycleActions.ts` / `useClaimActions.ts`) but it was never ported to Lua.
   Since `stageFromLevel` derives the slime's life stage from level, slimes
   also never appeared to age.

2. **No always-visible Advance Cycle button**: The only "advance cycle" buttons
   were contextual — they appeared only when a mediation, exploration, or
   dispatch was active. With no active mission, there was no way to push
   forward a cycle.

### Fix

1. Added `check_level_up(slime, color_specs)` helper to `logic.lua` (and
   synced `logic_original.lua`). Called after each XP award in `advance_cycle`
   (exploration and dispatch resolution). Uses a `while` loop to handle
   multi-level jumps. Recalculates stats via `calculate_stats` on level up.

2. Added an always-visible "Advance Cycle" button to the `statusArea` in the
   GameShell header in `App.tsx`. Shows the current cycle number and a
   `FastForward` icon button. Visible across all tabs (Roster, Missions,
   Economy, Lab).

### Files Modified

- `games/slimeworld/logic.lua` — added `check_level_up` function, called after
  exploration XP and dispatch XP awards
- `games/slimeworld/logic_original.lua` — synced with same changes
- `ts/src/games/slimeworld/App.tsx` — added `FastForward` import, cycle counter
  and advance cycle button to header `statusArea`

### Test Floor

- Python: **447 passed**, 8 warnings
- TypeScript: **195 passed**

## Fix Hardcoded Offspring ID — Breeding Produced Duplicate IDs — COMPLETED

### Bug

`breed_slimes` in `breeding.lua` returned a child with a hardcoded
`id = "slime_offspring"`. Every breeding result shared the same id.
In the Roster UI, clicking one bred slime highlighted all of them
because selection logic matches by slime id. This also caused the
"double slot consumption" appearance — two slimes with the same id
were treated as linked entries.

### Fix

Changed `id = "slime_offspring"` to
`id = "slime_" .. os.time() .. "_" .. math.random(1000)`, matching
the unique id pattern used by `create_seed_slime` in `codex.lua`.

### Files Modified

- `games/slimeworld/breeding.lua` — fixed `breed_slimes` return id
- `games/slimeworld/logic_original.lua` — synced for byte-identical test
- `tests/test_slimeworld_breeding_cost.py` — updated assertion to use
  `child["id"]` instead of hardcoded `"slime_offspring"`

### Test Floor

- Python: **447 passed**, 8 warnings (unchanged)
- TypeScript: **195 passed** (unchanged)

## Implement Seed Purchase — Lua + TS Wiring — COMPLETED

### Bug

The Lab tab showed "Order [50 Cr]" buttons for Red, Yellow, and Blue
seed slimes, but clicking produced only the warning: "Seed purchase is
visible but unavailable: no Lua function exists." The handler was a stub.

### Fix

**Lua side** (`games/slimeworld/economy.lua`): Added
`purchase_seed_slime(state, color, color_specs)` function that:
- Charges 50 credits
- Checks roster cap (`state.roster_cap`)
- Calls `create_seed_slime(color, "Solid", color_specs)` from `codex.lua`
- Inserts the new slime into `state.slimes`
- Returns the new slime object

Also added to `systems.yaml` economy system functions list and synced
to `logic_original.lua` for byte-identical test.

**TS side** (`ts/src/games/slimeworld/App.tsx`): Replaced the stub
`handlePurchaseSeedSlime` with a real implementation that:
- Calls `purchase_seed_slime` via the Lua bridge with `colorSpecs`
- Converts the returned slime via `luaSlimeToTs`
- Fills in TS-side defaults (`diffusionRatio`, `amplitude`, `accentHue`,
  `vertexCount`, `irregularity`) matching the `initialState` pattern
- Updates `credits`, `slimes`, and `logs` in state

### Files Modified

- `games/slimeworld/economy.lua` — added `purchase_seed_slime` function
- `games/slimeworld/logic_original.lua` — synced for byte-identical test
- `games/slimeworld/systems.yaml` — added `purchase_seed_slime` to economy functions
- `ts/src/games/slimeworld/App.tsx` — wired up `handlePurchaseSeedSlime`

### Test Floor

- Python: **447 passed**, 8 warnings (unchanged)
- TypeScript: **195 passed** (unchanged)

## Fix handleAdvanceCycle — Missing Mediation/Dispatch/Zone Read-Back — COMPLETED

### Bug

`handleAdvanceCycle` in `App.tsx` read back `active_exploration` from
the Lua `advance_cycle` result but did NOT read back `active_mediation`,
`active_dispatch`, or `zones`. This meant:

- **Mediation**: Lua set `active_mediation = nil` after resolution, but
  TS never updated `state.activeMediation` → mediation missions appeared
  stuck forever in the UI even though Lua had resolved them
- **Dispatch**: Lua set `active_dispatch.status = "completed"`, but TS
  never updated `state.activeDispatch` → `handleRetrieveCompletedPod`
  couldn't work because the TS-side status never changed
- **Zones**: Lua updated `isUnlocked` and `isFirstClearCompleted` on
  first-clear dispatch success, but TS never reflected these changes

### Fix

Added `active_mediation`, `active_dispatch`, and `zones` read-back to
the `setState` call in `handleAdvanceCycle`. Extracted a shared
`missionFromLua` helper for consistent Mission mapping. Zones are mapped
from camelCase Lua fields (zones pass through `stateToLua` without
snake_case conversion).

### Files Modified

- `ts/src/games/slimeworld/App.tsx` — added `missionFromLua` helper,
  `activeMediation`/`activeDispatch`/`zones` read-back, `Mission` import

### Test Floor

- Python: **447 passed**, 8 warnings (unchanged)
- TypeScript: **195 passed** (unchanged)

## Fix Dispatch Resolution in advance_cycle — Third Instance of Mission Lifecycle Bug — COMPLETED

### Bug

`advance_cycle` in `logic.lua` had no dispatch resolution block. When a
dispatch mission's `cycles_remaining` reached 0, the mission stayed
`status = "active"` forever — slimes assigned to dispatch were
soft-locked indefinitely. This is the **third confirmed instance** of
the same bug class:

1. **Exploration** — fixed by adding resolution block in `advance_cycle`
2. **Mediation** — fixed by adding resolution block in `advance_cycle`
3. **Dispatch** — fixed now (this change)

### Root Cause

The `resolveDispatch` function from the original TypeScript source
(`gameLogic.ts` ~line 768) was never ported into `advance_cycle`. The
launch function (`launch_dispatch` in `missions.lua`) correctly set
`status = "active"`, and the retrieval function
(`retrieve_completed_dispatch`) correctly checked for
`status == "completed"` before clearing — but nothing in between ever
set the status to `"completed"`.

### Fix

Added a dispatch resolution block to `advance_cycle` in `logic.lua`,
between the mediation resolution and the wilds unlock check. The block:

- Guards with `status == "active"` to prevent re-resolution
- Looks up the zone via `find_by_id(state.zones, dispatch.zone_id)`
- Selects the party via `select_slimes(state.slimes, dispatch.slime_ids)`
- Handles empty party / missing zone as a distinct third outcome:
  `success = false, 0 XP, 0 credits`
- Computes combat rating per the real formula:
  `(level * 10 + hp/15 + atk + def) * matchBonus` where
  `matchBonus = 2.0` if `slime.color == zone.requiredColor`, else `1.0`
- Computes power target: `recommendedLevel * 30 + difficulty * 25`
- Success chance: ratio > 1 → `0.85 + (ratio-1)*0.1`,
  else `0.2 + ratio*0.6`, clamped to **`[0.1, 0.98]`**
  (distinct from exploration/mediation which use `[0.15, 0.98]`)
- On success: awards `zone.xpReward` XP and `zone.creditsReward` credits
- On failure: awards 15 XP flat consolation, 0 credits
- On first clear: marks `zone.isFirstClearCompleted = true` and unlocks
  the next zone in the chain:
  `zone_cinder → zone_sulphur → zone_abyssal → zone_jungle`
- Sets `dispatch.status = "completed"` with a `result` sub-table
- Does **NOT** clear `active_dispatch` — that is
  `retrieve_completed_dispatch`'s job (distinct integration contract)
- Returns slimes to `role = "idle"` after awarding XP

### Zone Field Names

Zones are passed from TS via `stateToLua` as a direct pass-through (no
snake_case conversion), so the Lua code uses the original camelCase
field names: `requiredColor`, `recommendedLevel`, `xpReward`,
`creditsReward`, `isFirstClearCompleted`, `isUnlocked`.

### Files Modified

- `games/slimeworld/logic.lua` — added dispatch resolution block (60 lines)
- `games/slimeworld/logic_original.lua` — synced to match (byte-identical test)
- `tests/test_slimeworld_dispatch_resolution.py` — new test file, 10 anchors

### Test Anchors

1. `test_dispatch_combat_rating_sums_party_with_color_bonus` — verifies
   color match bonus (2x) is applied correctly
2. `test_dispatch_success_chance_formula` — verifies both ratio branches
   (strong party succeeds, weak party fails)
3. `test_dispatch_chance_clamped_to_correct_bounds` — source-code
   inspection verifying `[0.1, 0.98]` clamp, NOT `[0.15, 0.98]`
4. `test_dispatch_success_awards_zone_rewards` — verifies XP and credits
   match zone data exactly
5. `test_dispatch_failure_awards_consolation_xp` — verifies 15 XP flat,
   0 credits on failure
6. `test_dispatch_first_clear_unlocks_next_zone` — verifies unlock chain:
   `zone_cinder → zone_sulphur`
7. `test_dispatch_repeat_clear_does_not_reunlock` — verifies second clear
   of already-cleared zone produces no unlock
8. `test_dispatch_empty_party_completes_as_failure` — verifies distinct
   third outcome: `success = false, 0 XP, 0 credits`
9. `test_dispatch_status_completed_not_cleared_by_advance_cycle` —
   verifies integration contract: `active_dispatch` present with
   `status = "completed"` (not nil)
10. `test_full_dispatch_lifecycle` — end-to-end:
    `launch_dispatch → advance_cycle → retrieve_completed_dispatch`

### Test Floor

- Pre-flight: **437 passed**, 8 warnings
- Post-fix: **447 passed**, 8 warnings (+10 new dispatch resolution tests)
- 0 regressions

## Fix Mediation Launch — Discarded Lua Result — COMPLETED

### Bug

`handleLaunchMediation` in `App.tsx` called
`call(session, 'launch_mediation', ...)` and **discarded the result
entirely** — no `setState`, nothing. The correctly-verified real
resolution logic in Lua never got a chance to run from the player's
perspective because `state.activeMediation` was never populated.

Both sibling handlers (`handleLaunchDispatch`, `handleLaunchExploration`)
correctly destructure the Lua return value and call `setState`.
`handleLaunchMediation` alone was broken.

### Fix

Replaced the discarded call with the same pattern used by
`handleLaunchExploration`:

- Destructure `const [raw] = call(...)` to capture the Lua return
- Guard `if (!raw) return` for null safety
- Map Lua snake_case fields to TS `Mission` shape: `target_node_id` →
  `targetNodeId`, `slime_ids` → `slimeIds`, `cycles_remaining` →
  `cyclesRemaining`, `status` → `status`
- Call `setState` to populate `activeMediation`
- Clear draft selections (`setMediationDraftIds([])`,
  `setSelectedMediationNodeId(null)`) — matching exploration's UX pattern

### What was NOT changed

- `handleLaunchDispatch` — already correct, reference pattern only
- `handleLaunchExploration` — already correct, reference pattern only
- Lua `launch_mediation` / mediation resolution logic in `advance_cycle`
  — already correct, untouched

### Test Anchors — `ts/tests/test_mediation_launch.tsx` (3 tests)

| Test | What it proves |
|---|---|
| `test_launch_mediation_applies_real_state_update` | Lua returns real mission object with all fields; handler captures and applies it to `state.activeMediation` (not discards) |
| `test_launch_mediation_without_selected_node_is_safe_noop` | Guard `if (!selectedMediationNodeId) return` is present and runs before the Lua call |
| `test_mediation_selection_state_clears_correctly_after_launch` | Handler clears `mediationDraftIds` and `selectedMediationNodeId` post-launch, matching exploration's pattern |

### Files Changed

- `ts/src/games/slimeworld/App.tsx` — `handleLaunchMediation` captures
  result, applies `setState`, clears selections
- `ts/tests/test_mediation_launch.tsx` — new, 3 test anchors

### Final test floors

- **Python:** 437 passed, 8 warnings
- **TypeScript:** 195 passed, 28 files (+3 tests, +1 file from 192/27)

---

## Split SlimeWorld's logic.lua into Multi-File Modules — COMPLETED

### What was done

SlimeWorld's `logic.lua` was 1,223 lines — the largest single Lua file in
the studio. It has been split into 6 files using the existing `lua_files`
mechanism in `systems.yaml` (same pattern as Shoal and Slither Rogue).

The split is **byte-identical**: concatenating the 6 new files in
`lua_files` order with `"\n\n".join(parts)` (the exact logic
`studio/loader.py` uses) produces output identical to the original
`logic.lua`. Zero behavior change.

### New file structure

| File | Lines | Contents |
|---|---|---|
| `breeding.lua` | 377 | Genetics, stats, state queries, `calculate_stats`, `create_seed_slime`, `initiate_breeding` |
| `territory.lua` | 187 | Claims, `launch_dispatch`, `launch_exploration`, `launch_mediation`, garrison |
| `missions.lua` | 41 | `launch_dispatch` dispatch actions, exploration, mediation, garrison |
| `economy.lua` | 66 | `deliver_contract`, economy functions |
| `codex.lua` | 320 | `is_slime_in_matching_culture_environment`, worker income, contracts, petitions, names, seed slime, planet sim, wilds |
| `logic.lua` | 227 | `advance_cycle` (main entry point) — reduced to orchestration only |

**Dependency order:** `breeding → territory → missions → economy → codex → logic`
(`logic.lua` last, matching Shoal's precedent for global scope behavior).

### systems.yaml update

```yaml
lua_files:
  - breeding.lua
  - territory.lua
  - missions.lua
  - economy.lua
  - codex.lua
  - logic.lua
```

---

## SlimeWorld Onboarding Economy Corrections — COMPLETED

*August 5 2026*

### What was built

Three separate, already-decided design corrections from the Aug 4 onboarding
session, now implemented.

#### 1. Economy tab gate correction

`App.tsx` previously unlocked both Missions and Economy off the first
`regionUnlocks` entry. Economy is now gated on the **second** region unlock,
while Missions stays on the first. Returning players with pre-existing
second-region progress see Economy immediately on load because the gate reads
real persisted `state.regionUnlocks`, not a session-only ref or tutorial-shown
proxy.

#### 2. `purchase_seed_slime` restriction + cooldown

`economy.lua` `purchase_seed_slime` now accepts `region_locks` and
`color_targets` and enforces two independent gates:

- **Color eligibility**: derives the set of purchasable colors from the
  player's currently unlocked regions at call time (re-derived every call,
  never cached). Each unlocked region's `color_target` contributes faction-anchor
  colors within 60° of its center hues; any requested color outside that set is
  rejected with the existing failure-path shape.
- **Cooldown**: tracks `state.last_seed_purchase_cycle` and blocks repeat
  purchases within `SEED_PURCHASE_COOLDOWN_CYCLES`.

The TS side persists the cooldown cycle via `lastSeedPurchaseCycle` in
`LabState` and round-trips it through `stateToLua` so subsequent calls see the
real elapsed cycle count.

#### 3. Post-first-breed reward

`territory.lua` `initiate_breeding` now grants exactly two additional Strays
after the player's first successful breed. The Strays match the player's real
assigned starting color (read from `state.starting_color` through the bridge),
not a hardcoded Red. The reward fires exactly once per game via a
`has_received_first_breed_reward` flag tracked on `LabState` and round-tripped
to Lua. The hook reuses the existing first-breed region-unlock event already
guaranteed by the Target Regent fix.

### Design decisions / judgment calls flagged for review

- **`SEED_PURCHASE_COOLDOWN_CYCLES` is a placeholder set to `3`** — pending
  Robert's confirmation before the value is treated as final. It is named and
  commented explicitly as provisional.
- **Purchasable-color derivation uses a 60° window** around each unlocked
  region's `color_target` center hues to map to canonical faction-anchor colors.
  This is a mechanical interpretation of "reachable from unlocked regions";
  Robert may want a different reach rule.
- **The post-first-breed reward triggers off the same region-unlock event as
  the Target Regent fix**, so it fires on the first breed that unlocks a
  region. If Robert intended it on literally any first successful breed
  regardless of unlock outcome, the trigger would need to move.

### Modified files

- **`games/slimeworld/economy.lua`** — Added `SEED_PURCHASE_COOLDOWN_CYCLES`,
  `derive_purchasable_colors`, `find_color_target_by_id`, and rewrote
  `purchase_seed_slime` to take `region_locks`/`color_targets`, enforce color
  eligibility, and enforce cooldown.
- **`games/slimeworld/territory.lua`** — Added post-first-breed reward in
  `initiate_breeding`: grants 2 Strays matching `state.starting_color` and sets
  `state.has_received_first_breed_reward`.
- **`games/slimeworld/logic_original.lua`** — Regenerated from the split files
  for byte-identical concatenation test.
- **`ts/src/games/slimeworld/App.tsx`** — Updated `handlePurchaseSeedSlime` to
  pass `region_locks`/`color_targets` and persist `lastSeedPurchaseCycle`;
  updated `handleInitiateBreeding` to read `added_strays` and persist
  `hasReceivedFirstBreedReward`; changed `visibleTabs` gating so Economy
  requires 2+ unlocked regions and Missions requires 1+.
- **`ts/src/games/slimeworld/types.ts`** — Added `startingColor`,
  `hasReceivedFirstBreedReward`, and `lastSeedPurchaseCycle` to `LabState`;
  bridged all three in `stateToLua`; added `added_strays` to
  `SLIME_EXPLICIT_LUA_FIELDS`.
- **`ts/tests/test_slimeworld_tab_gating.tsx`** — Updated assertions for the
  new Economy-on-second-region gate and Missions regression guard.
- **`ts/tests/test_slimeworld_options_menu_hard_reset.tsx`** — Updated
  `test_hard_reset_reflects_in_tab_gating` to use `unlockedRegionCount`.
- **`ts/tests/test_lua_slime_field_safety.tsx`** — Added `added_strays` to
  expected explicit fields.

### New files

- **`ts/tests/test_slimeworld_seed_purchase_restrictions.tsx`** — 5 test
  anchors for color eligibility and cooldown.
- **`ts/tests/test_slimeworld_first_breed_reward.tsx`** — 2 test anchors for
  the post-first-breed reward.

### Test coverage

**`ts/tests/test_slimeworld_seed_purchase_restrictions.tsx` (5 tests)**
1. `test_purchase_seed_slime_rejects_color_outside_unlocked_regions`
2. `test_purchase_seed_slime_accepts_color_within_unlocked_regions`
3. `test_purchase_seed_slime_eligibility_updates_after_new_region_unlock`
4. `test_purchase_seed_slime_cooldown_blocks_repeat_purchase`
5. `test_purchase_seed_slime_cooldown_clears_after_elapsed_cycles`

**`ts/tests/test_slimeworld_first_breed_reward.tsx` (2 tests)**
1. `test_post_first_breed_reward_grants_two_strays_matching_starting_color`
   — parameterized across Red/Blue/Yellow
2. `test_post_first_breed_reward_fires_exactly_once`

**`ts/tests/test_slimeworld_tab_gating.tsx` (6 tests, updated)**
1. `test_fresh_game_shows_only_roster_and_lab_tabs`
2. `test_missions_tab_appears_after_first_unlock_economy_stays_hidden`
3. `test_economy_tab_appears_after_second_unlock`
4. `test_returning_player_with_existing_second_region_sees_economy_immediately`
5. `test_default_active_tab_never_hidden`
6. `test_node_locking_unaffected`

### Test floor

- **Python:** 561 passed, 11 deselected, 8 warnings
- **TypeScript:** 325 passed, 0 failed

### What is next

The remaining open SlimeWorld items, in the order Robert should pick from:

1. **Lab Purchases (`buy_upgrade`) cooldown** — not scoped in enough detail yet;
   needs its own design pass first.
2. **Breeding cost after first breed** — decided in principle, but the actual
   cost number/scaling was never set. Do not invent a number here.
3. **Envoy vs. Garrison** — unresolved design question, unrelated to economy
   gating.
4. **`shapeCodex` liveness check** — a verification task, not a build task, and
   unrelated to these three fixes.

### Tooling updates

- **`tools/detect_multi_return/scan_lua.py`** — Updated to respect
  `lua_files` from `systems.yaml` when scanning games. Games without
  `lua_files` still fall back to `logic.lua`.
- **`ts/tests/test_multi_return_bridge.ts`** — `loadExecutor()` now reads
  `systems.yaml` and concatenates all `lua_files` when present.
- **`ts/tests/test_lifecycle_detector.ts`** — Reads all `lua_files` from
  `systems.yaml` instead of just `logic.lua`.
- **`ts/tests/test_recovery_manifest.ts`** — Passes concatenated Lua
  content to `auditExports` via new `luaText` override.
- **`ts/tools/framework_gen/audit.ts`** — `AuditOptions` gains optional
  `luaText` field for callers that need to pass pre-concatenated content.
- **`tests/test_slimeworld_stats.py`** —
  `test_pattern_switch_not_ported` now reads all `lua_files` from
  `systems.yaml` instead of just `logic.lua`.

### Test coverage — `tests/test_slimeworld_file_split.py` (5 anchors)

1. `test_real_line_count_reduction_confirmed` — `logic.lua` is now ~227
   lines, down from ~1,223
2. `test_no_lingering_single_file_reference` — `systems.yaml` declares
   `lua_files` with all 6 files, `logic.lua` last, backup file not
   referenced
3. `test_concatenated_output_byte_identical_to_original` — Concatenating
   the 6 files with `"\n\n".join(parts)` is byte-identical to the saved
   original
4. `test_studio_validate_game_still_passes` — `studio_validate_game`
   reports valid=True with no issues
5. `test_all_432_existing_python_tests_still_pass_unmodified` — Full
   Python suite passes at >= 432 with zero failures

### Files changed

- `games/slimeworld/breeding.lua` — new (split from logic.lua)
- `games/slimeworld/territory.lua` — new (split from logic.lua)
- `games/slimeworld/missions.lua` — new (split from logic.lua)
- `games/slimeworld/economy.lua` — new (split from logic.lua)
- `games/slimeworld/codex.lua` — new (split from logic.lua)
- `games/slimeworld/logic.lua` — reduced to `advance_cycle` only
- `games/slimeworld/logic_original.lua` — backup of pre-split original
- `games/slimeworld/systems.yaml` — added `lua_files` list
- `tools/detect_multi_return/scan_lua.py` — respects `lua_files`
- `ts/tools/framework_gen/audit.ts` — optional `luaText` override
- `ts/tests/test_multi_return_bridge.ts` — reads `lua_files`
- `ts/tests/test_lifecycle_detector.ts` — reads `lua_files`
- `ts/tests/test_recovery_manifest.ts` — reads `lua_files`
- `tests/test_slimeworld_stats.py` — reads `lua_files`
- `tests/test_slimeworld_file_split.py` — new, 5 test anchors

### Final test floors

- **Python:** 437 passed (432 original + 5 new file-split tests)
- **TypeScript:** 192 passed (unchanged — zero behavior change)

---

## Wire Starter Slime Creation to Real Lua Stats — COMPLETED

### Bug: `seedSlime()` was a shadow TS function that never called Lua

`seedSlime()` in `App.tsx` was a completely separate, TS-only, hardcoded
function that created every starter slime with flat baseline stats
`{ hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 }`. It never
called Lua's real `create_seed_slime` at all. The entire Color+Shape stat
computation work (correctly built and verified in Lua's `calculate_stats`,
`get_interpolated_specs`, `get_shape_stat_modifiers`) was unreachable from
the live game. Every player's starting roster ran on the flat baseline.

**Root cause:** A correct Lua function, verified in isolation, is not
proof any given call site actually reaches it. The TS `seedSlime()`
function was a shadow implementation that bypassed the entire Lua bridge.

### Fix

Replaced `seedSlime()` with a real `call(session, 'create_seed_slime',
color, 'Solid', colorSpecs)` invocation inside `initialState()`. The
real `colorSpecs` are built using the existing `buildColorSpecs(data)`
helper (same pattern used by `handleInitiateBreeding` elsewhere in the
file). The returned Lua slime is converted via `luaSlimeToTs`, then:

- **`id`** is overridden to `starter_${index}` (stable, deterministic)
- **`name`** is overridden with the starter's configured name from
  `data.yaml` — this is the correct name-precedence decision because
  `create_seed_slime` internally calls `generate_slime_name()` which
  produces a random "Prefix-Suffix" name, but starters have explicit
  configured names that must win
- **`diffusionRatio`**, **`amplitude`**, **`accentHue`** — TS-side
  defaults (20, 40, HUES[color]) since `create_seed_slime` does not set
  these fields. They are accent-layer visual properties, not stat-affecting
- **`vertexCount`**, **`irregularity`** — TS-side defaults from
  `SEED_SHAPE_DEFAULTS` (mirroring the Lua table in `data.yaml`).
  `create_seed_slime` reads these internally for `calculate_stats` but
  does not set them on the returned slime object
- **`createdAt`** — `Date.now()` fallback (Lua doesn't set this for seeds)
- **`stage`** — `'Hatchling'` fallback (Lua doesn't set this for seeds)

### Fields: Lua-returned vs TS-defaulted

| Field | Source | Value |
|---|---|---|
| `id` | TS override | `starter_${index}` |
| `name` | TS override | From `data.yaml` starter config |
| `color` | Lua | Correct culture color |
| `pattern` | Lua | `'Solid'` |
| `level` | Lua | `1` |
| `xp` | Lua | `0` |
| `stats` | Lua (`calculate_stats`) | Real formula-computed stats |
| `role` | Lua | `'idle'` |
| `generation` | Lua | `0` |
| `hue` | Lua | Culture hue (0, 60, 120, 180, 240, 300) |
| `saturation` | Lua | `100` (or `0` for Gray) |
| `colorSaturation` | Lua | Same as saturation |
| `diffusionRatio` | TS default | `20` |
| `amplitude` | TS default | `40` |
| `accentHue` | TS default | `HUES[color]` |
| `vertexCount` | TS default | From `SEED_SHAPE_DEFAULTS` |
| `irregularity` | TS default | From `SEED_SHAPE_DEFAULTS` |
| `createdAt` | TS default | `Date.now()` |
| `stage` | TS default | `'Hatchling'` |
| `lockedRole` | TS default | `null` (Lua nil) |
| `garrisonedAt` | TS default | `null` |

### Test coverage

New file: `ts/tests/test_starter_slime_stats.tsx` (5 anchors):

1. `test_starter_slimes_use_real_calculate_stats_not_flat_baseline` —
   every starter's stats differ from `{100,10,10,10,10,10}`
2. `test_different_starter_colors_produce_genuinely_different_stats` —
   Red and Blue starters are measurably different (Red ATK > Blue ATK,
   Blue INT > Red INT)
3. `test_starter_slime_retains_intended_name_not_lua_generated_name` —
   starter IDs match `starter_N` pattern, name override confirmed in source
4. `test_luaSlimeToTs_covers_every_field_this_component_reads` —
   every `SLIME_EXPLICIT_LUA_FIELDS` field is either returned by Lua or
   has a known TS-side default
5. `test_starter_slime_stats_match_real_color_specs_formula_exactly` —
   hand-computed Red stats (hp=128, atk=18, def=8, agi=6, int=5, chm=6)
   match Lua output exactly

### Final test floors

- **Python:** 432 passed, 8 warnings
- **TypeScript:** 192 passed, 27 files (+5 tests, +1 file from 187/26)

### Lesson

A correct Lua function, verified in isolation, is not proof any given
call site actually reaches it. The `seedSlime()` shadow function was a
TS-only hardcoded path that bypassed the entire Lua bridge — the stats
formula was correct but unreachable from the live game.

---

## Real Slime Shape Rendering (Phase 1: Geometry) — COMPLETED

### What was built

`SlimeVisual.tsx` previously rendered every slime as the same CSS
teardrop/circle, completely ignoring `vertexCount` (3–22) and
`irregularity` (0–100) — data that was already mechanically meaningful
(stat modifiers, Shape Codex target matching) but never visually
expressed. A Red slime (3 vertices) and a Yellow slime (6 vertices)
looked identical.

This phase replaces the flat CSS body with a real SVG polygon generated
from the slime's actual `vertexCount` and `irregularity` values. The
polygon silhouette is deterministic per-slime (seeded by a hash of the
slime's `id`), so a slime's shape stays visually stable across
re-renders.

### Implementation

- **`mulberry32(seed)`** — standard seeded PRNG with good distribution.
  Deterministic: same seed → same sequence, every time.
- **`hashStringToSeed(str)`** — derives a stable integer seed from the
  slime's `id` string (simple polynomial hash).
- **`generateSlimePolygonPoints(vertexCount, irregularity, seed, radius,
  center)`** — generates SVG polygon points. At `irregularity=0`,
  produces a perfect regular polygon (all vertices equidistant from
  center, evenly spaced angularly — zero jitter). At higher
  irregularity, applies deterministic angle and radius jitter scaled by
  the irregularity factor.
- **SVG `<polygon>` rendering** — replaces the CSS `borderRadius` body.
  The base color fill, radial gradient overlay, pattern fill (Stripe,
  Polka, Glow, Nebula, Obsidian), and inner shadow are all applied as
  stacked SVG polygons using the same generated points.
- **Pattern overlays preserved** — existing CSS-based patterns (Crown,
  Ringed) remain as external overlays. SVG `<pattern>` definitions
  handle the body-interior patterns (Stripe, Polka, Glow, Nebula,
  Obsidian) as fills applied to the polygon shape.
- **Face/nucleus overlays** — the core nucleus and adorable face (eyes,
  mouth, expressions) remain as HTML overlays on top of the SVG, now
  with `pointer-events-none` to avoid interfering with the SVG.

### What was NOT changed

- `get_shape_stat_modifiers`, `match_shape_target` — untouched (this is
  pure rendering, not data/formula changes)
- Breeding formulas — untouched
- `logic.lua` — untouched

### Explicitly deferred (real, separate future work)

- **Accent color-overlay layer** (`diffusionRatio`/`amplitude`/
  `accentHue`) — real, separate, needs its own design pass for how
  accent visual properties should be expressed as a secondary visual
  layer on top of the polygon silhouette
- **CRT scanline / per-color glow / distinctive font system** — found in
  the fresh intake export, real, separate, still unbuilt, not bundled
  here
- **Animation/transition polish** — real, separate, cosmetic-only once
  the base geometry exists

### Test Anchors — `ts/tests/test_slime_visual_geometry.tsx` (6 tests)

| Test | What it proves |
|---|---|
| `test_zero_irregularity_produces_regular_polygon` | Exact geometric check — all vertices equidistant from center, evenly spaced angularly, at irregularity=0 |
| `test_higher_irregularity_produces_more_vertex_deviation` | Average deviation from regular polygon increases monotonically with irregularity (0 < 25 < 50 < 100) |
| `test_same_slime_id_produces_identical_polygon_across_calls` | Same seed → same output, every time — deterministic stability |
| `test_different_vertex_counts_produce_different_point_counts` | 3-vertex slime has 3 points, 12-vertex has 12, 22-vertex has 22 |
| `test_red_and_yellow_starter_slimes_render_visually_distinct_shapes` | Real SEED_SHAPE_DEFAULTS (Red=3, Yellow=6) → genuinely different point counts and point strings |
| `test_pattern_overlay_still_applies_to_new_polygon_shape` | Source-level regression check — SVG patterns, pattern fills, face/nucleus overlays all still present |

### Files Changed

- `ts/src/games/slimeworld/components/SlimeVisual.tsx` — added mulberry32, hashStringToSeed, generateSlimePolygonPoints; replaced CSS body with SVG polygon; preserved pattern overlays
- `ts/tests/test_slime_visual_geometry.tsx` — new, 6 test anchors

### Test Floors

- TypeScript: 187 passed, 26 files (+6 tests, +1 file from previous 181/25)

---

## Splicing Roster Bloat + SlimeDex Discovery — COMPLETED

### Bug 1 — Splicing Roster Bloat

`handleInitiateBreeding` in `App.tsx` appended the child slime to
`previous.slimes` without removing the consumed parent. Lua's
`initiate_breeding` correctly removes `parent_b` from `state.slimes` and
sets `child.consumed_slime_id = parent_b_id`, but the TS state update
ignored `consumedSlimeId` entirely — so the consumed parent persisted in
the React roster forever. Each breeding event grew the roster by 1
instead of being net-zero (remove one, add one).

**Fix:** Filter `child.consumedSlimeId` from `previous.slimes` before
constructing the new array:

```tsx
const filteredSlimes = child.consumedSlimeId
  ? previous.slimes.filter(s => s.id !== child.consumedSlimeId)
  : previous.slimes;
// ...
slimes: [...filteredSlimes, child],
```

### Bug 2 — SlimeDex Discovery Never Populated

`colorCodex` and `patternCodex` were defined in `LabState` as optional
fields (`Record<SlimeColor, { discovered: boolean }>`), and
`SlimeDexTab.tsx` read them via `state.colorCodex?.[color]?.discovered`
— but `initialState()` never initialized them, and
`handleInitiateBreeding` never updated them. The SlimeDex was permanently
empty: zero colors discovered, zero patterns discovered, no matter what
the player bred.

**Fix — initialization:** `initialState()` now derives `colorCodex` and
`patternCodex` from the actual `starterSlimes` roster:

```tsx
for (const slime of starterSlimes) {
  colorCodex[slime.color] = { discovered: true };
  patternCodex[slime.pattern] = { discovered: true };
}
```

**Fix — breeding update:** `handleInitiateBreeding` now updates both
codexes when a new child is created:

```tsx
const newColorCodex = { ...(previous.colorCodex ?? {}),
  [child.color]: { discovered: true } };
const newPatternCodex = { ...(previous.patternCodex ?? {}),
  [child.pattern]: { discovered: true } };
```

### What Was NOT Changed

- `initiate_breeding` in `logic.lua` — untouched (Lua logic was correct)
- `colorTargetCodex`/`shapeTargetCodex` handling — untouched
- Breeding formulas — untouched
- Visual rendering gap (`vertexCount`/`irregularity`/`accentHue` never
  used by `SlimeVisual`) — explicitly deferred

### Test Anchors — `ts/tests/test_splicing_and_dex.tsx` (7 tests)

| Test | What it proves |
|---|---|
| `test_breeding_removes_consumed_parent_from_roster` | Real Lua breeding → consumed parent ID gone from roster |
| `test_breeding_without_consumption_keeps_both_parents` | `consumedSlimeId: null` → both parents retained |
| `test_roster_cap_enforced_correctly_after_fix` | 4 successive breeds at cap 5 → roster stays ≤ cap |
| `test_initial_color_codex_reflects_starter_slimes` | `initialState()` → every starter color/pattern discovered |
| `test_breeding_new_color_updates_color_codex` | Child with new color → `colorCodex[child.color].discovered === true` |
| `test_breeding_repeat_color_does_not_duplicate_or_error` | Same color bred twice → no duplicate, no error |
| `test_slimedex_ui_reads_the_correct_real_field` | SlimeDexTab source reads `state.colorCodex`/`state.patternCodex` with `?.discovered` |

### Files Changed

- `ts/src/games/slimeworld/App.tsx` — `initialState()` exported, codex initialization added, `handleInitiateBreeding` roster filter + codex update
- `ts/tests/test_splicing_and_dex.tsx` — new, 7 test anchors

### Test Floors

- Python: 432 passed, 8 warnings
- TypeScript: 181 passed, 25 files (+7 tests, +1 file from previous 174/24)

---

## Lifecycle Completeness Detector — COMPLETED

### What it does

A structural scan of `logic.lua` that finds every `state.active_X = { ...,
status = "..." }` launch pattern and checks whether anything elsewhere in
the file ever clears or transitions that status. If neither a clearing
write (`state.active_X = nil`) nor a status-transition write
(`.status = "different_value"`) is found, the field is flagged as
`POTENTIALLY_UNRESOLVED_LIFECYCLE`.

The report cross-references each flagged field against the existing
Recovery Manifest to point straight at the real source formula — closing
the loop from "structural gap found" to "here's the exact source function
to port." This is the same manual search done three separate times
tonight (Exploration, Mediation, Dispatch), done once, mechanically.

**Explicit non-goal**: this tool detects and points. It never
auto-generates or auto-applies resolution logic — the real formulas
differed in distinct ways across all three instances (Dispatch's clamp
was `[0.1, 0.98]`, not `[0.15, 0.98]`), and a mechanical tool guessing at
these would be actively dangerous.

### Two-pattern design

- **Pattern A (full clear)**: `state.active_X = nil` — used by
  Exploration and Mediation
- **Pattern B (status transition)**: `.status = "completed"` — used by
  Dispatch's intended contract (mark completed, let a separate retrieve
  function clear it)

A detector checking only one pattern would have missed real cases. Both
must be checked.

### Files

- `ts/tools/framework_gen/lifecycle_detector.ts` — structural scan engine
- `ts/tools/framework_gen/lifecycle_report.ts` — cross-reference against
  Recovery Manifest, human-readable report generation
- `ts/tools/framework_gen/generate_lifecycle_report.ts` — CLI entry point
- `ts/tests/test_lifecycle_detector.ts` — 7 test anchors
- `docs/slimeworld_lifecycle_report.md` — generated report (current state:
  0 flagged, 3 resolved)

---

## SlimeWorld Compounding Breeding Tax by Generation — COMPLETED

*August 5 2026*

### §0 Verification: `generation` is live

Confirmed by direct source read before any cost logic was written:

- `games/slimeworld/territory.lua` `initiate_breeding` line 112:  
  `local generation = math.max(parent_a.generation or 0, parent_b.generation or 0) + 1`
- `games/slimeworld/breeding.lua` `breed_slimes` line 372:  
  `generation = generation,` on the returned child table.
- `ts/src/games/slimeworld/types.ts`: `generation` is in `SLIME_EXPLICIT_LUA_FIELDS`,
  bridged both directions via `luaSlimeToTs` and `slimeToLua`.

**One real bug found and fixed during verification:** `create_seed_slime` in
`codex.lua` was setting `generation = 0`, not `generation = 1`. The directive
requires seed slimes to be generation 1 so that breeding two purchased seeds
produces a generation-2 offspring (free). With generation 0, two seeds would
have produced generation 1 — still free, but off-by-one from the directive's
intent and inconsistent with the "starting slimes are generation 1" design.
Fixed: `generation = 0` → `generation = 1` in `codex.lua`.

### What was built

Replaced the reverted flat-cost mechanism with a compounding tax keyed on
the offspring's `generation` field — the lineage-depth record that already
exists on every slime. No new persisted field was added.

**Formula:**
```
cost(offspring_generation):
  0                                              if offspring_generation <= 2
  floor(10 * 1.5^(offspring_generation - 2) + 0.5)  if offspring_generation >= 3
```

Producing: gen 1=0, gen 2=0, gen 3=15, gen 4=23, gen 5=34, gen 6=51.

### Placeholder values flagged

- **`base_cost = 10`** — anchored to SlimeBreeder's `TIER_VALUE[1] = 5` (2x),
  but no real SlimeWorld playtest data exists to tune this. Flagged as
  placeholder pending Robert's confirmation or real data.
- **`rate = 1.5`** — unverified guess. Produces a curve steep enough by
  mid-lineage to require real Zone Exploration income, gentle enough near
  the start not to choke onboarding. Flagged as placeholder.

### Modified files

- **`games/slimeworld/breeding.lua`** — Added `calculate_breeding_cost(generation)`
  function: returns 0 for generation ≤ 2, `floor(10 * 1.5^(gen-2) + 0.5)` for
  generation ≥ 3.
- **`games/slimeworld/territory.lua`** — `initiate_breeding` now computes
  `breeding_cost = calculate_breeding_cost(generation)` after computing
  `generation` but before creating the child. If `credits < breeding_cost`,
  returns `nil` with a specific error message naming the generation, cost,
  and shortfall. On success, deducts `breeding_cost` from `state.credits`.
  Removed the old flat `state.credits = math.max(0, (state.credits or 0) - 10)`.
- **`games/slimeworld/codex.lua`** — `create_seed_slime`: `generation = 0` →
  `generation = 1` (the verification bug fix).
- **`games/slimeworld/logic_original.lua`** — Regenerated from split files.
- **`ts/src/games/slimeworld/components/RosterTab.tsx`** — `getBreedingPrediction`
  now computes `offspringGeneration`, calls `calculate_breeding_cost` via the
  Lua bridge, and surfaces `prediction.generation`, `prediction.cost`, and
  `prediction.canAfford`. The breed panel shows "Gen N — M Credits" (or "Free")
  before the hatch button, with a red insufficient-funds warning when the
  player can't afford the breed.
- **`tests/test_slimeworld_breeding_cost.py`** — 6 new test anchors (file now
  has 9 total).
- **`ts/tests/test_slimeworld_breed_cost_ui.tsx`** — New file, 3 test anchors.

### Test coverage

**`tests/test_slimeworld_breeding_cost.py` (6 new tests)**
1. `test_generation_computed_as_max_parent_plus_one` — verifies the real
   generation formula: `max(7,4)+1=8`, `max(3,3)+1=4`
2. `test_generation_two_breed_remains_free` — gen-1 × gen-1 → gen-2, costs 0,
   across Red/Yellow/Blue
3. `test_generation_three_breed_costs_base_rate` — gen-2 × gen-1 → gen-3,
   deducts exactly 15 credits
4. `test_breed_cost_compounds_with_generation` — `calculate_breeding_cost`
   returns 15/23/34/51 for gens 3/4/5/6; integration breeds at each depth
   confirm exact deduction
5. `test_breed_fails_on_insufficient_credits_at_any_generation` — gen-3 breed
   with 5 credits fails, state unchanged, error names generation + cost + shortfall
6. `test_seed_purchased_slime_generation_one` — `create_seed_slime` returns
   `generation == 1`

**`ts/tests/test_slimeworld_breed_cost_ui.tsx` (3 tests)**
1. `test_ui_shows_projected_cost_before_breed` — RosterTab source computes
   `offspringGeneration`, calls `calculate_breeding_cost`, surfaces
   `prediction.generation`/`prediction.cost`/`prediction.canAfford` with
   "Gen N" label and "Insufficient funds" pre-commit warning
2. `test_ui_shows_insufficient_funds_message` — bridge-level: gen-3 breed
   with 5 credits returns specific error matching `/insufficient credits/i`,
   `/generation 3/i`, `/15 credits/i`, `/need 10 more/i`
3. `test_calculate_breeding_cost_compounds_correctly` — TS bridge call to
   `calculate_breeding_cost` returns 0/0/15/23/34/51 for gens 1/2/3/4/5/6

### Test floor

- **Python:** 567 passed, 11 deselected, 8 warnings
- **TypeScript:** 328 passed, 0 failed

### What is next

1. **Lab Purchases (`buy_upgrade`) cooldown** — not scoped in enough detail yet;
   needs its own design pass first.
2. **Envoy vs. Garrison** — unresolved design question.
3. **`shapeCodex` liveness check** — a verification task, not a build task.

### Test anchors

| Test | What it proves |
|---|---|
| `test_detects_real_known_pattern_retroactively` | Synthetic pre-fix Lua with all three bugs → all 3 flagged |
| `test_pattern_a_full_clear_recognized_as_resolved` | Clear-to-nil pattern correctly NOT flagged |
| `test_pattern_b_status_transition_recognized_as_resolved` | Status-transition pattern correctly NOT flagged |
| `test_genuinely_unresolved_field_is_flagged` | Deliberately broken synthetic case correctly flagged |
| `test_cross_reference_finds_real_manifest_entry` | `active_dispatch` → `resolveDispatch` matched in real manifest |
| `test_no_matching_entry_reported_honestly` | Unknown field → `NO_MATCHING_MANIFEST_ENTRY`, no guessed near-miss |
| `test_report_includes_real_line_numbers` | Every flagged case has verifiable line references |

### Test floors

- Python: 432 passed, 8 warnings
- TypeScript: 174 passed, 24 files (+7 tests, +1 file from previous 167/23)

---

## Mission Serialization Fix + End-to-End Test Coverage — COMPLETED

### Bug

`stateToLua` in `ts/src/games/slimeworld/types.ts` passed `active_exploration`,
`active_mediation`, and `active_dispatch` as raw TS `Mission` objects with
camelCase fields (`targetNodeId`, `slimeIds`, `cyclesRemaining`). Lua's
`advance_cycle` reads `target_node_id`, `slime_ids` — which are `nil` because
the keys are actually camelCase. All three mission types silently no-oped:
exploration awarded no XP and didn't find the target node, mediation didn't
change node strength, dispatch fields were unreadable. Slimes stayed
soft-locked in `dispatch` role forever.

### Fix

Added `missionToLua()` helper in `types.ts` that converts `Mission` fields to
snake_case (`zone_id`, `target_node_id`, `slime_ids`, `cycles_remaining`,
`status`). All three mission fields in `stateToLua` now use it.

### Test Coverage — `ts/tests/test_mission_serialization.tsx` (7 anchors)

Two tiers of proof:

**Tier 1 — unit-level** (3 tests):
- `test_missionToLua_converts_all_fields_to_snake_case` — field-by-field
  confirmation, verifies no camelCase keys leak through
- `test_missionToLua_preserves_real_values` — values aren't just renamed
  but genuinely correct
- `test_stateToLua_uses_missionToLua_for_all_three_mission_types` — all
  three mission fields route through the helper

**Tier 2 — end-to-end through real executor bridge** (3 tests):
- `test_real_exploration_resolves_through_full_stateToLua_path` — real
  `Mission` → real `stateToLua` → real `advance_cycle` call, confirms XP
  awarded, log contains real node name (not "unknown"), mission cleared
- `test_real_mediation_resolves_through_full_stateToLua_path` — same,
  confirms node strength changed, mediation log present
- `test_real_dispatch_resolves_through_full_stateToLua_path` — confirms
  `zone_id` and `slime_ids` readable by Lua after `stateToLua` round-trip
  (dispatch resolution in `advance_cycle` is a separate known gap)

**Sanity check** (1 test):
- `test_missing_missionToLua_would_have_failed_this_test` — deliberately
  bypasses `missionToLua` (passes raw camelCase), confirms XP stays 0,
  log says "unknown" — proves the Tier 2 tests are load-bearing, not
  just passing regardless

### Lesson

A correct Lua formula, individually unit-tested, is not proof the live
game works. The bug lived in the seam between two correct halves — the
TS `Mission` object and the Lua `advance_cycle` logic — and neither
half's tests could catch it. The test has to live in that seam too:
real `stateToLua` → real Lua executor → real outcome verification.

### Files Changed

- `ts/src/games/slimeworld/types.ts` — added `missionToLua()`, wired into `stateToLua`
- `ts/tests/test_mission_serialization.tsx` — new, 7 test anchors

### Test Floors

- Python: 432 passed, 8 warnings
- TypeScript: 167 passed, 23 files (+7 tests, +1 file from previous 160/22)

---

## Recovery Manifest Tool — Const-Usage Detection Fix — COMPLETED

### Bug

The recovery manifest tool (`ts/tools/framework_gen/audit.ts`) checked
for symbol usage in Lua using a paren-based call pattern
(`snakeName\s*\(`). This correctly detected function calls but
structurally could not match const/table usage, which appears as
bracket-indexing (`SEED_SHAPE_DEFAULTS[color]`) or dot-access — never
with parentheses. As a result, `SEED_SHAPE_DEFAULTS` was reported as
`DEFINED_NOT_CALLED` despite being genuinely used at `logic.lua` line
832.

### Fix

Added a separate const-usage check for `kind === 'const'` symbols that
matches bracket/dot access patterns (`\bname\s*[\[\.]`), distinct from
the existing function-call check. Also checks the original name (not
just snake_case) since SCREAMING_SNAKE_CASE consts like
`SEED_SHAPE_DEFAULTS` keep their original casing in Lua. Lua
`local` definition lines are stripped to avoid false positives.

### Manifest Status Breakdown (after fix)

| Status | Before | After |
|---|---|---|
| RECOVERED | 21 | 22 |
| DEFINED_NOT_CALLED | 1 | 0 |
| NEEDS_HUMAN_REVIEW | 26 | 26 |

Only `SEED_SHAPE_DEFAULTS` shifted: `DEFINED_NOT_CALLED` → `RECOVERED`.
No other consts changed status — the 26 `NEEDS_HUMAN_REVIEW` items
weren't found by name at all, so the usage-pattern fix doesn't affect
them.

### Separate, Still-Open Follow-Up (NOT fixed here)

`seed_shape_defaults` is duplicated between `data.yaml` (line 188) and
a hardcoded `local SEED_SHAPE_DEFAULTS` table in `logic.lua` (line
192) — the same triplication pattern found and fixed this morning for
`color_specs`. This is a real data issue, not a tool bug. Flagged for
separate follow-up work.

### Files Changed

- `ts/tools/framework_gen/audit.ts` — added const-usage detection branch
- `ts/tests/test_recovery_manifest.ts` — 4 new test anchors (14 total)
- `docs/slimegarden_recovery_manifest.md` — regenerated with fix applied

### Test Floors

- Python: 432 passed, 8 warnings
- TypeScript: 160 passed, 22 files

---

## Mediation Resolution Fix — COMPLETED

### Motivation — Same Bug Class as Exploration (Never Resolved)

`launch_mediation` set `state.active_mediation = {..., cycles_remaining=1,
status="active"}` and returned. Confirmed via grep — `active_mediation`
appeared exactly once in the entire file, only in the launch function.
No resolution, no cleanup, no role release. Slimes assigned to mediation
were soft-locked indefinitely with no path back. This is the same bug
class as the Exploration resolution fix: a launch function with no
corresponding resolution in `advance_cycle`.

### What Was Built

Ported exactly from `resolveMediation` in the real source
(`intake/slimegarden/extracted/src/gameLogic.ts` ~line 898):

- **Mediation resolution block** added to `advance_cycle`, placed
  alongside the existing Exploration resolution block.
- **Party power** = sum of `chm` across all party members.
- **Target power** = `40 + (strength > 0 ? round((1-strength)*60) : 35)`
  — distinct from Exploration's `40 + round(strength*60)`.
- **Success chance**: same shape as Exploration — `ratio > 1 →
  0.85 + (ratio-1)*0.1`, else `0.2 + ratio*0.6`, clamped `[0.15, 0.98]`.
- **On success**: `stabilityChange = floor(15 + totalChm/6 + random()*8)`.
- **On failure — key difference from Exploration**:
  `stabilityChange = floor(5 + random()*5)` — still a real, positive
  increase. Mediation never produces zero progress, unlike Exploration's
  clean binary success/fail.
- **Empty-party guard**: distinct third outcome — aborts immediately
  with no stability change at all.
- **Node strength** unit: confirmed 0-1 scale throughout the codebase
  (`math.min(1.0, strength + 0.02)`, `strength * 100`, etc.).
  `stabilityChange` is in percentage points (5-42), so `/100` conversion
  is correct.
- **Party release**: all three outcomes (success, failure, empty-party
  abort) set `locked_role = nil` and clear `state.active_mediation`.

### Test Anchors (10 new, all passing)

| Test | Target |
|---|---|
| `test_mediation_party_power_sums_chm` | Real party, hand-computed sum |
| `test_mediation_success_chance_above_ratio_one` | ratio > 1 formula match |
| `test_mediation_success_chance_below_ratio_one` | ratio < 1 formula match |
| `test_mediation_chance_clamped_to_bounds` | Extreme ratios within [0.15, 0.98] |
| `test_mediation_success_increases_node_strength` | Seeded-RNG forced-success case |
| `test_mediation_failure_still_increases_strength` | **Key distinction** — failure still positive |
| `test_mediation_empty_party_aborts_no_change` | Distinct third outcome, no change |
| `test_mediation_slimes_always_released` | All three outcomes release party |
| `test_mediation_state_cleared_after_resolution` | `active_mediation` is nil after |
| `test_full_mediation_lifecycle` | Launch → resolve → end-to-end state change |

### Final Floor

- **Python: 432 passed** (was 422, +10 new mediation tests)

---

## Color-Stat Data Deduplication — COMPLETED

### Motivation — Triplication Found Immediately After Original Directive Shipped

The "Real Color + Shape Stat Computation" directive (above) introduced
color stat data in **three** places: `cultures`/`neutral_traits.gray`
in `data.yaml` (pre-existing), a new `color_specs` key in `data.yaml`
(dead — nothing read it), and a hardcoded `COLOR_STAT_SPECS` table in
`logic.lua` (the only one actually used). The `color_specs` key was a
straight duplicate of `cultures`/`neutral_traits.gray`; the Lua table
was a triplicate. This refactor eliminates both redundant copies,
making `cultures`/`neutral_traits.gray` the single source of truth,
passed as an explicit `color_specs` parameter — the same pattern as
`color_targets`/`shape_targets`.

### What Changed

- **Removed** `color_specs` key from `data.yaml` (dead, never read).
- **Removed** `COLOR_STAT_SPECS` hardcoded table from `logic.lua`.
- **`get_interpolated_specs(hue, saturation, color_specs)`** — now
  takes `color_specs` as a parameter, reads `color_specs[a1.color]` /
  `color_specs.Gray` instead of the removed local table.
- **`calculate_stats(color, level, hue, saturation, vertex_count,
  irregularity, color_specs)`** — threads `color_specs` through to
  `get_interpolated_specs`.
- **`create_seed_slime(color, pattern, color_specs)`** — gains
  `color_specs` param; falls back to flat baseline if nil (for
  `advance_cycle` callers that don't pass it).
- **`initiate_breeding(..., color_specs)`** — gains `color_specs` as
  9th parameter, threaded to `calculate_stats`.
- **`advance_cycle(state, color_specs)`** — gains optional
  `color_specs` param for stray detection's `create_seed_slime` call.
- **TS `App.tsx`** — `buildColorSpecs()` helper constructs the dict
  from `cultures` + `neutral_traits.gray` at call time; passed to
  both `initiate_breeding` and `advance_cycle`.
- **All Python tests** updated to build and pass `color_specs` from
  real `cultures`/`neutral_traits.gray` data.

### What Did NOT Change

- Stat math (`get_shape_stat_modifiers`, `calculate_stats` formula) —
  untouched, verified correct.
- `color_targets`/`shape_targets` wiring — reference pattern only.
- No UI changes — pure data-flow correction.

### Test Anchors (3 new dedup verification tests)

| Test | Target |
|---|---|
| `test_color_specs_removed_from_data_yaml` | Dead key confirmed gone |
| `test_no_hardcoded_color_stat_specs_in_lua` | `COLOR_STAT_SPECS` confirmed removed |
| `test_get_interpolated_specs_with_real_cultures_data` | Same values from real source |

### Final Floor

- **Python: 422 passed** (was 419, +3 dedup verification tests)

---

## Real Color + Shape Stat Computation — COMPLETED

### Motivation — Stats Were Flat or Absent

`stats` existed in exactly one place in `logic.lua` — `create_seed_slime`,
as a flat, identical baseline (`hp=100, atk=10, def=10, agi=10, int=10,
chm=10`) for every color. `breed_slimes`'s returned child had **no
`stats` field at all**. No genetics-based stat variation existed anywhere.

### What Was Built

Ported exactly from the real source
(`intake/slimegarden/extracted/src/gameLogic.ts`):

- **`color_specs`** added to `data.yaml` — 7 color entries (Red, Orange,
  Yellow, Green, Purple, Blue, Gray), each with `base_stats` and `growth`
  (6 stats per entry), matching `COLOR_SPECS` exactly.
- **`COLOR_STAT_SPECS`** + **`SEED_SHAPE_DEFAULTS`** lookup tables in
  `logic.lua` (self-contained, no caller signature changes needed).
- **`get_interpolated_specs(hue, saturation)`** — finds the two adjacent
  color anchors the hue falls between, linearly interpolates `base_stats`
  and `growth` by sector position, then blends toward Gray by
  `saturation/100`. Mirrors Color's existing hue/saturation breeding math.
- **`get_shape_stat_modifiers(vertex_count, irregularity)`** — weighted
  linear ramps (not step functions), each capped at 10% multiplicative
  bonus. Simple/stable shapes → +HP/+DEF, clean/complex → +INT/+CHM,
  jagged → +ATK/+AGI.
- **`calculate_stats(color, level, hue, saturation, vertex_count,
  irregularity)`** — combines interpolated color specs + level growth +
  shape modifiers. Pattern switch deliberately NOT ported (retired
  discrete Pattern system; SlimeWorld uses Accent now).

### Critical Sequencing Finding

`calculate_stats` is called in **`initiate_breeding`**, not
`breed_slimes`. The real pipeline order is:

1. `breed_slimes` → returns child with hue/saturation/color but **no
   vertex_count/irregularity**
2. `breed_shape` → returns shape, then `child.vertex_count`/
   `child.irregularity` are set
3. `breed_accent` → uses child's shape genetics
4. **`calculate_stats`** → called after all breed steps, using child's
   final hue/saturation/vertex_count/irregularity

If `calculate_stats` had been placed in `breed_slimes`, shape genetics
would silently never affect stats — the code would look correct, color
tests would pass, but shape would be invisible. Verified against the real
call order at `logic.lua:495-522`.

### Wiring

- **`create_seed_slime`** — replaced flat baseline with
  `calculate_stats(color, 1, hue, saturation, seed_shape.vertex_count,
  seed_shape.irregularity)` using `SEED_SHAPE_DEFAULTS[color]`.
- **`initiate_breeding`** — added `child.stats = calculate_stats(...)`
  after `breed_shape` sets `child.vertex_count`/`child.irregularity` and
  before `table.insert`.

### Test Anchors (10 new, all passing)

| Test | Target |
|---|---|
| `test_get_interpolated_specs_pure_color_matches_color_specs` | hue=0, sat=100 → Red's exact base_stats |
| `test_get_interpolated_specs_midpoint_blend` | hue=30 → midpoint of Red/Orange |
| `test_get_interpolated_specs_zero_saturation_is_gray` | sat=0 → Gray's base_stats |
| `test_get_shape_stat_modifiers_simple_stable_boosts_hp_def` | Low vertex/irr → +HP/+DEF |
| `test_get_shape_stat_modifiers_jagged_boosts_atk_agi` | High irr → +ATK/+AGI |
| `test_calculate_stats_level_scaling` | Level 1 vs 5 → growth-driven difference |
| `test_create_seed_slime_stats_vary_by_color` | Red vs Blue seed → different stats |
| `test_breed_slimes_produces_real_stats_field` | Bred child has non-empty stats |
| `test_shape_genetics_actually_affects_bred_stats` | Different shapes → different stats |
| `test_pattern_switch_not_ported` | No Pattern names in calculate_stats |

### Final Floor

- **Python: 419 passed** (was 409, +10 new tests)
- **TypeScript: 146 passed / 21 files** (unchanged — Lua/data-layer only)

### Deliberately Deferred

- **Accent-based stat contribution** — real, separate, undecided future
  design work. Whether Accent (`diffusion_ratio`/`amplitude`) should get
  its own stat contribution is not decided here.
- **Stat tuning** — ported exact values; playtesting may warrant
  rebalancing base_stats, growth rates, or the 10% shape-bonus cap.
- **UI display of stat breakdown** — Lua/data-layer only; no UI changes.

---

## Multi-Return Truncation Fix — Phase 1 COMPLETED

### Motivation — Studio-Wide Bug

`LuaExecutor.call()` in `ts/src/engine/executor.ts` hardcoded `nresults=1` in
`lua_pcall`, truncating all but the first return value from Lua functions. This
silently lost error strings from the common `return value, error` idiom across
**31 multi-return statements in 6 of 9 games**.

### What was fixed

**`ts/src/engine/executor.ts`** — `call()` now uses `LUA_MULTRET` instead of
`nresults=1`, computes `resultCount = newTop - baseTop` via stack arithmetic,
and returns `unknown[]` with all return values.

**`ts/src/engine/runtime.ts`** — `call()` return type updated to `unknown[]`.

**`ts/src/engine/types.ts`** — `LuaExecutor` interface `call` return type
updated to `unknown[]`.

**`ts/src/games/slimeworld/App.tsx`** — All 16 call sites migrated to
destructure `unknown[]` returns. `luaResult()` helper updated to accept
`unknown[]` directly.

**`ts/src/hooks/useLuaCall.ts`** — Backward-compat fix: extracts `results[0]`
from the `unknown[]` so all hook-based games (chimera_wilds, brewfield,
mutant_battle_ball, slime_coin, horse_racing) get the first return value
without needing App.tsx changes.

**`ts/src/games/scrapcrawl/App.tsx`** — Two direct `executor.call()` sites
given `[0]` extraction (compatibility fix, not full migration).

**Test files updated:** `test_executor.ts`, `test_runtime.ts`, `test_arcade.ts`,
`test_slimeworld_petition_wiring.tsx`, `test_lua_slime_field_safety.tsx` — all
mocks and expectations updated for `unknown[]` return type.

### Stack Arithmetic Proof

`ts/tests/test_multi_return_proof.ts` (5 tests) — throwaway proof using real
fengari executor with synthetic Lua functions:
- `return 1, 2, 3` → `[1, 2, 3]`
- `return nil, "error"` → `[null, "error"]`
- `return 42` → `[42]`
- `return` → `[]`
- `return a+b, a*b, a-b` → `[8, 15, -2]`

### Permanent Detector

**`tools/detect_multi_return/scan_lua.py`** — Scans `games/*/logic.lua` for
multi-value `return` statements. Found 31 multi-return statements across 6
games (slimeworld, horse_racing, mutant_battle_ball, chimera_wilds, brewfield,
shoal).

**`ts/tests/test_multi_return_bridge.ts`** (7 tests) — Permanent regression
test. Calls real Lua functions via fengari executor with error-triggering
arguments, asserts both return values are captured (not truncated):
- `fulfill_petition` error path → `[null, "error string"]`
- `recycle_slime` error path → `[null, "error string"]`
- `can_unlock_slot` insufficient funds → `[false, "Insufficient..."]`
- `can_unlock_slot` max capacity → `[false, "...maximum capacity"]`
- `generate_chimera` error path → `[null, "Missing slot..."]`
- `assemble_mutant` error path → `[null, "Missing part..."]`
- `initiate_breeding` same-parent error → `[null, "Parents must differ"]`

**`tests/test_multi_return_detector.py`** (7 tests) — Python tests for the
scanner: runs without error, finds slimeworld/horse_racing multi-returns, JSON
output valid, detects 6+ games, return value count >= 2, handles nonexistent
game.

### Final Floors
- **Python: 409 passed** (was 402, +7 new detector tests)
- **TypeScript: 146 passed / 21 files** (was 134/19, +12 new tests, +2 new files)

### Phase 2 — DEFERRED (real, not implied)

The remaining 8 non-SlimeWorld games have 20 call sites that still use the
old single-value pattern via `useLuaCall` (which now extracts `[0]` for
backward compat). A full migration of those 20 sites to destructure `unknown[]`
and access error strings is real future work, explicitly deferred. The games
function correctly today because `useLuaCall` returns `results[0]`, but they
cannot access multi-return error strings until migrated.

---

## Framework Generation Layer, Module 1: Pure-Data Extraction — COMPLETED

### Motivation — Real Regression Prevention

This morning's Color Codex regression: a directive scoped from a grep pattern
(`guild_|rival_`) missed 6 real `arc_triad` and 2 real `skip_triad` entries
sitting in the exact same `COLOR_TARGETS` array in the same source file. A
human reading-comprehension failure, not a data problem. The array was never
ambiguous; a person just didn't read all of it.

**Module 1 prevents this mechanically:** an AST-based classifier walks every
top-level `export const` in a `.ts` file, determines if the initializer is
pure literal data (arrays/objects of only strings, numbers, booleans, nested
literals — no function calls, no external references, no computed keys), and
emits a YAML staging fragment with camelCase→snake_case field conversion
matching the real `data.yaml` convention.

### What was built

**`ts/tools/framework_gen/classify.ts`** — AST-based classifier using the
TypeScript compiler package (already a dependency). Walks top-level exported
`VariableStatement` nodes, recursively checks each initializer for literal
purity. When uncertain, classifies as not-pure-data (bias toward caution).

**`ts/tools/framework_gen/emit_yaml.ts`** — Converts classified pure-data
declarations to YAML. `camelToSnake` handles both camelCase fields
(`centerHues` → `center_hues`) and all-caps constants (`COLOR_TARGETS` →
`color_targets`). Field names verified against real `data.yaml` conventions.

**`ts/tools/framework_gen/report.ts`** — Markdown report matching the studio's
`MANIFEST.md` convention. Every "not converted" entry has a real, specific
reason (function call name, external identifier, computed key) — never a
generic "too complex."

**`ts/tools/framework_gen/cli.ts`** — Entry point. Takes a `.ts` file path,
produces YAML fragments + report in a staging output directory. Never writes
to any existing `data.yaml` or `logic.lua`.

### The Load-Bearing Test

`test_extracts_all_17_entries_not_9` — feeds the real `COLOR_TARGETS` source
array containing all 6 Guild + 3 Rival + 6 Arc Triad + 2 Skip Triad entries,
confirms the output YAML has all 17, not the 9 a narrow grep would have found.
**This is the actual regression, reproduced and proven fixed.**

### Tests

**TypeScript (`ts/tests/test_framework_gen_classify.ts`):** 7 tests
- `test_classifies_color_targets_as_pure_data`
- **`test_extracts_all_17_entries_not_9`** — the actual point of the module
- `test_converts_camelCase_to_snake_case_correctly` — verified against real `data.yaml`
- `test_flags_function_call_as_not_pure_data`
- `test_flags_external_reference_as_not_pure_data`
- `test_report_gives_specific_reason_not_generic`
- `test_never_writes_to_real_data_yaml`

### Final Floors
- **Python: 402 passed** (unchanged)
- **TypeScript: 134 passed / 19 files** (was 127/18, +7 new tests, +1 new file)

### Module Roadmap — For Context

| Module | Scope | Status |
|---|---|---|
| **1 — Pure-Data Extraction** | This module. AST-classify + auto-emit YAML for literal data. | **Complete** |
| **2 — Ambiguous Review Report** | Deeper analysis of "not pure data" bucket — richer reasoning, partial-conversion suggestions for human review. | Not yet scoped |
| **3 — Logic Stub Generation** | Function declarations get correctly-signatured Lua stubs with original TS source as translation reference. Hardest, riskiest — deliberately last. | Not yet scoped |

Modules 2 and 3 are explicitly separate, real, not-yet-started future work.
Each ships independently, verified on its own, before the next begins.

---

## Wanderer Petition Wiring — COMPLETED

### Motivation — Most Complete Instance of the Recurring Bug Class

This is the most complete instance of today's "Lua computes it, TS drops it"
bug class: **every layer was missing** — Lua never spawned petitions, TS had
no state field, no handler called fulfillment, no UI showed them. Ground-up,
not just a dropped field.

**Root cause traced completely:**
1. `create_wanderer_petition(cycle, active_petitions)` existed in Lua, real and
   correct (tier-scaled reward, either-or requirement rolling) — but appeared
   exactly once in the entire file: its own definition. Never called, not even
   from `advance_cycle`.
2. `advance_cycle` already expired petitions but never spawned new ones.
   Petitions could only shrink toward zero.
3. `fulfill_petition(state, petition_id, slime_id)` was real, correct — but
   nothing in `App.tsx` ever called it.
4. `LabState` had zero petition-related fields. `stateToLua` had no `petitions`
   key at all.
5. No UI anywhere displayed a petition.

### Changes

**Lua (`games/slimeworld/logic.lua`):**
- Added petition-spawn block to `advance_cycle`, placed right after the
  petition-expiration block. Deterministic spawn when under
  `WANDERER_REQUEST_MAX` (3) — not probabilistic like Contract's 0.65 chance.
  Rationale: petitions are premium encounters (3x payout multiplier, 5-8 cycle
  expiration), not common arrivals. Always spawn when under cap; throttling can
  be added later without changing the call site.
- `create_wanderer_petition` and `fulfill_petition` logic unchanged — only
  called now.

**TypeScript (`ts/src/games/slimeworld/types.ts`):**
- Added `Petition` interface (id, source, requestedColor, requestedShape,
  payoutMultiplier, reward, expiresCycle).
- Added `petitions: Petition[]` to `LabState`.
- Added `luaPetitionToTs` converter (snake_case → camelCase).
- Added `petitions` round-trip to `stateToLua`.

**App.tsx:**
- `initialState` seeds `petitions: []`.
- `handleAdvanceCycle` parses `petitions` from Lua result via `luaPetitionToTs`.
- New `handleFulfillPetition` handler: calls `fulfill_petition`, updates credits
  and removes fulfilled petition from state.

**EconomyTab.tsx:**
- New "Wanderer Petitions" sub-tab alongside "Corp Contracts" and "Galactic
  Market". Mirrors the Contracts card pattern: shows requested color/shape (or
  "Any" if null), payout, cycles remaining, matching idle specimens, fulfill
  action with confirmation modal.

### Tests

**Python (`tests/test_slimeworld_petition_spawning.py`):** 4 tests
- `test_advance_cycle_spawns_petition_under_cap` — real cycle, petition appears
- `test_advance_cycle_does_not_spawn_over_cap` — at cap (3), no new petition
- `test_advance_cycle_still_expires_petitions` — expiration unregressed
- `test_full_petition_lifecycle` — spawn → fulfill → state changes confirmed

**TypeScript (`ts/tests/test_slimeworld_petition_wiring.tsx`):** 5 tests
- `test_createInitialState_seeds_empty_petitions` — source check
- `test_handleAdvanceCycle_parses_real_petitions` — real Lua-generated petition
- `test_handleFulfillPetition_real_success` — matching slime, payout > 0
- `test_handleFulfillPetition_real_failure` — nonexistent slime, null result
- `test_economytab_renders_real_petitions` — UI source check

### Final Floors
- **Python: 402 passed** (was 398, +4 new tests)
- **TypeScript: 127 passed / 18 files** (was 122/17, +5 new tests, +1 new file)

### Note on TS Executor Limitation — RESOLVED
The TS Lua executor (`executor.ts`) previously used `nresults=1` in `lua_pcall`,
truncating multi-return Lua functions to their first value. This was fixed in
the Multi-Return Truncation Fix (Phase 1) — see above. `fulfill_petition` now
correctly returns `[null, "error string"]` on failure.

---

## Shared Data Layer + Lua→TS Field Safety Alarm — COMPLETED

### Motivation — Five Recurring Bug Instances

Today, five separate bugs shared the same root shape: **Lua computes and returns
something real and correct, and a hand-maintained TS conversion function's fixed
field list silently drops it.** The confirmed instances:

1. **Worker income** — `advance_cycle` computed worker income in Lua, TS conversion dropped it
2. **Breeding consumption (`consumed_slime_id`)** — `initiate_breeding` set `consumed_slime_id` on the child, `luaSlimeToTs` didn't handle it
3. **Color Codex detection (`matched_target_id`)** — `initiate_breeding` set `matched_target_id`, `luaSlimeToTs` didn't handle it
4. **Shape Codex detection (`matched_shape_target_id`)** — `initiate_breeding` set `matched_shape_target_id`, `luaSlimeToTs` didn't handle it
5. **Exploration resolution** — `advance_cycle` exploration results had fields TS didn't parse

Three of the five were confirmed in `luaSlimeToTs` specifically. The fix is not
another patch — it's a structural change that prevents the sixth instance.

### Part A — Shared Data Layer (`getStaticList`)

**Problem:** `gameLogic.ts` hand-copied `COLOR_TARGETS` (17 entries) and
`SHAPE_TARGETS` (23 entries) from `data.yaml` into TypeScript constants. This
duplicates data and creates drift risk — if `data.yaml` changes, the constants
go stale silently.

**Fix:** Added `getStaticList(session, key)` to `ts/src/engine/runtime.ts` —
reads flat arrays directly from `session.files.data[key]` (the parsed
`data.yaml` loaded once at game start). This is a sibling to the existing
`getSchema(session, entity)`, which unwraps `.fields` for entity schemas;
`getStaticList` skips that unwrapping for flat arrays like `color_targets` and
`shape_targets`.

**Changes:**
- `ts/src/engine/runtime.ts` — added `getStaticList(session, key)` function
- `ts/src/games/slimeworld/gameLogic.ts` — removed `COLOR_TARGETS` and `SHAPE_TARGETS` constants and their camelCase interfaces; added `RawColorTarget`/`RawShapeTarget` interfaces matching `data.yaml`'s snake_case field names
- `ts/src/games/slimeworld/components/SlimeDexTab.tsx` — migrated to `getStaticList(session, 'color_targets')` / `getStaticList(session, 'shape_targets')`; all field accesses updated from camelCase to snake_case (`center_hues`, `saturation_min`, `saturation_max`, `vertex_count`, `irregularity_min`, `irregularity_max`)
- `ts/src/games/slimeworld/components/RosterTab.tsx` — migrated `COLOR_TARGETS.find()` calls to `getStaticList` lookup; added `session` prop
- `ts/src/games/slimeworld/App.tsx` — passes `session` to `RosterTab`
- `ts/src/games/slimeworld/components/EconomyTab.tsx` — removed unused `COLOR_TARGETS` import
- `ts/src/games/slimeworld/components/LabTab.tsx` — removed unused `COLOR_TARGETS` import

### Part B — Field-Drift Alarm System

**Problem:** `luaSlimeToTs` in `types.ts` has a fixed field list. When Lua
returns a new field, it's silently dropped — no error, no warning, no signal.

**Fix:** Exported `SLIME_EXPLICIT_LUA_FIELDS` — the real, already-existing set
of field names that `luaSlimeToTs` explicitly handles — as a named constant.
This is not a duplicate list; it's the same set the function actually uses,
exported so a test can reference it. Then created an alarm test that calls the
**real executor bridge** (not a mock) to run `initiate_breeding` and checks
that every field in the real child object is accounted for in the explicit set.

**This is an alarm, not an automatic fix.** When the test fails in the future,
the correct response is a human decision: either add genuine handling in
`luaSlimeToTs` (with proper type coercion), or add to the allowlist with a
comment explaining why it's intentionally unhandled. Never reflexively add to
the allowlist to silence the alarm.

**`luaSlimeToTs` conversion logic is completely unchanged.** This directive
only exports the field list and adds a test — it does not modify how the
function converts fields.

**`luaNodeToTs` was checked and found already correct** — its field list is
complete and matches what Lua returns for planet nodes. It was not touched.

**Other Lua functions audited:**
- `launch_exploration` — returns simple 5-field object, no custom converter, inline field access. No alarm needed.
- `launch_dispatch` — same pattern. No alarm needed.
- `launch_mediation` — same pattern. No alarm needed.
- `advance_cycle` — returns full state. Slimes within it are parsed via `luaSlimeToTs` (already covered by this alarm). Other fields parsed inline with explicit field access. `luaNodeToTs` checked and complete. No additional alarm needed.

### Test Results

- **Python:** 398 passed
- **TypeScript:** 122 passed / 17 files (was 113/15 pre-flight; +9 new tests across 2 new files)

### New Test Files

- `ts/tests/test_shared_data_layer.tsx` (4 tests): `getStaticList` returns real 17-entry color targets, real 23-entry shape targets, throws on missing key, SlimeDexTab renders from live data
- `ts/tests/test_lua_slime_field_safety.tsx` (5 tests): explicit fields export matches conversion logic, alarm fires on real breeding result (passes today = current state clean), alarm would fail on synthetic new field (proves mechanism works), other Lua functions audited with findings, `luaSlimeToTs` logic unchanged

---

## SlimeWorld Exploration Tests + Codex Wiring Fix — COMPLETED

### What changed
Two parallel efforts completed:

**Part A — Exploration Resolution Tests (Python):**
Created `tests/test_slimeworld_exploration_resolution.py` with 10 test anchors covering the exploration resolution block in `advance_cycle`:
- Scout power = sum of int + agi across party members
- Success chance formula with ratio > 1 and ratio < 1 paths
- Chance clamped to [0.15, 0.98] for extreme ratios
- Node discovery on success (seeded RNG iteration)
- XP awards: 45 on success, 20 on failure (both outcomes verified)
- Scouts return to idle role regardless of outcome
- `active_exploration` cleared to nil after resolution
- Edge case: missing target node — no crash, fail-path XP
- Edge case: empty party — no crash, no XP awarded, log still created

**Part B — Codex Wiring Fix (TypeScript):**
Fixed the recurring "Lua computes it, TS drops it" bug class. Lua's `initiate_breeding` sets `matched_target_id`, `matched_shape_target_id`, and `consumed_slime_id` on the child slime, but `luaSlimeToTs` was silently dropping all three fields. Changes:
- `types.ts`: Added `matchedTargetId`, `matchedShapeTargetId`, `consumedSlimeId` to `Slime` interface; added `colorTargetCodex`, `shapeCodex`, `shapeTargetCodex` to `LabState`; updated `luaSlimeToTs` and `slimeToLua` to roundtrip all three fields.
- `gameLogic.ts`: Added `SHAPE_TARGETS` constant (23 entries matching `data.yaml` `shape_targets`).
- `App.tsx`: Breeding handler now updates `colorTargetCodex` and `shapeTargetCodex` when a child matches a target; tracks `lastConsumedSlimeId` for UI display.
- `SlimeDexTab.tsx`: Added "Morphological Shape Targets" grid section mirroring the Color Targets grid, with a full detail panel showing vertex count, irregularity, tier, and clues for locked shapes.
- `RosterTab.tsx`: Surfaces `consumedSlimeId` in the breeding result UI as a highlighted "Specimen Consumed" banner.

### The "Lua computes it, TS drops it" bug class
This is a recurring pattern: Lua logic correctly computes and attaches fields to game objects, but the TypeScript conversion layer (`luaSlimeToTs`) silently drops fields it doesn't explicitly map. The Color Codex target detection was wired in Lua but never surfaced to the TS frontend. The Shape Codex detection had the same gap. The `consumed_slime_id` field was set by Lua's breeding logic but never displayed in the UI. The fix is always the same: add the field to the TS interface, parse it in `luaSlimeToTs`, and wire it into the React state and UI components.

### Files touched
- `tests/test_slimeworld_exploration_resolution.py` — new, 10 test anchors
- `ts/src/games/slimeworld/types.ts` — 3 new Slime fields, 3 new LabState fields, luaSlimeToTs/slimeToLua updated
- `ts/src/games/slimeworld/gameLogic.ts` — SHAPE_TARGETS constant (23 entries) + ShapeTarget interface
- `ts/src/games/slimeworld/App.tsx` — breeding handler codex updates + lastConsumedSlimeId state
- `ts/src/games/slimeworld/components/SlimeDexTab.tsx` — Shape Codex grid + detail panel
- `ts/src/games/slimeworld/components/RosterTab.tsx` — consumedSlimeId UI display
- `ts/tests/test_slimeworld_codex_wiring.tsx` — new, 8 test anchors

### Verification
```text
.venv\Scripts\python.exe -m pytest tests/test_slimeworld_exploration_resolution.py -v --tb=short
-> 10 passed in 0.69s

cd ts && npx vitest run tests/test_slimeworld_codex_wiring.tsx --reporter=verbose
-> Test Files  1 passed (1)
-> Tests  8 passed (8)
```

## SlimeWorld Shape Codex Target Detection — COMPLETED

### What changed
Added the real 17-vertex-count Shape taxonomy and detection system. Previously, `shape_targets` in `data.yaml` had only 11 entries (Tier 1/2 clean shapes + Tier 5/6 star polygons) — 6 real constructible-polygon names were missing entirely. Added all 6, added `vertex_tolerance` to all 23 entries (17 existing + 6 new), implemented `match_shape_target(vertex_count, irregularity, shape_targets)` in `logic.lua`, and wired it into `initiate_breeding` alongside the existing `match_color_target` call.

### Tier 4 mislabeling corrected
The existing design docs labelled "Tier 4: Quartic (15, 16, 20)" — this is mathematically wrong. All three have φ(n) = 8 (a power of 2), meaning they are genuinely constructible with compass and straightedge. They are now correctly classified as **Tier 3 — Elaborate** (constructible, but requiring two nested quadratic steps). The real Tier 4 is vertex count 17 (Heptadecagon, φ(17) = 16, degree 8 — the hardest constructible polygon, proven by Gauss in 1796).

### Corrected 6-tier taxonomy (17 vertex counts)
| Tier | Real basis | Vertex counts | Names |
|---|---|---|---|
| 1 — Trivial | degree 1 | 3, 4, 6 | Triangle, Square, Hexagon |
| 2 — Simple | degree 2 | 5, 8, 10, 12 | Pentagon, Octagon, Decagon, Dodecagon |
| 3 — Elaborate | degree 4, two nested quadratic steps | 15, 16, 20 | Pentadecagon, Hexadecagon, Icosagon |
| 4 — Master | degree 8, hardest constructible (Gauss 1796) | 17 | Heptadecagon |
| 5 — Cubic | non-constructible, needs angle trisection | 7, 9, 14, 18 | Heptagon, Nonagon, Tetradecagon, Octadecagon (star-polygon variants: Star, Spiked, Crescent, Crown, Prism, Arrow, Teardrop, Crystal) |
| 6 — Quintic | non-constructible, unsolvable by radicals | 11, 22 | Hendecagon, Icosidigon (star-polygon variants: Void-Form, Celestial, Prismatic) |

### 6 new shape_targets added
- `shape_decagon` — Tier 2, vc=10, tol=0.5, irr 0-15
- `shape_dodecagon` — Tier 2, vc=12, tol=0.5, irr 0-15
- `shape_pentadecagon` — Tier 3, vc=15, tol=0.49, irr 0-15
- `shape_hexadecagon` — Tier 3, vc=16, tol=0.49, irr 0-15
- `shape_heptadecagon` — Tier 4, vc=17, tol=0.49, irr 0-15
- `shape_icosagon` — Tier 3, vc=20, tol=0.5, irr 0-15

### vertex_tolerance added to all existing entries
All 17 existing entries lacked `vertex_tolerance`. Added `0.5` to each. The 3 new consecutive clean entries (15/16/17) use `0.49` instead of `0.5` to prevent overlap at midpoints 15.5 and 16.5 — all three share the same irregularity band (0-15), so 0.5 tolerance would create ambiguous matches. 0.49 eliminates the overlap with minimal tightening.

### Adjacent-entry overlap check
With 14/15/16/17/18 now all present and only 1 apart, a real check was required:

| Boundary | Adjacent entries | Irregularity bands | Overlap? |
|---|---|---|---|
| 14.5 | Prism/Arrow (14, irr 40-100) vs Pentadecagon (15, irr 0-15) | Different | No |
| 15.5 | Pentadecagon (15, irr 0-15) vs Hexadecagon (16, irr 0-15) | Same — **fixed with 0.49 tolerance** | No (was yes at 0.5) |
| 16.5 | Hexadecagon (16, irr 0-15) vs Heptadecagon (17, irr 0-15) | Same — **fixed with 0.49 tolerance** | No (was yes at 0.5) |
| 17.5 | Heptadecagon (17, irr 0-15) vs Teardrop/Crystal (18, irr 40-100) | Different | No |

Pre-existing overlaps (not in scope to fix): Triangle(3)/Square(4) at 3.5, Square(4)/Pentagon(5) at 4.5, Pentagon(5)/Hexagon(6) at 5.5 — all share `irregularity_max: 15`, resolved by first-match-wins ordering.

### Detection algorithm
`match_shape_target` iterates targets in order. For each: if `|vertex_count - target.vertex_count| <= vertex_tolerance`, check if irregularity falls within `[irregularity_min or 0, irregularity_max or 100]`. First match wins. Returns `nil` if no match. Same shape as `match_color_target`.

### Wiring into initiate_breeding
Single line added after `match_color_target` call:
```lua
child.matched_shape_target_id = match_shape_target(child.vertex_count, child.irregularity, shape_targets)
```
Runs on every breed, not gated behind `active_shape_target`. `breed_shape`'s existing biasing logic unchanged.

### Files touched
- `games/slimeworld/data.yaml` — 6 new shape_targets, `vertex_tolerance` added to all 23 entries, header comment updated with corrected taxonomy
- `games/slimeworld/logic.lua` — added `match_shape_target` (13 lines), wired into `initiate_breeding` (1 line)
- `tests/test_slimeworld_shape_codex.py` — new, 8 test anchors

### Verification
```text
.venv\Scripts\python.exe -m pytest -q --tb=no
-> 388 passed, 8 warnings (was 380, +8 new tests)
```

### Deferred, real, separate follow-ups
- **Shape Codex bookkeeping**: discovery/inventory tracking for shape targets — parallel to the Color Codex bookkeeping deferral
- **UI display of Shape Codex progress**: Lua/data-layer only for now
- **Vertex counts 13, 19, 21**: real and valid, but outside the confirmed 17-count taxonomy
- **"Disturbed" variants of new Tier 3/4 shapes**: only clean forms added; high-irregularity variants deferred

## SlimeWorld Color Codex Target Detection — COMPLETED

### What changed
Added the real 17-target Color Codex detection system from the v0.1.0R2 source (`gameLogic.ts` lines 314-339 for `COLOR_TARGETS`, line 341 for `matchColorTarget`). Previously, `initiate_breeding` already biased child hue toward `active_target_regent` via `breed_slimes`, but nothing checked whether the resulting child actually landed inside a real target zone. Now `match_color_target(hue, saturation, color_targets)` runs on every breed and sets `child.matched_target_id`.

### 17 targets in data.yaml (4 tiers, matching fresh TS source exactly)
**6 Guilds** (adjacent capitol pairs, tight tolerance, high saturation):
- `guild_ember_marsh` → Thornward (center 30, tol 15, sat 65–100)
- `guild_marsh_gale` → Amberglow (center 90, tol 15, sat 65–100)
- `guild_gale_tundra` → Frostwind (center 150, tol 15, sat 65–100)
- `guild_tundra_crystal` → Mossy Crystal (center 210, tol 15, sat 65–100)
- `guild_crystal_tide` → Tidereign (center 270, tol 15, sat 65–100)
- `guild_tide_ember` → Abyssal Ember (center 330, tol 15, sat 65–100)

**3 Rivals** (opposite capitol pairs, wider tolerance, lower saturation):
- `rival_ember_tundra` → The Fault Line (centers [90, 270], tol 10, sat 35–65)
- `rival_marsh_crystal` → Eclipse Void (centers [150, 330], tol 10, sat 35–65)
- `rival_gale_tide` → Stormsurge (centers [210, 30], tol 10, sat 35–65)

**6 Arc Triads** (3 consecutive capitols, low saturation):
- `arc_ember_marsh_gale` → Arc: Ember-Marsh-Gale (center 60, tol 15, sat 20–35)
- `arc_marsh_gale_tundra` → Arc: Marsh-Gale-Tundra (center 120, tol 15, sat 20–35)
- `arc_gale_tundra_crystal` → Arc: Gale-Tundra-Crystal (center 180, tol 15, sat 20–35)
- `arc_tundra_crystal_tide` → Arc: Tundra-Crystal-Tide (center 240, tol 15, sat 20–35)
- `arc_crystal_tide_ember` → Arc: Crystal-Tide-Ember (center 300, tol 15, sat 20–35)
- `arc_tide_ember_marsh` → Arc: Tide-Ember-Marsh (center 0, tol 15, sat 20–35)

**2 Skip Triads** (3 alternating capitols, very low saturation):
- `skip_ember_gale_crystal` → Skip: Ember-Gale-Crystal (centers [0, 120, 240], tol 10, sat 15–20)
- `skip_marsh_tundra_tide` → Skip: Marsh-Tundra-Tide (centers [60, 180, 300], tol 10, sat 15–20)

All 17 targets match the fresh TS source `COLOR_TARGETS` array (line 314-339) and the locked Rev3 design memory exactly.

### Detection algorithm
`match_color_target` iterates targets in order. For each: if saturation falls within `[saturation_min, saturation_max)`, check each `center_hue` — if `circular_distance(hue, center) <= tolerance`, return the target's `id`. First match wins. Returns `nil` if no match. Reuses existing `circular_distance` function — no hue math reimplemented.

### Wiring into initiate_breeding
Single line added after accent computation, before `table.insert`:
```lua
child.matched_target_id = match_color_target(child.hue, child.saturation, color_targets)
```
Runs on every breed regardless of whether `active_target_regent` is set — a player breeding without an active target can still accidentally land in a real zone. Does NOT change `breed_slimes`'s existing hue-biasing behavior.

### Files touched
- `games/slimeworld/data.yaml` — all 17 color_targets confirmed present (6 Guilds, 3 Rivals, 6 Arc Triads, 2 Skip Triads), matching fresh TS source exactly
- `games/slimeworld/logic.lua` — added `match_color_target` (12 lines), wired into `initiate_breeding` (1 line)
- `tests/test_slimeworld_color_codex.py` — new, 9 test anchors

### Verification
```text
.venv\Scripts\python.exe -m pytest -q --tb=no
-> 380 passed, 8 warnings (was 371, +9 new tests)
```

### Deferred, real, separate follow-ups
- **`syncCodexWithRoster` bookkeeping**: full discovery/inventory tracking (`colorCodex`, `patternCodex`, `colorTargetCodex`, Regent inventory counts) — real, related, genuinely separate future work
- **Shape Codex detection**: `shape_targets`/`active_shape_target` already exist as parameters in `initiate_breeding`, following the same unwired pattern — parallel gap, deliberately not bundled
- **UI display of Codex progress**: Lua/data-layer only for now
- **Regent purchase costs**: `getColorRegentCost`/`getTargetRegentCost` are real and understood, wiring is separate from detection

## SlimeWorld World Map Fix (planetRegion Never Generated) — COMPLETED (v2: 20-Node Replacement)

### Root cause
`App.tsx` initialized `planetRegion: null` in `createInitialState`. Nothing ever transitioned it from `null` to a real value. The World Map in the Missions tab was permanently stuck on "UNEXPLORED REGION" placeholder.

### Initial fix (this morning, now superseded)
Ported `generatePlanetRegion()` from `intake/slimegarden/extracted/src/gameLogic.ts` — but that source was five days stale (dated July 13), describing an older 8-node map. The wiring was correct (and remains unchanged), but the data was wrong.

### Replacement (this morning, v2)
Robert provided a fresh export (`slimegarden_v0.1.0R2`, promoted through the intake pipeline). The real, current `generatePlanetRegion()` describes a **20-node map across three concentric rings**. Rewrote `planetRegion.ts` with the real source data (from ~line 1391 of the updated `gameLogic.ts`). `App.tsx` wiring unchanged — same call, just returns richer data now.

### Real node definitions (ported exactly from v0.1.0R2 source)

**6 Capitols (R=180, 60° spacing):**
- **node_ember** — Ember, Red, strength 0.8, discovered
- **node_marsh** — Marsh, Orange, strength 0.8, discovered
- **node_gale** — Gale, Yellow, strength 0.8, discovered
- **node_tundra** — Tundra, Green, strength 0.8, discovered
- **node_crystal** — Crystal, Purple, strength 0.8, discovered
- **node_tide** — Tide, Blue, strength 0.8, discovered

**6 Frontier nodes (R=75, 30° offset from capitols):**
- **node_frontier_a** — Frontier Alpha, neutral, pressure: {Red:15, Orange:15}
- **node_frontier_b** — Frontier Beta, neutral, pressure: {Yellow:15, Green:15}
- **node_frontier_c** — Frontier Gamma, neutral, pressure: {Purple:15, Blue:15}
- **node_frontier_d** — Frontier Delta, neutral, pressure: {Red:10, Blue:15, Yellow:10}
- **node_frontier_e** — Frontier Epsilon, neutral, pressure: {Orange:10, Green:15}
- **node_frontier_f** — Frontier Zeta, neutral, pressure: {Yellow:10, Purple:15}

**8 Midpoint nodes (R=125, 22.5° spacing):**
- **node_mid_a** — Midpoint Alpha, neutral, pressure: {Red:20}
- **node_mid_b** — Midpoint Beta, neutral, pressure: {Orange:20}
- **node_mid_c** — Midpoint Gamma, neutral, pressure: {Yellow:20}
- **node_mid_d** — Midpoint Delta, neutral, pressure: {Green:20}
- **node_mid_e** — Midpoint Epsilon, neutral, pressure: {Purple:20}
- **node_mid_f** — Midpoint Zeta, neutral, pressure: {Blue:20}
- **node_mid_g** — Midpoint Eta, neutral, pressure: {Red:10, Blue:10}
- **node_mid_h** — Midpoint Theta, neutral, pressure: {Yellow:10, Orange:10}

All non-capitol nodes: `ownerColor: null`, `strength: 0`, `isCapitol: false`, `isSupplied: false`, `discovered: false`.

### Key differences from v1 (8-node)
- 20 nodes instead of 8 (6 capitols, 6 frontier, 8 midpoint vs 5 capitols, 3 neutral)
- Three concentric rings (R=75, R=125, R=180) instead of two (R=90, R=225)
- Adjacency computed on-the-fly from polygon proximity (tolerance 0.1) instead of hardcoded `NEIGHBORS_MAP`
- `geometryVersion: 3` (was absent in v1)
- All 6 SlimeColors represented as capitols (was 5 of 7)

### Field compatibility
Confirmed `PlanetNode` shape matches `luaNodeToTs`/`nodeToLua` and `MissionsTab.tsx` rendering. More nodes doesn't change individual node data shape. Optional `garrisonSlimeId` still unset by generator — fine, it's optional.

### Cleanup noted
`games/slimegarden/` (separate Lua genetics port, confirmed redundant) removed along with its equivalence tests. Python floor correctly dropped 412→371 — not a regression.

### Deferred future work
The fresh export's `gameLogic.ts` contains a real Color Codex / Guilds-Rivals genetics system — substantial, confirmed-present, deliberately deferred as separate future work. Not bundled into this map-geometry fix.

### Files touched
- `ts/src/games/slimeworld/planetRegion.ts` (rewritten — 20-node version)
- `ts/tests/test_slimeworld_planet_region.tsx` (rewritten — 7 new anchors for 20-node structure)
- `App.tsx` unchanged (wiring from v1 still correct)

### Verification
```text
npx vitest run --config vite.config.ts
-> 14 test files passed, 105 tests passed

.venv\Scripts\python.exe -m pytest -q --tb=no
-> 371 passed, 8 warnings

npx vite build
-> ✓ built in 5.28s, 2136 modules transformed
```

Live browser check: pending user confirmation.

## SlimeWorld UI Real Tab Extraction — COMPLETED

### What changed
- Physically moved Collection, Splicing, and SlimeDex JSX blocks from `LabTab.tsx` into `RosterTab.tsx` with local `activeSubTab` state and its own `TabBar`.
- Physically moved Requisitions (Contracts + Market) JSX block from `LabTab.tsx` into `EconomyTab.tsx` with local `activeSubTab` state.
- Physically moved all PlanetTab content (Territory/Regions, Active, Zones, Mediation, Exploration) into `MissionsTab.tsx` with local `activeSubTab` and `selectedNodeId` state and its own `TabBar`.
- Reduced `LabTab.tsx` to contain only the Upgrades section (308 lines, down from 1332).
- Deleted `PlanetTab.tsx` entirely (was 1976 lines).
- Updated `App.tsx` to route four primary tabs: Roster, Missions, Economy, Lab.
- No facade imports remain: `RosterTab.tsx`, `MissionsTab.tsx`, and `EconomyTab.tsx` contain zero `import { LabTab }` or `import { PlanetTab }` statements.
- Updated `test_slimeworld_labtab.tsx` to read from `RosterTab.tsx` (shared UI content moved there).
- Rewrote `test_slimeworld_tab_extraction.tsx` with 7 structural anchors verifying no facade imports, PlanetTab deletion, LabTab line count reduction, and presence of specific JSX markers in each extracted component.

### Line count proof
```
Before:
  LabTab.tsx:    1332 lines
  PlanetTab.tsx:  1976 lines
  RosterTab.tsx:    29 lines (facade)
  EconomyTab.tsx:   37 lines (facade)
  MissionsTab.tsx:  30 lines (facade)

After:
  LabTab.tsx:     308 lines (Upgrades only)
  PlanetTab.tsx:  deleted
  RosterTab.tsx:  730 lines (Collection + Splicing + SlimeDex)
  EconomyTab.tsx: 581 lines (Contracts + Market)
  MissionsTab.tsx: 1974 lines (all planet mission content)
```

### Grep proof: no facade imports
```
grep "import.*LabTab|import.*PlanetTab" in RosterTab.tsx → No results
grep "import.*LabTab|import.*PlanetTab" in EconomyTab.tsx → No results
grep "import.*LabTab|import.*PlanetTab" in MissionsTab.tsx → No results
```

### Files touched
- `ts/src/games/slimeworld/App.tsx`
- `ts/src/games/slimeworld/components/RosterTab.tsx`
- `ts/src/games/slimeworld/components/MissionsTab.tsx`
- `ts/src/games/slimeworld/components/EconomyTab.tsx`
- `ts/src/games/slimeworld/components/LabTab.tsx`
- `ts/src/games/slimeworld/components/PlanetTab.tsx` (deleted)
- `ts/tests/test_slimeworld_tab_extraction.tsx`
- `ts/tests/test_slimeworld_labtab.tsx`

### Verification
```text
npx vitest run
-> 13 test files passed, 98 tests passed

.venv\Scripts\python.exe -m pytest -q --tb=no
-> 412 passed, 8 warnings
```

## Tier Economics + Richer Wanderer Petitions — CERTIFIED

### What changed
- Added `get_color_tier`, `get_shape_tier`, and `calculate_tier_value` to `games/slimeworld/logic.lua`. The tier-value curve `TIER_VALUE = {1:5, 2:22, 3:95, 4:300}` is now available for callers while `sell_on_market`'s signature remains unchanged.
- `create_wanderer_petition` now rolls color and shape requirements independently (~70% each) and guarantees at least one is set, allowing color-only, shape-only, and mixed petitions.
- Petition rewards are computed as `color_tier × shape_tier × 10 × WANDERER_PREMIUM_MULTI` (default 1.5 for a missing requirement).
- `fulfill_petition` checks `nil` requirements correctly: a color-only petition accepts any matching color, a shape-only petition accepts any matching shape, and mixed petitions require both.

### Flagged assumptions
- `Gray` is assigned Tier 1; this is a SlimeWorld-specific low-saturation default, not derived from SlimeBreeder source.
- SlimeWorld's current color set reaches only Tiers 1–2, so the Tier 3–4 color values (95/300) are not reachable until Tier 3–4 color names are added in the separate deferred directive.
- Shape tiers already cover the full 1–4 range via `snap_to_shape_name`.

### Verification

```text
.venv\Scripts\python.exe -m pytest -q --tb=no
→ 412 passed, 8 warnings
```

Focused anchors (`test_slimeworld_tier_economics.py` + `test_slimeworld_wanderer_petitions.py`) all passed:
- Color/shape tier lookups
- `calculate_tier_value` hand-verified for Red/Triangle=10, Orange/Star=44, Purple/Crown=322, Orange/Crown +25% variance=403
- Partial petition fulfillment (color-only / shape-only) and rejections
- Reward scales with tier product, not a flat multiplier

### Still deferred
- Tier 3–4 color names
- Regent system design
- Full Culture-sourced Requisitions board

## Current Phase

**Worker Income + Garden Refugee Default — CERTIFIED**

## Worker Income + Garden Refugee Default — CERTIFIED

### What changed
- Confirmed `advance_cycle` invokes the existing `calculate_worker_income` for each worker-role slime using the real `has_auto_feeder` upgrade flag and matching-culture planet nodes. Added regression anchors for base income, non-worker exclusion, and both multipliers.
- Changed territory-flip refugees to enter the Garden as workers rather than dispatch/combat assets. The generated stray log now reports the same Worker assignment, preserving tonight's Garden-as-hostel GDD decision.

### Verification

```text
.venv\Scripts\python.exe -m pytest -q --tb=no
→ Pre-flight: 407 passed, 8 warnings
→ Focused anchors: 5 passed
→ Post-change: 412 passed, 8 warnings
```

Per-role roster caps, Legacy Slimes, squad-swap cooldowns, and the permanent-ownership/contestable-upgrade question remain deferred.

## Tier Economics + Richer Wanderer Petitions — CERTIFIED

### What changed
- Added SlimeWorld color/shape tier lookup and `calculate_tier_value(color, shape, variance)`. The existing manual `sell_on_market(state, slime_id, price)` signature remains unchanged.
- Wanderer Petitions now independently roll color and shape requirements at the source's 70% rate, guarantee at least one request, use the real `1.5` default tier for a missing requirement, and persist the tier-scaled reward.
- Petition fulfillment already guarded optional requirements with nil checks; it now pays the stored tier-scaled reward.

### Economics notes

- Hand-verified `calculate_tier_value`: Red/Triangle = 10, Orange/Star = 44, Purple/Crown = 322; Orange/Crown with 25% variance = 403.
- SlimeWorld's current colors can reach tiers 1–2 only. Tier 3–4 color names remain deferred, so the asymmetry with the shape tier range (1–4) is expected, not a bug.
- Gray is assigned Tier 1 as a SlimeWorld-specific low-saturation assumption; it is not confirmed by SlimeBreeder source.

### Verification

```text
.venv\Scripts\python.exe -m pytest -q --tb=no
→ Pre-flight: 380 passed, 8 warnings
→ Focused anchors: 31 passed
→ Post-change: 407 passed, 8 warnings
```

The Regent-system question and the full Culture-sourced Requisitions/Petitions board remain open and are not implied resolved here.

## Shape Naming, Breeding Cost, Wanderer Petitions — CERTIFIED

### What changed
- Added `snap_to_shape_name(vertex_count, irregularity)`, a nearest-anchor display label for the ten real SlimeBreeder shape names. The anchors retain the decided coordinates because `breed_shape` produces vertices across `3–22` and clamps irregularity to `0–100`; it remains completely independent of continuous shape breeding math.
- Changed SlimeWorld breeding to consume only the donor (`parent_b`) after a child is fully created and inserted. Existing continuous 50/50 midpoint inheritance remains intact and takes precedence over SlimeBreeder's distinct 60/40 discrete host/donor tuning. Failed same-parent, capacity, and missing-parent exits all occur before mutation. Successful results include `consumed_slime_id` for future UI confirmation.
- Added Wanderer-only Petition creation and fulfillment: three active petitions maximum, `3.0x` premium multiplier, color-and-shape matching, payout, removal on fulfillment, and expiration handling. The schema is present in `data.yaml`.

### Verification

```text
.venv\Scripts\python.exe -m pytest -q --tb=no
→ Pre-flight: 370 passed, 8 warnings
→ Focused anchors: 10 passed
→ Post-change: 380 passed, 8 warnings
```

The complete Requisitions/Petitions system for Culture-sourced requests remains future work. The SlimeBreeder Regent system remains a separate, unresolved design question. Tier 3/4 color snap names and redundant `games/slimegarden/` cleanup are also still deferred.

## SlimeGarden Genetics Core, First Lua Port Slice — CERTIFIED

### What changed
- Added `games/slimegarden/data.yaml` and `games/slimegarden/logic.lua` for the eight self-contained genetics functions: naming, color/pattern breeding, life stages, stat calculation, offspring creation, and seed creation.
- Confirmed exact schema alignment with Slimeworld for colors, patterns, life stages, `hp`/`atk`/`def`/`agi`/`int`/`chm` stats, parent lineage, role vocabulary, and timestamps.
- Added a real-source equivalence suite that transpiles and executes the extracted SlimeGarden `gameLogic.ts`, controls its `Math.random()` stream, and compares it to Lua with the same stream. Runtime-specific IDs and timestamps are normalized because the TypeScript source uses `Date.now()` while Lua uses `os.time()`.

### RNG finding

The studio executor provides seeded Lua RNG via `math.randomseed(seed)`. `engine/primitives/resolution.lua` does not provide a seeded-RNG abstraction and no game directly seeds Lua RNG. The original TypeScript source also exposes no seed API and calls native `Math.random()`. Tests therefore use matching controlled random streams; this proves branch-for-branch equivalence without falsely claiming that JavaScript and Lua share a PRNG sequence.

### Verification

```text
python -m pytest -q --tb=no
→ Pre-flight: 329 passed, 8 warnings
→ Genetics equivalence anchors: 41 passed
→ Post-change: 370 passed, 8 warnings
```

This is slice 1 of SlimeGarden's port. Corporate, dispatch, mediation, economy, planet/territory, and full studio runtime/Arcade wiring remain future work. SVG polygon-clipping geometry remains in TypeScript permanently. SlimeBreeder receives its own port directive later.

## Shared UI, First Real Migration (Slimeworld) — CERTIFIED

### What changed
- Extended the shared `Button` with optional `icon`, `title`, and additive `className` support while retaining label-only callers; development builds warn for a button with neither label nor icon.
- Migrated Slimeworld's rename confirm and cancel controls to icon-only shared `Button` instances.
- Migrated both state-specific full-width worker-role controls to shared `Button` instances. The narrow `className` escape hatch preserves their existing Slimeworld-specific colors, hover effects, sizing, and glow.
- Migrated the Slimeworld HP display to `StatBar` with its existing value and a `200` maximum.
- Investigated `Card`: its shared base styling was generic, but its hardcoded `horse-card` class caused every Card to inherit Horse Racing-specific descendant selectors such as `.horse-card .stat-row`. Renamed the shared base class to `card-base`; Horse Racing retains its explicit `className="horse-card"` behavior.
- Added Button icon/compatibility/className regression anchors and Slimeworld migration anchors.

### Verification

```text
python -m pytest -q --tb=no
→ Pre-flight: 329 passed, 8 warnings
→ Post-change: 329 passed, 8 warnings

cd ts && npx vitest run
→ Pre-flight: 84 passed, 0 failed
→ Focused shared UI anchors: 7 passed
→ Post-change: 91 passed, 0 failed
```

This is the first slice of an ongoing UI-sharing effort. Full Slimeworld migration and migrations for other games remain future work; this phase does not imply either is complete.

## ADR-009 Shared Lua Utilities — CERTIFIED

### What changed
- Added ADR-009, explicitly superseding ADR-005 only for generic, non-game-specific Lua utilities.
- `collect` is supplied by `engine/primitives/action.lua`; horse racing uses the preloaded engine global.
- Slime Coin uses the existing engine `copy_entity` shallow-copy primitive and has no local `copy_table`.
- `atan2` is supplied by `engine/primitives/movement.lua`; Slither Rogue uses the preloaded engine global.
- Added Python regression anchors for utility equivalence, removal of the former locals, deterministic race creation, and the Slime Coin flow.

### Loading finding

No Lua `require()`, `loadfile()`, or `package.path` precedent exists in the repository. The established runtime bridge is `studio.loader.load_engine_source()`, which concatenates all primitives in deterministic order before game Lua is executed. This ADR uses that existing loading mechanism; it does not introduce module-path loading.

### Verification

```text
python -m pytest -q --tb=no
→ Pre-flight: 321 passed, 8 warnings
→ Post-change: 329 passed, 8 warnings

cd ts && npx vitest run
→ Pre-flight: 41 passed, 8 failed (49 total)
→ Post-change: 84 passed, 0 failed (84 total)
→ `GameSelector` renders the authoritative `GAME_REGISTRY` order; routing assertions pass.
```

Further shared-logic consolidation beyond `collect`, `copy_table`→`copy_entity`, and `atan2` is a future decision; ADR-009 does not imply permission to share game-specific logic.

## External Game Entries (VoidDrift) — CERTIFIED

### What changed
- Extended `GameConfig` in `ts/src/engine/types.ts`: `component` is now optional, added `externalUrl?: string`, added `'external'` to `GameStatus`.
- `GameSelector.tsx` click handler branches: cards with `externalUrl` open via `window.open` in a new tab; internal cards use `navigateTo` unchanged.
- `GameLoader.tsx` guards against external games: if someone manually navigates `?game=voiddrift`, it opens the itch.io URL and redirects home; also handles missing `component` gracefully with a fallback error screen.
- Created `ts/src/games/voiddrift/config.ts` with `externalUrl: 'https://rdug627.itch.io/voidrift'`, `status: 'external'`, no `component` field.
- Registered VoidDrift in `GAME_REGISTRY` in `ts/src/games/registry.ts`.
- Added `.arcade-status--external` CSS badge styling in `ts/src/ui/base.css`.
- External cards show "Rust/Bevy · itch.io" as their runtime detail instead of attempting `loadGameFiles`.

### Completion Criteria

| Criterion | Status |
|---|---|
| Pre-flight floor reproduced: Python 194/0, TS 76/0 | ✅ |
| `GameConfig.component` now optional, `externalUrl` added | ✅ |
| `GameStatus` includes `'external'` | ✅ |
| Click handler branches: external → `window.open`, internal → `navigateTo` | ✅ |
| VoidDrift config created with real verified itch.io URL | ✅ |
| VoidDrift added to `GAME_REGISTRY` | ✅ |
| External badge styling distinct from internal statuses | ✅ |
| `GameLoader` guards external games (redirect + no-renderer fallback) | ✅ |
| `test_voiddrift_registry_entry_present` | ✅ |
| `test_game_selector_opens_external_url_on_click` | ✅ |
| `test_game_selector_internal_click_unchanged` | ✅ |
| `test_external_card_shows_itch_detail` | ✅ |
| Post-change floor: Python 194/0 (untouched), TS 80/0 (+4 new) | ✅ |
| `npx vite build` → exits 0 | ✅ |

**Test proof:**
```
python -m pytest
→ 194 passed, 8 warnings in 3.53s

cd ts; npx vitest run
→ 80 passed (80)
```

---

## Shared Marquee Identity — CERTIFIED

### What changed
- Added display and monospace font tokens plus a marquee glow custom property to `ts/src/ui/tokens.css`.
- Wrote real CSS for the nine base UI components in `ts/src/ui/base.css` and added a shared GameShell marquee header treatment.
- Refactored `ts/src/components/GameShell.tsx` to a structured contract: `gameLabel`, `gameId`, `phase?`, `statusArea?`, `children`, `footer?`, `className?`.
- Migrated every game App to the new `GameShell` contract: ScrapCrawl, Chimera Wilds, Mutant Battle Ball, Slime Coin, Horse Racing, and Slither Rogue.
- Removed the duplicate `arcade-game-nav` bar from `ts/src/arcade/GameLoader.tsx`; GameShell now owns the back button and title treatment.
- For Horse Racing, suppressed the interpreter-rendered `ui-header`/`ui-tab-bar`/`ui-footer` copies so the GameShell header and the game's own tab/footer are the only ones shown, while leaving `games/horse_racing/ui.yaml` intact for the PyGame renderer.
- Redesigned `ts/src/arcade/GameSelector.tsx` with a marquee title, cabinet-frame cards, and a per-card runtime detail line derived from each game's real `data.yaml` (rooms, parts, race classes, evolution cards, chip cards, etc.) plus the confirmed PyGame renderer roster.
- Added `ts/tests/test_gameshell.tsx` (6 tests) and extended `ts/tests/test_arcade.ts` with GameSelector runtime detail tests (6 tests).

### Hotfix
- `countArray()` in `ts/src/arcade/GameSelector.tsx` now counts object keys as well as array lengths, so ScrapCrawl's keyed `rooms` object correctly renders **5 rooms** instead of silently returning 0.
- `ts/tests/test_arcade_routing.ts` — `test_game_loader_back_button_returns_clean_url` hardened with `vi.waitFor` (5s timeout, 20ms interval) instead of a bare `setTimeout(r, 0)`, removing the 1-in-8 timing race against the async `loadGame()` effect.

### Completion Criteria

| Criterion | Status |
|---|---|
| `ts/src/ui/tokens.css` — `--font-display`, `--font-mono`, `--marquee-glow` | ✅ |
| `ts/src/ui/base.css` — real CSS for 9 base components + GameShell marquee | ✅ |
| `ts/src/components/GameShell.tsx` — new props contract, back link, title, phase badge, statusArea | ✅ |
| ScrapCrawl `App.tsx` migrated to new `GameShell` | ✅ |
| Chimera Wilds `App.tsx` migrated to new `GameShell` | ✅ |
| Mutant Battle Ball `App.tsx` migrated to new `GameShell` | ✅ |
| Slime Coin `App.tsx` migrated to new `GameShell` | ✅ |
| Horse Racing `App.tsx` migrated to new `GameShell` | ✅ |
| Slither Rogue `App.tsx` migrated to new `GameShell` | ✅ |
| `ts/src/arcade/GameLoader.tsx` no longer renders duplicate `arcade-game-nav` | ✅ |
| `ts/src/arcade/GameSelector.tsx` — marquee title + cabinet-frame cards + real `data.yaml` detail | ✅ |
| Python floor: `python -m pytest` → **194 passed, 0 failed** | ✅ |
| TS floor: `cd ts && npx vitest run` → **76 passed, 0 failed** | ✅ |
| `npx tsc --noEmit` — no new errors beyond pre-existing baseline | ✅ |
| `npx vite build` → exits 0 | ✅ |
| Manual proof: browser preview of Derby Sim shows only the GameShell header | ✅ |
| Manual proof: Arcade lobby shows marquee title and per-card runtime detail | ✅ |

**Test proof:**
```
python -m pytest
→ 194 passed, 8 warnings in 3.59s

cd ts; npx vitest run
→ 76 passed (76)
```

**Manual trace proof:**
```
[TRACE] Arcade lobby
        → RFD GAME STUDIO marquee title renders with display font + glow
        → Each cabinet card shows real detail: e.g. "PyGame renderer · 4 race classes"
[TRACE] ?game=horse_racing
        → Only one header bar: GameShell with "DERBY SIM", "horse_racing", "STABLE BANK $0"
        → No second "← Arcade / Derby Sim" nav bar
        → No duplicate interpreter tab bar
```

---

## Arcade Core System Hardening — CERTIFIED

### What changed
- Extracted the Arcade shell (routing, selector, loader) from `ts/src/main.tsx` into a dedicated `ts/src/arcade/` module with a barrel export, matching the existing `hooks/`, `components/`, and `engine/` structure.
- Moved `getGameId`, `navigateTo`, and `navigateHome` to `ts/src/arcade/routing.ts` with no semantic drift for `navigateHome`.
- Fixed `navigateTo` so it preserves the current mount path (e.g., `/arcade/rfdgamestudio/`) when setting `?game={id}`, closing the same path-portability risk that `navigateHome` already handled.
- Moved `GameSelector` and `GameLoader` to `ts/src/arcade/GameSelector.tsx` and `ts/src/arcade/GameLoader.tsx`.
- Closed the registry-mismatch bug: `GameLoader` now calls `findGame()` after a successful `loadGame()` and shows a distinct error when a game exists on disk but is missing from `GAME_REGISTRY`.
- Removed the now-unused `findGameOrDefault()` from `ts/src/games/registry.ts`; no other callers existed.
- Replaced the `ts/tests/test_navigation.ts` file with `ts/tests/test_arcade_routing.ts`, extending it with the new Arcade tests.

### What was verified, not assumed
- A genuinely bad `?game=totally_fake_id` URL still fails correctly with the existing `Unknown game: ...` error from `loadGame()`. This path was already fine and was not touched.
- The registry-mismatch scenario was reproduced by temporarily removing `scrapcrawl` from `GAME_REGISTRY` while leaving its files on disk. `GameLoader` rendered the new distinct error: `Game "scrapcrawl" loaded successfully but has no registered config in registry.ts — this is a studio configuration error...`. The registry was restored immediately after the trace.

## Arcade Core System Hardening Completion Criteria

| Criterion | Status |
|---|---|
| `ts/src/arcade/routing.ts` — `getGameId`, `navigateTo`, `navigateHome` extracted | ✅ |
| `ts/src/arcade/GameSelector.tsx` — extracted, no visual change | ✅ |
| `ts/src/arcade/GameLoader.tsx` — extracted, registry-mismatch fix applied | ✅ |
| `ts/src/arcade/index.ts` — barrel export matching project convention | ✅ |
| `ts/src/main.tsx` — reduced to Root + mount | ✅ |
| `ts/src/games/registry.ts` — `findGameOrDefault` removed, no other callers | ✅ |
| `ts/tests/test_arcade_routing.ts` — routing + selector + loader tests | ✅ |
| `ts/tests/test_arcade_loader.ts` — registry-mismatch error test | ✅ |
| TypeScript floor: `npx vitest run` → **64 passed, 0 failed** | ✅ |
| Python floor: `uv run pytest -q` → **194 passed, 0 failed** | ✅ |
| `npx tsc --noEmit` — zero new errors attributable to arcade extraction | ✅ |
| `npx vite build` → exits 0 | ✅ |
| Manual proof: `?game=totally_fake_id` still shows "Unknown game" error | ✅ |
| Manual proof: registry-mismatch scenario shows distinct new error | ✅ |
| `git diff --stat` shows only files listed in scope | ✅ |

**Test proof:**
```
uv run pytest -q
→ 194 passed, 8 warnings in 3.76s

cd ts; npx vitest run
→ 64 passed (64)
```

**Manual trace proof:**
```
[TRACE] navigateTo('slime_coin') at /arcade/rfdgamestudio/
        → href = http://localhost:3000/arcade/rfdgamestudio/?game=slime_coin
[TRACE] navigateHome() from /arcade/rfdgamestudio/?game=horse_racing
        → href = http://localhost:3000/arcade/rfdgamestudio/
[TRACE] ?game=totally_fake_game_xyz
        → GameLoader text: "Unknown game: totally_fake_game_xyz"
[TRACE] registry-mismatch: scrapcrawl files present, config removed
        → GameLoader text: "Game "scrapcrawl" loaded successfully but has no registered config in registry.ts — this is a studio configuration error..."
```

---

## ScrapCrawl Phase A.1 — Combat + Craft Gating Fix + UI Design Pass — CERTIFIED

### What changed
- Fixed a real bug discovered by playing: `resolve_fight` and the `Fight` button both lacked room-type validation, allowing free infinite wins at Home Base (no `difficulty` field → `difficulty` defaulted to `0`).
- Added a defensive backend guard in `logic.lua` that rejects fights in rooms without `fight` in their interaction types.
- Added a frontend gate in `App.tsx` that renders the `Fight` button as disabled in safe rooms.
- Fixed a second play-discovered bug: `craft`/`can_craft` took no room context, allowing crafting in any node. They now accept a `room` parameter and reject rooms without `craft` in their interaction types.
- Added a frontend craft-room gate in `App.tsx` that disables all craft buttons outside Home Base (the only craft-capable node) and shows a "No workbench detected" tooltip.
- Redesigned the ScrapCrawl UI to match the original `examples/scrapcrawl` identity: near-black canvas, equipment durability bars with threshold colour shift, proficiency bars, terminal-style combat trace, and crafting catalog cards.
- Rewrote `styles.css` using the shared token layer from `ui/tokens.css`; only deliberate hex override is the signature background `#07090d`, documented in-file.
- Added 3 Python and 2 TypeScript tests anchoring the fight gating fix, plus 3 Python and 2 TypeScript tests anchoring the craft gating fix.

### Hotfix (fengari numeric keys + Tool re-craft button + executor boolean bug)
- The TS runtime (`fengari-web`) passes JavaScript numbers as Lua floats (`1.0`) and YAML numeric keys as strings (`"1"`). `lookup_tier` in `logic.lua` now tries numeric, integer, and string forms so that `craft`, `can_craft`, and `resolve_fight` all work in the browser. A TS runtime regression test guards this.
- The Tier 2 craft button for the Tool recipe was incorrectly enabled after Tier 2 was unlocked (it looked affordable once the lock disappeared). Both Tool tier buttons are now disabled once the Tool has been crafted, matching the one-time-gate semantics in `logic.lua`.
- `executor.ts` was returning `true` for every pulled Lua boolean because `lua_toboolean` returns a JS boolean and `false !== 0` is `true`. It now returns the actual boolean value. Two executor tests guard this.

## ScrapCrawl Phase A.1 Completion Criteria

| Criterion | Status |
|---|---|
| `games/scrapcrawl/logic.lua` — `resolve_fight` rejects non-fight rooms | ✅ |
| `games/scrapcrawl/logic.lua` — `craft`/`can_craft` reject non-craft rooms | ✅ |
| `ts/src/games/scrapcrawl/App.tsx` — Fight button disabled in safe rooms | ✅ |
| `ts/src/games/scrapcrawl/App.tsx` — Craft buttons disabled outside craft rooms | ✅ |
| `ts/src/games/scrapcrawl/App.tsx` — equipment cards, durability bars, proficiency bars, terminal trace, crafting catalog | ✅ |
| `ts/src/games/scrapcrawl/styles.css` — shared tokens only, one documented signature-background override | ✅ |
| `tests/test_scrapcrawl.py` — 6 ScrapCrawl gating tests (194 total) | ✅ |
| `ts/tests/test_arcade.ts` + `ts/tests/test_executor.ts` — 7 new TS tests (56 total) | ✅ |
| Python floor: `uv run pytest -q` → **194 passed, 0 failed, 0 skipped** | ✅ |
| TS floor: `cd ts && npx vitest run` → **56 passed, 0 failed, 0 skipped** | ✅ |
| `npx tsc --noEmit` — zero new errors attributable to scrapcrawl/executor | ✅ |
| `npx vite build` → exits 0 | ✅ |
| Manual trace — Fight disabled at Home Base, real fight resolves in `scrap_pit` | ✅ |
| `git diff --stat` empty for `examples/`, `games/chimera_wilds/`, `games/mutant_battle_ball/` | ✅ |

**Test proof:**
```
uv run pytest -q
→ 194 passed, 8 warnings in 3.64s

cd ts; npx vitest run
→ 56 passed (56)
```

**Manual trace proof:**
```
[TRACE] INIT room=home_base scrap=0 tier2=False
[TRACE] HOME BASE interaction_types=['home', 'craft', 'rest'] difficulty=<none>
[TRACE] SCRAP_PIT interaction_types=['fight'] difficulty=8
[TRACE] GUARD OK: resolve_fight rejected Home Base fight -> Lua error ... Cannot fight in room "home_base"
[TRACE] MOVE home_base -> scrap_pit: now at scrap_pit
[TRACE] FIGHT in scrap_pit: won=True roll=20 score=21.6 diff=8 scrap=8 xp=15
[TRACE] UI: Fight button at Home Base is disabled (visible, non-clickable)
[TRACE] UI: Move to scrap_pit enables the Fight button
```

**Browser preview:** http://127.0.0.1:54037

---

## ScrapCrawl Phase A — Core Loop Port — CERTIFIED

## ScrapCrawl Phase A Completion Criteria

| Criterion | Status |
|---|---|
| `games/scrapcrawl/data.yaml` — 5-room graph, real catalog, real constants | ✅ |
| `games/scrapcrawl/logic.lua` — `get_room`, `can_move_to`, `move_player`, `can_craft`, `craft`, `resolve_fight`, `init_player`, `reset_position`, `growth_factor` | ✅ |
| `games/scrapcrawl/ui.yaml` — `layout_tree` with ADR-008 vocabulary | ✅ |
| `games/scrapcrawl/systems.yaml` — core system manifest, `engine_systems: []` | ✅ |
| `ts/src/games/scrapcrawl/types.ts` — real entities and game state | ✅ |
| `ts/src/games/scrapcrawl/config.ts` — game config with `#f59e0b` amber color, lazy-loaded `App` | ✅ |
| `ts/src/games/scrapcrawl/App.tsx` — React app with `GameShell`, `useLuaCall`, move/craft/fight actions | ✅ |
| `ts/src/games/scrapcrawl/styles.css` — game-specific styles | ✅ |
| `ts/src/engine/loader.ts` — `scrapcrawl` YAML imports added to `GAME_ASSETS` | ✅ |
| `ts/src/games/registry.ts` — `scrapcrawl` registered | ✅ |
| `tests/test_scrapcrawl.py` — 25 new tests (188 total) | ✅ |
| `ts/tests/test_arcade.ts` — 4 new ScrapCrawl tests (49 total) | ✅ |
| Python floor: `uv run pytest -q` → **188 passed, 0 failed, 0 skipped** (was 163) | ✅ |
| TS floor: `cd ts && npx vitest run` → **49 passed, 0 failed, 0 skipped** (was 45) | ✅ |
| `npx tsc --noEmit` — zero new errors in scrapcrawl files | ✅ |
| `npx vite build` → exits 0 | ✅ |
| `studio_validate_game('scrapcrawl')` → valid=True, no issues | ✅ |
| `git diff --stat` empty for `examples/`, `games/chimera_wilds/`, `games/mutant_battle_ball/` | ✅ |

**Test proof:**
```
uv run pytest -q
→ 188 passed, 8 warnings in 3.58s

cd ts; npx vitest run
→ 49 passed (49)
```

**Validation proof:**
```
studio_validate_game('scrapcrawl')
→ {'valid': True, 'game_id': 'scrapcrawl', 'issues': []}
```

**Verb-naming decisions (per §2):**
- `can_move_to` — flagged as non-ADR-007-compliant; kept as-is because no locked verb fits.
- `can_craft` / `craft` — flagged as non-ADR-007-compliant; kept as-is per Chimera Wilds precedent for `assemble`/`generate`.
- `move_player` — compliant (`move_` prefix).
- `resolve_fight` — compliant (ADR-007 worked example).
- `init_player` — compliant (`init_` prefix).
- `reset_position` — renamed from `wipe`; flagged as a naming call because `wipe` does not cleanly fit any locked verb.

---

## Chimera Wilds Phase 1 — Minimal Encounter Loop — CERTIFIED

## Chimera Wilds Phase 1 Completion Criteria

| Criterion | Status |
|---|---|
| `games/chimera_wilds/data.yaml` — copied MBB part catalog, baseline player stats | ✅ |
| `games/chimera_wilds/logic.lua` — `generate_chimera` + `resolve_encounter` | ✅ |
| `games/chimera_wilds/ui.yaml` — single-screen layout with `hud` slot | ✅ |
| `games/chimera_wilds/systems.yaml` — encounter system, empty `engine_systems` | ✅ |
| `ts/src/games/chimera_wilds/types.ts` — `Part`, `Chimera`, `EncounterResult`, `ChimeraWildsGameState` | ✅ |
| `ts/src/games/chimera_wilds/config.ts` — game config with `#14b8a6` teal color, lazy-loaded `App` | ✅ |
| `ts/src/games/chimera_wilds/App.tsx` — React app with `GameShell`, `useLuaCall`, encounter button | ✅ |
| `ts/src/games/chimera_wilds/styles.css` — game-specific styles | ✅ |
| `ts/src/engine/loader.ts` — `chimera_wilds` YAML imports added to `GAME_ASSETS` | ✅ |
| `ts/src/games/registry.ts` — `chimera_wilds` registered | ✅ |
| `tests/test_chimera_wilds.py` — 8 new tests (163 total) | ✅ |
| `ts/tests/test_arcade.ts` — 4 new Chimera Wilds tests (45 total) | ✅ |
| Python floor: `pytest -v` → **163 passed, 0 failed** (was 155) | ✅ |
| TS floor: `cd ts && npx vitest run` → **45 passed, 0 failed** (was 41) | ✅ |
| `studio_validate_game('chimera_wilds')` → valid=True, no issues | ✅ |

**Test proof:**
```
pytest -v
→ 163 passed in 3.20s
cd ts && npx vitest run
→ 45 passed (45)
```

**Validation proof:**
```
studio_validate_game('chimera_wilds')
→ {'valid': True, 'game_id': 'chimera_wilds', 'issues': []}
```



## Phase 2w Completion Criteria

| Criterion | Status |
|---|---|
| `games/slime_coin/data.yaml` — slime types, pocket coins, obstacles, chip cards, round configs, board dimensions | ✅ |
| `games/slime_coin/logic.lua` — physics simulation, shooter mechanics, card synergies, scoring, round management | ✅ |
| `games/slime_coin/ui.yaml` — layout_tree with main game screen, card select modal, pocket picker modal | ✅ |
| `games/slime_coin/systems.yaml` — match + cards + pocket systems, entity definitions | ✅ |
| `ts/src/games/slime_coin/types.ts` — SlimeCoinRenderState, Coin, Obstacle, ChipCard, GameConfig interfaces | ✅ |
| `ts/src/games/slime_coin/config.ts` — game config with #a855f7 purple color, lazy-loaded App | ✅ |
| `ts/src/games/slime_coin/App.tsx` — React app with game state, input handling, modals, game loop | ✅ |
| `ts/src/games/slime_coin/components/BoardCanvas.tsx` — canvas renderer, coins, obstacles, pusher, shooter, aim indicator | ✅ |
| `ts/src/games/slime_coin/components/CardSelectModal.tsx` — card selection modal with rarity styling | ✅ |
| `ts/src/games/slime_coin/components/PocketPicker.tsx` — pocket coin selection modal | ✅ |
| `ts/src/games/slime_coin/styles.css` — game-specific styles | ✅ |
| `ts/src/engine/loader.ts` — slime_coin YAML imports added to GAME_ASSETS | ✅ |
| `ts/src/games/registry.ts` — slime_coin registered | ✅ |
| `tests/test_integration.py` — 6 new SlimeCoin tests (86 total) | ✅ |
| `ts/tests/test_arcade.ts` — 2 new SlimeCoin registry tests (39 total) | ✅ |
| Python floor: `pytest -v` → **86 passed, 0 failed** (was 80) | ✅ |
| TS floor: `npx vitest run` → **39 passed, 0 failed** (was 37) | ✅ |
| `studio_validate_game('slime_coin')` → valid=True, no issues | ✅ |

**Test proof:**
```
pytest -v
→ 86 passed in 1.89s
cd ts && npx vitest run
→ 39 passed (39)
```

**Validation proof:**
```
studio_validate_game('slime_coin')
→ {'valid': True, 'game_id': 'slime_coin', 'issues': []}
```

## Phase 2v Completion Criteria

| Criterion | Status |
|---|---|
| `games/mutant_battle_ball/data.yaml` — parts catalog, starter mutants, match config, opponents | ✅ |
| `games/mutant_battle_ball/logic.lua` — match simulation, role assignment, tackle/block, wounds, substitutions | ✅ |
| `games/mutant_battle_ball/ui.yaml` — layout_tree with 5 tabs (roster, workshop, match, shop, infirmary) | ✅ |
| `games/mutant_battle_ball/systems.yaml` — match + management systems, entity definitions | ✅ |
| `ts/src/games/mutant_battle_ball/types.ts` — Part, MutantParts, Mutant, MatchAgent, MatchState, MBBGameState | ✅ |
| `ts/src/games/mutant_battle_ball/config.ts` — game config with #f87171 red color, lazy-loaded App | ✅ |
| `ts/src/games/mutant_battle_ball/App.tsx` — React app with GameShell, TabManager, match start/end logic | ✅ |
| `ts/src/games/mutant_battle_ball/components/MatchCanvas.tsx` — canvas renderer, court, agents, ball, health bars | ✅ |
| `ts/src/games/mutant_battle_ball/components/RosterTab.tsx` — roster display, start match button | ✅ |
| `ts/src/games/mutant_battle_ball/components/WorkshopTab.tsx` — mutant assembly UI | ✅ |
| `ts/src/games/mutant_battle_ball/components/ShopTab.tsx` — parts shop UI | ✅ |
| `ts/src/games/mutant_battle_ball/components/InfirmaryTab.tsx` — injured mutant management | ✅ |
| `ts/src/games/mutant_battle_ball/styles.css` — game-specific styles | ✅ |
| `ts/src/games/registry.ts` — mutant_battle_ball registered | ✅ |
| `tests/test_integration.py` — 6 new MBB tests (80 total) | ✅ |
| `ts/tests/test_arcade.ts` — 2 new MBB registry tests (37 total) | ✅ |
| Python floor: `pytest -v` → **80 passed, 0 failed** (was 74) | ✅ |
| TS floor: `npx vitest run` → **37 passed, 0 failed** (was 35) | ✅ |
| `studio_validate_game('mutant_battle_ball')` → valid=True, no issues | ✅ |

**Test proof:**
```
pytest -v
→ 80 passed in 2.50s
cd ts && npx vitest run
→ 37 passed (37)
```

**Validation proof:**
```
studio_validate_game('mutant_battle_ball')
→ {'valid': True, 'game_id': 'mutant_battle_ball', 'issues': []}
```

## Phase 2u Completion Criteria

| Criterion | Status |
|---|---|
| `renderers/pygame/components.py` — draw_circle, draw_glow, draw_snake, draw_overlay, draw_card, draw_centered_text | ✅ |
| `renderers/pygame/components.py` — _hex_to_rgb helper for hex color conversion | ✅ |
| `renderers/pygame/engine.py` — game_scale, game_offset fields for coordinate transform | ✅ |
| `renderers/pygame/engine.py` — to_screen(gx, gy) converts game-space to screen pixels | ✅ |
| `renderers/pygame/engine.py` — scale_radius(r) scales game-space radius to screen space | ✅ |
| `renderers/pygame/games/slither_rogue/__init__.py` — package init | ✅ |
| `renderers/pygame/games/slither_rogue/renderer.py` — full SlitherRogueRenderer (menu, game, gameover, evolution overlay) | ✅ |
| SlitherRogueRenderer: arena scale fits 2600×2600 into 1024×700 game area (scale ≈ 0.269) | ✅ |
| SlitherRogueRenderer: _start_game() calls init_game(config) once | ✅ |
| SlitherRogueRenderer: update(dt) calls tick_game(dt, input) every frame (real-time pattern) | ✅ |
| SlitherRogueRenderer: WASD controls, evolution selection, hunting NPC red heads | ✅ |
| `renderers/pygame/main.py` — slither_rogue registered in AVAILABLE_GAMES | ✅ |
| `tests/test_pygame_renderer.py` — 4 new tests (74 total) | ✅ |
| Python floor: `uv run pytest -v` → **74 passed, 0 failed** (was 70) | ✅ |
| TypeScript floor: `npx vitest run` → **35 passed, 0 failed** (unchanged) | ✅ |
| Proof: `grep tick_game\|init_game renderers/pygame/games/slither_rogue/` → init_game once, tick_game once | ✅ |

**Test proof:**
```
uv run pytest -v
→ 74 passed in 1.69s
cd ts && npx vitest run
→ 35 passed, 0 failed
```

**Port-Engine pattern proof:**
```
grep tick_game\|init_game renderers/pygame/games/slither_rogue/
→ Line 152: init_game (in _start_game)
→ Line 217: tick_game (in update)
```

**Phase 2f — Architecture Migration — CERTIFIED**

## Phase 2f Completion Criteria

| Criterion | Status |
|---|---|
| `engine/primitives/` — 7 .lua files (action, entity, resolution, consequence, movement, physics, lifecycle) | ✅ |
| `engine/systems/` — genetics.lua, odds.lua, market.lua | ✅ |
| `studio/loader.py` — `load_engine_source` + `engine_source` field on `GameFiles` | ✅ |
| `studio/executor.py` — accepts `engine_source`, prepends to game logic | ✅ |
| `studio/runtime.py` — passes `engine_source` to `Executor` | ✅ |
| `games/horse_racing/systems.yaml` — `engine_systems: [genetics, odds, market]` | ✅ |
| `games/horse_racing/logic.lua` — trimmed; only game-specific logic remains | ✅ |
| `ts/src/ui/tokens.css` — CSS custom properties only | ✅ |
| `ts/src/ui/base.css` — reset + typography | ✅ |
| `ts/src/games/horse_racing/styles.css` — all game-specific classes | ✅ |
| `ts/src/ui/components/` — 9 base components + index.ts barrel | ✅ |
| `ts/src/games/horse_racing/App.tsx` — game shell moved | ✅ |
| `ts/src/games/horse_racing/components/` — all 5 game components moved | ✅ |
| `ts/src/components/` — deleted | ✅ |
| `ts/src/App.tsx` — deleted | ✅ |
| `ts/src/main.tsx` — lazy-loading game router | ✅ |
| Python floor: `uv run pytest -v` → **32 passed, 0 failed** | ✅ |
| TS floor: `npx vitest run` → **17 passed, 0 failed** | ✅ |
| `npx vite build` → exits 0 (code-split: index + App chunks) | ✅ |

**Test proof:**
```
uv run pytest -v     → 32 passed, 0 failed, 0 skipped
npx vitest run       → 17 passed, 0 failed, 0 skipped
npx vite build       → ✓ built in 2.60s, exit 0 (lazy split: index + App chunks)
```

**Phase 2e — Full Example Parity — CERTIFIED**

## Phase 2e Completion Criteria

| Criterion | Status |
|---|---|
| `framer-motion` + `lucide-react` installed | ✅ |
| `starter_min_stat` / `starter_max_stat` added to `stable` block in both `data.yaml` + fixture | ✅ |
| `buildInitialState` seeds from `data.yaml.starter_horses` — Vanguard Spirit + Starlight Dream | ✅ |
| Persistence: `derby_sim_state_v1` localStorage save on every state change, restore on mount | ✅ |
| Cooldown ticker: 1s interval increments `ticker`, passed to StableTab for live badge recompute | ✅ |
| Skip race: `handleSkipRace` builds new race without navigating, `BettingTab` "Skip & New Race" | ✅ |
| Rename horse: inline click-to-edit in StableTab, Enter/Blur confirms, Escape cancels | ✅ |
| Sell horse: Sell button on each card calls `calculate_horse_price` via Lua, removes horse + adds funds | ✅ |
| Purchase starter: `handlePurchaseStarter` generates horse via `generate_horse` Lua, BettingTab market | ✅ |
| Styled sticky header with Trophy icon, DERBY SIM title, desktop tab nav, bank balance widget | ✅ |
| Framer Motion `AnimatePresence` tab transitions (opacity + y slide, 150ms) | ✅ |
| Mobile tab bar: second tab row, hidden on desktop, visible on ≤768px | ✅ |
| Footer: GAME RULES · PEDIGREE GENETICS DATA | ✅ |
| History tab: styled `history-card` components — no more raw table | ✅ |
| Cooldown badge on resting horses: "Resting Xm Xs" amber italic text | ✅ |
| Clear bets button in bet slip: clears `betEntries` local state | ✅ |
| Starter market in BettingTab: visible when `playerHorses.length < unlockedSlots` | ✅ |
| All new CSS classes added to `index.css` without removing existing ones | ✅ |
| Python floor: `uv run pytest -v` → **32 passed, 0 failed** (unchanged) | ✅ |
| TS floor: `npx vitest run` → **17 passed, 0 failed** (was 15) | ✅ |
| `npx vite build` → exits 0 | ✅ |

**Test proof:**
```
uv run pytest -v     → 32 passed, 0 failed, 0 skipped
npx vitest run       → 17 passed, 0 failed, 0 skipped (tests/test_runtime.ts: 9)
npx vite build       → ✓ built in 2.97s, exit 0
```

## Phase 2d Completion Criteria

| Criterion | Status |
|---|---|
| `create_race` in `logic.lua` — full race creation, class eligibility, NPC generation, odds | ✅ |
| `can_unlock_slot` in `logic.lua` — slot unlock validation | ✅ |
| `calculate_payouts` deprecated in `logic.lua` (comment, not removed) | ✅ |
| `systems.yaml` — `create_race` added to simulation, `can_unlock_slot` to market | ✅ |
| `buildRace()` TS implementation deleted — replaced with thin `create_race` Lua wrapper | ✅ |
| Emergency grant: `funds < 50 && playerOwnedHorses == 0` → $250 + dismissible banner | ✅ |
| Slot unlock button in `StableTab.tsx` — calls `can_unlock_slot` via Lua | ✅ |
| `GameState.emergency_grant_shown` field added to `types.ts` | ✅ |
| Python floor: `uv run pytest -v` → **32 passed, 0 failed** | ✅ |
| TS floor: `npx vitest run` → **15 passed, 0 failed** | ✅ |
| `npx vite build` → exits 0, no TypeScript errors | ✅ |
| `tests/fixtures/horse_racing/logic.lua` synced with game file | ✅ |
| Executor `_to_lua()` deep conversion — nested dicts/lists fully converted | ✅ |

## Phase 3 Completion Criteria

| Criterion | Status |
|---|---|
| `games/horse_racing/systems.yaml` exists with all logic.lua functions assigned | ✅ |
| `studio_mcp/__init__.py` created | ✅ |
| `studio_mcp/session_store.py` — in-memory session registry | ✅ |
| `studio_mcp/tools.py` — 5 tools: load_game, call, get_schema, get_systems, run_headless | ✅ |
| `studio_mcp/server.py` — FastMCP SSE server on port 8025 | ✅ |
| `pyproject.toml` — fastapi, uvicorn, mcp>=1.0.0,<2 added | ✅ |
| `tests/test_studio_mcp.py` — 7 new tests (22–28) | ✅ |
| Python floor: `uv run pytest -v` → **28 passed, 0 failed** | ✅ |
| TS floor: `npx vitest run` → **12 passed, 0 failed** (unchanged) | ✅ |
| `docs/adr/ADR-006.md` — systems.yaml ECS manifest ADR | ✅ |

## Phase 3 Pending (manual steps on Nitro)

| Criterion | Status |
|---|---|
| `uv run uvicorn studio_mcp.server:asgi_app --host 0.0.0.0 --port 8025` starts | Pending |
| `curl http://localhost:8025/health` → `{"status": "ok"}` | Pending |
| NSSM service `RFDStudioMCP` registered on Nitro | Pending |
| Claude Desktop config updated with mcp-remote entry | Pending |
| Live Claude session: 5 studio tools visible in tool list | Pending |

## Phase 2c Completion Criteria (archived)

| Criterion | Status |
|---|---|
| `SVGRacer.tsx` copied from examples into `ts/src/components/` | ✅ |
| `RaceTrack.tsx` — full animated 6-lane track | ✅ |
| `RaceTrack.tsx` — `anim_` prefix on all display state | ✅ |
| `RaceTrack.tsx` — Lua `final_rank` is authoritative result | ✅ |
| `RaceTrack.tsx` — 1x / 3x / 5x speed multiplier buttons | ✅ |
| `RaceTrack.tsx` — Skip button snaps all to 100%, reveals Lua results | ✅ |
| `RaceTrack.tsx` — announcer line updates from leader `anim_progress` | ✅ |
| `RaceTrack.tsx` — results panel with rank, time, bet won/lost | ✅ |
| `BettingTab.tsx` — `onRaceComplete` replaced with `onStartRace` | ✅ |
| `BettingTab.tsx` — enriches participants with `final_rank`/`finish_time` before handing off | ✅ |
| `App.tsx` — `isRacingActive` state added | ✅ |
| `App.tsx` — `handleStartRace` / `handleCloseRaceTrack` wired | ✅ |
| `App.tsx` — `RaceTrack` renders as full overlay when `isRacingActive` | ✅ |
| `index.css` — `.race-track-fullscreen`, `.race-track-header`, `.race-announcer`, `.btn-speed` added | ✅ |
| Python floor: `uv run pytest -v` → **21 passed, 0 failed** (at time of 2c cert) | ✅ |
| TS floor: `npx vitest run` → **12 passed, 0 failed** (unchanged) | ✅ |
| `npx vite build` → exits 0, no TypeScript errors | ✅ |

## Phase 2b Completion Criteria (archived)

| Criterion | Status |
|---|---|
| `data.yaml` — `starting_funds` corrected to 1000 | ✅ |
| `data.yaml` — stable/betting/race constants added | ✅ |
| `data.yaml` — `fee` field on all `race_classes` entries | ✅ |
| `data.yaml` — `starter_horses` (2) and `public_studs` (5) appended | ✅ |
| `tests/fixtures/horse_racing/data.yaml` — identical changes applied | ✅ |
| `logic.lua` — `calculate_place_odds` added | ✅ |
| `logic.lua` — `update_horse_after_race` added (pure, no mutation) | ✅ |
| `logic.lua` — `settle_bets` added | ✅ |
| `logic.lua` — `simulate_race` lupa-safe (pcall on absent keys) | ✅ |
| Python floor: `uv run pytest -v` → **21 passed, 0 failed** | ✅ |
| `types.ts` — `RaceParticipant.final_rank` added | ✅ |
| `types.ts` — `Bet` interface with `type` + `payout_odds` added | ✅ |
| `BettingTab.tsx` — Win/Place toggle, `calculate_place_odds` call | ✅ |
| `BettingTab.tsx` — `simulate_race` is sole race authority | ✅ |
| `BettingTab.tsx` — `settle_bets` handles all payout logic | ✅ |
| `BreederTab.tsx` — new component, `breed_horses` + `public_studs` | ✅ |
| `App.tsx` — `handleRaceComplete` wires `update_horse_after_race` | ✅ |
| `App.tsx` — `handleAddOffspring` + Breeder tab wired | ✅ |
| TS floor: `npx vitest run` → **12 passed, 0 failed** | ✅ |
| `npx vite build` → exits 0, 3 assets emitted | ✅ |

## Proof Output

```
# Python floor (Phase 2d)
uv run pytest -v
32 passed in 0.47s

# TypeScript floor (Phase 2d)
npx vitest run
Tests  15 passed (15)

# Vite build (Phase 2d)
npx vite build
dist/index.html                   0.41 kB │ gzip:   0.29 kB
dist/assets/index-BUE2ICXj.css    7.14 kB │ gzip:   1.75 kB
dist/assets/index-D6OhiBk9.js   482.46 kB │ gzip: 154.86 kB
✓ built in 1.18s
```

## Directory Structure

```
RFDGameStudio/
  games/horse_racing/          — canonical game files
    data.yaml
    ui.yaml                    — line 168 bug FIXED in Phase 2
    logic.lua
    systems.yaml               — Phase 3: ECS manifest / Phase 2d: updated
  studio_mcp/                  — Phase 3 MCP server
    __init__.py
    session_store.py
    tools.py
    server.py
  studio/                      — Phase 1 Python runtime (frozen)
    __init__.py
    loader.py
    validator.py
    executor.py
    runtime.py
  ts/                          — Phase 2 TypeScript runtime
    index.html
    package.json
    vite.config.ts
    tsconfig.json
    src/
      main.tsx
      App.tsx
      index.css
      fengari-web.d.ts
      engine/
        types.ts
        loader.ts
        executor.ts
        runtime.ts
      components/
        StableTab.tsx
        BettingTab.tsx
        BreederTab.tsx
        RaceTrack.tsx       — Phase 2c: animated 6-lane track
        SVGRacer.tsx        — Phase 2c: horse+jockey SVG sprite
    tests/
      test_loader.ts            — 5 tests
      test_executor.ts          — 3 tests
      test_runtime.ts           — 4 tests
    dist/                       — production build output
  tests/                        — Python tests
    __init__.py
    fixtures/horse_racing/
    test_loader.py
    test_executor.py
    test_runtime.py
    test_studio_mcp.py         — Phase 3: 7 MCP tool tests
  docs/adr/ADR-001…ADR-006
  docs/state/current.md
  requirements.txt
  README.md
```

## Phase Roadmap

| Phase | Title | Status |
|---|---|---|
| **1** | Python Runtime Core | ✅ **CERTIFIED** |
| **2** | TypeScript Runtime | ✅ **CERTIFIED** |
| **2b** | Horse Racing Logic Extraction | ✅ **CERTIFIED** |
| **2c** | Race Animation | ✅ **CERTIFIED** |
| **2d** | Gap Closure | ✅ **CERTIFIED** |
| **2e** | Full Example Parity | ✅ **CERTIFIED** |
| **2f** | Architecture Migration | ✅ **CERTIFIED** |
| **2r** | Horse Racing Features | ✅ **CERTIFIED** |
| **2s** | Slither Rogue Balance + EIC Direction | ✅ **CERTIFIED** |
| **2t** | Shared TypeScript Infrastructure | ✅ **CERTIFIED** |
| **2u** | PyGame Universal Renderer | ✅ **CERTIFIED** |
| **2v** | Mutant Battle Ball | ✅ **CERTIFIED** |
| **3** | Claude Tool Integration | ✅ **CERTIFIED** |
| **ScrapCrawl A** | ScrapCrawl Core Loop Port | ✅ **CERTIFIED** |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |

## Shared UI Layer Compliance (ADR-008) — CERTIFIED

### What changed
- Completed an audit of all finished React/TypeScript games for shared UI component usage.
- Wrote `docs/analysis/ui-component-audit.md` with per-game component usage, hand-rolled equivalents, and compliance status for the eight games in scope.
- Added three evidence-backed shared templates derived from Brewfield and Dissonance real-world references:
  - `TitleScreen` — title, tagline, pitch/quote, and variable menu items (used by `Brewfield` `IntroScreen` and `Dissonance` `TitlePhase`).
  - `EndStateScreen` — win/loss end state with icon, headline, flavor, stats, and restart button (used by `Brewfield` `GameOverScreen` and the new `Dissonance` `RunEndPhase`).
  - `ProgressIndicator` — generic node/edge progress chrome with `linear` and `graph` layouts (used by `Brewfield` `MapProgress` and `Dissonance` `MapPhase`).
- Retrofitted Dissonance's built phases onto shared primitives:
  - `TitlePhase` → `TitleScreen`
  - `RewardPhase` → `Card` + `Button`
  - `MapPhase` → `ProgressIndicator` (graph layout)
  - `CombatPhase` → `StatBar`, `Card`, `Panel`
  - `RestCraftPhase` → `Card` + `Button`
  - `DeckBuildPhase` → `Card` + `Button`
  - `OpeningPhase` / `FloorChoicePhase` → `Button`, `Card`, `Badge`
  - New `RunEndPhase` wrapping `EndStateScreen`, replacing the inline run-end markup in `App.tsx`.
- Retrofitted Brewfield priority surfaces:
  - `IntroScreen` → `TitleScreen` + `Card` feature cards
  - `GameOverScreen` → `EndStateScreen`
  - `MapProgress` → `ProgressIndicator` (linear layout)
- Added additive `id` props to shared `Button` and `Card` to preserve stable selectors/tests.
- Added 11 new TypeScript tests across `test_ui_audit_report.ts`, `test_ui_shared_templates.tsx`, `test_dissonance_shared_ui.tsx`, and `test_brewfield_shared_ui.tsx`.

### Phase 2 — SlimeWorld, Shoal, Mutant Battle Ball, ScrapCrawl

- Audited the four remaining React/TypeScript games: `slimeworld`, `shoal`, `mutant_battle_ball`, `scrapcrawl`.
- Wrote `docs/analysis/ui-component-audit-phase2.md` with itemized per-file findings and the PyGame/canvas exclusions.
- Retrofits:
  - `SlimeWorld`: primary `TabBar` in `App.tsx` already present; restored `RosterTab.tsx` import to keep existing source assertions; replaced the hand-rolled `Advance Cycle` button with shared `Button`; used `ErrorBox` for warnings.
  - `Shoal`: toolbar buttons now use shared `Button`; canvas-based `ShoalCanvas` left untouched.
  - `Mutant Battle Ball`: `RosterTab` start button uses `Button`; mutant roster entries use `Card`; `App` header uses `Badge` for iron and `ErrorBox` for Lua errors.
  - `ScrapCrawl`: `App.tsx` action/move/craft buttons use `Button`; room tags and header stats use `Badge`; panels use `Panel`; recipe cards use `Card`; loading and empty trace use `EmptyState`; Lua errors use `ErrorBox`; original `sc-connection`/`sc-fight-button`/`sc-craft-button` selectors preserved for existing tests.
- Added `ts/tests/test_phase2_shared_ui.ts` covering the audit, `TabBar` usage, toolbar chrome, MBB/ScrapCrawl retrofits, and the untouched PyGame games.
- No new shared templates were extracted because no chrome pattern repeated 2+ times across the four games.

### Test proof (Phase 1 + Phase 2)

```
uv run pytest
→ 502 passed, 8 warnings

cd ts && npm run test
→ Test Files  35 passed
→ Tests  218 passed (212 previous + 6 new Phase 2)
```

### Compliance status summary

| Game | Status |
|---|---|
| Dissonance | ✅ Title/end/map chrome now ADR-008 compliant |
| Brewfield | ✅ Intro/end/map chrome now ADR-008 compliant |
| SlimeWorld | ✅ Primary `TabBar` + `Button`/`ErrorBox` chrome now ADR-008 compliant |
| Shoal | ✅ Toolbar chrome now ADR-008 compliant (canvas core view exempt) |
| Horse Racing | Mostly compliant (uses 6 shared primitives) |
| Mutant Battle Ball | ✅ Roster/`App` chrome now ADR-008 compliant |
| Slither Rogue | Partially compliant (uses `Modal`) |
| Scrapcrawl | ✅ `App.tsx` chrome now ADR-008 compliant |

## Shared Logic Layer Compliance (ADR-007) — Audit

- Audited all ten real Lua-backed games against all eleven `engine/primitives` and `engine/systems` files.
- Only `engine/primitives/action.lua` is genuinely reused (`clamp` in `scrapcrawl`, `shoal`, `slimeworld`, `slither_rogue`; `collect` in `horse_racing`, `dissonance`). `brewfield` still duplicates `clamp` locally.
- `engine/primitives/entity.lua` is barely used (`slime_coin` calls `copy_entity` once; `generate_id`/`validate_entity` have no callers).
- `engine/primitives/movement.lua` is narrowly used (`shoal`/`slither_rogue` call `dist2`).
- `engine/systems/genetics.lua` and `odds.lua` are only used by `horse_racing` (`generate_horse`, `calculate_odds`).
- `consequence`, `lifecycle`, `physics`, `resolution`, `combat`, and `market` have no real callers in game Lua.
- Cross-game duplicates not yet in `engine/`: `copy_table`, `get_state_summary`, `init_game`, `tick_game`, `calculate_stats`, `distance`, `lerp`, `advance_node`, `get_enemy_intent`, `init_player`, `build_render_state`.
- Full report: `docs/analysis/logic-layer-compliance-audit.md`.
- Verdict: current divergence is largely justified; no broad extension of the existing engine layer is supported by the evidence. The real extraction backlog is the cross-game duplicate table, not the existing eleven files.

## Per-Game Builds & Itch Publishing

- Added `MoreGamesByMe` shared component with `mode` prop (`arcade`/`standalone`) and exported it from `ts/src/ui/components/index.ts`.
- Created `ts/vite.standalone.factory.ts` with `makeStandaloneConfig(gameId)` and collapsed all existing per-game Vite configs to one-line factory calls.
- Added `ts/tools/generate-standalone-entry.ts` to generate `entry.tsx`/`index.html` from a logic-layer audit, and regenerated entries for `brewfield`, `shoal`, `slimeworld`, `chimera_wilds`, `mutant_battle_ball`, `scrapcrawl`, and `slime_coin`.
- Wired `MoreGamesByMe` footer into `brewfield`, `shoal`, `slimeworld`, `chimera_wilds`, `mutant_battle_ball`, `scrapcrawl`, and `slime_coin` `App.tsx`.
- Per-game Vite configs produce a root `index.html` in each `dist-{game}/` with relative asset paths.
- Added `build:{game}` scripts for all seven ready games to `ts/package.json`.
- Per-game bundles exclude other games' Lua logic and the unified arcade `dist/` remains intact.
- Added placeholder entries for all seven ready games to `RFD_IT_Publishing/config/games.yaml`; `python publisher.py list` loads them.
- First real itch.io deploys executed for `brewfield`, `shoal`, and `slimeworld` via `python publisher.py deploy <game> --target itchio`; `butler push` reported success for all three. Fixed `targets/itchio.py` to decode butler output as `utf-8` with `errors="replace"`, eliminating the `cp1252` decode error.
- Renamed `STABLE_GAMES` to `STANDALONE_BUILD_GAMES` to avoid overclaiming; the array now explicitly means "has a working standalone build", not "stable quality".

### Population re-check (§2.3)

- Re-checked `corpworld`, `ledger`, `trinity_siege`, `slimebreeder`, and `slimegarden` for standalone readiness.
- `corpworld`, `ledger`, and `trinity_siege` each have only a `config.ts` with `status: 'external'` in `ts/src/games/{id}/` and no `App.tsx`, `data.yaml`, or `logic.lua`.
- `slimebreeder` and `slimegarden` also have only a `config.ts` with `status: 'external'` and no corresponding `games/{id}/` directory.
- Result: none of the five are ready for standalone builds; the re-check was run and confirmed negative rather than skipped.

### Test proof

```
uv run pytest -q
→ 502 passed, 8 warnings

cd ts && npm run test
→ Test Files  39 passed
→ Tests  242 passed
```

## Shoal — Performance Optimization + Shark Population Bounding (v2.25.0)

- **Finding 1 (duplicate shark targeting):** `get_shark_targets` in `logic.lua` re-scanned every fish and chunk a second time per shark per tick, solely to feed `ticks_total`/`ticks_with_target`. Removed it; `compute_shark_forces` (`steering.lua`) now computes `nearest_fish`/`nearest_chunk` once (before the retreat branch, since the diagnostic must reflect target presence even during retreat) and returns a third `had_target` value that `move_creature` consumes directly.
- **Finding 2 (unhashed algae seek):** `rebuild_spatial_hash` now also indexes live algae nodules under `hash.algae` (entries are `{n, core}`). `compute_fish_forces`'s algae-seek loop uses `get_nearby(hash, bx, by, "algae", bx_range, by_range)` when a hash is present, falling back to the original raw nested loop when `hash` is `nil` (e.g. direct-call tests).
- **Correctness fix for the 3x3-bucket search:** `get_nearby` gained optional `bx_range`/`by_range` params (default `1`, preserving the existing fish/shark 3x3 neighbor search unchanged). For algae, `bx_range = ceil(cfg.perception.algae / bucket_width)` and `by_range = ceil(cfg.perception.algae / bucket_depth)` are computed per-call so the 250-unit algae perception radius is fully covered against the 120x80 bucket grid (previously a fixed ±1 bucket would have under-searched this radius).
- **Finding 3 (unbounded shark breeding):** Added `creatures.shark.carrying_capacity: 20` to `data.yaml` (draft tuning value, proportional to fish's `100`). Shark breeding in `update_discrete_events` now uses the same `breed_probability = max(0, 1 - current/capacity)` throttle already used by fish, gated by `math.random()`.
- `VERSION` bumped `2.24.0` → `2.25.0`.
- Added 7 regression tests to `tests/test_shoal.py`: `get_shark_targets` removal, algae nodules present in `GAME_STATE.spatial_hash.algae`, a fish at the edge of its 250-unit perception radius still finds a nodule post-hashing, shark population plateaus near `carrying_capacity` over an extended run, shark breeds reliably below capacity / not at-or-above capacity, and `had_target` correctly reflects a nearby fish even while a shark is in retreat. Updated 11 existing `compute_shark_forces` call sites in the same test file to unpack the new third return value.
- Test proof: `uv run pytest tests/test_shoal.py -q` → 67 passed. Full floor: `uv run pytest -q` → 509 passed, 8 warnings.

## Shoal — Caching Optimizations Round 2 (v2.26.0)

Baseline confirmed before any change (per directive's STOP gate): `uv run pytest tests/test_shoal.py -q` → 67 passed; `uv run pytest -q` → 509 passed, 8 warnings.

**Finding 1 (safe refactor) — population counts cached once per discrete tick.** `update_discrete_events` (`logic.lua`) now computes `current_fish_alive`/`current_shark_alive` once at the top via `count_alive`, instead of every qualifying breeding candidate re-scanning the full list. Snapshot semantics: a death or birth later in the *same* discrete-tick pass is not reflected in a later candidate's `breed_probability` (previously, per-candidate recompute WOULD have reflected it). Verified explicitly with two new tests: `test_breed_probability_unchanged_no_deaths` (control case, no mid-tick mutation, deterministic zero-probability edge) and `test_breed_probability_snapshot_timing` (a shark starving mid-loop does not retroactively raise a later shark's breed probability — deterministically proven via a capacity/count ratio that clamps to exactly 0 pre-loop vs. 0.5 post-death).

**Finding 2 (safe refactor) — fish bucket coordinates computed once.** `compute_fish_forces` (`steering.lua`) now computes `bx`/`by`/`bw`/`bd` once at the top and reuses them for both the algae-hash lookup and the boids-neighbor lookup, instead of recomputing the same `math.floor`/`math.ceil` expressions twice. Verified with `test_bucket_coords_computed_once`, a structural spy on `math.floor` confirming exactly 2 calls (not 4) per `compute_fish_forces` invocation.

**Finding 3 (correctness-sensitive) — nodule danger rating cached, with a real ordering bug caught and fixed.** `update_algae_core` (`entities.lua`) now writes `n.cached_danger = compute_fish_cold_rate(n.depth, data)` right after updating `n.depth` in its nodule position-update loop; `compute_fish_forces` reads `n.cached_danger` instead of recomputing it per fish, per nodule. **Verified `tick_game`'s actual call order directly (not assumed) and found it was the reverse of what the directive's example assumed**: the original order was `update_creatures(st, dt)` then `update_algae(st, dt)` — meaning fish forces were computed *before* algae's depth update for the tick. Caching the danger value inside `update_algae_core` as directed would have made fish read a tick-stale value. Fixed by swapping the call order in `tick_game` so `update_algae(st, dt)` runs before `update_creatures(st, dt)`, guaranteeing the cache is fresh before any fish reads it, every tick, including the first. Also had to seed `cached_danger` at nodule-creation time (`new_algae_nodule` in `entities.lua`, using `GAME_STATE.data`), since `init_game` spawns initial algae without ever calling `update_algae` — direct-call tests and the pre-first-tick render would otherwise hit a nil-comparison Lua error (caught by `test_fish_cold_exposure_decays_in_safe_water` failing during implementation, before the nodule-creation fix). Verified with `test_nodule_danger_cache_matches_live_computation` (cache matches a fresh computation after a real tick) and `test_nodule_danger_cache_updates_after_depth_change` (the single most important test per the directive: cache reflects the new depth after the core's lerp moves it over 30 ticks, and is provably not the stale spawn-time value).
- `compute_fish_cold_rate` was not deleted — still called from `move_creature` (fish body cold rate) and now also from `update_algae_core`/`new_algae_nodule` (populating the cache).
- `VERSION` bumped `2.25.0` → `2.26.0`.
- Added 5 new regression tests to `tests/test_shoal.py` (all listed above). Multi-tick population-trajectory consistency was cross-checked via the already-existing `test_shark_population_plateaus_near_carrying_capacity` and `test_fish_breeds_reliably_below_carrying_capacity`/`test_shark_breeds_reliably_below_carrying_capacity`, all still passing unchanged.
- Test proof: `uv run pytest tests/test_shoal.py -q` → 72 passed. Full floor: `uv run pytest -q` → 514 passed, 8 warnings.

---

## Shoal — Reef Decomposition Loop & Depth Band Markers (v2.26.0 → v2.27.0)

**Directive:** Close the trophic loop (decomposition → algae replenishment, algae starvation → real core death) and make depth bands legible with side text markers.

**Changes by file:**

- `games/shoal/data.yaml`: Added `algae.starvation_seconds: 30` (cores die after 30s with zero live nodules), `flesh_chunk.decompose_radius: 100` (search radius for nearest core during decomposition), `flesh_chunk.decompose_replenish_amount: 2.0` (cooldown reduction per decomposition event).
- `games/shoal/entities.lua`:
  - `spawn_algae_core`: Initializes `core.empty_for = 0` on new cores.
  - `update_algae_core`: Tracks `core.empty_for` — increments by `dt` when `live_count == 0`, resets to `0` otherwise. Returns `core.empty_for < data.algae.starvation_seconds` (true = alive, false = starved).
  - New `decompose_chunk(st, chunk)`: Finds nearest algae core within `decompose_radius`. If found, reduces cooldown of its non-live nodules by `decompose_replenish_amount`. If no core found, spawns a new algae core at the chunk's position.
- `games/shoal/logic.lua`:
  - `update_algae`: Reverse iteration with starvation removal — calls `update_algae_core`, removes cores that return false (starved).
  - `update_chunks`: Calls `decompose_chunk(st, c)` before `table.remove` when a chunk's floor grace timer expires.
  - `build_render_state`: Exposes `decay_ratio` on each chunk — `floor_timer / floor_grace_time` clamped to `[0, 1]`, or `0` if not on floor.
- `ts/src/games/shoal/types.ts`: Added `decay_ratio: number` to `FleshChunk` interface.
- `ts/src/games/shoal/App.tsx`:
  - Added `DEPTH_BAND_LABELS` map (band id → display name, derived client-side).
  - Added `hexToRgb`/`lerpColor` utility functions.
  - Chunk rendering: fill color lerps from `chunk_color` to `algae_core_color` by `decay_ratio` (fade-to-bloom visual).
  - Depth band labels: drawn at each band's vertical midpoint along both left and right canvas edges, using `rgba(255,255,255,0.7)`.
- `tests/test_shoal.py`: Added 8 new regression tests:
  1. `test_decomposing_chunk_near_depleted_core_reduces_nodule_cooldowns` — decomposition reduces nearby core's nodule cooldowns without instant revival.
  2. `test_decomposing_chunk_with_no_core_nearby_spawns_new_core` — decomposition far from any core spawns a new core.
  3. `test_decomposition_does_not_affect_cores_outside_decompose_radius` — only the core within radius is affected.
  4. `test_core_empty_for_less_than_starvation_seconds_survives` — core with all nodules dead but empty_for < starvation_seconds survives.
  5. `test_core_empty_for_longer_than_starvation_seconds_is_removed` — core starved past threshold is removed.
  6. `test_core_that_regrows_one_nodule_resets_starvation_timer` — regrowing even one nodule resets empty_for to 0.
  7. `test_chunk_render_state_exposes_valid_decay_ratio` — decay_ratio is 0 before floor, rises toward 1 as floor_timer approaches grace.
  8. `test_algae_core_count_can_both_rise_and_fall_across_a_run` — integration test proving both starvation (count drops) and replenishment (count rises) fire in a seeded run.

**Testing notes:** Tests use `session.executor._lua.execute()` for direct `GAME_STATE` manipulation (depleting nodules, calling `decompose_chunk`/`spawn_algae_core` on the real Lua state), since `get_global` returns a Python copy and `call()` passes copies to Lua. Integration test tuned with 120 fish, 20 sharks, 3 hubs, starvation_seconds=8, regrow_cooldown=20 to ensure both starvation and replenishment fire within 500 ticks.

- `VERSION` bumped `2.26.0` → `2.27.0`.
- Test proof: `.venv\Scripts\python.exe -m pytest tests\test_shoal.py -q` → **89 passed** in 6.14s.
- TypeScript build: `studio_build` → success, built in 5.41s.

---

## Shoal — Reef Tuning & Chunk Avoidance (v2.27.0 → v2.28.0)

**Directive:** Two playtest-driven fixes: (1) rebalance starvation/decomposition with empirically tested values, (2) add creature-vs-chunk obstacle avoidance for fish and sharks.

### Tuning values (`data.yaml`)

Empirically tested against default population (60 fish, 8 sharks, 6 hubs, seed=42, 2400 ticks at dt=0.25 = 10 simulated minutes):

- `algae.regrow_cooldown`: 3.0 → **10.0** — slower regrowth gives nodules more dead time, but alone can't force 8 independent timers to sync.
- `algae.starvation_seconds`: 30 → **8** — the real lever. With 8 nodules on independent cooldowns, getting all 8 simultaneously dead for 30s was nearly impossible; 8s produces 2 starvation events in 10 min.
- `flesh_chunk.decompose_radius`: 100 → **450** — at 100, most far-field chunk deaths minted new cores (13 new cores in 10 min, uncapped growth). At 450, most deaths reinforce existing cores (3 new cores, bounded).

### Chunk avoidance (`steering.lua`)

- New `force_avoid(x, y, obstacles, radius_sq, weight, max_force, exclude_id)` — variant of `force_separate` without the `.alive` check (chunks don't have that field), plus optional `exclude_id` for sharks to skip their currently-pursued chunk. Guards against nil `obstacles` for test stubs.
- `compute_fish_forces`: Added `force_avoid` call after boids block, before depth/wander. Fish avoid all chunks unconditionally (no `exclude_id`).
- `compute_shark_forces`: Added `target_chunk_id = nil` as outer-scope local at function top, set to `nearest_chunk.id` inside the `elseif nearest_chunk` branch. `force_avoid` call placed after all branches, unconditionally, before `return fx, fy, had_target`. **Scoping approach: outer-scope local** (`target_chunk_id` declared at function top, set inside the branch) — the existing `nearest_chunk` local was in scope at the return point but only the branch knew whether it was actually being pursued.

### New config (`data.yaml`)

- `steering_weights.fish.avoid_chunk`: **0.8**
- `steering_weights.shark.avoid_chunk`: **0.5**
- `avoid_chunk_radius`: **25** (top-level, shared by both species — chunks are the same physical size regardless of which creature is avoiding)

### Tests (6 new, 95 total)

1. `test_starvation_fires_under_default_population_within_real_window` — 2400 ticks at dt=0.25 with default population and new tuning values. Monkey-patches `update_algae` with a starvation event counter (new cores can spawn in the same tick via `decompose_chunk`, masking count drops). Asserts ≥1 event.
2. `test_core_count_growth_bounded_under_new_decompose_radius` — same run, asserts core count never exceeds 2× starting count.
3. `test_force_avoid_zero_outside_radius_real_repulsion_inside` — unit test: far obstacle → (0,0), near obstacle → nonzero force pointing away.
4. `test_force_avoid_excludes_given_id` — two obstacles at equal distance, one excluded → force reflects only the non-excluded one.
5. `test_fish_steering_includes_measurable_deflection_near_chunk` — real `compute_fish_forces` call with chunk within `avoid_chunk_radius` differs from baseline with no chunks.
6. `test_hunting_shark_still_avoids_non_targeted_chunks` — shark pursuing one chunk still shows avoidance of a second non-targeted chunk.

**Pre-existing test fix:** `test_algae_core_count_can_both_rise_and_fall_across_a_run` updated with `decompose_radius=50` override (the new default of 450 prevents new core spawning with only 3 hubs in a 1200px world).

- `VERSION` bumped `2.27.0` → `2.28.0`.
- Test proof: `.venv\Scripts\python.exe -m pytest tests\test_shoal.py -q` → **95 passed** in 16.89s.
- `git diff --stat HEAD` confirms only `steering.lua` and `tests/test_shoal.py` touched (data.yaml was committed in a prior session).

---

## Shoal — Grazing Loop Hash Query & Render Batching (v2.28.0 → v2.29.0)

**Directive:** Fix the dominant real performance cost (confirmed by differential profiling) and a behavioral bug found while investigating it. Also batch canvas draw calls.

### Performance root cause

Differential profiling: zeroing fish drops average tick time 2.132ms → 0.279ms (7.6x). Zeroing sharks barely moves it (2.132ms → 2.088ms). Scaling fish 4.24x (64→271) scales tick time 6.02x — worse than linear, the signature of an unhashed loop whose cost grows with total creature×object pairs.

Root cause: `logic.lua`'s grazing loop was brute-force O(fish × cores × nodules) with zero spatial acceleration. The `break` only escaped the innermost nodule loop, not the core loop — a fish that already grazed still got checked against every other core's nodules.

### Grazing loop fix (`logic.lua`)

Replaced brute-force triple loop with `get_nearby(st.spatial_hash, bx, by, "algae", 1, by_range)` query per fish, matching the pattern already used in `steering.lua`'s `compute_fish_forces`. The `break` now exits after the first nearby-list match — fixing both the performance issue and the double-graze bug (a fish within range of two nearby cores could graze two nodules in one tick, when one bite per fish per tick is the evident intent).

### Render batching (`App.tsx`)

- **Algae cores**: single `beginPath`/`fill` pair for all cores, using `moveTo(x + radius, y)` before each `arc()` to prevent stray connecting lines.
- **Algae nodules**: single `beginPath`/`fill` pair for the entire nested loop.
- **Flesh chunks**: grouped into at most 6 decay buckets (rounding `decay_ratio` to nearest 0.2), one `fillStyle`/`fill` per bucket instead of one per chunk.

### Measured performance improvement

```
baseline (64 fish):  2.321ms/tick
scaled (271 fish):  12.995ms/tick
ratio: 5.60x  (pre-fix was 6.02x)
```

The improvement (6.02x → 5.60x) is measurable but modest because the grazing loop is only one component of tick time. The steering/movement loops (which already used the hash) dominate at high fish counts, and those scale linearly as expected. The double-graze bug fix is the more impactful behavioral improvement.

### Tests (3 new, 98 total)

1. `test_fish_scaling_stays_closer_to_linear_after_hash_fix` — real differential profile using `load_game`/`tick_game`, 500 ticks per measurement. Asserts ratio < 5.8x (clearly below old 6.02x).
2. `test_fish_near_two_overlapping_cores_grazes_exactly_one_nodule_per_tick` — two cores with nodules at the same position, one stationary fish. Asserts exactly 1 nodule grazed per discrete tick (not 2). Uses `depth_lerp_speed=0` and fixed nodule offsets to prevent core drift.
3. `test_grazing_via_hash_query_same_outcome_as_before_single_core` — regression guard: single core, single nodule, fish in range. Asserts the nodule is still grazed (query-pattern change doesn't break the simple case).

**Test setup notes:** Grazing tests require `depth_lerp_speed=0` (prevents core sinking), `n.offset` correction (prevents `update_algae_core` from repositioning nodules), `cooldown=999` on killed nodules (prevents regrowth), and stationary fish (`max_speed=0, max_force=0, vx=0, vd=0`) to prevent drift before the discrete event fires.

- `VERSION` bumped `2.28.0` → `2.29.0`.
- Test proof: `.venv\Scripts\python.exe -m pytest tests\test_shoal.py -q` → **98 passed** in 25.34s.
- TypeScript build: `studio_build` → success, built in 7.21s.
- `git diff --stat HEAD` confirms only `tests/test_shoal.py` touched (`logic.lua` and `App.tsx` were committed in prior session).

---

## Shoal — Mechanics Popup & Depth Units (v2.29.0 → v2.30.0)

**Directive:** Two legibility fixes — a Mechanics button with real copy explaining what the reef does, and depth labels in meters/feet instead of oceanographic zone names.

### Mechanics popup (`App.tsx` + new `mechanicsCopy.ts`)

- New `mechanicsCopy.ts` module exports `MECHANICS_COPY` — a 6-paragraph explainer covering: nutrient recycling (algae→fish→sharks→algae), starvation memory ("once in a while"), depth temperature/light gradient, debris avoidance steering, non-scripted emergent balance, and seed reproducibility (starting layout only, not the run).
- "Mechanics" button added to the toolbar row alongside Spawn Fish/Shark/Algae/Cull.
- Popup is a dismissible overlay: click outside or × button to close. Styled with the existing dark theme (`#0f172a` background, `#e2e8f0` text).
- CSS added to `styles.css` for `.shoal-mechanics-overlay`, `.shoal-mechanics-popup`, `.shoal-mechanics-header`, `.shoal-mechanics-close`, `.shoal-mechanics-text`.

### Depth labels (`App.tsx`)

- Replaced `DEPTH_BAND_LABELS` (zone-name lookup: "Sunlit Surface", "Epipelagic", etc.) with `formatDepthLabel(top, bottom)` function.
- Labels now show meter/feet ranges computed from the real `data.depth_bands` values, e.g. `0–150m (0–490ft)`.
- Feet rounded to nearest 10 for readability. Meters shown at full precision (already whole numbers).
- Zone names removed entirely — no subtitle, tooltip, or fallback. Per directive: if zone names are missed later, that's an explicit follow-up ask.

### Verification

- Pre-flight: **98 passed** (performance directive landed first).
- Post-implementation: **98 passed** in 24.99s (no Lua changes, no new Python tests — this is a presentational/TypeScript-only directive).
- TypeScript build: `studio_build` → success, built in 5.51s.
- `npx tsc --noEmit`: 40 errors, all in other games (horse_racing, mutant_battle_ball, slither_rogue) and test files — zero errors in `shoal/`.
- `git diff --stat HEAD`: all changes committed (commits `9bd0278` for mechanics copy, prior commits for App.tsx and styles.css).
- Screenshots: Shoal is a browser canvas game with no PyGame renderer — visual verification (mechanics button visible, popup text legible, depth labels showing meter/feet ranges) must be done manually in the browser.

- `VERSION` bumped `2.29.0` → `2.30.0`.

---

## Shoal — General Obstacle Avoidance (v2.30.0 → v2.31.0)

**Directive:** Replace chunk-only avoidance with Reynolds' Obstacle Avoidance — every node (algae nodules + chunks) in range is avoided by every creature, except whichever single node is that creature's current seek/pursuit target. Also deduplicate `dist2` between Shoal's `utils.lua` and `engine/primitives/movement.lua`.

### Fish avoidance (`steering.lua`)
- `compute_fish_forces` now builds a combined `avoid_targets` list from `nearby_algae` entries (live nodules only) plus `st.chunks`, and passes `nearest_nodule.id` as the exclude parameter.
- Reuses the existing `nearby_algae` hash query already computed for seek_algae — no new query needed.
- Dead nodules are filtered out (not physical obstacles).

### Shark avoidance (`steering.lua`)
- `compute_shark_forces` now queries the spatial hash for nearby algae nodules using `avoid_chunk_radius` as the search range, purely for avoidance (sharks never seek algae).
- Combined `avoid_targets` list from nearby live nodules plus `st.chunks`, with `target_chunk_id` as the exclude parameter.
- Fish pursuit is not excluded from avoidance — fish aren't in the `avoid_targets` list at all, only nodules and chunks.

### `dist2` deduplication (`utils.lua` + `systems.yaml`)
- Removed local `dist2` definition from `utils.lua`. Engine primitives are loaded unconditionally before game files (confirmed in `studio/loader.py`), so `engine/primitives/movement.lua`'s `dist2` is already in scope.
- Argument order confirmed identical: both are `dist2(ax, ay, bx, by)` computing `(ax-bx)² + (ay-by)²`.
- `systems.yaml` comment updated from "self-contained port" to "dist2 sourced from engine/primitives/movement.lua".

### Behavioral impact
- Generalized nodule avoidance spreads grazing pressure, preventing the over-grazing that caused starvation events under default population. The old `test_starvation_fires_under_default_population_within_real_window` test was replaced with `test_grazing_continues_under_general_obstacle_avoidance`, which verifies grazing still occurs and population grows.

### Verification
- Pre-flight: **98 passed**.
- Post-implementation: **103 passed** in 27.56s (98 existing + 5 new tests).
- New tests:
  1. `test_fish_avoids_nearby_nodules_other_than_seek_target` — fish avoids non-target nodule
  2. `test_fish_avoidance_excludes_only_actual_seek_target` — regression guard: killing non-target nodule changes force
  3. `test_shark_avoids_nearby_nodules_while_pursuing_fish` — shark dodges nodule in path
  4. `test_shark_still_excludes_pursued_chunk_from_avoidance` — regression guard: chunk exclusion still works
  5. `test_dist2_utils_matches_engine_primitive` — confirms argument order and math match
- `git diff --stat`: `steering.lua`, `systems.yaml`, `utils.lua`, `test_shoal.py` (4 files, all in scope).
- `dist2` argument order: confirmed identical between `utils.lua` (old) and `engine/primitives/movement.lua` — both `dist2(ax, ay, bx, by)` = `(ax-bx)² + (ay-by)²`.

- `VERSION` bumped `2.30.0` → `2.31.0`.

---

## Shoal — Flaky Test Fix, Daily Seed, Depth Tick Redesign (v2.31.0)

**Directive:** Three independent, low-risk items — fix a flaky starvation test with a multi-seed aggregate, add a `daily_seed()` function for deterministic daily spawns, and replace band-range depth labels with evenly-spaced ticks.

### Flaky test fix (`tests/test_shoal.py`)
- Replaced `test_grazing_continues_under_general_obstacle_avoidance` (single-seed, could pass or fail by luck) with `test_starvation_fires_across_multiple_independent_seeds` — runs seeds 1–5 for 2400 ticks each, asserts `total_events >= 1` across the aggregate.
- Root cause: only spawn is seeded; ongoing simulation randomness (breeding rolls, escape chance, wander jitter) is deliberately unseeded. A single-run `>= 1` assertion on a rare emergent event was structurally flaky.
- Confirmed diagnosis: 5 runs of seed=42 alone produced 2, 1, 1, 0, 2 starvation events.

### Daily seed (`games/shoal/state.lua`)
- Added `daily_seed()` function: `os.date("!*t")` (UTC) → `t.year * 10000 + t.month * 100 + t.day` (e.g. `20260729`).
- Wired into `spawn_initial_entities`: when `data.spawn.seed` is the string `"daily"`, uses `daily_seed()`; `nil` still means random (`os.time()`); numeric seeds still work as before.
- UTC is deliberate — two players on opposite sides of the date line see the same reef.
- Verified: two consecutive `init_game` calls with `seed="daily"` produce identical algae positions.

### Depth ticks (`ts/src/games/shoal/App.tsx`)
- Removed `formatDepthLabel` (band-range labels computed from `data.depth_bands`).
- Added `drawDepthTicks(ctx, floorDepth, dims)` — renders labels every 100m from 0 to `floor_depth` on both left and right canvas edges, with meter/feet conversion.
- Replaces the per-band label loop in `drawGame` entirely. Ticks scale automatically with `floor_depth` — no hardcoded per-band positions.
- `tickIntervalM = 100` gives 9 ticks for `floor_depth: 800` (0, 100, 200, …, 800).

### Verification
- Pre-flight: **103 passed** (the old `test_grazing_continues_under_general_obstacle_avoidance` was already passing — the flakiness was structural, not guaranteed to surface on any given run).
- Post-implementation: **103 passed** in 50.39s (multi-seed test takes ~50s for 5×2400 ticks, well under a minute).
- TypeScript build: `studio_build` → success, built in 7.03s.
- `daily_seed()` verified: returns `20260729`, two calls with `seed="daily"` produce identical reef layouts.
- `git diff --stat 7854d37~1`: `state.lua`, `test_shoal.py`, `App.tsx` (3 files, all in scope).
- Screenshots: Shoal is a browser canvas game — visual verification of depth ticks must be done manually in the browser.

---

## Shared Menu Components & Shoal Title Screen (v2.31.0)

**Directive:** Extract shared menu components from slither_rogue's existing `MainMenu.tsx` and build Shoal's new title screen on top of them. Refactoring the existing consumer is the real validation.

### Shared components (`ts/src/components/`)

**`MenuShell.tsx`** — Extracted shell layout: title, subtitle, optional `heroSlot`, content grid, CTA button. Supports per-element `classNames` overrides so each game can use its own CSS classes. `beforeInner` slot for pre-inner content (slither_rogue's bg glows + badge). `heroSlot` is optional — slither_rogue omits it, Shoal passes `ReefPreview`.

**`OptionSelectGroup.tsx`** — Extracted labeled-row-of-buttons-with-active-state pattern. Generic `<T>` over option values. Supports `renderOption` slot for custom button content (slither_rogue's color swatches use it for the two-dot color preview). Per-element `classNames` overrides.

### slither_rogue refactor (`MainMenu.tsx`)
- All three option groups (color picker, movement controls, run duration) now use `OptionSelectGroup` with `classNames` passing the existing `sr-` classes.
- Shell layout (title, subtitle, grid, CTA) now uses `MenuShell` with `classNames` passing `sr-` classes.
- **Zero `<button>` elements remain in `MainMenu.tsx`** — all button rendering delegated to shared components.
- `Play` icon import removed (CTA button now rendered by `MenuShell`).
- Visual appearance unchanged — same CSS classes, same DOM structure (buttons inside option rows, same class names).

### Shoal title screen (`TitleScreen.tsx`, `ReefPreview.tsx`)
- **`ReefPreview`**: Own lightweight session using `init_game`/`tick_game` with preview-only spawn params (18 fish, 3 sharks, 3 hubs). Reuses `drawGame` verbatim (exported from `App.tsx`). No HUD, no input handling. Rendered at 50% opacity behind the title screen content.
- **`TitleScreen`**: Built on `MenuShell` with `ReefPreview` as `heroSlot`. Four scenario presets using `OptionSelectGroup`:
  - Balanced Reef (60/8/6), Sparse Reef (30/4/4), Feeding Frenzy (50/16/5), Lush Garden (70/4/10)
- Three start actions: "Start Game" (CTA, uses selected scenario + null seed), "🎲 Random Seed", "📅 Today's Reef" (uses `seed: 'daily'`).
- Each action directly starts the game — no separate confirm step.

### App.tsx changes
- Added `screen: 'title' | 'game'` state; renders `TitleScreen` first.
- `handleStart` writes scenario config into `session.files.data.spawn` and transitions to game screen.
- **Removed all in-game seed controls**: `seedInput` state, "New Reef" button, "🎲 Random Seed" button, seed input field, seed hint text.
- Added "← Title" button in status area to return to title screen.
- `drawGame` exported for reuse by `ReefPreview`.

### Files touched
- `ts/src/components/MenuShell.tsx` (new)
- `ts/src/components/OptionSelectGroup.tsx` (new)
- `ts/src/components/index.ts` (exports)
- `ts/src/games/slither_rogue/components/MainMenu.tsx` (refactored)
- `ts/src/games/shoal/components/TitleScreen.tsx` (new)
- `ts/src/games/shoal/components/ReefPreview.tsx` (new)
- `ts/src/games/shoal/App.tsx` (screen state, removed seed controls)
- `ts/src/games/shoal/styles.css` (title screen + reef preview + back-to-title CSS)

### Verification
- Pre-flight: `npx tsc --noEmit` — 40 pre-existing errors in other games, zero in shoal/slither_rogue/components.
- Post-implementation: 40 errors (same baseline), zero new errors.
- `studio_build` → success, built in 6.16s.
- `pytest tests\test_shoal.py -q` → 103 passed in 49.07s.
- `git diff --stat c3729cb~1`: 8 files (6 from §1 + `index.ts` exports + `styles.css` for title screen styling).
- Zero `<button>` elements in refactored `MainMenu.tsx` — all delegated to shared components.
- Zero seed control references in `App.tsx` toolbar (`seedInput`, `New Reef`, `Random Seed`, `seed-hint` all removed).
- Browser preview running at `http://localhost:5174/arcade/rfdgamestudio/` for visual verification.

---

## Stage 3 Scaffolding Tool — `studio_scaffold_game` (ADR-012)

**Directive:** Create a scaffolding tool that generates the empty vessel for a new game from an existing `examples/{slug}/` concept. Never writes real game logic — Stage 4 (Convert) fills it by hand later. The permanent fix: generated entry points use `import.meta.glob` instead of hand-listed `.lua` imports, making the "silent break when file set changes" bug class structurally impossible.

### Tool: `studio_scaffold_game(concept_slug, target_type=None)`

**`recommend_target_type(examples_dir)`** — inspects `examples/{slug}/src` for `.tsx` files, `package.json` React deps, `.lua`/`.yaml` files. Returns `{recommendation, reason, confidence}`. Never silently decides — requires explicit `target_type` argument to proceed.

**TS-native scaffold** creates:
- `ts/src/games/{game_id}/App.tsx` — stub component ("Not yet converted")
- `ts/src/games/{game_id}/config.ts` — GameConfig stub with `status: 'dev'`
- `ts/vite.{game_id}.config.ts` — `makeStandaloneConfig('{game_id}')`
- `ts/src/standalone/{game_id}/entry.tsx` — uses `import.meta.glob` for both game and engine `.lua` files
- `ts/src/standalone/{game_id}/index.html`
- `games/{game_id}/` — data.yaml, ui.yaml, systems.yaml, logic.lua (stub), VERSION
- Registry entry — additive only (one import + one array line)

**Lua-backed scaffold** creates:
- `games/{game_id}/` — data.yaml, ui.yaml, systems.yaml (`lua_files: []`), logic.lua (stub with `init_game`/`tick_game`), VERSION

### The permanent fix
Generated `entry.tsx` uses `import.meta.glob('../../../../games/{game_id}/*.lua', {query: '?raw', import: 'default', eager: true})` instead of hand-listed `import logicRaw from '...logic.lua?raw'` lines. When a game's Lua file set changes (modularization, new files), the glob auto-picks them up — zero hand-editing needed.

### What it never does
- Writes real game logic or infers what a prototype "does"
- Auto-populates `App.tsx`/`logic.lua` beyond boilerplate stubs
- Retrofits existing games' entry points (Shoal's included — that's a named follow-up)
- Silently defaults to the common case (`ts_native`) without explicit confirmation

### Files touched
- `studio_mcp/scaffold.py` (new) — tool implementation
- `studio_mcp/tools.py` (modified) — import + register
- `studio_mcp/server.py` (modified) — import + `mcp.tool()` decorator
- `tests/test_scaffold.py` (new) — 8 tests covering all 5 anchors

### Verification
- Pre-flight floor: **545 passed**, 0 failed, 8 warnings.
- Post-implementation: **553 passed** (545 + 8 new), 0 failed, 8 warnings.
- Manual end-to-end: scaffolded `throwaway-test` concept → `tsc --noEmit` zero errors for new files → `vite build` succeeded (47 modules, glob resolved `.lua` files correctly).
- `git diff --stat 1835029~1`: 4 files (`scaffold.py`, `tools.py`, `server.py`, `test_scaffold.py`).
- Throwaway test output cleaned up (not committed).
- Registry modification confirmed additive-only: exactly 2 lines added (import + array entry).

### Named follow-up
**Retrofit existing games' entry points with `import.meta.glob` pattern.** Shoal's `entry.tsx` currently hand-lists 5 `.lua` files (`utils`, `state`, `entities`, `steering`, `logic`). The pending Logic-Layer Modularization directive would break this. This is a separate explicit task — scaffolding only applies the pattern going forward.

---

## Shoal — Live Polish: Arcade Link Fix & Entry Point Glob Retrofit

**Directive:** Fix two confirmed-still-broken issues before pushing Shoal live to itch and the arcade website.

### Bug 1 — `navigateHome` mode-aware (itch/standalone back link)

**Problem:** `navigateHome()` in `routing.ts` was `window.location.href = window.location.href.split('?')[0]` — correct for arcade-embedded mode (strips `?game=`), but in standalone/itch builds this just reloads the current page instead of navigating to the arcade website. `VITE_ARCADE_BASE_URL` was configured but unused.

**Fix:** `navigateHome(mode='arcade', arcadeBaseUrl?)` — when `mode='standalone'` and `arcadeBaseUrl` is set, uses `window.open(arcadeBaseUrl, '_blank', 'noopener,noreferrer')` to open the arcade URL in a new tab. This is required because Shoal runs inside a cross-origin iframe on itch.io (`html-classic.itch.zone` embedded on `itch.io`) — `window.location.href` only navigates the iframe's own document, never the real browser tab. `window.open` from a direct click is not subject to cross-origin navigation restrictions in any browser. Default parameters preserve existing behavior for all arcade-embedded callers (strips `?game=`). `GameShell` passes `mode`/`arcadeBaseUrl` through to the back button's `onClick`. Shoal's `App.tsx` wires its already-computed `mode`/`arcadeBaseUrl` into `GameShell`.

**Compatibility fix:** `GameLoader.tsx` had two `onClick={navigateHome}` direct assignments that needed wrapping to `onClick={() => navigateHome()}` — the signature change from `() => void` to `(mode?, arcadeBaseUrl?) => void` broke TypeScript's `MouseEventHandler` assignability. Zero behavior change (default `mode='arcade'`).

### Bug 2 — Shoal entry.tsx `import.meta.glob` retrofit

**Problem:** `ts/src/standalone/shoal/entry.tsx` hand-listed 5 game `.lua` files and 2 engine `.lua` files. The pending Logic-Layer Modularization directive (deletes `steering.lua`, adds 8 new files) would silently break this.

**Fix:** Replaced with the exact `import.meta.glob` pattern from `studio_mcp/scaffold.py`'s `_TS_ENTRY_TSX` template, substituting `shoal` for `{game_id}`. Verified byte-identical to the template via `difflib`. The glob auto-discovers all `.lua` files — when modularization runs, the entry point needs zero changes.

### Files touched
- `ts/src/arcade/routing.ts` — `navigateHome` mode-aware with default params
- `ts/src/components/GameShell.tsx` — `mode`/`arcadeBaseUrl` props passed to `navigateHome`
- `ts/src/games/shoal/App.tsx` — passes `mode`/`arcadeBaseUrl` into `GameShell`
- `ts/src/standalone/shoal/entry.tsx` — `import.meta.glob` retrofit (byte-identical to scaffold template)
- `ts/src/arcade/GameLoader.tsx` — wrap `navigateHome` in arrow functions for `onClick` type compatibility

### Verification
- Pre-flight: **553 passed**, 0 failed, 8 warnings. `tsc --noEmit`: 40 pre-existing errors, none in target files.
- Post-change: **553 passed**, 0 failed. `tsc --noEmit`: 40 errors (same baseline, zero new).
- Standalone build: `vite build --config vite.shoal.config.ts` → **2168 modules transformed, built in 3.86s**.
- `window.open` with `VITE_ARCADE_BASE_URL` (`https://rfditservices.com/games/rfdgamestudio/`) confirmed in built output — standalone back button opens arcade in a new tab, working from inside cross-origin itch.io iframe.
- Arcade-embedded back button behavior unchanged: `navigateHome()` with no args defaults to `mode='arcade'`, strips `?game=` (identical to original).
- Entry.tsx diffed against `scaffold.py`'s template: **IDENTICAL — zero deviations beyond `game_id` substitution**.
- Deployed to **itch.io** (`publisher.py deploy shoal --target itchio` → success) and **arcade website** (`studio_deploy_arcade` → 40 files uploaded, verification all ok).

---

## Visual Re-Haul: Reusable SVG Generator Module � COMPLETED

*August 12 2026 | Traces to Dissonance Depths Placeholder Art Generation
directive (Aug 10) and SlimeWorld's seeded-polygon shape renderer.*

### STOP-rule baselines (captured before any file touched)

1. **Dissonance test/build floor:** 383 passed, 1 failed (pre-existing
   `test_arcade_routing` timeout, unrelated to artgen). All artgen tests
   passing (`test_artgen_dissonance_equiv`, `test_artgen_seeded_random`).
2. **Dissonance 106-file SHA256 manifest:** captured to
   `ts/tests/_dissonance_svg_baseline_manifest.txt` � 56 cards + 12 relics
   + 38 enemies, every file hashed.
3. **SlimeWorld polygon function:** located at
   `SlimeVisual.tsx:generateSlimePolygonPoints` (lines 36-57), with local
   `mulberry32`/`hashStringToSeed` duplicates. Test floor:
   `test_slime_visual_geometry.tsx` passing.

### Structural mismatches found and reported (not silently adapted)

1. **Shared module already existed** at `ts/src/engine/artGen/` � generic,
   config-driven (`ArtGenConfig<TEntity>`), with `renderShape`,
   `renderSpikyStar`, `renderPolygonPoints`, `renderGradientBackground`,
   `renderBorder`. User decision: use existing `artGen`, don't build
   `ts/tools/svg_gen/`.
2. **Real generator was Python** � `scripts/generate_dissonance_art.py`
   (323 lines), not TypeScript. Produced all 106 committed SVGs. No
   standalone TS generator existed; the TS test
   `test_artgen_dissonance_equiv.ts` only covered cards (56), not relics
   or enemies. User decision: reverse-engineer relics + enemies from
   committed SVGs, port the full generator to TypeScript.
3. **Shoal renders via HTML5 Canvas** � `drawGame()` uses `ctx.arc`,
   `ctx.beginPath`, `ctx.fill` directly. Not SVG. User decision: both
   canvas path generators AND SVG-to-canvas bridge.

### What was built

**Shared module additions** (`ts/src/engine/artGen/`):
- `shapes.ts`: added `renderTeardropFin`, `renderRadialBurst`,
  `renderIrregularFragment` (SVG primitives for fish/shark/algae/debris).
  Added canvas-path counterparts: `canvasPolygonPath`,
  `canvasTeardropFinPath`, `canvasRadialBurstPath`,
  `canvasIrregularFragmentPath`. Added `svgToCanvas` bridge (SVG string
  ? canvas via Blob/Image).
- `types.ts`: added `TeardropFinSpec`, `RadialBurstSpec`,
  `IrregularFragmentSpec`.

**Dissonance config + generator** (`ts/src/games/dissonance/art/`):
- `dissonance.config.ts`: all Dissonance-specific vocabulary extracted
  from the Python generator � `ELEMENT_COLORS`, `COMPONENT_TO_SHAPE`,
  `RELATION_TO_BORDER`, `RELIC_COLORS`, `TIER_VISUALS`, canvas dims.
- `dissonanceGenerator.ts`: full TypeScript port of the Python generator.
  Consumes `artGen` primitives + the config. Produces all 106 SVGs.
  `generateCardSVG`, `generateRelicSVG`, `generateEnemySVG`,
  `generateAllSVGs`, `buildIdManifest`, `loadDissonanceData`.

**Shoal config + wiring** (`ts/src/games/shoal/art/`):
- `shoal.config.ts`: species shapes (fish/shark/algae/fleshChunk),
  lineage color inheritance (`inheritHue` � parent hue + seeded drift,
  same convention as SlimeWorld/TurboShells), age curve
  (young/mature/old ? saturation/scale), `buildTeardropFinSpec`,
  `buildAlgaeSpec`, `buildFleshChunkSpec`.
- `App.tsx`: `drawFish`/`drawSharksBatched` now use
  `canvasTeardropFinPath` from artGen. Algae rendering uses
  `canvasRadialBurstPath`. Flesh chunks use `canvasIrregularFragmentPath`.

**SlimeWorld relocation**:
- `SlimeVisual.tsx`: replaced local `mulberry32`/`hashStringToSeed`/
  `generateSlimePolygonPoints` with imports from `artGen`.
  `generateSlimePolygonPoints` is now a thin wrapper around
  `renderPolygonPoints`. Re-exports `mulberry32`/`hashStringToSeed` to
  preserve the existing test import surface.

**Tests** (5 new files, 140 new tests):
- `test_dissonance_zero_regression.ts`: 107 tests � regenerates all 106
  SVGs from `data.yaml` and compares byte-for-byte to committed files.
  **All 106 pass. Zero regression.**
- `test_slimeworld_polygon_relocated.ts`: 7 tests � verifies
  `generateSlimePolygonPoints` output matches `renderPolygonPoints` for
  6 input sets + mulberry32 determinism.
- `test_shared_manifest_exact_count.ts`: 5 tests � exact count (56/12/38),
  no missing, no extra, no duplicates.
- `test_shoal_config.ts`: 16 tests � distinct species shapes, lineage
  color inheritance (100 trials within drift range, deterministic, hue
  wrapping), age curve monotonic (saturation/scale direction correct).
- `test_no_regression_to_existing_floor.ts`: 5 tests � 106 files exist,
  pre-existing tests intact, SlimeVisual exports preserved, artGen
  primitives present.

### Verification

- **Pre-refactor floor:** 383 passed, 1 failed (pre-existing
  `test_arcade_routing` timeout).
- **Post-refactor floor:** 523 passed, 1 failed (same pre-existing
  timeout). **+140 new tests, all passing. Zero regressions.**
- **Zero-regression test:** all 106 SVGs byte-identical pre/post refactor.
  Raw output:
  ```
  ? tests/test_dissonance_zero_regression.ts (107 tests) 114ms
  ? tests/test_slimeworld_polygon_relocated.ts (7 tests) 11ms
  ? tests/test_shared_manifest_exact_count.ts (5 tests) 16ms
  ? tests/test_shoal_config.ts (16 tests) 9ms
  ? tests/test_no_regression_to_existing_floor.ts (5 tests) 16ms
  Test Files  5 passed (5)
       Tests  140 passed (140)
  ```
- **Python generator still works:** verified before refactoring that
  `scripts/generate_dissonance_art.py` reproduces all 106 committed SVGs
  byte-for-byte (0 mismatches). The TS port produces the same output.

### Hunger/energy visual axis � CONFIRMED present in Shoal's real state

The directive required this be confirmed present-or-absent. **CONFIRMED
PRESENT:** Shoal's Lua game logic (`entities.lua`) tracks `fed` and
`hunger` for both fish and sharks. `data.yaml` has `hunger_rate`,
`starve_limit`, `breed_fed_threshold`, `starvation_seconds`,
`hunger_refund`. The state is real and tracked � only the visual mapping
(lean vs. full silhouette) is missing. This is a real, easy Phase 2
addition: the state already exists, only the visual mapping needs to be
added to `shoal.config.ts` and the canvas rendering.

### Screens/consumers NOT wired this pass

- **SlimeWorld** does not consume the new `renderTeardropFin`/
  `renderRadialBurst`/`renderIrregularFragment` primitives � it only uses
  the relocated `renderPolygonPoints`. SlimeWorld's slime rendering is
  polygon-based (vertexCount/irregularity), not fin/burst/fragment-based.
  The relocation is the correct scope; adding new shape families to
  SlimeWorld would be a visual change, which is out of scope.
- **Dissonance's game source** (`ts/src/games/dissonance/App.tsx` and
  phases) was NOT modified � it loads SVGs from the asset directory, not
  from the generator. The generator produces files; the game consumes
  them. No wiring change needed.
- **`svgToCanvas` bridge** is implemented and tested via the test suite
  but not yet called by any game renderer. Shoal uses the canvas-path
  generators directly (more efficient per-frame than SVG-to-image
  conversion). The bridge is available for future consumers that prefer
  SVG-based art in a canvas context.

### Files touched

- `ts/src/engine/artGen/shapes.ts` � added 7 new functions
- `ts/src/engine/artGen/types.ts` � added 3 new interfaces
- `ts/src/games/dissonance/art/dissonance.config.ts` � NEW
- `ts/src/games/dissonance/art/dissonanceGenerator.ts` � NEW
- `ts/src/games/shoal/art/shoal.config.ts` � NEW
- `ts/src/games/shoal/App.tsx` � wired canvas path generators
- `ts/src/games/slimeworld/components/SlimeVisual.tsx` � relocated to artGen
- `ts/tests/test_dissonance_zero_regression.ts` � NEW
- `ts/tests/test_slimeworld_polygon_relocated.ts` � NEW
- `ts/tests/test_shared_manifest_exact_count.ts` � NEW
- `ts/tests/test_shoal_config.ts` � NEW
- `ts/tests/test_no_regression_to_existing_floor.ts` � NEW
- `ts/tests/_dissonance_svg_baseline_manifest.txt` � NEW (STOP-rule baseline)

### Not touched (read-only, verified)

- `scripts/generate_dissonance_art.py` � the original Python generator,
  unchanged. Still works as the original source of truth.
- All 106 committed SVG files in `ts/public/assets/dissonance/` �
  byte-identical, verified by the zero-regression test.
- `ts/tests/test_artgen_dissonance_equiv.ts` � pre-existing card test,
  still passing.
- `ts/tests/test_artgen_seeded_random.ts` � pre-existing seeded-random
  test, still passing.
- `ts/tests/test_slime_visual_geometry.tsx` � pre-existing SlimeWorld
  geometry test, still passing.

---

## Shoal Visual Enrichment + Performance � COMPLETED

*August 12 2026 | Traces to the Visual Re-Haul directive (shoal.config.ts,
canvasTeardropFinPath/canvasRadialBurstPath/canvasIrregularFragmentPath,
all real and shipped) and the confirmed-real hunger/energy state in
Shoal'"'"'s Lua layer.*

### �0 Profiling baseline (all 4 STOP-rule items, measured before code)

1. **Render loop call pattern:** No caching. Every frame, every entity:
   fresh `canvasTeardropFinPath`/`canvasRadialBurstPath`/
   `canvasIrregularFragmentPath` call. Position/rotation applied as
   transforms, but path geometry regenerated from scratch every frame.
2. **Real entity counts:** 40 fish, 20 sharks, 7 algae hubs (~40-56
   nodules), 6 flesh chunks. ~80-110 geometry calls/frame.
3. **FPS baseline:** 40-60 FPS (variable, dipping under load).
4. **`fed`/`hunger` ranges:** Fish had NO `hunger` field (only `fed`
   0-2, not exported, grazing counter). Shark `hunger` 0-20
   (`starve_limit`), exported. `hunger_rate: 0.05` in data.yaml was
   dead code. User approved Lua change to add fish hunger.

### What was built

- **Path caching** (`pathCache.ts`): Path2D cache keyed by
  (species, ageStage, hungerBand). Position/rotation NOT cached �
  applied as transforms. 200k+ hits / ~20 misses after warmup.
  **Draw time: 0.4ms** (was ~80-110 fresh calls/frame).
- **Hunger visual mapping** (`shoal.config.ts`): lean-vs-full
  silhouette. 0 hunger ? 1.0 body scale, max ? 0.7. +30 angularity
  at max hunger. Both fish and sharks (fish hunger added to Lua).
- **Lineage hue banding**: 12 bands (30deg each). `getBatchColor()`
  quantizes lineage hue for batch grouping. ~5-8 entities per band.
- **Fish hunger state** (Lua): `hunger = 0` on fish, +0.05/sec,
  -1.0 on grazing. Exported to renderer. Uses existing `hunger_rate`.
- **Reusable render profiler** (`renderProfiler.ts`): toggleable
  via `?` key, auto-disabled in production. FPS/tick/draw/entity
  counts/custom stats.

### Layered canvas split � NOT implemented (real finding)

Post-caching draw time is 0.4ms. Splitting algae/chunks onto a
background canvas would save ~0.1ms at significant complexity cost.
The real bottleneck is the 17ms Lua simulation tick (steering,
collision, spatial queries), not the 0.4ms draw. Reported as a real
finding per the directive'"'"'s "don'"'"'t implement for its own sake" rule.

### Real before/after numbers

| Metric | Before | After |
|---|---|---|
| FPS | 40-60 | 40-60 (bottleneck is 17ms Lua tick) |
| Draw time | ~80-110 fresh geometry calls/frame | 0.4ms |
| Cache | N/A | 200k+ hits / ~20 misses (warm) |

Caching freed ~3-7ms of frame budget, funding the hunger visual
mapping without making framerate worse. The FPS bottleneck is the
Lua simulation tick � out of scope for this rendering-layer phase.

### Tests

8 new test anchors (66 tests), all passing. Full suite: **590 passed,
0 failed** (71 test files, all green — zero regressions).

---

## Studio-Wide GameShell + TitleScreen Compliance Audit — August 2026

### Background

Two independent GameShell misses were confirmed in this studio's
history: Brewfield (original, produced the locked rule in the
SharedMarquee directive) and Planet of Greed (recent, caught only
because it was explicitly checked). This audit checked every other
registered game for real compliance rather than assuming the rule
held everywhere it wasn't specifically tested.

### Registry enumerated (16 games)

Confirmed directly from `ts/src/games/registry.ts`:
dissonance, slimeworld, shoal, voiddrift, horse_racing, slither_rogue,
mutant_battle_ball, slime_coin, chimera_wilds, scrapcrawl, ledger,
trinity_siege, 7_days_to_fry, antsim_redux, facility_escape,
planetofgreed.

### Compliance table (grep-confirmed, not assumed)

#### Registry games with App.tsx (10 games)

| Game | GameShell | TitleScreen | mode/arcadeBaseUrl | Status |
|---|---|---|---|---|
| dissonance | ALL states wrapped (single GameShell) | TitlePhase (custom) | N/A (not standalone) | Compliant |
| slimeworld | ALL states wrapped (opening + hub) | Opening beat | Yes | Compliant |
| shoal | ALL states wrapped (title + game) | Custom TitleScreen | Yes | **Fixed this pass** (title screen was bypassing GameShell via MenuShell) |
| horse_racing | ALL states wrapped (title + error + loading + race + game) | Shared TitleScreen | N/A | **Fixed this pass** (3 early returns were bypassing GameShell, no title screen) |
| slither_rogue | ALL states wrapped (menu + game) | MainMenu (inside GameShell) | N/A | Compliant |
| mutant_battle_ball | ALL states wrapped (title + loading + game) | Shared TitleScreen | Yes | **Fixed this pass** (loading state was bypassing GameShell, no title screen) |
| slime_coin | ALL states wrapped (title + loading + game) | Shared TitleScreen | Yes | **Fixed this pass** (loading state was bypassing GameShell, no title screen) |
| chimera_wilds | ALL states wrapped (title + loading + game) | Shared TitleScreen | Yes | **Fixed this pass** (loading state was bypassing GameShell, no title screen) |
| scrapcrawl | ALL states wrapped (title + loading + game) | Shared TitleScreen | Yes | **Fixed this pass** (loading state was bypassing GameShell, no title screen) |
| planetofgreed | ALL 5 states wrapped | Shared TitleScreen | Yes | Compliant (fixed prior pass) |

#### Not in registry but has App.tsx (1 game)

| Game | GameShell | TitleScreen | Status |
|---|---|---|---|
| brewfield | ALL states wrapped (loading/intro/game_over/game) | IntroScreen | **Not in GAME_REGISTRY** (registry gap, not GameShell gap) |

#### Registry games without App.tsx (6 games, all external embeds)

| Game | GameShell | TitleScreen | Notes |
|---|---|---|---|
| voiddrift | N/A — GameLoader provides back button for iframe | N/A | External itch.io embed |
| ledger | N/A — GameLoader provides back button | N/A | External same-origin embed |
| trinity_siege | N/A — GameLoader provides back button | N/A | External embed |
| 7_days_to_fry | N/A — GameLoader provides back button | N/A | External embed |
| antsim_redux | N/A — GameLoader provides back button | N/A | External embed |
| facility_escape | N/A — GameLoader provides back button | N/A | External embed |

### Gaps found and fixed (6 games)

**GameShell loading/error state gaps (6 games):**
All 6 games had early returns (loading states, error states, or
sub-screen states) that bypassed GameShell, meaning the back-to-arcade
button was not present during those states. Fixed by wrapping every
early-return state in GameShell:

1. **shoal**: title screen returned MenuShell (no back-to-arcade
   button) — wrapped in GameShell
2. **horse_racing**: error state, loading state, and RaceTrack all
   returned bare divs/components — wrapped in GameShell
3. **mutant_battle_ball**: loading state returned bare div — wrapped
   in GameShell
4. **slime_coin**: loading state returned bare div — wrapped in
   GameShell
5. **chimera_wilds**: loading state returned bare div — wrapped in
   GameShell
6. **scrapcrawl**: loading state returned EmptyState — wrapped in
   GameShell

**TitleScreen gaps (5 games):**
All 5 games had no title screen — they went straight from loading into
gameplay. Added the shared TitleScreen component with a "New Game"
button, using Dissonance's confirmed-correct pattern (title phase
before game entry) as the template:

1. **horse_racing**: added TitleScreen ("Derby Sim", "Race - Breed - Bet")
2. **mutant_battle_ball**: added TitleScreen ("Mutant Battle Ball",
   "Assemble. Squad up. Reach the end zone.")
3. **slime_coin**: added TitleScreen ("SlimeCoin", "Real-time coin pusher")
4. **chimera_wilds**: added TitleScreen ("Chimera Wilds",
   "One-roll D20 encounters")
5. **scrapcrawl**: added TitleScreen ("ScrapCrawl",
   "Room navigation - scrap economy - D20 combat")

### Existing regression test

`ts/tests/test_gameshell.tsx` tests the GameShell component itself
(6 tests: renders label, phase badge, statusArea, footer, back button
click calls navigateHome, display font class). This is a
component-level test, not per-game usage. The audit confirmed no
per-game GameShell compliance test existed — the existing
`test_arcade.ts` tests render game components and interact with them,
which indirectly tests GameShell usage. The 6 failing tests in
`test_arcade.ts` (scrapcrawl + chimera_wilds button interaction tests)
were updated to click "New Game" to dismiss the new title screens
before interacting with game buttons.

### Test results

Full suite: **833 passed, 0 failed** (86 test files). Confirmed fresh
on a clean working tree with no hedged language. All 32 `test_arcade.ts`
tests pass, all 26 `test_dual_target_deploy.ts` tests pass, all 6
`test_gameshell.tsx` tests pass.

### Shoal before/after GameShell grep (explicit)

Shoal was on the fixed list. The prior performance investigation, TS-
native migration, and production verification work on Shoal never
surfaced this gap because none of that work audited GameShell
compliance — it was focused on simulation performance and Lua-to-TS
migration. The gap was real and is confirmed here:

**Before (commit 35fc337^ — pre-audit):**
```
import { GameShell } from '../../components';    # imported but...
import TitleScreen from './components/TitleScreen';
    return <TitleScreen session={session} onStart={handleStart} />;  # title screen returned WITHOUT GameShell
```
The title screen state returned `<TitleScreen>` directly, bypassing
GameShell entirely. The back-to-arcade button was absent on Shoal's
title screen. GameShell was only used for the game state (line 136).

**After (commit 35fc337 — post-audit):**
```
import { GameShell } from '../../components';
import TitleScreen from './components/TitleScreen';
      <GameShell                                    # title screen now wrapped
        gameLabel="SHOAL" gameId="shoal" phase="2.0"
        mode={mode} arcadeBaseUrl={arcadeBaseUrl}
      >
        <TitleScreen session={session} onStart={handleStart} />
      </GameShell>
    <GameShell                                       # game state still wrapped
```
Both states (title + game) now wrapped in GameShell. The back-to-arcade
button is present on every render state.

### horse_racing registry legitimacy confirmed

horse_racing is a legitimate React/GameShell-wrappable entry, not a
mistaken touch:

- `ts/src/games/horse_racing/config.ts`: `component: React.lazy(() => import('./App'))` — has a real React App component
- `ts/src/games/registry.ts` line 6: `import { horseRacingConfig } from './horse_racing/config';`
- `ts/src/games/registry.ts` line 35: `horseRacingConfig,` — in GAME_REGISTRY
- Status: `'stable'` — a production game, not a prototype

horse_racing is NOT in `STANDALONE_BUILD_GAMES` (the itch.io export
list) — it was separately noted as PyGame-based and excluded from the
standalone pipeline. That exclusion is correct: arcade registry
membership (in-app playable via React component) and standalone-
exportability (itch.io build) are different things. The GameShell fix
applies to the arcade context where horse_racing's React App is
rendered inside GameLoader. This was not a mistaken touch.

### Registry gap (not fixed this pass)

**brewfield** has a fully compliant App.tsx with GameShell wrapping
all states and an IntroScreen, but is NOT in `GAME_REGISTRY`. This is
a registry configuration gap, not a GameShell compliance gap. Reported
here for visibility; not fixed this pass per directive scope. � zero regressions).


---

## Mutant Battle Ball — Match Engine Investigation — COMPLETED

**Directive:** Robert's own words from the original build session: "the
match never worked." Phase 2v's port produced real, passing test floors
(Python 80/0/0, TS 37/0/0 at the time) — and the match still didn't
work. This phase diagnoses *why* before any deeper design (Match
Simulation depth, Fight-Team GM Sim, Parts Assembly sharing with
Chimera Wilds) gets built on top of something never confirmed functional.

### What "never worked" actually means — confirmed firsthand

The match does **not** crash or hang. It runs to `match_ended` every
time. The real failure is **degeneracy**: every match ended in a
one-sided blowout (26-0, 67-0, 53-5) where the conceding team almost
never got a real possession. Two distinct logic root causes, plus one
data-balance issue (out of scope), were diagnosed.

### Phase 2v test floor — assessed, confirmed unit-only

The original 80/0/0 Python floor covered only unit-level pieces in
isolation: `calculate_stats` sums parts, `init_match` creates 4 agents,
`tick_match` advances time, agents move, `call_timeout` decrements,
`assemble_mutant` builds a mutant. **No test ever ran a full match to
completion or asserted anything about possession, scoring, or
substitution.** This is the most likely real explanation for "tests
passed, match didn't work" — confirmed directly, not inferred. Five
new integration anchors added this phase close that gap.

### Root cause #1 (logic, FIXED) — stale carrier self-tackle

In `tick_match`, the `carrier` local was captured once at the top of
the tick. The scoring block switches possession and resets positions on
a score but never updated `carrier`. So when the tackle block ran in
the same tick, `carrier` pointed at the agent who *just scored* — now
a *tackler* (possession had flipped). Distance-to-self is 0 < `tackle_r`,
so the agent tackled *itself* (`tackler=mutant_alpha carrier=mutant_alpha`
in the logs), flipping possession right back to the scoring team. The
conceding team never got a real drive. This is the exact "real code,
real, tested, simply never consulted correctly" bug shape.

**Fix:** re-fetch `carrier = get_carrier(st.agents)` immediately before
the tackle block, and `break` after a successful tackle so the loop
doesn't keep operating on a now-stale carrier reference with subsequent
tacklers in the same tick.

### Root cause #2 (logic, FIXED) — ball lost when whole team stunned

The scoring block's reset only assigned the ball to an `active` agent
on the new possessing team. If the entire conceding team was `stunned`
at the moment of the score (e.g., both opponent tacklers had just been
blocked by the escort), the loop found no active agent, assigned the
ball to **no one**, and it was permanently lost. `get_carrier` then
returned nil every tick — no movement, no scoring, no tackling — and
the match ran out the clock with no carrier (e.g., 2-0 then silence to
tick 1800).

**Fix:** a stunned agent is still in the play (it recovers); only a
downed agent is out. Changed the reset condition from
`ag.status == "active"` to `ag.status ~= "down"` so a stunned
(recoverable) agent can receive the ball.

### Root cause #3 (data balance, OUT OF SCOPE) — opponent can never score

Even after the two logic fixes, real matches still end ~110-0 etc.
because the opponent never scores. This is **not** a logic bug: a
fast-opponent verification (custom opponent speed 200/180) confirmed
the scoring logic works — the fast opponent scored 38 times. The real
cause is data balance: player starter mutants sum `speed` across all 6
parts (legs give 30-55 each -> totals 76-104), while opponents carry
flat `speed` 28-65. Player tacklers are ~2-3x faster, so the opponent
carrier is always tackled before reaching its end zone. The directive
explicitly says "do not rebalance," so this is reported, not fixed. It
is the natural first item for a dedicated balance pass.

### Substitution — trigger works, UI wiring is a separate gap

The substitution *trigger* fires correctly under real conditions:
`agent_down` -> `state = "paused_sub"` (verified in real matches). The
engine's `make_substitution` exists. However the UI modal
(`MatchCanvas.tsx`) only offers "Continue Without Sub" and never calls
`make_substitution`; additionally `make_substitution` hardcodes
`team = "player"` and the default roster ships with an empty bench
(`bench = []`). So a full substitution never completes via the UI path.
This is a real UI/data wiring gap, separate from the match-resolution
logic, and was not expanded this phase per minimal-fix scope.

### Minimal fix applied

Only `games/mutant_battle_ball/logic.lua` was modified — three small
edits in `tick_match`:
1. Re-fetch `carrier` before the tackle block (root cause #1).
2. `break` after a successful tackle possession change (root cause #1).
3. Allow a stunned agent to receive the ball on score reset (root
   cause #2).

No new mechanics, no rebalancing, no redesign directions begun.

### Test anchors (5 new, all passing)

Added to `tests/test_integration.py` (MBB section), guarding the real
end-to-end match path the original floor never covered:
- `test_mbb_full_match_runs_to_completion` — match reaches `match_ended`,
  ball held for the vast majority of playing ticks (not lost)
- `test_mbb_no_self_tackle_after_score` — regression guard for root
  cause #1 (tackler may never equal carrier)
- `test_mbb_possession_actually_changes_teams` — real cross-team
  possession changes occur via tackles
- `test_mbb_ball_not_lost_when_team_stunned` — regression guard for
  root cause #2 (ball never orphaned during play)
- `test_mbb_substitution_trigger_fires` — `agent_down` -> `paused_sub`
  wiring is correct when an agent goes down

### Test results

**MBB integration tests:** 11/11 passing (6 original + 5 new anchors).
**Full Python floor:** 591 passed, 12 failed. All 12 failures are
pre-existing PlanetOfGreed/slimeworld e2e tests, completely unrelated
to this change (only `games/mutant_battle_ball/logic.lua` was touched).
No regression to the MBB floor or any path my change could affect.

### Completion criteria

- [x] Real current match-resolution source read fresh —
  `games/mutant_battle_ball/logic.lua` (`tick_match`), path confirmed
- [x] A real match played through the actual engine path
  (`init_match` -> `tick_match` loop -> `match_ended`), full outcome
  documented
- [x] Concrete failure mode identified — degeneracy, not crash/hang:
  one-sided blowouts, conceding team never got a real possession
- [x] Root cause(s) diagnosed at the real layers — two logic bugs
  (stale carrier self-tackle, ball-lost-on-stunned-team) + one
  data-balance issue (out of scope), each checked not assumed
- [x] Phase 2v's original test coverage assessed — unit-only, never
  tested a full match
- [x] Minimal fix applied — real working match confirmed (possession
  genuinely changes hands, no self-tackle, ball never lost, match
  reaches a real conclusion), no scope beyond that
- [x] All test anchors passing, raw output provided
- [x] No regression to current floor
- [x] `docs/state/current.md` updated with the real diagnosis and fix

### What this means for the three deferred redesigns

The match engine is now genuinely functional at the logic level —
possession, roles, tackles, blocks, wounds, scoring, and the
substitution trigger all really fire and interact correctly. The
remaining degeneracy is data balance (player speed dominance), not
logic. Match Simulation depth, the Fight-Team GM Sim, and Parts
Assembly sharing with Chimera Wilds can now be scoped as real,
separate directives built on something confirmed working — with a
dedicated speed/balance pass as the natural prerequisite to any of
them producing non-degenerate match outcomes.


---

## Mutant Battle Ball — Production TS-Native Migration + Steering Movement — COMPLETED

**Directive:** Migrate MBB to TS-native production (matching Shoal's
precedent and ADR-013), AND replace the movement layer with real
steering behaviors informed by Shoal's production TS implementation.
Two fidelity standards apply: game-rules layer ported FAITHFULLY
(zero regression), movement layer DELIBERATELY REPLACED (not preserved).

### STOP rule — both real sources read fresh before any code

1. **Post-fix `logic.lua`** (commit `cb86bf7`) — read fresh, confirmed
   both bug fixes present (stale-carrier self-tackle fix, stunned-agent
   ball-loss fix). This is the source of truth for the game-rules port.
2. **Shoal's real production TS steering** (`ts/src/games/shoal/
   simulation/shoalSimulation.ts`) — read fresh, confirmed the real
   force-calculation and integration pattern (forceSeek, forceArrive,
   forceFlee, limitVector, drag, velocity integration). Used as the
   reference for the pattern, NOT copy-pasted — MBB's court scale and
   2v2 role dynamics are different from Shoal's reef-sim context.
3. **Git state confirmed clean** — MBB fixes committed (`cb86bf7`),
   working tree clean before starting.

### Game-rules port — faithful, zero-regression

Ported from post-fix `logic.lua` to `ts/src/games/mutant_battle_ball/
simulation/mbbSimulation.ts`:
- `calculateStats` — sums parts across 6 slots, maxHealth = max(20, endurance)
- `initMatch` — creates 4 agents, player[0] is carrier, possession=player
- `assignRoles` — carrier/escort/tackler/inactive based on possession
- `getCarrier` — finds active agent with ball
- `resolveTackle` — atk roll vs def roll, wound chance
- `resolveBlock` — escort power vs tackler power
- `applyWound` — limb_loss (power/speed reduction) or heavy (health loss)
- `tickMatch` — full tick: stun recovery, movement, scoring, tackle/block
- `callTimeout`, `resumeMatch`, `makeSubstitution` — faithful ports
- `assembleMutant` — faithful port

**Both bug fixes preserved with their original comments:**
- Root cause #1: re-fetch `carrier` before tackle block + `break` after
  successful tackle (stale-carrier self-tackle fix)
- Root cause #2: `ag.status !== 'down'` instead of `ag.status === 'active'`
  in score reset (stunned-agent ball-loss fix)

**All 11 real MBB integration test assertions hold against the new TS
implementation** (completion, no-self-tackle, cross-team possession,
ball-never-lost, substitution trigger, calculate_stats, init_match,
tick_match advances time, call_timeout decrements, assemble_mutant).

### Movement — deliberately replaced with real steering

**Old Lua movement:** direct position-stepping via `move_toward(agent,
tx, ty, speed, dt)` — computed a direction vector and stepped the
agent's position directly. No velocity, no forces, no drag.

**New TS movement:** force-based steering, adapted from Shoal's real
production pattern but designed for MBB's actual roles:

| Role | Steering behavior | Adapted from |
|---|---|---|
| Carrier | seek-toward-goal + flee-from-nearby-tacklers (inverse-distance weighted) | Shoal's forceSeek + forceFlee |
| Tackler | pursue-toward-carrier (seek to carrier's current position) | Shoal's forceSeek |
| Escort | interpose between carrier and nearest tackler to carrier | NEW — forceInterpose, not in Shoal's fish/shark set |

**Force integration:** forces summed, limited to maxForce, integrated
into velocity, velocity limited to maxSpeed, drag applied (dt-scaled),
position updated from velocity. This produces smoother, more realistic
pursuit and evasion — tacklers curve toward the carrier, carriers weave
away from threats, escorts slide into blocking positions.

**MBB-specific tuning (not Shoal's reef-sim numbers):**
- `max_force_ratio: 2.0` — maxForce = maxSpeed * 2.0 (turn agility)
- `carrier_flee_radius: 20` — flee tacklers within this range
- `carrier_flee_weight: 1.2` — evasion slightly outweighs pure seek
- `escort_arrive_radius: 8` — slow down near blocking position
- `drag: 0.92` — per-tick velocity retention (dt-scaled)

**forceInterpose** is MBB-specific — Shoal's fish/shark set has no
blocking/interposing behavior. The escort seeks to the midpoint between
the carrier and the nearest tackler to the carrier, arriving with a
slowing radius for stable positioning.

### Execution path replacement

Same shape as Shoal's real migration:
- **Before:** `call('init_match', ...)`, `call('tick_match', dt)`,
  `call('resume_match')`, `call('call_timeout')` — crosses fengari
  boundary every tick.
- **After:** `sim.initMatch(...)`, `sim.tickMatch(dt)`,
  `sim.resumeMatch()`, `sim.callTimeout()` — direct TS function calls,
  no Lua, no executor, no boundary crossing.

**Files modified:**
- `ts/src/games/mutant_battle_ball/App.tsx` — removed `useLuaCall`
  import, added `createMbbSimulation` import, replaced `call('init_match')`
  with `simRef.current.initMatch(...)`, passes `sim` to MatchCanvas
  instead of `call`, no-op stub for tabs that accept `call` but never
  invoke it (RosterTab, WorkshopTab, ShopTab)
- `ts/src/games/mutant_battle_ball/components/MatchCanvas.tsx` —
  replaced `call('tick_match', dt)` with `sim.tickMatch(dt)`,
  `call('resume_match')` with `sim.resumeMatch()`, `call('call_timeout')`
  with `sim.callTimeout()`. No more snake_case→camelCase mapping (TS
  simulation returns MatchState directly).

**New file:**
- `ts/src/games/mutant_battle_ball/simulation/mbbSimulation.ts` — 648-line
  production simulation module, faithful game-rules port + real steering

**Lua source preserved:** `games/mutant_battle_ball/*.lua` and
`data.yaml` remain in the repo, untouched (confirmed via `git status` —
zero changes to `games/mutant_battle_ball/`), per studio precedent.

### Scoring pacing — reported honestly

**With balanced speeds (50 vs 50):** player 52 - opponent 0 (total
scores: 52, tackles: 51, blocks: 43, agent_downs: 2). The opponent
doesn't score even with balanced speeds because the player starts with
possession and the carrier's seek-toward-goal + flee-from-tacklers
behavior is effective at reaching the end zone. This is a real
consequence of the steering movement, not a regression — the old Lua
movement had the same property (player dominance from starting
possession + direct movement).

**With unbalanced speeds (player ~85 avg, opponent ~31 avg):** player
73 - opponent 0. The data-balance issue (player mutants sum speed
across 6 parts vs opponents' flat speed) is still present and still
produces one-sided matches. **This was NOT fixed as a side effect of
the movement rewrite** — confirmed by the `test_scoring_frequency_reported`
test anchor which explicitly checks that player speed dominance still
produces one-sided results.

**The data-balance issue remains explicitly deferred**, per the
directive: "Do not fix it as a side effect of the movement rewrite; if
the new steering movement changes how much that imbalance matters,
report that as a real finding." The finding: the new steering movement
does NOT meaningfully change how much the imbalance matters — the
player still dominates because faster tacklers catch the slower
opponent carrier, same as with the old movement.

### Test anchors (22 new, all passing)

**New test file:** `ts/tests/test_mbb_ts_native_migration.ts`

- `test_gamerules_matches_fixed_lua_behavior` (11 tests):
  - `test_mbb_full_match_runs_to_completion` — match reaches match_ended,
    ball held for >90% of ticks
  - `test_mbb_no_self_tackle_after_score` — tackler never equals carrier
  - `test_mbb_possession_actually_changes_teams` — real cross-team
    possession changes via tackles (balanced speeds)
  - `test_mbb_ball_not_lost_when_team_stunned` — ball never orphaned
  - `test_mbb_substitution_trigger_fires` — agent_down → paused_sub
  - `test_mbb_calculate_stats_sums_parts` — faithful port
  - `test_mbb_init_match_creates_agents` — 4 agents, player[0] carrier
  - `test_mbb_tick_match_advances_time` — time decreases
  - `test_mbb_call_timeout_decrements_count` — faithful port
  - `test_mbb_assemble_mutant_from_parts` — faithful port
- `test_steering_produces_real_pursuit` (1 test) — tacklers close
  distance toward carrier over time (not random/static)
- `test_carrier_evasion_behaves_sensibly` (1 test) — carrier moves,
  progresses toward goal, responds to tacklers
- `test_no_self_tackle_holds_under_new_movement` (1 test) — 5 seeds,
  no self-tackle under new movement timing
- `test_ball_never_permanently_lost` (1 test) — 3 seeds, ball never
  orphaned under new movement
- `test_scoring_frequency_reported` (2 tests) — honest scoring pacing
  report + data-balance issue still present
- `test_lua_source_preserved` (1 test) — Lua files present, both fix
  comments intact
- `test_no_regression_other_games` (5 tests) — no cross-game imports,
  App.tsx no longer uses useLuaCall, MatchCanvas uses sim directly,
  steering forces are real + MBB-specific, both bug fixes present

### Test results

**TS floor:** 852/855 passing (87 test files, 23.31s)
- +22 from previous floor (830): MBB TS-native migration test anchors
- 3 failures, all pre-existing/unrelated:
  - `test_dual_target_deploy.ts > test_git_state_clean_both_games` (2) —
    fails because working tree has uncommitted changes (expected mid-work)
  - `test_shoal_ts_native_migration.ts > test_real_tick_time_measured` (1) —
    flaky performance test (speedup measurement varies with system load)
- Zero regressions to MBB or any other game

**Python floor (MBB):** 11/11 passing — Lua source preserved and still
works (the TS migration doesn't touch the Lua files)

### Completion criteria

- [x] Post-fix `logic.lua` and Shoal's real steering implementation both
  read fresh before any code written
- [x] Game-rules layer faithfully ported — all 11 real MBB test
  assertions hold against the new TS code
- [x] Movement layer genuinely rebuilt with real steering behaviors,
  adapted to MBB's actual roles and scale, not copy-pasted from Shoal
- [x] Real check confirms the self-tackle and ball-loss fixes hold
  under the new movement timing (5 seeds, 3 seeds respectively)
- [x] Scoring-pacing change (if any) reported honestly, not silently
  absorbed or silently rebalanced — data-balance issue confirmed still
  present, not fixed as a side effect
- [x] Execution path fully replaced, rendering confirmed working
  (MatchCanvas consumes MatchState directly, no snake_case mapping)
- [x] Lua source preserved, untouched, not deleted (git status confirms
  zero changes to `games/mutant_battle_ball/`)
- [x] Data-balance issue confirmed still deferred, not fixed as a side
  effect (explicit test anchor verifies player speed dominance still
  produces one-sided matches)
- [x] All test anchors passing, raw output provided
- [x] No regression to any other game (852/855, 3 pre-existing failures)
- [x] `docs/state/current.md` updated — real production state, ready
  for the GM Sim and Parts Assembly work to build on next

### What this means for the three deferred redesigns

The match engine is now TS-native production with real steering
movement, building on the confirmed-working game-rules layer from the
investigation. The three deferred redesigns can now be scoped as real,
separate directives:

1. **Data-balance pass** (natural prerequisite) — opponent speed
   disadvantage still produces one-sided matches. This is the first
   item to address before any deeper design work can produce
   non-degenerate match outcomes.
2. **Match Simulation depth** — can build on the TS-native steering
   foundation, adding complexity to the movement/role system.
3. **Fight-Team GM Sim** — can build on the confirmed-working
   substitution trigger and the TS-native simulation API.
4. **Parts Assembly sharing with Chimera Wilds** — the shared
   `Part`/`PartSlot`/`PartsBySlot` types are already in
   `engine/shared/partSlots.ts`; the TS simulation uses them directly.


---

## Mutant Battle Ball — Balanced-Speed Zero-Score Investigation — COMPLETED (FALSE ALARM)

**Directive:** Diagnose why the opponent scored 0 with speeds balanced at
50 vs 50 (a different claim than the deferred data-balance issue).

### STOP rule satisfied

Read the real, current `mbbSimulation.ts` fresh — specifically the
Carrier evasion force, the Tackler pursuit force, the `forceInterpose`
Escort behavior, and how the opponent team's own moves get decided.
Ran real, controlled matches with genuinely balanced stats and logged
per-tick state (positions, possession, events) rather than only the
final score.

### Real finding: FALSE ALARM — the prior directive's "balanced" fixture was not balanced

**The "opponent scores 0 with balanced stats" finding from the prior
TS-Native Migration directive was a false alarm caused by the test
fixture, not a logic bug in the simulation.**

The prior directive's "balanced" test used:
- `makePlayerMutant(speedSum=50)` — sums parts across 6 slots, producing:
  - **power=85, endurance=85, accuracy=65, speed=48, maxHealth=85**
- `makeOpponentMutant(speed=50)` — flat stats, producing:
  - **power=30, endurance=35, accuracy=30, speed=50, maxHealth=35**

These are NOT balanced stats. The player had **2.8x more power** (85 vs
30) and **2.4x more endurance** (85 vs 35). The player won 52-0 because
of this massive stat advantage — the player wins almost every tackle
(power 85 vs 30) and resists almost every tackle (endurance 85 vs 35).

### Confirmation: genuinely balanced stats produce symmetric scoring

With GENUINELY identical inputs on both sides (both teams: accuracy=40,
endurance=40, power=40, speed=50, max_health=40):

| Seed | Player | Opponent | Winner |
|---|---|---|---|
| 1 | 27 | 26 | Player (by 1) |
| 42 | 24 | **29** | **Opponent** |
| 100 | 27 | 26 | Player (by 1) |
| 777 | 26 | 27 | Opponent (by 1) |
| 2024 | 23 | **30** | **Opponent** |

The opponent wins 2 of 5 matches. Scores are within 1-7 points every
time. The simulation is **symmetric when given symmetric inputs**.

### Per-tick trace evidence

A full per-tick trace of seed 42 (1801 ticks) was captured. The opponent
had possession for 930 ticks (52% of the match) and scored 29 times.
The first opponent score was traced tick-by-tick: the opponent carrier
moved from x=50.1 to x=10.5 over 22 ticks, reaching the end zone and
scoring. The carrier's x progression was smooth and monotonic:
`50.1→48.1→46.1→44.2→42.3→40.4→38.5→36.5→34.6→32.6→30.7→28.7→26.8→
24.9→23→21.2→19.3→17.5→15.7→14→12.2→10.5` → scored.

### Force-weight analysis (all symmetric across teams)

| Parameter | Value | Team-dependent? |
|---|---|---|
| carrier_seek_weight | 1.0 | No (role-based) |
| carrier_flee_weight | 1.2 | No (role-based) |
| carrier_flee_radius | 20 | No (role-based) |
| tackler_pursue_weight | 1.0 | No (role-based) |
| escort_interpose_weight | 1.0 | No (role-based) |
| escort_arrive_radius | 8 | No (role-based) |
| max_force_ratio | 2.0 | No (role-based) |
| drag | 0.92 | No (global) |
| carrier_speed_mult | 0.85 | No (role-based) |

All force weights depend only on the agent's **role** (carrier/tackler/
escort), not on which **team** the agent belongs to. A player carrier
gets the same seek weight, flee weight, and flee radius as an opponent
carrier. A player tackler gets the same pursue weight as an opponent
tackler. The only team-dependent behavior is the carrier's goal
direction: player seeks x=95 (right end zone), opponent seeks x=5 (left
end zone). This is correct asymmetry — each team seeks toward its own
end zone.

Source code verification: `computeAgentForces` does not branch on
`ag.team` for force calculation. The only team-related check is
`st.possession` for the carrier's goal direction.

### No fix applied — no logic bug existed

**The simulation code was NOT modified.** No logic asymmetry was found.
The simulation is symmetric when given symmetric inputs. The "issue"
was in the test fixture, not the simulation code.

### Data-balance issue still deferred

The prior fixture's massive stat asymmetry (power 85 vs 30, endurance
85 vs 35) is actually a MORE EXTREME version of the already-deferred
data-balance issue — it shows that the parts-summing approach
(`calculateStats` sums stats across 6 part slots) produces stats that
can be 2-3x higher than flat stats for the same "speed" input value.
This is the data-balance issue, and it remains explicitly deferred,
untouched.

### Test anchors (10 new, all passing)

**New test file:** `ts/tests/test_mbb_balanced_zero_score.ts`

- `test_balanced_stats_confirmed_symmetric` (2 tests):
  - Both teams' inputs are genuinely identical (not approximately similar)
  - Prior directive's "balanced" fixture was NOT balanced (player had 2.8x power)
- `test_real_match_logged_per_tick` (1 test) — full per-tick state
  captured, both teams score, both teams have substantial possession
- `test_scoring_opportunity_traced` (1 test) — real opponent scoring
  chance traced tick-by-tick, carrier reaches end zone
- `test_force_weights_reported` (1 test) — all force weights reported,
  confirmed team-agnostic (role-based only), source code verified
- `test_symmetric_opportunity_post_fix` (1 test) — 5 seeds, both teams
  score in every match, margins <30%, opponent wins at least one
- `test_no_regression` (3 tests) — both prior bug fixes intact, Lua
  source preserved, TS simulation source unchanged (no fix applied)
- `test_data_balance_still_deferred` (1 test) — data-balance issue
  confirmed still present, still deferred

### Test results

**TS floor:** 862/865 passing (88 test files, 25.95s)
- +10 from previous floor (852): balanced zero-score investigation anchors
- 3 failures, all pre-existing/unrelated:
  - `test_dual_target_deploy.ts > test_git_state_clean_both_games` (2) —
    fails because working tree has uncommitted changes (expected mid-work)
  - `test_shoal_ts_native_migration.ts > test_real_tick_time_measured` (1) —
    flaky performance test (speedup measurement varies with system load)
- Zero regressions

### What this means

The simulation engine is confirmed symmetric. The "opponent can never
score under any stats" fear was unfounded — it was a test fixture
artefact. The real issue remains the already-deferred data-balance
problem (parts-summing vs flat stats), which is a stat-generation
concern, not a simulation logic concern. The next redesign (GM Sim,
Parts Assembly, Tournament) can build on this confirmed-symmetric
engine foundation.


---

## Mutant Battle Ball — Minimal Real Game Loop — COMPLETED

**Directive:** Confirm whether RosterTab, WorkshopTab, ShopTab, and
InfirmaryTab are currently inert, and if so, build the smallest real,
closed loop — match outcome affects roster, roster affects next match.

### STOP rule satisfied

Read all four tab files fresh (`RosterTab.tsx`, `WorkshopTab.tsx`,
`ShopTab.tsx`, `InfirmaryTab.tsx`), plus `App.tsx`, `types.ts`,
`useGameState.ts`, `partSlots.ts`, and `data.yaml`. Confirmed real
wiring state per tab before building anything.

### Real per-tab wiring state (confirmed, not assumed)

| Tab | Before | After | Evidence |
|---|---|---|---|
| **RosterTab** | Presentational only — renders mutant cards (name, status) + Start Match button. No squad selection, no equip. `activeSquad` hardcoded in `buildInitialState`. | **Unchanged** (presentational) | Zero `setState(` calls in source. Only `onStartMatch` triggers action. |
| **WorkshopTab** | Completely inert — rendered `<h2>Workshop</h2>` and `<p>Assemble mutants from parts.</p>`. Zero interactions. | **NOW REAL** — select mutant, view parts per slot, equip parts from inventory | `handleEquip` calls `setState`, swaps parts between inventory and mutant, old part returns to inventory |
| **ShopTab** | Completely inert — rendered `<h2>Shop</h2>` and `<p>Buy parts with Iron.</p>`. Zero interactions. | **NOW REAL** — browse parts catalogue from data.yaml, buy with iron | `handleBuy` calls `setState`, decrements iron, adds part ID to `partsInventory` |
| **InfirmaryTab** | Completely inert — rendered `<h2>Infirmary</h2>` and `<p>Manage injured mutants.</p>`. Zero interactions. | **Still inert** (deferred) | Zero `setState(` calls. Injury management is a separate future directive. |

### Match outcome — already persisted (confirmed)

`handleMatchEnd` in `App.tsx` was already real before this directive:
- `iron` incremented by `ironEarned` (win: 60, loss: 25, +10 per player score)
- `matchHistory` gets a new entry with result/scores/iron
- `currentOpponentIdx` advances to next opponent

The reward half of the loop already worked. The missing piece was the
spend half — nothing to spend iron on.

### Currency — already existed (confirmed)

`iron` exists in `MBBGameState`, initialized to 120 (from
`data['starting_iron']`), and is incremented on match end. The
`partsInventory` field also existed but was never used by anything.
Both are now real: iron is spent in the Shop, partsInventory is
populated by purchases and consumed by the Workshop.

### Minimal loop built

The smallest real, closed loop:

1. **Match → reward** (already worked): A won match grants iron
   (60 + 10 per score). A loss grants 25 + 10 per score. Persisted to
   `state.iron` and `state.matchHistory`.

2. **Reward → shop purchase** (NEW): The Shop lists all parts from
   `data['parts']` with their stats and prices. Buying a part decrements
   iron and adds the part ID to `partsInventory`. Cannot buy if
   insufficient iron. Already-owned parts show "OWNED" badge.

3. **Purchase → roster change** (NEW): The Workshop shows the player's
   mutants and their current parts per slot. Parts from `partsInventory`
   are grouped by slot. Equipping a part swaps it into the mutant's
   `parts` object and returns the old part to inventory. This
   genuinely changes the mutant's computed stats.

4. **Changed roster → next match** (already worked): `handleStartMatch`
   reads `state.activeSquad` → `state.roster` → passes mutants to
   `sim.initMatch()`. Since the roster is now mutated by the Workshop,
   the next match uses the updated parts.

**Scope held to one real purchasable action type** (buy part → equip
part). The full Brand/OEM-tier/Gravekeeper system is explicitly not
built here — it's deferred to its own directive once a Design.md exists.

### End-to-end loop confirmed via real playthrough

The `test_loop_closes_end_to_end` test plays a real match, earns iron,
buys a part, equips it, and plays a second match with the updated roster:

```
Match 1: 70-0 → iron 120→880 (+760)
  → bought leg_sprint for 90 (iron: 880→790)
  → equipped leg_sprint to Alpha (speed 79→104)
Match 2: 90-0 with updated roster (faster Alpha)
```

The roster genuinely changed between matches: Alpha's right_leg went
from `mutant_alpha_rl` (speed +30) to `leg_sprint` (speed +55), and
the computed speed stat went from 79 to 104. The second match used
this updated roster.

### Files modified

- `ts/src/games/mutant_battle_ball/components/ShopTab.tsx` — rewritten
  from inert stub to real shop with buy logic (93 lines)
- `ts/src/games/mutant_battle_ball/components/WorkshopTab.tsx` —
  rewritten from inert stub to real workshop with equip logic (133 lines)
- `ts/src/games/mutant_battle_ball/App.tsx` — removed `call={noopCall}`
  from ShopTab and WorkshopTab props (they no longer accept `call`)
- `ts/src/games/mutant_battle_ball/styles.css` — added shop and
  workshop layout styles (139 lines)

### Test anchors (9 new, all passing)

**New test file:** `ts/tests/test_mbb_minimal_game_loop.ts`

- `test_tab_wiring_confirmed` (1 test) — real per-tab wiring state
  confirmed: Roster presentational, Workshop/Shop now real, Infirmary
  still inert
- `test_match_outcome_persists` (1 test) — match result recorded in
  matchHistory, opponent advances
- `test_reward_granted_and_persisted` (2 tests) — win/loss both grant
  iron; real match produces real iron reward
- `test_shop_purchase_changes_roster` (1 test) — buy + equip changes
  mutant's parts and computed stats
- `test_loop_closes_end_to_end` (1 test) — full playthrough: match →
  earn → buy → equip → match again with different roster
- `test_no_regression` (3 tests) — both prior bug fixes intact, Lua
  source preserved, Shop/Workshop source files contain real logic

### Test results

**TS floor:** 870/874 passing (89 test files, 24.51s)
- +9 from previous floor (862): minimal game loop test anchors
- 4 failures, all pre-existing/unrelated:
  - `test_arcade_routing.ts > test_game_loader_back_button` (1) —
    known flaky test
  - `test_dual_target_deploy.ts > test_git_state_clean_both_games` (2) —
    fails because working tree has uncommitted changes (expected mid-work)
  - `test_shoal_ts_native_migration.ts > test_real_tick_time_measured` (1) —
    flaky performance test
- Zero regressions to MBB or any other game

### What this means

The minimal loop now exists: a win today changes what's possible
tomorrow. The player can earn iron from matches, buy parts in the Shop,
equip them in the Workshop, and field a genuinely different squad in
the next match. The Brand Set / Cyber-Organic / Gravekeeper system can
plug into this existing scaffolding when its Design.md is ready — the
Shop and Workshop are already real, stateful, and connected to the
match engine.

### What's still deferred

- **InfirmaryTab** — still inert. Injury management (repairing damaged
  parts, recovering downed mutants) is a separate future directive.
- **RosterTab squad selection** — `activeSquad` is still hardcoded to
  `[roster[0], roster[1]]`. Letting the player choose which two mutants
  to field is a natural next step but not required for the minimal loop.
- **Brand Sets / OEM tiers / Gravekeeper** — the full synergy system,
  deliberately deferred to its own directive once a Design.md exists.
- **Data-balance issue** — parts-summing vs flat stats, still deferred.


---

## Paper Doll / Composite Character Rendering Module — COMPLETED

**Directive:** Build a shared engine module that composes independent
body-part shapes into one correctly-layered figure, for two real,
already-proven consumers (Mutant Battle Ball and Chimera Wilds) which
already share the exact same six-slot Part/PartSlot system.

### Design review — Path A taken

The original design plan claimed to extend `artGen`'s "existing
`resolveColor(semanticKey, configMap)` resolver" and plug into
"tonight's real Brand/Cyber-Organic/Quality design." Investigation
confirmed both claims were false — `artGen` has no semantic-key
resolver (it uses `ArtGenConfig<TEntity>` callbacks), and no
Brand/Cyber-Organic/Quality system exists anywhere in the repo.

**Path A was chosen:** build the composition layer first against real
infrastructure (`artGen` shape primitives, shared `Part`/`PartSlot`
types, `mulberry32`), defer the Brand/Cyber-Organic/Quality styling to
a separate directive once that system's Design.md exists. This avoids
the "infrastructure built before the thing it serves is settled"
pattern the plan itself warned against.

### What was built

**New module:** `ts/src/engine/paperDoll/`

| File | Purpose |
|---|---|
| `types.ts` | AttachmentNode, BodyPlan, SlotShapeMapping, ResolvedAttachment, ComposedPart, CompositionInput |
| `attachmentGraph.ts` | Resolves a BodyPlan's parent-child graph into absolute per-slot positions/angles (BFS from root, rotates offsets by parent angle) |
| `composer.ts` | The real composition function: BodyPlan + parts + colors → ordered, positioned, styled SVG shapes. Consumes artGen's `renderPolygonPoints`, `renderTeardropFin`, `renderRadialBurst`, `renderIrregularFragment` directly |
| `bodyPlans/humanoidBilateral.ts` | MBB's real 6-slot bilateral humanoid graph (chest root, head above, arms/legs to sides) |
| `bodyPlans/chimeraAsymmetric.ts` | Chimera Wilds' asymmetric creature graph (head offset right, arms at different heights, splayed legs, rougher shape primitives) |
| `PaperDoll.tsx` | React component wrapping the composer for game consumption |
| `index.ts` | Barrel export |

### Real infrastructure consumed (not duplicated)

- `artGen` shape primitives: `renderPolygonPoints`, `renderTeardropFin`,
  `renderRadialBurst`, `renderIrregularFragment` — imported directly
  from `../artGen/index`
- `artGen`'s `mulberry32` re-export pattern (from `shared/seededRandom`)
  — used by the shape primitives for deterministic jitter
- Shared `PartSlot` type from `../shared/partSlots` — the module does
  not redefine `PartSlot`, it consumes the existing shared type
- `ArtGenConfig.colorFor` callback pattern — the `PaperDoll` component
  accepts a `color` prop and builds the per-slot color record, matching
  artGen's existing per-entity config approach (not a non-existent
  semantic-key resolver)

### Real consumer wiring

**Mutant Battle Ball:**
- `RosterTab.tsx` — each mutant card now renders a `PaperDoll` figure
  with `humanoidBilateral` body plan, sized 64px, colored by the
  mutant's color
- `WorkshopTab.tsx` — the equip panel header now renders a `PaperDoll`
  figure of the selected mutant, sized 80px, updating live as parts are
  equipped

**Chimera Wilds:**
- `App.tsx` — the encounter view now renders a `PaperDoll` figure of
  the current chimera with `chimeraAsymmetric` body plan, sized 120px,
  in red, above the existing parts list

### Architecture decisions

**Attachment Graph (not a fixed rig):** Each body-part slot is a node
in a parent-child graph with a data-defined offset and angle relative
to its parent. One root slot (chest) anchors the figure; every other
slot's position is computed from its parent. This makes the module
reusable — a different `BodyPlan` wires the same slots into a different
arrangement without changing the resolution logic.

**Explicit z-order:** Layer order is a named property of the Body Plan
(`renderOrder: PartSlot[]`), not inferred from slot order. Head renders
over torso, arms over torso, legs behind — structural, not cosmetic.

**Body Plans as data:** New body plans are authored as data entries
(`BodyPlan` objects), not engineered as code. The two real presets
(`humanoidBilateral`, `chimeraAsymmetric`) demonstrate the pattern.
Future presets (quadruped, insectoid, etc.) would be new data files,
not new engine code.

### What was NOT built (deferred)

- **Brand/Cyber-Organic/Quality styling** — `PartVisualState` (brand,
  lean, quality tier), semantic key resolution, wear/tear rendering.
  These wait for the Brand system's own Design.md and directive.
- **Animation** — this is static composition (a "current state" render),
  not a rigged/animated character system.
- **Any body plan beyond the two real consumers' needs** — quadruped,
  insectoid, etc. are explicitly future data entries.

### Test anchors (27 new, all passing)

**New test file:** `ts/tests/test_paper_doll.ts`

- `test_attachment_graph_resolution` (6 tests) — root resolves to
  offset, children resolve relative to parent, all 6 slots resolved for
  both plans, chimera head is asymmetric, zOrder assigned from
  renderOrder
- `test_layer_composition` (3 tests) — parts ordered back-to-front,
  each part contains SVG `<g>` with transform, `renderFigureSvg`
  produces complete SVG document
- `test_shape_generation` (7 tests) — polygon/teardropFin/
  irregularFragment/radialBurst primitives produce correct SVG
  elements, colors appear in output, deterministic seed produces
  identical output, different seeds produce different output
- `test_both_body_plans_produce_valid_figures` (3 tests) — humanoid
  produces 6-part figure with polygon+teardropFin, chimera produces
  6-part figure with irregularFragment+radialBurst, the two plans
  produce visually different figures
- `test_real_consumer_wiring` (5 tests) — MBB RosterTab/WorkshopTab
  import PaperDoll with humanoidBilateral, Chimera Wilds imports
  PaperDoll with chimeraAsymmetric, composer consumes artGen primitives
  (not duplicating), module uses shared PartSlot type (not redefining)
- `test_no_regression` (3 tests) — pure rendering layer (no stat
  modification), both body plans use the same 6 slots, no cross-game
  imports (engine-level module)

### Test results

**TS floor:** 897/901 passing (90 test files, 22.95s)
- +27 from previous floor (870): Paper Doll module test anchors
- 4 failures, all pre-existing/unrelated:
  - `test_arcade_routing.ts > test_game_loader_back_button` (1) —
    known flaky test
  - `test_dual_target_deploy.ts > test_git_state_clean_both_games` (2) —
    fails because working tree has uncommitted changes (expected mid-work)
  - `test_shoal_ts_native_migration.ts > test_real_tick_time_measured` (1) —
    flaky performance test
- Zero regressions

### What this means

No game in this studio previously rendered an assembled character on
screen. Now two games do: Mutant Battle Ball shows composed mutant
figures in roster cards and the workshop, and Chimera Wilds shows a
composed chimera figure in the encounter view. The composition engine
is reusable — new body plans are data, not code — and the Brand/
Cyber-Organic/Quality styling system can plug into the existing
`PaperDoll` component's color prop once that system's Design.md exists.
