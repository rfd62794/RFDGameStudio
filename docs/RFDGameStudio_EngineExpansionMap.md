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

**TS-side extraction status (Aug 22, 2026): extraction started, not yet closed.**
Shoal's proven steering forces (`forceSeek`, `forceFlee`, `forceSeparate`,
`forceAlign`, `forceCohere`, `forceAvoid`) have been extracted to
`ts/src/engine/shared/aiBehavior/steering.ts` as generic, accessor-based
pure functions. Shoal now imports from the shared module — behavioral
equivalence proven via deterministic 100-tick simulation comparison
(34 tests in `test_engine_aiBehavior.ts`). The Lua-side
`ai_behavior.lua` primitive remains unimplemented; the TS extraction
covers steering forces only, not decision-making (`decide`,
`seek_nearest`). Adoption by Slither Rogue and Mutant Battle Ball is
**explicitly not yet started** — Phase 2 will investigate their real
needs before expanding the shared interface.

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
| `portalAdapter` | `ts/src/engine/shared/portalAdapter/` | **Phase 1: detection + interface shell (Aug 22 2026); Phase 2: Y8 adapter (Aug 22 2026); Phase 3: Shoal wired (Aug 22 2026)** | Shoal — first live consumer (Y8 SDK script + notifyGameplayStart/Stop at real transitions) |
| `aiBehavior` | `ts/src/engine/shared/aiBehavior/` | **Phase 1: steering forces extracted from Shoal (Aug 22, 2026); Phase 2: Yuka FSM adapter added (Aug 22, 2026)** | Shoal — first live consumer (steering forces + behavioral states) |

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

### `portalAdapter` — v1: detection + interface shell (Aug 22 2026)

A single, shared abstraction letting any game call a small, unified
interface (`notifyGameplayStart`, `notifyGameplayStop`,
`requestAdBreak`) safely from anywhere — the adapter decides at runtime
whether anything actually happens, based on which real environment the
build is running in.

- **Real, confirmed technical basis:** Poki and CrazyGames both require
  a `gameplayStart()`/`gameplayStop()` session pair plus an ad-break
  call — conceptually identical patterns across both. CrazyGames
  requires runtime detection via `CrazySDK.IsAvailable` plus a
  query-param fallback for iframed cases.
- **v1 scope is the shell only.** No real portal SDK is wired in yet —
  this phase works correctly with **zero portals present**, defaulting
  to safe no-ops everywhere. Real SDK integration is a later, separate
  phase per `RFDGameStudio_MultiPortalPublishing.md`.
- **Detection:** `classifyPortalEnvironment(input)` is a pure function
  of an explicit environment snapshot (hostname, SDK globals present,
  query params) — fully testable without a real browser.
  `detectPortalEnvironment()` is a thin wrapper reading real runtime
  globals and delegating. Detects: `own_site`, `itch`, `crazygames`,
  `poki`, `unknown`.
- **⚠️ `unknown` behaves identically to `own_site`** — safe, silent
  no-op. Never assume a portal is present; only confirm one via a real,
  positive detection signal.
- **Locked interface:** `notifyGameplayStart()`, `notifyGameplayStop()`,
  `requestAdBreak(): Promise<void>` — permanent public shape. Later
  phases fill in real SDK calls *behind* these signatures; they do not
  change what games call.
- **No live consumers yet.** Zero game components import this module
  this phase — confirmed by a grep-anchor test. Live game integration
  is a deliberate future phase.
- **Tests:** `tests/test_engine_portalAdapter.ts` (29 tests): pure
  classifier coverage for all 6 environments (incl. y8), unknown≡own_site
  equivalence, interface safety with zero portals, real-runtime wrapper
  with mocked SDK globals, and a grep anchor confirming no live game
  imports the module.

### `portalAdapter` — Phase 2: Y8 adapter (Aug 22 2026)

Real Y8 SDK wrapper living behind Phase 1's locked interface. Y8's real
developer dashboard documents a real SDK loaded from
`https://cdn.y8.com/minimal-sdk/2-0/y8.min.js`, initialized via a
`y8sdk.ready` event + `y8.sdk().init()` call, with ad breaks via
`y8Sdk.showAd({ type, beforeAd, afterAd })`.

