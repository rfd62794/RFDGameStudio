"""test_shark_survival_analysis.py — Tests for scripts/shark_survival_analysis.py.

The script is a diagnostic: it runs seeded Shoal sims (run_one), reduces the
persistent diagnostics log into per-death meal stats (analyze_run), and prints
a verdict distinguishing throughput vs density/perception starvation (main).
Tests stub the runtime boundary (load_game/call and run_one) so the real
aggregation and verdict logic is exercised without a live Lua session.
"""
from __future__ import annotations

import io
from contextlib import redirect_stdout
from types import SimpleNamespace


def _meal(shark_id: int, meal_type: str | None, ticks_since_last_meal: float, hunger_at_meal: float) -> dict:
    meal = {
        "shark_id": shark_id,
        "ticks_since_last_meal": ticks_since_last_meal,
        "hunger_at_meal": hunger_at_meal,
    }
    if meal_type is not None:
        meal["meal_type"] = meal_type
    return meal


def _death(
    shark_id: int,
    *,
    tick: int = 250,
    ticks_since_spawn: int = 200,
    target_ratio: float = 0.9,
    cause: str = "starvation",
    hunger: float = 95.0,
    exposure: float = 10.0,
) -> dict:
    return {
        "shark_id": shark_id,
        "tick": tick,
        "ticks_since_spawn": ticks_since_spawn,
        "target_ratio": target_ratio,
        "cause": cause,
        "hunger": hunger,
        "exposure": exposure,
    }


def _run(
    seed: int,
    deaths: list[dict],
    meals: list[dict],
    *,
    fish_refund: float = 3.0,
    chunk_refund: float = 6.0,
    exposure_threshold: float = 50.0,
    exposure_damage_rate: float = 0.5,
    shark_count: int = 0,
) -> dict:
    """Fake of run_one's return value — same keys the real sim produces."""
    return {
        "seed": seed,
        "diagnostics": {"deaths": deaths, "meals": meals},
        "summary": {"fish_count": 10, "shark_count": shark_count, "chunk_count": 2, "tick_count": 300},
        "fish_refund": fish_refund,
        "chunk_refund": chunk_refund,
        "exposure_threshold": exposure_threshold,
        "exposure_damage_rate": exposure_damage_rate,
    }


def _run_main(monkeypatch, runs: list[dict]) -> str:
    """Drive main() with stubbed sims and return its stdout."""
    import scripts.shark_survival_analysis as ssa

    by_seed = {r["seed"]: r for r in runs}
    monkeypatch.setattr(ssa, "SEEDS", list(by_seed))
    monkeypatch.setattr(ssa, "run_one", lambda seed: by_seed[seed])
    buf = io.StringIO()
    with redirect_stdout(buf):
        ssa.main()
    return buf.getvalue()


def test_analyze_run_no_deaths_returns_empty() -> None:
    """Empty-case branch: no deaths -> no per-death results, zeroed type counts."""
    import scripts.shark_survival_analysis as ssa

    results, type_counts = ssa.analyze_run(_run(42, [], []))
    assert results == []
    assert type_counts == {"fish": 0, "chunk": 0}

    # Missing diagnostics keys behave the same as empty ones
    results, type_counts = ssa.analyze_run({"seed": 1, "diagnostics": {}})
    assert results == []
    assert type_counts == {"fish": 0, "chunk": 0}


def test_analyze_run_death_without_meals_yields_null_stats() -> None:
    """A shark that died with no recorded meals gets the None/0 fields,
    not a statistics error."""
    import scripts.shark_survival_analysis as ssa

    run = _run(7, [_death(3, target_ratio=0.2)], [])
    results, type_counts = ssa.analyze_run(run)

    assert len(results) == 1
    r = results[0]
    assert r["seed"] == 7
    assert r["shark_id"] == 3
    assert r["meal_count"] == 0
    assert r["fish_count"] == 0
    assert r["chunk_count"] == 0
    assert r["fish_fraction"] is None
    assert r["avg_ticks_since_last_meal"] is None
    assert r["avg_fish_interval_s"] is None
    assert r["avg_chunk_interval_s"] is None
    assert r["first_hunger"] is None
    assert r["last_hunger"] is None
    assert r["hunger_trend"] is None
    # Death fields pass through untouched
    assert r["target_ratio"] == 0.2
    assert r["cause"] == "starvation"
    assert type_counts == {"fish": 0, "chunk": 0}


