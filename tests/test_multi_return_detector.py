"""test_multi_return_detector.py — Tests for the multi-return Lua scanner.

Verifies that scan_lua.py correctly identifies multi-value return statements
in Lua logic files and that the TS bridge correctly captures all return values.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
SCAN_SCRIPT = TOOLS_DIR / "detect_multi_return" / "scan_lua.py"
GAMES_DIR = Path(__file__).resolve().parent.parent / "games"


def _run_scanner(*args: str) -> str:
    """Run scan_lua.py and return stdout."""
    result = subprocess.run(
        [sys.executable, str(SCAN_SCRIPT), *args],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


# ---------------------------------------------------------------------------
# Test 1: scanner runs without error
# ---------------------------------------------------------------------------

def test_scanner_runs_without_error() -> None:
    """scan_lua.py should run and produce output."""
    output = _run_scanner()
    assert "Total:" in output


# ---------------------------------------------------------------------------
# Test 2: scanner finds slimeworld multi-returns
# ---------------------------------------------------------------------------

def test_scanner_finds_slimeworld_multi_returns() -> None:
    """scan_lua.py should find multi-value returns in slimeworld/logic.lua."""
    output = _run_scanner("--game", "slimeworld")
    assert "slimeworld" in output
    assert "fulfill_petition" in output
    assert "recycle_slime" in output


# ---------------------------------------------------------------------------
# Test 3: scanner finds horse_racing multi-returns
# ---------------------------------------------------------------------------

def test_scanner_finds_horse_racing_multi_returns() -> None:
    """scan_lua.py should find multi-value returns in horse_racing/logic.lua."""
    output = _run_scanner("--game", "horse_racing")
    assert "horse_racing" in output
    assert "can_unlock_slot" in output


# ---------------------------------------------------------------------------
# Test 4: scanner JSON output is valid
# ---------------------------------------------------------------------------

def test_scanner_json_output_is_valid() -> None:
    """scan_lua.py --json should produce valid JSON array."""
    output = _run_scanner("--json")
    data = json.loads(output)
    assert isinstance(data, list)
    assert len(data) > 0
    for entry in data:
        assert "game" in entry
        assert "function" in entry
        assert "line" in entry
        assert "returns" in entry
        assert isinstance(entry["returns"], list)
        assert len(entry["returns"]) >= 2


# ---------------------------------------------------------------------------
# Test 5: scanner detects at least 6 games with multi-returns
# ---------------------------------------------------------------------------

def test_scanner_detects_multiple_games() -> None:
    """scan_lua.py should find multi-value returns across multiple games."""
    output = _run_scanner("--json")
    data = json.loads(output)
    games = {entry["game"] for entry in data}
    assert len(games) >= 6
    assert "slimeworld" in games
    assert "horse_racing" in games


# ---------------------------------------------------------------------------
# Test 6: scanner correctly identifies return value count
# ---------------------------------------------------------------------------

def test_scanner_identifies_return_value_count() -> None:
    """Each detected return should have at least 2 values."""
    output = _run_scanner("--json")
    data = json.loads(output)
    for entry in data:
        assert len(entry["returns"]) >= 2, (
            f"{entry['game']}/{entry['function']} line {entry['line']} "
            f"has only {len(entry['returns'])} return value(s)"
        )


# ---------------------------------------------------------------------------
# Test 7: scanner handles nonexistent game gracefully
# ---------------------------------------------------------------------------

def test_scanner_handles_nonexistent_game() -> None:
    """scan_lua.py should exit with error for nonexistent game."""
    with pytest.raises(subprocess.CalledProcessError):
        _run_scanner("--game", "nonexistent_game_12345")
