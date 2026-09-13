# Agent Memory

## Minigame Systems — Derived from Core Stats

All minigames emerge from existing stat systems.
No new core mechanics needed — just new arenas.

### Core Stat Systems Already Built
- **Mass System**: `mass = body_size ** 1.5` (non-linear scaling)
- **Heft Power**: `heft_power = mass * (1.0 + strength * 0.5)`
- **Jump Physics**: Force/mass calculations with body size multipliers
- **Cultural Advantages**: Terrain bonuses based on cultural base
- **Speed & Recovery**: Derived from energy and mass

### Minigame Tree - What Systems Already Support

#### HEFT/MASS SYSTEM
**Slime Sumo** (Priority 1 - 1 session)
- Circular arena, push to edge
- Heavy + strong = natural advantage  
- Small fast slime = dodge-based strategy
- **Physics**: Same as push block collision logic from racing
- **Arena**: 300px diameter circle, edge = fall zone
- **Win**: Push opponent off edge

**Slime Bowling**
- One heavy slime rolled at formation
- Distance = jump_distance, Force = heft_power
- Pins = lighter slimes or objects

**King of the Hill**
- Contested center zone
- Heavier slime holds ground
- Lighter slime gets pushed off
- Tug of war with physics

#### JUMP SYSTEM
**Hurdle Racing**
- Pure jump timing minigame
- Rhythm-based
- Jump height and recovery matter
- Different from full derby

**Slime Volleyball**
- Jump arc = ball trajectory
- Two slimes, net, bounce logic
- Already have jump physics

**Tower Climb**
- Vertical jumping challenge
- Jump height stat is the core mechanic
- First to top wins

#### GENETICS/BREEDING SYSTEM
**Slime Beauty Contest**
- Judges score on cultural traits
- Roundness, color, wobble
- Pure genetics showcase
- No combat — appreciation mode

**Trait Auction**
- Rare trait slimes go to auction
- Other players (or AI factions) bid
- Economy layer

**Exhibition Match**
- Show off your best gen-20 slime
- Versus known champion
- Leaderboard

#### DUNGEON SYSTEM
**Dungeon Relay**
- Team of 4 takes turns
- Each slime handles one floor type
- Swap on weakness
- Coordination puzzle

**Boss Rush**
- Single slime
- Escalating bosses
- How deep can they go

#### RACING SYSTEM
**Time Trial**
- Single slime
- Ghost of best run
- Pure speed optimization

**Cultural Cup**
- Ember-only race on rock track
- Tundra-only race on water track
- Cultural specialists compete

**Gauntlet**
- Racing + obstacles combined
- Hurdles, ponds, push blocks
- All mechanics at once

### Meta-Game Pattern
Every minigame uses 1-2 stats as primary and exposes others as secondary:

- **Sumo**: mass + strength primary, speed = dodge ability secondary
- **Racing**: speed + jump primary, mass = terrain interaction secondary  
- **Dungeon**: HP + attack primary, speed = turn order secondary
- **Beauty**: roundness + hue primary, wobble = personality secondary

Player breeds a slime → looks at its stats → decides which minigame to enter it in

**That IS the meta-game**: "What is this slime good at?" not "is this slime good?"
Every slime has a home.

### Slime Sumo Implementation Details

**Arena Setup**
- Circle, 300px diameter
- Edge = fall zone
- Center start positions

**Physics Tick**
```python
# Each slime has position (x, y)
# Collision check: distance < combined_radius

def handle_collision(slime_a, slime_b):
    force_vector = normalize(pos_a - pos_b)
    push_a = force_vector * (slime_b.heft_power / slime_a.mass)
    push_b = -force_vector * (slime_a.heft_power / slime_b.mass)
    
    pos_a += push_a
    pos_b += push_b
```

**Win Condition**
```python
# distance(slime_pos, arena_center) > arena_radius
# → that slime fell off → opponent wins
```

**Game Structure**
- Rounds: best of 3
- Result feeds back to roster
- Winner gains exp, Loser gains exp (less)
- No permanent loss — garden activity

### Future: ARENA Hub Scene
From Garden navigation:
```
Top nav: TEAMS | DUNGEON | RACING | ARENA

ARENA scene:
  SUMO RING    → pick 1 slime, fight AI
  DERBY TRACK  → pick racing team  
  TRIAL TOWER  → pick 1 slime, climb floors

Future expansions:
  TOURNAMENT   → bracket, multiple slimes
  EXHIBITION   → show off your best
  CHALLENGE    → daily rotating minigame
```

### Implementation Priority Order
1. **Sumo** - mass + heft_power, circular arena (1 session)
2. **Time Trial** - speed + jump, ghost system
3. **Cultural Cup** - terrain advantage showcase
4. **Tower Climb** - jump_height focused

