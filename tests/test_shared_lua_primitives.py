from __future__ import annotations

import math
from pathlib import Path

from studio.executor import Executor
from studio.loader import load_engine_source
from studio.runtime import load_game

ROOT = Path(__file__).parent.parent
ACTION_SOURCE = (ROOT / "engine" / "primitives" / "action.lua").read_text(encoding="utf-8")
MOVEMENT_SOURCE = (ROOT / "engine" / "primitives" / "movement.lua").read_text(encoding="utf-8")
HORSE_LOGIC = (ROOT / "games" / "horse_racing" / "logic.lua").read_text(encoding="utf-8")
SLIME_COIN_LOGIC = (ROOT / "games" / "slime_coin" / "logic.lua").read_text(encoding="utf-8")
SLITHER_UTILS = (ROOT / "games" / "slither_rogue" / "utils.lua").read_text(encoding="utf-8")


def test_engine_collect_matches_removed_local() -> None:
    legacy_source = """
function legacy_collect(t)
  local out = {}
  for _, v in ipairs(t) do out[#out+1] = v end
  return out
end
"""
    executor = Executor(legacy_source, engine_source=ACTION_SOURCE)
    for values in ([], ["a"], [1, 2, 3], [{"id": 1}, {"id": 2}]):
        assert executor.call("collect", values) == executor.call("legacy_collect", values)


def test_engine_atan2_matches_removed_local() -> None:
    legacy_source = "function legacy_atan2(y, x) return math.atan(y, x) end"
    executor = Executor(legacy_source, engine_source=MOVEMENT_SOURCE)
    for y, x in ((0, 0), (0, 1), (0, -1), (1, 0), (-1, 0), (3, 4), (-3, -4)):
        assert math.isclose(
            executor.call("atan2", y, x),
            executor.call("legacy_atan2", y, x),
            rel_tol=0.0,
            abs_tol=0.0,
        )


def test_slime_coin_uses_copy_entity_not_copy_table() -> None:
    assert "copy_table" not in SLIME_COIN_LOGIC
    assert "copy_entity(" in SLIME_COIN_LOGIC


def test_horse_racing_no_local_collect() -> None:
    assert "local function collect" not in HORSE_LOGIC
    assert "collect(" in HORSE_LOGIC


def test_slither_rogue_no_local_atan2() -> None:
    assert "function atan2" not in SLITHER_UTILS
    assert "function atan2" in MOVEMENT_SOURCE


def test_no_behavior_regression_race_creation() -> None:
    session = load_game("horse_racing", seed=42)
    race, error = session.executor.call(
        "create_race", session.files.data["starter_horses"][0], session.files.data
    )
    assert error is None
    assert (race["id"], race["name"], race["distance"], race["race_class"], race["entry_fee"]) == (
        "race_292208",
        "Tokyo Oaks",
        1200,
        "Class II",
        75,
    )
    assert len(race["participants"]) == 6


def test_no_behavior_regression_slime_coin_flow() -> None:
    session = load_game("slime_coin", seed=42)
    session.executor.call("init_game", {})
    session.executor.call("fire_coin", "basic", "right")
    state = session.executor.call("tick_game", 0.1, {"fire": False, "side": "right"})
    assert (
        state["round"],
        state["score"],
        state["hand_in"],
        len(state["shelf_coins"]),
        len(state["floor_coins"]),
        state["tokens"],
    ) == (1, 0, 9, 65, 16, 0)


def test_loader_prepends_primitives_before_game_logic() -> None:
    source = load_engine_source([])
    assert source.index("function collect") < source.index("function copy_entity")
    assert source.index("function copy_entity") < source.index("function atan2")
