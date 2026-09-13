"""
Tiny Farm Processor - ADR 107: Professional Asset Integration using DGT Tools
Leverages existing image processing and asset ingestor tools for professional results
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from loguru import logger

# Add to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from tools.asset_models import (
    HarvestedAsset, AssetMetadata, AssetType, MaterialType, 
    SpriteSlice, GridConfiguration
)
from tools.image_processor import ImageProcessor, ImageProcessingError
from tools.optimized_image_processor import OptimizedImageProcessor


@dataclass
class TinyFarmAssetConfig:
    """Configuration for Tiny Farm asset processing"""
    filename: str
    dgt_sprite_id: str
    asset_type: AssetType
    material_type: MaterialType
    grid_x: int
    grid_y: int
    description: str
    tags: List[str]
    is_animated: bool = False
    frame_count: int = 1


class TinyFarmProcessor:
    """
    Professional Tiny Farm asset processor using DGT's existing tools
    
    Features:
    - Uses existing ImageProcessor for professional asset handling
    - Leverages OptimizedImageProcessor for performance
    - Creates proper HarvestedAsset objects with DGT DNA
    - Integrates with existing asset pipeline
    """
    
    def __init__(self, tiny_farm_dir: str = "assets/tiny_farm"):
        self.tiny_farm_dir = Path(tiny_farm_dir)
        self.image_processor = ImageProcessor()
        self.optimized_processor = OptimizedImageProcessor(enable_profiling=True)
        
        self.processed_assets: Dict[str, HarvestedAsset] = {}
        
        # Setup asset configurations
        self._setup_asset_configs()
        
        logger.info("🚜 Tiny Farm Processor initialized with DGT tools")
    
    def _setup_asset_configs(self) -> None:
        """Setup configurations for all Tiny Farm assets"""
        self.asset_configs = [
            # Character assets - Priority #1
            TinyFarmAssetConfig(
                filename="Character/Idle.png",
                dgt_sprite_id="voyager_idle",
                asset_type=AssetType.ACTOR,
                material_type=MaterialType.ORGANIC,
                grid_x=0, grid_y=0,
                description="Professional hero character - Idle animation",
                tags=["Animated", "Player", "Controllable", "Idle"],
                is_animated=True,
                frame_count=4
            ),
            TinyFarmAssetConfig(
                filename="Character/Walk.png",
                dgt_sprite_id="voyager_walk",
                asset_type=AssetType.ACTOR,
                material_type=MaterialType.ORGANIC,
                grid_x=1, grid_y=0,
                description="Professional hero character - Walk animation",
                tags=["Animated", "Player", "Controllable", "Walking"],
                is_animated=True,
                frame_count=8
            ),
            
            # Environment assets
            TinyFarmAssetConfig(
                filename="Objects/Maple Tree.png",
                dgt_sprite_id="swaying_oak",
                asset_type=AssetType.OBJECT,
                material_type=MaterialType.ORGANIC,
                grid_x=2, grid_y=0,
                description="Professional maple tree with detailed foliage",
                tags=["Organic", "Sway", "Harvestable", "Tree"],
                is_animated=True
            ),
            TinyFarmAssetConfig(
                filename="Objects/Fence's copiar.png",
                dgt_sprite_id="wood_fence",
                asset_type=AssetType.OBJECT,
                material_type=MaterialType.WOOD,
                grid_x=3, grid_y=0,
                description="Professional wooden fence barrier",
                tags=["Wood", "Collision", "Barrier", "Destructible"]
            ),
            TinyFarmAssetConfig(
                filename="Objects/chest.png",
                dgt_sprite_id="iron_lockbox",
                asset_type=AssetType.OBJECT,
                material_type=MaterialType.METAL,
                grid_x=4, grid_y=0,
                description="Professional treasure chest with intricate details",
                tags=["Metal", "Valuable", "Inventory", "Interactive"]
            ),
            TinyFarmAssetConfig(
                filename="Objects/House.png",
                dgt_sprite_id="house",
                asset_type=AssetType.OBJECT,
                material_type=MaterialType.WOOD,
                grid_x=5, grid_y=0,
                description="Professional farm house building",
                tags=["Wood", "Building", "Shelter", "Decoration"]
            ),
            TinyFarmAssetConfig(
                filename="Objects/Spring Crops.png",
                dgt_sprite_id="crops",
                asset_type=AssetType.OBJECT,
                material_type=MaterialType.ORGANIC,
                grid_x=6, grid_y=0,
                description="Professional spring crops with growth stages",
                tags=["Organic", "Harvestable", "Food", "Decoration"],
                is_animated=True
            ),
            TinyFarmAssetConfig(
                filename="Objects/Road copiar.png",
                dgt_sprite_id="dirt_path",
                asset_type=AssetType.OBJECT,
                material_type=MaterialType.STONE,
                grid_x=7, grid_y=0,
                description="Professional dirt path texture",
                tags=["Stone", "Path", "Walkable", "Terrain"]
            ),
            
            # Tileset assets
            TinyFarmAssetConfig(
                filename="Tileset/Tileset Spring.png",
                dgt_sprite_id="grass_tiles",
                asset_type=AssetType.OBJECT,
                material_type=MaterialType.ORGANIC,
                grid_x=8, grid_y=0,
                description="Professional spring grass tileset",
                tags=["Organic", "Terrain", "Walkable", "Ground"]
            ),
            
            # Farm animal assets
            TinyFarmAssetConfig(
                filename="Farm Animals/Chicken Red.png",
                dgt_sprite_id="chicken",
                asset_type=AssetType.ACTOR,
                material_type=MaterialType.ORGANIC,
                grid_x=9, grid_y=0,
                description="Professional farm chicken - red variety",
                tags=["Organic", "Animal", "NPC", "Animated"],
                is_animated=True
            ),
            TinyFarmAssetConfig(
                filename="Farm Animals/Female Cow Brown.png",
                dgt_sprite_id="cow",
                asset_type=AssetType.ACTOR,
                material_type=MaterialType.ORGANIC,
                grid_x=10, grid_y=0,
                description="Professional female cow - brown variety",
                tags=["Organic", "Animal", "NPC", "Large"]
            )
        ]
        
        logger.info(f"📋 Setup {len(self.asset_configs)} Tiny Farm asset configurations")
    
    def process_all_assets(self) -> None:
        """Process all Tiny Farm assets using DGT tools"""
        logger.info("🔄 Processing Tiny Farm assets with DGT tools...")
        
        processed_count = 0
        for config in self.asset_configs:
            if self._process_single_asset(config):
                processed_count += 1
        
        logger.info(f"✅ Processed {processed_count}/{len(self.asset_configs)} Tiny Farm assets")
    
    def _process_single_asset(self, config: TinyFarmAssetConfig) -> bool:
        """Process single Tiny Farm asset using DGT pipeline"""
        try:
            # Construct file path
            file_path = self.tiny_farm_dir / config.filename
            
            if not file_path.exists():
                logger.warning(f"⚠️ Asset file not found: {file_path}")
                return False
            
            # Load image using DGT's ImageProcessor
            image = self.image_processor.load_image(file_path)
            
            # Create sprite slice
            sprite_slice = self._create_sprite_slice(config, image)
            
            # Create metadata with DGT DNA
            metadata = self._create_asset_metadata(config)
            
            # Create harvested asset
            harvested_asset = HarvestedAsset(
                sprite_slice=sprite_slice,
                metadata=metadata
            )
            
            # Store processed asset
            self.processed_assets[config.dgt_sprite_id] = harvested_asset
            
            logger.debug(f"✅ Processed Tiny Farm asset: {config.dgt_sprite_id}")
            return True
            
        except Exception as e:
            logger.error(f"⚠️ Error processing asset {config.filename}: {e}")
            return False
    
    def _create_sprite_slice(self, config: TinyFarmAssetConfig, image: 'Image.Image') -> SpriteSlice:
        """Create sprite slice using DGT's grid system"""
        try:
            # Get image dimensions
            width, height = image.size
            
            # Calculate sprite size (16x16 standard)
            sprite_width = 16
            sprite_height = 16
            
            # Calculate pixel position in sprite sheet
            pixel_x = config.grid_x * sprite_width
            pixel_y = config.grid_y * sprite_height
            
            # Handle sprite sheets (animations)
            if config.is_animated and config.frame_count > 1:
                # Assume horizontal sprite sheet
                total_width = width
                sprite_width = total_width // config.frame_count
                pixel_x = 0  # Start from beginning of sheet
            
            # Create palette based on material type
            palette = self._create_material_palette(config.material_type)
            
            return SpriteSlice(
                sheet_name="tiny_farm_assets",
                grid_x=config.grid_x,
                grid_y=config.grid_y,
                pixel_x=pixel_x,
                pixel_y=pixel_y,
                width=sprite_width,
                height=sprite_height,
                asset_id=config.dgt_sprite_id,
                palette=palette
            )
            
        except Exception as e:
            logger.error(f"⚠️ Error creating sprite slice for {config.dgt_sprite_id}: {e}")
            # Fallback sprite slice
            return SpriteSlice(
                sheet_name="tiny_farm_assets",
                grid_x=config.grid_x,
                grid_y=config.grid_y,
                pixel_x=0,
                pixel_y=0,
                width=16,
                height=16,
                asset_id=config.dgt_sprite_id,
                palette=["#00ff00", "#00aa00", "#006600", "#003300"]
            )
    
    def _create_material_palette(self, material_type: MaterialType) -> List[str]:
        """Create DGT-compatible palette for material type"""
        # Handle string material types as well
        if isinstance(material_type, str):
            material_str = material_type.lower()
        else:
            material_str = material_type.value.lower() if hasattr(material_type, 'value') else str(material_type).lower()
        
        palettes = {
            "organic": ["#4b7845", "#3a6b35", "#2d5a27", "#1a4d1a"],
            "wood": ["#8b4513", "#6b3410", "#5d2f0d", "#4a2408"],
            "stone": ["#8b8680", "#757575", "#696969", "#5a5a5a"],
            "metal": ["#c0c0c0", "#a9a9a9", "#808080", "#696969"],
            "water": ["#4682b4", "#5f9ea0", "#87ceeb", "#b0e0e6"],
            "fire": ["#ff6347", "#ff4500", "#ff8c00", "#ffa500"],
            "crystal": ["#9370db", "#8a2be2", "#9932cc", "#ba55d3"],
            "void": ["#1a1a2e", "#16213e", "#0f3460", "#533483"]
        }
        
        return palettes.get(material_str, palettes["organic"])
    
    def _create_asset_metadata(self, config: TinyFarmAssetConfig) -> AssetMetadata:
        """Create asset metadata with DGT DNA tags"""
        # Add animation tag if applicable
        tags = config.tags.copy()
        if config.is_animated:
            tags.append("animated")
        
        # Add collision tag for barriers
        if "Barrier" in config.tags or "Collision" in config.tags:
            tags.append("collision")
        
        # Create interaction hooks
        interaction_hooks = []
        if "Interactive" in config.tags:
            interaction_hooks.append("on_click")
        if "Harvestable" in config.tags:
            interaction_hooks.append("on_harvest")
        
        # Handle material type as string
        material_id = config.material_type.value if hasattr(config.material_type, 'value') else str(config.material_type)
        
        return AssetMetadata(
            asset_id=config.dgt_sprite_id,
            asset_type=config.asset_type,
            material_id=material_id,
            description=config.description,
            tags=tags,
            collision="collision" in tags,
            interaction_hooks=interaction_hooks,
            d20_checks={}  # Can be populated later
        )
    
    def get_processed_asset(self, sprite_id: str) -> Optional[HarvestedAsset]:
        """Get processed asset by sprite ID"""
        return self.processed_assets.get(sprite_id)
    
    def get_all_processed_assets(self) -> Dict[str, HarvestedAsset]:
        """Get all processed assets"""
        return self.processed_assets.copy()
    
    def get_processing_stats(self) -> Dict:
        """Get processing statistics"""
        asset_type_counts = {}
        material_counts = {}
        
        for asset in self.processed_assets.values():
            # Count by asset type
            asset_type = asset.metadata.asset_type.value
            asset_type_counts[asset_type] = asset_type_counts.get(asset_type, 0) + 1
            
            # Count by material type
            material_type = asset.metadata.material_id.value
            material_counts[material_type] = material_counts.get(material_type, 0) + 1
        
        return {
            'total_assets': len(self.processed_assets),
            'asset_types': asset_type_counts,
            'materials': material_counts,
            'animated_assets': len([a for a in self.processed_assets.values() if 'animated' in a.metadata.tags])
        }


# Factory function
def create_tiny_farm_processor(tiny_farm_dir: str = "assets/tiny_farm") -> TinyFarmProcessor:
    """Create Tiny Farm processor using DGT tools"""
    processor = TinyFarmProcessor(tiny_farm_dir)
    processor.process_all_assets()
    return processor


# Test implementation
if __name__ == "__main__":
    # Test Tiny Farm processor
    processor = create_tiny_farm_processor()
    
    # Display stats
    stats = processor.get_processing_stats()
    print(f"🚜 Tiny Farm Processing Stats: {stats}")
    
    # Test asset retrieval
    test_assets = ["voyager_idle", "swaying_oak", "iron_lockbox"]
    for asset_id in test_assets:
        asset = processor.get_processed_asset(asset_id)
        if asset:
            print(f"✅ Found asset: {asset.asset_id} - {asset.metadata.description}")
        else:
            print(f"❌ Missing asset: {asset_id}")
    
    print("🚜 Tiny Farm Processor test completed")