### Key Insight
Sumo physics = push block physics from racing. Different arena, same force calculation.

Build after jump system is solid in racing. Future: ARENA hub scene alongside DUNGEON.

Sumo makes sense because your physics are real. The minigames aren't features bolted on — they're natural expressions of the genetic system you already built.

---

## Racing Stat System - Mass, Strength, and Heft Mechanics

### Core Concept
Slime racing uses **mass** and **strength** as derived stats that create meaningful gameplay variety. Different body sizes and strength combinations create distinct racing styles and terrain specializations.

### Mass Mechanics
**Formula**: `mass = body_size ** 1.5`

- **Non-linear scaling** - Big slimes are disproportionately heavy
- **body_size 0.3** → **mass 0.16** (light, agile)
- **body_size 0.6** → **mass 0.46** (medium, balanced)  
- **body_size 1.0** → **mass 1.0** (heavy, powerful)

### Jump Physics
**Formula**: `jump_distance = (jump_force / mass) * body_size`

- **Heavy slimes** - Slow bounds, more ground coverage per jump
- **Light slimes** - Rapid hops, less distance per jump
- **Jump frequency**: `jump_cooldown = 0.2 + (mass * 0.4)`
- **Light slimes**: 0.2s cooldown - rapid hopping
- **Heavy slimes**: 0.6s cooldown - slow bounding

### Strength and Heft
**Formula**: `heft_power = mass * (1.0 + strength * 0.5)`

- **Strength** derived from `genome.attack_base / 100.0`
- **High strength** - Punch above weight class, move obstacles
- **Low strength** - Gets pushed back, struggles with blocks

### Terrain Interaction Matrix

| Terrain Type | Small Slime | Large Slime | Notes |
|-------------|-------------|-------------|-------|
| **Flat grass** | ✓ Fast hops, frequent | ~ Slow bounds, infrequent | Recovery vs distance trade-off |
| **Water pond** | ~ Partial sink, speed penalty | ✗ Sinks deep, heavy penalty | Mass affects sink depth |
| **Rock field** | ✗ Bounced, no grip | ✓ Crashes through, momentum | Mass carries through obstacles |
| **Mud patch** | ✓ Light skip, barely sinks | ✗ Gets stuck, sinks fully | Mass determines sink resistance |
| **Push block** | ✗ Bounces back (unless high strength) | ✓ Moves block, mass carries | Heft power > resistance = success |
| **Hurdle** | ✓ Easy clear, natural arc | ~ Must time jump, low arc | Mass affects jump height |

### Racing Specializations

**Small High Strength Slime** (All-rounder):
- Rapid hops + heft power
- Clears hurdles easily
- Can move blocks when needed
- Good on most terrain

**Large High Strength Slime** (Specialist):
- Powerful bounds + unstoppable force
- Demolishes rock fields
- Excellent on push blocks
- Terrible in mud/water
- Build track to suit

**Large Low Strength Slime** (Weak):
- Heavy but ineffective
- Gets stuck everywhere
- Loses badly unless terrain matches
- Poor racing performance

### Breeding Implications
Different selection pressures than dungeon:
- **Racing**: Small body + high speed + medium strength
- **Dungeon**: Large body + high attack + high defense
- Same genetic system, different optimization goals
- Creates purpose for specialized breeding programs

### Implementation Plan
Add to `src/shared/genetics/genome.py`:
```python
def calculate_race_stats(genome) -> dict:
    mass = genome.body_size ** 1.5
    strength = genome.attack_base / 100.0
    heft_power = mass * (1.0 + strength * 0.5)
    
    jump_force = 50.0 * (1.0 + strength * 0.3)
    jump_distance = (jump_force / mass) * genome.body_size
    jump_cooldown = 0.2 + (mass * 0.4) * (1.0 - strength * 0.2)
    jump_height = (jump_force / mass) * 18
    
    return {
        "mass": mass,
        "heft_power": heft_power,
        "jump_distance": jump_distance,
        "jump_cooldown": jump_cooldown,
        "jump_height": jump_height,
    }
```

This system creates meaningful team selection decisions based on track composition and creates depth in both racing and breeding mechanics.

---

## Scene Standardization — Planned Next Infrastructure Session

Current state:
  534 passing, 0 failures, 0 errors
  All scenes satisfy abstract contract via stubs
  
Problem remaining:
  Stubs are scattered across legacy scenes
  BaseScene does not exist yet
  Boilerplate duplicated in every scene
  
Planned:
  BaseScene — extract shared boilerplate
  BaseComponent — UI component contract
  SceneManager stack — clean navigation
  
When to build:
  After Racing track feels right
  After Dungeon auto-battle prototype
  One dedicated session
  
Payoff:
  Adding abstract method to BaseScene
  with default impl = 0 cascade errors
  New scenes = 20 lines not 80
  Navigation = manager.push/pop only
