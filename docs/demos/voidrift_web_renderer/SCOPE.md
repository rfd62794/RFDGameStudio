# voidrift_web_renderer scope analysis (2026-10-03, Sonnet scope agent, off-repo roadmap item: C:\Github\VoidDrift\web, read-only; not registered)
Direction: a browser-native TypeScript rebuild of the Rust/Bevy VoidDrift, merged in from the Replit line: drones mine, ore refines to ingots to hull plates to new drones, autosave, "No win condition. No escape." (C:\Github\VoidDrift\replit.md:9-17; docs/DIRECTION.md:38-42 there). The roadmap lists it as a real, separate TS implementation (docs/RFDGameStudio_DemoPortingRoadmap.md:104-106).
Working:
- Game loop with capped dt, drone FSM (Holding, Outbound, Mining, Returning, Unloading), asteroids, refinery, forge, drone build, HUD, canvas renderer, 5-second autosave (web/src/main.ts:30-58; web/src/types.ts:1; web/src/systems/production.ts:11-25).
- Balance copied from the native game's data files (web/src/constants.ts:1 "Ported from assets/balance.toml"); versioned save (web/src/save.ts:9,33).
- About 1,195 lines of TS in 11 files; `vite build` is its only gate (docs/DIRECTION.md:40-42 there); a web/dist folder exists.
Rough:
- Early: iron-only chain, "no Tungsten/Nickel in MVP" (web/src/constants.ts:19, web/src/systems/production.ts:11-25); the native game has four ores, requests, bottles, tutorial (docs/DIRECTION.md:31 there). No test script (web/package.json scripts: dev, build, preview).
- Not in this repo: no examples/ folder, no registry entry, no intake record; porting it here means copying source across repos.
- It overlaps with voiddrift_redux, the TS-native reimagining already registered (ts/src/games/voiddrift_redux/config.ts:6).
Class: improve - extends an existing separate codebase; nothing here to refine until a home is chosen.
Top 3 changes, in order: none proposed. Direction belongs to Robert and to the VoidDrift roadmap, whose stop_if says the web rebuild becoming the shipping line stops the Rust roadmap (docs/ROADMAP.md:24 there).
Out of scope: any change to C:\Github\VoidDrift, the Rust/Bevy game, itch pricing or store assets, merging with voiddrift_redux.
Dependencies / risks: ownership by the VoidDrift repo (its DIRECTION.md:74 lists the web rebuild as item 5, after launch blockers); duplicating voiddrift_redux work; save format and constants must stay in sync with the native game if both live.
Effort: L
Open question for Robert: should the web renderer become an arcade demo here, stay a VoidDrift-repo experiment, or be dropped in favour of voiddrift_redux? Nothing past baseline Tier A is proposed until answered.

Status (2026-10-04): PARKED. Tier A, polish and port work are N/A. Its autosave idea is tracked as voiddrift_redux save/restore. Un-park only on Robert's word; see DIRECTION.md and EVALUATION.md.
