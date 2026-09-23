# World Systems — Engine SDD
Authority: Hard build contract.
Extracted from SPECIFY.md (origin doc).
Agents treat as implementation specification.

---

## Hexagon World Geography System

### Core Components
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

### Position System
- **Coordinate System**: Hexagonal grid with axial coordinates
- **Scale**: Each culture region = 10x10 tiles (48px per tile)
- **Garden Position**: Center coordinate (0, 0) - neutral ground
- **Intersection Zones**: Between neighboring cultures, wilderness areas

### World State Management
- **Fracture State**: Global conflict level (cold war → open conflict)
- **Time Progression**: World events, seasonal changes
- **Cultural Relations**: Dynamic alliances, trade routes, conflicts
- **Player Impact**: Actions affect diplomatic standing across cultures

---

## Resource System Specifications

### Three Core Resources
```python
@dataclass
class ResourceInventory:
    """World economic resources"""
    gold: int           # Liquid economy (Tide)
    scrap: int          # Material economy (Ember)  
    food: int           # Living economy (Marsh)
    rare_resources: Dict[str, int]  # Culture-specific
```

### Resource Flow Systems
- **Generation**: Each culture produces specialty resource
- **Trade**: Exchange rates based on supply/demand and relationships
- **Processing**: Raw resources → usable items → equipment
- **Consumption**: Slime feeding, equipment crafting, ship repair

---

## Intersection Zone System Specifications

### Zone Mechanics
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

### Zone Types and Characteristics
| Zone | Cultures | Elements | Resources | Danger |
|------|----------|----------|-----------|--------|
| Magma | Ember + Crystal | Fire + Earth | Weapons, Scrap | High |
| Firestorm | Ember + Gale | Fire + Wind | Information | Extreme |
| Squall | Gale + Tide | Wind + Lightning | Contraband | Medium |
| Storm | Tide + Marsh | Lightning + Water | Exotic Food | High |
| Bog | Marsh + Tundra | Water + Ice | Secrets | Variable |
| Frost | Tundra + Crystal | Ice + Earth | Ancient Items | Extreme |
