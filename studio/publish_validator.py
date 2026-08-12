"""publish_validator.py — Validates a game_id's entry in
ts/src/games/game-metadata.json against the real publish-tracking
contract, confirmed by reading RFD_IT_Publishing/targets/itchio.py and
this repo's own studio_mcp/game_metadata.py (August 2026).

Publish contract, distinct from validator.py's data.yaml/ui.yaml
studio contract:
  - game-metadata.json must be a JSON object.
  - game_id must be a key in it.
  - The entry at that key must itself be a JSON object (RFD_IT_Publishing's
    targets.itchio._mark_itch_published does `data[game_id]["pipeline_stage"]
    = ...` after a real, successful butler push — that assignment requires
    the entry to already be a mapping).
  - The entry must carry a "pipeline_stage" field, one of the three real
    enum values this studio's own studio_mcp/game_metadata.py writes:
    "ai_studio", "website_collection", "itch_published". An entry missing
    this field was never produced by generate_game_metadata() and is not a
    real, pipeline-tracked entry, even though RFD_IT_Publishing's write-back
    would not itself crash on one (dict assignment creates missing keys).

Note: RFD_IT_Publishing's `publisher.py deploy` does NOT read
game-metadata.json to decide *how* to deploy (build_dir/itchio_slug/channel
come only from RFD_IT_Publishing/config/games.yaml). game-metadata.json is
write-back-only: RFD_IT_Publishing updates it after a confirmed successful
push, purely for pipeline-stage tracking. This validator checks the entry
is in the shape that write-back requires and expects.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class PublishValidationError(Exception):
    """Raised when a game_id's game-metadata.json entry fails the publish contract."""


# Real enum, three values only — mirrors studio_mcp/game_metadata.py's
# PIPELINE_STAGE_* constants.
_VALID_PIPELINE_STAGES = ("ai_studio", "website_collection", "itch_published")

_DEFAULT_METADATA_PATH = (
    Path(__file__).resolve().parent.parent / "ts" / "src" / "games" / "game-metadata.json"
)


def validate_publish_metadata(game_id: str, metadata_path: Path | None = None) -> None:
    """Validate game_id's entry in game-metadata.json against the real
    contract RFD_IT_Publishing's write-back requires.

    Raises :class:`PublishValidationError` naming the exact missing or
    malformed field on failure. Returns ``None`` on success.
    """
    metadata_path = metadata_path or _DEFAULT_METADATA_PATH

    if not metadata_path.exists():
        raise PublishValidationError(f"Missing file: {metadata_path}")

    try:
        raw = metadata_path.read_text(encoding="utf-8")
    except OSError as exc:
        raise PublishValidationError(f"Cannot read {metadata_path}: {exc}") from exc

    try:
        data: Any = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise PublishValidationError(f"{metadata_path} is not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise PublishValidationError(
            f"game-metadata.json must be a JSON object, got {type(data).__name__}"
        )

    if game_id not in data:
        raise PublishValidationError(f"Missing entry: {game_id} not found in game-metadata.json")

    entry = data[game_id]
    if not isinstance(entry, dict):
        raise PublishValidationError(
            f"{game_id} entry must be a JSON object, got {type(entry).__name__}"
        )

    if "pipeline_stage" not in entry:
        raise PublishValidationError(f"Missing field: {game_id}.pipeline_stage")

    stage = entry["pipeline_stage"]
    if stage not in _VALID_PIPELINE_STAGES:
        raise PublishValidationError(
            f"{game_id}.pipeline_stage must be one of {_VALID_PIPELINE_STAGES}, got {stage!r}"
        )
