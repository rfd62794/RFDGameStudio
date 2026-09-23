# Comprehensive Repository Inventory for Phase 3 Planning

## 1. Existing Tower Defense Implementation

### Status: **NO EXISTING TD IMPLEMENTATION**
- **No Tower Defense code found** in the codebase
- **No TD-specific directories** or files
- **TD mentioned only in comments** as future demo target

### TD-Related Infrastructure (Ready for Use)
- `TowerDefenseBehaviorSystem` - stub implementation in `src/shared/ecs/systems/behavior_system.py`
- `behavior_type: "tower_defense"` - supported in `BehaviorComponent`
- `tower_defense_behavior` - placeholder in `SystemRunner`

### File References:
```python
# src/shared/ecs/systems/behavior_system.py:150-161
class TowerDefenseBehaviorSystem(BehaviorSystem):
    """Tower Defense-specific behavior system (example of ADR-007)"""
    def update(self, creature, behavior: BehaviorComponent, dt: float, 
                cursor_pos: Optional[tuple] = None) -> Vector2:
        """Tower Defense-specific behavior - wave following"""
        # TODO: Add tower defense specific logic (wave pathing, targeting, etc.)
        if behavior.behavior_type != "tower_defense":
            behavior.behavior_type = "tower_defense"
        return super().update(creature, behavior, dt, cursor_pos)
```

## 2. Grid System Landscape

### Existing Grid Implementations

#### 2.1 Territorial Grid (Slime Clan Demo)
**File**: `src/apps/slime_clan/territorial_grid.py`
- **10x10 tile-based grid** (480px fills full window height)
- **Tile ownership system**: Neutral, Blue Clan, Red Clan, Blocked
- **Coordinate system**: Grid-based with tile positions
- **Rendering**: Direct pygame rendering with tile sprites

```python
# Grid constants from territorial_grid.py
GRID_COLS: int = 10
GRID_ROWS: int = 10
TILE_SIZE: int = 48
GRID_OFFSET_X: int = 80
GRID_OFFSET_Y: int = 0
```

#### 2.2 Pathfinding Grid (DGT Engine)
**File**: `src/dgt_engine/logic/pathfinding.py`
- **A* pathfinding algorithm** for grid navigation
- **Tile types**: WALKABLE, WALL, WATER, DOOR, NPC
- **Grid-based coordinate system** with integer positions
- **Collision data integration** with assets.dgt

```python
# TileType enum from pathfinding.py
class TileType(Enum):
    WALKABLE = 0
    WALL = 1
    WATER = 2
    DOOR = 3
    NPC = 4
```

#### 2.3 UI Grid Layouts (Various Demos)
- **Roster View**: Card grid layout in `src/apps/tycoon/ui/views/roster_view.py`
- **Market View**: Shop item grid in `src/apps/tycoon/ui/views/market_view.py`
- **Rendering Grids**: DGT engine pixel/character grids

### Grid System Options for TD
1. **Reuse Territorial Grid**: 10x10 tile system, ownership mechanics
2. **Extend Pathfinding Grid**: A* algorithm, collision support
3. **Create New TD Grid**: Custom grid for tower placement, wave paths

### Coordinate Systems
- **Current**: Continuous Vector2 (Creature.kinematics.position)
- **Grid Options**: Integer tile coordinates, hybrid continuous/grid
- **Conversion Needed**: Vector2 ↔ Grid position mapping

## 3. Demo Architecture Patterns

### 3.1 Scene Manager Pattern
**File**: `src/shared/engine/scene_manager.py`
```python
class Scene(BaseSystem, ABC):
    def __init__(self, manager: SceneManager, spec: UISpec, **kwargs)
    def request_scene(self, scene_name: str, **kwargs)
    def handle_events(self, events) -> None
    def update(self, dt: float) -> None
    def render(self, surface) -> None
```

### 3.2 Demo Entry Points
#### Slime Breeder (Multi-Scene App)
**File**: `src/apps/slime_breeder/run_slime_breeder.py`
```python
def create_app() -> SceneManager:
    manager = SceneManager(width=SPEC_720.screen_width, height=SPEC_720.screen_height)
    manager.register("garden", GardenScene)
    manager.register("teams", TeamScene)
    manager.register("racing", RaceScene)
    manager.register("dungeon", TheRoomScene)
    # ... more scenes
    return manager
```

#### Dungeon Crawler (REPL + Session)
**File**: `src/apps/dungeon_crawler/run_dungeon_crawler.py`
```python
class DungeonCrawlerREPL(cmd.Cmd):
    def __init__(self):
        self.state = "HUB"  # HUB, CRAWLING, COMBAT, LOOTING
        self.hub = TheRoom()
        self.hero = Hero("Wanderer", "fighter")
        self.floor: Floor | None = None
```

#### Space Demos (Direct Pygame)
**File**: `src/apps/space/simple_visual_asteroids.py`
```python
class SimpleVisualAsteroids:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        self.game_surface = pygame.Surface((SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT))
```

