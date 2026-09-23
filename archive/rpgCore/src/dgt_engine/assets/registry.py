"""
Asset Registry Component
ADR 086: The Fault-Tolerant Asset Pipeline

Data Access component - A simple, read-only "Phone Book" that the Mind and Body pillars query.
Central authority for "DNA" lookups. Completely separate from the file system.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging

# Configure logger for this module
logger = logging.getLogger(__name__)

@dataclass
class AssetDefinition:
    """Simple asset definition data structure"""
    asset_id: str
    material: Optional[str] = None
    sprite_id: Optional[str] = None
    collision: bool = False
    friction: float = 1.0
    integrity: int = 100
    state: str = "normal"
    tags: List[str] = None
    interaction_hooks: List[str] = None
    d20_checks: Dict[str, Any] = None
    triggers: Dict[str, Any] = None
    metadata: Dict[str, Any] = None
    animation: Optional[str] = None  # Added for animation support
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.interaction_hooks is None:
            self.interaction_hooks = ["examine"]
        if self.d20_checks is None:
            self.d20_checks = {}
        if self.triggers is None:
            self.triggers = {}
        if self.metadata is None:
            self.metadata = {}

@dataclass
class MaterialDefinition:
    """Material definition data structure"""
    material_id: str
    tags: List[str] = None
    resistances: List[str] = None
    weaknesses: List[str] = None
    physics: Dict[str, Any] = None
    inherits: Optional[str] = None  # Added for inheritance support
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.resistances is None:
            self.resistances = []
        if self.weaknesses is None:
            self.weaknesses = []
        if self.physics is None:
            self.physics = {}

@dataclass
class AnimationDefinition:
    """Animation definition data structure"""
    animation_id: str
    frames: List[str] = None
    duration: int = 1000
    loop: bool = True
    trigger: str = ""
    description: str = ""
    
    def __post_init__(self):
        if self.frames is None:
            self.frames = []

@dataclass
class EntityDefinition:
    """Entity definition data structure"""
    entity_id: str
    type: str = "unknown"
    material: str = "organic"
    base_stats: Dict[str, int] = None
    combat_stats: Dict[str, int] = None
    skills: Dict[str, int] = None
    special: Dict[str, Any] = None
    inventory: Optional[Dict[str, Any]] = None  # Added for inventory support
    
    def __post_init__(self):
        if self.base_stats is None:
            self.base_stats = {}
        if self.combat_stats is None:
            self.combat_stats = {}
        if self.skills is None:
            self.skills = {}
        if self.special is None:
            self.special = {}

class AssetRegistry:
    """Lean DNA database for the 10 Pillars"""
    
    def __init__(self):
        self.objects: Dict[str, AssetDefinition] = {}
        self.materials: Dict[str, MaterialDefinition] = {}
        self.animations: Dict[str, AnimationDefinition] = {}
        self.entities: Dict[str, EntityDefinition] = {}
        self.sprites: Dict[str, Any] = {}  # Will be populated by Fabricator
        
        logger.info("📚 AssetRegistry: Initialized lean DNA database")
    
    def load_from_parsed_data(self, parsed_data: Dict, sprites: Dict[str, Any]) -> None:
        """Load asset definitions from parsed data"""
        logger.info("📚 AssetRegistry: Loading from parsed data")
        
        # Load materials first (objects will reference them)
        materials_data = parsed_data.get('materials', {})
        for material_id, material_data in materials_data.items():
            try:
                material_def = MaterialDefinition(material_id, **material_data)
                self.materials[material_id] = material_def
                logger.debug(f"📚 Loaded material: {material_id}")
            except Exception as e:
                logger.error(f"💥 Failed to load material {material_id}: {e}")
        
        # Load objects
        objects_data = parsed_data.get('objects', {})
        for object_id, object_data in objects_data.items():
            try:
                asset_def = AssetDefinition(object_id, **object_data)
                
                # Link material properties
                if asset_def.material and asset_def.material in self.materials:
                    self._link_material_properties(asset_def, asset_def.material)
                
                self.objects[object_id] = asset_def
                logger.debug(f"📚 Loaded object: {object_id}")
            except Exception as e:
                logger.error(f"💥 Failed to load object {object_id}: {e}")
        
        # Load animations
        animations_data = parsed_data.get('animations', {})
        for animation_id, animation_data in animations_data.items():
            try:
                animation_def = AnimationDefinition(animation_id, **animation_data)
                self.animations[animation_id] = animation_def
                logger.debug(f"📚 Loaded animation: {animation_id}")
            except Exception as e:
                logger.error(f"💥 Failed to load animation {animation_id}: {e}")
        
        # Load entities
        entities_data = parsed_data.get('entities', {})
        for entity_id, entity_data in entities_data.items():
            try:
                entity_def = EntityDefinition(entity_id, **entity_data)
                self.entities[entity_id] = entity_def
                logger.debug(f"📚 Loaded entity: {entity_id}")
            except Exception as e:
                logger.error(f"💥 Failed to load entity {entity_id}: {e}")
        
        # Load sprites
        self.sprites = sprites.copy()
        
        # Report results
        logger.info(f"📚 AssetRegistry loaded: {len(self.objects)} objects, {len(self.materials)} materials, {len(self.animations)} animations, {len(self.entities)} entities, {len(self.sprites)} sprites")
    
    def _link_material_properties(self, asset_def: AssetDefinition, material_id: str) -> None:
        """Link material properties to asset definition"""
        material = self.materials.get(material_id)
        if not material:
            logger.warning(f"⚠️ Material not found: {material_id}")
            return
        
        # Merge material tags
        asset_def.tags.extend(material.tags)
        asset_def.tags = list(set(asset_def.tags))  # Remove duplicates
        
        # Add material properties to metadata
        asset_def.metadata['material_resistances'] = material.resistances
        asset_def.metadata['material_weaknesses'] = material.weaknesses
        asset_def.metadata['material_physics'] = material.physics
    
    def get_object(self, object_id: str) -> Optional[AssetDefinition]:
        """Get an object definition by ID"""
        return self.objects.get(object_id)
    
    def get_material(self, material_id: str) -> Optional[MaterialDefinition]:
        """Get a material definition by ID"""
        return self.materials.get(material_id)
    
    def get_animation(self, animation_id: str) -> Optional[AnimationDefinition]:
        """Get an animation definition by ID"""
        return self.animations.get(animation_id)
    
    def get_entity(self, entity_id: str) -> Optional[EntityDefinition]:
        """Get an entity definition by ID"""
        return self.entities.get(entity_id)
    
    def get_sprite(self, sprite_id: str) -> Optional[Any]:
        """Get a sprite by ID"""
        return self.sprites.get(sprite_id)
    
    def has_object(self, object_id: str) -> bool:
        """Check if an object exists"""
        return object_id in self.objects
    
    def has_material(self, material_id: str) -> bool:
        """Check if a material exists"""
        return material_id in self.materials
    
    def has_animation(self, animation_id: str) -> bool:
        """Check if an animation exists"""
        return animation_id in self.animations
    
    def has_entity(self, entity_id: str) -> bool:
        """Check if an entity exists"""
        return entity_id in self.entities
    
    def has_sprite(self, sprite_id: str) -> bool:
        """Check if a sprite exists"""
        return sprite_id in self.sprites
    
    def get_all_objects(self) -> Dict[str, AssetDefinition]:
        """Get all objects"""
        return self.objects.copy()
    
    def get_all_materials(self) -> Dict[str, MaterialDefinition]:
        """Get all materials"""
        return self.materials.copy()
    
    def get_all_animations(self) -> Dict[str, AnimationDefinition]:
        """Get all animations"""
        return self.animations.copy()
    
    def get_all_entities(self) -> Dict[str, EntityDefinition]:
        """Get all entities"""
        return self.entities.copy()
    
    def get_all_sprites(self) -> Dict[str, Any]:
        """Get all sprites"""
        return self.sprites.copy()
    
    def get_objects_by_material(self, material_id: str) -> List[str]:
        """Get all objects that use a specific material"""
        return [obj_id for obj_id, obj_def in self.objects.items() if obj_def.material == material_id]
    
    def get_objects_by_tag(self, tag: str) -> List[str]:
        """Get all objects that have a specific tag"""
        return [obj_id for obj_id, obj_def in self.objects.items() if tag in obj_def.tags]
    
    def validate_registry(self) -> bool:
        """Validate registry integrity"""
        try:
            # Check for critical assets
            critical_objects = ['wooden_door', 'crystal', 'sonic_flower', 'animated_flower']
            missing_objects = [obj for obj in critical_objects if obj not in self.objects]
            
            if missing_objects:
                logger.warning(f"⚠️ Missing critical objects: {missing_objects}")
                return False
            
            # Check for critical materials
            critical_materials = ['oak_wood', 'pine_wood', 'crystal', 'flower_petals']
            missing_materials = [mat for mat in critical_materials if mat not in self.materials]
            
            if missing_materials:
                logger.warning(f"⚠️ Missing critical materials: {missing_materials}")
                return False
            
            logger.info("✅ Registry validation passed")
            return True
            
        except Exception as e:
            logger.error(f"💥 Registry validation failed: {e}")
            return False
    
    def get_registry_stats(self) -> Dict[str, int]:
        """Get registry statistics"""
        return {
            'objects': len(self.objects),
            'materials': len(self.materials),
            'animations': len(self.animations),
            'entities': len(self.entities),
            'sprites': len(self.sprites)
        }
