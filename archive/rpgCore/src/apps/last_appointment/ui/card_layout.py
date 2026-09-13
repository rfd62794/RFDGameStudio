import pygame
from typing import List, Optional
from src.shared.narrative.conversation_graph import Edge
from src.apps.last_appointment.ui.dialogue_card import DialogueCard

class CardLayout:
    def __init__(self, manager_width: int, manager_height: int):
        self.width = manager_width
        self.height = manager_height
        
        self.margin_x = 60
        self.card_height = 40
        self.spacing = 10
        self.cards: List[DialogueCard] = []
        
        # Sequence timing for fade in
        self.appear_delays = [0.0, 0.15, 0.30, 0.45, 0.60] # seconds
        self.fade_duration = 0.3 # seconds
        self.active_time = 0.0 # seconds since layout activation
        
        self.is_fading_in = False
        self.is_fading_out = False
        
    def load_edges(self, edges: List[Edge], text_window_bottom: int = 0) -> None:
        self.cards.clear()
        
        # Calculate available space
        # Start cards at 55% of screen height
        base_start_y = int(self.height * 0.55)
        # Ensure start_y is at least below the text window
        start_y = max(base_start_y, text_window_bottom + 20)
        
        available_height = self.height - start_y - 20 # 20px bottom padding
        num_cards = len(edges)
        
        if num_cards == 0:
            return
            
        current_y = start_y
        card_width = self.width - (self.margin_x * 2)
        
        for i, edge in enumerate(edges):
            # Temporary rect to calculate height
            temp_rect = pygame.Rect(self.margin_x, current_y, card_width, 44)
            stance = getattr(edge, "stance", "PROFESSIONAL")
            
            card = DialogueCard(i + 1, edge.text, stance, temp_rect)
            
            # Recalculate based on wrap
            h = card.get_required_height()
            card.logical_rect.height = h
            
            card.fade_alpha = 0
            self.cards.append(card)
            current_y += h + self.spacing
            
        self.active_time = 0.0
        self.is_fading_in = True
        self.is_fading_out = False
        
    def start_fade_out(self) -> None:
        self.is_fading_in = False
        self.is_fading_out = True
        self.active_time = 0.0
        
    def update(self, dt_ms: float) -> None:
        if not self.is_fading_in and not self.is_fading_out:
            # Fully visible or fully invisible
            return
            
        dt_s = dt_ms / 1000.0
        self.active_time += dt_s
        
        if self.is_fading_in:
            all_done = True
            for i, card in enumerate(self.cards):
                delay = self.appear_delays[i] if i < len(self.appear_delays) else 0.0
                if self.active_time > delay:
                    fade_progress = (self.active_time - delay) / self.fade_duration
                    card.fade_alpha = min(255, int(fade_progress * 255))
                    if card.fade_alpha < 255:
                        all_done = False
                else:
                    all_done = False
            
            if all_done:
                self.is_fading_in = False
                
        elif self.is_fading_out:
            all_done = True
            for card in self.cards:
                # Fade out all at once, faster
                fade_progress = self.active_time / (self.fade_duration * 0.7)
                card.fade_alpha = max(0, 255 - int(fade_progress * 255))
                if card.fade_alpha > 0:
                    all_done = False
                    
            if all_done:
                self.is_fading_out = False
                
    def skip_animations(self) -> None:
        target_alpha = 0 if self.is_fading_out else 255
        self.is_fading_in = False
        self.is_fading_out = False
        for card in self.cards:
            card.fade_alpha = target_alpha
                
    def handle_hover(self, mouse_pos: tuple[int, int]) -> None:
        # Don't allow hover interactions if we are still fading in sequence
        if self.is_fading_in or self.is_fading_out:
            return
            
        for card in self.cards:
            if card.fade_alpha == 255: # Only interactable when fully visible
                card.handle_hover(mouse_pos)

    def handle_click(self, mouse_pos: tuple[int, int]) -> Optional[int]:
        # Return index 0-based
        if self.is_fading_in or self.is_fading_out:
            return None
            
        for i, card in enumerate(self.cards):
            if card.fade_alpha == 255 and card.logical_rect.collidepoint(mouse_pos):
                card.select()
                return i
        return None

    def render(self, surface: pygame.Surface) -> None:
        for card in self.cards:
            card.render(surface)
