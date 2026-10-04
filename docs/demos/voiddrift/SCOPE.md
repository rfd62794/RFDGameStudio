# voiddrift scope analysis (2026-10-03, Sonnet scope agent, registry status: external)
Direction: itch.io embed of the shipped Rust/Bevy WASM game, "no win condition, no escape" idle mining (ts/src/games/voiddrift/config.ts:6,11-12; /c/Github/VoidDrift README.md:1-21; CHANGELOG.md:9-10 WASM build for itch). Native core is frozen; the TS-native counterpart is voiddrift_redux (docs/RFDGameStudio_DemoPortingRoadmap.md:106).
Working:
- Embed loads and fits a 374 px phone frame (iframe scrollWidth 374/374; docs/state/demo-audit-batch2-2026-10-03.md:29); portrait ratio box with "Open on itch.io" link (ts/src/arcade/GameLoader.tsx:81-106; config.ts:13-14).
- Game is live and versioned upstream (README.md:5 "Phase 4a Complete ... Live on itch.io"; ts/src/games/voiddrift/VERSION = 1.0.0).
- Restart exists in-frame ("NEW GAME" seen in screenshot; cross-origin so not readable by tests, audit batch2:29).
Rough:
- A1 fails on one console error, "Blocked autofocusing on a <input> in a cross-origin subframe", raised by itch's voidrift.js, not by studio code (audit batch2:29). The iframe sets no sandbox/allow attributes we could change for it (GameLoader.tsx:92-97); I did not test any workaround.
- Naming is inconsistent: registry label "VoidRift" (config.ts:5), gameId voiddrift, repo/README "VoidDrift" (README.md:1), itch slug voidrift (config.ts:11).
- No studio test or build script for this id (audit batch2:29: "none" / "none"); A6/A7 exempt for external demos (standard section 1).
Class: refine. Nothing to build; only the baseline A items and one standard-level exemption remain.
Top 3 changes, in order: 1. Treat third-party cross-origin console errors as non-failures in the A1 smoke (filter by frame origin) and record that in the scorecard; 2. Reconcile the display name (VoidRift vs VoidDrift) in label/blurb once Robert states the preferred spelling; 3. Add one arcade-manifest screenshot and confirm the card says "embed" (A5, A8).
Out of scope: any change to /c/Github/VoidDrift (read-only here), evaluating its web/ TS renderer (roadmap:108 "not yet done"), a native port (that is voiddrift_redux), itch page or cover art (C4).
Dependencies / risks: depends on itch.io hosting upload 17482080 staying up; the third-party error can recur on any itch embed; the web/ renderer (1180 lines in /c/Github/VoidDrift/web/src) is not read beyond line counts.
Effort: S
Open question for Robert: none (spelling of the name is a minor choice, noted under Top 3 item 2)
