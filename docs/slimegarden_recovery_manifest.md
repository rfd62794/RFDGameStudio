# SlimeGarden Recovery Manifest

*Generated: 2026-07-18*

Cross-reference of all top-level exports in `gameLogic.ts` against
SlimeWorld's Lua (`logic.lua`), data (`data.yaml`), and TypeScript
(`ts/src/games/slimeworld/`) implementations.

## Status Definitions

- **RECOVERED**: Symbol found by direct name match AND called somewhere.
- **DEFINED_NOT_CALLED**: Symbol found by direct name match but never called.
- **NEEDS_HUMAN_REVIEW**: No direct name match — could be renamed, inline, or deliberately not ported.

## Summary

| Status | Count |
|---|---|
| RECOVERED | 21 |
| DEFINED_NOT_CALLED | 1 |
| NEEDS_HUMAN_REVIEW | 26 |
| **Total** | **48** |

## Full Manifest

| Symbol | Kind | Status | Notes | Last Checked |
|---|---|---|---|---|
| CURRENT_GEOMETRY_VERSION | const | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| generateSlimeName | function | RECOVERED | generate_slime_name, called in logic.lua | 2026-07-18 |
| COLOR_SPECS | const | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| PATTERN_DESCRIPTIONS | const | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| wheelDistance | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| breedColors | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| breedPatterns | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| stageFromLevel | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| stageModifier | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| circularHueMidpoint | function | RECOVERED | circular_hue_midpoint, called in logic.lua | 2026-07-18 |
| circularDistance | function | RECOVERED | circular_distance, called in logic.lua | 2026-07-18 |
| snapToFaction | function | RECOVERED | snap_to_faction, called in logic.lua + TS | 2026-07-18 |
| getHueDeviation | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| COLOR_TARGETS | const | RECOVERED | color_targets, called in TS | 2026-07-18 |
| matchColorTarget | function | RECOVERED | match_color_target, called in logic.lua | 2026-07-18 |
| getInterpolatedSpecs | function | RECOVERED | get_interpolated_specs, called in logic.lua | 2026-07-18 |
| SEED_SHAPE_DEFAULTS | const | DEFINED_NOT_CALLED | seed_shape_defaults found but never called — confirm whether wiring is missing or deliberately omitted | 2026-07-18 |
| getShapeStatModifiers | function | RECOVERED | get_shape_stat_modifiers, called in logic.lua | 2026-07-18 |
| calculateStats | function | RECOVERED | calculate_stats, called in logic.lua | 2026-07-18 |
| breedSlimes | function | RECOVERED | breed_slimes, called in logic.lua | 2026-07-18 |
| createSeedSlime | function | RECOVERED | create_seed_slime, called in logic.lua | 2026-07-18 |
| INITIAL_ZONES | const | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| generateContract | function | RECOVERED | generate_contract, called in logic.lua | 2026-07-18 |
| getRandomMelancholicLog | function | RECOVERED | get_random_melancholic_log, called in logic.lua | 2026-07-18 |
| resolveDispatch | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| calculateMarketPrice | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| resolveMediation | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| resolveExploration | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| revealAdjacentCapitolTerritory | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| updatePlanetSupplyAndPressure | function | RECOVERED | update_planet_supply_and_pressure, called in logic.lua | 2026-07-18 |
| generateWedgeAngles | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| annularSectorPath | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| getAngleIntervals | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| intervalsOverlap | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| generatePlanetRegion | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| syncCodexWithRoster | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| applyDispatchStabilityHook | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| checkWildsUnlockCondition | function | RECOVERED | check_wilds_unlock_condition, called in logic.lua | 2026-07-18 |
| getColorRegentCost | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| getTargetRegentCost | function | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| isSlimeInMatchingCultureEnvironment | function | RECOVERED | is_slime_in_matching_culture_environment, called in logic.lua | 2026-07-18 |
| calculateWorkerIncome | function | RECOVERED | calculate_worker_income, called in logic.lua | 2026-07-18 |
| BASE_REVOLT_FACTOR | const | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| GARRISON_RISK_REDUCTION_MULTIPLIER | const | NEEDS_HUMAN_REVIEW | No direct name match — likely renamed, inline, or deliberately not ported. Confirm. | 2026-07-18 |
| isCapitolHardened | function | RECOVERED | is_capitol_hardened, called in logic.lua + TS | 2026-07-18 |
| resolveForceClaim | function | RECOVERED | resolve_force_claim, called in logic.lua | 2026-07-18 |
| resolveBribeClaim | function | RECOVERED | resolve_bribe_claim, called in logic.lua | 2026-07-18 |
| resolveConvertClaim | function | RECOVERED | resolve_convert_claim, called in logic.lua | 2026-07-18 |
