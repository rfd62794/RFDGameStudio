# rpgCore Personality System Specification
**Design Document v1.0 — Living World Engine**

---

## 🧠 Core Philosophy

Personality is not a separate gene system. It derives from existing culture expression weights in the genome, modified by accumulated life experience. This means:

- Personality costs zero additional gene values
- Every slime already has a distinct behavioral signature at birth
- Personality evolves meaningfully but never completely overrides nature
- The system generates individuality at scale automatically

A garden of fifty slimes never feels uniform because their culture weights vary. No two are identical. The system creates character without requiring authored characters.

---

## 🎭 Personality Axes

Six personality axes map directly to the six cultures:

| Axis | Culture | High Expression | Low Expression |
|------|---------|-----------------|----------------|
| **Aggression** | Ember | Dominant, initiates conflict, high energy | Passive, yields, calm |
| **Curiosity** | Gale | Explores, investigates, risk-seeking | Stays close, routine-preferring |
| **Patience** | Marsh | Waits, endures, resource-conserving | Impulsive, immediate-gratification |
| **Caution** | Crystal | Defensive, trust-slow, loyal once earned | Reckless, open, quick to engage |
| **Independence** | Tundra | Self-sufficient, emotionally reserved, calculating | Dependent, emotionally expressive |
| **Sociability** | Tide | Engages others, adapts to situations, opportunistic | Isolated, consistent, predictable |

---

## 🔬 Personality Derivation

```python
def derive_personality(culture_expression: dict[str, float]) -> dict[str, float]:
    """
    Personality axes are directly mapped from culture expression weights.
    A slime with 60% Ember expression has 0.6 aggression as base.
    No computation needed beyond the mapping.
    """
    return {
        'aggression':    culture_expression.get('ember', 0.0),
        'curiosity':     culture_expression.get('gale', 0.0),
        'patience':      culture_expression.get('marsh', 0.0),
        'caution':       culture_expression.get('crystal', 0.0),
        'independence':  culture_expression.get('tundra', 0.0),
        'sociability':   culture_expression.get('tide', 0.0),
    }
```

A pure Ember Blooded slime has aggression: 1.0, all others: 0.0.
A Void slime has all axes at approximately 0.167 — balanced, unreadable, neither extreme.
A Sundered Ember/Marsh slime has high aggression AND high patience — the internal tension is legible in personality.

---

## 📈 Experience Modification

Base personality from genetics is the foundation. Life experience nudges it — never overrides it, but shifts expression meaningfully over a full lifecycle.

```python
@dataclass
class PersonalityState:
    base_traits: dict[str, float]       # Derived from culture, never changes
    experience_delta: dict[str, float]  # Accumulated through gameplay events
    
    @property
    def current_traits(self) -> dict[str, float]:
        # Computed on read, not stored
        # Clamped to [0.0, 1.0] range
        return {
            axis: max(0.0, min(1.0, self.base_traits[axis] + self.experience_delta.get(axis, 0.0)))
            for axis in self.base_traits
        }
```

### Experience Events That Modify Personality

| Event | Axis Modified | Direction | Magnitude |
|-------|--------------|-----------|-----------|
| Won sumo matches (3+) | aggression | + | small |
| Lost sumo matches (3+) | aggression | - | small |
| Completed dangerous dispatch | curiosity | + | small |
| Lost on dispatch | caution | + | small |
| Extended garden idle time | patience | + | very small |
| Mentored by Elder | caution | + | small |
| Mentored by Ember Elder | aggression | + | very small |
| Relationship depth with opposite-culture slime | sociability | + | small |
| Isolation (no garden interactions for extended period) | independence | + | small |

Magnitude values are small by design. A lifetime of experience can shift a trait by 0.1-0.2 maximum. Nature dominates. Nurture refines.

---

## ⚡ Personality Evaluation

**Critical performance rule:** Personality does not evaluate every frame. It evaluates on behavior state transitions — when a slime decides what to do next.

At 50 slimes in a scene evaluating 3-5 times per second each: ~200 personality evaluations per second. This is negligible.

Never: 50 slimes × 60fps = 3000 evaluations per second.

```python
def evaluate_behavior(slime, context):
    """Called on state transitions, not every frame."""
    traits = slime.personality.current_traits
    
    if context.type == 'idle':
        return select_idle_behavior(traits, context)
    elif context.type == 'dispatch_choice':
        return evaluate_dispatch_preference(traits, context)
    elif context.type == 'combat_decision':
        return evaluate_combat_stance(traits, context)
```

---

## 🌍 Personality Expression Contexts

### Idle Behavior (Garden)

What a slime does when not directed. This is where personality creates the sense of a living world in the garden.

| Trait High | Idle Tendency |
|------------|---------------|
| High aggression | Approaches other slimes, initiates play-combat, claims space |
| High curiosity | Wanders to edges of garden, investigates new objects/arrivals |
| High patience | Stays near food source, remains stationary for long periods |
| High caution | Stays near familiar slimes, avoids garden newcomers initially |
| High independence | Moves alone, doesn't cluster with groups |
| High sociability | Clusters with groups, follows other slimes |

