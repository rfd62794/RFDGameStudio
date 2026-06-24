"""runtime.py — GameSession, load_game(), call(), get_schema().

Implements the runtime bridge contract from SDD §4.1.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .executor import LuaExecutor, lua_to_python
from .loader import LoaderError, load_game_files
from .validator import ValidationError, validate_data


class RuntimeError(Exception):
    """Raised on any runtime bridge error (load failures, Lua errors, etc.)."""


@dataclass
class GameSession:
    """Opaque handle returned by :func:`load_game`.

    Attributes
    ----------
    game_id:
        Identifier matching the games/{game_id}/ directory.
    data:
        Parsed data.yaml as a plain Python dict.
    ui:
        Parsed ui.yaml as a plain Python dict.
    executor:
        The :class:`~studio.executor.LuaExecutor` bound to this session's Lua VM.
    """

    game_id: str
    data: dict[str, Any]
    ui: dict[str, Any]
    executor: LuaExecutor
    _metadata: dict[str, Any] = field(default_factory=dict, repr=False)


def load_game(
    game_id: str,
    *,
    games_root: Path | None = None,
    rng_seed: int | None = None,
) -> GameSession:
    """Read, validate, and initialize a game.

    Steps:
    1. Load data.yaml, ui.yaml, logic.lua from ``games/{game_id}/``.
    2. Validate data.yaml against the studio schema contract.
    3. Initialise a Lua VM with logic.lua.
    4. Seed the RNG.

    Returns a :class:`GameSession` on success.
    Raises :class:`RuntimeError` on any failure.
    """
    try:
        files = load_game_files(game_id, games_root=games_root)
    except LoaderError as exc:
        raise RuntimeError(str(exc)) from exc

    try:
        validate_data(files["data"], game_id=game_id)
    except ValidationError as exc:
        raise RuntimeError(str(exc)) from exc

    try:
        executor = LuaExecutor(files["lua"])
        executor.seed_rng(rng_seed)
    except Exception as exc:
        raise RuntimeError(f"Failed to initialise Lua VM for '{game_id}': {exc}") from exc

    return GameSession(
        game_id=game_id,
        data=files["data"],
        ui=files["ui"],
        executor=executor,
    )


def call(session: GameSession, fn: str, **kwargs: Any) -> Any:
    """Call a Lua function in *session* by name with keyword arguments.

    Keyword arguments are passed as a Lua table (first argument) when present,
    otherwise the function is called with no arguments.

    Returns the Lua return value converted to a plain Python object via
    :func:`~studio.executor.lua_to_python`.

    Raises :class:`RuntimeError` on Lua errors.
    """
    from .executor import ExecutorError

    try:
        if kwargs:
            # Build a Lua table from kwargs and pass it as the first argument
            lua = session.executor._lua
            table = lua.table_from(kwargs)
            result = session.executor.call(fn, table)
        else:
            result = session.executor.call(fn)
        return lua_to_python(result)
    except ExecutorError as exc:
        raise RuntimeError(str(exc)) from exc


def call_with_args(session: GameSession, fn: str, *args: Any) -> Any:
    """Call a Lua function with positional Python arguments.

    Useful when the Lua function takes multiple separate parameters rather
    than a single table.  Return value is converted via
    :func:`~studio.executor.lua_to_python`.

    Raises :class:`RuntimeError` on Lua errors.
    """
    from .executor import ExecutorError

    try:
        result = session.executor.call(fn, *args)
        return lua_to_python(result)
    except ExecutorError as exc:
        raise RuntimeError(str(exc)) from exc


def get_schema(session: GameSession, entity: str) -> dict[str, Any]:
    """Return the entity schema dict from data.yaml for *entity*.

    Raises :class:`RuntimeError` if the entity is not defined.
    """
    schemas = session.data.get("schemas", {})
    if entity not in schemas:
        raise RuntimeError(
            f"Entity '{entity}' not found in schemas for game '{session.game_id}'. "
            f"Available: {sorted(schemas.keys())}"
        )
    return schemas[entity]
