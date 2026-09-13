"""
Kinetic Sprite Controller - Living Sprite Heartbeat

ADR 037: The Kinetic Sprite Controller
State-driven animation system for equipment-aware idle animations and palette swapping.
"""

from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import time

from loguru import logger

from models.metasprite import Metasprite, MetaspriteConfig, CharacterRole
from engines.graphics.tile_bank import TileBank, TileType
from foundation.interfaces.visuals import AnimationState, SpriteCoordinate


# AnimationState is imported from foundation.interfaces.visuals


class EquipmentType(Enum):
    """Equipment types that affect animations."""
    NONE = "none"
    LIGHT_ARMOR = "light_armor"
    HEAVY_ARMOR = "heavy_armor"
    ROBES = "robes"
    CLOTHES = "clothes"
    HELMET = "helmet"
    HOOD = "hood"
    HAT = "hat"
    WEAPON_NONE = "weapon_none"
    WEAPON_LIGHT = "weapon_light"
    WEAPON_HEAVY = "weapon_heavy"
    WEAPON_STAFF = "weapon_staff"
    WEAPON_BOW = "weapon_bow"


class PaletteType(Enum):
    """Color palettes for different moods and areas."""
    DEFAULT = "default"
    DUNGEON = "dungeon"  # Greyscale/Blue (Cold, dangerous)
    TOWN = "town"        # Sepia/Gold (Warm, safe)
    ACTION = "action"      # High-contrast (Red/White for combat)
    FOREST = "forest"      # Green/Brown (Natural)
    WATER = "water"        # Blue/Cyan (Aquatic)
    FIRE = "fire"          # Red/Orange (Dangerous)
    MAGIC = "magic"        # Purple/Pink (Mystical)


@dataclass
class AnimationFrame:
    """Single animation frame with tile offsets."""
    frame_number: int
    tile_offsets: Dict[str, Tuple[int, int]]  # tile_name -> (x_offset, y_offset)
    duration: float = 0.5  # Duration in seconds
    intensity_modifiers: Dict[str, float] = field(default_factory=dict)  # tile_name -> intensity


@dataclass
class AnimationSequence:
    """Animation sequence for a specific state."""
    state: AnimationState
    frames: List[AnimationFrame]
    loop: bool = True
    equipment_modifiers: Dict[EquipmentType, List[AnimationFrame]] = field(default_factory=dict)


@dataclass
class KineticSpriteConfig:
    """Configuration for kinetic sprite behavior."""
    character_role: CharacterRole
    base_animation_speed: float = 1.0  # Animation speed multiplier
    breathing_enabled: bool = True
    shadow_enabled: bool = True
    palette_aware: bool = True
    equipment_aware: bool = True
    z_depth_priority: int = 0  # Lower = rendered on top


