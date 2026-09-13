## Dungeon Redesign — Path-Based not Grid-Based

Grid room scene → repurposed for tactical/sumo/boss arenas
Dungeon main mode → path traversal (reuses race track engine)

DungeonTrack zone types:
  SAFE, COMBAT, TRAP, REST, TREASURE, BOSS

Flow:
  Garden → assign team → DungeonPathScene
  Team moves along path autonomously
  Encounter zones pause movement → load combat
  Combat resolves → path resumes
  Path complete → return to garden with results

Architectural payoff:
  RaceTrack + DungeonTrack = two concrete implementations
  Extract BaseTrack after both exist
  This IS the Simulation Engine extraction point

This is the right call. The race engine was never just for racing. You just found its second tenant.
