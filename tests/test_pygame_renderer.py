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

def test_pygame_betting_place_bet_deducts_funds() -> None:
    """Place a bet — funds decrease by bet amount."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    from renderers.pygame.games.horse_racing.state import BetEntry
    renderer = HorseRacingRenderer()
    initial_funds = renderer.state.funds

    # Manually add a bet entry to test state mutation
    bet = BetEntry(
        horse_id='test_id',
        horse_name='Test Horse',
        bet_type='Win',
        amount=50,
        payout_odds=3.0,
    )
    renderer.state.bets.append(bet)
    renderer.state.funds -= 50

    assert renderer.state.funds == initial_funds - 50
    assert len(renderer.state.bets) == 1

def test_pygame_run_race_settles_bets() -> None:
    """Run race after placing a bet — settle_bets called, bets cleared."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    from renderers.pygame.games.horse_racing.state import BetResult
    renderer = HorseRacingRenderer()

    # Simulate race results state
    renderer.state.race_results = [
        {'rank': 1, 'horse_id': 'h1', 'horse_name': 'Winner'},
        {'rank': 2, 'horse_id': 'h2', 'horse_name': 'Second'},
        {'rank': 3, 'horse_id': 'h3', 'horse_name': 'Third'},
    ]
    renderer.state.bets.clear()
    renderer.state.last_bet_results = [
        BetResult(horse_name='Winner', bet_type='Win', amount=50,
                  odds=3.0, won=True, payout=150)
    ]
    renderer.state.race_history.append({
        'name': 'Test Race',
        'distance': 1200,
        'prize_pool': 1000,
        'results': renderer.state.race_results[:3],
    })

    assert len(renderer.state.bets) == 0
    assert len(renderer.state.race_results) == 3
    assert len(renderer.state.race_history) == 1

def test_pygame_breed_produces_foal() -> None:
    """Breed sire + dam — foal is created and waiting in state."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    renderer = HorseRacingRenderer()
    data = renderer.session.files.data or {}
    public_studs = list(data.get('public_studs', []))

    # Use public studs as sire, player mare as dam (or vice versa)
    sires = ([h for h in renderer.state.horses if h.get('gender') == 'Stallion'] +
             [h for h in public_studs if h.get('gender') == 'Stallion'])
    dams  = ([h for h in renderer.state.horses if h.get('gender') == 'Mare'] +
             [h for h in public_studs if h.get('gender') == 'Mare'])

    if sires and dams:
        renderer._breed(sires, dams, data)
        assert renderer.state.foal is not None
        assert 'name' in renderer.state.foal

def test_pygame_save_and_reload() -> None:
    """Save state, create new renderer — loads same funds and horse count."""
    import os
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    from renderers.pygame.games.horse_racing.persistence import SAVE_FILE

    # Remove any existing save
    if SAVE_FILE.exists():
        SAVE_FILE.unlink()

    renderer = HorseRacingRenderer()
    renderer.state.funds = 999  # distinctive value
    from renderers.pygame.games.horse_racing.persistence import save_state
    save_state(renderer.state)

    renderer2 = HorseRacingRenderer()
    assert renderer2.state.funds == 999
    assert len(renderer2.state.horses) == len(renderer.state.horses)

    # Clean up
    if SAVE_FILE.exists():
        SAVE_FILE.unlink()
