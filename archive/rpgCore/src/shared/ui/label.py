from typing import Tuple, List, Optional
import pygame
from src.shared.ui.base import UIComponent
from src.shared.ui.spec import UISpec
from src.shared.ui.theme import DEFAULT_THEME

class Label(UIComponent):
    """Text rendering component with alignment and word wrap, driven by UISpec."""
    
    def __init__(
        self,
        text: str,
        position: Tuple[int, int],
        spec: UISpec,
        size: str = "md",
        color: Optional[Tuple[int, int, int]] = None,
        bold: bool = False,
        centered: bool = False,
        wrap_width: Optional[int] = None,
        theme: Optional['UITheme'] = None,
        z_order: int = 0
    ):
        self.theme = theme or DEFAULT_THEME
        
        # Map size names to theme values
        font_sizes = {
            "sm": self.theme.font_small,
            "md": self.theme.font_medium,
            "lg": self.theme.font_large,
            "xl": 24,  # Fallback
            "hd": 32,  # Fallback
        }
        self.font_size = font_sizes.get(size, self.theme.font_medium)
        self.color = color or self.theme.text_primary
        self.align = "center" if centered else "left"
        
        # Calculate rect based on position and wrap_width
        # For now, we use a default width if not provided, rect will grow/shrink in render logic if needed?
        # Actually Label's _cache_text uses self.rect and self.wrap_width.
        rect = pygame.Rect(position[0], position[1], wrap_width or 200, self.font_size + 4)
        if centered:
             rect.x -= rect.width // 2
             
        super().__init__(rect, self.theme, z_order)
        self.text = text
        self.wrap_width = wrap_width or rect.width
        self.bold = bold
        self.spec = spec
        
        # Add visible attribute for compatibility
        self.visible = True
        
        try:
            self.font = pygame.font.Font(None, self.font_size)
            if self.bold:
                self.font.set_bold(True)
        except:
            self.font = None
            
        self._rendered_lines: List[Tuple[pygame.Surface, pygame.Rect]] = []
        self._cache_text()

    def set_text(self, text: str) -> None:
        if self.text != text:
            self.text = text
            self._cache_text()

    def _cache_text(self) -> None:
        self._rendered_lines.clear()
        if not self.font or not self.text:
            return

        words = self.text.split(' ')
        lines = []
        current_line = []
        
        for word in words:
            # Check for explicit newlines
            if '\n' in word:
                parts = word.split('\n')
                for i, part in enumerate(parts):
                    if i > 0:
                        lines.append(' '.join(current_line))
                        current_line = []
                    if part:
                        current_line.append(part)
                continue
                
            test_line = ' '.join(current_line + [word])
            size = self.font.size(test_line)
            if size[0] <= self.wrap_width:
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

        y_offset = self.rect.y
        line_height = self.font.get_linesize()
        
        for line in lines:
            if not line:
                y_offset += line_height
                continue
                
            surf = self.font.render(line, True, self.color)
            
            x_offset = self.rect.x
            if self.align == "center":
                x_offset = self.rect.x + (self.wrap_width - surf.get_width()) // 2
            elif self.align == "right":
                x_offset = self.rect.x + self.wrap_width - surf.get_width()
                
            surf_rect = pygame.Rect(x_offset, y_offset, surf.get_width(), surf.get_height())
            self._rendered_lines.append((surf, surf_rect))
            
            y_offset += line_height

    def get_required_height(self) -> int:
        """Calculate the height needed to display all lines."""
        if not self.font or not self._rendered_lines:
            return 0
        return len(self._rendered_lines) * self.font.get_linesize()

    def tick(self, dt_ms: int) -> None:
        pass

    def render(self, surface: pygame.Surface) -> None:
        if not self.visible:
            return
            
        for surf, rect in self._rendered_lines:
            surface.blit(surf, rect)
