# Systems Map — World GDD
Authority: Design intent.
Extracted from SYSTEMS_MAP_SPECIFICATION.md.
Agents treat as strong guidance, not hard law.

---

## 🔄 The Core Loop

**The garden survives, grows, and sends slimes into the world. The world responds. You adapt.**

This is the heartbeat of the game. Everything feeds back into it. Slimes leaving and returning is the pulse. The garden is home — not a menu, not a UI hub, but the emotional and mechanical center of everything.

The player is the astronaut. They do not act directly in the world — the slimes are their hands. The astronaut directs, converses, manages, and grows attached. The slimes go do things.

---

## 🎮 Three Sub Loops

Each sub loop feeds the core loop differently. All three are valid complete playthroughs.

### Sub Loop 1 — The Breeder
*"Make the roster stronger."*

Primary engagement: Garden, genetics, breeding decisions, minigame training.

Outputs to core loop:
- Stronger slimes available for dispatch
- Rarer genetic combinations entering the roster
- Elder slimes providing mentoring bonuses
- Void progression through generational depth

Forced style moments: Occasionally a resource crisis or territory threat demands sending a slime the breeder cares about into danger.

### Sub Loop 2 — The Conqueror
*"Expand what the world can offer."*

Primary engagement: Conquest map, dispatch strategy, territory management.

Outputs to core loop:
- More territory means more resources flowing to garden
- Culture access unlocking new slime recruitment opportunities
- Defensive pressure creating roster demands
- Economic pressure shaping which slimes get trained

Forced style moments: A Liminal slime in the roster means something to the culture hubs — the Conqueror has to navigate diplomatic consequences they didn't seek.

### Sub Loop 3 — The Wanderer
*"Understand the world you're in."*

Primary engagement: Visual novel conversations, culture hub relationships, narrative progression.

Outputs to core loop:
- Information that makes conquest and dispatch decisions better
- Diplomatic standing unlocking culture-specific resources
- Relationship depth opening unique slime types and conversation branches
- Narrative gates providing purpose and direction to other sub loops

Forced style moments: A quest requires fielding a specific team composition, pushing the Wanderer to engage with the roster they've been ignoring.

---

## 🎛️ Player Control Modes

Three engagement modes available for each system:

| Mode | Description | Who Uses It |
|------|-------------|-------------|
| **Granular** | Full manual control. Every decision is yours. | Detail-oriented players |
| **Auto** | Set preferences, system executes. Review and override. | Moderate engagement |
| **Idle** | Strategic direction only. Systems run with garden autonomy. | Scope-focused players |

No player type hits a wall that requires engaging with a system they don't enjoy. The conquest player should never *need* to breed optimally. The breeder should never *need* to fight territory battles. The forced moments create constraint and story — not failure states.

---

## 🛤️ The Dispatch Track System

The unified abstraction for "slimes going somewhere and something happening."

Originally: Racing Track → Dungeon Track → **General Dispatch Track**

The underlying system is identical across all zone types. Zone type determines rules, aesthetic, stat relevance, and what comes back.

### Zone Types

| Zone | Activity | Key Stats | Resources Returned | Culture Affinity |
|------|----------|-----------|-------------------|-----------------|
| **Racing** | Speed competition, carnival energy | Dexterity, Speed | Gold, prestige | Gale |
| **Dungeon** | Combat exploration, permanent danger | Strength, Defense | Scrap, rare items | Ember, Void |
| **Foraging** | Resource gathering, scouting | Constitution, Perception | Food, materials | Marsh, Tundra |
| **Trade Route** | Economy, diplomacy | Charisma, Adaptability | Gold, culture standing | Tide |
| **Mission** | Narrative quest, varied demands | Varied | Story progression, unique rewards | Varied |
| **Arena/Tournament** | Structured competition, bracket | Combat stats | Gold, fame, breeding access | Varied |

### Dispatch Mechanics

- Squads are assembled from the roster
- Personality creates soft zone affinities (see Personality System)
- Zone risk level determines permanent loss probability
- Results return to garden — resources, experience, sometimes losses
- Slimes can be training in a zone while the player does something else

**The Dispatcher is the most important single system in the engine** because it connects the garden to everything else. Without it, the garden is a breeding simulator. With it, the garden is a headquarters.

---

## 🎮 Minigames as Training

Minigames are not entertainment bolted onto a management game. They are the stat development mechanism.

**The activity IS the progression.** You do not grind a stat screen. You play sumo to build push/weight stats. You race to build speed. You dungeon crawl to build combat experience. The game you play and the growth you achieve are the same thing.

### Minigame → Stat Mapping

| Minigame | Primary Stat Growth | Secondary Stat Growth |
|----------|--------------------|-----------------------|
| **Sumo** | Strength (push), Constitution (endurance) | Defense (positioning) |
| **Racing** | Dexterity (speed), Gale affinity | Constitution (sustained effort) |
| **Dungeon** | Strength (combat), Defense (survival) | Intelligence (tactics) |
| **Foraging** | Constitution (endurance), Perception | Patience personality |
| **Arena** | Varied combat stats | Aggression/Caution personality |

### Autonomous Training

Slimes can train in minigames autonomously while the player manages other systems. Results accumulate in the background. The dispatcher manages this — slimes training, competing, developing without requiring direct player attention.

---

## ⚔️ Conquest System

