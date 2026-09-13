"""
TowerComponent - Tower-specific state for slimes in Tower Defense
ADR-008: Slimes Are Towers
"""
from dataclasses import dataclass, field
from typing import Optional
from src.shared.physics.kinematics import Vector2


@dataclass
class TowerComponent:
    """Tower-specific state for a slime acting as tower"""
    # Tower type determined by genetics
    tower_type: str = "balanced"  # "scout", "rapid_fire", "cannon", "balanced"
    
    # Base stats derived from slime
    base_damage: float = 10.0
    base_range: float = 100.0
    base_fire_rate: float = 1.0  # Shots per second
    
    # Upgrade state (session-specific)
    damage_upgrades: int = 0
    range_upgrades: int = 0
    fire_rate_upgrades: int = 0
    
    # Runtime state
    target: Optional[Vector2] = None
    fire_cooldown: float = 0.0
    last_fire_time: float = 0.0
    
    # Visual state
    rotation: float = 0.0  # For visual aiming
    
    def get_damage(self) -> float:
        """Calculate current damage including upgrades"""
        return self.base_damage * (1.0 + 0.1 * self.damage_upgrades)
    
    def get_range(self) -> float:
        """Calculate current range including upgrades"""
        return self.base_range * (1.0 + 0.1 * self.range_upgrades)
    
    def get_fire_rate(self) -> float:
        """Calculate current fire rate including upgrades"""
        return self.base_fire_rate * (1.0 + 0.1 * self.fire_rate_upgrades)
    
    def can_fire(self, current_time: float) -> bool:
        """Check if tower can fire based on cooldown"""
        if self.last_fire_time == 0.0:
            return True  # Can fire initially
        return current_time - self.last_fire_time >= (1.0 / self.get_fire_rate())
    
    def fire(self, current_time: float) -> None:
        """Mark tower as having fired"""
        self.last_fire_time = current_time - 0.001  # Small epsilon to avoid immediate cooldown
        self.fire_cooldown = 0.0
    
    def get_total_upgrade_cost(self) -> int:
        """Calculate total cost of all upgrades"""
        return (self.damage_upgrades * 100 + 
                self.range_upgrades * 150 + 
                self.fire_rate_upgrades * 120)
    
    def set_target(self, target: Vector2) -> None:
        """Set tower target and update rotation"""
        self.target = target
        # Calculate rotation to face target
        if target:
            dx = target.x - 0  # Assuming tower at origin for rotation calc
            dy = target.y - 0
            import math
            self.rotation = math.atan2(dy, dx)
    
    def clear_target(self) -> None:
        """Clear tower target"""
        self.target = None
    
    def get_upgrade_cost(self, upgrade_type: str) -> int:
        """Get cost for next upgrade of specified type"""
        base_costs = {
            "damage": 100,
            "range": 150,
            "fire_rate": 120,
        }
        base_cost = base_costs.get(upgrade_type, 0)
        current_level = getattr(self, f"{upgrade_type}_upgrades", 0)
        return base_cost * (current_level + 1)  # Costs increase with level
    
    def can_upgrade(self, upgrade_type: str, gold: int) -> bool:
        """Check if tower can be upgraded"""
        if upgrade_type not in ["damage", "range", "fire_rate"]:
            return False
        return gold >= self.get_upgrade_cost(upgrade_type)
    
    def upgrade(self, upgrade_type: str) -> None:
        """Apply upgrade to tower"""
        if upgrade_type == "damage":
            self.damage_upgrades += 1
        elif upgrade_type == "range":
            self.range_upgrades += 1
        elif upgrade_type == "fire_rate":
            self.fire_rate_upgrades += 1