### 3.3 Common Demo Patterns
- **Scene Registration**: SceneManager.register(scene_name, SceneClass)
- **State Management**: Session objects for persistence
- **UI Integration**: UISpec-based rendering
- **Event Handling**: Pygame events → Scene.handle_events()
- **Resource Loading**: Asset managers and factories

### 3.4 Integration with Garden/Roster
```python
# From GardenScene
self.roster = load_roster()
self._sync_roster_with_garden()

# From DungeonSession
self.roster = load_roster()
self.party_slimes = self.team  # Alias for compatibility
```

## 4. Entity Architecture

### 4.1 Current Creature Entity (Post-Phase 2)
**File**: `src/shared/entities/creature.py`
```python
@dataclass
class Creature:
    """Unified creature entity across all demos (Garden, Racing, Dungeon, Tower Defense)"""
    
    # Primary Identity (Immutable)
    slime_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Unnamed"
    
    # Core Components
    genome: SlimeGenome = field(default_factory=lambda: SlimeGenome(...))
    
    # Physics State
    kinematics: Kinematics = field(default_factory=lambda: Kinematics(
        position=Vector2(400, 300), velocity=Vector2(0, 0)
    ))
    
    # Progression
    level: int = 1
    experience: int = 0
    # ... more fields
```

### 4.2 ECS Components (Phase 2)
**KinematicsComponent**: `src/shared/ecs/components/kinematics_component.py`
- **Purpose**: Physics state wrapper (ADR-005)
- **Access**: Back-reference to creature.kinematics
- **Methods**: get_position(), get_velocity(), set_velocity()

**BehaviorComponent**: `src/shared/ecs/components/behavior_component.py`
- **Purpose**: Behavior state storage
- **Fields**: target, wander_timer, behavior_type
- **Extensibility**: behavior_type supports "tower_defense"

### 4.3 ECS Systems (Phase 2)
**KinematicsSystem**: `src/shared/ecs/systems/kinematics_system.py`
- **Purpose**: Physics updates (friction, forces, bounds)
- **Input**: Creature + KinematicsComponent
- **Output**: Updated position/velocity

**BehaviorSystem**: `src/shared/ecs/systems/behavior_system.py`
- **Purpose**: Behavior calculations (cursor, wander, forces)
- **Input**: Creature + BehaviorComponent
- **Output**: Force vectors

### 4.4 Entity Extensibility Assessment
**✅ Creature supports TD entities**:
- **Flexible genome system** for different entity types
- **ECS integration** for custom components
- **Behavior system** for TD-specific logic
- **Physics system** for movement/collision

**🔧 Extension Points**:
```python
# TD-specific components
class TowerComponent:
    tower_type: str  # "arrow", "magic", "cannon"
    damage: float
    range: float
    fire_rate: float

class EnemyComponent:
    enemy_type: str  # "slime", "goblin", "dragon"
    hp: float
    speed: float
    reward: int

# TD-specific systems
class TowerSystem:
    def update(self, creatures, towers, enemies, dt):
        # Tower targeting and firing logic

class WaveSystem:
    def update(self, enemies, wave_config, dt):
        # Enemy spawning and pathing logic
```

## 5. Rendering & UI Layer

### 5.1 Rendering Architecture
**SceneManager**: Scene-based rendering pipeline
- **Surface Management**: Game surface + display surface
- **Spec Integration**: UISpec for consistent layout
- **Multi-pass**: Background → Entities → UI

### 5.2 Rendering Patterns
#### Continuous Movement (Current)
```python
# From GardenScene
for creature in self.garden_state.creatures:
    self.renderer.render_slime(surface, creature)
```

#### Grid-Based Rendering (Territorial Grid)
```python
# From territorial_grid.py
for x in range(GRID_COLS):
    for y in range(GRID_ROWS):
        tile_x = GRID_OFFSET_X + x * TILE_SIZE
        tile_y = GRID_OFFSET_Y + y * TILE_SIZE
        # Render tile based on ownership
```

### 5.3 UI Component Patterns
**Panel System**: `src/shared/ui/panel.py`
**Button System**: `src/shared/ui/button.py`
**Label System**: `src/shared/ui/label.py`
**Card System**: `src/shared/ui/profile_card.py`

### 5.4 Rendering Options for TD
1. **Hybrid Rendering**: Grid-based towers + continuous enemies
2. **Pure Grid**: All entities on tile grid
3. **Layered Rendering**: Background grid → entities → UI overlay

## 6. Persistence Patterns

### 6.1 Session Pattern (Dungeon & Racing)
**DungeonSession**: `src/apps/dungeon_crawler/ui/dungeon_session.py`
```python
@dataclass
class DungeonSession:
    team: List = field(default_factory=list)
    floor: int = 1
    seed: int = None
    track: object = None  # DungeonTrack
    combat_results: List = field(default_factory=list)
```

**RacingSession**: `src/shared/racing/racing_session.py`
```python
@dataclass
class RacingSession:
    team: List = field(default_factory=list)
    seed: int = None
    track_length: float = 3000
    race_completed: bool = False
    best_time: Optional[float] = None
```

