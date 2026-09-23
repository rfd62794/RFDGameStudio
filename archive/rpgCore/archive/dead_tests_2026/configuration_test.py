import pytest
from pydantic import ValidationError
from src.game_engine.foundation.config_schemas import GameConfig, PhysicsConfig, GraphicsConfig
from src.game_engine.foundation.config_manager import ConfigManager

# --- Schema Tests ---

def test_physics_config_defaults():
    config = PhysicsConfig()
    assert config.collision_check_frequency == 60
    assert config.particle_pool_size == 1000

def test_physics_config_validation():
    with pytest.raises(ValidationError):
        PhysicsConfig(collision_check_frequency=300) # Max 240
        
    with pytest.raises(ValidationError):
        PhysicsConfig(collision_detection_type="invalid")

def test_game_config_version():
    config = GameConfig(version="1.0.0")
    assert config.version == "1.0.0"
    
    with pytest.raises(ValidationError):
        GameConfig(version="1.0") # Needs 3 parts

# --- Manager Tests ---

@pytest.fixture
def config_manager():
    # Reset singleton
    ConfigManager._instance = None
    return ConfigManager()

def test_manager_defaults(config_manager):
    assert config_manager.config.game_title == "rpgCore Game"
    assert config_manager.get("physics.substeps") == 1

def test_manager_load_yaml(config_manager, tmp_path):
    p = tmp_path / "config.yaml"
    p.write_text("""
game_title: "Test Game"
physics:
  substeps: 5
    """)
    
    config = config_manager.load_config(str(p))
    assert config.game_title == "Test Game"
    assert config.physics.substeps == 5

def test_manager_dot_notation(config_manager):
    config_manager._config = GameConfig(
        graphics=GraphicsConfig(fullscreen=True)
    )
    assert config_manager.get("graphics.fullscreen") is True
    assert config_manager.get("graphics.invalid", "default") == "default"
