> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 056: Pillar Interface Specification

## Overview

This ADR defines the clean interfaces between the three pillars of the D&D Engine architecture: The Mind (D&D Engine), The Actor (Voyager), and The Body (Graphics Engine).

## Architecture Overview

```
┌─────────────────┐    Intent     ┌─────────────────┐    State     ┌─────────────────┐
│   The Actor     │ ─────────────→ │   The Mind      │ ───────────→ │    The Body     │
│   (Voyager)     │               │  (D&D Engine)    │              │ (Graphics Engine)│
│                 │ ←───────────── │                 │ ←──────────── │                 │
│                 │   Validation   │                 │   Render     │                 │
└─────────────────┘               └─────────────────┘              └─────────────────┘
```

## 1. Core Data Structures

### GameState Schema
```python
@dataclass
class GameState:
    """Single Source of Truth for all game state"""
    version: str = "1.0.0"
    timestamp: float = 0.0
    
    # Entity State
    player_position: Tuple[int, int] = (0, 0)
    player_health: int = 100
    player_status: List[str] = field(default_factory=list)
    
    # World State
    current_environment: str = "forest"
    active_effects: List[Effect] = field(default_factory=list)
    interaction_triggers: List[Trigger] = field(default_factory=list)
    
    # Session State
    turn_count: int = 0
    performance_metrics: Dict[str, float] = field(default_factory=dict)
```

### Intent Schema
```python
@dataclass
class MovementIntent:
    """Voyager's movement request to D&D Engine"""
    intent_type: str = "movement"
    target_position: Tuple[int, int] = (0, 0)
    path: List[Tuple[int, int]] = field(default_factory=list)
    confidence: float = 1.0
    timestamp: float = 0.0

@dataclass
class InteractionIntent:
    """Voyager's interaction request to D&D Engine"""
    intent_type: str = "interaction"
    target_entity: str = ""
    interaction_type: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = 0.0
```

### Render Command Schema
```python
@dataclass
class RenderCommand:
    """Graphics Engine rendering instruction"""
    command_type: str = "render_frame"
    game_state: GameState = field(default_factory=GameState)
    viewport_center: Tuple[int, int] = (0, 0)
    effects: List[RenderEffect] = field(default_factory=list)
    timestamp: float = 0.0
```

## 2. Service Interfaces

### The Mind (D&D Engine) Interface

```python
class DD_Engine:
    """Deterministic D20 logic and state management"""
    
    def __init__(self, assets_path: str):
        self.state = GameState()
        self.assets = BinaryROM(assets_path)
        self.arbiter = Arbiter()
    
    def process_intent(self, intent: Union[MovementIntent, InteractionIntent]) -> ValidationResult:
        """Process Voyager's intent and return validation result"""
        if intent.intent_type == "movement":
            return self._validate_movement(intent)
        elif intent.intent_type == "interaction":
            return self._validate_interaction(intent)
        
    def execute_validated_intent(self, intent: Union[MovementIntent, InteractionIntent]) -> GameState:
        """Execute validated intent and return new state"""
        if intent.intent_type == "movement":
            self._execute_movement(intent)
        elif intent.intent_type == "interaction":
            self._execute_interaction(intent)
        
        self.state.timestamp = time.time()
        self.state.turn_count += 1
        return self.state
    
    def get_current_state(self) -> GameState:
        """Return current game state (Single Source of Truth)"""
        return self.state
    
    def _validate_movement(self, intent: MovementIntent) -> ValidationResult:
        """Validate movement intent against D&D rules"""
        # Check collision data from binary ROM
        # Validate pathfinding
        # Check for interaction triggers
        # Return validation result
        pass
    
    def _execute_movement(self, intent: MovementIntent) -> None:
        """Execute validated movement"""
        # Update player position
        # Trigger any interactions
        # Update world state
        pass
```

### The Actor (Voyager) Interface

```python
class Voyager:
    """Pathfinding and intent generation"""
    
    def __init__(self, dd_engine: DD_Engine):
        self.dd_engine = dd_engine
        self.pathfinding = AStarPathfinding()
        self.current_goal: Optional[Tuple[int, int]] = None
    
    def generate_movement_intent(self, target: Tuple[int, int]) -> MovementIntent:
        """Generate movement intent for target position"""
        current_state = self.dd_engine.get_current_state()
        current_pos = current_state.player_position
        
        # Calculate path using A*
        path = self.pathfinding.find_path(current_pos, target)
        
        if not path:
            raise ValueError(f"No path found to {target}")
        
        return MovementIntent(
            target_position=target,
            path=path,
            confidence=self._calculate_path_confidence(path),
            timestamp=time.time()
        )
    
    def generate_interaction_intent(self, entity: str, interaction_type: str) -> InteractionIntent:
        """Generate interaction intent for entity"""
        return InteractionIntent(
            target_entity=entity,
            interaction_type=interaction_type,
            timestamp=time.time()
        )
    
    def submit_intent(self, intent: Union[MovementIntent, InteractionIntent]) -> bool:
        """Submit intent to D&D Engine and handle response"""
        # Validate intent
        validation = self.dd_engine.process_intent(intent)
        
        if not validation.is_valid:
            return False
        
        # Execute intent
        new_state = self.dd_engine.execute_validated_intent(intent)
        
        # Update internal state if needed
        return True
    
    def _calculate_path_confidence(self, path: List[Tuple[int, int]]) -> float:
        """Calculate confidence score for path"""
        # Based on path length, obstacles, etc.
        return 1.0
```

### The Body (Graphics Engine) Interface

