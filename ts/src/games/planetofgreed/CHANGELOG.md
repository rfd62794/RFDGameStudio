# Planet of Greed — Changelog

Full detail for changes to Planet of Greed.
Studio-wide summary: [`/CHANGELOG.md`](../../../CHANGELOG.md)
Roadmap items: [`/ROADMAP.md`](../../../ROADMAP.md)

---

## Planet of Greed — Standalone Build for itch.io — COMPLETED

**Date:** August 14 2026
**Directive:** Produce the real, missing piece for Planet of Greed's
itch.io project page: an actual uploadable standalone build.

### Fixed — Generator gap for zero-Lua games

**The real gap:** `tools/generate-standalone-entry.ts` line 94 throws
`Error('No Lua files found for ${gameId}')` for games without Lua files.
Planet of Greed is TS-native with zero Lua files and no
`games/planetofgreed/` directory.

**The fix:** Created a minimal standalone entry
(`ts/src/standalone/planetofgreed/entry.tsx`) that constructs a no-op
`GameSession` directly — PoG's App destructures `session` but never
references it. This bypasses `buildStandaloneSession` entirely.

### Added — Real build produced and deployed

- `npm run build:planetofgreed` succeeded (8.32s)
- Output: 425.89 KB JS, 146.34 KB CSS, 578 KB total
- Build location: `ts/dist-planetofgreed/`
- Both Shoal and Planet of Greed pushed to itch.io via butler:
  - Shoal: `butler push ts/dist-shoal rdug627/shoal:html5` — build #1881663, version 9
  - Planet of Greed: `butler push ts/dist-planetofgreed rdug627/planet-of-greed:html5` — build #1881665, version 1
- Planet of Greed added to `RFD_IT_Publishing/config/games.yaml`

### Files created

- `ts/src/standalone/planetofgreed/entry.tsx` — minimal entry
- `ts/src/standalone/planetofgreed/index.html` — standard standalone HTML shell
- `ts/vite.planetofgreed.config.ts` — uses `makeStandaloneConfig`

### Files modified

- `ts/package.json` — added `build:planetofgreed` script
- `ts/src/games/registry.ts` — added Planet of Greed to `STANDALONE_BUILD_GAMES`

### Test results: 833/833 passing (86 test files). Zero regressions.

---

## Shoal + Planet of Greed — Dual-Target Deployment — COMPLETED

**Date:** August 14 2026
**Directive:** Deploy both games to both targets (website + itch.io).

### STOP rule — stale build caught

Shoal's existing `dist-shoal` was timestamped 9:01 PM, predating the
migration commit (11:13 PM) by over 2 hours. It was the old fengari
version. **Caught and rebuilt before any butler push.**

### Changed — Website arcade rebuilt and deployed

- Fresh arcade build via `studio_build` (vite build, 6.87s)
- Deployed via `__deploy_arcade_now.py`: 214 files uploaded, 192 skipped
- Live verification: `https://rfditservices.com/arcade/rfdgamestudio/` -> HTTP 200
- Fresh build hash (`index-CG1PagSB`) in live HTML
- Both `shoal` and `planetofgreed` in live JS bundle

### Added — Shoal standalone rebuilt fresh, Planet of Greed first build

- Shoal: Fresh standalone build (3.50s), timestamp post-migration, TS-native
  `tickGame` present in built JS
- Planet of Greed: First standalone build (8.32s), 425KB JS + 146KB CSS
- Both staged at `ts/dist-shoal/` and `ts/dist-planetofgreed/`

### Test results: 833/833 passing (86 test files). +26 from previous floor.
Zero regressions.

---

## Planet of Greed Boardroom Event Softlock Investigation — COMPLETED

**Date:** August 14 2026
**Directive:** Diagnose and fix a real softlock: a Boardroom Event modal
showing negative Treasury (-$10,000) with all resolution options
disabled, including two explicitly marked "NO COST".

### Fixed — Two separate root causes

**Root cause 1: Negative Treasury — event double-charging**

Four event choices had BOTH a positive `cost` AND a negative
`treasuryOffset` for the same amount — double-charging the player:

| Event | Choice | cost | treasuryOffset | Total deducted |
|---|---|---|---|---|
| Iridium Lode | Secure Strategic Reserves | $10k | -$10k | $20k |
| Rogue Drop Pod | Send Retrieval Squad | $10k | -$10k | $20k |
| Rogue Drop Pod | Remote Detonate Payload | $2k | -$2k | $4k |
| Solar Flare | Acquire Satellite Shielding | $15k | -$15k | $30k |

**Fix 1:** Removed the negative `treasuryOffset` from the four affected
event choices. The `cost` field already handles the deduction.

**Root cause 2: Disabled "NO COST" options — affordability check bug**

