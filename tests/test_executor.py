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


# ---------------------------------------------------------------------------
# Shared helpers for behavioral equivalence tests
# ---------------------------------------------------------------------------

def _make_participants(n: int = 6) -> list:
    """Build n deterministic participant dicts for race tests."""
    stats = [
        (70, 60, 65, 75),
        (55, 72, 50, 80),
        (62, 68, 58, 60),
        (80, 55, 72, 70),
        (50, 80, 45, 85),
        (65, 65, 60, 65),
    ]
    participants = []
    for i in range(n):
        s = stats[i % len(stats)]
        participants.append({
            "horse": {
                "id": f"h{i+1}",
                "name": f"Horse{i+1}",
                "speed": s[0],
                "stamina": s[1],
                "acceleration": s[2],
                "temperament": s[3],
            },
            "energy": 100,
            "current_distance": 0,
            "current_speed": 0,
            "is_finished": False,
            "progress": 0,
        })
    return participants


# ---------------------------------------------------------------------------
# Test 16 — simulate_race returns 6 results
# ---------------------------------------------------------------------------

def test_simulate_race_returns_six_results() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    participants = _make_participants(6)
    results = ex.call("simulate_race", participants, {"distance": 1200})
    assert isinstance(results, list)
    assert len(results) == 6


# ---------------------------------------------------------------------------
# Test 17 — simulate_race ranks are 1 through 6, each exactly once
# ---------------------------------------------------------------------------

def test_simulate_race_ranks_are_1_through_6() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    participants = _make_participants(6)
    results = ex.call("simulate_race", participants, {"distance": 1200})
    ranks = sorted(int(r["rank"]) for r in results)
    assert ranks == [1, 2, 3, 4, 5, 6]


# ---------------------------------------------------------------------------
# Test 18 — calculate_place_odds is below win_odds and >= min
# ---------------------------------------------------------------------------

def test_calculate_place_odds_below_win_odds() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    config = {"place_odds_multiplier": 0.38, "place_odds_min": 1.15}
    place = ex.call("calculate_place_odds", 4.0, config)
    assert isinstance(place, float)
    assert place < 4.0
    assert place >= 1.15


# ---------------------------------------------------------------------------
# Test 19 — update_horse_after_race increments wins for rank 1
# ---------------------------------------------------------------------------

def test_update_horse_after_race_increments_wins() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    horse = {
        "id": "h1", "name": "Test", "gender": "Stallion",
        "generation": 1, "speed": 60, "stamina": 60,
        "acceleration": 60, "temperament": 60,
        "runs": 3, "wins": 1, "places": 1, "thirds": 0, "earnings": 300,
        "cooldown_until": 0, "player_owned": True, "price": 400,
    }
    updated = ex.call("update_horse_after_race", horse, 1, 720)
    assert int(updated["runs"]) == 4
    assert int(updated["wins"]) == 2
    assert int(updated["earnings"]) == 1020


# ---------------------------------------------------------------------------
# Test 20 — update_horse_after_race does not mutate input
# ---------------------------------------------------------------------------

def test_update_horse_after_race_does_not_mutate() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    horse = {
        "id": "h1", "name": "Test", "gender": "Stallion",
        "generation": 1, "speed": 60, "stamina": 60,
        "acceleration": 60, "temperament": 60,
        "runs": 3, "wins": 1, "places": 1, "thirds": 0, "earnings": 300,
        "cooldown_until": 0, "player_owned": True, "price": 400,
    }
    original_wins = horse["wins"]
    ex.call("update_horse_after_race", horse, 1, 720)
    assert horse["wins"] == original_wins


# ---------------------------------------------------------------------------
# Test 21 — settle_bets win bet pays correct amount
# ---------------------------------------------------------------------------

def test_settle_bets_win_bet_pays_correct_amount() -> None:
    ex = Executor(LUA_SOURCE, seed=42)
    bets = [
        {"horse_id": "h1", "amount": 100, "type": "Win", "payout_odds": 3.5},
        {"horse_id": "h2", "amount": 50,  "type": "Win", "payout_odds": 2.0},
    ]
    standings = [
        {"horse_id": "h1", "final_rank": 1},
        {"horse_id": "h2", "final_rank": 2},
        {"horse_id": "h3", "final_rank": 3},
    ]
    prize_splits = [0.60, 0.25, 0.15]
    result = ex.call("settle_bets", bets, standings, 1200, prize_splits)
    assert int(result["bet_payout"]) == 350   # 100 * 3.5; h2 Win on rank2 loses
    assert int(result["horse_earnings"]["h1"]) == 720   # 1200 * 0.60
    assert int(result["horse_earnings"]["h2"]) == 300   # 1200 * 0.25
