"""
Entity Templates - Configuration-based entity prefab system.

SOLID Principle: Single Responsibility
- Only responsible for defining entity templates (blueprints)
- Does not handle spawning logic (delegated to factories)
- Does not handle entity lifecycle (delegated to EntityManager)

Architecture:
- Template registry for reusable entity definitions
- Configuration-based templates (no code-based spawning)
- Support for game-type-specific templates (space, rpg, tycoon)
- Template inheritance and composition
- Validation of template parameters
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Type, Generic, TypeVar
from enum import Enum
import copy

T = TypeVar('T')


class TemplateType(str, Enum):
    """Supported entity template types."""
    SPACE_ENTITY = "space_entity"
    ASTEROID_LARGE = "asteroid_large"
    ASTEROID_MEDIUM = "asteroid_medium"
    ASTEROID_SMALL = "asteroid_small"
    SHIP = "ship"
    PROJECTILE = "projectile"
    ENEMY_FIGHTER = "enemy_fighter"
    ENEMY_BOSS = "enemy_boss"
    ITEM_HEALTH = "item_health"
    ITEM_AMMO = "item_ammo"
    CUSTOM = "custom"


@dataclass
class EntityTemplate:
    """
    Entity template definition (blueprint).

    Defines all properties needed to spawn an entity of a specific type.
    """

    template_id: str
    entity_type: str
    display_name: str

    # Physical properties
    radius: float = 5.0
    mass: float = 1.0
    max_velocity: float = 500.0
    acceleration: float = 0.0
    friction: float = 0.0

    # Visual properties
    color: int = 1
    layer: int = 0
    visible: bool = True

    # Behavioral properties
    health: int = 100
    damage: int = 0
    score_value: int = 0

    # Collision properties
    collision_enabled: bool = True
    collision_type: str = "circle"
    collision_group: str = "default"

    # Audio properties
    sound_effects: Dict[str, str] = field(default_factory=dict)

    # Custom properties (game-type-specific)
    custom_properties: Dict[str, Any] = field(default_factory=dict)

    # Template metadata
    parent_template_id: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    created_at: str = ""
    description: str = ""

    def validate(self) -> List[str]:
        """
        Validate template parameters.

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        # Basic validation
        if not self.template_id:
            errors.append("template_id is required")
        if not self.entity_type:
            errors.append("entity_type is required")

        # Physical properties validation
        if self.radius <= 0:
            errors.append(f"radius must be > 0, got {self.radius}")
        if self.mass < 0:
            errors.append(f"mass must be >= 0, got {self.mass}")
        if self.max_velocity < 0:
            errors.append(f"max_velocity must be >= 0, got {self.max_velocity}")

        # Health/damage validation
        if self.health < 0:
            errors.append(f"health must be >= 0, got {self.health}")
        if self.damage < 0:
            errors.append(f"damage must be >= 0, got {self.damage}")

        # Layer validation
        if self.layer < 0 or self.layer > 255:
            errors.append(f"layer must be 0-255, got {self.layer}")

        return errors

    def create_instance(self) -> "EntityTemplate":
        """
        Create an instance from this template (deep copy).

        Returns:
            New EntityTemplate instance
        """
        return copy.deepcopy(self)

    def add_tag(self, tag: str) -> None:
        """Add a tag to the template."""
        if tag not in self.tags:
            self.tags.append(tag)

    def has_tag(self, tag: str) -> bool:
        """Check if template has a tag."""
        return tag in self.tags

    def set_custom_property(self, key: str, value: Any) -> None:
        """Set a custom property."""
        self.custom_properties[key] = value

    def get_custom_property(self, key: str, default: Any = None) -> Any:
        """Get a custom property."""
        return self.custom_properties.get(key, default)

    def to_dict(self) -> Dict[str, Any]:
        """Convert template to dictionary."""
        return {
            "template_id": self.template_id,
            "entity_type": self.entity_type,
            "display_name": self.display_name,
            "radius": self.radius,
            "mass": self.mass,
            "max_velocity": self.max_velocity,
            "acceleration": self.acceleration,
            "friction": self.friction,
            "color": self.color,
            "layer": self.layer,
            "visible": self.visible,
            "health": self.health,
            "damage": self.damage,
            "score_value": self.score_value,
            "collision_enabled": self.collision_enabled,
            "collision_type": self.collision_type,
            "collision_group": self.collision_group,
            "sound_effects": self.sound_effects,
            "custom_properties": self.custom_properties,
            "parent_template_id": self.parent_template_id,
            "tags": self.tags,
            "created_at": self.created_at,
            "description": self.description
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "EntityTemplate":
        """Create template from dictionary."""
        return EntityTemplate(
            template_id=data.get("template_id", ""),
            entity_type=data.get("entity_type", ""),
            display_name=data.get("display_name", ""),
            radius=data.get("radius", 5.0),
            mass=data.get("mass", 1.0),
            max_velocity=data.get("max_velocity", 500.0),
            acceleration=data.get("acceleration", 0.0),
            friction=data.get("friction", 0.0),
            color=data.get("color", 1),
            layer=data.get("layer", 0),
            visible=data.get("visible", True),
            health=data.get("health", 100),
            damage=data.get("damage", 0),
            score_value=data.get("score_value", 0),
            collision_enabled=data.get("collision_enabled", True),
            collision_type=data.get("collision_type", "circle"),
            collision_group=data.get("collision_group", "default"),
            sound_effects=data.get("sound_effects", {}),
            custom_properties=data.get("custom_properties", {}),
            parent_template_id=data.get("parent_template_id"),
            tags=data.get("tags", []),
            created_at=data.get("created_at", ""),
            description=data.get("description", "")
        )

    def __repr__(self) -> str:
        return (
            f"EntityTemplate(id={self.template_id}, "
            f"type={self.entity_type}, "
            f"radius={self.radius}, "
            f"health={self.health})"
        )


class EntityTemplateRegistry:
    """
    Registry for entity templates.

    Responsibilities:
    - Store and retrieve templates by ID or type
    - Validate templates on registration
    - Support template inheritance
    - Provide iteration and filtering
    """

    def __init__(self):
        """Initialize the template registry."""
        self._templates: Dict[str, EntityTemplate] = {}
        self._type_index: Dict[str, List[str]] = {}
        self._tag_index: Dict[str, List[str]] = {}
        self._inheritance_tree: Dict[str, List[str]] = {}

    def register(
        self,
        template: EntityTemplate,
        inherit_from: Optional[str] = None
    ) -> None:
        """
        Register a template.

        Args:
            template: EntityTemplate to register
            inherit_from: Optional parent template ID for inheritance

        Raises:
            ValueError: If template_id already exists or validation fails
        """
        if template.template_id in self._templates:
            raise ValueError(f"Template '{template.template_id}' already exists")

        # Validate template
        errors = template.validate()
        if errors:
            raise ValueError(f"Template validation failed: {', '.join(errors)}")

        # Check parent template if inheriting
        if inherit_from and inherit_from not in self._templates:
            raise ValueError(f"Parent template '{inherit_from}' not found")

        # Store template
        self._templates[template.template_id] = template

        # Index by type
        if template.entity_type not in self._type_index:
            self._type_index[template.entity_type] = []
        self._type_index[template.entity_type].append(template.template_id)

        # Index by tags
        for tag in template.tags:
            if tag not in self._tag_index:
                self._tag_index[tag] = []
            self._tag_index[tag].append(template.template_id)

        # Handle inheritance
        if inherit_from:
            if inherit_from not in self._inheritance_tree:
                self._inheritance_tree[inherit_from] = []
            self._inheritance_tree[inherit_from].append(template.template_id)
            template.parent_template_id = inherit_from

    def get(self, template_id: str) -> Optional[EntityTemplate]:
        """
        Get a template by ID.

        Args:
            template_id: Template identifier

        Returns:
            EntityTemplate or None if not found
        """
        return self._templates.get(template_id)

    def get_or_raise(self, template_id: str) -> EntityTemplate:
        """
        Get a template by ID or raise exception.

        Args:
            template_id: Template identifier

        Returns:
            EntityTemplate

        Raises:
            KeyError: If template not found
        """
        template = self.get(template_id)
        if template is None:
            raise KeyError(f"Template not found: {template_id}")
        return template

    def list_by_type(self, entity_type: str) -> List[EntityTemplate]:
        """
        Get all templates of a specific type.

        Args:
            entity_type: Type to filter by

        Returns:
            List of EntityTemplate objects
        """
        template_ids = self._type_index.get(entity_type, [])
        return [self._templates[tid] for tid in template_ids]

    def list_by_tag(self, tag: str) -> List[EntityTemplate]:
        """
        Get all templates with a specific tag.

        Args:
            tag: Tag to filter by

        Returns:
            List of EntityTemplate objects
        """
        template_ids = self._tag_index.get(tag, [])
        return [self._templates[tid] for tid in template_ids]

    def list_all(self) -> List[EntityTemplate]:
        """
        Get all registered templates.

        Returns:
            List of all EntityTemplate objects
        """
        return list(self._templates.values())

    def unregister(self, template_id: str) -> bool:
        """
        Remove a template from registry.

        Args:
            template_id: Template to remove

        Returns:
            True if removed, False if not found
        """
        if template_id not in self._templates:
            return False

        template = self._templates.pop(template_id)

        # Remove from type index
        if template.entity_type in self._type_index:
            self._type_index[template.entity_type].remove(template_id)

        # Remove from tag index
        for tag in template.tags:
            if tag in self._tag_index:
                self._tag_index[tag].remove(template_id)

        # Remove inheritance links
        if template.parent_template_id in self._inheritance_tree:
            self._inheritance_tree[template.parent_template_id].remove(template_id)

        return True

    def clear(self) -> None:
        """Clear all templates from registry."""
        self._templates.clear()
        self._type_index.clear()
        self._tag_index.clear()
        self._inheritance_tree.clear()

    def count(self) -> int:
        """Get total number of registered templates."""
        return len(self._templates)

    def count_by_type(self, entity_type: str) -> int:
        """Get count of templates for a specific type."""
        return len(self._type_index.get(entity_type, []))

    def get_children(self, parent_template_id: str) -> List[EntityTemplate]:
        """
        Get all templates that inherit from a parent.

        Args:
            parent_template_id: Parent template ID

        Returns:
            List of child EntityTemplate objects
        """
        child_ids = self._inheritance_tree.get(parent_template_id, [])
        return [self._templates[cid] for cid in child_ids]

    def validate(self) -> List[str]:
        """
        Validate registry integrity.

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        # Check for orphaned inheritance references
        for template_id, parent_id in [(t.template_id, t.parent_template_id)
                                       for t in self._templates.values()
                                       if t.parent_template_id]:
            if parent_id not in self._templates:
                errors.append(f"Template '{template_id}' references missing parent '{parent_id}'")

        # Check index consistency
        for template_id, template in self._templates.items():
            if template.entity_type not in self._type_index:
                errors.append(f"Template '{template_id}' missing from type index")
            elif template_id not in self._type_index[template.entity_type]:
                errors.append(f"Template '{template_id}' not in type index")

        return errors

    def get_stats(self) -> Dict[str, Any]:
        """
        Get registry statistics.

        Returns:
            Dictionary with registry stats
        """
        return {
            "total_templates": len(self._templates),
            "by_type": {t: len(ids) for t, ids in self._type_index.items()},
            "by_tag": {t: len(ids) for t, ids in self._tag_index.items()},
            "total_types": len(self._type_index),
            "total_tags": len(self._tag_index),
            "inheritance_chains": len(self._inheritance_tree)
        }

    def __contains__(self, template_id: str) -> bool:
        """Check if template exists."""
        return template_id in self._templates

    def __len__(self) -> int:
        """Get total number of templates."""
        return len(self._templates)

    def __iter__(self):
        """Iterate over all templates."""
        return iter(self._templates.values())

    def __repr__(self) -> str:
        return (
            f"EntityTemplateRegistry(templates={len(self._templates)}, "
            f"types={len(self._type_index)}, "
            f"tags={len(self._tag_index)})"
        )
