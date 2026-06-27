"""test_slither_rogue.py — Tests for Slither Rogue game logic (tests 33–38).

All tests use tests/fixtures/slither_rogue/ — never games/ directly.
Uses seed=42 throughout for reproducibility.
"""

from pathlib import Path

import pytest
import yaml

from studio.executor import Executor
from studio.loader import load_engine_source

FIXTURES_DIR = Path(__file__).parent / "fixtures"
LUA_SOURCE = (FIXTURES_DIR / "slither_rogue" / "logic.lua").read_text(encoding="utf-8")
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
