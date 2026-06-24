"""loader.py — Reads and validates the three game files for a given game_id."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml


class LoaderError(Exception):
    """Raised when the three-file contract is violated during loading."""


def _games_root() -> Path:
    """Resolve the games/ directory relative to this file's package root."""
    return Path(__file__).parent.parent / "games"


def load_game_files(game_id: str, games_root: Path | None = None) -> dict[str, Any]:
    """Load the three game definition files for *game_id*.

    Returns a dict with keys ``data``, ``ui``, and ``lua``.
    - ``data``: parsed data.yaml as a dict
    - ``ui``:   parsed ui.yaml as a dict
    - ``lua``:  raw logic.lua source as a str

    Raises :class:`LoaderError` if any file is missing or YAML is malformed.
    """
    root = games_root or _games_root()
    game_dir = root / game_id

    if not game_dir.is_dir():
        raise LoaderError(f"Game directory not found: {game_dir}")

    required = {
        "data": game_dir / "data.yaml",
        "ui":   game_dir / "ui.yaml",
        "lua":  game_dir / "logic.lua",
    }

    for key, path in required.items():
        if not path.exists():
            raise LoaderError(
                f"Missing required file for game '{game_id}': {path.name}"
            )

    try:
        data = yaml.safe_load(required["data"].read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise LoaderError(f"Failed to parse data.yaml for '{game_id}': {exc}") from exc

    try:
        ui = yaml.safe_load(required["ui"].read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise LoaderError(f"Failed to parse ui.yaml for '{game_id}': {exc}") from exc

    lua = required["lua"].read_text(encoding="utf-8")

    return {"data": data, "ui": ui, "lua": lua}
