"""
SystemRunner - Orchestrates system updates
ADR-006: Systems Return State, Don't Mutate
"""
from typing import List, Optional, Dict, Any
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.registry.component_registry import ComponentRegistry
from src.shared.ecs.systems.kinematics_system import KinematicsSystem
from src.shared.ecs.systems.behavior_system import BehaviorSystem
from src.shared.ecs.components.behavior_component import BehaviorComponent
from src.shared.ecs.components.kinematics_component import KinematicsComponent


class SystemRunner:
    """Orchestrates system updates for ECS"""
    
    def __init__(self, registry: ComponentRegistry):
        self.registry = registry
        self.kinematics_system = KinematicsSystem()
        self.behavior_system = BehaviorSystem()
        
        # Demo-specific systems (for future extensibility)
        self.dungeon_behavior = None
        self.racing_behavior = None
        self.tower_defense_behavior = None
    
    def update(self, creatures: List[Any], dt: float, cursor_pos: Optional[tuple] = None) -> None:
        """Update all creatures through ECS systems"""
        # Phase 1: Behavior systems (calculate forces)
        self._update_behavior_systems(creatures, dt, cursor_pos)
        
        # Phase 2: Kinematics system (apply forces and update position)
        self._update_kinematics_system(creatures, dt)
    
    def _update_behavior_systems(self, creatures: List[Any], dt: float, cursor_pos: Optional[tuple]) -> None:
        """Update behavior systems and set forces on creatures"""
        # Get creatures with behavior components
        behavior_creatures = self.registry.get_creatures_with_component(BehaviorComponent)
        
        for creature_id, behavior_component in behavior_creatures.items():
            # Find the corresponding creature
            creature = self._find_creature_by_id(creatures, creature_id)
            if not creature:
                continue
            
            # Calculate forces based on behavior
            force = self.behavior_system.update(creature, behavior_component, dt, cursor_pos)
            
            # Set forces on creature for kinematics system to apply
            creature.forces = force
    
    def _update_kinematics_system(self, creatures: List[Any], dt: float) -> None:
        """Update kinematics system"""
        # Get creatures with kinematics components
        kinematics_creatures = self.registry.get_creatures_with_component(KinematicsComponent)
        
        for creature_id, kinematics_component in kinematics_creatures.items():
            # Find the corresponding creature
            creature = self._find_creature_by_id(creatures, creature_id)
            if not creature:
                continue
            
            # Update physics
            self.kinematics_system.update(creature, kinematics_component, dt)
    
    def _find_creature_by_id(self, creatures: List[Any], creature_id: str) -> Optional[Any]:
        """Find creature by slime_id"""
        for creature in creatures:
            if hasattr(creature, 'slime_id') and creature.slime_id == creature_id:
                return creature
        return None
    
    def add_creature_to_ecs(self, creature: Any) -> None:
        """Add a creature to the ECS system with default components"""
        # Add kinematics component
        kinematics_component = KinematicsComponent()
        kinematics_component.set_creature_reference(creature)
        self.registry.add_component(creature.slime_id, KinematicsComponent, kinematics_component)
        
        # Add behavior component
        behavior_component = BehaviorComponent()
        behavior_component.set_creature_reference(creature)
        self.registry.add_component(creature.slime_id, BehaviorComponent, behavior_component)
    
    def remove_creature_from_ecs(self, creature_id: str) -> None:
        """Remove a creature from the ECS system"""
        self.registry.clear_creature(creature_id)
    
    def update_single_creature(self, creature: Any, dt: float, cursor_pos: Optional[tuple] = None) -> None:
        """Update a single creature (useful for selective updates)"""
        # Get components for this creature
        behavior_component = self.registry.get_component(creature.slime_id, BehaviorComponent)
        kinematics_component = self.registry.get_component(creature.slime_id, KinematicsComponent)
        
        # Update behavior if component exists
        if behavior_component:
            force = self.behavior_system.update(creature, behavior_component, dt, cursor_pos)
            creature.forces = force
        else:
            # Default forces if no behavior component
            creature.forces = Vector2(0, 0)
        
        # Update kinematics if component exists
        if kinematics_component:
            self.kinematics_system.update(creature, kinematics_component, dt)
    
    def get_ecs_stats(self) -> Dict[str, Any]:
        """Get ECS statistics"""
        registry_stats = self.registry.get_stats()
        
        return {
            "registry_stats": registry_stats,
            "systems": {
                "kinematics_system": "active",
                "behavior_system": "active",
                "dungeon_behavior": "active" if self.dungeon_behavior else "inactive",
                "racing_behavior": "active" if self.racing_behavior else "inactive",
                "tower_defense_behavior": "active" if self.tower_defense_behavior else "inactive"
            }
        }
