# RFDGameStudio — Engine Expansion Map
*June 2026 | Planning document. Not a directive. Add to this before writing any code.*

---

## Current Engine State

### Primitives (what's actually there)

| File | Status | Contents |
|---|---|---|
| `action.lua` | Thin | clamp, rand_int, rand_item — basic math only |
| `entity.lua` | Functional | generate_id, copy_entity, validate_entity |
| `lifecycle.lua` | **Empty** | Just event name constants. No functions. |
| `consequence.lua` | **Placeholder** | Comment only. Explicitly deferred. |
| `resolution.lua` | Narrow | scores_to_odds only — betting-specific |
| `physics.lua` | Grid-only | grid_collision, self_collision — no continuous physics |
| `movement.lua` | Functional | advance_position, move_grid, in_bounds, dist2, normalize_angle, atan2 |

### Systems (what's actually there)

| File | Origin game | Generalizability |
|---|---|---|
| `genetics.lua` | horse_racing | Medium — stat generation is generic, naming is horse-specific |
| `market.lua` | horse_racing | Medium — pricing patterns reusable, horse names baked in |
| `odds.lua` | horse_racing | High — pure math, no game-specific content |
| `combat.lua` | mutant_battle_ball | Low — very specific to 2v2 possession combat |

---

## Identified Gaps

### Primitive gaps (enrich existing files)

**`lifecycle.lua` — needs actual functions:**
- `tick_age(entity, dt)` → entity with incremented age
- `get_stage(entity, stages_config)` → current stage name
- `can_advance(entity, stages_config)` → bool
- `advance_stage(entity, stages_config)` → updated entity
- `is_mature(entity, stages_config)` → bool (can breed/deploy)
- `apply_death(entity)` → marked entity

**`consequence.lua` — needs to become real:**
- `apply_outcome(entity, outcome_key, config)` → updated entity
- `score_performance(entity, context)` → numeric score
- `generate_loot(loot_table, rng_seed)` → item list
- `apply_stat_change(entity, stat, delta)` → updated entity

**`resolution.lua` — generalize beyond betting:**
- Keep `scores_to_odds`
- Add `resolve_contest(participants, weights)` → winner index
- Add `resolve_check(value, difficulty, variance)` → bool
- Add `weighted_choice(options, weights)` → selected option

**`physics.lua` — add continuous physics:**
- `circle_overlap(a, b)` → bool (a, b: {x, y, radius})
- `resolve_overlap(a, b)` → {dx, dy} separation vector
- `elastic_impulse(a, b)` → {avx, avy, bvx, bvy}
- `apply_friction(vx, vy, friction)` → {vx, vy}

**`action.lua` — add missing utilities:**
- `collect(t)` → Lua-native sequence (lupa proxy fix)
- `weighted_random(options, weights)` → selected option
- `lerp(a, b, t)` → interpolated value
- `clamp_v2(x, y, min_x, min_y, max_x, max_y)` → {x, y}

---

### New systems needed (new files in `engine/systems/`)

**`dispatch.lua` — idle loop primitive**
The foundational pattern for OperatorGame, SlimeGarden, rpgCore.
- `create_job(entity_id, job_type, duration_sec, payload)` → job record
- `tick_jobs(jobs, dt)` → {active: [], resolved: []}
- `resolve_job(job, resolver_fn)` → outcome table
- `cancel_job(jobs, job_id)` → updated jobs

**`roster.lua` — entity collection management**
Managing a pool of entities with availability, deployment state, cooldowns.
- `add(roster, entity)` → updated roster
- `remove(roster, entity_id)` → updated roster
- `get_available(roster, current_time)` → entity list
- `get_deployed(roster)` → entity list
- `set_cooldown(roster, entity_id, duration_sec, current_time)` → updated roster
- `is_ready(entity, current_time)` → bool

**`breeding.lua` — breeding loop wrapper around genetics**
genetics.lua handles stat generation. breeding.lua handles the loop around it.
- `can_breed(parent_a, parent_b, config)` → bool, reason
- `attempt_breed(parent_a, parent_b, genetics_config)` → offspring or nil
- `apply_breed_cooldown(entity, cooldown_sec, current_time)` → updated entity
- `get_compatibility(parent_a, parent_b)` → 0.0–1.0 score

