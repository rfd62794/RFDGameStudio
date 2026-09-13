# Conquest Territory System Specification
**Date**: 2026-03-03
**Status**: DRAFT (Pre-implementation)

This document formalizes the engine design contract for the "Conquest System," dictating how culture zones expand, maintain supply, and contest borders during the overarching territory simulation.

## System Models

The system is visualized and simulated through two distinct (but mechanically linked) structural models.

### 1. Grid Model (Conway Variant)
Used for continuous spatial territory mechanics (`culture_wars.py` prototype).
- **`TerritoryCell`**: Represents a single uniform coordinate, holding exactly one culture ID or `EMPTY`.
- **`TerritoryGrid`**: The overarching structure handling neighbor sampling, generation steps, and spatial checks.

### 2. Network Graph Model (Node Variant)
Used for the overarching world map simulation (`culture_node_wars.py` prototype).
- **`WorldNode`**: Represents a discrete point of interest (e.g., a city, camp, or region hub). Holds attributes for `culture_id`, `strength`, `pressure_cache`, and `is_capitol`.
- **`WorldChannel`**: The edges connecting `WorldNode`s, acting as supply lines and pressure vectors.
- **`WorldGraph`**: The overarching structure connecting nodes, generated via Poisson-disk sampling for organic layouts.

---

## Core Simulation Rules

The simulation increments via a `ConquestTick`. In the game loop, this correlates to the overnight/day-transition processing.

### Culture Survival Rules
Each culture possesses unique thresholds for survival. If the neighbor count violates these bounds, the cell dies (turns `EMPTY`).

- **Ember**: (min: 2, max: 3) — Aggressive expander, standard survival.
- **Gale**: (min: 1, max: 3) — Fastest expander, survives isolation (wind finds gaps).
- **Marsh**: (min: 2, max: 4) — Slow expander, survives crowding (roots hold ground).
- **Crystal**: (min: 2, max: 3) — Standard, geometric growth.
- **Tundra**: (min: 1, max: 3) — Slow, endures cold alone.
- **Tide**: (min: 3, max: 5) — Social, needs company, surges.
- **Void**: (min: 2, max: 3) — Balanced, never expands.

### RPS Birth Resolution (Philosophy B)
When an `EMPTY` space is contested by multiple adjacent cultures, the dominant culture is decided by an RPS matrix:
- **Ember** beats Gale, Marsh
- **Gale** beats Tundra, Tide
- **Marsh** beats Crystal, Gale
- **Crystal** beats Tide, Ember
- **Tundra** beats Ember, Crystal
- **Tide** beats Marsh, Tundra
- **Void** draws all (acts as a ceasefire barrier)

*Tiebreaker:* If neighbors are tied in raw count, the culture with the RPS advantage secures the birth.

### Capitol & Collapse Mechanics
The densest cluster of a given culture is designated as its **Capitol**.
- If a Capitol is consumed by an enemy, the culture enters a **Collapse** mode for 40 simulation ticks.
- **Collapse Penalty**: The culture ceases all births/expansion and suffers a survival penalty across all borders.
- **Recovery**: The culture recovers if a minimum mass (`COLLAPSE_MASS = 15`) is rebuilt and maintained after the penalty duration.

### Pressure & Supply Systems
- **Frontier System**: Cells adjacent to an enemy or empty cell are "Frontier" cells. They exert expansion pressure.
- **Supply System (BFS)**: Uses Breadth-First Search to track distance to the nearest "Interior" cell (a cell entirely surrounded by its own culture).
- **Supply Range Penalty**: If a Frontier cell is >12 traversals from an Interior cell, it suffers a severe survival penalty (Overextension decay).

---

## Visual Identity Spec

The rendering engine strictly adheres to the following visual rules to communicate system state:

1. **Frontier Highlighting**: Frontier cells glow with brighter variants of their base color.
2. **Interior Dimming**: Safe, interior cells render at a lower brightness to reduce visual noise.
3. **Capitol Markers**: Capitols are explicitly highlighted with a solid white contrasting ring to indicate the heart of the empire.
4. **Supply Chain Overlay**: Disconnected/overextended cells render with a translucent red overlay `(255, 0, 0, 80)` to warn of impending collapse.
5. **Collapse State**: Entire cultures blink/flicker at half-brightness while suffering Collapse mode.
