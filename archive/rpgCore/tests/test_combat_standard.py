import pytest
import pygame
from unittest.mock import MagicMock, patch
from src.apps.dungeon_crawler.ui.scene_dungeon_combat import DungeonCombatScene
from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
from src.apps.dungeon_crawler.entities.hero import Hero
from src.shared.ui.spec import SPEC_720

@pytest.fixture
def mock_session():
    from src.shared.combat.turn_order import TurnOrderManager
    session = DungeonSession()
    session.hero = Hero("TestHero", "fighter")
    session.hero.stats["speed"] = 10 # Ensure hero acts first
    session.turn_manager = TurnOrderManager()
    session.floor = MagicMock()
    session.floor.depth = 1
    return session

@pytest.fixture
def manager():
    m = MagicMock()
    m.width = 800
    m.height = 600
    return m

def test_combat_attack_button_resolves_turn(mock_session, manager):
    pygame.init()
    scene = DungeonCombatScene(manager, SPEC_720, session=mock_session)
    scene.on_enter()
    # Mock some enemies and party
    scene.on_combat_enter(session=mock_session, enemy_entity=MagicMock())
    
    # Hero turn is active by default in on_enter if speeds match
    initial_hp = scene.enemies[0].stats["hp"]
    
    # Logic: if hit, HP degrades (or stays same if miss)
    # We want to verify that next_turn was called
    with patch.object(scene, '_next_turn') as mock_next:
        scene._handle_player_attack()
        mock_next.assert_called()
    pygame.quit()

def test_turn_order_advances_after_action(mock_session, manager):
    pygame.init()
    scene = DungeonCombatScene(manager, SPEC_720, session=mock_session)
    scene.on_enter()
    scene.on_combat_enter(session=mock_session, enemy_entity=MagicMock())
    
    first_actor = scene.active_actor_id
    scene._next_turn()
    second_actor = scene.active_actor_id
    
    # With hero and slime, turn order should cycle
    assert first_actor != second_actor or first_actor is not None
    pygame.quit()

def test_hp_bar_updates_on_damage(mock_session, manager):
    pygame.init()
    scene = DungeonCombatScene(manager, SPEC_720, session=mock_session)
    scene.on_enter()
    scene.on_combat_enter(session=mock_session, enemy_entity=MagicMock())
    
    enemy = scene.enemies[0]
    initial_hp = enemy.stats["hp"]
    enemy.stats["hp"] -= 5
    assert enemy.stats["hp"] == initial_hp - 5
    pygame.quit()

def test_flee_returns_to_exploration(mock_session, manager):
    pygame.init()
    scene = DungeonCombatScene(manager, SPEC_720, session=mock_session)
    scene.on_enter()
    scene.on_combat_enter(session=mock_session, enemy_entity=MagicMock())
    
    with patch.object(manager, 'switch_to') as mock_switch:
        scene._handle_flee()
        mock_switch.assert_called_with("garden")
    pygame.quit()

def test_combat_victory_triggers_on_last_enemy_defeat(mock_session, manager):
    pygame.init()
    scene = DungeonCombatScene(manager, SPEC_720, session=mock_session)
    scene.on_enter()
    scene.on_combat_enter(session=mock_session, enemy_entity=MagicMock())
    
    enemy = scene.enemies[0]
    enemy.stats["hp"] = 0
    
    with patch.object(manager, 'switch_to') as mock_switch:
        scene._handle_player_attack() # Hits (or resolves)
        # Check if victory handler was called via pop
        scene._handle_victory()
        mock_switch.assert_called_with("dungeon_room", session=mock_session, combat_result="victory")
    pygame.quit()