### 6.2 Persistence Methods
```python
# Save to JSON
def save_to_file(self, filepath: Optional[Path] = None) -> None:
    session_data = {
        "seed": self.seed,
        "team_slime_ids": [s.slime_id for s in self.team],
        # ... more fields
    }
    filepath.write_text(json.dumps(session_data, indent=2))

# Load from JSON
@classmethod
def load_from_file(cls, filepath: Optional[Path] = None) -> "SessionClass":
    # Load JSON, reconstruct objects
```

### 6.3 TD Persistence Requirements
**TowerDefenseSession** (to be created):
```python
@dataclass
class TowerDefenseSession:
    wave: int = 1
    seed: int = None
    towers: List = field(default_factory=list)
    enemies: List = field(default_factory=list)
    gold: int = 100
    lives: int = 20
    score: int = 0
    tower_layout: Dict = field(default_factory=dict)  # Grid positions
```

## 7. Testing Architecture

### 7.1 Current Test Structure
**Unit Tests**: `tests/unit/`
- **ECS Tests**: 38 tests (Kinematics: 6, Behavior: 10, Registry: 14, Garden: 8)
- **Legacy Tests**: 545 tests (Phase 1 compatibility)
- **Demo Tests**: Various demo-specific tests

### 7.2 ECS Test Patterns
```python
# From test_garden_ecs.py
@pytest.fixture
def garden_ecs(garden_state):
    return GardenECS(garden_state)

def test_garden_ecs_update_ecs_enabled(garden_ecs, sample_creature):
    garden_ecs.add_creature(sample_creature)
    dt = 0.016
    garden_ecs.update(dt, cursor_pos)
    # Assert position changed, forces set
```

### 7.3 Test Utilities & Fixtures
**Creature Fixtures**: Standard creature creation
**Component Fixtures**: ECS component setup
**Session Fixtures**: Demo session initialization

### 7.4 TD Test Requirements
**Game Loop Tests**: Update cycles, wave progression
**Entity Tests**: Tower placement, enemy spawning
**ECS Tests**: TD-specific components and systems
**Integration Tests**: Full game session scenarios

## 8. Architectural Constraints & Opportunities

### 8.1 Constraints
- **Fixed Resolution**: 160x144 (Miyoo Mini constraint)
- **ECS Integration**: Must work with existing Kinematics/Behavior systems
- **Scene Manager**: Must integrate with SceneManager pattern
- **Persistence**: Must follow Session pattern for consistency
- **Backward Compatibility**: Cannot break existing demos

### 8.2 Opportunities
- **Grid System**: Territorial grid provides foundation
- **Pathfinding**: A* algorithm ready for enemy pathing
- **ECS Foundation**: Components and systems proven in production
- **Session Pattern**: Proven persistence mechanism
- **UI Components**: Rich component library available

### 8.3 Integration Points
- **GardenECS**: Seamless ECS integration pattern
- **SystemRunner**: Proven ECS orchestration
- **ComponentRegistry**: Component management system
- **SceneManager**: Scene-based architecture
- **UISpec**: Consistent UI layout system

## 9. Recommended TD Architecture

### 9.1 Entity Structure
```python
# Extend existing Creature with TD components
class Enemy(Creature):
    enemy_component: EnemyComponent
    wave_component: WaveComponent

class Tower(Creature):
    tower_component: TowerComponent
    placement_component: GridPlacementComponent
```

### 9.2 System Architecture
```python
# New TD-specific systems
class TowerDefenseSystemRunner(SystemRunner):
    def __init__(self):
        super().__init__()
        self.tower_system = TowerSystem()
        self.wave_system = WaveSystem()
        self.collision_system = CollisionSystem()
    
    def update(self, dt):
        # Behavior → Tower → Wave → Collision → Kinematics
        self.behavior_system.update(creatures, dt)
        self.tower_system.update(towers, enemies, dt)
        self.wave_system.update(enemies, dt)
        self.collision_system.update(projectiles, enemies, dt)
        self.kinematics_system.update(creatures, dt)
```

### 9.3 Grid Integration
```python
# Hybrid coordinate system
class GridPosition:
    grid_x: int
    grid_y: int
    world_x: float  # Vector2 equivalent
    world_y: float

def grid_to_world(grid_x, grid_y, tile_size=48):
    return Vector2(grid_x * tile_size, grid_y * tile_size)

def world_to_grid(world_x, world_y, tile_size=48):
    return int(world_x // tile_size), int(world_y // tile_size)
```

## 10. Next Steps for Phase 3

1. **Create TowerDefenseSession** following existing pattern
2. **Design TD Grid System** (reuse territorial grid or create new)
3. **Implement TD Components** (TowerComponent, EnemyComponent, WaveComponent)
4. **Create TD Systems** (TowerSystem, WaveSystem, CollisionSystem)
5. **Build TD Scene** (TowerDefenseScene with SceneManager)
6. **Add TD Entry Point** (run_tower_defense.py)
7. **Write TD Tests** (unit tests, integration tests, session tests)
8. **Integrate with ECS** (use GardenECS pattern)

This inventory provides the complete foundation for Phase 3 Tower Defense integration planning.
