"""test_runtime.py — Integration tests for the full runtime bridge.

These tests load the actual horse_racing three-file game and exercise
every Lua system function through the runtime bridge contract.
"""

from __future__ import annotations

import pytest

try:
    import lupa  # noqa: F401
    _LUPA = True
except ImportError:
    _LUPA = False

lupa_required = pytest.mark.skipif(not _LUPA, reason="lupa not installed")

if _LUPA:
    from studio.runtime import (
        GameSession,
        RuntimeError,
        call_with_args,
        get_schema,
        load_game,
    )


@pytest.fixture(scope="module")
def session() -> "GameSession":
    return load_game("horse_racing", rng_seed=42)


# ---------------------------------------------------------------------------
# load_game tests
# ---------------------------------------------------------------------------

@lupa_required
class TestLoadGame:
    def test_returns_game_session(self, session: "GameSession") -> None:
        assert isinstance(session, GameSession)

    def test_game_id_set(self, session: "GameSession") -> None:
        assert session.game_id == "horse_racing"

    def test_data_loaded(self, session: "GameSession") -> None:
        assert "meta" in session.data
        assert session.data["meta"]["game_id"] == "horse_racing"

    def test_ui_loaded(self, session: "GameSession") -> None:
        assert "tabs" in session.ui

    def test_constants_accessible(self, session: "GameSession") -> None:
        assert session.data["constants"]["race"]["field_size"] == 8

    def test_invalid_game_id_raises(self) -> None:
        with pytest.raises(RuntimeError):
            load_game("no_such_game")


# ---------------------------------------------------------------------------
# get_schema tests
# ---------------------------------------------------------------------------

@lupa_required
class TestGetSchema:
    def test_horse_schema_returned(self, session: "GameSession") -> None:
        schema = get_schema(session, "horse")
        assert "fields" in schema

    def test_horse_schema_has_stats(self, session: "GameSession") -> None:
        schema = get_schema(session, "horse")
        assert "stats" in schema["fields"]

    def test_unknown_entity_raises(self, session: "GameSession") -> None:
        with pytest.raises(RuntimeError, match="not found"):
            get_schema(session, "unicorn")


# ---------------------------------------------------------------------------
# GeneticsSystem tests
# ---------------------------------------------------------------------------

@lupa_required
class TestGenerateGenome:
    def test_returns_dict(self, session: "GameSession") -> None:
        genome = call_with_args(session, "generate_genome")
        assert isinstance(genome, dict)

    def test_has_three_alleles(self, session: "GameSession") -> None:
        genome = call_with_args(session, "generate_genome")
        assert "speed_allele" in genome
        assert "stamina_allele" in genome
        assert "temperament_allele" in genome

    def test_alleles_in_range(self, session: "GameSession") -> None:
        for _ in range(20):
            genome = call_with_args(session, "generate_genome")
            for key in ("speed_allele", "stamina_allele", "temperament_allele"):
                assert 1 <= genome[key] <= 10, f"{key} out of range: {genome[key]}"


# ---------------------------------------------------------------------------
# StatSystem tests
# ---------------------------------------------------------------------------

@lupa_required
class TestDeriveStats:
    def _make_genome(self, session: "GameSession") -> dict:
        return call_with_args(session, "generate_genome")

    def test_returns_six_stats(self, session: "GameSession") -> None:
        genome = self._make_genome(session)
        lua = session.executor._lua
        stats = call_with_args(session, "derive_stats", lua.table_from(genome))
        for stat in ("VIT", "PWR", "AGI", "MND", "RES", "CHM"):
            assert stat in stats

    def test_stats_in_range(self, session: "GameSession") -> None:
        lua = session.executor._lua
        for _ in range(10):
            genome = self._make_genome(session)
            stats = call_with_args(session, "derive_stats", lua.table_from(genome))
            for stat in ("VIT", "PWR", "AGI", "MND", "RES", "CHM"):
                val = stats[stat]
                assert 1 <= val <= 100, f"{stat}={val} out of range"


# ---------------------------------------------------------------------------
# OddsSystem tests
# ---------------------------------------------------------------------------

