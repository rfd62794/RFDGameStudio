"""
Unit tests for Tower Defense Scene
"""
import pytest
import pygame
from unittest.mock import Mock, patch
from src.apps.slime_breeder.scenes.scene_tower_defense import TowerDefenseScene
from src.shared.ui.spec import SPEC_720
from src.shared.teams.roster import Roster
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Vector2


@pytest.fixture
def scene_manager():
    """Create a mock scene manager"""
    manager = Mock()
    # The scene manager should have the spec, but the scene constructor takes it directly
    return manager


@pytest.fixture
def tower_defense_scene():
    """Create a tower defense scene"""
    # Create a mock scene manager with proper spec
    manager = Mock()
    scene = TowerDefenseScene(manager, SPEC_720)
    return scene


@pytest.fixture
def sample_creature():
    """Create a sample creature"""
    genome = SlimeGenome(
        shape="round", size="medium", 
        base_color=(255, 0, 0), 
        pattern="solid", 
        pattern_color=(0, 0, 0),
        accessory="none",
        curiosity=0.5, energy=0.5, affection=0.3, shyness=0.2
    )
    creature = Creature(
        name="TestSlime",
        genome=genome
    )
    creature.kinematics.position = Vector2(100, 100)
    return creature


def test_tower_defense_scene_initialization(tower_defense_scene):
    """Test TowerDefenseScene initialization"""
    assert tower_defense_scene.session is not None
    assert tower_defense_scene.grid_size == 10
    assert tower_defense_scene.tile_size == 48
    assert tower_defense_scene.component_registry is not None
    assert tower_defense_scene.system_runner is not None
    assert tower_defense_scene.tower_behavior_system is not None
    assert tower_defense_scene.wave_system is not None
    assert tower_defense_scene.upgrade_system is not None
    assert tower_defense_scene.collision_system is not None
    assert tower_defense_scene.game_started is False


def test_tower_defense_scene_setup_ui(tower_defense_scene):
    """Test UI setup"""
    assert tower_defense_scene.game_panel is not None
    assert tower_defense_scene.hud_panel is not None
    assert tower_defense_scene.tower_selection_panel is not None
    assert tower_defense_scene.upgrade_menu_panel is not None
    assert tower_defense_scene.game_over_panel is not None
    
    assert tower_defense_scene.wave_label is not None
    assert tower_defense_scene.gold_label is not None
    assert tower_defense_scene.lives_label is not None
    assert tower_defense_scene.score_label is not None
    
    assert tower_defense_scene.start_button is not None
    assert tower_defense_scene.pause_button is not None
    assert tower_defense_scene.menu_button is not None
    
    assert len(tower_defense_scene.tower_buttons) == 8
    assert len(tower_defense_scene.upgrade_buttons) == 3


def test_tower_defense_scene_handle_events(tower_defense_scene):
    """Test event handling"""
    # Mock pygame events
    events = []
    
    # Test with no events
    tower_defense_scene.handle_events(events)
    
    # Test with mouse click event
    mouse_click_event = Mock()
    mouse_click_event.type = pygame.MOUSEBUTTONDOWN
    mouse_click_event.pos = (100, 100)
    events = [mouse_click_event]
    
    # Should not crash
    tower_defense_scene.handle_events(events)


def test_tower_defense_scene_handle_grid_click(tower_defense_scene):
    """Test grid click handling"""
    # Test grid click without game active
    tower_defense_scene._handle_grid_click(2, 3, 200, 150)
    
    # Start game
    tower_defense_scene.session.start_game()
    
    # Test grid click with game active
    tower_defense_scene._handle_grid_click(2, 3, 200, 150)
    
    # Should show tower selection
    assert tower_defense_scene.show_tower_selection is True


def test_tower_defense_scene_handle_tower_selection(tower_defense_scene, sample_creature):
    """Test tower selection handling"""
    tower_defense_scene.session.start_game()
    tower_defense_scene.show_tower_selection = True
    tower_defense_scene.selected_slime = sample_creature
    
    # Test tower selection
    tower_defense_scene._handle_tower_selection_click(0, 0)
    
    # Should place tower
    assert len(tower_defense_scene.session.towers) == 1
    assert tower_defense_scene.show_tower_selection is False


def test_tower_defense_scene_handle_upgrade_menu(tower_defense_scene, sample_creature):
    """Test upgrade menu handling"""
    tower_defense_scene.session.start_game()
    
    # Place a tower
    tower_defense_scene.session.place_tower(sample_creature, 2, 3)
    tower_defense_scene._add_tower_to_ecs(sample_creature)
    
    # Select tower
    tower_defense_scene.selected_tower = sample_creature.slime_id
    tower_defense_scene.show_upgrade_menu = True
    
    # Test upgrade menu click
    tower_defense_scene._handle_upgrade_menu_click(100, 100)
    
    # Should close menu
    assert tower_defense_scene.show_upgrade_menu is False


