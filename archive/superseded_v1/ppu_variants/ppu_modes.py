"""
PPU Modes - Multi-Mode Viewport Protocol
ADR 078: The Multi-Mode Viewport Protocol

Defines spatial layouts for OVERWORLD (top-down) and COMBAT (side-view) rendering.
"""

from enum import Enum
from typing import Tuple, Dict, List, Optional
from dataclasses import dataclass

class PPUMode(Enum):
    """PPU rendering modes"""
    OVERWORLD = "overworld"  # Top-down world view
    COMBAT = "combat"        # Side-view battle view
    DIALOGUE = "dialogue"    # Dialogue box view
    MENU = "menu"           # Menu interface view

@dataclass
class ViewportLayout:
    """Viewport layout configuration"""
    canvas_width: int
    canvas_height: int
    tile_size: int
    camera_offset: Tuple[int, int]
    
class PPULayouts:
    """Predefined layout configurations"""
    
    # Classic RPG dimensions
    CANVAS_WIDTH = 160
    CANVAS_HEIGHT = 144
    TILE_SIZE = 8
    
    # Overworld (Top-down) Layout
    OVERWORLD = ViewportLayout(
        canvas_width=CANVAS_WIDTH,
        canvas_height=CANVAS_HEIGHT,
        tile_size=TILE_SIZE,
        camera_offset=(80, 72)  # Center of canvas
    )
    
    # Combat (Side-view) Layout
    COMBAT = ViewportLayout(
        canvas_width=CANVAS_WIDTH,
        canvas_height=CANVAS_HEIGHT,
        tile_size=TILE_SIZE,
        camera_offset=(80, 72)  # Center of canvas
    )
    
    @classmethod
    def get_layout(cls, mode: PPUMode) -> ViewportLayout:
        """Get layout configuration for mode"""
        if mode == PPUMode.OVERWORLD:
            return cls.OVERWORLD
        elif mode == PPUMode.COMBAT:
            return cls.COMBAT
        else:
            return cls.OVERWORLD  # Default to overworld

class CombatPositions:
    """Combat-specific positioning for side-view layout"""
    
    # Side-view positions (160x144 canvas)
    VOYAGER_LEFT = (20, 72)      # Left side, centered vertically
    GUARDIAN_RIGHT = (140, 72)   # Right side, centered vertically
    
    # Combat HUD area (bottom 32 pixels)
    HUD_TOP = 112
    HUD_HEIGHT = 32
    
    # HP bar positions
    VOYAGER_HP_BAR = (10, 118)
    GUARDIAN_HP_BAR = (90, 118)
    
    # Roll display area
    ROLL_DISPLAY = (60, 130)
    
    @classmethod
    def get_combat_positions(cls) -> Dict[str, Tuple[int, int]]:
        """Get all combat positions"""
        return {
            "voyager": cls.VOYAGER_LEFT,
            "guardian": cls.GUARDIAN_RIGHT,
            "voyager_hp": cls.VOYAGER_HP_BAR,
            "guardian_hp": cls.GUARDIAN_HP_BAR,
            "roll_display": cls.ROLL_DISPLAY
        }

class AnimationFrames:
    """Animation frame definitions"""
    
    # Lunge animation offsets
    LUNGE_DISTANCE = 5
    LUNGE_FRAMES = [
        0,   # Start position
        2,   # Begin lunge
        5,   # Peak lunge
        2,   # Retreating
        0    # End position
    ]
    
    # Screen flash colors
    FLASH_COLORS = [
        "#FFFFFF",  # White
        "#FFFF00",  # Yellow
        "#FF8800",  # Orange
        "#FF0000",  # Red
        "#880000",  # Dark red
        "#000000",  # Black
        "#000000",  # Black (hold)
        "#000000",  # Black (hold)
        "#000000",  # Black (hold)
        "#000000",  # Black (hold)
        "#000000",  # Black (hold)
        "#880000",  # Dark red
        "#FF0000",  # Red
        "#FF8800",  # Orange
        "#FFFF00",  # Yellow
        "#FFFFFF",  # White
        "#000000",  # Black (back to normal)
    ]
    
    @classmethod
    def get_lunge_sequence(cls, attacker_pos: Tuple[int, int], defender_pos: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Get lunge animation positions for attacker"""
        positions = []
        
        # Calculate direction vector
        dx = defender_pos[0] - attacker_pos[0]
        
        for offset in cls.LUNGE_FRAMES:
            if dx > 0:  # Moving right
                new_x = attacker_pos[0] + offset
            else:  # Moving left
                new_x = attacker_pos[0] - offset
            
            positions.append((new_x, attacker_pos[1]))
        
        return positions

class SpriteOrientations:
    """Sprite facing directions for different modes"""
    
    # Overworld orientations (top-down)
    OVERWORLD_DIRECTIONS = ["north", "south", "east", "west"]
    
    # Combat orientations (side-view)
    COMBAT_DIRECTIONS = {
        "voyager": "left",      # Voyager faces right (toward enemy)
        "guardian": "right",    # Guardian faces left (toward enemy)
        "enemy_left": "right",  # Enemy on left faces right
        "enemy_right": "left"   # Enemy on right faces left
    }
    
    @classmethod
    def get_combat_orientation(cls, entity_type: str, side: str) -> str:
        """Get sprite orientation for combat"""
        if entity_type == "voyager":
            return "right"  # Voyager always faces right in combat
        elif entity_type == "guardian":
            return "left"   # Guardian always faces left in combat
        elif side == "left":
            return "right"
        else:
            return "left"

class PPUTransitionEffects:
    """Visual effects for mode transitions"""
    
    @staticmethod
    def get_screen_flash_frames() -> List[str]:
        """Get screen flash color sequence"""
        return AnimationFrames.FLASH_COLORS
    
    @staticmethod
    def get_transition_duration() -> int:
        """Get transition duration in frames"""
        return len(AnimationFrames.FLASH_COLORS)
    
    @staticmethod
    def should_flash_for_transition(from_mode: PPUMode, to_mode: PPUMode) -> bool:
        """Check if transition should have flash effect"""
        # Flash when entering combat from overworld
        return (from_mode == PPUMode.OVERWORLD and to_mode == PPUMode.COMBAT) or \
               (from_mode == PPUMode.COMBAT and to_mode == PPUMode.OVERWORLD)
