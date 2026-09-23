"""
Sprite Animation Engine - The "Beat" and "Flicker" System

Procedural animation system for lo-fi sprites with:
- Idle animation beat
- Newtonian ghosting effects
- Energy-based flicker
- Frame interpolation
"""

import time
import random
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT


class AnimationState(str, Enum):
    """Animation states for sprites"""
    IDLE = "idle"
    ACTIVE = "active"
    DAMAGED = "damaged"
    DESTROYED = "destroyed"
    GHOSTING = "ghosting"


@dataclass
class AnimationFrame:
    """Single animation frame"""
    sprite_data: bytes
    duration: float  # Seconds to display
    offset_x: int = 0
    offset_y: int = 0
    
    def __post_init__(self):
        if self.duration <= 0:
            self.duration = 0.1  # Default frame duration


@dataclass
class AnimationSequence:
    """Sequence of animation frames"""
    name: str
    frames: List[AnimationFrame]
    loop: bool = True
    state: AnimationState = AnimationState.IDLE
    
    def __post_init__(self):
        if not self.frames:
            # Create default frame if empty
            self.frames = [AnimationFrame(b'', 0.1)]
    
    def get_total_duration(self) -> float:
        """Get total duration of animation sequence"""
        return sum(frame.duration for frame in self.frames)
    
    def get_frame_at_time(self, elapsed_time: float) -> AnimationFrame:
        """Get frame at specific time in animation"""
        if not self.frames:
            return self.frames[0] if self.frames else AnimationFrame(b'', 0.1)
        
        total_duration = self.get_total_duration()
        
        if self.loop:
            elapsed_time = elapsed_time % total_duration
        
        # Find current frame
        current_time = 0.0
        for frame in self.frames:
            if current_time <= elapsed_time < current_time + frame.duration:
                return frame
            current_time += frame.duration
        
        # Return last frame as fallback
        return self.frames[-1]


class SpriteAnimator:
    """Procedural sprite animator with beat and flicker effects"""
    
    def __init__(self):
        self.animations: Dict[str, AnimationSequence] = {}
        self.current_animation: Optional[str] = None
        self.animation_start_time: float = 0.0
        self.energy_level: float = 100.0
        
        # Animation parameters
        self.idle_beat_frequency = 2.0  # Hz - idle animation speed
        self.flicker_intensity = 0.3     # Energy-based flicker
        self.ghost_alpha = 0.5           # Ghosting transparency
        
    def register_animation(self, name: str, sequence: AnimationSequence) -> None:
        """Register animation sequence"""
        self.animations[name] = sequence
        logger.debug(f"📽️ Registered animation: {name}")
    
    def play_animation(self, name: str, force_restart: bool = False) -> None:
        """Play animation"""
        if name not in self.animations:
            logger.warning(f"⚠️ Animation not found: {name}")
            return
        
        if self.current_animation != name or force_restart:
            self.current_animation = name
            self.animation_start_time = time.time()
            logger.debug(f"▶️ Playing animation: {name}")
    
    def update(self, dt: float) -> Optional[AnimationFrame]:
        """Update animation and return current frame"""
        if not self.current_animation:
            return None
        
        sequence = self.animations[self.current_animation]
        elapsed_time = time.time() - self.animation_start_time
        
        frame = sequence.get_frame_at_time(elapsed_time)
        
        # Apply energy-based effects
        frame = self._apply_energy_effects(frame)
        
        return frame
    
    def _apply_energy_effects(self, frame: AnimationFrame) -> AnimationFrame:
        """Apply energy-based flicker and ghosting"""
        # Energy-based flicker
        if self.energy_level < 50.0:
            # Increase flicker when low energy
            flicker_chance = (50.0 - self.energy_level) / 100.0 * self.flicker_intensity
            
            if random.random() < flicker_chance:
                # Create flicker effect by reducing duration
                frame = AnimationFrame(
                    frame.sprite_data,
                    frame.duration * 0.5,  # Shorter duration = flicker
                    frame.offset_x,
                    frame.offset_y
                )
        
        return frame
    
    def set_energy_level(self, energy: float) -> None:
        """Set energy level for flicker effects"""
        self.energy_level = max(0.0, min(100.0, energy))
    
    def create_idle_animation(self, sprite_data: bytes, beat_count: int = 4) -> AnimationSequence:
        """Create idle animation with beat effect"""
        frames = []
        beat_duration = 1.0 / self.idle_beat_frequency
        
        for i in range(beat_count):
            # Add subtle offset for beat effect
            offset_x = int(math.sin(i * 2 * math.pi / beat_count) * 2)
            offset_y = int(math.cos(i * 2 * math.pi / beat_count) * 1)
            
            frames.append(AnimationFrame(
                sprite_data,
                beat_duration,
                offset_x,
                offset_y
            ))
        
        return AnimationSequence("idle", frames, loop=True)
    
    def create_damage_animation(self, sprite_data: bytes, flicker_frames: int = 6) -> AnimationSequence:
        """Create damage flicker animation"""
        frames = []
        
        for i in range(flicker_frames):
            # Rapid flicker effect
            duration = 0.05 if i % 2 == 0 else 0.1
            frames.append(AnimationFrame(sprite_data, duration))
        
        return AnimationSequence("damage", frames, loop=False)
    
    def create_ghost_animation(self, sprite_data: bytes, fade_duration: float = 1.0) -> AnimationSequence:
        """Create ghosting fade animation"""
        frames = []
        frame_count = 10
        
        for i in range(frame_count):
            # Gradual fade
            alpha = self.ghost_alpha * (1.0 - i / frame_count)
            duration = fade_duration / frame_count
            
            # Apply alpha to sprite data (simplified)
            modified_data = sprite_data  # In real implementation, apply alpha
            
            frames.append(AnimationFrame(modified_data, duration))
        
        return AnimationSequence("ghost", frames, loop=False)