def test_tower_defense_scene_handle_key_press(tower_defense_scene):
    """Test keyboard event handling"""
    # Test ESC key
    esc_event = Mock()
    esc_event.type = pygame.KEYDOWN
    esc_event.key = pygame.K_ESCAPE
    
    tower_defense_scene.handle_events([esc_event])
    
    # Test SPACE key
    space_event = Mock()
    space_event.type = pygame.KEYDOWN
    space_event.key = pygame.K_SPACE
    
    tower_defense_scene.handle_events([space_event])
    
    # Should start game
    assert tower_defense_scene.session.game_active is True


def test_tower_defense_scene_update(tower_defense_scene):
    """Test game update"""
    # Test update without game active
    tower_defense_scene.update(0.016)
    
    # Start game
    tower_defense_scene.session.start_game()
    
    # Test update with game active
    tower_defense_scene.update(0.016)
    
    # Should not crash
    assert tower_defense_scene.session.game_active is True


def test_tower_defense_scene_update_ecs_systems(tower_defense_scene, sample_creature):
    """Test ECS system updates"""
    tower_defense_scene.session.start_game()
    
    # Add tower to session
    tower_defense_scene.session.place_tower(sample_creature, 2, 3)
    tower_defense_scene._add_tower_to_ecs(sample_creature)
    
    # Update ECS systems
    tower_defense_scene._update_ecs_systems(0.016)
    
    # Should not crash
    assert len(tower_defense_scene.session.towers) == 1


def test_tower_defense_scene_add_tower_to_ecs(tower_defense_scene, sample_creature):
    """Test adding tower to ECS"""
    tower_defense_scene._add_tower_to_ecs(sample_creature)
    
    # Check components were added
    from src.shared.ecs.components.tower_component import TowerComponent
    from src.shared.ecs.components.behavior_component import BehaviorComponent
    from src.shared.ecs.components.grid_position_component import GridPositionComponent
    
    assert tower_defense_scene.component_registry.get_component(
        sample_creature.slime_id, 
        TowerComponent
    ) is not None
    
    assert tower_defense_scene.component_registry.get_component(
        sample_creature.slime_id, 
        BehaviorComponent
    ) is not None
    
    assert tower_defense_scene.component_registry.get_component(
        sample_creature.slime_id, 
        GridPositionComponent
    ) is not None


def test_tower_defense_scene_add_enemy_to_ecs(tower_defense_scene, sample_creature):
    """Test adding enemy to ECS"""
    tower_defense_scene._add_enemy_to_ecs(sample_creature)
    
    # Check behavior component was added
    from src.shared.ecs.components.behavior_component import BehaviorComponent
    assert tower_defense_scene.component_registry.get_component(
        sample_creature.slime_id, 
        BehaviorComponent
    ) is not None


def test_tower_defense_scene_find_tower_grid_position(tower_defense_scene, sample_creature):
    """Test finding tower grid position"""
    tower_defense_scene.session.start_game()
    
    # Place tower
    tower_defense_scene.session.place_tower(sample_creature, 2, 3)
    
    # Find grid position
    grid_pos = tower_defense_scene._find_tower_grid_position(sample_creature)
    
    assert grid_pos == (2, 3)


def test_tower_defense_scene_find_tower_by_id(tower_defense_scene, sample_creature):
    """Test finding tower by ID"""
    tower_defense_scene.session.start_game()
    
    # Place tower
    tower_defense_scene.session.place_tower(sample_creature, 2, 3)
    
    # Find tower
    found_tower = tower_defense_scene._find_tower_by_id(sample_creature.slime_id)
    
    assert found_tower is not None
    assert found_tower.slime_id == sample_creature.slime_id


def test_tower_defense_scene_add_all_towers_to_ecs(tower_defense_scene, sample_creature):
    """Test adding all towers to ECS"""
    tower_defense_scene.session.start_game()
    
    # Place multiple towers
    tower_defense_scene.session.place_tower(sample_creature, 2, 3)
    
    # Add all towers to ECS
    tower_defense_scene._add_all_towers_to_ecs()
    
    # Check components were added
    from src.shared.ecs.components.tower_component import TowerComponent
    assert tower_defense_scene.component_registry.get_component(
        sample_creature.slime_id, 
        TowerComponent
    ) is not None


def test_tower_defense_scene_handle_session_end(tower_defense_scene):
    """Test session end handling"""
    tower_defense_scene.session.start_game()
    tower_defense_scene.session.end_game(victory=True)
    
    # Handle session end
    tower_defense_scene._handle_session_end()
    
    # Should not crash
    assert tower_defense_scene.session.game_over is True


