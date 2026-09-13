# rpgCore System Specifications
**Spec-Driven Development Specifications v1.0**

---

## 🌍 World System Specifications

### 1. Hexagon World Geography System

#### 1.1 Core Components
```python
@dataclass
class HexagonWorld:
    """Six-culture hexagonal world with garden center"""
    cultures: Dict[str, CultureRegion]
    garden: GardenRegion
    intersections: Dict[str, IntersectionZone]
    world_state: WorldState

@dataclass 
class CultureRegion:
    """One of six cultural territories"""
    culture_type: CultureType  # EMBER, CRYSTAL, TUNDRA, etc.
    position: HexPosition
    resources: ResourceInventory
    diplomatic_standing: Dict[str, float]  # Relationship with player
    territory_map: GridMap
```

#### 1.2 Position System
- **Coordinate System**: Hexagonal grid with axial coordinates
- **Scale**: Each culture region = 10x10 tiles (48px per tile)
- **Garden Position**: Center coordinate (0, 0) - neutral ground
- **Intersection Zones**: Between neighboring cultures, wilderness areas

#### 1.3 World State Management
- **Fracture State**: Global conflict level (cold war → open conflict)
- **Time Progression**: World events, seasonal changes
- **Cultural Relations**: Dynamic alliances, trade routes, conflicts
- **Player Impact**: Actions affect diplomatic standing across cultures

### 2. Culture System Specifications

#### 2.1 Cultural Attributes
```python
@dataclass
class CultureAttributes:
    """Statistical and behavioral tendencies per culture"""
    primary_stat: StatType      # STRENGTH, DEXTERITY, etc.
    secondary_stat: StatType
    temperament: Temperament    # AGGRESSIVE, CURIOUS, PATIENT, etc.
    elemental_affinity: Element # FIRE, WIND, WATER, EARTH, ICE, LIGHTNING
    resource_specialty: ResourceType
    cultural_bias: Dict[str, float]  # Behavior modifiers
```

#### 2.2 Six Culture Implementations
| Culture | Primary | Secondary | Element | Resource | Temperament |
|---------|---------|-----------|---------|----------|-------------|
| Ember | Strength | Attack | Fire | Scrap | Aggressive |
| Gale | Dexterity | Speed | Wind | Information | Curious |
| Marsh | Constitution | Endurance | Water | Food | Patient |
| Crystal | Defense | Wisdom | Earth | Gems | Cautious |
| Tundra | Intelligence | Perception | Ice | Knowledge | Independent |
| Tide | Charisma | Adaptability | Lightning | Gold | Sociable |

#### 2.3 Cultural Behavior Systems
- **Diplomatic AI**: Each culture has unique personality in negotiations
- **Trade Logic**: Resource exchange rates based on need and relationship
- **Conflict Resolution**: Different approaches to disputes (Ember=force, Tide=trade)
- **Information Flow**: Gale as information brokers, Tide as diplomatic hub

### 3. Garden System Specifications

#### 3.1 Garden Architecture
```python
@dataclass
class GardenRegion:
    """Player home base - neutral convergence point"""
    rooms: Dict[str, GardenRoom]
    ship_state: ShipRepairState
    slime_population: SlimeRegistry
    visitor_log: List[CulturalVisit]
    expansion_progress: Dict[str, float]

@dataclass
class GardenRoom:
    """Expandable garden spaces"""
    room_type: RoomType  # NURSERY, CLINIC, TRAINING, VAULT, etc.
    unlocked: bool
    equipment: List[Equipment]
    slime_capacity: int
```

#### 3.2 Garden Systems
- **Expansion Mechanic**: New rooms unlock through progression
- **Ship Repair**: Visible progress toward original goal
- **Slime Management**: Breeding, training, aging systems
- **Diplomatic Hub**: Cultural emissaries visit garden
- **Resource Processing**: Convert raw resources to usable items

### 4. Void System Specifications

#### 4.1 Void Mechanics
```python
@dataclass
class VoidTraits:
    """Rare genetic traits from original unified culture"""
    trait_level: float  # 0.0 to 1.0, higher = more void influence
    visual_effects: List[VoidEffect]
    cultural_resistance: Dict[str, float]  # Other cultures' reactions
    world_event_flag: bool  # Triggers emissary visits
```

