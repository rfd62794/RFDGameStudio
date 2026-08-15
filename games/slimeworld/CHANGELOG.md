# SlimeWorld — Changelog

Full detail for changes to SlimeWorld.
Studio-wide summary: [`/CHANGELOG.md`](../../CHANGELOG.md)
Roadmap: [`/ROADMAP.md`](../../ROADMAP.md)

---

## SlimeWorld Random Starting Color Foundation — COMPLETED

**Date:** August 14 2026

### What was built

Replaced the static, `data.yaml`-driven starter color (always Red) with
a real runtime random pick from `{Red, Blue, Yellow}` at genuine
new-game creation — the foundational piece the onboarding redesign's
later directives all assume exists first. Only the one real,
randomly-selected zone starts `isUnlocked: true`; Green
(`recommendedLevel` 6, a real existing difficulty step up) stays outside
the pool entirely, matching Robert's explicit design.

### Design decisions

- **Real place-name resolution**: the starter zone's display name is
  resolved at runtime from `naming_reference.lua`'s
  `COLOR_TO_CULTURE_NAME` table — not a hardcoded string. The random
  pick produces a real culture name (e.g. "Cinder Wastes", "Tide
  Reaches", "Gale Steppe") that matches the color.
- **`data.yaml`'s `starter_color` is now ignored at runtime** — the
  field remains in `data.yaml` for reference but `buildInitialState`
  no longer reads it. The random pick is the sole source of truth.
- **Save/load preserved**: `loadSavedState` restores the saved
  `starterColor` from persisted state, not a new random pick. Only
  genuine new games get the random selection.

### Test coverage — 6 test anchors, all passing

1. `test_starter_color_random_from_real_pool` — confirms the random
   pool is `{Red, Blue, Yellow}` (not Green, not all 6)
2. `test_starter_zone_unlocked_matches_color` — confirms the unlocked
   zone matches the randomly picked color
3. `test_green_zone_always_locked_at_start` — confirms Green is never
   in the unlocked pool
4. `test_real_place_name_resolution` — confirms the starter zone's
   display name comes from `naming_reference.lua`, not a hardcoded string
5. `test_save_load_preserves_starter_color` — confirms returning
   players keep their original starter color
6. `test_no_regression` — confirms existing tests still pass

**Test floor:** 307/307 passing (83 test files). +6 from previous floor.
Zero regressions.

---

## SlimeWorld Options Menu + Hard Reset (Pre-Publish) — COMPLETED

**Date:** August 14 2026

### What was built

Added a two-step confirm Hard Reset and an Options Menu to the
GameShell header's `statusArea`. The Options Menu is a dropdown with
a "Hard Reset" entry that opens a modal with a two-step confirmation
flow (type "RESET" to confirm, then click "Confirm Reset").

### Design decisions

- **Two-step confirm**: the first step shows the consequences (all
  progress lost, all slimes released, all regions reset). The second
  step requires typing "RESET" exactly. This prevents accidental
  resets while keeping the flow fast for intentional ones.
- **`OptionsMenu.tsx` in header `statusArea`**: matches the existing
  GameShell header convention. The menu is a dropdown that appears
  below the gear icon.
- **Cross-game settings system is real, separate, future work** — this
  Options Menu is SlimeWorld-only. A cross-game settings system would
  be a separate directive.

### Test coverage — 5 test anchors, all passing

**Test floor:** 301/301 passing (82 test files). +5 from previous floor.
Zero regressions.

---

## SlimeWorld Gate Missions/Economy Tabs Behind First Region Unlock — COMPLETED

**Date:** August 14 2026

### What was built

Gated the Missions and Economy tabs behind the first region unlock.
A fresh game's first hub screen shows exactly Roster + Lab, nothing
else. Successfully breeding a slime matching any region's composite
lock (color/shape/accent) sets `state.regionUnlocks[nodeId] = true`,
which flips the gate and reveals Missions + Economy.

### Design decisions

- **Visibility gate only, not a data gate** — no new restriction on
  what a player can *do* once Missions/Economy become visible; only
  when the tab itself appears in the tab bar changed.
- **`primaryTab` default (`'roster'`) confirmed safe** — `'roster'` is
  present in both the gated (`roster` + `lab`) and ungated (all four)
  tab lists, so no fresh game can default to a tab that's about to be
  hidden.
- **Node-level locking untouched** — `MissionsTab.tsx`'s own
  `isNodeLocked`/`regionLockNodeIds` logic is a separate, already-working
  system; confirmed unchanged via regression test.

### Real source of truth used

`state.regionUnlocks` — the same persisted `LabState` field
`T3_REGION_UNLOCK`'s own trigger logic derives its "newKeys.length > 0"
check from. Not a proxy. Because it's real persisted state, a returning
player with existing progress sees all four tabs immediately on load.

### Test coverage — 5 test anchors, all passing

1. `test_fresh_game_shows_only_roster_and_lab_tabs`
2. `test_missions_economy_tabs_appear_after_first_unlock`
3. `test_returning_player_with_existing_progress_sees_all_tabs`
4. `test_default_active_tab_never_hidden`
5. `test_node_locking_unaffected`

**Test floor:** 296/296 passing. +5 from previous floor. Zero regressions.

---

## SlimeWorld Wire Fealty Transition + Achievement Moment — COMPLETED

**Date:** August 14 2026

### What was built

Corrected another false premise. The directive claimed
`check_fealty_transition` is "never called anywhere on the TS side" and
that "zero narrative/Echo text anywhere tied to Fealty" exists. **Both
claims were checked against real source and found false.**

**Real, direct-read findings:**
- `check_fealty_transition` IS already called, from `logic.lua`'s
  `advance_cycle` (line 103)
- Real, distinct narrative text already exists at `logic.lua:104-105`
- Call order is already correct and must NOT change: fealty transitions
  fire **before** the same cycle's pressure simulation

**The one real, confirmed gap**: the Fealty log entry (type `system`,
text prefixed `FEALTY:`) never triggered the existing `AlertBox` — only
`combat` + `STRAY DETECTION` did. This directive closes exactly that gap.

### Design decisions

- **No new narrative text written** — the real, pre-existing text
  already satisfies Rev 2's tonal-distinctness requirement.
- **No call-order change** — the real order (fealty check before
  pressure sim) is intentional and correct.
- **`AlertBox.tsx` untouched** — confirmed generic, renders any
  `LogEntry`; only the trigger filter in `App.tsx` needed extending.

### Test coverage — 5 test anchors, all passing

**Test floor:** 291/291 passing. +5 from previous floor. Zero regressions.

---

## SlimeWorld Color/Culture/Strain Naming Correction — COMPLETED

**Date:** August 14 2026

### What was built

Corrected a real naming lie: `favor.culture` and
`state.culture_relationships` were named as if they held culture keys
(`ember`, `marsh`, etc.), but every real value that ever flows through
them is a color name (`Red`, `Blue`, etc.). Renamed both to
`owner_color`/`color_relationships` across the full Lua<->TS bridge,
and added a canonical, documentation-grade reference table.

### Design decisions

- **Three parallel naming schemes, one load-bearing**: culture keys
  (display/narrative only), color names (the ONLY scheme used for real
  state), Strain names (flavor text only).
- **Pure rename, no behavior change**: every real call site confirmed
  via source read before renaming. `git diff --stat` confirms only
  renames + the two new reference files — zero logic changes.
- **Reference table is documentation-grade, not a runtime dependency**:
  `naming_reference.lua` is NOT added to `systems.yaml`'s `lua_files`,
  so it never loads or executes.

### Test floor: 563 passed, 8 warnings (Python). Zero regressions.

---

## SlimeWorld Alert Box for Real-Time Notifications — COMPLETED

**Date:** August 14 2026

### What was built

Implemented a lightweight, reusable Alert Box component that surfaces
new Stray/Refugee log entries as immediate, dismissable UI notifications.

### Design decisions

- **Generic component**: `AlertBox` accepts any `LogEntry`-shaped prop,
  not hardcoded to Stray-specific text. Future directives can wire
  additional trigger conditions onto the same component without a rewrite.
- **Detection mechanism**: New log entries detected in
  `handleAdvanceCycle` after each `advance_cycle` Lua bridge call.
  Filtered for `type === 'combat' && text.startsWith('STRAY DETECTION')`.
- **Existing logs history unchanged**: `state.logs` is still appended
  and sliced at -50 as before.

### New files

- `ts/src/games/slimeworld/components/AlertBox.tsx`

### Test coverage — 5 test anchors, all passing

**Test floor:** 282/282 passing (277 existing + 5 new). Zero regressions.

---

## SlimeWorld Identity Alignment — COMPLETED

**Date:** August 14 2026

### What was built

Implemented the Player-Aligned as Single Canonical Signal directive.
Replaced the dual-meaning overload where `owner_color == "Gray"` served
as both cultural identity AND player-control signal. Now
`player_aligned` is the single canonical flag for "this node is
player-controlled," set identically by all four claim paths (Force,
Bribe, Convert, Fealty).

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
  pressure accumulation, flips, revolts, and supply collapse.