`DailyEventModal.tsx` line 62: `const canAffordCash = playerCorp.treasury >= choice.cost;`
When `choice.cost === 0` and `playerCorp.treasury === -10000`: `-10000 >= 0`
is `false`. A genuinely free option is incorrectly disabled.

**Fix 2:** Changed to `choice.cost === 0 || playerCorp.treasury >= choice.cost`.

**Fix 3 (defense-in-depth):** Verified every event template has at least
one `cost: 0` choice and none have `unitsCost`.

### Files modified

- `ts/src/games/planetofgreed/App.tsx` — removed 4 double-charging negative `treasuryOffset` values
- `ts/src/engine/shared/components/DailyEventModal.tsx` — fixed affordability check

### New files

- `ts/tests/test_planetofgreed_softlock_fix.ts` — 26 test anchors

### Test results: 776/776 passing (84 test files). +26 from previous floor.
Zero regressions.

---

## Planet of Greed Attack Capability Fix + Aggressive Default Redesign — COMPLETED

**Date:** August 14 2026
**Directive:** Fix a real bug (attacking rival-owned Regions doesn't
work) and redesign the guided walkthrough's default heuristic to actually
press the wheel-locked rivalry.

### Fixed — Attack UI-only bug

**Three-stage diagnosis:**
- (a) UI selectable: **BROKEN** — `GuidedWalkthrough.tsx` line 371 only
  rendered Expand button for neutral neighbors. Rival-owned neighbors
  never shown as targets.
- (b) Wiring: WORKS — `App.tsx` line 559 creates a transit regardless of
  target ownership.
- (c) Resolution: WORKS — Combat detection correctly identifies
  rival-owned cells.

**Root cause: UI-only.** The bug was introduced in Merge & Polish Op v2
when `GuidedWalkthrough` replaced `WeeklyOrdersPanel` as the primary flow.

### Changed — GuidedWalkthrough UI

Replaced the single "Expand to neutral neighbor" button with three
distinct buttons:
1. **Expand** (cyan, ArrowRight icon) — neutral neighbors only
2. **Attack** (red, Swords icon) — rival-owned neighbors
3. **Reinforce** (sky, Send icon) — own-owned neighbors

All three issue `{ type: 'expand', targetCellId, unitsSent }` orders.

### Changed — Aggressive default heuristic (9 rules)

**Old heuristic (6 rules, entirely passive)** -> **New heuristic (9 rules, aggressive first):**

| Rule | Condition | Default Action |
|---|---|---|
| 1 | Garrison >= 4 + wheel-opposite rival adjacent | Attack rival |
| 2 | Garrison >= 4 + any rival adjacent | Attack rival |
| 3 | Opposite rival + low fort (<2) + can afford | Fortify |
| 4 | Any rival + low garrison (<3) + can afford | Reinforce |
| 5 | Safe cell + contested own-cell exists | Redistribute |
| 6 | Garrison >= 4 + neutral neighbor | Expand |
| 7 | Low opinion (<40) + can afford | Civic Unrest |
| 8 | Low fort (<2) + can afford | Fortify |
| 9 | Else | Hold |

### Files modified

- `ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx` — added Attack and Redistribute buttons
- `ts/src/games/planetofgreed/defaultAction.ts` — redesigned heuristic with 9 aggressive rules

### New files

- `ts/tests/test_planetofgreed_attack_heuristic.ts` — 33 test anchors

### Test results: 750/750 passing (83 test files). +33 from previous floor.
Zero regressions.

---

## Planet of Greed Shell Compliance + Opening Sequence — COMPLETED

**Date:** August 14 2026
**Directive:** Close two real gaps: the studio's locked GameShell rule
(every ported game must wrap its ENTIRE render output in the shared
GameShell component), and the missing first-time onboarding beat.

### Fixed — GameShell compliance

**GameShell: NOT WRAPPED AT ALL.** Zero references to `GameShell` in
Planet of Greed's entire source tree before this phase. Every render
state rendered raw `<div>`s with no shell wrapper. There was NO
back-to-lobby button anywhere.

**Fix:** Every render state is now wrapped in `<GameShell>`: title screen,
opening sequence, culture selection, loading state, main game, ending screen.

### Added — TitleScreen and 4-beat Opening Sequence

Added the shared `TitleScreen` component before culture selection,
matching its real existing usage in Shoal and Dissonance.

**4 beats (new-game-only):**
1. **The Ore** — Genesis Ore's hidden power, the Seed Engine, Signal's presence
2. **The Houses** — all six Houses with their real descriptions from `flavorText.ts`
3. **The Rival** — the wheel-locked rival placement
4. **The Stakes** — what winning actually means

**New-game-only trigger:** `showOpeningSequence` is set to `true` only by
`handleTitleNewGame`. Set to `false` by Continue, localStorage resume, and
reset. A skip button is always available.

