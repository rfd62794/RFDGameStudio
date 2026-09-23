# RFDGameStudio — Phase 2p Directive: RFDStudioMCP Tool Expansion

*June 2026 | Read fully before executing anything.*
*Six changes to studio_mcp/. One addition to slither_rogue/logic.lua.*
*After this phase Claude can validate, test, balance-check, and see the game.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 62 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 27 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

**Current state of RFDStudioMCP (port 8025):**
- `studio_load_game` — works ✅
- `studio_get_systems` — works ✅
- `studio_call` — broken for multi-arg functions ❌
- `studio_run_headless` — broken for multi-arg functions ❌
- `studio_get_schema` — works ✅

**Root cause of multi-arg failure:**
`args: dict | None` is spread via `list(args.values())` as positional Lua args.
When calling `simulate_race(participants, config)` with
`args={"delta_time": 0.2, "distance": 1200}`, the function receives
`simulate_race(0.2, 1200)` — floats where tables are expected. 100% failure rate.

**What this phase delivers:**
1. Fix `studio_call` and `studio_run_headless` — support `args: list | dict | None`
2. New: `studio_validate_game` — verify all 4 files before running
3. New: `studio_run_tests` — run `uv run pytest` directly, return structured output
4. New: `studio_balance_report` — N-iteration race pipeline, statistical distribution
5. New: `studio_get_state` — inspect GAME_STATE after init_game (slither_rogue)
6. New: `studio_screenshot` — headless PyGame frame, saved to file + path returned

---

## §1 Scope

| File | Action |
|---|---|
| `studio_mcp/tools.py` | Fix 2 tools, add 4 new tools |
| `studio_mcp/server.py` | Register 4 new tools |
| `games/slither_rogue/logic.lua` | Add `get_state_summary()` helper |
| `tests/fixtures/slither_rogue/logic.lua` | Sync |
| `tests/test_studio_mcp.py` | Add 2 new tests → 62→64 |

**NSSM restart required after tools.py/server.py changes:**
```powershell
nssm restart RFDStudioMCP
```
Verify restart: `curl http://localhost:8025/health`

**Read-only — do not touch:**
TypeScript files, horse_racing game files, PyGame renderer files (except
`studio_screenshot` which imports from `renderers/`).

---

## §2 Fix: studio_call — Positional Args

**Problem:** `args: dict | None` only. Dict values spread in insertion order.
Cannot explicitly control positional arg sequence.

**Fix:** Accept `args: list | dict | None`.
- `list` → spread directly: `fn(*args)` — caller controls order precisely
- `dict` → spread by values: `fn(*args.values())` — existing behavior preserved
- `None` → `fn()` — no arguments

```python
def studio_call(
    session_id: str,
    fn_name: str,
    args: list | dict | None = None
) -> dict:
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
```

Apply the same `list | dict | None` change to `studio_run_headless` —
same fix in the `call_args` assembly section.

---

## §3 New: studio_validate_game

Validates all four game files before any agent runs code.
Catches missing files, yaml parse errors, Lua load failures,
undeclared functions, missing layout_tree.

```python
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
```

---

## §4 New: studio_run_tests

Runs `uv run pytest tests/ -v --tb=short` via subprocess.
No more waiting for Robert to paste output.

```python
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
```

---

## §5 New: studio_balance_report

Runs N full race pipelines (create_race → simulate_race) and returns
statistical distribution of player outcomes. Answers: "Is this game balanced?"

```python
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
```

---

## §6 New: studio_get_state

Inspects GAME_STATE after `init_game` for slither_rogue.
Requires a Lua helper `get_state_summary()` in slither_rogue/logic.lua.

### §6.1 Add to games/slither_rogue/logic.lua (in discrete helpers section)

```lua
-- Returns a safe summary of GAME_STATE for external inspection.
-- Called by studio_get_state MCP tool.
function get_state_summary()
  if not GAME_STATE then return nil end
  local p = GAME_STATE.player
  local seg_count = 0
  if p and p.segments then
    for _ in ipairs(p.segments) do seg_count = seg_count + 1 end
  end
  return {
    initialized     = true,
    time_left       = GAME_STATE.time_left or 0,
    score           = GAME_STATE.score or 0,
    peak_length     = GAME_STATE.peak_length or 0,
    player_segments = seg_count,
    player_x        = (p and p.segments and p.segments[1]) and p.segments[1].x or 0,
    player_y        = (p and p.segments and p.segments[1]) and p.segments[1].y or 0,
    npc_count       = GAME_STATE.npcs and #GAME_STATE.npcs or 0,
    fruit_count     = GAME_STATE.fruits and #GAME_STATE.fruits or 0,
    acid_drops      = GAME_STATE.acid_drops and #GAME_STATE.acid_drops or 0,
    speed_mult      = GAME_STATE.speed_mult or 1.0,
    events_pending  = GAME_STATE.events and #GAME_STATE.events or 0,
  }
end
```

