# Shared Logic Layer Compliance Audit (ADR-007)

**Date:** July 2026  
**Scope:** All real Lua-backed games under `games/` vs. all files in `engine/primitives/` and `engine/systems/`.  
**Method:** Per-line static scan of every `.lua` file in each game directory (excluding `slimeworld/logic_original.lua`, which is a stale backup), compared against the public function/constant names exported by the eleven engine files. Read-only audit; no retrofits performed.

---

## 1. Confirmed population

### 1.1 In-scope games (real Lua exists)

| Game | Logic file layout |
|---|---|
| `brewfield` | `logic.lua` |
| `chimera_wilds` | `logic.lua` |
| `dissonance` | `logic/builds.lua`, `logic/combat.lua`, `logic/discovery.lua`, `logic/enemies.lua`, `logic/logic.lua`, `logic/rooms.lua`, `logic/run_state.lua` |
| `horse_racing` | `logic.lua` |
| `mutant_battle_ball` | `logic.lua` |
| `scrapcrawl` | `logic.lua` |
| `shoal` | `entities.lua`, `logic.lua`, `state.lua`, `steering.lua`, `utils.lua` |
| `slime_coin` | `logic.lua` |
| `slimeworld` | `breeding.lua`, `codex.lua`, `economy.lua`, `logic.lua`, `missions.lua`, `territory.lua` |
| `slither_rogue` | `collision.lua`, `logic.lua`, `physics.lua`, `render.lua`, `state.lua`, `utils.lua` |

### 1.2 Confirmed out of scope (no Lua in `games/`)

CorpWorld, Trinity Siege, Ledger, SlimeBreeder, SlimeGarden.

### 1.3 Engine files audited

| File | Exported symbols checked |
|---|---|
| `engine/primitives/action.lua` | `clamp`, `rand_int`, `rand_item`, `collect` |
| `engine/primitives/consequence.lua` | (placeholder, no functions) |
| `engine/primitives/entity.lua` | `generate_id`, `copy_entity`, `validate_entity` |
| `engine/primitives/lifecycle.lua` | `LIFECYCLE_CREATE`, `LIFECYCLE_STEP`, `LIFECYCLE_DRAW`, `LIFECYCLE_COLLISION`, `LIFECYCLE_DESTROY` |
| `engine/primitives/movement.lua` | `advance_position`, `move_grid`, `in_bounds`, `dist2`, `normalize_angle`, `atan2` |
| `engine/primitives/physics.lua` | `grid_collision`, `self_collision` |
| `engine/primitives/resolution.lua` | `scores_to_odds` |
| `engine/systems/combat.lua` | `calculate_damage`, `apply_damage`, `resolve_hit`, `simulate_fight`, `is_part_destroyed`, `calculate_bot_effectiveness` |
| `engine/systems/genetics.lua` | `generate_horse_name`, `generate_color_profile`, `generate_horse`, `breed_stat`, `breed_horses` |
| `engine/systems/market.lua` | `calculate_payouts`, `calculate_horse_price`, `sell_horse`, `settle_bets` |
| `engine/systems/odds.lua` | `calculate_odds`, `calculate_place_odds`, `calculate_show_odds` |

---

## 2. 10 × 11 compliance matrix

Legend: **U** = Uses shared symbol (call site found), **D** = Duplicates shared symbol (local definition of same name), **N/A** = no occurrence and/or genuinely not needed.

| Game | action | consequence | entity | lifecycle | movement | physics | resolution | combat | genetics | market | odds |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `brewfield` | **D** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `chimera_wilds` | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `dissonance` | **U** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `horse_racing` | **U** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | **U** | N/A | **U** |
| `mutant_battle_ball` | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `scrapcrawl` | **U** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `shoal` | **U** | N/A | N/A | N/A | **U** | N/A | N/A | N/A | N/A | N/A | N/A |
| `slime_coin` | N/A | N/A | **U** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `slimeworld` | **U** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `slither_rogue` | **U** | N/A | N/A | N/A | **U** | N/A | N/A | N/A | N/A | N/A | N/A |

### 2.1 Evidence for every non-N/A cell

