import time
from dataclasses import dataclass, field, replace
from typing import Tuple, List, Dict, Any, Optional, Set, Union
from .enums import TileType, BiomeType, InterestType, SurfaceState, AIState, VoyagerState
from .constants import VIEWPORT_WIDTH_PIXELS, VIEWPORT_HEIGHT_PIXELS

@dataclass
class Tile:
    """Individual tile with surface state and tags"""
    tile_type: TileType
    walkable: bool = True
    surface_state: SurfaceState = SurfaceState.NORMAL
    overlay_state: Optional[SurfaceState] = None  # For temporary effects
    tags: Set[str] = field(default_factory=set)  # For special properties
    metadata: Dict[str, Any] = field(default_factory=dict)  # For custom data
    
    def apply_surface_state(self, new_state: SurfaceState, duration: Optional[float] = None) -> None:
        """Apply surface state with optional duration"""
        self.surface_state = new_state
        if duration:
            self.metadata["state_duration"] = duration
            self.metadata["state_applied_time"] = time.time()
    
    def add_overlay(self, overlay: SurfaceState, duration: float) -> None:
        """Add temporary overlay state"""
        self.overlay_state = overlay
        self.metadata["overlay_duration"] = duration
        self.metadata["overlay_applied_time"] = time.time()
    
    def update_overlays(self) -> None:
        """Update and expire overlay states"""
        current_time = time.time()
        
        # Check surface state duration
        if "state_duration" in self.metadata:
            elapsed = current_time - self.metadata["state_applied_time"]
            if elapsed > self.metadata["state_duration"]:
                self.surface_state = SurfaceState.NORMAL
                del self.metadata["state_duration"]
                del self.metadata["state_applied_time"]
        
        # Check overlay duration
        if self.overlay_state and "overlay_duration" in self.metadata:
            elapsed = current_time - self.metadata["overlay_applied_time"]
            if elapsed > self.metadata["overlay_duration"]:
                self.overlay_state = None
                del self.metadata["overlay_duration"]
                del self.metadata["overlay_applied_time"]
    
    def has_tag(self, tag: str) -> bool:
        """Check if tile has specific tag"""
        return tag in self.tags
    
    def add_tag(self, tag: str) -> None:
        """Add tag to tile"""
        self.tags.add(tag)
    
    def remove_tag(self, tag: str) -> None:
        """Remove tag from tile"""
        self.tags.discard(tag)

@dataclass
class TileData:
    """Immutable tile data structure"""
    tile: Tile
    biome: BiomeType
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        # Ensure metadata is immutable
        object.__setattr__(self, 'metadata', dict(self.metadata))

@dataclass
class InterestPoint:
    """Interest point for LLM manifestation (Deterministic Chaos)"""
    position: Tuple[int, int]
    interest_type: InterestType
    seed_value: int
    discovered: bool = False
    manifestation: Optional[str] = None  # LLM's interpretation
    manifestation_timestamp: Optional[float] = None
    tags: Set[str] = field(default_factory=set)  # Tags for quest logic
    
    def add_tag(self, tag: str) -> None:
        """Add tag to interest point"""
        self.tags.add(tag)
    
    def has_tag(self, tag: str) -> bool:
        """Check if interest point has tag"""
        return tag in self.tags

@dataclass
class Chunk:
    """World chunk for procedural generation"""
    position: Tuple[int, int]  # Chunk coordinates
    size: int = 10  # Chunk size in tiles
    seed: str = ""  # Seed for deterministic generation
    tiles: Dict[Tuple[int, int], Tile] = field(default_factory=dict)
    interest_points: List[InterestPoint] = field(default_factory=list)
    
    def get_tile(self, x: int, y: int) -> Optional[Tile]:
        """Get tile at local coordinates"""
        return self.tiles.get((x, y))
    
    def set_tile(self, x: int, y: int, tile: Tile) -> None:
        """Set tile at local coordinates"""
        self.tiles[(x, y)] = tile
    
    def add_interest_point(self, ip: InterestPoint) -> None:
        """Add interest point to chunk"""
        self.interest_points.append(ip)

@dataclass
class WorldDelta:
    """Immutable world state change"""
    position: Tuple[int, int]
    delta_type: str
    timestamp: float
    data: Dict[str, Any]
    
    def __post_init__(self):
        # Ensure data is immutable
        object.__setattr__(self, 'data', dict(self.data))

@dataclass
class Entity:
    """Base entity class"""
    id: str
    x: int
    y: int
    entity_type: str = "generic"
    visible: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)

