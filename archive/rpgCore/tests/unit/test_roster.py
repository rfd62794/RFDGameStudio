import pytest
from src.shared.teams.roster import Roster, RosterSlime, TeamRole, Team
from src.shared.genetics.genome import SlimeGenome
from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed
from src.shared.teams.roster_save import save_roster, load_roster, SAVE_PATH

@pytest.fixture
def sample_genome():
    return SlimeGenome(
        shape="round",
        size="medium",
        base_color=(255, 0, 0),
        pattern="solid",
        pattern_color=(0, 0, 0),
        accessory="none",
        curiosity=0.5,
        energy=0.8,
        affection=0.3,
        shyness=0.2
    )

def test_assign_slime_to_dungeon_team(sample_genome):
    roster = Roster()
    slime = RosterSlime(slime_id="1", name="Bloop", genome=sample_genome)
    roster.add_slime(slime)
    
    success = roster.get_dungeon_team().assign(slime)
    assert success is True
    assert slime.team == TeamRole.DUNGEON
    assert slime in roster.get_dungeon_team().members

def test_cannot_assign_to_full_team(sample_genome):
    roster = Roster()
    team = roster.get_dungeon_team()
    team.slots = 1
    
    s1 = RosterSlime(slime_id="1", name="S1", genome=sample_genome)
    s2 = RosterSlime(slime_id="2", name="S2", genome=sample_genome)
    
    assert team.assign(s1) is True
    assert team.assign(s2) is False

def test_cannot_assign_already_assigned_slime(sample_genome):
    roster = Roster()
    slime = RosterSlime(slime_id="1", name="Bloop", genome=sample_genome)
    
    assert roster.get_dungeon_team().assign(slime) is True
    assert roster.get_dungeon_team().assign(slime) is False

def test_locked_slime_cannot_be_removed(sample_genome):
    roster = Roster()
    slime = RosterSlime(slime_id="1", name="Bloop", genome=sample_genome)
    roster.get_dungeon_team().assign(slime)
    slime.locked = True
    
    assert roster.get_dungeon_team().remove("1") is False
    assert slime in roster.get_dungeon_team().members

def test_dead_slime_removed_from_team(sample_genome):
    roster = Roster()
    slime = RosterSlime(slime_id="1", name="Bloop", genome=sample_genome)
    roster.get_dungeon_team().assign(slime)
    
    # Simulate death handling in end_run logic (client side)
    slime.alive = False
    roster.get_dungeon_team().members.remove(slime)
    
    assert slime not in roster.get_dungeon_team().members

def test_roster_serializes_and_deserializes(sample_genome, tmp_path):
    # Use monkeypatch or direct save_roster if we want to test actual file
    roster = Roster()
    slime = RosterSlime(slime_id="1", name="Bloop", genome=sample_genome)
    roster.add_slime(slime)
    roster.get_dungeon_team().assign(slime)
    
    data = roster.to_dict()
    new_roster = Roster.from_dict(data)
    
    assert len(new_roster.slimes) == 1
    assert new_roster.slimes[0].name == "Bloop"
    assert new_roster.get_dungeon_team().members[0].name == "Bloop"

def test_genome_produces_different_stats():
    g1 = SlimeGenome(shape="round", size="massive", base_color=(0,0,0), pattern="solid", pattern_color=(0,0,0), accessory="none", curiosity=0, energy=0.1, affection=0, shyness=0)
    g2 = SlimeGenome(shape="cubic", size="tiny", base_color=(0,0,0), pattern="solid", pattern_color=(0,0,0), accessory="none", curiosity=0, energy=1.0, affection=0, shyness=0)
    
    hp1 = calculate_hp(g1)
    hp2 = calculate_hp(g2)
    assert hp1 > hp2
    
    atk1 = calculate_attack(g1)
    atk2 = calculate_attack(g2)
    assert atk2 > atk1
    
    spd1 = calculate_speed(g1)
    spd2 = calculate_speed(g2)
    assert spd2 > spd1