- `brewfield;action;DUPLICATES` — `games/brewfield/logic.lua:11` defines `local function clamp(val, min, max)` instead of calling `engine/primitives/action.lua clamp`.
- `dissonance;action;USES` — `games/dissonance/logic/enemies.lua:7` calls `collect(t)` when available (runtime-provided `engine/primitives/action.lua collect`).
- `horse_racing;action;USES` — `games/horse_racing/logic.lua:26` calls `collect(data.race_classes)` and again at lines 27–30.
- `horse_racing;genetics;USES` — `games/horse_racing/logic.lua:78` and `168` call `generate_horse(...)` from `engine/systems/genetics.lua`.
- `horse_racing;odds;USES` — `games/horse_racing/logic.lua:100` and `192` call `calculate_odds(horse_stats, distance)` from `engine/systems/odds.lua`.
- `scrapcrawl;action;USES` — `games/scrapcrawl/logic.lua:76` calls `clamp(0.8 + ratio * 0.7, 0.8, 1.5)`.
- `shoal;action;USES` — `games/shoal/utils.lua:18` calls `clamp(d, world.surface_depth, world.floor_depth)`.
- `shoal;movement;USES` — `games/shoal/logic.lua:142` calls `dist2(s.x, s.depth, f.x, f.depth)`.
- `slime_coin;entity;USES` — `games/slime_coin/logic.lua:435` calls `copy_entity(GAME_STATE.shelf_coins)` from `engine/primitives/entity.lua`.
- `slimeworld;action;USES` — `games/slimeworld/breeding.lua:137` calls `clamp(average_irregularity + normalized_distance * 0.5 * 100, 0, 100)`.
- `slither_rogue;action;USES` — `games/slither_rogue/physics.lua:35` calls `clamp(head.x + ...)`.
- `slither_rogue;movement;USES` — `games/slither_rogue/collision.lua:14` calls `dist2(ph.x, ph.y, f.x, f.y)`.

### 2.2 Notes on N/A cells

- `consequence` — `engine/primitives/consequence.lua` is an empty placeholder; no game can use it.
- `lifecycle` — `engine/primitives/lifecycle.lua` exports string constants only; none are referenced in any game Lua.
- `physics` — `engine/primitives/physics.lua` exports `grid_collision`/`self_collision`; no game calls them. `slither_rogue` and `shoal` implement their own collision routines.
- `combat` — `engine/systems/combat.lua` is stubbed (`error("...not implemented...")`); `mutant_battle_ball`, `brewfield`, `dissonance`, `scrapcrawl` all implement local combat resolution.
- `resolution` — `engine/primitives/resolution.lua` `scores_to_odds` is unused; `horse_racing` uses `engine/systems/odds.calculate_odds` instead.
- `market` — `engine/systems/market.lua` is not called by any game Lua despite `horse_racing` listing it in its header comment.
- `genetics` / `odds` — only `horse_racing` uses these; all other games have no horse-generation or pari-mutuel betting domain.
- `action` — `rand_int` and `rand_item` are exported but never called by any audited game; games use `math.random` directly.

---

## 3. Reverse check — substantial game logic with no shared equivalent

Each game contains a large body of logic that has no corresponding `engine/` primitive or system. The following lists are the non-engine function names found per game; they are the raw material for any future extraction directive.

- `brewfield` (30 functions): `resolve_brew`, `rest_synthesize_element`, `resolve_turn`, `resolve_enemy_turn`, `apply_residue_tick`, `build_run_nodes`, `instantiate_enemy`, `get_enemy_intent`, `choose_forage`, `update_residue_field`, `damage_shield_first`, `get_opposed_element`, `get_relation`, `get_residue_tag`, `add_log`, `advance_hand`, `advance_node`, etc.
- `chimera_wilds` (2 functions): `generate_chimera`, `resolve_encounter`.
- `dissonance` (58 functions): `create_run`, `generate_balanced_map`, `generate_branching_map`, `advance_node`, `enter_active_node`, `draw_hand`, `draw_card`, `build_card_pool`, `build_enemy_pool`, `generate_enemy`, `generate_enemy_band`, `get_behavior_type_intent`, `apply_rest`, `apply_reward_slot`, `apply_synergy_mechanic`, `ensure_collect`, `evaluate_map_balance`, etc.
- `horse_racing` (7 functions): `create_race`, `create_ai_race`, `simulate_race`, `tick_race`, `update_horse_after_race`, `can_unlock_slot`, `run_balance_test`.
- `mutant_battle_ball` (16 functions): `assemble_mutant`, `tick_match`, `resume_match`, `init_match`, `make_agent`, `assign_roles`, `move_toward`, `nearest_enemy`, `resolve_tackle`, `resolve_block`, `apply_wound`, `calculate_stats`, `get_carrier`, `make_substitution`, `call_timeout`, `build_match_render_state`.
- `scrapcrawl` (13 functions): `get_room`, `move_player`, `can_move_to`, `can_craft`, `craft`, `resolve_fight`, `growth_factor`, `lookup_tier`, `room_has_interaction`, `init_player`, `reset_position`, `copy_table`, `shallow_copy_player`.
- `shoal` (69 functions): `compute_fish_forces`, `compute_shark_forces`, `force_align`, `force_arrive`, `force_cohere`, `force_flee`, `force_seek`, `force_separate`, `force_wander`, `graze_nodule`, `compute_exposure_rate`, `count_alive`, `cull_at`, `distance`, `build_render_state`, `get_state_summary`, `clamp_depth`, `generate_procedural_color`, `handle_input`, etc.
- `slime_coin` (23 functions): `start_round`, `end_round`, `tick_game`, `update_floor_physics`, `update_shelf_physics`, `trigger_landing_effects`, `trigger_synergy_effect`, `trigger_chip_synergy`, `trigger_pocket_boom`, `fire_coin`, `exchange`, `select_card`, `draw_from_pool`, `generate_card_offer`, `shop_purchase`, `count_adjacent_type`, `distance`, `get_state_summary`, etc.
- `slimeworld` (62 functions): `breed_slimes`, `breed_accent`, `breed_shape`, `circular_distance`, `circular_hue_midpoint`, `dominant_color`, `find_accent_type`, `find_metallic_accent`, `find_shape_target`, `calculate_stats`, `buy_upgrade`, `advance_cycle`, `assign_garrison`, `claim_success_chance`, `force_claim_action`, `bribe_claim_action`, `convert_claim_action`, `deliver_contract`, `create_wanderer_petition`, `calculate_worker_income`, `check_wilds_unlock_condition`, etc.
- `slither_rogue` (19 functions): `build_segments`, `_follow`, `_update_player`, `_update_npcs`, `_decay_acid_drops`, `spawn_fruit`, `spawn_fruit_from_config`, `check_evolution_trigger`, `select_evolution_pool`, `update_evolution_effects`, `decide_npc_action`, `generate_npc`, `calculate_grade`, `build_render_state`, `get_state_summary`, `tick_game`, `init_game`, etc.

