# RFDGameStudio — Project State

*Last updated: July 2026*

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
