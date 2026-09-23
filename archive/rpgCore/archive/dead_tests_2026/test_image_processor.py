"""
Test Image Processor - Comprehensive pytest test suite
ADR 101: Image Processing Component Testing
"""

import pytest
from PIL import Image
from pathlib import Path
import tempfile
import numpy as np
from unittest.mock import patch, MagicMock

from src.tools.image_processor import (
    ImageProcessor, ImageProcessingError, ImageDimensions
)
from src.tools.asset_models import SpriteSlice, GridConfiguration


class TestImageProcessor:
    """Test ImageProcessor class"""
    
    @pytest.fixture
    def processor(self) -> ImageProcessor:
        """Create ImageProcessor instance for testing"""
        return ImageProcessor()
    
    @pytest.fixture
    def sample_image(self) -> Image.Image:
        """Create sample image for testing"""
        return Image.new('RGB', (64, 64), '#ff0000')
    
    @pytest.fixture
    def temp_image_file(self, sample_image: Image.Image) -> Path:
        """Create temporary image file"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            sample_image.save(tmp.name, format='PNG')
            return Path(tmp.name)
    
    def test_load_image_success(self, processor: ImageProcessor, temp_image_file: Path) -> None:
        """Test successful image loading"""
        image = processor.load_image(temp_image_file)
        
        assert isinstance(image, Image.Image)
        assert image.mode == 'RGB'
        assert image.size == (64, 64)
    
    def test_load_image_file_not_found(self, processor: ImageProcessor) -> None:
        """Test loading non-existent file"""
        non_existent = Path("/non/existent/file.png")
        
        with pytest.raises(ImageProcessingError) as exc_info:
            processor.load_image(non_existent)
        
        assert "Image file not found" in str(exc_info.value)
    
    def test_load_image_unsupported_format(self, processor: ImageProcessor) -> None:
        """Test loading unsupported file format"""
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tmp:
            tmp.write(b"not an image")
            txt_file = Path(tmp.name)
        
        try:
            with pytest.raises(ImageProcessingError) as exc_info:
                processor.load_image(txt_file)
            
            assert "Unsupported image format" in str(exc_info.value)
        finally:
            txt_file.unlink()
    
    def test_load_image_corrupted_file(self, processor: ImageProcessor) -> None:
        """Test loading corrupted image file"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp.write(b"corrupted image data")
            corrupted_file = Path(tmp.name)
        
        try:
            with pytest.raises(ImageProcessingError):
                processor.load_image(corrupted_file)
        finally:
            corrupted_file.unlink()
    
    def test_get_image_dimensions(self, processor: ImageProcessor, sample_image: Image.Image) -> None:
        """Test getting image dimensions"""
        dimensions = processor.get_image_dimensions(sample_image)
        
        assert isinstance(dimensions, ImageDimensions)
        assert dimensions.width == 64
        assert dimensions.height == 64
        assert dimensions.area == 4096
        assert dimensions.to_tuple() == (64, 64)
    
    def test_calculate_grid_dimensions(self, processor: ImageProcessor, sample_image: Image.Image) -> None:
        """Test calculating grid dimensions"""
        cols, rows = processor.calculate_grid_dimensions(sample_image, 16)
        
        assert cols == 4  # 64 / 16
        assert rows == 4  # 64 / 16
    
    def test_calculate_grid_dimensions_too_small(self, processor: ImageProcessor) -> None:
        """Test grid calculation with image too small for tile size"""
        small_image = Image.new('RGB', (8, 8), '#ff0000')
        
        with pytest.raises(ImageProcessingError) as exc_info:
            processor.calculate_grid_dimensions(small_image, 16)
        
        assert "Image too small for tile size" in str(exc_info.value)
    
    def test_slice_grid_basic(self, processor: ImageProcessor, sample_image: Image.Image) -> None:
        """Test basic grid slicing"""
        config = GridConfiguration(
            tile_size=16,
            grid_cols=4,
            grid_rows=4,
            auto_detect=False
        )
        
        slices = processor.slice_grid(sample_image, config, "test_sheet")
        
        assert len(slices) == 16  # 4x4 grid
        
        # Check first slice
        first_slice = slices[0]
        assert isinstance(first_slice, SpriteSlice)
        assert first_slice.sheet_name == "test_sheet"
        assert first_slice.grid_x == 0
        assert first_slice.grid_y == 0
        assert first_slice.pixel_x == 0
        assert first_slice.pixel_y == 0
        assert first_slice.width == 16
        assert first_slice.height == 16
        assert first_slice.asset_id == "test_sheet_00_00"
        assert len(first_slice.palette) <= 4
    
    def test_slice_grid_auto_detect(self, processor: ImageProcessor, sample_image: Image.Image) -> None:
        """Test grid slicing with auto-detection"""
        config = GridConfiguration(
            tile_size=16,
            grid_cols=0,  # Will be auto-detected
            grid_rows=0,  # Will be auto-detected
            auto_detect=True
        )
        
        slices = processor.slice_grid(sample_image, config, "test_sheet")
        
        assert len(slices) == 16  # 4x4 grid
        assert config.grid_cols == 4
        assert config.grid_rows == 4
    
    def test_slice_grid_different_sizes(self, processor: ImageProcessor) -> None:
        """Test slicing with different tile sizes"""
        # Create larger image
        large_image = Image.new('RGB', (128, 64), '#00ff00')
        
        config = GridConfiguration(
            tile_size=32,
            grid_cols=4,
            grid_rows=2,
            auto_detect=False
        )
        
        slices = processor.slice_grid(large_image, config, "large_sheet")
        
        assert len(slices) == 8  # 4x2 grid
        
        # Check slice positions
        for i, slice_obj in enumerate(slices):
            expected_x = (i % 4) * 32
            expected_y = (i // 4) * 32
            assert slice_obj.pixel_x == expected_x
            assert slice_obj.pixel_y == expected_y
    
    def test_extract_palette_basic(self, processor: ImageProcessor) -> None:
        """Test basic palette extraction"""
        # Create image with known colors
        image = Image.new('RGB', (10, 10), '#ff0000')
        
        palette = processor._extract_palette(image)
        
        assert isinstance(palette, list)
        assert len(palette) <= 4
        assert all(color.startswith('#') and len(color) == 7 for color in palette)
    
    def test_extract_palette_complex_image(self, processor: ImageProcessor) -> None:
        """Test palette extraction from complex image"""
        # Create image with multiple colors
        image = Image.new('RGB', (20, 20))
        pixels = image.load()
        
        # Fill with different colors
        for x in range(20):
            for y in range(20):
                if x < 10 and y < 10:
                    pixels[x, y] = (255, 0, 0)  # Red
                elif x >= 10 and y < 10:
                    pixels[x, y] = (0, 255, 0)  # Green
                elif x < 10 and y >= 10:
                    pixels[x, y] = (0, 0, 255)  # Blue
                else:
                    pixels[x, y] = (255, 255, 255)  # White
        
        palette = processor._extract_palette(image)
        
        assert len(palette) >= 1
        assert len(palette) <= 4
    
    def test_get_dominant_color(self, processor: ImageProcessor) -> None:
        """Test dominant color extraction"""
        # Create image with mostly red
        image = Image.new('RGB', (20, 20), '#ff0000')
        pixels = image.load()
        
        # Add some blue pixels
        for i in range(5):
            pixels[i, i] = (0, 0, 255)
        
        dominant = processor._get_dominant_color(image)
        
        assert dominant == "#ff0000"  # Red should be dominant
    
    def test_convert_to_grayscale(self, processor: ImageProcessor, sample_image: Image.Image) -> None:
        """Test grayscale conversion"""
        grayscale = processor.convert_to_grayscale(sample_image)
        
        assert isinstance(grayscale, Image.Image)
        assert grayscale.mode == 'L'  # Grayscale mode
    
    def test_resize_for_display(self, processor: ImageProcessor, sample_image: Image.Image) -> None:
        """Test image resizing for display"""
        # Test zoom in
        resized = processor.resize_for_display(sample_image, 2.0)
        
        assert resized.size == (128, 128)  # 64 * 2
        
        # Test zoom out
        resized = processor.resize_for_display(sample_image, 0.5)
        
        assert resized.size == (32, 32)  # 64 * 0.5
    
    def test_resize_invalid_zoom(self, processor: ImageProcessor, sample_image: Image.Image) -> None:
        """Test resizing with invalid zoom level"""
        with pytest.raises(ImageProcessingError):
            processor.resize_for_display(sample_image, 0)
        
        with pytest.raises(ImageProcessingError):
            processor.resize_for_display(sample_image, -1)
    
    def test_create_sample_spritesheet(self, processor: ImageProcessor) -> None:
        """Test sample spritesheet creation"""
        spritesheet = processor.create_sample_spritesheet(64, 64, 16)
        
        assert isinstance(spritesheet, Image.Image)
        assert spritesheet.size == (64, 64)
        assert spritesheet.mode == 'RGB'
    
    def test_create_sample_spritesheet_custom_size(self, processor: ImageProcessor) -> None:
        """Test sample spritesheet with custom dimensions"""
        spritesheet = processor.create_sample_spritesheet(128, 96, 32)
        
        assert spritesheet.size == (128, 96)
    
    @patch('src.tools.image_processor.Image')
    def test_load_image_pil_error(self, mock_image_class: MagicMock, processor: ImageProcessor) -> None:
        """Test handling PIL errors during image loading"""
        # Mock PIL to raise an exception
        mock_image_class.open.side_effect = Exception("PIL error")
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp.write(b"fake image data")
            image_file = Path(tmp.name)
        
        try:
            with pytest.raises(ImageProcessingError):
                processor.load_image(image_file)
        finally:
            image_file.unlink()
    
    def test_extract_palette_fallback(self, processor: ImageProcessor) -> None:
        """Test palette extraction fallback behavior"""
        # Create a complex image that might cause issues
        image = Image.new('RGB', (1, 1), '#ff0000')  # Very small image
        
        # Mock getcolors to return None (edge case)
        with patch.object(image, 'getcolors', return_value=None):
            palette = processor._extract_palette(image)
            
            # Should fallback to dominant color
            assert len(palette) >= 1
            assert palette[0] == "#ff0000"
    
    def test_slice_grid_with_validation_error(self, processor: ImageProcessor) -> None:
        """Test grid slicing with validation errors"""
        sample_image = Image.new('RGB', (64, 64), '#ff0000')
        
        # Invalid config (zero grid dimensions without auto-detect)
        config = GridConfiguration(
            tile_size=16,
            grid_cols=0,
            grid_rows=0,
            auto_detect=False
        )
        
        with pytest.raises(ImageProcessingError):
            processor.slice_grid(sample_image, config, "test")


class TestImageDimensions:
    """Test ImageDimensions class"""
    
    def test_image_dimensions_properties(self) -> None:
        """Test ImageDimensions properties"""
        dimensions = ImageDimensions(width=100, height=200)
        
        assert dimensions.width == 100
        assert dimensions.height == 200
        assert dimensions.area == 20000
        assert dimensions.to_tuple() == (100, 200)


class TestImageProcessorIntegration:
    """Integration tests for ImageProcessor"""
    
    def test_complete_workflow(self) -> None:
        """Test complete image processing workflow"""
        processor = ImageProcessor()
        
        # Create sample spritesheet
        spritesheet = processor.create_sample_spritesheet(64, 64, 16)
        
        # Get dimensions
        dimensions = processor.get_image_dimensions(spritesheet)
        assert dimensions.to_tuple() == (64, 64)
        
        # Calculate grid
        cols, rows = processor.calculate_grid_dimensions(spritesheet, 16)
        assert cols == 4 and rows == 4
        
        # Slice grid
        config = GridConfiguration(tile_size=16, grid_cols=4, grid_rows=4)
        slices = processor.slice_grid(spritesheet, config, "integration_test")
        
        assert len(slices) == 16
        
        # Test resize for display
        display_image = processor.resize_for_display(spritesheet, 2.0)
        assert display_image.size == (128, 128)
        
        # Test grayscale conversion
        grayscale = processor.convert_to_grayscale(spritesheet)
        assert grayscale.mode == 'L'
        
        # Verify slice data
        for slice_obj in slices:
            assert slice_obj.width == 16
            assert slice_obj.height == 16
            assert len(slice_obj.palette) >= 1
            assert slice_obj.asset_id.startswith("integration_test_")
    
    def test_error_recovery_workflow(self) -> None:
        """Test error handling and recovery"""
        processor = ImageProcessor()
        
        # Try to load non-existent file
        try:
            processor.load_image(Path("/non/existent.png"))
            assert False, "Should have raised ImageProcessingError"
        except ImageProcessingError as e:
            assert "Image file not found" in str(e)
        
        # Should still be able to create sample spritesheet
        spritesheet = processor.create_sample_spritesheet()
        assert isinstance(spritesheet, Image.Image)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
