"""test_publish_validator.py — Tests for studio.publish_validator, the gate
scripts/publish.py runs before any itch.io push.

The validator checks a game_id's entry in game-metadata.json against the
shape the post-publish write-back (studio_mcp.publishing.mark_itch_published)
requires: the entry must already be a mapping carrying a real
pipeline_stage. game-metadata.json itself is gitignored and regenerated,
so every test here writes a synthetic copy under tmp_path -- never the
real file.
"""
from __future__ import annotations

import json

import pytest

import studio.publish_validator as publish_validator
from studio.publish_validator import (
    _DEFAULT_METADATA_PATH,
    _VALID_PIPELINE_STAGES,
    PublishValidationError,
    validate_publish_metadata,
)
from studio_mcp.game_metadata import (
    PIPELINE_STAGE_AI_STUDIO,
    PIPELINE_STAGE_ITCH_PUBLISHED,
    PIPELINE_STAGE_WEBSITE_COLLECTION,
    _METADATA_PATH,
)


def _write_metadata(path, payload) -> None:
    path.write_text(json.dumps(payload), encoding="utf-8")


# ---------------------------------------------------------------------------
# Success path
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "stage",
    [PIPELINE_STAGE_AI_STUDIO, PIPELINE_STAGE_WEBSITE_COLLECTION, PIPELINE_STAGE_ITCH_PUBLISHED],
)
def test_validate_accepts_each_real_pipeline_stage(tmp_path, stage) -> None:
    """All three real enum values must pass -- and an entry carrying ONLY
    pipeline_stage is enough. The write-back only needs the entry to be a
    mapping with a valid stage; created/version/tracked are regenerated
    elsewhere and are not part of this contract."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"demo": {"pipeline_stage": stage}})
    assert validate_publish_metadata("demo", metadata_path=metadata) is None


def test_validate_accepts_full_generated_entry(tmp_path) -> None:
    """An entry in the real generate_game_metadata() shape must pass."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"demo": {
        "created": "2026-01-01",
        "last_updated": "2026-08-15",
        "version": "1.2.0",
        "tracked": True,
        "pipeline_stage": PIPELINE_STAGE_WEBSITE_COLLECTION,
        "deployed_version": "1.2.0",
    }})
    assert validate_publish_metadata("demo", metadata_path=metadata) is None


def test_validate_does_not_modify_the_file(tmp_path) -> None:
    """This is a validator feeding a publish gate, not a mutator -- a
    passing check must leave the file byte-identical."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"demo": {"pipeline_stage": PIPELINE_STAGE_ITCH_PUBLISHED}})
    before = metadata.read_bytes()
    validate_publish_metadata("demo", metadata_path=metadata)
    assert metadata.read_bytes() == before


# ---------------------------------------------------------------------------
# File-level failures
# ---------------------------------------------------------------------------

def test_validate_missing_file_raises(tmp_path) -> None:
    """A game-metadata.json that does not exist at all is a hard failure,
    not a silent pass -- scripts/publish.py must stop before butler runs."""
    with pytest.raises(PublishValidationError, match="Missing file"):
        validate_publish_metadata("demo", metadata_path=tmp_path / "absent.json")


def test_validate_unreadable_path_raises(tmp_path) -> None:
    """A path that exists but cannot be read as a file (a directory hits
    this branch on every platform) is a PublishValidationError, not a raw
    OSError leaking to the caller."""
    with pytest.raises(PublishValidationError, match="Cannot read"):
        validate_publish_metadata("demo", metadata_path=tmp_path)


@pytest.mark.parametrize("raw", ["{not json", ""])
def test_validate_invalid_json_raises(tmp_path, raw) -> None:
    """Malformed JSON -- including a truncated write or an empty file --
    is a named validation failure, not a json.JSONDecodeError."""
    metadata = tmp_path / "game-metadata.json"
    metadata.write_text(raw, encoding="utf-8")
    with pytest.raises(PublishValidationError, match="not valid JSON"):
        validate_publish_metadata("demo", metadata_path=metadata)


# ---------------------------------------------------------------------------
# Shape failures
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("payload", [["demo"], "demo", 42, None])
def test_validate_top_level_not_object_raises(tmp_path, payload) -> None:
    """game-metadata.json must be a JSON object at the top level; an
    array, scalar, or null fails even though it parsed successfully."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, payload)
    with pytest.raises(PublishValidationError, match="must be a JSON object"):
        validate_publish_metadata("demo", metadata_path=metadata)


