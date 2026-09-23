"""
ComponentRegistry - Central registry of components per creature
ADR-005: Components as Views, Not Owners
"""
from typing import Dict, Type, TypeVar, Any, Optional
from dataclasses import dataclass

T = TypeVar('T')


@dataclass
class ComponentEntry:
    """Entry in component registry"""
    component_type: Type
    component: Any
    active: bool = True


class ComponentRegistry:
    """Central registry of components per creature"""
    
    def __init__(self):
        self._components: Dict[str, Dict[Type, ComponentEntry]] = {}
    
    def add_component(self, creature_id: str, component_type: Type[T], component: T) -> None:
        """Add a component to a creature"""
        if creature_id not in self._components:
            self._components[creature_id] = {}
        
        self._components[creature_id][component_type] = ComponentEntry(
            component_type=component_type,
            component=component
        )
    
    def get_component(self, creature_id: str, component_type: Type[T]) -> Optional[T]:
        """Get a component from a creature"""
        if creature_id not in self._components:
            return None
        
        entry = self._components[creature_id].get(component_type)
        if entry and entry.active:
            return entry.component
        return None
    
    def remove_component(self, creature_id: str, component_type: Type) -> bool:
        """Remove a component from a creature"""
        if creature_id not in self._components:
            return False
        
        if component_type in self._components[creature_id]:
            del self._components[creature_id][component_type]
            return True
        return False
    
    def has_component(self, creature_id: str, component_type: Type) -> bool:
        """Check if creature has a component"""
        return self.get_component(creature_id, component_type) is not None
    
    def get_all_components(self, creature_id: str) -> Dict[Type, Any]:
        """Get all components for a creature"""
        if creature_id not in self._components:
            return {}
        
        return {
            entry.component_type: entry.component
            for entry in self._components[creature_id].values()
            if entry.active
        }
    
    def get_creatures_with_component(self, component_type: Type) -> Dict[str, Any]:
        """Get all creatures that have a specific component"""
        result = {}
        for creature_id, components in self._components.items():
            if component_type in components and components[component_type].active:
                result[creature_id] = components[component_type].component
        return result
    
    def activate_component(self, creature_id: str, component_type: Type) -> bool:
        """Activate a component"""
        if creature_id not in self._components:
            return False
        
        if component_type in self._components[creature_id]:
            self._components[creature_id][component_type].active = True
            return True
        return False
    
    def deactivate_component(self, creature_id: str, component_type: Type) -> bool:
        """Deactivate a component"""
        if creature_id not in self._components:
            return False
        
        if component_type in self._components[creature_id]:
            self._components[creature_id][component_type].active = False
            return True
        return False
    
    def clear_creature(self, creature_id: str) -> None:
        """Remove all components for a creature"""
        if creature_id in self._components:
            del self._components[creature_id]
    
    def clear_all(self) -> None:
        """Remove all components"""
        self._components.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        total_creatures = len(self._components)
        total_components = sum(len(components) for components in self._components.values())
        active_components = sum(
            1 for components in self._components.values()
            for entry in components.values()
            if entry.active
        )
        
        return {
            "total_creatures": total_creatures,
            "total_components": total_components,
            "active_components": active_components,
            "average_components_per_creature": total_components / total_creatures if total_creatures > 0 else 0
        }