class NewtonianGhostRenderer:
    """Newtonian ghosting effects for toroidal wrap"""
    
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.ghost_buffer: Optional[bytearray] = None
        
    def render_ghosts(self, main_position: Tuple[int, int], sprite_data: bytes, 
                     frame_buffer: bytearray, alpha: float = 0.5) -> None:
        """Render Newtonian ghosts at wrapped positions"""
        if not sprite_data or not frame_buffer:
            return
        
        # Calculate wrapped positions
        ghost_positions = self._get_wrapped_positions(main_position, sprite_data)
        
        for ghost_pos in ghost_positions[1:]:  # Skip main position
            self._render_sprite_at_position(ghost_pos, sprite_data, frame_buffer, alpha)
    
    def _get_wrapped_positions(self, position: Tuple[int, int], sprite_data: bytes) -> List[Tuple[int, int]]:
        """Get all wrapped positions for ghosting"""
        positions = [position]
        x, y = position
        
        # Estimate sprite size (simplified)
        sprite_size = int(len(sprite_data) ** 0.5)
        
        # Check boundaries and add wrapped positions
        if x < sprite_size:
            positions.append((x + self.width, y))
        if x >= self.width - sprite_size:
            positions.append((x - self.width, y))
        if y < sprite_size:
            positions.append((x, y + self.height))
        if y >= self.height - sprite_size:
            positions.append((x, y - self.height))
        
        return positions
    
    def _render_sprite_at_position(self, position: Tuple[int, int], sprite_data: bytes, 
                                 frame_buffer: bytearray, alpha: float) -> None:
        """Render sprite at specific position with alpha"""
        x, y = position
        
        # Simplified rendering (real implementation would handle sprite dimensions)
        for i, byte_val in enumerate(sprite_data):
            if x + i < self.width and y < self.height:
                buffer_index = y * self.width + (x + i)
                if 0 <= buffer_index < len(frame_buffer):
                    # Apply alpha blending
                    current = frame_buffer[buffer_index]
                    blended = int(current * (1 - alpha) + byte_val * alpha)
                    frame_buffer[buffer_index] = blended


# Factory functions
def create_sprite_animator() -> SpriteAnimator:
    """Create sprite animator with default settings"""
    return SpriteAnimator()


def create_ghost_renderer(width: int, height: int) -> NewtonianGhostRenderer:
    """Create Newtonian ghost renderer"""
    return NewtonianGhostRenderer(width, height)