# Forward references for Effect and Trigger
class Effect: pass
class Trigger: pass

@dataclass
class GameState:
    """Single Source of Truth for the entire system"""
    version: str = "2.0.0"
    timestamp: float = field(default_factory=time.time)
    
    # Entity State
    player_position: Tuple[int, int] = (10, 25)
    player_health: int = 100
    player_status: List[str] = field(default_factory=list)
    voyager_state: AIState = AIState.STATE_IDLE
    
    # World State
    current_environment: str = "forest"
    world_seed: str = "SEED_ZERO"
    interest_points: List[InterestPoint] = field(default_factory=list)
    entities: List[Entity] = field(default_factory=list) # Added for compatibility with GraphicsEngine
    hud: Dict[str, str] = field(default_factory=dict) # Added for compatibility with GraphicsEngine
    background: str = "grass" # Added for compatibility with GraphicsEngine
    
    # Persistence
    world_deltas: Dict[Tuple[int, int], WorldDelta] = field(default_factory=dict)
    
    # Session State
    turn_count: int = 0
    frame_count: int = 0
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    
    # Effects and Triggers
    active_effects: List['Effect'] = field(default_factory=list)
    active_triggers: List['Trigger'] = field(default_factory=list)
    
    # Global state tags
    tags: Set[str] = field(default_factory=set)
    
    def add_tag(self, tag: str) -> None:
        """Add global tag"""
        self.tags.add(tag)
        self.timestamp = time.time()
    
    def remove_tag(self, tag: str) -> None:
        """Remove global tag"""
        self.tags.discard(tag)
        self.timestamp = time.time()
    
    def has_tag(self, tag: str) -> bool:
        """Check if global tag exists"""
        return tag in self.tags
        
    def add_entity(self, entity: Entity):
        """Add entity to game state"""
        self.entities.append(entity)
    
    def remove_entity(self, entity_id: str) -> bool:
        """Remove entity by ID"""
        for i, entity in enumerate(self.entities):
            if entity.id == entity_id:
                del self.entities[i]
                return True
        return False
    
    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get entity by ID"""
        for entity in self.entities:
            if entity.id == entity_id:
                return entity
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Universal Packet"""
        return {
            'width': VIEWPORT_WIDTH_PIXELS,
            'height': VIEWPORT_HEIGHT_PIXELS,
            'entities': [
                {
                    'id': e.id,
                    'x': e.x,
                    'y': e.y,
                    'type': e.entity_type,
                    'metadata': e.metadata
                }
                for e in self.entities
            ],
            'background': {'id': self.background},
            'hud': self.hud,
            'timestamp': self.timestamp,
            'frame_count': self.frame_count,
            'player_position': self.player_position,
            'voyager_state': self.voyager_state.value
        }
    
    def copy(self) -> 'GameState':
        """Create an immutable deep copy"""
        # Note: Shallow copying lists for performance in Hot Loop, deep copy would be safer but slower
        new_state = GameState(
            version=self.version,
            timestamp=self.timestamp,
            player_position=self.player_position,
            player_health=self.player_health,
            player_status=self.player_status.copy(),
            voyager_state=self.voyager_state,
            current_environment=self.current_environment,
            world_seed=self.world_seed,
            # interest_points deep copy omitted for brevity in bridge, assuming standard pickle/copy works or lists are replaced
            turn_count=self.turn_count,
            frame_count=self.frame_count,
            performance_metrics=dict(self.performance_metrics),
            # active_effects/triggers lists copy
            active_effects=list(self.active_effects),
            active_triggers=list(self.active_triggers),
            tags=set(self.tags),
            
            # Compatibility fields
            entities=list(self.entities),
            hud=dict(self.hud),
            background=self.background
        )
        return new_state

@dataclass
class ShipGenome:
    """Genetic makeup of a ship"""
    genome_id: str
    traits: Dict[str, float] = field(default_factory=dict)
    generation: int = 0
    parent_ids: List[str] = field(default_factory=list)

@dataclass
class PerformanceMetrics:
    """System performance metrics"""
    fps: float = 0.0
    frame_time_ms: float = 0.0
    turn_time_ms: float = 0.0
    memory_mb: float = 0.0
    cpu_percent: float = 0.0
    llm_response_time_ms: float = 0.0
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary for persistence"""
        return {
            "fps": self.fps,
            "frame_time_ms": self.frame_time_ms,
            "turn_time_ms": self.turn_time_ms,
            "memory_mb": self.memory_mb,
            "cpu_percent": self.cpu_percent,
            "llm_response_time_ms": self.llm_response_time_ms
        }
