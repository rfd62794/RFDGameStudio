# AntSim Redux — Changelog

Full detail for changes to AntSim Redux.
Studio-wide summary: [`/CHANGELOG.md`](../../CHANGELOG.md)
Roadmap: [`./ROADMAP.md`](./ROADMAP.md)

---

## Phase 4h — Defense Location Scoping Correction — COMPLETED

**Date:** August 2026

### What was fixed

- **Territory-Scoped Defensive Engagement**: Added `isInOwnTerritory`
  location clause (`y >= 600` for player colony 0, `y <= 200` for
  opposition colony 1) to `isDefenderAgainstIntruder` in `src/combat.ts`.
- **Shared Lane Population Stabilization**: Smugglers/infiltrators
  passing through the shared foraging lane (200-600) no longer trigger
  unconditional engage from ordinary foragers, restoring standard
  odds-based agency and resolving population collapse.

### Test anchors

- Anchor #118: Unconditional Engage for Defender Against Intruder in
  Home Territory — PASSED
- Anchor #119: Ordinary Shared-Lane Encounter Odds-Based Decision — PASSED
- Anchor #120: Defense Location Scoping Probe (Shared Lane vs Home
  Territory) — PASSED

---

## Phase 4g — Delivery Relevance & Persistent Wander — COMPLETED

**Date:** August 2026

### What was built

- **Fix A (Queen Delivery Pre-Check)**: Redirects food-carrying ants
  arriving at Queen Chamber to Storage when `queenHealth >= 0.95`,
  eliminating redundant delivery lines without altering low-health
  feeding math.
- **Fix B (Persistent Wander Commitment)**: Adds `wanderTicksRemaining`
  to commit ants to a heading during trail-less wander, immediately
  resetting to 0 upon recovering a valid pheromone trail or sensing food.

### Test anchors

- Anchor #112: Queen Health Redirect Probe (Health >= 0.95) — PASSED
- Anchor #113: Genuine Low-Health Queen Delivery Regression — PASSED
- Anchor #114: Real Wander Persistence Heading Commitment — PASSED
- Anchor #115: Trail-Recovery Wander Reset — PASSED
- Anchor #116: Task-Committed Wander Violation — PASSED
- Anchor #117: Multi-Trial Anchor 46 & 110 Reliability — PASSED

---

## Phase 4f — Infiltration / Theft / Defense & Food Drops — COMPLETED

**Date:** August 2026

### What was built

- Boundary exemption for `infiltrating` state
- Enemy tunnel navigation
- Automated defender response
- Food theft/smuggling
- Food dropping on ground/combat mortality

### Test anchors

- Anchors #104–#111: Phase 4f Infiltration, Smuggling & Defense Probes — ALL PASSED

---

## Phase 4e — Food as a Real Object — COMPLETED

**Date:** August 2026

### What was built

- **`FoodItem` Interface & Data Model**: Added `FoodItem` interface
  (`id`, `x`, `y`, `amount: 1`, `carrierAntId?`, `ownerColonyId`) to
  `src/types.ts` and `foodItems: FoodItem[]` array to `Colony`.
- **Real Pickup Creation**: When an ant reaches a food node, a real
  `FoodItem` object is instantiated and pushed to `colony.foodItems`.
- **Four-Point Resolution**: Upon reaching any of the four consumption
  points (feed Queen, feed Queen while dead, feed larvae, store to
  Storage), the paired `FoodItem` is cleanly removed.
- **Deferred Visual Rendering**: Visual rendering of food items in
  `src/render.ts` explicitly deferred to Phase 4f.

### Test anchors

- Anchors #99–#103 — ALL PASSED

---

## Phase 4d — Max Age Retune + Combat & Agency System — COMPLETED

**Date:** August 2026

### What was built

- **Part 0 Max Age Default**: Retuned `workerMaxAge` from 10,000 to
  20,000 (~320s).
- **Part A Agency Decisions (`assessEncounter`)**: Autonomous per-ant
  decision logic in `CombatSystem`. Ants evaluate local numerical
  advantage within `encounterRadius = 40` against an age-biased threshold.
  Agency decisions make zero health changes.
- **Part B Lanchester Square-Law Combat Resolution (`resolveCombat`)**:
  Engaging ants in direct contact suffer square-law damage rate
  `baseCombatDamage * (enemyLocalCount^2) / Math.max(1, allyLocalCount^2)`.
