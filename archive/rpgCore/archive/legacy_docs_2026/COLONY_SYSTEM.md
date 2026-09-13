> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Colony System — Design Document

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
- They persist between battles. A unit that survived three fights is different from a fresh recruit.
- They accumulate experience. Veteran units have higher base stats than recruits.
- They have sympathy scores toward the astronaut, modified by witnessed events.
- They can defect if sympathy is high enough and conditions are right.
- They can die permanently. Losing a named unit that has been with you since the Ashfen Tribe joined is a real loss.

The first time you enter Ashfen territory, the game generates 3-5 named Unbound slimes. Those specific slimes exist for the rest of the campaign. If the colony disperses, those slimes are gone.

## Relationship Tracking
Each colony tracks relationships independently from its faction. A Red colony can have positive relations with the astronaut even while the Ember Clan is hostile. This creates:
- **Defection opportunities** — high-sympathy colonies may switch allegiance
- **Trade relationships** — friendly colonies trade regardless of faction stance
- **Safe passage** — colonies with positive relations don't attack on sight
- **Intelligence** — friendly colonies warn you of faction movements

Relationship modifiers:
- **+relations**: protecting adjacent colony, sharing resources, healing units, keeping promises
- **-relations**: attacking unprovoked, breaking agreements, starving garrison, burning buildings

## The Colony Map
Each colony has a unique persistent battlefield generated from its map_seed. This means:
- Fighting for Ashfen territory always happens on the same map
- That map reflects the colony's character — Unbound colonies have organic terrain, Red colonies have fortified positions, Blue colonies have defensive chokepoints
- Buildings constructed in a colony appear on its battlefield map
- A colony you've fought over multiple times has scarred terrain — obstacles from previous battles persist

## Buildings (Future Feature)
Buildings are colony improvements that provide persistent bonuses:
- **Scrap Forge** — converts raw scrap into equipment, increases unit attack
- **Food Store** — buffers food supply, prevents starvation during siege
- **Crystal Extractor** — passively generates crystals from deposits
- **Watch Tower** — early warning of faction movements, +1 action on surprise attacks
- **Medic Post** — reduces unit casualties after battle, heals veterans faster
- **Trust Circle** — Unbound-specific structure, accelerates sympathy growth in adjacent colonies

Buildings require resources to construct and time (actions) to build. They can be destroyed by enemy action. Rebuilding a destroyed Medic Post in a colony you've held for ten days feels different than building the first one.

## Colony Independence Within Factions
Factions are not monoliths. The Ember Clan has:
- **Hawk colonies** — aggressive, high military, low sympathy ceiling
- **Dove colonies** — war-weary, lower aggression, higher defection potential
- **Border colonies** — exposed, desperate, most likely to trade with outsiders

This means Red is not a wall. It has seams. Finding and exploiting those seams is the Unifier and Survivor's primary strategy.

## Integration with Existing Systems
- **FactionManager** — colonies register with faction, report relations independently
- **Day/Action System** — entering a colony costs 1 action, constructing a building costs 1-2 actions
- **Resource Economy** — colonies produce and consume Scrap, Food, Crystals based on type and buildings
- **Defection System** — End Day resolution checks colony sympathy scores for defection events
- **Territory Purpose** — colony type (RESOURCE/RECRUITMENT/STRONGHOLD/SHIP_PARTS) determines base production and unit specialty

## Implementation Priority
- **Phase 1 (Next)**: Persistent named units per colony, relationship scores, colony identity
- **Phase 2**: Unique battlefield maps per colony using map_seed
- **Phase 3**: Buildings system
- **Phase 4**: Colony independence modeling within factions

## Design Principle
Every colony should feel like a place worth caring about or a place worth fearing. The player should remember the name of the colony where their best unit died. They should remember the colony that switched sides and saved their campaign. Generic tiles do not create those moments. Persistent living colonies do.
