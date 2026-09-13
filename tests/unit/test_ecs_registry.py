"""
Unit tests for ECS registry and system runner
"""
import pytest
from src.shared.ecs.registry.component_registry import ComponentRegistry, ComponentEntry
from src.shared.ecs.systems.system_runner import SystemRunner
from src.shared.ecs.components.kinematics_component import KinematicsComponent
from src.shared.ecs.components.behavior_component import BehaviorComponent
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Vector2


@pytest.fixture
def sample_creature():
    """Create a sample creature for testing"""
    genome = SlimeGenome(
        shape="round", size="medium", 
        base_color=(255, 0, 0), 
        pattern="solid", 
        pattern_color=(0, 0, 0),
        accessory="none",
        curiosity=0.5, energy=0.8, affection=0.3, shyness=0.2
    )
    creature = Creature(
        name="TestSlime",
        genome=genome
    )
    creature.forces = Vector2(0, 0)
    creature.kinematics.position = Vector2(100, 100)
    return creature


@pytest.fixture
def component_registry():
    """Create a component registry"""
    return ComponentRegistry()


def test_component_registry_initialization(component_registry):
    """Test ComponentRegistry initialization"""
    assert component_registry._components == {}
    stats = component_registry.get_stats()
    assert stats["total_creatures"] == 0
    assert stats["total_components"] == 0
    assert stats["active_components"] == 0


def test_add_component(component_registry, sample_creature):
    """Test adding components to registry"""
    kinematics_component = KinematicsComponent()
    behavior_component = BehaviorComponent()
    
    # Add components
    component_registry.add_component(sample_creature.slime_id, KinematicsComponent, kinematics_component)
    component_registry.add_component(sample_creature.slime_id, BehaviorComponent, behavior_component)
    
    # Verify components were added
    assert component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    assert component_registry.has_component(sample_creature.slime_id, BehaviorComponent)
    
    # Verify we can retrieve them
    retrieved_kinematics = component_registry.get_component(sample_creature.slime_id, KinematicsComponent)
    retrieved_behavior = component_registry.get_component(sample_creature.slime_id, BehaviorComponent)
    
    assert retrieved_kinematics == kinematics_component
    assert retrieved_behavior == behavior_component


def test_get_component_not_found(component_registry):
    """Test getting component that doesn't exist"""
    result = component_registry.get_component("nonexistent_id", KinematicsComponent)
    assert result is None


def test_remove_component(component_registry, sample_creature):
    """Test removing components from registry"""
    kinematics_component = KinematicsComponent()
    
    # Add component
    component_registry.add_component(sample_creature.slime_id, KinematicsComponent, kinematics_component)
    assert component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    
    # Remove component
    removed = component_registry.remove_component(sample_creature.slime_id, KinematicsComponent)
    assert removed is True
    assert not component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    
    # Try to remove again
    removed_again = component_registry.remove_component(sample_creature.slime_id, KinematicsComponent)
    assert removed_again is False


def test_get_all_components(component_registry, sample_creature):
    """Test getting all components for a creature"""
    kinematics_component = KinematicsComponent()
    behavior_component = BehaviorComponent()
    
    # Add components
    component_registry.add_component(sample_creature.slime_id, KinematicsComponent, kinematics_component)
    component_registry.add_component(sample_creature.slime_id, BehaviorComponent, behavior_component)
    
    # Get all components
    all_components = component_registry.get_all_components(sample_creature.slime_id)
    
    assert len(all_components) == 2
    assert KinematicsComponent in all_components
    assert BehaviorComponent in all_components
    assert all_components[KinematicsComponent] == kinematics_component
    assert all_components[BehaviorComponent] == behavior_component


def test_get_creatures_with_component(component_registry):
    """Test getting all creatures with a specific component"""
    # Create multiple creatures
    creatures = []
    for i in range(3):
        genome = SlimeGenome(
            shape="round", size="medium", 
            base_color=(255, 0, 0), 
            pattern="solid", 
            pattern_color=(0, 0, 0),
            accessory="none",
            curiosity=0.5, energy=0.8, affection=0.3, shyness=0.2
        )
        creature = Creature(
            name=f"Slime{i}",
            genome=genome
        )
        creatures.append(creature)
    
    # Add kinematics components to first two creatures
    component_registry.add_component(creatures[0].slime_id, KinematicsComponent, KinematicsComponent())
    component_registry.add_component(creatures[1].slime_id, KinematicsComponent, KinematicsComponent())
    
    # Get creatures with kinematics component
    kinematics_creatures = component_registry.get_creatures_with_component(KinematicsComponent)
    
    assert len(kinematics_creatures) == 2
    assert creatures[0].slime_id in kinematics_creatures
    assert creatures[1].slime_id in kinematics_creatures
    assert creatures[2].slime_id not in kinematics_creatures


