"""
UpgradeSystem - Manages tower upgrades purchased with gold for Tower Defense
ADR-008: Slimes Are Towers
"""
from typing import Dict, List, Tuple
from src.shared.ecs.components.tower_component import TowerComponent


class UpgradeSystem:
    """Manages tower upgrades purchased with gold"""
    
    UPGRADE_COSTS = {
        "damage": 100,
        "range": 150,
        "fire_rate": 120,
    }
    
    UPGRADE_MULTIPLIERS = {
        "damage": 0.1,      # +10% damage per level
        "range": 0.1,       # +10% range per level
        "fire_rate": 0.1,   # +10% fire rate per level
    }
    
    MAX_UPGRADE_LEVELS = {
        "damage": 5,
        "range": 5,
        "fire_rate": 5,
    }
    
    def upgrade_tower(self, tower: TowerComponent, upgrade_type: str, 
                      gold_available: int) -> Tuple[bool, int]:
        """Attempt to upgrade tower. Returns (success, remaining_gold)"""
        cost = self.get_upgrade_cost(tower, upgrade_type)
        
        if gold_available < cost:
            return False, gold_available
        
        if not self.can_upgrade(tower, upgrade_type):
            return False, gold_available
        
        # Apply upgrade
        self.apply_upgrade(tower, upgrade_type)
        return True, gold_available - cost
    
    def get_upgrade_cost(self, tower: TowerComponent, upgrade_type: str) -> int:
        """Get cost for next upgrade of specified type"""
        base_cost = self.UPGRADE_COSTS.get(upgrade_type, 0)
        current_level = getattr(tower, f"{upgrade_type}_upgrades", 0)
        return base_cost * (current_level + 1)  # Costs increase with level
    
    def can_upgrade(self, tower: TowerComponent, upgrade_type: str) -> bool:
        """Check if tower can be upgraded"""
        if upgrade_type not in self.UPGRADE_COSTS:
            return False
        
        current_level = getattr(tower, f"{upgrade_type}_upgrades", 0)
        max_level = self.MAX_UPGRADE_LEVELS.get(upgrade_type, 5)
        return current_level < max_level
    
    def apply_upgrade(self, tower: TowerComponent, upgrade_type: str) -> None:
        """Apply upgrade to tower"""
        if upgrade_type == "damage":
            tower.damage_upgrades += 1
        elif upgrade_type == "range":
            tower.range_upgrades += 1
        elif upgrade_type == "fire_rate":
            tower.fire_rate_upgrades += 1
    
    def get_upgrade_info(self, tower: TowerComponent) -> Dict[str, Dict]:
        """Get upgrade information for UI"""
        upgrade_info = {}
        
        for upgrade_type in self.UPGRADE_COSTS.keys():
            current_level = getattr(tower, f"{upgrade_type}_upgrades", 0)
            max_level = self.MAX_UPGRADE_LEVELS.get(upgrade_type, 5)
            can_upgrade = self.can_upgrade(tower, upgrade_type)
            cost = self.get_upgrade_cost(tower, upgrade_type)
            
            upgrade_info[upgrade_type] = {
                "current_level": current_level,
                "max_level": max_level,
                "can_upgrade": can_upgrade,
                "cost": cost,
                "multiplier": self.UPGRADE_MULTIPLIERS[upgrade_type],
                "description": self._get_upgrade_description(upgrade_type),
            }
        
        return upgrade_info
    
    def _get_upgrade_description(self, upgrade_type: str) -> str:
        """Get description for upgrade type"""
        descriptions = {
            "damage": "Increases tower damage by 10%",
            "range": "Increases tower range by 10%",
            "fire_rate": "Increases tower fire rate by 10%",
        }
        return descriptions.get(upgrade_type, "Unknown upgrade")
    
    def get_total_upgrades(self, tower: TowerComponent) -> int:
        """Get total number of upgrades on tower"""
        return (tower.damage_upgrades + 
                tower.range_upgrades + 
                tower.fire_rate_upgrades)
    
    def get_upgrade_effectiveness(self, tower: TowerComponent) -> Dict[str, float]:
        """Get upgrade effectiveness percentages"""
        return {
            "damage_bonus": tower.damage_upgrades * self.UPGRADE_MULTIPLIERS["damage"],
            "range_bonus": tower.range_upgrades * self.UPGRADE_MULTIPLIERS["range"],
            "fire_rate_bonus": tower.fire_rate_upgrades * self.UPGRADE_MULTIPLIERS["fire_rate"],
        }
    
    def reset_upgrades(self, tower: TowerComponent) -> int:
        """Reset all upgrades and return refund amount"""
        total_cost = tower.get_total_upgrade_cost()
        tower.damage_upgrades = 0
        tower.range_upgrades = 0
        tower.fire_rate_upgrades = 0
        return total_cost // 2  # 50% refund
    
    def upgrade_batch(self, towers: List[TowerComponent], 
                    upgrades: List[Tuple[str, str]], gold: int) -> Tuple[bool, int, List[str]]:
        """Upgrade multiple towers. Returns (success, remaining_gold, failed_upgrades)"""
        remaining_gold = gold
        failed_upgrades = []
        
        for tower_id, upgrade_type in upgrades:
            # Find tower by ID (would need tower_id in TowerComponent)
            # For now, assume we have the tower reference
            success, remaining_gold = self.upgrade_tower(tower, upgrade_type, remaining_gold)
            if not success:
                failed_upgrades.append(f"{tower_id}:{upgrade_type}")
        
        success = len(failed_upgrades) == 0
        return success, remaining_gold, failed_upgrades
