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
  `ts/src/games/registry.ts`; its `source` points at the example below).
- Source: `examples/corpworld/`, a tracked AI Studio export (tracked since
  commit `0c416b4f`, 2026-10-04). Its `vite.config.ts` sets
  `base: '/arcade/corpworld/'`.
- Intake history: `intake/corpworld/MANIFEST.md` (latest recorded version
  0.1.0R5, source file `corpworld_v0.1.0R5.zip`).

**Which build is live:** the embed is served at `/arcade/corpworld/`. The
tracked source is intake 0.1.0R5. Not verified: that the build currently
served there was built from it. A build-hash comparison by the controller
would settle it; record the answer here when done.