Sync to `tests/fixtures/slither_rogue/logic.lua` after adding.

### §6.2 Add to tools.py

```python
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
```

---

## §7 New: studio_screenshot

Runs the PyGame renderer headless and saves a PNG screenshot.
Returns the file path (Nitro local path).

```python
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
```

---

## §8 server.py — Register New Tools

Add imports and `mcp.tool()` registrations for all four new tools:

```python
from studio_mcp.tools import (
    studio_call,
    studio_get_schema,
    studio_get_state,          # new
    studio_get_systems,
    studio_load_game,
    studio_run_headless,
    studio_run_tests,          # new
    studio_validate_game,      # new
    studio_balance_report,     # new
    studio_screenshot,         # new
)

mcp.tool()(studio_load_game)
mcp.tool()(studio_call)
mcp.tool()(studio_get_schema)
mcp.tool()(studio_get_systems)
mcp.tool()(studio_run_headless)
mcp.tool()(studio_validate_game)    # new
mcp.tool()(studio_run_tests)        # new
mcp.tool()(studio_balance_report)   # new
mcp.tool()(studio_get_state)        # new
mcp.tool()(studio_screenshot)       # new
```

Update the docstring at the top of server.py to list 10 tools.

---

## §9 New Python Tests (62→64)

Add to `tests/test_studio_mcp.py`:

```python
def test_studio_validate_game_horse_racing() -> None:
    """studio_validate_game returns valid=True for horse_racing."""
    from studio_mcp.tools import studio_validate_game
    result = studio_validate_game('horse_racing')
    assert result.get('valid') is True
    assert result.get('game_id') == 'horse_racing'
    issues = result.get('issues', [])
    errors = [i for i in issues if i.get('severity') == 'error']
    assert len(errors) == 0

def test_studio_run_tests_returns_structure() -> None:
    """studio_run_tests returns dict with passed/failed keys."""
    from studio_mcp.tools import studio_run_tests
    result = studio_run_tests(game_id='horse_racing')
    assert 'passed' in result or 'error' in result
    if 'passed' in result:
        assert isinstance(result['passed'], int)
        assert isinstance(result['failed'], int)
        assert 'floor_met' in result
```

---

## §10 NSSM Restart

After all file changes are verified with `uv run pytest -v`:

```powershell
nssm restart RFDStudioMCP
Start-Sleep -Seconds 3
curl http://localhost:8025/health
```

Expected: `{"status": "ok", "service": "RFDStudioMCP", "port": 8025}`

---

## §11 Completion Criteria

**Python floors:**
- [ ] `uv run pytest -v` → **64 passed, 0 failed, 0 skipped**

**TypeScript floors:**
- [ ] `cd ts && npx vitest run` → 27 passed (unchanged)
- [ ] `cd ts && npx vite build` → exits 0

**Tool verification (call each in Claude Desktop after NSSM restart):**

| Tool | Verification call | Expected |
|---|---|---|
| `studio_call` (fixed) | `studio_call(session, 'can_unlock_slot', [3,12,500,500])` | `{result: [true, nil]}` |
| `studio_validate_game` | `studio_validate_game('horse_racing')` | `{valid: true, issues: []}` |
| `studio_run_tests` | `studio_run_tests()` | `{passed: 64, failed: 0}` |
| `studio_balance_report` | `studio_balance_report('horse_racing', 50)` | win_rate, place_rate, show_rate |
| `studio_get_state` | load slither_rogue → init_game → `studio_get_state(sid)` | state_summary with player_segments |
| `studio_screenshot` | `studio_screenshot('horse_racing', 'stable')` | path to PNG file |

**`studio_run_tests` self-validation:**
After restart, Claude calls `studio_run_tests()` directly in Claude Desktop.
If it returns `passed: 64, failed: 0` — the test runner is working without
Robert pasting anything.

**`docs/state/current.md` updated to Phase 2p certified**

---

## §12 Quick Reference

| Item | Value |
|---|---|
| Python floor | 62 → 64 / 0 / 0 |
| TypeScript floor | 27 / 0 / 0 (unchanged) |
| New tools | validate_game, run_tests, balance_report, get_state, screenshot |
| Fixed tools | studio_call, studio_run_headless (positional args) |
| `studio_call` args: list | `[arg1, arg2, ...]` — spread as positional Lua args |
| `studio_call` args: dict | `{"k": v, ...}` — values spread in insertion order |
| Screenshot save location | `C:\Github\RFDGameStudio\screenshots\` |
| NSSM service | RFDStudioMCP — restart required after server.py changes |
| Lua addition | `get_state_summary()` in slither_rogue/logic.lua |

---

*RFDGameStudio Phase 2p | June 2026 | RFD IT Services Ltd.*
*After this phase: Claude can validate games, run tests, check balance,*
*inspect game state, and see rendered output — without Robert pasting anything.*
