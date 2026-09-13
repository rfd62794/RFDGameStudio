"""
Controller Base Class - Three-Tier Architecture
Foundation for input handling (Human or AI) in Tier 2
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass

from dgt_engine.foundation.types import Result


@dataclass
class ControlInput:
    """Standardized control input structure"""
    thrust: float = 0.0          # -1.0 to 1.0
    rotation: float = 0.0        # -1.0 to 1.0 (negative = left, positive = right)
    fire_weapon: bool = False    # Weapon fire command
    special_action: Optional[str] = None  # Special actions (boost, shield, etc.)


class BaseController(ABC):
    """
    Abstract base class for all controllers
    Defines the interface between input sources and game entities
    """
    
    def __init__(self, controller_id: str):
        self.controller_id = controller_id
        self.is_active = True
        self.control_input = ControlInput()
    
    @abstractmethod
    def update(self, dt: float, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> Result[ControlInput]:
        """
        Update controller and generate control inputs
        
        Args:
            dt: Time delta in seconds
            entity_state: Current state of the controlled entity
            world_data: Information about the world (asteroids, threats, etc.)
            
        Returns:
            Result containing control inputs or error
        """
        pass
    
    @abstractmethod
    def activate(self) -> Result[bool]:
        """Activate the controller"""
        pass
    
    @abstractmethod
    def deactivate(self) -> Result[bool]:
        """Deactivate the controller"""
        pass
    
    def get_control_input(self) -> ControlInput:
        """Get current control input"""
        return self.control_input
    
    def set_control_input(self, control_input: ControlInput) -> None:
        """Set control input directly (for testing or overrides)"""
        self.control_input = control_input


class ControllerManager:
    """
    Manages multiple controllers and switching between them
    Supports hot-swapping between human and AI control
    """
    
    def __init__(self):
        self.controllers: Dict[str, BaseController] = {}
        self.active_controller_id: Optional[str] = None
        self.controller_history: list = []
    
    def register_controller(self, controller: BaseController) -> Result[bool]:
        """Register a new controller"""
        try:
            self.controllers[controller.controller_id] = controller
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to register controller: {e}")
    
    def set_active_controller(self, controller_id: str) -> Result[bool]:
        """Set the active controller"""
        try:
            if controller_id not in self.controllers:
                return Result(success=False, error=f"Controller '{controller_id}' not found")
            
            # Deactivate current controller
            if self.active_controller_id:
                current = self.controllers[self.active_controller_id]
                current.deactivate()
                self.controller_history.append(self.active_controller_id)
            
            # Activate new controller
            new_controller = self.controllers[controller_id]
            activate_result = new_controller.activate()
            
            if activate_result.success:
                self.active_controller_id = controller_id
                return Result(success=True, value=True)
            else:
                return Result(success=False, error=f"Failed to activate controller: {activate_result.error}")
                
        except Exception as e:
            return Result(success=False, error=f"Failed to set active controller: {e}")
    
    def get_active_controller(self) -> Optional[BaseController]:
        """Get the currently active controller"""
        if self.active_controller_id:
            return self.controllers.get(self.active_controller_id)
        return None
    
    def update_active_controller(self, dt: float, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> Result[ControlInput]:
        """Update the active controller"""
        try:
            active = self.get_active_controller()
            if not active:
                return Result(success=False, error="No active controller")
            
            return active.update(dt, entity_state, world_data)
            
        except Exception as e:
            return Result(success=False, error=f"Controller update failed: {e}")
    
    def switch_to_previous_controller(self) -> Result[bool]:
        """Switch to the previous controller in history"""
        if not self.controller_history:
            return Result(success=False, error="No controller history")
        
        previous_id = self.controller_history.pop()
        return self.set_active_controller(previous_id)
    
    def list_controllers(self) -> Dict[str, str]:
        """List all registered controllers and their types"""
        return {
            controller_id: type(controller).__name__
            for controller_id, controller in self.controllers.items()
        }
    
    def get_controller_status(self) -> Dict[str, Any]:
        """Get status of all controllers"""
        return {
            'active_controller': self.active_controller_id,
            'total_controllers': len(self.controllers),
            'controller_history': self.controller_history.copy(),
            'controllers': self.list_controllers()
        }
