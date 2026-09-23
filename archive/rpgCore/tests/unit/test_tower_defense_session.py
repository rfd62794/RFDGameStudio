"""
Unit tests for Tower Defense Session and Feedback
"""
import pytest
import tempfile
import json
from pathlib import Path
from src.shared.ecs.sessions.tower_defense_session import TowerDefenseSession
from src.shared.ecs.utils.tower_defense_feedback import end_tower_defense_session, get_session_summary, format_session_results, validate_session_integrity
from src.shared.teams.roster import Roster
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Vector2


@pytest.fixture
def tower_defense_session():
    """Create a tower defense session"""
    return TowerDefenseSession()


@pytest.fixture
def sample_roster():
    """Create a sample roster"""
    roster = Roster()
    roster.gold = 500
    return roster


@pytest.fixture
def sample_creature():
    """Create a sample creature"""
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
    creature.kinematics.position = Vector2(100, 100)
    return creature


def test_tower_defense_session_initialization(tower_defense_session):
    """Test TowerDefenseSession initialization"""
    assert tower_defense_session.session_id is not None
    assert tower_defense_session.wave == 1
    assert tower_defense_session.gold == 100
    assert tower_defense_session.lives == 20
    assert tower_defense_session.score == 0
    assert tower_defense_session.towers == []
    assert tower_defense_session.enemies == []
    assert tower_defense_session.tower_grid == {}
    assert tower_defense_session.game_active is False
    assert tower_defense_session.game_over is False


def test_tower_defense_session_start_game(tower_defense_session):
    """Test starting a game"""
    tower_defense_session.start_game()
    
    assert tower_defense_session.game_active is True
    assert tower_defense_session.game_paused is False
    assert tower_defense_session.game_over is False
    assert tower_defense_session.wave == 1
    assert tower_defense_session.gold == 100
    assert tower_defense_session.lives == 20
    assert tower_defense_session.score == 0
    assert tower_defense_session.wave_component.wave_active is True


def test_tower_defense_session_pause_resume(tower_defense_session):
    """Test pausing and resuming game"""
    tower_defense_session.start_game()
    
    # Pause game
    tower_defense_session.pause_game()
    assert tower_defense_session.game_paused is True
    
    # Resume game
    tower_defense_session.resume_game()
    assert tower_defense_session.game_paused is False


def test_tower_defense_session_place_tower(tower_defense_session, sample_creature):
    """Test placing towers"""
    tower_defense_session.start_game()
    
    # Place tower
    success = tower_defense_session.place_tower(sample_creature, 2, 3)
    assert success is True
    assert len(tower_defense_session.towers) == 1
    assert tower_defense_session.towers_placed == 1
    assert (2, 3) in tower_defense_session.tower_grid
    assert tower_defense_session.tower_grid[(2, 3)] == sample_creature.slime_id
    
    # Try to place tower at same position
    success = tower_defense_session.place_tower(sample_creature, 2, 3)
    assert success is False
    assert len(tower_defense_session.towers) == 1
    
    # Try to place same slime again
    success = tower_defense_session.place_tower(sample_creature, 3, 3)
    assert success is False
    assert len(tower_defense_session.towers) == 1


def test_tower_defense_session_remove_tower(tower_defense_session, sample_creature):
    """Test removing towers"""
    tower_defense_session.start_game()
    
    # Place tower first
    tower_defense_session.place_tower(sample_creature, 2, 3)
    assert len(tower_defense_session.towers) == 1
    
    # Remove tower
    success = tower_defense_session.remove_tower(2, 3)
    assert success is True
    assert len(tower_defense_session.towers) == 0
    assert (2, 3) not in tower_defense_session.tower_grid
    
    # Try to remove from empty position
    success = tower_defense_session.remove_tower(2, 3)
    assert success is False


