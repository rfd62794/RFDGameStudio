import pytest
import pygame
from src.apps.slime_clan.scenes.overworld_scene import OverworldScene
from src.apps.slime_clan.constants import NodeType
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
    
    # Needs factions registered to find coordinates for tribes
    from src.apps.slime_clan.factions import get_slime_factions
    factions = get_slime_factions()
    for f in factions:
        scene.faction_manager.register_faction(f)
        
    scene.on_enter()
    return scene

def test_tribal_initialization(mock_overworld):
    # Verify Ashfen and Rootward nodes exist and are owned by Yellow
    ashfen = mock_overworld.nodes["ashfen"]
    rootward = mock_overworld.nodes["rootward"]
    
    assert mock_overworld.faction_manager.get_owner(ashfen.coord) == "CLAN_YELLOW"
    assert mock_overworld.faction_manager.get_owner(rootward.coord) == "CLAN_YELLOW"

def test_approach_interaction(mock_overworld):
    mock_overworld.tribe_state["ashfen"]["approaches"] = 0
    mock_overworld.selected_unbound_node = mock_overworld.nodes["ashfen"]
    mock_overworld.actions_remaining = 3
    
    # Simulate clicking "Approach" button
    # Panel center: (640//2, 480//2)
    # px = (640-300)//2 = 170, py = (480-180)//2 = 150
    # Approach button: (170+160, 150+110, 120, 30) -> (330, 260, 120, 30)
    
    class MockEvent:
        type = pygame.MOUSEBUTTONDOWN
        button = 1
        pos = (335, 265) # Inside button
        
    mock_overworld.handle_events([MockEvent()])
    
    assert mock_overworld.tribe_state["ashfen"]["approaches"] == 1
    assert mock_overworld.actions_remaining == 2
    assert mock_overworld.selected_unbound_node is None # Panel closed

def test_wait_interaction_unlock(mock_overworld):
    mock_overworld.tribe_state["ashfen"]["approaches"] = 3
    mock_overworld.selected_unbound_node = mock_overworld.nodes["ashfen"]
    mock_overworld.actions_remaining = 1
    
    # Wait button: (px + 90, py + 145, 120, 30) -> (170+90, 150+145, 120, 30) -> (260, 295, 120, 30)
    class MockEvent:
        type = pygame.MOUSEBUTTONDOWN
        button = 1
        pos = (265, 300)
        
    mock_overworld.handle_events([MockEvent()])
    
    assert mock_overworld.actions_remaining == 1 # Wait costs 0
    assert mock_overworld.tribe_state["ashfen"]["approaches"] == 3

def test_hiding_logic(mock_overworld):
    tid = "ashfen"
    node = mock_overworld.nodes[tid]
    colony = mock_overworld.colony_manager.get_colony(tid)
    
    # Ashfen only has one connection: "node_2"
    conn_id = "node_2"
    conn_node = mock_overworld.nodes[conn_id]
    
    # Surround it (Red takes node_2)
    mock_overworld.faction_manager.claim_territory("CLAN_RED", conn_node.coord, 1.0, 0)
    
    colony.hidden = False
    mock_overworld._end_day()
    
    assert colony.hidden is True
    # The territory owner should still be CLAN_YELLOW (they just went into hiding, they didn't lose the node permanently to nobody)
    assert mock_overworld.faction_manager.get_owner(node.coord) == "CLAN_YELLOW"