- **Brood Destruction Exception**: An egg carried by an ant that dies
  from combat damage is destroyed. Hunger and aging deaths preserve
  the drop-alive default.
- **Deferred Linear-Law Gap**: Only square law implemented (open terrain);
  linear law (chokepoint case) has nowhere to occur due to Hard Boundary
  system.

### Test anchors

- Anchors #91–#98 — ALL PASSED

---

## Phase 5 — SRP Extraction & Open/Closed Pathfinding — COMPLETED

**Date:** August 2026

### What was built

- **`TunnelNetwork` Extraction** (`src/tunnel_network.ts`): All topology
  generation, excavation face math, underground footprint/boundary
  enforcement, chamber destination scoring, and digging progression.
- **`ColonyLifecycle` Extraction** (`src/colony_lifecycle.ts`): Worker
  spawning, mortality cleanup, queen mortality and emergency egg
  promotion/creation, egg incubation and hatching, hunger/aging mechanics.
- **Thin Orchestrator** (`src/simulation.ts`): Refactored `Simulation`
  to compose `TunnelNetwork` and `ColonyLifecycle`, maintaining full
  backwards-compatibility.
- **Open/Closed Graph Traversal** (`getTunnelWaypoints`): Replaced
  hardcoded compound route `if` chain with generic BFS over tunnel
  connections, producing byte-identical waypoint paths while supporting
  arbitrary future tunnel topologies.

---

## Phase 4c — Worker Max Age Config Promotion & Anchor Hardening — COMPLETED

**Date:** August 2026

### What was built

- **SimConfig Promotion**: `workerMaxAge?: number` added to `SimConfig`.
- **Configurable Default**: `workerMaxAge` default set to 20,000 (~320s).
- **Anchor 69 Hardening**: Converted to repeated-trial format (10 trials,
  requiring >= 7 passes) to eliminate single-trial signal noise.
- **Anchor 90 Calibration**: Adjusted compound sub-check thresholds
  based on empirical data, achieving 100% test suite pass reliability
  (90/90) across 10+ consecutive full suite runs.

---

## Phase 4b — Hunger, Worker Aging & Test Anchor Hardening — COMPLETED

**Date:** August 2026

### What was built

- **Statistical Hardening**: Anchors #5, #46, and #71 converted/retuned
  to multi-trial statistical structures, achieving 100% test suite
  reproducibility.
- **Hunger Decay** (`HUNGER_DECAY_PER_TICK = 0.00025`): Every tick,
  `ant.energy` decays linearly (4000 ticks from 1.0 to 0.0).
- **Storage Chamber Energy Restoration**: Ants entering Storage with
  low energy consume food store to restore energy to 1.0.
- **Sustained Zero-Energy Damage**: After 50 ticks at zero energy,
  gradual starvation damage applied (0.02/tick), killing in 50 more
  ticks unless refueled.
- **Worker Aging & Max Age Death**: `ant.age` increments every tick.
  At `WORKER_MAX_AGE`, `ant.health = 0`, routing through `processDeadAnts`.
- **Queen Max Age Deferral**: Queen aging explicitly deferred. Target
  Queen-to-worker lifespan ratio: 5x (30,000 ticks), 10x fallback.

### Test anchors

- Anchors #85–#90 — ALL PASSED

---

## Phase 4a — Worker Health Foundation — COMPLETED

**Date:** August 2026

### What was built

- **Ant Struct Extension**: `Ant` interface extended with normalized
  `health: number` (0.0–1.0, initialized to 1.0).
- **Targeted Damage Function (`damageAnt`)**: Applies exact damage,
  flooring safely at 0.
- **Dead Ant Processing (`processDeadAnts`)**: Executed at start and
  end of `sim.tick()`. Removes ants with `health <= 0` and decrements
  population cleanly.
- **Cargo Clean-Up On Death**: Dying worker carrying food loses it;
  carrying an egg drops it at current coordinates for retrieval.

### Test anchors

- Anchors #80–#84 — ALL PASSED

---

## Phase 3b-6 — Absolute Lane Boundary System + Correction — COMPLETED

**Date:** August 2026

### What was built

- **Flat Unconditional Y-Coordinate Clamp**: Player colony ants clamped
  to `y >= 200`; opposition colony ants clamped to `y <= 600`. Guarantees
  3-lane territorial wall.