```python
class GraphicsEngine:
    """160x144 PPU rendering and tile management"""
    
    def __init__(self, assets_path: str):
        self.assets = BinaryROM(assets_path)
        self.tile_bank = TileBank()
        self.ppu = PPU_160x144()
        self.viewport_center: Tuple[int, int] = (0, 0)
    
    def render_state(self, game_state: GameState) -> RenderFrame:
        """Render current game state to frame buffer"""
        # Update viewport center to player position
        self.viewport_center = game_state.player_position
        
        # Load appropriate tile bank
        self._load_tile_bank(game_state.current_environment)
        
        # Render base layer
        base_layer = self._render_base_layer(game_state)
        
        # Render entities
        entity_layer = self._render_entities(game_state)
        
        # Render effects
        effects_layer = self._render_effects(game_state.active_effects)
        
        # Composite final frame
        final_frame = self._composite_layers(base_layer, entity_layer, effects_layer)
        
        return final_frame
    
    def display_frame(self, frame: RenderFrame) -> None:
        """Display frame to screen (Tkinter/Canvas)"""
        self.ppu.display(frame)
    
    def _load_tile_bank(self, environment: str) -> None:
        """Load appropriate tile bank for environment"""
        tile_bank_data = self.assets.get_tile_bank(environment)
        self.tile_bank.load(tile_bank_data)
    
    def _render_base_layer(self, game_state: GameState) -> Layer:
        """Render background and terrain"""
        pass
    
    def _render_entities(self, game_state: GameState) -> Layer:
        """Render player and other entities"""
        pass
    
    def _render_effects(self, effects: List[Effect]) -> Layer:
        """Render visual effects"""
        pass
```

## 3. Communication Protocols

### State-Sync Protocol
```python
class StateSyncProtocol:
    """Ensures single source of truth pattern"""
    
    def __init__(self):
        self.state_lock = threading.Lock()
    
    def get_state(self) -> GameState:
        """Thread-safe state access"""
        with self.state_lock:
            return copy.deepcopy(self.current_state)
    
    def update_state(self, new_state: GameState) -> None:
        """Thread-safe state update"""
        with self.state_lock:
            self.current_state = new_state
```

### Asset-Link Protocol
```python
class BinaryROM:
    """Shared data layer for all services"""
    
    def __init__(self, assets_path: str):
        self.assets_path = assets_path
        self.collision_data = self._load_collision_data()
        self.tile_banks = self._load_tile_banks()
        self.interaction_triggers = self._load_triggers()
    
    def get_collision_map(self, environment: str) -> CollisionMap:
        """Get collision data for environment"""
        return self.collision_data.get(environment, CollisionMap())
    
    def get_tile_bank(self, environment: str) -> TileBankData:
        """Get tile bank data for environment"""
        return self.tile_banks.get(environment, TileBankData())
    
    def get_interaction_triggers(self, position: Tuple[int, int]) -> List[Trigger]:
        """Get interaction triggers at position"""
        return self.interaction_triggers.get(position, [])
```

## 4. Main Heartbeat Loop

```python
class MainHeartbeat:
    """Central coordination between three pillars"""
    
    def __init__(self):
        self.dd_engine = DD_Engine("assets/game.dgt")
        self.voyager = Voyager(self.dd_engine)
        self.graphics = GraphicsEngine("assets/game.dgt")
        self.running = True
    
    def run(self) -> None:
        """Main game loop"""
        while self.running:
            # 1. Generate intent (could be AI, user input, or scripted)
            intent = self._generate_intent()
            
            # 2. Submit intent to D&D Engine
            success = self.voyager.submit_intent(intent)
            
            # 3. Get current state
            current_state = self.dd_engine.get_current_state()
            
            # 4. Render frame
            frame = self.graphics.render_state(current_state)
            self.graphics.display_frame(frame)
            
            # 5. Heartbeat delay
            time.sleep(0.016)  # ~60 FPS
    
    def _generate_intent(self) -> Union[MovementIntent, InteractionIntent]:
        """Generate next intent (could be from various sources)"""
        # This could be:
        # - AI decision making
        # - User input
        # - Scripted sequence
        # - Network message
        pass
```

## 5. Implementation Plan

### Phase 1: Core Structure
- [ ] Create `src/engines/dd_engine.py`
- [ ] Create `src/actors/voyager.py`
- [ ] Create `src/graphics/ppu.py`
- [ ] Define core data structures

### Phase 2: Interface Implementation
- [ ] Implement D&D Engine interface
- [ ] Implement Voyager interface
- [ ] Implement Graphics Engine interface
- [ ] Create BinaryROM asset loader

### Phase 3: Integration
- [ ] Create main heartbeat loop
- [ ] Implement state-sync protocol
- [ ] Test pillar communication
- [ ] Validate single source of truth

### Phase 4: Cleanup
- [ ] Remove theater metaphors
- [ ] Remove redundant wrappers
- [ ] Formalize GameState schema
- [ ] Document clean interfaces

## 6. Validation Criteria

### Success Metrics
- **Interface Clarity**: Clean, documented APIs between pillars
- **Single Source of Truth**: D&D Engine is only state mutator
- **No Direct Mutates**: Graphics Engine only observes state
- **Asset Sharing**: Binary ROM shared between all services
- **Testability**: Each pillar can be tested independently

### Performance Targets
- **Frame Rate**: 60 FPS (16ms per frame)
- **Memory Usage**: <2MB total
- **Boot Time**: <10 seconds
- **Reliability**: 100% deterministic execution

---

**ADR 056**: Formal service decoupling with clean pillar interfaces for KISS architecture.
