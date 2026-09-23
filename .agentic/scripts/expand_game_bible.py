#!/usr/bin/env python3
import argparse
import yaml
from pathlib import Path

def create_game_bible(game, title, core_loop, win_condition, loss_condition, theme):
    game_dir = Path(__file__).parent.parent.parent / "bible" / "games" / game
    game_dir.mkdir(parents=True, exist_ok=True)

    # Create index.md
    index_path = game_dir / "index.md"
    with open(index_path, "w") as f:
        f.write(f"""---
title: "{title}"
game: "{game}"
type: "game_bible"
status: "prototype"
last_updated: "2026-09-05"
---

# {title}

## Overview
{theme}

## Links
- [GDD](gdd.md)
- [Mechanics](mechanics.md) (Coming Soon)
""")

    # Create gdd.md
    gdd_path = game_dir / "gdd.md"
    with open(gdd_path, "w") as f:
        f.write(f"""---
title: "{title} GDD"
game: "{game}"
type: "gdd"
version: "0.1"
status: "draft"
last_updated: "2026-09-05"
core_loop: "{core_loop}"
win_condition: "{win_condition}"
loss_condition: "{loss_condition}"
---

# {title} Game Design Document

## Core Loop
{core_loop}

## Win Condition
{win_condition}

## Loss Condition
{loss_condition}

## Mechanics
- (Coming Soon)

## Theme
{theme}
""")

    print(f"OK: Created bible for {game}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Expand Project Bible for a new game.")
    parser.add_argument("--game", required=True, help="Game ID (e.g., 'trinity-siege').")
    parser.add_argument("--title", required=True, help="Game title (e.g., 'Trinity Siege').")
    parser.add_argument("--core-loop", required=True, help="Core loop (e.g., 'Build defenses -> Survive waves -> Upgrade towers').")
    parser.add_argument("--win-condition", required=True, help="Win condition (e.g., 'Defeat the final boss wave').")
    parser.add_argument("--loss-condition", required=True, help="Loss condition (e.g., 'Base destruction').")
    parser.add_argument("--theme", required=True, help="Theme (e.g., 'Sci-fi tower defense').")
    args = parser.parse_args()
    create_game_bible(
        args.game,
        args.title,
        args.core_loop,
        args.win_condition,
        args.loss_condition,
        args.theme
    )