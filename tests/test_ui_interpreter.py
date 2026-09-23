"""
test_ui_interpreter.py — Tests for the generic ui.yaml interpreter and hit-target dispatch.

Covers all 9 simple component types, binding resolution, hit-test dispatch,
requires gating, and composite-type skipping.
"""
import os
os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')

import pygame
import pytest
from pathlib import Path

from renderers.pygame.colors import COLORS
from renderers.pygame.shared.ui_interpreter import (
    interpret_component, interpret_region, resolve_binding,
    is_composite_type, SIMPLE_TYPES, COMPOSITE_TYPES,
)
from renderers.pygame.shared.ui_hit_targets import HitTarget, dispatch_click


class MockBounds:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h


# ── Layout / proportion tests ──────────────────────────────────────────────────

def test_layout_tree_resolves_proportions() -> None:
    """Given a screen height, header/tab_nav/footer/content regions resolve
    to the correct proportional pixel heights (0.10/0.06/flex/0.05)."""
    from engine.ui.resolver import resolve_viewport
    tree = {
        'direction': 'column',
        'children': [
            {'id': 'header', 'height': 0.10},
            {'id': 'tab_nav', 'height': 0.06},
            {'id': 'content', 'flex': 1},
            {'id': 'footer', 'height': 0.05},
        ],
    }
    bounds = {b.id: b for b in resolve_viewport(tree, 1024, 768)}

    assert bounds['header'].h == pytest.approx(76.8, abs=0.1)
    assert bounds['tab_nav'].h == pytest.approx(46.08, abs=0.1)
    assert bounds['footer'].h == pytest.approx(38.4, abs=0.1)
    # content gets remaining: 768 - 76.8 - 46.08 - 38.4 = 606.72
    assert bounds['content'].h == pytest.approx(606.72, abs=0.1)


# ── Component type tests ───────────────────────────────────────────────────────

def test_label_emits_text_primitive() -> None:
    """{type: label, text: 'X'} → one text entity with the right content."""
    node = {'type': 'label', 'text': 'Hello World', 'style': 'title'}
    entities, _ = interpret_component(node, 10, 20, 200, COLORS)
    assert len(entities) == 1
    assert entities[0]['type'] == 'text'
    assert entities[0]['text'] == 'Hello World'
    assert entities[0]['x'] == 10
    assert entities[0]['y'] == 20
    assert entities[0]['bold'] is True  # title style is bold


def test_stat_display_emits_label_and_value() -> None:
    """stat_display emits two text entities: label (muted) + value (bold)."""
    node = {
        'type': 'stat_display',
        'label': 'STABLE BANK',
        'field': 'funds',
        'format': 'currency',
    }
    context = {'funds': 5000}
    entities, _ = interpret_component(node, 10, 20, 200, COLORS, context=context)
    assert len(entities) == 2
    assert entities[0]['text'] == 'STABLE BANK'
    assert entities[1]['text'] == '$5,000'
    assert entities[1]['bold'] is True


def test_stat_bar_emits_rects_and_value() -> None:
    """stat_bar emits background rect, border rect, fill rect, and value text."""
    node = {
        'type': 'stat_bar',
        'label': 'Speed',
        'field': 'speed',
        'max': 100,
    }
    context = {'speed': 75}
    entities, _ = interpret_component(node, 10, 20, 200, COLORS, context=context)
    # label text, bg rect, border rect, fill rect, value text
    assert len(entities) == 5
    assert entities[0]['text'] == 'Speed'
    # Fill rect width should be proportional: (75/100) * (200-60) = 105
    fill = [e for e in entities if e.get('type') == 'rect' and e.get('line_width') == 0 and e.get('w') > 0]
    assert any(e['w'] == 105 for e in fill)


def test_stat_row_emits_multiple_pairs() -> None:
    """stat_row emits label+value pairs for each stat, horizontally laid out."""
    node = {
        'type': 'stat_row',
        'stats': [
            {'label': 'Runs', 'field': 'runs'},
            {'label': 'Wins', 'field': 'wins'},
        ],
    }
    context = {'runs': 10, 'wins': 3}
    entities, _ = interpret_component(node, 10, 20, 200, COLORS, context=context)
    # 2 stats × 2 entities each = 4
    assert len(entities) == 4
    assert entities[0]['text'] == 'Runs'
    assert entities[1]['text'] == '10'
    assert entities[2]['text'] == 'Wins'
    assert entities[3]['text'] == '3'


