"""runtime.py — Public API for the RFDGameStudio Python runtime.

External code imports only from here:
    from studio.runtime import load_game, call, get_schema
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .executor import Executor, LuaError
from .loader import GameFiles, load_game_files
from .validator import ValidationError, validate_data


@dataclass
class GameSession:
    """A loaded, ready-to-use game instance."""

    game_id: str
    files: GameFiles
    executor: Executor


def load_game(game_id: str, seed: int = 42, games_dir: Path | None = None) -> GameSession:
    """Load a game by ID. Returns a ready :class:`GameSession`.

    Raises :class:`FileNotFoundError` if the game directory does not exist.
    Raises :class:`ValidationError` if data.yaml fails the studio contract.
    Raises :class:`LuaError` if logic.lua fails to parse.
    """
    files = load_game_files(game_id, games_dir=games_dir)
    validate_data(files.data)
    executor = Executor(files.logic, seed=seed, engine_source=files.engine_source)
    return GameSession(game_id=game_id, files=files, executor=executor)


def call(session: GameSession, fn_name: str, *args: Any) -> Any:
    """Call a Lua function on the session.

    Thin wrapper over session.executor.call().
    """
    return session.executor.call(fn_name, *args)


def get_schema(session: GameSession, entity: str) -> dict[str, Any]:
    """Return the field definitions for a named entity from data.yaml.

    If the entity has a ``fields`` sub-key (the standard schema pattern),
    returns that sub-dict so callers can work directly with field names.
    Otherwise returns the full entity dict.

    Example: ``get_schema(session, "horse")`` returns a dict whose keys are
    the horse's field names (id, name, stats, …).

    Raises :class:`KeyError` if the entity is not in data.yaml.
    """
    data = session.files.data
    if entity not in data:
        raise KeyError(
            f"Entity '{entity}' not found in data.yaml for game '{session.game_id}'"
        )
    entity_def = data[entity]
    if isinstance(entity_def, dict) and "fields" in entity_def:
        return entity_def["fields"]
    return entity_def
