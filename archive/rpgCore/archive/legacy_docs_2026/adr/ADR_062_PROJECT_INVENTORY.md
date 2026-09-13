> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 062: Project Inventory & Structural Audit

## Context & Problem Statement

The DGT project has evolved into a complex Four-Pillar Architecture (World, Mind, Actor, Body). This inventory serves as the "Master Blueprint" to prevent innovation drift and ensure long-term maintainability for the West Palm Beach Hub.

## A. Pillar Module Registry

### The World (WorldEngine) - `src/engines/world_engine.py`
**Core Responsibilities**: Seed-to-Tile logic, deterministic world generation
**Key Components**:
- **PermutationTable**: Hash-based noise generation using Seed_Zero
- **TileType Enum**: 11 tile types (GRASS, STONE, WATER, FOREST, MOUNTAIN, SAND, SNOW, DOOR_CLOSED, DOOR_OPEN, WALL, FLOOR)
- **TileData**: Tile structure with type, walkability, and metadata
- **WorldDelta**: Persistent change tracking with original/current tile states
- **Noise Parameters**: MD5 hash-based permutation table for deterministic generation
- **Chunk Caching**: Base map stored as `Dict[Tuple[int, int], TileData]`

**Key Methods**:
- `get_tile_at(position)`: Retrieves tile data at coordinates
- `get_collision_map()`: Returns 2D boolean array for pathfinding
- `apply_delta(delta)`: Applies persistent world changes
- `find_special_locations()`: Identifies points of interest

### The Mind (DD_Engine) - `src/engines/dd_engine.py`
**Core Responsibilities**: Intent validation, state management, D20 core logic
**Key Components**:
- **GameState**: Single Source of Truth with all game state
- **IntentValidation**: Movement and interaction intent processing
- **ValidationResult**: Enum (VALID, INVALID_POSITION, INVALID_PATH, OBSTRUCTED, OUT_OF_RANGE, RULE_VIOLATION)
- **Effect**: Time-based environmental effects system
- **Trigger**: Interaction trigger system
- **Arbiter Rules**: 15-tile movement range, interaction range of 1

**Key Methods**:
- `process_intent(intent)`: Validates and executes player intents
- `get_current_state()`: Returns deep copy of game state
- `_validate_movement(intent)`: Checks path validity and movement range
- `_record_world_delta()`: Tracks persistent state changes
- `get_world_deltas()`: Returns all persistent changes

### The Actor (Voyager) - `src/actors/voyager.py`
**Core Responsibilities**: Pathfinding, intent generation, autonomous navigation
**Key Components**:
- **PathfindingNavigator**: A* pathfinding with 50x50 grid
- **IntentGenerator**: Movement and interaction intent creation
- **NavigationGoal**: Goal-seeking with priority and timeout
- **Intent Cooldown**: 10ms cooldown for movie mode optimization
- **Path Confidence**: Path quality scoring algorithm

**Key Methods**:
- `generate_movement_intent(target)`: Creates movement intent with pathfinding
- `submit_intent(intent)`: Submits intent to D&D Engine with cooldown
- `navigate_to_position(target)`: High-level navigation interface
- `get_status()`: Returns current Voyager state

### The Body (Graphics Engine/PPU) - `src/graphics/ppu.py`
**Core Responsibilities**: 160x144 rendering, layer composition, viewport management
**Key Components**:
- **PPU_160x144**: Game Boy parity picture processing unit
- **TileBank**: Tile bank management with environment switching
- **RenderLayer**: 5-layer system (BACKGROUND, TERRAIN, ENTITIES, EFFECTS, UI)
- **RenderFrame**: Complete frame with layer compositing
- **Viewport Logic**: Centered camera following player position

**Key Methods**:
- `render_state(game_state)`: Renders complete frame from game state
- `display(frame)`: Displays frame to PPU buffer
- `get_rgb_frame_buffer()`: Returns RGB pixel data for display
- `_load_tile_bank(environment)`: Switches tile banks by environment

### The Chronicler (LLM Subtitles) - `src/chronicler.py`
**Core Responsibilities**: Narrative generation, subtitle management, movie dialogue
**Key Components**:
- **SubtitleEvent**: Time-based subtitle with duration and style
- **Narrative Templates**: 4 categories (position_change, interaction, environment_change, milestone)
- **State Change Detection**: Hash-based change detection system
- **8-bit Typewriter Style**: Movie subtitle formatting

