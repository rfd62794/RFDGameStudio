"""executor.py — Wraps lupa; exposes Lua function calls to the Python runtime."""

from __future__ import annotations

import time
from typing import Any

try:
    import lupa
    from lupa import LuaRuntime
    _LUPA_AVAILABLE = True
except ImportError:
    _LUPA_AVAILABLE = False


class ExecutorError(Exception):
    """Raised when a Lua execution error occurs."""


class LuaUnavailableError(ExecutorError):
    """Raised when lupa is not installed."""


def _require_lupa() -> None:
    if not _LUPA_AVAILABLE:
        raise LuaUnavailableError(
            "lupa is not installed. Run: pip install lupa"
        )


class LuaExecutor:
    """Manages a single Lua VM instance loaded with a game's logic.lua source.

    The runtime is responsible for seeding math.random *before* any game
    function call.  :meth:`seed_rng` must be called before the first
    :meth:`call`.
    """

    def __init__(self, lua_source: str) -> None:
        _require_lupa()
        self._lua: LuaRuntime = lupa.LuaRuntime(unpack_returned_tuples=True)
        self._lua.execute(lua_source)
        self._rng_seeded = False

    def seed_rng(self, seed: int | None = None) -> None:
        """Seed Lua's math.random.  Uses current time (ns) if *seed* is None."""
        s = seed if seed is not None else time.time_ns() % (2 ** 31)
        self._lua.execute(f"math.randomseed({s})")
        self._rng_seeded = True

    def call(self, fn_name: str, *args: Any) -> Any:
        """Call a top-level Lua function by name with positional *args*.

        Arguments are passed as Python objects; lupa handles type conversion
        for booleans, numbers, and strings.  Lua tables are returned as
        lupa table proxies — callers should use :func:`lua_to_python` to
        convert them to plain Python dicts/lists.

        Raises :class:`ExecutorError` on Lua runtime errors.
        """
        if not self._rng_seeded:
            self.seed_rng()

        fn = self._lua.globals()[fn_name]
        if fn is None:
            raise ExecutorError(f"Lua function '{fn_name}' not found in logic.lua")

        try:
            return fn(*args)
        except Exception as exc:
            raise ExecutorError(
                f"Lua error in '{fn_name}': {exc}"
            ) from exc

    def eval(self, expression: str) -> Any:
        """Evaluate a Lua expression string and return the result.

        Intended for debugging and testing only.
        """
        try:
            return self._lua.eval(expression)
        except Exception as exc:
            raise ExecutorError(f"Lua eval error: {exc}") from exc


def _is_lua_table(obj: Any) -> bool:
    """Return True if *obj* is a lupa Lua table proxy (version-agnostic)."""
    if not _LUPA_AVAILABLE:
        return False
    # Duck-type check: lupa table proxies expose .items() and their type name
    # contains 'Table'. Avoids depending on the private lupa._lupa submodule
    # which moved between lupa versions.
    return (
        hasattr(obj, "items")
        and hasattr(obj, "keys")
        and "Table" in type(obj).__name__
    )


def lua_to_python(obj: Any) -> Any:
    """Recursively convert a lupa table proxy to a plain Python dict or list.

    Lua arrays (integer keys 1..N) become lists.
    Lua dicts (mixed/string keys) become dicts.
    Scalars pass through unchanged.
    """
    if not _is_lua_table(obj):
        return obj

    # Determine if it's array-like (keys are 1..N with no gaps)
    items = list(obj.items())
    if items and all(isinstance(k, int) for k, _ in items):
        keys = sorted(k for k, _ in items)
        if keys == list(range(1, len(keys) + 1)):
            return [lua_to_python(v) for _, v in sorted(items)]
    return {k: lua_to_python(v) for k, v in items}
