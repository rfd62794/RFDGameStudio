"""
Unit tests for Tower Defense Systems
"""
import pytest
from src.shared.physics.kinematics import Vector2
from src.shared.ecs.components.behavior_component import BehaviorComponent
from src.shared.ecs.components.tower_component import TowerComponent
from src.shared.ecs.components.wave_component import WaveComponent
from src.shared.ecs.systems.tower_defense_behavior_system import TowerDefenseBehaviorSystem
from src.shared.ecs.systems.wave_system import WaveSystem
from src.shared.ecs.systems.upgrade_system import UpgradeSystem
from src.shared.ecs.systems.collision_system import CollisionSystem
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome


@pytest.fixture
def sample_creature():
    """Create a sample creature for testing"""
    genome = SlimeGenome(
        shape="round", size="medium", 
        base_color=(255, 0, 0), 
        pattern="solid", 
        pattern_color=(0, 0, 0),
        accessory="none",
        curiosity=0.5, energy=0.5, affection=0.3, shyness=0.2
    )
    creature = Creature(
        name="TestSlime",
        genome=genome
    )
    creature.forces = Vector2(0, 0)
    creature.kinematics.position = Vector2(100, 100)
    return creature


@pytest.fixture
def tower_component():
    """Create a tower component"""
    return TowerComponent()


@pytest.fixture
def behavior_component():
    """Create a behavior component"""
    return BehaviorComponent()


@pytest.fixture
def wave_component():
    """Create a wave component"""
    return WaveComponent()


def test_tower_defense_behavior_system_initialization():
    """Test TowerDefenseBehaviorSystem initialization"""
    system = TowerDefenseBehaviorSystem()
    assert system is not None


def test_scout_tower_behavior(sample_creature, tower_component, behavior_component):
    """Test scout tower behavior based on high curiosity"""
    system = TowerDefenseBehaviorSystem()
    
    # Set creature genome for scout tower
    sample_creature.genome.curiosity = 0.8
    
    # Update behavior
    force = system.update(sample_creature, behavior_component, tower_component, 0.016)
    
    # Tower should be configured as scout
    assert tower_component.tower_type == "scout"
    assert tower_component.base_range == 150.0
    assert tower_component.base_damage == 5.0
    assert tower_component.base_fire_rate == 2.0
    
    # Towers don't move, so force should be zero
    assert force.x == 0.0
    assert force.y == 0.0


def test_rapid_fire_tower_behavior(sample_creature, tower_component, behavior_component):
    """Test rapid fire tower behavior based on high energy"""
    system = TowerDefenseBehaviorSystem()
    
    # Set creature genome for rapid fire tower
    sample_creature.genome.energy = 0.8
    sample_creature.genome.curiosity = 0.2  # Lower than energy
    
    # Update behavior
    force = system.update(sample_creature, behavior_component, tower_component, 0.016)
    
    # Tower should be configured as rapid fire
    assert tower_component.tower_type == "rapid_fire"
    assert tower_component.base_range == 100.0
    assert tower_component.base_damage == 10.0
    assert tower_component.base_fire_rate == 3.0


def test_support_tower_behavior(sample_creature, tower_component, behavior_component):
    """Test support tower behavior based on high affection"""
    system = TowerDefenseBehaviorSystem()
    
    # Set creature genome for support tower
    sample_creature.genome.affection = 0.8
    sample_creature.genome.curiosity = 0.2  # Lower than affection
    sample_creature.genome.energy = 0.2  # Lower than affection
    
    # Update behavior
    force = system.update(sample_creature, behavior_component, tower_component, 0.016)
    
    # Tower should be configured as support
    assert tower_component.tower_type == "support"
    assert tower_component.base_range == 120.0
    assert tower_component.base_damage == 3.0
    assert tower_component.base_fire_rate == 1.0


