# corpworld scope analysis (2026-10-03, Sonnet scope agent, registry status: external, Origin, supersededBy planetofgreed)
Direction: preserved Origin project, not a competing game (ts/src/games/corpworld/config.ts:3-7,12; ADR-023 cited there, not read). Presented as the history of what became Planet of Greed (docs/RFDGameStudio_DemoPortingRoadmap.md:41).
Working:
- Live: loads, "AUTHORIZE PLANNING PHASE" and RESET present, 0 console errors (audit batch1:32).
- Registry wiring is honest: label, supersededBy, genre colony-4x, tag origin-project (config.ts:9-17).
- Embed at /arcade/corpworld/ works (audit batch1:32).
Rough:
- Description leaks a repo path "ts/src/games/planetofgreed/" to players (config.ts:13; audit batch1:52,76).
- README says "Not in the live game registry" and "Registry stub... not imported" (ts/src/games/corpworld/README.md:3-4,20), but the registry imports it (registry.ts:34,88): stale.
- README names full source at examples/corpworld/ (README.md:21); that directory does not exist in this checkout (ls examples), so provenance of the live build is unverified.
Class: refine - frozen history; only labelling and doc accuracy are in play.
Top 3 changes, in order: 1. Strip the repo path from the description (config.ts:13). 2. Rewrite README.md status to match the ADR-023 re-registration. 3. Record where the /arcade/corpworld/ build source lives.
Out of scope: any gameplay change or bug fix, merging with Planet of Greed code, un-superseding, new features.
Dependencies / risks: the description edit may touch card word-count checks (audit batch1:52 counts 39 words); source location unknown.
Effort: S
Open question for Robert: none
