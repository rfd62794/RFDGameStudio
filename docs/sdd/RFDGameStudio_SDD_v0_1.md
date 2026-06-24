# RFDGameStudio — System Design Document v0.1

*June 2026 | RFD IT Services Ltd. | Living document. ADRs are permanent.*

---

## 1. Studio Identity

RFDGameStudio is not a game engine. It is a game definition format and a runtime
contract that lets the same game logic run in TypeScript, Python, and Rust — with
Claude as a first-class participant at every layer.

The studio exists because five years of game projects kept reinventing the same
primitives. Every project had genetics. Every project had a dispatch system. Every
project had stats. The primitives were right. The reuse was zero.

RFDGameStudio fixes that. One format. Proven components. Multiple runtimes. Claude
reads the same files the runtimes do.

**The core insight:** A game defined in three files that any language can load is a
game that can be prototyped in TypeScript on a Tuesday, ported to Rust on a Friday,
and explained to Claude in a prompt that just says "read data.yaml, ui.yaml, and
logic.lua."

---

## 2. The Three-File Contract

Every game in the studio is defined by exactly three files. No more. No exceptions.

```
games/
  [game_id]/
    data.yaml     — entities, constants, tables, schemas
    ui.yaml       — layout intent (renderer-agnostic)
    logic.lua     — pure logic, no I/O, no rendering
```

### 2.1 data.yaml

The source of truth for all game state schemas, constants, and configuration tables.
No logic. No rendering. Pure data.

Rules:
- All numeric constants live here. Never hardcoded in logic or renderers.
- All entity schemas live here. The runtime validates game state against them.
- Lookup tables (coat colors, race classes, XP tables) live here.
- Renderer reads `ui.yaml`. Logic reads `data.yaml` values via the runtime bridge.

### 2.2 ui.yaml

Layout intent for the renderer. Describes *what* the UI means, not *how* it looks.
Each runtime interprets it in its own visual language: React components in TypeScript,
egui panels in Rust, tkinter windows in Python.

Rules:
- Tab structure, component types, data bindings — all here.
- No pixel values. No colors. No fonts. Those belong to the renderer.
- Component types are a closed vocabulary: `label`, `stat_bar`, `stat_display`,
  `action_button`, `horse_card_grid`, `race_track`, `betting_panel`, etc.
- Events are named strings: `place_bet`, `start_race`, `breed_horses`. The runtime
  wires them to logic functions.

### 2.3 logic.lua

All game logic. Pure functions. No I/O. No rendering. No side effects.
Runs identically in TypeScript (fengari), Python (lupa), and Rust (mlua).

Rules:
- Every function is pure: same inputs → same outputs.
- The runtime provides `math.random()` seeded externally. Lua never seeds itself.
- No file I/O inside Lua. State passes in via function arguments, returns via
  return values.
- Claude can read this file and reason about game balance without running anything.

### 2.4 Contract Guarantees

The studio guarantees:
1. Any game defined in three files runs on any supported runtime.
2. Claude can read the three files and accurately describe the game's behavior.
3. The Lua logic file is the single source of truth for rules. Renderers never
   implement rules. Runtimes never duplicate rules.
4. Adding a new runtime requires implementing the runtime bridge only — never
   touching the three game files.

---

## 3. Component System Registry

These are the proven primitives extracted from five years of prior projects.
Each is battle-tested. None is being invented for the studio.

| System | Origin Project | What It Does |
|---|---|---|
| GeneticsSystem | TurboShells, horse_racing | Genome generation, inheritance, trait expression |
| StatSystem | rpgCore, OperatorGame | Six-stat block (VIT/PWR/AGI/MND/RES/CHM), culture amplification |
| OddsSystem | horse_racing | Race simulation, probability weighting, outcome resolution |
| DispatchSystem | VoidDrift, OperatorGame | Entity routing, mission assignment, cooldown management |
| ResourceSystem | rpgCore | Funds, slots, inventory, transformation chains |
| EventBus | VoidDrift | Named event dispatch, listener registration, decoupled state change |
| CultureSystem | rpgCore, OperatorGame | Six-culture wheel, expression weights, stat amplification |
| BreedingSystem | TurboShells, horse_racing | Parent selection, offspring generation, generation tracking |

Each system is defined in `logic.lua` for the game using it. The registry entries
above describe *what each system does* — not a shared library. Individual games
implement the systems they need in their own Lua file. The studio's job is to name
the patterns, not to provide a shared binary.

---

## 4. Runtime Targets

Three runtimes. One format. Lua runs in all three.

| Runtime | Language | Lua Bridge | Use Case |
|---|---|---|---|
| Python | Python 3.11+ | lupa | rpgCore migrations, data analysis, headless sim |
| TypeScript | TypeScript + Vite | fengari (WASM) | Rapid prototyping, browser play, itch.io |
| Rust | Rust 2021 | mlua | Production mobile (Android), WASM high perf |

### 4.1 Runtime Bridge Contract

Every runtime implements the same bridge interface:

```
load_game(game_id: str) -> GameSession
  Reads data.yaml + ui.yaml + logic.lua from games/{game_id}/
  Validates data.yaml against schema
  Initializes Lua VM with logic.lua
  Returns opaque GameSession handle

call(session: GameSession, fn: str, args: dict) -> dict
  Calls Lua function fn with args
  Returns Lua return value as dict
  Raises RuntimeError on Lua error

get_schema(session: GameSession, entity: str) -> dict
  Returns entity schema from data.yaml
  Used by renderers to build UI components
```

