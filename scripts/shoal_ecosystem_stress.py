#!/usr/bin/env python3
"""
Shoal ecosystem stress-test harness.

Runs long simulations across multiple seeds and tracks population and algae
nodule counts over time. The goal is to distinguish two hypotheses:

1. Food-supply bottleneck: fish population crashes while live algae nodules are
   nearly exhausted, meaning there is not enough food to sustain the population.
2. Reproduction bottleneck: fish population crashes while algae nodules are
   abundant, meaning fish are not breeding fast enough to replace losses.

Outputs a per-seed CSV and a summary report.
"""

from __future__ import annotations

import argparse
import csv
import statistics
import sys
from pathlib import Path

# Make studio.runtime importable when running from repo root
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from studio.runtime import load_game, call  # type: ignore


DEFAULT_SEEDS = [42, 123, 999, 2026, 1, 7, 314, 867, 53, 2025]
DEFAULT_TICKS = 600
DEFAULT_DT = 0.1


def run_one(seed: int, ticks: int, dt: float, data: dict | None = None) -> list[dict]:
    """Run a single simulation and return a time-series of ecosystem snapshots."""
    session = load_game("shoal", seed=seed)
    if data is None:
        data = session.files.data
    call(session, "init_game", data)

    series: list[dict] = []
    for _ in range(ticks):
        call(session, "tick_game", dt, {})
        summary = call(session, "get_state_summary")
        series.append(
            {
                "tick": summary["tick_count"],
                "fish": summary["fish_count"],
                "sharks": summary["shark_count"],
                "live_nodules": summary["algae_count"],
                "total_nodules": summary["algae_capacity"],
                "regrowing_nodules": summary["algae_available"],
                "chunks": summary["chunk_count"],
            }
        )
    return series


def summarize_series(series: list[dict]) -> dict:
    """Compute summary statistics for a single time-series."""
    fish = [s["fish"] for s in series]
    sharks = [s["sharks"] for s in series]
    live = [s["live_nodules"] for s in series]
    total = [s["total_nodules"] for s in series]
    available_ratio = [l / t if t else 0 for l, t in zip(live, total)]

    return {
        "final_fish": fish[-1],
        "final_sharks": sharks[-1],
        "min_fish": min(fish),
        "max_fish": max(fish),
        "mean_fish": statistics.mean(fish),
        "final_live_nodules": live[-1],
        "mean_live_nodules": statistics.mean(live),
        "total_nodules": total[-1],
        "mean_available_ratio": statistics.mean(available_ratio),
        "min_available_ratio": min(available_ratio),
        "max_available_ratio": max(available_ratio),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run long Shoal simulations and collect ecosystem time-series."
    )
    parser.add_argument("--seeds", type=int, nargs="+", default=DEFAULT_SEEDS)
    parser.add_argument("--ticks", type=int, default=DEFAULT_TICKS)
    parser.add_argument("--dt", type=float, default=DEFAULT_DT)
    parser.add_argument("--output-dir", type=Path, default=Path("scripts/stress_output"))
    parser.add_argument(
        "--initial-fish", type=int, default=None, help="override data.yaml initial_fish"
    )
    parser.add_argument(
        "--initial-sharks", type=int, default=None, help="override data.yaml initial_sharks"
    )
    parser.add_argument(
        "--algae-hubs", type=int, default=None, help="override data.yaml initial_algae_hubs"
    )
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)

    # Load data.yaml once to use as the base for all runs.
    session = load_game("shoal", seed=args.seeds[0])
    data = session.files.data
    if args.initial_fish is not None:
        data["spawn"]["initial_fish"] = args.initial_fish
    if args.initial_sharks is not None:
        data["spawn"]["initial_sharks"] = args.initial_sharks
    if args.algae_hubs is not None:
        data["spawn"]["initial_algae_hubs"] = args.algae_hubs

    print(f"Running stress test: {len(args.seeds)} seeds, {args.ticks} ticks each (dt={args.dt})")
    print(f"Spawn config: fish={data['spawn']['initial_fish']}, "
          f"sharks={data['spawn']['initial_sharks']}, algae_hubs={data['spawn']['initial_algae_hubs']}")

    all_summaries: list[dict] = []

    for seed in args.seeds:
        series = run_one(seed, args.ticks, args.dt, data)
        summary = summarize_series(series)
        all_summaries.append({"seed": seed, **summary})

        csv_path = args.output_dir / f"seed_{seed}.csv"
        with csv_path.open("w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=series[0].keys())
            writer.writeheader()
            writer.writerows(series)

        print(f"  seed {seed}: final fish={summary['final_fish']} sharks={summary['final_sharks']} "
              f"live_nodules={summary['final_live_nodules']:.1f}/{summary['total_nodules']} "
              f"available={summary['mean_available_ratio']:.2%}")

    # Aggregate across seeds.
    def mean(key: str) -> float:
        return statistics.mean(s[key] for s in all_summaries)

    def minmax(key: str) -> tuple[float, float]:
        return min(s[key] for s in all_summaries), max(s[key] for s in all_summaries)

    print("\n" + "=" * 80)
    print("ECOSYSTEM STRESS TEST REPORT")
    print("=" * 80)

    print(f"Seeds: {len(args.seeds)} | Ticks: {args.ticks} | dt: {args.dt}")
    print(f"Fish: final mean={mean('final_fish'):.1f} [min={minmax('final_fish')[0]}, max={minmax('final_fish')[1]}]")
    print(f"Sharks: final mean={mean('final_sharks'):.1f} [min={minmax('final_sharks')[0]}, max={minmax('final_sharks')[1]}]")
    print(f"Min fish reached (any seed): {min(s['min_fish'] for s in all_summaries)}")
    print(f"Mean live nodules: {mean('mean_live_nodules'):.1f} / {mean('total_nodules'):.0f}")
    print(f"Mean nodule availability: {mean('mean_available_ratio'):.2%}")
    print(f"Nodule availability range: {min(s['min_available_ratio'] for s in all_summaries):.2%} - "
          f"{max(s['max_available_ratio'] for s in all_summaries):.2%}")

    # Bottleneck inference.
    # available_ratio = live_nodules / total_capacity. High means food is abundant.
    mean_final_fish = mean("final_fish")
    mean_avail = mean("mean_available_ratio")
    if mean_final_fish < 30 and mean_avail > 0.6:
        verdict = "predation/reproduction bottleneck likely"
        reason = (
            "Fish populations collapsed while algae nodules stayed abundant. "
            "Food is not the limiting factor; predation is outpacing fish replacement."
        )
    elif mean_final_fish < 30 and mean_avail < 0.4:
        verdict = "food-supply bottleneck likely"
        reason = (
            "Fish populations collapsed and algae nodules are mostly eaten. "
            "Algae supply is the limiting factor."
        )
    elif mean_avail < 0.4:
        verdict = "food supply constrained"
        reason = (
            "Algae nodules are mostly eaten, suggesting food is the main constraint."
        )
    else:
        verdict = "stable or slow dynamics"
        reason = (
            "Fish and nodule availability are moderate. No single bottleneck dominates."
        )

    print(f"\nVerdict: {verdict}")
    print(f"Reasoning: {reason}")
    print(f"\nPer-seed CSVs written to: {args.output_dir}")


if __name__ == "__main__":
    main()