def test_tower_defense_scene_render(tower_defense_scene):
    """Test rendering"""
    # Mock pygame surface
    surface = Mock()
    surface.fill = Mock()
    surface.get_width = Mock(return_value=720)
    surface.get_height = Mock(return_value=480)
    
    # Mock pygame drawing functions
    with patch('pygame.draw.line'), \
         patch('pygame.draw.rect'), \
         patch('pygame.draw.circle'), \
         patch('pygame.display.set_mode'), \
         patch('pygame.display.update'):
        
        # Render scene
        tower_defense_scene.render(surface)
        
        # Should not crash
        assert surface.fill.called


def test_tower_defense_scene_render_grid(tower_defense_scene):
    """Test grid rendering"""
    # Mock pygame surface
    surface = Mock()
    surface.get_width = Mock(return_value=720)
    surface.get_height = Mock(return_value=480)
    
    # Mock pygame drawing functions
    with patch('pygame.draw.line'), \
         patch('pygame.draw.rect'):
        
        # Render grid
        tower_defense_scene._render_grid(surface)
        
        # Should not crash
        assert True


def test_tower_defense_scene_render_towers(tower_defense_scene, sample_creature):
    """Test tower rendering"""
    # Mock pygame surface
    surface = Mock()
    surface.get_width = Mock(return_value=720)
    surface.get_height = Mock(return_value=480)
    
    # Place tower
    tower_defense_scene.session.start_game()
    tower_defense_scene.session.place_tower(sample_creature, 2, 3)
    
    # Mock pygame drawing functions
    with patch('pygame.draw.circle'):
        
        # Render towers
        tower_defense_scene._render_towers(surface)
        
        # Should not crash
        assert True


def test_tower_defense_scene_render_enemies(tower_defense_scene, sample_creature):
    """Test enemy rendering"""
    # Mock pygame surface
    surface = Mock()
    surface.get_width = Mock(return_value=720)
    surface.get_height = Mock(return_value=480)
    
    # Add enemy
    tower_defense_scene.session.start_game()
    tower_defense_scene.session.enemies.append(sample_creature)
    
    # Mock pygame drawing functions
    with patch('pygame.draw.circle'):
        
        # Render enemies
        tower_defense_scene._render_enemies(surface)
        
        # Should not crash
        assert True


def test_tower_defense_scene_render_projectiles(tower_defense_scene):
    """Test projectile rendering"""
    # Mock pygame surface
    surface = Mock()
    surface.get_width = Mock(return_value=720)
    surface.get_height = Mock(return_value=480)
    
    # Mock pygame drawing functions
    with patch('pygame.draw.circle'):
        
        # Render projectiles
        tower_defense_scene._render_projectiles(surface)
        
        # Should not crash
        assert True


def test_tower_defense_scene_render_ui(tower_defense_scene):
    """Test UI rendering"""
    # Mock pygame surface
    surface = Mock()
    surface.get_width = Mock(return_value=720)
    surface.get_height = Mock(return_value=480)
    
    # Mock pygame drawing functions
    with patch('pygame.draw.rect'), \
         patch('pygame.display.set_mode'), \
         patch('pygame.display.update'):
        
        # Render UI
        tower_defense_scene._render_ui(surface)
        
        # Should not crash
        assert True


def test_tower_defense_scene_render_overlays(tower_defense_scene):
    """Test overlay rendering"""
    # Mock pygame surface
    surface = Mock()
    surface.get_width = Mock(return_value=720)
    surface.get_height = Mock(return_value=480)
    
    # Mock pygame drawing functions
    with patch('pygame.draw.rect'), \
         patch('pygame.display.set_mode'), \
         patch('pygame.display.update'):

        # Test tower selection overlay
        tower_defense_scene.show_tower_selection = True
        tower_defense_scene._render_tower_selection(surface)

        # Test upgrade menu overlay
        tower_defense_scene.show_tower_selection = False
        tower_defense_scene.show_upgrade_menu = True
        tower_defense_scene.selected_tower = "TestTower"  # Set a string instead of None
        tower_defense_scene._render_upgrade_menu(surface)

        # Test game over overlay
        tower_defense_scene.show_upgrade_menu = False
        tower_defense_scene.show_game_over = True
        tower_defense_scene._render_game_over(surface)

        # Should not crash
        assert True


def test_tower_defense_scene_game_flow(tower_defense_scene, sample_creature):
    """Test complete game flow"""
    # Start game
    tower_defense_scene.session.start_game()
    
    # Place tower
    tower_defense_scene.session.place_tower(sample_creature, 2, 3)
    tower_defense_scene._add_tower_to_ecs(sample_creature)
    
    # Update game
    tower_defense_scene.update(0.016)
    
    # Check game state
    assert tower_defense_scene.session.game_active is True
    assert len(tower_defense_scene.session.towers) == 1
    
    # End game
    tower_defense_scene.session.end_game(victory=True)
    tower_defense_scene._handle_session_end()
    
    # Check game over state
    assert tower_defense_scene.session.game_over is True
    assert tower_defense_scene.session.victory is True