#### 4.2 Void Breeding System
- **Garden Requirement**: Only garden conditions can produce void slimes
- **Multi-Generation**: Requires deep breeding chains, not random chance
- **World Events**: Void slime appearance triggers cultural emissaries
- **Cultural Reactions**: Fear, curiosity, worship based on culture

### 5. Resource System Specifications

#### 5.1 Three Core Resources
```python
@dataclass
class ResourceInventory:
    """World economic resources"""
    gold: int           # Liquid economy (Tide)
    scrap: int          # Material economy (Ember)  
    food: int           # Living economy (Marsh)
    rare_resources: Dict[str, int]  # Culture-specific
```

#### 5.2 Resource Flow Systems
- **Generation**: Each culture produces specialty resource
- **Trade**: Exchange rates based on supply/demand and relationships
- **Processing**: Raw resources → usable items → equipment
- **Consumption**: Slime feeding, equipment crafting, ship repair

### 6. Intersection Zone System Specifications

#### 6.1 Zone Mechanics
```python
@dataclass
class IntersectionZone:
    """Wilderness between two cultures"""
    primary_culture: CultureType
    secondary_culture: CultureType
    elemental_mix: Tuple[Element, Element]
    danger_level: float
    resource_nodes: List[ResourceNode]
    encounter_table: EncounterTable
```

#### 6.2 Zone Types and Characteristics
| Zone | Cultures | Elements | Resources | Danger |
|------|----------|----------|-----------|--------|
| Magma | Ember + Crystal | Fire + Earth | Weapons, Scrap | High |
| Firestorm | Ember + Gale | Fire + Wind | Information | Extreme |
| Squall | Gale + Tide | Wind + Lightning | Contraband | Medium |
| Storm | Tide + Marsh | Lightning + Water | Exotic Food | High |
| Bog | Marsh + Tundra | Water + Ice | Secrets | Variable |
| Frost | Tundra + Crystal | Ice + Earth | Ancient Items | Extreme |

### 7. Narrative System Specifications

#### 7.1 Story Progression
```python
@dataclass
class NarrativeState:
    """Player's journey through the world"""
    phase: StoryPhase  # CRASH, SURVIVAL, UNDERSTANDING, CHOICE
    ship_progress: float  # 0.0 to 1.0 repair completion
    cultural_discovery: Dict[str, float]  # Knowledge per culture
    world_understanding: float  # Overall lore discovery
    relationship_depth: Dict[str, float]  # Bond with slimes
```

#### 7.2 Narrative Systems
- **Discovery Mechanics**: Information revealed through exploration and interaction
- **Relationship Building**: Slime bonds affect cultural diplomacy
- **Choice Consequences**: Actions have lasting world impacts
- **Emotional Arc**: From "want to leave" to "understand why I stay"

### 8. Genetics System Specifications

#### 8.1 Genetic Architecture
```python
@dataclass
class SlimeGenome:
    """Complete genetic profile of a slime"""
    culture: CultureGenes
    stats: StatGenes
    shape: ShapeGenes
    color: ColorGenes
    lineage: LineageRecord

@dataclass
class CultureGenes:
    """Culture inheritance using dominant/recessive alleles"""
    allele_a: tuple[str, float]  # (culture_name, expression_weight)
    allele_b: tuple[str, float]
    expression: dict[str, float]  # Resolved weights (sums to 1.0)
    tier: int  # 1-8 genetic complexity
    tier_name: str  # 'Blooded', 'Bordered', 'Sundered', etc.
```

#### 8.2 Eight-Tier Genetic System
| Tier | Count | Description | Visual Expression |
|------|-------|-------------|-------------------|
| 1 - Blooded | 6 | Single culture heritage | Solid, vivid culture color |
| 2 - Bordered | 6 | Two adjacent cultures | Blended color gradient |
| 3 - Sundered | 3 | Two opposite cultures | Sectional color, hard boundary |
| 4 - Drifted | 6 | Skip-one cultures | Partial blend, soft edges |
| 5 - Threaded | 20 | Three culture heritage | Complex color mixing |
| 6 - Convergent | 15 | Four culture heritage | Void characteristics begin |
| 7 - Liminal | 6 | Five culture heritage | Almost Void, one color missing |
| 8 - Void | 1 | All six cultures unified | Full iridescent spectrum |

