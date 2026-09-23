# KingMaker Squads — Retired (August 2026)

**Status:** Retired. Source preserved for reference. Not in the live
game registry.

**Reason for retirement:** KingMaker Squads was the wheel/culture-identity
design source that informed Planet of Greed's six-culture wheel
topology. Planet of Greed is now the live, converted game that carries
this design forward. KingMaker Squads' own implementation (50+ source
files in `examples/kingmaker-squads/` including combat engine, city
generation, AI opponent, and tests) is preserved as a reference artifact.

**Why source is preserved:** Planet of Greed's own design documentation
references KingMaker Squads as a design source. The extensive design
history (15 design revisions) and real implemented code are preserved
for reference — retiring a shipped game means preserving its source,
not deleting it.

**Location:**
- Registry stub: `ts/src/games/kingmaker_squads/config.ts` (preserved, not imported)
- Full source: `examples/kingmaker-squads/` (preserved, not converted)

**Retirement precedent:** Matches SlimeBreeder's pattern — config.ts
preserved in `ts/src/games/`, explicitly absent from registry, absence
confirmed by `test_arcade_registry_directive.ts`.
