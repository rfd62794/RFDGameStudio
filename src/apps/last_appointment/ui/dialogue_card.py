from typing import Tuple, List, Optional
import pygame
from src.shared.rendering.font_manager import FontManager

STANCE_COLORS = {
    "PROFESSIONAL": (200, 200, 212), # #C8C8D4
    "WEARY": (136, 153, 170),        # #8899AA
    "CURIOUS": (136, 187, 204),      # #88BBCC
    "RELUCTANT": (204, 153, 68),     # #CC9944
    "MOVED": (170, 136, 187)         # #AA88BB
}
BG_COLOR = (18, 18, 30)              # #12121E
SELECTED_BG_COLOR = (30, 30, 46)     # #1E1E2E
NUMBER_COLOR = (102, 102, 128)       # #666680

class DialogueCard:
    def __init__(self, number: int, text: str, stance: str, rect: pygame.Rect):
        self.number = number
        self.text = text
        self.stance = stance
        
        self.logical_rect = rect.copy()
        self.visual_rect = rect.copy()
        
        self.hover_state = False
        self.selected_state = False
        self.fade_alpha = 0
        
        self.color = STANCE_COLORS.get(stance.upper(), (200, 200, 200))
        
        self._font_mgr = FontManager()
        self.num_font = self._font_mgr.get_font("Arial", 14)
        self.text_font = self._font_mgr.get_font("Arial", 20)
        
        self.num_sur = self.num_font.render(str(self.number), True, NUMBER_COLOR) if self.num_font != "DummyFont" else pygame.Surface((1, 1))
        
        # Pre-render wrapped lines
        self.text_sur_lines = self._render_wrapped_text(self.text, self.color)
        bright_color = tuple(min(255, int(c * 1.2)) for c in self.color)
        self.hover_text_sur_lines = self._render_wrapped_text(self.text, bright_color)
    def _render_wrapped_text(self, text: str, color: Tuple[int, int, int]) -> List[pygame.Surface]:
        if self.text_font == "DummyFont":
            # Simulation for headless tests: split by length if too long
            # assuming ~10 chars per unit of width for demonstration
            if len(text) > (self.logical_rect.width // 10):
                return [pygame.Surface((1, 1)), pygame.Surface((1, 1))]
            return [pygame.Surface((1, 1))]
            
        max_width = self.logical_rect.width - 60 # 40px left padding + 20px right
        words = text.split(' ')
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word]) if current_line else word
            w, _ = self.text_font.size(test_line)
            if w <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)
                    current_line = []
        if current_line:
            lines.append(' '.join(current_line))
            
        return [self.text_font.render(line, True, color) for line in lines]

    def get_required_height(self) -> int:
        """Calculate total height needed for wrapped text."""
        line_height = self.text_font.get_linesize() if self.text_font != "DummyFont" else 20
        padding = 16
        return max(44, (len(self.text_sur_lines) * line_height) + padding)

    def handle_hover(self, mouse_pos: tuple[int, int]) -> bool:
        """Updates hover state based on mouse position. Returns True if hovered."""
        if self.logical_rect.collidepoint(mouse_pos):
            if not self.hover_state:
                self.hover_state = True
                self.visual_rect.y = self.logical_rect.y - 3
            return True
        else:
            if self.hover_state:
                self.hover_state = False
                self.visual_rect.y = self.logical_rect.y
            return False

    def select(self) -> None:
        self.selected_state = True

    def render(self, surface: pygame.Surface) -> None:
        if self.fade_alpha <= 0:
            return

        # Create a surface for the card that supports alpha
        card_surface = pygame.Surface((self.visual_rect.width, self.visual_rect.height), pygame.SRCALPHA)
        
        # Fill background
        bg = SELECTED_BG_COLOR if self.selected_state else BG_COLOR
        card_surface.fill((*bg, self.fade_alpha))
        
        # Borders
        alpha = self.fade_alpha
        if self.selected_state:
            border_alpha = alpha
        elif self.hover_state:
            border_alpha = int(0.9 * alpha)
        else:
            border_alpha = int(0.5 * alpha)
        pygame.draw.rect(card_surface, (*self.color, border_alpha), card_surface.get_rect(), 2)
            
        # Draw number
        if hasattr(self.num_sur, "set_alpha"):
            self.num_sur.set_alpha(self.fade_alpha)
        num_pos = (16, (self.visual_rect.height - self.num_sur.get_height()) // 2)
        card_surface.blit(self.num_sur, num_pos)
        
        # Draw wrapped text
        t_lines = self.hover_text_sur_lines if self.hover_state else self.text_sur_lines
        line_height = self.text_font.get_linesize() if self.text_font != "DummyFont" else 20
        total_text_h = len(t_lines) * line_height
        start_y = (self.visual_rect.height - total_text_h) // 2
        
        for i, line_sur in enumerate(t_lines):
            if hasattr(line_sur, "set_alpha"):
                line_sur.set_alpha(self.fade_alpha)
            card_surface.blit(line_sur, (40, start_y + i * line_height))
        
        surface.blit(card_surface, self.visual_rect.topleft)
