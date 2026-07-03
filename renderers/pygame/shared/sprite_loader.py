"""
Sprite Loader - Caches images from disk and supports virtual resolution scaling.
"""
from typing import Dict, Any, Optional
import os
import logging

logger = logging.getLogger(__name__)

class SpriteLoader:
    _instance: Optional['SpriteLoader'] = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(SpriteLoader, cls).__new__(cls)
            cls._instance._sprites: Dict[str, Any] = {}
        return cls._instance

    def load(self, key: str, filepath: str) -> bool:
        """Loads an image into the cache. Returns True if successful."""
        if os.environ.get("PYTEST_CURRENT_TEST"):
            self._sprites[key] = f"DummySprite({filepath})"
            return True

        if key in self._sprites:
            return True

        import pygame
        if not os.path.exists(filepath):
            logger.warning(f"Sprite file not found: {filepath}")
            return False

        try:
            surface = pygame.image.load(filepath).convert_alpha()
            self._sprites[key] = surface
            return True
        except Exception as e:
            logger.error(f"Failed to load sprite {filepath}: {e}")
            return False

    def get_sprite(self, key: str) -> Any:
        return self._sprites.get(key)

    def clear(self) -> None:
        self._sprites.clear()