- **Real type-mapping decision (locked):** Y8 has five real ad types
  (`reward`, `next`, `start`, `pause`, `browse`). Phase 1's generic
  `requestAdBreak()` gained a real optional `AdBreakContext` parameter
  (`'launch' | 'transition' | 'reward'`) that maps to exactly three of
  Y8's five types:
    - `'launch'` → `showAd({ type: 'start' })`
    - `'transition'` → `showAd({ type: 'next' })`
    - `'reward'` → `showAd({ type: 'reward' })`
- **⚠️ `'pause'` and `'browse'` are intentionally unimplemented** — real
  Y8 types with no current mapped consumer. Named in comments, not
  implemented, matching the project's standing discipline against
  speculative building. Adding them requires extending `AdBreakContext`
  first, which is a deliberate future decision.
- **Script injection:** `injectY8Script()` injects the real
  `<script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js">` tag at
  runtime, only when `detectPortalEnvironment()` genuinely returns `'y8'`
  — never loads Y8's SDK on own_site, itch, or any other environment.
  Idempotent (won't inject a duplicate tag).
- **⚠️ No hardcoded Shoal credentials.** `appId`/`gameId` are real
  required parameters to `initY8(config)` — Phase 3 supplies Shoal's
  real values (`6a8a38fd3daf0b765651b797` / `281135`) from Shoal's own
  config, not from this shared adapter file. Confirmed by test.
- **Detection update:** `'y8'` added to `PortalEnvironment` type.
  Detected via `window.y8` global presence or `?portal=y8` query-param
  fallback. `isPortalEnvironment('y8')` returns `true`.
- **Interface update:** `requestAdBreak(context?)` — the optional
  `AdBreakContext` parameter defaults to `'transition'`. When env is
  `'y8'` and the SDK is initialized, dispatches to `y8RequestAdBreak()`.
  When the SDK isn't initialized yet, resolves immediately (safe no-op).
- **No live consumers yet.** Zero Shoal files (or any other game's
  files) import `portalAdapter` — confirmed by grep-anchor test. Phase 3
  will wire Shoal as the first real consumer.
- **Tests:** `tests/test_engine_portalAdapter_y8.ts` (25 tests):
  type-mapping (3 distinct assertions + pause/browse exclusion),
  `y8RequestAdBreak` per context, script injection (real tag, no
  duplicate, real CDN URL), script-injection gating regression (does
  NOT fire on own_site/itch/unknown), `initY8` idempotency + script
  injection + ready-event resolution, no-hardcoded-credentials check,
  no-Shoal-imports grep anchor.

### `portalAdapter` — Phase 3: Shoal wired as first live consumer (Aug 22 2026)

Shoal is the first real, live consumer of the Y8 adapter built in
Phase 2. This is presentation/telemetry wiring — calling the adapter at
real, existing state transitions — not new game logic.

- **Real state transitions found (read, not invented):** Shoal has a
  `title` → `game` screen transition via `handleStart` (title screen
  "Start" button) and a `game` → `title` transition via the "← Title"
  button. `notifyGameplayStart()` is wired into `handleStart`;
  `notifyGameplayStop()` is wired into the "← Title" button onClick.
  Both are real, confirmed call sites in `App.tsx`.
- **Honest finding on pause state:** Shoal has NO separate pause
  state. The Mechanics overlay is an informational popup, not a pause
  — the simulation (`useGameLoop`) runs unconditionally while on the
  game screen. There is no `paused`/`isPaused` flag. This is by design
  (continuous sandbox), not a gap. `notifyGameplayStop` has exactly one
  real call site (the title button), which is the honest, complete
  wiring.
- **Y8 SDK script tag:** Added to `src/standalone/shoal/index.html`
  `<head>` (the real source template, not the generated dist). Vite
  strips non-module external scripts during build, so
  `vite.shoal.config.ts` gained a `preserveY8ScriptTag()` plugin that
  re-injects the tag into the built `dist-shoal/index.html` via
  `transformIndexHtml`. Confirmed: the tag survives a real
  `npm run build:shoal` and appears in `dist-shoal/index.html`.
- **Credentials:** Shoal's real `appId` (`6a8a38fd3daf0b765651b797`)
  and `gameId` (`281135`) live in `src/games/shoal/y8Config.ts` —
  Shoal's own config, not the shared adapter. These are public
  identifiers meant to ship in the client bundle (Y8's own SDK snippet
  embeds them directly in the page), not privileged secrets.
- **Gated initialization:** `initY8(SHOAL_Y8_CONFIG)` is only called
  when `detectPortalEnvironment() === 'y8'` — never on own_site, itch,
  or unknown. The SDK script tag loads async in the HTML, but the
  adapter only initializes when the environment is genuinely Y8.
- **Shared adapter not modified.** All files in
  `engine/shared/portalAdapter/` are unchanged from Phase 2 —
  confirmed by a git-diff test anchor.
- **Tests:** `tests/test_shoal_y8_integration.ts` (15 tests): config
  file with real credentials, script tag in source + dist (survives
  build), App.tsx wiring (imports, call sites, gated init), shared
  adapter unchanged, honest pause/stop state findings.

### Shoal — Color Variation Expansion + Movement Investigation (Aug 22 2026)

**Color expansion** — wired in existing-but-dead code and extended the
decay-lerp pattern. All changes in Shoal's shared source (no Y8 files).

- **Lineage color inheritance:** `inheritHue` existed in
  `shoal.config.ts` but was never called by the simulation. Added
  `generateInheritedColor` to `shoalSimulation.ts` — bred offspring now
  inherit a hue from their parent (±15° drift), creating visible
  lineage color families. `newFish`/`newShark`/`spawnFish`/`spawnShark`
  accept an optional `parentColor` parameter; breeding calls pass the
  parent's `lineageColor`. Initial spawns still use
  `generateProceduralColor` (no parent).
- **Age saturation in rendering:** `AGE_CURVE` and `applyAgeSaturation`
  existed in `shoal.config.ts` but `App.tsx` didn't apply them. Added
  `getAgeAwareBatchColor` — batches by (hue band, age stage) so young
  creatures render at 0.6× saturation (paler) vs mature at full
  saturation. Preserves the existing batching pattern.
- **3-stop decay gradient:** Flesh chunks now go red (`#f43f5e`) →
  orange (`#f97316`) → gold (`#eab308`) instead of 2-stop red → gold.
  New `chunk_decay_mid_color` config in `data.yaml`. Extends the
  existing decay-lerp mechanic with one more stop.
- **Tests:** `tests/test_shoal_color_expansion.ts` (16 tests):
  inherited color generation, hue proximity, reserved-color avoidance,
  breeding inheritance, 3-stop config, age saturation rendering, no Y8
  file changes.

**Movement/steering investigation (report only, no code changes):**

The directive's initial note said "No separation/alignment/cohesion
terms were found anywhere in the file." That was wrong — direct full
reading of `shoalSimulation.ts` confirms all three exist, explicitly
named, with tunable weights:

- `forceSeparate` (line 154) — separation: pushes away from nearby
  neighbors. Weight: `steering_weights.fish.separate = 1.0`.
- `forceAlign` (line 156) — alignment: matches velocity of nearby
  neighbors. Weight: `steering_weights.fish.align = 0.6`.
- `forceCohere` (line 157) — cohesion: moves toward average position
  of neighbors. Weight: `steering_weights.fish.cohere = 0.35`.
- All three called in `computeFishForces` (lines 179-181) with
  `perception.school = 70` radius.

Full fish steering: seek algae (1.0), flee shark (2.5), separate (1.0),
align (0.6), cohere (0.35), avoid chunks/algae (0.8), depth bias (0.8),
wander (0.4). Full shark steering: seek fish (1.5) or seek flesh (1.5)
or wander (0.3) + depth bias, avoid chunks/algae (0.5), exposure
retreat. All weights are in `data.yaml` `steering_weights` section —
fully tunable, nothing hardcoded in the movement logic.

Additional movement features: `limitTurn` (speed-dependent turn rate),
drag (`Math.pow(0.99, dt/0.1)`), spatial hash for O(n) neighbor
queries, world-wrap on X axis.

**Yuka assessment: NOT warranted.** Shoal already has a complete, tuned,
named steering behavior system (seek, flee, arrive, wander, separate,
align, cohere, avoid, depth-arrive) with tunable weights and spatial-
hash-accelerated neighbor queries. Adopting Yuka would mean replacing
working, tested, performant code with an external dependency that does
the same thing. No genuine need — the standing discipline (extract or
adopt from real proven need, not because a candidate was interesting)
applies.

### `aiBehavior` — Phase 1: steering force extraction from Shoal (Aug 22, 2026)

**Extraction done, adoption by other games explicitly not yet started.**

Shoal's proven, tested steering forces have been extracted to
`ts/src/engine/shared/aiBehavior/steering.ts` as generic, accessor-
based pure functions. This is pure extraction — zero new capability,
zero behavior change. The `ai_behavior` gap named above is partially
addressed (steering forces only; decision-making primitives like
`decide` and `seek_nearest` remain unimplemented on both Lua and TS
sides).

**What was extracted:**
- `forceSeek` — seek toward a target position
- `forceFlee` — flee away from a threat position (radius-limited)
- `forceSeparate` — separation from neighbors (inverse-distance repulsion)
- `forceAlign` — alignment with neighbor velocities
- `forceCohere` — cohesion toward neighbor centroid
- `forceAvoid` — avoidance of obstacles (with id-based exclusion)

**Design decision — accessor callbacks, not interface conformance:**
Shoal uses `depth` for the Y axis and `vd` for Y-velocity. Rather than
baking field names into the shared API (which would force every
consumer to adopt the same naming), the neighbor-based functions accept
accessor callbacks that extract position/velocity from whatever entity
shape the caller uses. This avoids per-tick object allocation
(critical for hot-path performance — Shoal runs 60+ agents at 60Hz)
while keeping the force computation logic in one place. `forceSeek` and
`forceFlee` take raw position numbers, so they need no accessors.

**Behavioral-equivalence proof:**
The pre-extraction Shoal simulation was run with seed=42 for 100 ticks
and the full state (fish/shark positions, velocities, alive flags,
aggregate stats) was captured. After extraction, the same simulation
produces byte-identical output to 10 decimal places. A 500-tick
stability test confirms no divergence or NaN propagation over longer
runs. 34 tests in `test_engine_aiBehavior.ts` (16 unit tests for the
extracted functions + 6 behavioral-equivalence tests + 7 structural
tests + 5 no-change-to-other-games tests).

**What was NOT done (deferred to Phase 2+):**
- Slither Rogue and Mutant Battle Ball adoption — their real needs
  must be investigated before expanding the shared interface
- Decision-making primitives (`decide`, `seek_nearest`) — not extracted
- Lua-side `ai_behavior.lua` — remains unimplemented
- Yuka adoption — **warranted and implemented in Phase 2** (see below)

### `aiBehavior` — Phase 2: Yuka FSM adapter for behavioral states (Aug 22, 2026)

**Additive layer on top of Phase 1's proven steering forces.**

Yuka v0.7.8 added as the first external gamedev-specific dependency
studio-wide. Used exclusively for its `StateMachine`/`State` FSM
classes — Yuka's own steering-behavior classes are never imported or
used (grep-verified, test-enforced). See ADR-022 for full reasoning.

New files:
- `ts/src/engine/shared/aiBehavior/yukaStates.ts` — generic
  `BehavioralState`/`BehavioralStateMachine` wrapper
- `ts/src/engine/shared/aiBehavior/yuka.d.ts` — minimal type
  declarations (only `State` and `StateMachine`, enforcing the boundary)

Shoal now has real behavioral states:
- **Fish:** `Schooling` (align/cohere/separate dominant), `Foraging`
  (seek_algae boosted, schooling reduced), `Fleeing` (flee_shark
  dominant, schooling suppressed)
- **Shark:** `Hunting` (seek_fish/seek_flesh), `Resting` (wander only,
  hunting suppressed), `Fleeing` (retreat dominant)

State transitions use Shoal's real existing entity fields (hunger,
exposure, proximity, inRetreat) — no new tracked values invented.
Config thresholds in `behavioral_states` section of CONFIG.