### Test coverage — 7 test anchors, all passing

**Test floor:** 277/277 passing (270 existing + 7 new). Zero regressions.

---

## SlimeWorld Demo Scope & Onboarding (Ember Path) — COMPLETED

**Date:** August 14 2026

### What was built

Implemented the Demo Scope & Onboarding directive. New Campaign shows
a short, locked Opening beat (Ember is home, two regions within reach —
no mechanic teaching). Continue skips the beat and goes straight to
Hub. Three trigger-based tutorials (T-1/T-2/T-3) fire on real player
actions. New Game Guard pre-populates all tutorial IDs on restore so
nothing re-fires for returning players.

### New files

- `ts/src/games/slimeworld/tutorial.ts` — Tutorial ID constants,
  content definitions, `shouldFireTutorial`, `markTutorialShown`,
  `prepopulateAllTutorials`. Three tutorial triggers: T-1 (first Hub
  view), T-2 (first roster/breeding screen open), T-3 (first region
  unlock — states permanence "forever").
- `ts/tests/test_slimeworld_onboarding.tsx` — 6 bridge/source tests

### Test coverage — 6 test anchors, all passing

**Test floor:** 271/271 passing. +6 from previous floor. Zero regressions.

---

## SlimeWorld Region Lock-Down — COMPLETED

