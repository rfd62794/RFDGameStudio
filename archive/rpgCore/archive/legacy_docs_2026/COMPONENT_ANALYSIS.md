> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Component Analysis — rpgCore Shared Systems

This document analyzes existing engine components to determine their readiness for integration into the Slime Clan demo.

---

## 1. Entity & Kernel Systems (`src/game_engine/systems/`)

### What does it actually do at a code level?
- **ECS Architecture**: Implements a strict Entity Component System. `EntityManager` coordinates `ObjectPool` instances for specific entity types (`SpaceEntity`, `RPGEntity`, etc.).
- **Lifecycle Management**: Entities and Components follow a protocol (`initialize`, `update`, `shutdown`).
- **Template Spawning**: Supports spawning entities from JSON-like configurations via a template registry.

### What would it take to integrate?
- **Effort**: Medium. Slime units are currently standalone dataclasses. Integrating involves inheriting from `RPGEntity` and moving logic (like Mana/HP regen) into `EntityComponent` subclasses.
- **Benefit**: High. Enables high-concurrency combat (30v30) with optimized memory pooling.

### Pillar Mapping
- **DQM**: Managing monster stats and varieties.
- **FFT**: Tactical status effects and state machines via components.

---

## 2. Faction System (`src/dgt_engine/logic/faction_system.py`)

### What does it actually do at a code level?
- **Territorial Simulation**: Uses SQLite to track X/Y coordinate ownership across multiple factions.
- **Causality Engine**: Simulates "ticks" where factions expand, initiate conflicts, and resolve territory transfers based on power/aggression levels.
- **Relationship Matrix**: Global registry of hostile/allied/neutral statuses between id-based factions.

### What would it take to integrate?
- **Effort**: High. Requires mapping the existing node-based overworld to a coordinate grid. The `OverworldScene` would transition from static nodes to querying the `FactionSystem` for local control.
- **Benefit**: Crucial for a "living world." Replaces hardcoded battle spawns with dynamic AI expansion.

### Pillar Mapping
- **Civ**: The core of territorial management and reputation.

---

## 3. World Map & Location Factory (`src/dgt_engine/game_engine/`)

### What does it actually do at a code level?
- **Schema-Driven**: Uses Pydantic for `Location` and `WorldObject` serialization.
- **Procedural Generation**: `location_factory.py` uses pools of descriptors, NPCs, and props to generate unique instances (e.g., "The Rusty Flagon" vs "The Silver Tankard") from generic templates.

### What would it take to integrate?
- **Effort**: Low to Medium. We can attach a `Location` object to each node in the `OverworldScene`. When "entering" a node, the UI can display these environmental tags and interactive props.
- **Benefit**: Adds flavor and explorable depth to what is currently just a navigation point.

### Pillar Mapping
- **Civ**: World structure.
- **DQM**: Discovery of unique items/props.

---

## 4. Dashboard UI Components (`src/dgt_engine/ui/components/`)

### What does it actually do at a code level?
- **Terminal UI**: Built on `rich`. Implements a `Live` dashboard with a 4-zone fixed grid (Viewport, Vitals, Inventory, Goals).
- **Component Registry**: Synchronizes state between character stats (`VitalStatus`) and the visual display (`VitalsComponent`).

### What would it take to integrate?
- **Effort**: High (Visual), Low (Logical). The `rich` components can't run inside the Pygame window. However, the *state models* (`VitalStatus`, `InventoryItem`) are perfect for the Slime Clan data layer. The visual aspect would require a Pygame implementation of the same "Fixed-Grid" architecture.
- **Benefit**: Provides a blueprint for the "Director's Console" HUD.

### Pillar Mapping
- **UI/HUD**: Cross-pillar visualization.

---

## 5. Pygame Bridge (`src/game_engine/engines/pygame_bridge.py`)

### What does it actually do at a code level?
- **Entity Adapter**: Maps generic entity dicts (`type`, `x`, `y`, `heading`) to Pygame primitives (`pygame.draw.circle`, etc.). 
- **HUD Layer**: Direct text-to-surface rendering for scores and status.

### What would it take to integrate?
- **Effort**: Medium. We should evolve our `RenderAdapter` contract to match this bridge's pattern. This would allow `AutoBattleScene` to stop calling `draw_slime` directly and instead broadcast an entity list to a renderer.
- **Benefit**: Decouples logic from rendering completely.

### Pillar Mapping
- **DQM**: Visualizing the monsters and tactical combat.