#### 8.3 Breeding Mechanics
- **Allele Resolution**: Each parent contributes one allele, dominant expresses more strongly
- **Stat Inheritance**: Weighted average + random variance + mutation chance
- **Visual Inheritance**: Color blend + shape selection + pattern expression
- **Mutation Factors**: Sundered parents, high generation, Void proximity

#### 8.4 ECS Integration
- **GeneticsComponent**: Complete genome + level + experience
- **BreedingComponent**: Fertility + cooldown + offspring history
- **GeneticsSystem**: Inheritance calculations + tier determination
- **BreedingSystem**: Breeding operations + cooldown management

#### 8.5 Performance Specifications
- **Memory**: ~1KB per slime genome
- **Computation**: <1ms breeding calculation, <0.1ms tier calc
- **Storage**: Compact JSON format for save files
- **Rendering**: <2ms visual profile generation

### 9. Integration with Existing Systems

#### 9.1 ECS Integration
- **CultureComponent**: Cultural affiliation and traits
- **ResourceComponent**: Resource inventory and production
- **WorldPositionComponent**: Position in hexagon world
- **RelationshipComponent**: Diplomatic standing data

#### 9.2 Rendering Integration
- **Cultural Visuals**: Color palettes and movement patterns per culture
- **Environmental Rendering**: Different terrain per region
- **Void Effects**: Special rendering for void traits
- **Garden Expansion**: Visual progression as rooms unlock

#### 9.3 Save System Integration
- **World State**: Complete world state persistence
- **Cultural Memory**: Faction relationships saved
- **Player Progress**: Narrative state and achievements
- **Garden State**: Room unlocks and population

---

## 10. Lifecycle System Specifications

### 10.1 Lifecycle Architecture
```python
@dataclass
class LifecycleComponent:
    """Lifecycle state and progression"""
    level: int
    experience: int
    stage: LifecycleStage  # HATCHLING, JUVENILE, YOUNG, PRIME, VETERAN, ELDER
    age_days: int
    total_dispatches: int
    successful_dispatches: int
    
    # Stage-specific capabilities
    can_dispatch: bool
    can_breed: bool
    can_equip: bool
    mentoring_bonus: float

@dataclass
class MentoringComponent:
    """Mentoring relationships and bonuses"""
    mentor_id: Optional[UUID]
    mentees: List[UUID]
    mentoring_strength: float
    remembered_lessons: List[str]

@dataclass
class LoreRecordComponent:
    """Garden lore and history tracking"""
    is_named: bool
    name: Optional[str]
    notable_achievements: List[str]
    offspring_achievements: List[str]
    garden_history_entries: List[str]
    relationship_depth: Dict[str, float]
```

### 10.2 Six Lifecycle Stages
| Stage | Levels | Dispatch | Breeding | Equipment | Mentoring | Key Trait |
|-------|--------|----------|----------|-----------|-----------|-----------|
| Hatchling | 0-1 | ✗ | ✗ | ✗ | ✗ | Forming |
| Juvenile | 2-3 | Low-risk | ✗ | ✗ | ✗ | Learning |
| Young | 4-5 | Most zones | ✓ | ✓ | ✗ | Established |
| Prime | 6-7 | All zones | ✓ (optimal) | ✓ | ✗ | Peak |
| Veteran | 8-9 | All zones | ✓ | ✓ | Passive | Wise |
| Elder | 10 | Discouraged | ✓ (rare outcomes) | ✓ | Maximum | Legacy |

### 10.3 Tier × Lifecycle Interactions
- **Tier 1 Blooded**: Standard lifecycle, predictable progression
- **Tier 2 Bordered**: Extended Juvenile phase, stronger Prime
- **Tier 3 Sundered**: Unpredictable stat spikes, volatile behavior
- **Tier 4 Drifted**: Most stable progression curve
- **Tier 5 Threaded**: Early mentoring bonus, cultural influence
- **Tier 6 Convergent**: Slower early leveling, higher ceiling
- **Tier 7 Liminal**: Accelerated post-Juvenile, narrative charge
- **Tier 8 Void**: Smooth balanced progression, world events at Elder

