"""
Test Asset Models - Comprehensive pytest test suite
ADR 100: Type-Safe Model Testing
"""

import pytest
from pydantic import ValidationError
from pathlib import Path
from typing import List

from src.tools.asset_models import (
    SpriteSlice, AssetMetadata, HarvestedAsset, AssetExportConfig,
    ProcessingResult, GridConfiguration, AssetType, MaterialType
)


class TestSpriteSlice:
    """Test SpriteSlice model validation and behavior"""
    
    def test_valid_sprite_slice(self) -> None:
        """Test creating valid SpriteSlice"""
        sprite = SpriteSlice(
            sheet_name="test_sheet",
            grid_x=0,
            grid_y=1,
            pixel_x=16,
            pixel_y=32,
            width=16,
            height=16,
            asset_id="test_sheet_00_01",
            palette=["#ff0000", "#00ff00", "#0000ff", "#ffffff"]
        )
        
        assert sprite.sheet_name == "test_sheet"
        assert sprite.grid_x == 0
        assert sprite.grid_y == 1
        assert sprite.asset_id == "test_sheet_00_01"
        assert len(sprite.palette) == 4
        assert sprite.width == 16
        assert sprite.height == 16
    
    def test_invalid_hex_color(self) -> None:
        """Test invalid hex color validation"""
        with pytest.raises(ValidationError) as exc_info:
            SpriteSlice(
                sheet_name="test",
                grid_x=0,
                grid_y=0,
                pixel_x=0,
                pixel_y=0,
                width=16,
                height=16,
                asset_id="test",
                palette=["invalid_color", "#ff0000"]
            )
        
        assert "Invalid hex color format" in str(exc_info.value)
    
    def test_empty_asset_id(self) -> None:
        """Test empty asset ID validation"""
        with pytest.raises(ValidationError) as exc_info:
            SpriteSlice(
                sheet_name="test",
                grid_x=0,
                grid_y=0,
                pixel_x=0,
                pixel_y=0,
                width=16,
                height=16,
                asset_id="",
                palette=["#ff0000"]
            )
        
        assert "Asset ID cannot be empty" in str(exc_info.value)
    
    def test_too_long_asset_id(self) -> None:
        """Test asset ID length validation"""
        long_id = "a" * 101  # 101 characters, over the limit
        
        with pytest.raises(ValidationError) as exc_info:
            SpriteSlice(
                sheet_name="test",
                grid_x=0,
                grid_y=0,
                pixel_x=0,
                pixel_y=0,
                width=16,
                height=16,
                asset_id=long_id,
                palette=["#ff0000"]
            )
        
        assert "Asset ID too long" in str(exc_info.value)
    
    def test_palette_size_limits(self) -> None:
        """Test palette size validation"""
        # Test empty palette
        with pytest.raises(ValidationError):
            SpriteSlice(
                sheet_name="test",
                grid_x=0,
                grid_y=0,
                pixel_x=0,
                pixel_y=0,
                width=16,
                height=16,
                asset_id="test",
                palette=[]
            )
        
        # Test too many colors
        with pytest.raises(ValidationError):
            SpriteSlice(
                sheet_name="test",
                grid_x=0,
                grid_y=0,
                pixel_x=0,
                pixel_y=0,
                width=16,
                height=16,
                asset_id="test",
                palette=["#ff0000"] * 5  # 5 colors, over the limit
            )
    
    def test_negative_coordinates(self) -> None:
        """Test negative coordinate validation"""
        with pytest.raises(ValidationError):
            SpriteSlice(
                sheet_name="test",
                grid_x=-1,  # Negative
                grid_y=0,
                pixel_x=0,
                pixel_y=0,
                width=16,
                height=16,
                asset_id="test",
                palette=["#ff0000"]
            )


