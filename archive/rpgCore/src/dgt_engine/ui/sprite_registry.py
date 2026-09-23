"""
Sprite Registry - Pixel Art Character System

Stores and manages pixel art sprites for entities, items, and effects.
Supports 3x3 and 5x5 pixel sprites with faction-based coloring.
"""

import math
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from .pixel_renderer import Pixel, AnimatedSprite, SpriteFrame, ColorPalette


class SpriteType(Enum):
    """Types of sprites available in the registry."""
    VOYAGER = "voyager"
    WARRIOR = "warrior"
    ROGUE = "rogue"
    MAGE = "mage"
    MERCHANT = "merchant"
    GUARD = "guard"
    ITEM = "item"
    TREASURE = "treasure"
    DOOR = "door"
    WALL = "wall"
    EFFECT = "effect"


class AnimationType(Enum):
    """Types of sprite animations."""
    IDLE = "idle"
    WALK = "walk"
    ATTACK = "attack"
    CAST = "cast"
    DAMAGE = "damage"
    ROTATE = "rotate"


@dataclass
class SpriteTemplate:
    """Template for creating sprites with different colors."""
    name: str
    width: int
    height: int
    pixel_data: List[List[int]]  # 0 = empty, 1 = filled
    animation_frames: Optional[List[List[List[int]]]] = None
    frame_duration: float = 0.2
    
    def create_sprite(self, faction: str = "neutral", intensity: float = 1.0) -> AnimatedSprite:
        """
        Create an animated sprite from this template.
        
        Args:
            faction: Faction for color mapping
            intensity: Pixel intensity
            
        Returns:
            AnimatedSprite instance
        """
        base_color = ColorPalette.get_faction_color(faction, intensity)
        
        if self.animation_frames:
            # Create animated sprite
            frames = []
            for frame_data in self.animation_frames:
                frame_pixels = self._create_frame_pixels(frame_data, base_color)
                frames.append(SpriteFrame(frame_pixels, self.width, self.height))
            
            return AnimatedSprite(frames, self.frame_duration, loop=True)
        else:
            # Create single frame sprite
            frame_pixels = self._create_frame_pixels(self.pixel_data, base_color)
            frame = SpriteFrame(frame_pixels, self.width, self.height)
            return AnimatedSprite([frame], 1.0, loop=False)
    
    def _create_frame_pixels(self, pixel_data: List[List[int]], base_color: Pixel) -> List[List[Pixel]]:
        """Convert pixel data to colored pixels."""
        pixels = []
        for row in pixel_data:
            pixel_row = []
            for value in row:
                if value == 0:
                    pixel_row.append(Pixel())  # Empty pixel
                else:
                    pixel_row.append(base_color)  # Colored pixel
            pixels.append(pixel_row)
        return pixels


