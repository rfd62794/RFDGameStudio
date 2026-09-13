"""
Isometric 2.5D Renderer

Phase 8: Isometric World View Implementation
Phase 9: Shape Language Avatar Integration
Projects WorldLedger coordinates onto a staggered diamond grid for tactical RPG view.

ADR 025: Isometric World-View Integration
ADR 026: Shape Language Character Visualization
"""

import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

from loguru import logger
from world_ledger import WorldLedger, Coordinate, WorldChunk
from game_state import GameState
from ui.shape_avatar import ShapeAvatarGenerator, ShapeType


@dataclass
class IsometricTile:
    """A single tile in the isometric view."""
    coordinate: Coordinate
    screen_x: int
    screen_y: int
    content: str
    color: str = "white"
    z_order: int = 0  # For proper depth sorting
    entity_type: str = "tile"  # tile, entity, item, player
    description: str = ""


class IsometricRenderer:
    """
    Isometric 2.5D renderer for tactical RPG view.
    
    Projects WorldLedger coordinates onto a staggered diamond grid.
    """
    
    def __init__(self, world_ledger: WorldLedger, width: int = 40, height: int = 20, faction_system=None):
        """Initialize the isometric renderer."""
        self.world_ledger = world_ledger
        self.faction_system = faction_system
        self.width = width
        self.height = height
        
        # Initialize shape avatar generator
        self.shape_avatar = ShapeAvatarGenerator()
        
        # Isometric projection parameters
        self.char_width = 2  # Width of each character in screen space
        self.char_height = 1  # Height of each character in screen space
        
        # Viewport parameters
        self.view_radius = 5  # How many tiles around the player
        self.center_x = width // 2
        self.center_y = height // 2
        
        # Distance-based rendering
        self.distance_thresholds = {
            "near": 3,    # Close range - detailed shapes
            "mid": 6,     # Medium range - blurred shapes
            "far": 10     # Far range - primitive shapes
        }
        
        # Tile sets
        self.tile_chars = {
            "floor": ["·", "░", "▒", "▓"],
            "wall": ["#", "█", "▓", "▒"],
            "water": ["~", "≈", "≋", "≌"],
            "grass": ["'", ":", ";", "°"],
            "stone": ["·", "•", "○", "●"],
            "wood": ["+", "†", "‡", "‡"],
            "ruins": ["#", "▓", "▒", "░"],
            "market": ["$", "¢", "£", "¥"],
            "temple": ["◊", "○", "◉", "◈"],
            "fortress": ["#", "█", "▓", "▒"]
        }
        
        # Entity characters
        self.entity_chars = {
            "player": "@",
            "guard": "!",
            "merchant": "$",
            "cultist": "◊",
            "legion": "!",
            "trader": "$",
            "artifact": "◊",
            "item": "*",
            "well": "○",
            "statue": "◈"
        }
        
        # Color schemes
        self.tile_colors = {
            "floor": "white",
            "wall": "cyan",
            "water": "blue",
            "grass": "green",
            "stone": "white",
            "wood": "yellow",
            "ruins": "red",
            "market": "yellow",
            "temple": "magenta",
            "fortress": "red"
        }
        
        self.entity_colors = {
            "player": "bold green",
            "guard": "bold red",
            "merchant": "bold yellow",
            "cultist": "bold magenta",
            "legion": "bold red",
            "trader": "bold yellow",
            "artifact": "bold magenta",
            "item": "bold white",
            "well": "bold blue",
            "statue": "bold cyan"
        }
        
        # Rendering buffer
        self.buffer = [[" " for _ in range(height)] for _ in range(width)]
        self.tiles: List[IsometricTile] = []
        
        logger.info(f"Isometric Renderer initialized: {width}x{height} viewport, {self.view_radius} tile radius")
    
    def world_to_screen(self, world_x: int, world_y: int) -> Tuple[int, int]:
        """
        Convert world coordinates to isometric screen coordinates.
        
        Args:
            world_x: World X coordinate
            world_y: World Y coordinate
            
        Returns:
            Tuple of (screen_x, screen_y) coordinates
        """
        # Standard isometric projection
        screen_x = (world_x - world_y) * self.char_width + self.center_x
        screen_y = (world_x + world_y) * self.char_height + self.center_y
        
        return screen_x, screen_y
    
    def screen_to_world(self, screen_x: int, screen_y: int) -> Tuple[int, int]:
        """
        Convert screen coordinates to world coordinates.
        
        Args:
            screen_x: Screen X coordinate
            screen_y: Screen Y coordinate
            
        Returns:
            Tuple of (world_x, world_y) coordinates
        """
        # Inverse isometric projection
        rel_x = (screen_x - self.center_x) / self.char_width
        rel_y = (screen_y - self.center_y) / self.char_height
        
        world_x = (rel_x + rel_y) / 2
        world_y = (rel_y - rel_x) / 2
        
        return int(world_x), int(world_y)
    
    def get_tile_content(self, chunk: WorldChunk, coordinate: Coordinate) -> Tuple[str, str]:
        """
        Determine the content and color for a tile based on chunk properties.
        
        Args:
            chunk: World chunk data
            coordinate: World coordinate
            
        Returns:
            Tuple of (content, color) for the tile
        """
        if not chunk:
            return "·", "white"
        
        # Check for special tags
        tags = chunk.tags
        
        # Priority-based tile selection
        if any(tag in ["wall", "stone", "barrier", "fortress"] for tag in tags):
            if "fortress" in tags:
                return self.tile_chars["fortress"][0], self.tile_colors["fortress"]
            elif "ruins" in tags:
                return self.tile_chars["ruins"][0], self.tile_colors["ruins"]
            else:
                return self.tile_chars["wall"][0], self.tile_colors["wall"]
        
        elif any(tag in ["water", "river", "lake", "ocean"] for tag in tags):
            return self.tile_chars["water"][0], self.tile_colors["water"]
        
        elif any(tag in ["grass", "field", "meadow", "plains"] for tag in tags):
            return self.tile_chars["grass"][0], self.tile_colors["grass"]
        
        elif any(tag in ["market", "trade", "shop", "store"] for tag in tags):
            return self.tile_chars["market"][0], self.tile_colors["market"]
        
        elif any(tag in ["temple", "shrine", "altar", "holy"] for tag in tags):
            return self.tile_chars["temple"][0], self.tile_colors["temple"]
        
        elif any(tag in ["wood", "forest", "trees", "jungle"] for tag in tags):
            return self.tile_chars["wood"][0], self.tile_colors["wood"]
        
        elif any(tag in ["stone", "rock", "mountain", "cliff"] for tag in tags):
            return self.tile_chars["stone"][0], self.tile_colors["stone"]
        
        else:
            # Default floor
            return self.tile_chars["floor"][0], self.tile_colors["floor"]
    
    def get_entity_at(self, coordinate: Coordinate, game_state: GameState) -> Optional[Tuple[str, str, str]]:
        """
        Check for entities at a specific coordinate with shape-based visualization.
        
        Args:
            coordinate: World coordinate to check
            game_state: Current game state
            
        Returns:
            Tuple of (entity_char, color, entity_type) or None
        """
        # Check if player is at this coordinate
        if (coordinate.x == game_state.position.x and 
            coordinate.y == game_state.position.y):
            # Generate player avatar based on stats
            player_avatar = self.shape_avatar.generate_avatar(
                game_state.player.attributes, 
                size="medium", 
                distance="near"
            )
            return player_avatar, "bold green", "player"
        
        # Check for NPCs based on faction control
        faction = None
        if self.faction_system:
            faction = self.faction_system.get_faction_at_coordinate(coordinate)
        if faction:
            faction_id = faction.id if isinstance(faction.id, str) else str(faction.id)
            
            # Generate faction-specific stats for avatar
            faction_stats = self._get_faction_stats(faction_id)
            
            # Calculate distance from player
            distance = abs(coordinate.x - game_state.position.x) + abs(coordinate.y - game_state.position.y)
            
            # Determine distance level
            if distance <= self.distance_thresholds["near"]:
                distance_level = "near"
            elif distance <= self.distance_thresholds["mid"]:
                distance_level = "mid"
            else:
                distance_level = "far"
            
            # Generate faction avatar
            faction_avatar = self.shape_avatar.generate_avatar(
                faction_stats, 
                size="small", 
                distance=distance_level
            )
            
            faction_colors = {
                "legion": "bold red",
                "traders": "bold yellow", 
                "cult": "bold magenta"
            }
            
            faction_types = {
                "legion": "guard",
                "traders": "merchant",
                "cult": "cultist"
            }
            
            return faction_avatar, faction_colors.get(faction_id, "white"), faction_types.get(faction_id, "npc")
        
        # Check for legacy props (wells, statues, etc.)
        historical_tags = self.world_ledger.get_historical_tags(coordinate)
        if historical_tags:
            if any("well" in str(tag).lower() for tag in historical_tags):
                return self.entity_chars["well"], self.entity_colors["well"], "item"
            elif any("statue" in str(tag).lower() for tag in historical_tags):
                return self.entity_chars["statue"], self.entity_colors["statue"], "item"
        
        return None
    
    def _get_faction_stats(self, faction_id: str) -> Dict[str, int]:
        """Generate representative stats for a faction."""
        faction_stats = {
            "legion": {
                "strength": 16,
                "dexterity": 12,
                "constitution": 15,
                "intelligence": 10,
                "wisdom": 8,
                "charisma": 10
            },
            "traders": {
                "strength": 10,
                "dexterity": 12,
                "constitution": 12,
                "intelligence": 14,
                "wisdom": 12,
                "charisma": 16
            },
            "cult": {
                "strength": 8,
                "dexterity": 14,
                "constitution": 10,
                "intelligence": 16,
                "wisdom": 18,
                "charisma": 12
            }
        }
        
        return faction_stats.get(faction_id, {
            "strength": 10,
            "dexterity": 10,
            "constitution": 10,
            "intelligence": 10,
            "wisdom": 10,
            "charisma": 10
        })
    
    def generate_tiles(self, game_state: GameState) -> List[IsometricTile]:
        """
        Generate isometric tiles for the current view.
        
        Args:
            game_state: Current game state
            
        Returns:
            List of isometric tiles
        """
        tiles = []
        player_x = game_state.position.x
        player_y = game_state.position.y
        
        # Generate tiles in a diamond pattern around the player
        for dx in range(-self.view_radius, self.view_radius + 1):
            for dy in range(-self.view_radius, self.view_radius + 1):
                # Check if within diamond bounds
                if abs(dx) + abs(dy) > self.view_radius:
                    continue
                
                world_x = player_x + dx
                world_y = player_y + dy
                coordinate = Coordinate(world_x, world_y, 0)
                
                # Convert to screen coordinates
                screen_x, screen_y = self.world_to_screen(world_x, world_y)
                
                # Skip if outside viewport
                if (screen_x < 0 or screen_x >= self.width or 
                    screen_y < 0 or screen_y >= self.height):
                    continue
                
                # Get chunk data
                chunk = self.world_ledger.get_chunk(coordinate, 0)
                
                # Check for entities first (highest priority)
                entity_data = self.get_entity_at(coordinate, game_state)
                if entity_data:
                    entity_char, entity_color, entity_type = entity_data
                    tile = IsometricTile(
                        coordinate=coordinate,
                        screen_x=screen_x,
                        screen_y=screen_y,
                        content=entity_char,
                        color=entity_color,
                        z_order=1000,  # Entities always on top
                        entity_type=entity_type,
                        description=f"{entity_type} at ({world_x}, {world_y})"
                    )
                else:
                    # Get tile content
                    tile_content, tile_color = self.get_tile_content(chunk, coordinate)
                    z_order = world_x + world_y  # Simple depth ordering
                    
                    tile = IsometricTile(
                        coordinate=coordinate,
                        screen_x=screen_x,
                        screen_y=screen_y,
                        content=tile_content,
                        color=tile_color,
                        z_order=z_order,
                        entity_type="tile",
                        description=f"Tile at ({world_x}, {world_y})"
                    )
                
                tiles.append(tile)
        
        # Sort by z-order (back to front)
        tiles.sort(key=lambda t: (t.z_order, t.screen_y, t.screen_x))
        
        return tiles
    
    def render_frame(self, game_state: GameState) -> List[List[str]]:
        """
        Render the isometric view frame.
        
        Args:
            game_state: Current game state
            
        Returns:
            2D array representing the rendered frame
        """
        # Clear buffer
        self.buffer = [[" " for _ in range(self.height)] for _ in range(self.width)]
        
        # Generate tiles
        self.tiles = self.generate_tiles(game_state)
        
        # Render tiles to buffer (back to front)
        for tile in self.tiles:
            if (0 <= tile.screen_x < self.width and 
                0 <= tile.screen_y < self.height):
                try:
                    self.buffer[tile.screen_y][tile.screen_x] = tile.content
                except IndexError:
                    # Skip if coordinates are out of bounds
                    continue
        
        return self.buffer
    
    def get_frame_as_string(self, buffer: List[List[str]]) -> str:
        """
        Convert the render buffer to a string.
        
        Args:
            buffer: 2D array representing the frame
            
        Returns:
            String representation of the frame
        """
        return '\n'.join(''.join(row) for row in buffer)
    
    def get_tile_at_screen_pos(self, screen_x: int, screen_y: int) -> Optional[IsometricTile]:
        """
        Get tile information at a specific screen position.
        
        Args:
            screen_x: Screen X coordinate
            screen_y: Screen Y coordinate
            
        Returns:
            IsometricTile at the position or None
        """
        for tile in self.tiles:
            if tile.screen_x == screen_x and tile.screen_y == screen_y:
                return tile
        return None
    
    def get_adjacent_entities(self, game_state: GameState) -> List[IsometricTile]:
        """
        Get entities adjacent to the player.
        
        Args:
            game_state: Current game state
            
        Returns:
            List of adjacent entity tiles
        """
        player_x = game_state.position.x
        player_y = game_state.position.y
        
        adjacent_entities = []
        
        # Check 8 directions around player
        directions = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]
        
        for dx, dy in directions:
            world_x = player_x + dx
            world_y = player_y + dy
            coordinate = Coordinate(world_x, world_y, 0)
            
            entity_data = self.get_entity_at(coordinate, game_state)
            if entity_data:
                entity_char, entity_color, entity_type = entity_data
                screen_x, screen_y = self.world_to_screen(world_x, world_y)
                
                tile = IsometricTile(
                    coordinate=coordinate,
                    screen_x=screen_x,
                    screen_y=screen_y,
                    content=entity_char,
                    color=entity_color,
                    z_order=1000,
                    entity_type=entity_type,
                    description=f"Adjacent {entity_type} at ({world_x}, {world_y})"
                )
                adjacent_entities.append(tile)
        
        return adjacent_entities
    
    def get_viewport_summary(self) -> Dict[str, Any]:
        """Get summary of the isometric viewport configuration."""
        return {
            "width": self.width,
            "height": self.height,
            "view_radius": self.view_radius,
            "char_width": self.char_width,
            "char_height": self.char_height,
            "tile_types": list(self.tile_chars.keys()),
            "entity_types": list(self.entity_chars.keys()),
            "color_schemes": {
                "tiles": self.tile_colors,
                "entities": self.entity_colors
            },
            "distance_thresholds": self.distance_thresholds,
            "shape_avatar_enabled": True
        }
    
    def get_shape_legend(self) -> str:
        """Get the shape language legend."""
        return self.shape_avatar.generate_shape_legend()
    
    def get_player_shape_description(self, game_state: GameState) -> str:
        """Get the player's shape-based character description."""
        return self.shape_avatar.get_character_description(game_state.player.attributes)


# Export for use by game engine
__all__ = ["IsometricRenderer", "IsometricTile"]
