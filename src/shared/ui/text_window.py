from typing import Tuple, Optional
import pygame
from src.shared.ui.base import UIComponent
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.spec import UISpec

class TextWindow(Panel):
    """Animated text display panel with character reveal."""
    
    def __init__(
        self,
        rect: pygame.Rect,
        spec: UISpec,
        chars_per_second: float = 30.0,
        z_order: int = 0
    ):
        super().__init__(rect, spec, variant="overlay", border=True, z_order=z_order)
        
        self.chars_per_second = chars_per_second
        self.full_text = ""
        self.current_text = ""
        self.char_index = 0.0
        self.is_finished = True
        
        # Internal label for actual rendering, padded inwards
        label_rect = pygame.Rect(
            rect.x + 20, 
            rect.y + 20, 
            rect.width - 40, 
            rect.height - 40
        )
        self.label = Label(
            text="",
            position=(label_rect.x, label_rect.y),
            spec=spec,
            size="lg",
            wrap_width=label_rect.width
        )
        self.add_child(self.label)

    def set_text(self, text: str) -> None:
        """Reset and start revealing new text."""
        self.full_text = text
        self.current_text = ""
        self.char_index = 0.0
        self.is_finished = len(text) == 0
        self.label.set_text("")

    def skip_reveal(self) -> None:
        """Instantly finish the text reveal animation."""
        if not self.is_finished:
            self.current_text = self.full_text
            self.char_index = len(self.full_text)
            self.is_finished = True
            self.label.set_text(self.current_text)

    def tick(self, dt_ms: int) -> None:
        if not self.visible or self.is_finished:
            return
            
        dt_s = dt_ms / 1000.0
        chars_to_add = int(self.chars_per_second * dt_s)
        
        # Accumulate fractional chars
        self.char_index += self.chars_per_second * dt_s
        new_len = int(self.char_index)
        
        if new_len > len(self.full_text):
            new_len = len(self.full_text)
            self.is_finished = True
            
        if new_len > len(self.current_text):
            self.current_text = self.full_text[:new_len]
            self.label.set_text(self.current_text)
            
        super().update(dt_ms)
