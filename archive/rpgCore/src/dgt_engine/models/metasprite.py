"""
Metasprite System - Game Boy Hardware Parity

ADR 036: The Metasprite & Tile-Bank System
Implements 16x16 pixel actors assembled from 8x8 tiles (Object Layer).
"""

from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from engines.graphics.pixel_renderer import Pixel, ColorPalette
from engines.graphics.tile_bank import TileBank, TileType


class SpriteTilePosition(Enum):
    """Positions of tiles in a 16x16 metasprite."""
    HEAD_TOP = "head_top"        # (0,0) to (7,7)
    HEAD_BOTTOM = "head_bottom"  # (0,8) to (7,15)
    BODY_TOP = "body_top"        # (8,0) to (15,7)
    BODY_BOTTOM = "body_bottom"  # (8,8) to (15,15)
    LEFT_ARM = "left_arm"        # (0,0) to (7,7)
    RIGHT_ARM = "right_arm"      # (8,0) to (15,7)
    LEFT_LEG = "left_leg"        # (0,8) to (7,15)
    RIGHT_LEG = "right_leg"      # (8,8) to (15,15)
    ACCESSORY = "accessory"      # (4,4) to (11,11) - Center overlay


class CharacterRole(Enum):
    """Character roles for metasprite assembly."""
    VOYAGER = "voyager"
    WARRIOR = "warrior"
    ROGUE = "rogue"
    MAGE = "mage"
    CLERIC = "cleric"
    RANGER = "ranger"
    MERCHANT = "merchant"
    GUARD = "guard"
    VILLAGER = "villager"
    ANIMAL = "animal"


@dataclass
class MetaspriteTile:
    """Single 8x8 tile in a metasprite."""
    tile_key: str
    position_x: int  # 0-7 within metasprite
    position_y: int  # 0-7 within metasprite
    transparent_color: int = 0  # Game Boy Color 0
    priority: int = 0  # Rendering priority
    flip_horizontal: bool = False
    flip_vertical: bool = False


@dataclass
class MetaspriteConfig:
    """Configuration for metasprite assembly."""
    role: CharacterRole
    width: int = 16
    height: int = 16
    facing_direction: str = "down"  # up, down, left, right
    animation_frame: int = 0
    equipment: Dict[str, str] = None  # head, body, weapon, etc.
    color_scheme: str = "default"
    transparent_color: int = 0


