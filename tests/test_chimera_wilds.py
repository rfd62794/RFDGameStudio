"""test_chimera_wilds.py — Chimera Wilds Phase 1 integration tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import yaml

from studio.runtime import load_game
from studio_mcp.tools import studio_validate_game

CW_DIR = Path(__file__).parent.parent / "games" / "chimera_wilds"
MBB_DIR = Path(__file__).parent.parent / "games" / "mutant_battle_ball"


def _load_chimera_wilds():
    return load_game("chimera_wilds", seed=42)


def _known_parts(parts_data):
    by_id = {p["id"]: p for p in parts_data}
    return [
        by_id["head_basic"],
        by_id["chest_basic"],
        by_id["arm_basic"],
        by_id["arm_pile"],
        by_id["leg_basic"],
        by_id["leg_sprint"],
    ]


def _unpack_chimera(result):
    if isinstance(result, (list, tuple)):
        return result[0], result[1]
    return result, None


def test_assemble_chimera_sums_all_six_slots() -> None:
    """generate_chimera returns correct totals from a known part set."""
    session = _load_chimera_wilds()
    data = session.files.data
    parts = _known_parts(data["parts"])

    chimera, err = _unpack_chimera(session.executor.call("generate_chimera", parts))
    assert err is None, f"unexpected error: {err}"
    assert chimera is not None

    expected_power = 5 + 8 + 30 + 50 + 5 + 3  # 101
    expected_endurance = 8 + 40 + 5 + 5 + 5 + 5  # 68
    assert chimera["total_power"] == expected_power
    assert chimera["total_endurance"] == expected_endurance


def test_assemble_chimera_rejects_missing_slot() -> None:
    """generate_chimera returns nil + error when a slot is absent."""
    session = _load_chimera_wilds()
    data = session.files.data
    parts = [p for p in data["parts"] if p["slot"] != "head"]

    result = session.executor.call("generate_chimera", parts)
    assert isinstance(result, (list, tuple)), "expected a multi-return tuple"
    chimera, err = result
    assert chimera is None
    assert err is not None
    assert "Missing slot" in err


def test_resolve_encounter_win_when_score_exceeds_chimera() -> None:
    """Player wins when roll + stats exceed the chimera score."""
    session = _load_chimera_wilds()
    parts = _known_parts(session.files.data["parts"])
    chimera, _ = _unpack_chimera(session.executor.call("generate_chimera", parts))

    result = session.executor.call("resolve_encounter", 20, 20, chimera, 20)
    assert result is not None
    assert result["won"] is True
    assert result["score"] == 60
    assert result["chimera_score"] == 101 + 68


def test_resolve_encounter_loss_when_score_below_chimera() -> None:
    """Player loses when roll + stats are below the chimera score."""
    session = _load_chimera_wilds()
    parts = _known_parts(session.files.data["parts"])
    chimera, _ = _unpack_chimera(session.executor.call("generate_chimera", parts))

    result = session.executor.call("resolve_encounter", 20, 20, chimera, 1)
    assert result is not None
    assert result["won"] is False
    assert result["score"] == 41


def test_resolve_encounter_boundary_equal_score_is_win() -> None:
    """A tie is a win (>=, not >)."""
    session = _load_chimera_wilds()
    dummy_parts = [
        {"id": "h", "slot": "head", "name": "H", "accuracy": 0, "endurance": 1, "power": 1, "speed": 0},
        {"id": "c", "slot": "chest", "name": "C", "accuracy": 0, "endurance": 1, "power": 1, "speed": 0},
        {"id": "la", "slot": "left_arm", "name": "LA", "accuracy": 0, "endurance": 1, "power": 1, "speed": 0},
        {"id": "ra", "slot": "right_arm", "name": "RA", "accuracy": 0, "endurance": 1, "power": 1, "speed": 0},
        {"id": "ll", "slot": "left_leg", "name": "LL", "accuracy": 0, "endurance": 1, "power": 1, "speed": 0},
        {"id": "rl", "slot": "right_leg", "name": "RL", "accuracy": 0, "endurance": 1, "power": 1, "speed": 0},
    ]
    chimera, err = _unpack_chimera(session.executor.call("generate_chimera", dummy_parts))
    assert err is None

    # chimera_score = 6 power + 6 endurance = 12
    # player stats 5 + 5 + roll 2 = 12
    result = session.executor.call("resolve_encounter", 5, 5, chimera, 2)
    assert result["won"] is True
    assert result["score"] == result["chimera_score"]


def test_data_yaml_parts_match_mbb_source_values() -> None:
    """Copied parts are byte-identical to the real MBB source, not just present."""
    mbb_data = yaml.safe_load((MBB_DIR / "data.yaml").read_text(encoding="utf-8"))
    cw_data = yaml.safe_load((CW_DIR / "data.yaml").read_text(encoding="utf-8"))

    mbb_parts = {p["id"]: p for p in mbb_data["parts"]}
    cw_parts = {p["id"]: p for p in cw_data["parts"]}

    for part_id in ["head_basic", "arm_pile", "leg_sprint"]:
        assert cw_parts[part_id] == mbb_parts[part_id]


def test_studio_validate_game_chimera_wilds() -> None:
    """studio_validate_game reports the new four-file game as valid."""
    result = studio_validate_game("chimera_wilds")
    assert result["valid"] is True
    assert result["issues"] == []


def test_systems_yaml_engine_systems_empty() -> None:
    """systems.yaml declares engine_systems: [] to keep the game self-contained."""
    systems = yaml.safe_load((CW_DIR / "systems.yaml").read_text(encoding="utf-8"))
    assert systems["engine_systems"] == []
