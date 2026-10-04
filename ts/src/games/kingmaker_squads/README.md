# Kingmaker Squads — Origin project (preserved)

**Status:** Origin project, registered in the live game registry as an
`external` embed with `supersededBy: 'planetofgreed'` (ADR-023, see
`docs/adr/ADR-023-legacy-origin-projects-type.md`). Presented as history,
not as a game competing with Planet of Greed. It is a finished tactical
squad campaign and stays visible; the arcade does not hide it.

**Why it exists:** Kingmaker Squads was the wheel/culture-identity design
source that informed Planet of Greed's six-culture wheel topology. Planet
of Greed is the live, TS-native game that carries the design forward; the
individually tracked unit combat of Kingmaker Squads lives only here.

**What is tracked here:**
- Registry entry: `ts/src/games/kingmaker_squads/config.ts` (imported by
  `ts/src/games/registry.ts`; its `source` points at the example below).
- Source: `examples/kingmaker-squads/` (combat engine, city generation, AI
  opponent, tests), tracked since commit `fa3f359c`. Its `vite.config.ts`
  sets `base: '/arcade/kingmaker_squads/'`.
- Intake history: `intake/kingmaker-squads/MANIFEST.md`.

**Polish standard, item A3 (Start and Restart):** the embedded game opens on
a start screen whose in-frame control is "Start New Campaign"; once a
campaign is running the header offers "Restart Campaign". A start-screen
Restart with a two-step confirm is specified in
`docs/directives/Kingmaker_Squads_Restart_Directive.md`.
