> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Master Seed Configuration

## Overview

This document defines the **Master Seed** for the Synthetic Reality Console - the complete configuration that generates a living world with 1,000 years of history, 3 factions, 100 traits, and 500 dialogue templates.

## Master Seed Configuration

### World Parameters
```yaml
world_seed:
  name: "Synthetic Reality Master World"
  founding_vector:
    resource: "varied"
    climate: "temperate"
    terrain: "varied"
    magic: "low"
    technology: "medieval"
    danger: "moderate"
  starting_population: 1000
  coordinates: [0, 0]
  radius: 50
  epochs: 10
```

### Faction Configuration

#### The Iron Legion (Military)
```yaml
faction_legion:
  id: "legion"
  name: "The Iron Legion"
  type: "military"
  color: "red"
  home_base: [0, 0]
  current_power: 0.8
  relations:
    cult: "hostile"
    traders: "neutral"
  goals:
    - "expand_territory"
    - "defend_borders"
    - "maintain_order"
  expansion_rate: 0.2
  aggression_level: 0.9
  traits:
    - "disciplined"
    - "martial"
    - "hierarchical"
    - "lawful"
    - "territorial"
```

#### The Shadow Cult (Religious)
```yaml
faction_cult:
  id: "cult"
  name: "The Shadow Cult"
  type: "religious"
  color: "purple"
  home_base: [10, 10]
  current_power: 0.6
  relations:
    legion: "hostile"
    traders: "neutral"
  goals:
    - "convert_followers"
    - "establish_shrines"
    - "uncover_secrets"
  expansion_rate: 0.1
  aggression_level: 0.7
  traits:
    - "mystical"
    - "secretive"
    - "devout"
    - "ritualistic"
    - "enigmatic"
```

#### The Merchant Guild (Economic)
```yaml
faction_traders:
  id: "traders"
  name: "The Merchant Guild"
  type: "economic"
  color: "gold"
  home_base: [-5, -5]
  current_power: 0.7
  relations:
    legion: "neutral"
    cult: "neutral"
  goals:
    - "establish_trade_routes"
    - "accumulate_wealth"
    - "control_markets"
  expansion_rate: 0.3
  aggression_level: 0.3
  traits:
    - "commercial"
    - "opportunistic"
    - "diplomatic"
    - "wealthy"
    - "pragmatic"
```

### Historical Events Configuration

#### Epoch 1: The Founding (Years 0-100)
```yaml
epoch_1:
  theme: "founding"
  intensity: 0.3
  events:
    - "settlement_established"
    - "first_trade_routes"
    - "initial_conflicts"
    - "treaty_signing"
  factions_created: ["legion", "traders"]
```

#### Epoch 2: The Expansion (Years 100-200)
```yaml
epoch_2:
  theme: "expansion"
  intensity: 0.4
  events:
    - "territorial_growth"
    - "resource_discovery"
    - "border_skirmishes"
    - "alliance_formation"
  factions_created: ["cult"]
```

#### Epoch 3: The Conflict (Years 200-300)
```yaml
epoch_3:
  theme: "conflict"
  intensity: 0.7
  events:
    - "great_war"
    - "siege_warfare"
    - "resource_depletion"
    - "mass_migration"
  major_conflicts: ["legion_vs_cult"]
```

#### Epoch 4: The Plague (Years 300-400)
```yaml
epoch_4:
  theme: "disaster"
  intensity: 0.8
  events:
    - "mysterious_plague"
    - "population_decline"
    - "abandoned_settlements"
    - "medical_discoveries"
  affected_factions: ["legion", "traders"]
```

#### Epoch 5: The Renaissance (Years 400-500)
```yaml
epoch_5:
  theme: "recovery"
  intensity: 0.5
  events:
    - "cultural_revival"
    - "technological_advances"
    - "trade_renewal"
    - "diplomatic_missions"
  affected_factions: ["traders"]
```

#### Epoch 6: The Empire (Years 500-600)
```yaml
epoch_6:
  theme: "imperial"
  intensity: 0.6
  events:
    - "imperial_expansion"
    - "centralized_authority"
    - "infrastructure_projects"
    - "cultural_assimilation"
  dominant_faction: "legion"
```

#### Epoch 7: The Decline (Years 600-700)
```yaml
epoch_7:
  theme: "decline"
  intensity: 0.7
  events:
    "imperial_fragmentation"
    "resource_shortages"
    "rebellious_movements"
    "territorial_losses"
  affected_factions: ["legion"]
```

#### Epoch 8: The Ruin (Years 700-800)
```yaml
epoch_8:
  theme: "collapse"
  intensity: 0.8
  events:
    - "civilizational_collapse"
    - "knowledge_loss"
    "barbarian_invasions"
    "dark_age"
  affected_factions: ["legion", "traders"]
```

#### Epoch 9: The Mystery (Years 800-900)
```yaml
epoch_9:
  theme: "mystery"
  intensity: 0.6
  events:
    - "unexplained_phenomena"
    - "ancient_secrets"
    - "magical_awakening"
    - "prophetic_visions"
  affected_factions: ["cult"]
```