def test_validate_missing_game_id_raises(tmp_path) -> None:
    """A game_id absent from the file was never written by
    generate_game_metadata() and cannot be publish-tracked."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"other_game": {"pipeline_stage": PIPELINE_STAGE_AI_STUDIO}})
    with pytest.raises(PublishValidationError, match="Missing entry"):
        validate_publish_metadata("demo", metadata_path=metadata)


@pytest.mark.parametrize("entry", ["ai_studio", 42, None, ["ai_studio"]])
def test_validate_entry_not_object_raises(tmp_path, entry) -> None:
    """The entry itself must be a mapping -- the write-back does
    data[game_id]["pipeline_stage"] = ..., which requires a dict. Note the
    string case: "ai_studio" is a *valid stage value* but the wrong shape,
    and the shape check must reject it before the stage check sees it."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"demo": entry})
    with pytest.raises(PublishValidationError, match="entry must be a JSON object"):
        validate_publish_metadata("demo", metadata_path=metadata)


def test_validate_missing_pipeline_stage_raises(tmp_path) -> None:
    """A mapping entry without pipeline_stage was never produced by
    generate_game_metadata() -- not a real pipeline-tracked entry even
    though the write-back's dict assignment would not crash on it."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"demo": {"version": "1.0.0", "tracked": True}})
    with pytest.raises(PublishValidationError, match="Missing field"):
        validate_publish_metadata("demo", metadata_path=metadata)


@pytest.mark.parametrize("stage", ["beta", "published", "", None, 0])
def test_validate_invalid_pipeline_stage_raises(tmp_path, stage) -> None:
    """Only the three real enum values pass; anything else -- including
    near-misses like "published" -- is rejected."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"demo": {"pipeline_stage": stage}})
    with pytest.raises(PublishValidationError, match="must be one of"):
        validate_publish_metadata("demo", metadata_path=metadata)


# ---------------------------------------------------------------------------
# Contract alignment with the write-back side
# ---------------------------------------------------------------------------

def test_valid_stages_mirror_game_metadata_enum() -> None:
    """publish_validator's stage tuple is documented as a mirror of
    studio_mcp.game_metadata's PIPELINE_STAGE_* constants. If a fourth
    stage is ever added there, this validator must accept it too -- a
    stale copy must fail loudly here, not silently reject real metadata."""
    assert set(_VALID_PIPELINE_STAGES) == {
        PIPELINE_STAGE_AI_STUDIO,
        PIPELINE_STAGE_WEBSITE_COLLECTION,
        PIPELINE_STAGE_ITCH_PUBLISHED,
    }
    assert len(_VALID_PIPELINE_STAGES) == 3


def test_default_metadata_path_is_the_real_write_back_file() -> None:
    """When scripts/publish.py calls validate_publish_metadata(game_id)
    with no path, the validator must gate the exact file
    studio_mcp.game_metadata's write-back functions update -- a drift
    between the two paths would validate a file nobody writes."""
    assert _DEFAULT_METADATA_PATH == _METADATA_PATH


def test_metadata_path_none_falls_back_to_default(tmp_path, monkeypatch) -> None:
    """The `metadata_path or _DEFAULT_METADATA_PATH` branch: omitting the
    argument consults the default location, not a missing-file error."""
    metadata = tmp_path / "game-metadata.json"
    _write_metadata(metadata, {"demo": {"pipeline_stage": PIPELINE_STAGE_AI_STUDIO}})
    monkeypatch.setattr(publish_validator, "_DEFAULT_METADATA_PATH", metadata)
    assert validate_publish_metadata("demo") is None
