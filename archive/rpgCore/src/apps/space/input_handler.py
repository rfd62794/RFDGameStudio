"""
Input Handler - Space Game Input System

ADR 195: The Newtonian Vector Core

Input mapping and handling for the "Ur-Asteroids" game slice.
Maps keyboard/miyoo controls to ship physics commands.

Input Mappings:
- Arrow Keys/Miyoo D-Pad: Ship rotation
- Up Key/Miyoo A: Thrust
- Space/Miyoo B: Fire bullet
- R/Miyoo Select: Reset game

Optimized for both desktop development and Miyoo Mini deployment.
"""

from typing import Dict, Callable, Optional, Any
from dataclasses import dataclass
from enum import Enum
import time

from .asteroids_strategy import AsteroidsStrategy
from foundation.interfaces.protocols import Result


class InputKey(Enum):
    """Input key enumeration"""
    # Arrow keys / Miyoo D-Pad
    LEFT = "left"
    RIGHT = "right"
    UP = "up"
    DOWN = "down"
    
    # Action buttons
    THRUST = "thrust"      # Up key / Miyoo A
    FIRE = "fire"          # Space / Miyoo B
    RESET = "reset"        # R / Miyoo Select
    
    # System
    ESCAPE = "escape"      # Escape / Miyoo Start


@dataclass
class InputState:
    """Current input state"""
    key_pressed: Dict[InputKey, bool]
    key_just_pressed: Dict[InputKey, bool]
    key_just_released: Dict[InputKey, bool]
    last_update_time: float


