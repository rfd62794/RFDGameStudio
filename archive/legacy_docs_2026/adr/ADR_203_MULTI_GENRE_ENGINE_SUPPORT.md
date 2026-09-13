> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 203: Multi-Genre Engine Support Architecture

## Status
**Proposed** - Design for Phases E-G (Assets, Demos, consolidation)

## Context

RPG Core is transitioning from a specialized RPG engine to a **Generalized Multi-Genre Game Engine** supporting:

1. **Space Combat**: Arcade-style asteroids, dogfighting, fleet tactics
2. **RPG**: Glade of Trials, Forest Gate, quest-driven progression
3. **Tycoon**: TurboShells dashboard, economy simulation, market trading
4. Additional genres: Tower Defense, RTS, Platformer, etc.

Each genre has radically different requirements:

| Aspect | Space Combat | RPG | Tycoon |
|--------|------------|-----|--------|
| **Time Model** | Real-time, physics-driven | Turn-based, narrative-paced | Economic ticks, delayed results |
| **Camera** | Top-down 160×144 pixels | Isometric/bird's eye | Dashboard UI, multi-pane |
| **Entities** | Dozens (asteroids, projectiles) | Tens (NPCs, creatures) | Thousands (inventory, goods) |
| **Interaction** | Fire, dodge, thrust | Talk, quest, inventory | Buy, sell, manage, plan |
| **Rendering** | Pixel perfect, low-res | Tile-based with sprites | Data visualization, charts |

**Problem Statement**:
- Current engine has hard-coded assumptions (160×144, real-time)
- Duplicate loaders and configurations for each genre
- No unified interface for different game types
- New genres require significant refactoring

## Decision

Implement **Game Type Router** with **Pluggable Configuration System**:

```
Single Engine Core
├─ Configuration Selects Features
├─ Systems Compose Per Game Type
├─ Shared Infrastructure
└─ Genre-Specific Implementations
```

## Technical Architecture

### 1. Game Type Abstraction

Define protocol for all game types:

```python
from typing import Protocol

class IGameSlice(Protocol):
    """Interface all game demos must implement"""

    def initialize(self, config: GameConfig) -> Result[None]:
        """Initialize game with configuration"""
        ...

    def tick(self, delta_time: float) -> Result[None]:
        """Update game state each frame"""
        ...

    def render(self) -> Result[RenderPacket]:
        """Render current frame"""
        ...

    def handle_input(self, event: InputEvent) -> Result[None]:
        """Process user input"""
        ...

    def is_running(self) -> bool:
        """Check if game is still running"""
        ...

    def shutdown(self) -> Result[None]:
        """Clean up resources"""
        ...

    def get_status(self) -> Dict[str, Any]:
        """Get game status for debugging"""
        ...
```

### 2. Configuration-Driven Engine Selection

```python
@dataclass
class GameConfig:
    """Configuration for game instance"""

    # Identity
    game_type: str                          # "space_combat", "rpg", "tycoon"
    game_title: str
    game_version: str

    # Engine selection (controls which systems activate)
    enabled_engines: List[str] = field(default_factory=lambda: [
        "synthetic_reality",
        "chronos",
        "d20_core",
        "semantic",
        "narrative"
    ])

    enabled_systems: List[str] = field(default_factory=lambda: [
        "entity_manager",
        "collision",
        "projectile",
        "status",
        "fracture",
        "wave_spawner"
    ])

    # Time configuration
    time_mode: str = "real-time"            # "real-time", "turn-based", "economic"
    time_scale: float = 1.0

    # Rendering configuration
    render_width: int = 160
    render_height: int = 144
    render_mode: str = "pixel_perfect"      # "pixel_perfect", "isometric", "dashboard"

    # Simulation configuration
    max_entities: int = 1000
    physics_enabled: bool = True
    collision_enabled: bool = True

    # Game-specific settings
    difficulty: str = "normal"
    enable_genetics: bool = False           # FractureSystem feature
    wave_mode: str = "arcade"               # "arcade", "survival", "endless"

    # Asset configuration
    asset_pack: str = "default"
    locale: str = "en_US"


class GameEngineRouter:
    """Routes engine configuration based on game type"""

    CONFIG_TEMPLATES = {
        "space_combat": GameConfig(
            game_type="space_combat",
            game_title="Asteroids Arcade",
            time_mode="real-time",
            render_mode="pixel_perfect",
            physics_enabled=True,
            collision_enabled=True,
            max_entities=200,
            enable_genetics=False,
            wave_mode="arcade"
        ),

        "rpg": GameConfig(
            game_type="rpg",
            game_title="Glade of Trials",
            time_mode="turn-based",
            render_mode="isometric",
            physics_enabled=False,
            collision_enabled=True,
            max_entities=100,
            enable_genetics=False,
            wave_mode=None
        ),

        "tycoon": GameConfig(
            game_type="tycoon",
            game_title="TurboShells Dashboard",
            time_mode="economic",
            render_mode="dashboard",
            physics_enabled=False,
            collision_enabled=False,
            max_entities=5000,
            enable_genetics=False,
            wave_mode=None
        )
    }

    @staticmethod
    def get_config_for_game_type(game_type: str) -> GameConfig:
        """Get configuration for game type"""
        if game_type not in GameEngineRouter.CONFIG_TEMPLATES:
            raise ValueError(f"Unknown game type: {game_type}")

        return GameEngineRouter.CONFIG_TEMPLATES[game_type].copy()

    @staticmethod
    def create_engine_for_game_type(game_type: str) -> GameEngine:
        """Create fully configured engine for game type"""

        config = GameEngineRouter.get_config_for_game_type(game_type)
        engine = GameEngine(config)

        # Initialize engine with configuration
        engine.initialize()

        return engine
```