Idle behavior diversity is what makes a full garden feel inhabited rather than managed. No authored scripts — personality generates it automatically.

### Combat & Sumo Tendency

| Trait | Combat Expression |
|-------|-----------------|
| High aggression | Engages immediately, doesn't wait, takes risks |
| High caution | Hangs back, defensive positioning, waits for openings |
| High patience | Endures, outlasts, accepts punishment to land one good hit |
| High curiosity | Tries unexpected approaches, unpredictable tactics |

This happens in BehaviorComponent — personality influences AI decision weights, not hard locks.

### Dispatch Preference

Personality creates natural affinity for zone types. Not locking slimes out but providing bonuses when aligned:

| Zone Type | Preferred Personality |
|-----------|----------------------|
| Combat/Dungeon | High aggression |
| Scouting/Exploration | High curiosity |
| Long missions | High patience + independence |
| Trade routes | High sociability |
| Dangerous high-risk | High curiosity + low caution |
| Defense missions | High caution |

The dispatcher uses these affinities as soft weights when suggesting team compositions. Players can override, but the suggestion system reflects personality.

### Visual Novel & Conversation

Personality directly influences how slimes appear and react in visual novel scenes:

| Trait | Conversation Expression |
|-------|------------------------|
| High aggression | Forward body lean, intense eye contact, short responses |
| High caution | Slow trust development, early scenes guarded, opens gradually |
| High sociability | Warm immediately, lots of expression state changes, responsive |
| High independence | Sparse dialogue, content without attention, presence without need |
| High curiosity | Asks questions back, interested in the astronaut's world |

Culture identity in diplomatic scenes:
- **Ember slime present:** Creates tension, may complicate diplomacy with Ember-opposed cultures
- **Tide slime present:** Smooths interactions, may provide charisma bonus
- **Void slime present:** Causes NPCs from all cultures to react with visible discomfort or reverence

---

## 🧬 Personality & Tier Interactions

### Tier 3 Sundered

The most interesting personality case. Two opposing culture weights means two opposing personality axes are both high simultaneously.

Ember/Marsh Sundered: High aggression AND high patience. This slime is aggressive but doesn't quit when losing. Terrifying in sustained combat. Unpredictable in idle.

Gale/Tundra Sundered: High curiosity AND high independence. Goes exploring but goes alone. Doesn't bring information back. Gets into trouble in interesting ways.

Crystal/Tide Sundered: High caution AND high sociability. Wants connection, fears it. The most emotionally complex slime in the roster. Best visual novel character potential.

### Tier 8 Void

All axes at ~0.167. No personality extreme. The Void slime is:
- Not particularly aggressive or passive
- Not particularly curious or incurious
- Not particularly patient or impulsive

They are the most difficult slime to read in idle behavior. They adapt. They fit any context without calling attention to themselves. This is its own form of presence — the slime that belongs everywhere because it belongs to no single culture.

In visual novel scenes, a Void slime's presence is felt before it is explained. NPCs react to something they can't articulate.

---

## 📊 Personality Data Structure

```python
@dataclass
class PersonalitySystem:
    # Derived at birth from culture expression — immutable after
    base_traits: dict[str, float]
    
    # Accumulated through gameplay — grows slowly over lifetime
    # Stored as deltas, applied at read time
    experience_delta: dict[str, float] = field(default_factory=dict)
    
    # Event log for personality-affecting experiences
    # Lightweight — only stores significant events
    notable_experiences: list[PersonalityEvent] = field(default_factory=list)
    
    def record_experience(self, axis: str, delta: float, event_description: str):
        """Record a meaningful experience and its personality impact."""
        self.experience_delta[axis] = self.experience_delta.get(axis, 0.0) + delta
        self.notable_experiences.append(
            PersonalityEvent(axis=axis, delta=delta, description=event_description)
        )
    
    @property
    def current_traits(self) -> dict[str, float]:
        return {
            axis: max(0.0, min(1.0, base + self.experience_delta.get(axis, 0.0)))
            for axis, base in self.base_traits.items()
        }

@dataclass  
class PersonalityEvent:
    axis: str
    delta: float
    description: string
    # Timestamp added by calling code
```

---

## 🏗️ ECS Integration Specifications

