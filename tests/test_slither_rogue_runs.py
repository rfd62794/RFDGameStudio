"""test_slither_rogue_runs.py: whole-run checks for Slither Rogue (headless, fixtures only).

Plays many ticks through the real Lua (tests/fixtures/slither_rogue/), steering at the
nearest fruit, so a regression that breaks the run (errors, no scoring, no game over,
no growth) fails here. Seed 42 throughout.
"""

import math
from pathlib import Path

import yaml

from studio.executor import Executor
from studio.loader import load_engine_source

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "slither_rogue"
LUA_SOURCE = "\n\n".join(
    (FIXTURES_DIR / f).read_text(encoding="utf-8")
    for f in ["utils.lua", "state.lua", "physics.lua", "collision.lua", "render.lua", "logic.lua"]
)
DATA = yaml.safe_load((FIXTURES_DIR / "data.yaml").read_text(encoding="utf-8"))
_systems = yaml.safe_load((FIXTURES_DIR / "systems.yaml").read_text(encoding="utf-8")) or {}
ENGINE_SOURCE = load_engine_source(_systems.get("engine_systems", []))

DT = 1 / 30


def _config(duration: float) -> dict:
    arena = dict(DATA["arena"])
    arena["num_npcs"] = 2
    arena["num_fruits"] = 12
    return {
        "arena": arena,
        "fruit": DATA["fruit"],
        "player_stats": DATA["player_stats"],
        "player_preset": DATA["player_presets"][0],
        "npc_profiles": DATA["npc_profiles"],
        "npc_stats": DATA["npc_stats"],
        "evolution_cards": DATA["evolution_cards"],
        "active_evolutions": {},
        "game_duration": duration,
    }


def _steer(state: dict) -> dict:
    """Mouse vector from the head to the nearest fruit."""
    hx, hy = state["player"]["segs_x"][0], state["player"]["segs_y"][0]
    fruits = state["fruits"]
    if isinstance(fruits, dict):
        fruits = list(fruits.values())
    if not fruits:
        return {"control_type": "mouse", "mouse_x": 10, "mouse_y": 0, "keys": {}}
    f = min(fruits, key=lambda f: math.hypot(f["x"] - hx, f["y"] - hy))
    return {"control_type": "mouse", "mouse_x": f["x"] - hx, "mouse_y": f["y"] - hy, "keys": {}}


def _play(duration: float, ticks: int):
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    ex.call("init_game", _config(duration))
    state = ex.call("tick_game", DT, {"control_type": "mouse", "mouse_x": 10, "mouse_y": 0, "keys": {}})
    events = list(state["events"])
    for _ in range(ticks):
        state = ex.call("tick_game", DT, _steer(state))
        events.extend(state["events"])
    return ex, state, events


def test_a_chasing_run_eats_fruit_and_never_errors() -> None:
    ex, state, events = _play(duration=60.0, ticks=900)
    types = [e["type"] for e in events]
    assert "error" not in types
    assert types.count("fruit_eaten") >= 1
    summary = ex.call("get_state_summary")
    assert summary["score"] > 0
    assert summary["player_segments"] >= DATA["player_stats"]["initial_length"]


def test_a_run_ends_with_one_game_over_when_time_runs_out() -> None:
    ex, state, events = _play(duration=5.0, ticks=240)
    types = [e["type"] for e in events]
    assert types.count("game_over") == 1
    assert ex.call("get_state_summary")["time_left"] == 0