The force math itself is unmodified — proven by the fixed-state
equivalence test (FSMs disabled via `_setFsmDisabled(true)` →
byte-identical to pre-Yuka output). 19 tests in
`test_engine_yukaStates.ts` (state execute, transitions, fixed-state
equivalence, Yuka steering non-import regression).

## Arcade metadata expansion — genre, descriptions, dates, patch notes, detail view (Aug 23, 2026)

**Real, honest schema expansion + a real new surface to show it, not just a UI tweak.**

`GameConfig` (`ts/src/engine/types.ts`) gains five new, fully optional/
additive fields: `shortDescription`, `longDescription`, `genre`
(single, curated `PrimaryGenre`), `tags` (looser, secondary), and
`patchNotesPath`. Every existing registry entry that hasn't adopted
these fields keeps working unmodified — no forced migration.

### Real architectural decision: where genre/tags actually live

`game-metadata.json` (`ts/src/games/game-metadata.json`) is a
**gitignored, auto-regenerated-from-git artifact** — confirmed by
direct read of `studio_mcp/game_metadata.py`'s `generate_game_metadata()`,
which rebuilds `created`/`last_updated`/`version`/`tracked` fresh from
git on every run. This is the wrong home for hand-curated data like
genre/tags to live authoritatively — a naive edit would be silently
wiped on the next regeneration (the file only ever explicitly carried
`pipeline_stage` forward, via `_load_existing_pipeline_stages`).

