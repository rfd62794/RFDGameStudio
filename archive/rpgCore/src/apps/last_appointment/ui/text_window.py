"""
TextWindow component for Last Appointment.
Handles word-wrapping, padding, and optional slow text reveal.
"""
from typing import Tuple
from src.shared.rendering.font_manager import FontManager

class TextWindow:
    def __init__(self, 
                 x: int, 
                 y: int, 
                 width: int, 
                 text: str = "",
                 font_name: str = "Arial", 
                 font_size: int = 22, 
                 color: Tuple[int, int, int] = (200, 200, 212), # #C8C8D4
                 padding_x: int = 60,
                 padding_y: int = 80,
                 slow_reveal: bool = False,
                 reveal_speed: float = 30.0): # chars per second
        self.x = x
        self.y = y
        self.width = width
        self.font_name = font_name
        self.font_size = font_size
        self.color = color
        self.padding_x = padding_x
        self.padding_y = padding_y
        
        self.full_text = text
        self.slow_reveal = slow_reveal
        self.reveal_speed = reveal_speed
        
        self.revealed_count = 0.0 if slow_reveal else float(len(text))
        self.is_finished = not slow_reveal

    def set_text(self, text: str) -> None:
        self.full_text = text
        self.revealed_count = 0.0 if self.slow_reveal else float(len(text))
        self.is_finished = not self.slow_reveal

    def update(self, dt_ms: float) -> None:
        if not self.is_finished:
            dt_s = dt_ms / 1000.0
            self.revealed_count += self.reveal_speed * dt_s
            if self.revealed_count >= len(self.full_text):
                self.revealed_count = len(self.full_text)
                self.is_finished = True

    def render(self, surface: 'pygame.Surface') -> float:
        if not self.full_text:
            return self.y + self.padding_y
            
        display_text = self.full_text[:int(self.revealed_count)]
        font = FontManager().get_font(self.font_name, self.font_size)
        
        if font == "DummyFont":
            return self.y + self.padding_y # Skip rendering in headless tests
            
        words = display_text.split(' ')
        lines = []
        current_line = []
        
        max_width = self.width - (self.padding_x * 2)
        
        for word in words:
            # Reconstruct trailing spaces if needed, but split(' ') handles words
            # Actually, let's keep it simple
            test_line = ' '.join(current_line + [word]) if current_line else word
            width, _ = font.size(test_line)
            
            if width <= max_width:
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
            
        current_y = self.y + self.padding_y
        start_x = self.x + self.padding_x
        line_height = font.get_linesize()
        
        for line in lines:
            rendered = font.render(line, True, self.color)
            surface.blit(rendered, (start_x, current_y))
            current_y += line_height
            
        return current_y

    def skip_reveal(self) -> None:
        self.revealed_count = len(self.full_text)
        self.is_finished = True
