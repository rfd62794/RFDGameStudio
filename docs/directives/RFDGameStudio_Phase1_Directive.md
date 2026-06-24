# RFDGameStudio — Phase 1 Directive: Python Runtime Core

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** This is a new repo. No existing test floor.
> Create the repo structure first. Report the directory tree before writing any code.
> Do not proceed until the structure is confirmed.

---

## §0 Context

**What exists:** The three-file format is proven. `games/horse_racing/data.yaml`,
`ui.yaml`, and `logic.lua` exist and are complete. The horse racing game logic is
fully implemented in Lua. No runtime exists yet.

**What this phase delivers:**
- Python runtime that loads any three-file game definition
- Lua execution via lupa
- Schema validation for data.yaml
- GameSession API: `load_game()`, `call()`, `get_schema()`
- Test floor: 15 passing, 0 failing, 0 skipped
- The horse racing game runs headless: generate a horse, run a race, get results

**What is NOT in scope:**
- No renderer, no UI, no tkinter
- No TypeScript runtime (Phase 2)
- No Rust runtime (Phase 5)
- No MCP tool integration (Phase 3)
- No second game (Phase 4)
- No CLI entry point
- No PyPI packaging

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/horse_racing/data.yaml` | New (copy) | Copy from source — do not modify |
| `games/horse_racing/ui.yaml` | New (copy) | Copy from source — do not modify |
| `games/horse_racing/logic.lua` | New (copy) | Copy from source — do not modify |
| `studio/__init__.py` | New | Empty init |
| `studio/loader.py` | New | Reads and parses three files |
| `studio/validator.py` | New | Validates data.yaml schema fields |
| `studio/executor.py` | New | lupa wrapper, Lua function calls |
| `studio/runtime.py` | New | GameSession, load_game(), call(), get_schema() |
| `tests/__init__.py` | New | Empty init |
| `tests/test_loader.py` | New | Loader tests |
| `tests/test_executor.py` | New | Executor tests |
| `tests/test_runtime.py` | New | Integration tests via runtime API |
| `tests/fixtures/` | New | Test fixture copies of three files |
| `requirements.txt` | New | pyyaml, lupa, pytest |
| `docs/adr/ADR-001.md` | New | Copy from SDD |
| `docs/adr/ADR-002.md` | New | Copy from SDD |
| `docs/adr/ADR-003.md` | New | Copy from SDD |
| `docs/adr/ADR-004.md` | New | Copy from SDD |
| `docs/adr/ADR-005.md` | New | Copy from SDD |
| `docs/state/current.md` | New | Phase state file |
| `README.md` | New | Studio identity + quick start |

**Read-only once created — do not modify during this phase:**
`games/horse_racing/data.yaml`, `games/horse_racing/ui.yaml`, `games/horse_racing/logic.lua`

If a bug is found in the game files, report it. Do not fix it during Phase 1.

---

## §2 Implementation

### studio/loader.py

Reads the three files for a given game_id and returns raw Python objects.

```python
from pathlib import Path
import yaml

GAMES_DIR = Path(__file__).parent.parent / "games"

class GameFiles:
    def __init__(self, game_id: str, data: dict, ui: dict, logic: str):
        self.game_id = game_id
        self.data = data      # parsed data.yaml
        self.ui = ui          # parsed ui.yaml
        self.logic = logic    # raw Lua source string

def load_game_files(game_id: str) -> GameFiles:
    """
    Load data.yaml, ui.yaml, logic.lua for game_id.
    Raises FileNotFoundError if any file is missing.
    Raises yaml.YAMLError if data.yaml or ui.yaml is malformed.
    """
```

> ⚠️ RULE: loader.py does no validation beyond YAML parsing. Validation lives in
> validator.py. loader.py has one job: read three files, return three objects.

> ⚠️ RULE: No fallbacks. If a file is missing, raise FileNotFoundError with the
> exact path. Never silently return None or empty dicts.

---

### studio/validator.py

Validates a parsed data.yaml dict against the studio's required field contract.

```python
class ValidationError(Exception):
    pass

def validate_data(data: dict) -> None:
    """
    Validates data.yaml structure.
    Raises ValidationError with a descriptive message on failure.
    
    Required top-level keys:
      game.id     — string
      game.name   — string
      game.version — string
      game.studio  — string
    
    Does NOT validate game-specific schemas beyond the required keys.
    Returns None on success (no return value).
    """
```

> ⚠️ RULE: validator.py checks the studio contract, not the game contract.
> Game-specific schema validation is the game's responsibility, not the studio's.

> ⚠️ RULE: All validation errors must name the missing or malformed field explicitly.
> "Missing field: game.id" not "Invalid data.yaml".

---

### studio/executor.py

Wraps lupa. Exposes Lua function calls as Python calls.

```python
import lupa
from lupa import LuaRuntime

class LuaError(Exception):
    pass

class Executor:
    def __init__(self, lua_source: str, seed: int = 42):
        """
        Initialize Lua VM with logic.lua source.
        Seed math.random with seed before loading source.
        """

    def call(self, fn_name: str, *args) -> object:
        """
        Call a Lua function by name with positional args.
        Converts Python dicts to Lua tables and back.
        Raises LuaError on Lua runtime error.
        Raises AttributeError if fn_name does not exist in Lua globals.
        """

    def get_global(self, name: str) -> object:
        """
        Read a Lua global value.
        Returns Python equivalent (str, int, float, dict, list).
        """
