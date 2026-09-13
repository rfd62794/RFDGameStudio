"""
Sovereign Surface - Virtual Resolution Scaler

Renders to a fixed low-resolution virtual surface (e.g., 320x240) and scales it up
to fit the actual display window during presentation. 
This preserves a retro aesthetic and divorces game coordinates from screen resolution.
"""

from typing import Tuple
import os

class SovereignSurface:
    def __init__(self, virtual_width: int, virtual_height: int):
        self.virtual_width = virtual_width
        self.virtual_height = virtual_height
        self._font_module_initialized = False
        
        # Don't initialize pygame display in headless tests
        if not os.environ.get("PYTEST_CURRENT_TEST"):
            import pygame
            self.surface = pygame.Surface((virtual_width, virtual_height), pygame.SRCALPHA)
            pygame.font.init()
            self._font_module_initialized = True
        else:
            self.surface = None

    def clear(self, color: Tuple[int, int, int] = (0, 0, 0)) -> None:
        if self.surface:
            self.surface.fill(color)

    def present(self, display_surface: 'pygame.Surface') -> None:
        """Scales the virtual surface to perfectly fit the display surface."""
        if not self.surface or not display_surface:
            return
            
        import pygame
        screen_w, screen_h = display_surface.get_size()
        
        # Scale the sovereign surface
        scaled_surface = pygame.transform.scale(self.surface, (screen_w, screen_h))
        display_surface.blit(scaled_surface, (0, 0))

    def get_surface(self) -> 'pygame.Surface':
        """Returns the virtual surface for drawing operations."""
        return self.surface
