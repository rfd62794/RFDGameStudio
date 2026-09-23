#!/usr/bin/env python3
"""
Shark survival diagnostic — ad hoc analysis script.

Runs several long Shoal simulations and uses the persistent diagnostics
log to distinguish two failure modes:

1. Throughput problem: dead sharks had a target most of their lives and
   ate regularly, but still starved (kill rate < hunger rate).
2. Density/perception problem: dead sharks spent most of their lives
   with no target and rarely found food.

The script prints raw numbers per death and an overall verdict.
"""

from __future__ import annotations

import statistics
import sys
from collections import defaultdict
from pathlib import Path

# Make studio.runtime importable when running from repo root
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from studio.runtime import load_game, call  # type: ignore


SEEDS = [42, 123, 999, 2026, 1]
TICKS = 300
DT = 0.1


def run_one(seed: int) -> dict:
    session = load_game("shoal", seed=seed)
    data = session.files.data
    call(session, "init_game", data)

    for _ in range(TICKS):
        call(session, "tick_game", DT, {})

    diagnostics = call(session, "get_diagnostics")
    summary = call(session, "get_state_summary")
    return {
        "seed": seed,
        "diagnostics": diagnostics,
        "summary": summary,
        "fish_refund": data["creatures"]["shark"]["fish_hunger_refund"],
        "chunk_refund": data["flesh_chunk"]["hunger_refund"],
        "exposure_threshold": data["creatures"]["shark"]["exposure"]["threshold"],
        "exposure_damage_rate": data["creatures"]["shark"]["exposure"]["damage_rate"],
    }


def analyze_run(run: dict) -> tuple[list[dict], dict]:
    diagnostics = run["diagnostics"]
    deaths = diagnostics.get("deaths", [])
    meals = diagnostics.get("meals", [])
    if not deaths:
        return [], {"fish": 0, "chunk": 0}

    # Bucket meals by shark_id
    meals_by_shark: dict[int, list[dict]] = defaultdict(list)
    for m in meals:
        meals_by_shark[m["shark_id"]].append(m)

    type_counts: dict[str, int] = {"fish": 0, "chunk": 0}
    for m in meals:
        type_counts[m.get("meal_type", "unknown")] = type_counts.get(m.get("meal_type", "unknown"), 0) + 1

    results = []
    for d in deaths:
        shark_id = d["shark_id"]
        shark_meals = meals_by_shark.get(shark_id, [])
        meal_count = len(shark_meals)
        if meal_count:
            avg_ticks = statistics.mean(m["ticks_since_last_meal"] for m in shark_meals)
            fish_count = sum(1 for m in shark_meals if m.get("meal_type") == "fish")
            chunk_count = meal_count - fish_count
            fish_fraction = fish_count / meal_count
            hunger_values = [m["hunger_at_meal"] for m in shark_meals]
            first_hunger = hunger_values[0]
            last_hunger = hunger_values[-1]
            hunger_trend = last_hunger - first_hunger
            # split intervals by meal type for the throughput check
            fish_intervals = [m["ticks_since_last_meal"] for m in shark_meals if m.get("meal_type") == "fish"]
            chunk_intervals = [m["ticks_since_last_meal"] for m in shark_meals if m.get("meal_type") == "chunk"]
            avg_fish_interval = statistics.mean(fish_intervals) * DT if fish_intervals else None
            avg_chunk_interval = statistics.mean(chunk_intervals) * DT if chunk_intervals else None
        else:
            avg_ticks = None
            fish_count = 0
            chunk_count = 0
            fish_fraction = None
            first_hunger = None
            last_hunger = None
            hunger_trend = None
            avg_fish_interval = None
            avg_chunk_interval = None

        results.append(
            {
                "seed": run["seed"],
                "shark_id": shark_id,
                "tick": d["tick"],
                "lifespan_ticks": d["ticks_since_spawn"],
                "target_ratio": d["target_ratio"],
                "meal_count": meal_count,
                "fish_count": fish_count,
                "chunk_count": chunk_count,
                "fish_fraction": fish_fraction,
                "avg_ticks_since_last_meal": avg_ticks,
                "avg_fish_interval_s": avg_fish_interval,
                "avg_chunk_interval_s": avg_chunk_interval,
                "first_hunger": first_hunger,
                "last_hunger": last_hunger,
                "hunger_trend": hunger_trend,
                "cause": d["cause"],
                "hunger": d["hunger"],
                "exposure": d["exposure"],
            }
        )
    return results, type_counts


