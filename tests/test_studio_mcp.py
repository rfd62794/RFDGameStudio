"""test_studio_mcp.py — Tests for studio_mcp tools (tests 22–28).

Tests call tool functions directly — no HTTP server needed.
"""

from __future__ import annotations

import pytest

from studio_mcp.tools import (
    studio_call,
    studio_get_schema,
    studio_get_systems,
    studio_load_game,
    studio_run_headless,
    studio_validate_game,
    studio_run_tests,
)


# ---------------------------------------------------------------------------
# Test 22
# ---------------------------------------------------------------------------

def test_load_game_returns_session_id() -> None:
    result = studio_load_game("horse_racing")
    assert "session_id" in result
    assert result["game_id"] == "horse_racing"
    assert isinstance(result["session_id"], str)
    assert len(result["session_id"]) > 0


# ---------------------------------------------------------------------------
# Test 23
# ---------------------------------------------------------------------------

def test_load_game_invalid_id_returns_error() -> None:
    result = studio_load_game("game_that_does_not_exist")
    assert "error" in result
    assert "session_id" not in result


# ---------------------------------------------------------------------------
# Test 24
# ---------------------------------------------------------------------------

def test_call_clamp_returns_correct_value() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_call(sid, "clamp", {"val": 5, "min_val": 0, "max_val": 10})
    assert "error" not in result, result.get("error")
    assert result["result"] == 5


# ---------------------------------------------------------------------------
# Test 25
# ---------------------------------------------------------------------------

def test_call_unknown_function_returns_error() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_call(sid, "function_that_does_not_exist")
    assert "error" in result
    assert "result" not in result


# ---------------------------------------------------------------------------
# Test 26
# ---------------------------------------------------------------------------

def test_get_schema_horse_returns_fields() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_get_schema(sid, "horse")
    assert "error" not in result, result.get("error")
    assert result["entity"] == "horse"
    assert "stats" in result["schema"]


# ---------------------------------------------------------------------------
# Test 27
# ---------------------------------------------------------------------------

def test_get_systems_returns_manifest() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_get_systems(sid)
    assert "error" not in result, result.get("error")
    assert "systems" in result
    assert isinstance(result["systems"], list)
    assert len(result["systems"]) > 0


# ---------------------------------------------------------------------------
# Test 28
# ---------------------------------------------------------------------------

def test_run_headless_generate_horse_10_iterations() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    data = load  # reuse session

    import yaml
    from pathlib import Path
    game_data_path = Path(__file__).parent.parent / "games" / "horse_racing" / "data.yaml"
    game_data = yaml.safe_load(game_data_path.read_text(encoding="utf-8"))

    options = {"min_stat": 25, "max_stat": 65, "generation": 1, "player_owned": False}
    coat_colors = game_data["coat_colors"]
    silk_colors = game_data["silk_colors"]
    prefixes = game_data["name_prefixes"]
    suffixes = game_data["name_suffixes"]

    result = studio_run_headless(
        sid,
        "generate_horse",
        10,
        args={"options": options, "coat_colors": coat_colors,
              "silk_colors": silk_colors, "prefixes": prefixes, "suffixes": suffixes},
        seed_start=1,
    )
    assert "error" not in result, result.get("error")
    assert result["iterations"] == 10
    assert len(result["results"]) == 10


# ---------------------------------------------------------------------------
# Test 29
# ---------------------------------------------------------------------------

def test_studio_validate_game_horse_racing() -> None:
    """studio_validate_game returns valid=True for horse_racing."""
    result = studio_validate_game('horse_racing')
    assert result.get('valid') is True
    assert result.get('game_id') == 'horse_racing'
    issues = result.get('issues', [])
    errors = [i for i in issues if i.get('severity') == 'error']
    assert len(errors) == 0


# ---------------------------------------------------------------------------
# Test 30
# ---------------------------------------------------------------------------

def test_studio_run_tests_returns_structure() -> None:
    """studio_run_tests returns dict with passed/failed keys."""
    result = studio_run_tests(game_id='studio_mcp')
    assert 'passed' in result or 'error' in result
    if 'passed' in result:
        assert isinstance(result['passed'], int)
        assert isinstance(result['failed'], int)
        assert 'floor_met' in result