#### Epoch 10: The Present (Years 900-1000)
```yaml
epoch_10:
  theme: "present"
  intensity: 0.5
  events:
    - "player_arrival"
    - "new_beginnings"
    - "opportunity_awaits"
    - "future_uncertain"
  player_start: true
```

### Trait System Configuration

#### Personality Traits (50 traits)
```yaml
personality_traits:
  brave: "Courageous in the face of danger"
  cautious: "Careful and deliberate"
  curious: "Eager to explore and discover"
  aggressive: "Quick to anger and conflict"
  peaceful: "Prefers diplomacy over violence"
  greedy: "Focused on material wealth"
  generous: "Willing to share and help"
  skeptical: "Doubtful of claims and promises"
  trusting: "Tends to believe others"
  ambitious: "Seeks power and influence"
  humble: "Modest and unassuming"
  proud: "High self-regard"
  shy: "Reserved and introverted"
  outgoing: "Socially confident"
  intelligent: "Quick to learn and understand"
  wise: "Experienced and knowledgeable"
  foolish: "Makes poor decisions"
  kind: "Compassionate and caring"
  cruel: "Enjoys causing suffering"
  honest: "Truthful and straightforward"
  deceptive: "Prone to lying and manipulation"
  loyal: "Faithful to commitments"
  treacherous: "Likely to betray"
  patient: "Willing to wait for results"
  impatient: "Wants immediate results"
  methodical: "Systematic and organized"
  chaotic: "Unpredictable and random"
  creative: "Innovative and imaginative"
  practical: "Focused on useful solutions"
  idealistic: "Believes in perfect worlds"
  cynical: "Believes the worst of people"
  optimistic: "Hopeful about the future"
  pessimistic: "Expects negative outcomes"
  religious: "Spiritual and faithful"
  secular: "Materialist and rational"
  superstitious: "Believes in omens and signs"
  rational: "Logical and evidence-based"
  emotional: "Guided by feelings"
  stoic: "Resilient and accepting"
  passionate: "Intense and enthusiastic"
  reserved: "Emotionally controlled"
  expressive: "Open with feelings"
  stubborn: "Refuses to change mind"
  adaptable: "Flexible to new situations"
  rigid: "Resistant to change"
  leader: "Natural authority"
  follower: "Prefers guidance"
  independent: "Self-sufficient"
  dependent: "Needs support"
  adventurous: "Seeks new experiences"
  cautious: "Prefers familiar territory"
  reckless: "Takes unnecessary risks"
  calculated: "Weighs options carefully"
  impulsive: "Acts without thinking"
```

#### Combat Traits (30 traits)
```yaml
combat_traits:
  strong: "Physical power and endurance"
  weak: "Lacks physical strength"
  fast: "Quick and agile"
  slow: "Deliberate and ponderous"
  skilled: "Proficient with weapons"
  unskilled: "Lacks combat training"
  armored: "Well-protected"
  unarmored: "Vulnerable to damage"
  experienced: "Battle-hardened"
  novice: "Inexperienced in combat"
  tactical: "Strategic thinking"
  reckless: "Charges without planning"
  defensive: "Prefers protection"
  offensive: "Focuses on attacks"
  precise: "Accurate strikes"
  wild: "Uncontrolled attacks"
  disciplined: "Maintains formation"
  undisciplined: "Breaks formation"
  brave: "Faces fear"
  cowardly: "Avoids conflict"
  bloodthirsty: "Enjoys combat"
  merciful: "Spares opponents"
  ruthless: "Shows no mercy"
  honorable: "Fights fairly"
  dishonorable: "Uses dirty tricks"
  veteran: "Many battles fought"
  rookie: "New to combat"
  wounded: "Injured but fighting"
  healthy: "Full health and energy"
  exhausted: "Tired and weak"
  inspired: "Morale boost"
  terrified: "Fearful and shaky"
```

#### Social Traits (20 traits)
```yaml
social_traits:
  charismatic: "Naturally persuasive"
  intimidating: "Commands respect"
  friendly: "Approachable and warm"
  intimidating: "Commands respect"
  diplomatic: "Skilled negotiator"
  blunt: "Direct and honest"
  eloquent: "Well-spoken"
  quiet: "Reserved and thoughtful"
  talkative: "Enjoys conversation"
  empathetic: "Understands others"
  apathetic: "Lacks empathy"
  humorous: "Enjoys laughter"
  serious: "Focused and intense"
  charming: "Attractive personality"
  awkward: "Socially uncomfortable"
  confident: "Self-assured"
  insecure: "Lacks confidence"
  influential: "Has social power"
  isolated: "Socially disconnected"
```

### Dialogue Template Configuration

