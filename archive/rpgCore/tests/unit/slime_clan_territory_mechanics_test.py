import pytest
import pygame
from src.apps.slime_clan.scenes.overworld_scene import OverworldScene, MapNode
from src.apps.slime_clan.constants import NodeType
from src.apps.slime_clan.scenes.battle_field_scene import BattleFieldScene
from src.apps.slime_clan.scenes.auto_battle_scene import AutoBattleScene
from src.shared.world.faction import FactionManager
from src.shared.ui.spec import SPEC_720

@pytest.fixture
def mock_overworld():
    pygame.init()
    pygame.font.init()
    from unittest.mock import MagicMock
    mock_manager = MagicMock()
    scene = OverworldScene(manager=mock_manager, spec=SPEC_720)
    scene.faction_manager = FactionManager()
    scene.on_enter()
    return scene

def test_resource_generation(mock_overworld):
    # Set node_1 (Scrap Yard) to Blue ownership
    node_1 = mock_overworld.nodes["node_1"]
    mock_overworld.faction_manager.claim_territory("CLAN_BLUE", node_1.coord, 1.0, 0)
    mock_overworld.faction_manager.expansion_chance = 0.0
    
    mock_overworld.resources = 0
    mock_overworld._end_day()
    
    # Scrap Yard is RESOURCE type, should generate +1
    assert mock_overworld.resources == 1

def test_ship_parts_award(mock_overworld):
    # Simulate returning from a won battle at Crash Site (SHIP_PARTS)
    node = mock_overworld.nodes["home"] # Crash Site
    mock_overworld.ship_parts = 0
    mock_overworld.secured_part_nodes = set()
    
    mock_overworld.on_enter(battle_node_id="home", battle_won=True)
    
    assert mock_overworld.ship_parts == 2
    assert "home" in mock_overworld.secured_part_nodes

def test_no_double_award(mock_overworld):
    node = mock_overworld.nodes["home"]
    mock_overworld.ship_parts = 2
    mock_overworld.secured_part_nodes = {"home"}
    
    # Secure it again
    mock_overworld.on_enter(battle_node_id="home", battle_won=True)
    
    assert mock_overworld.ship_parts == 2 # Remains 2

def test_survivor_trigger(mock_overworld):
    mock_overworld.ship_parts = 5
    mock_overworld.game_over = None
    
    # Simulate click to launch
    # In reality we'd mock the event, but we can verify the logic in handle_events
    class MockEvent:
         type = pygame.MOUSEBUTTONDOWN
         button = 1
         pos = (100, 100)
    
    mock_overworld.handle_events([MockEvent()])
    assert mock_overworld.game_over == "SURVIVOR"

def test_stronghold_bonus_logic():
    # Verify AutoBattleScene applies bonus
    pygame.init()
    from unittest.mock import MagicMock
    mock_manager = MagicMock()
    scene = AutoBattleScene(manager=mock_manager, spec=SPEC_720)
    
    # Case 1: No bonus
    scene.on_enter(stronghold_bonus=False)
    # Rex (Circle, Sword) -> Base 2 Def -> 2 * 1.25 = 2.5 -> 2
    rex = scene.blue_squad[0]
    assert rex.defense == 2

    # Case 2: With bonus
    scene.on_enter(stronghold_bonus=True)
    # Rex -> Base 2 Def -> 2 + 1 (bonus) = 3
    rex_buffed = scene.blue_squad[0]
    assert rex_buffed.defense == 3
