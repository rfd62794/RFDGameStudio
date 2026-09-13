# Scene Template Guide

To maintain architectural consistency and accelerate development, all new scenes in `rpgCore` should inherit from one of the following standardized templates located in `src/shared/engine/scene_templates/`.

## 1. HubScene
**Use for:** Safe zones, home bases, world maps, or any menu-heavy "hub" with multiple exits.
- **Provides:** Persistent state management, a flavor text panel (bottom), and automated exit button generation.
- **Inherit from:** `HubScene`
- **Hook:** `on_enter(self, **kwargs)` - Define `self.exits` and `self.flavor_text`.

## 2. GardenSceneBase
**Use for:** Entity management, ambient simulation, creation modes, or any scene focused on interacting with objects in a 2D space.
- **Provides:** 70/30 split layout (Garden area / Detail panel), action bar (bottom), entity selection logic, and Shift-click multi-selection support.
- **Inherit from:** `GardenSceneBase`
- **Hooks:**
    - `on_garden_enter(self, **kwargs)`: Setup custom UI buttons/labels.
    - `pick_entity(self, pos)`: Implement collision detection for your entities.
    - `on_selection_changed(self)`: React to selection updates (e.g., enabling buttons).
    - `render_garden(self, surface)`: Draw your entities.
    - `update_garden(self, dt_ms)`: Update entity logic.

## 3. CombatSceneBase
**Use for:** Turn-based battles, encounters, or structured action sequences.
- **Provides:** Action bar (bottom), Turn order display (top), and lifecycle hooks for combatants.
- **Inherit from:** `CombatSceneBase`
- **Hook:** `on_combat_enter(self, **kwargs)`: Setup combatants and initial states.

---
**Note:** Always inherit from a template instead of `Scene` directly unless you are building a fundamentally new interaction pattern that warrants its own template.
