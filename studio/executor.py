"""executor.py — Wraps lupa. All lupa imports are contained here.

Rules:
- No other file imports lupa directly.
- Lua table objects never escape this module; call() always returns plain Python.
- RNG seed is set at Executor construction time.
"""

from __future__ import annotations

from typing import Any

try:
    from lupa import LuaRuntime
    _LUPA_AVAILABLE = True
except ImportError:
    _LUPA_AVAILABLE = False
    LuaRuntime = None  # type: ignore[assignment,misc]


class LuaError(Exception):
    """Raised on Lua runtime errors or missing functions."""


def _require_lupa() -> None:
    if not _LUPA_AVAILABLE:
        raise LuaError("lupa is required. Install with: pip install lupa")


def _is_lua_table(obj: Any) -> bool:
    """Version-agnostic duck-type check for lupa table proxies."""
    return (
        hasattr(obj, "items")
        and hasattr(obj, "keys")
        and "Table" in type(obj).__name__
    )


def _to_python(obj: Any) -> Any:
    """Recursively convert lupa table proxies to plain Python dicts/lists."""
    if not _is_lua_table(obj):
        return obj
    items = list(obj.items())
    if items and all(isinstance(k, int) for k, _ in items):
        keys = sorted(k for k, _ in items)
        if keys == list(range(1, len(keys) + 1)):
            return [_to_python(v) for _, v in sorted(items)]
    return {k: _to_python(v) for k, v in items}


class Executor:
    """Manages a Lua VM loaded with a game's logic.lua.

    The RNG is seeded at construction — tests always pass seed=42.
    """

    def __init__(self, lua_source: str, seed: int = 42) -> None:
        _require_lupa()
        self._lua = LuaRuntime(unpack_returned_tuples=True)
        self._lua.execute(f"math.randomseed({seed})")
        self._lua.execute(lua_source)

    def call(self, fn_name: str, *args: Any) -> Any:
        """Call a Lua function by name with positional args.

        Converts Python dicts to Lua tables automatically.
        Returns plain Python objects — no lupa table proxies leak out.
        Raises :class:`LuaError` on Lua runtime errors.
        Raises :class:`AttributeError` if fn_name does not exist in Lua globals.
        """
        fn = self._lua.globals()[fn_name]
        if fn is None:
            raise AttributeError(
                f"Lua function '{fn_name}' not found in logic.lua"
            )

        converted_args = [
            self._lua.table_from(a) if isinstance(a, (dict, list)) else a
            for a in args
        ]

        try:
            result = fn(*converted_args)
        except Exception as exc:
            raise LuaError(f"Lua error in '{fn_name}': {exc}") from exc

        return _to_python(result)

    def get_global(self, name: str) -> Any:
        """Read a Lua global value and return the Python equivalent."""
        return _to_python(self._lua.globals()[name])