### 10.4 ECS Integration
- **LifecycleSystem**: Experience processing and stage advancement
- **MentoringSystem**: Elder-mentee relationships and bonuses
- **LoreSystem**: Garden history and achievement tracking
- **StageBehaviorSystem**: Stage-specific behavior modifications

### 10.5 Performance Specifications
- **Memory**: ~200 bytes per slime lifecycle data
- **Computation**: <0.1ms experience, <0.5ms stage transitions
- **Storage**: Compact JSON format for save files
- **Mentoring**: <0.2ms per mentor-mentee pair

---

## 11. Visual Expression System Specifications

### 11.1 Visual Architecture
```python
@dataclass
class VisualComponent:
    """Complete visual profile of a slime"""
    shape_params: ShapeParameters
    color_profile: ColorProfile
    pattern_params: PatternParameters
    expression_state: ExpressionState
    rendering_context: RenderingContext

@dataclass
class ExpressionComponent:
    """Emotional expression state and transitions"""
    current_emotion: EmotionType
    target_emotion: EmotionType
    transition_progress: float
    expression_intensity: float

@dataclass
class RenderingContextComponent:
    """Rendering context and mode"""
    mode: RenderMode  # WORLD, INTIMATE, SILHOUETTE
    scale: float
    detail_level: DetailLevel  # LOW, MEDIUM, HIGH, FULL
    background_context: Optional[str]
```

### 11.2 Shape System
| Shape | Physical Profile | Gameplay Relevance |
|-------|-----------------|-------------------|
| Round | Balanced, stable | Default. Reliable |
| Wide/Flat | Low center of gravity | Sumo advantage |
| Tall/Narrow | Extended reach | Speed/stability trade |
| Compact | Dense, heavy | Strength/Defense |
| Irregular | Unpredictable | Trickster archetype |

### 11.3 Color Blend Modes
| Mode | Tier | Visual Effect |
|------|------|---------------|
| Solid | 1 (Blooded) | Single culture color |
| Gradient | 2 (Bordered) | Smooth adjacent blend |
| Sectional | 3 (Sundered) | Hard opposing boundary |
| Soft Edge | 4 (Drifted) | Partial soft blend |
| Complex Mix | 5 (Threaded) | Multiple hues visible |
| Deepening | 6 (Convergent) | Darkening + iridescence |
| Near-Void | 7 (Liminal) | Five colors, one absent |
| Iridescent | 8 (Void) | Full spectrum cycling |

### 11.4 Expression System
| Emotion | Eye Shape | Brow Angle | Mouth Curve | Symbol |
|---------|-----------|------------|-------------|--------|
| Happy | Round, open | Neutral/raised | Upward curl | Blush circles |
| Sad | Half-closed | Angled inward | Downward curl | Tear drop |
| Angry | Narrowed | Sharply down | Tight line | Heat waves |
| Curious | Wide, asymmetric | One raised | Slight open | Question mark |
| Scared | Wide, pupils small | Raised high | Open O | Sweat drop |
| Content | Closed/squint | Soft | Gentle curve | None |
| Excited | Stars/sparkles | Raised | Wide open | Bounce |
| Confused | Asymmetric | Varied | Crooked | Spiral |

### 11.5 Rendering Contexts
| Context | Scale | Mode | Detail Level |
|---------|-------|------|-------------|
| Garden overview | Small | World | Shape + color + basic expression |
| Garden interaction | Medium | World | Full expression system |
| Dispatch track | Small | World | Shape + color only (performance) |
| Combat/Sumo | Medium | World | Shape + physics expression |
| Visual novel scene | Large | Intimate | Full fidelity, expression priority |
| Silhouette | Any | Intimate | Shape + culture glow only |
| Lore record portrait | Medium | Static | Full genetics expression, frozen |

