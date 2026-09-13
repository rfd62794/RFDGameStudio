"""
Asset Fabricator Component
ADR 086: The Fault-Tolerant Asset Pipeline

Data-to-Pixels component - Uses PPU/PIL to generate native sprites.
If an image fails to generate, the Fabricator creates the Pink X placeholder.
"""

import tkinter as tk
from PIL import Image, ImageDraw, ImageTk
from typing import Dict, Optional, Tuple
import logging

# Configure logger for this module
logger = logging.getLogger(__name__)

class AssetFabricator:
    """Data-to-pixels generator with Pink X fallback"""
    
    def __init__(self):
        self.registry: Dict[str, tk.PhotoImage] = {}
        self._sprite_refs: List[tk.PhotoImage] = []
        self.failed_sprites: List[str] = []
    
    def generate_all_sprites(self, parsed_data: Dict) -> Dict[str, tk.PhotoImage]:
        """Generate all sprites from parsed data"""
        logger.info("🎨 AssetFabricator: Generating sprites from parsed data")
        
        # Generate object sprites
        objects_data = parsed_data.get('objects', {})
        for object_id, object_data in objects_data.items():
            try:
                sprite = self._generate_object_sprite(object_id, object_data)
                if sprite:
                    self.registry[object_id] = sprite
                    self._sprite_refs.append(sprite)
                    logger.debug(f"🎨 Generated sprite: {object_id}")
            except Exception as e:
                self.failed_sprites.append(object_id)
                logger.error(f"💥 Failed to generate sprite {object_id}: {e}")
                # Generate Pink X fallback
                self._generate_pink_x(object_id)
        
        # Generate actor sprites
        self._generate_actor_sprites()
        
        # Generate tile sprites
        self._generate_tile_sprites()
        
        # Report results
        total_sprites = len(objects_data)
        successful_sprites = len(self.registry) - len(self.failed_sprites)
        
        logger.info(f"🎨 AssetFabricator Results: {successful_sprites}/{total_sprites} sprites generated")
        
        if self.failed_sprites:
            logger.warning(f"⚠️ Failed sprites (Pink X): {self.failed_sprites}")
        
        return self.registry
    
    def _generate_object_sprite(self, object_id: str, object_data: Dict) -> Optional[tk.PhotoImage]:
        """Generate a procedural object sprite from data"""
        try:
            # Get sprite properties from object data
            material = object_data.get('material', 'unknown')
            sprite_id = object_data.get('sprite_id', object_id)
            
            # Determine sprite color and shape based on material
            color, shape = self._get_material_appearance(material)
            
            # Create sprite
            sprite = self._create_sprite_image(object_id, color, shape)
            
            # Convert to PhotoImage
            photo = ImageTk.PhotoImage(sprite)
            
            return photo
            
        except Exception as e:
            logger.error(f"💥 Object sprite generation failed for {object_id}: {e}")
            return None
    
    def _get_material_appearance(self, material: str) -> Tuple[Tuple[int, int, int, int], str]:
        """Get color and shape based on material type"""
        material_colors = {
            'oak_wood': (139, 90, 43, 255),
            'pine_wood': (160, 82, 45, 255),
            'wood': (139, 90, 43, 255),
            'granite': (128, 128, 128, 255),
            'marble': (192, 192, 192, 255),
            'stone': (128, 128, 128, 255),
            'iron': (105, 105, 105, 255),
            'steel': (70, 70, 70, 255),
            'metal': (128, 128, 128, 255),
            'crystal': (255, 0, 255, 255),
            'flower_petals': (255, 182, 193, 255),
            'plant_matter': (0, 128, 0, 255),
            'water_base': (0, 100, 200, 255),
            'ancient_stone': (64, 64, 64, 255),
        }
        
        material_shapes = {
            'wood': 'rectangle',
            'oak_wood': 'rectangle',
            'pine_wood': 'box',
            'stone': 'rectangle',
            'granite': 'rectangle',
            'marble': 'rectangle',
            'metal': 'rectangle',
            'iron': 'rectangle',
            'steel': 'rectangle',
            'crystal': 'diamond',
            'flower_petals': 'flower',
            'plant_matter': 'circle',
            'water_base': 'circle',
            'ancient_stone': 'rectangle',
        }
        
        color = material_colors.get(material, (128, 128, 128, 255))
        shape = material_shapes.get(material, 'rectangle')
        
        return color, shape
    
    def _create_sprite_image(self, sprite_id: str, color: Tuple[int, int, int, int], shape: str) -> Image.Image:
        """Create a procedural sprite image"""
        sprite = Image.new((16, 16), (255, 255, 255, 0), "RGBA")
        draw = ImageDraw.Draw(sprite)
        
        if shape == 'diamond':
            # Crystal diamond
            draw.polygon([(8, 2), (14, 8), (8, 14), (2, 8)], fill=color)
            draw.polygon([(8, 4), (12, 8), (8, 12), (4, 8)], fill=(255, 255, 255, 128))
        elif shape == 'box':
            # Wooden box - smaller rectangle with darker border
            draw.rectangle([3, 3, 13, 13], fill=color)
            draw.rectangle([2, 2, 14, 14], outline=(100, 50, 0, 255))  # Dark border
            # Add detail lines for box effect
            draw.line([3, 7, 13, 7], fill=(120, 60, 0, 255))  # Horizontal line
            draw.line([8, 3, 8, 13], fill=(120, 60, 0, 255))  # Vertical line
        elif shape == 'rectangle':
            # Chest/door rectangle
            draw.rectangle([2, 2, 14, 14], fill=color)
            draw.rectangle([4, 4, 12, 12], fill=(255, 255, 255, 64))
        elif shape == 'tree':
            # Tree shape
            draw.rectangle([6, 8, 10, 14], fill=(139, 69, 19, 255))  # Trunk
            draw.ellipse([2, 2, 14, 10], fill=color)  # Leaves
        elif shape == 'circle':
            # Bush circle
            draw.ellipse([2, 2, 14, 14], fill=color)
            draw.ellipse([4, 4, 12, 12], fill=(255, 255, 255, 64))
        elif shape == 'flower':
            # Flower shape
            draw.ellipse([6, 6, 10, 10], fill=color)
            draw.ellipse([7, 7, 9, 9], fill=(255, 255, 200, 255))
            draw.rectangle([7, 10, 9, 12], fill=(0, 128, 0, 255))  # Stem
        
        return sprite
    
    def _generate_pink_x(self, sprite_id: str) -> None:
        """Generate a Pink X placeholder for failed sprites"""
        try:
            sprite = Image.new((16, 16), (255, 192, 203, 255), "RGBA")
            draw = ImageDraw.Draw(sprite)
            
            # Draw pink X
            draw.line([2, 2, 14, 14], fill=(255, 0, 0, 255), width=3)
            draw.line([2, 14, 14, 2], fill=(255, 0, 0, 255), width=3)
            
            photo = ImageTk.PhotoImage(sprite)
            self.registry[sprite_id] = photo
            self._sprite_refs.append(photo)
            
            logger.warning(f"⚠️ Generated Pink X for {sprite_id}")
            
        except Exception as e:
            logger.error(f"💥 Failed to generate Pink X for {sprite_id}: {e}")
    
    def _generate_actor_sprites(self) -> None:
        """Generate actor sprites (Voyager, etc.)"""
        try:
            # Generate Voyager sprites
            voyager_sprites = {
                'voyager_idle': (0, 100, 255, 255),
                'voyager_walk': (0, 120, 255, 255),
                'voyager_combat': (0, 80, 255, 255),
            }
            
            for sprite_id, color in voyager_sprites.items():
                sprite = self._create_actor_sprite(color)
                photo = ImageTk.PhotoImage(sprite)
                self.registry[sprite_id] = photo
                self._sprite_refs.append(photo)
            
            logger.info(f"🎨 Generated {len(voyager_sprites)} actor sprites")
            
        except Exception as e:
            logger.error(f"💥 Actor sprite generation failed: {e}")
    
    def _create_actor_sprite(self, color: Tuple[int, int, int, int]) -> Image.Image:
        """Create a procedural actor sprite"""
        sprite = Image.new((16, 16), (255, 255, 255, 0), "RGBA")
        draw = ImageDraw.Draw(sprite)
        
        # Simple humanoid shape
        draw.ellipse([4, 2, 12, 8], fill=color)  # Head
        draw.rectangle([6, 8, 10, 14], fill=color)  # Body
        draw.rectangle([5, 10, 7, 12], fill=color)  # Left arm
        draw.rectangle([9, 10, 11, 12], fill=color)  # Right arm
        draw.rectangle([6, 14, 7, 16], fill=color)  # Left leg
        draw.rectangle([9, 14, 10, 16], fill=color)  # Right leg
        
        return sprite
    
    def _generate_tile_sprites(self) -> None:
        """Generate tile sprites"""
        try:
            # Generate basic tile sprites
            tile_colors = {
                'grass': (34, 139, 34, 255),
                'stone': (128, 128, 128, 255),
                'water': (0, 100, 200, 255),
                'dirt': (139, 90, 43, 255),
            }
            
            for tile_id, color in tile_colors.items():
                sprite = self._create_tile_sprite(color)
                photo = ImageTk.PhotoImage(sprite)
                self.registry[f"tile_{tile_id}"] = photo
                self._sprite_refs.append(photo)
            
            logger.info(f"🎨 Generated {len(tile_colors)} tile sprites")
            
        except Exception as e:
            logger.error(f"💥 Tile sprite generation failed: {e}")
    
    def _create_tile_sprite(self, color: Tuple[int, int, int, int]) -> Image.Image:
        """Create a procedural tile sprite"""
        sprite = Image.new((16, 16), color, "RGBA")
        return sprite
    
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
