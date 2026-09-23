"""
Refactored PrefabFactory - SOLID Architecture

Orchestrates asset loading, caching, and instantiation through dependency injection.
Follows SOLID principles with clear separation of concerns.
"""

import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

from loguru import logger

from .interfaces import IAssetLoader, IInstantiationFactory, IInteractionProvider, IAssetRegistry
from .asset_loader import BinaryAssetLoader
from .instantiation_factory import (
    AssetInstantiationFactory, 
    CharacterInstance, 
    ObjectInstance, 
    EnvironmentInstance,
    InstantiationFactoryFactory
)
from .cache_manager import LRUCacheManager, CacheManagerFactory


class PrefabFactory(IAssetRegistry):
    """
    Refactored PrefabFactory using SOLID principles.
    
    Orchestrates asset loading, caching, and instantiation through
    dependency injection. Each component has a single responsibility.
    """
    
    def __init__(self, asset_path: Path, asset_loader: Optional[IAssetLoader] = None):
        """
        Initialize the PrefabFactory with dependency injection.
        
        Args:
            asset_path: Path to the assets.dgt binary file
            asset_loader: Optional custom asset loader (defaults to BinaryAssetLoader)
        """
        self.asset_path = asset_path
        
        # Dependency injection with defaults
        self._asset_loader = asset_loader or BinaryAssetLoader()
        self._instantiation_factory: Optional[IInstantiationFactory] = None
        self._interaction_provider: Optional[IInteractionProvider] = None
        
        # Cache managers for different asset types
        self._character_cache = CacheManagerFactory.create_character_cache()
        self._object_cache = CacheManagerFactory.create_object_cache()
        self._environment_cache = CacheManagerFactory.create_environment_cache()
        
        logger.info(f"🏭 PrefabFactory initialized")
        logger.info(f"📁 Asset file: {asset_path}")
    
    def load_assets(self) -> bool:
        """
        Load all assets using the injected asset loader.
        
        Returns:
            True if loading succeeded, False otherwise
        """
        try:
            logger.info("📦 Loading pre-baked assets...")
            
            # Load assets using injected loader
            if not self._asset_loader.load_assets(self.asset_path):
                logger.error("❌ Asset loader failed")
                return False
            
            # Get loaded asset data
            asset_data = self._asset_loader.get_asset_data()
            if not asset_data:
                logger.error("❌ No asset data available")
                return False
            
            # Create instantiation factory with dependencies
            self._instantiation_factory = InstantiationFactoryFactory.create_factory(asset_data)
            
            # Extract interaction provider
            self._interaction_provider = self._instantiation_factory.interaction_provider
            
            logger.info("✅ All asset registries loaded")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load assets: {e}")
            return False
    
    def create_character(self, character_id: str, position: Tuple[int, int] = (0, 0), palette_override: Optional[str] = None) -> Optional[CharacterInstance]:
        """
        Create a character instance using the instantiation factory.
        
        Args:
            character_id: ID of the character to create
            position: Initial position (x, y)
            palette_override: Optional palette override
            
        Returns:
            Character instance or None if not found
        """
        if not self._instantiation_factory:
            logger.error("❌ Assets not loaded - call load_assets() first")
            return None
        
        return self._instantiation_factory.create_character(
            character_id=character_id,
            position=position,
            palette_override=palette_override
        )
    
    def create_object(self, object_id: str, position: Tuple[int, int] = (0, 0)) -> Optional[ObjectInstance]:
        """
        Create an object instance using the instantiation factory.
        
        Args:
            object_id: ID of the object to create
            position: Initial position (x, y)
            
        Returns:
            Object instance or None if not found
        """
        if not self._instantiation_factory:
            logger.error("❌ Assets not loaded - call load_assets() first")
            return None
        
        return self._instantiation_factory.create_object(
            object_id=object_id,
            position=position
        )
    
    def create_environment(self, environment_id: str) -> Optional[EnvironmentInstance]:
        """
        Create an environment instance using the instantiation factory.
        
        Args:
            environment_id: ID of the environment to create
            
        Returns:
            Environment instance or None if not found
        """
        if not self._instantiation_factory:
            logger.error("❌ Assets not loaded - call load_assets() first")
            return None
        
        return self._instantiation_factory.create_environment(environment_id=environment_id)
    
    def get_interaction(self, interaction_id: str) -> Optional[Dict[str, Any]]:
        """
        Get interaction logic by ID.
        
        Args:
            interaction_id: ID of the interaction
            
        Returns:
            Interaction data or None if not found
        """
        if not self._interaction_provider:
            logger.error("❌ Assets not loaded - call load_assets() first")
            return None
        
        return self._interaction_provider.get_interaction(interaction_id)
    
    def get_dialogue_set(self, dialogue_set_id: str) -> Optional[Dict[str, List[str]]]:
        """
        Get dialogue set by ID.
        
        Args:
            dialogue_set_id: ID of the dialogue set
            
        Returns:
            Dialogue set data or None if not found
        """
        if not self._interaction_provider:
            logger.error("❌ Assets not loaded - call load_assets() first")
            return None
        
        return self._interaction_provider.get_dialogue_set(dialogue_set_id)
    
    def get_available_characters(self) -> List[str]:
        """Get list of available character IDs."""
        if not self._instantiation_factory:
            return []
        
        asset_data = self._asset_loader.get_asset_data()
        return list(asset_data.get('sprite_bank', {}).get('sprites', {}).keys())
    
    def get_available_objects(self) -> List[str]:
        """Get list of available object IDs."""
        if not self._instantiation_factory:
            return []
        
        asset_data = self._asset_loader.get_asset_data()
        return list(asset_data.get('object_registry', {}).get('objects', {}).keys())
    
    def get_available_environments(self) -> List[str]:
        """Get list of available environment IDs."""
        if not self._instantiation_factory:
            return []
        
        asset_data = self._asset_loader.get_asset_data()
        return list(asset_data.get('environment_registry', {}).get('maps', {}).keys())
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        return {
            'character_cache': self._character_cache.get_stats(),
            'object_cache': self._object_cache.get_stats(),
            'environment_cache': self._environment_cache.get_stats()
        }
    
    def cleanup(self) -> None:
        """Clean up all resources."""
        # Clean up asset loader
        self._asset_loader.cleanup()
        
        # Clear caches
        self._character_cache.clear()
        self._object_cache.clear()
        self._environment_cache.clear()
        
        # Reset factories
        self._instantiation_factory = None
        self._interaction_provider = None
        
        logger.info("🧹 PrefabFactory cleaned up")


