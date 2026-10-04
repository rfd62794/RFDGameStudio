# CorpWorld — Origin project (preserved)

**Status:** Origin project, registered in the live game registry as an
`external` embed with `supersededBy: 'planetofgreed'` (ADR-023, see
`docs/adr/ADR-023-legacy-origin-projects-type.md`). Presented as history,
not as a game competing with Planet of Greed.

**Why it exists:** CorpWorld is the fork ancestor of Planet of Greed.
Planet of Greed forked from CorpWorld's scaffold and has since diverged
(wheel topology, fragment system, ending system, AI decisions). Planet of
Greed is the live, TS-native game in `ts/src/games/planetofgreed/`.

**What is tracked here:**
- Registry entry: `ts/src/games/corpworld/config.ts` (imported by
  `ts/src/games/registry.ts`).
- Intake history: `intake/corpworld/MANIFEST.md` (latest recorded version
  0.1.0R5, source file `corpworld_v0.1.0R5.zip`).

**Where the build source lives:** the embed is served at `/arcade/corpworld/`.
Its source is expected at `examples/corpworld/`, but `examples/*` is
gitignored (`.gitignore` line 193) and `examples/corpworld/` is NOT tracked
in this repository, so it exists only in the owner's live checkout, if at
all. Not verified: that the deployed build matches intake 0.1.0R5. Owner to
confirm and record the answer here.
