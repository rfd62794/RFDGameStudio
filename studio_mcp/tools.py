"""tools.py — MCP tool definitions for RFDStudioMCP.

Five tools exposed to Claude:
  studio_load_game   — load a game session, return session_id
  studio_call        — call a named Lua function on a session
  studio_get_schema  — return entity schema from data.yaml
  studio_get_systems — return the systems.yaml manifest
  studio_run_headless — run a Lua function N times, return aggregated results

All tools return dicts. Errors are returned as {"error": str, "tool": str}.
No exceptions are raised to the MCP client.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

from studio.executor import LuaError
from studio.runtime import load_game
from studio_mcp.session_store import create_session, get_session

_GAMES_DIR = Path(os.environ.get("GAMES_DIR", str(Path(__file__).parent.parent / "games")))


def studio_load_game(game_id: str, seed: int = 42) -> dict:
    """Load a game by ID. Returns session_id for use in subsequent calls.

    game_id: directory name under games/ (e.g. "horse_racing")
    seed: RNG seed for reproducible results (default 42)
    Returns: {"session_id": str, "game_id": str, "systems": list}
    """
    try:
        session = load_game(game_id, seed=seed, games_dir=_GAMES_DIR)
        session_id = create_session(session)
        systems_path = _GAMES_DIR / game_id / "systems.yaml"
        systems: list[str] = []
        if systems_path.exists():
            manifest = yaml.safe_load(systems_path.read_text(encoding="utf-8"))
            systems = [s["id"] for s in (manifest.get("systems") or [])]
        return {"session_id": session_id, "game_id": game_id, "systems": systems}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_load_game"}


def studio_call(session_id: str, fn_name: str, args: dict | None = None) -> dict:
    """Call a named Lua function on a loaded session.

    session_id: from studio_load_game
    fn_name: Lua function name (must exist in logic.lua)
    args: keyword arguments passed as the first positional argument (dict → Lua table)
    Returns: {"result": any, "fn_name": str}
    """
    try:
        session = get_session(session_id)
        if session is None:
            return {"error": f"Session '{session_id}' not found. Call studio_load_game first.", "tool": "studio_call"}
        if args:
            call_args = list(args.values())
        else:
            call_args = []
        result = session.executor.call(fn_name, *call_args)
        return {"result": result, "fn_name": fn_name}
    except (AttributeError, LuaError) as exc:
        return {"error": str(exc), "tool": "studio_call"}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_call"}


def studio_get_schema(session_id: str, entity: str) -> dict:
    """Return the schema definition for an entity from data.yaml.

    entity: entity name (e.g. "horse", "race", "bet")
    Returns: {"entity": str, "schema": dict}
    """
    try:
        session = get_session(session_id)
        if session is None:
            return {"error": f"Session '{session_id}' not found. Call studio_load_game first.", "tool": "studio_get_schema"}
        from studio.runtime import get_schema
        schema = get_schema(session, entity)
        return {"entity": entity, "schema": schema}
    except KeyError as exc:
        return {"error": str(exc), "tool": "studio_get_schema"}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_get_schema"}


def studio_get_systems(session_id: str) -> dict:
    """Return the systems.yaml manifest for the loaded game.

    Returns: {"systems": list, "entities": list}
    """
    try:
        session = get_session(session_id)
        if session is None:
            return {"error": f"Session '{session_id}' not found. Call studio_load_game first.", "tool": "studio_get_systems"}
        systems_path = _GAMES_DIR / session.game_id / "systems.yaml"
        if not systems_path.exists():
            return {"error": f"systems.yaml not found for game '{session.game_id}'", "tool": "studio_get_systems"}
        manifest = yaml.safe_load(systems_path.read_text(encoding="utf-8"))
        systems = manifest.get("systems") or []
        entities = list((manifest.get("entities") or {}).keys())
        return {"systems": systems, "entities": entities}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_get_systems"}


def studio_run_headless(
    session_id: str,
    fn_name: str,
    iterations: int,
    args: dict | None = None,
    seed_start: int = 1,
) -> dict:
    """Run a Lua function N times with incrementing seeds. Returns aggregated results.

    Used for balance analysis: win distribution, odds accuracy, stat frequency.
    iterations: max 10000
    Returns: {"results": list, "fn_name": str, "iterations": int, "summary": dict}
    """
    try:
        if iterations > 10000:
            return {
                "error": "iterations exceeds maximum of 10000. Use a batch approach or reduce scope.",
                "tool": "studio_run_headless",
            }
        session = get_session(session_id)
        if session is None:
            return {"error": f"Session '{session_id}' not found. Call studio_load_game first.", "tool": "studio_run_headless"}

        results: list[Any] = []
        errors = 0
        for i in range(iterations):
            seed = seed_start + i
            session.executor._lua.execute(f"math.randomseed({seed})")
            try:
                if args:
                    call_args = list(args.values())
                else:
                    call_args = []
                result = session.executor.call(fn_name, *call_args)
                results.append(result)
            except Exception:
                errors += 1
                results.append(None)

        summary: dict[str, Any] = {
            "total": iterations,
            "succeeded": iterations - errors,
            "failed": errors,
        }
        return {"results": results, "fn_name": fn_name, "iterations": iterations, "summary": summary}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_run_headless"}
