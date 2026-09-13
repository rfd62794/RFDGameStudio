"""
Image Processor - SOLID image processing component
ADR 096: Decoupled Image Processing Pipeline
"""

from PIL import Image, ImageOps, ImageDraw
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
from loguru import logger
from dataclasses import dataclass

from .asset_models import SpriteSlice, GridConfiguration


class ImageProcessingError(Exception):
    """Custom exception for image processing errors"""
    pass


@dataclass
class ImageDimensions:
    """Image dimensions data"""
    width: int
    height: int
    
    @property
    def area(self) -> int:
        """Get image area"""
        return self.width * self.height
    
    def to_tuple(self) -> Tuple[int, int]:
        """Convert to tuple"""
        return (self.width, self.height)


class ImageProcessor:
    """SOLID image processing component for sprite operations"""
    
    def __init__(self):
        self._supported_formats = {'.png', '.jpg', '.jpeg', '.bmp', '.gif'}
        logger.debug("ImageProcessor initialized")
    
    def load_image(self, file_path: Path) -> Image.Image:
        """
        Load image from file with validation
        
        Args:
            file_path: Path to image file
            
        Returns:
            PIL Image object
            
        Raises:
            ImageProcessingError: If image cannot be loaded
        """
        if not file_path.exists():
            raise ImageProcessingError(f"Image file not found: {file_path}")
        
        if file_path.suffix.lower() not in self._supported_formats:
            raise ImageProcessingError(f"Unsupported image format: {file_path.suffix}")
        
        try:
            image = Image.open(file_path)
            # Convert to RGB for consistency
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            logger.debug(f"Loaded image: {file_path.name} ({image.width}x{image.height})")
            return image
            
        except Exception as e:
            raise ImageProcessingError(f"Failed to load image {file_path}: {e}")
    
    def get_image_dimensions(self, image: Image.Image) -> ImageDimensions:
        """Get image dimensions"""
        return ImageDimensions(width=image.width, height=image.height)
    
    def calculate_grid_dimensions(self, image: Image.Image, tile_size: int) -> Tuple[int, int]:
        """
        Calculate grid dimensions for an image
        
        Args:
            image: PIL Image
            tile_size: Size of each tile
            
        Returns:
            Tuple of (cols, rows)
        """
        cols = image.width // tile_size
        rows = image.height // tile_size
        
        if cols == 0 or rows == 0:
            raise ImageProcessingError(
                f"Image too small for tile size {tile_size}: "
                f"image size {image.width}x{image.height}"
            )
        
        logger.debug(f"Calculated grid: {cols}x{rows} for tile size {tile_size}")
        return cols, rows
    
    def slice_grid(self, image: Image.Image, config: GridConfiguration, 
                   sheet_name: str) -> List[SpriteSlice]:
        """
        Slice image into grid tiles
        
        Args:
            image: PIL Image to slice
            config: Grid configuration
            sheet_name: Name of the spritesheet
            
        Returns:
            List of SpriteSlice objects
            
        Raises:
            ImageProcessingError: If slicing fails
        """
        try:
            # Auto-detect grid dimensions if requested
            if config.auto_detect:
                config.grid_cols, config.grid_rows = self.calculate_grid_dimensions(
                    image, config.tile_size
                )
            
            slices = []
            
            for y in range(config.grid_rows):
                for x in range(config.grid_cols):
                    pixel_x = x * config.tile_size
                    pixel_y = y * config.tile_size
                    
                    # Extract sprite
                    sprite_image = image.crop((
                        pixel_x, pixel_y,
                        pixel_x + config.tile_size,
                        pixel_y + config.tile_size
                    ))
                    
                    # Generate asset ID
                    asset_id = f"{sheet_name}_{x:02d}_{y:02d}"
                    
                    # Extract palette
                    palette = self._extract_palette(sprite_image)
                    
                    # Create sprite slice
                    sprite_slice = SpriteSlice(
                        sheet_name=sheet_name,
                        grid_x=x,
                        grid_y=y,
                        pixel_x=pixel_x,
                        pixel_y=pixel_y,
                        width=config.tile_size,
                        height=config.tile_size,
                        asset_id=asset_id,
                        palette=palette
                    )
                    
                    slices.append(sprite_slice)
            
            logger.info(f"Sliced {len(slices)} sprites from {sheet_name}")
            return slices
            
        except Exception as e:
            raise ImageProcessingError(f"Failed to slice grid: {e}")
    
    def _extract_palette(self, image: Image.Image) -> List[str]:
        """
        Extract 4 most frequent colors from image
        
        Args:
            image: PIL Image
            
        Returns:
            List of hex color codes
        """
        try:
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get color histogram
            colors = image.getcolors(maxcolors=256 * 256 * 256)
            
            if not colors:
                # Fallback to dominant color
                dominant_color = self._get_dominant_color(image)
                return [dominant_color]
            
            # Sort by frequency and get top 4
            sorted_colors = sorted(colors, key=lambda x: x[0], reverse=True)
            
            # Extract hex colors
            palette = []
            for count, (r, g, b) in sorted_colors[:4]:
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                palette.append(hex_color)
            
            return palette
            
        except Exception as e:
            logger.warning(f"Failed to extract palette: {e}")
            # Fallback to grayscale
            return ["#808080", "#606060", "#404040", "#202020"]
    
    def _get_dominant_color(self, image: Image.Image) -> str:
        """Get dominant color from image"""
        # Convert to numpy array for faster processing
        img_array = np.array(image)
        
        # Reshape to list of RGB values
        pixels = img_array.reshape(-1, 3)
        
        # Find most common color
        unique_colors, counts = np.unique(pixels, axis=0, return_counts=True)
        dominant_idx = np.argmax(counts)
        dominant_rgb = unique_colors[dominant_idx]
        
        return f"#{dominant_rgb[0]:02x}{dominant_rgb[1]:02x}{dominant_rgb[2]:02x}"
    
    def convert_to_grayscale(self, image: Image.Image) -> Image.Image:
        """Convert image to grayscale"""
        return ImageOps.grayscale(image)
    
    def resize_for_display(self, image: Image.Image, zoom_level: float) -> Image.Image:
        """
        Resize image for display with nearest neighbor sampling
        
        Args:
            image: PIL Image
            zoom_level: Zoom factor
            
        Returns:
            Resized PIL Image
        """
        if zoom_level <= 0:
            raise ImageProcessingError("Zoom level must be positive")
        
        new_width = int(image.width * zoom_level)
        new_height = int(image.height * zoom_level)
        
        # Use NEAREST for pixel art preservation
        return image.resize(
            (new_width, new_height),
            Image.Resampling.NEAREST
        )
    
    def create_sample_spritesheet(self, width: int = 64, height: int = 64, 
                                tile_size: int = 16) -> Image.Image:
        """
        Create a sample spritesheet for testing
        
        Args:
            width: Sheet width
            height: Sheet height
            tile_size: Size of each tile
            
        Returns:
            PIL Image with sample sprites
        """
        spritesheet = Image.new('RGB', (width, height), '#ffffff')
        draw = ImageDraw.Draw(spritesheet)
        
        # Sample sprite data
        sprites = [
            # Row 0: Organic materials
            {'pos': (0, 0), 'color': '#2d5a27', 'type': 'grass'},
            {'pos': (16, 0), 'color': '#3a6b35', 'type': 'leaves'},
            {'pos': (32, 0), 'color': '#4b7845', 'type': 'flowers'},
            {'pos': (48, 0), 'color': '#5c8745', 'type': 'vines'},
            
            # Row 1: Wood materials
            {'pos': (0, 16), 'color': '#5d4037', 'type': 'wood'},
            {'pos': (16, 16), 'color': '#6b5447', 'type': 'bark'},
            {'pos': (32, 16), 'color': '#7b6557', 'type': 'plank'},
            {'pos': (48, 16), 'color': '#8b7667', 'type': 'stump'},
            
            # Row 2: Stone materials
            {'pos': (0, 32), 'color': '#757575', 'type': 'stone'},
            {'pos': (16, 32), 'color': '#858585', 'type': 'granite'},
            {'pos': (32, 32), 'color': '#959595', 'type': 'marble'},
            {'pos': (48, 32), 'color': '#a5a5a5', 'type': 'slate'},
            
            # Row 3: Metal materials
            {'pos': (0, 48), 'color': '#9e9e9e', 'type': 'metal'},
            {'pos': (16, 48), 'color': '#aeaeae', 'type': 'steel'},
            {'pos': (32, 48), 'color': '#bebebe', 'type': 'silver'},
            {'pos': (48, 48), 'color': '#cecece', 'type': 'gold'},
        ]
        
        for sprite in sprites:
            x, y = sprite['pos']
            color = sprite['type']
            
            # Draw sprite with type-specific patterns
            self._draw_sprite_pattern(draw, x, y, tile_size, sprite['type'], sprite['color'])
        
        logger.debug(f"Created sample spritesheet: {width}x{height}")
        return spritesheet
    
    def _draw_sprite_pattern(self, draw: ImageDraw.ImageDraw, x: int, y: int, 
                           size: int, sprite_type: str, color: str) -> None:
        """Draw sprite with type-specific pattern"""
        if sprite_type in ['grass', 'leaves', 'flowers', 'vines']:
            # Organic - add texture
            for dy in range(size):
                for dx in range(size):
                    if (dx + dy) % 3 == 0:
                        # Lighter variant
                        r = int(color[1:3], 16)
                        g = int(color[3:5], 16)
                        b = int(color[5:7], 16)
                        lighter = f"#{min(255, r + 20):02x}{min(255, g + 20):02x}{min(255, b + 20):02x}"
                        draw.point((x + dx, y + dy), fill=lighter)
                    elif (dx + dy) % 5 == 0:
                        # Darker variant
                        r = int(color[1:3], 16)
                        g = int(color[3:5], 16)
                        b = int(color[5:7], 16)
                        darker = f"#{max(0, r - 20):02x}{max(0, g - 20):02x}{max(0, b - 20):02x}"
                        draw.point((x + dx, y + dy), fill=darker)
                    else:
                        draw.point((x + dx, y + dy), fill=color)
        elif sprite_type in ['wood', 'bark']:
            # Wood - add grain lines
            for dy in range(0, size, 4):
                draw.line([(x, y + dy), (x + size - 1, y + dy)], fill=color)
        elif sprite_type in ['stone', 'granite', 'marble', 'slate']:
            # Stone - add texture
            for dy in range(size):
                for dx in range(size):
                    if (dx + dy) % 2 == 0:
                        draw.point((x + dx, y + dy), fill=color)
        elif sprite_type in ['metal', 'steel', 'silver', 'gold']:
            # Metal - add sheen
            for dy in range(0, size, 2):
                for dx in range(0, size, 2):
                    r = int(color[1:3], 16)
                    g = int(color[3:5], 16)
                    b = int(color[5:7], 16)
                    sheen = f"#{min(255, r + 40):02x}{min(255, g + 40):02x}{min(255, b + 40):02x}"
                    draw.point((x + dx, y + dy), fill=sheen)
        else:
            # Default fill
            draw.rectangle([x, y, x + size - 1, y + size - 1], fill=color)
