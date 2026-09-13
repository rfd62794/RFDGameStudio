from typing import List, Dict, Any, Optional
import pygame
from src.shared.ui.base import UIComponent
from src.shared.ui.card import Card
from src.shared.ui.spec import UISpec

class CardLayout(UIComponent):
    """Vertical stack layout manager for Cards with staggered fade-in animations."""
    
    def __init__(
        self,
        rect: pygame.Rect,
        spec: UISpec,
        spacing: int = 15,
        fade_delay_ms: int = 150,
        fade_duration_ms: int = 300,
        z_order: int = 0
    ):
        super().__init__(rect, z_order)
        self.spec = spec
        self.spacing = spacing
        self.fade_delay_ms = fade_delay_ms
        self.fade_duration_ms = fade_duration_ms
        
        self.cards: List[Card] = []
        self.selected_index: Optional[int] = None
        self._fade_timer = 0
        self._is_animating = False

    def load_cards(self, items: List[Dict[str, Any]]) -> None:
        """
        Load a list of dictionary items into Card components.
        Items should have 'text' and optional 'accent_color'.
        """
        self.clear()
        if not items:
            return
            
        current_y = self.rect.y
        
        for i, item in enumerate(items):
            # Temporary rect to calculate required height
            temp_rect = pygame.Rect(self.rect.x, current_y, self.rect.width, 40)
            
            def make_callback(idx=i):
                return lambda: self._on_card_click(idx)
                
            color = item.get("accent_color", (100, 100, 120))
            card = Card(
                rect=temp_rect,
                number=i + 1,
                text=item["text"],
                spec=self.spec,
                stance_color=color,
                on_click=make_callback(),
                z_order=self.z_order
            )
            
            # Recalculate height based on text content
            card_h = card.get_required_height()
            card.rect.height = card_h
            
            card.fade_alpha = 0.0 # Start invisible for animation
            self.cards.append(card)
            current_y += card_h + self.spacing
            
        self._fade_timer = 0
        self._is_animating = True
            
        self._fade_timer = 0
        self._is_animating = True

    def _on_card_click(self, index: int) -> None:
        if not self._is_animating:
            self.selected_index = index

    def skip_animations(self) -> None:
        """Instantly finish all fade animations."""
        self._is_animating = False
        for card in self.cards:
            card.fade_alpha = 255.0

    def get_selected(self) -> Optional[int]:
        """Return the index of the selected card, if any."""
        return self.selected_index

    def clear(self) -> None:
        """Clear all cards and state."""
        self.cards.clear()
        self.selected_index = None
        self._is_animating = False

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Pass events down to cards."""
        if not self.visible or self._is_animating:
            return False
            
        for card in self.cards:
            if card.handle_event(event):
                return True
        return False

    def tick(self, dt_ms: int) -> None:
        if not self.visible:
            return
            
        # Handle staggered fade-in
        if self._is_animating:
            self._fade_timer += dt_ms
            all_done = True
            
            for i, card in enumerate(self.cards):
                start_time = i * self.fade_delay_ms
                if self._fade_timer > start_time:
                    progress = (self._fade_timer - start_time) / self.fade_duration_ms
                    if progress >= 1.0:
                        card.fade_alpha = 255.0
                    else:
                        card.fade_alpha = progress * 255.0
                        all_done = False
                else:
                    all_done = False
                    
            if all_done:
                self._is_animating = False
                
        for card in self.cards:
            card.update(dt_ms)

    def render(self, surface: pygame.Surface) -> None:
        if not self.visible:
            return
        for card in self.cards:
            card.render(surface)