def main() -> None:
    all_results: list[dict] = []
    all_runs: list[dict] = []
    surviving_sharks = 0

    type_counts: dict[str, int] = {"fish": 0, "chunk": 0}
    for seed in SEEDS:
        run = run_one(seed)
        all_runs.append(run)
        summary = run["summary"]
        print(f"\nseed {seed}: final fish={summary['fish_count']} sharks={summary['shark_count']} "
              f"chunks={summary['chunk_count']} ticks={summary['tick_count']}")

        deaths = run["diagnostics"].get("deaths", [])
        meals = run["diagnostics"].get("meals", [])
        print(f"  recorded deaths: {len(deaths)}, recorded meals: {len(meals)}")

        run_results, run_type_counts = analyze_run(run)
        all_results.extend(run_results)
        for k, v in run_type_counts.items():
            type_counts[k] = type_counts.get(k, 0) + v
        surviving_sharks += summary["shark_count"]

    print("\n" + "=" * 80)
    print("SHARK SURVIVAL DIAGNOSTIC REPORT")
    print("=" * 80)

    if not all_results:
        print("No shark deaths recorded across any seed — sharks survived in every run.")
        return

    # Header
    print(
        f"{'seed':>6} {'shark_id':>9} {'tick':>6} {'life':>6} {'target_ratio':>13} "
        f"{'meals':>6} {'fish%':>7} {'fish_int_s':>11} {'chunk_int_s':>12} "
        f"{'trend':>7} {'cause':>11} {'hunger':>8} {'exposure':>10}"
    )
    print("-" * 120)

    ratios = []
    meal_intervals = []
    hunger_trends = []
    exposures = []
    for r in all_results:
        ratio = r["target_ratio"]
        ratios.append(ratio)
        avg = r["avg_ticks_since_last_meal"]
        if avg is not None:
            meal_intervals.append(avg)
        trend = r["hunger_trend"]
        if trend is not None:
            hunger_trends.append(trend)
        exposures.append(r["exposure"])
        fish_frac = r["fish_fraction"]
        print(
            f"{r['seed']:>6} {r['shark_id']:>9} {r['tick']:>6} {r['lifespan_ticks']:>6} "
            f"{ratio:>13.3f} {r['meal_count']:>6} "
            f"{f'{fish_frac * 100:>6.0f}' if fish_frac is not None else f'{'N/A':>7}'} "
            f"{f'{r['avg_fish_interval_s']:>10.2f}' if r['avg_fish_interval_s'] is not None else f'{'N/A':>11}'} "
            f"{f'{r['avg_chunk_interval_s']:>10.2f}' if r['avg_chunk_interval_s'] is not None else f'{'N/A':>12}'} "
            f"{f'{trend:>6.2f}' if trend is not None else f'{'N/A':>7}'} "
            f"{r['cause']:>11} {r['hunger']:>8.2f} {r['exposure']:>10.2f}"
        )

    print("-" * 120)
    total_meals = sum(type_counts.values())
    print(f"Total deaths analyzed: {len(all_results)}")
    print(f"Surviving sharks across all seeds: {surviving_sharks}")
    print(f"Mean target_ratio for dead sharks: {statistics.mean(ratios):.3f}")
    print(f"Median target_ratio for dead sharks: {statistics.median(ratios):.3f}")
    if total_meals:
        print(f"Meal mix: {type_counts['fish']} fish ({type_counts['fish'] / total_meals * 100:.1f}%), "
              f"{type_counts['chunk']} chunk ({type_counts['chunk'] / total_meals * 100:.1f}%)")
    if meal_intervals:
        print(f"Mean avg_ticks_since_last_meal: {statistics.mean(meal_intervals):.1f} "
              f"({statistics.mean(meal_intervals) * DT:.2f}s)")
        print(f"Median avg_ticks_since_last_meal: {statistics.median(meal_intervals):.1f} "
              f"({statistics.median(meal_intervals) * DT:.2f}s)")
    if hunger_trends:
        print(f"Mean hunger trend (last - first hunger_at_meal): {statistics.mean(hunger_trends):.2f}")
        print(f"Median hunger trend: {statistics.median(hunger_trends):.2f}")
    if exposures:
        print(f"Mean exposure at death: {statistics.mean(exposures):.2f}")
        print(f"Median exposure at death: {statistics.median(exposures):.2f}")

    print("\n" + "=" * 80)
    print("VERDICT")
    print("=" * 80)

    mean_ratio = statistics.mean(ratios)
    median_interval_s = statistics.median(meal_intervals) * DT if meal_intervals else float("inf")
    mean_hunger_trend = statistics.mean(hunger_trends) if hunger_trends else 0
    mean_exposure = statistics.mean(exposures) if exposures else 0

    # Use the actual refund values configured for the current run.
    # The first run is authoritative; all seeds share the same data.yaml.
    fish_refund = all_runs[0]["fish_refund"]
    chunk_refund = all_runs[0]["chunk_refund"]
    exposure_threshold = all_runs[0]["exposure_threshold"]
    exposure_damage_rate = all_runs[0]["exposure_damage_rate"]
    fish_net = median_interval_s - fish_refund
    chunk_net = median_interval_s - chunk_refund

    if mean_ratio >= 0.5 and median_interval_s <= 5:
        if total_meals and (type_counts["fish"] / total_meals) >= 0.5 and fish_net <= 0 and mean_hunger_trend > 0:
            verdict = "throughput problem (exposure dominates reward)"
            reason = (
                "Dead sharks had active targets, ate mostly fish, and still saw hunger rise across meals. "
                f"That means the -{fish_refund} fish reward is being eaten by exposure hunger accumulation, "
                "not by normal time. This is a reward/throughput issue, not a density issue."
            )
        elif total_meals and (type_counts["chunk"] / total_meals) >= 0.5 and chunk_net > 0:
            verdict = "throughput problem (chunk reward too small)"
            reason = (
                "Dead sharks had active targets and ate mostly chunks. With a median interval of "
                f"{median_interval_s:.2f}s, each chunk refund (-{chunk_refund}) leaves a net hunger gain of "
                f"{chunk_net:.2f} per cycle. The chunk reward is structurally insufficient."
            )
        elif mean_exposure >= exposure_threshold and mean_hunger_trend > 0:
            verdict = "throughput problem (exposure damage dominates hunger)"
            reason = (
                "Dead sharks had active targets and found food, but their exposure reached the threshold and "
                f"exposure damage ({exposure_damage_rate}/s) added to hunger faster than the chunk/fish refunds. "
                "The reward math is healthy in isolation, so starvation is driven by exposure accumulation, not by reward size."
            )
        elif mean_hunger_trend > 0:
            verdict = "throughput problem"
            reason = (
                "Dead sharks spent most of their lives with a target and hunger rose across their meal history. "
                "They found food regularly, but the reward did not outpace their hunger accumulation."
            )
        else:
            verdict = "genuinely ambiguous"
            reason = (
                "Dead sharks had active targets and ate at a high rate, but their hunger trend is flat or falling. "
                "The final death may have been a single unlucky long gap; the data does not clearly support a "
                "systemic throughput failure."
            )
    elif mean_ratio < 0.3 and (not meal_intervals or median_interval_s > 10):
        verdict = "density/perception problem"
        reason = (
            "Dead sharks rarely had a target and went long stretches without a meal. "
            "This suggests there simply aren't enough reachable fish/chunks, or the sharks cannot perceive them, "
            "rather than a reward/throughput math issue."
        )
    else:
        verdict = "genuinely ambiguous"
        reason = (
            "The data does not cleanly favor either hypothesis. Some dead sharks had targets and ate, "
            "others did not; a mixed or middle pattern. A more targeted run (e.g., fixed fish/chunk ratio) "
            "would be needed for a clear verdict."
        )

    print(f"Median meal interval: {median_interval_s:.2f}s")
    print(f"Net hunger per fish cycle: {fish_net:.2f} (negative = healthy)")
    print(f"Net hunger per chunk cycle: {chunk_net:.2f} (negative = healthy)")
    print(f"Verdict: {verdict}")
    print(f"Reasoning: {reason}")


if __name__ == "__main__":
    main()
