"""test_runtime.py — Integration tests for the runtime public API.

All tests use tests/fixtures/ — never games/ directly.
Uses seed=42 throughout for reproducibility.
"""

from pathlib import Path

import pytest

from studio.runtime import GameSession, call, get_schema, load_game

FIXTURES_DIR = Path(__file__).parent / "fixtures"


# ---------------------------------------------------------------------------
# Test 13
# ---------------------------------------------------------------------------

def test_runtime_load_game_returns_session() -> None:
    session = load_game("horse_racing", seed=42, games_dir=FIXTURES_DIR)
    assert isinstance(session, GameSession)
    assert session.game_id == "horse_racing"


# ---------------------------------------------------------------------------
# Test 14
# ---------------------------------------------------------------------------

def test_runtime_call_clamp_via_session() -> None:
    session = load_game("horse_racing", seed=42, games_dir=FIXTURES_DIR)
    result = call(session, "clamp", 5, 0, 10)
    assert result == 5


# ---------------------------------------------------------------------------
# Test 15
# ---------------------------------------------------------------------------

def test_runtime_get_schema_returns_horse_fields() -> None:
    session = load_game("horse_racing", seed=42, games_dir=FIXTURES_DIR)
    schema = get_schema(session, "horse")
    assert isinstance(schema, dict)
    assert "stats" in schema
