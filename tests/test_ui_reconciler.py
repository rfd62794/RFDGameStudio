"""
test_ui_reconciler.py — Tests for the UIReconciler (label + action_button).

Tests the change-tracking reconciler pattern: create-on-first-sight,
update-on-change, kill-on-requires-fail.
"""
import os
os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')

import pygame
import pytest


@pytest.fixture
def ui_setup():
    """Shared fixture: pygame init + UIManager + Reconciler."""
    from renderers.pygame.shared.ui_manager import UIManager
    from renderers.pygame.shared.ui_reconciler import UIReconciler

    pygame.init()
    screen = pygame.display.set_mode((800, 600))
    mgr = UIManager(pygame.Rect(0, 0, 800, 600))
    reconciler = UIReconciler(mgr)
    yield mgr, reconciler
    pygame.quit()


def test_reconciler_creates_button_once(ui_setup) -> None:
    """First call creates one UIButton; second call with unchanged state creates zero new."""
    mgr, reconciler = ui_setup
    import pygame_gui

    nodes = [
        {'type': 'action_button', 'label': 'Sell Stall', 'event': 'sell_horse', 'data': 'h1'},
    ]

    # First call — should create one button
    reconciler.reconcile(nodes, 10, 20, 200, context={}, key_prefix='test')
    buttons_after_first = [w for w in reconciler._widgets.values()
                          if hasattr(w, 'event_name')]
    assert len(buttons_after_first) == 1
    assert buttons_after_first[0].text == 'Sell Stall'
    assert buttons_after_first[0].event_name == 'sell_horse'

    # Second call — same state, should NOT create a new element
    reconciler.reconcile(nodes, 10, 20, 200, context={}, key_prefix='test')
    buttons_after_second = [w for w in reconciler._widgets.values()
                           if hasattr(w, 'event_name')]
    assert len(buttons_after_second) == 1  # still just one


def test_reconciler_updates_label_text_on_change(ui_setup) -> None:
    """Bound value changes between calls → set_text() called, no new element created."""
    mgr, reconciler = ui_setup

    nodes = [
        {'type': 'label', 'field': 'funds', 'style': 'title'},
    ]

    # First call with funds=1000
    ctx1 = {'funds': 1000}
    reconciler.reconcile(nodes, 10, 20, 200, context=ctx1, key_prefix='test')
    labels_after_first = list(reconciler._widgets.values())
    assert len(labels_after_first) == 1
    assert labels_after_first[0].text == '1000'

    # Second call with funds=5000 — should update text, not create new
    ctx2 = {'funds': 5000}
    reconciler.reconcile(nodes, 10, 20, 200, context=ctx2, key_prefix='test')
    labels_after_second = list(reconciler._widgets.values())
    assert len(labels_after_second) == 1  # still one element
    assert labels_after_second[0].text == '5000'


def test_reconciler_kills_button_when_requires_fails(ui_setup) -> None:
    """requires condition flips false → existing button .kill()'d, not left dangling."""
    mgr, reconciler = ui_setup

    nodes = [
        {'type': 'action_button', 'label': 'Breed', 'event': 'breed_horses',
         'requires': ['sire_selected', 'dam_selected', 'stable_slot_available']},
    ]

    # First call — all requires satisfied
    ctx_ok = {'sire_selected': True, 'dam_selected': True, 'stable_slot_available': True}
    reconciler.reconcile(nodes, 10, 20, 200, context={},
                         requires_context=ctx_ok, key_prefix='test')
    buttons_ok = [w for w in reconciler._widgets.values()
                 if hasattr(w, 'event_name')]
    assert len(buttons_ok) == 1

    # Second call — sire_selected flips False
    ctx_fail = {'sire_selected': False, 'dam_selected': True, 'stable_slot_available': True}
    reconciler.reconcile(nodes, 10, 20, 200, context={},
                         requires_context=ctx_fail, key_prefix='test')
    buttons_fail = [w for w in reconciler._widgets.values()
                   if hasattr(w, 'event_name')]
    assert len(buttons_fail) == 0  # button was killed


def test_reconciler_skips_unhandled_types(ui_setup) -> None:
    """Composite types (horse_card_grid, betting_panel, etc.) are skipped."""
    mgr, reconciler = ui_setup

    nodes = [
        {'type': 'horse_card_grid', 'data_source': 'horses'},
        {'type': 'betting_panel', 'data_source': 'participants'},
        {'type': 'race_track', 'component': 'SVGRacer'},
    ]
    reconciler.reconcile(nodes, 10, 20, 200, context={}, key_prefix='test')
    assert len(reconciler._widgets) == 0


def test_reconciler_clear_kills_all(ui_setup) -> None:
    """clear() kills all widgets — used on tab switch."""
    mgr, reconciler = ui_setup

    nodes = [
        {'type': 'label', 'text': 'Hello', 'style': 'title'},
        {'type': 'action_button', 'label': 'Sell', 'event': 'sell_horse'},
    ]
    reconciler.reconcile(nodes, 10, 20, 200, context={}, key_prefix='test')
    assert len(reconciler._widgets) == 2

    reconciler.clear()
    assert len(reconciler._widgets) == 0


def test_reconciler_find_button_by_element(ui_setup) -> None:
    """find_button_by_element returns (event_name, event_data) for a given UI element."""
    mgr, reconciler = ui_setup

    nodes = [
        {'type': 'action_button', 'label': 'Sell', 'event': 'sell_horse', 'data': 'h42'},
    ]
    reconciler.reconcile(nodes, 10, 20, 200, context={}, key_prefix='test')

    # Get the button element
    btn = list(reconciler._widgets.values())[0]
    result = reconciler.find_button_by_element(btn)
    assert result is not None
    assert result[0] == 'sell_horse'
    assert result[1] == 'h42'

    # Non-button element returns None
    result_none = reconciler.find_button_by_element(object())
    assert result_none is None


def test_no_double_render_header() -> None:
    """state_to_layers with skip_chrome=True produces zero header/footer entities."""
    from renderers.pygame.games.horse_racing.lua_to_entities import state_to_layers
    from renderers.pygame.colors import COLORS
    from engine.ui.resolver import resolve_viewport

    # Minimal state mock
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

    layers = state_to_layers(
        state=MockState(), bounds=bounds, colors=COLORS,
        data={}, lua_call=None, skip_chrome=True,
    )

    # With skip_chrome=True, header/footer/tab_nav should not contribute entities.
    # The header region (y=0..76.8) should have no entities from _render_header.
    all_entities = []
    for layer in layers.values():
        all_entities.extend(layer)

    header_entities = [e for e in all_entities
                       if e.get('y', 999) < 77 and e.get('type') == 'text'
                       and 'DERBY' in e.get('text', '')]
    assert len(header_entities) == 0, "Header text should not appear with skip_chrome=True"

    footer_entities = [e for e in all_entities
                       if e.get('y', 0) > 730 and e.get('type') == 'text'
                       and 'RIGHTS' in e.get('text', '')]
    assert len(footer_entities) == 0, "Footer text should not appear with skip_chrome=True"
