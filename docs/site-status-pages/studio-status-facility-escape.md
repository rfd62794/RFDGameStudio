---
title: "Facility Escape (Chapter 2) — Studio Status"
category: Games/Engines/Systems
date: 2026-08-15
tagline: "Stealth-infiltration chapter with locked July infrastructure and new Loud/Rush design from tonight's session"
type: system
consulting: false
problem: "A stealth-infiltration chapter with real, locked infrastructure from July but no new design work since. The challenge was extending the existing design with new mechanics that respect the locked pillars rather than replacing them."
approach:
  - "Reuse locked July infrastructure: turnEngine, guardAI, physicsEngine, roomGenerator, levelSolver"
  - "New Loud meter design modeled on FF7's Shinra Tower Invasion"
  - "Rush system: fortify the same room, goal never changes"
  - "Trinity Siege RPS skeleton reused for Rush-enemy resolution only (preserves "One Body, Not a Fleet")"
  - "Real thread proposed to the wider canon via Signal"
highlights:
  - "Five locked design pillars including "Telecast, Not Ambush""
  - "Real Dijkstra-based levelSolver with difficulty scoring and degenerate-room rejection"
  - "Loud meter: floor-wide alarm state modeled on FF7 Shinra Tower"
  - "Rush system preserves "One Body, Not a Fleet" pillar"
  - "Trinity Siege RPS skeleton reused narrowly, not broadly"
stack: ["TypeScript", "React", "Vite", "Tailwind"]
---

## Current State: Designed

Facility Escape Chapter 2 is designed but not implemented. Real, locked infrastructure from July. New design from tonight's session. Real open items remain.

## Locked Infrastructure (July)

Real, working, locked infrastructure from July:

- **turnEngine** — the turn-based game loop
- **guardAI** — AI behavior for facility guards
- **physicsEngine** — spatial simulation
- **roomGenerator** — procedural room generation
- **levelSolver** — a genuinely sophisticated level solver with real Dijkstra search, difficulty scoring, and degenerate-room rejection

## Five Locked Design Pillars

Five design pillars are locked, including:

- **"Telecast, Not Ambush"** — the core stealth philosophy
- **"One Body, Not a Fleet"** — the player is a single agent, not a squad

## New Design (Tonight's Session)

Three new design elements:

### Loud Meter

A floor-wide alarm state modeled on FF7's Shinra Tower Invasion. The Loud meter tracks how much noise the player has made across the entire floor, not just in the current room. This creates a real tension between speed (more noise) and stealth (less progress).

### Rush System

A fortify-the-same-room mechanic. When a Rush is triggered, the player fortifies their current room and defends it. The goal never changes — the player still needs to reach the exit, but the Rush creates a real, localized combat encounter that must be resolved before continuing.

### Trinity Siege RPS Skeleton Reuse

Trinity Siege's RPS (rock-paper-scissors) skeleton is reused for Rush-enemy resolution **only** — not as a broad game system. This preserves the "One Body, Not a Fleet" pillar: the RPS determines how the player's single-agent loadout interacts with the Rush enemies, not a fleet-vs-fleet combat simulation.

## Real, Explicitly Open

Three items are real, explicitly open — none decided:

1. **Exit-reachability during Rush** — can the player reach the exit while a Rush is active, or must the Rush be resolved first?
2. **Real intensity curve** — how does the Loud meter and Rush frequency scale across the chapter?
3. **Discrete-juncture placement** — at what specific junctures do Rush events occur?

## Canon Proposal

A real thread was proposed to the wider canon via Signal. This is a design proposal, not a locked decision — the canon may or may not incorporate it.

---

[&larr; Back to Studio Status](/projects/studio-status/) · [Back to Projects](/projects/)*