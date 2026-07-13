"""tools.py — MCP tool definitions for RFDStudioMCP.

Fifteen tools exposed to Claude:
  studio_load_game           — load a game session, return session_id
  studio_call                — call a named Lua function on a session
  studio_get_schema          — return entity schema from data.yaml
  studio_get_systems         — return the systems.yaml manifest
  studio_run_headless        — run a Lua function N times, return aggregated results
  studio_validate_game       — validate all four game files
  studio_run_tests           — run pytest and return structured results
  studio_balance_report      — run N race simulations, return win/place/show distribution
  studio_get_state           — inspect GAME_STATE after init_game (slither_rogue)
  studio_screenshot          — render PyGame frame and save as PNG
  studio_build               — run vite build and return structured output
  studio_write_arcade_index  — write the _index.md for the arcade bundle in the site repo
  studio_write_arcade_page   — write a child game page under the arcade bundle
  studio_deploy_arcade       — copy dist/ to site repo static, then hugo build + SFTP deploy
  studio_process_intake      — hash and version dropped AI-Studio zip files
  studio_promote_to_examples — extract, build, and deploy an intake concept to the arcade
  studio_generate_registry_entry — create config.ts + registry entry for a new external-tier game

All tools return dicts. Errors are returned as {"error": str, "tool": str}.
No exceptions are raised to the MCP client.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import time
import zipfile
from pathlib import Path
from typing import Any

import yaml

from studio.executor import LuaError
from studio.runtime import load_game
from studio_mcp.game_metadata import write_game_metadata
from studio_mcp.intake import _game_id_from_slug, load_manifest, process_intake
from studio_mcp.session_store import create_session, get_session
from studio_mcp.verify import verify_arcade_deploy

_GAMES_DIR = Path(os.environ.get("GAMES_DIR", str(Path(__file__).parent.parent / "games")))

_SITE_REPO_PATH = Path(os.environ.get("SITE_REPO_PATH", r"C:\Github\RFD_IT_Services_Site"))


def _to_lua_table(lua_runtime, obj):
    """
    Recursively convert Python dicts/lists to native lupa Lua tables.

    Uses manual index assignment rather than table_from() to guarantee
    deep conversion at every level of nesting. table_from() does not
    recursively convert nested Python objects — assigning converted
    values one-by-one into a Lua table forces full conversion at every
    level of the object graph.

    Python dicts  → Lua hash tables  (pairs-compatible, string keys)
    Python lists  → Lua sequence tables (ipairs-compatible, 1-based)
    Python bools  → Lua booleans (checked before int — bool subclasses int)
    Python scalars → pass through (lupa converts numbers and strings)
    """
    if isinstance(obj, dict):
        tbl = lua_runtime.eval("{}")
        for k, v in obj.items():
            tbl[k] = _to_lua_table(lua_runtime, v)
        return tbl
    elif isinstance(obj, (list, tuple)):
        tbl = lua_runtime.eval("{}")
        for i, v in enumerate(obj, 1):    # 1-based — Lua convention
            tbl[i] = _to_lua_table(lua_runtime, v)
        return tbl
    elif isinstance(obj, bool):
        return obj                         # must check before int (bool is int subclass)
    else:
        return obj


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
    uv_path = os.environ.get('UV_PATH', r'C:\Users\cheat\.local\bin\uv.exe')
    cmd = [uv_path, 'run', 'pytest', '-v', '--tb=short', '--no-header', '-q']
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
                # Pass only scalars — Lua builds all tables internally.
                # Avoids Python→Lua table conversion entirely.
                rank = sess_i.executor.call(
                    'run_balance_test',
                    float(player_horse.get('speed', 50)),
                    float(player_horse.get('stamina', 50)),
                    float(player_horse.get('acceleration', 50)),
                    float(player_horse.get('temperament', 70)),
                )
                if rank is None:
                    errors += 1
                    continue
                rank_int = int(rank)
                rank_counts[min(rank_int, 6)] = rank_counts.get(min(rank_int, 6), 0) + 1
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


def studio_build() -> dict:
    """Run vite build and return structured output.

    Builds `ts/dist/`.  `RFDArcadeServe` now reads from `local-arcade-preview/`,
    so the build must also be copied there (e.g. `robocopy /PURGE` or
    `studio_deploy_arcade`) before the service picks it up.

    Returns: {"success": bool, "output": str, "duration_ms": int}
    """
    import subprocess
    import time

    repo_root = Path(__file__).parent.parent
    ts_dir    = repo_root / 'ts'

    start = time.time()
    try:
        write_game_metadata()
    except Exception as exc:
        return {'error': f'game metadata generation failed: {exc}', 'tool': 'studio_build'}

    try:
        proc = subprocess.run(
            'npx vite build',
            cwd=str(ts_dir),
            capture_output=True,
            text=True,
            timeout=120,
            shell=True,        # required — npx is a .cmd file on Windows
        )
        duration_ms = int((time.time() - start) * 1000)
        output = (proc.stdout + proc.stderr).strip()
        return {
            'success':     proc.returncode == 0,
            'output':      output[-3000:],
            'duration_ms': duration_ms,
            'return_code': proc.returncode,
        }
    except subprocess.TimeoutExpired:
        return {'error': 'Build timed out (120s)', 'tool': 'studio_build'}
    except Exception as exc:
        return {'error': str(exc), 'tool': 'studio_build'}


# ── ARCADE PUBLISHING TOOLS ─────────────────────────────────────────────────

_KNOWN_GAME_IDS = {"horse_racing", "slither_rogue", "mutant_battle_ball", "slime_coin"}


def studio_write_arcade_index(title: str, description: str) -> dict:
    """Write content/games/rfdgamestudio/_index.md in the site repo.

    Bundle index page — no relation to SECTION_SCHEMAS['games'], which
    is a leaf-page schema. Only title and description required, matching
    the existing top-level content/games/_index.md pattern.

    Returns: {"path": str}
    """
    try:
        bundle_dir = _SITE_REPO_PATH / "content" / "games" / "rfdgamestudio"
        bundle_dir.mkdir(parents=True, exist_ok=True)
        index_path = bundle_dir / "_index.md"
        content = f"---\ntitle: \"{title}\"\ndescription: \"{description}\"\n---\n"
        index_path.write_text(content, encoding="utf-8")
        return {"path": str(index_path)}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_write_arcade_index"}


def studio_write_arcade_page(
    game_id: str,
    slug: str,
    title: str,
    demo_link: str,
    engine: str | None = None,
    controls_hint: str | None = None,
) -> dict:
    """Write one child page under content/games/rfdgamestudio/ in the site repo.

    game_id must exist in the TS GAME_REGISTRY — checked against the known
    set: horse_racing, slither_rogue, mutant_battle_ball, slime_coin.
    Writing a page for an unregistered game_id is a hard error.

    demo_link renders via the site's existing game-embed.html partial.

    Returns: {"path": str}
    """
    if game_id not in _KNOWN_GAME_IDS:
        return {
            "error": f"Unknown game_id: {game_id!r}. Must be one of {sorted(_KNOWN_GAME_IDS)}.",
            "tool": "studio_write_arcade_page",
        }
    try:
        bundle_dir = _SITE_REPO_PATH / "content" / "games" / "rfdgamestudio"
        bundle_dir.mkdir(parents=True, exist_ok=True)
        page_path = bundle_dir / f"{slug}.md"

        fm_lines = [
            "---",
            f'title: "{title}"',
            f'demo_link: "{demo_link}"',
        ]
        if engine:
            fm_lines.append(f'engine: "{engine}"')
        if controls_hint:
            fm_lines.append(f'controls_hint: "{controls_hint}"')
        fm_lines.append("---")
        page_path.write_text("\n".join(fm_lines) + "\n", encoding="utf-8")

        return {"path": str(page_path)}
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_write_arcade_page"}


_EXAMPLE_DEMOS = ["brewfield", "ledger", "trinity-siege", "slimebreeder", "corpworld"]
# folder name → deployed static subpath (gameId convention uses underscores)
_DEMO_STATIC_NAME = {
    "brewfield": "brewfield",
    "ledger": "ledger",
    "trinity-siege": "trinity_siege",
    "slimebreeder": "slimebreeder",
    "corpworld": "corpworld",
}

# demo slug → source directory (allows demos outside the examples/ tree)
_DEMO_SOURCE_PATHS: dict[str, Path] = {
    "brewfield": Path(__file__).parent.parent / "examples" / "brewfield",
    "ledger": Path(__file__).parent.parent / "examples" / "ledger",
    "trinity-siege": Path(__file__).parent.parent / "examples" / "trinity-siege",
    "slimebreeder": Path(r"C:\Github\SlimeBreeder"),
    "corpworld": Path(__file__).parent.parent / "examples" / "corpworld",
}


def studio_deploy_arcade() -> dict:
    """Copy ts/dist/ into the site repo's static/arcade/rfdgamestudio/,
    copy each example demo's dist/ into static/arcade/{gameId}/,
    then invoke the site repo's hugo build and deploy_smart.py as
    subprocesses. Does not call studio_build first — dist/ must already
    be fresh.

    Returns: {"copied_files": int, "build": dict, "deploy": dict}
    """
    import shutil
    import subprocess

    try:
        write_game_metadata()
    except Exception as exc:
        return {'error': f'game metadata generation failed: {exc}', 'tool': 'studio_deploy_arcade'}

    repo_root = Path(__file__).parent.parent
    dist_dir = repo_root / "ts" / "dist"
    if not dist_dir.exists():
        return {
            "error": "ts/dist/ does not exist. Call studio_build first.",
            "tool": "studio_deploy_arcade",
        }

    # Verify all example demo dists exist before copying anything
    for demo_slug in _EXAMPLE_DEMOS:
        demo_dist = _DEMO_SOURCE_PATHS[demo_slug] / "dist"
        if not demo_dist.exists():
            return {
                "error": f"{_DEMO_SOURCE_PATHS[demo_slug]} / dist/ does not exist. Build it first.",
                "tool": "studio_deploy_arcade",
            }

    target_dir = _SITE_REPO_PATH / "static" / "arcade" / "rfdgamestudio"

    try:
        # Copy main arcade app
        if target_dir.exists():
            shutil.rmtree(target_dir)
        shutil.copytree(dist_dir, target_dir)
        copied_files = sum(1 for _ in target_dir.rglob("*") if _.is_file())

        # Copy each example demo
        for demo_slug in _EXAMPLE_DEMOS:
            demo_dist = _DEMO_SOURCE_PATHS[demo_slug] / "dist"
            static_name = _DEMO_STATIC_NAME[demo_slug]
            demo_target = _SITE_REPO_PATH / "static" / "arcade" / static_name
            if demo_target.exists():
                shutil.rmtree(demo_target)
            shutil.copytree(demo_dist, demo_target)

            # Verify the copy actually landed before moving on
            if not demo_target.exists() or not (demo_target / "index.html").exists():
                return {
                    "error": f"copytree reported no exception but {demo_target} "
                             f"is missing or has no index.html after copying from "
                             f"{demo_dist}. Deploy aborted before SFTP step.",
                    "tool": "studio_deploy_arcade",
                    "failed_demo": demo_slug,
                }

            copied_files += sum(1 for _ in demo_target.rglob("*") if _.is_file())

        hugo_exe = _SITE_REPO_PATH / "hugo.exe"
        build_proc = subprocess.run(
            [str(hugo_exe), "--minify"],
            cwd=str(_SITE_REPO_PATH), capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )
        build_stderr = build_proc.stderr or ""
        build_result = {"returncode": build_proc.returncode, "stderr": build_stderr[-1000:]}
        if build_proc.returncode != 0:
            return {"copied_files": copied_files, "build": build_result,
                     "error": "hugo build failed", "tool": "studio_deploy_arcade"}

        # Tier 1 + Tier 2 verification before pushing live. Verification does not
        # block deploy; it adds information to the same report Robert reviews.
        try:
            verification = verify_arcade_deploy()
        except Exception as exc:
            verification = {
                "ok": False,
                "error": f"verification itself failed: {exc}",
                "games": {},
            }

        venv_python = _SITE_REPO_PATH / ".venv" / "Scripts" / "python.exe"
        deploy_script = _SITE_REPO_PATH / "deploy_smart.py"
        deploy_proc = subprocess.run(
            [str(venv_python), str(deploy_script)],
            cwd=str(_SITE_REPO_PATH), capture_output=True, text=True,
            encoding="utf-8", errors="replace",
            # deploy_smart.py prints emoji (🚀, ✓, etc.) — without an explicit
            # encoding, Windows' locale-default codec (often cp1252) can fail
            # to decode them, leaving stdout as None instead of raising a
            # clean error. This was the actual cause of the NoneType crash,
            # confirmed via a real traceback, not the stale-server theory
            # this was originally attributed to.
        )
        deploy_stdout = deploy_proc.stdout or ""
        deploy_result = {"returncode": deploy_proc.returncode, "stdout": deploy_stdout[-1000:]}

        return {
            "copied_files": copied_files,
            "build": build_result,
            "deploy": deploy_result,
            "verification": verification,
        }
    except Exception as exc:
        return {"error": str(exc), "tool": "studio_deploy_arcade"}


def studio_process_intake(concept_slug: str, bump: str | None = None, note: str | None = None) -> dict:
    """Process any newly-dropped, generically-named zips in intake/{concept_slug}/.

    Default bump is R (revision) — pass bump='minor'/'patch'/'major' only when
    explicitly declaring a semantic change.

    Returns: {"concept_slug": str, "processed": list, "duplicates": list,
              "errors": list, "warnings": list, "current_version": str,
              "manifest_path": str}
    """
    try:
        return process_intake(concept_slug, bump=bump, note=note)
    except Exception as exc:
        return {'error': str(exc), 'tool': 'studio_process_intake'}


# ── PROMOTE TO EXAMPLES ─────────────────────────────────────────────────────


def _package_deps_match(path_a: Path, path_b: Path) -> bool:
    """Compare dependency sections of two package.json files."""
    try:
        a = json.loads(path_a.read_text(encoding="utf-8"))
        b = json.loads(path_b.read_text(encoding="utf-8"))
    except Exception:
        return False
    return (
        a.get("dependencies") == b.get("dependencies")
        and a.get("devDependencies") == b.get("devDependencies")
    )


def _vite_binary(node_modules: Path) -> Path | None:
    """Return the path to the direct vite.js binary if it exists."""
    candidate = node_modules / "vite" / "bin" / "vite.js"
    return candidate if candidate.exists() else None


def _ensure_node_modules(examples_dir: Path) -> Path | None:
    """Return a usable node_modules path for the project.

    If the project already has a usable node_modules, it is returned.
    Otherwise, an existing sibling examples/{other}/node_modules with matching
    package.json dependencies is linked as a directory junction.
    """
    project_node_modules = examples_dir / "node_modules"

    if project_node_modules.exists():
        if os.path.isjunction(str(project_node_modules)) or project_node_modules.is_symlink():
            # If it is a link, use it as-is as long as it has vite.
            return _vite_binary(project_node_modules) and project_node_modules
        if _vite_binary(project_node_modules):
            return project_node_modules
        # Empty or incomplete directory: remove it and try to link.
        shutil.rmtree(project_node_modules)

    project_pkg = examples_dir / "package.json"
    if not project_pkg.exists():
        return None

    repo_root = Path(__file__).parent.parent
    examples_root = repo_root / "examples"
    if not examples_root.exists():
        return None

    for sibling_dir in examples_root.iterdir():
        if not sibling_dir.is_dir() or sibling_dir == examples_dir:
            continue
        sibling_pkg = sibling_dir / "package.json"
        sibling_node_modules = sibling_dir / "node_modules"
        if (
            sibling_pkg.exists()
            and sibling_node_modules.exists()
            and _package_deps_match(project_pkg, sibling_pkg)
            and _vite_binary(sibling_node_modules)
        ):
            try:
                subprocess.run(
                    ["cmd", "/c", "mklink", "/J", str(project_node_modules), str(sibling_node_modules)],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                return project_node_modules
            except Exception:
                # If the junction cannot be created, the caller can still try
                # the sibling path directly as a last resort.
                return sibling_node_modules

    return None


def _resolve_intake_zip(intake_dir: Path, concept_slug: str, version: str | None) -> Path | None:
    """Find the requested (or latest) versioned zip in the intake directory."""
    from studio_mcp.intake import load_manifest

    if version:
        candidate = intake_dir / f"{concept_slug}_v{version}.zip"
        return candidate if candidate.exists() else None

    _, current_version, _ = load_manifest(intake_dir, concept_slug)
    if current_version:
        candidate = intake_dir / f"{concept_slug}_v{current_version}.zip"
        if candidate.exists():
            return candidate

    # Fallback: latest versioned zip by creation time.
    versioned = sorted(
        intake_dir.glob(f"{concept_slug}_v*.zip"),
        key=lambda p: p.stat().st_ctime,
        reverse=True,
    )
    return versioned[0] if versioned else None


def studio_promote_to_examples(
    concept_slug: str, version: str | None = None
) -> dict:
    """Promote an intake zip into examples/{concept_slug}, build, and deploy.

    1. Extracts intake/{concept_slug}/{concept_slug}_v{version}.zip into
       examples/{concept_slug}/ (clearing prior src/, dist/, and index.html).
    2. Auto-injects or corrects `base: '/arcade/{game_id}/'` in vite.config.ts (idempotent).
    3. Reuses a sibling example's node_modules when package.json dependencies match.
    4. Builds with the direct vite binary (node .../vite/bin/vite.js build).
    5. Deploys the dist/ to local-arcade-preview/arcade/{game_id}/ via robocopy /PURGE.

    concept_slug: folder name used in intake/ and examples/ (kebab-case is fine)
    version: optional version string (e.g. "0.1.0R3"); if omitted, the latest
             MANIFEST.md current_version is used.
    Returns: {"concept_slug": str, "game_id": str, "version": str,
              "source_zip": str, "base": str, "build": dict, "deploy": dict,
              "duration_ms": int}
    """
    start = time.time()

    repo_root = Path(__file__).parent.parent
    intake_dir = repo_root / "intake" / concept_slug
    game_id = _game_id_from_slug(concept_slug)
    examples_dir = repo_root / "examples" / concept_slug
    preview_target = repo_root / "local-arcade-preview" / "arcade" / game_id
    expected_base = f"/arcade/{game_id}/"

    if not intake_dir.exists():
        return {"error": f"intake/{concept_slug}/ does not exist", "tool": "studio_promote_to_examples"}

    zip_path = _resolve_intake_zip(intake_dir, concept_slug, version)
    if zip_path is None:
        return {
            "error": f"No versioned zip found for {concept_slug!r}",
            "tool": "studio_promote_to_examples",
            "version": version,
        }

    used_version = version or zip_path.stem.rsplit("_v", 1)[-1]

    # Clear the parts we want refreshed from the zip.
    for name in ("src", "dist"):
        target = examples_dir / name
        if target.exists():
            shutil.rmtree(target)
    index_html = examples_dir / "index.html"
    if index_html.exists():
        index_html.unlink()

    examples_dir.mkdir(parents=True, exist_ok=True)

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            members = [
                info
                for info in zf.infolist()
                if not info.filename.startswith("node_modules/")
            ]
            zf.extractall(path=str(examples_dir), members=members)
    except Exception as exc:
        return {"error": f"failed to extract zip: {exc}", "tool": "studio_promote_to_examples"}

    # Auto-fix base path (after extraction, before build — every call, idempotent).
    vite_config = examples_dir / "vite.config.ts"
    if not vite_config.exists():
        return {
            "error": f"vite.config.ts not found in examples/{concept_slug}/",
            "tool": "studio_promote_to_examples",
            "base_expected": expected_base,
        }

    content = vite_config.read_text(encoding="utf-8")
    base_match = re.search(r'base\s*:\s*(["\'])(.*?)\1', content)
    if base_match is None:
        # No base key at all — inject one right after the opening `return {`
        content = re.sub(
            r'(return\s*\{)',
            rf"\1\n    base: '{expected_base}',",
            content,
            count=1,
        )
        vite_config.write_text(content, encoding="utf-8")
        base_action = "injected"
        actual_base = expected_base
    elif base_match.group(2) != expected_base:
        # Wrong base — replace in place, preserving quote style
        content = content[:base_match.start(2)] + expected_base + content[base_match.end(2):]
        vite_config.write_text(content, encoding="utf-8")
        base_action = "corrected"
        actual_base = expected_base
    else:
        base_action = "already-correct"
        actual_base = expected_base

    # Ensure node_modules (reuse sibling if needed).
    node_modules = _ensure_node_modules(examples_dir)
    vite_bin = _vite_binary(node_modules) if node_modules else None
    if vite_bin is None:
        return {
            "error": "No usable node_modules found for this project and no matching sibling example",
            "tool": "studio_promote_to_examples",
        }

    # Build with the direct vite binary.
    try:
        build_proc = subprocess.run(
            ["node", str(vite_bin), "build"],
            cwd=str(examples_dir),
            capture_output=True,
            text=True,
            timeout=120,
            encoding="utf-8",
            errors="replace",
        )
    except subprocess.TimeoutExpired:
        return {"error": "Build timed out (120s)", "tool": "studio_promote_to_examples"}
    except Exception as exc:
        return {"error": f"Build failed to start: {exc}", "tool": "studio_promote_to_examples"}

    build_output = (build_proc.stdout or "") + (build_proc.stderr or "")
    build_result = {
        "success": build_proc.returncode == 0,
        "return_code": build_proc.returncode,
        "output": build_output[-2000:],
    }

    if build_proc.returncode != 0:
        return {
            "concept_slug": concept_slug,
            "game_id": game_id,
            "version": used_version,
            "source_zip": str(zip_path),
            "base": actual_base,
            "base_action": base_action,
            "build": build_result,
            "error": "Build failed",
            "tool": "studio_promote_to_examples",
        }

    # Deploy to local-arcade-preview with robocopy /PURGE.
    dist_dir = examples_dir / "dist"
    if not dist_dir.exists():
        return {
            "concept_slug": concept_slug,
            "game_id": game_id,
            "version": used_version,
            "source_zip": str(zip_path),
            "base": actual_base,
            "base_action": base_action,
            "build": build_result,
            "error": "dist/ does not exist after build",
            "tool": "studio_promote_to_examples",
        }

    preview_target.mkdir(parents=True, exist_ok=True)
    try:
        deploy_proc = subprocess.run(
            ["robocopy", str(dist_dir), str(preview_target), "/E", "/PURGE"],
            capture_output=True,
            text=True,
            timeout=120,
            encoding="utf-8",
            errors="replace",
        )
    except subprocess.TimeoutExpired:
        return {
            "concept_slug": concept_slug,
            "game_id": game_id,
            "version": used_version,
            "source_zip": str(zip_path),
            "base": actual_base,
            "base_action": base_action,
            "build": build_result,
            "error": "Deploy timed out (120s)",
            "tool": "studio_promote_to_examples",
        }
    except Exception as exc:
        return {
            "concept_slug": concept_slug,
            "game_id": game_id,
            "version": used_version,
            "source_zip": str(zip_path),
            "base": actual_base,
            "base_action": base_action,
            "build": build_result,
            "error": f"Deploy failed to start: {exc}",
            "tool": "studio_promote_to_examples",
        }

    deploy_output = (deploy_proc.stdout or "") + (deploy_proc.stderr or "")
    deploy_result = {
        "return_code": deploy_proc.returncode,
        "success": deploy_proc.returncode <= 7,
        "output": deploy_output[-2000:],
    }

    duration_ms = int((time.time() - start) * 1000)

    return {
        "concept_slug": concept_slug,
        "game_id": game_id,
        "version": used_version,
        "source_zip": str(zip_path),
        "base": actual_base,
        "base_action": base_action,
        "build": build_result,
        "deploy": deploy_result,
        "duration_ms": duration_ms,
    }


# ── GENERATE REGISTRY ENTRY ─────────────────────────────────────────────────


def _camel_case_from_game_id(game_id: str) -> str:
    """Convert underscore game_id to camelCase (e.g. trinity_siege → trinitySiege)."""
    parts = game_id.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def studio_generate_registry_entry(
    slug: str,
    description: str,
    color: str = "#6c8ef7",
) -> dict:
    """Create ts/src/games/{game_id}/config.ts and add the corresponding
    import + registry entry to ts/src/games/registry.ts, for a new
    external-tier (embedUrl) game. Does not touch any existing entry.

    slug: kebab-case folder slug (e.g. "trinity-siege")
    description: human-readable game description for the arcade card
    color: hex accent color for the arcade card (default "#6c8ef7")
    Returns: {"slug": str, "game_id": str, "config_path": str,
              "import_name": str, "registry_modified": bool}
    """
    game_id = _game_id_from_slug(slug)
    import_name = f"{_camel_case_from_game_id(game_id)}Config"
    label = " ".join(p.capitalize() for p in slug.split("-"))

    repo_root = Path(__file__).parent.parent
    games_src = repo_root / "ts" / "src" / "games"
    config_dir = games_src / game_id
    config_path = config_dir / "config.ts"
    registry_path = games_src / "registry.ts"

    # Refuse if config.ts already exists.
    if config_path.exists():
        return {
            "error": f"config.ts already exists at {config_path}",
            "tool": "studio_generate_registry_entry",
            "slug": slug,
            "game_id": game_id,
        }

    # Refuse if registry.ts doesn't exist (shouldn't happen, but guard).
    if not registry_path.exists():
        return {
            "error": f"registry.ts not found at {registry_path}",
            "tool": "studio_generate_registry_entry",
            "slug": slug,
            "game_id": game_id,
        }

    registry_content = registry_path.read_text(encoding="utf-8")

    # Refuse if game_id is already referenced in the registry.
    if f"./{game_id}/config" in registry_content:
        return {
            "error": f"slug {slug!r} (game_id {game_id!r}) is already in registry.ts",
            "tool": "studio_generate_registry_entry",
            "slug": slug,
            "game_id": game_id,
        }

    # Create config.ts.
    config_template = (
        "import type { GameConfig } from '../../engine/types';\n"
        "\n"
        "const config: GameConfig = {{\n"
        "  gameId: '{game_id}',\n"
        "  label: '{label}',\n"
        "  description: '{description}',\n"
        "  color: '{color}',\n"
        "  status: 'external',\n"
        "  embedUrl: '/arcade/{game_id}/',\n"
        "}};\n"
        "\n"
        "export default config;\n"
    )
    config_text = config_template.format(
        game_id=game_id,
        label=label,
        description=description,
        color=color,
    )
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path.write_text(config_text, encoding="utf-8")

    # Minimal insertion into registry.ts: one import line + one array entry.
    import_line = f"import {import_name} from './{game_id}/config';\n"

    # Insert import after the last existing import line.
    lines = registry_content.splitlines(keepends=True)
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.lstrip().startswith("import "):
            last_import_idx = i
    if last_import_idx < 0:
        # Fallback: insert at the very top.
        lines.insert(0, import_line)
    else:
        lines.insert(last_import_idx + 1, import_line)

    # Insert array entry before the closing `];` of GAME_REGISTRY.
    registry_text = "".join(lines)
    array_entry = f"  {import_name},\n"
    registry_text = registry_text.replace(
        "];\n",
        f"{array_entry}];\n",
        1,
    )
    registry_path.write_text(registry_text, encoding="utf-8")

    return {
        "slug": slug,
        "game_id": game_id,
        "config_path": str(config_path),
        "import_name": import_name,
        "registry_modified": True,
    }
