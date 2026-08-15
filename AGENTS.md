# AGENTS.md — RFDGameStudio

Guidance for AI agents (Devin, Claude, Cline, etc.) working in this repo.
Read this before making changes. Verify against the primary docs below
when in doubt — this file is a map, not the territory.

## Primary docs (read these for the real story)

- `docs/sdd/RFDGameStudio_SDD_v0_4.md` — **current** System Design Document.
  v0.1–v0.3 are archived. v0.4 supersedes v0.3 *same-day* — v0.3 itself had
  a real gap (missed ADR-009 and ADR-011, which had already partially
  resolved a tension it flagged as open) and a second gap found and fixed
  within v0.4 itself (an `artGen` consumption claim that was wrong — see
  below). Check the file's own date before trusting any SDD reference you
  find elsewhere in the repo, including other agent-written docs — this
  file included.
- `docs/adr/ADR-014-shared-engine-modules-default.md` — **read this before
  citing ADR-005 for anything.** ADR-005 ("no shared binary") was already
  superseded by ADR-009 for generic utilities (July 2026), and is now
  further superseded by ADR-014 (Aug 15, 2026) for genuine game-system
  patterns too. Shared engine modules (`engine/systems/` in Lua,
  `ts/src/engine/shared/` and `ts/src/engine/artGen/` in TS) are the
  studio's **default posture**, not a demand-gated exception. If you see
  "ADR-005" cited anywhere as the still-governing rule against sharing —
  including elsewhere in this file — treat it as stale.
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
- `engine/` — Lua engine modules for the four-file contract. Per ADR-014,
  checking here before writing new game-specific logic is standard
  practice now, not an optional courtesy.
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
- `ts/src/engine/shared/` — shared game-system logic. Per ADR-014, this is
  first-class, not a narrow exception — check here first, contribute
  back when a genuinely general capability with a real known second use
  is recognized.
- `ts/src/engine/artGen/` — shared art generation. **Built AND consumed —
  verify this yourself before trusting any other doc's claim otherwise.**
  Confirmed via direct file read (Aug 15, 2026): `ts/src/games/shoal/App.tsx`
  imports and actively uses `canvasTeardropFinPath`/`canvasRadialBurstPath`/
  `canvasIrregularFragmentPath` with its own `art/shoal.config.ts`;
  `ts/src/games/slimeworld/components/SlimeVisual.tsx` imports
  `mulberry32`/`hashStringToSeed`/`renderPolygonPoints`, verified
  byte-identical by its own tests. This is ADR-014's realized proof case,
  not an open task.
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
  extraction) → Stage 5 verify.
- **AI-Studio-origin track** (SDD v0.4 §7): games that live outside
  `registry.ts` are a legitimate permanent category, not a backlog to
  clear. Don't push one into the registry before it's ready on its own
  terms.
- **Shared code (ADR-014, supersedes the ADR-005-only framing):** check
  the shared engine layer first, in both runtimes, before writing new
  logic. Contribute back when a genuinely general capability is
  recognized with a real, current second use already known or clearly
  likely — this is standard practice now, not a rare audit-justified
  exception. Pure speculation with no real second use still isn't
  authorized; only the default posture changed.
- **Comments:** do not add or remove comments unless asked. If an edit
  accidentally deletes an existing comment, restore it.
- **Commits:** see the Devin commit format in the system prompt. Don't
  push unless asked. Don't commit if there's nothing staged.

## Status Unconfirmed — verify before assuming

The Status Board flags items as **Status Unconfirmed** where current state
can't be verified from history. Before treating any of these as
ground truth, check the project's own `docs/state/` file or ask. Don't
inherit stale assumptions either direction — and don't assume a "Status
Unconfirmed" or "built but not consumed" claim in *any* doc, including
this one, is still accurate without checking the real files. This file
had two real errors (SDD version, `artGen` consumption) on the day it was
written, both from the same failure mode: citing a prior document instead
of the live repo state.

## What this repo is not

Per SDD v0.4 §8: not a game engine, not a framework, not a package, not a
platform. It's a format contract + a runtime library + a catalog. The
games are the product; the studio is the factory.
