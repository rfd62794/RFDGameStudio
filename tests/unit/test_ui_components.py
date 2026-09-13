import pytest
import pygame
from src.shared.ui.spec import SPEC_720
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.panel import Panel
from src.shared.ui.theme import DEFAULT_THEME

@pytest.fixture(autouse=True)
def init_pygame():
    pygame.init()
    pygame.display.set_mode((1, 1), pygame.HIDDEN)
    yield
    pygame.quit()

def test_button_variants():
    rect = pygame.Rect(0, 0, 100, 40)
    btn_p = Button("Primary", rect, lambda: None, SPEC_720, variant="primary", theme=DEFAULT_THEME)
    btn_d = Button("Danger", rect, lambda: None, SPEC_720, variant="danger", theme=DEFAULT_THEME)
    
    # Primary should use theme.info, Danger should use theme.danger
    assert btn_p.bg_color == DEFAULT_THEME.info
    assert btn_d.bg_color == DEFAULT_THEME.danger

def test_label_standardization():
    label = Label("Test", (10, 10), SPEC_720, size="lg", color=(255, 0, 0))
    assert label.font_size == SPEC_720.font_size_lg
    assert label.color == (255, 0, 0)

def test_panel_variants():
    rect = pygame.Rect(0, 0, 100, 100)
    panel = Panel(rect, SPEC_720, variant="card", theme=DEFAULT_THEME)
    assert panel.bg_color == DEFAULT_THEME.surface_raised
