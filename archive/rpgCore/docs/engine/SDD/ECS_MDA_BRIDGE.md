# rpgCore ECS & MDA Architecture Bridge
**Design Document v1.0 — Living World Engine**

---

## 🎯 Purpose

This document maps the design documents (01-06) to concrete ECS component boundaries and names the MDA targets explicitly. It is the technical translation layer between design intent and implementation. Coding agents should read this alongside the relevant design document before implementing any system.

**This document does not redesign anything. It maps what already exists.**

---

## 🎭 MDA Framework — Design Intent

MDA separates what designers control from what players experience:

| Layer | Who Controls It | What It Is |
|-------|----------------|------------|
| **Mechanics** | Designer/Developer | Rules, systems, code |
| **Dynamics** | Emerges from play | Behavior arising from mechanic interaction |
| **Aesthetics** | Player feels it | Emotional experience |

You cannot code an Aesthetic directly. You code Mechanics, trust Dynamics to bridge, and design toward an Aesthetic target.

### Aesthetic Targets by Sub Loop

| Sub Loop | Mechanic Focus | Expected Dynamic | Aesthetic Target |
|----------|---------------|-----------------|-----------------|
| Breeder | Genetics, lifecycle, training | Generational attachment, lineage investment | **Pride, loss, legacy** |
| Conqueror | Territory, dispatch, resources | Faction identity, strategic consequence | **Power, risk, consequence** |
| Wanderer | Conversation, relationships, narrative | World understanding deepening over time | **Belonging, curiosity, discovery** |

### Core Aesthetic Target — All Players
**The crash-landing-don't-want-to-leave arc.**

Mechanics: Garden as hub, slimes as attachment objects, permanent loss, generational depth, world consequence.
Dynamic: Investment accumulates across systems without the player consciously choosing to invest.
Aesthetic: Belonging. The garden becomes home.

---

## 🏗️ ECS Architecture

### What ECS Means in This Codebase

- **Entity:** UUID only. No data, no behavior. Already implemented via Phase 1 UUID standardization.
- **Component:** Pure data bag attached to an entity. Already partially implemented (KinematicsComponent, BehaviorComponent from Phase 2).
- **System:** Logic that processes all entities possessing specific components. Operates on component data only — never calls other systems directly.

### The Golden Rule
Systems communicate through component data, never through direct system-to-system calls.

```python
# WRONG — system coupling
class ConquestSystem:
    def evaluate_slime(self, slime):
        tier = self.genetics_system.get_tier(slime)  # Direct call = coupling

# RIGHT — component data
class ConquestSystem:
    def evaluate_slime(self, slime):
        tier = slime.genetics_component.tier  # Read component = decoupled
```

---

## 📋 Entity Definitions

Every meaningful object in the game is an entity with components attached.

| Entity Type | Required Components | Optional Components |
|-------------|-------------------|---------------------|
| **Slime** | Kinematics, Genetics, Behavior, Render, Personality, Lifecycle | Equipment, Relationship |
| **Garden Room** | Spatial, Capacity, RoomType | Resource, Upgrade |
| **Dispatch Zone** | ZoneType, RiskLevel, ResourceReturn | NarrativeTrigger |
| **Culture Hub** | Faction, DiplomaticStanding | Inventory, QuestLog |
| **Ship** | RepairProgress, ScrapRequirement | NarrativeTrigger |
| **Trade Route** | Origin, Destination, Cargo | RiskLevel |
| **Wild Slime** | Kinematics, Genetics, Behavior, Render | — |

---

## 🧩 Component Definitions

### Already Implemented
```python
KinematicsComponent     # Position, velocity, physics — Phase 2
BehaviorComponent       # AI state, decision weights — Phase 2
```

### Needs Implementation — Core
```python
@dataclass
class GeneticsComponent:
    culture_expression: dict[str, float]  # Six culture weights summing to 1.0
    tier: int                              # 1-8, derived and cached
    tier_name: str                         # 'Blooded' through 'Void'
    stat_base: dict[str, int]             # Six stats
    shape_params: dict[str, float]        # width, height, irregularity
    color_genes: ColorGenes               # HSV values, blend mode
    pattern_genes: PatternGenes           # type, dominant, intensity
    lineage: LineageRecord                # generation, parent UUIDs, mutations

@dataclass
class PersonalityComponent:
    base_traits: dict[str, float]         # Derived from culture_expression at birth
    experience_delta: dict[str, float]    # Accumulated through gameplay
    # current_traits computed as property — not stored

@dataclass
class LifecycleComponent:
    level: int                            # 0-10
    stage: str                            # 'Hatchling' through 'Elder'
    experience_points: int                # toward next level
    generation: int                       # lineage depth
    age_ticks: int                        # time alive in game ticks

@dataclass
class RenderComponent:
    render_mode: str                      # 'world', 'intimate', 'silhouette'
    scale: float                          # relative to base unit
    expression_state: dict[str, float]   # eye, brow, mouth params
    visible: bool
    layer: int                            # draw order
```

