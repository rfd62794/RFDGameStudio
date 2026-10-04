# slimebreeder scope analysis (2026-10-03, Sonnet scope agent, registry status: external, Origin)
Direction: UNCLEAR. Registry calls it an Origin of SlimeWorld (ts/src/games/slimebreeder/config.ts:3-8,11; source = sibling repo SlimeBreeder, line 10). But the repo's own C:\Github\SlimeBreeder\docs\DIRECTION.md:5-10 describes a standalone offline idle PWA for a Moto G 2025 (React 19, Zustand, Dexie) with an active roadmap M1 "Facility expansion is capped and gated" (docs/ROADMAP.md:19-21), while C:\Github\Portfolio\projects.yaml:230-234 lists it tier: parked.
Working:
- Playable 4-tab loop CHAMBER/MUTATE/CODEX/MARKET, Dexie schema v5 (SlimeBreeder docs/DIRECTION.md:16-35).
- 5 vitest files in src/__tests__ (breedSlimes, economics, gameStore, slimeGenerator, SlimeVisual) and a `test` script (package.json:11).
- Live /arcade/slimebreeder/ loads, title "Slime Breeder", its own JS hash (curl; audit batch2 line 22).
Rough:
- No restart/reset anywhere: grep -i "reset|new game|restart|localStorage" over src (excluding tests) returned nothing; audit saw none (batch2 line 22).
- README.md is the default Vite template (README.md:1-4); DIRECTION.md:57 says the same.
- Economy spec only partly implemented: flat 20G pens, no caps, no hatch gold cost (DIRECTION.md:40-47).
Class: refine (Tier A only), pending Robert's answer; no improve or rework is proposed.
Top 3 changes (baseline Tier A only): 1. Add a visible Reset / New Game control (A3); 2. Re-check 390px phone layout (A4; audit says phone passes); 3. Screenshot + blurb check (A5).
Out of scope: economy spec M1-M3, new trait axes, SlimeWorld merge work, Regent design, anything past Tier A.
Dependencies / risks: the edit lands in sibling repo C:\Github\SlimeBreeder, not RFDGameStudio; its docs/ROADMAP.md is status: draft, approved: "" (lines 12-13).
Effort: S
Open question for Robert: Is SlimeBreeder a frozen Origin exhibit (Tier A only, as registered) or a living standalone mobile idle game (its own DIRECTION/ROADMAP) that SlimeWorld did not replace? Until answered, nothing past Tier A is proposed.
