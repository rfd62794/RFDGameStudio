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
    executor = Executor(files.logic, seed=seed)
    return GameSession(game_id=game_id, files=files, executor=executor)


def call(session: GameSession, fn_name: str, *args: Any) -> Any:
    """Call a Lua function on the session.

    Thin wrapper over session.executor.call().
    """
    return session.executor.call(fn_name, *args)


def get_schema(session: GameSession, entity: str) -> dict[str, Any]:
    """Return the schema dict for a named entity from data.yaml.

    Example: ``get_schema(session, "horse")`` returns the horse field definitions.
    Raises :class:`KeyError` if the entity is not in data.yaml.
    """
    data = session.files.data
    if entity not in data:
        raise KeyError(
            f"Entity '{entity}' not found in data.yaml for game '{session.game_id}'"
        )
    return data[entity]