- **Digging-Phase Boundary Interaction Investigation**: Empirical probe
  measuring coordinate changes across 100,000+ digging ant ticks.
  Confirmed `repositionedCount === 0` — digging movement inherently
  produces coordinates within `isPointInUndergroundFootprint`.

### Test anchors

- Anchors #77, #78, #79 — ALL PASSED

---

## Phase 3b-5 — Hard Underground Boundary System — COMPLETED

**Date:** August 2026

### What was built

- **Always-Applied Underground Boundary**: Unconditional check for every
  underground ant every tick, regardless of velocity source.
- **Real Geometry Chamber-or-Corridor Check**: Valid if inside any
  colony chamber rectangle or within corridor radius 12 of any tunnel
  line segment.
- **Undug Surface Tunnel Special Case**: Bounded to excavated waypoints
  until tunnel is dug.
- **Nearest Valid Point Clamp**: Ants outside footprint clamped to
  nearest point on chamber edge or tunnel corridor boundary.
- **Cross-Colony Spatial Isolation**: Boundary checks enforce isolation
  against ant's own colony only.

### Test anchors

- Anchors #73–#76 — ALL PASSED

---

## Phase 3b-3 & 3b-4 — Per-Colony Pheromone Recognition & Cargo Exemption — COMPLETED

**Date:** August 2026

### What was built

- **Isolated Pheromone Grids**: Each colony instantiates its own distinct
  `PheromoneGrid`.
- **Independent Decay & Deposit**: `pheromones.decay()` runs independently
  for both colonies.
- **Biologically-Grounded Foreign Trail Repulsion**: Ants sensing foreign
  trails apply gentle steering repulsion bias away.
- **Cargo Exemption Correction**: Ants carrying food or eggs are strictly
  exempted from foreign trail repulsion. Non-carrying foragers continue
  to experience full repulsion.

### Test anchors

- Anchors #67–#72 — ALL PASSED

---

## Phase 3b-1 & 3b-2 — Colony/Faction Architecture Refactor & Multi-Colony — COMPLETED

**Date:** August 2026

### What was built

- **Colony Interface & Faction Data Model**: Singleton fields
  restructured into `colonies: Colony[]` array.
- **Bidirectional Proxy Accessors**: `nest`, `queen`, `chambers`,
  `tunnels`, `ants`, `eggs` exposed as both getters and setters.
- **Opposition Colony Integration**: `colonies[1]` at top surface,
  digging upward, zero spatial overlap.
- **Independent Digging & Succession**: Opposition colony runs its own
  queen health decay/succession pipeline.

### Test anchors

- Anchors #56–#58, #60–#66 — ALL PASSED

---

## Phase 3a & 3a-2 — Tunnel Digging: Surface Exit Gating & Congregation — COMPLETED

**Date:** August 2026

### What was built

- **Surface-Exit Tunnel Excavation**: `nest.tunnelDug` starts `false`.
  Digging targeted at Tunnel 1 (Storage to Surface Entrance).
- **Decentralized Stigmergic Digging**: Up to `maxConcurrentDiggers`
  (default 4) ants contribute. Sub-linear sqrt-scaling:
  `tunnelDigRatePerAnt * Math.sqrt(effectiveDiggers) * 0.016` per tick.
- **Congregation & Overflow Routing**: Overflow ants route to dig face
  but remain excluded from progress calculations.
- **Critical Survival Path**: Disabling digging results in queen
  starvation within ~12,000 ticks (~170-180s sim-time).

### Test anchors

- Anchors #47–#55 — ALL PASSED

---

## Phase 2f — Emergency Egg Creation & Guaranteed Succession Path — COMPLETED

**Date:** August 2026

### What was built

- **Guaranteed Emergency Egg**: When queen death triggers with zero
  pending Nursery eggs, colony generates one emergency `Egg` at Queen
  Chamber (`isRoyalCandidate = true`, `careLevel = 0.5`).
- **Deferred Queenless State**: `isQueenless` NOT set when emergency egg
  created — colony remains active.
- **Stale Candidate Guarantee Fix**: Promotion resets
  `incubationSeconds = 0` and floors `careLevel = Math.max(existing, 0.5)`,
  giving any promoted candidate a fresh runway. Hands-off AI trials
  confirmed 10/10 success rate (~15s median to revival).