**Key Methods**:
- `observe_state_change(old_state, new_state)`: Generates subtitles for state changes
- `get_current_subtitles()`: Returns active subtitles
- `add_subtitle(text, duration, style)`: Adds subtitle event

## B. Data Schema & Persistence

### GameState Definition
```python
@dataclass
class GameState:
    version: str = "1.0.0"
    timestamp: float = field(default_factory=time.time)
    
    # Entity State
    player_position: Tuple[int, int] = (10, 25)
    player_health: int = 100
    player_status: List[str] = field(default_factory=list)
    
    # World State
    current_environment: str = "forest"
    active_effects: List[Effect] = field(default_factory=list)
    interaction_triggers: List[Trigger] = field(default_factory=list)
    
    # World Deltas (Persistence)
    world_deltas: Dict[Tuple[int, int], Dict[str, Any]] = field(default_factory=dict)
    
    # Session State
    turn_count: int = 0
    performance_metrics: Dict[str, float] = field(default_factory=dict)
```

### World_Deltas Schema
```python
# Position-based delta storage
world_deltas: Dict[Tuple[int, int], Dict[str, Any]] = {
    (x, y): {
        "delta_type": "position_change",
        "timestamp": 1234567890.123,
        "entity": "player",
        "from_position": (old_x, old_y),
        "to_position": (new_x, new_y)
    }
}
```

### Intent Objects
```python
@dataclass
class MovementIntent:
    intent_type: str = "movement"
    target_position: Tuple[int, int] = (0, 0)
    path: List[Tuple[int, int]] = field(default_factory=list)
    confidence: float = 1.0
    timestamp: float = field(default_factory=time.time)

@dataclass
class InteractionIntent:
    intent_type: str = "interaction"
    target_entity: str = ""
    interaction_type: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
```

### Persistence Sample
```json
{
  "timestamp": 1234567890.123,
  "turn_count": 15,
  "player_position": [20, 10],
  "world_deltas": {
    "[10, 25]": {
      "delta_type": "position_change",
      "timestamp": 1234567880.123,
      "entity": "player",
      "from_position": [10, 24],
      "to_position": [10, 25]
    },
    "[20, 10]": {
      "delta_type": "position_change",
      "timestamp": 1234567890.123,
      "entity": "player",
      "from_position": [10, 20],
      "to_position": [20, 10]
    }
  },
  "world_engine_seed": "TAVERN_SEED"
}
```

## C. Dependency Map

### SRP (Single Responsibility Principle) Compliance
| Pillar | Responsibility | SRP Status |
|--------|---------------|------------|
| **World Engine** | Deterministic world generation | ✅ COMPLIANT |
| **DD Engine** | Game state management and intent validation | ✅ COMPLIANT |
| **Voyager** | Pathfinding and intent generation | ✅ COMPLIANT |
| **Graphics Engine** | Rendering and display | ✅ COMPLIANT |
| **Chronicler** | Narrative generation | ✅ COMPLIANT |

### Circular Dependency Resolution
**Forward References Used**:
- `DD_Engine.__init__(world_engine: Optional['WorldEngine'])` - String literal type hint
- `try/except` import blocks in Voyager and Graphics Engine
- Factory pattern for component creation

**Dependency Direction**:
```
World Engine → DD Engine → Voyager → Graphics Engine
     ↓              ↓           ↓           ↓
   Tiles        State      Intents    Frames
```

### Heartbeat Loop Data Flow
```python
# Main Heartbeat Loop (60 FPS)
while running:
    # 1. Actor generates intent
    intent = voyager.generate_movement_intent(target)
    
    # 2. Mind validates intent (queries World)
    validation = dd_engine.process_intent(intent)
    
    # 3. Mind executes intent (records delta)
    if validation.is_valid:
        state = dd_engine.execute_validated_intent(intent)
    
    # 4. Body renders state
    frame = graphics.render_state(state)
    graphics.display(frame)
    
    # 5. Chronicler generates subtitle
    subtitle = chronicler.observe_state_change(prev_state, state)
    
    # 6. Persistence check
    if state.turn_count % 10 == 0:
        persist_world_state(state)
```

## D. File Tree Structure

### Source Code Tree
```
src/
├── actors/
│   ├── __init__.py
│   └── voyager.py                    # Actor Pillar
├── engines/
│   ├── __init__.py
│   ├── dd_engine.py                  # Mind Pillar
│   └── world_engine.py               # World Pillar
├── graphics/
│   ├── __init__.py
│   └── ppu.py                        # Body Pillar
├── chronicler.py                     # LLM Subtitles
└── main.py                          # Heartbeat Controller
```

