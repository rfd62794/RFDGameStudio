"""
Instantiation factory following Single Responsibility Principle.

Handles only the creation of runtime instances from loaded asset data.
"""

import gzip
import pickle
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

from loguru import logger

from .interfaces import IInstantiationFactory, IPaletteApplier, IInteractionProvider, ICacheManager
from .cache_manager import LRUCacheManager


@dataclass
class CharacterInstance:
    """Runtime instance of a pre-baked character."""
    character_id: str
    sprite_data: List[List[Optional[str]]]
    palette: List[str]
    metadata: Dict[str, Any]
    position: Tuple[int, int] = (0, 0)
    animation_frame: int = 0


@dataclass
class ObjectInstance:
    """Runtime instance of a pre-baked object."""
    object_id: str
    sprite_data: Dict[str, Any]
    interaction_id: str
    position: Tuple[int, int] = (0, 0)
    active: bool = True


@dataclass
class EnvironmentInstance:
    """Runtime instance of a pre-baked environment."""
    environment_id: str
    tile_map: List[List[int]]
    dimensions: Tuple[int, int]
    objects: List[ObjectInstance]
    npcs: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class PaletteApplier(IPaletteApplier):
    """
    Applies color palettes to sprite data.
    
    Single responsibility: Palette application logic.
    """
    
    def apply_palette(self, sprite_data: List[List[Optional[str]]], palette: List[str]) -> List[List[Optional[str]]]:
        """
        Apply color palette to sprite data.
        
        Args:
            sprite_data: 2D array of sprite pixels
            palette: Color palette to apply
            
        Returns:
            Sprite data with palette applied
        """
        if not palette:
            return sprite_data
        
        # Create color mapping from palette
        color_map = {}
        for i, color in enumerate(palette):
            if isinstance(color, dict):
                color_map[i] = color.get(i, 'transparent')
            else:
                color_map[i] = color
        
        # Apply palette to sprite
        colored_sprite = []
        for row in sprite_data:
            colored_row = []
            for pixel in row:
                if pixel is not None and isinstance(pixel, str):
                    # Map color through palette
                    colored_row.append(pixel)  # Simplified for demo
                else:
                    colored_row.append(pixel)
            colored_sprite.append(colored_row)
        
        return colored_sprite


class InteractionProvider(IInteractionProvider):
    """
    Provides interaction and dialogue data.
    
    Single responsibility: Interaction data access.
    """
    
    def __init__(self, interaction_registry: Dict[str, Any]):
        self.interaction_registry = interaction_registry
    
    def get_interaction(self, interaction_id: str) -> Optional[Dict[str, Any]]:
        """Get interaction by ID."""
        return self.interaction_registry.get('interactions', {}).get(interaction_id)
    
    def get_dialogue_set(self, dialogue_set_id: str) -> Optional[Dict[str, List[str]]]:
        """Get dialogue set by ID."""
        return self.interaction_registry.get('dialogue_sets', {}).get(dialogue_set_id)


