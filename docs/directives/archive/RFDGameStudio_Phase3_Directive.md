# RFDGameStudio — Phase 3 Directive: Claude MCP Integration

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 21 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 12 passed, 0 failed, 0 skipped.
> If either count differs, stop and report — do not proceed.

---

## §0 Context

**What Phase 3 delivers:**
A new NSSM-managed MCP server — `RFDStudioMCP` — that exposes the Python runtime
to Claude directly. Claude becomes a pipeline participant: it can call Lua functions,
run headless simulations, read schemas, and produce balance reports without an agent
intermediary.

This is what "Claude as first-class participant" means in practice (SDD §5).

**Why this matters:**
Right now Claude can read the three files but cannot execute them. After Phase 3:
- Claude calls `simulate_race` 1,000 times and reports win distribution
- Claude reads `data.yaml` and proposes rebalanced odds constants
- Claude generates a new game from a prompt, writes all four files, and verifies
  Lua functions execute without error
- Surgical edits (lane height, speed default) can be made by Claude directly
  without writing a directive or invoking an agent

**What is NOT in scope:**
- No TypeScript changes
- No new Lua functions
- No new game
- No changes to the Python runtime (studio/ is frozen)
- No Claude Desktop auto-configuration — manual config update required after deploy

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/__init__.py` | New | Empty init |
| `studio_mcp/server.py` | New | FastAPI MCP SSE server, port 8025 |
| `studio_mcp/tools.py` | New | Tool definitions: load_game, call, get_schema, get_systems, run_headless |
| `studio_mcp/session_store.py` | New | In-memory session registry |
| `pyproject.toml` | Modify | Add `studio_mcp` as a module, add fastapi + uvicorn to deps |
| `tests/test_studio_mcp.py` | New | MCP server tests |
| `docs/adr/ADR-006.md` | New | Copy from ADR-006-systems-yaml.md |
| `games/horse_racing/systems.yaml` | New | Horse racing ECS manifest |

**Read-only — do not touch:**
`studio/loader.py`, `studio/validator.py`, `studio/executor.py`, `studio/runtime.py`,
`games/horse_racing/data.yaml`, `games/horse_racing/logic.lua`,
all existing test files.

---

## §2 Implementation

### §2.1 games/horse_racing/systems.yaml

Create the ECS manifest per ADR-006. Must include all functions currently in logic.lua
assigned to their correct system. Systems: genetics, odds, simulation, market, breeding.

---

### §2.2 studio_mcp/session_store.py

In-memory session registry. Sessions are GameSession objects keyed by session_id.

```python
import uuid
from studio.runtime import GameSession
from typing import Dict, Optional

_sessions: Dict[str, GameSession] = {}

def create_session(session: GameSession) -> str:
    session_id = str(uuid.uuid4())[:8]
    _sessions[session_id] = session
    return session_id

def get_session(session_id: str) -> Optional[GameSession]:
    return _sessions.get(session_id)

def list_sessions() -> list[str]:
    return list(_sessions.keys())

def destroy_session(session_id: str) -> bool:
    return _sessions.pop(session_id, None) is not None
```

> ⚠️ RULE: Sessions are in-memory only. They do not persist between server restarts.
> Claude must call `studio_load_game` at the start of every session.

---

### §2.3 studio_mcp/tools.py

Five MCP tools. Each is a plain Python function decorated with the MCP tool decorator.

```python
# Tool 1 — Load a game session
def studio_load_game(game_id: str, seed: int = 42) -> dict:
    """
    Load a game by ID. Returns session_id for use in subsequent calls.
    game_id: directory name under games/ (e.g. "horse_racing")
    seed: RNG seed for reproducible results (default 42)
    Returns: {"session_id": str, "game_id": str, "systems": list}
    """

# Tool 2 — Call a Lua function
def studio_call(session_id: str, fn_name: str, args: dict = {}) -> dict:
    """
    Call a named Lua function on a loaded session.
    session_id: from studio_load_game
    fn_name: Lua function name (must exist in logic.lua)
    args: keyword arguments passed to the function
    Returns: {"result": any, "fn_name": str}
    """

# Tool 3 — Get entity schema
def studio_get_schema(session_id: str, entity: str) -> dict:
    """
    Return the schema definition for an entity from data.yaml.
    entity: entity name (e.g. "horse", "race", "bet")
    Returns: {"entity": str, "schema": dict}
    """

# Tool 4 — Get system manifest
def studio_get_systems(session_id: str) -> dict:
    """
    Return the systems.yaml manifest for the loaded game.
    Returns: {"systems": list, "entities": list}
    """

# Tool 5 — Run headless simulation
def studio_run_headless(
    session_id: str,
    fn_name: str,
    iterations: int,
    args: dict = {},
    seed_start: int = 1
) -> dict:
    """
    Run a Lua function N times with incrementing seeds. Returns aggregated results.
    Used for balance analysis: win distribution, odds accuracy, stat frequency.
    iterations: max 10000
    Returns: {"results": list, "fn_name": str, "iterations": int, "summary": dict}
    """