def test_tower_defense_session_gold_management(tower_defense_session):
    """Test gold management"""
    tower_defense_session.start_game()
    
    # Add gold
    tower_defense_session.add_gold(50)
    assert tower_defense_session.gold == 150
    
    # Spend gold
    success = tower_defense_session.spend_gold(75)
    assert success is True
    assert tower_defense_session.gold == 75
    
    # Try to spend more than available
    success = tower_defense_session.spend_gold(100)
    assert success is False
    assert tower_defense_session.gold == 75


def test_tower_defense_session_lives(tower_defense_session):
    """Test life management"""
    tower_defense_session.start_game()
    
    # Lose life
    tower_defense_session.lose_life()
    assert tower_defense_session.lives == 19
    
    # Lose all lives
    for _ in range(19):
        tower_defense_session.lose_life()
    
    assert tower_defense_session.lives == 0
    assert tower_defense_session.game_over is True
    assert tower_defense_session.victory is False


def test_tower_defense_session_score(tower_defense_session):
    """Test score management"""
    tower_defense_session.start_game()
    
    # Add score
    tower_defense_session.add_score(100)
    assert tower_defense_session.score == 100
    
    # Add more score
    tower_defense_session.add_score(50)
    assert tower_defense_session.score == 150


def test_tower_defense_session_complete_wave(tower_defense_session):
    """Test wave completion"""
    tower_defense_session.start_game()
    
    # Complete wave
    tower_defense_session.complete_wave()
    
    assert tower_defense_session.completed_waves == 1
    assert tower_defense_session.wave == 2
    assert tower_defense_session.gold > 100  # Should have bonus gold


def test_tower_defense_session_end_game(tower_defense_session):
    """Test ending game"""
    tower_defense_session.start_game()
    
    # End game with victory
    tower_defense_session.end_game(victory=True)
    assert tower_defense_session.game_active is False
    assert tower_defense_session.game_over is True
    assert tower_defense_session.victory is True
    
    # End game with defeat
    tower_defense_session.start_game()
    tower_defense_session.end_game(victory=False)
    assert tower_defense_session.game_active is False
    assert tower_defense_session.game_over is True
    assert tower_defense_session.victory is False


def test_tower_defense_session_get_game_state(tower_defense_session):
    """Test getting game state"""
    tower_defense_session.start_game()
    
    state = tower_defense_session.get_game_state()
    
    assert "session_id" in state
    assert "wave" in state
    assert "gold" in state
    assert "lives" in state
    assert "score" in state
    assert "game_active" in state
    assert "wave_info" in state


def test_tower_defense_session_get_tower_info(tower_defense_session, sample_creature):
    """Test getting tower information"""
    tower_defense_session.start_game()
    
    # Place tower
    tower_defense_session.place_tower(sample_creature, 2, 3)
    
    tower_info = tower_defense_session.get_tower_info()
    
    assert len(tower_info) == 1
    tower_data = tower_info[0]
    assert tower_data["slime_id"] == sample_creature.slime_id
    assert tower_data["name"] == sample_creature.name
    assert tower_data["level"] == sample_creature.level
    assert "genome" in tower_data


def test_tower_defense_session_get_statistics(tower_defense_session):
    """Test getting statistics"""
    tower_defense_session.start_game()
    
    stats = tower_defense_session.get_statistics()
    
    assert "session_id" in stats
    assert "enemies_killed" in stats
    assert "enemies_escaped" in stats
    assert "completed_waves" in stats
    assert "victory" in stats


def test_tower_defense_session_save_load(tower_defense_session):
    """Test session save and load"""
    tower_defense_session.start_game()
    tower_defense_session.add_gold(50)
    tower_defense_session.add_score(100)
    
    # Save session
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        temp_path = Path(f.name)
        tower_defense_session.save_to_file(temp_path)
        
        # Load session
        loaded_session = TowerDefenseSession.load_from_file(temp_path)
        
        assert loaded_session.session_id == tower_defense_session.session_id
        assert loaded_session.gold == tower_defense_session.gold
        assert loaded_session.score == tower_defense_session.score
        assert loaded_session.game_active == tower_defense_session.game_active


