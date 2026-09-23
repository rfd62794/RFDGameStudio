import pytest
from pathlib import Path
from unittest.mock import Mock, patch, mock_open
from src.game_engine.foundation.asset_registry import AssetRegistry, AssetType, Asset
from src.game_engine.foundation.asset_loaders import SpriteAssetLoader, ConfigAssetLoader
from src.game_engine.foundation.asset_cache import AssetCache

# --- AssetRegistry Tests ---

@pytest.fixture
def registry():
    # Reset singleton logic for testing is tricky, so we'll just new up one 
    # if we weren't doing strict singleton enforcement, but since we are...
    # We will clear it before each test
    reg = AssetRegistry()
    reg.clear_registry()
    yield reg
    reg.clear_registry()

def test_registry_singleton(registry):
    reg2 = AssetRegistry()
    assert registry is reg2

def test_register_and_get_asset(registry):
    registry.register_asset("test_sprite", AssetType.SPRITE, "dummy_data", {"meta": 1})
    asset = registry.get_asset("test_sprite")
    
    assert asset is not None
    assert asset.id == "test_sprite"
    assert asset.type == AssetType.SPRITE
    assert asset.data == "dummy_data"
    assert asset.metadata == {"meta": 1}

def test_list_assets_filtering(registry):
    registry.register_asset("s1", AssetType.SPRITE, "d1")
    registry.register_asset("c1", AssetType.CONFIG, "d2")
    
    sprites = registry.list_assets(AssetType.SPRITE)
    configs = registry.list_assets(AssetType.CONFIG)
    
    assert len(sprites) == 1
    assert sprites[0].id == "s1"
    assert len(configs) == 1
    assert configs[0].id == "c1"

# --- AssetLoader Tests ---

def test_config_loader_yaml():
    loader = ConfigAssetLoader()
    yaml_content = "key: value\nlist: [1, 2]"
    
    with patch("builtins.open", mock_open(read_data=yaml_content)):
        with patch("pathlib.Path.exists", return_value=True):
            with patch("pathlib.Path.suffix", new_callable=lambda: ".yaml"): # mock property tricky
               # Easier to mock pyyaml directly or file system
               pass

    # Using a tmp_path is better for real file io tests
    
def test_config_loader_real_file(tmp_path):
    d = tmp_path / "subdir"
    d.mkdir()
    p = d / "test.yaml"
    p.write_text("foo: bar")
    
    loader = ConfigAssetLoader()
    data = loader.load(str(p))
    assert data == {"foo": "bar"}

def test_sprite_loader_supports():
    loader = SpriteAssetLoader()
    assert loader.supports_type(AssetType.SPRITE)
    assert not loader.supports_type(AssetType.SOUND)

# --- AssetCache Tests ---

def test_cache_lru_eviction():
    cache = AssetCache(max_size=2)
    asset1 = Asset("1", AssetType.SPRITE, "d1")
    asset2 = Asset("2", AssetType.SPRITE, "d2")
    asset3 = Asset("3", AssetType.SPRITE, "d3")
    
    cache.put("1", asset1)
    cache.put("2", asset2)
    
    # Access 1 to make it recently used
    cache.get("1")
    
    # Add 3, should evict 2 (LRU)
    cache.put("3", asset3)
    
    assert cache.get("1") is not None
    assert cache.get("3") is not None
    assert cache.get("2") is None

def test_cache_stats():
    cache = AssetCache(max_size=10)
    asset = Asset("1", AssetType.SPRITE, "d1")
    
    cache.get("1") # Miss
    cache.put("1", asset)
    cache.get("1") # Hit
    
    stats = cache.get_stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["hit_rate"] == 0.5
