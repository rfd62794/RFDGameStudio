"""
Asset Parser Component
ADR 086: The Fault-Tolerant Asset Pipeline

Text-to-Data component - Reads YAML files into dictionaries.
If one file fails, the parser just skips it and moves to the next.
"""

import yaml
import logging
from pathlib import Path
from typing import Dict, List, Optional

# Configure logger for this module
logger = logging.getLogger(__name__)

class AssetParser:
    """Isolated YAML loader with fault tolerance"""
    
    def __init__(self, assets_path: Path):
        self.assets_path = assets_path
        self.parsed_data: Dict[str, Dict] = {}
        self.failed_files: List[str] = []
    
    def load_all_assets(self) -> Dict[str, Dict]:
        """Load all YAML files in the assets directory"""
        logger.info(f"📄 AssetParser: Loading from {self.assets_path}")
        
        # Get all YAML files
        yaml_files = list(self.assets_path.glob("*.yaml"))
        logger.info(f"📁 Found {len(yaml_files)} YAML files: {[f.name for f in yaml_files]}")
        
        # Load each file separately with fault tolerance
        for yaml_file in yaml_files:
            try:
                data = self._load_single_file(yaml_file)
                if data:
                    file_type = yaml_file.stem
                    self.parsed_data[file_type] = data
                    logger.info(f"✅ Loaded {file_type} from {yaml_file.name}")
                else:
                    logger.warning(f"⚠️ Empty file: {yaml_file.name}")
                    
            except Exception as e:
                self.failed_files.append(yaml_file.name)
                logger.error(f"💥 Failed to load {yaml_file.name}: {e}")
                # Continue loading other files (fault tolerance)
        
        # Report results
        loaded_count = len(self.parsed_data)
        total_count = len(yaml_files)
        
        logger.info(f"📄 AssetParser Results: {loaded_count}/{total_count} files loaded")
        
        if self.failed_files:
            logger.warning(f"⚠️ Failed files: {self.failed_files}")
        
        return self.parsed_data
    
    def _load_single_file(self, yaml_file: Path) -> Optional[Dict]:
        """Load a single YAML file with error handling"""
        if not yaml_file.exists():
            raise FileNotFoundError(f"Asset file not found: {yaml_file}")
        
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if data is None:
                return {}
            
            if not isinstance(data, dict):
                logger.warning(f"⚠️ {yaml_file.name} does not contain a dictionary")
                return {}
            
            return data
            
        except yaml.YAMLError as e:
            logger.error(f"💥 YAML syntax error in {yaml_file.name}: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Unexpected error loading {yaml_file.name}: {e}")
            raise
    
    def get_data(self, file_type: str) -> Dict:
        """Get parsed data for a specific file type"""
        return self.parsed_data.get(file_type, {})
    
    def has_file(self, file_type: str) -> bool:
        """Check if a file type was successfully loaded"""
        return file_type in self.parsed_data
    
    def get_loaded_files(self) -> List[str]:
        """Get list of successfully loaded file types"""
        return list(self.parsed_data.keys())
    
    def get_failed_files(self) -> List[str]:
        """Get list of files that failed to load"""
        return self.failed_files.copy()
    
    def validate_required_files(self, required_files: List[str]) -> bool:
        """Validate that required files were loaded"""
        missing_files = [f for f in required_files if not self.has_file(f)]
        
        if missing_files:
            logger.warning(f"⚠️ Missing required files: {missing_files}")
            return False
        
        logger.info("✅ All required files loaded")
        return True
    
    def _load_materials(self, data: Dict) -> None:
        """Load material definitions with inheritance support"""
        for material_id, material_data in data.items():
            if isinstance(material_data, dict):
                try:
                    # Handle inheritance
                    if 'inherits' in material_data:
                        parent_id = material_data['inherits']
                        parent_data = self.parsed_data.get('materials', {}).get(parent_id, {})
                        # Merge parent data with child data (child overrides parent)
                        merged_data = {**parent_data, **material_data}
                        # Remove inherits from merged data to avoid recursion
                        if 'inherits' in merged_data:
                            del merged_data['inherits']
                        # Use material_id as the key
                        material_def = MaterialDefinition(material_id, **merged_data)
                    else:
                        # No inheritance, use material_id as key
                        if 'material' in material_data:
                            material_data['material_id'] = material_data.pop('material')
                        material_def = MaterialDefinition(material_id, **material_data)
                    
                    self.registry[f"material_{material_id}"] = material_def
                    logger.debug(f"📦 Loaded material: {material_id}")
                    
                except Exception as e:
                    logger.error(f"💥 Failed to load material {material_id}: {e}")
                    # Create fallback material
                    try:
                        material_def = MaterialDefinition(material_id)
                        self.registry[f"material_{material_id}"] = material_def
                        logger.warning(f"⚠️ Created fallback material: {material_id}")
                    except Exception as e2:
                        logger.error(f"💥 Failed to create fallback material {material_id}: {e2}")
    
    def _load_objects(self, data: Dict) -> None:
        """Load object definitions with material linking"""
        for object_id, object_data in data.items():
            if isinstance(object_data, dict):
                try:
                    # Link material properties
                    material_id = object_data.get('material')
                    if material_id and material_id in self.parsed_data.get('materials', {}):
                        material_def = self.parsed_data['materials'][material_id]
                        if material_def:
                            # Merge material properties into object
                            self._merge_material_properties(object_data, material_def)
                    
                    # Create asset definition
                    asset_def = AssetDefinition(object_id, **object_data)
                    
                    self.registry[object_id] = asset_def
                    logger.debug(f"📦 Loaded object: {object_id}")
                except Exception as e:
                    logger.error(f"💥 Failed to load object {object_id}: {e}")
    
    def _load_animations(self, data: Dict) -> None:
        """Load animation definitions"""
        for animation_id, animation_data in data.items():
            if isinstance(animation_data, dict):
                try:
                    animation_def = AnimationDefinition(animation_id, **animation_data)
                    self.registry[f"animation_{animation_id}"] = animation_def
                    logger.debug(f"📦 Loaded animation: {animation_id}")
                except Exception as e:
                    logger.error(f"💥 Failed to load animation {animation_id}: {e}")
    
    def _load_entities(self, data: Dict) -> None:
        """Load entity definitions"""
        for entity_id, entity_data in data.items():
            if isinstance(entity_data, dict):
                try:
                    entity_def = EntityDefinition(entity_id, **entity_data)
                    self.registry[f"entity_{entity_id}"] = entity_def
                    logger.debug(f"📦 Loaded entity: {entity_id}")
                except Exception as e:
                    logger.error(f"💥 Failed to load entity {entity_id}: {e}")
    
    def _merge_material_properties(self, object_data: Dict, material_def) -> None:
        """Merge material properties into object data"""
        # Merge material tags
        material_tags = getattr(material_def, 'tags', [])
        object_tags = object_data.get('tags', [])
        object_data['tags'] = list(set(material_tags + object_tags))
        
        # Merge resistances and weaknesses
        material_resistances = getattr(material_def, 'resistances', [])
        material_weaknesses = getattr(material_def, 'weaknesses', [])
        
        # Add material properties to metadata for reference
        metadata = object_data.get('metadata', {})
        metadata['material_resistances'] = material_resistances
        metadata['material_weaknesses'] = material_weaknesses
        object_data['metadata'] = metadata