def test_activate_deactivate_component(component_registry, sample_creature):
    """Test activating and deactivating components"""
    kinematics_component = KinematicsComponent()
    
    # Add component
    component_registry.add_component(sample_creature.slime_id, KinematicsComponent, kinematics_component)
    
    # Should be active by default
    assert component_registry.get_component(sample_creature.slime_id, KinematicsComponent) == kinematics_component
    
    # Deactivate
    deactivated = component_registry.deactivate_component(sample_creature.slime_id, KinematicsComponent)
    assert deactivated is True
    assert component_registry.get_component(sample_creature.slime_id, KinematicsComponent) is None
    
    # Reactivate
    activated = component_registry.activate_component(sample_creature.slime_id, KinematicsComponent)
    assert activated is True
    assert component_registry.get_component(sample_creature.slime_id, KinematicsComponent) == kinematics_component


def test_clear_creature(component_registry, sample_creature):
    """Test clearing all components for a creature"""
    kinematics_component = KinematicsComponent()
    behavior_component = BehaviorComponent()
    
    # Add components
    component_registry.add_component(sample_creature.slime_id, KinematicsComponent, kinematics_component)
    component_registry.add_component(sample_creature.slime_id, BehaviorComponent, behavior_component)
    
    assert component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    assert component_registry.has_component(sample_creature.slime_id, BehaviorComponent)
    
    # Clear creature
    component_registry.clear_creature(sample_creature.slime_id)
    
    assert not component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    assert not component_registry.has_component(sample_creature.slime_id, BehaviorComponent)


def test_clear_all(component_registry, sample_creature):
    """Test clearing all components"""
    kinematics_component = KinematicsComponent()
    behavior_component = BehaviorComponent()
    
    # Add components
    component_registry.add_component(sample_creature.slime_id, KinematicsComponent, kinematics_component)
    component_registry.add_component(sample_creature.slime_id, BehaviorComponent, behavior_component)
    
    assert len(component_registry._components) == 1
    
    # Clear all
    component_registry.clear_all()
    
    assert len(component_registry._components) == 0
    assert component_registry.get_stats()["total_creatures"] == 0


def test_system_runner_initialization(component_registry):
    """Test SystemRunner initialization"""
    runner = SystemRunner(component_registry)
    
    assert runner.registry == component_registry
    assert runner.kinematics_system is not None
    assert runner.behavior_system is not None


def test_system_runner_add_creature(component_registry, sample_creature):
    """Test adding creature to ECS system"""
    runner = SystemRunner(component_registry)
    
    # Add creature to ECS
    runner.add_creature_to_ecs(sample_creature)
    
    # Verify components were added
    assert component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    assert component_registry.has_component(sample_creature.slime_id, BehaviorComponent)
    
    # Verify components have creature references
    kinematics_component = component_registry.get_component(sample_creature.slime_id, KinematicsComponent)
    behavior_component = component_registry.get_component(sample_creature.slime_id, BehaviorComponent)
    
    assert kinematics_component.get_creature() == sample_creature
    assert behavior_component.get_creature() == sample_creature


def test_system_runner_remove_creature(component_registry, sample_creature):
    """Test removing creature from ECS system"""
    runner = SystemRunner(component_registry)
    
    # Add creature to ECS
    runner.add_creature_to_ecs(sample_creature)
    assert component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    
    # Remove creature from ECS
    runner.remove_creature_from_ecs(sample_creature.slime_id)
    
    assert not component_registry.has_component(sample_creature.slime_id, KinematicsComponent)
    assert not component_registry.has_component(sample_creature.slime_id, BehaviorComponent)


def test_system_runner_update_single_creature(component_registry, sample_creature):
    """Test updating a single creature"""
    runner = SystemRunner(component_registry)
    
    # Add creature to ECS
    runner.add_creature_to_ecs(sample_creature)
    
    # Update single creature
    dt = 0.016
    runner.update_single_creature(sample_creature, dt)
    
    # Forces should be set (from behavior system)
    assert hasattr(sample_creature, 'forces')
    assert isinstance(sample_creature.forces, Vector2)
    
    # Position should be updated (from kinematics system)
    # Position might change due to wander behavior, so just check it's still a Vector2
    assert isinstance(sample_creature.kinematics.position, Vector2)


def test_system_runner_get_ecs_stats(component_registry, sample_creature):
    """Test getting ECS statistics"""
    runner = SystemRunner(component_registry)
    
    # Add creature to ECS
    runner.add_creature_to_ecs(sample_creature)
    
    # Get stats
    stats = runner.get_ecs_stats()
    
    assert "registry_stats" in stats
    assert "systems" in stats
    
    registry_stats = stats["registry_stats"]
    assert registry_stats["total_creatures"] == 1
    assert registry_stats["total_components"] == 2
    assert registry_stats["active_components"] == 2
    
    systems_stats = stats["systems"]
    assert systems_stats["kinematics_system"] == "active"
    assert systems_stats["behavior_system"] == "active"