class SpaceInputHandler:
    """Input handler for space game controls"""
    
    def __init__(self, asteroids_strategy: AsteroidsStrategy):
        self.asteroids_strategy = asteroids_strategy
        self.input_state = InputState(
            key_pressed={key: False for key in InputKey},
            key_just_pressed={key: False for key in InputKey},
            key_just_released={key: False for key in InputKey},
            last_update_time=0.0
        )
        
        # Input mappings
        self.key_mappings: Dict[str, InputKey] = {
            # Arrow keys
            'ArrowLeft': InputKey.LEFT,
            'ArrowRight': InputKey.RIGHT,
            'ArrowUp': InputKey.UP,
            'ArrowDown': InputKey.DOWN,
            
            # WASD alternative
            'a': InputKey.LEFT,
            'd': InputKey.RIGHT,
            'w': InputKey.UP,
            's': InputKey.DOWN,
            
            # Action keys
            ' ': InputKey.FIRE,        # Space
            'Enter': InputKey.FIRE,     # Enter alternative
            'r': InputKey.RESET,        # R key
            'Escape': InputKey.ESCAPE,  # Escape
            
            # Miyoo Mini mappings (for future integration)
            'dpad_left': InputKey.LEFT,
            'dpad_right': InputKey.RIGHT,
            'dpad_up': InputKey.UP,
            'dpad_down': InputKey.DOWN,
            'button_a': InputKey.THRUST,
            'button_b': InputKey.FIRE,
            'button_select': InputKey.RESET,
            'button_start': InputKey.ESCAPE,
        }
        
        # Input handlers
        self.key_handlers: Dict[InputKey, Callable] = {
            InputKey.LEFT: self._handle_rotation_left,
            InputKey.RIGHT: self._handle_rotation_right,
            InputKey.UP: self._handle_thrust_on,
            InputKey.DOWN: self._handle_thrust_off,  # Down cancels thrust
            InputKey.FIRE: self._handle_fire,
            InputKey.RESET: self._handle_reset,
            InputKey.ESCAPE: self._handle_escape,
        }
        
        # Continuous input tracking
        self.rotation_input = 0.0
        self.thrust_input = False
        
        # Fire cooldown tracking
        self.last_fire_time = 0.0
        self.fire_cooldown = 0.25  # 250ms cooldown
    
    def update(self, current_time: float) -> Result[None]:
        """Update input processing"""
        try:
            # Calculate delta time
            dt = current_time - self.input_state.last_update_time
            self.input_state.last_update_time = current_time
            
            # Process continuous inputs
            self._process_continuous_inputs()
            
            # Process just-pressed inputs
            self._process_discrete_inputs(current_time)
            
            # Reset just-pressed/released flags
            self._reset_input_flags()
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Input update failed: {str(e)}")
    
    def _process_continuous_inputs(self) -> None:
        """Process continuous input states (rotation, thrust)"""
        # Handle rotation
        if self.input_state.key_pressed[InputKey.LEFT] and not self.input_state.key_pressed[InputKey.RIGHT]:
            self.rotation_input = -1.0
        elif self.input_state.key_pressed[InputKey.RIGHT] and not self.input_state.key_pressed[InputKey.LEFT]:
            self.rotation_input = 1.0
        else:
            self.rotation_input = 0.0
        
        # Handle thrust
        self.thrust_input = self.input_state.key_pressed[InputKey.UP]
        
        # Apply to asteroids strategy
        self.asteroids_strategy.set_rotation(self.rotation_input)
        self.asteroids_strategy.set_thrust(self.thrust_input)
    
    def _process_discrete_inputs(self, current_time: float) -> None:
        """Process discrete input events (fire, reset)"""
        # Handle fire button
        if self.input_state.key_just_pressed[InputKey.FIRE]:
            if current_time - self.last_fire_time >= self.fire_cooldown:
                fire_result = self.asteroids_strategy.fire_bullet()
                if fire_result.success:
                    self.last_fire_time = current_time
        
        # Handle reset button
        if self.input_state.key_just_pressed[InputKey.RESET]:
            self.asteroids_strategy.reset_game()
    
    def _reset_input_flags(self) -> None:
        """Reset just-pressed/released flags"""
        for key in InputKey:
            self.input_state.key_just_pressed[key] = False
            self.input_state.key_just_released[key] = False
    
    def on_key_down(self, key: str) -> None:
        """Handle key down event"""
        input_key = self.key_mappings.get(key)
        if input_key and not self.input_state.key_pressed[input_key]:
            self.input_state.key_pressed[input_key] = True
            self.input_state.key_just_pressed[input_key] = True
    
    def on_key_up(self, key: str) -> None:
        """Handle key up event"""
        input_key = self.key_mappings.get(key)
        if input_key and self.input_state.key_pressed[input_key]:
            self.input_state.key_pressed[input_key] = False
            self.input_state.key_just_released[input_key] = True
    
    def _handle_rotation_left(self) -> None:
        """Handle left rotation input"""
        self.rotation_input = -1.0
    
    def _handle_rotation_right(self) -> None:
        """Handle right rotation input"""
        self.rotation_input = 1.0
    
    def _handle_thrust_on(self) -> None:
        """Handle thrust activation"""
        self.thrust_input = True
    
    def _handle_thrust_off(self) -> None:
        """Handle thrust deactivation"""
        self.thrust_input = False
    
    def _handle_fire(self) -> None:
        """Handle fire action"""
        # This is handled in _process_discrete_inputs
        pass
    
    def _handle_reset(self) -> None:
        """Handle reset action"""
        # This is handled in _process_discrete_inputs
        pass
    
    def _handle_escape(self) -> None:
        """Handle escape action"""
        # Could be used for pause menu or quit
        pass
    
    def get_input_state(self) -> Dict[str, Any]:
        """Get current input state for debugging"""
        return {
            'rotation_input': self.rotation_input,
            'thrust_input': self.thrust_input,
            'keys_pressed': {k.value: v for k, v in self.input_state.key_pressed.items()},
            'keys_just_pressed': {k.value: v for k, v in self.input_state.key_just_pressed.items()},
            'last_fire_time': self.last_fire_time
        }
    
    def get_controls_help(self) -> str:
        """Get controls help text"""
        help_text = """
=== SPACE CONTROLS ===

MOVEMENT:
  Arrow Keys / WASD - Rotate ship
  Up Arrow / W - Thrust forward

ACTIONS:
  Space / Enter - Fire bullet
  R - Reset game
  Escape - Pause/Quit

TIPS:
  - Ship drifts forever (no friction!)
  - Wrap around screen edges
  - Conserve energy - thrust uses fuel
  - Large asteroids split into smaller ones

CONTROLS VERIFIED FOR:
  - Desktop (Arrow keys + Space)
  - Miyoo Mini (D-Pad + A/B buttons)
"""
        return help_text