### Needs Implementation — Systems
```python
@dataclass
class EquipmentComponent:
    slots: dict[str, str | None]          # 'hat', 'accessory', 'weapon' → item_id
    # Class is derived from equipment, never stored directly
    
@dataclass
class ResourceComponent:
    gold: int
    scrap: int
    food: int
    culture_resources: dict[str, int]     # culture-specific rare materials

@dataclass
class DiplomaticComponent:
    culture_id: str
    standing: dict[str, str]             # culture_id → 'Unknown'|'Neutral'|'Acknowledged'|'Trusted'|'Allied'
    
@dataclass
class DispatchComponent:
    status: str                           # 'available', 'dispatched', 'returning'
    current_zone: str | None
    dispatch_tick: int | None            # when dispatched
    return_tick: int | None              # when expected back
    zone_affinity: dict[str, float]      # derived from personality
```

---

## ⚙️ System Definitions

### Already Implemented (Partial)
```
PhysicsSystem           # Processes KinematicsComponent
BehaviorSystem          # Processes BehaviorComponent
RenderSystem            # Processes RenderComponent
SessionSystem           # UUID persistence — Phase 1
```

### Needs Implementation — Breeder Loop
```
GeneticsSystem          # Resolves alleles, computes tier, caches derived values
BreedingSystem          # Combines two parent genomes into offspring genome
TrainingSystem          # Processes minigame results → stat deltas on GeneticsComponent
AgingSystem             # Advances LifecycleComponent, triggers stage transitions
MentoringSystem         # Elder slimes influence nearby Hatchling/Juvenile stat growth
```

### Needs Implementation — Conqueror Loop
```
DispatchSystem          # Manages slime dispatch, zone assignment, return resolution
ConquestSystem          # Territory control, TD defense mode, FFT offense mode
ResourceSystem          # Resource flow between all systems via ResourceComponent
RiskSystem              # Permanent loss probability on high-danger dispatch return
```

### Needs Implementation — Wanderer Loop
```
ConversationSystem      # Dialogue tree management, choice tracking
RelationshipSystem      # Updates DiplomaticComponent standing over time
NarrativeSystem         # Monitors world state, triggers story beats
```

### Needs Implementation — Rendering Extension
```
ExpressionSystem        # Computes expression_state params from PersonalityComponent
VisualNovelSystem       # Manages intimate render mode, scene framing, dialogue UI
PatternSystem           # Renders genetic patterns via noise functions
```

---

## 🔄 System Processing Order (Per Frame)

```
1. InputSystem              # Player intent
2. NarrativeSystem          # World state checks, story triggers (infrequent)
3. AgingSystem              # Lifecycle advancement (infrequent)
4. BehaviorSystem           # AI decisions (on state transition, not every frame)
5. PhysicsSystem            # Kinematics update
6. TrainingSystem           # Stat updates from active minigame
7. ResourceSystem           # Resource flow resolution
8. DispatchSystem           # Dispatch status updates (infrequent)
9. ExpressionSystem         # Expression state computation
10. RenderSystem            # Draw everything
```

**Performance note:** Systems marked infrequent do not run every frame. AgingSystem might run once per second. NarrativeSystem might run once per minute. DispatchSystem runs on events. This is the key performance optimization — personality/behavior evaluates on state transitions, not per frame.

---

## 🗺️ Mapping Design Documents to ECS

| Design Document | Primary Components | Primary Systems |
|----------------|-------------------|-----------------|
| 01 World Bible | DiplomaticComponent, ResourceComponent | NarrativeSystem, RelationshipSystem |
| 02 Genetics System | GeneticsComponent | GeneticsSystem, BreedingSystem |
| 03 Aging & Lifecycle | LifecycleComponent | AgingSystem, MentoringSystem |
| 04 Visual Expression | RenderComponent, GeneticsComponent | RenderSystem, ExpressionSystem, PatternSystem |
| 05 Personality System | PersonalityComponent | BehaviorSystem, ExpressionSystem |
| 06 Game Systems Map | DispatchComponent, ResourceComponent | DispatchSystem, ConquestSystem, ResourceSystem |

---

## 🎯 Implementation Priority

Based on current engine state (700+ tests passing, ECS foundation from Phase 2):

**Phase 3 — Needle Movers (implement next):**
1. `GeneticsComponent` — formalizes what genetics already tracks informally
2. `LifecycleComponent` — enables aging and mentoring
3. `DispatchSystem` generalization — converts RaceEngine to handle all zone types
4. `ResourceSystem` — unifies gold/scrap/food across demos

**Phase 4 — Loop Completion:**
5. `BreedingSystem` — formal allele resolution
6. `ConquestSystem` — TD defense + FFT offense modes
7. `PersonalityComponent` — behavior differentiation at scale
8. `RelationshipSystem` — culture hub standing

**Phase 5 — Experience Layer:**
9. `VisualNovelSystem` — intimate render mode, dialogue UI
10. `NarrativeSystem` — crash landing arc, story beats
11. `ExpressionSystem` + `PatternSystem` — full visual grammar

---

## 🚫 What Not To Build Yet

- Auto-mode AI (Phase 3 optimization, not foundation)
- Full narrative arc (needs systems foundation first)
- Performance optimization passes (premature without profiling)
- ADJ swarm integration (paused — engine progress takes priority)

---

## 🧪 The Test Floor Contract

Current floor: **700+ passing tests, zero failures.**

Every implementation directive must:
1. State which components and systems it touches
2. Specify the test floor it must maintain
3. Include a pre-flight audit step before writing code
4. Verify test count after implementation

No system goes in without tests. No tests break without explicit acknowledgment and resolution.

---

**Bridge Document**: 2026-03-01  
**Version**: 1.0  
**Status**: IMPLEMENTATION READY  
**Dependencies**: All design documents 01-06, ECS foundation Phase 2