---

## 4. Cross-game duplicate logic not in `engine/`

Functions that appear in two or more games, are not in `engine/`, and are therefore the actual candidates for a future extraction directive (subject to the existing "2+ games" rule):

| Function | Games | Sample locations |
|---|---|---|
| `advance_node` | `brewfield`, `dissonance` | `games/brewfield/logic.lua:913` / `games/dissonance/logic/run_state.lua:465` |
| `build_render_state` | `shoal`, `slither_rogue` | `games/shoal/logic.lua:424` / `games/slither_rogue/render.lua:5` |
| `calculate_stats` | `mutant_battle_ball`, `slimeworld` | `games/mutant_battle_ball/logic.lua:9` / `games/slimeworld/breeding.lua:303` |
| `copy_table` | `brewfield`, `scrapcrawl` | `games/brewfield/logic.lua:22` / `games/scrapcrawl/logic.lua:21` |
| `distance` | `shoal`, `slime_coin` | `games/shoal/utils.lua:26` / `games/slime_coin/logic.lua:110` |
| `get_enemy_intent` | `brewfield`, `dissonance` | `games/brewfield/logic.lua:418` / `games/dissonance/logic/combat.lua:209` |
| `get_state_summary` | `shoal`, `slime_coin`, `slither_rogue` | `games/shoal/logic.lua:497` / `games/slime_coin/logic.lua:906` / `games/slither_rogue/logic.lua:98` |
| `init_game` | `shoal`, `slime_coin`, `slither_rogue` | `games/shoal/logic.lua:3` / `games/slime_coin/logic.lua:147` / `games/slither_rogue/state.lua:32` |
| `init_player` | `brewfield`, `scrapcrawl` | `games/brewfield/logic.lua:436` / `games/scrapcrawl/logic.lua:224` |
| `lerp` | `shoal`, `slimeworld` | `games/shoal/utils.lua:45` / `games/slimeworld/breeding.lua:236` |
| `tick_game` | `shoal`, `slime_coin`, `slither_rogue` | `games/shoal/logic.lua:15` / `games/slime_coin/logic.lua:857` / `games/slither_rogue/logic.lua:6` |

---

## 5. Conclusion

The evidence does **not** support a broad extension of `engine/primitives` or `engine/systems` at this time. The real picture is:

1. **Only `engine/primitives/action.lua` is genuinely shared.** `clamp` is used by `scrapcrawl`, `shoal`, `slimeworld`, and `slither_rogue`; `collect` is used by `horse_racing` and `dissonance`. `brewfield` still duplicates `clamp` locally.
2. **`engine/primitives/entity.lua` is almost unused.** Only `slime_coin` calls `copy_entity`; `generate_id` and `validate_entity` have no callers in the audited games.
3. **`engine/primitives/movement.lua` is narrowly used.** `dist2` is used by `shoal` and `slither_rogue`; other movement helpers are not.
4. **The remaining seven engine files are effectively unused in the audited game Lua.** `consequence` is a placeholder, `lifecycle` is constants, `physics`/`combat`/`resolution` are not called, and `genetics`/`market`/`odds` are horse-racing-specific and only `horse_racing` actually uses `genetics` and `odds` (not `market`).
5. **The cross-game duplicates list (`copy_table`, `get_state_summary`, `init_game`, `tick_game`, `calculate_stats`, `distance`, `lerp`, etc.) is the real extraction backlog.** These are not in `engine/` today and would be the target of a future extraction directive, not the existing eleven files.

**Verdict for ADR-007/005:** Current divergence is largely justified — most engine primitives are either horse/betting-domain specific or stubbed, and the handful of genuinely reusable helpers (`clamp`, `collect`, `dist2`) are already in `action`/`movement`. A follow-up retrofit should focus on (a) making games use `action.clamp` instead of local duplicates, and (b) extracting the cross-game duplicate table above into new shared primitives when a second game needs them.
