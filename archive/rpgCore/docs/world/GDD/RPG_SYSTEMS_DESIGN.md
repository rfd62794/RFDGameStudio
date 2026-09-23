# RPG Systems Design
**Status**: Architecture & Spec Phase

This document outlines the unified, scalable RPG systems that form the backbone of `rpgCore`. These systems are designed specifically to be engine-level infrastructure hosted in `src/shared/`, shareable across multiple demos (Dungeon Crawler, Space Trader, Creature Collector, etc.).

---

## 1. Grid Inventory System (Spatial Backpack)
Inspired by *Dredge* and classic ARPGs, the inventory is not a flat list but a 2D spatial grid.

- **Mechanics**:
  - The backpack is an `[X, Y]` grid array.
  - Items are defined by a `shape` matrix (e.g., a 1x1 potion, a 1x3 sword, a 2x2 shield, an L-shaped relic).
  - Adding an item requires finding an open spatial footprint that fits the item's matrix.
- **Demo Reuse**:
  - *Dungeon Crawler*: The player's standard loot bag.
  - *Space Trader*: The ship's cargo hold (shapes represent different cargo crates).
  - *Creature Collector*: The trainer's item bag.
- **Upgrades**: Grid dimensions expand via the Ascension System.

## 2. Character Screen & Equipment
The core visualization of an entity's combat readiness, merging spatial inventory with dedicated gear slots.

- **Layout**:
  - **Left Panel**: Portrait, Class Archetype, and Effective Stats list.
  - **Center Panel**: The Equipment Slots (Head, Body, Weapon, Offhand, Accessory) mapped to a paper-doll overlay.
  - **Right Panel**: The Grid Inventory (Backpack area).
- **Stat Calculation**:
  - Base Stats (from Level) + Modifiers (from equipped gear) = Effective Stats.
  - Stance multipliers (from `src/shared/combat/stance.py`) apply *after* equipment totals.
- **Interactions**: Drag-and-drop or click-to-equip interfacing between the Grid Inventory and the Equipment Slots.

## 3. Leveling System (In-Run Progression)
A temporary progression arc that defines the power curve of a single run.

- **XP Sources**:
  - Slaying enemies.
  - Exploring rooms (removing fog of war).
  - Identifying rare loot.
- **Growth Curves**:
  - Level thresholds scale exponentially to prevent over-leveling in early floors.
  - Class Archetypes (Fighter, Mage, Rogue) determine which stats bump upon level up.
- **Run Reset**: Leveling is completely reset upon death or successful extraction. Run power is ephemeral.

## 4. Ascension System (Meta-Progression)
The permanent progression layer that gives failure meaning and rewards survival. This is the overarching meta-layer that persists across deaths.

- **Ascension Points (AP)**:
  - Earned via run performance (floors cleared, bosses slain, rare items specifically extracted for AP rather than gold).
- **The Unlock Tree**: AP is spent at the Hub to purchase permanent account upgrades.
  - **Torch Capacity**: Increase starting torches from 1 -> 2 -> 3 -> 4 (allows deeper floor access).
  - **Backpack Expansion**: Add new rows/columns to the Grid Inventory footprint.
  - **Starting Capital**: Begin runs with a baseline gold reserve instead of 0.
  - **Ancestral Stat Bonuses**: Flat +1 or +2 to starting base stats.
  - **Class Unlocks**: Access to advanced archetypes beyond the triad (e.g., Paladin, Necromancer).

## 5. Shared Infrastructure Targets
The technical architecture required in `src/shared/` to support this design:

- `src/shared/items/grid_inventory.py` 
  - `GridCell`, `ItemShape`, `GridInventoryManager` (matrix collision logic).
- `src/shared/rpg/progression.py`
  - Constants for XP curves, LevelUp triggers, and base stat algorithms.
- `src/shared/rpg/ascension.py`
  - Schema for the persistent AP save-file, unlock graph definitions, and unlocked modifier getters.
- `src/shared/ui/character_sheet.py`
  - Reusable pygame rendering code for the paper doll + stat panel that can be dropped into any demo's UI overlay.

---

## 6. Hall of Ancestors
Each run generates a named hero (e.g., "Aldric the Fighter"). On death or extraction, their name, class, floors reached, and notable kills are recorded permanently in The Room.

Inspired by *Rogue Legacy's* family tree — death has memory. The Hall is visible from The Room hub, a wall of names. 
- **Cost to implement**: minimal. 
- **Emotional weight**: significant.

## 7. Ascension Depth Gates
To prevent farming Floor 1 indefinitely for full progression, some meta-unlocks require proving depth proficiency before they can be purchased:

- **Torch Slot 2**: Available from start.
- **Torch Slot 3**: Requires Floor 2 cleared once.
- **Torch Slot 4**: Requires Floor 3 cleared once.
- **Advanced Classes**: Requires Floor 2 cleared once.
- **Paragon Bonuses**: Requires Floor 3 cleared once.

This creates natural difficulty gates without artificial walls, ensuring the player has the "keys" to deeper content only after proving they can handle the intermediate layers.

