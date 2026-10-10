# grainworks scope analysis (2026-10-03, Sonnet scope agent, registry status: NOT registered; directive Port_Voidrift_Particle_Sandbox_Directive.md is Approved)
Direction: cellular-automata sandbox and factory builder: twelve physical materials, pipes, containers, processors, tiered reconstruction (examples/grainworks/src/types.ts:1-14; roadmap docs/RFDGameStudio_DemoPortingRoadmap.md:88 `particle_void`). Points at a port as its own game, separate from voiddrift_redux (directive section 1, line 12).
Working:
- Twelve MaterialType values 0-11 and MATERIAL_DEFS (src/types.ts:1-31); simulation split across grid.ts (579), buildings.ts (1,223), renderer.ts (761), buildingDefs.ts (382), asteroids.ts (123).
- Tier goals exist: Tier 1 100 Structural Solid, Tier 2 80 Void Crystal, Tier 3 20 Luminite, Tier 4 reconstruction view (src/App.tsx:47,76-77,174-191).
- Directive facts match the source: buildings.ts 1,223 and renderer.ts 761 lines (wc -l), no network or env use in src (grep: none), no localStorage (grep: none).
Rough:
- No tests in the example (git ls-files grep "test": none); directive adds only pure-logic anchors (section 3, item 9) while the behaviour is mostly buildings.ts routing.
- Directive splits 1,223-line buildings.ts, 761-line renderer.ts and a 659-line BuildPanel to stay under 600 lines (section 3, items 3-5); "behaviour must match" has no golden check.
- Nothing in the directive mentions Start, Restart, phone layout or a build script (section 3-4), so A3, A4, A7 will fail after the port. 6,045 lines of TS in total.
Class: improve - new finished-looking game added to the VoidRift Redux family; port only, no redesign.
Top 3 changes, in order: 1. Port as specified (types, simulation modules, renderer split, panels, App with hooks). 2. Add a determinism check: seeded grid steps compared before and after the split (the only way to prove "matches the example"). 3. Follow-up: Start/Restart, touch input and phone layout of the canvas, build script (A3, A4, A7).
Out of scope: new materials/buildings/tiers, balance, art, saves (the source has none), merging with voiddrift_redux or the station sim, Gemini (metadata.json:5 lists a capability the source does not use).
Dependencies / risks: refactor drift in buildings.ts routing; canvas performance at 390 px; id must not collide with voiddrift_redux/voidrift_redux (directive section 2).
Effort: M
Open question for Robert: none