```

> ⚠️ RULE: All lupa imports and LuaRuntime construction are contained in executor.py.
> No other file imports lupa directly. If lupa is unavailable, the error surfaces
> here with a clear message: "lupa is required. Install with: pip install lupa"

> ⚠️ RULE: Lua tables returned from call() are converted to Python dicts before
> returning. No lupa table objects leak outside executor.py.

> ⚠️ RULE: RNG seed is set at Executor construction time. Tests always pass
> seed=42 for reproducibility. Never use math.random() inside Lua without
> prior seeding from the executor.

---

### studio/runtime.py

The public API. GameSession wraps loader + validator + executor.

```python
from dataclasses import dataclass
from studio.loader import GameFiles, load_game_files
from studio.validator import validate_data
from studio.executor import Executor

@dataclass
class GameSession:
    game_id: str
    files: GameFiles
    executor: Executor

def load_game(game_id: str, seed: int = 42) -> GameSession:
    """
    Load a game by ID. Returns a ready GameSession.
    Raises FileNotFoundError if game directory does not exist.
    Raises ValidationError if data.yaml fails studio contract.
    Raises LuaError if logic.lua fails to parse or execute on load.
    """

def call(session: GameSession, fn_name: str, *args) -> object:
    """
    Call a Lua function on the session.
    Thin wrapper over session.executor.call().
    """

def get_schema(session: GameSession, entity: str) -> dict:
    """
    Return the schema for a named entity from data.yaml.
    Example: get_schema(session, "horse") returns the horse field definitions.
    Raises KeyError if entity is not in data.yaml.
    """
```

> ⚠️ RULE: runtime.py is the only module that callers import. All internal
> implementation (loader, validator, executor) is an implementation detail.
> External code does: `from studio.runtime import load_game, call, get_schema`

---

## §3 Test Anchors

Target: **15 passing, 0 failing, 0 skipped**

All tests use fixture copies of the three game files in `tests/fixtures/`.
No tests read from `games/horse_racing/` directly — fixtures only.

| # | Test Name | File | Behavior |
|---|---|---|---|
| 1 | `test_load_game_files_returns_game_files` | test_loader.py | Returns GameFiles with correct game_id |
| 2 | `test_load_game_files_parses_data_yaml` | test_loader.py | data.yaml parsed to dict, game.id == "horse_racing" |
| 3 | `test_load_game_files_parses_ui_yaml` | test_loader.py | ui.yaml parsed to dict, game key present |
| 4 | `test_load_game_files_reads_lua_source` | test_loader.py | logic field is non-empty string containing "function" |
| 5 | `test_load_game_files_missing_dir_raises` | test_loader.py | FileNotFoundError on missing game_id |
| 6 | `test_validate_data_passes_valid_data` | test_validator.py (via test_loader) | No exception on valid data.yaml |
| 7 | `test_validate_data_missing_game_id_raises` | test_loader.py | ValidationError naming "game.id" |
| 8 | `test_executor_calls_clamp_function` | test_executor.py | clamp(5, 0, 10) returns 5 |
| 9 | `test_executor_clamp_enforces_min` | test_executor.py | clamp(-5, 0, 10) returns 0 |
| 10 | `test_executor_clamp_enforces_max` | test_executor.py | clamp(15, 0, 10) returns 10 |
| 11 | `test_executor_generate_horse_name_returns_string` | test_executor.py | generate_horse_name returns non-empty string |
| 12 | `test_executor_unknown_function_raises` | test_executor.py | AttributeError on missing fn_name |
| 13 | `test_runtime_load_game_returns_session` | test_runtime.py | load_game("horse_racing") returns GameSession |
| 14 | `test_runtime_call_clamp_via_session` | test_runtime.py | call(session, "clamp", 5, 0, 10) == 5 |
| 15 | `test_runtime_get_schema_returns_horse_fields` | test_runtime.py | get_schema(session, "horse") is a dict with "stats" key |

> ⚠️ RULE: No network calls in any test. No file I/O outside of fixtures directory.
> Fixtures are copied once at test setup — never read from games/ during test runs.

---

## §4 Completion Criteria

- [ ] Repo exists at `C:\Github\RFDGameStudio`
- [ ] Directory tree matches §1 structure exactly
- [ ] `pip install -r requirements.txt` succeeds with no errors
- [ ] `pytest` reports exactly 15 passed, 0 failed, 0 skipped (raw output)
- [ ] `from studio.runtime import load_game, call, get_schema` works in a Python shell
- [ ] `load_game("horse_racing")` returns a GameSession without error (manual test)
- [ ] `call(session, "clamp", 5, 0, 10)` returns `5` (manual test)
- [ ] `get_schema(session, "horse")` returns a dict with a `stats` key (manual test)
- [ ] `docs/state/current.md` updated to Phase 1 certified state

**Proof required:**
- Raw pytest terminal output showing `15 passed, 0 failed, 0 skipped`
- Terminal output of the three manual tests above

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Repo | `C:\Github\RFDGameStudio` |
| Python target | 3.11+ |
| Lua bridge | lupa |
| Runtime public API | `load_game()`, `call()`, `get_schema()` |
| Phase 1 floor | 15 / 0 / 0 |
| Phase 2 target | TypeScript runtime (fengari) |
| Game files location | `games/{game_id}/data.yaml`, `ui.yaml`, `logic.lua` |
| Test fixtures | `tests/fixtures/` — never `games/` directly |
| ADRs | 001–005 locked (see docs/adr/) |
| RNG seed in tests | Always 42 |
| lupa table rule | Convert to Python dict before returning from executor |

---

*RFDGameStudio Phase 1 | June 2026 | RFD IT Services Ltd.*
*New repo. Report directory tree before writing any code.*