def test_end_tower_defense_session_feedback(tower_defense_session, sample_roster):
    """Test session feedback mechanism"""
    tower_defense_session.start_game()
    tower_defense_session.add_gold(200)
    tower_defense_session.add_score(500)
    tower_defense_session.enemies_killed = 10
    tower_defense_session.completed_waves = 5
    tower_defense_session.end_game(victory=True)
    
    # End session and get feedback
    results = end_tower_defense_session(tower_defense_session, sample_roster)
    
    assert results["session_id"] == tower_defense_session.session_id
    assert results["gold_earned"] == 200
    assert results["score"] == 500
    assert results["waves_cleared"] == 5
    assert results["enemies_killed"] == 10
    assert results["victory"] is True
    assert "achievements" in results
    
    # Check gold was added to roster
    assert sample_roster.gold == 700  # 500 + 200


def test_tower_defense_session_achievements(tower_defense_session):
    """Test achievement calculation"""
    tower_defense_session.start_game()
    
    # Test wave achievements
    tower_defense_session.completed_waves = 10
    tower_defense_session.end_game(victory=True)
    
    results = end_tower_defense_session(tower_defense_session, Roster())
    assert "Wave Master" in results["achievements"]
    
    # Test score achievements
    tower_defense_session.score = 1500
    results = end_tower_defense_session(tower_defense_session, Roster())
    assert "Scorer" in results["achievements"]
    
    # Test combat achievements
    tower_defense_session.enemies_killed = 150
    results = end_tower_defense_session(tower_defense_session, Roster())
    assert "Hunter" in results["achievements"]


def test_get_session_summary(tower_defense_session):
    """Test session summary"""
    tower_defense_session.start_game()
    tower_defense_session.add_gold(100)
    tower_defense_session.add_score(250)
    tower_defense_session.enemies_killed = 15
    tower_defense_session.enemies_escaped = 5
    tower_defense_session.end_game(victory=True)
    
    summary = get_session_summary(tower_defense_session)
    
    assert summary["result"] == "Victory"
    assert summary["gold_earned"] == 100
    assert summary["score"] == 250
    assert summary["enemies_killed"] == 15
    assert summary["enemies_escaped"] == 5
    assert summary["kill_ratio"] == 0.75  # 15/(15+5)


def test_format_session_results():
    """Test formatting session results"""
    results = {
        "session_id": "12345",
        "result": "Victory",
        "waves_cleared": 10,
        "score": 1000,
        "gold_earned": 500,
        "enemies_killed": 50,
        "enemies_escaped": 5,
        "towers_placed": 3,
        "achievements": ["Wave Master", "Scorer"]
    }
    
    formatted = format_session_results(results)
    
    assert "=== Tower Defense Session 12345 ===" in formatted
    assert "Result: Victory" in formatted
    assert "Waves Cleared: 10" in formatted
    assert "Score: 1000" in formatted
    assert "Gold Earned: 500" in formatted
    assert "Achievements:" in formatted


def test_validate_session_integrity(tower_defense_session):
    """Test session integrity validation"""
    tower_defense_session.start_game()
    
    # Valid session should pass
    assert validate_session_integrity(tower_defense_session) is True
    
    # Invalid session should fail
    tower_defense_session.gold = -10
    assert validate_session_integrity(tower_defense_session) is False


def test_session_statistics_tracking(tower_defense_session):
    """Test that statistics are properly tracked"""
    tower_defense_session.start_game()
    
    # Perform some actions
    tower_defense_session.add_gold(100)
    tower_defense_session.add_score(250)
    tower_defense_session.enemies_killed = 15
    tower_defense_session.enemies_escaped = 3
    tower_defense_session.completed_waves = 4
    
    # Check statistics
    stats = tower_defense_session.get_statistics()
    assert stats["gold_earned"] == 100
    assert stats["enemies_killed"] == 15
    assert stats["enemies_escaped"] == 3
    assert stats["completed_waves"] == 4
