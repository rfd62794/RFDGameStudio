"""
Unit tests for Garden ECS integration
"""
import pytest
from src.apps.slime_breeder.garden.garden_state import GardenState
from src.apps.slime_breeder.garden.garden_ecs import GardenECS
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.kinematics_component import KinematicsComponent
from src.shared.ecs.components.behavior_component import BehaviorComponent


@pytest.fixture
def garden_state():
    """Create a garden state for testing"""
    return GardenState()


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
def garden_ecs(garden_state):
    """Create a garden ECS instance"""
    return GardenECS(garden_state)


def test_garden_ecs_initialization(garden_ecs):
    """Test GardenECS initialization"""
    assert garden_ecs.garden_state is not None
    assert garden_ecs.registry is not None
    assert garden_ecs.system_runner is not None
    assert garden_ecs.is_ecs_enabled() is True
    
    # Check ECS stats
    stats = garden_ecs.get_ecs_stats()
    assert stats["ecs_enabled"] is True
    assert "system_runner_stats" in stats
    assert "registry_stats" in stats


def test_garden_ecs_add_creature(garden_ecs, sample_creature):
    """Test adding creature to garden ECS"""
    # Add creature
    garden_ecs.add_creature(sample_creature)
    
    # Verify creature is in garden state
    retrieved_creature = garden_ecs.get_creature(sample_creature.slime_id)
    assert retrieved_creature == sample_creature
    
    # Verify creature is in ECS system
    assert garden_ecs.registry.has_component(sample_creature.slime_id, KinematicsComponent)
    assert garden_ecs.registry.has_component(sample_creature.slime_id, BehaviorComponent)


def test_garden_ecs_remove_creature(garden_ecs, sample_creature):
    """Test removing creature from garden ECS"""
    # Add creature first
    garden_ecs.add_creature(sample_creature)
    assert garden_ecs.get_creature(sample_creature.slime_id) is not None
    
    # Remove creature
    garden_ecs.remove_creature(sample_creature.slime_id)
    
    # Verify creature is removed from garden state
    assert garden_ecs.get_creature(sample_creature.slime_id) is None
    
    # Verify creature is removed from ECS system
    assert not garden_ecs.registry.has_component(sample_creature.slime_id, KinematicsComponent)
    assert not garden_ecs.registry.has_component(sample_creature.slime_id, BehaviorComponent)


def test_garden_ecs_update_ecs_enabled(garden_ecs, sample_creature):
    """Test updating garden with ECS enabled"""
    # Add creature
    garden_ecs.add_creature(sample_creature)
    
    # Store initial position
    initial_position = Vector2(sample_creature.kinematics.position.x, sample_creature.kinematics.position.y)
    
    # Update with ECS
    dt = 0.016
    cursor_pos = (120, 120)
    garden_ecs.update(dt, cursor_pos)
    
    # Position should potentially change due to wander behavior
    # (We don't assert exact change since wander is random, just that it's still a Vector2)
    assert isinstance(sample_creature.kinematics.position, Vector2)
    
    # Forces should be set by behavior system
    assert hasattr(sample_creature, 'forces')
    assert isinstance(sample_creature.forces, Vector2)


def test_garden_ecs_update_ecs_disabled(garden_ecs, sample_creature):
    """Test updating garden with ECS disabled (legacy fallback)"""
    # Add creature
    garden_ecs.add_creature(sample_creature)
    
    # Disable ECS
    garden_ecs.disable_ecs()
    assert garden_ecs.is_ecs_enabled() is False
    
    # Store initial position
    initial_position = Vector2(sample_creature.kinematics.position.x, sample_creature.kinematics.position.y)
    
    # Update with legacy method
    dt = 0.016
    cursor_pos = (120, 120)
    garden_ecs.update(dt, cursor_pos)
    
    # Position should potentially change due to legacy update
    assert isinstance(sample_creature.kinematics.position, Vector2)
    
    # Check ECS stats
    stats = garden_ecs.get_ecs_stats()
    assert stats["ecs_enabled"] is False


def test_garden_ecs_enable_disable_ecs(garden_ecs):
    """Test enabling and disabling ECS"""
    # Should start enabled
    assert garden_ecs.is_ecs_enabled() is True
    
    # Disable ECS
    garden_ecs.disable_ecs()
    assert garden_ecs.is_ecs_enabled() is False
    
    # Re-enable ECS
    garden_ecs.enable_ecs()
    assert garden_ecs.is_ecs_enabled() is True


def test_garden_ecs_multiple_creatures(garden_ecs):
    """Test garden ECS with multiple creatures"""
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
        creature.forces = Vector2(0, 0)
        creature.kinematics.position = Vector2(i * 50, i * 50)
        creatures.append(creature)
    
    # Add all creatures
    for creature in creatures:
        garden_ecs.add_creature(creature)
    
    # Verify all creatures are in ECS system
    for creature in creatures:
        assert garden_ecs.registry.has_component(creature.slime_id, KinematicsComponent)
        assert garden_ecs.registry.has_component(creature.slime_id, BehaviorComponent)
    
    # Update all creatures
    dt = 0.016
    garden_ecs.update(dt)
    
    # Verify all creatures were updated
    for creature in creatures:
        assert isinstance(creature.kinematics.position, Vector2)
        assert isinstance(creature.forces, Vector2)
    
    # Check registry stats
    stats = garden_ecs.get_ecs_stats()
    registry_stats = stats["registry_stats"]
    assert registry_stats["total_creatures"] == 3
    assert registry_stats["total_components"] == 6  # 2 components per creature
    assert registry_stats["active_components"] == 6


def test_garden_ecs_initialize_existing_creatures(garden_state):
    """Test that existing creatures are added to ECS during initialization"""
    # Add some creatures to garden state first
    creatures = []
    for i in range(2):
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
        creature.forces = Vector2(0, 0)
        creature.kinematics.position = Vector2(i * 50, i * 50)
        creatures.append(creature)
        garden_state.add_creature(creature)
    
    # Create GardenECS - should initialize existing creatures
    garden_ecs = GardenECS(garden_state)
    
    # Verify existing creatures are in ECS system
    for creature in creatures:
        assert garden_ecs.registry.has_component(creature.slime_id, KinematicsComponent)
        assert garden_ecs.registry.has_component(creature.slime_id, BehaviorComponent)
    
    # Check stats
    stats = garden_ecs.get_ecs_stats()
    registry_stats = stats["registry_stats"]
    assert registry_stats["total_creatures"] == 2
    assert registry_stats["total_components"] == 4