def main():
    """Test the PrefabFactory with the baked assets."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🏭 PrefabFactory - Runtime Asset Loader")
    print("=" * 50)
    print("Testing pre-baked asset loading...")
    print()
    
    # Initialize factory
    asset_path = Path("assets/assets.dgt")
    factory = PrefabFactory(asset_path)
    
    # Load assets
    if not factory.load_assets():
        print("❌ Failed to load assets")
        return
    
    print("✅ Assets loaded successfully")
    
    # Test character creation
    print("\n👤 Testing character creation:")
    characters = factory.get_available_characters()
    for char_id in characters[:3]:  # Test first 3 characters
        character = factory.create_character(char_id, position=(10, 10))
        if character:
            print(f"✅ Created {char_id}: {character.metadata.get('description', 'No description')}")
    
    # Test object creation
    print("\n📦 Testing object creation:")
    objects = factory.get_available_objects()
    for obj_id in objects[:3]:  # Test first 3 objects
        obj = factory.create_object(obj_id, position=(5, 5))
        if obj:
            print(f"✅ Created {obj_id}: {obj.sprite_data.get('description', 'No description')}")
    
    # Test environment creation
    print("\n🗺️ Testing environment creation:")
    environments = factory.get_available_environments()
    for env_id in environments:
        env = factory.create_environment(env_id)
        if env:
            print(f"✅ Created {env_id}: {env.dimensions} tiles, {len(env.objects)} objects")
    
    # Test interaction and dialogue
    print("\n💬 Testing interactions:")
    interaction = factory.get_interaction("LootTable_T1")
    if interaction:
        print(f"✅ LootTable_T1: {interaction.get('description', 'No description')}")
    
    dialogue = factory.get_dialogue_set("tavern_default")
    if dialogue:
        greetings = dialogue.get('greetings', [])
        if greetings:
            print(f"✅ Tavern dialogue: {greetings[0]}")
    
    # Cleanup
    factory.cleanup()
    
    print("\n🏆 PrefabFactory test completed successfully!")
    print("🚀 Ready for runtime asset instantiation")


if __name__ == "__main__":
    import time
    main()