def test_bunker_tower_behavior(sample_creature, tower_component, behavior_component):
    """Test bunker tower behavior based on high shyness"""
    system = TowerDefenseBehaviorSystem()
    
    # Set creature genome for bunker tower
    sample_creature.genome.shyness = 0.8
    sample_creature.genome.curiosity = 0.2  # Lower than shyness
    sample_creature.genome.energy = 0.2  # Lower than shyness
    sample_creature.genome.affection = 0.2  # Lower than shyness
    
    # Update behavior
    force = system.update(sample_creature, behavior_component, tower_component, 0.016)
    
    # Tower should be configured as bunker
    assert tower_component.tower_type == "bunker"
    assert tower_component.base_range == 80.0
    assert tower_component.base_damage == 20.0
    assert tower_component.base_fire_rate == 0.8


def test_balanced_tower_behavior(sample_creature, tower_component, behavior_component):
    """Test balanced tower behavior for moderate traits"""
    system = TowerDefenseBehaviorSystem()
    
    # Set creature genome for balanced tower
    sample_creature.genome.curiosity = 0.5
    sample_creature.genome.energy = 0.5
    sample_creature.genome.affection = 0.5
    sample_creature.genome.shyness = 0.5
    
    # Update behavior
    force = system.update(sample_creature, behavior_component, tower_component, 0.016)
    
    # Tower should be configured as balanced
    assert tower_component.tower_type == "balanced"
    assert tower_component.base_range == 100.0
    assert tower_component.base_damage == 10.0
    assert tower_component.base_fire_rate == 1.5


def test_wave_system_initialization():
    """Test WaveSystem initialization"""
    system = WaveSystem()
    assert system.wave_component is not None
    assert system.enemy_spawn_points == [(0, 5), (9, 5)]


def test_wave_system_start_wave():
    """Test starting a new wave"""
    system = WaveSystem()
    
    system.start_wave(1)
    
    wave_info = system.get_wave_info()
    assert wave_info['wave_number'] == 1
    assert wave_info['is_active'] is True
    assert wave_info['is_complete'] is False


def test_wave_system_create_enemy():
    """Test creating enemy slime"""
    system = WaveSystem()
    
    enemy = system._create_enemy_slime(1)
    
    assert enemy is not None
    assert "Enemy-W1-" in enemy.name
    assert enemy.current_hp > 0
    assert enemy.max_hp > 0
    assert enemy.kinematics.position is not None
    assert hasattr(enemy, 'reward')


def test_wave_system_update():
    """Test wave system update"""
    system = WaveSystem()
    system.start_wave(1)
    
    # Update with small dt (should not spawn enemies immediately)
    new_enemies = system.update(system.wave_component, 0.1)
    assert len(new_enemies) == 0
    
    # Update with enough time to spawn enemies
    new_enemies = system.update(system.wave_component, 2.1)
    assert len(new_enemies) > 0


def test_upgrade_system_initialization():
    """Test UpgradeSystem initialization"""
    system = UpgradeSystem()
    assert system.UPGRADE_COSTS is not None
    assert system.UPGRADE_MULTIPLIERS is not None
    assert system.MAX_UPGRADE_LEVELS is not None


def test_upgrade_system_upgrade_tower():
    """Test upgrading a tower"""
    system = UpgradeSystem()
    tower = TowerComponent()
    
    # Can upgrade with enough gold
    success, remaining_gold = system.upgrade_tower(tower, "damage", 150)
    assert success is True
    assert remaining_gold == 50
    assert tower.damage_upgrades == 1
    
    # Cannot upgrade with insufficient gold
    tower2 = TowerComponent()
    success, remaining_gold = system.upgrade_tower(tower2, "range", 50)
    assert success is False
    assert remaining_gold == 50  # Should return original gold when upgrade fails


def test_upgrade_system_get_upgrade_cost():
    """Test getting upgrade cost"""
    system = UpgradeSystem()
    tower = TowerComponent()
    
    # Initial cost
    assert system.get_upgrade_cost(tower, "damage") == 100
    
    # After one upgrade
    tower.damage_upgrades = 1
    assert system.get_upgrade_cost(tower, "damage") == 200


def test_upgrade_system_can_upgrade():
    """Test upgrade validation"""
    system = UpgradeSystem()
    tower = TowerComponent()
    
    # Can upgrade initially
    assert system.can_upgrade(tower, "damage") is True
    
    # Cannot upgrade invalid type
    assert system.can_upgrade(tower, "invalid") is False
    
    # Cannot upgrade beyond max level
    tower.damage_upgrades = 5
    assert system.can_upgrade(tower, "damage") is False


