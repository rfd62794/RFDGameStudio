"""
Tiny Farm Ingestor - ADR 107: Professional Asset Ingestion
Real Tiny Farm RPG asset processing with DGT DNA preservation
"""

import os
import numpy as np
from PIL import Image
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import tkinter as tk
from loguru import logger

from tools.asset_models import AssetType, MaterialType
from graphics.ppu_tk_native_enhanced import DitherPresets


class TinyFarmAssetCategory(Enum):
    """Tiny Farm asset categories based on directory structure"""
    CHARACTER = "Character"
    FARM_ANIMALS = "Farm Animals"
    OBJECTS = "Objects"
    TILESET = "Tileset"


@dataclass
class TinyFarmSprite:
    """Individual Tiny Farm sprite with metadata"""
    filename: str
    category: TinyFarmAssetCategory
    dgt_sprite_id: str
    material_type: MaterialType
    asset_type: AssetType
    dna_tags: List[str]
    dither_pattern: Optional[str] = None
    is_animated: bool = False
    frame_count: int = 1
    sprite_sheet: Optional[np.ndarray] = None


class TinyFarmIngestor:
    """
    Professional Tiny Farm asset ingestor
    
    Features:
    - Real PNG file loading and processing
    - Sprite sheet slicing for animations
    - DGT dithering and palette application
    - DNA tag assignment for systemic integration
    - Professional asset categorization
    """
    
    def __init__(self, assets_dir: str = "assets/tiny_farm"):
        self.assets_dir = assets_dir
        self.sprites: Dict[str, TinyFarmSprite] = {}
        self.processed_sprites: Dict[str, tk.PhotoImage] = {}
        
        # DGT color palette for locking
        self.dgt_palette = {
            "darkest": "#0f380f",   # Game Boy darkest green
            "dark": "#306230",      # Game Boy dark green  
            "light": "#8bac0f",     # Game Boy light green
            "lightest": "#9bbc0f",  # Game Boy lightest green
            "accent": "#ffd700",    # Gold for special items
            "stone": "#757575",     # Stone gray
            "wood": "#8b4513",      # Wood brown
            "metal": "#9e9e9e",     # Metal silver
            "organic": "#4b7845",    # Organic green
            "water": "#4682b4"      # Water blue
        }
        
        # Setup asset mappings
        self._setup_asset_mappings()
        
        logger.info("🚜 Tiny Farm Ingestor initialized")
    
    def _setup_asset_mappings(self) -> None:
        """Setup mappings from Tiny Farm files to DGT framework"""
        
        # Character mappings - Priority #1
        character_mappings = [
            TinyFarmSprite(
                filename="Idle.png",
                category=TinyFarmAssetCategory.CHARACTER,
                dgt_sprite_id="voyager_idle",
                material_type=MaterialType.ORGANIC,
                asset_type=AssetType.ACTOR,
                dna_tags=["Animated", "Player", "Controllable", "Idle"],
                is_animated=True,
                frame_count=4
            ),
            TinyFarmSprite(
                filename="Walk.png",
                category=TinyFarmAssetCategory.CHARACTER,
                dgt_sprite_id="voyager_walk",
                material_type=MaterialType.ORGANIC,
                asset_type=AssetType.ACTOR,
                dna_tags=["Animated", "Player", "Controllable", "Walking"],
                is_animated=True,
                frame_count=8
            )
        ]
        
        # Object mappings - Environment and interactive items
        object_mappings = [
            TinyFarmSprite(
                filename="Maple Tree.png",
                category=TinyFarmAssetCategory.OBJECTS,
                dgt_sprite_id="swaying_oak",
                material_type=MaterialType.ORGANIC,
                asset_type=AssetType.OBJECT,
                dna_tags=["Organic", "Sway", "Harvestable", "Tree"],
                dither_pattern="lush_green",
                is_animated=True
            ),
            TinyFarmSprite(
                filename="Fence's copiar.png",
                category=TinyFarmAssetCategory.OBJECTS,
                dgt_sprite_id="wood_fence",
                material_type=MaterialType.WOOD,
                asset_type=AssetType.OBJECT,
                dna_tags=["Wood", "Collision", "Barrier", "Destructible"],
                dither_pattern="wood_brown"
            ),
            TinyFarmSprite(
                filename="chest.png",
                category=TinyFarmAssetCategory.OBJECTS,
                dgt_sprite_id="iron_lockbox",
                material_type=MaterialType.METAL,
                asset_type=AssetType.OBJECT,
                dna_tags=["Metal", "Valuable", "Inventory", "Interactive"],
                dither_pattern="metal_silver"
            ),
            TinyFarmSprite(
                filename="House.png",
                category=TinyFarmAssetCategory.OBJECTS,
                dgt_sprite_id="house",
                material_type=MaterialType.WOOD,
                asset_type=AssetType.OBJECT,
                dna_tags=["Wood", "Building", "Shelter", "Decoration"],
                dither_pattern="wood_brown"
            ),
            TinyFarmSprite(
                filename="Spring Crops.png",
                category=TinyFarmAssetCategory.OBJECTS,
                dgt_sprite_id="crops",
                material_type=MaterialType.ORGANIC,
                asset_type=AssetType.OBJECT,
                dna_tags=["Organic", "Harvestable", "Food", "Decoration"],
                dither_pattern="lush_green",
                is_animated=True
            ),
            TinyFarmSprite(
                filename="Road copiar.png",
                category=TinyFarmAssetCategory.OBJECTS,
                dgt_sprite_id="dirt_path",
                material_type=MaterialType.STONE,
                asset_type=AssetType.OBJECT,
                dna_tags=["Stone", "Path", "Walkable", "Terrain"],
                dither_pattern="stone_gray"
            )
        ]
        
        # Tileset mappings - Ground tiles
        tileset_mappings = [
            TinyFarmSprite(
                filename="Tileset Spring.png",
                category=TinyFarmAssetCategory.TILESET,
                dgt_sprite_id="grass_tiles",
                material_type=MaterialType.ORGANIC,
                asset_type=AssetType.OBJECT,
                dna_tags=["Organic", "Terrain", "Walkable", "Ground"],
                dither_pattern="lush_green"
            )
        ]
        
        # Farm animal mappings - NPCs and creatures
        animal_mappings = [
            TinyFarmSprite(
                filename="Chicken Red.png",
                category=TinyFarmAssetCategory.FARM_ANIMALS,
                dgt_sprite_id="chicken",
                material_type=MaterialType.ORGANIC,
                asset_type=AssetType.ACTOR,
                dna_tags=["Organic", "Animal", "NPC", "Animated"],
                is_animated=True
            ),
            TinyFarmSprite(
                filename="Female Cow Brown.png",
                category=TinyFarmAssetCategory.FARM_ANIMALS,
                dgt_sprite_id="cow",
                material_type=MaterialType.ORGANIC,
                asset_type=AssetType.ACTOR,
                dna_tags=["Organic", "Animal", "NPC", "Large"],
                is_animated=True
            )
        ]
        
        # Combine all mappings
        all_mappings = character_mappings + object_mappings + tileset_mappings + animal_mappings
        
        for sprite in all_mappings:
            self.sprites[sprite.dgt_sprite_id] = sprite
        
        logger.info(f"📋 Setup {len(all_mappings)} Tiny Farm asset mappings")
    
    def load_and_process_assets(self) -> None:
        """Load and process all Tiny Farm assets"""
        logger.info("🔄 Loading and processing Tiny Farm assets...")
        
        processed_count = 0
        for sprite_id, sprite in self.sprites.items():
            if self._load_and_process_sprite(sprite):
                processed_count += 1
        
        logger.info(f"✅ Processed {processed_count}/{len(self.sprites)} Tiny Farm assets")
    
    def _load_and_process_sprite(self, sprite: TinyFarmSprite) -> bool:
        """Load and process individual sprite"""
        try:
            # Construct file path
            file_path = os.path.join(self.assets_dir, sprite.category.value, sprite.filename)
            
            if not os.path.exists(file_path):
                logger.warning(f"⚠️ Asset file not found: {file_path}")
                return False
            
            # Load image
            image = Image.open(file_path)
            sprite_array = np.array(image)
            
            # Store original sprite sheet
            sprite.sprite_sheet = sprite_array
            
            # Process sprite through DGT pipeline
            processed_sprite = self._process_sprite_through_dgt(sprite, sprite_array)
            
            if processed_sprite:
                self.processed_sprites[sprite.dgt_sprite_id] = processed_sprite
                logger.debug(f"✅ Processed Tiny Farm asset: {sprite.dgt_sprite_id}")
                return True
            else:
                logger.error(f"❌ Failed to process asset: {sprite.dgt_sprite_id}")
                return False
                
        except Exception as e:
            logger.error(f"⚠️ Error loading sprite {sprite.filename}: {e}")
            return False
    
    def _process_sprite_through_dgt(self, sprite: TinyFarmSprite, sprite_array: np.ndarray) -> Optional[tk.PhotoImage]:
        """Process sprite through DGT visual pipeline"""
        try:
            processed = sprite_array.copy()
            
            # Apply DGT visual treatments
            if sprite.dither_pattern:
                processed = self._apply_dither_matching(processed, sprite.dither_pattern)
            
            # Apply palette locking
            processed = self._apply_palette_locking(processed)
            
            # Handle sprite sheets (animations)
            if sprite.is_animated and sprite.frame_count > 1:
                processed = self._slice_sprite_sheet(processed, sprite.frame_count)
            
            # Convert to tkinter
            tk_sprite = self._numpy_to_tkinter(processed)
            
            return tk_sprite
            
        except Exception as e:
            logger.error(f"⚠️ Error processing sprite {sprite.dgt_sprite_id}: {e}")
            return None
    
    def _slice_sprite_sheet(self, sprite_array: np.ndarray, frame_count: int) -> np.ndarray:
        """Slice sprite sheet into individual frames (use first frame for now)"""
        try:
            height, width = sprite_array.shape[:2]
            
            if frame_count > 1:
                # Assume horizontal sprite sheet
                frame_width = width // frame_count
                first_frame = sprite_array[:, :frame_width]
                return first_frame
            else:
                return sprite_array
                
        except Exception as e:
            logger.error(f"⚠️ Error slicing sprite sheet: {e}")
            return sprite_array
    
    def _apply_dither_matching(self, sprite_array: np.ndarray, pattern_name: str) -> np.ndarray:
        """Apply DGT dither pattern to maintain Sonic aesthetic"""
        try:
            # Get dither pattern
            if pattern_name == "lush_green":
                pattern = DitherPresets.get_lush_green()
            elif pattern_name == "wood_brown":
                pattern = DitherPresets.get_wood_brown()
            elif pattern_name == "stone_gray":
                pattern = DitherPresets.get_stone_gray()
            elif pattern_name == "metal_silver":
                pattern = DitherPresets.get_metal_silver()
            else:
                return sprite_array
            
            # Apply subtle dithering for professional look
            height, width = sprite_array.shape[:2]
            dithered = sprite_array.copy()
            
            # Apply dithering with reduced intensity for professional assets
            for y in range(0, height, 8):  # Larger dither blocks for subtle effect
                for x in range(0, width, 8):
                    if np.random.random() < 0.3:  # 30% dither coverage
                        dither_color = pattern.get_color_for_position(x, y)
                        rgb_color = self._hex_to_rgb(dither_color)
                        
                        # Apply to 8x8 block with transparency
                        block_y_end = min(y + 8, height)
                        block_x_end = min(x + 8, width)
                        
                        # Blend with original
                        original = dithered[y:block_y_end, x:block_x_end]
                        dithered[y:block_y_end, x:block_x_end] = (
                            original * 0.7 + np.array(rgb_color) * 0.3
                        ).astype(np.uint8)
            
            return dithered
            
        except Exception as e:
            logger.error(f"⚠️ Error applying dither pattern {pattern_name}: {e}")
            return sprite_array
    
    def _apply_palette_locking(self, sprite_array: np.ndarray) -> np.ndarray:
        """Lock colors to DGT's palette while preserving professional look"""
        try:
            # Create color mapping with higher tolerance for professional assets
            palette_colors = list(self.dgt_palette.values())
            color_map = {}
            
            # Sample colors from sprite (reduce for performance)
            height, width = sprite_array.shape[:2]
            sample_step = max(1, min(height, width) // 100)  # Sample up to 100 colors
            
            for y in range(0, height, sample_step):
                for x in range(0, width, sample_step):
                    color = tuple(sprite_array[y, x])
                    if color not in color_map:
                        nearest_color = self._find_nearest_color(color, palette_colors)
                        color_map[color] = nearest_color
            
            # Apply color mapping
            locked = sprite_array.copy()
            
            for y in range(height):
                for x in range(width):
                    original_color = tuple(sprite_array[y, x])
                    if original_color in color_map:
                        locked[y, x] = self._hex_to_rgb(color_map[original_color])
            
            return locked
            
        except Exception as e:
            logger.error(f"⚠️ Error applying palette locking: {e}")
            return sprite_array
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _find_nearest_color(self, color: np.ndarray, palette: List[str]) -> str:
        """Find nearest palette color with higher tolerance for professional assets"""
        target_rgb = tuple(color)
        
        min_distance = float('inf')
        nearest_color = palette[0]
        
        for palette_color in palette:
            palette_rgb = self._hex_to_rgb(palette_color)
            
            # Calculate weighted distance (give more weight to luminance)
            distance = (
                2 * (target_rgb[0] - palette_rgb[0]) ** 2 +  # Red (less weight)
                4 * (target_rgb[1] - palette_rgb[1]) ** 2 +  # Green (more weight for human perception)
                3 * (target_rgb[2] - palette_rgb[2]) ** 2    # Blue (medium weight)
            )
            
            if distance < min_distance * 1.5:  # Higher tolerance
                min_distance = distance
                nearest_color = palette_color
        
        return nearest_color
    
    def _numpy_to_tkinter(self, sprite_array: np.ndarray, scale: int = 4) -> tk.PhotoImage:
        """Convert numpy array to tkinter PhotoImage"""
        try:
            height, width = sprite_array.shape[:2]
            
            # Create tkinter PhotoImage
            photo = tk.PhotoImage(width=width, height=height)
            
            # Put pixels
            for y in range(height):
                for x in range(width):
                    if len(sprite_array.shape) == 3:  # RGB
                        r, g, b = sprite_array[y, x]
                        hex_color = f"#{r:02x}{g:02x}{b:02x}"
                    else:  # Grayscale
                        gray = sprite_array[y, x]
                        hex_color = f"#{gray:02x}{gray:02x}{gray:02x}"
                    
                    photo.put(hex_color, (x, y))
            
            # Scale for display
            if scale > 1:
                photo = photo.zoom(scale, scale)
            
            return photo
            
        except Exception as e:
            logger.error(f"⚠️ Error converting numpy to tkinter: {e}")
            return None
    
    def get_processed_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get processed sprite by DGT sprite ID"""
        return self.processed_sprites.get(sprite_id)
    
    def get_sprite_info(self, sprite_id: str) -> Optional[TinyFarmSprite]:
        """Get sprite metadata by ID"""
        return self.sprites.get(sprite_id)
    
    def get_all_processed_sprites(self) -> Dict[str, tk.PhotoImage]:
        """Get all processed sprites"""
        return self.processed_sprites.copy()
    
    def get_ingestion_stats(self) -> Dict:
        """Get ingestion statistics"""
        category_counts = {}
        material_counts = {}
        
        for sprite in self.sprites.values():
            # Count by category
            category = sprite.category.value
            category_counts[category] = category_counts.get(category, 0) + 1
            
            # Count by material
            material = sprite.material_type.value
            material_counts[material] = material_counts.get(material, 0) + 1
        
        return {
            'total_mappings': len(self.sprites),
            'processed_sprites': len(self.processed_sprites),
            'categories': category_counts,
            'materials': material_counts,
            'animated_sprites': len([s for s in self.sprites.values() if s.is_animated])
        }


# Factory function
def create_tiny_farm_ingestor(assets_dir: str = "assets/tiny_farm") -> TinyFarmIngestor:
    """Create Tiny Farm ingestor system"""
    ingestor = TinyFarmIngestor(assets_dir)
    ingestor.load_and_process_assets()
    return ingestor


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test Tiny Farm ingestor
    root = tk.Tk()
    root.title("Tiny Farm Ingestor Test")
    root.geometry("800x600")
    root.configure(bg='#1a1a1a')
    
    # Create ingestor
    ingestor = create_tiny_farm_ingestor()
    
    # Display stats
    stats = ingestor.get_ingestion_stats()
    print(f"🚜 Tiny Farm Ingestion Stats: {stats}")
    
    # Create canvas for testing
    canvas = tk.Canvas(root, width=800, height=400, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Display processed sprites
    x_offset = 0
    y_offset = 0
    
    for sprite_id, sprite in ingestor.processed_sprites.items():
        if sprite:
            canvas.create_image(x_offset, y_offset, image=sprite, anchor='nw')
            
            # Show sprite info
            info = ingestor.get_sprite_info(sprite_id)
            if info:
                info_text = f"{sprite_id} ({info.category.value})"
                canvas.create_text(x_offset + 32, y_offset - 5, text=info_text, 
                                 fill='#00ff00', font=('Arial', 8), anchor='nw')
            
            x_offset += 120
            if x_offset >= 760:
                x_offset = 0
                y_offset += 80
    
    # Stats display
    stats_text = f"Processed: {stats['processed_sprites']}/{stats['total_mappings']} assets"
    stats_label = tk.Label(root, text=stats_text, bg='#1a1a1a', fg='#00ff00')
    stats_label.pack()
    
    print("🚜 Tiny Farm Ingestor Test running - Close window to exit")
    root.mainloop()
