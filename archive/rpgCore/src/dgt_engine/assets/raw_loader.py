"""
Raw File Loader - ADR 089 Implementation
Dwarf Fortress style discovery and loading system
"""

from pathlib import Path
from typing import Dict, List, Optional, Set, Pattern
import re
from loguru import logger
from .sovereign_schema import (
    RawFileLoader, 
    SovereignObject, 
    SafetyArchetypes,
    ParserFactory
)

class RawFileDiscovery:
    """Dwarf Fortress style raw file discovery system"""
    
    def __init__(self, raw_directory: Path):
        self.raw_directory = Path(raw_directory)
        self.object_headers: Dict[str, Pattern] = {
            'material': re.compile(r'\[OBJECT:MATERIAL\]', re.IGNORECASE),
            'template': re.compile(r'\[OBJECT:TEMPLATE\]', re.IGNORECASE),
            'creature': re.compile(r'\[OBJECT:CREATURE\]', re.IGNORECASE),
            'item': re.compile(r'\[OBJECT:ITEM\]', re.IGNORECASE),
            'entity': re.compile(r'\[OBJECT:ENTITY\]', re.IGNORECASE)
        }
        
    def discover_raw_files(self) -> Dict[str, List[Path]]:
        """Discover all raw files and categorize by content"""
        discovered_files = {obj_type: [] for obj_type in self.object_headers.keys()}
        discovered_files['unknown'] = []
        
        if not self.raw_directory.exists():
            logger.warning(f"Raw directory not found: {self.raw_directory}")
            return discovered_files
        
        logger.info(f"Discovering raw files in: {self.raw_directory}")
        
        # Scan all .txt and .yaml files
        for file_path in self.raw_directory.glob("*"):
            if file_path.suffix.lower() in ['.txt', '.yaml', '.yml']:
                category = self._categorize_file(file_path)
                discovered_files[category].append(file_path)
                logger.debug(f"Categorized {file_path.name} as {category}")
        
        # Log discovery summary
        total_files = sum(len(files) for files in discovered_files.values())
        logger.info(f"Discovered {total_files} raw files")
        
        for category, files in discovered_files.items():
            if files:
                logger.info(f"  {category}: {len(files)} files")
        
        return discovered_files
    
    def _categorize_file(self, file_path: Path) -> str:
        """Categorize file by content analysis"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(1024)  # Read first 1KB for categorization
                
            for obj_type, pattern in self.object_headers.items():
                if pattern.search(content):
                    return obj_type
            
            # Try YAML categorization
            if file_path.suffix.lower() in ['.yaml', '.yml']:
                return self._categorize_yaml_file(file_path)
            
            return 'unknown'
            
        except Exception as e:
            logger.warning(f"Failed to categorize {file_path}: {e}")
            return 'unknown'
    
    def _categorize_yaml_file(self, file_path: Path) -> str:
        """Categorize YAML file by structure"""
        try:
            import yaml
            with open(file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if isinstance(data, dict):
                object_type = data.get('object_type', 'unknown')
                if object_type in self.object_headers:
                    return object_type
            elif isinstance(data, list) and data:
                first_item = data[0]
                if isinstance(first_item, dict):
                    object_type = first_item.get('object_type', 'unknown')
                    if object_type in self.object_headers:
                        return object_type
            
            return 'unknown'
            
        except Exception as e:
            logger.debug(f"Failed to parse YAML for categorization {file_path}: {e}")
            return 'unknown'

class SovereignRegistry:
    """Main registry for sovereign objects with fault isolation"""
    
    def __init__(self, raw_directory: Path):
        self.raw_directory = Path(raw_directory)
        self.discovery = RawFileDiscovery(raw_directory)
        self.loader = RawFileLoader(raw_directory)
        self.parser_factory = ParserFactory()
        
        # Registry storage
        self.objects: Dict[str, Dict[str, SovereignObject]] = {}
        self.failed_files: List[Path] = []
        self.safety_mode = False
        
        # Statistics
        self.stats = {
            'total_objects': 0,
            'failed_files': 0,
            'safety_activations': 0
        }
    
    def load_registry(self) -> bool:
        """Load complete registry with fault isolation"""
        logger.info("Starting sovereign registry load")
        
        try:
            # Discover files
            discovered_files = self.discovery.discover_raw_files()
            
            # Load files by category
            for category, files in discovered_files.items():
                if not files:
                    continue
                
                for file_path in files:
                    success = self._load_file_with_isolation(file_path, category)
                    if not success:
                        self.failed_files.append(file_path)
                        self.stats['failed_files'] += 1
            
            # Update statistics
            self.stats['total_objects'] = sum(
                len(category_objects) 
                for category_objects in self.objects.values()
            )
            
            # Check if safety mode is needed
            if self.stats['failed_files'] > 0:
                logger.warning(f"Failed to load {self.stats['failed_files']} files, activating safety mode")
                self._activate_safety_mode()
            
            logger.info(f"Registry loaded successfully: {self.stats}")
            return True
            
        except Exception as e:
            logger.error(f"Critical registry load failure: {e}")
            self._activate_safety_mode()
            return False
    
    def _load_file_with_isolation(self, file_path: Path, expected_category: str) -> bool:
        """Load single file with error isolation"""
        try:
            logger.debug(f"Loading file: {file_path}")
            
            # Use the raw loader
            temp_loader = RawFileLoader(file_path.parent)
            temp_registry = temp_loader.load_all_raws()
            
            # Merge into main registry
            for obj_type, objects in temp_registry.items():
                if obj_type not in self.objects:
                    self.objects[obj_type] = {}
                
                for obj in objects:
                    self.objects[obj_type][obj.object_id] = obj
                    logger.debug(f"Registered {obj_type}: {obj.object_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"File load failure isolated: {file_path} - {e}")
            return False
    
    def _activate_safety_mode(self) -> None:
        """Activate safety mode with fallback archetypes"""
        if self.safety_mode:
            return
        
        self.safety_mode = True
        self.stats['safety_activations'] += 1
        
        logger.warning("ACTIVATING SAFETY MODE - Adding fallback archetypes")
        
        # Add safety archetypes
        fallback_material = SafetyArchetypes.get_fallback_material()
        fallback_template = SafetyArchetypes.get_fallback_template()
        
        if 'material' not in self.objects:
            self.objects['material'] = {}
        if 'template' not in self.objects:
            self.objects['template'] = {}
        
        self.objects['material'][fallback_material.object_id] = fallback_material
        self.objects['template'][fallback_template.object_id] = fallback_template
        
        logger.info("Safety archetypes added to registry")
    
    def get_object(self, object_type: str, object_id: str) -> Optional[SovereignObject]:
        """Get object from registry"""
        return self.objects.get(object_type, {}).get(object_id)
    
    def get_objects_by_type(self, object_type: str) -> List[SovereignObject]:
        """Get all objects of type"""
        return list(self.objects.get(object_type, {}).values())
    
    def get_all_objects(self) -> Dict[str, List[SovereignObject]]:
        """Get all objects grouped by type"""
        return {
            obj_type: list(obj_dict.values())
            for obj_type, obj_dict in self.objects.items()
        }
    
    def search_objects(self, query: str, object_type: Optional[str] = None) -> List[SovereignObject]:
        """Search objects by name, description, or metadata"""
        results = []
        search_objects = []
        
        if object_type:
            search_objects = self.get_objects_by_type(object_type)
        else:
            for obj_list in self.get_all_objects().values():
                search_objects.extend(obj_list)
        
        query_lower = query.lower()
        
        for obj in search_objects:
            # Search in known fields
            if obj.name and query_lower in obj.name.lower():
                results.append(obj)
                continue
            
            if obj.description and query_lower in obj.description.lower():
                results.append(obj)
                continue
            
            # Search in unknown fields
            unknown_fields = obj.get_unknown_fields()
            for key, value in unknown_fields.items():
                if isinstance(value, str) and query_lower in value.lower():
                    results.append(obj)
                    break
                elif isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, str) and query_lower in sub_value.lower():
                            results.append(obj)
                            break
        
        return results
    
    def validate_registry(self) -> Dict[str, List[str]]:
        """Validate registry and return issues"""
        issues = {
            'errors': [],
            'warnings': [],
            'info': []
        }
        
        # Check for empty categories
        for obj_type, obj_dict in self.objects.items():
            if not obj_dict:
                issues['warnings'].append(f"Empty category: {obj_type}")
        
        # Check for duplicate IDs within categories
        for obj_type, obj_dict in self.objects.items():
            ids = list(obj_dict.keys())
            if len(ids) != len(set(ids)):
                issues['errors'].append(f"Duplicate IDs found in {obj_type}")
        
        # Check for missing required fields
        for obj_type, obj_dict in self.objects.items():
            for obj_id, obj in obj_dict.items():
                if not obj.name:
                    issues['warnings'].append(f"Missing name for {obj_type}:{obj_id}")
        
        # Add safety mode info
        if self.safety_mode:
            issues['info'].append("Safety mode is active")
        
        if self.failed_files:
            issues['warnings'].append(f"Failed to load {len(self.failed_files)} files")
        
        return issues
    
    def get_registry_summary(self) -> Dict[str, any]:
        """Get comprehensive registry summary"""
        summary = {
            'statistics': self.stats.copy(),
            'categories': {},
            'failed_files': [str(f) for f in self.failed_files],
            'safety_mode_active': self.safety_mode
        }
        
        for obj_type, obj_dict in self.objects.items():
            summary['categories'][obj_type] = {
                'count': len(obj_dict),
                'objects': list(obj_dict.keys())
            }
        
        return summary
    
    def export_registry(self, export_directory: Path) -> bool:
        """Export registry to separate files by category"""
        try:
            export_dir = Path(export_directory)
            export_dir.mkdir(exist_ok=True)
            
            for obj_type, obj_dict in self.objects.items():
                if not obj_dict:
                    continue
                
                export_file = export_dir / f"{obj_type}s.yaml"
                objects = list(obj_dict.values())
                
                from .sovereign_schema import export_to_raw_file
                export_to_raw_file(objects, export_file)
            
            logger.info(f"Registry exported to {export_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Registry export failed: {e}")
            return False

# Factory function for easy initialization
def create_sovereign_registry(raw_directory: Path) -> SovereignRegistry:
    """Create and initialize sovereign registry"""
    registry = SovereignRegistry(raw_directory)
    registry.load_registry()
    return registry