class AssetInstantiationFactory(IInstantiationFactory):
    """
    Creates runtime instances from loaded asset data.
    
    Single responsibility: Instance creation and initialization.
    """
    
    def __init__(
        self,
        asset_data: Dict[str, Any],
        cache_manager: ICacheManager,
        palette_applier: IPaletteApplier,
        interaction_provider: IInteractionProvider
    ):
        self.asset_data = asset_data
        self.cache_manager = cache_manager
        self.palette_applier = palette_applier
        self.interaction_provider = interaction_provider
        
        # Extract asset registries
        self.sprite_bank = asset_data.get('sprite_bank', {})
        self.tile_registry = asset_data.get('tile_registry', {})
        self.object_registry = asset_data.get('object_registry', {})
        self.environment_registry = asset_data.get('environment_registry', {})
        
        logger.debug("🏭 InstantiationFactory initialized")
    
    def create_character(self, character_id: str, position: Tuple[int, int] = (0, 0), **kwargs) -> Optional[CharacterInstance]:
        """
        Create a character instance from pre-baked sprite data.
        
        Args:
            character_id: ID of the character to create
            position: Initial position (x, y)
            **kwargs: Additional parameters (palette_override, etc.)
            
        Returns:
            Character instance or None if not found
        """
        try:
            palette_override = kwargs.get('palette_override')
            
            # Check cache first
            cache_key = f"character_{character_id}_{palette_override or 'default'}"
            cached_instance = self.cache_manager.get(cache_key)
            if cached_instance:
                cached_instance.position = position
                return cached_instance
            
            # Get sprite data
            if character_id not in self.sprite_bank.get('sprites', {}):
                logger.warning(f"Character not found: {character_id}")
                return None
            
            # Decompress sprite data
            compressed_sprite = self.sprite_bank['sprites'][character_id]
            sprite_data = pickle.loads(gzip.decompress(compressed_sprite))
            
            # Get palette
            palette_id = palette_override or self.sprite_bank['metadata'][character_id].get('palette', 'legion_red')
            palette = self.sprite_bank['palettes'].get(palette_id, [])
            
            # Apply palette to sprite data
            colored_sprite = self.palette_applier.apply_palette(sprite_data, palette)
            
            # Create instance
            instance = CharacterInstance(
                character_id=character_id,
                sprite_data=colored_sprite,
                palette=palette,
                metadata=self.sprite_bank['metadata'][character_id],
                position=position
            )
            
            # Cache instance
            self.cache_manager.set(cache_key, instance)
            
            logger.debug(f"👤 Created character: {character_id} at {position}")
            return instance
            
        except Exception as e:
            logger.error(f"❌ Failed to create character {character_id}: {e}")
            return None
    
    def create_object(self, object_id: str, position: Tuple[int, int] = (0, 0), **kwargs) -> Optional[ObjectInstance]:
        """
        Create an object instance from pre-baked object data.
        
        Args:
            object_id: ID of the object to create
            position: Initial position (x, y)
            **kwargs: Additional parameters
            
        Returns:
            Object instance or None if not found
        """
        try:
            # Check cache first
            cache_key = f"object_{object_id}"
            cached_instance = self.cache_manager.get(cache_key)
            if cached_instance:
                cached_instance.position = position
                return cached_instance
            
            # Get object data
            if object_id not in self.object_registry.get('objects', {}):
                logger.warning(f"Object not found: {object_id}")
                return None
            
            # Decompress object data
            compressed_object = self.object_registry['objects'][object_id]
            object_data = pickle.loads(gzip.decompress(compressed_object))
            
            # Create instance
            instance = ObjectInstance(
                object_id=object_id,
                sprite_data=object_data,
                interaction_id=self.object_registry['interactions'][object_id],
                position=position
            )
            
            # Cache instance
            self.cache_manager.set(cache_key, instance)
            
            logger.debug(f"📦 Created object: {object_id} at {position}")
            return instance
            
        except Exception as e:
            logger.error(f"❌ Failed to create object {object_id}: {e}")
            return None
    
    def create_environment(self, environment_id: str, **kwargs) -> Optional[EnvironmentInstance]:
        """
        Create an environment instance from pre-baked map data.
        
        Args:
            environment_id: ID of the environment to create
            **kwargs: Additional parameters
            
        Returns:
            Environment instance or None if not found
        """
        try:
            # Check cache first
            cache_key = f"environment_{environment_id}"
            cached_instance = self.cache_manager.get(cache_key)
            if cached_instance:
                return cached_instance
            
            # Get environment data
            if environment_id not in self.environment_registry.get('maps', {}):
                logger.warning(f"Environment not found: {environment_id}")
                return None
            
            # Decompress map data
            compressed_map = self.environment_registry['maps'][environment_id]
            rle_data = pickle.loads(gzip.decompress(compressed_map))
            
            # Decompress tile map
            tile_map = self._rle_decompress(rle_data)
            
            # Get dimensions
            dimensions = self.environment_registry['dimensions'][environment_id]
            
            # Create object instances
            objects = []
            for obj_data in self.environment_registry['object_placements'][environment_id]:
                obj = self.create_object(obj_data['type'], tuple(obj_data['position']))
                if obj:
                    objects.append(obj)
            
            # Create instance
            instance = EnvironmentInstance(
                environment_id=environment_id,
                tile_map=tile_map,
                dimensions=dimensions,
                objects=objects,
                npcs=self.environment_registry['npc_placements'][environment_id],
                metadata={'loaded_at': time.time()}
            )
            
            # Cache instance
            self.cache_manager.set(cache_key, instance)
            
            logger.debug(f"🗺️ Created environment: {environment_id} ({dimensions[0]}x{dimensions[1]})")
            return instance
            
        except Exception as e:
            logger.error(f"❌ Failed to create environment {environment_id}: {e}")
            return None
    
    def _rle_decompress(self, rle_data: List[Tuple[int, int]]) -> List[int]:
        """Decompress RLE data back to tile map."""
        if not rle_data:
            return []
        
        decompressed = []
        for value, count in rle_data:
            decompressed.extend([value] * count)
        
        return decompressed


class InstantiationFactoryFactory:
    """Factory for creating instantiation factories with proper dependencies."""
    
    @staticmethod
    def create_factory(asset_data: Dict[str, Any]) -> AssetInstantiationFactory:
        """Create instantiation factory with all dependencies."""
        cache_manager = LRUCacheManager(max_size=1000)
        palette_applier = PaletteApplier()
        interaction_provider = InteractionProvider(asset_data.get('interaction_registry', {}))
        
        return AssetInstantiationFactory(
            asset_data=asset_data,
            cache_manager=cache_manager,
            palette_applier=palette_applier,
            interaction_provider=interaction_provider
        )