**`resources.lua` — resource pipeline**
Gather → convert → store. VoidDrift's ore chain. rpgCore's ResourceFlow.
- `tick_production(resources, rates, dt)` → updated resources
- `can_afford(resources, cost)` → bool
- `spend(resources, cost)` → {updated_resources, bool}
- `deposit(resources, amounts)` → updated resources
- `convert(resources, recipe)` → {updated_resources, bool}

**`progression.lua` — milestone and unlock gates**
Every game has progression gates — all implemented locally. Should be shared.
- `check_milestones(state, milestone_config)` → triggered list
- `unlock(state, unlock_id)` → updated state
- `is_unlocked(state, unlock_id)` → bool
- `get_progress(state, milestone_id)` → 0.0–1.0
- `apply_reward(state, reward_config)` → updated state

**`ai_behavior.lua` — entity decision and movement**
slither_rogue has sophisticated NPC AI locally. MutantBattleBall has agent AI locally.
- `wander(entity, bounds, dt)` → updated entity
- `chase(entity, target, speed, dt)` → updated entity
- `flee(entity, threat, speed, dt)` → updated entity
- `seek_nearest(entity, targets, filter_fn)` → nearest target or nil
- `decide(entity, context, behavior_tree)` → action_id

**`inventory.lua` — item and card management**
SlimeCoin pocket coins, shop items. Any deckbuilder or RPG item system.
- `add_item(inventory, item)` → updated inventory
- `remove_item(inventory, item_id)` → updated inventory, bool
- `has_item(inventory, item_id)` → bool
- `count_item(inventory, item_id)` → int
- `use_item(inventory, item_id, target, effect_fn)` → {updated_inventory, result}

---

### Additional gaps identified from project history

**Culture/faction system** — SlimeGarden had multiple slime cultures with different
bonuses, visual identities, and behaviors. This is a faction primitive that affects
all other systems (genetics outcomes, dispatch results, terrain compatibility).
Not yet identified as a system name — needs design before implementation.

**Terrain/zone system** — TurboShells had terrain types that favored specific
genetic combinations. SlimeGarden had garden zones. rpgCore ConquestSystem had
conquest zones. A zone primitive with entity affinity scoring.

**Deferred event queue** — VoidDrift's core pattern: things happen while you're
away. When you return, queued events fire in order. Different from dispatch (which
tracks timer state). This is a wall-clock event system.

**Wave/encounter spawner** — rpgCore ConquestSystem planned TD-style waves.
Enemies appear on a schedule with escalating difficulty.

**Save/load abstraction** — the Lua layer has no save primitive. VoidDrift saves
in Rust, horse_racing uses TS localStorage. Games that need persistence have to
solve it themselves. A `save_state(key, state)` / `load_state(key)` contract.

**Visual expression from data** — TurboShells rendered turtle appearance (shell
radius, leg length, color) entirely from genetic sequence. No sprites — pure math.
A visual expression primitive: `express_entity(entity, expression_config)` →
render parameters.

**Prestige/reset mechanics** — discussed for rpgCore and VoidDrift. A run ends,
something carries over, the next run is different. Pattern: `prestige(state,
carry_over_config)` → new_state with preserved values.

---

## Template scaffolds needed

Three starter templates covering the three major game patterns:

### `templates/idle_dispatch/`
Pattern: OperatorGame, SlimeGarden, rpgCore
- Entities dispatched to jobs, return with outcomes
- Roster management with cooldowns
- Resource accumulation while away
- Files: data.yaml, logic.lua (with dispatch + roster + resources), systems.yaml, ui.yaml

### `templates/breeding_sim/`
Pattern: TurboShells, SlimeGarden genetics
- Entity pool with genetic stats
- Breeding loop with compatibility and cooldowns
- Market/valuation from career performance
- Files: data.yaml, logic.lua (with genetics + breeding + roster + market), systems.yaml, ui.yaml

### `templates/realtime_arcade/`
Pattern: slither_rogue, slime_coin, mutant_battle_ball
- GAME_STATE + tick_game(dt, input) every frame
- Continuous physics (circle collision)
- Event emission from tick
- Files: data.yaml, logic.lua (with physics + resolution + lifecycle events), systems.yaml, ui.yaml

