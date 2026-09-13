> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Slime Clan — Development Roadmap

## ✅ Session 018 — Shared Component Extraction (Complete)
- Extracted `D20Resolver`, `BaseSystem`, `SystemClock` into `src/shared/`.

## ✅ Session 019 — Scene Manager Integration (Complete)
- **019A**: Created `SceneManager` + `Scene` ABC, migrated `OverworldScene`.
- **019B**: Migrated `BattleFieldScene` and `AutoBattleScene`. Zero subprocesses. One window.

---

## Session 020 — Combat Polish
- **Floating Combat Symbols**: Animate action icons from attacker to target (⚔️ slash, 🛡️ pulse, ✨ heal glow, 💥 crit burst). 400ms fade-out.
- **Optional Player Control**: SPACE pauses the turn queue and displays the current unit's available actions with mana costs. SPACE again resumes AI execution.
- **AI Randomness**: Introduce 20% action randomness to prevent perfectly predictable behavior.

---

## Session 021 — Battle Queue Visualization
- **Turn Order Strip**: Visual bar showing upcoming unit portraits/icons in sequence.
- **Active Unit Highlight**: Currently acting unit highlighted with a glow or border pulse.
- **Queue Depth**: Show the next 3–5 units in the queue.
- **Dynamic Updates**: Queue reorders visually when speed/stuns modify turn order.

---

## Session 022 — Squad Loadout
- **Pre-Battle Screen**: New `SquadLoadoutScene` shown before deploying to battle_field.
- **Composition Selection**: Player selects 3 slimes from a roster to form their squad.
- **Starter Roster**: Begins with Rex, Brom, and Pip. Expandable through future unlocks.

## Session 033 — Unbound Specialization
- **Tribe Characterization**: Unbound recruits naturally adopt hats based on their origin colony rather than always spawning as `Hat.NONE`.
- **Ashfen Tribe**: Leans toward STAFF (healers, caretakers).
- **Rootward Tribe**: Leans toward SHIELD (defenders of territory).

---

## Future — rpgCore Integration
- **Entity Migration**: Refactor `SlimeUnit` toward the rpgCore entity/component system.
- **Rendering Adapters**: Replace direct pygame drawing primitives with rpgCore rendering adapters.
- **Faction System**: Wire `faction_system.py` to Overworld node ownership.
