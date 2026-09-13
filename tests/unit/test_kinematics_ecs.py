"""
Unit tests for Kinematics ECS components and systems
"""
import pytest
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.kinematics_component import KinematicsComponent
from src.shared.ecs.systems.kinematics_system import KinematicsSystem
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome


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
    creature.forces = Vector2(0, 0)  # Initialize forces attribute
    # Set position after creation
    creature.kinematics.position = Vector2(100, 100)
    return creature


@pytest.fixture
def kinematics_component():
    """Create a kinematics component"""
    return KinematicsComponent()


def test_kinematics_component_initialization():
    """Test KinematicsComponent initialization"""
    component = KinematicsComponent()
    assert component.max_speed == 200.0
    assert component.friction == 0.92


def test_kinematics_component_state_access(sample_creature, kinematics_component):
    """Test component can access creature state"""
    # Set creature reference
    kinematics_component.set_creature_reference(sample_creature)
    
    # Test position access
    position = kinematics_component.get_position()
    assert position.x == 100.0
    assert position.y == 100.0
    
    # Test velocity access
    velocity = kinematics_component.get_velocity()
    assert velocity.x == 0.0
    assert velocity.y == 0.0
    
    # Test velocity modification
    new_velocity = Vector2(10, 5)
    kinematics_component.set_velocity(new_velocity)
    updated_velocity = kinematics_component.get_velocity()
    assert updated_velocity.x == 10.0
    assert updated_velocity.y == 5.0


def test_kinematics_system_physics_update(sample_creature, kinematics_component):
    """Test physics update logic matches original behavior"""
    system = KinematicsSystem()
    
    # Set initial state
    sample_creature.kinematics.velocity = Vector2(100, 50)
    sample_creature.forces = Vector2(10, 5)
    kinematics_component.set_creature_reference(sample_creature)
    
    # Update physics
    dt = 0.016  # ~60 FPS
    system.update(sample_creature, kinematics_component, dt)
    
    # Verify forces were reset
    assert sample_creature.forces.x == 0.0
    assert sample_creature.forces.y == 0.0
    
    # Verify position was updated
    # Position should have changed due to initial velocity + forces
    final_position = kinematics_component.get_position()
    assert final_position.x != 100.0 or final_position.y != 100.0


def test_kinematics_system_friction(sample_creature, kinematics_component):
    """Test friction application"""
    system = KinematicsSystem()
    kinematics_component.set_creature_reference(sample_creature)
    
    # Set initial velocity
    initial_velocity = Vector2(100, 0)
    sample_creature.kinematics.velocity = initial_velocity
    
    # Update with friction
    dt = 0.016
    system.update(sample_creature, kinematics_component, dt)
    
    # Verify friction was applied (velocity should be reduced)
    final_velocity = kinematics_component.get_velocity()
    assert final_velocity.magnitude() < initial_velocity.magnitude()


def test_kinematics_system_speed_clamping(sample_creature, kinematics_component):
    """Test speed clamping behavior"""
    system = KinematicsSystem()
    kinematics_component.set_creature_reference(sample_creature)
    
    # Set very high velocity
    sample_creature.kinematics.velocity = Vector2(1000, 1000)
    sample_creature.forces = Vector2(0, 0)
    
    # Update should clamp speed
    dt = 0.016
    system.update(sample_creature, kinematics_component, dt)
    
    # Verify speed was clamped
    final_velocity = kinematics_component.get_velocity()
    expected_max = kinematics_component.max_speed + (sample_creature.genome.energy * 150.0)
    assert final_velocity.magnitude() <= expected_max + 1.0  # Small tolerance


def test_kinematics_system_batch_update():
    """Test batch update efficiency"""
    system = KinematicsSystem()
    
    # Create multiple creatures
    creatures = []
    components = []
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
        creature.forces = Vector2(i * 10, i * 5)
        # Set position after creation
        creature.kinematics.position = Vector2(i * 50, i * 50)
        creatures.append(creature)
        
        component = KinematicsComponent()
        component.set_creature_reference(creature)
        components.append(component)
    
    # Batch update
    dt = 0.016
    system.update_batch(creatures, components, dt)
    
    # Verify all creatures were updated
    for i, (creature, component) in enumerate(zip(creatures, components)):
        # Forces should be reset
        assert creature.forces.x == 0.0
        assert creature.forces.y == 0.0
        # Position should have changed
        initial_pos = Vector2(i * 50, i * 50)
        final_pos = component.get_position()
        assert final_pos != initial_pos
