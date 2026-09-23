"""
Pixel Viewport - Integration with Fixed-Grid Architecture

ADR 031: Pixel-Protocol Dashboard Integration
Replaces ASCII raycasting with pixel-based rendering while maintaining
compatibility with the existing Static Canvas system.
"""

import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from loguru import logger

from game_state import GameState
from world_ledger import WorldLedger, Coordinate, WorldChunk
from .pixel_renderer import PixelRenderer, ColorPalette, Pixel
from .sprite_registry import SpriteRegistry, SpriteType
from .components.viewport import ViewportState


@dataclass
class ViewportConfig:
    """Configuration for pixel viewport rendering."""
    pixel_width: int = 80
    pixel_height: int = 48
    show_grid: bool = False
    show_coordinates: bool = False
    animation_speed: float = 1.0
    pixel_scale: int = 1  # For future scaling support


class PixelViewport:
    """
    Pixel-based viewport that integrates with the fixed-grid architecture.
    
    Replaces ASCII raycasting with Unicode half-block pixel rendering
    while maintaining compatibility with existing systems.
    """
    
    def __init__(self, world_ledger: WorldLedger, config: Optional[ViewportConfig] = None):
        """
        Initialize the pixel viewport.
        
        Args:
            world_ledger: World state management
            config: Optional viewport configuration
        """
        self.world_ledger = world_ledger
        self.config = config or ViewportConfig()
        
        # Initialize pixel renderer
        self.pixel_renderer = PixelRenderer(
            width=self.config.pixel_width,
            height=self.config.pixel_height
        )
        
        # Initialize sprite registry
        self.sprite_registry = SpriteRegistry()
        
        # Viewport state
        self.state = ViewportState(
            view_mode="pixel",
            player_position=(0, 0),
            player_angle=0.0,
            perception_range=10,
            frame_count=0,
            last_render_time=0.0,
            is_active=True
        )
        
        # Animation timing
        self.last_render_time = 0.0
        self.current_time = 0.0
        
        # Entity tracking
        self.entity_sprites: Dict[str, Any] = {}  # entity_id -> sprite info
        self.item_sprites: Dict[str, Any] = {}    # item_id -> sprite info
        
        logger.info(f"PixelViewport initialized: {self.config.pixel_width}x{self.config.pixel_height} pixels")
    
    def update_game_state(self, game_state: GameState) -> None:
        """
        Update viewport with new game state.
        
        Args:
            game_state: Current game state
        """
        # Update viewport state
        self.state.player_position = (game_state.position.x, game_state.position.y)
        self.state.player_angle = game_state.player_angle
        
        # Update entity sprites
        self._update_entity_sprites(game_state)
        
        # Update item sprites
        self._update_item_sprites(game_state)
        
        logger.debug(f"PixelViewport updated: player at {self.state.player_position}")
    
    def render_frame(self, game_state: GameState) -> str:
        """
        Render a complete frame using pixel art.
        
        Args:
            game_state: Current game state
            
        Returns:
            ANSI-colored string ready for terminal display
        """
        # Update timing
        self.current_time = time.time()
        if self.last_render_time == 0.0:
            self.last_render_time = self.current_time
        
        # Clear pixel buffer
        self.pixel_renderer.clear()
        
        # Render world environment
        self._render_world_environment(game_state)
        
        # Render entities
        self._render_entities(game_state)
        
        # Render items
        self._render_items(game_state)
        
        # Render player (Voyager)
        self._render_player(game_state)
        
        # Apply post-processing effects
        if self.config.show_grid:
            self._render_grid()
        
        # Convert to ANSI string
        rendered_frame = self.pixel_renderer.render_to_string()
        
        self.last_render_time = self.current_time
        
        return rendered_frame
    
    def _render_world_environment(self, game_state: GameState) -> None:
        """
        Render the world environment (walls, floors, etc.).
        
        Args:
            game_state: Current game state
        """
        player_x, player_y = self.state.player_position
        
        # Calculate visible area (simple rectangular viewport for now)
        view_width = self.config.pixel_width
        view_height = self.config.pixel_height
        
        # Center viewport on player
        start_x = int(player_x - view_width // 2)
        start_y = int(player_y - view_height // 2)
        
        for y in range(view_height):
            for x in range(view_width):
                world_x = start_x + x
                world_y = start_y + y
                
                # Get world coordinate
                coord = Coordinate(world_x, world_y, 0)
                chunk = self.world_ledger.get_chunk(coord, 0)
                
                # Determine pixel color based on chunk content
                pixel = self._get_environment_pixel(chunk, world_x, world_y)
                self.pixel_renderer.set_pixel(x, y, pixel)
    
    def _get_environment_pixel(self, chunk: Optional[WorldChunk], x: float, y: float) -> Pixel:
        """
        Get pixel color for environment at given coordinates.
        
        Args:
            chunk: World chunk at coordinates
            x, y: World coordinates
            
        Returns:
            Pixel with appropriate color
        """
        if not chunk:
            # Missing chunks are walls
            return ColorPalette.get_environment_color("wall")
        
        # Check for wall-like tags
        wall_tags = ["wall", "stone", "barrier", "obstacle", "blocked"]
        if any(tag in chunk.tags for tag in wall_tags):
            return ColorPalette.get_environment_color("wall")
        
        # Check for floor-like tags
        floor_tags = ["floor", "ground", "grass", "dirt"]
        if any(tag in chunk.tags for tag in floor_tags):
            return ColorPalette.get_environment_color("floor")
        
        # Default to floor
        return ColorPalette.get_environment_color("floor")
    
    def _render_entities(self, game_state: GameState) -> None:
        """
        Render all entities as sprites.
        
        Args:
            game_state: Current game state
        """
        player_x, player_y = self.state.player_position
        
        # This would integrate with the EntityAI system
        # For now, render some placeholder entities
        
        # Example: Render a guard entity
        guard_x, guard_y = int(player_x + 5), int(player_y + 3)
        if self._is_in_viewport(guard_x, guard_y):
            guard_sprite = self.sprite_registry.get_character_sprite("warrior", "legion")
            if guard_sprite:
                screen_x, screen_y = self._world_to_screen(guard_x, guard_y)
                self.pixel_renderer.draw_sprite(guard_sprite, screen_x, screen_y, self.current_time)
    
    def _render_items(self, game_state: GameState) -> None:
        """
        Render all items as sprites.
        
        Args:
            game_state: Current game state
        """
        player_x, player_y = self.state.player_position
        
        # Example: Render some items
        items = [
            ("coin", player_x + 2, player_y + 1),
            ("potion", player_x - 3, player_y + 2),
            ("sword", player_x + 1, player_y - 2)
        ]
        
        for item_type, item_x, item_y in items:
            if self._is_in_viewport(item_x, item_y):
                item_sprite = self.sprite_registry.get_item_sprite(item_type)
                if item_sprite:
                    screen_x, screen_y = self._world_to_screen(item_x, item_y)
                    self.pixel_renderer.draw_sprite(item_sprite, screen_x, screen_y, self.current_time)
    
    def _render_player(self, game_state: GameState) -> None:
        """
        Render the player (Voyager) as a sprite.
        
        Args:
            game_state: Current game state
        """
        player_x, player_y = self.state.player_position
        
        # Get Voyager sprite
        voyager_sprite = self.sprite_registry.get_voyager_sprite("neutral", "3x3")
        if voyager_sprite:
            # Center player on screen
            screen_x = self.config.pixel_width // 2 - 1  # Center 3x3 sprite
            screen_y = self.config.pixel_height // 2 - 1
            
            self.pixel_renderer.draw_sprite(voyager_sprite, screen_x, screen_y, self.current_time)
    
    def _render_grid(self) -> None:
        """Render a grid overlay for debugging."""
        grid_pixel = Pixel(r=1, g=1, b=1, intensity=0.3)  # Dim white
        
        # Vertical lines
        for x in range(0, self.config.pixel_width, 4):
            for y in range(self.config.pixel_height):
                current_pixel = self.pixel_renderer.pixels[y][x]
                if current_pixel.is_empty():
                    self.pixel_renderer.set_pixel(x, y, grid_pixel)
        
        # Horizontal lines  
        for y in range(0, self.config.pixel_height, 4):
            for x in range(self.config.pixel_width):
                current_pixel = self.pixel_renderer.pixels[y][x]
                if current_pixel.is_empty():
                    self.pixel_renderer.set_pixel(x, y, grid_pixel)
    
    def _update_entity_sprites(self, game_state: GameState) -> None:
        """Update entity sprite tracking."""
        # This would integrate with the EntityAI system to track entities
        # For now, this is a placeholder
        pass
    
    def _update_item_sprites(self, game_state: GameState) -> None:
        """Update item sprite tracking."""
        # This would integrate with the loot system to track items
        # For now, this is a placeholder
        pass
    
    def _is_in_viewport(self, x: float, y: float) -> bool:
        """
        Check if world coordinates are within viewport.
        
        Args:
            x, y: World coordinates
            
        Returns:
            True if coordinates are visible
        """
        player_x, player_y = self.state.player_position
        
        half_width = self.config.pixel_width // 2
        half_height = self.config.pixel_height // 2
        
        return (abs(x - player_x) <= half_width and 
                abs(y - player_y) <= half_height)
    
    def _world_to_screen(self, world_x: float, world_y: float) -> Tuple[int, int]:
        """
        Convert world coordinates to screen coordinates.
        
        Args:
            world_x, world_y: World coordinates
            
        Returns:
            Screen coordinates (x, y)
        """
        player_x, player_y = self.state.player_position
        
        screen_x = int(world_x - player_x + self.config.pixel_width // 2)
        screen_y = int(world_y - player_y + self.config.pixel_height // 2)
        
        return screen_x, screen_y
    
    def set_config(self, config: ViewportConfig) -> None:
        """
        Update viewport configuration.
        
        Args:
            config: New configuration
        """
        self.config = config
        
        # Reinitialize pixel renderer if dimensions changed
        if (self.pixel_renderer.pixel_width != config.pixel_width or
            self.pixel_renderer.pixel_height != config.pixel_height):
            
            self.pixel_renderer = PixelRenderer(
                width=config.pixel_width,
                height=config.pixel_height
            )
            
            logger.info(f"PixelViewport resized to {config.pixel_width}x{config.pixel_height}")
    
    def get_viewport_info(self) -> Dict[str, Any]:
        """Get viewport information and statistics."""
        return {
            "dimensions": (self.config.pixel_width, self.config.pixel_height),
            "char_dimensions": self.pixel_renderer.get_char_dimensions(),
            "player_position": self.state.player_position,
            "player_angle": self.state.player_angle,
            "sprite_count": len(self.entity_sprites) + len(self.item_sprites),
            "available_sprites": len(self.sprite_registry.list_templates()),
            "view_mode": self.state.view_mode
        }
    
    def create_demo_scene(self) -> str:
        """
        Create a demo scene for testing.
        
        Returns:
            Rendered demo scene
        """
        # Clear and render demo
        self.pixel_renderer.clear()
        
        # Draw some environment
        wall_pixel = ColorPalette.get_environment_color("wall")
        floor_pixel = ColorPalette.get_environment_color("floor")
        
        # Create a simple room
        for x in range(self.config.pixel_width):
            for y in range(self.config.pixel_height):
                if x == 0 or x == self.config.pixel_width - 1 or \
                   y == 0 or y == self.config.pixel_height - 1:
                    self.pixel_renderer.set_pixel(x, y, wall_pixel)
                else:
                    self.pixel_renderer.set_pixel(x, y, floor_pixel)
        
        # Add some sprites
        voyager = self.sprite_registry.get_voyager_sprite("neutral", "3x3")
        if voyager:
            self.pixel_renderer.draw_sprite(voyager, 10, 10, self.current_time)
        
        warrior = self.sprite_registry.get_character_sprite("warrior", "legion")
        if warrior:
            self.pixel_renderer.draw_sprite(warrior, 30, 15, self.current_time)
        
        # Add items
        coin = self.sprite_registry.get_item_sprite("coin")
        if coin:
            self.pixel_renderer.draw_sprite(coin, 20, 20, self.current_time)
        
        return self.pixel_renderer.render_to_string()


# Export for use by other modules
__all__ = [
    "PixelViewport",
    "ViewportConfig"
]
