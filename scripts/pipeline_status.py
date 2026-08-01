"""scripts/pipeline_status.py — Report every real game's current pipeline
stage, grouped, so a gap is visible at a glance rather than requiring
manual cross-referencing.

Also surfaces pipeline_flag (e.g. a real, live-confirmed regression like a
broken itch.io push) -- this is real, current status that must never be
silently absorbed into either of the two neighboring pipeline_stage
buckets. A flagged game still appears under its honest current
pipeline_stage; the flag is reported separately so it doesn't disappear.
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

METADATA_PATH = Path(__file__).resolve().parent.parent / "ts" / "src" / "games" / "game-metadata.json"

STAGE_ORDER = ["ai_studio", "website_collection", "itch_published"]


def main() -> None:
    data = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    by_stage: dict[str, list[str]] = defaultdict(list)
    flags: dict[str, str] = {}

    for game, info in data.items():
        stage = info.get("pipeline_stage", "ai_studio")
        by_stage[stage].append(game)
        flag = info.get("pipeline_flag")
        if flag:
            flags[game] = flag

    for stage in STAGE_ORDER:
        games = by_stage.get(stage, [])
        print(f"\n{stage} ({len(games)}):")
        for g in sorted(games):
            marker = "  [!] FLAGGED" if g in flags else ""
            print(f"  - {g}{marker}")

    # Any stage value present in the file but not in our known enum
    # (should not happen, but report loudly rather than silently dropping
    # games from the output if it ever does).
    unknown_stages = set(by_stage) - set(STAGE_ORDER)
    for stage in sorted(unknown_stages):
        games = by_stage[stage]
        print(f"\nUNKNOWN STAGE {stage!r} ({len(games)}):")
        for g in sorted(games):
            print(f"  - {g}")

    if flags:
        print("\nFlags needing attention:")
        for game in sorted(flags):
            print(f"  - {game}: {flags[game]}")


if __name__ == "__main__":
    main()
