"""
Asset Exporter - SOLID asset export component
ADR 097: Type-Safe Asset Export Pipeline
"""

from pathlib import Path
from typing import Dict, List, Optional
import yaml
from PIL import Image
from loguru import logger

from .asset_models import (
    HarvestedAsset, AssetExportConfig, ProcessingResult, 
    AssetMetadata, SpriteSlice
)
from .image_processor import ImageProcessor


class AssetExportError(Exception):
    """Custom exception for asset export errors"""
    pass


class AssetExporter:
    """SOLID asset export component for saving processed assets"""
    
    def __init__(self, image_processor: ImageProcessor):
        self.image_processor = image_processor
        logger.debug("AssetExporter initialized")
    
    def export_assets(self, assets: List[HarvestedAsset], 
                     config: AssetExportConfig) -> ProcessingResult:
        """
        Export harvested assets to files
        
        Args:
            assets: List of harvested assets
            config: Export configuration
            
        Returns:
            ProcessingResult with export status
        """
        result = ProcessingResult(success=True)
        
        try:
            # Create export directories
            self._create_export_directories(config)
            
            # Export images
            image_export_count = self._export_images(assets, config, result)
            
            # Export YAML metadata
            yaml_export_count = self._export_yaml_metadata(assets, config, result)
            
            # Update result
            result.assets_processed = len(assets)
            result.export_path = config.export_directory
            
            logger.info(
                f"Export complete: {image_export_count} images, "
                f"{yaml_export_count} YAML entries to {config.export_directory}"
            )
            
        except Exception as e:
            result.add_error(f"Export failed: {e}")
            logger.error(f"Asset export failed: {e}")
        
        return result
    
    def _create_export_directories(self, config: AssetExportConfig) -> None:
        """Create necessary export directories"""
        try:
            config.export_directory.mkdir(parents=True, exist_ok=True)
            
            images_dir = config.export_directory / config.image_subdirectory
            images_dir.mkdir(exist_ok=True)
            
            logger.debug(f"Created export directories in {config.export_directory}")
            
        except Exception as e:
            raise AssetExportError(f"Failed to create export directories: {e}")
    
    def _export_images(self, assets: List[HarvestedAsset], 
                      config: AssetExportConfig, result: ProcessingResult) -> int:
        """Export asset images to files"""
        images_dir = config.export_directory / config.image_subdirectory
        exported_count = 0
        
        for asset in assets:
            try:
                # Determine which image to export
                export_image = self._prepare_export_image(asset, config)
                
                # Save image
                image_path = images_dir / f"{asset.asset_id}.png"
                export_image.save(image_path, format='PNG')
                
                exported_count += 1
                logger.debug(f"Exported image: {image_path.name}")
                
            except Exception as e:
                error_msg = f"Failed to export image {asset.asset_id}: {e}"
                result.add_error(error_msg)
                logger.error(error_msg)
        
        return exported_count
    
    def _prepare_export_image(self, asset: HarvestedAsset, 
                             config: AssetExportConfig) -> Image.Image:
        """Prepare image for export"""
        # Get the base sprite image (this would need to be stored in the asset)
        # For now, we'll assume the sprite slice has an image attribute
        # In a real implementation, this would be handled differently
        
        # This is a placeholder - in the actual implementation,
        # we'd need to pass the PIL Image through the processing chain
        raise NotImplementedError("Image preparation needs to be integrated with processing chain")
    
    def _export_yaml_metadata(self, assets: List[HarvestedAsset], 
                             config: AssetExportConfig, result: ProcessingResult) -> int:
        """Export asset metadata to YAML file"""
        yaml_path = config.export_directory / config.yaml_filename
        
        try:
            # Convert assets to YAML format
            yaml_data = self._convert_assets_to_yaml(assets)
            
            # Save YAML file
            with open(yaml_path, 'w', encoding='utf-8') as f:
                yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)
            
            logger.debug(f"Exported YAML metadata: {yaml_path.name}")
            return len(yaml_data)
            
        except Exception as e:
            error_msg = f"Failed to export YAML metadata: {e}"
            result.add_error(error_msg)
            logger.error(error_msg)
            return 0
    
    def _convert_assets_to_yaml(self, assets: List[HarvestedAsset]) -> Dict[str, Dict]:
        """Convert assets to YAML-compatible format"""
        yaml_data = {}
        
        for asset in assets:
            sprite_data = {
                'asset_id': asset.asset_id,
                'asset_type': asset.metadata.asset_type.value,
                'material_id': asset.metadata.material_id.value,
                'description': asset.metadata.description,
                'tags': asset.metadata.tags,
                'collision': asset.metadata.collision,
                'interaction_hooks': asset.metadata.interaction_hooks,
                'd20_checks': asset.metadata.d20_checks,
                'palette': asset.sprite_slice.palette,
                'source_sheet': asset.sprite_slice.sheet_name,
                'grid_position': [asset.sprite_slice.grid_x, asset.sprite_slice.grid_y],
                'pixel_position': [asset.sprite_slice.pixel_x, asset.sprite_slice.pixel_y],
                'dimensions': [asset.sprite_slice.width, asset.sprite_slice.height]
            }
            
            yaml_data[asset.asset_id] = sprite_data
        
        return yaml_data
    
    def export_single_asset(self, asset: HarvestedAsset, 
                           config: AssetExportConfig) -> ProcessingResult:
        """
        Export a single asset
        
        Args:
            asset: Single harvested asset
            config: Export configuration
            
        Returns:
            ProcessingResult for single asset export
        """
        return self.export_assets([asset], config)
    
    def validate_export_config(self, config: AssetExportConfig) -> List[str]:
        """
        Validate export configuration
        
        Args:
            config: Export configuration to validate
            
        Returns:
            List of validation errors
        """
        errors = []
        
        # Check if export directory is writable
        try:
            config.export_directory.mkdir(parents=True, exist_ok=True)
            # Test write permission
            test_file = config.export_directory / ".write_test"
            test_file.touch()
            test_file.unlink()
        except Exception as e:
            errors.append(f"Export directory not writable: {e}")
        
        # Validate YAML filename
        if not config.yaml_filename.endswith('.yaml'):
            errors.append("YAML filename must end with .yaml")
        
        # Validate image subdirectory name
        if not config.image_subdirectory or len(config.image_subdirectory.strip()) == 0:
            errors.append("Image subdirectory name cannot be empty")
        
        return errors
    
    def get_export_summary(self, config: AssetExportConfig) -> Dict[str, str]:
        """
        Get export configuration summary
        
        Args:
            config: Export configuration
            
        Returns:
            Dictionary with configuration summary
        """
        return {
            'export_directory': str(config.export_directory),
            'yaml_file': str(config.export_directory / config.yaml_filename),
            'images_directory': str(config.export_directory / config.image_subdirectory),
            'include_grayscale': str(config.include_grayscale),
            'total_files_expected': "N/A"  # Would be calculated based on assets
        }


