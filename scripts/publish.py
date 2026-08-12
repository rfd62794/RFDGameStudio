"""scripts/publish.py — Entry point for publishing a game from
RFDGameStudio. Does NOT perform deployment itself — validates the
game-metadata.json contract (see docs/PUBLISHING_CONTRACT.md), then prints
the real command that does, in the sibling `RFD_IT_Publishing` repo. Only
runs that command itself if explicitly asked with --execute.

See docs/PUBLISHING.md for the full picture.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from studio.publish_validator import PublishValidationError, validate_publish_metadata

# game-metadata.json's game_id -> RFD_IT_Publishing/config/games.yaml's
# game_name, where they differ. Confirmed real mismatch (the reverse of
# RFD_IT_Publishing/targets/itchio.py's _GAME_ID_ALIASES):
# game-metadata.json uses "voiddrift", games.yaml uses "voidrift".
_GAME_NAME_ALIASES = {"voiddrift": "voidrift"}

_PUBLISHING_REPO = Path(os.environ.get("RFD_IT_PUBLISHING_PATH", r"C:\Github\RFD_IT_Publishing"))


def main(game_id: str, execute: bool) -> int:
    try:
        validate_publish_metadata(game_id)
    except PublishValidationError as exc:
        print(f"Validation failed: {exc}")
        return 1

    game_name = _GAME_NAME_ALIASES.get(game_id, game_id)
    command = ["python", "publisher.py", "deploy", game_name, "--target", "itchio"]
    print(f"cd {_PUBLISHING_REPO} && {' '.join(command)}")

    if not execute:
        print("(dry: pass --execute to actually run this, with RFD_IT_Publishing's own butler setup)")
        return 0

    if not (_PUBLISHING_REPO / "publisher.py").exists():
        print(f"Cannot execute: publisher.py not found under {_PUBLISHING_REPO}")
        return 1

    print(f"Running: {' '.join(command)} (cwd={_PUBLISHING_REPO})")
    result = subprocess.run(command, cwd=str(_PUBLISHING_REPO))
    return result.returncode


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("game_id", help="game_id as it appears in ts/src/games/game-metadata.json")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually run the publish command in RFD_IT_Publishing, instead of only printing it.",
    )
    args = parser.parse_args()
    sys.exit(main(args.game_id, args.execute))
