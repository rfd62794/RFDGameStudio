"""
Tiny Farm Rendering Loader - Fix for Asset Display Issue
Custom asset loader that ensures Tiny Farm images are actually rendered
"""

import tkinter as tk
from typing import Optional
from loguru import logger


class TinyFarmRenderingLoader:
    """
    Asset loader that ensures Tiny Farm images are rendered correctly
    This replaces the procedural sprite generation with actual loaded images
    """
    
    def __init__(self):
        self.sprites = {}
        self.tiny_farm_sprites = {}
        logger.info("🚜 Tiny Farm Rendering Loader initialized")
    
    def set_tiny_farm_sprites(self, tiny_farm_sprites: dict):
        """Set the Tiny Farm sprites that should be used for rendering"""
        self.tiny_farm_sprites = tiny_farm_sprites
        logger.info(f"🎨 Set {len(tiny_farm_sprites)} Tiny Farm sprites for rendering")
    
    def get_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get sprite by ID - prioritize Tiny Farm assets"""
        # First try Tiny Farm assets
        if sprite_id in self.tiny_farm_sprites:
            return self.tiny_farm_sprites[sprite_id]
        
        # Fallback to procedural sprites
        return self.sprites.get(sprite_id)
    
    def add_procedural_sprite(self, sprite_id: str, sprite: tk.PhotoImage):
        """Add procedural sprite as fallback"""
        self.sprites[sprite_id] = sprite
