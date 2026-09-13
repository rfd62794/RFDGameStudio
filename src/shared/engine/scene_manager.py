"""
Scene Manager — Lightweight State Machine for pygame Applications
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional, TYPE_CHECKING, Dict, Any, List
from dataclasses import dataclass, field

import pygame
from loguru import logger

from src.shared.engine.base_system import BaseSystem, SystemStatus, SystemConfig

@dataclass
class SceneContext:
    surface: pygame.Surface
    manager: 'SceneManager'
    clock: pygame.time.Clock
    resources: dict = field(default_factory=dict)

class Scene(BaseSystem, ABC):
    """
    Abstract base class for all game scenes.
    """

    def __init__(self, **kwargs) -> None:
        super().__init__(SystemConfig(name=self.__class__.__name__))
        self.context: Optional[SceneContext] = None
        self.quit_requested: bool = False

    def request_quit(self) -> None:
        """Request application exit after this frame."""
        self.quit_requested = True

    # ---------------------------------------------------------------------------
    # BaseSystem Lifecycle Wrappers
    # ---------------------------------------------------------------------------
    def initialize(self) -> bool:
        """Formal initialization - unused in new lifecycle but kept for BaseSystem contract."""
        return True

    def shutdown(self) -> None:
        """Formal cleanup."""
        self.on_exit()

    # ---------------------------------------------------------------------------
    # Standard Scene Interface
    # ---------------------------------------------------------------------------
    def on_enter(self, context: SceneContext) -> None:
        """Called when scene becomes active. Receives context."""
        self.context = context

    def on_exit(self) -> None:
        """Called when scene is popped or replaced."""
        pass

    def on_pause(self) -> None:
        """Called when a scene is pushed on top of this one."""
        pass

    def on_resume(self) -> None:
        """Called when the scene above is popped, this becomes active again."""
        pass

    @abstractmethod
    def handle_event(self, event: pygame.event.Event) -> None:
        """Process a single pygame event."""
        pass

    @abstractmethod
    def tick(self, dt: float) -> None:
        """Update scene state (dt in seconds)."""
        pass

    @abstractmethod
    def render(self, surface: pygame.Surface) -> None:
        """Render scene to the provided surface."""
        pass

class SceneManager:
    """
    Manages scene lifecycle and transitions in a single pygame window.
    """

    def __init__(self, surface: pygame.Surface, clock: pygame.time.Clock):
        self.surface = surface
        self.clock = clock
        self._stack: List[Scene] = []
        self._running = False
        self.resources: Dict[str, Any] = {}
        
        # Keep track of active scene for BaseSystem generic checks
        self._active_scene: Optional[Scene] = None

    def switch_to(self, scene: Scene) -> None:
        """Replace current scene entirely."""
        if self._stack:
            old_scene = self._stack.pop()
            logger.info(f"Exiting scene: {old_scene.config.name}")
            old_scene.on_exit()
            old_scene.status = SystemStatus.STOPPED
            
        logger.info(f"Switching to scene: {scene.config.name}")
        self._stack.append(scene)
        self._active_scene = scene
        
        ctx = SceneContext(self.surface, self, self.clock, self.resources)
        scene.on_enter(ctx)
        scene.status = SystemStatus.RUNNING

    def overlay(self, scene: Scene) -> None:
        """Push scene on top without exiting the one below."""
        if self._stack:
            old_scene = self._stack[-1]
            logger.info(f"Pausing scene: {old_scene.config.name}")
            old_scene.on_pause()
            old_scene.status = SystemStatus.PAUSED

        logger.info(f"Overlaying scene: {scene.config.name}")
        self._stack.append(scene)
        self._active_scene = scene
        
        ctx = SceneContext(self.surface, self, self.clock, self.resources)
        scene.on_enter(ctx)
        scene.status = SystemStatus.RUNNING

    def back(self) -> None:
        """Return to previous scene. Replaces .pop()."""
        if not self._stack:
            logger.warning("Attempted to call back() with empty stack")
            return

        old_scene = self._stack.pop()
        logger.info(f"Exiting scene: {old_scene.config.name}")
        old_scene.on_exit()
        old_scene.status = SystemStatus.STOPPED

        if self._stack:
            self._active_scene = self._stack[-1]
            logger.info(f"Resuming scene: {self._active_scene.config.name}")
            self._active_scene.on_resume()
            self._active_scene.status = SystemStatus.RUNNING
        else:
            self._active_scene = None

    def run(self, fps: int = 60) -> None:
        """Main loop."""
        self._running = True

        while self._running:
            elapsed_ms = self.clock.tick(fps)
            dt = elapsed_ms / 1000.0

            events = pygame.event.get()

            if self._stack:
                active_scene = self._stack[-1]
                
                # Loop through events and pass individually
                for event in events:
                    if event.type == pygame.QUIT:
                        self._running = False
                    active_scene.handle_event(event)
                
                if active_scene.status == SystemStatus.RUNNING:
                    active_scene.tick(dt)
                    active_scene.render(self.surface)
                    pygame.display.flip()

                if getattr(active_scene, 'quit_requested', False):
                    self._running = False
            else:
                self._running = False

        if self._stack:
            for scene in reversed(self._stack):
                scene.on_exit()
        pygame.quit()