class Metasprite:
    """
    16x16 pixel metasprite assembled from 8x8 tiles.
    
    Mimics Game Boy Object sprites with transparency and animation.
    """
    
    def __init__(self, config: Optional[MetaspriteConfig] = None):
        """Initialize the metasprite."""
        self.config = config or MetaspriteConfig(CharacterRole.VOYAGER)
        self.tile_bank = TileBank()
        self.tiles: Dict[str, MetaspriteTile] = {}
        self.pixel_buffer: List[List[Optional[Pixel]]] = None
        
        self._initialize_tile_templates()
        self._assemble_metasprite()
        
        logger.info(f"Metasprite initialized: {self.config.role.value}")
    
    def _initialize_tile_templates(self):
        """Initialize tile templates for different character roles."""
        
        # Voyager tiles (hero character)
        self._create_voyager_tiles()
        
        # Warrior tiles (heavy armor)
        self._create_warrior_tiles()
        
        # Rogue tiles (stealth character)
        self._create_rogue_tiles()
        
        # Mage tiles (spell caster)
        self._create_mage_tiles()
        
        # NPC tiles
        self._create_npc_tiles()
        
        # Animal tiles
        self._create_animal_tiles()
    
    def _create_voyager_tiles(self):
        """Create Voyager (hero) tile templates."""
        
        # Head top (hair/head)
        head_top = MetaspriteTile("voyager_head_top", 0, 0)
        self.tiles["head_top"] = head_top
        
        # Head bottom (face)
        head_bottom = MetaspriteTile("voyager_head_bottom", 0, 8)
        self.tiles["head_bottom"] = head_bottom
        
        # Body top (torso)
        body_top = MetaspriteTile("voyager_body_top", 8, 0)
        self.tiles["body_top"] = body_top
        
        # Body bottom (legs)
        body_bottom = MetaspriteTile("voyager_body_bottom", 8, 8)
        self.tiles["body_bottom"] = body_bottom
    
    def _create_warrior_tiles(self):
        """Create Warrior (heavy armor) tile templates."""
        
        # Head top (helmet)
        head_top = MetaspriteTile("warrior_helmet_top", 0, 0)
        self.tiles["head_top"] = head_top
        
        # Head bottom (helmet face)
        head_bottom = MetaspriteTile("warrior_helmet_bottom", 0, 8)
        self.tiles["head_bottom"] = head_bottom
        
        # Body top (armor torso)
        body_top = MetaspriteTile("warrior_armor_top", 8, 0)
        self.tiles["body_top"] = body_top
        
        # Body bottom (armor legs)
        body_bottom = MetaspriteTile("warrior_armor_bottom", 8, 8)
        self.tiles["body_bottom"] = body_bottom
    
    def _create_rogue_tiles(self):
        """Create Rogue (stealth) tile templates."""
        
        # Head top (hood)
        head_top = MetaspriteTile("rogue_hood_top", 0, 0)
        self.tiles["head_top"] = head_top
        
        # Head bottom (hood face)
        head_bottom = MetaspriteTile("rogue_hood_bottom", 0, 8)
        self.tiles["head_bottom"] = head_bottom
        
        # Body top (leather torso)
        body_top = MetaspriteTile("rogue_leather_top", 8, 0)
        self.tiles["body_top"] = body_top
        
        # Body bottom (leather legs)
        body_bottom = MetaspriteTile("rogue_leather_bottom", 8, 8)
        self.tiles["body_bottom"] = body_bottom
    
    def _create_mage_tiles(self):
        """Create Mage (spell caster) tile templates."""
        
        # Head top (hat)
        head_top = MetaspriteTile("mage_hat_top", 0, 0)
        self.tiles["head_top"] = head_top
        
        # Head bottom (hat face)
        head_bottom = MetaspriteTile("mage_hat_bottom", 0, 8)
        self.tiles["head_bottom"] = head_bottom
        
        # Body top (robe torso)
        body_top = MetaspriteTile("mage_robe_top", 8, 0)
        self.tiles["body_top"] = body_top
        
        # Body bottom (robe legs)
        body_bottom = MetaspriteTile("mage_robe_bottom", 8, 8)
        self.tiles["body_bottom"] = body_bottom
    
    def _create_npc_tiles(self):
        """Create NPC tile templates."""
        
        # Villager tiles
        villager_head_top = MetaspriteTile("villager_head_top", 0, 0)
        villager_head_bottom = MetaspriteTile("villager_head_bottom", 0, 8)
        villager_body_top = MetaspriteTile("villager_body_top", 8, 0)
        villager_body_bottom = MetaspriteTile("villager_body_bottom", 8, 8)
        
        # Guard tiles
        guard_head_top = MetaspriteTile("guard_helmet_top", 0, 0)
        guard_head_bottom = MetaspriteTile("guard_helmet_bottom", 0, 8)
        guard_body_top = MetaspriteTile("guard_armor_top", 8, 0)
        guard_body_bottom = MetaspriteTile("guard_armor_bottom", 8, 8)
        
        # Merchant tiles
        merchant_head_top = MetaspriteTile("merchant_hat_top", 0, 0)
        merchant_head_bottom = MetaspriteTile("merchant_hat_bottom", 0, 8)
        merchant_body_top = MetaspriteTile("merchant_clothes_top", 8, 0)
        merchant_body_bottom = MetaspriteTile("merchant_clothes_bottom", 8, 8)
    
    def _create_animal_tiles(self):
        """Create animal tile templates."""
        
        # Dog tiles
        dog_head_top = MetaspriteTile("dog_head_top", 0, 0)
        dog_head_bottom = MetaspriteTile("dog_head_bottom", 0, 8)
        dog_body_top = MetaspriteTile("dog_body_top", 8, 0)
        dog_body_bottom = MetaspriteTile("dog_body_bottom", 8, 8)
        
        # Cat tiles
        cat_head_top = MetaspriteTile("cat_head_top", 0, 0)
        cat_head_bottom = MetaspriteTile("cat_head_bottom", 0, 8)
        cat_body_top = MetaspriteTile("cat_body_top", 8, 0)
        cat_body_bottom = MetaspriteTile("cat_body_bottom", 8, 8)
        
        # Horse tiles
        horse_head_top = MetaspriteTile("horse_head_top", 0, 0)
        horse_head_bottom = MetaspriteTile("horse_head_bottom", 0, 8)
        horse_body_top = MetaspriteTile("horse_body_top", 8, 0)
        horse_body_bottom = MetaspriteTile("horse_body_bottom", 8, 8)
    
    def _assemble_metasprite(self):
        """Assemble the metasprite from tiles."""
        self.pixel_buffer = [[None for _ in range(self.config.width)] for _ in range(self.config.height)]
        
        # Get tiles based on character role
        role_tiles = self._get_role_tiles()
        
        # Place each tile in the correct position
        for tile_name, tile in role_tiles.items():
            if tile_name in self.tiles:
                self._place_tile(tile)
        
        # Apply facing direction
        self._apply_facing_direction()
        
        # Apply animation frame
        self._apply_animation_frame()
        
        # Apply equipment modifications
        self._apply_equipment()
    
    def _get_role_tiles(self) -> Dict[str, MetaspriteTile]:
        """Get tiles for the current character role."""
        
        if self.config.role == CharacterRole.VOYAGER:
            return {
                "head_top": self.tiles["head_top"],
                "head_bottom": self.tiles["head_bottom"],
                "body_top": self.tiles["body_top"],
                "body_bottom": self.tiles["body_bottom"]
            }
        
        elif self.config.role == CharacterRole.WARRIOR:
            return {
                "head_top": self.tiles["head_top"],
                "head_bottom": self.tiles["head_bottom"],
                "body_top": self.tiles["body_top"],
                "body_bottom": self.tiles["body_bottom"]
            }
        
        elif self.config.role == CharacterRole.ROGUE:
            return {
                "head_top": self.tiles["head_top"],
                "head_bottom": self.tiles["head_bottom"],
                "body_top": self.tiles["body_top"],
                "body_bottom": self.tiles["body_bottom"]
            }
        
        elif self.config.role == CharacterRole.MAGE:
            return {
                "head_top": self.tiles["head_top"],
                "head_bottom": self.tiles["head_bottom"],
                "body_top": self.tiles["body_top"],
                "body_bottom": self.tiles["body_bottom"]
            }
        
        # Default to Voyager tiles
        else:
            return {
                "head_top": self.tiles["head_top"],
                "head_bottom": self.tiles["head_bottom"],
                "body_top": self.tiles["body_top"],
                "body_bottom": self.tiles["body_bottom"]
            }
    
    def _place_tile(self, tile: MetaspriteTile):
        """Place a tile in the pixel buffer."""
        # Get the tile pattern from the tile bank
        tile_pattern = self.tile_bank.get_tile(tile.tile_key)
        
        if not tile_pattern:
            return
        
        # Copy tile pixels to the correct position
        for y in range(tile_pattern.height):
            for x in range(tile_pattern.width):
                tile_pixel = tile_pattern.pixels[y][x]
                
                if tile_pixel is not None:
                    # Apply transparency check
                    if tile_pixel.intensity > 0:  # Not transparent
                        buffer_x = tile.position_x + x
                        buffer_y = tile.position_y + y
                        
                        if (0 <= buffer_x < self.config.width and 
                            0 <= buffer_y < self.config.height):
                            
                            # Apply flipping if needed
                            final_x = buffer_x
                            final_y = buffer_y
                            
                            if tile.flip_horizontal:
                                final_x = tile.position_x + (tile_pattern.width - 1 - x)
                            
                            if tile.flip_vertical:
                                final_y = tile.position_y + (tile_pattern.height - 1 - y)
                            
                            self.pixel_buffer[final_y][final_x] = tile_pixel
    
    def _apply_facing_direction(self):
        """Apply facing direction transformations."""
        if self.config.facing_direction == "left":
            self._flip_horizontal()
        elif self.config.facing_direction == "right":
            # Right is the default, no flip needed
            pass
        elif self.config.facing_direction == "up":
            self._flip_vertical()
        elif self.config.facing_direction == "down":
            # Down is the default, no flip needed
            pass
    
    def _flip_horizontal(self):
        """Flip the sprite horizontally."""
        flipped_buffer = [[None for _ in range(self.config.width)] for _ in range(self.config.height)]
        
        for y in range(self.config.height):
            for x in range(self.config.width):
                flipped_buffer[y][self.config.width - 1 - x] = self.pixel_buffer[y][x]
        
        self.pixel_buffer = flipped_buffer
    
    def _flip_vertical(self):
        """Flip the sprite vertically."""
        flipped_buffer = [[None for _ in range(self.config.width)] for _ in range(self.config.height)]
        
        for y in range(self.config.height):
            for x in range(self.config.width):
                flipped_buffer[self.config.height - 1 - y][x] = self.pixel_buffer[y][x]
        
        self.pixel_buffer = flipped_buffer
    
    def _apply_animation_frame(self):
        """Apply animation frame modifications."""
        if self.config.animation_frame == 0:
            return  # No animation needed
        
        # Apply stepping animation for movement
        if self.config.animation_frame % 2 == 1:
            self._apply_stepping_animation()
        
        # Apply other frame-specific modifications
        if self.config.animation_frame % 4 == 2:
            self._apply_blink_animation()
    
    def _apply_stepping_animation(self):
        """Apply stepping animation to legs."""
        # Modify the bottom tiles to show movement
        for y in range(8, 16):  # Bottom half
            for x in range(self.config.width):
                if self.pixel_buffer[y][x] is not None:
                    # Shift pixel slightly to show movement
                    pixel = self.pixel_buffer[y][x]
                    # Add slight color variation for stepping
                    pixel.r = min(255, pixel.r + 10)
                    pixel.g = min(255, pixel.g + 10)
                    pixel.b = min(255, pixel.b + 10)
    
    def _apply_blink_animation(self):
        """Apply blink animation to eyes."""
        # Modify the head top tiles to show blinking
        for y in range(0, 8):  # Top half
            for x in range(self.config.width):
                if self.pixel_buffer[y][x] is not None:
                    pixel = self.pixel_buffer[y][x]
                    # Reduce intensity for blinking
                    pixel.intensity *= 0.5
    
    def _apply_equipment(self):
        """Apply equipment modifications."""
        if not self.config.equipment:
            return
        
        # Apply head equipment
        if "head" in self.config.equipment:
            self._apply_head_equipment(self.config.equipment["head"])
        
        # Apply body equipment
        if "body" in self.config.equipment:
            self._apply_body_equipment(self.config.equipment["body"])
        
        # Apply weapon
        if "weapon" in self.config.equipment:
            self._apply_weapon_equipment(self.config.equipment["weapon"])
    
    def _apply_head_equipment(self, equipment_type: str):
        """Apply head equipment modifications."""
        if equipment_type == "helmet":
            # Add helmet shine effect
            for y in range(0, 8):
                for x in range(self.config.width):
                    if self.pixel_buffer[y][x] is not None:
                        pixel = self.pixel_buffer[y][x]
                        # Add metallic shine
                        if (x + y) % 3 == 0:
                            pixel.r = min(255, pixel.r + 20)
                            pixel.g = min(255, pixel.g + 20)
                            pixel.b = min(255, pixel.b + 20)
        
        elif equipment_type == "hood":
            # Add hood shadow effect
            for y in range(0, 8):
                for x in range(self.config.width):
                    if self.pixel_buffer[y][x] is not None:
                        pixel = self.pixel_buffer[y][x]
                        # Darken for shadow
                        pixel.r = pixel.r * 0.8
                        pixel.g = pixel.g * 0.8
                        pixel.b = pixel.b * 0.8
    
    def _apply_body_equipment(self, equipment_type: str):
        """Apply body equipment modifications."""
        if equipment_type == "armor":
            # Add armor shine
            for y in range(8, 16):
                for x in range(self.config.width):
                    if self.pixel_buffer[y][x] is not None:
                        pixel = self.pixel_buffer[y][x]
                        # Add metallic shine
                        if (x % 4 == 0) and (y % 4 == 0):
                            pixel.r = min(255, pixel.r + 15)
                            pixel.g = min(255, pixel.g + 15)
                            pixel.b = min(255, pixel.b + 15)
        
        elif equipment_type == "robe":
            # Add robe texture
            for y in range(8, 16):
                for x in range(self.config.width):
                    if self.pixel_buffer[y][x] is not None:
                        pixel = self.pixel_buffer[y][x]
                        # Add fabric texture
                        if (x + y) % 5 == 0:
                            pixel.intensity *= 0.9
    
    def _apply_weapon_equipment(self, weapon_type: str):
        """Apply weapon modifications."""
        if weapon_type == "sword":
            # Add sword glint
            for y in range(self.config.height):
                for x in range(self.config.width):
                    if self.pixel_buffer[y][x] is not None:
                        pixel = self.pixel_buffer[y][x]
                        # Add metallic glint
                        if x >= 12:  # Right side (weapon)
                            pixel.r = min(255, pixel.r + 25)
                            pixel.g = min(255, pixel.g + 25)
                            pixel.b = min(255, pixel.b + 25)
        
        elif weapon_type == "staff":
            # Add magical glow
            for y in range(self.config.height):
                for x in range(self.config.width):
                    if self.pixel_buffer[y][x] is not None:
                        pixel = self.pixel_buffer[y][x]
                        # Add magical glow
                        if x >= 12:  # Right side (weapon)
                            pixel.r = min(255, pixel.r + 10)
                            pixel.b = min(255, pixel.b + 20)  # Blue tint
    
    def render_to_string(self) -> str:
        """
        Render the metasprite to a string using half-block characters.
        
        Returns:
            String representation of the metasprite
        """
        lines = []
        
        for y in range(0, self.config.height, 2):  # Process 2 rows at a time for half-blocks
            line = ""
            
            for x in range(self.config.width):
                top_pixel = self.pixel_buffer[y][x] if y < self.config.height else None
                bottom_pixel = self.pixel_buffer[y + 1][x] if y + 1 < self.config.height else None
                
                if top_pixel is None and bottom_pixel is None:
                    line += " "
                elif top_pixel is None and bottom_pixel is not None:
                    line += "▄"  # Bottom half-block
                elif top_pixel is not None and bottom_pixel is None:
                    line += "▀"  # Top half-block
                else:
                    # Both pixels present - use the brighter one
                    if top_pixel.intensity >= bottom_pixel.intensity:
                        line += "█"
                    else:
                        line += "▓"
            
            lines.append(line)
        
        return '\n'.join(lines)
    
    def get_pixel_data(self) -> List[List[Optional[Pixel]]]:
        """Get the raw pixel data."""
        return self.pixel_buffer
    
    def update_config(self, config: MetaspriteConfig) -> None:
        """Update the metasprite configuration."""
        self.config = config
        self._assemble_metasprite()
    
    def set_facing_direction(self, direction: str) -> None:
        """Set the facing direction."""
        self.config.facing_direction = direction
        self._apply_facing_direction()
    
    def set_animation_frame(self, frame: int) -> None:
        """Set the animation frame."""
        self.config.animation_frame = frame
        self._apply_animation_frame()
    
    def set_equipment(self, equipment: Dict[str, str]) -> None:
        """Set the equipment."""
        self.config.equipment = equipment
        self._apply_equipment()


# Export for use by other modules
__all__ = ["Metasprite", "MetaspriteConfig", "MetaspriteTile", "CharacterRole", "SpriteTilePosition"]
