from typing import Tuple, Optional
import pygame
from src.shared.ui.base import UIComponent
from src.shared.ui.label import Label

class ProgressBar(UIComponent):
    """A visual ratio indicator with optional label and animated transitions."""
    
    def __init__(
        self,
        rect: pygame.Rect,
        bg_color: Tuple[int, int, int] = (30, 30, 40),
        fill_color: Tuple[int, int, int] = (100, 200, 100),
        border_color: Tuple[int, int, int] = (150, 150, 170),
        border_width: int = 2,
        animated: bool = True,
        transition_speed: float = 2.0, # Complete bars per second
        z_order: int = 0
    ):
        super().__init__(rect, z_order)
        self.bg_color = bg_color
        self.fill_color = fill_color
        self.border_color = border_color
        self.border_width = border_width
        self.animated = animated
        self.transition_speed = transition_speed
        
        self.target_ratio = 0.0
        self.current_ratio = 0.0
        
        self.label: Optional[Label] = None

    def set_value(self, ratio: float) -> None:
        """Set fill ratio (clamped 0.0 to 1.0)."""
        self.target_ratio = max(0.0, min(1.0, ratio))
        if not self.animated:
            self.current_ratio = self.target_ratio

    def set_label(self, text: str, color: Tuple[int,int,int]=(255,255,255)) -> None:
        """Set an optional centered text label."""
        if not self.label:
            self.label = Label(self.rect, align="center", color=color)
        self.label.set_text(text)

    def tick(self, dt_ms: int) -> None:
        if not self.visible:
            return
            
        if self.animated and self.current_ratio != self.target_ratio:
            dt_s = dt_ms / 1000.0
            diff = self.target_ratio - self.current_ratio
            step = self.transition_speed * dt_s
            
            if abs(diff) <= step:
                self.current_ratio = self.target_ratio
            else:
                self.current_ratio += step if diff > 0 else -step

    def render(self, surface: pygame.Surface) -> None:
        if not self.visible:
            return
            
        # Draw background
        pygame.draw.rect(surface, self.bg_color, self.rect)
        
        # Draw fill
        if self.current_ratio > 0:
            fill_rect = pygame.Rect(self.rect.x, self.rect.y, int(self.rect.width * self.current_ratio), self.rect.height)
            pygame.draw.rect(surface, self.fill_color, fill_rect)
            
        # Draw border
        if self.border_width > 0:
            pygame.draw.rect(surface, self.border_color, self.rect, width=self.border_width)
            
        # Draw label
        if self.label:
            self.label.render(surface)