def test_analyze_run_aggregates_meals_for_dead_shark() -> None:
    """Success path: meals are bucketed by shark_id, split by type, and
    intervals are converted to seconds via DT."""
    import scripts.shark_survival_analysis as ssa

    meals = [
        _meal(7, "fish", 10, 30.0),
        _meal(7, "fish", 20, 45.0),
        _meal(7, "chunk", 30, 60.0),
        _meal(9, "fish", 5, 1.0),  # different shark — counts in type_counts only
    ]
    run = _run(7, [_death(7, tick=250, ticks_since_spawn=200, target_ratio=0.8, exposure=12.5)], meals)
    results, type_counts = ssa.analyze_run(run)

    assert len(results) == 1
    r = results[0]
    assert r["meal_count"] == 3
    assert r["fish_count"] == 2
    assert r["chunk_count"] == 1
    assert r["fish_fraction"] == 2 / 3
    assert r["avg_ticks_since_last_meal"] == 20.0
    assert r["avg_fish_interval_s"] == 15.0 * ssa.DT
    assert r["avg_chunk_interval_s"] == 30.0 * ssa.DT
    assert r["first_hunger"] == 30.0
    assert r["last_hunger"] == 60.0
    assert r["hunger_trend"] == 30.0
    assert r["tick"] == 250
    assert r["lifespan_ticks"] == 200
    assert r["exposure"] == 12.5
    # All meals across all sharks feed the global meal-type counts
    assert type_counts == {"fish": 3, "chunk": 1}


def test_analyze_run_unknown_meal_type() -> None:
    """A meal missing meal_type is bucketed under 'unknown' in type_counts.
    In the per-shark split it counts as non-fish (chunk_count) but does not
    feed avg_chunk_interval_s, which only averages explicit 'chunk' meals."""
    import scripts.shark_survival_analysis as ssa

    meals = [
        _meal(1, "fish", 10, 20.0),
        _meal(1, None, 20, 30.0),
        _meal(1, "chunk", 40, 40.0),
    ]
    results, type_counts = ssa.analyze_run(_run(1, [_death(1)], meals))

    assert type_counts == {"fish": 1, "chunk": 1, "unknown": 1}
    r = results[0]
    assert r["meal_count"] == 3
    assert r["fish_count"] == 1
    assert r["chunk_count"] == 2  # unknown lumped into the non-fish count
    assert r["avg_fish_interval_s"] == 10.0 * ssa.DT
    assert r["avg_chunk_interval_s"] == 40.0 * ssa.DT


def test_run_one_assembles_seed_diagnostics_and_config(monkeypatch) -> None:
    """run_one drives init/tick/diagnostics on the session and lifts the
    four reward/exposure values out of data.yaml-shaped config."""
    import scripts.shark_survival_analysis as ssa

    data = {
        "creatures": {"shark": {"fish_hunger_refund": 4.0, "exposure": {"threshold": 60.0, "damage_rate": 0.75}}},
        "flesh_chunk": {"hunger_refund": 8.0},
    }
    session = SimpleNamespace(files=SimpleNamespace(data=data))
    loaded: list[tuple[str, int]] = []
    calls: list[str] = []

    def fake_call(sess, fn_name, *args):
        calls.append(fn_name)
        if fn_name == "get_diagnostics":
            return {"deaths": [], "meals": []}
        if fn_name == "get_state_summary":
            return {"fish_count": 5, "shark_count": 1, "chunk_count": 0, "tick_count": ssa.TICKS}
        return None

    monkeypatch.setattr(ssa, "load_game", lambda game_id, seed: loaded.append((game_id, seed)) or session)
    monkeypatch.setattr(ssa, "call", fake_call)

    run = ssa.run_one(123)

    assert loaded == [("shoal", 123)]
    assert calls[0] == "init_game"
    assert calls[1:-2] == ["tick_game"] * ssa.TICKS
    assert calls[-2:] == ["get_diagnostics", "get_state_summary"]
    assert run["seed"] == 123
    assert run["diagnostics"] == {"deaths": [], "meals": []}
    assert run["summary"]["shark_count"] == 1
    assert run["fish_refund"] == 4.0
    assert run["chunk_refund"] == 8.0
    assert run["exposure_threshold"] == 60.0
    assert run["exposure_damage_rate"] == 0.75