### 11.6 ECS Integration
- **VisualRenderingSystem**: Main visual rendering pipeline
- **ShapeRenderingSystem**: Procedural shape generation
- **ColorRenderingSystem**: Culture colors and blend modes
- **ExpressionRenderingSystem**: Emotional expression and animation

### 11.7 Performance Specifications
- **Memory**: ~300 bytes per slime visual data
- **Computation**: <1ms shape generation, <0.5ms color blending
- **Rendering**: 60 FPS world mode, 30 FPS intimate mode
- **Patterns**: <1ms per slime, adaptive detail based on distance

---

## 12. Personality System Specifications

### 12.1 Personality Architecture
```python
@dataclass
class PersonalityComponent:
    """Personality state and experience tracking"""
    base_traits: dict[str, float]           # Derived from culture expression
    experience_delta: dict[str, float]      # Accumulated life experience
    notable_experiences: list[PersonalityEvent]
    
    def get_current_traits(self) -> dict[str, float]:
        """Get current personality traits with experience modifications"""

@dataclass
class PersonalityEvent:
    """Record of personality-affecting experience"""
    axis: str
    delta: float
    description: str
    timestamp: float
```

### 12.2 Six Personality Axes
| Axis | Culture | High Expression | Low Expression |
|------|---------|-----------------|----------------|
| Aggression | Ember | Dominant, initiates conflict | Passive, yields |
| Curiosity | Gale | Explores, investigates | Stays close, routine |
| Patience | Marsh | Waits, endures | Impulsive, immediate |
| Caution | Crystal | Defensive, trust-slow | Reckless, open |
| Independence | Tundra | Self-sufficient, reserved | Dependent, expressive |
| Sociability | Tide | Engages others, adapts | Isolated, consistent |

### 12.3 Personality Derivation
```python
def derive_personality(culture_expression: dict[str, float]) -> dict[str, float]:
    """Direct mapping from culture expression to personality axes"""
    return {
        'aggression':    culture_expression.get('ember', 0.0),
        'curiosity':     culture_expression.get('gale', 0.0),
        'patience':      culture_expression.get('marsh', 0.0),
        'caution':       culture_expression.get('crystal', 0.0),
        'independence':  culture_expression.get('tundra', 0.0),
        'sociability':   culture_expression.get('tide', 0.0),
    }
```

### 12.4 Experience Modification
| Event | Axis Modified | Direction | Magnitude |
|-------|--------------|-----------|-----------|
| Won sumo matches (3+) | aggression | + | small |
| Lost sumo matches (3+) | aggression | - | small |
| Completed dangerous dispatch | curiosity | + | small |
| Lost on dispatch | caution | + | small |
| Extended garden idle time | patience | + | very small |
| Mentored by Elder | caution | + | small |
| Relationship depth | sociability | + | small |
| Isolation | independence | + | small |

### 12.5 Personality Expression Contexts
| Context | Personality Influence | Implementation |
|---------|---------------------|-------------|
| Idle Behavior | Movement patterns, clustering | BehaviorComponent weights |
| Combat & Sumo | Engagement timing, risk tolerance | Combat decision weights |
| Dispatch Preference | Zone type affinity | Soft suggestion weights |
| Visual Novel | Dialogue style, expression | Conversation response generation |

### 12.6 Tier × Personality Interactions
- **Tier 3 Sundered**: Opposing axes both high (aggression+patience, curiosity+independence)
- **Tier 8 Void**: All axes balanced (~0.167) - adaptable, unreadable
- **Tier 2 Bordered**: Adjacent culture traits create harmonious personalities
- **Tier 6 Convergent**: Complex personalities with multiple moderate traits

### 12.7 ECS Integration
- **PersonalitySystem**: Trait derivation and experience tracking
- **PersonalityBehaviorSystem**: Integration with existing BehaviorComponent
- **PersonalityExperienceSystem**: Event recording and trait modification
- **ConversationSystem**: Personality-driven dialogue generation

### 12.8 Performance Specifications
- **Memory**: ~150 bytes per slime personality data
- **Computation**: <0.1ms derivation, <0.2ms behavior evaluation
- **Evaluation Frequency**: On state transitions only (not per frame)
- **Storage**: Compact JSON format for save files

---

## 13. Game Systems Integration Specifications