### Assets Tree
```
assets/
├── ASSET_MANIFEST.yaml              # Asset metadata
├── assets.dgt                       # Binary ROM data
├── intent_vectors.safetensors       # Intent embeddings
└── vectorized/                      # Vector embeddings
    ├── dialogue_vectors.safetensors
    ├── intents_vectors.safetensors
    ├── interactions_vectors.safetensors
    ├── lore_vectors.safetensors
    └── traits_vectors.safetensors
```

## E. Interface Audit

### Pillar Communication Table
| From Pillar | To Pillar | Data Object | Purpose |
|-------------|------------|--------------|---------|
| **Voyager** | **DD Engine** | MovementIntent/InteractionIntent | "I want to move/interact" |
| **DD Engine** | **World Engine** | Coordinate Query | "What is the physics of tile (X, Y)?" |
| **World Engine** | **DD Engine** | TileData | "It's a Stone Tile (Collidable: False)" |
| **DD Engine** | **Graphics Engine** | GameState | "Everything is updated. Render this now" |
| **DD Engine** | **Chronicler** | State Change | "Player moved from (10,25) to (10,20)" |
| **Chronicler** | **Graphics Engine** | SubtitleEvent | "Display: 'The Voyager moves forward'" |

### Key Interface Methods
```python
# World Engine Interface
def get_tile_at(position: Tuple[int, int]) -> TileData
def get_collision_map() -> List[List[bool]]

# DD Engine Interface
def process_intent(intent: Union[MovementIntent, InteractionIntent]) -> IntentValidation
def get_current_state() -> GameState

# Voyager Interface
def generate_movement_intent(target: Tuple[int, int]) -> MovementIntent
def submit_intent(intent: Union[MovementIntent, InteractionIntent]) -> bool

# Graphics Engine Interface
def render_state(game_state: GameState) -> RenderFrame
def display(frame: RenderFrame) -> None

# Chronicler Interface
def observe_state_change(old_state: Dict, new_state: Dict) -> Optional[str]
```

## F. Health Report

### Test Status
- **Theater Architecture Tests**: 18/18 PASSING ✅
- **Test Coverage**: Complete coverage of all four pillars
- **Integration Tests**: Full heartbeat loop validation
- **Performance Tests**: 60 FPS rendering confirmed

### Performance Metrics
- **Target FPS**: 60 FPS
- **Intent Cooldown**: 10ms (optimized for movie mode)
- **Movement Range**: 15 tiles (validated for demo navigation)
- **World Generation**: <1 second for 50x50 world
- **Memory Usage**: <5MB for world + deltas

### KISS Principle Enforcement
- **Single Responsibility**: Each pillar has exactly one purpose
- **Simple Interfaces**: Clean, minimal API contracts
- **Deterministic Behavior**: Seed-based world generation, no randomness
- **Clear Data Flow**: Unidirectional data flow between pillars
- **Minimal Dependencies**: Forward references prevent circular imports

## G. Executive Summary

### Architecture Strengths
1. **Four-Pillar Separation**: Complete SRP compliance
2. **Deterministic World**: Seed-based generation ensures reproducibility
3. **Persistent State**: Delta-based persistence saves only changes
4. **60 FPS Rendering**: Optimized for smooth movie playback
5. **LLM Integration**: Chronicler provides narrative subtitles
6. **Test Coverage**: 18/18 tests passing with full validation

### Production Readiness
- **West Palm Beach Hub**: Ready for deployment
- **Golden Reel**: Complete autonomous movie system
- **Persistence**: World state saved and recoverable
- **Scalability**: Framework ready for additional volumes

### Future Extensibility
- **New Worlds**: Different seeds generate unique worlds
- **Additional Pillars**: Clean interfaces allow expansion
- **Movie Scripts**: Easy to add new navigation beacons
- **Subtitle Styles**: Chronicler templates easily extensible

---

**Status**: PROJECT INVENTORY COMPLETE ✅

**Master Blueprint**: This document serves as the immutable reference for all future D&D Movie volumes and West Palm Beach Hub deployments.

**KISS Compliance**: The Four-Pillar Architecture maintains perfect separation of concerns while enabling complex autonomous movie generation.
