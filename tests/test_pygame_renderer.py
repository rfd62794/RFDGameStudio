"""
PyGame renderer tests — headless (no display required).
Uses SDL dummy driver to run without a screen.
"""
import os
os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')
os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest


def test_pygame_engine_initializes() -> None:
    """PyGameEngine loads a game session and resolves layout without crash."""
    from renderers.pygame.engine import PyGameEngine
    engine = PyGameEngine('horse_racing', width=1024, height=768)
    assert engine.session is not None
    assert engine.session.game_id == 'horse_racing'

def test_pygame_layout_bounds_computed() -> None:
    """Layout resolver runs and produces bounds for header, content, footer."""
    from renderers.pygame.engine import PyGameEngine
    engine = PyGameEngine('horse_racing', width=1024, height=768)
    assert 'header' in engine.bounds
    assert 'content' in engine.bounds
    assert 'footer' in engine.bounds

def test_pygame_header_bounds_proportional() -> None:
    """Header height is ~10% of viewport (from ui.yaml layout_tree)."""
    from renderers.pygame.engine import PyGameEngine
    engine = PyGameEngine('horse_racing', width=1024, height=768)
    header = engine.bounds['header']
    expected_h = 768 * 0.10
    assert abs(header.h - expected_h) < 2.0  # 2px tolerance

def test_pygame_horse_racing_renderer_initializes() -> None:
    """HorseRacingRenderer starts with starter horses loaded from data.yaml."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    renderer = HorseRacingRenderer()
    assert len(renderer.state.horses) > 0
    assert renderer.state.funds > 0
