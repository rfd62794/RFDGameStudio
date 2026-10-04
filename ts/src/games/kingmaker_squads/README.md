# Kingmaker Squads — Origin project (preserved)

**Status:** Origin project, registered in the live game registry as an
`external` embed with `supersededBy: 'planetofgreed'` (ADR-023, see
`docs/adr/ADR-023-legacy-origin-projects-type.md`). Presented as history,
not as a game competing with Planet of Greed.

**Why it exists:** Kingmaker Squads was the wheel/culture-identity design
source that informed Planet of Greed's six-culture wheel topology. Planet
of Greed is the live, TS-native game that carries the design forward.

**What is tracked here:**
- Registry entry: `ts/src/games/kingmaker_squads/config.ts` (imported by
  `ts/src/games/registry.ts`).
- Intake history: `intake/kingmaker-squads/MANIFEST.md`.

**Where the game source lives:** `examples/kingmaker-squads/` (50+ source
files: combat engine, city generation, AI opponent, tests). `examples/*` is
gitignored (`.gitignore` line 193) and this folder is NOT tracked, so it
exists only in the owner's live checkout. A fresh clone or worktree cannot
see it. Known rebuild risk from intake 0.1.0R1: `vite.config.ts` lacks
`base`, so assets 404 under `/arcade/kingmaker_squads/` if rebuilt as is.

**Polish standard, item A3 (Start and Restart):** the embedded game opens on
a start screen whose in-frame control is "Start New Campaign"; once a
campaign is running the header offers "Restart Campaign". For this Origin
entry, "Start New Campaign" is recorded as satisfying the Start/New Game
half of A3. A Restart control on the start screen itself would be a change
inside the untracked example source: BLOCKED on intake (owner must track
`examples/kingmaker-squads/` first).
