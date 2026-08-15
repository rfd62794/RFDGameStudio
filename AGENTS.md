# AGENTS.md — RFDGameStudio

Guidance for AI agents (Devin, Claude, Cline, etc.) working in this repo.
Read this before making changes. Verify against the primary docs below
when in doubt — this file is a map, not the territory.

## Primary docs (read these for the real story)

- `docs/sdd/RFDGameStudio_SDD_v0_3.md` — **current** System Design Document.
  v0.1 and v0.2 are archived amendments; v0.3 is the full rewrite and the
  authoritative narrative. ADRs supersede narrative sections — when an ADR
  changes something, update the SDD section text too, not just the ledger.
- `docs/state/StatusBoard.md` — studio-wide status rollup, refreshed at
  checkpoints. Per-project `docs/state/current.md` files remain source of
  truth; if a project's own state file disagrees with the board, the
  project file wins.
- `docs/adr/` — ADR ledger. ADRs are permanent; never delete one.
- `docs/directives/` and `docs/gdd/` — phase directives and game design docs.
- `README.md` — original Phase 1-era overview; partially stale for the
  TS-native era. Trust the SDD over the README where they conflict.

## Two code surfaces, one repo

This repo has two distinct code surfaces. Know which one you're in.

### 1. Python/Lua runtime (the original contract)

- `studio/`, `studio_mcp/` — Python runtime + MCP server (`RFDStudioMCP`,
  port 8025, NSSM-registered, certified 28/0/0).
- `engine/` — Lua engine modules for the four-file contract.
- `games/<game_id>/` — Lua-backed games: `data.yaml`, `ui.yaml`,
  `logic.lua`, `systems.yaml` (four-file contract per ADR-006).
- `tests/` — pytest suite. Markers in `pyproject.toml`: `slow`, `e2e`,
  `shared`, plus per-game markers (`brewfield`, `shoal`, `slimeworld`, …).
- Python 3.12, managed with `uv` (`uv.lock`, `.python-version`).

### 2. TypeScript-native runtime (the current default)

- `ts/` — Vite + React + TypeScript + Tailwind v4 + Vitest.
- `ts/src/games/` — TS-native games. `registry.ts` is the live catalog;
  retiring a game means removing it from `registry.ts` while preserving
  its source directory read-only (never delete source).
- `ts/src/engine/shared/` — demand-gated shared logic (ADR-005: extract
  only after *confirmed* duplication, never speculatively).
- `ts/src/engine/artGen/` — shared art generation; built but **not yet
  consumed** by Shoal or SlimeWorld. Don't cite it as done.
- `ts/src/ui/components/` — shared UI library (ADR-008). Check here before
  writing bespoke chrome for any new game.
- Standalone packaging: `vite.standalone.factory.ts` +
  `generate-standalone-entry.ts`; publishing via the separate
  `C:\Github\RFD_IT_Publishing` (Butler-based).

## Build / test commands

### TypeScript (`ts/`)

```
cd ts
npm run dev                       # arcade dev server
npm run build                     # tsc + vite build (arcade)
npm run build:<game>              # per-game standalone build, e.g. build:shoal
npm test                          # vitest run (TS-native logic tests)
npm run test:watch                # vitest watch
```

Per-game build scripts exist for: `dissonance`, `shoal`, `slimeworld`,
`chimera_wilds`, `mutant_battle_ball`, `scrapcrawl`, `slime_coin`,
`planetofgreed`.

### Python (repo root)

```
uv sync                           # install deps from uv.lock
uv run pytest                     # full suite
uv run pytest -m "not slow"       # skip slow tests
uv run pytest -m "not e2e"        # skip L3 browser e2e
uv run pytest -m shoal            # one game's tests
uv run studio-mcp                 # run RFDStudioMCP server
```

## Conventions

- **TS-native is the default** for TS-origin games (ADR-010, ADR-013).
  Don't translate a TS/React prototype to Lua unless its real origin
  genuinely requires cross-language portability (VoidDrift, TurboShells).
- **Logic purity:** game logic is pure functions, no I/O, no rendering —
  same discipline in `logic.lua` and TS-native logic. Verified via pytest
  (Lua) or vitest (TS).
- **Retirement pattern:** preserve source in place, remove from
  `registry.ts`, write a retirement directive stating the removal as a
  real action. Never silently delete a game directory.
- **Conversion pipeline** (`examples/` → `ts/src/games/`, ADR-012):
  Stage 3 scaffold → Stage 4 convert (with any warranted shared-code
  extraction per ADR-005) → Stage 5 verify.
- **AI-Studio-origin track** (SDD v0.3 §7): games that live outside
  `registry.ts` are a legitimate permanent category, not a backlog to
  clear. Don't push one into the registry before it's ready on its own
  terms.
- **Shared code:** audit for *confirmed* duplication first, extract only
  what's proven. Speculative shared abstractions violate ADR-005.
- **Comments:** do not add or remove comments unless asked. If an edit
  accidentally deletes an existing comment, restore it.
- **Commits:** see the Devin commit format in the system prompt. Don't
  push unless asked. Don't commit if there's nothing staged.

## Status Unconfirmed — verify before assuming

The Status Board flags items as **Status Unconfirmed** where current state
can't be verified from history. Before treating any of these as
ground truth, check the project's own `docs/state/` file or ask. Don't
inherit stale assumptions either direction.

## What this repo is not

Per SDD v0.3 §8: not a game engine, not a framework, not a package, not a
platform. It's a format contract + a runtime library + a catalog. The
games are the product; the studio is the factory.
