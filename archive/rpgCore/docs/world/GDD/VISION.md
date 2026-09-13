# Dugger's Green Box — Vision

## The North Star
A collection of living worlds that reveal themselves
over time through systems the player masters
and creatures the player raises.

Gameplay reveals itself as a reward.
Intelligence through systems, not language models.
Depth through investment, breadth through procedural.
Discovery feels earned. Everything connects.

## The Question
"You came here by accident.
 You built something anyway.
 Now you can leave.
 Will you?"

## The Story
You crash-land on an alien world.
A garden was already here.
Slimes were already living in it.
You need ship parts to escape.
The parts are scattered across a living world.
The world has factions, history, secrets.
By the time you can leave —
you might not want to.

## The Core Loop
Breed → Deploy → Discover → Return
Slimes are companions, scouts, diplomats.
The garden is always home.
Loss is real. Breeding continues the legacy.

## The Garden (Hub)
Neutral ground. All factions respect it.
Where slimes live between adventures.
Starts as crash wreckage.
Becomes something beautiful over time.
The emotional anchor of the entire experience.

## The Four Worlds

### Slime Breeder
"What will my slimes become?"
Genetics and personality reveal over generations.
Attachment through raising. Mastery through breeding.
Chao Garden meets Pokemon breeding depth.
Slimes bred here feed every other world.

### Dungeon Crawler
"What's in the next room?"
Ruins beneath the world.
Ship parts are down here.
So is the history of why you crashed.
Procedural floors. Systemic loot and builds.
Diablo 2 one-more-dungeon loop.
Party drawn from slimes you raised.
Loss is permanent on Core mode.

### Slime Conquest
"What can my squad achieve?"
Surface world. Faction territories.
FF Tactics-lite.
Procedural maps. Systemic strategy.
Optional map battles on casual missions.
Required on Core and Story missions.
Squads built from slimes you bred.
Stakes feel real because the slimes are yours.

### Slime Racing
"How fast can they go?"
How factions settle disputes peacefully.
First friendly contact with clans.
Win races → earn respect → unlock trade.
Genetics matter: agility, acceleration, drafting.
Chocobo Racing energy. FF7 Golden Saucer spirit.

> [!IMPORTANT]
> The camera follow in the racing prototype created genuine presence. The player felt speed before the art was finished. Racing polish priority: camera behavior first, terrain art second, slime art third. The sensation of motion is the product.

## The Faction World

### Hexagon World Structure

The world is a hexagon. Six cultures occupy six regions. Between them, wilderness — contested, dangerous, resource-rich. At the center: the Garden.

```
        Crystal
       /        \
  Tundra          Ember
    |    [GARDEN]    |
  Marsh           Gale
       \        /
        Tide
```

The world is in turmoil. The cultures have always vied for dominance, but a fracture event — occurring at or near the time of the crash — has tipped a cold war into open conflict. The astronaut did not cause the turmoil. But they may have accelerated it.

### Six Slime Cultures
Evolved based on regional environmental pressure.
Tendencies not locks — genetics can override.
Cultural traits visible in mathematical rendering.
Sub-species emerge through deep breeding chains.
Player-created sub-species are valid and named.

Ember Slimes (Ember Wastes)
  Warriors. Resource rich. Angular forms.
  Hot color palette. Fast wobble.
  Trade: parts, weapons, combat training.
  Stat Affinity: Strength, Attack
  Temperament: Aggressive, impulsive, dominance-seeking

Crystal Slimes (Crystal Caverns)
  Scholars. Ancient knowledge. Geometric forms.
  Cool blues and whites. Deliberate movement.
  Trade: information, maps, dungeon layouts.
  Know more about your crash than they say.
  Stat Affinity: Defense, Wisdom
  Temperament: Cautious, loyal, defensive

Tundra Slimes (Tundra Wastes)
  Survivors. Preserved knowledge. Angular crystalline forms.
  Cool whites and blues. Slow deliberate movement.
  Trade: preserved materials, rare knowledge.
  Self-sufficient and hard to pressure.
  Stat Affinity: Intelligence, Perception
  Temperament: Independent, calculating, emotionally distant

