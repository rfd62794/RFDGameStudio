import os
import pygame
import pytest

from src.shared.ui import (
    Panel, Label, TextWindow, Button, Card, 
    CardLayout, ProgressBar, ScrollList, SceneBase
)
from src.shared.ui.spec import SPEC_720

# ---------------------------------------------------------
# Fixtures for Headless Pygame
# ---------------------------------------------------------

@pytest.fixture(autouse=True)
def setup_headless_pygame():
    """Ensure all tests run without requiring a physical monitor."""
    os.environ["SDL_VIDEODRIVER"] = "dummy"
    pygame.init()
    # Need a small dummy display for font calculations
    pygame.display.set_mode((1, 1))
    yield
    pygame.quit()

@pytest.fixture
def dummy_surface():
    return pygame.Surface((800, 600))

# ---------------------------------------------------------
# Tests
# ---------------------------------------------------------

def test_panel_renders_without_error(dummy_surface):
    panel = Panel(pygame.Rect(0, 0, 100, 100), SPEC_720)
    child = Label("Nested", (10, 10), SPEC_720)
    panel.add_child(child)
    
    # Should not crash headlessly
    panel.update(16)
    panel.render(dummy_surface)
    assert len(panel.children) == 1

def test_label_set_text(dummy_surface):
    label = Label("Initial", (0, 0), SPEC_720)
    
    # Initial renders
    assert len(label._rendered_lines) > 0
    
    label.set_text("Updated text that is quite long and might wrap")
    assert label.text.startswith("Updated text")
    assert len(label._rendered_lines) > 1  # Verify wrap logic split it

def test_text_window_reveal_completes():
    win = TextWindow(pygame.Rect(0, 0, 200, 100), SPEC_720, chars_per_second=100)
    win.set_text("Hello World")
    
    assert not win.is_finished
    
    # 50ms should reveal 'H', 'e', 'l', 'l', 'o'
    win.update(50)
    assert len(win.current_text) == 5
    assert not win.is_finished
    
    # Another 100ms should finish it
    win.update(100)
    assert win.is_finished
    assert win.current_text == "Hello World"

def test_text_window_skip_reveal():
    win = TextWindow(pygame.Rect(0, 0, 200, 100), SPEC_720)
    win.set_text("A very long string that we do not want to wait for.")
    
    assert not win.is_finished
    win.skip_reveal()
    
    assert win.is_finished
    assert win.current_text == win.full_text

def test_button_hover_state():
    btn = Button("Test", pygame.Rect(10, 10, 100, 50), None, SPEC_720)
    assert btn.state == "normal"
    
    # Simulate mouse motion over button
    event = pygame.event.Event(pygame.MOUSEMOTION, pos=(50, 30))
    consumed = btn.handle_event(event)
    
    assert consumed is True
    assert btn.state == "hover"

def test_button_click_callback():
    clicked = False
    def on_click():
        nonlocal clicked
        clicked = True
        
    btn = Button("Test", pygame.Rect(10, 10, 100, 50), on_click, SPEC_720)
    
    # Mouse down
    btn.handle_event(pygame.event.Event(pygame.MOUSEBUTTONDOWN, pos=(50, 30), button=1))
    assert btn.state == "pressed"
    assert not clicked
    
    # Mouse up
    btn.handle_event(pygame.event.Event(pygame.MOUSEBUTTONUP, pos=(50, 30), button=1))
    assert clicked

def test_card_layout_load_and_clear():
    layout = CardLayout(pygame.Rect(0, 0, 400, 600), SPEC_720)
    layout.load_cards([{"text": "A"}, {"text": "B"}, {"text": "C"}])
    
    assert len(layout.cards) == 3
    assert layout.cards[0].number == 1
    assert layout.cards[2].rect.y > layout.cards[0].rect.y
    
    layout.clear()
    assert len(layout.cards) == 0

def test_card_layout_skip_animations():
    layout = CardLayout(pygame.Rect(0, 0, 400, 600), SPEC_720)
    layout.load_cards([{"text": "A"}, {"text": "B"}])
    
    assert layout.cards[0].fade_alpha == 0.0
    
    layout.skip_animations()
    assert layout.cards[0].fade_alpha == 255.0
    assert not layout._is_animating

def test_progress_bar_value_clamping():
    bar = ProgressBar(pygame.Rect(0, 0, 100, 20))
    bar.set_value(1.5)
    assert bar.target_ratio == 1.0
    
    bar.set_value(-0.5)
    assert bar.target_ratio == 0.0

def test_scroll_list_navigation():
    scroll = ScrollList(pygame.Rect(0, 0, 200, 300), max_visible_items=3)
    scroll.load_items(["A", "B", "C", "D", "E"])
    
    assert scroll.selected_index == 0
    assert scroll.scroll_offset == 0
    
    # Navigate down 3 times
    scroll.handle_event(pygame.event.Event(pygame.KEYDOWN, key=pygame.K_DOWN))
    scroll.handle_event(pygame.event.Event(pygame.KEYDOWN, key=pygame.K_DOWN))
    scroll.handle_event(pygame.event.Event(pygame.KEYDOWN, key=pygame.K_DOWN))
    
    assert scroll.selected_index == 3
    assert scroll.scroll_offset == 1  # Must have scrolled to keep index 3 visible
    assert scroll.get_selected() == "D"

def test_scene_base_component_lifecycle():
    class DummyScene(SceneBase):
        pass
        
    scene = DummyScene(pygame.Surface((1, 1)))
    btn = Button("Test", pygame.Rect(0, 0, 10, 10), None, SPEC_720)
    
    scene.add_component(btn)
    assert len(scene.components) == 1
    
    scene.update(16)
    scene.render()
    
    scene.remove_component(btn)
    assert len(scene.components) == 0