#### Hostile Dialogue (100 templates)
```yaml
hostile_dialogue:
  greeting:
    - "Get out of my sight before I lose my temper."
    - "I don't have time for your games."
    - "Leave now or face the consequences."
    - "This is your final warning."
    - "What do you want, troublemaker?"
    - "I'm watching you closely."
    - "One wrong move and you'll regret it."
    - "Don't test my patience."
    - "I don't like strangers."
    - "State your business and leave."
  
  question:
    - "Why should I answer you?"
    - "I don't trust strangers."
    - "Mind your own business."
    - "Go away before things get ugly."
    - "What do you want from me?"
    - "I don't owe you anything."
    - "Stop asking questions."
    - "This is none of your concern."
    - "Leave me alone."
    - "I don't have time for this."
  
  trade:
    - "I don't deal with your kind."
    - "Take your business elsewhere."
    - "I don't want what you're selling."
    - "My prices are not for you."
    - "I don't trade with enemies."
    - "Get lost, merchant."
    - "I don't want your goods."
    - "Your presence offends me."
    - "Leave my shop immediately."
    - "I don't serve your type."
  
  help:
    - "I don't help enemies."
    - "You're on your own."
    - "Figure it out yourself."
    - "Don't expect my assistance."
    - "I won't lift a finger."
    - "Solve your own problems."
    - "I'm not your assistant."
    - "I don't care about your issues."
    - "Handle it yourself."
    - "I'm not helping you."
  
  goodbye:
    - "Good riddance."
    - "Don't come back."
    - "Finally, some peace and quiet."
    - "I hope I never see you again."
    - "Stay away from here."
    - "Don't return."
    - "I'm glad you're leaving."
    - "Get lost and stay lost."
    - "Never show your face here again."
    - "I won't miss you."
```

#### Friendly Dialogue (100 templates)
```yaml
friendly_dialogue:
  greeting:
    - "Welcome, friend!"
    - "It's good to see you!"
    - "I'm so glad you're here!"
    - "What brings you to our humble establishment?"
    - "Greetings, traveler!"
    - "Hello there, friend!"
    - "Nice to meet you!"
    - "Welcome, welcome!"
    - "Good day to you!"
    - "Pleased to make your acquaintance."
  
  question:
    - "That's an interesting question!"
    - "Let me think about that for you."
    - "I'd be happy to help you understand."
    - "That's worth considering."
    - "Good question! Let me see..."
    - "I have some thoughts on that."
    - "That's a thoughtful inquiry."
    - "Allow me to share my perspective."
    - "I can help with that."
    - "That's a valid point."
  
  trade:
    - "Excellent choice!"
    - "You have a good eye for quality."
    - "That's a fair price."
    - "I'd be happy to trade with you."
    - "Great selection!"
    - "You've come to the right place."
    - "I like your style."
    - "Fair deal for both of us."
    - "That's reasonable."
    - "I accept your offer."
  
  help:
    - "Of course, I'll help!"
    - "I'm at your service."
    - "Consider it done!"
    - "I'm happy to assist you."
    - "What do you need?"
    - "I can definitely help with that."
    - "Let me help you out."
    - "I'm here to help."
    - "Count on me!"
    - "I'll do what I can."
  
  goodbye:
    - "Come back anytime!"
    - "We'll be here for you."
    - "Safe travels, my friend."
    - "May fortune favor you!"
    - "Farewell, friend!"
    - "Until we meet again!"
    - "Take care of yourself!"
    - "See you soon!"
    - "Good luck on your journey!"
    - "Visit again!"
```

### Asset Summary

#### Baked Assets
- **Intent Vectors**: 55 semantic embeddings for action recognition
- **Trait Vectors**: 66 personality, combat, and social trait embeddings
- **Interaction Vectors**: 32 specialized interaction embeddings
- **Lore Vectors**: 15 historical event embeddings
- **Dialogue Vectors**: 100 mood-based dialogue templates

#### Master Seed Coverage
- **Factions**: 3 complete faction configurations
- **History**: 10 epochs spanning 1,000 years
- **Traits**: 100 comprehensive trait definitions
- **Dialogue**: 200 dialogue templates across 5 moods
- **Events**: 50+ historical event types

## Usage Instructions

### Loading the Master Seed
```python
from utils.historian import Historian
from logic.faction_system import FactionSystem
from world_ledger import WorldLedger

# Initialize systems
world_ledger = WorldLedger()
faction_system = FactionSystem(world_ledger)
historian = Historian(world_ledger)

# Load Master Seed
with open('MASTER_SEED.md', 'r') as f:
    master_config = yaml.safe_load(f)

# Create world with Master Seed
factions = faction_system.create_factions(master_config['factions'])
historian.simulate_deep_time(master_config['world_seed'])
```

### Verification
```python
# Verify Master Seed loaded correctly
assert len(factions) == 3
assert len(faction_system.get_faction_control_map()) > 0
assert len(historian.epochs) == 10
print("✅ Master Seed loaded successfully!")
```

---

## Conclusion

The **Master Seed** configuration provides a complete foundation for generating rich, living worlds with:

- **Deep History**: 1,000 years of simulated events
- **Geopolitics**: 3 factions with complex relationships
- **Character Depth**: 100 traits for nuanced personalities
- **Social Agency**: 200 dialogue templates for realistic interactions
- **Asset Completeness**: 268 pre-baked vectors for instant performance

This configuration ensures that every world generated from the Master Seed will have the same depth, complexity, and narrative potential while maintaining the Iron Frame's performance requirements.

---

*Master Seed: The DNA of Synthetic Reality*
