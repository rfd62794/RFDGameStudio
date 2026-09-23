# BrewField → Dissonance Depths Migration Audit — Closure

*August 6 2026*

## Audit Verdict Table

| BrewField Mechanic | Verdict | Rationale / Where It Lives Now |
|---|---|---|
| Four-element card pool (`ember`, `ash`, `spark`, `cinder`) | Already present | Dissonance `data.yaml` `card_name_map` / `named_cards`. |
| Component actions (`sever`, `guard`, `mend`, `unmake`) | Already present | Dissonance `data.yaml` and `logic/combat.lua`. |
| Element relation system (single / same / adjacent / opposed) | Already present | `resolve_combination` in `logic/combat.lua`. |
| Enemy design shape (HP, secondary type, behavior patterns) | Ported | Ashling, Bulwark, Molten Ashling, Rootbound Guardian stats migrated into the legacy roster; see `data.yaml` enemies section. Intent patterns already existed in `logic/combat.lua`. |
| Residue Field (same-amplify, opposed-annihilate, Fortified) | Migrated | Implemented in `logic/run_state.lua`, gated to Floor 4+, with new `fortified_residue` relic in `data.yaml`. Unmake is explicitly excluded from amplification. |
| Wa-Tor-inspired trophic chemistry | Correctly left behind | No trace found in BrewField source during the prior audit; nothing to migrate. |

## Integration Work Completed

1. **Residue Field** — added persistent residue marks to `RunState`,
   `update_residue_field` / `residue_bonus_for_play` helpers, and combat turn
   integration. Added `fortified_residue` relic.
2. **Treasure / Store / Anomaly / RunEnd phases** — built React phase components
   and Lua resolution functions; `RunEnd` was already implemented via shared
   `EndStateScreen`.
3. **BrewField delisting** — removed from `GAME_REGISTRY` and
   `STANDALONE_BUILD_GAMES` in `ts/src/games/registry.ts`, removed the
   `build:brewfield` script from `ts/package.json`, and removed
   `ts/vite.brewfield.config.ts`; source directories remain intact for
   archival purposes.
4. **Dissonance standalone publish path** — added
   `ts/vite.dissonance.config.ts`, `ts/src/standalone/dissonance/index.html`,
   and `entry.tsx` with `build:dissonance` so Dissonance can build and publish
   independently of the global arcade build, which is blocked by pre-existing
   TypeScript errors in other games.
5. **Unmake rebalance** — fixed a porting inconsistency where `run_state.lua`
   hard-coded Unmake's applied DoT duration to 3 turns while `combat.lua`
   returned `dotDuration = 2`. The combat turn now respects the resolved
   duration. This drops Unmake's mean `CardValue` from ~15.55 back to the
   intended 10.37, inside the 10–11 target and comparable to Sever's 10.97.
6. **Legacy enemy tier classification** — computed real damage-per-turn from
   the four ported BrewField enemies' actual Dissonance intent patterns and
   assigned tiers against the existing `DMG_PER_TURN` bands. Ashling stays
   `basic` (2.25 dmg/turn), Bulwark moved to `advanced` (2.75, damage straddles
   basic/advanced but HP 20 supports advanced), Molten Ashling moved to
   `elite` (4.00), and Rootbound Guardian stays `elite` (4.00).
7. **Placeholder art generation** — added
   `scripts/generate_dissonance_art.py` which reads `data.yaml` and produces
   106 deterministic SVGs (56 cards, 12 relics, 38 enemies) into
   `ts/src/standalone/dissonance/public/assets/dissonance/`. Wired the art
   into `DeckBuildPhase`, `CombatPhase`, and `RewardPhase` only, as scoped.
8. **Test floors** remain green:
   - Python: 577 passed, 1 failed, 8 warnings. The single failure is the
     pre-existing SlimeWorld E2E `test_slimeworld_first_breed_to_missions_unlock`
     (unrelated to this directive).
   - TypeScript: 326 passed, 0 failed
   - `npm run build:dissonance` and `test_standalone_build_integrity[dissonance]` pass

## Rebalanced Numbers

| Component | Mean CardValue | Cards |
|---|---|---|
| sever | 10.97 | 14 |
| unmake | **10.37** | 14 |
| mend | 6.02 | 14 |
| guard | 5.86 | 14 |
| **Overall pool** | **8.30** | **56** |

Abuse-case top decks are no longer dominated by Unmake:
- best-5: 3 unmake / 2 sever, total 85.44
- best-6: 3 unmake / 3 sever, total 99.24

Floor 4 cap (72 / ~12 avg) and Floor 5 cap (60 / ~12 avg) still block those
unconstrained best decks.

## Open Items

- **Remaining art coverage**: Store, Treasure, Anomaly, and a full Codex/Roster
  gallery still show text-only slots. These are intentionally deferred to a
  follow-up directive.
- **Inline SVG / theme reactivity**: current art is static files with baked
  hex colors; switching to inline React components would be a larger scope
  increase and is not required for this filler-art pass.
- **Hand-authored asset replacement**: the generated SVGs are placeholders and
  should be swapped out wholesale once real art is ready.
