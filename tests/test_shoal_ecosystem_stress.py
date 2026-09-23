"""tests/test_shoal_ecosystem_stress.py — Tests for scripts/shoal_ecosystem_stress.py."""

from __future__ import annotations

import io
import sys
from contextlib import redirect_stdout
from types import SimpleNamespace

import scripts.shoal_ecosystem_stress as stress


def _series(fish: int, live: int, total: int, ticks: int = 3, sharks: int = 0) -> list[dict]:
    """A constant synthetic time-series matching run_one's row shape."""
    return [
        {
            "tick": i + 1,
            "fish": fish,
            "sharks": sharks,
            "live_nodules": live,
            "total_nodules": total,
            "regrowing_nodules": total - live,
            "chunks": 0,
        }
        for i in range(ticks)
    ]


def _stub_session() -> SimpleNamespace:
    """Stand-in for a loaded game session carrying a shoal-shaped data dict."""
    data = {
        "spawn": {
            "initial_fish": 30,
            "initial_sharks": 2,
            "initial_algae_hubs": 6,
        }
    }
    return SimpleNamespace(files=SimpleNamespace(data=data))


def _run_main(monkeypatch, tmp_path, series: list[dict], extra_argv: list[str] | None = None) -> tuple[str, dict]:
    """Run main() with the simulation stubbed out; return captured stdout."""
    captured: dict = {}

    def fake_run_one(seed: int, ticks: int, dt: float, data: dict | None = None) -> list[dict]:
        captured["data"] = data
        return [dict(row) for row in series]

    monkeypatch.setattr(stress, "load_game", lambda *a, **k: _stub_session())
    monkeypatch.setattr(stress, "run_one", fake_run_one)
    argv = [
        "shoal_ecosystem_stress.py",
        "--seeds", "7",
        "--ticks", str(len(series)),
        "--output-dir", str(tmp_path),
    ]
    monkeypatch.setattr(sys, "argv", argv + (extra_argv or []))

    buf = io.StringIO()
    with redirect_stdout(buf):
        stress.main()
    return buf.getvalue(), captured


def test_summarize_series_computes_stats() -> None:
    """Summary stats reflect the series: finals, extremes, means, and ratios."""
    series = [
        {"tick": 1, "fish": 10, "sharks": 1, "live_nodules": 8, "total_nodules": 10,
         "regrowing_nodules": 2, "chunks": 0},
        {"tick": 2, "fish": 20, "sharks": 2, "live_nodules": 6, "total_nodules": 12,
         "regrowing_nodules": 6, "chunks": 1},
        {"tick": 3, "fish": 30, "sharks": 3, "live_nodules": 4, "total_nodules": 8,
         "regrowing_nodules": 4, "chunks": 2},
    ]

    summary = stress.summarize_series(series)

    assert summary["final_fish"] == 30
    assert summary["final_sharks"] == 3
    assert summary["min_fish"] == 10
    assert summary["max_fish"] == 30
    assert summary["mean_fish"] == 20
    assert summary["final_live_nodules"] == 4
    assert summary["mean_live_nodules"] == 6
    # total_nodules is the last entry's capacity, not a mean
    assert summary["total_nodules"] == 8
    # ratios: 8/10, 6/12, 4/8 -> 0.8, 0.5, 0.5
    assert summary["mean_available_ratio"] == 0.6
    assert summary["min_available_ratio"] == 0.5
    assert summary["max_available_ratio"] == 0.8


def test_summarize_series_zero_capacity_is_zero_ratio() -> None:
    """A zero nodule capacity yields a 0 availability ratio, not a crash."""
    summary = stress.summarize_series(_series(fish=5, live=0, total=0))

    assert summary["mean_available_ratio"] == 0
    assert summary["min_available_ratio"] == 0
    assert summary["max_available_ratio"] == 0
    assert summary["total_nodules"] == 0