def test_badge_emits_rect_and_text() -> None:
    """badge emits a background rect + text label."""
    node = {
        'type': 'badge',
        'field': 'status',
        'values': {'ready': 'Ready to Race', 'cooldown': 'Resting'},
    }
    context = {'status': 'ready'}
    entities, _ = interpret_component(node, 10, 20, 200, COLORS, context=context)
    assert len(entities) == 2
    assert entities[0]['type'] == 'rect'
    assert entities[1]['text'] == 'Ready to Race'


def test_section_recurses_into_children() -> None:
    """section produces no primitives itself (unless labeled), recurses into children."""
    node = {
        'type': 'section',
        'label': 'PEDIGREE',
        'children': [
            {'type': 'label', 'text': 'SIRE: Thunder'},
            {'type': 'label', 'text': 'DAM: Lightning'},
        ],
    }
    entities, _ = interpret_component(node, 10, 20, 200, COLORS)
    # section label + 2 child labels = 3 text entities
    assert len(entities) == 3
    assert entities[0]['text'] == 'PEDIGREE'
    assert entities[1]['text'] == 'SIRE: Thunder'
    assert entities[2]['text'] == 'DAM: Lightning'


def test_section_without_label_no_extra_entity() -> None:
    """section without label produces zero direct primitives, only children."""
    node = {
        'type': 'section',
        'children': [
            {'type': 'label', 'text': 'Child 1'},
        ],
    }
    entities, _ = interpret_component(node, 10, 20, 200, COLORS)
    assert len(entities) == 1
    assert entities[0]['text'] == 'Child 1'


def test_action_button_emits_rect_and_text_and_hit_target() -> None:
    """action_button produces rect + text + a HitTarget entry."""
    hit_targets = []
    node = {
        'type': 'action_button',
        'label': 'Sell Stall',
        'event': 'sell_horse',
        'data': 'horse_123',
        'style': 'danger',
    }
    entities, _ = interpret_component(
        node, 10, 20, 200, COLORS, hit_targets=hit_targets
    )
    assert len(entities) == 2  # rect + text
    assert entities[0]['type'] == 'rect'
    assert entities[1]['text'] == 'Sell Stall'
    assert len(hit_targets) == 1
    assert hit_targets[0].event == 'sell_horse'
    assert hit_targets[0].data == 'horse_123'
    assert hit_targets[0].rect.collidepoint((15, 25))


def test_timestamp_emits_formatted_text() -> None:
    """timestamp emits a text entity with formatted time."""
    node = {'type': 'timestamp', 'field': 'ts'}
    context = {'ts': 1700000000}  # fixed epoch
    entities, _ = interpret_component(node, 10, 20, 200, COLORS, context=context)
    assert len(entities) == 1
    assert entities[0]['type'] == 'text'
    # Should contain a date-like string
    assert '-' in entities[0]['text']


def test_link_emits_styled_text_and_hit_target() -> None:
    """link emits accent-colored text + a HitTarget."""
    hit_targets = []
    node = {'type': 'link', 'label': 'GAME RULES', 'event': 'show_rules'}
    entities, _ = interpret_component(
        node, 10, 20, 200, COLORS, hit_targets=hit_targets
    )
    assert len(entities) == 1
    assert entities[0]['text'] == 'GAME RULES'
    assert entities[0]['color'] == COLORS['accent']
    assert len(hit_targets) == 1
    assert hit_targets[0].event == 'show_rules'


# ── Hit-target dispatch tests ──────────────────────────────────────────────────

def test_dispatch_click_inside_rect_calls_lua() -> None:
    """Click inside a hit target's rect, requires satisfied → lua_call invoked."""
    calls = []
    def fake_lua(event, data):
        calls.append((event, data))
        return 'ok'

    rect = pygame.Rect(10, 20, 100, 30)
    target = HitTarget(rect=rect, event='sell_horse', data='h1', requires=[])
    result = dispatch_click((50, 35), [target], {}, fake_lua)
    assert result == 'ok'
    assert len(calls) == 1
    assert calls[0] == ('sell_horse', 'h1')


def test_dispatch_click_blocked_by_unmet_requires() -> None:
    """Same click, requires condition false → lua_call NOT invoked."""
    calls = []
    def fake_lua(event, data):
        calls.append((event, data))
        return 'ok'

    rect = pygame.Rect(10, 20, 100, 30)
    target = HitTarget(
        rect=rect, event='breed_horses', data=None,
        requires=['sire_selected', 'dam_selected', 'stable_slot_available'],
    )
    # sire_selected=False → blocked
    ctx = {'sire_selected': False, 'dam_selected': True, 'stable_slot_available': True}
    result = dispatch_click((50, 35), [target], ctx, fake_lua)
    assert result is None
    assert len(calls) == 0


