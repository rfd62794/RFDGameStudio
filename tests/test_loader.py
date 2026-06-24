"""test_loader.py — Tests for studio.loader and studio.validator.

All tests use tests/fixtures/ — never games/ directly.
"""

from pathlib import Path

import pytest

from studio.loader import GameFiles, load_game_files
from studio.validator import ValidationError, validate_data

FIXTURES_DIR = Path(__file__).parent / "fixtures"


# ---------------------------------------------------------------------------
# Test 1
# ---------------------------------------------------------------------------

def test_load_game_files_returns_game_files() -> None:
    result = load_game_files("horse_racing", games_dir=FIXTURES_DIR)
    assert isinstance(result, GameFiles)
    assert result.game_id == "horse_racing"


# ---------------------------------------------------------------------------
# Test 2
# ---------------------------------------------------------------------------

def test_load_game_files_parses_data_yaml() -> None:
    result = load_game_files("horse_racing", games_dir=FIXTURES_DIR)
    assert isinstance(result.data, dict)
    assert result.data["game"]["id"] == "horse_racing"


# ---------------------------------------------------------------------------
# Test 3
# ---------------------------------------------------------------------------

def test_load_game_files_parses_ui_yaml() -> None:
    result = load_game_files("horse_racing", games_dir=FIXTURES_DIR)
    assert isinstance(result.ui, dict)
    assert "game" in result.ui


# ---------------------------------------------------------------------------
# Test 4
# ---------------------------------------------------------------------------

def test_load_game_files_reads_lua_source() -> None:
    result = load_game_files("horse_racing", games_dir=FIXTURES_DIR)
    assert isinstance(result.logic, str)
    assert "function" in result.logic


# ---------------------------------------------------------------------------
# Test 5
# ---------------------------------------------------------------------------

def test_load_game_files_missing_dir_raises() -> None:
    with pytest.raises(FileNotFoundError):
        load_game_files("no_such_game", games_dir=FIXTURES_DIR)


# ---------------------------------------------------------------------------
# Test 6
# ---------------------------------------------------------------------------

def test_validate_data_passes_valid_data() -> None:
    result = load_game_files("horse_racing", games_dir=FIXTURES_DIR)
    validate_data(result.data)   # must not raise


# ---------------------------------------------------------------------------
# Test 7
# ---------------------------------------------------------------------------

def test_validate_data_missing_game_id_raises() -> None:
    bad_data = {
        "game": {
            "name": "Test",
            "version": "1.0",
            "studio": "RFDGameStudio",
            # "id" intentionally omitted
        }
    }
    with pytest.raises(ValidationError, match="game.id"):
        validate_data(bad_data)