Marsh Slimes (Marsh Plains)
  Farmers. Abundant. Social. Rounded forms.
  Green and brown palette. Gentle wobble.
  Trade: breeding supplies, genetic materials.
  Most welcoming to outsiders.
  Stat Affinity: Constitution, Endurance
  Temperament: Patient, stubborn, resource-hoarding

Gale Slimes (Gale Highlands)
  Messengers. Information networks. Elongated fluid forms.
  Light blues and whites. Rapid rippling movement.
  Trade: information, routes, light materials.
  Natural information brokers.
  Stat Affinity: Dexterity, Speed
  Temperament: Curious, restless, risk-taking

Tide Slimes (Tundra Waters)
  Traders. Adaptable. Fluid forms.
  Blue-teal palette. Ripple movement.
  Trade: routes, cargo, rare finds.
  Know every faction's price.
  Stat Affinity: Charisma, Adaptability
  Temperament: Sociable, adaptable, opportunistic

Void Slimes (Void Edges)
  Not a culture. A convergent evolution.
  Irregular shifting forms. Dark with inner glow.
  Movement feels deliberately uncanny.
  Factions fear them. Some worship them.
  Rarest traits. Most dangerous in dungeon.
  Most valuable in conquest.
  Breed one if you go deep enough.
  The original unified culture from which all six fractured.

### Faction Memory
Factions remember what you did.
Choices made while surviving
have consequences you did not anticipate.
Alignment in Act 1 determines
who trusts you in Act 3.

### The Economy
Not your clan. The existing civilization.
Clans have territory, resources,
relationships, and memory.
Your garden sits in contested territory.
The crash was not random.
Something brought you here.
The clans know what it was.
You do not. Yet.

## The Slimes

### Mathematical Rendering
Slimes are mathematically drawn, not sprited.
Genetics ARE the appearance.
Every slime is unique by definition.
The renderer reads genome parameters.
No artist bottleneck. No variant limit.
Cultural tendencies expressed through
parameter ranges, not locked values.
Player-bred sub-species emerge naturally.
The system generates them.
Player names and remembers them.

### Genetic Parameters → Visual Output
body_size           → overall scale
body_roundness      → ellipse ratio
primary_color       → main fill HSL
secondary_color     → pattern color
pattern_type        → spots stripes patches none
pattern_density     → coverage amount
wobble_frequency    → pulse speed
wobble_amplitude    → pulse depth
eye_size            → eye radius
eye_spacing         → distance between eyes
cultural_base       → shape tendency and color range
rare_trait          → special visual effect

### Rare Traits
void_trait      → inner glow, dark body
crystal_trait   → faceted edges
ember_trait     → heat shimmer
ancient_trait   → markings from old civilization
off_world_trait → not from this planet
                  brought by crashed travelers
                  including you

## The Mystery
Space is mythology, not game mode.
You crashed from somewhere.
There are other planets.
Other slime cultures exist out there.
Previous travelers crashed here before you.
Your garden's neutral status is not accidental.
Something draws ships to this planet.
Design the mystery. Not the answer.

## Technical Constraints
No LLMs — intelligence through systems only.
Mathematical rendering — genetics drive appearance.
Procedural stage — systemic meaning.
Systems create worlds, not content.
Runs offline. Works in browser.
Saves via LocalStorage and export/import JSON.
Slimes connect every world.
Python backend. TypeScript renderer. Rust for speed.

## What We Are Not Building
LLM dialogue or behavior.
Procedural story generation.
Chosen one narrative.
Gating between worlds.
Space as playable game mode in v1 through v3.
Sprites for slime rendering.

## Shipping Order

v1 — Prove the Loop
  Garden Hub + Slime Breeder + Dungeon Crawler.
  Crash landing. First contact. Core loop proven.
  Breed → Adventure → Loss → Breed again.
  Browser playable at rfditservices.com.

v2 — Open the World
  Slime Racing + Slime Conquest.
  Factions emerge. Trust is earned.
  The question is asked.

v3 — The Living World
  Clan economy. Full faction memory. Complete story.
  Player chooses whether to leave.

v4 — Beyond (if earned)
  Space. Other planets.
  What the Void connects to.
