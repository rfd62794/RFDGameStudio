"""
Garden ECS Integration - ECS-enabled garden state
Phase 2.4: Dungeon ECS Pilot
"""
from typing import List, Optional
from src.shared.ecs.registry.component_registry import ComponentRegistry
from src.shared.ecs.systems.system_runner import SystemRunner
from src.shared.ecs.components.kinematics_component import KinematicsComponent
from src.shared.ecs.components.behavior_component import BehaviorComponent


class GardenECS:
    """ECS-enabled garden state for Phase 2.4 Dungeon pilot"""
    
    def __init__(self, garden_state):
        self.garden_state = garden_state
        self.registry = ComponentRegistry()
        self.system_runner = SystemRunner(self.registry)
        self._ecs_enabled = True
        
        # Initialize ECS for existing creatures
        self._initialize_ecs_for_existing_creatures()
    
    def _initialize_ecs_for_existing_creatures(self):
        """Add existing creatures to ECS system"""
        for creature in self.garden_state.creatures:
            self.system_runner.add_creature_to_ecs(creature)
    
    def update(self, dt: float, cursor_pos: Optional[tuple] = None) -> None:
        """Update garden using ECS system"""
        if not self._ecs_enabled:
            # Fallback to legacy update
            self._legacy_update(dt, cursor_pos)
            return
        
        # Get list of creatures
        creatures = self.garden_state.creatures
        
        # Update through ECS system
        self.system_runner.update(creatures, dt, cursor_pos)
    
    def _legacy_update(self, dt: float, cursor_pos: Optional[tuple] = None) -> None:
        """Legacy update method (fallback)"""
        for creature in self.garden_state.creatures:
            creature.update(dt, cursor_pos)
    
    def add_creature(self, creature) -> None:
        """Add creature to garden and ECS system"""
        # Add to garden state
        self.garden_state.add_creature(creature)
        
        # Add to ECS system
        if self._ecs_enabled:
            self.system_runner.add_creature_to_ecs(creature)
    
    def remove_creature(self, slime_id: str) -> None:
        """Remove creature from garden and ECS system"""
        # Remove from garden state
        self.garden_state.remove_creature(slime_id)
        
        # Remove from ECS system
        if self._ecs_enabled:
            self.system_runner.remove_creature_from_ecs(slime_id)
    
    def get_creature(self, slime_id: str):
        """Get creature from garden state"""
        return self.garden_state.get_creature(slime_id)
    
    def enable_ecs(self) -> None:
        """Enable ECS system"""
        if not self._ecs_enabled:
            self._ecs_enabled = True
            self._initialize_ecs_for_existing_creatures()
    
    def disable_ecs(self) -> None:
        """Disable ECS system (fallback to legacy)"""
        self._ecs_enabled = False
    
    def is_ecs_enabled(self) -> bool:
        """Check if ECS is enabled"""
        return self._ecs_enabled
    
    def get_ecs_stats(self) -> dict:
        """Get ECS statistics"""
        if not self._ecs_enabled:
            return {"ecs_enabled": False}
        
        return {
            "ecs_enabled": True,
            "system_runner_stats": self.system_runner.get_ecs_stats(),
            "registry_stats": self.registry.get_stats()
        }
