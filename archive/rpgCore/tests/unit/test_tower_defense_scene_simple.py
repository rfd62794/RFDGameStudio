"""
Simplified unit tests for Tower Defense Scene (without UI)
"""
import pytest
from unittest.mock import Mock, patch
from src.apps.slime_breeder.scenes.scene_tower_defense import TowerDefenseScene
from src.shared.ui.spec import SPEC_720
from src.shared.teams.roster import Roster
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.sessions.tower_defense_session import TowerDefenseSession


@pytest.fixture
def scene_manager():
    """Create a mock scene manager"""
    manager = Mock()
    manager.spec = SPEC_720
    return manager


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


def test_tower_defense_scene_core_functionality(scene_manager, sample_creature):
    """Test core TowerDefenseScene functionality without UI"""
    # Mock the UI setup to avoid UI issues
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Test basic initialization
        assert scene.session is not None
        assert scene.grid_size == 10
        assert scene.tile_size == 48
        assert scene.component_registry is not None
        assert scene.system_runner is not None
        assert scene.tower_behavior_system is not None
        assert scene.wave_system is not None
        assert scene.upgrade_system is not None
        assert scene.collision_system is not None
        assert scene.game_started is False
        
        # Test session functionality
        scene.session.start_game()
        assert scene.session.game_active is True
        assert scene.session.wave == 1
        assert scene.session.gold == 100
        assert scene.session.lives == 20
        
        # Test tower placement
        success = scene.session.place_tower(sample_creature, 2, 3)
        assert success is True
        assert len(scene.session.towers) == 1
        assert (2, 3) in scene.session.tower_grid
        
        # Test tower removal
        success = scene.session.remove_tower(2, 3)
        assert success is True
        assert len(scene.session.towers) == 0
        assert (2, 3) not in scene.session.tower_grid
        
        # Test gold management
        scene.session.add_gold(50)
        assert scene.session.gold == 150
        
        success = scene.session.spend_gold(75)
        assert success is True
        assert scene.session.gold == 75
        
        success = scene.session.spend_gold(100)
        assert success is False
        assert scene.session.gold == 75
        
        # Test lives
        scene.session.lose_life()
        assert scene.session.lives == 19
        
        # Test score
        scene.session.add_score(100)
        assert scene.session.score == 100
        
        # Test wave completion
        scene.session.complete_wave()
        assert scene.session.completed_waves == 1
        assert scene.session.wave == 2
        assert scene.session.gold > 75  # Should have bonus gold
        
        # Test game end
        scene.session.end_game(victory=True)
        assert scene.session.game_active is False
        assert scene.session.game_over is True
        assert scene.session.victory is True


def test_tower_defense_scene_ecs_integration(scene_manager, sample_creature):
    """Test ECS integration without UI"""
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Start game
        scene.session.start_game()
        
        # Place tower in session first
        scene.session.place_tower(sample_creature, 2, 3)
        
        # Add tower to ECS
        scene._add_tower_to_ecs(sample_creature)
        
        # Check components were added
        from src.shared.ecs.components.tower_component import TowerComponent
        from src.shared.ecs.components.behavior_component import BehaviorComponent
        from src.shared.ecs.components.grid_position_component import GridPositionComponent
        
        assert scene.component_registry.get_component(
            sample_creature.slime_id, 
            TowerComponent
        ) is not None
        
        assert scene.component_registry.get_component(
            sample_creature.slime_id, 
            BehaviorComponent
        ) is not None
        
        assert scene.component_registry.get_component(
            sample_creature.slime_id, 
            GridPositionComponent
        ) is not None
        
        # Test grid position
        grid_pos = scene._find_tower_grid_position(sample_creature)
        assert isinstance(grid_pos, tuple)
        
        # Test tower finding
        found_tower = scene._find_tower_by_id(sample_creature.slime_id)
        assert found_tower is not None
        assert found_tower.slime_id == sample_creature.slime_id
        
        # Test enemy addition
        scene._add_enemy_to_ecs(sample_creature)
        assert scene.component_registry.get_component(
            sample_creature.slime_id, 
            BehaviorComponent
        ) is not None


def test_tower_defense_scene_game_flow(scene_manager, sample_creature):
    """Test complete game flow without UI"""
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Start game
        scene.session.start_game()
        
        # Place tower
        scene.session.place_tower(sample_creature, 2, 3)
        scene._add_tower_to_ecs(sample_creature)
        
        # Update game
        scene.update(0.016)
        
        # Check game state
        assert scene.session.game_active is True
        assert len(scene.session.towers) == 1
        
        # End game
        scene.session.end_game(victory=True)
        
        # Check game over state
        assert scene.session.game_over is True
        assert scene.session.victory is True


