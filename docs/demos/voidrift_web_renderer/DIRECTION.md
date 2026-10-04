# voidrift_web_renderer direction (2026-10-04)
## What it tried to be
A browser-native TypeScript rebuild of the Rust/Bevy VoidDrift, merged in from the Replit line and living in the VoidDrift repo (`VD:web`, not this repo): drones mine, ore becomes ingots then hull plates then new drones, 5-second autosave (`VD:replit.md:9-17`, `VD:web/src/main.ts:30-58`). Roadmap Tier 3 called it "a genuine, separate, complete game" (`docs/RFDGameStudio_DemoPortingRoadmap.md:104-108`). Per `EVALUATION.md` (read-only at VD 2706da5) it is an MVP slice, not a game; intent never got past an iron-only chain.
## Where it is now
- 1,195 TS lines in 11 files; iron-only ("no Tungsten/Nickel in MVP", `VD:web/src/constants.ts:19`); no tests, only `vite build`.
- Not in this repo: no registry entry, no example folder, no intake; `docs/demos/voidrift_web_renderer/` holds only SCOPE.md and EVALUATION.md.
- Constants are hand-copied from `balance.toml` and already drift (`SPAWN_DIST_MAX` 400 vs 380; EVALUATION.md "Coupling").
- Save format is unrelated to the Rust game (key `voiddrift_save_v1`, v1, vs `SAVE_VERSION = 7`).
- Its lockfile points at a Replit mirror, so `npm ci` fails off Replit.
- VoidDrift's roadmap `stop_if` (`VD:docs/roadmap.md:24`) says this build replacing Rust ends the Rust roadmap, so promoting it is a strategic call, not a demo call.
## Player experience today vs the target
Not playable from the cabinet. In its own repo: a canvas, a few drones, a refinery. Best moment: the first drone returning with ore and a hull plate becoming a new drone (the compounding loop). Biggest turn-off: a player would meet a fourth VoidRift thing with less content than the TS-native Redux.
## Verdict
PARK (agree with the settled decision).
1. Redux already holds the same FSM and is a superset (EVALUATION.md "Redundancy").
2. Its one unique asset, autosave, is a smaller job inside Redux (Redux Phase 2).
3. Importing it would add a third copy with no tests and a lockfile that cannot install.
## Replan
- Phase 1 (S): close the loop. CUT: the standing "is it a demo?" question (settled: no). ADD: one note in the family roadmap pointing here and at Redux's save work. Verify: a roadmap-only diff.
- No further phases. Un-park only if Robert wants a no-WASM idle game; then follow EVALUATION.md's copy gate (15 files, no lockfile, no `dist`).
## First three directives
1. Roadmap note: web renderer parked, autosave tracked under voiddrift_redux Phase 2. S. Depends on: none.
2. (Only if un-parked) controller copies the 15 non-generated web files to `examples/voidrift-web/`. S. Depends on: Robert.
3. (Only if un-parked) seeded RNG, system tests and GameConfig. M. Depends on: 2.
## Open question for Robert
None; settled as PARK. Default: stay parked.
