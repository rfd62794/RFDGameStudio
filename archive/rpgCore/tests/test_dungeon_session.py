import pytest
from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession

def test_dungeon_session_start_run_generates_hero():
    session = DungeonSession()
    session.start_run("fighter")
    assert session.hero is not None
    assert len(session.hero.name) > 0
    assert session.floor is not None
    assert session.floor.depth == 1

def test_dungeon_session_end_run_records_ancestor():
    session = DungeonSession()
    session.start_run("mage")
    name = session.hero.name
    session.end_run(cause="extraction")
    
    assert session.hero is None
    assert len(session.ancestors) == 1
    assert session.ancestors[0]["name"] == name
    assert session.ancestors[0]["cause"] == "extraction"

def test_hero_name_generation_not_empty():
    session = DungeonSession()
    name = session.generate_hero_name()
    assert isinstance(name, str)
    assert len(name.split()) >= 2 # "First Last"

def test_ancestor_list_formatting():
    session = DungeonSession()
    session.ancestors.append({"name": "Test", "class": "fighter", "floor": 5, "kills": 10, "cause": "death"})
    fmt_list = session.get_ancestor_list()
    assert len(fmt_list) == 1
    assert "Test (fighter) - Floor 5" in fmt_list[0]