### 3. Unified Launcher

```python
class GameLauncher:
    """Main launcher supporting multiple game types"""

    def __init__(self):
        self.available_games = {
            "space_combat": {
                "title": "Asteroids Arcade",
                "description": "Classic arcade space combat",
                "demos": ["asteroids", "turbo_scout", "combatant_evolution"]
            },
            "rpg": {
                "title": "Glade of Trials",
                "description": "RPG adventure and exploration",
                "demos": ["glade_of_trials", "forest_gate"]
            },
            "tycoon": {
                "title": "TurboShells Dashboard",
                "description": "Economy simulation and management",
                "demos": ["turboshells"]
            }
        }

    def list_games(self) -> Dict[str, Dict[str, Any]]:
        """List available games"""
        return self.available_games

    def launch_game(self, game_type: str, demo_name: Optional[str] = None) -> Result[None]:
        """Launch game of specified type"""

        if game_type not in self.available_games:
            return Result(success=False, error=f"Unknown game type: {game_type}")

        try:
            # Create engine for game type
            engine = GameEngineRouter.create_engine_for_game_type(game_type)

            # Load demo if specified
            if demo_name:
                demo = self._load_demo(game_type, demo_name)
                engine.set_current_demo(demo)

            # Run game loop
            engine.run()

            return Result(success=True)

        except Exception as e:
            return Result(success=False, error=str(e))

    def _load_demo(self, game_type: str, demo_name: str) -> IGameSlice:
        """Load demo for game type"""

        if game_type == "space_combat":
            if demo_name == "asteroids":
                from src.demos.space_combat.asteroids import AsteroidsDemo
                return AsteroidsDemo()
            # ... other space combat demos

        elif game_type == "rpg":
            if demo_name == "glade_of_trials":
                from src.demos.rpg.glade_of_trials import GladeOfTrialsDemo
                return GladeOfTrialsDemo()
            # ... other RPG demos

        elif game_type == "tycoon":
            if demo_name == "turboshells":
                from src.demos.tycoon.turboshells import TurboShellsDemo
                return TurboShellsDemo()

        raise ValueError(f"Unknown demo: {demo_name}")
```

### 4. Engine Configuration Per Game Type

```python
# Each system activates based on configuration
class EntityManager(BaseSystem):
    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config)

        # Check if enabled in game config
        if config and not config.get('enabled', True):
            self.status = SystemStatus.DISABLED
            return

        # Initialize based on max_entities from game config
        self.max_entities = config.get('max_entities', 1000) if config else 1000

class CollisionSystem(BaseSystem):
    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config)

        # Disable for tycoon games
        if config and not config.get('collision_enabled', True):
            self.status = SystemStatus.DISABLED
            return

        self.spatial_grid = SpatialGrid()

class PhysicsSystem(BaseSystem):
    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config)

        # Disable for turn-based RPG
        if config and not config.get('physics_enabled', True):
            self.status = SystemStatus.DISABLED
            return

        self.gravity = config.get('gravity', 0.0) if config else 0.0
```

### 5. Time Model Abstraction