def test_dispatch_click_outside_all_rects_noop() -> None:
    """Click position matching no hit target → no call, no exception."""
    calls = []
    def fake_lua(event, data):
        calls.append((event, data))
        return 'ok'

    rect = pygame.Rect(10, 20, 100, 30)
    target = HitTarget(rect=rect, event='sell_horse', data='h1', requires=[])
    result = dispatch_click((500, 500), [target], {}, fake_lua)
    assert result is None
    assert len(calls) == 0


# ── Binding resolution tests ───────────────────────────────────────────────────

def test_binding_field_path_resolves() -> None:
    """field: horse.career.earnings against a real horse dict resolves correctly."""
    horse = {
        'name': 'Thunder',
        'career': {'runs': 10, 'wins': 3, 'earnings': 5000},
    }
    assert resolve_binding('horse.career.earnings', {'horse': horse}) == 5000
    assert resolve_binding('horse.name', {'horse': horse}) == 'Thunder'


def test_binding_missing_path_raises_loud() -> None:
    """Broken dotted path raises KeyError, not silent None."""
    horse = {'name': 'Thunder'}
    with pytest.raises(KeyError, match='career'):
        resolve_binding('horse.career.earnings', {'horse': horse})


# ── Composite type skipping tests ─────────────────────────────────────────────

def test_composite_types_not_handled_this_pass() -> None:
    """horse_card_grid / betting_panel / etc. are explicitly skipped, not crashed on."""
    composites = [
        {'type': 'horse_card_grid', 'data_source': 'horses'},
        {'type': 'race_track', 'component': 'SVGRacer'},
        {'type': 'betting_panel', 'data_source': 'participants'},
        {'type': 'breed_selector', 'label': 'Sire'},
        {'type': 'breed_preview', 'shows': ['stats']},
        {'type': 'race_history_list', 'data_source': 'history'},
        {'type': 'results_table', 'data_source': 'results'},
        {'type': 'race_info_card', 'data_source': 'race'},
    ]
    for node in composites:
        entities, cursor = interpret_component(node, 10, 20, 200, COLORS)
        assert len(entities) == 0, f"Composite type {node['type']} should produce 0 entities"
        assert cursor == 0.0, f"Composite type {node['type']} should advance cursor by 0"

    # Verify they're in the COMPOSITE_TYPES set
    for node in composites:
        assert is_composite_type(node['type'])

    # Verify simple types are NOT in COMPOSITE_TYPES
    for simple in SIMPLE_TYPES:
        assert not is_composite_type(simple)


# ── Integration: interpret_region ──────────────────────────────────────────────

def test_interpret_region_returns_four_layers() -> None:
    """interpret_region returns a dict with all four valid layer keys."""
    components = [
        {'type': 'label', 'text': 'Header 1', 'style': 'title'},
        {'type': 'label', 'text': 'Header 2', 'style': 'subtitle'},
    ]
    bounds = MockBounds(0, 0, 1024, 76)
    layers = interpret_region(components, bounds, COLORS)
    assert set(layers.keys()) == {'background', 'midground', 'foreground', 'hud'}
    assert len(layers['hud']) == 2


# ── Renderer integration ───────────────────────────────────────────────────────

def test_renderer_has_widgets_after_render() -> None:
    """After render(), the renderer's reconciler has widgets populated from ui.yaml."""
    from renderers.pygame.games.horse_racing.persistence import SAVE_FILE
    if SAVE_FILE.exists():
        SAVE_FILE.unlink()
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    r = HorseRacingRenderer()
    r.render()
    # Footer links should produce widgets
    assert len(r._reconciler._widgets) > 0


def test_renderer_breed_button_gated() -> None:
    """Breed tab's action_button is gated by requires conditions."""
    from renderers.pygame.games.horse_racing.persistence import SAVE_FILE
    if SAVE_FILE.exists():
        SAVE_FILE.unlink()
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    r = HorseRacingRenderer()

    # With starter horses (1 Stallion, 1 Mare, 2 < 3 slots), button should be visible
    r.state.active_tab = 'breed'
    r.render()
    breed_buttons = [w for w in r._reconciler._widgets.values()
                     if hasattr(w, 'event_name') and w.event_name == 'breed_horses']
    assert len(breed_buttons) == 1  # not gated — all requires satisfied

    # Now empty horses AND block public_studs to make sire_selected/dam_selected False
    r.state.horses = []
    r.session.files.data = {}  # remove public_studs
    r.render()
    breed_buttons = [w for w in r._reconciler._widgets.values()
                     if hasattr(w, 'event_name') and w.event_name == 'breed_horses']
    assert len(breed_buttons) == 0  # gated off — no sires/dams anywhere