def test_summarize_series_single_entry() -> None:
    """A one-tick series has min == max == final == mean."""
    summary = stress.summarize_series(_series(fish=7, live=4, total=10, ticks=1))

    assert summary["final_fish"] == 7
    assert summary["min_fish"] == 7
    assert summary["max_fish"] == 7
    assert summary["mean_fish"] == 7
    assert summary["mean_available_ratio"] == 0.4


def test_run_one_returns_one_snapshot_per_tick() -> None:
    """A real short run produces a snapshot per tick with the documented keys."""
    series = stress.run_one(seed=42, ticks=5, dt=0.1)

    assert len(series) == 5
    expected_keys = {
        "tick", "fish", "sharks", "live_nodules",
        "total_nodules", "regrowing_nodules", "chunks",
    }
    for i, row in enumerate(series):
        assert set(row.keys()) == expected_keys
        # tick_count starts at 0 and increments once per tick_game call
        assert row["tick"] == i + 1
        assert row["fish"] >= 0
        assert row["sharks"] >= 0
        assert row["chunks"] >= 0
        # get_state_summary defines available = capacity - live
        assert row["live_nodules"] + row["regrowing_nodules"] == row["total_nodules"]


def test_run_one_uses_supplied_data() -> None:
    """The optional data argument overrides the session's default data.yaml."""
    from studio.runtime import load_game

    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0

    series = stress.run_one(seed=99, ticks=3, dt=0.1, data=data)

    assert len(series) == 3
    for row in series:
        assert row["fish"] == 0
        assert row["sharks"] == 0
        assert row["total_nodules"] == 0


def test_main_writes_per_seed_csv(tmp_path, monkeypatch) -> None:
    """main() writes a seed_<seed>.csv with header plus one row per tick."""
    series = _series(fish=50, live=5, total=10, ticks=3)
    _run_main(monkeypatch, tmp_path, series)

    csv_path = tmp_path / "seed_7.csv"
    assert csv_path.exists()
    lines = csv_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 4  # header + 3 ticks
    assert lines[0].split(",") == [
        "tick", "fish", "sharks", "live_nodules",
        "total_nodules", "regrowing_nodules", "chunks",
    ]


def test_main_verdict_predation_bottleneck(tmp_path, monkeypatch) -> None:
    """Collapsed fish (<30) with abundant algae (>0.6) blames reproduction/predation."""
    output, _ = _run_main(monkeypatch, tmp_path, _series(fish=10, live=8, total=10))
    assert "Verdict: predation/reproduction bottleneck likely" in output


def test_main_verdict_food_supply_bottleneck(tmp_path, monkeypatch) -> None:
    """Collapsed fish (<30) with depleted algae (<0.4) blames the food supply."""
    output, _ = _run_main(monkeypatch, tmp_path, _series(fish=10, live=3, total=10))
    assert "Verdict: food-supply bottleneck likely" in output


def test_main_verdict_food_constrained(tmp_path, monkeypatch) -> None:
    """Healthy fish (>=30) with depleted algae (<0.4) reports constrained food."""
    output, _ = _run_main(monkeypatch, tmp_path, _series(fish=50, live=3, total=10))
    assert "Verdict: food supply constrained" in output


def test_main_verdict_stable_between_thresholds(tmp_path, monkeypatch) -> None:
    """Collapsed fish with availability between 0.4 and 0.6 falls through to stable."""
    output, _ = _run_main(monkeypatch, tmp_path, _series(fish=20, live=5, total=10))
    assert "Verdict: stable or slow dynamics" in output


def test_main_spawn_overrides_reach_run_data(tmp_path, monkeypatch) -> None:
    """--initial-fish / --initial-sharks / --algae-hubs mutate the shared data dict."""
    series = _series(fish=50, live=5, total=10, ticks=3)
    _, captured = _run_main(
        monkeypatch, tmp_path, series,
        extra_argv=["--initial-fish", "5", "--initial-sharks", "1", "--algae-hubs", "2"],
    )

    assert captured["data"]["spawn"]["initial_fish"] == 5
    assert captured["data"]["spawn"]["initial_sharks"] == 1
    assert captured["data"]["spawn"]["initial_algae_hubs"] == 2
