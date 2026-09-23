"""
Voyager Shell Module
ADR 084: Actor-Intent Decoupling

Minimal data object representing the character in the world.
Lightweight container for current Position and Inventory.
The "Actor" just follows whatever the Intent Engine says.
"""

from typing import List, Tuple, Optional, Dict, Any
from loguru import logger
from dataclasses import dataclass
from core.state import InteractionIntent

@dataclass
class VoyagerShell:
    """Minimal Voyager Shell - just position and inventory"""
    
    def __init__(self, start_position: Tuple[int, int]):
        self.current_position: Tuple[int, int] = start_position
        self.inventory: List[str] = []
        self.state: str = "IDLE"
        self.last_intent_time: float = 0.0
        
        # Idle tracking for animations (moved from actor)
        self.idle_timer: int = 0
        self.idle_threshold: int = 5
        self.is_idle: bool = False
    
    def update_position(self, new_position: Tuple[int, int]) -> None:
        """Update Voyager position"""
        self.current_position = new_position
        self.idle_timer = 0  # Reset idle timer on movement
        self.is_idle = False
        logger.debug(f"🚶 Voyager moved to {new_position}")
    
    def execute_intent(self, intent: InteractionIntent) -> bool:
        """Execute an intent provided by the Intent Engine"""
        try:
            if intent.intent_type == "interaction":
                self.state = "INTERACTING"
                self.last_intent_time = 0.0
                return True
            elif intent.intent_type == "movement":
                self.state = "MOVING"
                self.last_intent_time = 0.0
                return True
            else:
                self.state = "IDLE"
                return False
        except Exception as e:
            logger.error(f"💥 Intent execution failed: {e}")
            return False
    
    def update_idle_state(self) -> None:
        """Update idle state for animation purposes"""
        self.idle_timer += 1
        if self.idle_timer >= self.idle_threshold:
            self.is_idle = True
        else:
            self.is_idle = False
    
    def add_to_inventory(self, item: str) -> None:
        """Add item to inventory"""
        self.inventory.append(item)
        logger.info(f"📦 Added {item} to inventory")
    
    def get_nearby_objects(self, object_registry, radius: int = 5) -> List[Tuple[int, int]]:
        """Get nearby objects within radius"""
        nearby_objects = []
        for obj_pos in object_registry.world_objects.keys():
            distance = abs(self.current_position[0] - obj_pos[0]) + abs(self.current_position[1] - obj_pos[1])
            if distance <= radius:
                nearby_objects.append(obj_pos)
        return nearby_objects
