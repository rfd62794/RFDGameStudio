# ADR-024: The play loop is the studio's measure

## Status

Accepted 2026-11-09.

## Context

The engine tooling roadmap (`docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md`, principle 6) set the studio's measure as "demos shipped per month, not engine features". `docs/DIRECTION.md` names the purpose as a factory that turns ideas into finished, published games.

Evidence gathered 2026-11-09:

- Robert stopped working on the 2D demos on 2026-10-31 and reports that his tastes change too often to keep any one game in development.
- The tuning and bot-playtest modules are built, tested (73 passing across their ten test files at `82907284`) and adopted by two games each out of 43 game folders.
- The `/ROADMAP.md` "Now" section has been five graphics decisions awaiting Robert since September.
- What Robert has rebuilt several times, across projects, is one experience: playing a game while an agent designs, builds and fixes it.

A measure of demos shipped rewards the supply the studio already over-produces and ignores the one activity that has held Robert's attention.

## Decision

1. The studio's measure is **play sessions in which feedback landed**, logged in `docs/state/play-sessions.md`. A session counts when Robert plays a cartridge, makes at least one request (typed to the Overseer in the terminal, or through a play command), and at least one change from a request reaches a cartridge he then plays.
2. A **cartridge** is a game folder under `ts/src/games/<id>/` that satisfies the play-loop contract: a `tuning.ts` with at least one knob, one target and a `simulate`; a `playtest.ts` adapter; and a state snapshot provider. Games outside the contract stay in the catalog and are unaffected.
3. Cartridges are disposable. Retiring one follows the existing retirement pattern (source preserved, removed from the loop list). Starting one is cheap by design and is not a commitment to finish it.
4. No change from an agent reaches a play session without passing the gate: tuning targets under the proposed values, and the bot-playtest invariants.
5. Requests are made in the terminal. Robert says what he wants in plain language to the Overseer, which files it; the underlying play commands are also callable directly by Robert, the Overseer persona, or an agent. Each request becomes a directive in the AgentFlow queue for the cartridge it concerns, and Robert can switch to another cartridge while it is built.
6. Requests for a cartridge in the loop are pre-authorised for dispatch, limited to that cartridge's own folder (Robert, 2026-11-09).
7. Engine features continue to enter only by extraction (roadmap principle 1). The play loop adds no exception to that rule.

## Consequences

- Supersedes principle 6 of the engine tooling roadmap. Principles 1–5, 7 and 8 stand.
- Demos shipped, graphics style work and per-demo documentation are no longer priorities by default. They return when a play session asks for them.
- Dev overrides still never ship to players (`?dev=1` gate, tuning spec §e). Requests live in the AgentFlow queue; state snapshots and knob proposals are local files under `.play/`, which is git-ignored; nothing is sent to a backend (roadmap principle 5 stands).
- The Python/Lua Studio MCP is not extended for this. The agent's view of a TS-native game is the playtest adapter and the note snapshot.
- Deferred: fixed-step loop, replay and the debug overlay (roadmap E1/E2) remain unbuilt until a play session shows a need for pause, step or replay.
- This ADR does not change ADR-010, ADR-013, ADR-014 or ADR-017.