```python
class TimeMode:
    """Abstract time model (real-time, turn-based, economic)"""

    def __init__(self, mode: str, time_scale: float = 1.0):
        self.mode = mode
        self.time_scale = time_scale
        self.game_time = 0.0

    def update(self, delta_time: float) -> None:
        """Update game time based on mode"""

        if self.mode == "real-time":
            # Direct time advancement
            self.game_time += delta_time * self.time_scale

        elif self.mode == "turn-based":
            # Wait for turn actions, then advance by fixed amount
            if self._should_advance_turn():
                self.game_time += 1.0  # 1 turn

        elif self.mode == "economic":
            # Advance in fixed ticks (e.g., 1 hour per frame)
            self.game_time += 1.0 * self.time_scale

    def _should_advance_turn(self) -> bool:
        """Check if turn should advance (overridden in subclasses)"""
        return False  # RPG logic handles this
```

### 6. Rendering Pipeline per Game Type

```python
class RenderingPipeline:
    """Composable rendering system"""

    def __init__(self, config: GameConfig):
        self.render_mode = config.render_mode

        if config.render_mode == "pixel_perfect":
            self.renderer = PixelRenderer()
        elif config.render_mode == "isometric":
            self.renderer = IsometricRenderer()
        elif config.render_mode == "dashboard":
            self.renderer = DashboardRenderer()

    def render(self, game_state: GameState) -> RenderPacket:
        """Render game state appropriate for game type"""
        return self.renderer.render(game_state)
```

## Implementation Details

### Directory Structure

```
src/
├── game_engine/
│   ├── game_engine_router.py        # GameEngineRouter, GameLauncher
│   ├── game_config.py               # GameConfig dataclass
│   ├── game_engine.py               # Main GameEngine orchestrator
│   ├── systems/
│   │   ├── body/                    # All body systems (shared)
│   │   ├── graphics/                # All graphics systems (shared)
│   │   ├── game/                    # Game logic systems (shared)
│   │   └── ...
│   └── ...
│
└── demos/
    ├── launcher.py                  # Main entry point
    ├── space_combat/
    │   ├── asteroids.py
    │   ├── turbo_scout.py
    │   └── scenarios/
    ├── rpg/
    │   ├── glade_of_trials.py
    │   ├── forest_gate.py
    │   └── scenarios/
    └── tycoon/
        ├── turboshells.py
        └── config/
```

### Configuration Files

```
assets/configs/
├── engine/
│   ├── space_combat.yaml
│   ├── rpg.yaml
│   └── tycoon.yaml
├── ai/
│   ├── space_combat_ai.yaml
│   └── npc_ai.yaml
└── game/
    ├── combat_rules.yaml
    └── economy_rules.yaml
```

## Test Coverage

```python
def test_game_type_router():
    """Test configuration routing per game type"""

    # Space Combat
    space_config = GameEngineRouter.get_config_for_game_type("space_combat")
    assert space_config.time_mode == "real-time"
    assert space_config.physics_enabled == True

    # RPG
    rpg_config = GameEngineRouter.get_config_for_game_type("rpg")
    assert rpg_config.time_mode == "turn-based"
    assert rpg_config.physics_enabled == False

    # Tycoon
    tycoon_config = GameEngineRouter.get_config_for_game_type("tycoon")
    assert tycoon_config.time_mode == "economic"
    assert tycoon_config.collision_enabled == False

def test_launcher_multi_genre():
    """Test launcher supports all game types"""

    launcher = GameLauncher()
    games = launcher.list_games()

    assert "space_combat" in games
    assert "rpg" in games
    assert "tycoon" in games

    # Each game should have demos
    for game_type in games:
        assert len(games[game_type]["demos"]) > 0
```

## Consequences

### Positive
- ✅ Single engine supports multiple genres
- ✅ Code reuse across game types
- ✅ Easy to add new genres (define config)
- ✅ Clear system composition patterns
- ✅ Testable configuration model
- ✅ Extensible without core changes

### Negative
- ⚠️ Additional abstraction layers
- ⚠️ Configuration complexity (mitigated by templates)
- ⚠️ Must design for common patterns

### Mitigations
- Provide clear configuration templates
- Document common patterns for each genre
- Test each configuration independently
- Share successful patterns across team

---

## Future Extensibility

### Easy to Add:
- New genres (define GameConfig template, create demo)
- New rendering modes (implement renderer interface)
- New time models (extend TimeMode class)
- New systems (implement BaseSystem, add to config)

### Harder to Add:
- Fundamentally different data models (would need protocol redesign)
- Cross-genre communication (single engine, so needs careful design)

---

## Related Decisions

- **ADR-200**: BaseSystem pattern (system architecture)
- **ADR-204**: Demo consolidation (depends on this router)

---

**Phase**: Phases E-G (configuration, demos consolidation)
**Decision Date**: Feb 2026
**Status**: Proposed - Design ready for implementation
**Next Review**: Upon Phase E completion
