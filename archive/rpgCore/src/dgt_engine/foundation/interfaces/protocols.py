"""
DGT Platform - Protocol Definitions

Phase 1: Interface Definition & Hardening

All major components must implement these protocols before
any concrete implementation can be added to the system.
"""

from typing import Protocol, TypeVar, Optional, Dict, List, Tuple, Any, Union
from dataclasses import dataclass
from abc import ABC, abstractmethod
from enum import Enum

# Import foundation types to avoid circular dependencies
from dgt_engine.foundation.types import Result, ValidationResult

# Generic type variables
T = TypeVar('T')
GameState = TypeVar('GameState')
Intent = TypeVar('Intent')
RenderFrame = TypeVar('RenderFrame')
Coordinate = Tuple[int, int]


class EngineProtocol(Protocol):
    """Core interface for all engine implementations"""
    
    def initialize(self) -> Result[bool]:
        """Initialize the engine with all required dependencies"""
        ...
    
    def shutdown(self) -> Result[None]:
        """Clean shutdown with resource cleanup"""
        ...
    
    def get_state(self) -> GameState:
        """Get current engine state"""
        ...
    
    def process_intent(self, intent: Intent) -> Result[GameState]:
        """Process an intent and return updated state"""
        ...
    
    def is_healthy(self) -> bool:
        """Check if engine is in healthy state"""
        ...


class RenderProtocol(Protocol):
    """Interface for all rendering systems"""
    
    def initialize(self) -> Result[bool]:
        """Initialize rendering system"""
        ...
    
    def render_state(self, game_state: GameState) -> Result[RenderFrame]:
        """Render a complete frame from game state"""
        ...
    
    def display(self, frame: RenderFrame) -> Result[None]:
        """Display the rendered frame"""
        ...
    
    def get_viewport(self) -> Tuple[int, int, int, int]:
        """Get current viewport (x, y, width, height)"""
        ...
    
    def set_viewport(self, x: int, y: int, width: int, height: int) -> Result[None]:
        """Set viewport for rendering"""
        ...


class StateProtocol(Protocol):
    """Interface for state management systems"""
    
    def get_player_position(self) -> Coordinate:
        """Get current player position"""
        ...
    
    def update_position(self, new_position: Coordinate) -> Result[None]:
        """Update player position with validation"""
        ...
    
    def get_state_snapshot(self) -> Dict[str, Any]:
        """Get complete state snapshot for persistence"""
        ...
    
    def restore_from_snapshot(self, snapshot: Dict[str, Any]) -> Result[None]:
        """Restore state from snapshot"""
        ...
    
    def validate_state(self) -> Result[bool]:
        """Validate state integrity"""
        ...


class DIProtocol(Protocol):
    """Interface for dependency injection container"""
    
    def register(self, interface: type, implementation: type) -> Result[None]:
        """Register interface to implementation mapping"""
        ...
    
    def resolve(self, interface: type) -> Result[T]:
        """Resolve interface to implementation instance"""
        ...
    
    def register_singleton(self, interface: type, implementation: type) -> Result[None]:
        """Register singleton instance"""
        ...
    
    def check_circular_dependencies(self) -> Result[List[Tuple[type, type]]]:
        """Check for circular dependencies"""
        ...
    
    def initialize_all(self) -> Result[None]:
        """Initialize all registered dependencies"""
        ...


class PPUProtocol(Protocol):
    """Interface for Picture Processing Unit implementations"""
    
    def initialize(self, width: int, height: int) -> Result[bool]:
        """Initialize PPU with dimensions"""
        ...
    
    def render_tile(self, tile_id: int, x: int, y: int) -> Result[None]:
        """Render a single tile"""
        ...
    
    def render_sprite(self, sprite_data: bytes, x: int, y: int) -> Result[None]:
        """Render a sprite"""
        ...
    
    def get_frame_buffer(self) -> Result[bytes]:
        """Get current frame buffer data"""
        ...
    
    def clear_frame(self) -> Result[None]:
        """Clear the frame buffer"""
        ...
    
    def set_palette(self, palette: List[Tuple[int, int, int]]) -> Result[None]:
        """Set color palette"""
        ...


class FontManagerProtocol(Protocol):
    """Interface for font management systems"""
    
    def set_font(self, font_name: str) -> Result[bool]:
        """Set active font"""
        ...
    
    def get_font_for_energy(self, energy_level: float) -> str:
        """Get appropriate font for energy level"""
        ...
    
    def get_available_fonts(self) -> List[str]:
        """Get list of available fonts"""
        ...


class TerminalProtocol(Protocol):
    """Interface for terminal systems"""
    
    def set_energy_level(self, energy: float) -> Result[None]:
        """Set terminal energy level"""
        ...
    
    def write_text(self, text: str, typewriter: bool = False) -> Result[None]:
        """Write text to terminal"""
        ...
    
    def write_story_drip(self, story: str, typewriter: bool = False) -> Result[None]:
        """Write story with drip effect"""
        ...
    
    def update(self) -> Result[None]:
        """Update terminal display"""
        ...


class NarrativeProtocol(Protocol):
    """Interface for narrative systems"""
    
    def generate_response(self, context: Dict[str, Any]) -> Result[str]:
        """Generate narrative response"""
        ...
    
    def set_tone(self, tone: str) -> Result[None]:
        """Set narrative tone"""
        ...
    
    def get_context(self) -> Dict[str, Any]:
        """Get current narrative context"""
        ...