def test_upgrade_system_get_upgrade_info():
    """Test getting upgrade information"""
    system = UpgradeSystem()
    tower = TowerComponent()
    
    info = system.get_upgrade_info(tower)
    
    assert "damage" in info
    assert "range" in info
    assert "fire_rate" in info
    
    damage_info = info["damage"]
    assert "current_level" in damage_info
    assert "max_level" in damage_info
    assert "can_upgrade" in damage_info
    assert "cost" in damage_info
    assert "description" in damage_info


def test_collision_system_initialization():
    """Test CollisionSystem initialization"""
    system = CollisionSystem()
    assert system.projectiles == []
    assert system.projectile_speed == 200.0


def test_collision_system_fire_projectile():
    """Test firing projectiles"""
    system = CollisionSystem()
    
    # Create tower and enemy
    tower = Creature(name="Tower", genome=SlimeGenome(
        shape="round", size="medium", base_color=(255, 0, 0),
        pattern="solid", pattern_color=(0, 0, 0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
    ))
    tower.kinematics.position = Vector2(100, 100)
    tower.tower_component = TowerComponent()
    
    enemy = Creature(name="Enemy", genome=SlimeGenome(
        shape="round", size="medium", base_color=(255, 0, 0),
        pattern="solid", pattern_color=(0, 0, 0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
    ))
    enemy.kinematics.position = Vector2(200, 100)
    enemy.current_hp = 50
    
    # Fire projectile
    system._fire_projectile(tower, enemy, tower.tower_component)
    
    assert len(system.projectiles) == 1
    projectile = system.projectiles[0]
    assert projectile.damage == tower.tower_component.get_damage()
    assert projectile.tower_id == tower.slime_id


def test_collision_system_update_projectiles():
    """Test updating projectiles"""
    system = CollisionSystem()
    
    # Create projectile
    from src.shared.ecs.systems.collision_system import Projectile
    projectile = Projectile(
        position=Vector2(100, 100),
        velocity=Vector2(50, 0),
        damage=10,
        tower_id="test"
    )
    system.projectiles.append(projectile)
    
    # Update projectiles
    system._update_projectiles(0.1)
    
    # Projectile should have moved
    assert system.projectiles[0].position.x > 100


def test_collision_system_check_collisions():
    """Test projectile-enemy collisions"""
    system = CollisionSystem()
    
    # Create enemy
    enemy = Creature(name="Enemy", genome=SlimeGenome(
        shape="round", size="medium", base_color=(255, 0, 0),
        pattern="solid", pattern_color=(0, 0, 0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
    ))
    enemy.kinematics.position = Vector2(100, 100)
    enemy.current_hp = 50
    enemy.reward = 20
    
    # Create projectile at same position
    from src.shared.ecs.systems.collision_system import Projectile
    projectile = Projectile(
        position=Vector2(100, 100),
        velocity=Vector2(0, 0),
        damage=10,
        tower_id="test"
    )
    system.projectiles.append(projectile)
    
    # Check collisions
    results = {'damage_dealt': 0}
    system._check_projectile_collisions([enemy], results)
    
    # Enemy should be damaged
    assert enemy.current_hp == 40
    assert results['damage_dealt'] == 10


def test_collision_system_enemy_escaped():
    """Test enemy escape detection"""
    system = CollisionSystem()
    
    # Create enemy beyond screen
    enemy = Creature(name="Enemy", genome=SlimeGenome(
        shape="round", size="medium", base_color=(255, 0, 0),
        pattern="solid", pattern_color=(0, 0, 0), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
    ))
    enemy.kinematics.position = Vector2(500, 100)  # Beyond 480px
    enemy.current_hp = 50
    
    # Check escape
    results = {'enemies_escaped': 0}
    system._check_enemy_escaped([enemy], results)
    
    # Enemy should be marked as escaped
    assert results['enemies_escaped'] == 1
    assert enemy.current_hp == 0  # Marked as dead
