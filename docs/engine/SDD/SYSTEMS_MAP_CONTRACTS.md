# Systems Map Contracts — Engine SDD
Authority: Hard build contract.
Extracted from SYSTEMS_MAP_SPECIFICATION.md.
Agents treat as implementation specification.

---

## ECS Integration Specifications

### Core Systems Components
```python
@dataclass
class GardenSystem:
    """Central garden management system"""
    slime_registry: ComponentRegistry
    resource_inventory: ResourceInventory
    expansion_progress: dict[str, float]
    diplomatic_relations: dict[str, float]
    
    def update_garden_state(self, dt: float) -> None:
        """Update all garden systems"""
        
    def process_dispatch_returns(self, returns: DispatchResults) -> None:
        """Process resources and experience from dispatch"""

@dataclass
class DispatchSystem:
    """Unified dispatch track system"""
    active_squads: list[Squad]
    zone_access: dict[str, bool]
    personality_affinities: dict[str, dict[str, float]]
    
    def assemble_squad(self, squad_config: SquadConfig) -> Squad:
        """Assemble squad based on player selection"""
        
    def execute_dispatch(self, squad: Squad, zone: ZoneType) -> DispatchResults:
        """Execute dispatch and return results"""

@dataclass
class ConquestSystem:
    """Territory control and culture diplomacy"""
    world_map: WorldMap
    territory_control: dict[str, CultureType]
    diplomatic_standing: dict[str, StandingLevel]
    
    def update_territory(self, dt: float) -> None:
        """Update conquest state"""
        
    def process_diplomacy(self, culture: CultureType, action: DiplomaticAction) -> None:
        """Process diplomatic actions"""
```

### Player Control Systems
```python
@dataclass
class PlayerControlSystem:
    """Manages player engagement modes"""
    control_mode: ControlMode  # GRANULAR, AUTO, IDLE
    system_preferences: dict[str, dict]
    auto_policies: dict[str, AutoPolicy]
    
    def set_control_mode(self, mode: ControlMode) -> None:
        """Change player control mode"""
        
    def execute_auto_actions(self, dt: float) -> None:
        """Execute automated actions based on preferences"""

@dataclass
class MinigameTrainingSystem:
    """Autonomous minigame training system"""
    training_assignments: dict[UUID, MinigameType]
    training_progress: dict[UUID, float]
    
    def assign_training(self, slime_id: UUID, minigame: MinigameType) -> None:
        """Assign slime to autonomous training"""
        
    def process_training_results(self, dt: float) -> dict[UUID, TrainingResults]:
        """Process autonomous training outcomes"""
```

### Resource Management Systems
```python
@dataclass
class ResourceSystem:
    """Three-resource economy management"""
    gold: int
    scrap: int
    food: int
    culture_resources: dict[str, dict[str, int]]
    
    def process_resource_flow(self, flows: list[ResourceFlow]) -> None:
        """Process resource production and consumption"""
        
    def check_economic_pressure(self) -> EconomicPressure:
        """Check for resource scarcity and pressure"""

@dataclass
class TradeSystem:
    """Culture hub trading and diplomacy"""
    trade_routes: list[TradeRoute]
    market_prices: dict[str, float]
    cultural_goods: dict[str, CultureGoods]
    
    def execute_trade(self, trade: TradeProposal) -> TradeResult:
        """Execute trade with culture hub"""
        
    def update_market_conditions(self, dt: float) -> None:
        """Update market prices and availability"""
```

---

## Performance Specifications

### Memory Usage
- **Garden State**: ~2KB for 100 slimes + resources
- **World Map**: ~500 bytes for 17 nodes
- **Dispatch System**: ~1KB for active squads
- **Resource Economy**: ~200 bytes for all resources

### Computation Requirements
- **Garden Update**: <2ms per frame for 100 slimes
- **Dispatch Processing**: <1ms per dispatch resolution
- **Conquest Updates**: <0.5ms per territory update
- **Resource Flow**: <0.1ms per resource transaction

### Storage Format
```python
# Compact JSON for save files
{
  "garden": {
    "slimes": [...],
    "resources": {"gold": 1000, "scrap": 500, "food": 200},
    "expansion": {...}
  },
  "world": {
    "territories": {...},
    "diplomacy": {...},
    "dispatches": [...]
  }
}
```

---

## Implementation Priority

### Phase 1: Core Systems
1. GardenSystem with basic resource management
2. DispatchSystem with unified track abstraction
3. PlayerControlSystem with three engagement modes
4. Basic resource economy (gold, scrap, food)

### Phase 2: World Integration
1. ConquestSystem with territory control
2. Culture hub diplomacy system
3. MinigameTrainingSystem for autonomous development
4. Visual novel conversation integration

### Phase 3: Advanced Features
1. Complex resource economy with culture-specific goods
2. Advanced AI for auto-mode decision making
3. Performance optimization for large-scale conquest
4. Complete narrative arc implementation

---

## Integration with Existing Systems

### ECS Foundation Integration
- **ComponentRegistry**: Manages all slime components across systems
- **SystemRunner**: Orchestrates garden, dispatch, and conquest updates
- **BehaviorComponent**: Personality-driven behavior in all contexts

### Genetic System Integration
- **Breeding**: Feeds roster strengthening for all sub loops
- **Lifecycle**: Experience and aging affect all system performance
- **Visual Expression**: Garden and visual novel rendering

### Visual System Integration
- **World Mode**: Garden, dispatch, conquest rendering
- **Intimate Mode**: Visual novel conversations
- **Context Switching**: Seamless transitions between modes
