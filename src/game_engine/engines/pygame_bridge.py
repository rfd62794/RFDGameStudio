"""
PyGame Bridge - Adapts PyGame for AsteroidsNEATGame.

Acts as a drop-in replacement for AsteroidsSDK and TerminalBridge, rendering
the game state to a PyGame window.
"""

import pygame
import math
from typing import List, Dict, Any

class PyGameBridge:
    """
    Renders Asteroids game state to a PyGame window.
    Implements the same interface as AsteroidsSDK for seamless swapping.
    """

    def __init__(self, width: int = 400, height: int = 360, caption: str = "NEAT Asteroids"):
        self.width = width
        self.height = height
        self.caption = caption
        self.screen = None
        self.font = None
        
        # Scaling factor from game coordinates (160x144) to window size
        self.scale_x = width / 160.0
        self.scale_y = height / 144.0
        
        # Colors
        self.colors = {
            "background": (10, 10, 20),
            "ship": (0, 255, 255),        # Cyan
            "asteroid": (180, 180, 180),  # Light Grey
            "projectile": (255, 255, 0),  # Yellow
            "hud": (200, 200, 200),       # White-ish
            "thrust": (255, 100, 0)       # Orange
        }

    def connect(self, surface: pygame.Surface = None) -> bool:
        """Initialize PyGame window."""
        if surface is not None:
            self.screen = surface
        self.font = pygame.font.SysFont("monospace", 14)
        return True

    def disconnect(self) -> None:
        """Cleanup PyGame."""
        pygame.quit()

    def send_frame(self, entities: List[Dict[str, Any]], hud_data: Dict[str, str]) -> None:
        """Render frame to PyGame window."""
        if not self.screen:
            return

        # Handle PyGame events (required to keep window responsive)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        # 1. Clear screen
        self.screen.fill(self.colors["background"])

        # 2. Draw entities
        for entity in entities:
            if not entity.get("active", True):
                continue
            
            etype = entity.get("type", "unknown")
            x = entity.get("x", 0) * self.scale_x
            y = entity.get("y", 0) * self.scale_y
            radius = entity.get("radius", 1) * max(self.scale_x, self.scale_y)
            
            if etype == "ship":
                self._draw_ship(x, y, entity.get("heading", 0), radius)
            elif etype == "projectile":
                pygame.draw.circle(self.screen, self.colors["projectile"], (int(x), int(y)), max(2, int(radius)))
            else: # asteroid
                 pygame.draw.circle(self.screen, self.colors["asteroid"], (int(x), int(y)), int(radius), 1)

        # 3. Draw HUD
        self._draw_hud(hud_data)

        # 4. Flip display
        pygame.display.flip()

    def _draw_ship(self, x: float, y: float, heading: float, radius: float) -> None:
        """Draw ship as a rotated triangle."""
        # Calculate triangle vertices
        # Nose
        x1 = x + math.cos(heading) * radius * 1.5
        y1 = y + math.sin(heading) * radius * 1.5
        
        # Rear Left
        x2 = x + math.cos(heading + 2.5) * radius
        y2 = y + math.sin(heading + 2.5) * radius
        
        # Rear Right
        x3 = x + math.cos(heading - 2.5) * radius
        y3 = y + math.sin(heading - 2.5) * radius
        
        # Draw ship body
        points = [(x1, y1), (x2, y2), (x3, y3)]
        pygame.draw.polygon(self.screen, self.colors["ship"], points, 1)

    def _draw_hud(self, hud_data: Dict[str, str]) -> None:
        """Draw HUD overlay."""
        if not self.font:
            return
            
        y_offset = 10
        line_height = 18
        
        # Top Left: Score & Lives
        score_text = self.font.render(f"Score: {hud_data.get('score', '0')}", True, self.colors["hud"])
        self.screen.blit(score_text, (10, y_offset))
        
        lives_text = self.font.render(f"Lives: {hud_data.get('lives', '3')}", True, self.colors["hud"])
        self.screen.blit(lives_text, (10, y_offset + line_height))

        # Top Right: Wave & Status
        wave_text = self.font.render(f"{hud_data.get('wave', '')}", True, self.colors["hud"])
        wave_rect = wave_text.get_rect(topright=(self.width - 10, y_offset))
        self.screen.blit(wave_text, wave_rect)
        
        status_text = self.font.render(f"{hud_data.get('status', '')}", True, self.colors["hud"])
        status_rect = status_text.get_rect(topright=(self.width - 10, y_offset + line_height))
        self.screen.blit(status_text, status_rect)
