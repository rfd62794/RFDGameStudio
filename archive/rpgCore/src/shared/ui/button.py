import pygame
from typing import Callable, Tuple, Optional
from src.shared.ui.spec import UISpec
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.theme import DEFAULT_THEME

class Button(Panel):
    """Interactive clickable region with states, driven by UISpec."""
    
    def __init__(
        self,
        label: str,
        rect: pygame.Rect,
        on_click: Optional[Callable[[], None]],
        spec: UISpec,
        variant: str = "primary",
        enabled: bool = True,
        theme: Optional['UITheme'] = None,
        z_order: int = 0
    ):
        self.spec = spec
        self.variant = variant
        self.enabled = enabled
        self.theme = theme or DEFAULT_THEME
        
        # Build variant styling based on theme
        variants = {
            "primary":   {"bg": self.theme.info, "text": (255,255,255)},
            "secondary": {"bg": self.theme.surface, "text": self.theme.text_primary},
            "danger":    {"bg": self.theme.danger, "text": (255,255,255)},
            "ghost":     {"bg": (0,0,0,0), "text": self.theme.text_primary, "border": self.theme.border},
        }
        style = variants.get(variant, variants["primary"])
        
        self.bg_color_normal = style["bg"]
        # Derive hover/pressed colors if not ghost
        if variant == "ghost":
            self.bg_color_hover = (style["bg"][0], style["bg"][1], style["bg"][2], 30) # faint highlight
            self.bg_color_pressed = (style["bg"][0], style["bg"][1], style["bg"][2], 60)
            border_color = style.get("border", self.theme.border)
        else:
            # Simple brightening for hover
            self.bg_color_hover = tuple(min(255, c + 20) for c in style["bg"])
            self.bg_color_pressed = tuple(max(0, c - 20) for c in style["bg"])
            border_color = self.theme.border

        super().__init__(
            rect=rect, 
            spec=spec,
            variant="card" if variant != "ghost" else "surface", # Map to Panel variant
            theme=theme,
            z_order=z_order
        )
        # Override Panel's bg/border with our variant style
        self.bg_color = self.bg_color_normal
        self.border_color = border_color
        
        self.text = label
        self.on_click = on_click
        self.on_hover = None # Simplified for now
        
        self.bg_color_disabled = (spec.color_bg[0]+5, spec.color_bg[1]+5, spec.color_bg[2]+5)
        
        # Add visible attribute for compatibility
        self.visible = True
        
        self.state = "normal" if enabled else "disabled"
        
        # Center the label inside the button
        self.label_comp = Label(
            text=label, 
            position=(rect.centerx, rect.centery), 
            spec=spec,
            size="md",
            color=style["text"],
            centered=True
        )
        self.add_child(self.label_comp)
        
        self.children = [self.label_comp]
        
        self._was_hovered = False
    
    def is_clicked(self, mouse_x: int, mouse_y: int) -> bool:
        """Check if the button was clicked"""
        return self.rect.collidepoint(mouse_x, mouse_y) and self.enabled
        
    def set_enabled(self, v: bool) -> None:
        self.enabled = v
        if not v:
            self.state = "disabled"
            self.bg_color = self.bg_color_disabled
        else:
            self.state = "normal"
            self.bg_color = self.bg_color_normal

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Process Pygame events to manage click states. Returns True if event was consumed."""
        if not self.visible or not self.enabled:
            return False
            
        if event.type == pygame.MOUSEMOTION:
            is_hovered = self.contains_point(event.pos[0], event.pos[1])
            if is_hovered:
                if self.state != "pressed":
                    self.state = "hover"
                    self.bg_color = self.bg_color_hover
                if not self._was_hovered:
                    if self.on_hover:
                        self.on_hover()
                    self._was_hovered = True
                return True
            else:
                self.state = "normal"
                self.bg_color = self.bg_color_normal
                self._was_hovered = False
                
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.contains_point(event.pos[0], event.pos[1]):
                self.state = "pressed"
                self.bg_color = self.bg_color_pressed
                return True
                
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            if self.state == "pressed":
                self.state = "hover" if self.contains_point(event.pos[0], event.pos[1]) else "normal"
                self.bg_color = self.bg_color_hover if self.state == "hover" else self.bg_color_normal
                if self.contains_point(event.pos[0], event.pos[1]) and self.on_click:
                    self.on_click()
                return True
                
        return False
