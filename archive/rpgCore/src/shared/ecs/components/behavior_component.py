"""
BehaviorComponent - Behavior state for ECS
ADR-005: Components as Views, Not Owners
"""
from dataclasses import dataclass, field
from typing import Optional
from src.shared.physics.kinematics import Vector2


@dataclass
class BehaviorComponent:
    """Behavior state component - stores behavior-specific state"""
    # Target position for movement
    target: Optional[Vector2] = None
    
    # Wander behavior timing
    wander_timer: float = 0.0
    
    # Behavior flags
    is_retreat_mode: bool = False
    is_follow_mode: bool = False
    
    # Demo-specific behavior type (for future extensibility)
    behavior_type: str = "default"  # "racing", "dungeon", "tower_defense", etc.
    
    def set_creature_reference(self, creature) -> None:
        """Set back-reference to creature for state access"""
        self._creature = creature
    
    def get_creature(self):
        """Get creature reference"""
        return getattr(self, '_creature', None)


@dataclass
class BehaviorState:
    """State returned by BehaviorSystem for force calculation"""
    target_force: Vector2 = field(default_factory=lambda: Vector2(0, 0))
    should_retreat: bool = False
    should_follow: bool = False
    wander_direction: Optional[Vector2] = None
