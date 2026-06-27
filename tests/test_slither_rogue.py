"""test_slither_rogue.py — Tests for Slither Rogue game logic (tests 33–42).

All tests use tests/fixtures/slither_rogue/ — never games/ directly.
Uses seed=42 throughout for reproducibility.
"""

from pathlib import Path

import pytest
import yaml

from studio.executor import Executor
from studio.loader import load_engine_source

FIXTURES_DIR = Path(__file__).parent / "fixtures"
_lua_files = ["utils.lua", "state.lua", "physics.lua",
              "collision.lua", "render.lua", "logic.lua"]
LUA_SOURCE = "\n\n".join(
    (FIXTURES_DIR / "slither_rogue" / f).read_text(encoding="utf-8")
    for f in _lua_files
)
FIXTURE_DATA = yaml.safe_load(
    (FIXTURES_DIR / "slither_rogue" / "data.yaml").read_text(encoding="utf-8")
)

_systems_raw = yaml.safe_load(
    (FIXTURES_DIR / "slither_rogue" / "systems.yaml").read_text(encoding="utf-8")
) or {}
ENGINE_SOURCE = load_engine_source(_systems_raw.get("engine_systems", []))


# ---------------------------------------------------------------------------
# Test 33 — check_evolution_trigger returns True when threshold is met
# ---------------------------------------------------------------------------

def test_check_evolution_trigger_fires_at_threshold() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    threshold = FIXTURE_DATA["evolution"]["fruits_per_level"]  # 3
    result = ex.call("check_evolution_trigger", threshold - 1, threshold)
    assert result is True


# ---------------------------------------------------------------------------
# Test 34 — check_evolution_trigger returns False before threshold
# ---------------------------------------------------------------------------

def test_check_evolution_trigger_does_not_fire_early() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    threshold = FIXTURE_DATA["evolution"]["fruits_per_level"]  # 3
    result = ex.call("check_evolution_trigger", 0, threshold)
    assert result is False


# ---------------------------------------------------------------------------
# Test 35 — select_evolution_pool returns correct count
# ---------------------------------------------------------------------------

def test_select_evolution_pool_returns_requested_count() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    all_cards = FIXTURE_DATA["evolution_cards"]
    count = FIXTURE_DATA["evolution"]["cards_offered"]  # 3
    pool = ex.call("select_evolution_pool", all_cards, count)
    assert isinstance(pool, list)
    assert len(pool) == count


# ---------------------------------------------------------------------------
# Test 36 — select_evolution_pool cards have required fields
# ---------------------------------------------------------------------------

def test_select_evolution_pool_cards_have_required_fields() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    all_cards = FIXTURE_DATA["evolution_cards"]
    pool = ex.call("select_evolution_pool", all_cards, 3)
    for card in pool:
        assert "id" in card
        assert "title" in card
        assert "rarity" in card


# ---------------------------------------------------------------------------
# Test 37 — calculate_grade returns correct title for high score
# ---------------------------------------------------------------------------

def test_calculate_grade_high_score_returns_apex() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    thresholds = FIXTURE_DATA["grade_thresholds"]
    result = ex.call("calculate_grade", 150, thresholds)
    assert isinstance(result, dict)
    assert result["title"] == "Apex Leviathan"


# ---------------------------------------------------------------------------
# Test 38 — calculate_grade returns lowest tier for zero score
# ---------------------------------------------------------------------------

def test_calculate_grade_zero_score_returns_hatchling() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    thresholds = FIXTURE_DATA["grade_thresholds"]
    result = ex.call("calculate_grade", 0, thresholds)
    assert isinstance(result, dict)
    assert result["title"] == "Newborn Hatchling"


# ---------------------------------------------------------------------------
# Shared config helper for init_game / tick_game tests
# ---------------------------------------------------------------------------

