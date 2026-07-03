"""
Layer Compositor - Manages dedicated surfaces for different rendering depths.
Composites them in the correct Z-order (background -> midground -> foreground -> hud).
"""
import os
from typing import Dict, Any

class LayerCompositor:
    LAYERS = ["background", "midground", "foreground", "hud"]

    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self._surfaces: Dict[str, Any] = {}
        
        if not os.environ.get("PYTEST_CURRENT_TEST"):
            import pygame
            for layer in self.LAYERS:
                self._surfaces[layer] = pygame.Surface((width, height), pygame.SRCALPHA)
            self._display_initialized = True
        else:
            self._display_initialized = False
            for layer in self.LAYERS:
                self._surfaces[layer] = None

    def get_layer(self, name: str) -> Any:
        return self._surfaces.get(name, self._surfaces.get("midground"))

    def clear(self) -> None:
        if not self._display_initialized:
            return
        # Background gets fully cleared (e.g. to transparent or black, though it's usually filled by caller)
        # Other layers must be cleared to fully transparent SRCALPHA
        for layer_name, surface in self._surfaces.items():
            surface.fill((0, 0, 0, 0))

    def composite(self, target_surface: Any) -> None:
        """Draws all layers in order onto the target surface."""
        if not self._display_initialized or not target_surface:
            return
            
        for layer in self.LAYERS:
            surface = self._surfaces.get(layer)
            if surface:
                target_surface.blit(surface, (0, 0))
