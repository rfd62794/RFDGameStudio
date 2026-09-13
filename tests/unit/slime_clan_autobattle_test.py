
from src.apps.slime_clan.auto_battle import (
    Shape, Hat, SlimeUnit, create_slime, execute_action
)
from src.apps.slime_clan.territorial_grid import TileState

def test_slime_stat_generation():
    # Square gets +Defense -Speed +HP
    square_shield = create_slime("1", "Tank", TileState.BLUE, Shape.SQUARE, Hat.SHIELD)
    assert square_shield.shape == Shape.SQUARE
    assert square_shield.hat == Hat.SHIELD
    assert square_shield.speed == 7   # base 10 - 3 (shape)
    assert square_shield.defense == 7 # base 2 + 3 (shape) + 2 (hat)
    assert square_shield.max_hp == 30 # base 20 + 5 (shape) + 5 (hat)
    assert square_shield.mana == 3    # Session 017: starts at 3
    assert square_shield.max_mana == 5

    # Triangle gets +Speed -Defense -HP
    tri_sword = create_slime("2", "Attacker", TileState.BLUE, Shape.TRIANGLE, Hat.SWORD)
    assert tri_sword.speed == 14      # base 10 + 4
    assert tri_sword.defense == 1     # base 2 - 1
    assert tri_sword.max_hp == 17     # base 20 - 3
    assert tri_sword.attack == 8      # base 5 + 3 (hat)

    # Circle gets Balanced stats
    circle_staff = create_slime("3", "Healer", TileState.BLUE, Shape.CIRCLE, Hat.STAFF)
    assert circle_staff.speed == 12   # base 10 + 2 (hat)
    assert circle_staff.defense == 2  # base 2
    assert circle_staff.max_hp == 20  # base 20
    assert circle_staff.attack == 3   # base 5 - 2 (hat)


def test_sword_basic_attack_generates_mana():
    """Basic SWORD attack should generate +1 mana."""
    actor = create_slime("1", "A", TileState.BLUE, Shape.TRIANGLE, Hat.SWORD)
    actor.attack = 10
    actor.mana = 0  # Start empty
    
    e1 = create_slime("e1", "Target", TileState.RED, Shape.CIRCLE, Hat.SWORD)
    e1.hp = 5
    e1.defense = 0
    
    enemies = [e1]
    allies = [actor]
    
    execute_action(actor, allies, enemies)
    
    assert actor.mana == 1  # Gained +1 from basic attack


def test_sword_crit_focus_costs_mana():
    """Crit Focus should cost 2 mana and be denied when mana is insufficient."""
    actor = create_slime("1", "A", TileState.BLUE, Shape.TRIANGLE, Hat.SWORD)
    actor.attack = 10
    actor.mana = 2  # Exactly enough for Crit Focus
    
    e1 = create_slime("e1", "Tanky", TileState.RED, Shape.SQUARE, Hat.SHIELD)
    e1.hp = 28
    e1.max_hp = 30
    
    e2 = create_slime("e2", "Other", TileState.RED, Shape.CIRCLE, Hat.SWORD)
    e2.hp = 15
    
    enemies = [e1, e2]
    allies = [actor]
    
    log = execute_action(actor, allies, enemies)
    
    assert "CRIT FOCUS" in log
    assert actor.mana == 0  # Spent 2 mana
    assert actor.is_crit_focused is True
    
    # Now with 0 mana, Crit Focus should be denied — falls through to basic attack
    actor.is_crit_focused = False  # Reset
    log2 = execute_action(actor, allies, enemies)
    assert "attacks" in log2 or "CRITICAL" in log2  # Basic attack instead
    assert actor.mana == 1  # Gained +1 from attack


