"""
Integration tests for pathfinding system.
Tests the fixed import resolution and basic functionality.
"""

import pytest
from typing import List, Tuple

from src.logic.pathfinding import PathfindingGrid, NavigationSystem, MovementController, NavigationFactory


class TestPathfindingIntegration:
    """Test pathfinding system integration."""
    
    def test_pathfinding_grid_creation(self):
        """Test PathfindingGrid can be created and initialized."""
        grid = PathfindingGrid(20, 20)
        
        assert grid.width == 20
        assert grid.height == 20
        assert grid.is_walkable((12, 12))  # Center should be walkable (avoid interior wall)
        assert not grid.is_walkable((0, 0))  # Border wall
        assert not grid.is_walkable((19, 19))  # Border wall
    
    def test_navigation_system_creation(self):
        """Test NavigationSystem can be created with grid."""
        grid = PathfindingGrid(20, 20)
        nav_system = NavigationSystem(grid)
        
        assert nav_system.pathfinding_grid == grid
        assert nav_system.current_path is None
        assert nav_system.path_index == 0
    
    def test_pathfinding_basic_functionality(self):
        """Test basic pathfinding functionality."""
        grid = PathfindingGrid(20, 20)
        
        # Test simple path
        start = (2, 2)
        goal = (18, 18)
        path = grid.find_path(start, goal)
        
        assert path is not None
        assert len(path) > 0
        assert path[0] != start  # First step should not be start position
        assert path[-1] == goal  # Last step should be goal
    
    def test_navigation_path_setting(self):
        """Test NavigationSystem path setting and traversal."""
        grid = PathfindingGrid(20, 20)
        nav_system = NavigationSystem(grid)
        
        start_pos = (2, 2)
        beacon_coords = (18, 18)
        
        # Set path
        success = nav_system.set_path_to_beacon(start_pos, beacon_coords)
        assert success
        assert nav_system.current_path is not None
        assert not nav_system.is_path_complete()
        
        # Get next positions
        next_pos = nav_system.get_next_position()
        assert next_pos is not None
        assert isinstance(next_pos, tuple)
        assert len(next_pos) == 2
    
    def test_movement_controller_creation(self):
        """Test MovementController can be created (without simulator dependency)."""
        # We can't test full functionality without a real SimulatorHost
        # but we can test the class can be instantiated with type checking
        try:
            # This should work with our forward reference fix
            controller = MovementController(None)  # Pass None for testing
            assert controller.simulator is None
            assert controller.is_moving is False
            assert controller.movement_queue == []
        except Exception as e:
            pytest.fail(f"MovementController creation failed: {e}")
    
    def test_navigation_factory(self):
        """Test NavigationFactory creates components correctly."""
        # Test navigation system creation
        nav_system = NavigationFactory.create_navigation_system(15, 15)
        assert isinstance(nav_system, NavigationSystem)
        assert nav_system.pathfinding_grid.width == 15
        assert nav_system.pathfinding_grid.height == 15
        
        # Test movement controller creation
        controller = NavigationFactory.create_movement_controller(None)
        assert isinstance(controller, MovementController)
        assert controller.simulator is None
    
    def test_pathfinding_edge_cases(self):
        """Test pathfinding edge cases."""
        grid = PathfindingGrid(20, 20)  # Use larger grid to avoid interior wall issues
        
        # Test invalid start/goal
        assert grid.find_path((-1, 0), (5, 5)) is None
        assert grid.find_path((0, 0), (5, 5)) is None  # Wall
        assert grid.find_path((5, 5), (25, 25)) is None
        
        # Test same start and goal - should return empty path (already at goal)
        path = grid.find_path((12, 12), (12, 12))
        assert path is not None  # Should find trivial path
    
    def test_neighbor_calculation(self):
        """Test neighbor calculation for pathfinding."""
        grid = PathfindingGrid(20, 20)  # Use larger grid
        
        # Test center position has all neighbors
        neighbors = grid.get_neighbors((12, 12))  # Center of 20x20 grid, avoiding interior walls
        assert len(neighbors) == 8  # All 8 directions
        
        # Test edge position has fewer neighbors
        edge_neighbors = grid.get_neighbors((0, 10))
        assert len(edge_neighbors) < 8
        
        # Test corner position
        corner_neighbors = grid.get_neighbors((0, 0))
        assert len(corner_neighbors) < 8


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