```

> ⚠️ RULE: `studio_call` converts Python dicts to Lua tables and back.
> All lupa conversion is contained in the executor. Tools receive plain Python
> objects and return plain Python objects.

> ⚠️ RULE: `studio_run_headless` caps at 10,000 iterations. Above that, instruct
> the caller to use a batch approach or reduce scope.

> ⚠️ RULE: All tools return dicts, never raise exceptions to the MCP client.
> Errors are returned as `{"error": str, "tool": str}`.

---

### §2.4 studio_mcp/server.py

FastAPI SSE server on port 8025.

```python
from fastapi import FastAPI
from mcp.server.fastapi import MCPRouter
from studio_mcp.tools import (
    studio_load_game, studio_call, studio_get_schema,
    studio_get_systems, studio_run_headless
)

app = FastAPI(title="RFDStudioMCP", version="1.0.0")
router = MCPRouter()

router.add_tool(studio_load_game)
router.add_tool(studio_call)
router.add_tool(studio_get_schema)
router.add_tool(studio_get_systems)
router.add_tool(studio_run_headless)

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "RFDStudioMCP", "port": 8025}
```

> ⚠️ RULE: The server reads `GAMES_DIR` from the environment, defaulting to
> `Path(__file__).parent.parent / "games"`. This allows the server to be run
> from any working directory.

> ⚠️ RULE: NSSM AppDirectory must point to the repo root (where `games/` lives).

---

### §2.5 pyproject.toml changes

Add to `[project.dependencies]`:
- `fastapi>=0.111.0`
- `uvicorn>=0.29.0`
- `mcp>=1.0.0`

Add entry point:
```toml
[project.scripts]
studio-mcp = "studio_mcp.server:app"
```

---

## §3 Test Anchors

**Python floor (must stay green — run first):**
`uv run pytest -v` → 21 passed, 0 failed, 0 skipped

**New tests — `tests/test_studio_mcp.py`:**
Target after: **28 passed, 0 failed, 0 skipped**

| # | Test Name | Behavior |
|---|---|---|
| 22 | `test_load_game_returns_session_id` | `studio_load_game("horse_racing")` returns dict with `session_id` |
| 23 | `test_load_game_invalid_id_returns_error` | Unknown game_id returns `{"error": ...}` not exception |
| 24 | `test_call_clamp_returns_correct_value` | `studio_call(sid, "clamp", {"val":5,"min_val":0,"max_val":10})` returns 5 |
| 25 | `test_call_unknown_function_returns_error` | Unknown fn_name returns `{"error": ...}` |
| 26 | `test_get_schema_horse_returns_fields` | `studio_get_schema(sid, "horse")` returns dict with "stats" key |
| 27 | `test_get_systems_returns_manifest` | `studio_get_systems(sid)` returns dict with "systems" list |
| 28 | `test_run_headless_generate_horse_10_iterations` | 10 iterations of `generate_horse` returns list of length 10 |

> ⚠️ RULE: Tests call tool functions directly — not via HTTP. No test server needed.
> The MCP server is verified by the health check in completion criteria.

---

## §4 NSSM Configuration

After deploy, register as NSSM service on Nitro:

```
Service name: RFDStudioMCP
AppDirectory: C:\Github\RFDGameStudio
AppParameters: run uvicorn studio_mcp.server:app --host 0.0.0.0 --port 8025
AppExecutable: C:\Users\cheat\.local\bin\uv.exe
```

Claude Desktop MCP config entry:
```json
{
  "RFDStudioMCP": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "http://localhost:8025/sse"]
  }
}
```

Restart Claude Desktop after adding. Verify tools appear in Claude's tool list.

---

## §5 Completion Criteria

- [ ] `uv run pytest -v` → 28 passed, 0 failed, 0 skipped
- [ ] `games/horse_racing/systems.yaml` exists with all logic.lua functions assigned
- [ ] `studio_mcp/server.py` starts: `uv run uvicorn studio_mcp.server:app --port 8025`
- [ ] Health check passes: `curl http://localhost:8025/health` returns `{"status": "ok"}`
- [ ] `studio_load_game("horse_racing")` returns a valid session_id
- [ ] `studio_call(sid, "clamp", ...)` returns correct result
- [ ] `studio_run_headless(sid, "generate_horse", 100)` completes in < 5 seconds
- [ ] NSSM service registered and starts on Nitro
- [ ] Claude Desktop tool list shows 5 RFDStudioMCP tools after config update
- [ ] Claude calls `studio_load_game` and `studio_call` successfully in a live session
- [ ] `docs/state/current.md` updated to Phase 3 certified

**Proof required:**
- Raw `uv run pytest -v` output (28/0/0)
- `curl http://localhost:8025/health` output
- Claude Desktop screenshot showing 5 studio tools in tool list
- Live Claude session: call `studio_run_headless` for 1000 races, paste win distribution output

---

## §6 Quick Reference

| Item | Value |
|---|---|
| Python floor before | 21 / 0 / 0 |
| Python floor after | 28 / 0 / 0 |
| TypeScript floor | 12 / 0 / 0 (unchanged) |
| Port | 8025 |
| Service name | RFDStudioMCP |
| NSSM machine | Nitro |
| New tools | studio_load_game, studio_call, studio_get_schema, studio_get_systems, studio_run_headless |
| Max headless iterations | 10,000 |
| Session persistence | In-memory only — resets on server restart |
| Phase 4 target | Second game (BattleBots) using systems.yaml |

---

*RFDGameStudio Phase 3 | June 2026 | RFD IT Services Ltd.*
*After this phase: Claude calls Lua. Director and agent collapse into one for surgical tasks.*
