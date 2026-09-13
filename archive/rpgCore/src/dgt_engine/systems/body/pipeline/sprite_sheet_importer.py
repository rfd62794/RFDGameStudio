"""
Sprite Sheet Import Logic - Extracted from Legacy Tool
Core asset processing logic without UI dependencies
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union
from PIL import Image
from dataclasses import dataclass
from loguru import logger


@dataclass
class SpriteData:
    """Data structure for sprite information"""
    name: str
    rect: Tuple[int, int, int, int]  # (x1, y1, x2, y2)
    size: Tuple[int, int]  # (width, height)
    image: Optional[Image.Image] = None
    file_path: Optional[str] = None


class SpriteSheetImporter:
    """Core sprite sheet processing logic - UI-independent"""
    
    def __init__(self):
        self.sheet_image: Optional[Image.Image] = None
        self.output_dir = Path("assets/imported_sprites")
        
        # Grid settings
        self.grid_width = 16
        self.grid_height = 16
        self.grid_offset_x = 0
        self.grid_offset_y = 0
        
        # Processed sprites
        self.cut_sprites: List[SpriteData] = []
        self.sprite_names: Dict[str, int] = {}  # name -> index
        
        logger.info("🎨 Sprite Sheet Importer initialized")
    
    def load_sprite_sheet(self, file_path: Union[str, Path]) -> bool:
        """Load a sprite sheet from file"""
        try:
            self.sheet_image = Image.open(file_path)
            logger.info(f"📄 Loaded sprite sheet: {file_path} ({self.sheet_image.size[0]}x{self.sheet_image.size[1]})")
            return True
        except Exception as e:
            logger.error(f"⚠️ Error loading sprite sheet: {e}")
            return False
    
    def set_grid_settings(self, width: int, height: int, offset_x: int = 0, offset_y: int = 0) -> None:
        """Set grid cutting parameters"""
        self.grid_width = width
        self.grid_height = height
        self.grid_offset_x = offset_x
        self.grid_offset_y = offset_y
        logger.debug(f"📐 Grid set to {width}x{height} with offset ({offset_x}, {offset_y})")
    
    def cut_sprite(self, x1: int, y1: int, x2: int, y2: int, name: Optional[str] = None) -> SpriteData:
        """Cut a specific rectangle from the sprite sheet"""
        if not self.sheet_image:
            raise ValueError("No sprite sheet loaded")
        
        # Ensure coordinates are within image bounds
        img_x1 = max(0, min(x1, self.sheet_image.size[0]))
        img_y1 = max(0, min(y1, self.sheet_image.size[1]))
        img_x2 = max(0, min(x2, self.sheet_image.size[0]))
        img_y2 = max(0, min(y2, self.sheet_image.size[1]))
        
        # Cut sprite
        sprite_image = self.sheet_image.crop((img_x1, img_y1, img_x2, img_y2))
        
        # Generate name if not provided
        if not name:
            name = f"sprite_{len(self.cut_sprites) + 1}"
        
        # Create sprite data
        sprite_data = SpriteData(
            name=name,
            rect=(img_x1, img_y1, img_x2, img_y2),
            size=(img_x2 - img_x1, img_y2 - img_y1),
            image=sprite_image
        )
        
        self.cut_sprites.append(sprite_data)
        self.sprite_names[name] = len(self.cut_sprites) - 1
        
        logger.info(f"✂️ Cut sprite: {name} at ({img_x1}, {img_y1})")
        return sprite_data
    
    def auto_cut_grid(self) -> List[SpriteData]:
        """Automatically cut sprites based on grid settings"""
        if not self.sheet_image:
            raise ValueError("No sprite sheet loaded")
        
        # Clear existing sprites
        self.cut_sprites.clear()
        self.sprite_names.clear()
        
        # Calculate grid dimensions
        cell_width = self.grid_width
        cell_height = self.grid_height
        offset_x = self.grid_offset_x
        offset_y = self.grid_offset_y
        
        # Calculate number of cells
        sheet_width, sheet_height = self.sheet_image.size
        cols = (sheet_width - offset_x) // cell_width
        rows = (sheet_height - offset_y) // cell_height
        
        sprites_cut = []
        
        # Cut each cell
        for row in range(rows):
            for col in range(cols):
                x1 = offset_x + col * cell_width
                y1 = offset_y + row * cell_height
                x2 = min(x1 + cell_width, sheet_width)
                y2 = min(y1 + cell_height, sheet_height)
                
                # Skip if cell is empty
                if x2 <= x1 or y2 <= y1:
                    continue
                
                sprite_name = f"sprite_{row}_{col}"
                sprite_data = self.cut_sprite(x1, y1, x2, y2, sprite_name)
                sprites_cut.append(sprite_data)
        
        logger.info(f"🍞 Auto-cut {len(sprites_cut)} sprites from grid")
        return sprites_cut
    
    def get_sprite_by_name(self, name: str) -> Optional[SpriteData]:
        """Get sprite data by name"""
        if name in self.sprite_names:
            index = self.sprite_names[name]
            return self.cut_sprites[index]
        return None
    
    def rename_sprite(self, old_name: str, new_name: str) -> bool:
        """Rename a sprite"""
        if old_name not in self.sprite_names:
            return False
        
        index = self.sprite_names[old_name]
        
        # Update sprite name
        self.cut_sprites[index].name = new_name
        
        # Update name mapping
        del self.sprite_names[old_name]
        self.sprite_names[new_name] = index
        
        logger.info(f"✏️ Renamed sprite: {old_name} -> {new_name}")
        return True
    
    def delete_sprite(self, name: str) -> bool:
        """Delete a sprite"""
        if name not in self.sprite_names:
            return False
        
        index = self.sprite_names[name]
        
        # Remove from storage
        del self.cut_sprites[index]
        del self.sprite_names[name]
        
        # Update name mapping indices
        for i, sprite in enumerate(self.cut_sprites):
            self.sprite_names[sprite.name] = i
        
        logger.info(f"🗑️ Deleted sprite: {name}")
        return True
    
    def clear_sprites(self) -> None:
        """Clear all sprites"""
        self.cut_sprites.clear()
        self.sprite_names.clear()
        logger.info("🗑️ Cleared all sprites")
    
    def save_configuration(self, file_path: Union[str, Path]) -> bool:
        """Save current configuration to JSON"""
        try:
            config = {
                'grid_width': self.grid_width,
                'grid_height': self.grid_height,
                'grid_offset_x': self.grid_offset_x,
                'grid_offset_y': self.grid_offset_y,
                'sprites': []
            }
            
            for sprite in self.cut_sprites:
                sprite_config = {
                    'name': sprite.name,
                    'rect': sprite.rect,
                    'size': sprite.size
                }
                config['sprites'].append(sprite_config)
            
            with open(file_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            logger.info(f"💾 Saved configuration: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"⚠️ Error saving configuration: {e}")
            return False
    
    def load_configuration(self, file_path: Union[str, Path]) -> bool:
        """Load configuration from JSON"""
        try:
            with open(file_path, 'r') as f:
                config = json.load(f)
            
            # Load grid settings
            self.grid_width = config.get('grid_width', 16)
            self.grid_height = config.get('grid_height', 16)
            self.grid_offset_x = config.get('grid_offset_x', 0)
            self.grid_offset_y = config.get('grid_offset_y', 0)
            
            # Load sprites (if sheet is loaded)
            if self.sheet_image and 'sprites' in config:
                self.cut_sprites.clear()
                self.sprite_names.clear()
                
                for sprite_config in config['sprites']:
                    x1, y1, x2, y2 = sprite_config['rect']
                    sprite_name = sprite_config['name']
                    
                    sprite_data = self.cut_sprite(x1, y1, x2, y2, sprite_name)
            
            logger.info(f"📂 Loaded configuration: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"⚠️ Error loading configuration: {e}")
            return False
    
    def export_sprites(self, output_dir: Union[str, Path]) -> bool:
        """Export cut sprites to files"""
        if not self.cut_sprites:
            logger.warning("No sprites to export")
            return False
        
        try:
            output_path = Path(output_dir)
            output_path.mkdir(exist_ok=True)
            
            # Export each sprite
            for sprite in self.cut_sprites:
                if sprite.image:
                    sprite_file = output_path / f"{sprite.name}.png"
                    sprite.image.save(sprite_file)
                    sprite.file_path = str(sprite_file)
            
            # Create metadata file
            metadata = {
                'total_sprites': len(self.cut_sprites),
                'grid_settings': {
                    'width': self.grid_width,
                    'height': self.grid_height,
                    'offset_x': self.grid_offset_x,
                    'offset_y': self.grid_offset_y
                },
                'sprites': []
            }
            
            for sprite in self.cut_sprites:
                metadata['sprites'].append({
                    'name': sprite.name,
                    'file': f"{sprite.name}.png",
                    'rect': sprite.rect,
                    'size': sprite.size
                })
            
            metadata_file = output_path / "sprites_metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"📤 Exported {len(self.cut_sprites)} sprites to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"⚠️ Error exporting sprites: {e}")
            return False
    
    def get_sprite_count(self) -> int:
        """Get number of processed sprites"""
        return len(self.cut_sprites)
    
    def get_sheet_info(self) -> Optional[Dict[str, int]]:
        """Get information about the loaded sprite sheet"""
        if not self.sheet_image:
            return None
        
        return {
            'width': self.sheet_image.size[0],
            'height': self.sheet_image.size[1],
            'total_pixels': self.sheet_image.size[0] * self.sheet_image.size[1]
        }
