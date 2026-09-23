# Dungeon Crawler — Design Overview

## Overview
The Dungeon Crawler demo blends the turn-based tactical depth, party dynamics, and deliberate pacing of *Final Fantasy* with the loot hunger, procedural variety, and "one-more-room" compulsion of *Diablo*. This document outlines the core systems, game loop, and the required engine capabilities needed to bring this demo to life.

## 1. Core Loop
- **Session Experience:** Start at the dungeon entrance, step into the procedural fog, face a room's contents (combat, treasure, or mystery), resolve it, collect rewards, manage party health/resources, and decide whether to push into the next room or extract/die.
- **Win Condition:** Defeat the floor's boss and extract, securing all gathered loot and progression.
- **Loss Condition:** Total party wipe. Loss of unbanked loot and resources gathered during the run.
- **The "One More Room" Compulsion:** Driven by the fog of war revealing tantalizing room silhouettes, the constant slow drip of identifying unknown loot, and the delicate balance of pushing party resources just a little further for a higher-tier chest.

## 2. Room System
- **Procedural Generation:** Dungeons are generated per floor. A directed graph of rooms ensures a main path to the boss with optional, high-risk/high-reward branching offshoots.
- **Room Types:**
  - **Combat:** Standard encounters with escalating difficulty.
  - **Treasure:** High-value chests, sometimes trapped or locked.
  - **Rest:** Safe zones to restore HP/resources or identify items.
  - **Merchant:** Exchange gold for consumables or gear within the run.
  - **Boss:** The floor's climax, required to progress or extract.
- **Connections:** Branching map structure (corridors connecting node rooms).
- **Fog of War:** Rooms remain hidden until adjacent rooms are cleared. Only the connection path and an obscured room type icon are hinted. 

## 3. Combat System
- **Action Economy:** True turn-based order governed by a speed/initiative stat. Each entity gets one primary action per turn.
- **D20 Resolver Extension:** Directly inherits and extends `src/shared/combat/D20Resolver`. It will scale to handle complex modifiers (e.g., +2 from high ground, -1 from poisoned) per action.
- **Action Types:**
  - **Attack:** Standard physical/magical strike.
  - **Ability:** Consumes MP/stamina (spells, special attacks).
  - **Item:** Consume from shared inventory (potions).
  - **Flee:** Attempt to escape to the previous room (penalty to success rate).
- **Enemy AI:** Simple aggression tiers (e.g., Mindless attackers target closest/lowest HP, Tactical attackers buff allies and focus healers).
- **Status Effects:** Persistent modifiers spanning turns/rooms (e.g., **Poisoned** - DoT, **Stunned** - skip turn, **Burning** - DoT + lowered defense).

## 4. Loot and Inventory
- **Item Types:** Weapons, Armor, Consumables, Key Items.
- **Slot System:**
  - Weapon (Main hand)
  - Offhand (Shield/Dual wield)
  - Head
  - Body
  - Accessory
- **Stat Modifiers:** Gear directly influences stats (Attack, Defense, Speed, Magic).
- **Loot Tables:** Procedural generation tied to room type, enemy difficulty, and dungeon depth.
- **Economy:** Gold drops from enemies/chests. Used at Merchants. Unknown/rare items drop as "Unidentified" and require a scroll or Rest room to reveal properties.

## 5. Player and Party
- **Party Size:** Small party mechanics (2-3 characters).
- **Class Archetypes:** Classic triad — Fighter (tank/physical), Mage (AoE/magical), Rogue (speed/crit).
- **Progression:** Stat growth per level via accumulated XP. 
- **Future Integration:** The party structure and turn-based scaling mechanisms built here will directly pipe into the **Creature Collector** demo's team dynamics.

## 6. Engine Systems Needed
**Exists:**
- D20 combat resolver
- Entity manager and templates
- Shared UI components
- SpawnerBase for enemy waves

**Needs Building:**
- **[NEW]** Procedural room generator
- **[NEW]** Inventory and loot system
- **[NEW]** Turn order manager
- **[NEW]** Fog of war state
- **[NEW]** Status effect system
- **[NEW]** Save/checkpoint system

## 7. What This Demo Gives Back (Engine Harvesting)
- **Procedural Room Generator** → Feeds the **Asteroids Roguelike** level layouts and **Space Trader** derelict zones.
- **Inventory and Loot System** → Powers **Space Trader** cargo upgrades and **Creature Collector** held items.
- **Status Effects Structure** → Adds depth to **Slime Clan** auto-battles.
- **Turn Order Manager** → Core foundation for **Creature Collector** battles.

## 8. Milestone Criteria (M8)
- [ ] One procedural room generates.
- [ ] One D20 encounter runs to completion.
- [ ] One piece of loot drops and enters inventory.
- [ ] Player can die and restart.

## 9. Torch System — Forward Pressure Mechanic

The Torch is a Key Item — occupies its own dedicated slot, 
never competes with backpack inventory.

Rules:
- One torch lights one floor
- Torch burns continuously — no camping, no stalling
- Running out mid-floor triggers darkness penalty (combat 
  disadvantage, no loot identification)
- Escape Rope consumed instantly — torch preserved

Progression:
- Start: 1 torch slot
- Unlock at chest: 2 slots, then 3, then 4
- Deeper floors require more torches to explore fully

Design intent: Torches are the Estus Flask of the Green Box 
dungeon. Capacity upgrades are the primary meta-progression 
between runs alongside chest-banked gear.

## 10. Floor Completion & UI
Instead of adding a hunger penalty, the game tracks floor completion as an informational progress metric.
- E.g., `Floor 2 — Rooms: 4/9 explored`
- Represented visually: `[■■■■□□□□□]`
- Informs the player's choice to push or extract without forcing it.

