# The Living World — Dugger's Green Box

## The Soul
The player is a Soul passing through Aspects of existence.
Each demo is an Aspect — a different facet of the same journey.
The Soul persists. Vessels are temporary, permanent, or hybrid
depending on the Aspect they inhabit.

## The Six Aspects

### Connection — Last Appointment
The weight of words. What we say to each other.
Vessel: Permanent. One conversation happened. It cannot unhappen.
The Soul's mirror — new conversations unlock as other Aspects
are experienced. Choices here echo outward as small stance
modifiers in other zones.

### Descent — Dungeon Crawler
Into the unknown. Into fear. Into self.
Vessel: Fully Temporary. Every hero dies. The Soul remembers.
Roguelike — permadeath, build variety, the Hall of Ancestors
grows with every named hero the Soul has inhabited.

### Wandering — Space Trader
The open road. Risk. Solitude. The merchant's calculus.
Vessel: Hybrid. The captain can die, the ship change hands.
Trade routes opened permanently — the Soul was here, they
built something, the route stays open for every future vessel.

### Legacy — Slime Clan
What we build. What outlasts us.
Vessel: Hybrid. Leaders change, the colony persists.
Generations pass. The Soul watches empires rise and fall.

### Survival — Asteroids
The pure present moment. Nothing else exists.
Vessel: Fully Temporary. The void doesn't remember.
But the Soul was there. Roguelite — unlocks persist,
the core loop never changes.

### Creation — Slime Breeder
What we make and release into the world.
Vessel: Permanent. Your slimes exist. They have shapes,
sizes, colors, patterns, accessories, personality.
Inspired by the Chao Garden — people will spend more time
here than anywhere else.
TurboShells lives here as a race mode — your bred slimes
on a track, genetics determining performance.

## Vessel Types
- Fully Temporary: Dungeon Crawler, Asteroids
  Death is the point. The Soul accumulates memory.
- Fully Permanent: Last Appointment, Slime Breeder
  What happened, happened. Creation persists.
- Hybrid: Space Trader, Slime Clan
  Some things reset. Some things outlast the vessel.

## The Paragon System — Soul Echoes
Progress in one Aspect unlocks small perks in others.
Never content gating. Always additive. Always optional.
Thematically earned, not mechanically required.

Examples:
- Descent → Wandering: "Eyes of the Deep"
  Space Trader can identify dangerous routes before committing
- Connection → Descent: "Read the Room"
  Dungeon Crawler enemies have visible stance before combat
- Wandering → Legacy: "Trade Contacts"
  Slime Clan starts with a merchant faction available
- Creation → Descent: "Familiar Face"
  Your bred slimes occasionally appear as dungeon encounters
  Defeating them drops a personal item. "This one was yours."
- Survival → Connection: "Earned Words"
  Last Appointment unlocks a hidden dialogue branch

## The Crossover Principle
No meaningful content gated behind another demo.
Every crossover touch is additive — a discovery, not a requirement.
Each Aspect is fully playable and fully satisfying alone.
Themes native to one Aspect are supplemental in another.

Approved crossover patterns:
- Faction standing carrying thematic recognition
- Trade routes permanently established by the Soul
- Bred slimes appearing as dungeon encounters
- Named heroes remembered across The Ring
- Contraband and outlaw paths opening parallel options

## The Ring — The Central Hub
A physical place. A crossroads. The Soul's home between Aspects.
From The Ring:
- Check the world economy board
- Visit the Hall of Ancestors
- See which slimes are currently in the world
- Read the world events log
- Choose which Aspect to enter

The Ring is also where the narrative game lives.
A figure sits at the center of everything. Someone is asking
them about their life. That conversation is Last Appointment's
system reading the Soul's entire accumulated history.

## World State — The Technical Layer
src/shared/world/world_state.py — WorldState
- economy: dict — global price modifiers per zone
- factions: dict — Soul standing across all Aspects
- entities: dict — slimes in the world, routes opened
- events: list — world events log
- echoes: dict — Soul Echo unlocks earned

Every demo reads from WorldState on launch.
Every meaningful action writes back to it.
No demo requires another demo's WorldState entries.
All crossover is read-only bonuses, never write requirements.

## TurboShells
The phoenix found its home inside Slime Breeder.
The racing system lives as a mode within Creation.
Your slimes, your bloodline, on a track.
Genetics determine performance.
The breeding was always the interesting part.

## The Narrative Game
The Ring itself is the narrative game.
Last Appointment's dialogue system reads the Soul's history
and builds a conversation from it.
Every run in every Aspect generates story material.
The most direct and indirect demo simultaneously.
