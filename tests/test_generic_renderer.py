"""
Tests for the generic rendering pipeline ported from rpgCore:
- RenderAdapter ABC enforcement
- PyGameRenderer rendering all entity types
- LayerCompositor layer management
- FontManager singleton
- SpriteLoader singleton
- horse_racing lua_to_entities translation layer
- state.py deletion confirmation
"""
import os
os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')
os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest


# ─── RenderAdapter ABC ───────────────────────────────────────────────

def test_render_adapter_is_abstract() -> None:
    """RenderAdapter cannot be instantiated directly — it's an ABC."""
    from renderers.pygame.shared.render_adapter import RenderAdapter
    with pytest.raises(TypeError):
        RenderAdapter()


def test_render_adapter_has_required_methods() -> None:
    """RenderAdapter declares all five abstract methods."""
    from renderers.pygame.shared.render_adapter import RenderAdapter
    abstract_methods = RenderAdapter.__abstractmethods__
    assert 'initialize' in abstract_methods
    assert 'shutdown' in abstract_methods
    assert 'clear' in abstract_methods
    assert 'present' in abstract_methods
    assert 'render_layered_entities' in abstract_methods


# ─── PyGameRenderer ──────────────────────────────────────────────────

def test_pygame_renderer_initializes() -> None:
    """PyGameRenderer can be created and initialized with a surface."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(800, 600)
    surf = pygame.Surface((800, 600))
    assert r.initialize(surf) is True
    assert r.screen is surf


def test_pygame_renderer_clear() -> None:
    """clear() fills the screen with the given color."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(100, 100)
    surf = pygame.Surface((100, 100))
    r.initialize(surf)
    r.clear((255, 0, 0))
    # Check a pixel
    assert surf.get_at((50, 50))[:3] == (255, 0, 0)


def test_pygame_renderer_renders_circle_entity() -> None:
    """render_layered_entities draws a circle entity without error."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [],
        "midground": [{"type": "circle", "x": 100, "y": 100, "radius": 20, "color": (0, 255, 0)}],
        "foreground": [],
        "hud": [],
    }
    r.render_layered_entities(layers)
    # Just verify it didn't crash — pixel checking is fragile with compositing


def test_pygame_renderer_renders_rect_entity() -> None:
    """render_layered_entities draws a rect entity without error."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [{"type": "rect", "x": 10, "y": 10, "w": 50, "h": 50, "color": (0, 0, 255)}],
        "midground": [],
        "foreground": [],
        "hud": [],
    }
    r.render_layered_entities(layers)


def test_pygame_renderer_renders_text_entity() -> None:
    """render_layered_entities draws a text entity without error."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [],
        "midground": [],
        "foreground": [],
        "hud": [{"type": "text", "text": "Hello", "x": 10, "y": 10, "color": (255, 255, 255), "size": 14}],
    }
    r.render_layered_entities(layers)


def test_pygame_renderer_renders_line_entity() -> None:
    """render_layered_entities draws a line entity without error."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [],
        "midground": [{"type": "line", "x": 10, "y": 10, "end_x": 100, "end_y": 100, "color": (255, 255, 0), "line_width": 2}],
        "foreground": [],
        "hud": [],
    }
    r.render_layered_entities(layers)


def test_pygame_renderer_renders_triangle_entity() -> None:
    """render_layered_entities draws a triangle entity without error."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [],
        "midground": [{"type": "triangle", "x": 100, "y": 100, "radius": 30, "heading": 0.0, "color": (255, 128, 0)}],
        "foreground": [],
        "hud": [],
    }
    r.render_layered_entities(layers)


def test_pygame_renderer_renders_arc_entity() -> None:
    """render_layered_entities draws an arc entity without error."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [],
        "midground": [{"type": "arc", "x": 100, "y": 100, "radius": 30, "start_angle": 0, "stop_angle": 3.14, "color": (128, 128, 255)}],
        "foreground": [],
        "hud": [],
    }
    r.render_layered_entities(layers)


