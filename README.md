# RFDGameStudio

**A game definition format and multi-runtime contract.**

One format. Three runtimes. Claude as a first-class participant.

---

## What It Is

RFDGameStudio is not a game engine. It is a **game definition format** and a **runtime contract** that lets the same game logic run identically in Python, TypeScript, and Rust — with no changes to the game files between runtimes.

Every game is three files:

```
games/{game_id}/
  data.yaml     — entities, constants, schemas, lookup tables
  ui.yaml       — layout intent (renderer-agnostic)
  logic.lua     — pure logic: no I/O, no rendering, no side effects
```

Adding a new runtime means implementing the bridge — never touching the game files.

---

## Requirements

- Python 3.11+
- [`lupa`](https://pypi.org/project/lupa/) — Python ↔ Lua bridge (requires Lua 5.4 headers)

```bash
pip install -r requirements.txt
```

---

## Quick Start

```bash
pip install -r requirements.txt
pytest tests/
```

> **Note:** the expected test count below is stale — see the flagged
> README refresh in `docs/state/StatusBoard.md`. Do not trust "15 passed"
> as current; check `docs/state/current.md`'s tail for the real floor.

### Load a game (Python)

```python
from pathlib import Path
from studio.runtime import load_game, call, get_schema

session = load_game("horse_racing", seed=42, games_dir=Path("tests/fixtures"))

# Call a pure Lua function
result = call(session, "clamp", 5, 0, 10)   # → 5

# Read an entity schema from data.yaml
schema = get_schema(session, "horse")        # → dict with 'stats', 'career', …
```

### Generate a horse name

```python
prefixes = ["Midnight", "Golden", "Silver"]
suffixes = ["Storm", "Dancer", "Bullet"]
name = call(session, "generate_horse_name", prefixes, suffixes)
print(name)   # e.g. "Golden Storm"
```

---

## The Runtime Bridge Contract

Every runtime exposes the same three functions:

| Function | Description |
|---|---|
| `load_game(game_id, seed)` | Load three files, validate, initialise Lua VM |
| `call(session, fn_name, *args)` | Call a Lua function, return plain Python object |
| `get_schema(session, entity)` | Return entity field definitions from `data.yaml` |

---

## Directory Structure

> **Note:** this section predates significant studio growth (94 TS test
> files / 994+ tests as of the latest `docs/state/current.md` entry, vs.
> the snapshot below) — real, needs a dedicated refresh pass, not patched
> here. Structure shown is the June 2026 baseline, still substantially
> accurate for the Python core, not for the TS side.

```
RFDGameStudio/
  games/
    horse_racing/
      data.yaml       — game metadata, horse schema, lookup tables
      ui.yaml         — tab layout, component bindings, event names
      logic.lua       — clamp, generate_horse_name, breed_horses, calculate_odds, …
  studio/
    __init__.py
    loader.py         — GameFiles dataclass, load_game_files(), FileNotFoundError contract
    validator.py      — ValidationError, validate_data() checks game.id/name/version/studio
    executor.py       — Executor class, all lupa imports contained here
    runtime.py        — GameSession, load_game(), call(), get_schema() — sole public API
  tests/
    fixtures/
      horse_racing/   — isolated copies of game files used by all tests
    test_loader.py    — tests 1–7  (loader + validator)
    test_executor.py  — tests 8–12 (executor: clamp, generate_horse_name, error handling)
    test_runtime.py   — tests 13–15 (runtime integration)
  docs/
    adr/              — ADR-001 … ADR-014 (locked)
    sdd/              — System Design Document (v0.4 current; v0.1–v0.3 archived)
    directives/       — Phase directives
    state/
      current.md      — live phase status
      StatusBoard.md  — studio-wide status rollup (refreshed at checkpoints)
  examples/
    lua/              — canonical game files (source of truth for games/)
    horse-racing-&-breeding/   — original TypeScript prototype
  requirements.txt
  README.md
```

---

## Phase Roadmap

> **Note:** stale — Phase 2 (TypeScript Runtime) and Phase 3 (Claude MCP
> Integration / `RFDStudioMCP`) are confirmed complete elsewhere in this
> project's history but not verified against primary source in this pass.
> Left as-is rather than guessed at. Needs direct confirmation, not a
> patch riding on an unrelated change.

| Phase | Title | Status |
|---|---|---|
| **1** | Python Runtime Core | ✅ **Certified** — 15/0/0 |
| 2 | TypeScript Runtime | Pending |
| 3 | Claude Tool Integration | Pending |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |

---

## Architectural Decisions

**Fourteen ADRs govern the studio** (this line was stale at "five" — see
[`docs/adr/`](docs/adr/) for the complete, current set). Key ones:

| ADR | Decision |
|---|---|
| [ADR-001](docs/adr/ADR-001.md) | Three-file format is the canonical game definition |
| [ADR-002](docs/adr/ADR-002.md) | Lua is the logic layer across all runtimes |
| [ADR-005](docs/adr/ADR-005.md) | Component systems as named patterns — **superseded, see ADR-009 and ADR-014** |
| [ADR-009](docs/adr/ADR-009.md) | Shared Lua utility primitives are permitted (supersedes ADR-005 for utilities) |
| [ADR-011](docs/adr/ADR-011.md) | Logic-layer modularization by real SRP threshold |
| [ADR-014](docs/adr/ADR-014-shared-engine-modules-default.md) | Shared engine modules are the default in both runtimes, not the exception |

---

## Component Systems

Eight proven primitives extracted from prior projects. **As of ADR-014
(August 15, 2026), shared engine modules are the studio's default
posture in both runtimes** — check `engine/primitives/` + `engine/systems/`
(Lua) or `ts/src/engine/shared/` (TypeScript) before writing new game
logic, and contribute back when a genuinely general capability is
recognized with a real second use already known or likely. This replaces
the line previously here ("no shared binary, no import") — see ADR-014
for the full decision and what changed.

| System | What It Does |
|---|---|
| GeneticsSystem | Genome generation, inheritance, trait expression |
| StatSystem | Six-stat block, culture amplification |
| OddsSystem | Race probability weighting, outcome resolution |
| DispatchSystem | Entity routing, mission assignment, cooldown management |
| ResourceSystem | Funds, slots, inventory, transformation chains |
| EventBus | Named event dispatch, decoupled state change |
| CultureSystem | Six-culture wheel, expression weights |
| BreedingSystem | Parent selection, offspring generation, generation tracking |

---

## Publishing

Deploying a game to itch.io is owned by a sibling repo, `RFD_IT_Publishing`
— see [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the interface contract
and `scripts/publish.py` for the validate-then-point entry command.

---

## License

MIT — see [`LICENSE`](LICENSE).

---

*RFD IT Services Ltd. | June 2026 | Component Systems and ADR sections updated August 15, 2026 — remainder of this README (Phase Roadmap, Directory Structure, Quick Start test count) is confirmed stale and flagged in place rather than guessed at. Needs its own dedicated refresh pass.*
