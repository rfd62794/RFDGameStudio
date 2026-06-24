"""test_executor.py — Tests for studio.executor.

All tests use seed=42. Uses the fixture logic.lua loaded from tests/fixtures/.
"""

from pathlib import Path

import pytest

from studio.executor import Executor, LuaError

FIXTURES_DIR = Path(__file__).parent / "fixtures"
LUA_SOURCE = (FIXTURES_DIR / "horse_racing" / "logic.lua").read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Test 8
# ---------------------------------------------------------------------------

def test_executor_calls_clamp_function() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    result = ex.call("clamp", 5, 0, 10)
    assert result == 5


# ---------------------------------------------------------------------------
# Test 9
# ---------------------------------------------------------------------------

def test_executor_clamp_enforces_min() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    result = ex.call("clamp", -5, 0, 10)
    assert result == 0


# ---------------------------------------------------------------------------
# Test 10
# ---------------------------------------------------------------------------

def test_executor_clamp_enforces_max() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    result = ex.call("clamp", 15, 0, 10)
    assert result == 10


# ---------------------------------------------------------------------------
# Test 11
# ---------------------------------------------------------------------------

def test_executor_generate_horse_name_returns_string() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    prefixes = ["Midnight", "Golden", "Silver"]
    suffixes = ["Storm", "Dancer", "Bullet"]
    result = ex.call("generate_horse_name", prefixes, suffixes)
    assert isinstance(result, str)
    assert len(result) > 0


# ---------------------------------------------------------------------------
# Test 12
# ---------------------------------------------------------------------------

def test_executor_unknown_function_raises() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    with pytest.raises(AttributeError):
        ex.call("function_that_does_not_exist")
