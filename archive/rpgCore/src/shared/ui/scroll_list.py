from typing import List, Optional, Tuple
import pygame
from src.shared.ui.base import UIComponent
from src.shared.ui.label import Label

class ScrollList(UIComponent):
    """Vertical scrollable list of strings with selection logic."""
    
    def __init__(
        self,
        rect: pygame.Rect,
        max_visible_items: int = 5,
        item_height: int = 30,
        bg_color: Tuple[int, int, int] = (20, 20, 30),
        text_color: Tuple[int, int, int] = (200, 200, 200),
        selected_color: Tuple[int, int, int] = (50, 50, 80),
        border_color: Tuple[int, int, int] = (100, 100, 120),
        border_width: int = 2,
        z_order: int = 0
    ):
        super().__init__(rect, z_order)
        self.max_visible_items = max_visible_items
        self.item_height = item_height
        
        self.bg_color = bg_color
        self.text_color = text_color
        self.selected_color = selected_color
        self.border_color = border_color
        self.border_width = border_width
        
        self.items: List[str] = []
        self.scroll_offset: int = 0
        self.selected_index: int = 0
        
        # Add visible attribute for compatibility
        self.visible = True

    def load_items(self, items: List[str]) -> None:
        self.items = items
        self.scroll_offset = 0
        self.selected_index = 0 if items else -1

    def get_selected(self) -> Optional[str]:
        if 0 <= self.selected_index < len(self.items):
            return self.items[self.selected_index]
        return None

    def handle_event(self, event: pygame.event.Event) -> bool:
        if not self.visible or not self.items:
            return False
            
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                if self.selected_index > 0:
                    self.selected_index -= 1
                    if self.selected_index < self.scroll_offset:
                        self.scroll_offset = self.selected_index
                return True
            elif event.key == pygame.K_DOWN:
                if self.selected_index < len(self.items) - 1:
                    self.selected_index += 1
                    if self.selected_index >= self.scroll_offset + self.max_visible_items:
                        self.scroll_offset = self.selected_index - self.max_visible_items + 1
                return True
        return False

    def tick(self, dt_ms: int) -> None:
        pass

    def render(self, surface: pygame.Surface) -> None:
        if not self.visible:
            return
            
        pygame.draw.rect(surface, self.bg_color, self.rect)
        if self.border_width > 0:
            pygame.draw.rect(surface, self.border_color, self.rect, width=self.border_width)

        if not self.items:
            return
            
        # Draw visible items
        visible_end = min(self.scroll_offset + self.max_visible_items, len(self.items))
        
        try:
            font = pygame.font.Font(None, 24)
        except:
            return
            
        for i in range(self.scroll_offset, visible_end):
            text = self.items[i]
            y_pos = self.rect.y + self.border_width + ((i - self.scroll_offset) * self.item_height)
            item_rect = pygame.Rect(self.rect.x + self.border_width, y_pos, self.rect.width - self.border_width*2, self.item_height)
            
            # Highlight selected
            if i == self.selected_index:
                pygame.draw.rect(surface, self.selected_color, item_rect)
                text_surf = font.render(text, True, (255, 255, 255))
            else:
                text_surf = font.render(text, True, self.text_color)
                
            surface.blit(text_surf, (item_rect.x + 10, item_rect.y + 5))