**Real decision made:** `genre`/`tags` live authoritatively on each
game's real, version-controlled `GameConfig` (`config.ts`) — the arcade
UI (`GameSelector.tsx`, `GameDetailView.tsx`) reads genre/tags from
there, and reads `last_updated`/`created`/`version` from
`game-metadata.json` only. To honor this directive's literal request
to also extend `game-metadata.json` with genre/tags (useful for
cross-pipeline, non-TS visibility), the on-disk JSON carries a synced
copy, and `generate_game_metadata()` was extended with a new
`_load_existing_curated_fields()` + `existing_curated` parameter,
carrying genre/tags forward across regeneration exactly like
`pipeline_stage` — verified by a real regeneration run
(`write_game_metadata()`) that confirmed the hand-added values survive.
5 new Python tests in `tests/test_game_metadata.py`.

### Real genre classification — 30 registered games, honest results

All `GAME_REGISTRY` games were assessed directly against the curated
11-value taxonomy (creature-collector, combat-arena, economic-precarity,
colony-4x, idle-incremental, roguelike, racing, puzzle-stealth,
cooperative, narrative-persuasion, management-sim). Real, honest
findings:

- **27 of 30** fit cleanly and were assigned a genre.
- **3 of 30 genuinely don't fit** and were left without a `genre`
  rather than forced, per the directive's explicit rule — `shoal`
  (continuous, no-player-agency ecosystem simulation), `slime_coin`
  (real-time arcade coin-pusher physics), `7_days_to_fry` (cooking
  survival). Each has an explanatory code comment and real `tags`
  instead. Regression-tested in `test_arcade_metadata_expansion.ts`.
