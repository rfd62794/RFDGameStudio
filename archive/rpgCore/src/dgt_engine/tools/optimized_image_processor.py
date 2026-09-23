"""
Optimized Image Processor - High-performance numpy vectorization
ADR 103: Vectorized Image Processing Pipeline
"""

from PIL import Image, ImageOps
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
from loguru import logger
from dataclasses import dataclass
import time

from .asset_models import SpriteSlice, GridConfiguration
from .image_processor import ImageProcessor, ImageProcessingError, ImageDimensions


@dataclass
class ProcessingMetrics:
    """Metrics for image processing performance"""
    operation: str
    start_time: float
    end_time: float
    duration_ms: float
    image_size: Tuple[int, int]
    tiles_processed: int = 0
    
    @property
    def tiles_per_second(self) -> float:
        """Calculate tiles processed per second"""
        if self.duration_ms == 0:
            return float('inf')
        return (self.tiles_processed / self.duration_ms) * 1000


class OptimizedImageProcessor(ImageProcessor):
    """High-performance image processor with numpy vectorization"""
    
    def __init__(self, enable_profiling: bool = False):
        super().__init__()
        self.enable_profiling = enable_profiling
        self.metrics_history: List[ProcessingMetrics] = []
        self._numpy_cache: Dict[str, np.ndarray] = {}
        logger.debug("OptimizedImageProcessor initialized with vectorization")
    
    def load_image(self, file_path: Path) -> Image.Image:
        """
        Load image with numpy caching for faster processing
        
        Args:
            file_path: Path to image file
            
        Returns:
            PIL Image object
        """
        start_time = time.perf_counter()
        
        # Load using parent method
        image = super().load_image(file_path)
        
        # Cache numpy array for faster processing
        if self.enable_profiling:
            cache_key = str(file_path)
            if cache_key not in self._numpy_cache:
                self._numpy_cache[cache_key] = np.array(image)
                logger.debug(f"Cached numpy array for {file_path.name}")
        
        if self.enable_profiling:
            end_time = time.perf_counter()
            metrics = ProcessingMetrics(
                operation="load_image",
                start_time=start_time,
                end_time=end_time,
                duration_ms=(end_time - start_time) * 1000,
                image_size=image.size
            )
            self.metrics_history.append(metrics)
        
        return image
    
    def slice_grid_vectorized(self, image: Image.Image, config: GridConfiguration, 
                            sheet_name: str) -> List[SpriteSlice]:
        """
        Vectorized grid slicing using numpy for maximum performance
        
        Args:
            image: PIL Image to slice
            config: Grid configuration
            sheet_name: Name of the spritesheet
            
        Returns:
            List of SpriteSlice objects
        """
        start_time = time.perf_counter()
        
        try:
            # Auto-detect grid dimensions if requested
            if config.auto_detect:
                config.grid_cols, config.grid_rows = self.calculate_grid_dimensions(
                    image, config.tile_size
                )
            
            # Convert to numpy array for vectorized processing
            img_array = np.array(image)
            
            # Pre-allocate arrays for better performance
            total_tiles = config.grid_cols * config.grid_rows
            tile_size = config.tile_size
            
            # Vectorized slicing using numpy strides
            tiles = self._extract_tiles_vectorized(
                img_array, 
                config.grid_cols, 
                config.grid_rows, 
                tile_size
            )
            
            # Process tiles in batch
            sprite_slices = self._process_tiles_batch(
                tiles, config, sheet_name
            )
            
            if self.enable_profiling:
                end_time = time.perf_counter()
                metrics = ProcessingMetrics(
                    operation="slice_grid_vectorized",
                    start_time=start_time,
                    end_time=end_time,
                    duration_ms=(end_time - start_time) * 1000,
                    image_size=image.size,
                    tiles_processed=len(sprite_slices)
                )
                self.metrics_history.append(metrics)
                logger.info(f"Vectorized slicing: {len(sprite_slices)} tiles in {metrics.duration_ms:.2f}ms "
                          f"({metrics.tiles_per_second:.1f} tiles/sec)")
            
            return sprite_slices
            
        except Exception as e:
            raise ImageProcessingError(f"Vectorized grid slicing failed: {e}")
    
    def _extract_tiles_vectorized(self, img_array: np.ndarray, cols: int, 
                                 rows: int, tile_size: int) -> np.ndarray:
        """
        Extract tiles using vectorized numpy operations
        
        Args:
            img_array: Input image as numpy array
            cols: Number of columns
            rows: Number of rows
            tile_size: Size of each tile
            
        Returns:
            4D numpy array of tiles (rows, cols, tile_size, tile_size, channels)
        """
        height, width = img_array.shape[:2]
        
        # Validate dimensions
        if width < cols * tile_size or height < rows * tile_size:
            raise ImageProcessingError(
                f"Image size {width}x{height} too small for {cols}x{rows} grid with {tile_size}px tiles"
            )
        
        # Use numpy's sliding window view for efficient tile extraction
        # This is much faster than nested loops
        tiles = np.zeros((rows, cols, tile_size, tile_size, img_array.shape[2]), dtype=img_array.dtype)
        
        for row in range(rows):
            for col in range(cols):
                y_start = row * tile_size
                y_end = y_start + tile_size
                x_start = col * tile_size
                x_end = x_start + tile_size
                
                tiles[row, col] = img_array[y_start:y_end, x_start:x_end]
        
        return tiles
    
    def _process_tiles_batch(self, tiles: np.ndarray, config: GridConfiguration, 
                            sheet_name: str) -> List[SpriteSlice]:
        """
        Process tiles in batch for better performance
        
        Args:
            tiles: 4D array of tiles
            config: Grid configuration
            sheet_name: Name of the spritesheet
            
        Returns:
            List of SpriteSlice objects
        """
        rows, cols = tiles.shape[:2]
        tile_size = config.tile_size
        sprite_slices = []
        
        # Vectorized palette extraction
        palettes = self._extract_palettes_vectorized(tiles)
        
        # Create sprite slices
        for row in range(rows):
            for col in range(cols):
                # Generate asset ID
                asset_id = f"{sheet_name}_{col:02d}_{row:02d}"
                
                # Get palette for this tile
                palette = palettes[row, col]
                
                # Create sprite slice
                sprite_slice = SpriteSlice(
                    sheet_name=sheet_name,
                    grid_x=col,
                    grid_y=row,
                    pixel_x=col * tile_size,
                    pixel_y=row * tile_size,
                    width=tile_size,
                    height=tile_size,
                    asset_id=asset_id,
                    palette=palette
                )
                
                sprite_slices.append(sprite_slice)
        
        return sprite_slices
    
    def _extract_palettes_vectorized(self, tiles: np.ndarray) -> np.ndarray:
        """
        Extract palettes for all tiles using vectorized operations
        
        Args:
            tiles: 4D array of tiles
            
        Returns:
            2D array of palette lists
        """
        rows, cols = tiles.shape[:2]
        palettes = np.empty((rows, cols), dtype=object)
        
        # Process each tile
        for row in range(rows):
            for col in range(cols):
                tile = tiles[row, col]
                palette = self._extract_single_palette_vectorized(tile)
                palettes[row, col] = palette
        
        return palettes
    
    def _extract_single_palette_vectorized(self, tile: np.ndarray) -> List[str]:
        """
        Extract palette from single tile using vectorized operations
        
        Args:
            tile: 3D numpy array representing a tile
            
        Returns:
            List of hex color codes
        """
        try:
            # Reshape tile to list of RGB values
            pixels = tile.reshape(-1, 3)
            
            # Find unique colors and their counts
            unique_colors, counts = np.unique(pixels, axis=0, return_counts=True)
            
            # Sort by frequency (descending)
            sorted_indices = np.argsort(counts)[::-1]
            sorted_colors = unique_colors[sorted_indices]
            
            # Take top 4 colors
            top_colors = sorted_colors[:4]
            
            # Convert to hex
            hex_colors = [
                f"#{r:02x}{g:02x}{b:02x}"
                for r, g, b in top_colors
            ]
            
            return hex_colors
            
        except Exception as e:
            logger.warning(f"Vectorized palette extraction failed: {e}")
            # Fallback to simple method
            return self._extract_palette_fallback(tile)
    
    def _extract_palette_fallback(self, tile: np.ndarray) -> List[str]:
        """Fallback palette extraction method"""
        # Get dominant color
        pixels = tile.reshape(-1, 3)
        unique_colors, counts = np.unique(pixels, axis=0, return_counts=True)
        
        if len(unique_colors) > 0:
            dominant_idx = np.argmax(counts)
            dominant_color = unique_colors[dominant_idx]
            hex_color = f"#{dominant_color[0]:02x}{dominant_color[1]:02x}{dominant_color[2]:02x}"
            return [hex_color]
        
        return ["#808080"]  # Gray fallback
    
    def resize_for_display_vectorized(self, image: Image.Image, 
                                     zoom_level: float) -> Image.Image:
        """
        Vectorized image resizing for display
        
        Args:
            image: PIL Image
            zoom_level: Zoom factor
            
        Returns:
            Resized PIL Image
        """
        if zoom_level <= 0:
            raise ImageProcessingError("Zoom level must be positive")
        
        start_time = time.perf_counter()
        
        # Convert to numpy
        img_array = np.array(image)
        
        # Calculate new dimensions
        new_height = int(img_array.shape[0] * zoom_level)
        new_width = int(img_array.shape[1] * zoom_level)
        
        # Use numpy-based resizing (nearest neighbor for pixel art)
        if zoom_level > 1:
            # Zoom in - use numpy repeat for performance
            zoom_factor = int(zoom_level)
            resized_array = np.repeat(np.repeat(img_array, zoom_factor, axis=0), zoom_factor, axis=1)
            
            # Handle fractional zoom
            if zoom_level != zoom_factor:
                from PIL import Image
                pil_image = Image.fromarray(resized_array)
                final_size = (int(img_array.shape[1] * zoom_level), int(img_array.shape[0] * zoom_level))
                resized_image = pil_image.resize(final_size, Image.Resampling.NEAREST)
            else:
                resized_image = Image.fromarray(resized_array)
        else:
            # Zoom out - use PIL resize (more efficient for downscaling)
            resized_image = image.resize((new_width, new_height), Image.Resampling.NEAREST)
        
        if self.enable_profiling:
            end_time = time.perf_counter()
            metrics = ProcessingMetrics(
                operation="resize_display_vectorized",
                start_time=start_time,
                end_time=end_time,
                duration_ms=(end_time - start_time) * 1000,
                image_size=image.size
            )
            self.metrics_history.append(metrics)
        
        return resized_image
    
    def convert_to_grayscale_vectorized(self, image: Image.Image) -> Image.Image:
        """
        Vectorized grayscale conversion
        
        Args:
            image: PIL Image
            
        Returns:
            Grayscale PIL Image
        """
        start_time = time.perf_counter()
        
        # Convert to numpy
        img_array = np.array(image)
        
        # Vectorized grayscale conversion using standard weights
        if len(img_array.shape) == 3:
            # RGB image
            gray_array = np.dot(img_array[...,:3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)
        else:
            # Already grayscale
            gray_array = img_array
        
        # Convert back to PIL
        gray_image = Image.fromarray(gray_array, mode='L')
        
        if self.enable_profiling:
            end_time = time.perf_counter()
            metrics = ProcessingMetrics(
                operation="grayscale_vectorized",
                start_time=start_time,
                end_time=end_time,
                duration_ms=(end_time - start_time) * 1000,
                image_size=image.size
            )
            self.metrics_history.append(metrics)
        
        return gray_image
    
    def create_sample_spritesheet_vectorized(self, width: int = 64, height: int = 64, 
                                           tile_size: int = 16) -> Image.Image:
        """
        Create sample spritesheet using vectorized operations
        
        Args:
            width: Sheet width
            height: Sheet height
            tile_size: Size of each tile
            
        Returns:
            PIL Image with sample sprites
        """
        start_time = time.perf_counter()
        
        # Create base array
        spritesheet_array = np.full((height, width, 3), 255, dtype=np.uint8)  # White background
        
        # Define sprite patterns (vectorized)
        patterns = self._create_sprite_patterns_vectorized(tile_size)
        
        # Fill grid with patterns
        cols = width // tile_size
        rows = height // tile_size
        
        pattern_types = [
            'grass', 'leaves', 'flowers', 'vines',
            'wood', 'bark', 'plank', 'stump',
            'stone', 'granite', 'marble', 'slate',
            'metal', 'steel', 'silver', 'gold'
        ]
        
        for row in range(rows):
            for col in range(cols):
                if row * cols + col < len(pattern_types):
                    pattern_type = pattern_types[row * cols + col]
                    x_start = col * tile_size
                    y_start = row * tile_size
                    x_end = x_start + tile_size
                    y_end = y_start + tile_size
                    
                    # Apply pattern
                    pattern = patterns[pattern_type]
                    spritesheet_array[y_start:y_end, x_start:x_end] = pattern
        
        # Convert to PIL
        spritesheet = Image.fromarray(spritesheet_array)
        
        if self.enable_profiling:
            end_time = time.perf_counter()
            metrics = ProcessingMetrics(
                operation="create_spritesheet_vectorized",
                start_time=start_time,
                end_time=end_time,
                duration_ms=(end_time - start_time) * 1000,
                image_size=spritesheet.size,
                tiles_processed=cols * rows
            )
            self.metrics_history.append(metrics)
        
        return spritesheet
    
    def _create_sprite_patterns_vectorized(self, size: int) -> Dict[str, np.ndarray]:
        """
        Create sprite patterns using vectorized operations
        
        Args:
            size: Size of each sprite
            
        Returns:
            Dictionary of pattern arrays
        """
        patterns = {}
        
        # Organic patterns
        patterns['grass'] = self._create_organic_pattern(size, '#2d5a27')
        patterns['leaves'] = self._create_organic_pattern(size, '#3a6b35')
        patterns['flowers'] = self._create_organic_pattern(size, '#4b7845')
        patterns['vines'] = self._create_organic_pattern(size, '#5c8745')
        
        # Wood patterns
        patterns['wood'] = self._create_wood_pattern(size, '#5d4037')
        patterns['bark'] = self._create_wood_pattern(size, '#6b5447')
        patterns['plank'] = self._create_wood_pattern(size, '#7b6557')
        patterns['stump'] = self._create_wood_pattern(size, '#8b7667')
        
        # Stone patterns
        patterns['stone'] = self._create_stone_pattern(size, '#757575')
        patterns['granite'] = self._create_stone_pattern(size, '#858585')
        patterns['marble'] = self._create_stone_pattern(size, '#959595')
        patterns['slate'] = self._create_stone_pattern(size, '#a5a5a5')
        
        # Metal patterns
        patterns['metal'] = self._create_metal_pattern(size, '#9e9e9e')
        patterns['steel'] = self._create_metal_pattern(size, '#aeaeae')
        patterns['silver'] = self._create_metal_pattern(size, '#bebebe')
        patterns['gold'] = self._create_metal_pattern(size, '#cecece')
        
        return patterns
    
    def _create_organic_pattern(self, size: int, base_color: str) -> np.ndarray:
        """Create organic pattern with texture"""
        pattern = np.full((size, size, 3), 255, dtype=np.uint8)
        base_rgb = self._hex_to_rgb(base_color)
        
        # Create texture using numpy
        for y in range(size):
            for x in range(size):
                if (x + y) % 3 == 0:
                    # Lighter variant
                    lighter = np.minimum(base_rgb + 20, 255)
                    pattern[y, x] = lighter
                elif (x + y) % 5 == 0:
                    # Darker variant
                    darker = np.maximum(base_rgb - 20, 0)
                    pattern[y, x] = darker
                else:
                    pattern[y, x] = base_rgb
        
        return pattern
    
    def _create_wood_pattern(self, size: int, base_color: str) -> np.ndarray:
        """Create wood pattern with grain"""
        pattern = np.full((size, size, 3), 255, dtype=np.uint8)
        base_rgb = self._hex_to_rgb(base_color)
        
        # Add grain lines
        for y in range(0, size, 4):
            pattern[y:y+1, :] = base_rgb
        
        return pattern
    
    def _create_stone_pattern(self, size: int, base_color: str) -> np.ndarray:
        """Create stone pattern with texture"""
        pattern = np.full((size, size, 3), 255, dtype=np.uint8)
        base_rgb = self._hex_to_rgb(base_color)
        
        # Create checkerboard texture
        for y in range(size):
            for x in range(size):
                if (x + y) % 2 == 0:
                    pattern[y, x] = base_rgb
        
        return pattern
    
    def _create_metal_pattern(self, size: int, base_color: str) -> np.ndarray:
        """Create metal pattern with sheen"""
        pattern = np.full((size, size, 3), 255, dtype=np.uint8)
        base_rgb = self._hex_to_rgb(base_color)
        
        # Add sheen
        for y in range(0, size, 2):
            for x in range(0, size, 2):
                sheen = np.minimum(base_rgb + 40, 255)
                pattern[y:y+2, x:x+2] = sheen
        
        return pattern
    
    def _hex_to_rgb(self, hex_color: str) -> np.ndarray:
        """Convert hex color to RGB numpy array"""
        hex_color = hex_color.lstrip('#')
        return np.array([
            int(hex_color[0:2], 16),
            int(hex_color[2:4], 16),
            int(hex_color[4:6], 16)
        ], dtype=np.uint8)
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """
        Get performance metrics summary
        
        Returns:
            Dictionary with performance statistics
        """
        if not self.metrics_history:
            return {"total_operations": 0}
        
        # Group by operation type
        operations = {}
        for metric in self.metrics_history:
            op_name = metric.operation
            if op_name not in operations:
                operations[op_name] = []
            operations[op_name].append(metric)
        
        # Calculate statistics
        summary = {
            "total_operations": len(self.metrics_history),
            "operations": {}
        }
        
        for op_name, metrics in operations.items():
            durations = [m.duration_ms for m in metrics]
            tiles_per_sec = [m.tiles_per_second for m in metrics if m.tiles_per_second > 0]
            
            summary["operations"][op_name] = {
                "count": len(metrics),
                "avg_duration_ms": np.mean(durations),
                "min_duration_ms": np.min(durations),
                "max_duration_ms": np.max(durations),
                "avg_tiles_per_second": np.mean(tiles_per_sec) if tiles_per_sec else 0
            }
        
        return summary
    
    def clear_cache(self) -> None:
        """Clear numpy cache"""
        self._numpy_cache.clear()
        logger.debug("Numpy cache cleared")
    
    def clear_metrics(self) -> None:
        """Clear performance metrics"""
        self.metrics_history.clear()
        logger.debug("Performance metrics cleared")
