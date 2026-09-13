"""
ASCII Doom Renderer

Phase 1: Raycasting Engine Implementation
Phase 12: Sprite Billboarding Integration
Renders 3D ASCII world using raycasting with entity billboarding.

ADR 029: Isometric "Ghosting" & Threat Depth
"""

import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

from loguru import logger

from world_ledger import WorldLedger, Coordinate, WorldChunk
from game_state import GameState
from .sprite_billboard import SpriteBillboardSystem, BillboardType
from .raycasting_engine import RayCaster
from .character_renderer import CharacterRenderer, RenderConfig
from .raycasting_types import Ray3D, HitResult


@dataclass
class Ray3D:
    """A 3D ray for raycasting."""
    origin_x: float
    origin_y: float
    angle: float  # Direction in degrees
    length: float
    
    def get_direction(self) -> Tuple[float, float]:
        """Get the direction vector for this ray."""
        angle_rad = math.radians(self.angle)
        return (math.cos(angle_rad), math.sin(angle_rad))


@dataclass
class HitResult:
    """Result of a raycast against the world."""
    hit: bool
    distance: float
    height: float
    content: str
    coordinate: Optional[Coordinate]
    entity_id: Optional[str]


class ASCIIDoomRenderer:
    """
    ASCII-Doom style 3D renderer for tactical depth.
    
    Implements Wolfenstein-style raycasting with perception-based FoV
    and visual threat indicators for hostile NPCs.
    """
    
    def __init__(self, world_ledger: WorldLedger, width: int = 80, height: int = 24, faction_system=None):
        """Initialize the ASCII Doom renderer."""
        self.world_ledger = world_ledger
        self.faction_system = faction_system
        self.width = width
        self.height = height
        
        # Initialize sprite billboard system
        self.sprite_billboard = SpriteBillboardSystem(world_ledger, faction_system)
        
        # Initialize SOLID components
        self.ray_caster = RayCaster(world_ledger, max_distance=20)
        render_config = RenderConfig(
            wall_chars=['#', '#', '=', '=', '+', '-', '|', '/', '\\'],
            floor_chars=['.', ',', '-', '_', '~', '^'],
            entity_chars=['@', '&', '%', '*', '!'],
            item_chars=['$', '%', '^', '+', '?'],
            threat_chars=['!', '?', 'X', '@', '#']
        )
        self.character_renderer = CharacterRenderer(render_config)
        
        # Raycasting parameters
        self.fov = math.radians(60)  # Field of view
        self.max_distance = 20
        self.wall_height = 10
        
        # Rendering buffers
        self.buffer = [[' ' for _ in range(width)] for _ in range(height)]
        self.depth_buffer = [[self.max_distance for _ in range(width)] for _ in range(height)]
        
        # Viewport calculations
        self.half_height = height // 2
        
        # Color scheme (legacy compatibility)
        self.colors = {
            "wall": "#",
            "floor": ".",
            "entity": "!",
            "player": "@",
            "empty": " "
        }
        
        logger.info(f"ASCII-Doom Renderer initialized: {width}x{height} viewport, {math.degrees(self.fov):.0f} FoV")
        
        # Legacy character mappings (kept for compatibility)
        self.wall_chars = self.character_renderer.config.wall_chars
        self.floor_chars = self.character_renderer.config.floor_chars
        self.entity_chars = self.character_renderer.config.entity_chars
        self.item_chars = self.character_renderer.config.item_chars
        self.threat_chars = self.character_renderer.config.threat_chars
        self.threat_mode = False
    
    def set_threat_mode(self, enabled: bool):
        """Enable or disable threat indicator mode."""
        self.threat_mode = enabled
        self.character_renderer.set_threat_mode(enabled)
        logger.info(f"Threat mode {'enabled' if enabled else 'disabled'}")
    
    def render_frame(
        self, 
        game_state: GameState, 
        player_angle: float,
        perception_range: int,
        npc_mood: Optional[str] = None
    ) -> List[List[str]]:
        """
        Render a 3D frame using raycasting.
        
        Args:
            game_state: Current game state
            player_angle: Player's facing angle in degrees
            perception_range: Player's perception range
            npc_mood: Current NPC mood for threat indicators
            
        Returns:
            List of strings representing the rendered frame
        """
        # Clear buffer
        self.buffer = [[' ' for _ in range(self.width)] for _ in range(self.height)]
        
        # Get player position
        player_x = game_state.position.x
        player_y = game_state.position.y
        
        # Calculate FoV based on perception
        effective_fov = min(self.fov, perception_range * 2)  # Scale FoV by perception
        half_fov = effective_fov / 2
        
        # Determine if threat mode should be active
        threat_active = self.threat_mode and npc_mood in ["hostile", "unfriendly"]
        
        # Cast rays across the viewport
        for x in range(self.width):
            # Calculate ray angle for this column
            ray_angle = player_angle - half_fov + (x / self.width) * effective_fov
            
            # Create ray
            ray = Ray3D(
                origin_x=player_x,
                origin_y=player_y,
                angle=ray_angle,
                length=self.max_distance
            )
            
            # Cast ray and get hit result using new RayCaster
            hit_result = self.ray_caster.cast_ray(ray, game_state)
            
            # Get character using new CharacterRenderer
            char = self.character_renderer.get_character(hit_result)
            if char != ' ':
                hit_result.content = char
            
            # Apply distance-based shading if needed
            if hit_result.hit and hit_result.distance > 10:
                hit_result.content = self.character_renderer.apply_distance_shading(
                    hit_result.content, hit_result.distance
                )
            
            # Render column based on hit result
            self._render_column(x, hit_result)
        
        return self.buffer
    
    def _render_column(self, x: int, hit_result: HitResult):
        """Render a single column of the 3D view."""
        if not hit_result.hit:
            # No hit - render as empty space
            for y in range(self.height):
                self.buffer[y][x] = ' '
            return
        
        # Calculate height scaling
        height_scale = min(1.0, hit_result.height)
        column_height = int(self.height * height_scale)
        
        # Render the hit
        char = hit_result.content
        
        # Add distance-based shading (now handled by CharacterRenderer)
        # This section is kept for compatibility but functionality moved
        
        # Render from bottom to top
        start_y = self.half_height - column_height // 2
        end_y = self.half_height + column_height // 2
        
        for y in range(start_y, end_y):
            if 0 <= y < self.height and 0 <= x < self.width:
                self.buffer[y][x] = char
    
    def get_frame_as_string(self, buffer: List[List[str]]) -> str:
        """Convert the render buffer to a string."""
        return '\n'.join(''.join(row) for row in buffer)
    
    def calculate_fov_distance(self, perception_range: int) -> float:
        """Calculate effective FoV distance based on perception."""
        # Scale FoV by perception range
        perception_multiplier = perception_range / 10.0  # Base perception range is 10
        return self.fov * perception_multiplier
    
    def get_viewport_summary(self) -> Dict[str, Any]:
        """Get summary of the renderer configuration."""
        return {
            "width": self.width,
            "height": self.height,
            "fov": self.fov,
            "max_distance": self.max_distance,
            "wall_chars": self.wall_chars,
            "floor_chars": self.floor_chars,
            "entity_chars": self.entity_chars,
            "item_chars": self.item_chars
        }


# Export for use by game engine
__all__ = ["ASCIIDoomRenderer", "Ray3D", "HitResult"]