def test_sword_taunt_break():
    """Taunt Break should cost 1 mana."""
    actor = create_slime("1", "A", TileState.BLUE, Shape.TRIANGLE, Hat.SWORD)
    actor.attack = 10
    actor.mana = 1
    
    e1 = create_slime("e1", "Squishy", TileState.RED, Shape.CIRCLE, Hat.SWORD)
    e1.hp = 5
    e1.taunt_active = False
    
    e2 = create_slime("e2", "Tank", TileState.RED, Shape.SQUARE, Hat.SHIELD)
    e2.hp = 25
    e2.taunt_active = True
    
    enemies = [e1, e2]
    allies = [actor]
    
    log = execute_action(actor, allies, enemies)
    
    assert "TAUNT BREAK" in log
    assert actor.mana == 0
    assert e2.taunt_active is False


def test_staff_heals_scales_with_missing_hp():
    """STAFF heal should scale with missing HP but be capped at 30% of max HP."""
    actor = create_slime("1", "H", TileState.BLUE, Shape.CIRCLE, Hat.STAFF)
    actor.attack = 5
    
    a1 = create_slime("a1", "A1", TileState.BLUE, Shape.CIRCLE, Hat.SWORD)
    a1.max_hp = 20
    a1.hp = 5
    
    allies = [actor, a1]
    enemies = []
    
    log = execute_action(actor, allies, enemies)
    
    assert a1.hp == 11  # 5 + 6 = 11
    assert "heals A1 for 6" in log
    assert actor.mana == 4  # Started at 3, gained +1 from heal


def test_shield_bash_costs_mana():
    """Shield Bash should cost 2 mana and stun the target."""
    actor = create_slime("1", "T", TileState.BLUE, Shape.SQUARE, Hat.SHIELD)
    actor.attack = 6
    actor.mana = 2
    
    # Need a non-dead ally so SHIELD doesn't trigger solo mode
    buddy = create_slime("b1", "Buddy", TileState.BLUE, Shape.CIRCLE, Hat.SWORD)
    buddy.hp = 15
    
    e_healer = create_slime("e1", "Cleric", TileState.RED, Shape.CIRCLE, Hat.STAFF)
    e_healer.hp = 20
    
    allies = [actor, buddy]
    enemies = [e_healer]
    
    log = execute_action(actor, allies, enemies)
    
    assert "SHIELD BASHES" in log
    assert e_healer.stunned_turns == 1
    assert actor.mana == 0  # Spent 2 mana


def test_shield_solo_desperate_bash():
    """SHIELD should use Desperate Bash when it's the last alive."""
    actor = create_slime("1", "T", TileState.BLUE, Shape.SQUARE, Hat.SHIELD)
    actor.attack = 6
    
    dead_ally = create_slime("b1", "Dead", TileState.BLUE, Shape.CIRCLE, Hat.SWORD)
    dead_ally.hp = 0
    
    e1 = create_slime("e1", "Brute", TileState.RED, Shape.SQUARE, Hat.SWORD)
    e1.hp = 15
    e1.defense = 0
    
    allies = [actor, dead_ally]
    enemies = [e1]
    
    log = execute_action(actor, allies, enemies)
    
    assert "DESPERATE BASH" in log
    assert e1.hp < 15  # Should deal damage


def test_shield_taunts_when_no_healers():
    """SHIELD should default to taunt when no enemy healers and no wounded allies."""
    actor = create_slime("1", "T", TileState.BLUE, Shape.CIRCLE, Hat.SHIELD)
    start_defense = actor.defense
    
    buddy = create_slime("b1", "Buddy", TileState.BLUE, Shape.CIRCLE, Hat.SWORD)
    buddy.hp = 20
    
    e_sword = create_slime("e1", "Brute", TileState.RED, Shape.SQUARE, Hat.SWORD)
    
    allies = [actor, buddy]
    enemies = [e_sword]
    
    assert not actor.taunt_active
    
    execute_action(actor, allies, enemies)
    assert actor.taunt_active
    assert actor.defense == start_defense + 2
    assert actor.mana == 4  # Started 3, gained +1 from taunt