### Test anchors

- Anchors #40–#46 — ALL PASSED

---

## Phase 2e — Queen Mortality & Emergency Succession — COMPLETED

**Date:** August 2026

### What was built

- **Sustained Zero-Health Death Trigger**: `zeroHealthElapsedSeconds`
  accumulates when `queenHealth === 0`. Crossing 10.0s threshold triggers
  death.
- **Royal Candidate Selection**: Highest `careLevel` egg selected at
  moment of death.
- **Royal Jelly Feeding**: Boosted feeding (+0.70 care gain vs +0.35
  regular) for Royal Candidates.
- **Emergency Succession**: Royal Candidate completing incubation with
  `careLevel >= 0.5` hatches into new living Queen.
- **Queenless Colony State**: If no pending egg at death, or candidate
  rearing fails, `isQueenless = true` — egg production ceases.

### Test anchors

- Anchors #34–#39 — ALL PASSED

---

## Phase 2d — Larval Care & Dead Code Cleanup — COMPLETED

**Date:** August 2026

### What was built

- **Dead Code Cleanup**: `population.ts` cleared, `PopulationController`
  completely removed. Zero orphaned spawn-trigger logic remains.
- **Comparative Three-Way Routing**: `selectFoodReturnChamber` balances
  Storage, Nursery, and Queen Chamber dynamically.
- **Larval Feeding via Trophallaxis**: Ants delivering food to Nursery
  raise lowest-care egg's `careLevel` (+0.35).
- **Incubation Gating & Decay**: `careLevel` decays over time.
  Incubation progress scales with `careLevel` (full speed at 1.0 down
  to 0.25x at 0.0).

### Test anchors

- Anchors #29–#33 — ALL PASSED

---

## Phase 2c — Trophallaxis, Queen Feeding & Egg Lifecycle — COMPLETED

**Date:** August 2026

### What was built

- **Dynamic Queen Health & Routing**: `queenHealth` decays over time.
  Food-carrying ants score destinations using comparative model
  (`queenPull = (1.0 - queenHealth) * 3.0 + 0.1` vs `storagePull = 1.0`).
- **Trophallaxis**: Ants reaching Queen Chamber transfer food to
  `queenHealth` (+0.25 HP, clamped to 1.0).
- **Egg Laying**: Successful feedings roll for `eggLayChance` (0.6) to
  produce `Egg` entity at Royal Chamber.
- **Egg Transport**: Ants carry eggs from Royal Chamber to Nursery.
- **Egg Hatching**: Eggs incubate and hatch into new ants (+1 population).
  Population growth is strictly Queen-egg-driven.

### Test anchors

- Anchors #22–#28 — ALL PASSED

---

## Phase 2b — Exploration Behavior & Chamber Presence — COMPLETED

**Date:** August 2026

### What was built

- **Exploration Chance**: Ants following trails roll tunable chance
  (`explorationChance = 0.12`) to ignore trail and forage independently.
- **Nursery Spawning**: New population spawns at underground Nursery
  Chamber coordinates.
- **Queen Entity Presence**: Queen exists as distinct entity in Royal
  Chamber with mutable `queenHealth`.

### Test anchors

- Anchors #17–#21 — ALL PASSED

---

## Phase 2a — Single-Coordinate Underground Chambers & Tunnels + Food Lifecycle — COMPLETED

**Date:** August 2026

### What was built

- **Chambers as Stations**: Granary Storage -> Nursery -> Royal Chamber,
  positioned below `groundLevelY` in horizontal line.
- **Tunnel Network**: Ordered waypoint sequences connecting surface exit
  to chambers. Ants MUST use tunnel network.
- **Food Lifecycle**: Depleted food nodes removed; replacement spawns at
  fresh random position with full `maxQuantity`. Active food node count
  conserved.

### Test anchors

- Anchors #12–#15 — ALL PASSED

---

## Phase 1 — Pheromone Signaling & Foraging Baseline — COMPLETED

**Date:** August 2026

### What was built

- **Direct Sensing Priority**: Direct food perception strictly outranks
  pheromone trail lookup and exploration rolls.
- **Runaway Trail-Stacking Protection**: Pheromone deposit strength and
  decay rate tuned alongside strict cell intensity cap
  (`maxCellStrength = 1.0`).

### Test anchors

- Anchors #1–#11 — ALL PASSED