**Date:** August 14 2026

### What was built

Implemented the Region Lock-Down directive. Regions are now locked
behind composite color/shape/accent requirements. A region's
`compositeLock` specifies the color, shape, and accent needed to
unlock it. Breeding a slime matching all three requirements sets
`state.regionUnlocks[nodeId] = true`.

### Test coverage — 5 test anchors, all passing

**Test floor:** 265/265 passing. +5 from previous floor. Zero regressions.

---

## SlimeWorld Fealty & Culture Favors (Rev 2) — COMPLETED

**Date:** August 14 2026

### What was built

Implemented the Fealty & Culture Favors system (Rev 2). Four claim
paths: Force (military), Bribe (economic), Convert (relationship),
Fealty (100% relationship -> permanent loyalty). Each path has
distinct narrative text and mechanical consequences. Fealty-locked
nodes are permanently excluded from pressure simulation.

### Design decisions

- **Fealty is permanent**: once a node swears fealty, it's locked
  forever. No mechanism to undo it.
- **Fealty text is tonally distinct**: emphasizes permanence and
  closure, consistent with the game's corporate/technical narrative voice.
- **Call order**: fealty transitions fire before the same cycle's
  pressure simulation (by design — so a newly-locked node is excluded
  from pressure that same cycle, not one cycle late).

### Test coverage — 5 test anchors, all passing

**Test floor:** 260/260 passing. +5 from previous floor. Zero regressions.

---

## Earlier SlimeWorld Changes

The following changes were recorded in the main `docs/state/current.md`
before per-project changelogs were established. Full detail is available
in git history.

- **Fix Missing Level-Up Logic & Advance Cycle Button** — slimes never
  leveled up (XP threshold check never ported to Lua); no always-visible
  Advance Cycle button
- **Fix Hardcoded Offspring ID** — breeding produced duplicate IDs
- **Implement Seed Purchase** — Lua + TS wiring
- **Fix handleAdvanceCycle** — missing mediation/dispatch/zone read-back
- **Fix Dispatch Resolution** — third instance of mission lifecycle bug
- **Fix Mediation Launch** — discarded Lua result
- **Split logic.lua into Multi-File Modules**
- **Onboarding Economy Corrections**
- **Wire Starter Slime Creation to Real Lua Stats**
- **Real Slime Shape Rendering (Phase 1: Geometry)**
- **Splicing Roster Bloat + SlimeDex Discovery**
- **Lifecycle Completeness Detector**
- **Compounding Breeding Tax by Generation**
- **Mission Serialization Fix + End-to-End Test Coverage**
- **Recovery Manifest Tool** — const-usage detection fix
- **Mediation Resolution Fix**
- **Color-Stat Data Deduplication**
- **Real Color + Shape Stat Computation**
- **Multi-Return Truncation Fix** — Phase 1
- **Framework Generation Layer, Module 1: Pure-Data Extraction**
- **Wanderer Petition Wiring**
- **Shared Data Layer + Lua->TS Field Safety Alarm**
- **Exploration Tests + Codex Wiring Fix**
- **Shape Codex Target Detection**
- **Color Codex Target Detection**
- **World Map Fix** (planetRegion never generated, v2: 20-Node replacement)
- **UI Real Tab Extraction**
- **Tier Economics + Richer Wanderer Petitions** — CERTIFIED
- **Worker Income + Garden Refugee Default** — CERTIFIED
- **Shape Naming, Breeding Cost, Wanderer Petitions** — CERTIFIED
- **SlimeGarden Genetics Core, First Lua Port Slice** — CERTIFIED
- **Shared UI, First Real Migration (Slimeworld)** — CERTIFIED
