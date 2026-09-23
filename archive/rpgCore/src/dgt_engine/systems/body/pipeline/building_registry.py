"""
Building Registry - Manages connection to archived building assets
Bridges the 72 building_*.yaml files from archive to the new AssetLoader
"""

from pathlib import Path
from typing import Dict, List, Optional, Any
from loguru import logger

from .asset_loader import AssetLoader, AssetMetadata
from dgt_engine.foundation.types import Result


class BuildingRegistry:
    """Registry for managing building assets from archive"""
    
    def __init__(self, asset_loader: AssetLoader, archive_path: Optional[Path] = None):
        self.asset_loader = asset_loader
        self.archive_path = archive_path or Path("archive/legacy_refactor_2026/assets/harvested")
        self.building_cache: Dict[str, Dict[str, Any]] = {}
        
        logger.info(f"🏢 BuildingRegistry initialized with archive path: {self.archive_path}")
    
    def load_all_buildings(self) -> Result[List[Dict[str, Any]]]:
        """Load all building configurations from archive"""
        try:
            if not self.archive_path.exists():
                return Result(success=False, error=f"Archive path not found: {self.archive_path}")
            
            buildings = []
            building_files = list(self.archive_path.glob("building_*.yaml"))
            
            logger.info(f"🏢 Found {len(building_files)} building files in archive")
            
            for building_file in building_files:
                result = self._load_single_building(building_file)
                
                if result.success:
                    building_data = result.value
                    buildings.append(building_data)
                    self.building_cache[building_data['object_id']] = building_data
                    logger.debug(f"✅ Loaded building: {building_data['object_id']}")
                else:
                    logger.warning(f"⚠️ Failed to load building {building_file}: {result.error}")
            
            logger.info(f"🏢 Successfully loaded {len(buildings)} buildings from archive")
            return Result(success=True, value=buildings)
            
        except Exception as e:
            error_msg = f"Failed to load buildings from archive: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def _load_single_building(self, building_file: Path) -> Result[Dict[str, Any]]:
        """Load a single building configuration file"""
        try:
            import yaml
            
            # Safe YAML loader that ignores Python-specific tags
            class SafeLoaderIgnorePython(yaml.SafeLoader):
                def ignore_python_tags(self, node):
                    return None
            
            SafeLoaderIgnorePython.add_constructor(
                'tag:yaml.org,2002:python/tuple',
                SafeLoaderIgnorePython.ignore_python_tags
            )
            
            with open(building_file, 'r', encoding='utf-8') as f:
                building_data = yaml.load(f, SafeLoaderIgnorePython)
            
            # Validate building structure
            validation = self._validate_building_data(building_data)
            if not validation.success:
                return Result(success=False, error=validation.error)
            
            # Add file path information
            building_data['source_file'] = str(building_file)
            building_data['relative_path'] = str(building_file.relative_to(self.archive_path))
            
            return Result(success=True, value=building_data)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load building file {building_file}: {str(e)}")
    
    def _validate_building_data(self, building_data: Dict[str, Any]) -> Result[bool]:
        """Validate building data structure"""
        required_fields = ['object_id', 'object_type', 'dimensions']
        
        for field in required_fields:
            if field not in building_data:
                return Result(success=False, error=f"Missing required field: {field}")
        
        # Validate dimensions
        dimensions = building_data['dimensions']
        if not isinstance(dimensions, dict) or 'width' not in dimensions or 'height' not in dimensions:
            return Result(success=False, error="Invalid dimensions format")
        
        width, height = dimensions['width'], dimensions['height']
        if not isinstance(width, int) or not isinstance(height, int):
            return Result(success=False, error="Dimension values must be integers")
        
        if width <= 0 or height <= 0:
            return Result(success=False, error="Dimension values must be positive")
        
        return Result(success=True, value=True)
    
    def get_building_by_id(self, object_id: str) -> Optional[Dict[str, Any]]:
        """Get building data by object ID"""
        return self.building_cache.get(object_id)
    
    def get_buildings_by_type(self, object_type: str) -> List[Dict[str, Any]]:
        """Get all buildings of a specific type"""
        return [b for b in self.building_cache.values() if b.get('object_type') == object_type]
    
    def get_buildings_by_material(self, material_id: str) -> List[Dict[str, Any]]:
        """Get all buildings with specific material"""
        return [b for b in self.building_cache.values() if b.get('material_id') == material_id]
    
    def get_building_count(self) -> int:
        """Get total number of loaded buildings"""
        return len(self.building_cache)
    
    def list_building_types(self) -> List[str]:
        """Get list of all building types"""
        types = set()
        for building in self.building_cache.values():
            if 'object_type' in building:
                types.add(building['object_type'])
        return sorted(list(types))
    
    def list_materials(self) -> List[str]:
        """Get list of all material IDs"""
        materials = set()
        for building in self.building_cache.values():
            if 'material_id' in building:
                materials.add(building['material_id'])
        return sorted(list(materials))
    
    def get_buildings_with_sprites(self) -> List[Dict[str, Any]]:
        """Get buildings that have sprite paths"""
        return [b for b in self.building_cache.values() if 'sprite_path' in b]
    
    def get_buildings_with_collision(self) -> List[Dict[str, Any]]:
        """Get buildings that have collision enabled"""
        return [b for b in self.building_cache.values() if b.get('collision', False)]
    
    def get_auto_detected_buildings(self) -> List[Dict[str, Any]]:
        """Get buildings that were auto-detected"""
        return [b for b in self.building_cache.values() if b.get('auto_detected', False)]
    
    def get_baked_buildings(self) -> List[Dict[str, Any]]:
        """Get buildings that are baked"""
        return [b for b in self.building_cache.values() if b.get('is_baked', False)]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get building registry statistics"""
        stats = {
            'total_buildings': len(self.building_cache),
            'by_type': {},
            'by_material': {},
            'with_sprites': 0,
            'with_collision': 0,
            'auto_detected': 0,
            'baked': 0
        }
        
        for building in self.building_cache.values():
            # Count by type
            obj_type = building.get('object_type', 'unknown')
            if obj_type not in stats['by_type']:
                stats['by_type'][obj_type] = 0
            stats['by_type'][obj_type] += 1
            
            # Count by material
            material = building.get('material_id', 'unknown')
            if material not in stats['by_material']:
                stats['by_material'][material] = 0
            stats['by_material'][material] += 1
            
            # Count properties
            if 'sprite_path' in building:
                stats['with_sprites'] += 1
            if building.get('collision', False):
                stats['with_collision'] += 1
            if building.get('auto_detected', False):
                stats['auto_detected'] += 1
            if building.get('is_baked', False):
                stats['baked'] += 1
        
        return stats
    
    def export_registry_summary(self, output_path: Path) -> Result[bool]:
        """Export registry summary to JSON file"""
        try:
            import json
            
            summary = {
                'registry_info': {
                    'archive_path': str(self.archive_path),
                    'total_buildings': len(self.building_cache),
                    'generated_at': str(Path.cwd())
                },
                'statistics': self.get_statistics(),
                'building_types': self.list_building_types(),
                'materials': self.list_materials(),
                'buildings': []
            }
            
            # Add summary info for each building
            for building_id, building_data in self.building_cache.items():
                building_summary = {
                    'object_id': building_data['object_id'],
                    'object_type': building_data.get('object_type'),
                    'material_id': building_data.get('material_id'),
                    'dimensions': building_data.get('dimensions'),
                    'has_sprite': 'sprite_path' in building_data,
                    'collision': building_data.get('collision', False),
                    'auto_detected': building_data.get('auto_detected', False),
                    'is_baked': building_data.get('is_baked', False)
                }
                summary['buildings'].append(building_summary)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2)
            
            logger.info(f"📄 Exported registry summary to {output_path}")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to export registry summary: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def clear_cache(self) -> None:
        """Clear the building cache"""
        self.building_cache.clear()
        logger.info("🗑️ Cleared building registry cache")
