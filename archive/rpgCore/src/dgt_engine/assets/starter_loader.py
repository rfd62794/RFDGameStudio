"""
Starter Loader - ADR 091: The Semantic Starter Protocol
Token & Tint method for rapid scene deployment
"""

from typing import Dict, Any, Optional
from pathlib import Path
import yaml
from loguru import logger
from dataclasses import dataclass

@dataclass
class MaterialArchetype:
    """Material archetype for semantic fallback"""
    color: str
    tags: list
    
    def get_color(self) -> str:
        """Get base color for tinting"""
        return self.color
    
    def has_tag(self, tag: str) -> bool:
        """Check if material has specific tag"""
        return tag in self.tags

@dataclass
class StarterObject:
    """Lean object definition for starter kit"""
    object_id: str
    material_id: str
    sprite_id: Optional[str] = None
    collision: bool = False
    interaction_hooks: Optional[list] = None
    d20_checks: Optional[Dict[str, Any]] = None
    
    # Semantic fallback values
    def get_sprite_id(self) -> str:
        """Get sprite ID with semantic fallback"""
        return self.sprite_id or self.material_id
    
    def get_collision(self) -> bool:
        """Get collision with semantic fallback"""
        if self.collision:
            return True
        # Barriers and heavy objects default to collision
        material = get_material_archetype(self.material_id)
        return material.has_tag("barrier") or material.has_tag("heavy")

class StarterLoader:
    """Simplified asset loader for starter kit"""
    
    def __init__(self):
        self.material_archetypes: Dict[str, MaterialArchetype] = {}
        self.objects: Dict[str, StarterObject] = {}
        self._load_default_archetypes()
    
    def _load_default_archetypes(self) -> None:
        """Load default material archetypes"""
        self.material_archetypes = {
            "organic": MaterialArchetype("#2d5a27", ["animated"]),
            "wood": MaterialArchetype("#5d4037", ["flammable", "barrier"]),
            "stone": MaterialArchetype("#757575", ["heavy"]),
            "metal": MaterialArchetype("#9e9e9e", ["valuable", "secure"])
        }
        logger.info("Loaded default material archetypes")
    
    def load_starter_kit(self, yaml_path: Path) -> bool:
        """Load starter kit from YAML file"""
        try:
            with open(yaml_path, 'r') as f:
                data = yaml.safe_load(f)
            
            # Load material archetypes (if present)
            if 'materials' in data:
                for mat_id, mat_data in data['materials'].items():
                    self.material_archetypes[mat_id] = MaterialArchetype(
                        color=mat_data['color'],
                        tags=mat_data.get('tags', [])
                    )
                logger.info(f"Loaded {len(data['materials'])} material archetypes")
            
            # Load objects
            for obj_id, obj_data in data.items():
                if obj_id == 'materials':
                    continue  # Skip materials section
                
                # Create starter object with semantic defaults
                starter_obj = StarterObject(
                    object_id=obj_id,
                    material_id=obj_data['material_id'],
                    sprite_id=obj_data.get('sprite_id'),
                    collision=obj_data.get('collision', False),
                    interaction_hooks=obj_data.get('interaction_hooks'),
                    d20_checks=obj_data.get('d20_checks')
                )
                
                self.objects[obj_id] = starter_obj
                logger.debug(f"Loaded starter object: {obj_id}")
            
            logger.info(f"Loaded {len(self.objects)} starter objects")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load starter kit: {e}")
            return False
    
    def get_object(self, object_id: str) -> Optional[StarterObject]:
        """Get starter object by ID"""
        return self.objects.get(object_id)
    
    def get_material_archetype(self, material_id: str) -> MaterialArchetype:
        """Get material archetype with fallback"""
        return self.material_archetypes.get(material_id, 
                                          MaterialArchetype("#808080", []))  # Gray fallback
    
    def get_all_objects(self) -> Dict[str, StarterObject]:
        """Get all loaded objects"""
        return self.objects.copy()
    
    def get_scene_objects(self) -> Dict[str, StarterObject]:
        """Get objects suitable for scene rendering"""
        scene_objects = {}
        
        for obj_id, obj in self.objects.items():
            # Only include objects that can be rendered
            if obj.get_sprite_id():
                scene_objects[obj_id] = obj
        
        return scene_objects
    
    def apply_semantic_defaults(self, obj: StarterObject) -> Dict[str, Any]:
        """Apply semantic defaults to object"""
        material = self.get_material_archetype(obj.material_id)
        
        defaults = {
            'color': material.get_color(),
            'sprite_id': obj.get_sprite_id(),
            'collision': obj.get_collision(),
            'tags': material.tags,
            'animated': material.has_tag('animated'),
            'flammable': material.has_tag('flammable'),
            'barrier': material.has_tag('barrier'),
            'heavy': material.has_tag('heavy'),
            'valuable': material.has_tag('valuable'),
            'secure': material.has_tag('secure')
        }
        
        # Add object-specific properties
        if obj.interaction_hooks:
            defaults['interaction_hooks'] = obj.interaction_hooks
        
        if obj.d20_checks:
            defaults['d20_checks'] = obj.d20_checks
        
        return defaults
    
    def get_rendering_data(self, object_id: str) -> Optional[Dict[str, Any]]:
        """Get rendering data for object"""
        obj = self.get_object(object_id)
        if not obj:
            return None
        
        return self.apply_semantic_defaults(obj)
    
    def validate_starter_kit(self) -> Dict[str, list]:
        """Validate starter kit and return issues"""
        issues = {
            'errors': [],
            'warnings': [],
            'info': []
        }
        
        # Check material references
        for obj_id, obj in self.objects.items():
            if obj.material_id not in self.material_archetypes:
                issues['warnings'].append(f"Object {obj_id} references unknown material: {obj.material_id}")
        
        # Check for missing sprites
        for obj_id, obj in self.objects.items():
            if not obj.sprite_id:
                issues['info'].append(f"Object {obj_id} will use material-based rendering")
        
        # Check collision logic
        for obj_id, obj in self.objects.items():
            material = self.get_material_archetype(obj.material_id)
            expected_collision = material.has_tag("barrier") or material.has_tag("heavy")
            if obj.collision and not expected_collision:
                issues['warnings'].append(f"Object {obj_id} has collision but material doesn't suggest it")
        
        return issues

# Global instance for easy access
_starter_loader = None

def get_starter_loader() -> StarterLoader:
    """Get global starter loader instance"""
    global _starter_loader
    if _starter_loader is None:
        _starter_loader = StarterLoader()
    return _starter_loader

def load_starter_kit(yaml_path: Path) -> bool:
    """Load starter kit using global instance"""
    loader = get_starter_loader()
    return loader.load_starter_kit(yaml_path)

def get_scene_rendering_data() -> Dict[str, Dict[str, Any]]:
    """Get all scene rendering data"""
    loader = get_starter_loader()
    scene_data = {}
    
    for obj_id in loader.get_scene_objects().keys():
        render_data = loader.get_rendering_data(obj_id)
        if render_data:
            scene_data[obj_id] = render_data
    
    return scene_data

# Utility functions for semantic fallback
def get_material_archetype(material_id: str) -> MaterialArchetype:
    """Get material archetype with fallback"""
    loader = get_starter_loader()
    return loader.get_material_archetype(material_id)

def apply_tint_to_sprite(base_color: str, sprite_data: Any) -> Any:
    """Apply material tint to sprite data"""
    # This would integrate with your sprite system
    # For now, just return the color information
    return {
        'base_color': base_color,
        'tint_applied': True,
        'sprite_data': sprite_data
    }
