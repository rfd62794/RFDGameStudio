"""Tests for repo_state.py."""

from pathlib import Path

import pytest

from studio_mcp.pipeline_audit.repo_state import (
    _extract_registry_games,
    read_repo_state,
)


def test_extract_registry_games_parses_current_format():
    sample = """
import type { GameConfig } from '../engine/types';
import dissonanceConfig from './dissonance/config';
import { slimeworldConfig } from './slimeworld/config';

export const GAME_REGISTRY: GameConfig[] = [
  dissonanceConfig,
  slimeworldConfig,
];
"""
    games = _extract_registry_games(sample)
    assert games == [
        {"id": "dissonance", "config_export": "dissonanceConfig"},
        {"id": "slimeworld", "config_export": "slimeworldConfig"},
    ]


def test_repo_state_reads_real_registry():
    state = read_repo_state()
    assert state["registry_path"].endswith("registry.ts")
    assert state["game_count"] > 0
    ids = {g["id"] for g in state["games"]}
    assert "dissonance" in ids
    assert "slimeworld" in ids
    assert "shoal" in ids


def test_repo_state_cross_references_metadata():
    state = read_repo_state()
    horse_racing = next(g for g in state["games"] if g["id"] == "horse_racing")
    assert horse_racing["pipeline_stage"] in {"ai_studio", "website_collection", "itch_published"}
    assert horse_racing["version"]


def test_repo_state_examples_is_a_list():
    state = read_repo_state()
    assert isinstance(state["examples"], list)
    assert "slimeworld" in state["examples"]


def test_repo_state_handles_missing_metadata(tmp_path: Path):
    registry = tmp_path / "registry.ts"
    metadata = tmp_path / "game-metadata.json"
    registry.write_text(
        "import a from './a/config';\nexport const GAME_REGISTRY = [a];",
        encoding="utf-8",
    )
    metadata.write_text("{}", encoding="utf-8")

    state = read_repo_state(
        registry_path=registry,
        metadata_path=metadata,
        examples_dir=tmp_path / "examples",
    )
    assert state["games"] == [{"id": "a", "config_export": "a", "pipeline_stage": "ai_studio"}]
