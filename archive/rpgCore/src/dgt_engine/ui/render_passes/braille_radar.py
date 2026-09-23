"""
Braille Radar - Sub-Pixel Mapping System

Zone B: Tactical Radar with Braille dot mapping.
Provides high-resolution map visualization in 10x10 character box using Unicode Braille patterns.
Each Braille character represents 8 sub-pixels (4x2 grid), giving 4x resolution boost.
"""

import math
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from . import BaseRenderPass, RenderContext, RenderResult, RenderPassType
from world_ledger import WorldLedger, Coordinate, WorldChunk


class BrailleDot(Enum):
    """Unicode Braille dot positions (8-dot system)."""
    DOT_1 = 0x01  # Upper left
    DOT_2 = 0x02  # Middle left  
    DOT_3 = 0x04  # Lower left
    DOT_4 = 0x08  # Upper right
    DOT_5 = 0x10  # Middle right
    DOT_6 = 0x20  # Lower right
    DOT_7 = 0x40  # Bottom left
    DOT_8 = 0x80  # Bottom right


@dataclass
class RadarConfig:
    """Configuration for the Braille radar display."""
    width: int = 10      # Character width
    height: int = 10     # Character height  
    scale: float = 1.0    # World coordinate scale
    show_grid: bool = False
    show_coordinates: bool = False
    player_blink: bool = True
    entity_colors: bool = True


