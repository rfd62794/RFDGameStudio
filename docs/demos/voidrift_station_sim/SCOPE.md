# voidrift_station_sim scope analysis (2026-10-03, Sonnet scope agent, registry status: NOT registered; no port directive exists; proposed id voidrift_station_sim)
Direction: a space station simulation and universe reconstruction game: physical station layout, drones, chemical synthesis, signal bottles (examples/voidrift-redux-station-sim/metadata.json:3; roadmap docs/RFDGameStudio_DemoPortingRoadmap.md:87 `space_mining_sandustry`, types Compound, ContainerSlot, ModuleType). Points at a third, separate Sandustry-family port. Read from the live checkout, because the folder is not on origin/main.
Working:
- State doc: Phase 2 done (material identity, particle system, canvas overlay), certified floor 62/0/0, next Phase 3 reaction visibility (docs/state/current.md:3-6,10-16 in the example; a claim, not re-run here).
- Seven test files (tests/test_voidrift_redux_{asteroids,collision,containers,particles,power,reconstruction,synthesis}.ts); the AI Studio src/ has simulation.ts 1,023 lines, recipes.ts 776, CosmicCanvas.tsx 584, App.tsx 575.
- Save/load (src/services/simulation.ts:305,313 localStorage) and a confirmed in-game reset (src/App.tsx:344-345).
Rough:
- Not tracked: examples/* is gitignored (.gitignore:193), this folder is not whitelisted, and `git ls-files` returns 0 files for it, so a Devin worktree cannot see it.
- Two codebases in one folder: src/ (AI Studio original) and a studio-shaped copy ts/src/games/voidrift_redux/ (simulation.ts 759 lines, particles.ts 386, MaterialCanvas, StationView). The tests import the copy (tests/test_voidrift_redux_synthesis.ts:5) and the state doc names its files, so the copy looks like the live line, but that is an inference.
- Id collision: the copy declares `id: 'voidrift_redux'` (ts/src/games/voidrift_redux/config.ts:4), one letter from the registered voiddrift_redux; the sibling directives also demand files under 600 lines and 1,023-line simulation.ts would need a split.
Class: improve - adds a distinct game to an existing family; nothing is registered, so there is nothing to refine yet.
Top 3 changes, in order: 1. Intake: force-add the folder (source and tests, no node_modules) in a reviewed commit so a worktree can read it. 2. Write the port directive from the two sibling directives, naming which of the two codebases is ported, the new id, the source slug and the 600-line split. 3. Port it, then Start/Restart/phone/build-script follow-ups.
Out of scope: Phase 3 features, merging with the particle sandbox or voiddrift_redux, balance, Gemini (metadata.json:5 lists a capability), registering before the port lands.
Dependencies / risks: tests import ../ts/src/games/voidrift_redux and need re-pointing; three siblings share the "VoidRift Redux" name, so labels must differ visibly; the choice of source codebase must be confirmed by diff before the directive is written.
Effort: M
Open question for Robert: none
