"""publishing.py — the studio's side of itch.io publishing.

The butler push itself lives in the self-contained ``itch_publisher`` package
(packages/itch_publisher), which never imports studio code. This module
supplies the studio-specific parts: the game registry at publishing/games.yaml
and the post-publish hook that records a confirmed release in
game-metadata.json.
"""

from __future__ import annotations

from pathlib import Path

from itch_publisher import check_butler, push

from studio_mcp.game_metadata import (
    PIPELINE_STAGE_ITCH_PUBLISHED,
    advance_pipeline_stage,
    record_deployed_version,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
GAMES_CONFIG_PATH = REPO_ROOT / "publishing" / "games.yaml"


def mark_itch_published(game_id: str, version: str | None, metadata_path: Path | None = None) -> None:
    """Record a confirmed successful itch.io push in game-metadata.json.

    Sets pipeline_stage to itch_published and, when the build carried a
    VERSION, deployed_version. Missing files or unknown game_ids are ignored,
    matching advance_pipeline_stage/record_deployed_version.
    """
    advance_pipeline_stage(game_id, PIPELINE_STAGE_ITCH_PUBLISHED, out_path=metadata_path)
    if version:
        record_deployed_version(game_id, version, out_path=metadata_path)


def publish_to_itch(
    game_id: str,
    dry_run: bool = True,
    config_path: Path | None = None,
    metadata_path: Path | None = None,
) -> bool:
    """Push game_id's build to itch.io; on real success, mark it published.

    Dry run (the default) prints the butler command without running it and
    never touches game-metadata.json.
    """
    if not dry_run and not check_butler():
        print("Error: butler not found. Install from https://itch.io/docs/butler/")
        return False
    return push(
        game_id,
        config_path=config_path or GAMES_CONFIG_PATH,
        dry_run=dry_run,
        on_published=lambda name, version: mark_itch_published(name, version, metadata_path),
    )