class TestAssetMetadata:
    """Test AssetMetadata model validation and behavior"""
    
    def test_valid_asset_metadata(self) -> None:
        """Test creating valid AssetMetadata"""
        metadata = AssetMetadata(
            asset_id="test_asset",
            asset_type=AssetType.ACTOR,
            material_id=MaterialType.WOOD,
            description="A test wooden actor",
            tags=["wooden", "test", "actor"],
            collision=True,
            interaction_hooks=["on_click", "on_use"],
            d20_checks={"strength": 10, "dexterity": 12}
        )
        
        assert metadata.asset_id == "test_asset"
        assert metadata.asset_type == AssetType.ACTOR
        assert metadata.material_id == MaterialType.WOOD
        assert metadata.collision is True
        assert len(metadata.tags) == 3
        assert len(metadata.interaction_hooks) == 2
    
    def test_tag_validation(self) -> None:
        """Test tag validation and cleaning"""
        metadata = AssetMetadata(
            asset_id="test",
            asset_type=AssetType.OBJECT,
            material_id=MaterialType.ORGANIC,
            description="Test",
            tags=["  Test  ", "test", "TEST", "", "  ", "a" * 51],  # Varied case, empty, too long
            collision=False,
            interaction_hooks=[],
            d20_checks={}
        )
        
        # Should clean and deduplicate tags
        expected_tags = ["test"]  # Only valid, cleaned tag
        assert metadata.tags == expected_tags
    
    def test_interaction_hook_validation(self) -> None:
        """Test interaction hook validation"""
        metadata = AssetMetadata(
            asset_id="test",
            asset_type=AssetType.OBJECT,
            material_id=MaterialType.ORGANIC,
            description="Test",
            tags=[],
            collision=False,
            interaction_hooks=["on_click", "invalid_hook", "ON_CLICK", "on_use"],  # Mix of valid/invalid
            d20_checks={}
        )
        
        # Should only include valid hooks
        expected_hooks = ["on_click", "on_use"]
        assert metadata.interaction_hooks == expected_hooks
    
    def test_description_length_validation(self) -> None:
        """Test description length validation"""
        # Test empty description
        with pytest.raises(ValidationError):
            AssetMetadata(
                asset_id="test",
                asset_type=AssetType.OBJECT,
                material_id=MaterialType.ORGANIC,
                description="",  # Empty
                tags=[],
                collision=False,
                interaction_hooks=[],
                d20_checks={}
            )
        
        # Test too long description
        long_desc = "a" * 501  # 501 characters, over the limit
        with pytest.raises(ValidationError):
            AssetMetadata(
                asset_id="test",
                asset_type=AssetType.OBJECT,
                material_id=MaterialType.ORGANIC,
                description=long_desc,
                tags=[],
                collision=False,
                interaction_hooks=[],
                d20_checks={}
            )


class TestHarvestedAsset:
    """Test HarvestedAsset model"""
    
    def test_harvested_asset_creation(self) -> None:
        """Test creating HarvestedAsset"""
        sprite_slice = SpriteSlice(
            sheet_name="test_sheet",
            grid_x=2,
            grid_y=3,
            pixel_x=32,
            pixel_y=48,
            width=16,
            height=16,
            asset_id="test_sheet_02_03",
            palette=["#ff0000", "#00ff00"]
        )
        
        metadata = AssetMetadata(
            asset_id="test_sheet_02_03",
            asset_type=AssetType.OBJECT,
            material_id=MaterialType.STONE,
            description="Stone tile from test sheet",
            tags=["stone", "test"],
            collision=True,
            interaction_hooks=["on_collision"],
            d20_checks={}
        )
        
        asset = HarvestedAsset(
            sprite_slice=sprite_slice,
            metadata=metadata
        )
        
        assert asset.asset_id == "test_sheet_02_03"
        assert asset.grid_position == (2, 3)
        assert asset.metadata.material_id == MaterialType.STONE
    
    def test_asset_id_mismatch(self) -> None:
        """Test asset ID mismatch between sprite and metadata"""
        sprite_slice = SpriteSlice(
            sheet_name="test",
            grid_x=0,
            grid_y=0,
            pixel_x=0,
            pixel_y=0,
            width=16,
            height=16,
            asset_id="sprite_id",
            palette=["#ff0000"]
        )
        
        metadata = AssetMetadata(
            asset_id="metadata_id",  # Different ID
            asset_type=AssetType.OBJECT,
            material_id=MaterialType.ORGANIC,
            description="Test",
            tags=[],
            collision=False,
            interaction_hooks=[],
            d20_checks={}
        )
        
        # This should still work - the asset_id property comes from sprite_slice
        asset = HarvestedAsset(sprite_slice=sprite_slice, metadata=metadata)
        assert asset.asset_id == "sprite_id"


class TestAssetExportConfig:
    """Test AssetExportConfig model"""
    
    def test_valid_export_config(self) -> None:
        """Test creating valid export configuration"""
        config = AssetExportConfig(
            export_directory=Path("/tmp/export"),
            include_grayscale=True,
            yaml_filename="assets.yaml",
            image_subdirectory="images"
        )
        
        assert config.export_directory == Path("/tmp/export")
        assert config.include_grayscale is True
        assert config.yaml_filename == "assets.yaml"
        assert config.image_subdirectory == "images"
    
    def test_relative_path_validation(self) -> None:
        """Test relative path validation"""
        with pytest.raises(ValidationError) as exc_info:
            AssetExportConfig(
                export_directory=Path("relative/path"),  # Relative path
                yaml_filename="test.yaml"
            )
        
        assert "Export directory must be absolute path" in str(exc_info.value)
    
    def test_yaml_filename_validation(self) -> None:
        """Test YAML filename validation"""
        with pytest.raises(ValidationError) as exc_info:
            AssetExportConfig(
                export_directory=Path("/tmp"),
                yaml_filename="test.txt"  # Not .yaml
            )
        
        assert "YAML filename must end with .yaml" in str(exc_info.value)


