# turboshells scope analysis (2026-10-03, Sonnet scope agent, off-repo roadmap item, not registered)
Direction: roadmap Tier 3 describes a Rust core (PyO3), Python game logic, a React/TS frontend and a live Supabase database with open anon CRUD (docs/RFDGameStudio_DemoPortingRoadmap.md:98-102). Only part of that was found on disk.
Found (searched C:\Github read-only; an earlier search missed it):
- C:\Github\reference-repos\ChimeraLab, remote rfd62794/ChimeraLab: README title "Turbo Shells", a turtle-racing management sim with procedural genetics, status "Portfolio Demo", Python 3.12 plus Rust core (README.md:1-5,27).
- Rust crate turboshells-core inside it: genetics (20 genes, Mendelian inheritance, mutation) and simulation modules via PyO3 (turboshells-core/README.md:1-11); about 3,600 lines of Rust (skeleton.rs, ragdoll.rs, geometry.rs, physics.rs, genetics/, simulation/).
- Python/pygame-ce game: about 42,800 lines in src/, 76 Python test files, files named in the roadmap exist (src/game/game_state_interface.py, src/core/save_protection.py); last commit 2025-12-25 (git log -1).
Not found:
- Any Supabase reference (grep of .py/.md/.json/.toml/.txt: none), any React/TS frontend (no package.json to depth 3; UI is pygame_gui, README.md:66-67). The roadmap's "live Supabase" and "React/TS frontend" claims are unverified here; they may live in another repo outside C:\Github.
- Short-video scripts exist (C:\Github\RFD_YT_Engine\shorts\turboshells_christmas_short.yaml), not game source.
Class: rework - a browser version would replace the pygame UI and the Python/Rust stack; not a polish or extension task.
Top 3 changes, in order: none proposed (gated by the roadmap itself: "needs its own dedicated investigation", roadmap :102). Cheapest next step if wanted: a one-page investigation of ChimeraLab's genetics and race engine as a TS port source.
Out of scope: porting, registering, touching the database or any anon-key policy, editing ChimeraLab, publishing.
Dependencies / risks: possible second copy of the game with the Supabase/React parts elsewhere; ChimeraLab has grown a ragdoll/animation sandbox beyond the racing game (recent commit messages), so scope of "TurboShells" itself is unclear.
Effort: L
Open question for Robert: is "TurboShells" the ChimeraLab pygame game, or a separate React/Supabase repo not on this machine, and is a browser port wanted at all? Nothing past baseline Tier A is proposed until answered.
