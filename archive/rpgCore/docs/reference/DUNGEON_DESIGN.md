# Dungeon Crawler — Design Reference

Soul Facet: Warrior
Genre: Action roguelike
References: Diablo, Binding of Isaac, Enter the Gungeon, Hades, early Zelda

## What We Adopt From Genre

**From Binding of Isaac:**
- Room-clear requirement — enemies must die before doors open
- Doors lock on entry, unlock on clear with feedback (sound + animation)
- Mini-map showing explored / unexplored / cleared / boss rooms
- Special rooms marked differently (treasure, shop, boss)
- Synergy system — items combine unexpectedly

**From Diablo:**
- Loot rarity tiers: common (grey), uncommon (green), rare (blue), unique (gold)
- Randomized stat affixes — "+5 power", "fire damage", "slime-forged edge"
- Elite monsters with affixes ("Fast, Cursed, Fire-Resistant")
- The drop moment — sound, color, anticipation
- Horadric Cube concept — combine items at a crafting station → new item

**From Enter the Gungeon:**
- Chest / loot rooms break tension with reward
- Enemy telegraphing — readable attack patterns
- Room variety — not every room is a fight

**From Hades:**
- Each run feels different but fair
- Meta-progression persists between runs
- Death is narrative — the dungeon remembers you
- Boon structure — pick one of three upgrades per significant room

**From early Zelda:**
- Dungeon as spatial puzzle
- Each floor has a key room (boss) and supporting structure
- Exploration is its own reward

## What We Ignore

- Real-time twitch action (we are turn-based)
- Procedural room art (we use simple geometric rooms for now)
- Voice acting / full narrative (Living World has Last Appointment for that)

## One Run Structure

```
Start Room      safe, no enemies, orientation
                lore fragment or Soul echo

Combat Rooms    6-8 per floor
                2-5 standard enemies
                1 elite room per floor (tougher enemy, better drop)
                doors lock on entry, unlock on clear

Treasure Rooms  1-2 per floor
                loot chest, no enemies
                crafting station (Tier 2)

Boss Room       1 per floor, sealed door (requires floor key or clear path)
                single boss enemy
                guaranteed rare+ drop
                Soul moment on defeat

Exit            descend to next floor OR victory screen
                floor unlock trigger if conditions met
```

## Floor Unlock System

```
Floor 1    always available — tutorial dungeon
           Slime enemies only, simple genetics

Floor 2    unlock: clear Floor 1

Floor 3    unlock: clear Floor 2 + condition
           example conditions:
             "clear boss room without fleeing"
             "find the hidden room"
             "defeat boss with full HP"

Floor 4+   unlock: escalating conditions
           new enemy types, new room variants
           new loot affix pool
           new visual / color theme
           deeper Soul journey framing
```

This is Hades' heat system meets Isaac's floor progression.
Each floor = deeper into the Soul's descent.

## Room System

### Door States

```
LOCKED    enemy room entered, enemies alive
OPEN      room cleared or treasure/start room
SEALED    boss room door — requires path clear
```

### Room States

```
UNEXPLORED    grey silhouette on mini-map
VISITED       shown on mini-map, enemies may be alive
CLEARED       enemies dead, doors open, mini-map updates
CURRENT       player here, highlighted on mini-map
BOSS          marked distinctly on mini-map
TREASURE      marked distinctly on mini-map
```

### Mini-Map Spec
- Corner overlay, small — 8x8 grid of squares
- Each square = one room
- Connected rooms show door indicators (N/S/E/W)
- Player position pulses
- Updates live as player moves and clears rooms
- Unexplored rooms show as faint silhouettes if adjacent to visited

## Loot System v1

### Equipment Slots

```
Weapon      affects power, attack type
Armor       affects defense, movement
Accessory   affects speed, special effect
```

### Rarity Tiers

```
Common      grey    — single stat, small value
Uncommon    green   — single stat, larger value
Rare        blue    — two stats, one affix
Unique      gold    — special behavior, not just stats
```

### Stat Affixes

```
+Power      raw damage increase
+Defense    damage reduction
+Speed      action order, movement
+Fire       fire damage or resistance
+Poison     damage over time or immunity
Slime-forged    bonus vs slime enemies (genetics crossover)
Aberrant        wild card — pulls from genetics trait pool
```

