"""
Asset Fabricator Component - PIL-Free Version
ADR 086: The Fault-Tolerant Asset Pipeline

Data-to-Pixels component - Uses pure Tkinter canvas drawing.
No PIL/Pillow dependency - uses Tkinter's built-in drawing capabilities.
"""

import tkinter as tk
from typing import Dict, Optional, Tuple
import logging

# Configure logger for this module
logger = logging.getLogger(__name__)

class AssetFabricator:
    """Data-to-pixels generator using pure Tkinter (no PIL)"""
    
    def __init__(self):
        self.registry: Dict[str, tk.PhotoImage] = {}
        self._sprite_refs: List[tk.PhotoImage] = []
        self.failed_sprites: List[str] = []
    
    def generate_all_sprites(self, parsed_data: Dict) -> Dict[str, tk.PhotoImage]:
        """Generate all sprites using pure Tkinter"""
        logger.info("🎨 AssetFabricator: Generating sprites with pure Tkinter")
        
        # Generate basic colored squares using Tkinter PhotoImage
        self._generate_basic_sprites()
        
        # Report results
        logger.info(f"🎨 AssetFabricator: Generated {len(self.registry)} sprites with pure Tkinter")
        
        return self.registry
    
    def _generate_basic_sprites(self) -> None:
        """Generate basic colored square sprites using Tkinter"""
        try:
            # Basic color palette for different materials
            sprite_colors = {
                # Wooden objects
                'wooden_door': '#8B5A2B',
                'wooden_chest': '#A0522D', 
                'wooden_box': '#A0522D',
                'signpost': '#8B5A2B',
                
                # Stone objects
                'stone_wall': '#808080',
                'crystal': '#FF00FF',
                
                # Metal objects
                'iron_chest': '#696969',
                'metal_door': '#464646',
                
                # Organic objects
                'tree': '#008000',
                'bush': '#006400',
                'sonic_flower': '#FFB6C1',
                'animated_flower': '#FFB6C1',
                
                # Liquid objects
                'water_puddle': '#0064C8',
                
                # Special objects
                'ancient_ruins': '#404040',
                
                # Actor sprites
                'voyager_idle': '#0064FF',
                'voyager_walk': '#0078FF',
                'voyager_combat': '#0050FF',
                
                # Tile sprites
                'tile_grass': '#228B22',
                'tile_stone': '#808080',
                'tile_water': '#0064C8',
                'tile_dirt': '#8B5A2B',
            }
            
            for sprite_id, color in sprite_colors.items():
                try:
                    # Create a simple 16x16 colored square using PhotoImage
                    sprite = self._create_tkinter_sprite(color)
                    self.registry[sprite_id] = sprite
                    self._sprite_refs.append(sprite)
                    logger.debug(f"🎨 Generated sprite: {sprite_id}")
                except Exception as e:
                    self.failed_sprites.append(sprite_id)
                    logger.error(f"💥 Failed to generate sprite {sprite_id}: {e}")
                    # Generate Pink X fallback
                    self._generate_pink_x(sprite_id)
            
        except Exception as e:
            logger.error(f"💥 Basic sprite generation failed: {e}")
    
    def _create_tkinter_sprite(self, color: str) -> tk.PhotoImage:
        """Create a simple colored square sprite using PhotoImage"""
        # Create a 16x16 PhotoImage with the specified color
        sprite = tk.PhotoImage(width=16, height=16)
        
        # Fill the sprite with the color
        # Note: PhotoImage doesn't have a direct fill method, so we'll create a simple pattern
        for x in range(16):
            for y in range(16):
                # Simple pattern - fill with color
                sprite.put(color, (x, y))
        
        return sprite
    
    def _generate_pink_x(self, sprite_id: str) -> None:
        """Generate a Pink X placeholder for failed sprites"""
        try:
            # Create a pink square with X pattern
            sprite = tk.PhotoImage(width=16, height=16)
            
            # Fill with pink background
            for x in range(16):
                for y in range(16):
                    sprite.put('#FFC0CB', (x, y))
            
            # Draw red X
            for i in range(16):
                sprite.put('#FF0000', (i, i))  # Diagonal from top-left to bottom-right
                sprite.put('#FF0000', (i, 15 - i))  # Diagonal from top-right to bottom-left
            
            self.registry[sprite_id] = sprite
            self._sprite_refs.append(sprite)
            
            logger.warning(f"⚠️ Generated Pink X for {sprite_id}")
            
        except Exception as e:
            logger.error(f"💥 Failed to generate Pink X for {sprite_id}: {e}")
    
    def get_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get a sprite by ID"""
        return self.registry.get(sprite_id)
    
    def has_sprite(self, sprite_id: str) -> bool:
        """Check if a sprite exists"""
        return sprite_id in self.registry
    
    def get_all_sprites(self) -> Dict[str, tk.PhotoImage]:
        """Get all sprites"""
        return self.registry.copy()
    
    def get_failed_sprites(self) -> List[str]:
        """Get list of sprites that failed to generate"""
        return self.failed_sprites.copy()
