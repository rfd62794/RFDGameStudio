"""test_scrapcrawl.py — ScrapCrawl Phase A core loop integration tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import yaml

from studio.executor import LuaError
from studio.runtime import load_game
from studio_mcp.tools import studio_validate_game

SC_DIR = Path(__file__).parent.parent / "games" / "scrapcrawl"


# Real, certified constants from the original ScrapCrawl TS implementation.
EXPECTED_CATALOG = {
    "beatStick": {
        "id": "beatStick",
        "name": "Beat Stick",
        "slot": "weapon",
        "tierCost": {1: 10, 2: 25},
        "baseStats": {
            1: {"hp": 0, "atk": 5, "def": 0},
            2: {"hp": 0, "atk": 10, "def": 0},
        },
        "maxLife": {1: 10, 2: 18},
    },
    "shield": {
        "id": "shield",
        "name": "Shield",
        "slot": "shield",
        "tierCost": {1: 10, 2: 25},
        "baseStats": {
            1: {"hp": 0, "atk": 0, "def": 3},
            2: {"hp": 0, "atk": 0, "def": 7},
        },
        "maxLife": {1: 10, 2: 18},
    },
    "bodyArmor": {
        "id": "bodyArmor",
        "name": "Body Armor",
        "slot": "armor",
        "tierCost": {1: 10, 2: 25},
        "baseStats": {
            1: {"hp": 15, "atk": 0, "def": 2},
            2: {"hp": 30, "atk": 0, "def": 5},
        },
        "maxLife": {1: 10, 2: 18},
    },
    "tool": {
        "id": "tool",
        "name": "Tier-2 Tool",
        "tierCost": {1: 20, 2: 20},
        "baseStats": {
            1: {"hp": 0, "atk": 0, "def": 0},
            2: {"hp": 0, "atk": 0, "def": 0},
        },
        "maxLife": {1: 999, 2: 999},
    },
}

EXPECTED_ROOM_TOPOLOGY = {
    "home_base": {"connections": ["scrap_pit", "furnace_core"]},
    "scrap_pit": {"connections": ["home_base", "vent_stack"], "difficulty": 8},
    "vent_stack": {"connections": ["scrap_pit", "chemical_leak"], "difficulty": 12},
    "chemical_leak": {"connections": ["vent_stack", "furnace_core"], "difficulty": 15},
    "furnace_core": {"connections": ["chemical_leak", "home_base"], "difficulty": 18},
}


def _load_scrapcrawl():
    return load_game("scrapcrawl", seed=42)


def _player_with_scrap(scrap: int):
    session = _load_scrapcrawl()
    player = session.executor.call("init_player")
    player["scrap"] = scrap
    home = session.executor.call("get_room", session.files.data, "home_base")
    return session, player, home


def _equip_weapon(tier: int = 1, life: int = 10):
    return {
        "id": "test_weapon",
        "slot": "weapon",
        "catalogId": "beatStick",
        "tier": tier,
        "life": life,
        "maxLife": 10 if tier == 1 else 18,
    }


def test_get_room_returns_seeded_room() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    room = session.executor.call("get_room", data, "home_base")
    assert room is not None
    assert room["id"] == "home_base"
    assert room["name"] == "Home Base"


def test_can_move_to_true_for_connected_room() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    assert session.executor.call("can_move_to", data, "home_base", "scrap_pit") is True


def test_can_move_to_false_for_unconnected_room() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    assert session.executor.call("can_move_to", data, "home_base", "vent_stack") is False


def test_move_updates_position() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    updated = session.executor.call("move_player", data, player, "scrap_pit")
    assert updated["currentRoomId"] == "scrap_pit"


def test_move_rejects_unconnected_no_op() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    updated = session.executor.call("move_player", data, player, "vent_stack")
    assert updated["currentRoomId"] == "home_base"
    # Should be the same object reference / unchanged state.
    assert updated is not None


def test_can_craft_true_sufficient_scrap() -> None:
    session, player, home = _player_with_scrap(10)
    data = session.files.data
    assert session.executor.call("can_craft", data, player, home, "beatStick") is True


def test_can_craft_false_insufficient_scrap() -> None:
    session, player, home = _player_with_scrap(5)
    data = session.files.data
    assert session.executor.call("can_craft", data, player, home, "beatStick") is False


def test_craft_deducts_correct_tier1_cost() -> None:
    session, player, home = _player_with_scrap(15)
    data = session.files.data
    updated = session.executor.call("craft", data, player, home, "beatStick")
    assert updated["scrap"] == 5
    assert updated["equipped"]["weapon"] is not None
    assert updated["equipped"]["weapon"]["tier"] == 1


def test_craft_tier2_rejected_before_tool() -> None:
    session, player, home = _player_with_scrap(30)
    data = session.files.data
    assert session.executor.call("can_craft", data, player, home, "beatStick", 2) is False


def test_craft_tool_unlocks_all_three_slots_simultaneously() -> None:
    session, player, home = _player_with_scrap(100)
    data = session.files.data
    unlocked = session.executor.call("craft", data, player, home, "tool")
    assert unlocked["tier2Unlocked"] is True
    assert session.executor.call("can_craft", data, unlocked, home, "beatStick", 2) is True
    assert session.executor.call("can_craft", data, unlocked, home, "shield", 2) is True
    assert session.executor.call("can_craft", data, unlocked, home, "bodyArmor", 2) is True


def test_tier1_cost_unchanged_after_tier2_unlock() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["scrap"] = 100
    player["tier2Unlocked"] = True
    home = session.executor.call("get_room", data, "home_base")
    updated = session.executor.call("craft", data, player, home, "beatStick", 1)
    assert updated["scrap"] == 90
    assert updated["equipped"]["weapon"]["tier"] == 1


def test_craft_replaces_existing_slot_item() -> None:
    session, player, home = _player_with_scrap(20)
    data = session.files.data
    old_weapon = {
        "id": "old_stick",
        "slot": "weapon",
        "catalogId": "beatStick",
        "tier": 1,
        "life": 2,
        "maxLife": 10,
    }
    player["equipped"] = {"weapon": old_weapon}
    updated = session.executor.call("craft", data, player, home, "beatStick")
    assert updated["equipped"]["weapon"]["id"] != "old_stick"
    assert updated["equipped"]["weapon"]["life"] == 10


def test_resolve_fight_win_awards_scrap_in_range() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    room = session.executor.call("get_room", data, "scrap_pit")
    wins = 0
    for _ in range(20):
        result = session.executor.call("resolve_fight", data, player, room)
        if result["won"]:
            wins += 1
            assert 3 <= result["scrap_gained"] <= 8
            assert result["player"]["scrap"] == result["scrap_gained"]
        else:
            assert result["scrap_gained"] == 0
    assert wins > 0


def test_resolve_fight_depletes_weapon_life() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["equipped"] = {"weapon": _equip_weapon(tier=1, life=10)}
    room = session.executor.call("get_room", data, "scrap_pit")
    result = session.executor.call("resolve_fight", data, player, room, 20)
    assert result["player"]["equipped"]["weapon"]["life"] == 9


def test_resolve_fight_broken_weapon_falls_back_to_unarmed() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["equipped"] = {"weapon": _equip_weapon(tier=1, life=0)}
    room = {"id": "test", "interactionTypes": ["fight"], "connections": [], "difficulty": 15}
    result = session.executor.call("resolve_fight", data, player, room, 1)
    assert result["player"]["equipped"]["weapon"] is not None
    assert result["player"]["equipped"]["weapon"]["life"] == 0
    assert result["won"] is False


def test_proficiency_increments_on_win_only() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["equipped"] = {"weapon": _equip_weapon(tier=1, life=10)}
    room = session.executor.call("get_room", data, "scrap_pit")
    result = session.executor.call("resolve_fight", data, player, room, 20)
    assert result["won"] is True
    assert result["player"]["proficiencyXp"]["weapon"] == 15


def test_proficiency_unchanged_on_loss() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["equipped"] = {"weapon": _equip_weapon(tier=1, life=10)}
    room = {"id": "hard", "interactionTypes": ["fight"], "connections": [], "difficulty": 100}
    result = session.executor.call("resolve_fight", data, player, room, 1)
    assert result["won"] is False
    assert result["player"]["proficiencyXp"]["weapon"] == 0


def test_growth_factor_clamps_floor_0_8() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    assert session.executor.call("growth_factor", data, 0) == 0.8
    assert session.executor.call("growth_factor", data, -100) == 0.8


def test_growth_factor_clamps_ceiling_1_5() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    assert session.executor.call("growth_factor", data, 500) == 1.5
    assert session.executor.call("growth_factor", data, 1000) == 1.5


def test_wipe_resets_position_only() -> None:
    session = _load_scrapcrawl()
    player = session.executor.call("init_player")
    player["currentRoomId"] = "scrap_pit"
    reset = session.executor.call("reset_position", player)
    assert reset["currentRoomId"] == "home_base"


def test_wipe_preserves_scrap_equipped_proficiency() -> None:
    session = _load_scrapcrawl()
    player = session.executor.call("init_player")
    player["currentRoomId"] = "scrap_pit"
    player["scrap"] = 42
    player["tier2Unlocked"] = True
    player["equipped"] = {"weapon": _equip_weapon(tier=1, life=8)}
    player["proficiencyXp"]["weapon"] = 150
    reset = session.executor.call("reset_position", player)
    assert reset["currentRoomId"] == "home_base"
    assert reset["scrap"] == 42
    assert reset["tier2Unlocked"] is True
    assert reset["equipped"]["weapon"] is not None
    assert reset["equipped"]["weapon"]["life"] == 8
    assert reset["proficiencyXp"]["weapon"] == 150


def test_data_yaml_catalog_matches_original_tier_costs() -> None:
    cw_data = yaml.safe_load((SC_DIR / "data.yaml").read_text(encoding="utf-8"))
    assert cw_data["catalog"] == EXPECTED_CATALOG


def test_data_yaml_room_graph_matches_original_topology() -> None:
    cw_data = yaml.safe_load((SC_DIR / "data.yaml").read_text(encoding="utf-8"))
    for room_id, expected in EXPECTED_ROOM_TOPOLOGY.items():
        actual = cw_data["rooms"][room_id]
        assert actual["connections"] == expected["connections"]
        assert actual.get("difficulty") == expected.get("difficulty")


def test_systems_yaml_engine_systems_empty() -> None:
    systems = yaml.safe_load((SC_DIR / "systems.yaml").read_text(encoding="utf-8"))
    assert systems["engine_systems"] == []


def test_resolve_fight_rejects_non_fight_room() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    home = session.executor.call("get_room", data, "home_base")
    with pytest.raises(LuaError, match="Cannot fight"):
        session.executor.call("resolve_fight", data, player, home, 20)


def test_resolve_fight_still_works_in_real_fight_rooms() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    for room_id in ("scrap_pit", "vent_stack", "chemical_leak", "furnace_core"):
        room = session.executor.call("get_room", data, room_id)
        result = session.executor.call("resolve_fight", data, player, room, 20)
        assert result["won"] is True, f"expected win in {room_id}"


def test_data_yaml_home_base_has_no_difficulty() -> None:
    cw_data = yaml.safe_load((SC_DIR / "data.yaml").read_text(encoding="utf-8"))
    home = cw_data["rooms"]["home_base"]
    assert "difficulty" not in home
    assert home["interaction_types"] == ["home", "craft", "rest"]
    assert "fight" not in home["interaction_types"]


def test_can_craft_rejects_non_craft_room() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["scrap"] = 100
    scrap_pit = session.executor.call("get_room", data, "scrap_pit")
    assert session.executor.call("can_craft", data, player, scrap_pit, "beatStick") is False


def test_craft_rejects_non_craft_room() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["scrap"] = 100
    scrap_pit = session.executor.call("get_room", data, "scrap_pit")
    with pytest.raises(LuaError, match="does not support crafting"):
        session.executor.call("craft", data, player, scrap_pit, "beatStick")


def test_craft_allowed_in_home_base() -> None:
    session = _load_scrapcrawl()
    data = session.files.data
    player = session.executor.call("init_player")
    player["scrap"] = 10
    home = session.executor.call("get_room", data, "home_base")
    updated = session.executor.call("craft", data, player, home, "beatStick")
    assert updated["equipped"]["weapon"] is not None


def test_studio_validate_game_scrapcrawl() -> None:
    result = studio_validate_game("scrapcrawl")
    assert result["valid"] is True
    assert result["issues"] == []
