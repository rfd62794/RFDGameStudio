"""Load the games.yaml registry that maps game names to itch.io targets.

Registry shape::

    games:
      shoal:
        itchio_slug: user/shoal      # itch.io user/project
        channel: html5               # butler channel
        build_dir: ../ts/dist-shoal  # folder that gets pushed
        source_dir: ../ts/src/games/shoal   # optional: freshness check
        version_file: ../ts/src/games/shoal/VERSION  # optional: --userversion

Relative paths are resolved against the directory containing games.yaml, so a
registry can live inside the project it publishes without machine-specific
absolute paths.
"""

from __future__ import annotations

import os
from pathlib import Path

import yaml

CONFIG_ENV_VAR = "ITCH_PUBLISHER_CONFIG"
DEFAULT_CONFIG_NAME = "games.yaml"
PATH_KEYS = ("build_dir", "source_dir", "version_file")


def resolve_config_path(config_path: str | os.PathLike[str] | None = None) -> Path:
    """Return the registry path: explicit argument, then $ITCH_PUBLISHER_CONFIG,
    then ./games.yaml."""
    if config_path:
        return Path(config_path)
    env_path = os.environ.get(CONFIG_ENV_VAR)
    if env_path:
        return Path(env_path)
    return Path.cwd() / DEFAULT_CONFIG_NAME


def _resolve_entry_paths(entry: dict, base_dir: Path) -> dict:
    resolved = dict(entry)
    for key in PATH_KEYS:
        value = resolved.get(key)
        if value and not Path(value).is_absolute():
            resolved[key] = str((base_dir / value).resolve())
    return resolved


def load_games(config_path: str | os.PathLike[str] | None = None) -> dict[str, dict]:
    """Load every game entry, with relative paths resolved.

    Raises OSError if the file cannot be read, yaml.YAMLError if it is not
    valid YAML, and ValueError if ``games`` is not a mapping.
    """
    path = resolve_config_path(config_path)
    with open(path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}
    games = config.get("games") or {}
    if not isinstance(games, dict):
        raise ValueError(f"{path}: 'games' must be a mapping")
    base_dir = path.resolve().parent
    return {name: _resolve_entry_paths(entry, base_dir) for name, entry in games.items()}


def load_game_config(game_name: str, config_path: str | os.PathLike[str] | None = None) -> dict:
    """Return one game's entry. Raises KeyError if game_name is not configured."""
    games = load_games(config_path)
    if game_name not in games:
        raise KeyError(f"Game not found: {game_name}")
    return games[game_name]
