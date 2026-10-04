# turboshells direction (2026-10-04)
## What it tried to be
Roadmap Tier 3 describes a "Rust core (PyO3) -> Python logic -> React/TS frontend -> live Supabase" turtle-racing game (`docs/RFDGameStudio_DemoPortingRoadmap.md:98-102`). SCOPE.md found only part of that: `C:\Github\reference-repos\ChimeraLab` ("Turbo Shells", a pygame-ce management sim with procedural genetics, 20 genes, Mendelian inheritance), about 3,600 lines of Rust in `turboshells-core` and about 42,800 lines of Python, 196 commits, last commit ebf2023 (2025-12-25, a ragdoll animation sandbox). No React/TS frontend and no Supabase were found. Intent: breeding and racing; drift: the repo grew a physics/animation sandbox that is not the game.
## Where it is now
- Not in RFDGameStudio: no registry entry, no folder under `ts/src/games` or `examples/`; only SCOPE.md and roadmap text.
- ChimeraLab is a separate pygame desktop game: not a browser build, not in this repo.
- The roadmap's Supabase, "anon key full CRUD" and React-frontend claims are unverified (SCOPE.md "Not found"); the "security gap" line is a claim, not a fact.
- Reusable value: the genetics model (genes, mutation) as a TS design reference, per the settled decision (reference only).
- Dormant since 2025-12-25.
- Nothing to polish; not a cabinet candidate.
## Player experience today vs the target
Nothing to play in the arcade. In ChimeraLab: pick turtles, breed, race. Best moment (on paper): a bred turtle with an inherited stat winning a race. Biggest turn-off for the arcade: it needs Python, Rust and a desktop window, so there is no browser first 60 seconds.
## Verdict
PARK (reference only, as settled).
1. A browser port replaces the whole stack (pygame UI, Python logic, Rust core): L-size for a game outside the cabinet.
2. The roadmap's React/Supabase description is not backed by any code found.
3. The genetics idea is usable as a TS design reference without importing anything.
## Replan
- Phase 1 (S): make the roadmap true. CUT: the Supabase, React and security claims in the Tier 3 TurboShells paragraph (unverified; an unfounded claim steers future work wrongly). ADD: a "reference only: ChimeraLab, not ported, Dormant" line with the repo path. Verify: roadmap-only diff; no "anon key" claim without a source.
- No further phases. If breeding is ever wanted in the cabinet, start from a one-page TS genetics design note, not a port.
## First three directives
1. Correct the TurboShells roadmap paragraph to reference-only. S. Depends on: none.
2. (Optional) One-page TS genetics design note from ChimeraLab's gene model. S. Depends on: Robert.
3. None further.
## Open question for Robert
Is "TurboShells" only ChimeraLab, or is there a React/Supabase repo off this machine? Default: ChimeraLab only; the roadmap text came from a source I could not find, so correct the roadmap.
