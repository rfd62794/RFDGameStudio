import pytest
from src.apps.slime_clan.colony import Colony, ColonyManager
from src.apps.slime_clan.auto_battle import SlimeUnit, TileState, Shape, Hat, create_slime
from enum import Enum

class MockNodeType(Enum):
    TEST = "TEST"

def test_colony_initialization():
    colony = Colony(
        id="test_colony",
        name="Test Colony",
        x=100,
        y=100,
        coord=(1, 1),
        node_type=MockNodeType.TEST,
        connections=[]
    )
    assert colony.id == "test_colony"
    assert colony.population == 10
    assert colony.units == []

def test_colony_manager_tribal_generation():
    manager = ColonyManager(MockNodeType)
    manager.create_colony("ashfen", "Ashfen", 0, 0, (0, 0), MockNodeType.TEST, [], faction="CLAN_YELLOW")
    
    colony = manager.get_colony("ashfen")
    assert colony is not None
    assert len(colony.units) == 3
    for unit in colony.units:
        assert isinstance(unit, SlimeUnit)
        assert hasattr(unit, "sympathy")
        assert unit.sympathy == 20

def test_recruitment_logic_transfer():
    # Simulate the logic in app.py
    manager = ColonyManager(MockNodeType)
    manager.create_colony("ashfen", "Ashfen", 0, 0, (0, 0), MockNodeType.TEST, [], faction="CLAN_YELLOW")
    colony = manager.get_colony("ashfen")
    
    # Mock sympathy scores
    colony.units[0].sympathy = 30
    colony.units[1].sympathy = 50 # Highest
    colony.units[2].sympathy = 10
    
    target_unit = colony.units[1]
    name = target_unit.name
    
    # Logic from app.py
    selected_unit = max(colony.units, key=lambda u: getattr(u, "sympathy", 0))
    colony.units.remove(selected_unit)
    
    assert selected_unit == target_unit
    assert len(colony.units) == 2
    assert selected_unit.name == name

def test_colony_manager_iter():
    manager = ColonyManager(MockNodeType)
    manager.create_colony("c1", "C1", 0, 0, (0, 0), MockNodeType.TEST, [])
    manager.create_colony("c2", "C2", 1, 1, (1, 1), MockNodeType.TEST, [])
    
    ids = [cid for cid in manager]
    assert "c1" in ids
    assert "c2" in ids
    assert len(list(manager.values())) == 2

def test_modify_sympathy():
    manager = ColonyManager(MockNodeType)
    manager.create_colony("c1", "C1", 0, 0, (0, 0), MockNodeType.TEST, [], faction="CLAN_YELLOW")
    colony = manager.get_colony("c1")
    unit = colony.units[0]
    
    # Test increase
    manager.modify_sympathy(unit, 10, "test increase")
    assert unit.sympathy == 30
    
    # Test bounds (max 100)
    manager.modify_sympathy(unit, 200, "test max")
    assert unit.sympathy == 100
    
    # Test decrease
    manager.modify_sympathy(unit, -50, "test decrease")
    assert unit.sympathy == 50
    
    # Test bounds (min 0)
    manager.modify_sympathy(unit, -200, "test min")
    assert unit.sympathy == 0

def test_passive_decay():
    manager = ColonyManager(MockNodeType)
    manager.create_colony("c1", "C1", 0, 0, (0, 0), MockNodeType.TEST, [], faction="CLAN_YELLOW")
    colony = manager.get_colony("c1")
    unit = colony.units[0]
    
    # Initial sympathy 20, last_action_day 1
    # Day 2: No decay
    manager.apply_passive_decay(2)
    assert unit.sympathy == 20
    
    # Day 4: 3 days since action (4-1=3), decay!
    manager.apply_passive_decay(4)
    assert unit.sympathy == 19
    
    # Day 5: 4 days since action, no new decay
    manager.apply_passive_decay(5)
    assert unit.sympathy == 19
    
    # Day 7: 6 days since action, decay!
    manager.apply_passive_decay(7)
    assert unit.sympathy == 18

def test_defection_system_success():
    manager = ColonyManager(MockNodeType)
    manager.create_colony("red", "Red Base", 0, 0, (0, 0), MockNodeType.TEST, [], faction="CLAN_RED")
    colony = manager.get_colony("red")
    
    # Manually add a named unit with high sympathy
    from src.apps.slime_clan.auto_battle import create_slime, Shape, Hat
    unit = create_slime("r1", "Reed", TileState.RED, Shape.CIRCLE, Hat.NONE)
    setattr(unit, "sympathy", 80)
    colony.units.append(unit)
    
    # DC = 25 - (80 // 5) = 25 - 16 = 9
    # We need to roll >= 9
    # D20Resolver seed 0 rolls: 17 (Success)
    manager.resolver.set_deterministic_mode(True, seed=0)
    
    defections = manager.check_defections()
    assert len(defections) == 1
    assert defections[0]["unit"].name == "Reed"
    assert defections[0]["unit"].hat == Hat.SWORD # Red faction trait
    assert getattr(defections[0]["unit"], "loyalty") == 50
    assert len(colony.units) == 0

def test_defection_system_failure_buffs_sympathy():
    manager = ColonyManager(MockNodeType)
    manager.create_colony("red", "Red Base", 0, 0, (0, 0), MockNodeType.TEST, [], faction="CLAN_RED")
    colony = manager.get_colony("red")
    
    unit = create_slime("r1", "Reed", TileState.RED, Shape.CIRCLE, Hat.NONE)
    setattr(unit, "sympathy", 65)
    colony.units.append(unit)
    
    # DC = 25 - (65 // 5) = 25 - 13 = 12
    # We need >= 12
    # D20Resolver seed 1 rolls: 4 (Failure)
    manager.resolver.set_deterministic_mode(True, seed=1)
    
    defections = manager.check_defections()
    assert len(defections) == 0
    assert unit.sympathy == 67 # 65 + 2 bonus for failure
    assert len(colony.units) == 1