### 4.2 Primary Runtime: Python

Python is Phase 1. Reasons:
- rpgCore exists in Python (1,122 tests, proven genetics, stat system)
- lupa is mature and well-tested
- Headless simulation runs fastest in Python
- No build step — immediate feedback loop

TypeScript is Phase 2 (rapid prototyping target).
Rust is Phase 3 (production target via VoidDrift chassis).

---

## 5. Claude's Role

Claude is a first-class participant, not a code generator.

In the studio model, Claude operates at three levels:

**Director:** Reads the three files for any game and reasons about balance, gaps,
and progression without running any code. Can suggest Lua function changes and
data.yaml constant adjustments from first principles.

**Co-designer:** Given a design prompt, generates a new three-file game definition.
The horse racing sim was built in Google AI Studio in under an hour. The pattern
generalizes: prompt → three files → playable game.

**Pipeline participant:** During live sessions, Claude calls the Python runtime via
tool calls, executes Lua functions, and reports results. Can run headless simulations
(1,000 races, report outcome distribution) without a browser or renderer.

This is what "Claude as first-class participant" means in practice: the format is
readable enough that Claude can do real work on it, not just generate scaffolding.

---

## 6. Architectural Decision Records

### ADR-001: Three-File Format Is the Canonical Game Definition

**Status:** Accepted

**Context:** Prior projects defined games entirely in code (rpgCore: Python classes;
OperatorGame: Rust structs; horse_racing: TypeScript components). Porting between
languages required full rewrites.

**Decision:** Every game is defined in data.yaml + ui.yaml + logic.lua. The three
files are the game. Runtimes implement them. No exceptions.

**Consequences:** New games require three files before any runtime exists. Runtimes
are forbidden from implementing game rules outside Lua. The format is locked — new
fields require an ADR, not a silent schema change.

---

### ADR-002: Lua Is the Logic Layer

**Status:** Accepted

**Context:** Game logic needed to run in TypeScript, Python, and Rust without
duplication. JSONLogic was evaluated and rejected (insufficient expressiveness for
breeding and race simulation). Python was evaluated and rejected (not embeddable
in Rust). JavaScript was evaluated and rejected (TypeScript-only).

**Decision:** Lua is the logic layer. fengari in TypeScript, lupa in Python, mlua
in Rust. The same .lua file runs in all three.

**Consequences:** Game designers write Lua. All logic functions must be pure — no
I/O, no side effects. The runtime seeds the RNG before calling any Lua function.

---

### ADR-003: Python Is the Phase 1 Runtime

**Status:** Accepted

**Context:** Three runtimes are planned. Phase 1 must ship a working runtime
without a build step. rpgCore's existing test patterns are reusable.

**Decision:** Python runtime ships first. TypeScript runtime is Phase 2. Rust
runtime is Phase 3.

**Consequences:** Phase 1 is headless — no renderer. Game state is Python dicts.
The Python runtime is not the production target; it is the proof-of-contract target.

---

### ADR-004: Claude Is a First-Class Participant

**Status:** Accepted

**Context:** The three-file format was designed to be readable by humans and by
Claude. Claude can execute tools that call the Python runtime directly.

**Decision:** The studio's design standard requires that any game defined in three
files must be explainable to Claude in a single prompt with no additional context.
If Claude cannot reason about the game from the three files alone, the game is
under-specified.

**Consequences:** data.yaml must include human-readable descriptions for all
schema fields. logic.lua must include function-level comments. ui.yaml component
types must use plain English identifiers.

---

### ADR-005: Component Systems Are Named Patterns, Not Shared Binaries

**Status:** Accepted

**Context:** The temptation is to build a shared library of GeneticsSystem,
StatSystem, etc. and import them into each game. This creates coupling and versioning
problems.

**Decision:** Component systems are named patterns documented in the studio SDD.
Each game implements the patterns it needs in its own logic.lua. No shared binary.
No import. The names exist to communicate design intent.

**Consequences:** Two games implementing GeneticsSystem will have different Lua code.
That is correct. The pattern is the guarantee, not the implementation.

---

## 7. Directory Structure

```
RFDGameStudio/
  games/
    horse_racing/
      data.yaml
      ui.yaml
      logic.lua
  studio/
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

## 8. Phase Roadmap

| Phase | Title | Deliverable |
|---|---|---|
| 1 | Python Runtime Core | loader + executor + runtime, 15/0/0 floor, horse_racing game runs headless |
| 2 | TypeScript Runtime | fengari bridge, same horse_racing game runs in browser |
| 3 | Claude Tool Integration | Claude calls runtime via MCP, runs simulations, reports results |
| 4 | Second Game | New three-file game definition using GeneticsSystem |
| 5 | Rust Runtime | mlua bridge, same game runs on Android via VoidDrift chassis |

---

## 9. What This Is Not

- Not a game engine. Does not manage rendering, physics, or input.
- Not a framework. Does not impose application structure on renderers.
- Not a package. Does not ship to PyPI or npm (yet).
- Not a platform. Does not host games or manage distribution.

The studio is a format contract and a runtime library. The games are the product.
The studio is the factory.

---

*RFDGameStudio SDD v0.1 | June 2026 | RFD IT Services Ltd.*
*Director: Claude | Pipeline: SDD + Directives | Agent: Cline/Windsurf*