### Drop Rules

```
Standard enemy    common drop, 40% chance
Elite enemy       uncommon guaranteed
Boss              rare guaranteed, chance at unique
Treasure chest    rare guaranteed
```

### Item Comparison
Simple readout: "Better / Worse / Different" vs equipped.
Player always sees delta, not raw stats.

## Crafting System (Stub — Tier 2)

```
Resources drop from enemies:
  Slime Gel       from slime enemies
  Bone Fragment   from skeleton enemies
  Fire Essence    from fire-trait enemies
  Iron Scrap      from armored enemies

Crafting station in treasure / rest rooms:
  Combine 2-3 resources → new item
  Recipes discovered through experimentation
  "Slime Gel + Iron Scrap = Slime-Forged Blade"

Living World crossover:
  Slime with fire trait → drops Fire Essence at higher rate
  Genetics system generates the recipe space
  No other dungeon crawler has this
```

## Enemy Design

### Standard Enemies
- 2-5 per room
- Genetic traits pulled from genetics system
- Trait determines: color tint, stat modifiers, drop affixes
- Example: "Fire-trait slime" — red tint, fire damage, drops Fire Essence

### Elite Enemies
- 1 per floor, marked on entry
- 2-3 genetic traits stacked
- Affix shown above health bar ("Fast, Cursed")
- Guaranteed uncommon drop

### Enemy Genetics Crossover
Enemy traits pulled from same trait pool as Slime Breeder.
Trait rarity = drop rarity influence.
Aberrant trait combination = chance at unique drop.

## Boss Design

One boss per floor. Each boss embodies a Soul Aspect.

```
Floor 1 Boss    The Hollow — Soul of Endurance
                Simple patterns, teaches dodge
                Drops: weapon slot item

Floor 2 Boss    The Merchant's Shadow — Soul of Greed
                Summons minions, hoards loot
                Drops: rare item + resource bundle

Floor 3 Boss    The Warden — Soul of Control
                Locks rooms, manipulates environment
                Drops: rare item + floor key unlock

Floor 4+ Boss   TBD — deeper Soul Aspects
```

Defeat text is a Soul echo, not a victory fanfare.
"You have faced The Hollow. You carry its memory."

## Living World Hooks

- Enemy genetic traits are the same system as Slime Breeder
- Loot affixes reference genetics trait names
- Boss identities tied to Soul Aspect framework from LIVING_WORLD.md
- Death records to Hall of Ancestors (already built)
- Floor progression = Soul descending deeper into itself
- Items found carry Soul flavor text, not generic descriptions

## Missing Systems (Parking Lot)

```
Boon system (Hades)    pick one of three upgrades per floor clear
Shop room              spend gold, persistent run economy
Curse system (Isaac)   negative floor modifiers, player chosen
Set items              collect 3 for bonus
Heat system (Hades)    self-imposed difficulty modifiers
NPC in dungeon         imprisoned soul, gives hint or item
Leaderboard            run score, Ancestors-linked
```

## Port Notes

Logic / renderer boundary for each system:

```
Mini-map logic      pure state — MapState dataclass, no pygame
Door logic          pure state — DoorState enum, Room.on_enter(), Room.on_clear()
Loot logic          pure — ItemDrop dataclass, RarityTier enum, stat calculation
Combat hooks        already pure — uses existing CombatResult
Floor progression   pure — FloorState, unlock conditions as predicates

Renderers (pygame only):
  MinimapRenderer     reads MapState, draws squares
  DoorRenderer        reads DoorState, draws door open/close animation
  LootRenderer        reads ItemDrop, draws rarity color + affix text
  FloorTransition     reads FloorState, draws descent animation
```

Data contracts needed before porting:

```python
@dataclass
class ItemDrop:
    name: str
    rarity: RarityTier
    slot: EquipmentSlot
    stats: dict[str, int]
    affixes: list[str]
    flavor_text: str

@dataclass
class MapState:
    rooms: dict[tuple[int,int], RoomState]
    player_pos: tuple[int,int]
    connections: list[tuple[tuple,tuple]]

@dataclass
class FloorState:
    floor_number: int
    unlocked: bool
    unlock_condition: str
    cleared: bool
```
