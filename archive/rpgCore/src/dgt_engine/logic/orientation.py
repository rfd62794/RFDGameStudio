"""
Player Orientation System

Phase 6: Spatial Tactical Depth Implementation
Adds directional orientation to the GameState for 3D rendering.

ADR 023: The ASCII-Raycast Viewport Implementation
"""

import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

from loguru import logger
from dgt_engine.game_engine.world_ledger import Coordinate


@dataclass
class Orientation:
    """Player orientation in 3D space."""
    angle: float  # Facing angle in degrees (0-360)
    position_x: float
    position_y: float
    
    def get_direction_vector(self) -> Tuple[float, float]:
        """Get the forward direction vector."""
        angle_rad = math.radians(self.angle)
        return (math.cos(angle_rad), math.sin(angle_rad))
    
    def get_right_vector(self) -> Tuple[float, float]:
        """Get the right direction vector."""
        angle_rad = math.radians(self.angle + 90)
        return (math.cos(angle_rad), math.sin(angle_rad))
    
    def rotate(self, delta_angle: float) -> 'Orientation':
        """Rotate by delta angle and return new orientation."""
        new_angle = (self.angle + delta_angle) % 360
        return Orientation(new_angle, self.position_x, self.position_y)
    
    def move_forward(self, distance: float) -> Coordinate:
        """Move forward by distance and return new position."""
        direction = self.get_direction_vector()
        new_x = self.position_x + direction[0] * distance
        new_y = self.position_y + direction[1] * distance
        return Coordinate(int(new_x), int(new_y), 0)
    
    def move_backward(self, distance: float) -> Coordinate:
        """Move backward by distance and return new position."""
        direction = self.get_direction_vector()
        new_x = self.position_x - direction[0] * distance
        new_y = self.position_y - direction[1] * distance
        return Coordinate(int(new_x), int(new_y), 0)
    
    def move_left(self, distance: float) -> Coordinate:
        """Move left by distance and return new position."""
        right_vector = self.get_right_vector()
        new_x = self.position_x - right_vector[0] * distance
        new_y = self.position_y - right_vector[1] * distance
        return Coordinate(int(new_x), int(new_y), 0)
    
    def move_right(self, distance: float) -> Coordinate:
        """Move right by distance and return new position."""
        right_vector = self.get_right_vector()
        new_x = self.position_x + right_vector[0] * distance
        new_y = self.position_y + right_vector[1] * distance
        return Coordinate(int(new_x), int(new_y), 0)


class OrientationManager:
    """
    Manages player orientation and movement in 3D space.
    
    Provides directional movement for the ASCII-Doom renderer.
    """
    
    def __init__(self):
        """Initialize the orientation manager."""
        self.current_orientation = Orientation(0, 0, 0)  # Facing north at origin
        self.turn_speed = 15.0  # Degrees per turn action
        self.move_speed = 1.0   # Units per move action
        
        logger.info("Orientation Manager initialized")
    
    def set_position(self, x: float, y: float, angle: float = None):
        """Set the current position and optionally angle."""
        self.current_orientation.position_x = x
        self.current_orientation.position_y = y
        if angle is not None:
            self.current_orientation.angle = angle % 360
    
    def turn_left(self) -> Orientation:
        """Turn left and return new orientation."""
        new_orientation = self.current_orientation.rotate(-self.turn_speed)
        self.current_orientation = new_orientation
        logger.debug(f"Turned left: {new_orientation.angle}°")
        return new_orientation
    
    def turn_right(self) -> Orientation:
        """Turn right and return new orientation."""
        new_orientation = self.current_orientation.rotate(self.turn_speed)
        self.current_orientation = new_orientation
        logger.debug(f"Turned right: {new_orientation.angle}°")
        return new_orientation
    
    def move_forward(self) -> Coordinate:
        """Move forward and return new position."""
        new_position = self.current_orientation.move_forward(self.move_speed)
        self.current_orientation.position_x = new_position.x
        self.current_orientation.position_y = new_position.y
        logger.debug(f"Moved forward to: ({new_position.x}, {new_position.y})")
        return new_position
    
    def move_backward(self) -> Coordinate:
        """Move backward and return new position."""
        new_position = self.current_orientation.move_backward(self.move_speed)
        self.current_orientation.position_x = new_position.x
        self.current_orientation.position_y = new_position.y
        logger.debug(f"Moved backward to: ({new_position.x}, {new_position.y})")
        return new_position
    
    def move_left(self) -> Coordinate:
        """Move left and return new position."""
        new_position = self.current_orientation.move_left(self.move_speed)
        self.current_orientation.position_x = new_position.x
        self.current_orientation.position_y = new_position.y
        logger.debug(f"Moved left to: ({new_position.x}, {new_position.y})")
        return new_position
    
    def move_right(self) -> Coordinate:
        """Move right and return new position."""
        new_position = self.current_orientation.move_right(self.move_speed)
        self.current_orientation.position_x = new_position.x
        self.current_orientation.position_y = new_position.y
        logger.debug(f"Moved right to: ({new_position.x}, {new_position.y})")
        return new_position
    
    def get_orientation(self) -> Orientation:
        """Get the current orientation."""
        return self.current_orientation
    
    def get_facing_direction(self) -> str:
        """Get a human-readable facing direction."""
        angle = self.current_orientation.angle
        
        if 337.5 <= angle or angle < 22.5:
            return "North"
        elif 22.5 <= angle < 67.5:
            return "Northeast"
        elif 67.5 <= angle < 112.5:
            return "East"
        elif 112.5 <= angle < 157.5:
            return "Southeast"
        elif 157.5 <= angle < 202.5:
            return "South"
        elif 202.5 <= angle < 247.5:
            return "Southwest"
        elif 247.5 <= angle < 292.5:
            return "West"
        else:  # 292.5 <= angle < 337.5
            return "Northwest"
    
    def get_position(self) -> Coordinate:
        """Get the current position as a Coordinate."""
        return Coordinate(
            int(self.current_orientation.position_x),
            int(self.current_orientation.position_y),
            0
        )
    
    def set_turn_speed(self, speed: float):
        """Set the turn speed in degrees."""
        self.turn_speed = speed
        logger.debug(f"Turn speed set to: {speed}°")
    
    def set_move_speed(self, speed: float):
        """Set the move speed in units."""
        self.move_speed = speed
        logger.debug(f"Move speed set to: {speed} units")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current orientation status."""
        return {
            "angle": self.current_orientation.angle,
            "direction": self.get_facing_direction(),
            "position": (self.current_orientation.position_x, self.current_orientation.position_y),
            "turn_speed": self.turn_speed,
            "move_speed": self.move_speed
        }


# Export for use by game engine
__all__ = ["OrientationManager", "Orientation"]
