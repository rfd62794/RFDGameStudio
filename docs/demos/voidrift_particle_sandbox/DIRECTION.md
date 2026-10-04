# voidrift_particle_sandbox direction (2026-10-04)
## What it tried to be
`particle_void` from roadmap Tier 2 (`docs/RFDGameStudio_DemoPortingRoadmap.md:88`): an AI Studio cellular-automata sandbox with 12 materials, pipes, collectors, processors and four tiers ending in a Reconstruction view (`examples/voidrift-redux-particle-sandbox/src/types.ts:1-31`). Intake 0f5b08d1 (2026-10-03); ported by `Port_Voidrift_Particle_Sandbox_Directive.md` (marked Done in d86c888f); the Devin run died and was finished by hand (27908e69 "wip", 571e44f7 "finish port after run died"). The intent is intact (a falling-sand toy that becomes a factory game); nobody has yet tuned it for the cabinet.
## Where it is now
- Registered `dev` (`config.ts:11`); GameShell present (`App.tsx:26`); 6,324 lines in 23 files, the five largest between 519 and 580 lines (the 600-line split held).
- Five test files (`ts/tests/test_voidrift_particle_sandbox_*.ts`, 646 lines): simulation, flow, reactions, registry, tiles/materials. No golden determinism check against the original (SCOPE.md).
- Tier goals exist (`App.tsx:40`; Tier 1 100 Structural Solid, Tier 2 80 Void Crystal, Tier 3 20 Luminite); Tier 4 toggles build vs reconstruction.
- Reset is `window.confirm` (`App.tsx:350-351`): blocking and ugly in an iframe or on mobile. No title screen; onboarding is only `HelpModal` (`App.tsx:21,576`). No localStorage anywhere in the game.
- Input is pointer-based (`hooks/useCanvasInput.ts`, 351 lines); no phone check recorded (not audited); no `build:` script.
- Its label "VoidRift Particle Sandbox" sits beside "VoidDrift Redux" and "VoidDrift".
## Player experience today vs the target
First 60 seconds: dropped cold onto a grid with a build panel and a help button. Best moment: material falling and piling, then a collector catching asteroid debris; satisfying without instructions. Biggest turn-off: a 12-material, 4-tier factory UI shown at once, with no first goal prompt and no save, so a closed tab loses the whole base.
## Verdict
POLISH.
1. It is a finished-looking, distinct game and the most toy-like, shareable member of the family.
2. It is brand new and tested, so the work is front-door chrome, not rework.
3. The risks, a cold-start wall and phone input, are both cheap to fix.
## Replan
- Phase 1 (S): Tier A. CUT: `window.confirm` reset (blocks in iframes). ADD: TitleScreen with a one-line pitch, an in-game Restart button, `build:voidrift_particle_sandbox`. Verify: build exits 0; audit A3/A4.
- Phase 2 (M): first 60 seconds. CUT: all but Tier 1 tools until the first goal is met (the rest of the panel is noise on a first visit). ADD: a "drop material, catch it" first-goal card, a 390 px touch pan/zoom check, autosave of grid plus buildings. Verify: Playwright phone screenshot; save round-trip test.
- Phase 3 (S): determinism. ADD: seeded grid-step golden test. Verify: it passes before and after any later refactor.
## First three directives
1. Particle sandbox Tier A (title, Restart, build script). S. Depends on: none.
2. Particle sandbox phone input and progressive Tier 1 build panel. M. Depends on: 1.
3. Particle sandbox autosave and seeded golden test. M. Depends on: 1.
## Open question for Robert
None.
