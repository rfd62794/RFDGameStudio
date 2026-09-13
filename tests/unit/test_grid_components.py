"""
Unit tests for Grid Position Component and Tower Component
"""
import pytest
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.grid_position_component import GridPositionComponent, GridUtilities
from src.shared.ecs.components.tower_component import TowerComponent


@pytest.fixture
def grid_position():
    """Create a grid position component"""
    return GridPositionComponent(grid_x=5, grid_y=3)


@pytest.fixture
def tower_component():
    """Create a tower component"""
    return TowerComponent(
        tower_type="scout",
        base_damage=15.0,
        base_range=120.0,
        base_fire_rate=2.0
    )


def test_grid_position_initialization():
    """Test GridPositionComponent initialization"""
    component = GridPositionComponent(grid_x=2, grid_y=4)
    assert component.grid_x == 2
    assert component.grid_y == 4


def test_grid_position_world_position(grid_position):
    """Test grid to world position conversion"""
    world_pos = grid_position.world_position()
    expected_x = 5 * 48  # 240
    expected_y = 3 * 48  # 144
    assert world_pos.x == expected_x
    assert world_pos.y == expected_y


def test_grid_position_set_world_position(grid_position):
    """Test setting grid position from world coordinates"""
    world_pos = Vector2(96, 48)  # Should map to grid (2, 1)
    grid_position.set_world_position(world_pos)
    assert grid_position.grid_x == 2
    assert grid_position.grid_y == 1


def test_grid_position_valid_position(grid_position):
    """Test grid position validation"""
    # Valid position
    assert grid_position.is_valid_position() is True
    
    # Invalid position (out of bounds)
    invalid_component = GridPositionComponent(grid_x=15, grid_y=3)
    assert invalid_component.is_valid_position() is False
    
    invalid_component = GridPositionComponent(grid_x=3, grid_y=15)
    assert invalid_component.is_valid_position() is False


def test_grid_utilities_world_to_grid():
    """Test world to grid conversion"""
    world_pos = Vector2(96, 48)  # Should map to (2, 1)
    grid_x, grid_y = GridUtilities.world_to_grid(world_pos)
    assert grid_x == 2
    assert grid_y == 1


def test_grid_utilities_grid_to_world():
    """Test grid to world conversion"""
    world_pos = GridUtilities.grid_to_world(3, 4)
    expected_x = 3 * 48  # 144
    expected_y = 4 * 48  # 192
    assert world_pos.x == expected_x
    assert world_pos.y == expected_y


def test_grid_utilities_get_tile_center():
    """Test getting tile center position"""
    center = GridUtilities.get_tile_center(2, 3)
    expected_x = 2 * 48 + 24  # 96 + 24 = 120
    expected_y = 3 * 48 + 24  # 144 + 24 = 168
    assert center.x == expected_x
    assert center.y == expected_y


def test_grid_utilities_distance_tiles():
    """Test distance calculation between grid positions"""
    distance = GridUtilities.distance_tiles(0, 0, 3, 4)
    expected_distance = (3*3 + 4*4) ** 0.5  # 5.0
    assert distance == expected_distance


def test_grid_utilities_is_adjacent():
    """Test adjacency checking"""
    # Adjacent positions
    assert GridUtilities.is_adjacent(2, 2, 3, 2) is True  # Right
    assert GridUtilities.is_adjacent(2, 2, 2, 3) is True  # Down
    assert GridUtilities.is_adjacent(2, 2, 3, 3) is True  # Diagonal
    
    # Not adjacent
    assert GridUtilities.is_adjacent(2, 2, 4, 2) is False  # Too far
    assert GridUtilities.is_adjacent(2, 2, 2, 2) is False  # Same position


def test_tower_component_initialization(tower_component):
    """Test TowerComponent initialization"""
    assert tower_component.tower_type == "scout"
    assert tower_component.base_damage == 15.0
    assert tower_component.base_range == 120.0
    assert tower_component.base_fire_rate == 2.0
    assert tower_component.damage_upgrades == 0
    assert tower_component.range_upgrades == 0
    assert tower_component.fire_rate_upgrades == 0


def test_tower_component_get_damage(tower_component):
    """Test damage calculation with upgrades"""
    # No upgrades
    assert tower_component.get_damage() == 15.0
    
    # Add damage upgrades
    tower_component.damage_upgrades = 2
    expected_damage = 15.0 * (1.0 + 0.1 * 2)  # 18.0
    assert tower_component.get_damage() == expected_damage


def test_tower_component_get_range(tower_component):
    """Test range calculation with upgrades"""
    # No upgrades
    assert tower_component.get_range() == 120.0
    
    # Add range upgrades
    tower_component.range_upgrades = 1
    expected_range = 120.0 * (1.0 + 0.1 * 1)  # 132.0
    assert tower_component.get_range() == expected_range


def test_tower_component_get_fire_rate(tower_component):
    """Test fire rate calculation with upgrades"""
    # No upgrades
    assert tower_component.get_fire_rate() == 2.0
    
    # Add fire rate upgrades
    tower_component.fire_rate_upgrades = 3
    expected_rate = 2.0 * (1.0 + 0.1 * 3)  # 2.6
    assert tower_component.get_fire_rate() == expected_rate


def test_tower_component_can_fire(tower_component):
    """Test fire cooldown logic"""
    current_time = 0.0
    
    # Can fire initially
    assert tower_component.can_fire(current_time) is True
    
    # Fire once
    tower_component.fire(current_time)
    
    # Can't fire immediately after firing (same time)
    assert tower_component.can_fire(current_time) is False
    
    # Can't fire until cooldown passes
    assert tower_component.can_fire(current_time + 0.3) is False
    assert tower_component.can_fire(current_time + 0.6) is True


def test_tower_component_target_management(tower_component):
    """Test target setting and clearing"""
    target = Vector2(100, 50)
    
    # Set target
    tower_component.set_target(target)
    assert tower_component.target == target
    assert tower_component.rotation != 0.0  # Should have rotation
    
    # Clear target
    tower_component.clear_target()
    assert tower_component.target is None


def test_tower_component_upgrade_costs(tower_component):
    """Test upgrade cost calculation"""
    # Initial costs
    assert tower_component.get_upgrade_cost("damage") == 100
    assert tower_component.get_upgrade_cost("range") == 150
    assert tower_component.get_upgrade_cost("fire_rate") == 120
    
    # After one upgrade
    tower_component.damage_upgrades = 1
    assert tower_component.get_upgrade_cost("damage") == 200  # 100 * 2
    
    # Total upgrade cost
    tower_component.range_upgrades = 1
    tower_component.fire_rate_upgrades = 1
    total_cost = tower_component.get_total_upgrade_cost()
    expected_cost = 100 + 150 + 120  # 370 (damage_upgrades=1, range_upgrades=1, fire_rate_upgrades=1)
    assert total_cost == expected_cost


def test_tower_component_upgrade_validation(tower_component):
    """Test upgrade validation"""
    # Can upgrade with enough gold
    assert tower_component.can_upgrade("damage", 150) is True
    
    # Cannot upgrade with insufficient gold
    assert tower_component.can_upgrade("damage", 50) is False
    
    # Apply upgrade
    tower_component.upgrade("damage")
    assert tower_component.damage_upgrades == 1


def test_tower_component_invalid_upgrade(tower_component):
    """Test invalid upgrade type"""
    # Invalid upgrade type should not crash
    assert tower_component.get_upgrade_cost("invalid") == 0
    assert tower_component.can_upgrade("invalid", 100) is False
    tower_component.upgrade("invalid")  # Should not crash
    assert tower_component.damage_upgrades == 0
