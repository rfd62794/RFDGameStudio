"""
RenderPipeline - Layered rendering system for scenes
"""

from enum import Enum
from dataclasses import dataclass
from typing import Callable, List
import pygame


class RenderLayer(Enum):
    """Standard rendering layers for consistent draw order"""
    BACKGROUND = 0
    ENVIRONMENT = 1
    ENTITIES = 2
    UI = 3
    OVERLAY = 4
    DEBUG = 5


@dataclass
class RenderCommand:
    """Single render command with layer and ordering"""
    layer: RenderLayer
    draw_fn: Callable[[pygame.Surface], None]
    z_order: int = 0


class RenderPipeline:
    """
    Collects render commands during update, executes them in layer order during render.
    Scenes submit commands rather than drawing directly.
    
    Usage pattern (scenes that adopt it):
        def render(self, surface):
            self.pipeline.submit(
                RenderLayer.BACKGROUND,
                lambda s: s.fill(self.bg_color))
            self.pipeline.submit(
                RenderLayer.ENTITIES,
                lambda s: self._render_slimes(s))
            self.pipeline.submit(
                RenderLayer.UI,
                lambda s: self._render_ui(s))
            self.pipeline.execute(surface)
    
    Scenes that don't adopt it continue working exactly as before.
    """
    
    def __init__(self):
        self._commands: List[RenderCommand] = []
    
    def submit(self, layer: RenderLayer, draw_fn: Callable, z_order: int = 0) -> None:
        """Submit a render command to the pipeline"""
        self._commands.append(RenderCommand(layer, draw_fn, z_order))
    
    def execute(self, surface: pygame.Surface) -> None:
        """Execute all render commands in layer order"""
        if not self._commands:
            return
            
        # Sort by layer value, then by z_order (higher z_order renders later)
        sorted_cmds = sorted(
            self._commands,
            key=lambda c: (c.layer.value, c.z_order)
        )
        
        for cmd in sorted_cmds:
            try:
                cmd.draw_fn(surface)
            except Exception as e:
                # Log error but continue rendering
                print(f"Render command failed: {e}")
        
        self._commands.clear()
    
    def clear(self) -> None:
        """Clear all pending render commands"""
        self._commands.clear()
    
    def count_commands(self) -> int:
        """Get number of pending commands (for debugging)"""
        return len(self._commands)
    
    def get_commands_by_layer(self, layer: RenderLayer) -> List[RenderCommand]:
        """Get all commands for a specific layer (for debugging)"""
        return [cmd for cmd in self._commands if cmd.layer == layer]
