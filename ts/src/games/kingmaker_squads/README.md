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
files: combat engine, city generation, AI opponent, tests). It is tracked
(force-added past `.gitignore` line 193 `examples/*`, intake 2026-10-04), so
a fresh clone or worktree sees it. Known rebuild risk from intake 0.1.0R1:
`vite.config.ts` lacks `base`, so assets 404 under `/arcade/kingmaker_squads/`
if rebuilt as is.

**Polish standard, item A3 (Start and Restart):** the embedded game opens on
a start screen whose in-frame control is "Start New Campaign" (or "New
Campaign" when a save exists, which asks for a second click to confirm). Once
a campaign is running the header shows a labelled "Restart" button: first
click arms it ("Confirm restart?"), second click resets the campaign and
returns to the start screen, and the arm lapses after 3 seconds. Rebuilding
and redeploying the embed is the owner's step.