The macro layer. Territory, control, faction power. Who owns what and why it changes.

### Conquest Map

Six culture regions plus six intersection wilderness zones plus the neutral garden at center. Seventeen total nodes on the world map.

The garden is never a conquest target.
Culture hubs are relationship targets, not conquest targets.
The six wilderness intersection zones are the true conquest territory.

### Two Conquest Modes

**Tower Defense (Defensive):**
- Holding territory against assault
- Slimes placed as towers with genetics-driven behavior (Tower Defense spec already locked)
- Procedural enemy wave design
- Gold-based upgrade and reinforcement system
- You are defending something worth defending

**FFT Grid (Offensive):**
- Taking territory through tactical squad engagement
- Deliberate movement and positioning
- Squad composition matters (personality and stat synergies)
- You are pressing an advantage

Same map. Same units. Different verb depending on whether you're attacking or defending.

### Overnight Simulation (The Conquest Tick)
The world map does not react to player actions in real-time. The game operates in discrete **Days**. While the player manages the garden, breeds slimes, and issues dispatch orders during the day, the broader geopolitical state—territory expansion, border pressure, collapse recoveries, and supply line checks—is simulated globally overnight during the **Conquest Tick**. This creates a concrete gameplay rhythm: set your defensive towers or offensive squads by day, and observe the macro consequences by morning.

### Culture Hub Diplomacy

Culture hubs are not capturable. They are relationship targets reached through:
- Reputation earned through dispatch activity in adjacent zones
- Conversation depth with culture representatives
- Trade relationship establishment
- Quest completion for culture-specific objectives

**Standing levels:** Unknown → Neutral → Acknowledged → Trusted → Allied

Each standing level unlocks:
- Culture-specific slime recruitment
- Culture-specific equipment and accessories
- Culture-specific resource access
- Unique conversation branches with culture NPCs

---

## 💰 Resource Economy

Three essential resources. All others derive from these.

### Gold
- **Source:** Tide culture trade, racing prizes, arena winnings, trade routes
- **Use:** Equipment purchase, hiring, culture hub trading, garrison costs
- **Flow:** The liquid economy. Moves between all systems.

### Scrap
- **Source:** Ember culture, dungeon runs, wilderness salvage, foraging
- **Use:** Ship repair (narrative goal), equipment crafting, garden expansion
- **Flow:** The material economy. Slower moving than gold. Enables building.
- **Ship Repair:** Scrap is what you originally came to find. Enough scrap means the ship could theoretically be fixed. The player chooses whether to use it for that.

### Food
- **Source:** Marsh culture, foraging zones, garden production (late game)
- **Use:** Roster sustenance, expedition fueling, garrison supply
- **Flow:** The living world economy. Creates natural roster size pressure.
- **Scarcity mechanic:** Too many slimes, not enough food. Forces dispatch decisions. Creates real trade-offs.

### Culture-Specific Resources
Each culture hub, once diplomatic standing is established, provides unique materials that enable higher-tier equipment, breeding bonuses, or special dispatch outcomes.

---

## 📖 The Visual Novel Layer

The conversation system provides the narrative substrate for the entire game.

**What it handles:**
- Initial crash landing orientation
- Culture hub relationship development
- Garden slime personality expression in intimate scenes
- World lore delivery through discovered characters
- Quest initiation and resolution

**Visual Novel scene structure:**
- Background: Procedural or context-appropriate
- Character: Slime or astronaut-relative NPC rendered in Intimate Mode
- Dialogue box: Lower third
- Choice prompts when narrative branches

**Paper doll system:**
Human-adjacent characters (culture hub NPCs, any encountered persons) use silhouette-based rendering with layered accessories. Same design philosophy as slime equipment — base silhouette plus layered identity expression. No detailed art assets required.

---

## 📖 Narrative Entry Arc

### Act 0 — Crash (Tutorial)
Player wakes in the garden. Ship is damaged. One slime is present — the first relationship. The world is unfamiliar. Immediate needs: understand the garden, understand the slime, understand why leaving is complicated.

Initial limitations:
- Single slime in roster
- Limited garden space
- No dispatch capability yet
- No breeding (need two slimes)
- Slimes gained through discovery/rescue/trade initially, not breeding

### Act 1 — Orientation
Finding replacement ship parts requires scrap. Scrap requires going outside the garden. Going outside requires dispatch capability. Dispatch requires roster. Roster requires garden expansion. The systems introduce themselves through necessity.

### Act 2 — Entanglement
The world's conflict becomes personal. The cultures are not abstract factions — they have representatives the player has met. The fracture event and the astronaut's possible role in it becomes a narrative pressure. The ship repair becomes less urgent.

### Act 3 — Realization
The ship could be fixed. The player chooses whether to fix it. The garden is worth staying for. The slimes are worth staying for. What started as stranded becomes home.

---

## 🔗 Systems Integration Summary

```
                    [THE GARDEN]
                   /      |      \
            Breeding   Roster   Relationships
               |          |          |
           Genetics    Dispatch    Conversations
               |          |          |
           Lifecycle   Zones/Maps  Culture Hubs
               \          |          /
                \    [THE WORLD]    /
                 \        |        /
                  Conquest + Trade
                          |
                    Resources flow
                          |
                   back to Garden
```

Every system connects through the garden. Every loop returns something the garden needs. The garden is not one feature among many — it is the architecture that makes all other features meaningful.