### Files created

- `ts/src/games/planetofgreed/components/OpeningSequence.tsx` — 4-beat opening
- `ts/tests/test_planetofgreed_shell_opening.ts` — 33 test anchors
- `tests/e2e/test_planetofgreed_shell_opening_e2e.py` — 6 E2E tests

### Files modified

- `ts/src/games/planetofgreed/App.tsx` — GameShell wrap on all render states, TitleScreen integration, OpeningSequence integration

### Test results: 717/717 passing (82 test files). +33 from previous floor.
E2E: 6/6 passing. Zero regressions.

---

## Planet of Greed Merge & Polish Op v2 — COMPLETED

**Date:** August 14 2026
**Directive:** Guided per-Region walkthrough (replacing the free-form
panel), flavor/display text pass (grounded in locked Design.md v0.2
narrative), real UI/UX redesign with visual identity recommendation,
Population Balance triggers, and real E2E verification.

### Added — Guided per-Region walkthrough

**Default-action heuristic** (6 rules, priority order, using only real
available state). Region order: by threat level (highest first), then by
cell ID as stable tiebreaker. Threat levels: 3 = adjacent to
wheel-opposite rival, 2 = adjacent to any rival, 1 = low
fortification/opinion, 0 = safe.

Confirm/change flow: each Region shows the pre-filled default. Player can
Confirm (fast path), Change Action (opens full action set), Skip (saves
Hold), or Back.

### Added — Flavor/display text pass

Grounded in locked Design.md v0.2 narrative — Genesis Ore, Signal, House
Arrest. House descriptions (`flavorText.ts`): each of the six Houses has
a 1-2 sentence description. Ending screen (`ENDING_TEXT`): replaced
placeholder with real narrative content. Event flavor: `EVENT_FLAVOR_NOTE`
carries Signal's uncanny presence.

### Changed — UI/UX redesign — visual identity

**Decision: Distinct Planet-of-Greed-specific identity, NOT the
Cyber-Ops Arcade identity.** Dark background (`#1a1a2e`), amber accents
(gold, the color of greed), emerald for treasury, red for reset/danger,
subtle borders, serif italic for labels, mono for data.

### Added — Population Balance triggers (9 triggers)

| Trigger | Effect |
|---|---|
| Civic Unrest Focus order | +8 |
| Civic Production Focus order | -2 |
| Civic Defense Focus order | -1 |
| Expand order | -3 on target cell |
| Reinforce order | -1 on source cell |
| Fortify order | -1 on cell |
| Combat resolution | -5 on cell |
| Passive erosion (weekly) | +/-1 toward 50 |
| Low opinion threshold (<30) | No income that week |

### Files created

- `ts/src/games/planetofgreed/defaultAction.ts`
- `ts/src/games/planetofgreed/flavorText.ts`
- `ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx`
- `ts/tests/test_planetofgreed_merge_polish_v2.ts` — 42 test anchors
- `tests/e2e/test_planetofgreed_e2e_v2.py` — 6 E2E tests

### Test results: 684/684 passing (81 test files). +42 from previous floor.
E2E: 6/6 passing. Zero regressions.

---

## Planet of Greed Merge & Polish — COMPLETED

**Date:** August 14 2026
**Directive:** Close the gap between "tests pass" and "actually playable"
using the studio's real E2E test infrastructure.

### Fixed — Real playthrough findings

1. **CORPWORLD branding in header** — BoardroomHeader displayed "CORP
   WORLD v2.0-MVP". **Fixed:** Header now shows "PLANET OF GREED".
2. **RANK #X / 5** — Header showed rank out of 5, but there are 6
   corporations. **Fixed:** Now uses `corporations.length` dynamically.
3. **No Fragment counter in UI** — **Fixed:** Added Fragment counter to
   BoardroomHeader and AnnualReportView.

### Added — Population Balance triggers (design decision)

`publicOpinion` field was initialized to 50 on every cell but had only
one trigger (Civic Unrest Focus +8). Added 8 new triggers. Design
principle: Population Balance is a living system that requires active
maintenance.

### Test results: 642/642 passing (80 test files). +12 from previous floor.
E2E: 4/4 passing. Zero regressions.

---

## Planet of Greed Conversion + CorpWorld/KingMaker Retirement — COMPLETED

**Date:** August 14 2026
**Directive:** Convert Planet of Greed from `examples/planetofgreed/`
to `ts/src/games/planetofgreed/` (live, registered, TS-native per
ADR-013). Retire CorpWorld and KingMaker Squads. Extract the shared
254-line combat resolver and 5 byte-identical components.

### Added — Planet of Greed conversion

