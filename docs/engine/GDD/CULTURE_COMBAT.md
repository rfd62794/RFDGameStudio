# Culture Combat Design — Engine GDD
Authority: Design intent.
Agents treat as strong guidance for
combat system implementation.

## The Six Cultures

| Culture | Primary Stat | Role Affinity |
|---------|-------------|---------------|
| Ember   | ATK +3.0    | Melee DPS     |
| Marsh   | HP  +3.0    | Tank          |
| Gale    | SPD +3.0    | Ranged / Scout|
| Crystal | All +1.0    | Utility       |
| Tundra  | HP  +2.0, SPD -1.0 | Slow Tank |
| Tide    | ATK +2.0, SPD +2.0 | Duelist  |

## Territorial Behavior (Conquest System)
Culture traits extend to the macro territory map, where each culture exerts distinct expansion pressure and survival behaviors:

| Culture | Survival (Min-Max) | Expansion Weight | Trait / Personality |
|---------|--------------------|------------------|---------------------|
| Ember   | 2 - 3 | 1.2x | Aggressive expander; burns bright but easily surrounded. |
| Gale    | 1 - 3 | 1.5x | Fastest expander; wind finds gaps and survives isolation. |
| Marsh   | 2 - 4 | 0.8x | Slow expander; roots hold ground and survives crowding. |
| Crystal | 2 - 3 | 1.0x | Standard geometric growth; highly predictable. |
| Tundra  | 1 - 3 | 0.9x | Slow expander; endures the cold alone (survives isolation). |
| Tide    | 3 - 5 | 1.1x | Highly social; needs high density to surge, otherwise dies out. |
| Void    | 2 - 3 | 0.0x | Never expands natively; serves as an unyielding boundary. |

## Rock Paper Scissors Triangles

Two natural triangles emerge from the
stat affinities:

AGGRESSIVE TRIANGLE:
  Ember → beats Gale
  (burst damage overwhelms fragile speedster)
  
  Gale → beats Tundra
  (speed advantage, Tundra can't respond)
  
  Tundra → beats Ember
  (outlasts burst damage with HP depth)

TACTICAL TRIANGLE:
  Tide → beats Marsh
  (can't escape the duelist's pressure)
  
  Marsh → beats Crystal
  (outlasts the balanced generalist)
  
  Crystal → beats Tide
  (survives burst, hits back consistently)

## Void Position
Void slimes (all six cultures at ~0.167 each)
sit outside both triangles.
No weakness. No dominance.
Slightly above average in all stats due to
positive-sum culture modifiers.
Narrative terminal state: belongs everywhere,
exceptional nowhere.
SPD slightly penalized by tundra's -1.0
contribution even at 0.167 weight.

## Culture Expression is a Spectrum
These are tendencies, not hard counters.
A 60/40 Ember/Gale slime is faster than
pure Ember but hits slightly less hard.
The breeding system generates this continuous
spectrum naturally.
RPS is the skeleton. Expression weights
are the flesh.

## Equipment Determines Role
Culture sets affinity. Equipment sets role.
A Marsh slime + staff = healer.
A Marsh slime + armor = wall.
Same culture, different battlefield purpose.

## Conquest Implications
Culture RPS gives the six culture hubs
strategic meaning. Ember territory is
defended by aggressive slimes.
Bring tanks. Build for composition,
not just raw power.