### `templates/resource_idle/`
Pattern: VoidDrift inner ring
- Production rates, conversion chains
- Deferred consequence events
- Unlock gates based on resource thresholds
- Files: data.yaml, logic.lua (with resources + progression + deferred events), systems.yaml, ui.yaml

---

## What I know I'm missing

Robert said there's more. Known unknowns:

- [ ] Scoring/grade system — mentioned across multiple games, no shared primitive
- [ ] Network/multiplayer primitives — not explored yet
- [ ] Tutorial/onboarding system — VoidDrift has a full FSM tutorial, nothing shared
- [ ] Audio event hooks — games emit events that TS could trigger audio on; no contract
- [ ] Anything from rpgCore systems not yet named here

**Add to this document before writing any directives.**

---

## TS shared modules (what's actually there)

*Tracking the TS-native shared layer (`ts/src/engine/shared/`), parallel to the
Lua tables above. Added as the TS surface became the studio default. Each entry
is a real, landed module — not a gap.*

| Module | Path | Status | Real consumers |
|---|---|---|---|
| `seededRandom` | `ts/src/engine/shared/seededRandom.ts` | Functional | artGen, SlimeVisual, Planet of Greed aiDecisions, personGenerator |
| `wheelRelation` | `ts/src/engine/shared/wheelRelation.ts` | Functional | element-wheel classification |
| `partSlots` | `ts/src/engine/shared/partSlots.ts` | Functional | 6-slot body-part type system |
| `combat` | `ts/src/engine/shared/combat.ts` | Functional | RPS combat resolver (254 lines) |
| `componentTypes` | `ts/src/engine/shared/componentTypes.ts` | Functional | shared UI component contracts |
| `sportsSim` | `ts/src/engine/shared/sportsSim/` | Built, first consumer (MBB) not yet wired | generic possession/violence sports engine |
| `anatomy` | `ts/src/engine/shared/anatomy/` | Functional | body-plan / part system |
| `personGenerator` | `ts/src/engine/shared/personGenerator/` | **New — v1 (role symbols), Aug 22 2026** | Succession (mapping only — `data/figureArchetypeMap.ts`); preview at `games/role_symbol_viewer` |

### `personGenerator` — v1: role symbols (Aug 22 2026)

Generic person generator meant to make future demos easier — starting simple,
growing later. v1 scope is **role-based symbols only**: archetype → SVG
shape / charge / palette. Deliberately not full character portraits or
individual-level variation (deferred).

- **Vocabulary:** 5 real archetypes — `ruler`, `warrior`, `cleric`,
  `merchant`, `scholar` (`archetypes.ts`). Archetypal, not game-specific
  titles: Succession's Chancellor/Archbishop/Commander *map onto* these;
  they are not the archetype list.
- **Pure logic:** `generateRoleSymbol(archetype, seed?)` is deterministic
  (mulberry32 via `seededRandom.ts` — no second randomness primitive).
  Same archetype + same seed → byte-identical spec.
- **Render:** `RoleSymbol.tsx` — native SVG only, zero-dependency (matches
  the studio's confirmed graphics primitive).
- **Palette:** base colors sourced from `ts/src/ui/tokens.css`
  (`--accent`, `--red`, `--yellow`, `--green`, `--amber`), not invented.
- **First real consumer:** Succession's 5 cast members (3 court figures +
  2 rival claimants) mapped in `games/succession/data/figureArchetypeMap.ts`.
  Mapping only — **not wired into any live Succession UI this phase**
  (AudienceStage.tsx restructure is in-flight elsewhere). Wiring is a
  deliberate future phase.
- **Real finding:** Succession's cast maps onto 4 of 5 archetypes
  (ruler/warrior/cleric/merchant); `scholar` is unused. Two figures
  (chancellor, vivienne) both map to `ruler` — permitted, the vocabulary
  is archetypal not one-to-one. No sixth archetype was needed.
- **Preview surface:** `games/role_symbol_viewer` (registered in
  `registry.ts`), matching the `character_viewer`/`technique_showcase`
  pattern — all 5 symbols rendered standalone for visual verification.
- **Tests:** `tests/test_engine_personGenerator.ts` (16 tests):
  determinism, archetype distinctness, token-sourced palette verification,
  full 5-cast mapping, and a grep anchor confirming no live Succession UI
  imports the module.

