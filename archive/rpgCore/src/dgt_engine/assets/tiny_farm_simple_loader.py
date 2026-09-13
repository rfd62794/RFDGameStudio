"""
Tiny Farm Simple Loader - Focus on Image Rendering and Detection
Minimal implementation to get Tiny Farm assets working in the game
"""

import os
import tkinter as tk
from PIL import Image, ImageTk
from typing import Dict, Optional, List
from pathlib import Path
from loguru import logger


class TinyFarmSimpleLoader:
    """
    Simple Tiny Farm asset loader focused on rendering and detection
    
    Priority:
    1. Load PNG files successfully
    2. Convert to tkinter PhotoImage
    3. Make them available to the game
    """
    
    def __init__(self, tiny_farm_dir: str = "assets/tiny_farm"):
        self.tiny_farm_dir = Path(tiny_farm_dir)
        self.sprites: Dict[str, tk.PhotoImage] = {}
        
        # Simple asset mapping
        self.asset_mapping = {
            "voyager": "Character/Idle.png",
            "swaying_oak": "Objects/Maple Tree.png", 
            "iron_lockbox": "Objects/chest.png",
            "wood_fence": "Objects/Fence's copiar.png",
            "house": "Objects/House.png",
            "crops": "Objects/Spring Crops.png",
            "dirt_path": "Objects/Road copiar.png",
            "grass_tiles": "Tileset/Tileset Spring.png",
            "chicken": "Farm Animals/Chicken Red.png",
            "cow": "Farm Animals/Female Cow Brown.png"
        }
        
        logger.info("🚜 Tiny Farm Simple Loader initialized")
    
    def load_all_assets(self) -> None:
        """Load all Tiny Farm assets"""
        logger.info("🔄 Loading Tiny Farm assets...")
        
        loaded_count = 0
        for sprite_id, filename in self.asset_mapping.items():
            if self._load_single_asset(sprite_id, filename):
                loaded_count += 1
        
        logger.info(f"✅ Loaded {loaded_count}/{len(self.asset_mapping)} Tiny Farm assets")
    
    def _load_single_asset(self, sprite_id: str, filename: str) -> bool:
        """Load single asset file"""
        try:
            file_path = self.tiny_farm_dir / filename
            
            if not file_path.exists():
                logger.warning(f"⚠️ File not found: {file_path}")
                return False
            
            # Load image with PIL
            image = Image.open(file_path)
            
            # Convert to tkinter PhotoImage
            photo = ImageTk.PhotoImage(image)
            
            # Scale for better visibility (4x)
            photo = photo.zoom(4, 4)
            
            # Store sprite
            self.sprites[sprite_id] = photo
            
            logger.debug(f"✅ Loaded asset: {sprite_id} from {filename}")
            return True
            
        except Exception as e:
            logger.error(f"⚠️ Error loading {filename}: {e}")
            return False
    
    def get_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get sprite by ID"""
        return self.sprites.get(sprite_id)
    
    def get_all_sprites(self) -> Dict[str, tk.PhotoImage]:
        """Get all loaded sprites"""
        return self.sprites.copy()
    
    def get_loaded_count(self) -> int:
        """Get number of loaded assets"""
        return len(self.sprites)
    
    def list_available_files(self) -> List[str]:
        """List all available PNG files in Tiny Farm directory"""
        png_files = []
        
        if self.tiny_farm_dir.exists():
            for png_file in self.tiny_farm_dir.rglob("*.png"):
                relative_path = png_file.relative_to(self.tiny_farm_dir)
                png_files.append(str(relative_path))
        
        return png_files


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test simple loader
    root = tk.Tk()
    root.title("Tiny Farm Simple Loader Test")
    root.geometry("800x600")
    root.configure(bg='#1a1a1a')
    
    # Create loader
    loader = TinyFarmSimpleLoader()
    
    # List available files
    available_files = loader.list_available_files()
    print(f"📁 Found {len(available_files)} PNG files:")
    for file in available_files:
        print(f"  {file}")
    
    # Load assets
    loader.load_all_assets()
    
    # Create canvas for testing
    canvas = tk.Canvas(root, width=800, height=400, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Display loaded sprites
    x_offset = 0
    y_offset = 0
    
    for sprite_id, sprite in loader.sprites.items():
        canvas.create_image(x_offset, y_offset, image=sprite, anchor='nw')
        canvas.create_text(x_offset + 32, y_offset - 5, text=sprite_id, 
                         fill='#00ff00', font=('Arial', 8), anchor='nw')
        
        x_offset += 120
        if x_offset >= 760:
            x_offset = 0
            y_offset += 80
    
    # Status
    status_text = f"Loaded: {loader.get_loaded_count()} assets"
    status_label = tk.Label(root, text=status_text, bg='#1a1a1a', fg='#00ff00')
    status_label.pack()
    
    print("🚜 Tiny Farm Simple Loader Test running - Close window to exit")
    root.mainloop()
