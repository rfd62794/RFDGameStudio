"""
PyGame Renderer - Concrete implementation of RenderAdapter using PyGame.
Entity-based rendering pattern.
"""

from typing import Any, List, Dict
from math import cos, sin
import os
import pygame

from .render_adapter import RenderAdapter

class PyGameRenderer(RenderAdapter):
    def __init__(self, width: int = 800, height: int = 600, title: str = "rpgCore Engine"):
        self.width = width
        self.height = height
        self.title = title
        self.screen = None
        
        # Avoid showing window during headless tests
        if os.environ.get("PYTEST_CURRENT_TEST"):
            os.environ["SDL_VIDEODRIVER"] = "dummy"

    def initialize(self, surface: pygame.Surface = None) -> bool:
        if surface is not None:
            self.screen = surface
        return True

    def shutdown(self) -> None:
        import pygame
        pygame.quit()

    def clear(self, color: Any) -> None:
        if self.screen:
            self.screen.fill(color)

    def present(self) -> None:
        import pygame
        if self.screen:
            pygame.display.flip()

    def render_entities(self, entities: List[Dict[str, Any]]) -> None:
        """Legacy flat-list rendering wrapper"""
        self.render_layered_entities({"midground": entities})

    def render_layered_entities(self, layers_dict: Dict[str, List[Dict[str, Any]]]) -> None:
        """
        Renders entities organized by layer.
        """
        import pygame
        if not self.screen:
            return

        from .layer_compositor import LayerCompositor
        from .font_manager import FontManager
        from .sprite_loader import SpriteLoader

        # Initialize singletons/managers if needed
        FontManager().initialize()
        
        # We need a compositor sized to our screen if scaling isn't externally managed
        if not hasattr(self, '_compositor'):
            self._compositor = LayerCompositor(self.width, self.height)
            
        self._compositor.clear()

        for layer_name, entities in layers_dict.items():
            layer_surface = self._compositor.get_layer(layer_name)
            if not layer_surface:
                continue

            for entity in entities:
                if not entity.get("active", True):
                    continue
                
                e_type = entity.get("type", "unknown")
                x = entity.get("x", 0)
                y = entity.get("y", 0)
                radius = entity.get("radius", 10)
                color = entity.get("color", (255, 255, 255))
                heading = entity.get("heading", 0.0)

                if e_type == "circle":
                    pygame.draw.circle(layer_surface, color, (int(x), int(y)), int(radius))
                elif e_type == "triangle":
                    x1 = x + cos(heading) * radius * 1.5
                    y1 = y + sin(heading) * radius * 1.5
                    x2 = x + cos(heading + 2.5) * radius
                    y2 = y + sin(heading + 2.5) * radius
                    x3 = x + cos(heading - 2.5) * radius
                    y3 = y + sin(heading - 2.5) * radius
                    points = [(x1, y1), (x2, y2), (x3, y3)]
                    pygame.draw.polygon(layer_surface, color, points, 1)
                elif e_type == "rect":
                    # Let entity define width/height if needed, else use radius
                    w = entity.get("width", radius * 2)
                    h = entity.get("height", radius * 2)
                    rect = pygame.Rect(x, y, w, h)
                    pygame.draw.rect(layer_surface, color, rect, entity.get("line_width", 0))
                elif e_type == "line":
                    end_x = entity.get("end_x", x)
                    end_y = entity.get("end_y", y)
                    width = entity.get("line_width", 1)
                    pygame.draw.line(layer_surface, color, (x, y), (end_x, end_y), width)
                elif e_type == "arc":
                    rect = pygame.Rect(x - radius, y - radius, radius * 2, radius * 2)
                    start_angle = entity.get("start_angle", 0)
                    stop_angle = entity.get("stop_angle", 3.14)
                    width = entity.get("line_width", 1)
                    pygame.draw.arc(layer_surface, color, rect, start_angle, stop_angle, width)
                elif e_type == "ellipse":
                    w = entity.get("width", radius * 2)
                    h = entity.get("height", radius)
                    rect = pygame.Rect(x, y, w, h)
                    pygame.draw.ellipse(layer_surface, color, rect, entity.get("line_width", 0))
                elif e_type == "text":
                    text_str = entity.get("text", "")
                    font_name = entity.get("font", "monospace")
                    font_size = entity.get("size", 14)
                    text_surface = FontManager().render_text(text_str, font_name, font_size, color)
                    layer_surface.blit(text_surface, (x, y))
                elif e_type == "sprite":
                    sprite_key = entity.get("sprite_key", "")
                    sprite = SpriteLoader().get_sprite(sprite_key)
                    if sprite:
                        layer_surface.blit(sprite, (x, y))
                else:
                    pass

        # Finally, composite onto main screen
        self._compositor.composite(self.screen)
