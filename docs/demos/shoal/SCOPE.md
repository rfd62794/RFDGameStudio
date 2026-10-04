# shoal scope analysis (2026-10-03, Sonnet scope agent, registry status: stable)
Direction: watch-and-seed reef ecosystem sim, no win state (ts/src/games/shoal/config.ts:7,10-14); player drops fish/sharks/algae/cull via 4 tools (App.tsx:102, types.ts:58). Points toward more habitats and an orca role-fill (ts/src/games/shoal/docs/OceanEcosystemExpansion_Research.md:1-3, "design reference, not a directive"; games/shoal/ROADMAP.md Active Backlog).
Working:
- Simulation is TS-native and fast: ADR-018; ROADMAP "151.7x speedup in production"; 5 test_shoal_*.ts files; `build:shoal` exists (ts/package.json:10).
- Chrome polish landed: TitleScreen scenarios + How to Play (TitleScreen.tsx:29,59-66), first-run primer (App.tsx:204,213), mute toggle (App.tsx:224-238), extinction EndStateScreen "Seed a New Reef" (App.tsx:314-315).
- Audit batch2:20: loads, 0 errors, build:shoal present.
Rough:
- Audit "no restart seen" (batch2:20,44) verified: restart exists only after extinction (App.tsx:314) or via "← Title" then Start Reef (App.tsx:298,330; TitleScreen.tsx:59-62); no in-play "New reef" control.
- Input is mouse-only (mousemove/mousedown, App.tsx:448-449); touch at 390x844 (A4) not verified. Reef state is not saved, only the tutorial flag (App.tsx:204,213 are the only loadSave/writeSave uses), and nothing says "session-only" (B2).
- Polish tests assert source text of App.tsx (ts/tests/test_shoal_chrome_polish.ts:17-30), not behaviour; no headless balance test (B4).
Class: refine - the only `stable` demo; gaps are baseline checks, not direction.
Top 3 changes, in order: 1. In-play "New Reef" control beside Mechanics, pointer-event input, verified at 390x844 (A3, A4). 2. Say "session-only" on the title, or persist seed/tick with a reset control (B2). 3. Headless run test: N ticks per scenario, no NaN/negative counts, extinction and survival both reachable (B4).
Out of scope: new habitats, orca/whale mechanic, typed arrays, layered canvas, sprite rewire (ROADMAP backlog), Y8/itch changes, changing `stable` status.
Dependencies / risks: shared persistence/GameShell (ADR-014); same source ships to itch and Y8 (CHANGELOG.md), so changes reach all three targets; any status change is Robert's call.
Effort: S
Open question for Robert: none
Update 2026-10-04: Tier A closed (in-play New Reef control and pointer input, commit 13c01455), so the "no restart" finding above is stale.
Phone layout: rotate-hint (the reef canvas needs width; the 2026-10-04 redesign spec, section c3, names Shoal). To be confirmed on the first 390x844 pass.
