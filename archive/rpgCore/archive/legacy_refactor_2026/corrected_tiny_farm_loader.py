"""
Corrected Tiny Farm Loader - PIL-First Architecture
Fixes namespace collisions and ensures proper image handling
"""

from PIL import Image, ImageTk
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


class TinyFarmLoader:
    """
    SYSTEMIC FIX: PIL-First Architecture
    Uses PIL for all image processing, only converts to PhotoImage at the end
    """
    
    def __init__(self, assets_path: Path):
        self.path = assets_path
        self.registry: Dict[str, ImageTk.PhotoImage] = {}
        self.dna_map: Dict[str, SpriteDNA] = {}

    def harvest_sheet(self, sheet_name: str, tile_size: int = 16):
        """
        SYSTEMIC FIX: Use PIL for slicing, NOT tkinter.subsample.
        Prevents namespace collision and ensures proper image handling.
        """
        sheet_path = Path(sheet_name)
        full_path = self.path / sheet_path
        if not full_path.exists():
            logger.error(f"Sheet not found: {full_path}")
            return

        # Open with PIL (not tkinter)
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
                    
                    # Scale for display using PIL (4x for visibility)
                    scaled_image = tile_image.resize((tile_size * 4, tile_size * 4), Image.Resampling.NEAREST)
                    
                    # Convert to Tkinter-native format ONLY at the end
                    asset_id = f"{sheet_path.stem}_{c}_{r}"
                    self.registry[asset_id] = ImageTk.PhotoImage(scaled_image)
                    
                    # Store DNA metadata
                    self.dna_map[asset_id] = SpriteDNA(
                        id=asset_id,
                        path=full_path,
                        tags={"harvested", "tiny_farm", f"tile_{c}_{r}"}
                    )
                    
        logger.success(f"🍪 Harvested {len(self.registry)} tiles from {sheet_name}")

    def get_sprite(self, asset_id: str) -> Optional[ImageTk.PhotoImage]:
        """Get sprite by ID, preventing garbage collection"""
        return self.registry.get(asset_id)

    def get_dna(self, asset_id: str) -> Optional[SpriteDNA]:
        """Get sprite metadata"""
        return self.dna_map.get(asset_id)

    def list_assets(self) -> Dict[str, SpriteDNA]:
        """Get all asset metadata"""
        return self.dna_map.copy()


# Usage example:
# loader = TinyFarmLoader(Path("assets/tiny_farm"))
# loader.harvest_sheet("Tileset Spring.png")
# sprite = loader.get_sprite("Tileset Spring_0_0")
# dna = loader.get_dna("Tileset Spring_0_0")
