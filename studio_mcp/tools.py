"""tools.py — MCP tool definitions for RFDStudioMCP.

Ten tools exposed to Claude:
  studio_load_game      — load a game session, return session_id
  studio_call           — call a named Lua function on a session
  studio_get_schema     — return entity schema from data.yaml
  studio_get_systems    — return the systems.yaml manifest
  studio_run_headless   — run a Lua function N times, return aggregated results
  studio_validate_game  — validate all four game files
  studio_run_tests      — run pytest and return structured results
  studio_balance_report — run N race simulations, return win/place/show distribution
  studio_get_state      — inspect GAME_STATE after init_game (slither_rogue)
  studio_screenshot     — render PyGame frame and save as PNG

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


def studio_call(session_id: str, fn_name: str, args: list | dict | None = None) -> dict:
    """Call a named Lua function on a loaded session.

    session_id: from studio_load_game
    fn_name: Lua function name (must exist in logic.lua)
    args:
      list  → elements spread as positional Lua arguments (preferred)
      dict  → values spread as positional arguments in insertion order
      None  → function called with no arguments
    Returns: {"result": any, "fn_name": str}
    """
    try:
        session = get_session(session_id)
        if session is None:
            return {"error": f"Session '{session_id}' not found.", "tool": "studio_call"}

        if isinstance(args, list):
            call_args = args
        elif isinstance(args, dict):
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
    args: list | dict | None = None,
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
            return {"error": f"Session '{session_id}' not found.", "tool": "studio_run_headless"}

        results: list[Any] = []
        errors = 0
        for i in range(iterations):
            seed = seed_start + i
            session.executor._lua.execute(f"math.randomseed({seed})")
            try:
                if isinstance(args, list):
                    call_args = args
                elif isinstance(args, dict):
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


def studio_validate_game(game_id: str) -> dict:
    """Validate all four game files for a game ID.

    Checks: files exist, yaml parses, Lua loads, declared functions
    present in Lua, layout_tree declared in ui.yaml.

    Returns: {"valid": bool, "game_id": str, "issues": [{severity, message, file}]}
    """
    import traceback
    issues: list[dict] = []
    game_dir = _GAMES_DIR / game_id

    # ── File existence ──────────────────────────────────────────────────────
    required_files = ['data.yaml', 'logic.lua', 'ui.yaml', 'systems.yaml']
    for fname in required_files:
        if not (game_dir / fname).exists():
            issues.append({
                'severity': 'error',
                'message': f'{fname} not found',
                'file': fname,
            })

    if any(i['severity'] == 'error' for i in issues):
        return {'valid': False, 'game_id': game_id, 'issues': issues}

    # ── YAML parse ─────────────────────────────────────────────────────────
    data = None
    try:
        data = yaml.safe_load((game_dir / 'data.yaml').read_text(encoding='utf-8'))
    except Exception as e:
        issues.append({'severity': 'error', 'message': f'Parse error: {e}', 'file': 'data.yaml'})

    try:
        ui = yaml.safe_load((game_dir / 'ui.yaml').read_text(encoding='utf-8'))
        if not isinstance(ui, dict) or 'layout_tree' not in ui:
            issues.append({
                'severity': 'warning',
                'message': 'layout_tree missing — ui.yaml interpreter cannot resolve bounds',
                'file': 'ui.yaml',
            })
    except Exception as e:
        issues.append({'severity': 'error', 'message': f'Parse error: {e}', 'file': 'ui.yaml'})

    try:
        systems_raw = yaml.safe_load(
            (game_dir / 'systems.yaml').read_text(encoding='utf-8')
        ) or {}
    except Exception as e:
        issues.append({'severity': 'error', 'message': f'Parse error: {e}', 'file': 'systems.yaml'})
        systems_raw = {}

    # ── Lua load ───────────────────────────────────────────────────────────
    session = None
    try:
        session = load_game(game_id, seed=42, games_dir=_GAMES_DIR)
    except Exception as e:
        issues.append({
            'severity': 'error',
            'message': f'Lua load failed: {e}',
            'file': 'logic.lua',
        })

    # ── Declared functions exist in Lua ────────────────────────────────────
    if session:
        declared_fns: list[str] = []
        for system in (systems_raw.get('systems') or []):
            declared_fns.extend(system.get('functions') or [])

        lua_globals = session.executor._lua.globals()
        for fn_name in declared_fns:
            try:
                val = getattr(lua_globals, fn_name, None)
                if val is None:
                    issues.append({
                        'severity': 'warning',
                        'message': f'Function {fn_name!r} declared in systems.yaml but not found in Lua',
                        'file': 'logic.lua',
                    })
            except Exception:
                pass  # lupa proxy quirk — skip if attribute access fails

    valid = not any(i['severity'] == 'error' for i in issues)
    return {'valid': valid, 'game_id': game_id, 'issues': issues}


def studio_run_tests(
    game_id: str | None = None,
    test_filter: str | None = None,
) -> dict:
    """Run the Python test suite and return structured results.

    game_id: if provided, runs only tests/test_{game_id}.py
    test_filter: pytest -k expression (e.g. 'horse_racing and bet')
    Returns: {"passed": int, "failed": int, "skipped": int,
              "floor_met": bool, "output": str, "return_code": int}
    """
    import re
    import subprocess

    repo_root = Path(__file__).parent.parent

    cmd = ['uv', 'run', 'pytest', '-v', '--tb=short', '--no-header', '-q']
    if game_id:
        target = f'tests/test_{game_id}.py'
        cmd.append(target)
    else:
        cmd.append('tests/')

    if test_filter:
        cmd.extend(['-k', test_filter])

    try:
        proc = subprocess.run(
            cmd,
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            timeout=180,
        )
        output = (proc.stdout + proc.stderr).strip()

        passed = failed = skipped = 0
        for line in output.split('\n'):
            if m := re.search(r'(\d+) passed', line):
                passed = int(m.group(1))
            if m := re.search(r'(\d+) failed', line):
                failed = int(m.group(1))
            if m := re.search(r'(\d+) skipped', line):
                skipped = int(m.group(1))

        return {
            'passed':      passed,
            'failed':      failed,
            'skipped':     skipped,
            'floor_met':   failed == 0,
            'output':      output[-4000:],   # last 4000 chars
            'return_code': proc.returncode,
        }
    except subprocess.TimeoutExpired:
        return {'error': 'Test run timed out (180s)', 'tool': 'studio_run_tests'}
    except Exception as exc:
        return {'error': str(exc), 'tool': 'studio_run_tests'}


def studio_balance_report(
    game_id: str,
    iterations: int = 100,
) -> dict:
    """Run N race simulations and return win/place/show rate distribution.

    Loads starter_horses[0] from data.yaml as the player horse.
    Each iteration: create_race → simulate_race → record player rank.

    iterations: 1–500 (larger sets take ~2s per 100)
    Returns: {"win_rate", "place_rate", "show_rate",
              "rank_distribution", "avg_finish_time", "errors"}
    """
    if iterations > 500:
        return {'error': 'Max 500 iterations for balance_report.', 'tool': 'studio_balance_report'}

    try:
        session = load_game(game_id, seed=42, games_dir=_GAMES_DIR)
        data = session.files.data or {}
        starter_horses = list(data.get('starter_horses', []))
        if not starter_horses:
            return {'error': 'No starter_horses in data.yaml.', 'tool': 'studio_balance_report'}

        player_horse = dict(starter_horses[0])
        rank_counts: dict[int, int] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
        finish_times: list[float] = []
        errors = 0

        for i in range(iterations):
            sess_i = load_game(game_id, seed=42 + i, games_dir=_GAMES_DIR)
            try:
                race_result = sess_i.executor.call('create_race', player_horse, data)
                if race_result is None:
                    errors += 1
                    continue

                # create_race returns (race, error) — handle both tuple and single
                if isinstance(race_result, (list, tuple)) and len(race_result) == 2:
                    race_obj, err = race_result
                else:
                    race_obj = race_result

                if not race_obj:
                    errors += 1
                    continue

                race_dict = dict(race_obj)
                parts = list(race_dict.get('participants', []))
                config = {
                    'distance':   race_dict.get('distance', 1200),
                    'delta_time': 0.2,
                }
                results = sess_i.executor.call('simulate_race', parts, config)
                if not results:
                    errors += 1
                    continue

                result_list = [dict(r) for r in results]
                player_id = player_horse.get('id', '')
                player_result = next(
                    (r for r in result_list if r.get('horse_id') == player_id), None
                )
                if player_result:
                    rank = int(player_result.get('rank', 6))
                    rank_counts[min(rank, 6)] = rank_counts.get(min(rank, 6), 0) + 1
                    ft = player_result.get('finish_time', 0)
                    if ft:
                        finish_times.append(float(ft))
                else:
                    errors += 1

            except Exception:
                errors += 1

        total = iterations - errors
        win_rate   = round(rank_counts[1] / max(1, total), 3)
        place_rate = round((rank_counts[1] + rank_counts[2]) / max(1, total), 3)
        show_rate  = round((rank_counts[1] + rank_counts[2] + rank_counts[3]) / max(1, total), 3)
        avg_ft     = round(sum(finish_times) / max(1, len(finish_times)), 2)

        return {
            'game_id':           game_id,
            'horse':             player_horse.get('name', 'Unknown'),
            'iterations':        iterations,
            'errors':            errors,
            'win_rate':          win_rate,
            'place_rate':        place_rate,
            'show_rate':         show_rate,
            'rank_distribution': rank_counts,
            'avg_finish_time':   avg_ft,
            'field_size':        len(parts) if 'parts' in dir() else 6,
        }
    except Exception as exc:
        return {'error': str(exc), 'tool': 'studio_balance_report'}


def studio_get_state(session_id: str) -> dict:
    """Return a summary of GAME_STATE for the loaded session.

    Only meaningful for games that use GAME_STATE (slither_rogue).
    Call studio_call(session_id, 'init_game', config) first.

    Returns: {"state_summary": dict, "session_id": str}
    """
    try:
        session = get_session(session_id)
        if session is None:
            return {"error": f"Session '{session_id}' not found.", "tool": "studio_get_state"}

        summary = session.executor.call('get_state_summary')
        if summary is None:
            return {
                "error": "GAME_STATE is nil. Call init_game first.",
                "session_id": session_id,
                "tool": "studio_get_state",
            }
        return {"state_summary": dict(summary), "session_id": session_id}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_get_state"}


def studio_screenshot(
    game_id: str = 'horse_racing',
    tab: str = 'stable',
    width: int = 1024,
    height: int = 768,
) -> dict:
    """Render one frame of the PyGame renderer and save as PNG.

    Uses SDL dummy driver — no display required.
    Saves to screenshots/ in repo root.

    Returns: {"path": str, "tab": str, "width": int, "height": int}
    """
    import os
    import time as time_mod

    os.environ['SDL_VIDEODRIVER'] = 'dummy'
    os.environ['SDL_AUDIODRIVER'] = 'dummy'

    try:
        import pygame

        repo_root = Path(__file__).parent.parent
        screenshot_dir = repo_root / 'screenshots'
        screenshot_dir.mkdir(exist_ok=True)

        if game_id == 'horse_racing':
            from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
            renderer = HorseRacingRenderer(width=width, height=height)
        else:
            return {
                'error': f'No PyGame renderer registered for {game_id!r}.',
                'tool': 'studio_screenshot',
            }

        renderer.state.active_tab = tab

        from renderers.pygame.colors import COLORS as PG_COLORS
        renderer.screen.fill(PG_COLORS['bg'])
        renderer.render()

        ts = int(time_mod.time())
        fname = f'{game_id}_{tab}_{ts}.png'
        fpath = screenshot_dir / fname
        pygame.image.save(renderer.screen, str(fpath))
        pygame.quit()

        return {
            'path':   str(fpath),
            'tab':    tab,
            'width':  width,
            'height': height,
        }
    except Exception as exc:
        return {'error': str(exc), 'tool': 'studio_screenshot'}
