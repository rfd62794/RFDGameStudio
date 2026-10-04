# Wave 0 Audit Data - Demo Polish Standard

**Audit Date:** 2026-10-03  
**Audit Type:** Read-only, no code changes  
**Scope:** All registered, non-retired demos from ts/src/games registry  
**Total Demos Audited:** 35

## Summary by Status

- **External (embed):** 16 demos
- **Dev (in progress):** 14 demos  
- **Stable:** 3 demos
- **Beta:** 1 demo
- **Tool:** 2 demos

## Key Findings

### Demos with Most Failing A-Items (Tier A Gaps)
1. All `external` status demos missing A8 (iframe check) - 16 demos
2. Demos missing build scripts: choke_point, early_learning_buddy, filipino_bpo_simulator, gladiator_arena, horse_racing, slither_rogue, voiddrift_redux, wire_rust - 8 demos
3. All demos have placeholder blurbs (3 words) except horse_racing and slither_rogue (5 words) - 33 demos with A5 gap

### Build Scripts Present
- With: chimera_wilds, dissonance, house_of_kings_collab, mutant_battle_ball, planetofgreed, scrapcrawl, shoal, slime_coin, slimeworld, succession - 10 demos
- Without: All other non-tool/external - 24 demos

## Per-Demo Details

| Demo ID | Status | Blurb Words | Build Script | Gaps |
|---------|--------|------------|--------------|------|
| 7_days_to_fry | external | 3 | no | A5, A8 |
| antsim_redux | external | 3 | no | A5, A8 |
| character_viewer | tool | 3 | no | none |
| chimera_wilds | dev | 3 | yes | A5 |
| choke_point | dev | 3 | no | A5, A7 |
| corpworld | external | 3 | no | A5, A8 |
| dissonance | dev | 3 | yes | A5 |
| dissonance_prototype | external | 3 | no | A5, A8 |
| early_learning_buddy | dev | 3 | no | A5, A7 |
| facility_escape | external | 3 | no | A5, A8 |
| factory_idle | external | 3 | no | A5, A8 |
| filipino_bpo_simulator | dev | 3 | no | A5, A7 |
| gladiator_arena | dev | 3 | no | A5, A7 |
| horse_racing | stable | 5 | no | A7 |
| house_of_kings_collab | dev | 3 | yes | A5 |
| kingmaker_squads | external | 3 | no | A5, A8 |
| ledger | external | 3 | no | A5, A8 |
| mutant_battle_ball | dev | 3 | yes | A5 |
| planetforge | external | 3 | no | A5, A8 |
| planetofgreed | dev | 3 | yes | A5 |
| role_symbol_viewer | tool | 3 | no | none |
| scrapcrawl | dev | 3 | yes | A5 |
| shoal | stable | 3 | yes | none |
| slime_coin | dev | 3 | yes | A5 |
| slimebreeder | external | 3 | no | A5, A8 |
| slimegarden | external | 3 | no | A5, A8 |
| slimeworld | stable | 3 | yes | none |
| slither_rogue | beta | 5 | no | A7 |
| succession | dev | 3 | yes | A5 |
| systemic_extract | external | 3 | no | A5, A8 |
| technique_showcase | tool | 3 | no | none |
| trinity_siege | external | 3 | no | A5, A8 |
| voiddrift | external | 3 | no | A5, A8 |
| voiddrift_redux | dev | 3 | no | A5, A7 |
| wire_rust | dev | 3 | no | A5, A7 |

## Recommendations

**Demos with Most Baseline Gaps (A-items):**
1. 7_days_to_fry - A5, A8 (external, needs blurb + iframe check)
2. antsim_redux - A5, A8 (external, needs blurb + iframe check)
3. facility_escape - A5, A8 (external, needs blurb + iframe check)
4. kingmaker_squads - A5, A8 (external, needs blurb + iframe check)
5. ledger - A5, A8 (external, needs blurb + iframe check)

**Effort Assessment:**
- Blurb/A5 fixes: S (simple content update)
- Build script additions (A7): S-M (mechanical additions to package.json)
- External iframe checks (A8): S (visual inspection, no code)