- `config.ts` — registered with `status: 'dev'`, `component: React.lazy`
- `App.tsx` — converted from examples/, imports from shared modules
- `types.ts`, `wheelTopology.ts`, `fragmentSystem.ts`, `endingSystem.ts`,
  `aiDecisions.ts`, `utils/mapGenerator.ts`, components — copied/converted
- `index.css` — copied verbatim

### Added — Shared module extraction (`ts/src/engine/shared/`)

- `combat/` — 254-line RPS combat resolver, extracted from byte-identical CorpWorld/PoG copy
- `components/` — 5 shared React components (AlertQueue, BoardroomHeader, CombatResolutionView, DailyEventModal, PlanetMap)
- `componentTypes.ts` — shared type definitions

**mulberry32 duplication resolved:** Planet of Greed's `aiDecisions.ts`
now imports `mulberry32` from `engine/artGen/seededRandom`.

### Removed — CorpWorld and KingMaker Squads from registry

- CorpWorld removed from registry (retired, source preserved)
- KingMaker Squads removed from registry (retired, source preserved)
- Both have README.md reference notes explaining why they're preserved

### Test results: 630/630 passing. +22 new tests. Zero regressions.

---

## PlanetOfGreed — Phase 2: Rank, Population Balance & Displacement — COMPLETED

**Date:** August 14 2026
**Directive:** Implement Rank as Territory + Population Balance (not
territory alone), wired into CorpWorld's already-existing Boardroom
Events plus a new Civic Unrest focus, with targeted displacement.

### Added

- `types.ts`: added `Corporation.rank: number` and `MapCell.publicOpinion?: number`
- `App.tsx`: added `applyPublicOpinionOffset` (clamped 0-100) and
  `computeRank` (territory x 10 + avg Population Balance). Wired
  `publicOpinionOffset` into all 11 choices across 4 real event templates.
  Added the `'unrest'` civic order ($10k cost, +8 Population Balance).
  Rank recomputed at Annual Report and on real displacement.
- `WeeklyOrdersPanel.tsx`: enabled the disabled "Population Unrest Focus"
  placeholder button
- `AnnualReportView.tsx`: displays real `corp.rank` and avg Population
  Balance. Fixed stale hardcodes ("of 5" -> 6 corps, dynamic culture name/color)

### Verification: 5 anchors all passing. `tsc --noEmit` clean. `npm run
build` succeeded. `mapGenerator.ts`/`combat.ts` genuinely untouched.
CorpWorld completely unaffected.

### Still open

AI decision-logic upgrade and in-play culture stat modifiers — both
explicitly named as real, separate, unresolved design questions.

---

## PlanetOfGreed — Phase 1: Culture Corporations & Wheel Placement — COMPLETED

**Date:** August 14 2026
**Directive:** Expand from CorpWorld's original 5 corps to six real,
culture-tagged corporations placed on the map in wheel-cyclic order,
with the Ember/Tundra "Fault Line" rival pair guaranteed maximally
distant — all with identical starting stats.

### Added

- `types.ts`: added `CultureId` ('ember'|'marsh'|'gale'|'tundra'|'crystal'|'tide')
  and required `cultureId` field on `Corporation`
- `App.tsx`: replaced static 5-entry `INITIAL_CORPORATIONS` with
  `CULTURE_WHEEL` and `buildInitialCorporations(playerCultureId)`. Six
  corps with per-culture names/colors and identical `treasury: 100000`.
  Added minimal pre-game culture-selection screen.
- `mapGenerator.ts`: replaced pure greedy farthest-point with hybrid
  approach (farthest-point + angular spacing bias + brute-force bijection
  for Ember/Tundra max distance). `combat.ts` untouched.

### 200 real generated maps verification

- Culture-tag correctness: 200/200
- Starting-condition symmetry: 200/200
- Ember-Tundra is max-distance pair: 200/200 (100%)
- Every corp's nearest neighbor is wheel-adjacent: 145/200 (72.5%) —
  real, measured, not claimed as 100%

---

## PlanetOfGreed — Phase 0: Fork & Scaffold — COMPLETED

**Date:** August 14 2026
**Directive:** Fork CorpWorld's real source into a new, independent
`examples/planetofgreed/` directory, prove it builds and plays
identically to CorpWorld with zero functional changes.

### Added

- `examples/planetofgreed/` — new standalone Vite/React app, forked from
  `examples/corpworld/`. `src/` copied verbatim — confirmed byte-identical
  via SHA256 hash comparison on every file.
- Build config copied unmodified. One required change: `vite.config.ts`'s
  `base` updated from `/arcade/corpworld/` to `/arcade/planetofgreed/`.
- Registration explicitly deferred to a later phase.

### Verification: `tsc --noEmit` clean. `npm run build` succeeded (2084
modules, 14.6s). Live playable loop confirmed in-browser. CorpWorld
confirmed completely untouched.
