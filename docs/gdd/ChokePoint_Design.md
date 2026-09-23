# Choke Point — Design GDD
*September 2026 | New Turn-Based Tower Defense Game.*

---

## Vision

Tactical grid-defense inspired by 'Into the Breach'. In 'Choke Point', you defend critical infrastructure against waves of automated threats. The core signature is the **Preview-then-Commit** loop: enemies preview their exact movement and attack targets for the next turn, allowing the player to place barriers, deploy traps, or move units to perfectly counter and block the threat.

---

## Core Loop

1. **Enemy Action Preview**: At the start of the turn, the game calculates enemy paths and attack intents. These are clearly previewed on the grid.
2. **Player Planning**: The player moves defense squads, activates turrets, or triggers environmental traps.
3. **Commit Phase**: The player ends their turn, committing their actions.
4. **Simulation & Resolution**: Player actions execute, followed by enemy movement and attack execution.
5. **Next Wave**: New threats enter the grid from spawn points. Survive N waves to win.

---

## Design Pillars

- **Perfect Information (Preview-then-Commit)**: The player never guesses. Since enemies announce their paths and targets, the challenge is spatial and logical optimization, not reaction time or random chance.
- **Grid Collision & Physics**: Turn-based grid movement utilizing collision checks to block, redirect, or shove enemies into environmental hazards.
- **Seeded Determinism**: Using `engine/shared/seededRandom.ts` to ensure that every run is completely deterministic, allowing for precise, testable, and fair tactical puzzles.

---

## Shared Engine Infrastructure

- **`ts/src/engine/shared/aiBehavior/steering.ts`**: Reuses Seek, Flee, and Avoid forces to compute paths and avoidances on the grid.
- **`engine/primitives/physics.lua`**: Uses grid collision math to check blocking, pushing, and overlap.
- **`engine/primitives/resolution.lua`**: Reuses damage resolution and stat check utilities.
