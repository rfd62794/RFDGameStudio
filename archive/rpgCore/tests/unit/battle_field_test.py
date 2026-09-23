import pytest
from src.apps.slime_clan.scenes.battle_field_scene import BattleFieldScene as BattleField, SquadToken
from src.apps.slime_clan.territorial_grid import TileState
from src.shared.ui.spec import SPEC_720
import pygame

@pytest.fixture
def mock_bf():
    pygame.init()
    from unittest.mock import MagicMock
    mock_manager = MagicMock()
    bf = BattleField(manager=mock_manager, spec=SPEC_720)
    bf.on_enter(region="TestRegion", difficulty="NORMAL")
    return bf

def test_battle_field_initialization(mock_bf):
    assert mock_bf.region_name == "TestRegion"
    assert mock_bf.difficulty == "NORMAL"
    assert mock_bf.blue_token.team == TileState.BLUE
    assert mock_bf.red_token.team == TileState.RED
    assert mock_bf.blue_token.col == 0
    assert mock_bf.blue_token.row == 0
    assert mock_bf.red_token.col == 9
    assert mock_bf.red_token.row == 9
    
    # Needs to quit pygame after test initialize
    pygame.quit()

def test_collision_detection_adjacent(mock_bf):
    mock_bf.blue_token.col = 5
    mock_bf.blue_token.row = 5
    
    # Top Adjacent
    mock_bf.red_token.col = 5
    mock_bf.red_token.row = 4
    # We mock _launch_auto_battle so it doesn't spin up a subprocess
    mock_bf._launch_auto_battle = lambda: setattr(mock_bf, 'mock_launched', True)
    assert mock_bf._check_collision() is True
    assert mock_bf.mock_launched is True
    
    # Left Adjacent
    mock_bf.red_token.col = 4
    mock_bf.red_token.row = 5
    assert mock_bf._check_collision() is True
    
    # Diagonal (Not adjacent)
    mock_bf.red_token.col = 6
    mock_bf.red_token.row = 6
    assert mock_bf._check_collision() is False

def test_red_pathfinding_step(mock_bf):
    mock_bf.blue_token.col = 2
    mock_bf.blue_token.row = 2
    
    mock_bf.red_token.col = 5
    mock_bf.red_token.row = 5
    
    # Red should step towards blue
    mock_bf._take_red_turn()
    
    dist_after = abs(mock_bf.blue_token.col - mock_bf.red_token.col) + abs(mock_bf.blue_token.row - mock_bf.red_token.row)
    assert dist_after < 6 # Initial dist was 3 + 3 = 6. After step it should be 5.

def test_win_condition_reaches_base(mock_bf):
    # Move blue to bottom right
    mock_bf.blue_token.col = 8
    mock_bf.blue_token.row = 8
    
    mock_bf.update(16)
    
    assert mock_bf.game_over is True
    assert mock_bf.exit_code == 0