def test_tower_defense_scene_session_management(scene_manager):
    """Test session management without UI"""
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Test multiple sessions
        session1 = TowerDefenseSession()
        session2 = TowerDefenseSession()
        
        assert session1.session_id != session2.session_id
        
        # Test session state
        session1.start_game()
        session2.start_game()
        
        assert session1.game_active is True
        assert session2.game_active is True
        
        # Test session isolation
        session1.add_gold(50)
        session2.add_gold(100)
        
        assert session1.gold == 150
        assert session2.gold == 200
        
        # Test session end
        session1.end_game(victory=True)
        session2.end_game(victory=False)
        
        assert session1.victory is True
        assert session2.victory is False


def test_tower_defense_scene_statistics(scene_manager, sample_creature):
    """Test statistics tracking without UI"""
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Start game and add tower
        scene.session.start_game()
        scene.session.place_tower(sample_creature, 2, 3)
        
        # Simulate some game activity
        scene.session.enemies_killed = 15
        scene.session.enemies_escaped = 3
        scene.session.completed_waves = 4
        scene.session.add_score(250)
        
        # Check statistics
        stats = scene.session.get_statistics()
        assert stats['enemies_killed'] == 15
        assert stats['enemies_escaped'] == 3
        assert stats['completed_waves'] == 4
        assert stats['final_score'] == 250
        assert stats['victory'] is False
        
        # Test game state
        game_state = scene.session.get_game_state()
        assert game_state['session_id'] == scene.session.session_id
        assert game_state['wave'] == scene.session.wave
        assert game_state['gold'] == scene.session.gold
        assert game_state['lives'] == scene.session.lives
        assert game_state['score'] == scene.session.score


def test_tower_defense_scene_wave_system(scene_manager):
    """Test wave system integration without UI"""
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Start game
        scene.session.start_game()
        
        # Test wave system
        new_enemies = scene.wave_system.update(scene.session.wave_component, 0.1)
        assert len(new_enemies) == 0  # Should not spawn immediately
        
        # Update with enough time to spawn
        new_enemies = scene.wave_system.update(scene.session.wave_component, 2.1)
        assert len(new_enemies) > 0  # Should spawn enemies
        
        # Check wave info
        wave_info = scene.session.wave_component.get_wave_info()
        assert wave_info['wave_number'] == 1
        assert wave_info['is_active'] is True


def test_tower_defense_scene_collision_system(scene_manager, sample_creature):
    """Test collision system integration without UI"""
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Start game and add tower
        scene.session.start_game()
        scene.session.place_tower(sample_creature, 2, 3)
        scene._add_tower_to_ecs(sample_creature)
        
        # Test collision system
        results = scene.collision_system.update(
            scene.session.towers, 
            scene.session.enemies, 
            0.016
        )
        
        # Check results structure
        assert 'enemies_killed' in results
        assert 'gold_earned' in results
        assert 'enemies_escaped' in results
        assert 'damage_dealt' in results
        
        # Check projectile count
        assert scene.collision_system.get_projectile_count() >= 0


def test_tower_defense_scene_upgrade_system(scene_manager, sample_creature):
    """Test upgrade system integration without UI"""
    with patch.object(TowerDefenseScene, '_setup_ui'):
        scene = TowerDefenseScene(scene_manager, SPEC_720)
        
        # Test upgrade system
        from src.shared.ecs.components.tower_component import TowerComponent
        from src.shared.ecs.components.behavior_component import BehaviorComponent
        
        tower_component = TowerComponent()
        
        # Add components
        scene.component_registry.add_component(sample_creature.slime_id, TowerComponent, tower_component)
        
        behavior_component = BehaviorComponent()
        scene.component_registry.add_component(sample_creature.slime_id, BehaviorComponent, behavior_component)
        
        # Test upgrade
        success, remaining_gold = scene.upgrade_system.upgrade_tower(
            tower_component, "damage", 150
        )
        assert success is True
        assert remaining_gold == 50
        assert tower_component.damage_upgrades == 1
        
        # Test upgrade info
        upgrade_info = scene.upgrade_system.get_upgrade_info(tower_component)
        assert "damage" in upgrade_info
        assert "range" in upgrade_info
        assert "fire_rate" in upgrade_info
        
        # Test upgrade validation
        assert scene.upgrade_system.can_upgrade(tower_component, "damage") is True
        assert scene.upgrade_system.can_upgrade(tower_component, "invalid") is False
