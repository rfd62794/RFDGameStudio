"""
Tiny Farm Sprite Sheet Loader - Professional Asset Import Tool
Handles sprite sheets with proper slicing and frame extraction
"""

import os
import tkinter as tk
from PIL import Image, ImageTk
from typing import Dict, List, Tuple, Optional, Set
from pathlib import Path
from loguru import logger
import dataclasses


class SpriteFrame:
    """Individual sprite frame from a sprite sheet"""
    
    def __init__(self, image: ImageTk.PhotoImage, frame_index: int):
        self.image = image
        self.frame_index = frame_index
        self.width = image.width()
        self.height = image.height()


class TinyFarmSpriteSheet:
    """Sprite sheet with multiple frames for animations"""
    
    def __init__(self, name: str, sheet_image: Image.Image, frame_width: int, frame_height: int):
        self.name = name
        self.sheet_image = sheet_image
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.frames: List[SpriteFrame] = []
        
        # Extract frames from sheet
        self._extract_frames()
    
    def _extract_frames(self) -> None:
        """Extract individual frames from the sprite sheet"""
        sheet_width, sheet_height = self.sheet_image.size
        
        # Calculate number of frames
        frames_across = sheet_width // self.frame_width
        frames_down = sheet_height // self.frame_height
        total_frames = frames_across * frames_down
        
        logger.info(f"📄 Extracting {total_frames} frames from {self.name} ({frames_across}x{frames_down})")
        
        for frame_index in range(total_frames):
            # Calculate frame position
            frame_x = (frame_index % frames_across) * self.frame_width
            frame_y = (frame_index // frames_across) * self.frame_height
            
            # Extract frame
            frame_image = self.sheet_image.crop((frame_x, frame_y, frame_x + self.frame_width, frame_y + self.frame_height))
            
            # Scale for display using PIL resize instead of zoom
            scaled_image = frame_image.resize((self.frame_width*4, self.frame_height*4), Image.Resampling.NEAREST)
            
            # Convert to tkinter PhotoImage AFTER PIL processing
            tk_image = ImageTk.PhotoImage(scaled_image)
            
            # Store frame
            self.frames.append(SpriteFrame(tk_image, frame_index))
    
    def get_frame(self, frame_index: int) -> Optional[SpriteFrame]:
        """Get specific frame by index"""
        if 0 <= frame_index < len(self.frames):
            return self.frames[frame_index]
        return None
    
    def get_all_frames(self) -> List[SpriteFrame]:
        """Get all frames"""
        return self.frames.copy()
    
    def get_frame_count(self) -> int:
        """Get total number of frames"""
        return len(self.frames)


class TinyFarmSheetLoader:
    """
    Professional Tiny Farm sprite sheet loader
    Handles character animations, object variations, and tilesets
    """
    
    def __init__(self, tiny_farm_dir: str = "assets/tiny_farm"):
        self.tiny_farm_dir = Path(tiny_farm_dir)
        self.sprite_sheets: Dict[str, TinyFarmSpriteSheet] = {}
        self.single_sprites: Dict[str, tk.PhotoImage] = {}
        
        # Sprite sheet configurations
        self.sheet_configs = {
            # Character animations
            "Character/Idle.png": {
                "sprite_id": "voyager_idle",
                "frame_width": 32,
                "frame_height": 32,
                "description": "Hero character idle animation"
            },
            "Character/Walk.png": {
                "sprite_id": "voyager_walk", 
                "frame_width": 32,
                "frame_height": 32,
                "description": "Hero character walk animation"
            },
            
            # Tilesets (might have multiple tiles)
            "Tileset/Tileset Spring.png": {
                "sprite_id": "spring_tileset",
                "frame_width": 16,
                "frame_height": 16,
                "description": "Spring ground tiles"
            }
        }
        
        # Single sprite configurations
        self.single_configs = {
            "Objects/Maple Tree.png": {
                "sprite_id": "swaying_oak",
                "description": "Maple tree with detailed foliage"
            },
            "Objects/chest.png": {
                "sprite_id": "iron_lockbox",
                "description": "Iron treasure chest"
            },
            "Objects/Fence's copiar.png": {
                "sprite_id": "wood_fence",
                "description": "Wooden fence barrier"
            },
            "Objects/House.png": {
                "sprite_id": "house",
                "description": "Farm house building"
            },
            "Objects/Spring Crops.png": {
                "sprite_id": "crops",
                "description": "Spring crops with growth stages"
            },
            "Objects/Road copiar.png": {
                "sprite_id": "dirt_path",
                "description": "Dirt path texture"
            },
            "Farm Animals/Chicken Red.png": {
                "sprite_id": "chicken",
                "description": "Red farm chicken"
            },
            "Farm Animals/Female Cow Brown.png": {
                "sprite_id": "cow",
                "description": "Brown female cow"
            },
            "Farm Animals/Male Cow Brown.png": {
                "sprite_id": "bull",
                "description": "Brown male cow"
            },
            "Farm Animals/Baby Chicken Yellow.png": {
                "sprite_id": "chick",
                "description": "Yellow baby chicken"
            },
            "Farm Animals/Chicken Blonde Green.png": {
                "sprite_id": "chicken_variant",
                "description": "Blonde green chicken variant"
            },
            "Objects/Interior.png": {
                "sprite_id": "interior",
                "description": "Interior objects"
            }
        }
        
        logger.info("🚜 Tiny Farm Sheet Loader initialized")
    
    def load_all_assets(self) -> None:
        """Load all sprite sheets and single sprites"""
        logger.info("🔄 Loading Tiny Farm sprite sheets and assets...")
        
        # Load sprite sheets
        sheet_count = self._load_sprite_sheets()
        
        # Load single sprites
        single_count = self._load_single_sprites()
        
        logger.info(f"✅ Loaded {sheet_count} sprite sheets and {single_count} single sprites")
    
    def _load_sprite_sheets(self) -> int:
        """Load sprite sheet animations"""
        loaded_count = 0
        
        for file_path, config in self.sheet_configs.items():
            try:
                full_path = self.tiny_farm_dir / file_path
                
                if not full_path.exists():
                    logger.warning(f"⚠️ Sprite sheet not found: {full_path}")
                    continue
                
                # Load sheet image
                sheet_image = Image.open(full_path)
                logger.debug(f"📄 Loaded sprite sheet: {file_path} ({sheet_image.size[0]}x{sheet_image.size[1]})")
                
                # Create sprite sheet object
                sprite_sheet = TinyFarmSpriteSheet(
                    name=config["sprite_id"],
                    sheet_image=sheet_image,
                    frame_width=config["frame_width"],
                    frame_height=config["frame_height"]
                )
                
                # Store sprite sheet
                self.sprite_sheets[config["sprite_id"]] = sprite_sheet
                
                logger.debug(f"✅ Created sprite sheet: {config['sprite_id']} with {sprite_sheet.get_frame_count()} frames")
                loaded_count += 1
                
            except Exception as e:
                logger.error(f"⚠️ Error loading sprite sheet {file_path}: {e}")
        
        return loaded_count
    
    def _load_single_sprites(self) -> int:
        """Load single sprite images"""
        loaded_count = 0
        
        for file_path, config in self.single_configs.items():
            try:
                full_path = self.tiny_farm_dir / file_path
                
                if not full_path.exists():
                    logger.warning(f"⚠️ Sprite file not found: {full_path}")
                    continue
                
                # Load image
                image = Image.open(full_path)
                
                # Resize to standard size if needed
                if image.size != (16, 16):
                    image = image.resize((16, 16), Image.Resampling.LANCZOS)
                
                # Scale for display using PIL resize (4x for visibility)
                scaled_image = image.resize((64, 64), Image.Resampling.NEAREST)
                
                # Convert to tkinter PhotoImage AFTER all PIL processing
                tk_image = ImageTk.PhotoImage(scaled_image)
                
                # Store sprite
                self.single_sprites[config["sprite_id"]] = tk_image
                
                logger.debug(f"✅ Loaded single sprite: {config['sprite_id']} ({image.size[0]}x{image.size[1]})")
                loaded_count += 1
                
            except Exception as e:
                logger.error(f"⚠️ Error loading single sprite {file_path}: {e}")
        
        return loaded_count
    
    def get_sprite_sheet(self, sprite_id: str) -> Optional[TinyFarmSpriteSheet]:
        """Get sprite sheet by ID"""
        return self.sprite_sheets.get(sprite_id)
    
    def get_single_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get single sprite by ID"""
        return self.single_sprites.get(sprite_id)
    
    def get_sprite_frame(self, sprite_id: str, frame_index: int = 0) -> Optional[tk.PhotoImage]:
        """Get specific frame from sprite sheet"""
        sprite_sheet = self.get_sprite_sheet(sprite_id)
        if sprite_sheet:
            frame = sprite_sheet.get_frame(frame_index)
            if frame:
                return frame.image
        return None
    
    def get_all_sprites(self) -> Dict[str, tk.PhotoImage]:
        """Get all available sprites (first frame of sprite sheets + all single sprites)"""
        all_sprites = {}
        
        # Add first frame of each sprite sheet
        for sprite_id, sprite_sheet in self.sprite_sheets.items():
            if sprite_sheet.frames:
                all_sprites[sprite_id] = sprite_sheet.frames[0].image
        
        # Add all single sprites
        all_sprites.update(self.single_sprites)
        
        return all_sprites
    
    def get_animation_frames(self, sprite_id: str) -> List[tk.PhotoImage]:
        """Get all frames for an animated sprite"""
        sprite_sheet = self.get_sprite_sheet(sprite_id)
        if sprite_sheet:
            return [frame.image for frame in sprite_sheet.frames]
        return []
    
    def get_asset_info(self) -> Dict:
        """Get comprehensive asset information"""
        info = {
            "sprite_sheets": {},
            "single_sprites": {},
            "total_sprites": 0,
            "total_frames": 0
        }
        
        # Sprite sheet info
        for sprite_id, sprite_sheet in self.sprite_sheets.items():
            info["sprite_sheets"][sprite_id] = {
                "frame_count": sprite_sheet.get_frame_count(),
                "frame_size": (sprite_sheet.frame_width, sprite_sheet.frame_height),
                "description": sprite_sheet.name
            }
            info["total_frames"] += sprite_sheet.get_frame_count()
        
        # Single sprite info
        for sprite_id, sprite in self.single_sprites.items():
            info["single_sprites"][sprite_id] = {
                "size": (sprite.width(), sprite.height()),
                "type": "single"
            }
        
        info["total_sprites"] = len(self.sprite_sheets) + len(self.single_sprites)
        
        return info


# Factory function
def create_tiny_farm_sheet_loader(tiny_farm_dir: str = "assets/tiny_farm") -> TinyFarmSheetLoader:
    """Create Tiny Farm sheet loader"""
    loader = TinyFarmSheetLoader(tiny_farm_dir)
    loader.load_all_assets()
    return loader


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test sheet loader
    root = tk.Tk()
    root.title("Tiny Farm Sheet Loader Test")
    root.geometry("1000x600")
    root.configure(bg='#1a1a1a')
    
    # Create loader
    loader = create_tiny_farm_sheet_loader()
    
    # Display asset info
    info = loader.get_asset_info()
    print(f"🚜 Tiny Farm Asset Info:")
    print(f"  Sprite Sheets: {len(info['sprite_sheets'])}")
    print(f"  Single Sprites: {len(info['single_sprites'])}")
    print(f"  Total Frames: {info['total_frames']}")
    
    # Create canvas for testing
    canvas = tk.Canvas(root, width=1000, height=400, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Display sprite sheets
    x_offset = 0
    y_offset = 0
    
    for sheet_id, sheet_info in info["sprite_sheets"].items():
        sheet = loader.get_sprite_sheet(sheet_id)
        if sheet and sheet.frames:
            # Display first few frames
            for i, frame in enumerate(sheet.frames[:3]):  # Show first 3 frames
                canvas.create_image(x_offset, y_offset, image=frame.image, anchor='nw')
                canvas.create_text(x_offset + 32, y_offset - 5, 
                                 text=f"{sheet_id}_frame_{i}", 
                                 fill='#00ff00', font=('Arial', 8), anchor='nw')
                x_offset += 100
            
            x_offset = 0
            y_offset += 80
    
    # Display single sprites
    for sprite_id, sprite_info in info["single_sprites"].items():
        sprite = loader.get_single_sprite(sprite_id)
        if sprite:
            canvas.create_image(x_offset, y_offset, image=sprite, anchor='nw')
            canvas.create_text(x_offset + 32, y_offset - 5, 
                             text=sprite_id, 
                             fill='#00ff00', font=('Arial', 8), anchor='nw')
            
            x_offset += 120
            if x_offset >= 980:
                x_offset = 0
                y_offset += 80
    
    # Status
    status_text = f"Sprite Sheets: {len(info['sprite_sheets'])}, Single Sprites: {len(info['single_sprites'])}, Total Frames: {info['total_frames']}"
    status_label = tk.Label(root, text=status_text, bg='#1a1a1a', fg='#00ff00')
    status_label.pack()
    
    print("🚜 Tiny Farm Sheet Loader Test running - Close window to exit")
    root.mainloop()
