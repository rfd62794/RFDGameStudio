"""
Comprehensive test suite for SOLID architecture refactoring.

Validates that all components follow SOLID principles and work together
correctly with proper dependency injection and resource management.
"""

import pytest
import tempfile
import gzip
import pickle
import struct
from pathlib import Path
from unittest.mock import Mock, patch
from typing import Dict, Any

from loguru import logger

from src.models.interfaces import IAssetLoader, ICacheManager, IInstantiationFactory
from src.models.asset_loader import BinaryAssetLoader, MemoryMappedFile
from src.models.cache_manager import LRUCacheManager, CacheManagerFactory
from src.models.instantiation_factory import (
    AssetInstantiationFactory, 
    PaletteApplier, 
    InteractionProvider
)
from src.models.prefab_factory import PrefabFactory
from src.models.container import DIContainer, ContainerBuilder, LifetimeScope
from src.models.asset_schemas import (
    AssetManifest, 
    CharacterMetadata, 
    BinaryAssetHeader,
    AssetValidator
)


class TestMemoryMappedFile:
    """Test RAII wrapper for memory-mapped files."""
    
    def test_context_manager_cleanup(self):
        """Test automatic cleanup with context manager."""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = Path(temp_file.name)
            
            # Write test data
            test_data = b"Hello, World!"
            temp_path.write_bytes(test_data)
            
            # Test context manager
            with MemoryMappedFile(temp_path) as mapped_file:
                assert not mapped_file._closed
                data = mapped_file.read(0, len(test_data))
                assert data == test_data
            
            # File should be closed after context
            assert mapped_file._closed
    
    def test_thread_safety(self):
        """Test thread-safe operations."""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = Path(temp_file.name)
            temp_path.write_bytes(b"test data")
            
            mapped_file = MemoryMappedFile(temp_path)
            mapped_file.open()
            
            # Multiple threads should be able to read safely
            import threading
            results = []
            
            def read_data():
                data = mapped_file.read(0, 4)
                results.append(data)
            
            threads = [threading.Thread(target=read_data) for _ in range(5)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            
            assert len(results) == 5
            assert all(result == b"test" for result in results)
            
            mapped_file.close()


class TestLRUCacheManager:
    """Test LRU cache implementation."""
    
    def test_basic_operations(self):
        """Test basic cache operations."""
        cache = LRUCacheManager(max_size=3)
        
        # Test set and get
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        
        # Test miss
        assert cache.get("nonexistent") is None
        
        # Test size
        assert cache.size() == 1
    
    def test_lru_eviction(self):
        """Test LRU eviction policy."""
        cache = LRUCacheManager(max_size=2)
        
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")  # Should evict key1
        
        assert cache.get("key1") is None  # Evicted
        assert cache.get("key2") == "value2"
        assert cache.get("key3") == "value3"
    
    def test_ttl_expiration(self):
        """Test TTL-based expiration."""
        import time
        
        cache = LRUCacheManager(max_size=10, ttl_seconds=1)
        
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        
        # Wait for expiration
        time.sleep(1.1)
        assert cache.get("key1") is None
    
    def test_cache_statistics(self):
        """Test cache statistics tracking."""
        cache = LRUCacheManager(max_size=10)
        
        # Generate some activity
        cache.set("key1", "value1")
        cache.get("key1")  # Hit
        cache.get("nonexistent")  # Miss
        
        stats = cache.get_stats()
        assert stats['hits'] == 1
        assert stats['misses'] == 1
        assert stats['hit_rate'] == 0.5


class TestAssetLoader:
    """Test binary asset loader with resource management."""
    
    def create_test_asset_file(self, temp_dir: Path) -> Path:
        """Create a test asset file."""
        asset_path = temp_dir / "test_assets.dgt"
        
        # Create test asset data
        asset_data = {
            'sprite_bank': {
                'sprites': {'test_char': gzip.compress(pickle.dumps([[1, 2], [3, 4]]))},
                'metadata': {'test_char': {'palette': 'test_palette', 'description': 'Test'}},
                'palettes': {'test_palette': ['red', 'blue', 'green']}
            },
            'object_registry': {
                'objects': {'test_obj': gzip.compress(pickle.dumps({'desc': 'Test object'}))},
                'interactions': {'test_obj': 'test_interaction'}
            },
            'environment_registry': {
                'maps': {'test_env': gzip.compress(pickle.dumps([(1, 10), (2, 5)]))},
                'dimensions': {'test_env': [10, 8]},
                'object_placements': {'test_env': []},
                'npc_placements': {'test_env': []}
            },
            'tile_registry': {},
            'interaction_registry': {
                'interactions': {'test_interaction': {'description': 'Test interaction'}},
                'dialogue_sets': {}
            }
        }
        
        # Compress asset data
        compressed_data = gzip.compress(pickle.dumps(asset_data))
        
        # Create binary file with header
        with open(asset_path, 'wb') as f:
            # Write header
            f.write(b'DGT\x01')  # Magic
            f.write(struct.pack('<I', 1))  # Version
            f.write(struct.pack('<d', 1234567890.0))  # Build time
            f.write(b'0123456789abcdef0123456789abcdef')  # Checksum (fake)
            f.write(struct.pack('<I', 1))  # Asset count
            f.write(struct.pack('<I', 40))  # Data offset
            
            # Write compressed data
            f.write(compressed_data)
        
        return asset_path
    
    def test_successful_loading(self, tmp_path):
        """Test successful asset loading."""
        asset_path = self.create_test_asset_file(tmp_path)
        loader = BinaryAssetLoader(validation_enabled=False)
        
        result = loader.load_assets(asset_path)
        
        assert result is True
        assert loader.get_asset_data() is not None
        assert loader.get_metadata() is not None
        assert loader.get_metadata().version == 1
        
        loader.cleanup()
    
    def test_invalid_file_format(self, tmp_path):
        """Test handling of invalid file format."""
        invalid_path = tmp_path / "invalid.dgt"
        invalid_path.write_bytes(b"invalid data")
        
        loader = BinaryAssetLoader()
        result = loader.load_assets(invalid_path)
        
        assert result is False
    
    def test_resource_cleanup(self, tmp_path):
        """Test proper resource cleanup."""
        asset_path = self.create_test_asset_file(tmp_path)
        loader = BinaryAssetLoader()
        
        loader.load_assets(asset_path)
        
        # Verify resources are allocated
        assert loader._mapped_file is not None
        assert loader._asset_data is not None
        
        # Cleanup
        loader.cleanup()
        
        # Verify cleanup
        assert loader._mapped_file is None
        assert loader._asset_data is None


class TestDependencyInjection:
    """Test dependency injection container."""
    
    def test_singleton_registration(self):
        """Test singleton service registration."""
        container = DIContainer()
        
        container.register_singleton(str, lambda: "test_string")
        
        instance1 = container.resolve(str)
        instance2 = container.resolve(str)
        
        assert instance1 == instance2  # Same instance
        assert instance1 == "test_string"
    
    def test_transient_registration(self):
        """Test transient service registration."""
        container = DIContainer()
        
        call_count = 0
        
        def factory():
            nonlocal call_count
            call_count += 1
            return f"instance_{call_count}"
        
        container.register_transient(str, factory=factory)
        
        instance1 = container.resolve(str)
        instance2 = container.resolve(str)
        
        assert instance1 != instance2  # Different instances
        assert call_count == 2
    
    def test_scoped_registration(self):
        """Test scoped service registration."""
        container = DIContainer()
        
        call_count = 0
        
        def factory():
            nonlocal call_count
            call_count += 1
            return f"instance_{call_count}"
        
        container.register_scoped(str, factory=factory)
        
        # Test within same scope
        with container.create_scope():
            instance1 = container.resolve(str)
            instance2 = container.resolve(str)
            assert instance1 == instance2  # Same instance within scope
        
        # Test different scopes
        with container.create_scope():
            instance3 = container.resolve(str)
            assert instance1 != instance3  # Different instance in new scope
        
        assert call_count == 2
    
    def test_container_builder(self):
        """Test container builder pattern."""
        builder = ContainerBuilder("test")
        
        builder.add_singleton(str, lambda: "singleton")\
               .add_transient(int, lambda: 42)\
               .register(float, factory=lambda: 3.14)
        
        container = builder.build()
        
        str_instance = container.resolve(str)
        int_instance1 = container.resolve(int)
        int_instance2 = container.resolve(int)
        
        assert str_instance == "singleton"
        assert int_instance1 == 42
        assert int_instance2 == 42
        assert int_instance1 != int_instance2  # Transient


class TestPydanticValidation:
    """Test Pydantic model validation."""
    
    def test_character_metadata_validation(self):
        """Test character metadata validation."""
        # Valid metadata
        valid_data = {
            "description": "Test character",
            "palette": "test_palette",
            "tags": ["player", "warrior"]
        }
        
        metadata = CharacterMetadata(**valid_data)
        assert metadata.description == "Test character"
        assert metadata.palette == "test_palette"
        assert len(metadata.tags) == 2
        
        # Invalid metadata (too many tags)
        invalid_data = {
            "description": "Test character",
            "palette": "test_palette",
            "tags": [f"tag_{i}" for i in range(11)]  # Too many tags
        }
        
        with pytest.raises(ValueError):
            CharacterMetadata(**invalid_data)
    
    def test_asset_manifest_validation(self):
        """Test complete asset manifest validation."""
        manifest_data = {
            "characters": {
                "test_char": {
                    "description": "Test character",
                    "palette": "test_palette",
                    "tags": ["player"]
                }
            },
            "palettes": {
                "test_palette": {
                    "description": "Test palette",
                    "colors": {0: "transparent", 1: "red", 2: "blue"}
                }
            },
            "objects": {},
            "environments": {},
            "tiles": {},
            "interactions": {},
            "dialogue_sets": {}
        }
        
        manifest = AssetManifest(**manifest_data)
        assert len(manifest.characters) == 1
        assert len(manifest.palettes) == 1
    
    def test_binary_header_validation(self):
        """Test binary header validation."""
        # Valid header data
        header_data = (
            b'DGT\x01' +  # Magic
            struct.pack('<I', 1) +  # Version
            struct.pack('<d', 1234567890.0) +  # Build time
            b'0123456789abcdef0123456789abcdef' +  # Checksum
            struct.pack('<I', 10) +  # Asset count
            struct.pack('<I', 40)  # Data offset
        )
        
        header = AssetValidator.validate_binary_header(header_data)
        assert header.version == 1
        assert header.asset_count == 10
        
        # Invalid header (wrong magic)
        invalid_header = b'INVALID' + header_data[7:]
        
        with pytest.raises(ValueError):
            AssetValidator.validate_binary_header(invalid_header)


class TestPrefabFactoryIntegration:
    """Integration tests for refactored PrefabFactory."""
    
    def create_complete_test_assets(self, temp_dir: Path) -> Path:
        """Create complete test asset file."""
        asset_path = temp_dir / "complete_assets.dgt"
        
        asset_data = {
            'sprite_bank': {
                'sprites': {
                    'warrior_novice': gzip.compress(pickle.dumps([[1, 2], [3, 4]])),
                    'mage_apprentice': gzip.compress(pickle.dumps([[5, 6], [7, 8]]))
                },
                'metadata': {
                    'warrior_novice': {'palette': 'legion_red', 'description': 'Novice warrior'},
                    'mage_apprentice': {'palette': 'arcane_blue', 'description': 'Apprentice mage'}
                },
                'palettes': {
                    'legion_red': ['red', 'dark_red', 'silver'],
                    'arcane_blue': ['blue', 'dark_blue', 'purple']
                }
            },
            'object_registry': {
                'objects': {
                    'chest_wooden': gzip.compress(pickle.dumps({'desc': 'Wooden chest'})),
                    'door_wooden': gzip.compress(pickle.dumps({'desc': 'Wooden door'}))
                },
                'interactions': {
                    'chest_wooden': 'LootTable_T1',
                    'door_wooden': 'Door_Exit'
                }
            },
            'environment_registry': {
                'maps': {
                    'tavern_interior': gzip.compress(pickle.dumps([(1, 20), (2, 10)]))
                },
                'dimensions': {'tavern_interior': [20, 18]},
                'object_placements': {'tavern_interior': []},
                'npc_placements': {'tavern_interior': []}
            },
            'tile_registry': {},
            'interaction_registry': {
                'interactions': {
                    'LootTable_T1': {'description': 'Basic loot', 'interaction_type': 'loot_table'},
                    'Door_Exit': {'description': 'Exit door', 'interaction_type': 'door_exit'}
                },
                'dialogue_sets': {
                    'tavern_default': {
                        'greetings': ['Welcome!'],
                        'responses': ['Hello']
                    }
                }
            }
        }
        
        compressed_data = gzip.compress(pickle.dumps(asset_data))
        
        with open(asset_path, 'wb') as f:
            f.write(b'DGT\x01')
            f.write(struct.pack('<I', 1))
            f.write(struct.pack('<d', 1234567890.0))
            f.write(b'0123456789abcdef0123456789abcdef')
            f.write(struct.pack('<I', 4))  # 4 assets
            f.write(struct.pack('<I', 40))
            f.write(compressed_data)
        
        return asset_path
    
    def test_complete_factory_workflow(self, tmp_path):
        """Test complete factory workflow with DI."""
        asset_path = self.create_complete_test_assets(tmp_path)
        
        # Create factory
        factory = PrefabFactory(asset_path)
        
        # Load assets
        result = factory.load_assets()
        assert result is True
        
        # Test character creation
        character = factory.create_character('warrior_novice', position=(10, 10))
        assert character is not None
        assert character.character_id == 'warrior_novice'
        assert character.position == (10, 10)
        
        # Test object creation
        obj = factory.create_object('chest_wooden', position=(5, 5))
        assert obj is not None
        assert obj.object_id == 'chest_wooden'
        assert obj.position == (5, 5)
        
        # Test environment creation
        env = factory.create_environment('tavern_interior')
        assert env is not None
        assert env.environment_id == 'tavern_interior'
        assert env.dimensions == (20, 18)
        
        # Test interaction access
        interaction = factory.get_interaction('LootTable_T1')
        assert interaction is not None
        assert interaction['description'] == 'Basic loot'
        
        # Test dialogue access
        dialogue = factory.get_dialogue_set('tavern_default')
        assert dialogue is not None
        assert len(dialogue['greetings']) == 1
        
        # Test cache statistics
        stats = factory.get_cache_stats()
        assert 'character_cache' in stats
        assert 'object_cache' in stats
        assert 'environment_cache' in stats
        
        # Cleanup
        factory.cleanup()
    
    def test_dependency_injection_integration(self, tmp_path):
        """Test factory with custom dependency injection."""
        asset_path = self.create_complete_test_assets(tmp_path)
        
        # Create custom asset loader
        custom_loader = BinaryAssetLoader(validation_enabled=True)
        
        # Create factory with custom loader
        factory = PrefabFactory(asset_path, asset_loader=custom_loader)
        
        result = factory.load_assets()
        assert result is True
        
        # Verify custom loader was used
        assert factory._asset_loader is custom_loader
        
        factory.cleanup()


if __name__ == "__main__":
    # Configure logging for tests
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="DEBUG",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    # Run tests
    pytest.main([__file__, "-v"])
