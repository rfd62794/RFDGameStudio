# Dissonance Depths — Changelog

Full detail for changes to Dissonance Depths.
Studio-wide summary: [`/CHANGELOG.md`](../../CHANGELOG.md)

---

## Dissonance Depths — Live Deployment — COMPLETED (HANDOFF)

**Date:** August 14 2026

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

## Dissonance Depths — BrewField Migration + Stub Phase Buildout — COMPLETED

**Date:** August 14 2026

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
  pre-existing SlimeWorld E2E `test_slimeworld_first_breed_to_missions_unlock`.
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

**Date:** August 14 2026

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

| Component | Mean CardValue | Cards |
|---|---|---|
| sever | 10.97 | 14 |
| unmake | **10.37** | 14 |
| mend | 6.02 | 14 |
| guard | 5.86 | 14 |
| **Overall pool** | **8.30** | **56** |

Unmake now sits in the requested 10-11 range and is comparable to Sever,
rather than running ~50% ahead of it.

### Abuse-case check

Unconstrained top decks no longer collapse into all-Unmake builds:
- **best-5**: 3 unmake / 2 sever, total 85.44 (avg 17.09)
- **best-6**: 3 unmake / 3 sever, total 99.24 (avg 16.54)

### Floor cap check

The existing `POWER_LEVEL_CAP` still meaningfully constrains high-roll decks:
- Floor 4 cap = 72 (target avg 12/card). best-6 total 99.24 -> **blocked**.
- Floor 5 cap = 60 (target avg 12/card). best-5 total 85.44 -> **blocked**.
- Reference 8-card deck power = 72 (avg 9/card), close to the pool mean of 8.30.

### Legacy enemy tier assignments

| Enemy | Avg dmg/turn | New tier | Notes |
|---|---|---|---|
| Ashling | 2.25 | basic | unchanged |
| Bulwark | 2.75 | **advanced** | damage sits between bands |
| Molten Ashling | 4.00 | **elite** | changed from advanced |
| Rootbound Guardian | 4.00 | elite | unchanged |

### Files changed

- `games/dissonance/logic/run_state.lua` — Unmake DoT now respects `result.dotDuration`
- `games/dissonance/data.yaml` — Bulwark tier -> advanced, Molten Ashling tier -> elite

### Test floor

- Python: 577 passed, 1 failed (pre-existing)
- TypeScript: 326 passed, 0 failed

---

## Dissonance Depths — Placeholder Art Generation + Wiring — COMPLETED

**Date:** August 14 2026

### What was built

Built a deterministic, data-driven SVG generator for Dissonance's 106
placeholder assets and wired them into the three highest-visibility screens.

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

### Generated asset counts

| Category | Files | Source ids |
|---|---|---|
| Cards | 56 | `named_cards[].id` |
| Relics | 12 | `relics[].id` |
| Enemies | 38 | `enemies.{basic,behavior_roster,legacy_named,bosses}[].id` |
| **Total** | **106** | — |

### Deferred (explicitly not done)

- Art on remaining screens (Codex/Roster gallery, Store, Treasure, Anomaly).
- Inline SVG React components for theme reactivity — current static files use
  baked hex colors, matching the directive's recommended default.
- Replacing placeholder art with hand-authored assets.
- Animations / hover states on the art itself.

### Test floor

- Python: Dissonance Lua tests remain 55/55 passed.
- TypeScript: 326 passed, 0 failed.
- `npm run build:dissonance` passes and copies all 106 assets into
  `dist-dissonance/assets/dissonance/`.

---

## Dissonance Depths — Initial Lua Port & Anchor Tests — COMPLETED

**Date:** August 14 2026

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

### Live Lua traces verified

1. **Burster** — acquire `escalation_boon` -> commits `activeBuild: burster`.
   Play `ember+ember sever` -> `modifiedValue` goes from 12 to 14 with an
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
