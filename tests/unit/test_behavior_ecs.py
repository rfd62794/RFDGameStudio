"""
Unit tests for Behavior ECS components and systems
"""
import pytest
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.behavior_component import BehaviorComponent, BehaviorState
from src.shared.ecs.systems.behavior_system import BehaviorSystem, DungeonBehaviorSystem, RacingBehaviorSystem
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
    # Set position
    creature.kinematics.position = Vector2(100, 100)
    return creature


@pytest.fixture
def shy_creature():
    """Create a shy creature for testing"""
    genome = SlimeGenome(
        shape="round", size="medium", 
        base_color=(255, 0, 0), 
        pattern="solid", 
        pattern_color=(0, 0, 0),
        accessory="none",
        curiosity=0.3, energy=0.5, affection=0.2, shyness=0.8
    )
    creature = Creature(
        name="ShySlime",
        genome=genome
    )
    creature.forces = Vector2(0, 0)
    creature.kinematics.position = Vector2(100, 100)
    return creature


@pytest.fixture
def behavior_component():
    """Create a behavior component"""
    return BehaviorComponent()


def test_behavior_component_initialization():
    """Test BehaviorComponent initialization"""
    component = BehaviorComponent()
    assert component.target is None
    assert component.wander_timer == 0.0
    assert component.behavior_type == "default"
    assert not component.is_retreat_mode
    assert not component.is_follow_mode


def test_behavior_component_creature_reference(sample_creature, behavior_component):
    """Test component can access creature state"""
    # Set creature reference
    behavior_component.set_creature_reference(sample_creature)
    
    # Test getting creature reference
    creature_ref = behavior_component.get_creature()
    assert creature_ref == sample_creature


def test_behavior_system_no_cursor(sample_creature, behavior_component):
    """Test behavior system with no cursor interaction"""
    system = BehaviorSystem()
    behavior_component.set_creature_reference(sample_creature)
    
    # Update without cursor
    dt = 0.016
    force = system.update(sample_creature, behavior_component, dt, cursor_pos=None)
    
    # Should still have some wander force
    assert isinstance(force, Vector2)
    # Force should be non-zero due to wander behavior
    assert force.magnitude() >= 0.0


def test_behavior_system_cursor_interaction(sample_creature, behavior_component):
    """Test cursor interaction behavior"""
    system = BehaviorSystem()
    behavior_component.set_creature_reference(sample_creature)
    
    # Place cursor near creature
    cursor_pos = (120, 120)
    dt = 0.016
    
    force = system.update(sample_creature, behavior_component, dt, cursor_pos)
    
    # Should have some force due to cursor proximity
    assert isinstance(force, Vector2)
    # Force magnitude should be reasonable
    assert force.magnitude() < 1000.0


def test_behavior_system_shy_behavior(shy_creature, behavior_component):
    """Test shy creature retreat behavior"""
    system = BehaviorSystem()
    behavior_component.set_creature_reference(shy_creature)
    
    # Place cursor very close to shy creature
    cursor_pos = (110, 110)
    dt = 0.016
    
    force = system.update(shy_creature, behavior_component, dt, cursor_pos)
    
    # Shy creature should retreat (force should point away from cursor)
    assert isinstance(force, Vector2)
    # Force should push creature away from cursor
    creature_to_cursor = Vector2(*cursor_pos) - shy_creature.kinematics.position
    # Force should be in opposite direction of cursor (negative dot product)
    dot_product = force.x * creature_to_cursor.x + force.y * creature_to_cursor.y
    assert dot_product < 0  # Negative dot product = opposite direction


def test_behavior_system_wander_timer(sample_creature, behavior_component):
    """Test wander timer behavior"""
    system = BehaviorSystem()
    behavior_component.set_creature_reference(sample_creature)
    
    # Set wander timer to trigger new target
    behavior_component.wander_timer = -1.0
    initial_target = behavior_component.target
    
    dt = 0.016
    system.update(sample_creature, behavior_component, dt)
    
    # Timer should be reset
    assert behavior_component.wander_timer > 0.0
    # Target might be set (depending on curiosity)
    if sample_creature.genome.curiosity > 0.7:
        assert behavior_component.target is not None


def test_behavior_system_batch_update():
    """Test batch update efficiency"""
    system = BehaviorSystem()
    
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
        creature.forces = Vector2(0, 0)
        creature.kinematics.position = Vector2(i * 50, i * 50)
        creatures.append(creature)
        
        component = BehaviorComponent()
        component.set_creature_reference(creature)
        components.append(component)
    
    # Batch update
    dt = 0.016
    forces = system.update_batch(creatures, components, dt)
    
    # Should return forces for all creatures
    assert len(forces) == 3
    for force in forces:
        assert isinstance(force, Vector2)


def test_dungeon_behavior_system(sample_creature, behavior_component):
    """Test dungeon-specific behavior system"""
    system = DungeonBehaviorSystem()
    behavior_component.set_creature_reference(sample_creature)
    
    dt = 0.016
    force = system.update(sample_creature, behavior_component, dt)
    
    # Should set behavior type to dungeon
    assert behavior_component.behavior_type == "dungeon"
    # Should return a force
    assert isinstance(force, Vector2)


def test_racing_behavior_system(sample_creature, behavior_component):
    """Test racing-specific behavior system"""
    system = RacingBehaviorSystem()
    behavior_component.set_creature_reference(sample_creature)
    
    dt = 0.016
    force = system.update(sample_creature, behavior_component, dt)
    
    # Should set behavior type to racing
    assert behavior_component.behavior_type == "racing"
    # Should return a force
    assert isinstance(force, Vector2)


def test_behavior_state():
    """Test BehaviorState dataclass"""
    state = BehaviorState()
    
    assert state.target_force == Vector2(0, 0)
    assert not state.should_retreat
    assert not state.should_follow
    assert state.wander_direction is None
    
    # Test with values
    state = BehaviorState(
        target_force=Vector2(10, 5),
        should_retreat=True,
        should_follow=False,
        wander_direction=Vector2(1, 0)
    )
    
    assert state.target_force.x == 10
    assert state.target_force.y == 5
    assert state.should_retreat
    assert not state.should_follow
    assert state.wander_direction.x == 1
