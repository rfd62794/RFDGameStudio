"""
DGT-Compatible Tiny Farm Loader - Engine Integration Fix
Integrates with DGT Window Handler to prevent garbage collection issues
"""

from PIL import Image
from typing import Dict, Set, Optional
from pathlib import Path
from loguru import logger
import dataclasses


@dataclasses.dataclass
class SpriteDNA:
    """Sprite metadata and classification"""
    id: str
    path: Path
    material: str = "organic"
    collision: bool = False
    tags: Set[str] = dataclasses.field(default_factory=set)


class DGTCompatibleTinyFarmLoader:
    """
    DGT Engine Compatible Loader
    Returns PIL images that the engine can convert to PhotoImage when needed
    """
    
    def __init__(self, assets_path: Path):
        self.path = assets_path
        self.pil_registry: Dict[str, Image.Image] = {}
        self.dna_map: Dict[str, SpriteDNA] = {}

    def harvest_sheet(self, sheet_name: str, tile_size: int = 16):
        """
        Harvest sprites using PIL only
        DGT engine will handle PhotoImage conversion to prevent garbage collection
        """
        sheet_path = Path(sheet_name)
        full_path = self.path / sheet_path
        if not full_path.exists():
            logger.error(f"Sheet not found: {full_path}")
            return

        # Open with PIL
        with Image.open(full_path) as sheet:
            width, height = sheet.size
            cols = width // tile_size
            rows = height // tile_size

            for r in range(rows):
                for c in range(cols):
                    left = c * tile_size
                    top = r * tile_size
                    right = left + tile_size
                    bottom = top + tile_size

                    # Crop using PIL (Precise pixel-perfect cutting)
                    tile_image = sheet.crop((left, top, right, bottom))
                    
                    # Store as PIL image (DGT engine will convert to PhotoImage)
                    asset_id = f"{sheet_path.stem}_{c}_{r}"
                    self.pil_registry[asset_id] = tile_image
                    
                    # Store DNA metadata
                    self.dna_map[asset_id] = SpriteDNA(
                        id=asset_id,
                        path=full_path,
                        tags={"harvested", "tiny_farm", f"tile_{c}_{r}"}
                    )
                    
        logger.success(f"🍪 Harvested {len(self.pil_registry)} tiles from {sheet_name}")

    def get_pil_sprite(self, asset_id: str) -> Optional[Image.Image]:
        """Get PIL sprite by ID"""
        return self.pil_registry.get(asset_id)

    def get_dna(self, asset_id: str) -> Optional[SpriteDNA]:
        """Get sprite metadata"""
        return self.dna_map.get(asset_id)

    def list_assets(self) -> Dict[str, SpriteDNA]:
        """Get all asset metadata"""
        return self.dna_map.copy()

    def integrate_with_dgt_handler(self, dgt_handler, scale_factor: int = 4):
        """
        Integrate harvested sprites with DGT Window Handler
        This prevents the garbage collection issue by letting DGT manage PhotoImages
        """
        from PIL import ImageTk
        
        integrated_count = 0
        
        for asset_id, pil_image in self.pil_registry.items():
            try:
                # Scale for display
                scaled_image = pil_image.resize(
                    (pil_image.width * scale_factor, pil_image.height * scale_factor),
                    Image.Resampling.NEAREST
                )
                
                # Convert to PhotoImage and cache in DGT handler
                tk_image = ImageTk.PhotoImage(scaled_image)
                dgt_handler.raster_cache.cache_sprite(asset_id, tk_image)
                
                integrated_count += 1
                
            except Exception as e:
                logger.error(f"⚠️ Error integrating {asset_id}: {e}")
        
        logger.success(f"🎯 Integrated {integrated_count} sprites with DGT handler")
        return integrated_count


# Usage example:
# loader = DGTCompatibleTinyFarmLoader(Path('assets/tiny_farm'))
# loader.harvest_sheet('Objects/chest.png')
# 
# # Integrate with DGT handler
# loader.integrate_with_dgt_handler(window_handler)
# 
# # Now sprites are available in DGT's raster cache
