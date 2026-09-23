# CorpWorld — Retired (August 2026)

**Status:** Retired. Source preserved for reference. Not in the live
game registry.

**Reason for retirement:** CorpWorld is the fork ancestor of Planet of
Greed. Planet of Greed forked from CorpWorld's scaffold (per ADR-005,
Design.md v0.2) and has since diverged with four new modules
(wheelTopology, fragmentSystem, endingSystem, aiDecisions) plus real
changes to types.ts, mapGenerator.ts, and App.tsx. Planet of Greed is
now the live, converted game in `ts/src/games/planetofgreed/`.

**Why source is preserved:** Planet of Greed's own design history depends
on being able to point back at CorpWorld as the source material for how
the blend was reasoned through. The TS-Native Cross-Game Duplication
Audit confirmed 7 of 12 files remain byte-identical between CorpWorld
and Planet of Greed, led by a 254-line combat resolver (`combat.ts`).

**Location:**
- Registry stub: `ts/src/games/corpworld/config.ts` (preserved, not imported)
- Full source: `examples/corpworld/` (preserved, not converted)

**Retirement precedent:** Matches SlimeBreeder's pattern — config.ts
preserved in `ts/src/games/`, explicitly absent from registry, absence
confirmed by `test_arcade_registry_directive.ts`.
