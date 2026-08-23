"""test_game_metadata.py — Tests for Pipeline Stage Tracking additions to
studio_mcp.game_metadata.

Real anchors from RFDGameStudio_PipelineStageTracking_Directive.md §3:
  test_pipeline_stage_defaults_to_ai_studio
  test_existing_metadata_fields_unaffected
Plus real regression coverage for advance_pipeline_stage's preservation
and no-regression behavior.
"""
from __future__ import annotations

import json

from studio_mcp.game_metadata import (
    GAME_PATHS,
    PIPELINE_STAGE_AI_STUDIO,
    PIPELINE_STAGE_ITCH_PUBLISHED,
    PIPELINE_STAGE_WEBSITE_COLLECTION,
    advance_pipeline_stage,
    generate_game_metadata,
    _load_existing_curated_fields,
)


def test_pipeline_stage_defaults_to_ai_studio() -> None:
    """A game entry with no recorded pipeline_stage reads as 'ai_studio',
    not an error, not a missing key."""
    metadata = generate_game_metadata(existing_stages={})
    for game_id in GAME_PATHS:
        assert metadata[game_id]["pipeline_stage"] == PIPELINE_STAGE_AI_STUDIO


def test_existing_metadata_fields_unaffected() -> None:
    """created/last_updated/tracked still read correctly after this change
    -- purely additive, nothing else in the schema breaks."""
    metadata = generate_game_metadata(existing_stages={})
    for game_id in GAME_PATHS:
        entry = metadata[game_id]
        assert "created" in entry
        assert "last_updated" in entry
        assert "version" in entry
        assert "tracked" in entry
        assert isinstance(entry["tracked"], bool)


def test_generate_game_metadata_carries_forward_existing_stages() -> None:
    """A full regeneration (as happens on every studio_deploy_arcade run)
    must preserve real, previously recorded pipeline_stage values --
    otherwise every deploy would silently wipe tracked progress."""
    any_game = next(iter(GAME_PATHS))
    metadata = generate_game_metadata(existing_stages={any_game: PIPELINE_STAGE_ITCH_PUBLISHED})
    assert metadata[any_game]["pipeline_stage"] == PIPELINE_STAGE_ITCH_PUBLISHED


def test_advance_pipeline_stage_writes_on_real_success(tmp_path) -> None:
    """advance_pipeline_stage updates the on-disk file for a known game_id."""
    metadata_path = tmp_path / "game-metadata.json"
    metadata_path.write_text(
        json.dumps({"brewfield": {"pipeline_stage": PIPELINE_STAGE_AI_STUDIO}}),
        encoding="utf-8",
    )
    result = advance_pipeline_stage("brewfield", PIPELINE_STAGE_WEBSITE_COLLECTION, out_path=metadata_path)
    assert result is True
    data = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert data["brewfield"]["pipeline_stage"] == PIPELINE_STAGE_WEBSITE_COLLECTION


def test_advance_pipeline_stage_refuses_regression_from_itch_published(tmp_path) -> None:
    """A successful arcade (website) deploy must never silently downgrade
    a game that's already itch_published back to website_collection."""
    metadata_path = tmp_path / "game-metadata.json"
    metadata_path.write_text(
        json.dumps({"shoal": {"pipeline_stage": PIPELINE_STAGE_ITCH_PUBLISHED}}),
        encoding="utf-8",
    )
    result = advance_pipeline_stage("shoal", PIPELINE_STAGE_WEBSITE_COLLECTION, out_path=metadata_path)
    assert result is False
    data = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert data["shoal"]["pipeline_stage"] == PIPELINE_STAGE_ITCH_PUBLISHED


def test_advance_pipeline_stage_allows_repolish_after_itch_published(tmp_path) -> None:
    """Re-publishing to itch.io after an already-published game is a real,
    legitimate event, not a regression -- must not be blocked."""
    metadata_path = tmp_path / "game-metadata.json"
    metadata_path.write_text(
        json.dumps({"shoal": {"pipeline_stage": PIPELINE_STAGE_ITCH_PUBLISHED}}),
        encoding="utf-8",
    )
    result = advance_pipeline_stage("shoal", PIPELINE_STAGE_ITCH_PUBLISHED, out_path=metadata_path)
    assert result is True


def test_advance_pipeline_stage_unknown_game_id_no_write(tmp_path) -> None:
    """Advancing a game_id not present in the file is a safe no-op, not a
    crash or a spurious new entry."""
    metadata_path = tmp_path / "game-metadata.json"
    original = {"brewfield": {"pipeline_stage": PIPELINE_STAGE_AI_STUDIO}}
    metadata_path.write_text(json.dumps(original), encoding="utf-8")
    result = advance_pipeline_stage("not_a_real_game", PIPELINE_STAGE_WEBSITE_COLLECTION, out_path=metadata_path)
    assert result is False
    data = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert data == original


# ── Arcade Metadata Expansion (Aug 23 2026): genre/tags carry-forward ──
# Real risk: generate_game_metadata rebuilds created/last_updated/version/
# tracked fresh from git every time. Without an explicit carry-forward
# (matching the pipeline_stage precedent above), hand-curated genre/tags
# in the on-disk JSON would be silently wiped on the next regeneration.

def test_load_existing_curated_fields_reads_genre_and_tags(tmp_path) -> None:
    """genre/tags are read back from the on-disk file when present."""
    metadata_path = tmp_path / "game-metadata.json"
    metadata_path.write_text(
        json.dumps({"succession": {"genre": "narrative-persuasion", "tags": ["court-intrigue", "rival-ai"]}}),
        encoding="utf-8",
    )
    curated = _load_existing_curated_fields(metadata_path)
    assert curated["succession"]["genre"] == "narrative-persuasion"
    assert curated["succession"]["tags"] == ["court-intrigue", "rival-ai"]


def test_load_existing_curated_fields_missing_file_returns_empty(tmp_path) -> None:
    """A missing file is a safe empty result, not an error."""
    metadata_path = tmp_path / "does-not-exist.json"
    assert _load_existing_curated_fields(metadata_path) == {}


def test_load_existing_curated_fields_omits_games_without_them(tmp_path) -> None:
    """A game with no genre/tags recorded is simply absent from the
    carry-forward map, not present with empty/null values."""
    metadata_path = tmp_path / "game-metadata.json"
    metadata_path.write_text(
        json.dumps({"shoal": {"pipeline_stage": PIPELINE_STAGE_AI_STUDIO}}),
        encoding="utf-8",
    )
    curated = _load_existing_curated_fields(metadata_path)
    assert "shoal" not in curated


def test_generate_game_metadata_carries_forward_existing_genre_and_tags() -> None:
    """A full regeneration must preserve real, previously curated
    genre/tags -- otherwise every deploy would silently wipe them,
    exactly like the pipeline_stage risk this pattern is copied from."""
    any_game = next(iter(GAME_PATHS))
    metadata = generate_game_metadata(
        existing_stages={},
        existing_curated={any_game: {"genre": "roguelike", "tags": ["turn-based"]}},
    )
    assert metadata[any_game]["genre"] == "roguelike"
    assert metadata[any_game]["tags"] == ["turn-based"]


def test_generate_game_metadata_no_genre_key_when_uncurated() -> None:
    """A game with no curated genre/tags gets no genre/tags key at all --
    never a fabricated empty placeholder."""
    metadata = generate_game_metadata(existing_stages={}, existing_curated={})
    for game_id in GAME_PATHS:
        assert "genre" not in metadata[game_id]
        assert "tags" not in metadata[game_id]
