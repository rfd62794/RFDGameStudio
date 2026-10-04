# voidrift_station_sim direction (2026-10-04)
## What it tried to be
`space_mining_sandustry` (roadmap `docs/RFDGameStudio_DemoPortingRoadmap.md:87`): a station-building and chemical-synthesis game with modules, compounds, containers with integrity, signal bottles and a "universe reconstruction" finale (`examples/voidrift-redux-station-sim/metadata.json`; types Compound, ContainerSlot, ModuleType). Built in AI Studio, then continued by agents: its `docs/state/current.md` records Phase 2 done, certified floor 62/0/0, Phase 3 next. Tracked on main only since 0c416b4f (2026-10-04, "track all of examples/"), a single commit. Never registered, never ported.
## Where it is now
- Not registered; no `ts/src/games/voidrift_station_sim`; no port directive in `docs/directives`.
- 56 tracked files, 10,049 TS/TSX lines; 7 test files under `examples/voidrift-redux-station-sim/tests/`.
- Two codebases in one folder: `src/` (AI Studio original, `simulation.ts` 1,023 lines) and a studio-shaped copy `ts/src/games/voidrift_redux/` whose id is `voidrift_redux`, one letter from the live `voiddrift_redux` (`config.ts:4`). The tests import the copy, so it looks live; that is an inference.
- Has save/load (localStorage in `services/simulation.ts`) and a confirmed reset (`App.tsx:344`), which the other siblings lack.
- The most complex design of the family (compounds, synthesis chamber, signal terminal, catalog modal); never run inside the studio shell, so first-60-seconds is unverified.
- Three siblings already carry the "VoidRift Redux" name.
## Player experience today vs the target
Unverifiable in the arcade. Best moment (on paper): synthesising a compound and watching the Phase 2 particle overlay react. Biggest turn-off: containers, power and recipes must be managed before anything feels alive; it is the heaviest on-ramp in the group.
## Verdict
PARK.
1. Nothing is registered, and it competes for the same audience while voiddrift_redux lacks saves and the sandbox lacks a front door.
2. Two codebases and an id collision must be reconciled before any port, a cost with no player value.
3. Source and tests are tracked now, so parking loses nothing.
## Replan
- Phase 1 (S, only when un-parked): decide the live copy. CUT: whichever of `src/` and `ts/src/games/voidrift_redux/` is stale (two live copies guarantee drift). ADD: a diff note naming the live copy and a new id `voidrift_station_sim`. Verify: `diff -rq` summary in the note; the example's tests pass.
- Phase 2 (M): port by the sandbox pattern, files under 600 lines, own cover, Tier A.
- Trigger to un-park: voiddrift_redux and the sandbox are both at Tier A plus a save.
## First three directives
1. Station-sim live-copy reconciliation note (read-only diff plus recommendation). S. Depends on: Robert un-parking.
2. Port station-sim to `ts/src/games/voidrift_station_sim` with Tier A. M. Depends on: 1.
3. Station-sim save migration and phone check. M. Depends on: 2.
## Open question for Robert
None blocking. Default: stay parked until the other two siblings reach Tier A plus a save.