def test_main_no_deaths_reports_survival(monkeypatch) -> None:
    """Early-return branch: zero deaths across every seed."""
    out = _run_main(monkeypatch, [_run(7, [], [], shark_count=2)])
    assert "No shark deaths recorded across any seed" in out


def test_main_verdict_throughput_exposure_dominates_reward(monkeypatch) -> None:
    """Targets held (ratio >= 0.5), fast fish meals (median <= 5s), fish
    refund covers the interval (net <= 0), yet hunger still rises ->
    exposure is eating the reward."""
    meals = [_meal(1, "fish", 20, h) for h in (10.0, 20.0, 30.0, 40.0)]
    out = _run_main(monkeypatch, [_run(7, [_death(1, target_ratio=0.9)], meals, fish_refund=3.0)])
    assert "Verdict: throughput problem (exposure dominates reward)" in out


def test_main_verdict_chunk_reward_too_small(monkeypatch) -> None:
    """Mostly chunk meals whose refund is smaller than the median interval
    (chunk_net > 0) -> structurally insufficient chunk reward."""
    meals = [_meal(1, "chunk", 40, h) for h in (10.0, 20.0, 30.0)]
    out = _run_main(monkeypatch, [_run(7, [_death(1, target_ratio=0.9)], meals, chunk_refund=2.0)])
    assert "Verdict: throughput problem (chunk reward too small)" in out


def test_main_verdict_exposure_damage_dominates(monkeypatch) -> None:
    """Fish meals where the refund does NOT cover the interval (fish_net > 0
    fails the first check), but mean exposure crossed the threshold while
    hunger rose -> exposure damage verdict."""
    meals = [_meal(1, "fish", 40, h) for h in (10.0, 20.0, 30.0)]
    out = _run_main(
        monkeypatch,
        [_run(7, [_death(1, target_ratio=0.9, exposure=80.0)], meals, fish_refund=2.0)],
    )
    assert "Verdict: throughput problem (exposure damage dominates hunger)" in out


def test_main_verdict_throughput_generic(monkeypatch) -> None:
    """All specific sub-checks fail but hunger still rose across meals ->
    generic throughput verdict."""
    meals = [_meal(1, "fish", 40, h) for h in (10.0, 20.0, 30.0)]
    out = _run_main(
        monkeypatch,
        [_run(7, [_death(1, target_ratio=0.9, exposure=10.0)], meals, fish_refund=2.0)],
    )
    assert "Verdict: throughput problem\n" in out


def test_main_verdict_ambiguous_when_hunger_trend_flat(monkeypatch) -> None:
    """High target ratio and fast meals but flat/falling hunger -> the data
    does not support a systemic throughput failure."""
    meals = [_meal(1, "fish", 20, h) for h in (40.0, 30.0, 20.0)]
    out = _run_main(monkeypatch, [_run(7, [_death(1, target_ratio=0.9)], meals, fish_refund=3.0)])
    assert "Verdict: genuinely ambiguous" in out


def test_main_verdict_density_perception(monkeypatch) -> None:
    """Dead shark rarely had a target and never ate -> density/perception."""
    out = _run_main(monkeypatch, [_run(7, [_death(1, target_ratio=0.1)], [])])
    assert "Verdict: density/perception problem" in out


def test_main_verdict_ambiguous_middle_ratios(monkeypatch) -> None:
    """Target ratio between the 0.3 and 0.5 boundaries fits neither
    hypothesis -> genuinely ambiguous."""
    meals = [_meal(1, "fish", 20, h) for h in (10.0, 20.0)]
    out = _run_main(monkeypatch, [_run(7, [_death(1, target_ratio=0.4)], meals)])
    assert "Verdict: genuinely ambiguous" in out
