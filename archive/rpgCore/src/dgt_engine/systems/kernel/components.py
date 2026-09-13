"""
DGT Core Components - ADR 168
Component-Lite Architecture for Sovereign Scout
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Tuple

@dataclass
class PhysicsComponent:
    """Newtonian physics state for any entity"""
    x: float
    y: float
    velocity_x: float = 0.0
    velocity_y: float = 0.0
    mass: float = 10.0
    heading: float = 0.0  # Degrees 0-360
    turn_rate: float = 5.0
    max_thrust: float = 100.0
    drag_coefficient: float = 0.98
    
    # Energy System
    energy: float = 100.0
    max_energy: float = 100.0
    base_drain_rate: float = 0.5  # Energy per second at max thrust

    # Input state (Vector thrust)
    thrust_input_x: float = 0.0
    thrust_input_y: float = 0.0

@dataclass
class RenderComponent:
    """Visual representation state"""
    sprite_id: str
    layer: int = 1  # 0=Background, 1=Fringe, 2=Effects
    color: str = "#FFFFFF"
    visible: bool = True
    scale: float = 1.0

@dataclass
class InventoryComponent:
    """Cargo hold affecting mass inertia"""
    capacity: int = 10
    items: Dict[str, int] = field(default_factory=dict)
    base_mass_modifier: float = 1.0  # Mass added per unit
    
    def get_total_mass_impact(self) -> float:
        """Calculate mass added by inventory"""
        item_count = sum(self.items.values())
        return item_count * self.base_mass_modifier

@dataclass
class EntityID:
    """Unique identifier for entities"""
    id: str
    type: str = "unknown"