- The 3 studio tool entries (`character_viewer`, `technique_showcase`,
  `role_symbol_viewer`, all `status: 'tool'`) were also left
  ungenred — the taxonomy is for games, and these are explicitly not
  competitive games.

### Real detail view — `GameDetailView.tsx`

A modal (reusing the existing `ui/components/Modal.tsx`, not a new
routing pattern — no full-page route needed since the content is
short-lived and per-card) triggered by a new "Details" button on each
arcade card, added as a real, nested `<button>` with
`stopPropagation()` so it never triggers the card's own
play/navigate click. The outer `.arcade-card` changed from `<button>`
to `<div role="button" tabIndex={0}>` with Enter/Space key handling,
to make the nested Details button valid HTML (no nested interactive
elements) while staying keyboard-accessible.

Shows: description via a real fallback chain
(`longDescription → shortDescription → description → ''`, exported
standalone as `resolveDetailDescription()` for direct unit testing),
genre + tags as badges, real `last_updated` pulled from
`game-metadata.json` (omitted entirely, not fabricated, for the games
with no metadata entry — e.g. `gladiator_arena`, `planetforge`,
`character_viewer` aren't in the Python side's `GAME_PATHS` dict), and
real patch notes content loaded via a new
`ts/src/games/patchNotesLoader.ts` (`import.meta.glob` over
`./*/PATCH_NOTES*.md`, keyed by real relative path — never a
duplicated/copied string). A `patchNotesPath` set but pointing at no
real file renders a real, visible "Patch notes unavailable" state
(`data-testid="game-detail-patch-notes-unavailable"`) — never silently
hidden, never fabricated placeholder content.

### Real subset actually populated this phase

Per the directive's explicit incremental-adoption allowance, only
**Succession** got the full field set this phase (`shortDescription`,
`longDescription`, `patchNotesPath` pointing at its real
`PATCH_NOTES_v0.2.0.md` from this session) — it's the one game with
real patch notes to show. All 30 registered games got `genre`/`tags`
(or an honest, documented non-fit). No other game has
`shortDescription`/`longDescription`/`patchNotesPath` yet — their
cards and detail views fall back to the existing `description` field,
exactly as the backward-compatibility rule requires.

20 new tests in `test_arcade_metadata_expansion.ts` (GameConfig
optionality, taxonomy validity + honest gaps, description fallback
chain, patch notes real-load + honest-failure, `last_updated` sourcing
+ honest-absence, genre/tags honest rendering, card-level wiring).

