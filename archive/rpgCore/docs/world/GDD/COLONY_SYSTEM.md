# Colony System — World GDD
Authority: Design intent.
Source: archive/legacy_docs_2026/COLONY_SYSTEM.md
Content: Complete colony design for persistent named units and living world.

---

## Core Concept

Every node on the overworld map is not a tile — it is a Colony. Each colony is a unique, persistent, living settlement with its own identity, population, relationship history, and physical map. When you enter a colony you enter a specific place that remembers everything that happened there.

## Colony as Persistent Entity

A Colony has:
- **id** — unique identifier
- **name** — procedurally generated or hand-authored
- **faction** — current controlling faction (can change)
- **original_faction** — who founded it (never changes, affects personality)
- **population** — number of slime inhabitants
- **morale** — colony health, affected by war, famine, player actions
- **relations** — dictionary of relationship scores per faction including the astronaut
- **units** — persistent named unit roster, survives between battles
- **buildings** — list of constructed improvements (future feature)
- **map_seed** — unique seed generating this colony's battlefield layout
- **history** — log of significant events that occurred here

## Persistent Named Units

Each colony maintains a roster of named slime units. These are not generic soldiers — they are individuals:

### Unit Persistence
- They persist between battles. A unit that survived three fights is different from a fresh recruit.
- They accumulate experience. Veteran units have higher base stats than recruits.
- They have sympathy scores toward the astronaut, modified by witnessed events.
- They can defect if sympathy is high enough and conditions are right.
- They can die permanently. Losing a named unit that has been with you since the Ashfen Tribe joined is a real loss.

### Unit Identity
The first time you enter Ashfen territory, the game generates 3-5 named Unbound slimes. Those specific slimes exist for the rest of the campaign. If the colony disperses, those slimes are gone.

### Unit Memory
Units remember:
- Battles they fought in
- Other units they fought alongside
- Actions by the astronaut (rescue, abandonment, betrayal)
- Colony events (sieges, celebrations, disasters)

## Relationship Tracking

Each colony tracks relationships independently from its faction. A Red colony can have positive relations with the astronaut even while the Ember Clan is hostile.

### Relationship Effects
Positive colony relationships create:
- **Defection opportunities** — high-sympathy colonies may switch allegiance
- **Trade relationships** — friendly colonies trade regardless of faction stance
- **Safe passage** — colonies with positive relations don't attack on sight
- **Intelligence** — friendly colonies warn you of faction movements

### Relationship Modifiers
- **+relations**: protecting adjacent colony, sharing resources, healing units, keeping promises
- **-relations**: attacking unprovoked, breaking agreements, starving garrison, burning buildings

### Relationship Decay
Relationships decay over time without interaction. Maintaining positive relations requires ongoing engagement.

## The Colony Map

Each colony has a unique persistent battlefield generated from its map_seed.

### Battlefield Persistence
- Fighting for Ashfen territory always happens on the same map
- That map reflects the colony's character — Unbound colonies have organic terrain, Red colonies have fortified positions, Blue colonies have defensive chokepoints
- Buildings constructed in a colony appear on its battlefield map
- A colony you've fought over multiple times has scarred terrain — obstacles from previous battles persist

### Map Character
Colony terrain reflects cultural personality:
- **Unbound colonies**: Organic, natural terrain
- **Ember colonies**: Fortified positions, defensive structures
- **Marsh colonies**: Wetlands, natural barriers
- **Gale colonies**: Open terrain, movement advantages
- **Crystal colonies**: Ancient ruins, mysterious features
- **Tide colonies**: Tundra features, trade routes

## Buildings System

Buildings are colony improvements that provide persistent bonuses:

### Building Types
- **Scrap Forge** — converts raw scrap into equipment, increases unit attack
- **Food Store** — buffers food supply, prevents starvation during siege
- **Crystal Extractor** — passively generates crystals from deposits
- **Watch Tower** — early warning of faction movements, +1 action on surprise attacks
- **Medic Post** — reduces unit casualties after battle, heals veterans faster
- **Trust Circle** — Unbound-specific structure, accelerates sympathy growth in adjacent colonies

### Building Mechanics
- Buildings require resources to construct and time (actions) to build
- They can be destroyed by enemy action
- Rebuilding a destroyed Medic Post in a colony you've held for ten days feels different than building the first one
- Buildings persist across battles and affect colony performance

## Colony Independence Within Factions

Factions are not monoliths. The Ember Clan has:
- **Hawk colonies** — aggressive, high military, low sympathy ceiling
- **Dove colonies** — war-weary, lower aggression, higher defection potential
- **Border colonies** — exposed, desperate, most likely to trade with outsiders

### Faction Seams
This means Red is not a wall. It has seams. Finding and exploiting those seams is the Unifier and Survivor's primary strategy.

### Cultural Variation
Within each culture, colonies have:
- Different priorities based on location and history
- Varying relationships with other cultures
- Unique local traditions and behaviors
- Different attitudes toward the astronaut

## Integration with Game Systems

### FactionManager Integration
- Colonies register with faction, report relations independently
- Faction stance affects initial colony attitudes but doesn't determine them
- Colony defection impacts faction relationships

### Resource Economy Integration
- Colonies produce and consume Scrap, Food, Crystals based on type and buildings
- Trade relationships bypass faction restrictions
- Resource scarcity affects colony morale and defection likelihood

### Conquest System Integration
- Territory control becomes colony control
- FFT/Tower Defense modes happen on persistent colony maps
- Victory conditions include capturing colonies, not just territory

### Narrative System Integration
- Colony events generate narrative content
- Named units provide story hooks and emotional investment
- Colony history creates world-building opportunities

## Implementation Priority

### Phase 1: Core Colony System
- Persistent named units per colony
- Relationship scores and colony identity
- Basic colony management interface

### Phase 2: Persistent Battlefields
- Unique battlefield maps per colony using map_seed
- Terrain generation based on colony character
- Building placement and persistence

### Phase 3: Buildings System
- Construction mechanics and resource costs
- Building effects on colony performance
- Building destruction and rebuilding

### Phase 4: Colony Independence
- Faction seams and cultural variation
- Advanced defection mechanics
- Complex relationship webs

## Design Principle

Every colony should feel like a place worth caring about or a place worth fearing. The player should remember the name of the colony where their best unit died. They should remember the colony that switched sides and saved their campaign. Generic tiles do not create those moments. Persistent living colonies do.

## Conquest System Implications

The Colony System reframes ConquestSystem from territory control to colony management:

### Instead of Territory Nodes
- Colonies with identity and history
- Named units that persist across battles
- Buildings that affect gameplay

### Instead of Simple Control
- Complex relationship management
- Cultural variation within factions
- Persistent world state

### Instead of Generic Battles
- Battles on familiar, evolving terrain
- Units with memory and experience
- Buildings that provide strategic advantages

The Colony System transforms ConquestSystem from a tactical minigame into a living world system with persistent consequences and emotional investment.
