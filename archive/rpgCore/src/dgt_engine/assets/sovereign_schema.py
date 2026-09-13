"""
Sovereign Schema - ADR 089: The Sovereign Schema Transformation
Loose-coupling parser inspired by Dwarf Fortress "Raw" files
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Type, Union
from pathlib import Path
import yaml
import re
from loguru import logger

# Version Registry for Parser Selection
PARSER_VERSIONS = {
    "1.0": "LegacyParser",
    "1.1": "SovereignParser", 
    "2.0": "TagBasedParser"
}

@dataclass
class SovereignObject:
    """Base object that absorbs any YAML key without breaking"""
    object_id: str
    object_type: str = "unknown"
    version: str = "1.0"
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Core properties (known schema)
    name: Optional[str] = None
    description: Optional[str] = None
    
    # Absorption zone for unknown keys
    _unknown_fields: Dict[str, Any] = field(default_factory=dict, init=False, repr=False)
    
    def __post_init__(self):
        """Post-processing after initialization"""
        # Store object in metadata for tracking
        self.metadata['created_at'] = str(Path.cwd())
        self.metadata['schema_version'] = self.version
        
    def absorb_field(self, key: str, value: Any) -> None:
        """Absorb unknown field into metadata"""
        self._unknown_fields[key] = value
        logger.debug(f"Absorbed unknown field '{key}' for {self.object_id}")
    
    def get_unknown_fields(self) -> Dict[str, Any]:
        """Get all unknown fields"""
        return self._unknown_fields.copy()
    
    def get_all_data(self) -> Dict[str, Any]:
        """Get complete data including unknown fields"""
        data = self.__dict__.copy()
        data.update(self._unknown_fields)
        return data

@dataclass 
class MaterialObject(SovereignObject):
    """Material-specific sovereign object"""
    object_type: str = "material"
    base_color: Optional[str] = None
    pattern: Optional[str] = None
    intensity: Optional[float] = None
    inherits: Optional[str] = None  # Now handled gracefully
    
@dataclass
class TemplateObject(SovereignObject):
    """Template-specific sovereign object"""
    object_type: str = "template"
    base_color: Optional[str] = None
    animation_frames: Optional[int] = None
    frame_duration: Optional[int] = None
    use_case: Optional[List[str]] = None

@dataclass
class TagObject(SovereignObject):
    """Tag-based object for ultimate flexibility"""
    object_type: str = "tag"
    tags: List[str] = field(default_factory=list)
    components: Dict[str, Any] = field(default_factory=dict)

class SovereignParser(ABC):
    """Abstract parser interface"""
    
    @abstractmethod
    def can_parse(self, data: Dict[str, Any]) -> bool:
        """Check if parser can handle this data"""
        pass
    
    @abstractmethod
    def parse(self, data: Dict[str, Any]) -> SovereignObject:
        """Parse data into sovereign object"""
        pass

class LegacyParser(SovereignParser):
    """Parser for version 1.0 legacy files"""
    
    def can_parse(self, data: Dict[str, Any]) -> bool:
        return data.get('version', '1.0') == '1.0'
    
    def parse(self, data: Dict[str, Any]) -> SovereignObject:
        object_type = data.get('object_type', 'unknown')
        object_id = data.get('id', 'unknown')
        
        if object_type == 'material':
            obj = MaterialObject(
                object_id=object_id,
                version=data.get('version', '1.0'),
                name=data.get('name'),
                description=data.get('description'),
                base_color=data.get('base_color'),
                pattern=data.get('pattern'),
                intensity=data.get('intensity')
            )
        elif object_type == 'template':
            obj = TemplateObject(
                object_id=object_id,
                version=data.get('version', '1.0'),
                name=data.get('name'),
                description=data.get('description'),
                base_color=data.get('base_color'),
                animation_frames=data.get('animation_frames'),
                frame_duration=data.get('frame_duration'),
                use_case=data.get('use_case', [])
            )
        else:
            obj = SovereignObject(
                object_type=object_type,
                object_id=object_id,
                version=data.get('version', '1.0'),
                name=data.get('name'),
                description=data.get('description')
            )
        
        # Absorb unknown fields
        known_fields = {'object_type', 'id', 'version', 'name', 'description', 
                       'base_color', 'pattern', 'intensity', 'animation_frames', 
                       'frame_duration', 'use_case', 'inherits'}
        
        for key, value in data.items():
            if key not in known_fields:
                obj.absorb_field(key, value)
        
        return obj

class SovereignParserV1(SovereignParser):
    """Parser for version 1.1 sovereign files"""
    
    def can_parse(self, data: Dict[str, Any]) -> bool:
        return data.get('version', '1.0') == '1.1'
    
    def parse(self, data: Dict[str, Any]) -> SovereignObject:
        object_type = data.get('object_type', 'unknown')
        object_id = data.get('id', 'unknown')
        
        # Dynamic object creation based on type
        object_classes = {
            'material': MaterialObject,
            'template': TemplateObject,
            'tag': TagObject
        }
        
        obj_class = object_classes.get(object_type, SovereignObject)
        
        # Extract known fields only
        known_fields = self._get_known_fields(obj_class)
        kwargs = {'object_id': object_id}
        
        for field_name in known_fields:
            if field_name in data:
                kwargs[field_name] = data[field_name]
        
        # Create object with known fields only
        obj = obj_class(**kwargs)
        
        # Absorb all other fields
        for key, value in data.items():
            if key not in known_fields and key != 'id':
                obj.absorb_field(key, value)
        
        return obj
    
    def _get_known_fields(self, obj_class: Type) -> List[str]:
        """Get list of known fields for object class"""
        if hasattr(obj_class, '__dataclass_fields__'):
            known_fields = list(obj_class.__dataclass_fields__.keys())
            # Remove 'inherits' from known fields to force absorption
            if 'inherits' in known_fields:
                known_fields.remove('inherits')
            return known_fields
        return ['object_type', 'object_id', 'version', 'name', 'description']

class TagBasedParser(SovereignParser):
    """Parser for version 2.0 tag-based files"""
    
    def can_parse(self, data: Dict[str, Any]) -> bool:
        return data.get('version', '1.0') == '2.0'
    
    def parse(self, data: Dict[str, Any]) -> SovereignObject:
        object_id = data.get('id', 'unknown')
        tags = data.get('tags', [])
        components = data.get('components', {})
        
        # Preserve the original object_type from data
        obj_type = data.get('object_type', 'tag')
        
        obj = TagObject(
            object_id=object_id,
            object_type=obj_type,  # Use the type from data
            version=data.get('version', '2.0'),
            name=data.get('name'),
            description=data.get('description'),
            tags=tags,
            components=components
        )
        
        # Absorb any remaining fields
        known_fields = {'id', 'version', 'name', 'description', 'tags', 'components', 'object_type'}
        for key, value in data.items():
            if key not in known_fields:
                obj.absorb_field(key, value)
        
        return obj

class ParserFactory:
    """Factory for selecting appropriate parser"""
    
    def __init__(self):
        self.parsers = [
            TagBasedParser(),
            SovereignParserV1(),
            LegacyParser()
        ]
    
    def get_parser(self, data: Dict[str, Any]) -> SovereignParser:
        """Get appropriate parser for data"""
        for parser in self.parsers:
            if parser.can_parse(data):
                return parser
        
        # Fallback to legacy parser
        logger.warning(f"No specific parser found, using legacy parser for data: {data.get('id', 'unknown')}")
        return LegacyParser()

class RawFileLoader:
    """Dwarf Fortress style raw file loader"""
    
    def __init__(self, raw_directory: Path):
        self.raw_directory = Path(raw_directory)
        self.parser_factory = ParserFactory()
        self.registry: Dict[str, List[SovereignObject]] = {}
        
    def load_all_raws(self) -> Dict[str, List[SovereignObject]]:
        """Load all raw files from directory"""
        if not self.raw_directory.exists():
            logger.warning(f"Raw directory not found: {self.raw_directory}")
            return {}
        
        logger.info(f"Loading raw files from: {self.raw_directory}")
        
        # Walk through all YAML files
        for yaml_file in self.raw_directory.glob("*.yaml"):
            try:
                self._load_raw_file(yaml_file)
            except Exception as e:
                logger.error(f"Failed to load {yaml_file}: {e}")
                # Continue with other files (fault isolation)
                continue
        
        # Log summary
        total_objects = sum(len(objects) for objects in self.registry.values())
        logger.info(f"Loaded {total_objects} objects from {len(self.registry)} categories")
        
        return self.registry
    
    def _load_raw_file(self, file_path: Path) -> None:
        """Load individual raw file"""
        logger.debug(f"Loading raw file: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        if not data:
            logger.warning(f"Empty file: {file_path}")
            return
        
        # Handle both single object and multiple objects
        if isinstance(data, dict):
            objects = [data]
        elif isinstance(data, list):
            objects = data
        else:
            logger.error(f"Invalid data format in {file_path}")
            return
        
        for obj_data in objects:
            try:
                sovereign_obj = self.parser_factory.get_parser(obj_data).parse(obj_data)
                object_type = sovereign_obj.object_type
                
                if object_type not in self.registry:
                    self.registry[object_type] = []
                
                self.registry[object_type].append(sovereign_obj)
                logger.debug(f"Loaded {object_type}: {sovereign_obj.object_id}")
                
            except Exception as e:
                logger.error(f"Failed to parse object in {file_path}: {e}")
                continue
    
    def get_objects_by_type(self, object_type: str) -> List[SovereignObject]:
        """Get all objects of specific type"""
        return self.registry.get(object_type, [])
    
    def get_object_by_id(self, object_type: str, object_id: str) -> Optional[SovereignObject]:
        """Get specific object by ID"""
        objects = self.get_objects_by_type(object_type)
        for obj in objects:
            if obj.object_id == object_id:
                return obj
        return None
    
    def get_registry_stats(self) -> Dict[str, int]:
        """Get registry statistics"""
        return {obj_type: len(objects) for obj_type, objects in self.registry.items()}

# Safety Archetypes for fallback
class SafetyArchetypes:
    """Hardcoded fallback objects for when files are broken"""
    
    @staticmethod
    def get_fallback_material() -> MaterialObject:
        return MaterialObject(
            object_id="fallback_wood",
            name="Fallback Wood",
            description="Emergency wood material",
            base_color="#8B4513",
            pattern="solid",
            intensity=0.0
        )
    
    @staticmethod
    def get_fallback_template() -> TemplateObject:
        return TemplateObject(
            object_id="fallback_basic",
            name="Fallback Template",
            description="Emergency template",
            base_color="#808080",
            animation_frames=1,
            frame_duration=0
        )

# Utility functions
def create_sovereign_object(object_type: str, object_id: str, **kwargs) -> SovereignObject:
    """Factory function for creating sovereign objects"""
    object_classes = {
        'material': MaterialObject,
        'template': TemplateObject,
        'tag': TagObject
    }
    
    obj_class = object_classes.get(object_type, SovereignObject)
    return obj_class(object_type=object_type, object_id=object_id, **kwargs)

def export_to_raw_file(objects: List[SovereignObject], file_path: Path) -> None:
    """Export sovereign objects to raw file"""
    export_data = []
    
    for obj in objects:
        # Get all data including unknown fields
        data = obj.get_all_data()
        # Ensure 'id' field is set from object_id for compatibility
        data['id'] = obj.object_id
        export_data.append(data)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        yaml.dump(export_data, f, default_flow_style=False, sort_keys=False)
    
    logger.info(f"Exported {len(objects)} objects to {file_path}")