@lupa_required
class TestCalculateOdds:
    def _make_field(self, session: "GameSession", n: int = 4) -> list:
        lua = session.executor._lua
        field = []
        for i in range(1, n + 1):
            genome = call_with_args(session, "generate_genome")
            stats = call_with_args(session, "derive_stats", lua.table_from(genome))
            field.append({
                "id": f"h_{i:03d}",
                "stats": stats,
            })
        return field

    def test_returns_odds_for_all_horses(self, session: "GameSession") -> None:
        lua = session.executor._lua
        field = self._make_field(session)
        lua_field = lua.table_from([lua.table_from(h) for h in field])
        odds = call_with_args(session, "calculate_odds", lua_field, 0.15)
        assert isinstance(odds, dict)
        assert len(odds) == 4

    def test_all_odds_greater_than_one(self, session: "GameSession") -> None:
        lua = session.executor._lua
        field = self._make_field(session)
        lua_field = lua.table_from([lua.table_from(h) for h in field])
        odds = call_with_args(session, "calculate_odds", lua_field, 0.15)
        for horse_id, o in odds.items():
            assert o > 1.0, f"Odds for {horse_id} should be > 1.0, got {o}"


# ---------------------------------------------------------------------------
# RaceSystem tests
# ---------------------------------------------------------------------------

@lupa_required
class TestResolveRace:
    def _make_field(self, session: "GameSession", n: int = 6) -> list:
        lua = session.executor._lua
        field = []
        for i in range(1, n + 1):
            genome = call_with_args(session, "generate_genome")
            stats = call_with_args(session, "derive_stats", lua.table_from(genome))
            field.append({"id": f"h_{i:03d}", "stats": stats})
        return field

    def test_returns_finishing_order(self, session: "GameSession") -> None:
        lua = session.executor._lua
        field = self._make_field(session)
        lua_field = lua.table_from([lua.table_from(h) for h in field])
        order = call_with_args(session, "resolve_race", lua_field, 1200, 0.04, 0.12)
        assert isinstance(order, list)
        assert len(order) == 6

    def test_all_horses_finish(self, session: "GameSession") -> None:
        lua = session.executor._lua
        field = self._make_field(session)
        horse_ids = {h["id"] for h in field}
        lua_field = lua.table_from([lua.table_from(h) for h in field])
        order = call_with_args(session, "resolve_race", lua_field, 1200, 0.04, 0.12)
        assert set(order) == horse_ids

    def test_no_duplicate_finishers(self, session: "GameSession") -> None:
        lua = session.executor._lua
        field = self._make_field(session)
        lua_field = lua.table_from([lua.table_from(h) for h in field])
        order = call_with_args(session, "resolve_race", lua_field, 1200, 0.04, 0.12)
        assert len(order) == len(set(order))

    def test_deterministic_with_seed(self) -> None:
        """Same seed -> same finishing order."""
        s1 = load_game("horse_racing", rng_seed=7)
        s2 = load_game("horse_racing", rng_seed=7)

        def run(s: "GameSession") -> list:
            lua = s.executor._lua
            field = []
            for i in range(1, 5):
                genome = call_with_args(s, "generate_genome")
                stats = call_with_args(s, "derive_stats", lua.table_from(genome))
                field.append({"id": f"h_{i}", "stats": stats})
            lua_field = lua.table_from([lua.table_from(h) for h in field])
            return call_with_args(s, "resolve_race", lua_field, 1200, 0.04, 0.12)

        assert run(s1) == run(s2)


# ---------------------------------------------------------------------------
# BreedingSystem tests
# ---------------------------------------------------------------------------

