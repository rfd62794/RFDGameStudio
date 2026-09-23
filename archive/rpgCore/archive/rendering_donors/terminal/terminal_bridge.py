"""
Terminal Bridge - Adapts PixelRenderer for AsteroidsNEATGame.

Acts as a drop-in replacement for AsteroidsSDK, rendering the game state
to the terminal using Unicode block characters instead of sending it to Godot.
"""

import os
import sys
import math
from typing import List, Dict, Any

from src.game_engine.systems.graphics.pixel_renderer import PixelRenderer, Pixel
from src.game_engine.foundation import SystemConfig

class TerminalBridge:
    """
    Renders Asteroids game state to terminal using PixelRenderer.
    Implements the same interface as AsteroidsSDK for seamless swapping.
    """

    def __init__(self, width: int = 160, height: int = 144):
        self.width = width
        self.height = height
        self.renderer = PixelRenderer(
            config=SystemConfig(name="TerminalRenderer"),
            width=width,
            height=height
        )
        self.renderer.initialize()
        
        # Colors for different entity types
        self.colors = {
            "ship": Pixel(r=4, g=4, b=5, intensity=1.0),      # Cyan-ish
            "asteroid": Pixel(r=3, g=3, b=3, intensity=0.8),  # Grey
            "projectile": Pixel(r=5, g=5, b=2, intensity=1.0), # Yellow
            "background": Pixel(r=0, g=0, b=1, intensity=0.1)  # Dark Blue
        }

    def connect(self) -> bool:
        """Mock connection - always valid for local terminal."""
        # Clear screen to prepare
        os.system('cls' if os.name == 'nt' else 'clear')
        return True

    def disconnect(self) -> None:
        """Cleanup."""
        self.renderer.shutdown()

    def send_frame(self, entities: List[Dict[str, Any]], hud_data: Dict[str, str]) -> None:
        """Render frame to terminal."""
        self.renderer.clear_buffer()

        # Draw entities
        for entity in entities:
            if not entity.get("active", True):
                continue
            
            etype = entity.get("type", "unknown")
            x = int(entity.get("x", 0))
            y = int(entity.get("y", 0))
            radius = int(entity.get("radius", 1))
            
            pixel = self.colors.get(etype, Pixel(r=5, g=0, b=5, intensity=1.0))

            if etype == "ship":
                # Draw ship as triangle
                self._draw_ship(x, y, entity.get("heading", 0), pixel)
            elif etype == "projectile":
                # Draw as single bright pixel
                self.renderer.draw_pixel(x, y, pixel)
            else:
                # Draw asteroids as circles
                self.renderer.draw_circle(x, y, radius, pixel, filled=False)

        # Get the rendered buffer string
        frame_text = self.renderer.get_buffer_as_text()
        
        # Move cursor to top-left to overwrite previous frame (flicker reduction)
        sys.stdout.write("\033[H")
        sys.stdout.write(frame_text)
        
        # Print HUD below
        sys.stdout.write("\033[K") # Clear line
        sys.stdout.write(f"\nScore: {hud_data.get('score')} | Lives: {hud_data.get('lives')} | {hud_data.get('wave')} | {hud_data.get('status')}\n")
        sys.stdout.flush()

    def _draw_ship(self, x: int, y: int, heading: float, pixel: Pixel) -> None:
        """Draw simple ship triangle based on heading."""
        # Nose
        x1 = x + math.cos(heading) * 6
        y1 = y + math.sin(heading) * 6
        
        # Rear Left
        x2 = x + math.cos(heading + 2.5) * 5
        y2 = y + math.sin(heading + 2.5) * 5
        
        # Rear Right
        x3 = x + math.cos(heading - 2.5) * 5
        y3 = y + math.sin(heading - 2.5) * 5
        
        # Draw wireframe
        self.renderer.draw_line(int(x1), int(y1), int(x2), int(y2), pixel)
        self.renderer.draw_line(int(x2), int(y2), int(x3), int(y3), pixel)
        self.renderer.draw_line(int(x3), int(y3), int(x1), int(y1), pixel)
