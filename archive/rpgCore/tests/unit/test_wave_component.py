"""
Unit tests for Wave Component
"""
import pytest
from src.shared.ecs.components.wave_component import WaveComponent


@pytest.fixture
def wave_component():
    """Create a wave component"""
    return WaveComponent(wave_number=1)


def test_wave_component_initialization():
    """Test WaveComponent initialization"""
    wave = WaveComponent(wave_number=5)
    assert wave.wave_number == 5
    assert wave.enemies_spawned == 0
    assert wave.enemies_alive == 0
    assert wave.spawn_rate == 1.0
    assert wave.wave_active is False
    assert wave.wave_complete is False


def test_wave_start_wave(wave_component):
    """Test starting a new wave"""
    wave_component.start_wave()
    
    assert wave_component.wave_active is True
    assert wave_component.wave_complete is False
    assert wave_component.enemies_spawned == 0
    assert wave_component.enemies_alive == 0
    assert wave_component.spawn_timer == 0.0
    
    # Check difficulty scaling
    assert wave_component.enemy_hp_multiplier == 1.0
    assert wave_component.enemy_speed_multiplier == 1.0
    assert wave_component.enemy_reward_multiplier == 1.0


def test_wave_spawn_timer(wave_component):
    """Test spawn timer updates"""
    wave_component.start_wave()
    
    # Update timer
    wave_component.update_spawn_timer(0.5)
    assert wave_component.spawn_timer == 0.5
    
    # Update more
    wave_component.update_spawn_timer(0.3)
    assert wave_component.spawn_timer == 0.8


def test_wave_can_spawn_enemy(wave_component):
    """Test enemy spawning conditions"""
    wave_component.start_wave()
    
    # Can't spawn initially (need to wait for spawn interval)
    assert wave_component.can_spawn_enemy() is False
    
    # Wait for spawn interval
    wave_component.update_spawn_timer(2.1)  # > spawn_interval
    assert wave_component.can_spawn_enemy() is True
    
    # Spawn an enemy
    wave_component.spawn_enemy()
    assert wave_component.enemies_spawned == 1
    assert wave_component.enemies_alive == 1
    assert wave_component.spawn_timer == 0.0
    
    # Can't spawn immediately (cooldown)
    assert wave_component.can_spawn_enemy() is False
    
    # Can spawn after cooldown
    wave_component.update_spawn_timer(2.1)  # > spawn_interval
    assert wave_component.can_spawn_enemy() is True


def test_wave_complete_when_all_enemies_spawned(wave_component):
    """Test wave completion when all enemies spawned"""
    wave_component.start_wave()
    wave_component.enemies_per_wave = 3
    
    # Spawn all enemies
    wave_component.spawn_enemy()
    wave_component.spawn_enemy()
    wave_component.spawn_enemy()
    
    assert wave_component.enemies_spawned == 3
    assert wave_component.enemies_alive == 3
    assert wave_component.can_spawn_enemy() is False
    
    # Wave should not be complete yet (enemies still alive)
    assert wave_component.wave_complete is False


def test_wave_complete_when_all_enemies_killed(wave_component):
    """Test wave completion when all enemies killed"""
    wave_component.start_wave()
    wave_component.enemies_per_wave = 2
    
    # Spawn enemies
    wave_component.spawn_enemy()
    wave_component.spawn_enemy()
    assert wave_component.enemies_alive == 2
    
    # Kill all enemies
    wave_component.enemy_killed()
    assert wave_component.enemies_alive == 1
    wave_component.enemy_killed()
    assert wave_component.enemies_alive == 0
    
    # Wave should be complete
    assert wave_component.wave_complete is True
    assert wave_component.wave_active is False


def test_wave_complete_when_all_enemies_escaped(wave_component):
    """Test wave completion when all enemies escaped"""
    wave_component.start_wave()
    wave_component.enemies_per_wave = 2
    
    # Spawn enemies
    wave_component.spawn_enemy()
    wave_component.spawn_enemy()
    assert wave_component.enemies_alive == 2
    
    # Enemies escape
    wave_component.enemy_escaped()
    assert wave_component.enemies_alive == 1
    wave_component.enemy_escaped()
    assert wave_component.enemies_alive == 0
    
    # Wave should be complete
    assert wave_component.wave_complete is True
    assert wave_component.wave_active is False


def test_wave_progress(wave_component):
    """Test wave progress calculation"""
    wave_component.enemies_per_wave = 10
    
    # No progress initially
    assert wave_component.get_progress() == 0.0
    
    # Half progress
    wave_component.enemies_spawned = 5
    assert wave_component.get_progress() == 0.5
    
    # Full progress
    wave_component.enemies_spawned = 10
    assert wave_component.get_progress() == 1.0


def test_wave_remaining_enemies(wave_component):
    """Test remaining enemies calculation"""
    wave_component.enemies_per_wave = 8
    
    # All remaining initially
    assert wave_component.get_remaining_enemies() == 8
    
    # Some spawned
    wave_component.enemies_spawned = 3
    assert wave_component.get_remaining_enemies() == 5
    
    # All spawned
    wave_component.enemies_spawned = 8
    assert wave_component.get_remaining_enemies() == 0


def test_wave_info(wave_component):
    """Test wave information for UI"""
    wave_component.start_wave()
    wave_component.enemies_per_wave = 5
    wave_component.spawn_enemy()
    
    info = wave_component.get_wave_info()
    
    assert info["wave_number"] == 1
    assert info["enemies_total"] == 5
    assert info["enemies_spawned"] == 1
    assert info["enemies_alive"] == 1
    assert info["progress"] == 0.2  # 1/5
    assert info["is_active"] is True
    assert info["is_complete"] is False
    assert "difficulty_multipliers" in info


def test_wave_next_wave(wave_component):
    """Test progressing to next wave"""
    # Complete current wave
    wave_component.start_wave()
    wave_component.complete_wave()
    
    # Progress to next wave
    old_wave_number = wave_component.wave_number
    wave_component.next_wave()
    
    assert wave_component.wave_number == old_wave_number + 1
    assert wave_component.wave_complete is False
    assert wave_component.wave_active is False
    assert wave_component.enemies_spawned == 0
    assert wave_component.enemies_alive == 0


def test_wave_difficulty_scaling(wave_component):
    """Test difficulty scaling with wave number"""
    # Wave 1
    wave_component.wave_number = 1
    wave_component.start_wave()
    
    hp_multiplier_1 = wave_component.enemy_hp_multiplier
    speed_multiplier_1 = wave_component.enemy_speed_multiplier
    reward_multiplier_1 = wave_component.enemy_reward_multiplier
    
    # Wave 5
    wave_component.wave_number = 5
    wave_component.start_wave()
    
    hp_multiplier_5 = wave_component.enemy_hp_multiplier
    speed_multiplier_5 = wave_component.enemy_speed_multiplier
    reward_multiplier_5 = wave_component.enemy_reward_multiplier
    
    # Higher waves should have higher multipliers
    assert hp_multiplier_5 > hp_multiplier_1
    assert speed_multiplier_5 > speed_multiplier_1
    assert reward_multiplier_5 > reward_multiplier_1


def test_wave_spawn_points(wave_component):
    """Test spawn point configuration"""
    # Default spawn points
    expected_points = [(0, 5), (9, 5)]
    assert wave_component.spawn_points == expected_points
    
    # Can add more spawn points
    wave_component.spawn_points.append((5, 0))
    assert len(wave_component.spawn_points) == 3
