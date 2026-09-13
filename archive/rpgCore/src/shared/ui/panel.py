from typing import List, Optional, Tuple, Union
import pygame
from src.shared.ui.base import UIComponent
from src.shared.ui.spec import UISpec
from src.shared.ui.theme import DEFAULT_THEME

class Panel(UIComponent):
    """A container component that can hold and render children, driven by UISpec."""
    
    def __init__(
        self, 
        rect: pygame.Rect, 
        spec: UISpec,
        variant: str = "surface",
        border: bool = True,
        theme: Optional['UITheme'] = None,
        z_order: int = 0
    ):
        self.spec = spec
        self.theme = theme or DEFAULT_THEME
        self.variant = variant
        
        # Map variants to theme colors
        variants = {
            "surface": {"bg": self.theme.surface, "border_color": self.theme.border},
            "card":    {"bg": self.theme.surface_raised, "border_color": self.theme.border_active},
            "overlay": {"bg": (self.theme.background[0], self.theme.background[1], self.theme.background[2], 230), "border_color": self.theme.border},
        }
        style = variants.get(variant, variants["surface"])
        
        super().__init__(rect, self.theme, z_order)
        self.bg_color = style["bg"]
        self.border_color = style["border_color"]
        self.border_width = 2 if border else 0
        self.border_radius = 8
        self.title = None
        
        self.children: List[UIComponent] = []
        
        # Add visible attribute for compatibility
        self.visible = True
        
        # Simple font for title if provided
        if self.title:
            try:
                self.title_font = pygame.font.Font(None, 24)
            except:
                self.title_font = None

    def add_child(self, component: UIComponent) -> None:
        if component not in self.children:
            self.children.append(component)
            self.children.sort(key=lambda c: c.z_order)

    def remove_child(self, component: UIComponent) -> None:
        if component in self.children:
            self.children.remove(component)

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Propagate events to children in reverse z-order. Returns True if consumed."""
        if not self.visible:
            return False
            
        # Panels usually don't consume events themselves (unless they have a background click handler)
        # but they MUST pass them to children.
        for child in reversed(self.children):
            if hasattr(child, "handle_event") and child.handle_event(event):
                return True
        return False

    def tick(self, dt_ms: int) -> None:
        if not self.visible:
            return
        for child in self.children:
            child.tick(dt_ms)

    def render(self, surface: pygame.Surface) -> None:
        if not self.visible:
            return
            
        # Draw background
        if self.bg_color:
            pygame.draw.rect(surface, self.bg_color, self.rect, border_radius=self.border_radius)
            
        # Draw border
        if self.border_width > 0 and self.border_color:
            pygame.draw.rect(surface, self.border_color, self.rect, width=self.border_width, border_radius=self.border_radius)
            
        # Draw title
        if self.title and self.title_font:
            title_surf = self.title_font.render(self.title, True, self.border_color)
            surface.blit(title_surf, (self.rect.x + 10, self.rect.y + 10))
            
        # Render children
        for child in self.children:
            child.render(surface)