@lupa_required
class TestBreedHorses:
    def _make_horse(self, session: "GameSession", horse_id: str) -> dict:
        lua = session.executor._lua
        genome = call_with_args(session, "generate_genome")
        stats = call_with_args(session, "derive_stats", lua.table_from(genome))
        return {
            "id": horse_id,
            "name": f"Horse {horse_id}",
            "genome": genome,
            "stats": stats,
            "generation": 0,
        }

    def test_returns_foal_dict(self, session: "GameSession") -> None:
        lua = session.executor._lua
        sire = self._make_horse(session, "sire_1")
        dam = self._make_horse(session, "dam_1")
        coats = session.data["tables"]["coat_colors"]["values"]
        foal = call_with_args(
            session, "breed_horses",
            lua.table_from(sire), lua.table_from(dam),
            "foal_001", "Test Foal",
            0.05,
            lua.table_from(coats),
        )
        assert isinstance(foal, dict)

    def test_foal_has_required_fields(self, session: "GameSession") -> None:
        lua = session.executor._lua
        sire = self._make_horse(session, "sire_2")
        dam = self._make_horse(session, "dam_2")
        coats = session.data["tables"]["coat_colors"]["values"]
        foal = call_with_args(
            session, "breed_horses",
            lua.table_from(sire), lua.table_from(dam),
            "foal_002", "Foal B",
            0.05,
            lua.table_from(coats),
        )
        for field in ("id", "name", "genome", "stats", "generation", "coat", "wins", "races"):
            assert field in foal, f"Missing field: {field}"

    def test_foal_generation_increments(self, session: "GameSession") -> None:
        lua = session.executor._lua
        sire = self._make_horse(session, "sire_3")
        dam = self._make_horse(session, "dam_3")
        coats = session.data["tables"]["coat_colors"]["values"]
        foal = call_with_args(
            session, "breed_horses",
            lua.table_from(sire), lua.table_from(dam),
            "foal_003", "Foal C",
            0.05,
            lua.table_from(coats),
        )
        assert foal["generation"] == 1

    def test_foal_coat_is_valid(self, session: "GameSession") -> None:
        lua = session.executor._lua
        sire = self._make_horse(session, "sire_4")
        dam = self._make_horse(session, "dam_4")
        coats = session.data["tables"]["coat_colors"]["values"]
        foal = call_with_args(
            session, "breed_horses",
            lua.table_from(sire), lua.table_from(dam),
            "foal_004", "Foal D",
            0.05,
            lua.table_from(coats),
        )
        assert foal["coat"] in coats


# ---------------------------------------------------------------------------
# Betting resolution tests
# ---------------------------------------------------------------------------

@lupa_required
class TestResolveBet:
    def test_winning_bet_pays_out(self, session: "GameSession") -> None:
        lua = session.executor._lua
        bet = {"horse_id": "h_001", "amount": 100, "race_id": "r_001"}
        order = ["h_001", "h_002", "h_003"]
        odds = {"h_001": 3.5, "h_002": 2.0, "h_003": 5.0}
        result = call_with_args(
            session, "resolve_bet",
            lua.table_from(bet),
            lua.table_from(order),
            lua.table_from(odds),
        )
        assert result["won"] is True
        assert result["payout"] == 350

    def test_losing_bet_zero_payout(self, session: "GameSession") -> None:
        lua = session.executor._lua
        bet = {"horse_id": "h_002", "amount": 100, "race_id": "r_001"}
        order = ["h_001", "h_002", "h_003"]
        odds = {"h_001": 3.5, "h_002": 2.0, "h_003": 5.0}
        result = call_with_args(
            session, "resolve_bet",
            lua.table_from(bet),
            lua.table_from(order),
            lua.table_from(odds),
        )
        assert result["won"] is False
        assert result["payout"] == 0


# ---------------------------------------------------------------------------
# Headless simulation — 100 races
# ---------------------------------------------------------------------------

@lupa_required
class TestHeadlessSimulation:
    def test_hundred_race_simulation(self, session: "GameSession") -> None:
        """Run 100 races and verify no crashes and correct race completion."""
        lua = session.executor._lua
        field_size = 6
        winners: list[str] = []

        for race_num in range(100):
            # Regenerate field each race so horse stats vary across races
            field = []
            for i in range(1, field_size + 1):
                genome = call_with_args(session, "generate_genome")
                stats = call_with_args(session, "derive_stats", lua.table_from(genome))
                field.append({"id": f"r{race_num}_h{i}", "stats": stats})

            lua_field = lua.table_from([lua.table_from(h) for h in field])
            order = call_with_args(session, "resolve_race", lua_field, 1200, 0.04, 0.12)

            assert len(order) == field_size, f"Race {race_num}: wrong field size in result"
            assert len(set(order)) == field_size, f"Race {race_num}: duplicate finishers"
            winners.append(order[0])

        assert len(winners) == 100
        # With freshly generated horses across 100 races, expect multiple distinct winners
        assert len(set(winners)) >= 2
