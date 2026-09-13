# rpgCore — Demo Laboratory

Single-file standalone pygame prototypes.
No engine imports. Each file runs independently.
Each demo proves a mechanic before it enters the engine.

## Running a demo
  python demos/conway.py
  python demos/conway_cultures.py
  python demos/culture_wars.py
  python demos/culture_node_wars.py
  python demos/dice_roller.py
  python demos/dice_roller_v2.py
  python demos/slime_soccer.py

## What each demo proves

conway.py
  Basic Conway's Game of Life with culture color themes.
  Teaches: grid state, neighbor counting, emergent behavior.
  → Culture spread visualization

conway_cultures.py
  Multi-culture Conway with RPS conflict resolution.
  Teaches: territory spread, border conflict, faction dynamics.
  → ConquestSystem territory model (grid variant)

culture_wars.py
  Conway extended with supply lines, capitols, void barriers,
  overpopulation decay, and collapse mechanics.
  Teaches: overextension, supply dependency, empire dynamics.
  → ConquestSystem territory model (extended grid variant)

culture_node_wars.py  ← CANONICAL conquest prototype
  Territory as node/channel network with pressure propagation,
  supply BFS, capitol defense, and RPS at scale.
  Teaches: zone ownership, dispatch routes, faction warfare.
  → ConquestSystem visual identity and mechanic foundation

dice_roller.py
  D20 traditional set with basic animation states.
  Precursor to v2. Kept for reference.

dice_roller_v2.py  ← CANONICAL dice visualizer
  D20 traditional set with face geometry, pip rendering,
  and stutter-settle decel animation.
  Teaches: animation state machines, visual feedback for chance.
  → Shared Die class for all game mode outcome visualization

slime_soccer.py
  Slime volleyball/soccer with physics, AI opponent, and team themes.
  Teaches: semicircle collision, ball physics constants, trajectory
           prediction, phase-based AI state machine, zone event triggers.
  Engine bleed: SumoPhysics collision, ball_physics constants,
                PersonalityComponent behavior modes, dispatch prediction.
  SDD: /docs/engine/SDD/SUMO_PHYSICS.md
       /docs/engine/SDD/SLIME_AI_BEHAVIOR.md
