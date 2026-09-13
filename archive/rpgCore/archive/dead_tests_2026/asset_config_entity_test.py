import pytest
from typing import Dict, Any
from game_engine.foundation.asset_registry import AssetRegistry, AssetType
from game_engine.foundation.config_manager import ConfigManager
from game_engine.systems.body.entity_template import EntityTemplate, EntityTemplateRegistry
from game_engine.systems.body.entity_manager import EntityManager, Entity

@pytest.fixture
def entity_manager():
    em = EntityManager()
    em.initialize()
    return em

@pytest.fixture
def template_registry():
    # Reset singleton
    EntityTemplateRegistry._instance = None
    reg = EntityTemplateRegistry()
    
    # Register a basic template
    t1 = EntityTemplate(
        template_id="orc_warrior",
        entity_type="orc",
        base_properties={"health": 100, "strength": 50},
        components=["combat"]
    )
    reg.register_template(t1)
    return reg

def test_config_loading_integrated(tmp_path):
    cm = ConfigManager()
    p = tmp_path / "game_config.yaml"
    p.write_text("""
game_title: "Integration Test Game"
physics:
  particle_pool_size: 500
    """)
    config = cm.load_config(str(p))
    assert config.game_title == "Integration Test Game"
    assert config.physics.particle_pool_size == 500

class OrcEntity(Entity):
    def __init__(self):
        super().__init__()
        self.health = 0
        self.strength = 0
        self.entity_type = "orc"

def test_template_spawning(entity_manager, template_registry):
    entity_manager.set_template_registry(template_registry)
    entity_manager.register_entity_type("orc", OrcEntity)
    
    # Spawn from template
    result = entity_manager.spawn_from_template("orc_warrior", strength=60) # Override strength
    
    assert result.success is True
    entity = result.value
    assert isinstance(entity, OrcEntity)
    assert entity.entity_type == "orc"
    assert entity.health == 100 # From template base
    assert entity.strength == 60 # Override

def test_batch_spawn(entity_manager, template_registry):
    entity_manager.set_template_registry(template_registry)
    entity_manager.register_entity_type("orc", OrcEntity)
    
    entities = entity_manager.batch_spawn_from_template("orc_warrior", 5)
    assert len(entities) == 5
    assert entities[0].health == 100

def test_spawn_from_config(entity_manager):
    entity_manager.register_entity_type("manual_orc", OrcEntity)
    
    conf = {
        "entity_type": "manual_orc",
        "health": 200
    }
    
    result = entity_manager.spawn_from_config(conf)
    assert result.success is True
    assert result.value.health == 200