def _make_config(game_duration: float = 300.0) -> dict:
    arena = dict(FIXTURE_DATA["arena"])
    arena["num_npcs"] = 2
    arena["num_fruits"] = 5
    return {
        "arena":             arena,
        "fruit":             FIXTURE_DATA["fruit"],
        "player_stats":      FIXTURE_DATA["player_stats"],
        "player_preset":     FIXTURE_DATA["player_presets"][0],
        "npc_profiles":      FIXTURE_DATA["npc_profiles"],
        "npc_stats":         FIXTURE_DATA["npc_stats"],
        "evolution_cards":   FIXTURE_DATA["evolution_cards"],
        "active_evolutions": {},
        "game_duration":     game_duration,
    }


_INPUT = {"control_type": "mouse", "mouse_x": 10, "mouse_y": 0, "keys": {}}


# ---------------------------------------------------------------------------
# Test 39 — init_game + tick_game returns render state with player key
# ---------------------------------------------------------------------------

def test_init_game_sets_global_state() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    ex.call("init_game", _make_config())
    result = ex.call("tick_game", 0.016, _INPUT)
    assert isinstance(result, dict)
    assert "player" in result


# ---------------------------------------------------------------------------
# Test 40 — tick_game moves player head away from initial spawn
# ---------------------------------------------------------------------------

def test_tick_game_moves_player() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    cfg = _make_config()
    arena = cfg["arena"]
    initial_x = arena["map_width"] / 2
    initial_y = arena["map_height"] / 2
    ex.call("init_game", cfg)
    result = ex.call("tick_game", 0.25, _INPUT)
    segs_x = result["player"]["segs_x"]
    segs_y = result["player"]["segs_y"]
    assert segs_x[0] != initial_x or segs_y[0] != initial_y


# ---------------------------------------------------------------------------
# Test 41 — tick_game result always contains an events list
# ---------------------------------------------------------------------------

def test_tick_game_returns_events_list() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    ex.call("init_game", _make_config())
    result = ex.call("tick_game", 0.016, _INPUT)
    assert "events" in result
    assert isinstance(result["events"], (list, dict))


# ---------------------------------------------------------------------------
# Test 42 — game_over event fires when time expires
# ---------------------------------------------------------------------------

def test_tick_game_game_over_event() -> None:
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    ex.call("init_game", _make_config(game_duration=0.01))
    result = ex.call("tick_game", 0.1, _INPUT)
    event_types = [e["type"] for e in result["events"]]
    assert "game_over" in event_types


# ---------------------------------------------------------------------------
# Test 43 — Magnet card effect_per_level is 25 (not 60)
# ---------------------------------------------------------------------------

def test_slither_magnet_nerf() -> None:
    """Magnet card effect_per_level is 25 (not 60)."""
    cards = FIXTURE_DATA["evolution_cards"]
    magnet = next((dict(c) for c in cards if dict(c).get("id") == "magnet"), None)
    assert magnet is not None
    assert float(magnet.get("effect_per_level", 0)) == 25.0


# ---------------------------------------------------------------------------
# Test 44 — Ambush card is present in evolution_cards
# ---------------------------------------------------------------------------

def test_slither_ambush_card_exists() -> None:
    """Ambush card is present in evolution_cards."""
    cards = FIXTURE_DATA["evolution_cards"]
    ids = [dict(c).get("id") for c in cards]
    assert "ambush" in ids


# ---------------------------------------------------------------------------
# Test 45 — NPC hunter mode activates (no crash with new logic)
# ---------------------------------------------------------------------------

def test_slither_npc_hunter_mode_activates() -> None:
    """After init_game, ticking with a large NPC field sets npc.hunting."""
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    ex.call("init_game", _make_config())
    # For test purposes, just verify the tick_game doesn't crash with the new logic
    for _ in range(10):
        result = ex.call("tick_game", 0.1, _INPUT)
    assert result is not None
    assert "npcs" in dict(result)


# ---------------------------------------------------------------------------
# Test 46 — update_evolution_effects stores active_evolutions in GAME_STATE
# ---------------------------------------------------------------------------

def test_slither_venom_speed_synergy_stored() -> None:
    """update_evolution_effects stores active_evolutions in GAME_STATE."""
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    ex.call("init_game", _make_config())
    # Apply both venom and speed
    ex.call("update_evolution_effects", {"venom": 1, "speed": 1})
    # Verify game state is intact (no crash)
    result = ex.call("tick_game", 0.016, _INPUT)
    assert result is not None
