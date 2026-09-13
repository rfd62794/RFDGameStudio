from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
import threading
from loguru import logger

from src.game_engine.foundation.asset_registry import AssetRegistry, AssetType
from src.game_engine.foundation.config_manager import ConfigManager

@dataclass
class EntityTemplate:
    """Blueprint for creating entities."""
    template_id: str
    entity_type: str
    base_properties: Dict[str, Any]
    components: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def create_entity_kwargs(self, **overrides) -> Dict[str, Any]:
        """
        Generate kwargs for entity creation, merging base properties with overrides.
        """
        props = self.base_properties.copy()
        props.update(overrides)
        return {
            "entity_type": self.entity_type,
            "components": self.components,
            "properties": props
        }

class EntityTemplateRegistry:
    """
    Registry for entity templates.
    Singleton pattern.
    """
    _instance: Optional['EntityTemplateRegistry'] = None
    _lock: threading.RLock = threading.RLock()
    
    def __new__(cls) -> 'EntityTemplateRegistry':
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if getattr(self, '_initialized', False):
            return
            
        with self._lock:
            self._templates: Dict[str, EntityTemplate] = {}
            self._initialized = True
            logger.info("EntityTemplateRegistry initialized")

    def register_template(self, template: EntityTemplate) -> None:
        """Register a new entity template."""
        with self._lock:
            self._templates[template.template_id] = template
            logger.debug(f"Registered entity template: {template.template_id}")

    def get_template(self, template_id: str) -> Optional[EntityTemplate]:
        """Retrieve a template by ID."""
        with self._lock:
            return self._templates.get(template_id)

    def load_from_assets(self) -> None:
        """
        Load all templates from the AssetRegistry.
        Requires AssetRegistry to be populated with ENTITY_TEMPLATE assets.
        """
        registry = AssetRegistry()
        assets = registry.list_assets(AssetType.ENTITY_TEMPLATE)
        
        count = 0
        with self._lock:
            for asset in assets:
                try:
                    data = asset.data
                    # Expecting data to be a dict of templates or a single template definition
                    # Format: { template_id: { entity_type: ..., ... } }
                    if isinstance(data, dict):
                        for t_id, t_def in data.items():
                            if not isinstance(t_def, dict): 
                                continue # Skip invalid structure
                                
                            template = EntityTemplate(
                                template_id=t_id,
                                entity_type=t_def.get("entity_type", "unknown"),
                                base_properties=t_def.get("properties", {}),
                                components=t_def.get("components", []),
                                metadata=t_def.get("metadata", {})
                            )
                            self.register_template(template)
                            count += 1
                except Exception as e:
                    logger.error(f"Failed to load template from asset {asset.id}: {e}")
        
        logger.info(f"Loaded {count} entity templates from assets")