class SpriteRegistry:
    """
    Registry for pixel art sprites and animations.
    
    Provides pre-defined sprites for entities, items, and effects.
    """
    
    def __init__(self):
        """Initialize the sprite registry."""
        self.templates: Dict[str, SpriteTemplate] = {}
        self._register_default_sprites()
        
        logger.info(f"SpriteRegistry initialized with {len(self.templates)} templates")
    
    def _register_default_sprites(self) -> None:
        """Register default sprite templates."""
        
        # 3x3 Voyager Sprite (compact)
        self.register_template(SpriteTemplate(
            name="voyager_3x3",
            width=3,
            height=3,
            pixel_data=[
                [0, 1, 0],  #   ▀   (head)
                [1, 1, 1],  #  ▀▀▀  (body)
                [0, 1, 0],  #   ▀   (legs)
            ],
            animation_frames=[
                # Idle animation
                [
                    [0, 1, 0],
                    [1, 1, 1], 
                    [0, 1, 0]
                ],
                [
                    [0, 1, 0],
                    [1, 1, 1],
                    [1, 0, 1]  # Walking frame
                ],
                [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 1, 0]
                ],
                [
                    [0, 1, 0],
                    [1, 1, 1],
                    [1, 0, 1]  # Walking frame
                ]
            ],
            frame_duration=0.3
        ))
        
        # 5x5 Warrior Sprite
        self.register_template(SpriteTemplate(
            name="warrior_5x5",
            width=5,
            height=5,
            pixel_data=[
                [0, 0, 1, 0, 0],  #     ▀     
                [0, 1, 1, 1, 0],  #   ▀▀▀   
                [1, 1, 1, 1, 1],  # ▀▀▀▀▀ 
                [0, 1, 0, 1, 0],  #   ▀ ▀   
                [1, 0, 0, 0, 1],  # ▀   ▀   
            ],
            animation_frames=[
                # Attack animation
                [
                    [0, 0, 1, 0, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0],
                    [1, 0, 0, 0, 1]
                ],
                [
                    [0, 0, 1, 1, 0],  # Sword swing
                    [0, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0],
                    [1, 0, 0, 0, 1]
                ],
                [
                    [0, 0, 1, 0, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0],
                    [1, 0, 0, 0, 1]
                ]
            ],
            frame_duration=0.15
        ))
        
        # 5x5 Rogue Sprite
        self.register_template(SpriteTemplate(
            name="rogue_5x5",
            width=5,
            height=5,
            pixel_data=[
                [0, 1, 0, 1, 0],  #  ▀ ▀   
                [0, 1, 1, 1, 0],  #  ▀▀▀   
                [1, 1, 1, 1, 1],  # ▀▀▀▀▀ 
                [0, 1, 0, 1, 0],  #  ▀ ▀   
                [0, 1, 0, 1, 0],  #  ▀ ▀   
            ],
            animation_frames=[
                # Stealth animation
                [
                    [0, 1, 0, 1, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0]
                ],
                [
                    [0, 0, 1, 0, 0],  # Fade
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0],
                    [0, 0, 1, 0, 0]
                ],
                [
                    [0, 1, 0, 1, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0]
                ]
            ],
            frame_duration=0.4
        ))
        
        # 5x5 Mage Sprite
        self.register_template(SpriteTemplate(
            name="mage_5x5",
            width=5,
            height=5,
            pixel_data=[
                [0, 1, 1, 1, 0],  #  ▀▀▀   
                [1, 1, 1, 1, 1],  # ▀▀▀▀▀ 
                [0, 1, 1, 1, 0],  #  ▀▀▀   
                [0, 1, 0, 1, 0],  #  ▀ ▀   
                [1, 0, 0, 0, 1],  # ▀   ▀   
            ],
            animation_frames=[
                # Cast animation
                [
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 0],
                    [0, 1, 0, 1, 0],
                    [1, 0, 0, 0, 1]
                ],
                [
                    [0, 1, 1, 1, 1],  # Magic effect
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0],
                    [1, 0, 0, 0, 1]
                ],
                [
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 0],
                    [0, 1, 0, 1, 0],
                    [1, 0, 0, 0, 1]
                ]
            ],
            frame_duration=0.2
        ))
        
        # 3x3 Item Sprites
        self.register_template(SpriteTemplate(
            name="coin_3x3",
            width=3,
            height=3,
            pixel_data=[
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0]
            ]
        ))
        
        self.register_template(SpriteTemplate(
            name="potion_3x3",
            width=3,
            height=3,
            pixel_data=[
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 1]
            ]
        ))
        
        self.register_template(SpriteTemplate(
            name="sword_3x3",
            width=3,
            height=3,
            pixel_data=[
                [0, 0, 1],
                [0, 1, 1],
                [0, 0, 1]
            ]
        ))
        
        # 5x5 Environment Sprites
        self.register_template(SpriteTemplate(
            name="door_5x5",
            width=5,
            height=5,
            pixel_data=[
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ]
        ))
        
        self.register_template(SpriteTemplate(
            name="chest_5x5",
            width=5,
            height=5,
            pixel_data=[
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ]
        ))
        
        # Effect Sprites
        self.register_template(SpriteTemplate(
            name="explosion_5x5",
            width=5,
            height=5,
            pixel_data=[
                [0, 1, 0, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 1, 0, 1, 0]
            ],
            animation_frames=[
                [
                    [0, 1, 0, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 0, 1, 0]
                ],
                [
                    [1, 1, 1, 1, 1],
                    [1, 0, 0, 0, 1],
                    [1, 0, 0, 0, 1],
                    [1, 0, 0, 0, 1],
                    [1, 1, 1, 1, 1]
                ],
                [
                    [0, 0, 1, 0, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 0],
                    [0, 0, 1, 0, 0]
                ]
            ],
            frame_duration=0.1
        ))
    
    def register_template(self, template: SpriteTemplate) -> None:
        """
        Register a new sprite template.
        
        Args:
            template: Sprite template to register
        """
        self.templates[template.name] = template
        logger.debug(f"Registered sprite template: {template.name}")
    
    def get_sprite(self, template_name: str, faction: str = "neutral", intensity: float = 1.0) -> Optional[AnimatedSprite]:
        """
        Get a sprite from template.
        
        Args:
            template_name: Name of the template
            faction: Faction for coloring
            intensity: Pixel intensity
            
        Returns:
            AnimatedSprite instance or None if not found
        """
        template = self.templates.get(template_name)
        if template:
            return template.create_sprite(faction, intensity)
        
        logger.warning(f"Sprite template not found: {template_name}")
        return None
    
    def get_voyager_sprite(self, faction: str = "neutral", size: str = "3x3") -> Optional[AnimatedSprite]:
        """
        Get the Voyager sprite.
        
        Args:
            faction: Faction for coloring
            size: Sprite size ("3x3" or "5x5")
            
        Returns:
            Voyager sprite or None
        """
        template_name = f"voyager_{size}"
        return self.get_sprite(template_name, faction)
    
    def get_character_sprite(self, character_type: str, faction: str = "neutral") -> Optional[AnimatedSprite]:
        """
        Get a character sprite by type.
        
        Args:
            character_type: Type of character (warrior, rogue, mage)
            faction: Faction for coloring
            
        Returns:
            Character sprite or None
        """
        template_name = f"{character_type}_5x5"
        return self.get_sprite(template_name, faction)
    
    def get_item_sprite(self, item_type: str) -> Optional[AnimatedSprite]:
        """
        Get an item sprite by type.
        
        Args:
            item_type: Type of item (coin, potion, sword)
            
        Returns:
            Item sprite or None
        """
        template_name = f"{item_type}_3x3"
        return self.get_sprite(template_name, "neutral")
    
    def get_environment_sprite(self, env_type: str) -> Optional[AnimatedSprite]:
        """
        Get an environment sprite by type.
        
        Args:
            env_type: Type of environment object (door, chest)
            
        Returns:
            Environment sprite or None
        """
        template_name = f"{env_type}_5x5"
        return self.get_sprite(template_name, "neutral")
    
    def get_effect_sprite(self, effect_type: str) -> Optional[AnimatedSprite]:
        """
        Get an effect sprite by type.
        
        Args:
            effect_type: Type of effect (explosion)
            
        Returns:
            Effect sprite or None
        """
        template_name = f"{effect_type}_5x5"
        return self.get_sprite(template_name, "neutral")
    
    def list_templates(self) -> List[str]:
        """Get list of all registered template names."""
        return list(self.templates.keys())
    
    def create_custom_sprite(self, name: str, pixel_data: List[List[int]], 
                           animation_frames: Optional[List[List[List[int]]]] = None,
                           frame_duration: float = 0.2) -> SpriteTemplate:
        """
        Create a custom sprite template.
        
        Args:
            name: Template name
            pixel_data: 2D array of pixel data (0=empty, 1=filled)
            animation_frames: Optional animation frame data
            frame_duration: Duration per frame in seconds
            
        Returns:
            Created SpriteTemplate
        """
        height = len(pixel_data)
        width = len(pixel_data[0]) if height > 0 else 0
        
        template = SpriteTemplate(
            name=name,
            width=width,
            height=height,
            pixel_data=pixel_data,
            animation_frames=animation_frames,
            frame_duration=frame_duration
        )
        
        self.register_template(template)
        return template


# Export for use by other modules
__all__ = [
    "SpriteRegistry",
    "SpriteTemplate", 
    "SpriteType",
    "AnimationType"
]