class AssetProtocol(Protocol):
    """Interface for asset management systems"""
    
    def load_asset(self, asset_path: str) -> Result[bytes]:
        """Load asset from path"""
        ...
    
    def cache_asset(self, asset_id: str, data: bytes) -> Result[None]:
        """Cache asset data"""
        ...
    
    def get_cached_asset(self, asset_id: str) -> Result[Optional[bytes]]:
        """Get cached asset"""
        ...
    
    def preload_assets(self, asset_list: List[str]) -> Result[None]:
        """Preload list of assets"""
        ...


class ConfigProtocol(Protocol):
    """Interface for configuration management"""
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        ...
    
    def set(self, key: str, value: Any) -> Result[None]:
        """Set configuration value"""
        ...
    
    def load_from_file(self, config_path: str) -> Result[None]:
        """Load configuration from file"""
        ...
    
    def validate_config(self) -> Result[bool]:
        """Validate configuration integrity"""
        ...


class LoggerProtocol(Protocol):
    """Interface for logging systems"""
    
    def info(self, message: str, **kwargs) -> None:
        """Log info message"""
        ...
    
    def warning(self, message: str, **kwargs) -> None:
        """Log warning message"""
        ...
    
    def error(self, message: str, **kwargs) -> None:
        """Log error message"""
        ...
    
    def debug(self, message: str, **kwargs) -> None:
        """Log debug message"""
        ...
    
    def set_level(self, level: str) -> Result[None]:
        """Set logging level"""
        ...


class PhysicsProtocol(Protocol):
    """Interface for physics simulation systems"""
    
    def update(self, dt: float) -> Result[None]:
        """Update physics simulation by time step"""
        ...
    
    def add_entity(self, entity: 'SpaceEntityProtocol') -> Result[None]:
        """Add entity to physics simulation"""
        ...
    
    def remove_entity(self, entity_id: str) -> Result[None]:
        """Remove entity from physics simulation"""
        ...
    
    def check_collisions(self) -> Result[List[Tuple['SpaceEntityProtocol', 'SpaceEntityProtocol']]]:
        """Check and return all collision pairs"""
        ...
    
    def get_entities_in_radius(self, position: Coordinate, radius: float) -> Result[List['SpaceEntityProtocol']]:
        """Get all entities within specified radius"""
        ...


class SpaceEntityProtocol(Protocol):
    """Interface for space entities with Newtonian physics"""
    
    @property
    def entity_id(self) -> str:
        """Unique entity identifier"""
        ...
    
    @property
    def entity_type(self) -> str:
        """Entity type (ship, asteroid, bullet, scrap)"""
        ...
    
    @property
    def position(self) -> Coordinate:
        """Current position"""
        ...
    
    @property
    def velocity(self) -> Coordinate:
        """Current velocity vector"""
        ...
    
    @property
    def active(self) -> bool:
        """Whether entity is active"""
        ...
    
    def update(self, dt: float) -> Result[None]:
        """Update entity physics"""
        ...
    
    def apply_force(self, force: Coordinate) -> Result[None]:
        """Apply force to entity"""
        ...
    
    def check_collision(self, other: 'SpaceEntityProtocol') -> bool:
        """Check collision with another entity"""
        ...
    
    def get_state_dict(self) -> Dict[str, Any]:
        """Get entity state for serialization"""
        ...


class ScrapProtocol(Protocol):
    """Interface for scrap collection system"""
    
    def spawn_scrap(self, position: Coordinate, scrap_type: str) -> Result[Optional['SpaceEntityProtocol']]:
        """Spawn scrap entity at position"""
        ...
    
    def collect_scrap(self, scrap: 'SpaceEntityProtocol') -> Result[Dict[str, Any]]:
        """Process scrap collection and return rewards"""
        ...
    
    def get_scrap_counts(self) -> Dict[str, int]:
        """Get current scrap inventory counts"""
        ...
    
    def persist_inventory(self) -> Result[None]:
        """Persist inventory to storage"""
        ...


class TerminalHandshakeProtocol(Protocol):
    """Interface for terminal notification system"""
    
    def send_notification(self, message: str, notification_type: str) -> Result[None]:
        """Send notification to terminal"""
        ...
    
    def get_recent_messages(self, count: int) -> List[str]:
        """Get recent terminal messages"""
        ...
    
    def update(self) -> Result[Dict[str, Any]]:
        """Update terminal system"""
        ...
    
    def get_system_status(self) -> str:
        """Get formatted system status"""
        ...


# Protocol Collections for Easy Registration
CORE_PROTOCOLS = [
    EngineProtocol,
    RenderProtocol,
    StateProtocol,
    DIProtocol,
]

UI_PROTOCOLS = [
    PPUProtocol,
    FontManagerProtocol,
    TerminalProtocol,
]

SUPPORT_PROTOCOLS = [
    NarrativeProtocol,
    AssetProtocol,
    ConfigProtocol,
    LoggerProtocol,
]

SPACE_PROTOCOLS = [
    PhysicsProtocol,
    SpaceEntityProtocol,
    ScrapProtocol,
    TerminalHandshakeProtocol,
]

ALL_PROTOCOLS = CORE_PROTOCOLS + UI_PROTOCOLS + SUPPORT_PROTOCOLS + SPACE_PROTOCOLS
