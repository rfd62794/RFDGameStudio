import pytest
import pygame
from src.shared.ui.spec import SPEC_720
from src.shared.ui.layouts import HubLayout, SelectionLayout, ArenaLayout

def test_hub_layout():
    layout = HubLayout(SPEC_720)
    assert layout.top_bar.height == 48
    assert layout.status_bar.bottom == 720
    assert layout.side_panel.right == 1280

def test_selection_layout():
    layout = SelectionLayout(SPEC_720)
    assert layout.left_panel.width == int(1280 * 0.3)
    assert layout.center_area.width == int(1280 * 0.4)
    assert layout.right_panel.width == int(1280 * 0.3)

def test_arena_layout():
    layout = ArenaLayout(SPEC_720)
    assert layout.header.y == 0
    assert layout.team_bar.bottom == 720
