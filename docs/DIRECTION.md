# Direction: RFDGameStudio

> Note on location: this file sits next to the swarm-facing
> `docs/ROADMAP.md`. The studio's prose roadmap of record is
> [`/ROADMAP.md`](../ROADMAP.md) at the repo root, per ADR-017's
> four-document architecture.

## Purpose

A game definition format plus a multi-runtime contract and a catalog —
"not a game engine, not a framework, not a package, not a platform"
(`docs/sdd/RFDGameStudio_SDD_v0_4.md` §8; `README.md`). One format, three
runtimes, same game files unmodified across them (`README.md`). The
games are the product; the studio is the factory (SDD v0.4 §8, quoted in
`AGENTS.md`).

## Current state

- Two code surfaces (`AGENTS.md`): the Python/Lua four-file contract
  (`studio/`, `studio_mcp/`, `engine/`, `games/<game_id>/`) and the
  TS-native runtime (`ts/`), which is the current default for TS-origin
  games (ADR-010, ADR-013).
- `RFDStudioMCP` certified 28/0/0, port 8025, NSSM-registered
  (`docs/state/StatusBoard.md` §5).
- Shared engine modules are the default posture in both runtimes —
  `engine/systems/` (Lua), `ts/src/engine/shared/` and
  `ts/src/engine/artGen/` (TS) — per ADR-014; `artGen` is built AND
  consumed by Shoal and SlimeWorld (verified in `AGENTS.md`, Aug 15 2026).
- Live catalog: 11 games, a mix of Active and Shipped/Mature; 4 retired
  with source preserved; 5 projects at Status Unconfirmed
  (`docs/state/StatusBoard.md`, generated from
  `ts/src/status/board.data.ts`).
- Test floor: 1649/1654 vitest tests passing (137 files), 5 failures a
  known `dist-shoal` build race that passes in isolation
  (`docs/status.md`, Sep 3 2026). Python suite: 588 passed / 1 failed /
  31 deselected (`docs/state/current.md`, Aug 30 2026).
- Documentation follows ADR-017's four-document split:
  `/CHANGELOG.md`, `/ROADMAP.md`, `docs/adr/`, `docs/status.md`.

## Next steps

Drawn from `/ROADMAP.md` and `docs/state/StatusBoard.md` — see the
machine-readable milestones in `docs/ROADMAP.md`:

- **Arcade-exit defect.** `gladiator_arena`, `house_of_kings_collab` and
  `voiddrift_redux` are published but ship no `GameShell`/arcade exit —
  the Shared UI Wave 1 directive (Blocked 2026-09-20, work unlanded)
  documents this; verified by grep 2026-09-22.
- **Global arcade build.** `cd ts && npm run build` still fails on
  pre-existing TypeScript errors in `horse_racing`,
  `mutant_battle_ball`, `slither_rogue` (`/ROADMAP.md`, Studio-Wide).
- **Status Unconfirmed rows.** VoidDrift, SlimeGarden, Trinity Siege,
  7 Days to Fry, TurboShells each need a direct status check
  (`docs/state/StatusBoard.md` §§2-3).
- **Mutant Battle Ball balance.** Parts-summing vs flat stats produces
  2-3x inflated stats; named the first item before deeper design work
  (`/ROADMAP.md`, Now).
- **Robert-only decisions** (not swarm work): Paper Doll technique
  winner, Bézier POC verdict, itch.io Draft→Public toggles
  (`docs/status.md`).

## Definition of done

- Game logic stays pure — no I/O, no rendering — in `logic.lua` and in
  TS-native logic alike (`AGENTS.md` conventions).
- Verified by the repo's own runners: `cd ts && npx vitest run` for TS,
  `uv run pytest` for Python (`AGENTS.md`).
- Dated staleness claims carry a verification method (ADR-016).
- Retiring a game means removing it from `ts/src/games/registry.ts`
  while preserving source read-only, plus a retirement directive —
  never a silent delete (`AGENTS.md`).

## Do not

- Do not translate TS/React prototypes to Lua; TS-native is the default
  (ADR-010, ADR-013). VoidDrift and TurboShells are the named
  cross-language exceptions (`AGENTS.md`).
- Do not unify game palettes or visual identity in shared-UI passes, and
  do not touch log/event-history panels — four incompatible field sets,
  and Gladiator Arena's log drives combat timing
  (`docs/directives/Shared_UI_Wave1_Directive.md` §4).
- Do not put game logic in a game's TS layer where the game is
  YAML-data + Lua-logic; Dissonance's `types.ts` is types only
  (`docs/directives/Brewfield_Into_Dissonance_Directive.md` §2).
- Never delete or rewrite ADRs; never delete a retired game's source
  (`AGENTS.md`, ADR-017).

## Sources of truth

- `docs/sdd/RFDGameStudio_SDD_v0_4.md` — current SDD.
- `docs/adr/` — ADR-001 … ADR-023; ADR-014 governs shared code.
- `/ROADMAP.md` — prose roadmap of record (Now / Next / Later).
- `/CHANGELOG.md` + per-project `CHANGELOG.md` files — what changed.
- `docs/status.md` — short current status; `ts/src/status/board.data.ts`
  → `docs/state/StatusBoard.md` — studio rollup (project state files win
  on disagreement).
- `ts/src/games/registry.ts` — the live catalog.
- `AGENTS.md` — build/test commands and conventions.

```yaml direction
version: 1
answered: 2026-09-23 robert-claude
purpose: The factory that turns game ideas and AI Studio drops into finished, playable games published to the arcade and itch.
done_when:
- An AI Studio drop becomes a playable, tested arcade game with one command
- Every published game shares the UI, including a way back to the arcade
- The suite passes with no skips and the untested-module backlog is cleared
- Arcade and itch publishing runs without manual steps
do_not:
- Never publish a game that doesn't load, or break one that is already live
- No paid art or asset generation without approval
audience: players
hours_per_week: 1-3
stakes: medium
```
