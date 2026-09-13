"""
System Configuration - Stateless Pillar Initialization
DGT Kernel Implementation - The Universal Truths

SOLID configuration object that replaces hardcoded initialization.
All pillars can be initialized with just a Config object and a Seed.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from pathlib import Path
import yaml


@dataclass
class WorldConfig:
    """World Engine configuration"""
    seed: str
    size_x: int = 50
    size_y: int = 50
    chunk_size: int = 10
    interest_point_density: float = 0.1
    noise_scale: float = 0.1
    noise_octaves: int = 4
    noise_persistence: float = 0.5
    noise_lacunarity: float = 2.0


@dataclass
class MindConfig:
    """Mind Engine (D&D) configuration"""
    seed: str
    enable_d20_rolls: bool = True
    critical_success_threshold: int = 20
    critical_failure_threshold: int = 1
    default_difficulty_class: int = 10


@dataclass
class BodyConfig:
    """Body Engine (Graphics) configuration"""
    viewport_width: int = 160
    viewport_height: int = 144
    tile_size: int = 8
    target_fps: int = 60
    enable_rendering: bool = True
    assets_path: str = "assets/"


@dataclass
class ChronosConfig:
    """Chronos Engine configuration"""
    seed: str
    max_active_quests: int = 5
    quest_timeout_seconds: float = 300.0
    enable_procedural_quests: bool = True
    quest_generation_interval: float = 60.0


@dataclass
class PersonaConfig:
    """Persona Engine configuration"""
    seed: str
    max_personas_per_location: int = 10
    persona_memory_depth: int = 50
    enable_faction_dynamics: bool = True


@dataclass
class AIConfig:
    """AI Controller configuration"""
    seed: str
    movement_range: int = 1
    pathfinding_timeout: float = 30.0
    pondering_timeout: float = 5.0
    enable_autonomous_mode: bool = True

# Alias for backward compatibility
VoyagerConfig = AIConfig

@dataclass
class SystemConfig:
    """Complete system configuration for stateless pillar initialization"""
    seed: str
    
    # Pillar configurations
    world: WorldConfig = field(default_factory=lambda: WorldConfig(seed="SEED_ZERO"))
    mind: MindConfig = field(default_factory=lambda: MindConfig(seed="SEED_ZERO"))
    body: BodyConfig = field(default_factory=BodyConfig)
    chronos: ChronosConfig = field(default_factory=lambda: ChronosConfig(seed="SEED_ZERO"))
    persona: PersonaConfig = field(default_factory=lambda: PersonaConfig(seed="SEED_ZERO"))
    ai: AIConfig = field(default_factory=lambda: AIConfig(seed="SEED_ZERO"))
    
    # System settings
    target_fps: int = 60
    enable_graphics: bool = True
    enable_persistence: bool = True
    enable_logging: bool = True
    enable_console: bool = True
    log_level: str = "INFO"
    
    # Scene defaults (loaded from external YAML)
    default_spawn_points: Dict[str, Tuple[int, int]] = field(default_factory=dict)
    default_interest_points: Dict[str, List[Tuple[int, int, str]]] = field(default_factory=dict)
    
    def __post_init__(self):
        """Ensure all sub-configs use the same seed"""
        # Propagate main seed to all sub-configs
        self.world.seed = self.seed
        self.mind.seed = self.seed
        self.chronos.seed = self.seed
        self.persona.seed = self.seed
        self.ai.seed = self.seed
    
    @classmethod
    def from_yaml(cls, config_path: Path, seed: str) -> 'SystemConfig':
        """Load configuration from YAML file"""
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f)
        
        # Extract pillar configs
        world_data = config_data.get('world', {})
        mind_data = config_data.get('mind', {})
        body_data = config_data.get('body', {})
        chronos_data = config_data.get('chronos', {})
        persona_data = config_data.get('persona', {})
        voyager_data = config_data.get('voyager', {})
        
        # Create config objects
        world_config = WorldConfig(seed=seed, **world_data)
        mind_config = MindConfig(seed=seed, **mind_data)
        body_config = BodyConfig(**body_data)
        chronos_config = ChronosConfig(seed=seed, **chronos_data)
        persona_config = PersonaConfig(seed=seed, **persona_data)
        voyager_config = VoyagerConfig(seed=seed, **voyager_data)
        
        # Extract system settings
        system_settings = {
            k: v for k, v in config_data.items() 
            if k not in ['world', 'mind', 'body', 'chronos', 'persona', 'voyager', 'scenes']
        }
        
        # Extract scene defaults
        scene_defaults = config_data.get('scenes', {})
        default_spawn_points = scene_defaults.get('spawn_points', {})
        default_interest_points = scene_defaults.get('interest_points', {})
        
        return cls(
            seed=seed,
            world=world_config,
            mind=mind_config,
            body=body_config,
            chronos=chronos_config,
            persona=persona_config,
            ai=voyager_config,
            default_spawn_points=default_spawn_points,
            default_interest_points=default_interest_points,
            **system_settings
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            'seed': self.seed,
            'world': {
                'size_x': self.world.size_x,
                'size_y': self.world.size_y,
                'chunk_size': self.world.chunk_size,
                'interest_point_density': self.world.interest_point_density,
                'noise_scale': self.world.noise_scale,
                'noise_octaves': self.world.noise_octaves,
                'noise_persistence': self.world.noise_persistence,
                'noise_lacunarity': self.world.noise_lacunarity
            },
            'mind': {
                'enable_d20_rolls': self.mind.enable_d20_rolls,
                'critical_success_threshold': self.mind.critical_success_threshold,
                'critical_failure_threshold': self.mind.critical_failure_threshold,
                'default_difficulty_class': self.mind.default_difficulty_class
            },
            'body': {
                'viewport_width': self.body.viewport_width,
                'viewport_height': self.body.viewport_height,
                'tile_size': self.body.tile_size,
                'target_fps': self.body.target_fps,
                'enable_rendering': self.body.enable_rendering,
                'assets_path': self.body.assets_path
            },
            'chronos': {
                'max_active_quests': self.chronos.max_active_quests,
                'quest_timeout_seconds': self.chronos.quest_timeout_seconds,
                'enable_procedural_quests': self.chronos.enable_procedural_quests,
                'quest_generation_interval': self.chronos.quest_generation_interval
            },
            'persona': {
                'max_personas_per_location': self.persona.max_personas_per_location,
                'persona_memory_depth': self.persona.persona_memory_depth,
                'enable_faction_dynamics': self.persona.enable_faction_dynamics
            },
            'voyager': {
                'movement_range': self.ai.movement_range,
                'pathfinding_timeout': self.ai.pathfinding_timeout,
                'pondering_timeout': self.ai.pondering_timeout,
                'enable_autonomous_mode': self.ai.enable_autonomous_mode
            },
            'target_fps': self.target_fps,
            'enable_graphics': self.enable_graphics,
            'enable_persistence': self.enable_persistence,
            'enable_logging': self.enable_logging,
            'enable_console': self.enable_console,
            'log_level': self.log_level
        }


def create_default_config(seed: str) -> SystemConfig:
    """Create default configuration for testing"""
    return SystemConfig(seed=seed)


def save_default_config(config_path: Path, seed: str) -> None:
    """Save default configuration to YAML file"""
    config = create_default_config(seed)
    config_dict = config.to_dict()
    
    # Add scene defaults
    config_dict['scenes'] = {
        'spawn_points': {
            'tavern': (10, 25),
            'forest': (25, 25),
            'town': (10, 10)
        },
        'interest_points': {
            'tavern': [
                (10, 25, 'forest_edge'),
                (10, 20, 'town_gate'),
                (10, 10, 'town_square'),
                (20, 10, 'tavern_entrance'),
                (25, 30, 'tavern_interior'),
                (32, 32, 'iron_chest')
            ],
            'forest': [
                (15, 30, 'forest_clearing'),
                (20, 35, 'ancient_tree'),
                (25, 25, 'hidden_path'),
                (30, 20, 'herb_grove')
            ]
        }
    }
    
    with open(config_path, 'w') as f:
        yaml.dump(config_dict, f, default_flow_style=False, indent=2)
