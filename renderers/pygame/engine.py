"""
PyGameEngine — Port-Engine base class.

Architecture:
  - Game definition (YAML + Lua) loaded ONCE on init.
  - Layout resolved from ui.yaml → resolver.py → pixel bounds dict.
  - Subclasses override handle_event(), update(dt), render().
  - Discrete events call Lua via self.lua(fn, *args).
  - Continuous game logic runs in native Python (not via Lua every frame).
"""
from __future__ import annotations
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pygame
from studio.runtime import load_game, GameSession
from engine.ui.resolver import resolve_viewport, Bounds
from .colors import COLORS


class PyGameEngine:
    """
    Base class for all PyGame port-engine renderers.
    Handles: game definition loading, layout resolution, event loop.
    Subclasses handle: game state, rendering, input.
    """

    def __init__(self, game_id: str, width: int = 1024, height: int = 768):
        pygame.init()
        pygame.font.init()

        self.game_id = game_id
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height))
        self.clock = pygame.time.Clock()
        self.running = False

        # Load game definition ONCE — Port-Engine model
        self.session: GameSession = load_game(game_id, seed=42)

        # Resolve layout from ui.yaml
        ui = self.session.files.ui or {}
        layout_tree = ui.get('layout_tree')
        if layout_tree:
            resolved = resolve_viewport(layout_tree, width, height)
            self.bounds: dict[str, Bounds] = {b.id: b for b in resolved}
        else:
            self.bounds = {}

        # Coordinate transform — set by subclass for games with their own space
        # Default: 1:1 mapping, no offset (matches pixel-space games)
        self.game_scale: float = 1.0
        self.game_offset: tuple[int, int] = (0, 0)

    def lua(self, fn_name: str, *args: Any) -> Any:
        """Call a Lua discrete event function. Not for frame-by-frame use."""
        return self.session.executor.call(fn_name, *args)

    def to_screen(self, gx: float, gy: float) -> tuple[int, int]:
        """Convert game-space coordinates to screen pixels."""
        sx = int(gx * self.game_scale + self.game_offset[0])
        sy = int(gy * self.game_scale + self.game_offset[1])
        return sx, sy

    def scale_radius(self, r: float) -> int:
        """Scale a game-space radius to screen space. Minimum 2px."""
        return max(2, int(r * self.game_scale))

    def run(self) -> None:
        """Main event loop. Runs at 60fps."""
        pygame.display.set_caption(f'RFDGameStudio — {self.game_id}')
        self.running = True

        while self.running:
            dt = self.clock.tick(60) / 1000.0

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                    break
                self.handle_event(event)

            self.update(dt)
            self.screen.fill(COLORS['bg'])
            self.render()
            pygame.display.flip()

        pygame.quit()

    def handle_event(self, event: pygame.event.Event) -> None:
        """Override in subclass to handle input."""

    def update(self, dt: float) -> None:
        """Override in subclass for per-frame state updates."""

    def render(self) -> None:
        """Override in subclass to draw the current state."""