### Personality Components
```python
@dataclass
class PersonalityComponent:
    """Personality state and experience tracking"""
    base_traits: dict[str, float]           # Derived from culture expression
    experience_delta: dict[str, float]      # Accumulated life experience
    notable_experiences: list[PersonalityEvent]
    
    def get_current_traits(self) -> dict[str, float]:
        """Get current personality traits with experience modifications"""
        
    def record_experience(self, axis: str, delta: float, description: str) -> None:
        """Record personality-affecting experience"""
        
    def evaluate_behavior_context(self, context: BehaviorContext) -> BehaviorWeights:
        """Evaluate personality for behavior decision making"""

@dataclass
class BehaviorContext:
    """Context for personality evaluation"""
    context_type: str  # 'idle', 'dispatch_choice', 'combat_decision', 'conversation'
    environment_data: dict[str, Any]
    available_options: list[BehaviorOption]
    
    def get_personality_weights(self, traits: dict[str, float]) -> dict[str, float]:
        """Convert personality traits to behavior weights"""
```

### Personality Systems
```python
class PersonalitySystem:
    """Manages personality evaluation and experience tracking"""
    def derive_base_personality(self, culture_expression: dict[str, float]) -> dict[str, float]:
        """Derive base personality from culture expression"""
        
    def evaluate_idle_behavior(self, entity: Entity) -> IdleBehavior:
        """Evaluate personality-driven idle behavior"""
        
    def evaluate_dispatch_preference(self, entity: Entity, available_zones: list[Zone]) -> dict[str, float]:
        """Evaluate zone preferences based on personality"""
        
    def evaluate_combat_stance(self, entity: Entity, combat_context: CombatContext) -> CombatStance:
        """Evaluate combat approach based on personality"""

class PersonalityExperienceSystem:
    """Tracks and applies personality-modifying experiences"""
    def record_combat_result(self, entity: Entity, won: bool, opponent_strength: float) -> None:
        """Record combat experience and personality impact"""
        
    def record_dispatch_result(self, entity: Entity, success: bool, danger_level: float) -> None:
        """Record dispatch experience and personality impact"""
        
    def record_social_interaction(self, entity: Entity, interaction_type: str, depth: float) -> None:
        """Record social experience and personality impact"""

class PersonalityBehaviorSystem:
    """Integrates personality with existing behavior system"""
    def modify_behavior_weights(self, entity: Entity, base_weights: dict[str, float]) -> dict[str, float]:
        """Modify behavior weights based on personality"""
        
    def select_idle_action(self, entity: Entity, available_actions: list[Action]) -> Action:
        """Select idle action based on personality"""
        
    def generate_conversation_response(self, entity: Entity, dialogue_context: DialogueContext) -> str:
        """Generate personality-appropriate dialogue"""
```

---

## 🎯 Performance Specifications

### Memory Usage
- **Per Slime**: ~150 bytes for personality data
- **Population**: 100 slimes = ~15KB personality data
- **Experience Log**: Variable, average ~200 bytes per slime with notable experiences

### Computation Requirements
- **Personality Derivation**: <0.1ms (one-time at birth)
- **Experience Processing**: <0.05ms per event
- **Behavior Evaluation**: <0.2ms per decision (not per frame)
- **Trait Calculation**: <0.01ms per read (simple addition)

### Storage Format
```python
# Compact JSON representation for save files
{
  "personality": {
    "base_traits": {"aggression": 0.6, "curiosity": 0.3, "patience": 0.1},
    "experience_delta": {"aggression": 0.05, "caution": 0.02},
    "notable_experiences": [
      {"axis": "aggression", "delta": 0.05, "description": "Won 3 sumo matches"}
    ]
  }
}
```

---

## 🎯 Implementation Priority

### Phase 1: Core Personality
1. PersonalityComponent with base trait derivation
2. Basic experience tracking system
3. Idle behavior evaluation
4. Integration with existing BehaviorComponent

### Phase 2: Advanced Features
1. Dispatch preference evaluation
2. Combat stance modification
3. Visual novel conversation integration
4. Experience event logging

### Phase 3: Polish & Depth
1. Tier-specific personality interactions
2. Complex personality scenarios (Sundered, Void)
3. Garden lore integration
4. Performance optimization for large populations

---

## 🔄 Integration with Existing Systems

### Genetics Integration
- **Base Personality**: Directly derived from culture expression weights
- **Tier Effects**: Tier influences personality complexity (Sundered tension, Void balance)
- **Visual Expression**: Personality influences expression system

### Behavior System Integration
- **Decision Weights**: Personality modifies AI decision weights
- **State Transitions**: Personality evaluated on behavior state changes
- **Idle Actions**: Personality drives garden idle behavior diversity

### Lifecycle Integration
- **Experience Accumulation**: Life experiences modify personality over time
- **Stage Effects**: Different life stages may weight experiences differently
- **Elder Influence**: Elder slimes provide personality-modifying mentoring

### Visual System Integration
- **Expression Mapping**: Personality traits map to visual expression parameters
- **Conversation Scenes**: Personality influences visual novel behavior
- **Idle Animation**: Personality affects garden idle animation choices

---

**Specified**: 2026-03-01  
**Version**: 1.0  
**Status**: READY FOR IMPLEMENTATION  
**Dependencies**: Constitution v1.0, Genetics Specification v1.0, Behavior System v1.0
