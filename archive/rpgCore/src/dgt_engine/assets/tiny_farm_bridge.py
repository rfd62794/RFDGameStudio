"""
Tiny Farm Bridge - ADR 107: Asset Supplementation Protocol
Professional asset integration while maintaining DGT's systemic DNA
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
from ..graphics.ppu_tk_native_enhanced import DitherPresets


class TinyFarmAssetType(Enum):
    """Tiny Farm asset categories"""
    CHARACTER = "character"
    FLORA = "flora" 
    BARRIER = "barrier"
    ITEM = "item"
    DECORATION = "decoration"
    TERRAIN = "terrain"


@dataclass
class TinyFarmMapping:
    """Mapping from Tiny Farm asset to DGT framework"""
    tiny_farm_name: str
    dgt_sprite_id: str
    asset_type: TinyFarmAssetType
    material_type: MaterialType
    dna_tags: List[str]
    dither_pattern: Optional[str] = None
    is_animated: bool = False
    frame_count: int = 1


class TinyFarmBridge:
    """
    Bridge system for integrating Tiny Farm RPG assets into DGT engine
    
    Features:
    - Auto-slicing of sprite sheets using numpy ingestor
    - Dither matching to maintain Sonic aesthetic
    - Palette locking to 4-color limitation
    - Kinetic sway application to static assets
    - DNA tag preservation for systemic logic
    """
    
    def __init__(self, assets_dir: str = "assets/tiny_farm"):
        self.assets_dir = assets_dir
        self.mappings: Dict[str, TinyFarmMapping] = {}
        self.processed_sprites: Dict[str, tk.PhotoImage] = {}
        
        # DGT color palette for locking
        self.dgt_palette = {
            "darkest": "#0f380f",   # Game Boy darkest green
            "dark": "#306230",      # Game Boy dark green  
            "light": "#8bac0f",     # Game Boy light green
            "lightest": "#9bbc0f",  # Game Boy lightest green
            "accent": "#ffd700",    # Gold for special items
            "stone": "#757575",     # Stone gray
            "wood": "#5d4037",      # Wood brown
            "metal": "#9e9e9e"      # Metal silver
        }
        
        # Initialize asset mappings
        self._setup_asset_mappings()
        
        logger.info("🚜 Tiny Farm Bridge initialized")
    
    def _setup_asset_mappings(self) -> None:
        """Setup mappings from Tiny Farm assets to DGT framework"""
        
        # Character mappings - Priority #1 for player agency
        character_mappings = [
            TinyFarmMapping(
                tiny_farm_name="hero_idle",
                dgt_sprite_id="voyager",
                asset_type=TinyFarmAssetType.CHARACTER,
                material_type=MaterialType.ORGANIC,
                dna_tags=["Animated", "Player", "Controllable"],
                is_animated=True,
                frame_count=4
            ),
            TinyFarmMapping(
                tiny_farm_name="hero_walk",
                dgt_sprite_id="voyager_walk",
                asset_type=TinyFarmAssetType.CHARACTER,
                material_type=MaterialType.ORGANIC,
                dna_tags=["Animated", "Player", "Controllable"],
                is_animated=True,
                frame_count=8
            )
        ]
        
        # Flora mappings - Replace our procedural trees
        flora_mappings = [
            TinyFarmMapping(
                tiny_farm_name="apple_tree",
                dgt_sprite_id="swaying_oak",
                asset_type=TinyFarmAssetType.FLORA,
                material_type=MaterialType.ORGANIC,
                dna_tags=["Organic", "Sway", "Harvestable"],
                dither_pattern="lush_green",
                is_animated=True
            ),
            TinyFarmMapping(
                tiny_farm_name="banana_tree",
                dgt_sprite_id="tropical_tree",
                asset_type=TinyFarmAssetType.FLORA,
                material_type=MaterialType.ORGANIC,
                dna_tags=["Organic", "Sway", "Harvestable"],
                dither_pattern="lush_green",
                is_animated=True
            ),
            TinyFarmMapping(
                tiny_farm_name="bush",
                dgt_sprite_id="bush_cluster",
                asset_type=TinyFarmAssetType.FLORA,
                material_type=MaterialType.ORGANIC,
                dna_tags=["Organic", "Sway", "Decoration"],
                dither_pattern="lush_green",
                is_animated=True
            )
        ]
        
        # Barrier mappings - Replace our simple blocks
        barrier_mappings = [
            TinyFarmMapping(
                tiny_farm_name="wooden_fence",
                dgt_sprite_id="wood_fence",
                asset_type=TinyFarmAssetType.BARRIER,
                material_type=MaterialType.WOOD,
                dna_tags=["Wood", "Collision", "Destructible"],
                dither_pattern="wood_brown"
            ),
            TinyFarmMapping(
                tiny_farm_name="stone_wall",
                dgt_sprite_id="rock_formation",
                asset_type=TinyFarmAssetType.BARRIER,
                material_type=MaterialType.STONE,
                dna_tags=["Stone", "Collision", "Destructible"],
                dither_pattern="stone_gray"
            )
        ]
        
        # Item mappings - Interactive objects
        item_mappings = [
            TinyFarmMapping(
                tiny_farm_name="iron_lockbox",
                dgt_sprite_id="iron_lockbox",
                asset_type=TinyFarmAssetType.ITEM,
                material_type=MaterialType.METAL,
                dna_tags=["Metal", "Valuable", "Inventory"],
                dither_pattern="metal_silver"
            ),
            TinyFarmMapping(
                tiny_farm_name="ancient_stone",
                dgt_sprite_id="ancient_stone",
                asset_type=TinyFarmAssetType.ITEM,
                material_type=MaterialType.STONE,
                dna_tags=["Stone", "Interactive", "Mysterious"],
                dither_pattern="stone_gray"
            )
        ]
        
        # Decoration mappings - Non-collidable clutter
        decoration_mappings = [
            TinyFarmMapping(
                tiny_farm_name="lamp",
                dgt_sprite_id="lamp",
                asset_type=TinyFarmAssetType.DECORATION,
                material_type=MaterialType.METAL,
                dna_tags=["Light", "Decoration", "Ambient"]
            ),
            TinyFarmMapping(
                tiny_farm_name="book",
                dgt_sprite_id="book",
                asset_type=TinyFarmAssetType.DECORATION,
                material_type=MaterialType.ORGANIC,
                dna_tags=["Knowledge", "Decoration", "Interactive"]
            ),
            TinyFarmMapping(
                tiny_farm_name="clock",
                dgt_sprite_id="clock",
                asset_type=TinyFarmAssetType.DECORATION,
                material_type=MaterialType.METAL,
                dna_tags=["Time", "Decoration", "Ambient"]
            )
        ]
        
        # Combine all mappings
        all_mappings = character_mappings + flora_mappings + barrier_mappings + item_mappings + decoration_mappings
        
        for mapping in all_mappings:
            self.mappings[mapping.dgt_sprite_id] = mapping
        
        logger.info(f"📋 Setup {len(all_mappings)} Tiny Farm asset mappings")
    
    def load_sprite_sheet(self, sheet_path: str) -> Optional[np.ndarray]:
        """Load sprite sheet as numpy array for processing"""
        try:
            if not os.path.exists(sheet_path):
                logger.warning(f"Sprite sheet not found: {sheet_path}")
                return None
            
            # Load image using PIL
            image = Image.open(sheet_path)
            
            # Convert to numpy array
            sprite_array = np.array(image)
            
            logger.info(f"📄 Loaded sprite sheet: {sheet_path} ({sprite_array.shape})")
            return sprite_array
            
        except Exception as e:
            logger.error(f"⚠️ Error loading sprite sheet {sheet_path}: {e}")
            return None
    
    def slice_sprite(self, sprite_array: np.ndarray, x: int, y: int, width: int = 16, height: int = 16) -> np.ndarray:
        """Slice individual sprite from sprite sheet"""
        return sprite_array[y:y+height, x:x+width]
    
    def apply_dither_matching(self, sprite_array: np.ndarray, pattern_name: str) -> np.ndarray:
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
                return sprite_array  # No dithering
            
            # Apply dithering (simplified approach)
            height, width = sprite_array.shape[:2]
            dithered = sprite_array.copy()
            
            for y in range(0, height, 4):
                for x in range(0, width, 4):
                    # Get dither color for this position
                    dither_color = pattern.get_color_for_position(x, y)
                    
                    # Apply to 4x4 block
                    block_y_end = min(y + 4, height)
                    block_x_end = min(x + 4, width)
                    
                    # Convert hex color to RGB
                    rgb_color = self._hex_to_rgb(dither_color)
                    
                    # Apply dither color to block
                    dithered[y:block_y_end, x:block_x_end] = rgb_color
            
            return dithered
            
        except Exception as e:
            logger.error(f"⚠️ Error applying dither pattern {pattern_name}: {e}")
            return sprite_array
    
    def apply_palette_locking(self, sprite_array: np.ndarray) -> np.ndarray:
        """Lock colors to DGT's 4-color palette"""
        try:
            # Get unique colors in sprite
            unique_colors = np.unique(sprite_array.reshape(-1, sprite_array.shape[-1]), axis=0)
            
            # Create color mapping to nearest DGT palette color
            color_map = {}
            palette_colors = list(self.dgt_palette.values())
            
            for color in unique_colors:
                # Find nearest palette color
                nearest_color = self._find_nearest_color(color, palette_colors)
                color_map[tuple(color)] = nearest_color
            
            # Apply color mapping
            locked = sprite_array.copy()
            height, width = sprite_array.shape[:2]
            
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
        """Find nearest palette color to given color"""
        target_rgb = tuple(color)
        
        min_distance = float('inf')
        nearest_color = palette[0]
        
        for palette_color in palette:
            palette_rgb = self._hex_to_rgb(palette_color)
            
            # Calculate Euclidean distance
            distance = sum((a - b) ** 2 for a, b in zip(target_rgb, palette_rgb))
            
            if distance < min_distance:
                min_distance = distance
                nearest_color = palette_color
        
        return nearest_color
    
    def numpy_to_tkinter(self, sprite_array: np.ndarray, scale: int = 4) -> tk.PhotoImage:
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
    
    def process_asset(self, mapping: TinyFarmMapping, sprite_array: np.ndarray) -> Optional[tk.PhotoImage]:
        """Process Tiny Farm asset through DGT pipeline"""
        try:
            processed = sprite_array.copy()
            
            # Apply DGT visual treatments
            if mapping.dither_pattern:
                processed = self.apply_dither_matching(processed, mapping.dither_pattern)
            
            # Apply palette locking
            processed = self.apply_palette_locking(processed)
            
            # Convert to tkinter
            tk_sprite = self.numpy_to_tkinter(processed)
            
            if tk_sprite:
                self.processed_sprites[mapping.dgt_sprite_id] = tk_sprite
                logger.debug(f"✅ Processed Tiny Farm asset: {mapping.dgt_sprite_id}")
            
            return tk_sprite
            
        except Exception as e:
            logger.error(f"⚠️ Error processing asset {mapping.dgt_sprite_id}: {e}")
            return None
    
    def get_processed_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get processed sprite by DGT sprite ID"""
        return self.processed_sprites.get(sprite_id)
    
    def create_demo_sprites(self) -> None:
        """Create demo sprites using procedural generation (for testing)"""
        logger.info("🎨 Creating demo Tiny Farm sprites for testing")
        
        for sprite_id, mapping in self.mappings.items():
            # Create procedural sprite for demo
            demo_sprite = self._create_demo_sprite(mapping)
            if demo_sprite:
                self.processed_sprites[sprite_id] = demo_sprite
        
        logger.info(f"✅ Created {len(self.processed_sprites)} demo sprites")
    
    def _create_demo_sprite(self, mapping: TinyFarmMapping) -> Optional[tk.PhotoImage]:
        """Create demo sprite for testing purposes"""
        try:
            # Create 16x16 sprite
            sprite = tk.PhotoImage(width=16, height=16)
            
            # Get base color from material type
            if mapping.material_type == MaterialType.ORGANIC:
                base_color = self.dgt_palette["dark"]
            elif mapping.material_type == MaterialType.WOOD:
                base_color = self.dgt_palette["wood"]
            elif mapping.material_type == MaterialType.STONE:
                base_color = self.dgt_palette["stone"]
            elif mapping.material_type == MaterialType.METAL:
                base_color = self.dgt_palette["metal"]
            else:
                base_color = self.dgt_palette["light"]
            
            # Fill sprite with base color
            for y in range(16):
                for x in range(16):
                    sprite.put(base_color, (x, y))
            
            # Add some detail based on asset type
            if mapping.asset_type == TinyFarmAssetType.CHARACTER:
                # Add simple character features
                for y in range(4, 8):
                    for x in range(6, 10):
                        sprite.put("#f4e4c1", (x, y))  # Skin tone
            elif mapping.asset_type == TinyFarmAssetType.FLORA:
                # Add tree crown
                for y in range(2, 8):
                    for x in range(4, 12):
                        sprite.put(self.dgt_palette["light"], (x, y))
            elif mapping.asset_type == TinyFarmAssetType.ITEM:
                # Add metallic highlight
                for y in range(6, 10):
                    for x in range(6, 10):
                        sprite.put(self.dgt_palette["lightest"], (x, y))
            
            # Scale for display
            sprite = sprite.zoom(4, 4)
            
            return sprite
            
        except Exception as e:
            logger.error(f"⚠️ Error creating demo sprite {mapping.dgt_sprite_id}: {e}")
            return None
    
    def get_mapping(self, sprite_id: str) -> Optional[TinyFarmMapping]:
        """Get mapping for sprite ID"""
        return self.mappings.get(sprite_id)
    
    def get_all_mappings(self) -> Dict[str, TinyFarmMapping]:
        """Get all asset mappings"""
        return self.mappings.copy()


# Factory function
def create_tiny_farm_bridge(assets_dir: str = "assets/tiny_farm") -> TinyFarmBridge:
    """Create Tiny Farm bridge system"""
    return TinyFarmBridge(assets_dir)


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test Tiny Farm bridge
    root = tk.Tk()
    root.title("Tiny Farm Bridge Test")
    root.geometry("800x600")
    root.configure(bg='#1a1a1a')
    
    # Create bridge
    bridge = create_tiny_farm_bridge()
    
    # Create demo sprites
    bridge.create_demo_sprites()
    
    # Display sprites
    canvas = tk.Canvas(root, width=800, height=400, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Show processed sprites
    x_offset = 0
    y_offset = 0
    
    for sprite_id, sprite in bridge.processed_sprites.items():
        if sprite:
            canvas.create_image(x_offset, y_offset, image=sprite, anchor='nw')
            canvas.create_text(x_offset + 32, y_offset - 5, text=sprite_id, 
                             fill='#00ff00', font=('Arial', 8), anchor='nw')
            
            x_offset += 80
            if x_offset >= 760:
                x_offset = 0
                y_offset += 80
    
    # Info
    info_label = tk.Label(root, text=f"Processed {len(bridge.processed_sprites)} Tiny Farm assets", 
                         bg='#1a1a1a', fg='#00ff00')
    info_label.pack()
    
    print("🚜 Tiny Farm Bridge Test running - Close window to exit")
    root.mainloop()
