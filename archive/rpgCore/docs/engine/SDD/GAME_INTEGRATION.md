# Game Integration — Engine SDD
Authority: Hard build contract.
Extracted from SPECIFY.md (origin doc).
Agents treat as implementation specification.

---

## Narrative System Specifications

### Story Progression
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

### Narrative Systems
- **Discovery Mechanics**: Information revealed through exploration and interaction
- **Relationship Building**: Slime bonds affect cultural diplomacy
- **Choice Consequences**: Actions have lasting world impacts
- **Emotional Arc**: From "want to leave" to "understand why I stay"

---

## Game Systems Integration Specifications

### Core Loop Architecture
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

### Three Sub Loops
| Sub Loop | Primary Focus | Core Systems | Output to Garden |
|----------|---------------|--------------|------------------|
| **Breeder** | Genetics, training | GardenSystem, MinigameTrainingSystem | Stronger slimes, rare genetics |
| **Conqueror** | Territory, resources | ConquestSystem, DispatchSystem | More resources, culture access |
| **Wanderer** | Relationships, narrative | VisualNovelSystem, DiplomacySystem | Information, unique rewards |

### Player Control Modes
| Mode | Control Level | System Behavior | Target Player |
|------|---------------|----------------|---------------|
| **Granular** | Full manual | Player makes all decisions | Detail-oriented |
| **Auto** | Preference-based | System executes with override | Moderate engagement |
| **Idle** | Strategic only | Garden autonomy with direction | Scope-focused |

### Unified Dispatch System
| Zone Type | Activity | Key Stats | Resources | Culture Affinity |
|-----------|----------|-----------|-----------|-----------------|
| **Racing** | Speed competition | Dexterity, Speed | Gold, prestige | Gale |
| **Dungeon** | Combat exploration | Strength, Defense | Scrap, rare items | Ember, Void |
| **Foraging** | Resource gathering | Constitution, Perception | Food, materials | Marsh, Tundra |
| **Trade Route** | Economy, diplomacy | Charisma, Adaptability | Gold, standing | Tide |
| **Mission** | Narrative quest | Varied | Story rewards | Varied |
| **Arena** | Structured combat | Combat stats | Gold, fame | Varied |

### Resource Economy
| Resource | Source | Use | Flow Type |
|----------|--------|-----|-----------|
| **Gold** | Tide, racing, trade | Equipment, hiring | Liquid economy |
| **Scrap** | Ember, dungeons, salvage | Ship repair, crafting | Material economy |
| **Food** | Marsh, foraging, garden | Roster sustenance | Living economy |

### Conquest Integration
- **Tower Defense Mode**: Defensive territory holding
- **FFT Grid Mode**: Offensive territory capture
- **Culture Hub Diplomacy**: Relationship-based unlocking
- **World Map**: 17 nodes (6 cultures + 6 wilderness + garden + 4 special)

### ECS Integration
- **GardenSystem**: Manages all slime components and resources
- **DispatchSystem**: Uses ComponentRegistry for squad assembly
- **ConquestSystem**: Integrates with behavior and personality systems
- **VisualNovelSystem**: Uses intimate rendering mode for conversations

### Performance Specifications
- **Memory**: ~3KB total for all systems (100 slimes)
- **Computation**: <3ms per frame for full system update
- **Storage**: Compact JSON format for complete world state
- **Scalability**: Supports 100+ slimes with 60 FPS performance

---

## Implementation Priority

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
