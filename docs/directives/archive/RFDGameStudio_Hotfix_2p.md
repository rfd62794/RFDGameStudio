# RFDGameStudio — Hotfix: Phase 2p Tool Check Failures

*June 2026 | Three bugs. Three files. NSSM restart required.*

---

> ⛔ **STOP:** Verify floors before touching anything.
> Python: `uv run pytest -v` → must report 64 passed, 0 failed, 0 skipped.

---

## §1 Bug 1 — studio_run_tests: uv not in PATH

**Root cause:** NSSM service doesn't inherit the user shell PATH.
`uv.exe` lives at `C:\Users\cheat\.local\bin\uv.exe` but the service
can't find it as plain `uv`.

**Fix:** Read UV_PATH from environment, fall back to known absolute path.

In `studio_mcp/tools.py`, in `studio_run_tests()`, replace:

```python
cmd = ['uv', 'run', 'pytest', '-v', '--tb=short', '--no-header', '-q']
```

With:

```python
import os
uv_path = os.environ.get('UV_PATH', r'C:\Users\cheat\.local\bin\uv.exe')
cmd = [uv_path, 'run', 'pytest', '-v', '--tb=short', '--no-header', '-q']
```

> ⚠️ NOTE: Also add `UV_PATH=C:\Users\cheat\.local\bin\uv.exe` to the
> RFDStudioMCP NSSM service environment via:
> ```powershell
> nssm set RFDStudioMCP AppEnvironmentExtra UV_PATH=C:\Users\cheat\.local\bin\uv.exe
> ```
> Then restart the service.

---

## §2 Bug 2 — studio_balance_report: Python dict → Lua table mismatch

**Root cause:** Lupa proxies Python lists with 0-based indices.
Lua's `ipairs` expects 1-based tables.
When `balance_report` passes Python `data` dict to `create_race`,
`data.coat_colors`, `data.race_classes`, etc. are Python list proxies —
`ipairs` iterates nothing, NPC generation fails, 100% error rate.

**Fix:** Add a recursive `_to_lua_table()` converter. Convert `player_horse`
and `data` to proper Lua tables before calling any Lua function.

Add this helper at the top of `studio_mcp/tools.py` (after imports):

```python
def _to_lua_table(lua_runtime, obj):
    """
    Recursively convert Python dicts/lists to lupa Lua tables.
    Python lists → 1-based Lua sequence tables (ipairs-compatible).
    Python dicts → Lua hash tables (pairs-compatible).
    Other values pass through unchanged.
    """
    if isinstance(obj, dict):
        converted = {k: _to_lua_table(lua_runtime, v) for k, v in obj.items()}
        return lua_runtime.table_from(converted)
    elif isinstance(obj, (list, tuple)):
        converted = [_to_lua_table(lua_runtime, v) for v in obj]
        return lua_runtime.table_from(converted)
    else:
        return obj
```

In `studio_balance_report()`, replace the inner loop body with:

```python
for i in range(iterations):
    sess_i = load_game(game_id, seed=42 + i, games_dir=_GAMES_DIR)
    lua = sess_i.executor._lua
    try:
        lua_horse = _to_lua_table(lua, player_horse)
        lua_data  = _to_lua_table(lua, data)

        race_result = sess_i.executor.call('create_race', lua_horse, lua_data)
        if race_result is None:
            errors += 1
            continue

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
        lua_parts  = _to_lua_table(lua, parts)
        lua_config = _to_lua_table(lua, config)
        results = sess_i.executor.call('simulate_race', lua_parts, lua_config)
        if not results:
            errors += 1
            continue

        result_list = [dict(r) for r in results]
        player_id   = player_horse.get('id', '')
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
```

> ⚠️ NOTE: `_to_lua_table` accesses `sess_i.executor._lua` directly.
> This is intentional — lupa's `table_from()` must be called on the
> specific LuaRuntime instance that will receive the table.
> A table created in one runtime cannot be used in another.

---

## §3 Bug 3 — slither_rogue systems.yaml: wrong function name declared

**Root cause:** Phase 2h renamed `calculate_evolution_effects` to
`_calc_effects` (private helper). The public function is
`update_evolution_effects`. `systems.yaml` still declares the old name.
`studio_validate_game` correctly flagged this as a warning.

**Fix:** Update `games/slither_rogue/systems.yaml` — in the `evolution`
system's `functions` list, replace `calculate_evolution_effects` with
`update_evolution_effects`.

Before:
```yaml
    functions:
      - calculate_evolution_effects
      - check_evolution_trigger
      - select_evolution_pool
```

After:
```yaml
    functions:
      - update_evolution_effects
      - check_evolution_trigger
      - select_evolution_pool
```

Sync to `tests/fixtures/slither_rogue/systems.yaml` after the change.

---

## §4 NSSM Restart

```powershell
# Set UV_PATH for the service (run as administrator)
nssm set RFDStudioMCP AppEnvironmentExtra UV_PATH=C:\Users\cheat\.local\bin\uv.exe
nssm restart RFDStudioMCP
Start-Sleep -Seconds 3
curl http://localhost:8025/health
```

---

## §5 Verification (Claude runs these after restart)

```
studio_run_tests()
  → expected: {passed: 64, failed: 0, floor_met: true}

studio_balance_report('horse_racing', 50)
  → expected: errors: 0 (or low), win_rate: ~0.15–0.20

studio_validate_game('slither_rogue')
  → expected: {valid: true, issues: []}  (warning gone)
```

**Python floor must not change:** 64/0/0

---

## §6 Quick Reference

| Bug | File | Change |
|---|---|---|
| run_tests PATH | `studio_mcp/tools.py` | `UV_PATH` env var + NSSM env |
| balance_report Lua | `studio_mcp/tools.py` | `_to_lua_table()` + convert before call |
| systems.yaml name | `games/slither_rogue/systems.yaml` | `calculate_evolution_effects` → `update_evolution_effects` |
| fixture sync | `tests/fixtures/slither_rogue/systems.yaml` | Same change |

---

*RFDGameStudio Hotfix | June 2026 | RFD IT Services Ltd.*
