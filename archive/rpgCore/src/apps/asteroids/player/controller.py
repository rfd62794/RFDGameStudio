"""
Asteroids Player Controller
"""
import pygame
from src.apps.asteroids.entities.ship import Ship
from src.shared.input import InputController

class Controller(InputController):
    """Handles human input for the ship using shared InputController"""
    
    def define_actions(self):
        """Standard actions are already defined in defaults (up, down, left, right, fire)."""
        pass

    def apply_input(self, ship: Ship, dt: float):
        """Apply active actions to ship kinetics"""
        if not ship.alive: return
        
        thrust = 0.0
        rotation = 0.0
        
        # Check active actions
        if self.is_action_active("up"):
            thrust = 1.0
        elif self.is_action_active("down"):
            thrust = -1.0
            
        if self.is_action_active("left"):
            rotation = -1.0
        elif self.is_action_active("right"):
            rotation = 1.0
            
        if thrust != 0:
            ship.kinetics.apply_thrust(thrust, dt)
        if rotation != 0:
            ship.kinetics.apply_rotation(rotation, dt)
            
        return self.is_action_active("fire")
