# RFDGameStudio

**A game definition format and runtime contract.**

One format. Three runtimes. Claude as a first-class participant.

---

## The Core Idea

Every game is three files:

```
games/{game_id}/
  data.yaml     — entities, constants, tables, schemas
  ui.yaml       — layout intent (renderer-agnostic)
  logic.lua     — pure logic, no I/O, no rendering
```

The same three files run in TypeScript (fengari), Python (lupa), and Rust (mlua).
Adding a runtime means implementing the bridge — never touching the game files.

---

## Quick Start

```bash
pip install -r requirements.txt
pytest tests/
```

### Run a headless race (Python REPL)

```python
from studio import load_game, call_with_args

session = load_game("horse_racing", rng_seed=42)
lua = session.executor._lua

# Generate two horses
genome_a = call_with_args(session, "generate_genome")
genome_b = call_with_args(session, "generate_genome")
stats_a = call_with_args(session, "derive_stats", lua.table_from(genome_a))
stats_b = call_with_args(session, "derive_stats", lua.table_from(genome_b))

field = [
    {"id": "Thunderbolt", "stats": stats_a},
    {"id": "Silver Mane", "stats": stats_b},
]
lua_field = lua.table_from([lua.table_from(h) for h in field])

order = call_with_args(session, "resolve_race", lua_field, 1200, 0.04, 0.12)
print("Winner:", order[0])
```

---

## Directory Structure

```
RFDGameStudio/
  games/
    horse_racing/
      data.yaml
      ui.yaml
      logic.lua
  studio/
    __init__.py
    loader.py       — reads and validates three files
    executor.py     — wraps lupa, exposes Lua function calls
    runtime.py      — GameSession, load_game(), call(), get_schema()
    validator.py    — schema validation for data.yaml
  tests/
    test_loader.py
    test_executor.py
    test_runtime.py
  docs/
    adr/
      ADR-001.md … ADR-005.md
    state/
      current.md
  README.md
  requirements.txt
```

---

## Phase Roadmap

| Phase | Title | Status |
|---|---|---|
| 1 | Python Runtime Core | **In Progress** |
| 2 | TypeScript Runtime | Pending |
| 3 | Claude Tool Integration | Pending |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |

---

## Architectural Decisions

See [`docs/adr/`](docs/adr/) for the full decision log.
Key decisions: three-file format (ADR-001), Lua as logic layer (ADR-002),
Python first (ADR-003), Claude as participant (ADR-004),
patterns not binaries (ADR-005).

---

*RFD IT Services Ltd. | June 2026*