class KineticSpriteController:
    """
    State-driven animation controller for living sprites.
    
    Manages tile-swapping, palette-shifting, and equipment-aware animations
    to achieve Pokémon-level kinetic detail.
    """
    
    def __init__(self):
        """Initialize the kinetic sprite controller."""
        self.sprites: Dict[str, Metasprite] = {}
        self.animation_states: Dict[str, AnimationState] = {}
        self.current_palettes: Dict[str, PaletteType] = {}
        self.animation_sequences: Dict[AnimationState, AnimationSequence] = {}
        
        # Animation timing
        self.global_animation_speed = 1.0
        self.last_update_time = time.time()
        
        # Initialize animation sequences
        self._initialize_animation_sequences()
        
        logger.info("KineticSpriteController initialized with living sprite heartbeat")
    
    def _initialize_animation_sequences(self):
        """Initialize animation sequences for different states."""
        
        # Idle animation with breathing
        idle_frames = [
            AnimationFrame(
                frame_number=0,
                tile_offsets={"head_top": (0, 0), "head_bottom": (0, 0)},
                duration=0.75
            ),
            AnimationFrame(
                frame_number=1,
                tile_offsets={"head_top": (0, 1), "head_bottom": (0, 1)},
                duration=0.75
            ),
            AnimationFrame(
                frame_number=2,
                tile_offsets={"head_top": (0, 0), "head_bottom": (0, 0)},
                duration=0.75
            ),
            AnimationFrame(
                frame_number=3,
                tile_offsets={"head_top": (0, -1), "head_bottom": (0, -1)},
                duration=0.75
            )
        ]
        
        self.animation_sequences[AnimationState.IDLE] = AnimationSequence(
            state=AnimationState.IDLE,
            frames=idle_frames,
            loop=True
        )
        
        # Walking animation with stepping
        walking_frames = [
            AnimationFrame(
                frame_number=0,
                tile_offsets={"body_bottom": (0, 0)},
                duration=0.25
            ),
            AnimationFrame(
                frame_number=1,
                tile_offsets={"body_bottom": (1, 0)},
                duration=0.25
            ),
            AnimationFrame(
                frame_number=2,
                tile_offsets={"body_bottom": (0, 0)},
                duration=0.25
            ),
            AnimationFrame(
                frame_number=3,
                tile_offsets={"body_bottom": (-1, 0)},
                duration=0.25
            )
        ]
        
        self.animation_sequences[AnimationState.WALKING] = AnimationSequence(
            state=AnimationState.WALKING,
            frames=walking_frames,
            loop=True
        )
        
        # Combat animation with aggressive stance
        combat_frames = [
            AnimationFrame(
                frame_number=0,
                tile_offsets={"head_top": (0, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.2, "body_top": 1.1},
                duration=0.3
            ),
            AnimationFrame(
                frame_number=1,
                tile_offsets={"head_top": (1, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.3, "body_top": 1.2},
                duration=0.3
            ),
            AnimationFrame(
                frame_number=2,
                tile_offsets={"head_top": (0, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.1, "body_top": 1.0},
                duration=0.3
            ),
            AnimationFrame(
                frame_number=3,
                tile_offsets={"head_top": (-1, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.0, "body_top": 0.9},
                duration=0.3
            )
        ]
        
        self.animation_sequences[AnimationState.COMBAT] = AnimationSequence(
            state=AnimationState.COMBAT,
            frames=combat_frames,
            loop=True
        )
        
        # Casting animation with magical glow
        casting_frames = [
            AnimationFrame(
                frame_number=0,
                tile_offsets={"head_top": (0, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.0, "body_top": 1.0},
                duration=0.4
            ),
            AnimationFrame(
                frame_number=1,
                tile_offsets={"head_top": (0, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.3, "body_top": 1.2},
                duration=0.4
            ),
            AnimationFrame(
                frame_number=2,
                tile_offsets={"head_top": (0, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.6, "body_top": 1.4},
                duration=0.4
            ),
            AnimationFrame(
                frame_number=3,
                tile_offsets={"head_top": (0, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 1.2, "body_top": 1.1},
                duration=0.4
            )
        ]
        
        self.animation_sequences[AnimationState.CASTING] = AnimationSequence(
            state=AnimationState.CASTING,
            frames=casting_frames,
            loop=True
        )
        
        # Stealth animation with compressed profile
        stealth_frames = [
            AnimationFrame(
                frame_number=0,
                tile_offsets={"head_top": (0, 0), "body_top": (0, 0)},
                intensity_modifiers={"head_top": 0.8, "body_top": 0.7},
                duration=0.6
            ),
            AnimationFrame(
                frame_number=1,
                tile_offsets={"head_top": (0, 1), "body_top": (0, 1)},
                intensity_modifiers={"head_top": 0.6, "body_top": 0.5},
                duration=0.6
            )
        ]
        
        self.animation_sequences[AnimationState.STEALTH] = AnimationSequence(
            state=AnimationState.STEALTH,
            frames=stealth_frames,
            loop=True
        )
    
    def register_sprite(self, sprite_id: str, metasprite: Metasprite, config: KineticSpriteConfig) -> None:
        """
        Register a sprite for kinetic animation control.
        
        Args:
            sprite_id: Unique sprite identifier
            metasprite: Metasprite to animate
            config: Kinetic sprite configuration
        """
        self.sprites[sprite_id] = metasprite
        self.animation_states[sprite_id] = AnimationState.IDLE
        self.current_palettes[sprite_id] = PaletteType.DEFAULT
        
        logger.debug(f"Registered kinetic sprite: {sprite_id}")
    
    def set_animation_state(self, sprite_id: str, state: AnimationState) -> None:
        """
        Set the animation state for a sprite.
        
        Args:
            sprite_id: Sprite identifier
            state: New animation state
        """
        if sprite_id in self.sprites:
            self.animation_states[sprite_id] = state
            logger.debug(f"Set {sprite_id} animation state to {state.value}")
    
    def set_palette(self, sprite_id: str, palette: PaletteType) -> None:
        """
        Set the color palette for a sprite.
        
        Args:
            sprite_id: Sprite identifier
            palette: Color palette to use
        """
        if sprite_id in self.sprites:
            self.current_palettes[sprite_id] = palette
            logger.debug(f"Set {sprite_id} palette to {palette.value}")
    
    def update_animations(self, delta_time: float) -> None:
        """
        Update all registered sprite animations.
        
        Args:
            delta_time: Time since last update in seconds
        """
        current_time = time.time()
        
        for sprite_id, metasprite in self.sprites.items():
            if sprite_id in self.animation_states:
                state = self.animation_states[sprite_id]
                
                if state in self.animation_sequences:
                    sequence = self.animation_sequences[state]
                    
                    # Update animation frame
                    self._update_sprite_animation(metasprite, sequence, current_time)
        
        self.last_update_time = current_time
    
    def _update_sprite_animation(self, metasprite: Metasprite, sequence: AnimationSequence, current_time: float) -> None:
        """
        Update animation for a specific sprite.
        
        Args:
            metasprite: Metasprite to update
            sequence: Animation sequence to follow
            current_time: Current timestamp
        """
        # This is a simplified version - in production, you'd track frame timing
        # For now, we'll cycle through frames based on time
        frame_count = len(sequence.frames)
        if frame_count == 0:
            return
        
        # Calculate current frame based on time
        total_duration = sum(frame.duration for frame in sequence.frames)
        if total_duration == 0:
            return
        
        elapsed_time = current_time - self.last_update_time
        frame_index = int((elapsed_time / total_duration) * self.global_animation_speed) % frame_count
        
        current_frame = sequence.frames[frame_index]
        
        # Apply tile offsets
        self._apply_tile_offsets(metasprite, current_frame)
        
        # Apply intensity modifiers
        self._apply_intensity_modifiers(metasprite, current_frame)
    
    def _apply_tile_offsets(self, metasprite: Metasprite, frame: AnimationFrame) -> None:
        """
        Apply tile offsets for animation frame.
        
        Args:
            metasprite: Metasprite to modify
            frame: Animation frame with offsets
        """
        pixel_data = metasprite.get_pixel_data()
        
        # Create new pixel buffer with offsets applied
        new_pixel_data = [[None for _ in range(metasprite.config.width)] for _ in range(metasprite.config.height)]
        
        for tile_name, (offset_x, offset_y) in frame.tile_offsets.items():
            # Find the tile in the metasprite and apply offset
            # This is simplified - in production, you'd track tile positions
            for y in range(metasprite.config.height):
                for x in range(metasprite.config.width):
                    if pixel_data[y][x] is not None:
                        new_x = x + offset_x
                        new_y = y + offset_y
                        
                        if 0 <= new_x < metasprite.config.width and 0 <= new_y < metasprite.config.height:
                            if new_pixel_data[new_y][new_x] is None:
                                new_pixel_data[new_y][new_x] = pixel_data[y][x]
        
        # Update metasprite pixel data
        metasprite.pixel_buffer = new_pixel_data
    
    def _apply_intensity_modifiers(self, metasprite: Metasprite, frame: AnimationFrame) -> None:
        """
        Apply intensity modifiers for animation frame.
        
        Args:
            metasprite: Metasprite to modify
            frame: Animation frame with intensity modifiers
        """
        pixel_data = metasprite.get_pixel_data()
        
        for tile_name, modifier in frame.intensity_modifiers.items():
            # Find and modify pixels for this tile
            for y in range(metasprite.config.height):
                for x in range(metasprite.config.width):
                    if pixel_data[y][x] is not None:
                        pixel = pixel_data[y][x]
                        pixel.intensity *= modifier
                        pixel.intensity = min(1.0, pixel.intensity)  # Clamp to max intensity
    
    def create_shadow_sprite(self, x: int, y: int) -> SpriteCoordinate:
        """
        Create a shadow sprite for Z-depth effect.
        
        Args:
            x: Shadow X position
            y: Shadow Y position
            
        Returns:
            SpriteCoordinate for shadow
        """
        # Create a simple shadow metasprite
        shadow_config = MetaspriteConfig(
            role=CharacterRole.VILLAGER,  # Use villager as base
            width=8,
            height=8
        )
        
        shadow_metasprite = Metasprite(shadow_config)
        
        # Modify shadow to be dark and dithered
        pixel_data = shadow_metasprite.get_pixel_data()
        
        for py in range(8):
            for px in range(8):
                if pixel_data[py][px] is not None:
                    # Create dark dithered shadow
                    if (px + py) % 2 == 0:
                        pixel_data[py][px] = None  # Transparent
                    else:
                        pixel = pixel_data[py][px]
                        pixel.r = 50
                        pixel.g = 50
                        pixel.b = 50
                        pixel.intensity = 0.3
        
        shadow_metasprite.pixel_buffer = pixel_data
        
        return SpriteCoordinate(x, y, shadow_metasprite, priority=100)  # Low priority (rendered first)
    
    def get_sprite_info(self) -> Dict[str, Any]:
        """Get information about the kinetic sprite controller."""
        return {
            "registered_sprites": len(self.sprites),
            "animation_states": {sprite_id: state.value for sprite_id, state in self.animation_states.items()},
            "current_palettes": {sprite_id: palette.value for sprite_id, palette in self.current_palettes.items()},
            "animation_sequences": {state.value: len(sequence.frames) for state, sequence in self.animation_sequences.items()},
            "global_animation_speed": self.global_animation_speed
        }


# Export for use by other modules
__all__ = [
    "KineticSpriteController", "AnimationState", "SpriteCoordinate",
    "EquipmentType", "PaletteType",
    "AnimationFrame", "AnimationSequence", "KineticSpriteConfig"
]
