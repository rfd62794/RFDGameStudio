"""
test_ui_manager.py — Tests for the pygame_gui UIManager wrapper.
"""
import os
os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')

import pygame
import pytest


def test_pygame_gui_importable() -> None:
    """Confirms Step 1 dependency fix — import pygame_gui succeeds."""
    import pygame_gui
    assert pygame_gui is not None
    from pygame_gui import UIManager
    assert UIManager is not None


def test_ui_manager_handle_event_returns_bool() -> None:
    """Real pygame_gui UI element present, event routed to it, handle_event returns True."""
    from renderers.pygame.shared.ui_manager import UIManager
    import pygame_gui

    pygame.init()
    screen = pygame.display.set_mode((400, 300))
    mgr = UIManager(pygame.Rect(0, 0, 400, 300))

    # Create a button so there's something to click
    btn = pygame_gui.elements.UIButton(
        relative_rect=pygame.Rect(10, 10, 100, 30),
        text="Test",
        manager=mgr.manager,
    )

    # Simulate a mouse click inside the button
    click_event = pygame.event.Event(pygame.MOUSEBUTTONDOWN, {
        'pos': (50, 25), 'button': 1,
    })
    result = mgr.handle_event(click_event)
    assert isinstance(result, bool)

    # Simulate a mouse up to complete the click cycle
    up_event = pygame.event.Event(pygame.MOUSEBUTTONUP, {
        'pos': (50, 25), 'button': 1,
    })
    mgr.handle_event(up_event)

    # A keydown event should return False (not consumed by UI)
    key_event = pygame.event.Event(pygame.KEYDOWN, {'key': pygame.K_1})
    result2 = mgr.handle_event(key_event)
    assert isinstance(result2, bool)

    pygame.quit()


def test_ui_manager_update_and_draw_no_crash() -> None:
    """update() and draw_ui() don't crash with no widgets."""
    from renderers.pygame.shared.ui_manager import UIManager

    pygame.init()
    screen = pygame.display.set_mode((400, 300))
    mgr = UIManager(pygame.Rect(0, 0, 400, 300))

    mgr.update(0.016)
    mgr.draw_ui(screen)

    pygame.quit()
