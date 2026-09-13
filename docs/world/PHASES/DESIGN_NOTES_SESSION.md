# Design Notes — Living World Session

## The Extensive RPG Observation
The pieces for a full RPG already exist across shared/:
combat, inventory, genetics, economy, faction standing, 
procedural generation, narrative graphs.
Green Box philosophy: stay small and tight per demo.
The RPG emerges from the sum of parts naturally.

## Scene Templates — Priority Refactor
Every new demo hits the same friction points:
- Scene vs SceneBase inheritance confusion
- Session object passing between scenes
- argparse conflicts with game.py launcher

Needed before next demo:
src/shared/engine/scene_templates/
├── hub_scene.py         — safe zone, persistent state, exits
├── combat_scene.py      — turn-based, action buttons, HP bars
├── exploration_scene.py — movement, fog of war, room navigation
├── market_scene.py      — buy/sell, inventory display
├── garden_scene.py      — ambient, creature interaction
└── narrative_scene.py   — dialogue cards, stance tracking

## Ambient Systems — Texture of Daily Existence
Not dedicated demos. Systems that slot into existing Aspects:

Farming   — Slime Breeder already is this
Fishing   — mini-game inside Space Trader
            "cast a line at Ironmere Station, rare ore fish"
Crafting  — Dungeon Crawler needs this first
Day cycle — Slime Clan has it, needs to be shared
            Slime Breeder needs day/night for mood changes
Weather   — Space Trader storm delays
            Slime Breeder mood shifts in rain

## The Life Simulation Reframe
Not building demos. Building a life simulation engine
that expresses itself through different genre lenses.
The Soul moving through Aspects of existence is a 
simulated life, not a game collection.
Ambient systems are the texture of daily existence. 
They belong everywhere, owned by no single demo.

## Slime Breeder — Chao Garden Energy
People will spend more time here than anywhere else.
Shapes, sizes, colors, patterns, accessories, personality.
TurboShells racing lives inside Slime Breeder as a mode.
Your creations enter the world and show up elsewhere.
"This slime was yours once." — when it appears in the dungeon.

## Vessel Types Clarified
Fully Temporary: Dungeon Crawler, Asteroids
    Death is the point. The Soul accumulates memory.
Fully Permanent: Last Appointment, Slime Breeder
    What happened, happened. Creation persists.
Hybrid: Space Trader, Slime Clan
    Some things reset. Some things outlast the vessel.

## The Paragon Crossover Principle
Never content gating. Always additive. Always optional.
Thematically earned, not mechanically required.
Each Aspect fully playable and satisfying alone.

## TurboShells Resolution
The genetics and breeding were always the interesting part.
The turtles were just the vessel.
TurboShells racing becomes a mode inside Slime Breeder.
The phoenix found its home inside something bigger.

## Farming, Fishing, Sim Gaps Noted
Missing from explicit demo list but covered by:
- Slime Breeder → farming, tending, watching things grow
- Slime Clan → management, resource allocation
- Space Trader → fishing mini-game candidate
- Dungeon Crawler → crafting system needed