class BrailleRadarPass(BaseRenderPass):
    """
    High-resolution radar using Braille sub-pixel mapping.
    
    Each Braille character provides 8 sub-pixels in a 4x2 grid,
    giving 4x the resolution of standard ASCII for the same space.
    """
    
    def __init__(self, config: Optional[RadarConfig] = None):
        """
        Initialize the Braille radar pass.
        
        Args:
            config: Optional radar configuration
        """
        super().__init__(RenderPassType.BRAILLE_RADAR)
        self.config = config or RadarConfig()
        
        # Braille base character (U+2800)
        self.BRAILLE_BASE = 0x2800
        
        # Entity tracking for blinking
        self.entity_states: Dict[str, Dict] = {}
        self.last_blink_time = 0.0
        self.blink_state = True
        
        # Color mapping for different entity types
        self.entity_colors = {
            "player": "\033[38;5;196m",    # Red
            "hostile": "\033[38;5;196m",    # Red  
            "neutral": "\033[38;5;46m",     # Cyan
            "friendly": "\033[38;5;46m",   # Cyan
            "wall": "\033[38;5;240m",      # Grey
            "item": "\033[38;5;226m",      # Yellow
            "unknown": "\033[38;5;250m"    # White
        }
        
        self.ANSI_RESET = "\033[0m"
        
        logger.info(f"BrailleRadar initialized: {self.config.width}x{self.config.height} chars")
    
    def render(self, context: RenderContext) -> RenderResult:
        """
        Render the Braille radar.
        
        Args:
            context: Shared rendering context
            
        Returns:
            RenderResult with Braille radar content
        """
        # Update blinking state
        self._update_blinking(context.current_time)
        
        # Create radar buffer
        radar_buffer = self._create_radar_buffer(context)
        
        # Convert to string
        content = self._buffer_to_string(radar_buffer)
        
        return RenderResult(
            content=content,
            width=self.config.width,
            height=self.config.height,
            metadata={
                "scale": self.config.scale,
                "entity_count": len(self.entity_states),
                "resolution": f"{self.config.width * 4}x{self.config.height * 2} sub-pixels"
            }
        )
    
    def get_optimal_size(self, context: RenderContext) -> Tuple[int, int]:
        """Get optimal size for Braille radar."""
        return (self.config.width, self.config.height)
    
    def _create_radar_buffer(self, context: RenderContext) -> List[List[int]]:
        """
        Create the radar buffer with Braille dot patterns.
        
        Args:
            context: Rendering context
            
        Returns:
            2D array of Braille character codes
        """
        buffer = [[0 for _ in range(self.config.width)] for _ in range(self.config.height)]
        
        # Get player position
        player_x, player_y = context.get_player_position()
        
        # Calculate world bounds
        world_x, world_y, world_w, world_h = context.get_world_bounds()
        
        # Calculate scale factor
        scale_x = world_w / (self.config.width * 4)  # 4 sub-pixels per char
        scale_y = world_h / (self.config.height * 2)  # 2 sub-pixels per char
        
        # Render world environment
        self._render_world(buffer, context, scale_x, scale_y)
        
        # Render entities
        self._render_entities(buffer, context, scale_x, scale_y)
        
        # Render player (Voyager)
        self._render_player(buffer, context, player_x, player_y, scale_x, scale_y)
        
        return buffer
    
    def _render_world(self, buffer: List[List[int]], context: RenderContext, 
                      scale_x: float, scale_y: float) -> None:
        """
        Render world environment (walls, floors, etc.).
        
        Args:
            buffer: Radar buffer to modify
            context: Rendering context
            scale_x, scale_y: Scale factors
        """
        world_ledger = context.world_ledger
        world_x, world_y, world_w, world_h = context.get_world_bounds()
        
        # Sample world at sub-pixel resolution
        for char_y in range(self.config.height):
            for char_x in range(self.config.width):
                for sub_y in range(2):  # 2 sub-pixels vertically
                    for sub_x in range(4):  # 4 sub-pixels horizontally
                        
                        # Calculate world coordinates for this sub-pixel
                        world_coord_x = world_x + (char_x * 4 + sub_x) * scale_x
                        world_coord_y = world_y + (char_y * 2 + sub_y) * scale_y
                        
                        # Get world chunk
                        coord = Coordinate(int(world_coord_x), int(world_coord_y), 0)
                        chunk = world_ledger.get_chunk(coord, 0)
                        
                        # Check if this is a wall
                        if self._is_wall(chunk):
                            # Set corresponding Braille dot
                            dot_index = self._sub_pixel_to_braille_dot(sub_x, sub_y)
                            if dot_index:
                                buffer[char_y][char_x] |= dot_index.value
    
    def _render_entities(self, buffer: List[List[int]], context: RenderContext,
                        scale_x: float, scale_y: float) -> None:
        """
        Render entities on the radar.
        
        Args:
            buffer: Radar buffer to modify
            context: Rendering context
            scale_x, scale_y: Scale factors
        """
        # This would integrate with the EntityAI system
        # For now, render some placeholder entities
        
        # Example: Render a few guard entities
        player_x, player_y = context.get_player_position()
        
        guards = [
            (player_x + 8, player_y + 3, "hostile"),
            (player_x - 5, player_y + 7, "hostile"),
            (player_x + 12, player_y - 4, "neutral"),
        ]
        
        for entity_x, entity_y, entity_type in guards:
            self._render_entity(buffer, context, entity_x, entity_y, entity_type, scale_x, scale_y)
    
    def _render_entity(self, buffer: List[List[int]], context: RenderContext, x: float, y: float, 
                      entity_type: str, scale_x: float, scale_y: float) -> None:
        """
        Render a single entity on the radar.
        
        Args:
            buffer: Radar buffer to modify
            context: Rendering context
            x, y: Entity world coordinates
            entity_type: Type of entity
            scale_x, scale_y: Scale factors
        """
        world_x, world_y, world_w, world_h = context.get_world_bounds()
        
        # Convert to radar coordinates
        radar_x = int((x - world_x) / scale_x)
        radar_y = int((y - world_y) / scale_y)
        
        # Convert to character and sub-pixel coordinates
        char_x = radar_x // 4
        char_y = radar_y // 2
        sub_x = radar_x % 4
        sub_y = radar_y % 2
        
        # Check bounds
        if (0 <= char_x < self.config.width and 
            0 <= char_y < self.config.height):
            
            # Set Braille dot for entity
            dot_index = self._sub_pixel_to_braille_dot(sub_x, sub_y)
            if dot_index:
                buffer[char_y][char_x] |= dot_index.value
                
                # Track entity for blinking
                entity_id = f"{entity_type}_{char_x}_{char_y}"
                if entity_id not in self.entity_states:
                    self.entity_states[entity_id] = {
                        "type": entity_type,
                        "char_x": char_x,
                        "char_y": char_y,
                        "last_seen": context.current_time
                    }
    
    def _render_player(self, buffer: List[List[int]], context: RenderContext, player_x: float, player_y: float,
                       scale_x: float, scale_y: float) -> None:
        """
        Render the player on the radar with blinking effect.
        
        Args:
            buffer: Radar buffer to modify
            context: Rendering context
            player_x, player_y: Player world coordinates
            scale_x, scale_y: Scale factors
        """
        world_x, world_y, world_w, world_h = context.get_world_bounds()
        
        # Convert to radar coordinates
        radar_x = int((player_x - world_x) / scale_x)
        radar_y = int((player_y - world_y) / scale_y)
        
        # Convert to character and sub-pixel coordinates
        char_x = radar_x // 4
        char_y = radar_y // 2
        sub_x = radar_x % 4
        sub_y = radar_y % 2
        
        # Check bounds
        if (0 <= char_x < self.config.width and 
            0 <= char_y < self.config.height):
            
            # Apply blinking effect
            if not self.config.player_blink or self.blink_state:
                # Set multiple dots for better visibility
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        check_x = char_x + dx
                        check_y = char_y + dy
                        
                        if (0 <= check_x < self.config.width and 
                            0 <= check_y < self.config.height):
                            
                            # Set center dot
                            if dx == 0 and dy == 0:
                                dot_index = self._sub_pixel_to_braille_dot(sub_x, sub_y)
                            else:
                                # Set surrounding dots for visibility
                                dot_index = BrailleDot.DOT_4 if dx > 0 else BrailleDot.DOT_1
                            
                            if dot_index:
                                buffer[check_y][check_x] |= dot_index.value
    
    def _sub_pixel_to_braille_dot(self, sub_x: int, sub_y: int) -> Optional[BrailleDot]:
        """
        Convert sub-pixel coordinates to Braille dot index.
        
        Args:
            sub_x: Sub-pixel X coordinate (0-3)
            sub_y: Sub-pixel Y coordinate (0-1)
            
        Returns:
            BrailleDot or None if invalid
        """
        # Braille dot mapping (4x2 grid to 8 dots)
        dot_map = {
            (0, 0): BrailleDot.DOT_1,  # Upper left
            (0, 1): BrailleDot.DOT_2,  # Middle left
            (1, 0): BrailleDot.DOT_3,  # Lower left
            (1, 1): BrailleDot.DOT_7,  # Bottom left
            (2, 0): BrailleDot.DOT_4,  # Upper right
            (2, 1): BrailleDot.DOT_5,  # Middle right
            (3, 0): BrailleDot.DOT_6,  # Lower right
            (3, 1): BrailleDot.DOT_8,  # Bottom right
        }
        
        return dot_map.get((sub_x, sub_y))
    
    def _is_wall(self, chunk: Optional[WorldChunk]) -> bool:
        """Check if a chunk represents a wall."""
        if not chunk:
            return True  # Missing chunks are walls
        
        wall_tags = ["wall", "stone", "barrier", "obstacle", "blocked"]
        return any(tag in chunk.tags for tag in wall_tags)
    
    def _update_blinking(self, current_time: float) -> None:
        """Update blinking state for entities."""
        # Blink every 0.5 seconds
        if current_time - self.last_blink_time > 0.5:
            self.blink_state = not self.blink_state
            self.last_blink_time = current_time
    
    def _buffer_to_string(self, buffer: List[List[int]]) -> str:
        """
        Convert Braille buffer to ANSI string.
        
        Args:
            buffer: 2D array of Braille character codes
            
        Returns:
            ANSI-colored string representation
        """
        lines = []
        
        for row in buffer:
            line_parts = []
            
            for char_code in row:
                # Convert to Braille character
                braille_char = chr(self.BRAILLE_BASE + char_code)
                
                # Add color if entity_colors is enabled
                if self.config.entity_colors and char_code > 0:
                    # Simple color based on dot pattern (this would be more sophisticated)
                    if char_code & 0x80:  # Has bottom dots
                        color = self.entity_colors.get("item", self.entity_colors["unknown"])
                    elif char_code & 0x7C:  # Has middle/upper dots
                        color = self.entity_colors.get("wall", self.entity_colors["unknown"])
                    else:
                        color = self.entity_colors["unknown"]
                    
                    line_parts.append(f"{color}{braille_char}{self.ANSI_RESET}")
                else:
                    line_parts.append(braille_char)
            
            lines.append(''.join(line_parts))
        
        return '\n'.join(lines)
    
    def set_config(self, config: RadarConfig) -> None:
        """Update radar configuration."""
        self.config = config
        logger.info(f"BrailleRadar config updated: {config.width}x{config.height}")
    
    def get_entity_count(self) -> int:
        """Get current number of tracked entities."""
        return len(self.entity_states)
    
    def clear_entities(self) -> None:
        """Clear entity tracking."""
        self.entity_states.clear()
        logger.debug("BrailleRadar entity tracking cleared")


# Export for use by other modules
__all__ = ["BrailleRadarPass", "RadarConfig", "BrailleDot"]
