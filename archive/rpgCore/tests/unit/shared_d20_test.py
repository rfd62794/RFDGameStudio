"""Tests for the shared D20Resolver component."""

from src.shared.combat.d20_resolver import D20Resolver, D20Result, DifficultyClass


def test_d20_deterministic_rolls():
    """Deterministic mode should produce reproducible results."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=42)
    
    roll1 = resolver.roll_d20()
    
    # Reset seed — same seed should produce same roll
    resolver.set_deterministic_mode(True, seed=42)
    roll2 = resolver.roll_d20()
    
    assert roll1 == roll2
    assert 1 <= roll1 <= 20


def test_d20_roll_range():
    """All rolls should be between 1 and 20 (before modifier)."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=0)
    
    for seed in range(100):
        resolver.set_deterministic_mode(True, seed=seed)
        roll = resolver.roll_d20()
        assert 1 <= roll <= 20, f"Roll {roll} out of range with seed {seed}"


def test_d20_modifier_applies():
    """Modifier should be added to the base roll."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=42)
    
    base = resolver.roll_d20(modifier=0)
    
    resolver.set_deterministic_mode(True, seed=42)
    modified = resolver.roll_d20(modifier=5)
    
    assert modified == base + 5


def test_d20_advantage():
    """Advantage should take the higher of two rolls."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=10)
    
    roll1 = resolver._roll_d20()
    roll2 = resolver._roll_d20()
    expected = max(roll1, roll2)
    
    resolver.set_deterministic_mode(True, seed=10)
    result = resolver.roll_d20(advantage=True)
    
    assert result == expected


def test_d20_disadvantage():
    """Disadvantage should take the lower of two rolls."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=10)
    
    roll1 = resolver._roll_d20()
    roll2 = resolver._roll_d20()
    expected = min(roll1, roll2)
    
    resolver.set_deterministic_mode(True, seed=10)
    result = resolver.roll_d20(disadvantage=True)
    
    assert result == expected


def test_ability_check_success():
    """Ability check should succeed when roll >= DC."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=42)
    
    result = resolver.ability_check(modifier=10, difficulty_class=5)
    
    assert isinstance(result, D20Result)
    assert result.success is True  # Any d20 + 10 >= 5
    assert result.total_score >= 5


def test_ability_check_failure():
    """Ability check should fail when roll < DC."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=42)
    
    # DC 50 is impossible with d20 + 0
    result = resolver.ability_check(modifier=0, difficulty_class=50)
    
    assert result.success is False
    assert result.total_score < 50


def test_saving_throw():
    """Saving throw should return a valid D20Result."""
    resolver = D20Resolver()
    resolver.set_deterministic_mode(True, seed=42)
    
    result = resolver.saving_throw(modifier=3, difficulty_class=15)
    
    assert isinstance(result, D20Result)
    assert 1 <= result.roll <= 20
    assert result.total_score == result.roll + 3


def test_difficulty_class_values():
    """DifficultyClass enum should have standard D&D values."""
    assert DifficultyClass.EASY.value == 10
    assert DifficultyClass.MODERATE.value == 15
    assert DifficultyClass.HARD.value == 20


def test_d20_result_summary():
    """D20Result should produce a readable summary string."""
    result = D20Result(
        success=True, roll=15, total_score=18,
        difficulty_class=15, narrative_context="test"
    )
    summary = result.string_summary()
    assert "SUCCESS" in summary
    assert "15" in summary