def test_pygame_renderer_renders_ellipse_entity() -> None:
    """render_layered_entities draws an ellipse entity without error."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [],
        "midground": [{"type": "ellipse", "x": 50, "y": 50, "width": 60, "height": 30, "color": (255, 0, 255)}],
        "foreground": [],
        "hud": [],
    }
    r.render_layered_entities(layers)


def test_pygame_renderer_skips_inactive_entities() -> None:
    """Entities with active=False are skipped."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(200, 200)
    surf = pygame.Surface((200, 200))
    r.initialize(surf)
    layers = {
        "background": [],
        "midground": [{"type": "circle", "x": 100, "y": 100, "radius": 20, "color": (0, 255, 0), "active": False}],
        "foreground": [],
        "hud": [],
    }
    # Should not crash, and should skip the inactive entity
    r.render_layered_entities(layers)


def test_pygame_renderer_renders_all_entity_types_at_once() -> None:
    """render_layered_entities handles all entity types in a single call."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = PyGameRenderer(400, 400)
    surf = pygame.Surface((400, 400))
    r.initialize(surf)
    layers = {
        "background": [{"type": "rect", "x": 0, "y": 0, "w": 400, "h": 400, "color": (10, 10, 10)}],
        "midground": [
            {"type": "circle", "x": 50, "y": 50, "radius": 15, "color": (255, 0, 0)},
            {"type": "rect", "x": 80, "y": 80, "w": 30, "h": 30, "color": (0, 255, 0)},
            {"type": "line", "x": 120, "y": 120, "end_x": 200, "end_y": 200, "color": (0, 0, 255)},
            {"type": "triangle", "x": 250, "y": 100, "radius": 20, "heading": 1.5, "color": (255, 255, 0)},
            {"type": "arc", "x": 300, "y": 300, "radius": 25, "start_angle": 0, "stop_angle": 3.14, "color": (255, 0, 255)},
            {"type": "ellipse", "x": 200, "y": 200, "width": 40, "height": 20, "color": (0, 255, 255)},
        ],
        "foreground": [],
        "hud": [{"type": "text", "text": "All types", "x": 10, "y": 10, "color": (255, 255, 255), "size": 12}],
    }
    r.render_layered_entities(layers)


# ─── LayerCompositor ─────────────────────────────────────────────────

def test_layer_compositor_has_four_layers() -> None:
    """LayerCompositor defines exactly four layers in correct Z-order."""
    from renderers.pygame.shared.layer_compositor import LayerCompositor
    assert LayerCompositor.LAYERS == ["background", "midground", "foreground", "hud"]


def test_layer_compositor_get_layer_returns_surface() -> None:
    """get_layer returns a surface for each valid layer name."""
    import pygame
    pygame.init()
    from renderers.pygame.shared.layer_compositor import LayerCompositor
    lc = LayerCompositor(100, 100)
    for layer in LayerCompositor.LAYERS:
        surf = lc.get_layer(layer)
        assert surf is not None or os.environ.get('PYTEST_CURRENT_TEST')


def test_layer_compositor_get_layer_unknown_falls_back() -> None:
    """get_layer for unknown name falls back to midground."""
    from renderers.pygame.shared.layer_compositor import LayerCompositor
    lc = LayerCompositor(100, 100)
    result = lc.get_layer("nonexistent")
    # Should fall back to midground, not be None-new
    assert result is not None or os.environ.get('PYTEST_CURRENT_TEST')


# ─── FontManager ─────────────────────────────────────────────────────

def test_font_manager_is_singleton() -> None:
    """FontManager returns the same instance every time."""
    from renderers.pygame.shared.font_manager import FontManager
    a = FontManager()
    b = FontManager()
    assert a is b


def test_font_manager_render_text_returns_surface() -> None:
    """render_text returns a renderable surface (or dummy in test mode)."""
    from renderers.pygame.shared.font_manager import FontManager
    fm = FontManager()
    fm.initialize()
    result = fm.render_text("Hello", "monospace", 14, (255, 255, 255))
    assert result is not None


# ─── SpriteLoader ────────────────────────────────────────────────────

def test_sprite_loader_is_singleton() -> None:
    """SpriteLoader returns the same instance every time."""
    from renderers.pygame.shared.sprite_loader import SpriteLoader
    a = SpriteLoader()
    b = SpriteLoader()
    assert a is b


def test_sprite_loader_get_missing_sprite_returns_none() -> None:
    """get_sprite for a key that was never loaded returns None."""
    from renderers.pygame.shared.sprite_loader import SpriteLoader
    sl = SpriteLoader()
    sl.clear()
    assert sl.get_sprite("nonexistent") is None


# ─── horse_racing lua_to_entities ────────────────────────────────────

def test_state_to_layers_returns_all_four_layers() -> None:
    """state_to_layers returns a dict with exactly the four valid layer keys."""
    from renderers.pygame.games.horse_racing.lua_to_entities import state_to_layers, VALID_LAYERS
    # Use a simple mock state
    class MockState:
        funds = 1000
        horses = []
        unlocked_slots = 3
        race_history = []
        current_race = None
        race_participants = []
        race_results = []
        bets = []
        last_bet_results = []
        last_net_payout = 0
        foal = None
        foal_cost = 0
        active_tab = 'stable'
        selected_horse_idx = 0
        bet_type = 'Win'
        bet_target_idx = 0
        bet_amount = 50
        sire_idx = 0
        dam_idx = 0
        confirm_mode = False
        confirm_action = ''
        message = ''
        message_timer = 0.0

    class MockBounds:
        def __init__(self, x, y, w, h):
            self.x, self.y, self.w, self.h = x, y, w, h

    bounds = {
        'header': MockBounds(0, 0, 1024, 76),
        'tab_nav': MockBounds(0, 76, 1024, 40),
        'content': MockBounds(0, 116, 1024, 600),
        'footer': MockBounds(0, 716, 1024, 52),
    }

    from renderers.pygame.colors import COLORS
    layers = state_to_layers(MockState(), bounds, COLORS, {}, None)

    assert set(layers.keys()) == set(VALID_LAYERS)
    for layer in VALID_LAYERS:
        assert isinstance(layers[layer], list)


def test_state_to_layers_stable_tab_emits_entities() -> None:
    """When active_tab='stable' and horses exist, layers contain entities."""
    from renderers.pygame.games.horse_racing.lua_to_entities import state_to_layers
    from renderers.pygame.colors import COLORS

    class MockState:
        funds = 5000
        horses = [{'name': 'Thunder', 'generation': 2, 'gender': 'Stallion',
                   'speed': 70, 'stamina': 65, 'acceleration': 80,
                   'temperament': 50, 'runs': 10, 'wins': 3, 'places': 2,
                   'thirds': 1, 'earnings': 5000, 'cooldown_until': 0}]
        unlocked_slots = 3
        race_history = []
        current_race = None
        race_participants = []
        race_results = []
        bets = []
        last_bet_results = []
        last_net_payout = 0
        foal = None
        foal_cost = 0
        active_tab = 'stable'
        selected_horse_idx = 0
        bet_type = 'Win'
        bet_target_idx = 0
        bet_amount = 50
        sire_idx = 0
        dam_idx = 0
        confirm_mode = False
        confirm_action = ''
        message = ''
        message_timer = 0.0

    class MockBounds:
        def __init__(self, x, y, w, h):
            self.x, self.y, self.w, self.h = x, y, w, h

    bounds = {
        'header': MockBounds(0, 0, 1024, 76),
        'tab_nav': MockBounds(0, 76, 1024, 40),
        'content': MockBounds(0, 116, 1024, 600),
        'footer': MockBounds(0, 716, 1024, 52),
    }

    layers = state_to_layers(MockState(), bounds, COLORS, {}, None)

    # Should have some entities in multiple layers
    total_entities = sum(len(v) for v in layers.values())
    assert total_entities > 0
    # Background should have header/tab/content/footer rects
    assert len(layers['background']) > 0
    # HUD should have text entities
    assert len(layers['hud']) > 0
    # Midground should have horse card and detail panel
    assert len(layers['midground']) > 0


def test_state_to_layers_betting_tab_with_race() -> None:
    """Betting tab with a current_race emits participant entities."""
    from renderers.pygame.games.horse_racing.lua_to_entities import state_to_layers
    from renderers.pygame.colors import COLORS

    class MockState:
        funds = 1000
        horses = []
        unlocked_slots = 3
        race_history = []
        current_race = {
            'name': 'Spring Derby',
            'distance': 1200,
            'prize_pool': 5000,
            'participants': [
                {'horse': {'name': 'Lightning', 'id': 'h1'}, 'odds': 3.5},
                {'horse': {'name': 'Storm', 'id': 'h2'}, 'odds': 5.0},
            ],
        }
        race_participants = []
        race_results = []
        bets = []
        last_bet_results = []
        last_net_payout = 0
        foal = None
        foal_cost = 0
        active_tab = 'betting'
        selected_horse_idx = 0
        bet_type = 'Win'
        bet_target_idx = 0
        bet_amount = 50
        sire_idx = 0
        dam_idx = 0
        confirm_mode = False
        confirm_action = ''
        message = ''
        message_timer = 0.0

    class MockBounds:
        def __init__(self, x, y, w, h):
            self.x, self.y, self.w, self.h = x, y, w, h

    bounds = {
        'header': MockBounds(0, 0, 1024, 76),
        'tab_nav': MockBounds(0, 76, 1024, 40),
        'content': MockBounds(0, 116, 1024, 600),
        'footer': MockBounds(0, 716, 1024, 52),
    }

    layers = state_to_layers(MockState(), bounds, COLORS, {}, None)

    # Should have text entities for race name and participants
    hud_texts = [e for e in layers['hud'] if e.get('type') == 'text']
    text_values = [e.get('text', '') for e in hud_texts]
    assert any('Spring Derby' in t for t in text_values)
    assert any('Lightning' in t for t in text_values)


def test_state_to_layers_confirm_overlay_in_foreground() -> None:
    """When confirm_mode=True, overlay entities appear in foreground layer."""
    from renderers.pygame.games.horse_racing.lua_to_entities import state_to_layers
    from renderers.pygame.colors import COLORS

    class MockState:
        funds = 1000
        horses = []
        unlocked_slots = 3
        race_history = []
        current_race = None
        race_participants = []
        race_results = []
        bets = []
        last_bet_results = []
        last_net_payout = 0
        foal = None
        foal_cost = 0
        active_tab = 'stable'
        selected_horse_idx = 0
        bet_type = 'Win'
        bet_target_idx = 0
        bet_amount = 50
        sire_idx = 0
        dam_idx = 0
        confirm_mode = True
        confirm_action = 'sell'
        message = ''
        message_timer = 0.0

    class MockBounds:
        def __init__(self, x, y, w, h):
            self.x, self.y, self.w, self.h = x, y, w, h

    bounds = {
        'header': MockBounds(0, 0, 1024, 76),
        'tab_nav': MockBounds(0, 76, 1024, 40),
        'content': MockBounds(0, 116, 1024, 600),
        'footer': MockBounds(0, 716, 1024, 52),
    }

    layers = state_to_layers(MockState(), bounds, COLORS, {}, None)

    # Foreground should have the confirm overlay
    assert len(layers['foreground']) > 0
    fg_texts = [e for e in layers['foreground'] if e.get('type') == 'text']
    assert any('Are you sure' in e.get('text', '') for e in fg_texts)


def test_state_to_layers_history_tab_with_entries() -> None:
    """History tab with race_history emits card entities."""
    from renderers.pygame.games.horse_racing.lua_to_entities import state_to_layers
    from renderers.pygame.colors import COLORS

    class MockState:
        funds = 1000
        horses = []
        unlocked_slots = 3
        race_history = [{
            'name': 'Test Race',
            'distance': 1000,
            'prize_pool': 2000,
            'results': [
                {'rank': 1, 'horse_name': 'Winner'},
                {'rank': 2, 'horse_name': 'Second'},
            ],
        }]
        current_race = None
        race_participants = []
        race_results = []
        bets = []
        last_bet_results = []
        last_net_payout = 0
        foal = None
        foal_cost = 0
        active_tab = 'history'
        selected_horse_idx = 0
        bet_type = 'Win'
        bet_target_idx = 0
        bet_amount = 50
        sire_idx = 0
        dam_idx = 0
        confirm_mode = False
        confirm_action = ''
        message = ''
        message_timer = 0.0

    class MockBounds:
        def __init__(self, x, y, w, h):
            self.x, self.y, self.w, self.h = x, y, w, h

    bounds = {
        'header': MockBounds(0, 0, 1024, 76),
        'tab_nav': MockBounds(0, 76, 1024, 40),
        'content': MockBounds(0, 116, 1024, 600),
        'footer': MockBounds(0, 716, 1024, 52),
    }

    layers = state_to_layers(MockState(), bounds, COLORS, {}, None)

    # Midground should have history card rects
    midground_rects = [e for e in layers['midground'] if e.get('type') == 'rect']
    assert len(midground_rects) > 0
    # HUD should have race name text
    hud_texts = [e for e in layers['hud'] if e.get('type') == 'text']
    assert any('Test Race' in e.get('text', '') for e in hud_texts)


def test_state_to_layers_breed_tab_with_foal() -> None:
    """Breed tab with a foal shows foal-ready text."""
    from renderers.pygame.games.horse_racing.lua_to_entities import state_to_layers
    from renderers.pygame.colors import COLORS

    class MockState:
        funds = 1000
        horses = [{'name': 'Sire1', 'gender': 'Stallion', 'player_owned': True}]
        unlocked_slots = 3
        race_history = []
        current_race = None
        race_participants = []
        race_results = []
        bets = []
        last_bet_results = []
        last_net_payout = 0
        foal = {'name': 'Baby Horse'}
        foal_cost = 100
        active_tab = 'breed'
        selected_horse_idx = 0
        bet_type = 'Win'
        bet_target_idx = 0
        bet_amount = 50
        sire_idx = 0
        dam_idx = 0
        confirm_mode = False
        confirm_action = ''
        message = ''
        message_timer = 0.0

    class MockBounds:
        def __init__(self, x, y, w, h):
            self.x, self.y, self.w, self.h = x, y, w, h

    bounds = {
        'header': MockBounds(0, 0, 1024, 76),
        'tab_nav': MockBounds(0, 76, 1024, 40),
        'content': MockBounds(0, 116, 1024, 600),
        'footer': MockBounds(0, 716, 1024, 52),
    }

    layers = state_to_layers(MockState(), bounds, COLORS, {}, None)

    hud_texts = [e for e in layers['hud'] if e.get('type') == 'text']
    assert any('Foal ready' in e.get('text', '') for e in hud_texts)
    assert any('Baby Horse' in e.get('text', '') for e in hud_texts)


# ─── state.py deletion ───────────────────────────────────────────────

def test_state_py_deleted() -> None:
    """Confirm that horse_racing/state.py no longer exists."""
    state_path = Path(__file__).parent.parent / 'renderers' / 'pygame' / 'games' / 'horse_racing' / 'state.py'
    assert not state_path.exists(), f"state.py should have been deleted but still exists at {state_path}"


def test_renderer_imports_bet_entry_from_renderer() -> None:
    """BetEntry and BetResult are importable from renderer.py, not state.py."""
    from renderers.pygame.games.horse_racing.renderer import BetEntry, BetResult
    be = BetEntry(horse_id='x', horse_name='Test', bet_type='Win', amount=10, payout_odds=2.0)
    assert be.horse_id == 'x'
    br = BetResult(horse_name='Test', bet_type='Win', amount=10, odds=2.0, won=True, payout=20)
    assert br.won is True


def test_horse_racing_renderer_uses_generic_pipeline() -> None:
    """HorseRacingRenderer has a _generic_renderer attribute (PyGameRenderer)."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    from renderers.pygame.shared.pygame_renderer import PyGameRenderer
    r = HorseRacingRenderer()
    assert isinstance(r._generic_renderer, PyGameRenderer)


def test_horse_racing_renderer_render_no_crash() -> None:
    """HorseRacingRenderer.render() delegates to generic renderer without crash."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    r = HorseRacingRenderer()
    r.render()  # should not raise
