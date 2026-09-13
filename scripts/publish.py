"""scripts/publish.py — Publish a game from RFDGameStudio to itch.io.

Validates the game's game-metadata.json entry (see docs/PUBLISHING_CONTRACT.md),
then pushes its build with the in-repo ``itch_publisher`` package using
publishing/games.yaml. Dry run by default: prints the butler command without
running it. Pass --execute to push for real; on success the game is marked
itch_published in game-metadata.json.

See docs/PUBLISHING.md for the full picture.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from studio.publish_validator import PublishValidationError, validate_publish_metadata
from studio_mcp.publishing import publish_to_itch


def main(game_id: str, execute: bool) -> int:
    try:
        validate_publish_metadata(game_id)
    except PublishValidationError as exc:
        print(f"Validation failed: {exc}")
        return 1

    if not execute:
        print("(dry run: pass --execute to push for real)")
    return 0 if publish_to_itch(game_id, dry_run=not execute) else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("game_id", help="game_id as it appears in ts/src/games/game-metadata.json")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually push to itch.io with butler, instead of printing the command.",
    )
    args = parser.parse_args()
    sys.exit(main(args.game_id, args.execute))