class TestProcessingResult:
    """Test ProcessingResult model"""
    
    def test_successful_result(self) -> None:
        """Test creating successful processing result"""
        result = ProcessingResult(
            success=True,
            assets_processed=10,
            errors=[],
            warnings=["Minor warning"],
            export_path=Path("/tmp/export")
        )
        
        assert result.success is True
        assert result.assets_processed == 10
        assert len(result.errors) == 0
        assert len(result.warnings) == 1
        assert result.export_path == Path("/tmp/export")
    
    def test_failed_result(self) -> None:
        """Test creating failed processing result"""
        result = ProcessingResult(
            success=False,
            assets_processed=0,
            errors=["Critical error occurred"],
            warnings=["Warning message"]
        )
        
        assert result.success is False
        assert result.assets_processed == 0
        assert len(result.errors) == 1
        assert len(result.warnings) == 1
    
    def test_add_error(self) -> None:
        """Test adding error to result"""
        result = ProcessingResult(success=True)
        
        result.add_error("New error")
        
        assert result.success is False
        assert len(result.errors) == 1
        assert "New error" in result.errors
    
    def test_add_warning(self) -> None:
        """Test adding warning to result"""
        result = ProcessingResult(success=True)
        
        result.add_warning("New warning")
        
        assert len(result.warnings) == 1
        assert "New warning" in result.warnings
        assert result.success is True  # Warnings don't affect success


class TestGridConfiguration:
    """Test GridConfiguration model"""
    
    def test_valid_grid_config(self) -> None:
        """Test creating valid grid configuration"""
        config = GridConfiguration(
            tile_size=16,
            grid_cols=4,
            grid_rows=8,
            auto_detect=False
        )
        
        assert config.tile_size == 16
        assert config.grid_cols == 4
        assert config.grid_rows == 8
        assert config.auto_detect is False
    
    def test_tile_size_validation(self) -> None:
        """Test tile size validation (must be power of 2)"""
        # Test non-power of 2
        with pytest.raises(ValidationError) as exc_info:
            GridConfiguration(
                tile_size=15,  # Not power of 2
                grid_cols=4,
                grid_rows=4
            )
        
        assert "Tile size must be a positive power of 2" in str(exc_info.value)
        
        # Test negative size
        with pytest.raises(ValidationError):
            GridConfiguration(
                tile_size=-16,
                grid_cols=4,
                grid_rows=4
            )
        
        # Test zero size
        with pytest.raises(ValidationError):
            GridConfiguration(
                tile_size=0,
                grid_cols=4,
                grid_rows=4
            )
    
    def test_valid_power_of_2_sizes(self) -> None:
        """Test valid power of 2 tile sizes"""
        valid_sizes = [1, 2, 4, 8, 16, 32, 64, 128, 256]
        
        for size in valid_sizes:
            config = GridConfiguration(
                tile_size=size,
                grid_cols=2,
                grid_rows=2
            )
            assert config.tile_size == size
    
    def test_grid_dimensions_validation(self) -> None:
        """Test grid dimensions validation"""
        # Test zero dimensions
        with pytest.raises(ValidationError):
            GridConfiguration(
                tile_size=16,
                grid_cols=0,
                grid_rows=4
            )
        
        with pytest.raises(ValidationError):
            GridConfiguration(
                tile_size=16,
                grid_cols=4,
                grid_rows=0
            )


class TestModelIntegration:
    """Test integration between models"""
    
    def test_complete_asset_workflow(self) -> None:
        """Test complete asset creation workflow"""
        # Create sprite slice
        sprite = SpriteSlice(
            sheet_name="characters",
            grid_x=1,
            grid_y=2,
            pixel_x=16,
            pixel_y=32,
            width=16,
            height=16,
            asset_id="characters_01_02",
            palette=["#ff0000", "#00ff00", "#0000ff"]
        )
        
        # Create metadata
        metadata = AssetMetadata(
            asset_id="characters_01_02",
            asset_type=AssetType.ACTOR,
            material_id=MaterialType.ORGANIC,
            description="Character sprite from sheet",
            tags=["character", "organic"],
            collision=False,
            interaction_hooks=["on_click"],
            d20_checks={"health": 100}
        )
        
        # Create harvested asset
        asset = HarvestedAsset(sprite_slice=sprite, metadata=metadata)
        
        # Create export config
        config = AssetExportConfig(
            export_directory=Path("/tmp/test_export"),
            yaml_filename="characters.yaml"
        )
        
        # Verify all components work together
        assert asset.asset_id == "characters_01_02"
        assert asset.grid_position == (1, 2)
        assert config.yaml_filename == "characters.yaml"
        assert len(asset.sprite_slice.palette) == 3
        assert asset.metadata.asset_type == AssetType.ACTOR


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