class SovereignAssetExporter(AssetExporter):
    """Specialized exporter for DGT Sovereign Registry format"""
    
    def _convert_assets_to_yaml(self, assets: List[HarvestedAsset]) -> Dict[str, Dict]:
        """Convert assets to DGT Sovereign Registry format"""
        yaml_data = {}
        
        for asset in assets:
            # DGT-specific format
            sprite_data = {
                'id': asset.asset_id,
                'object_type': asset.metadata.asset_type.value,
                'version': '2.0',  # DGT version
                'name': asset.asset_id.replace('_', ' ').title(),
                'description': asset.metadata.description,
                'material_id': asset.metadata.material_id.value,
                'tags': asset.metadata.tags,
                'collision': asset.metadata.collision,
                'interaction_hooks': asset.metadata.interaction_hooks,
                'd20_checks': asset.metadata.d20_checks,
                'components': {
                    'sprite': {
                        'palette': asset.sprite_slice.palette,
                        'source_sheet': asset.sprite_slice.sheet_name,
                        'grid_position': asset.sprite_slice.grid_position,
                        'pixel_position': [asset.sprite_slice.pixel_x, asset.sprite_slice.pixel_y],
                        'dimensions': [asset.sprite_slice.width, asset.sprite_slice.height]
                    }
                }
            }
            
            yaml_data[asset.asset_id] = sprite_data
        
        return yaml_data