### 13.1 Core Loop Architecture
```python
@dataclass
class GardenSystem:
    """Central garden management system"""
    slime_registry: ComponentRegistry
    resource_inventory: ResourceInventory
    expansion_progress: dict[str, float]
    diplomatic_relations: dict[str, float]

@dataclass
class DispatchSystem:
    """Unified dispatch track system"""
    active_squads: list[Squad]
    zone_access: dict[str, bool]
    personality_affinities: dict[str, dict[str, float]]

@dataclass
class ConquestSystem:
    """Territory control and culture diplomacy"""
    world_map: WorldMap
    territory_control: dict[str, CultureType]
    diplomatic_standing: dict[str, StandingLevel]
```

### 13.2 Three Sub Loops
| Sub Loop | Primary Focus | Core Systems | Output to Garden |
|----------|---------------|--------------|------------------|
| **Breeder** | Genetics, training | GardenSystem, MinigameTrainingSystem | Stronger slimes, rare genetics |
| **Conqueror** | Territory, resources | ConquestSystem, DispatchSystem | More resources, culture access |
| **Wanderer** | Relationships, narrative | VisualNovelSystem, DiplomacySystem | Information, unique rewards |

### 13.3 Player Control Modes
| Mode | Control Level | System Behavior | Target Player |
|------|---------------|----------------|---------------|
| **Granular** | Full manual | Player makes all decisions | Detail-oriented |
| **Auto** | Preference-based | System executes with override | Moderate engagement |
| **Idle** | Strategic only | Garden autonomy with direction | Scope-focused |

### 13.4 Unified Dispatch System
| Zone Type | Activity | Key Stats | Resources | Culture Affinity |
|-----------|----------|-----------|-----------|-----------------|
| **Racing** | Speed competition | Dexterity, Speed | Gold, prestige | Gale |
| **Dungeon** | Combat exploration | Strength, Defense | Scrap, rare items | Ember, Void |
| **Foraging** | Resource gathering | Constitution, Perception | Food, materials | Marsh, Tundra |
| **Trade Route** | Economy, diplomacy | Charisma, Adaptability | Gold, standing | Tide |
| **Mission** | Narrative quest | Varied | Story rewards | Varied |
| **Arena** | Structured combat | Combat stats | Gold, fame | Varied |

### 13.5 Resource Economy
| Resource | Source | Use | Flow Type |
|----------|--------|-----|-----------|
| **Gold** | Tide, racing, trade | Equipment, hiring | Liquid economy |
| **Scrap** | Ember, dungeons, salvage | Ship repair, crafting | Material economy |
| **Food** | Marsh, foraging, garden | Roster sustenance | Living economy |

### 13.6 Conquest Integration
- **Tower Defense Mode**: Defensive territory holding
- **FFT Grid Mode**: Offensive territory capture
- **Culture Hub Diplomacy**: Relationship-based unlocking
- **World Map**: 17 nodes (6 cultures + 6 wilderness + garden + 4 special)

### 13.7 ECS Integration
- **GardenSystem**: Manages all slime components and resources
- **DispatchSystem**: Uses ComponentRegistry for squad assembly
- **ConquestSystem**: Integrates with behavior and personality systems
- **VisualNovelSystem**: Uses intimate rendering mode for conversations

### 13.8 Performance Specifications
- **Memory**: ~3KB total for all systems (100 slimes)
- **Computation**: <3ms per frame for full system update
- **Storage**: Compact JSON format for complete world state
- **Scalability**: Supports 100+ slimes with 60 FPS performance

---

## 🎯 Implementation Priority

### Phase 1: Core Geography
1. Hexagon coordinate system
2. Basic culture definitions
3. Garden foundation
4. Resource inventory system

### Phase 2: Cultural Systems  
1. Culture-specific behaviors
2. Diplomatic AI
3. Trade mechanics
4. Intersection zones

### Phase 3: Advanced Systems
1. Void breeding mechanics
2. World events
3. Narrative progression
4. Cultural emissaries

---

**Specified**: 2026-03-01  
**Version**: 1.0  
**Status**: READY FOR IMPLEMENTATION  
**Dependencies**: Constitution v1.0
