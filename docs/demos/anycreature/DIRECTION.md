# anycreature direction (2026-10-04)
## What it tried to be
Not a game. A pipeline: fork the third-party Ariescar/anyCreature generator, run it offline to turn a creature spec into a GLB plus a hero PNG, and drop finished art into the studio through a thin `creatureArt` seam; "no runtime generation, no game chosen" (docs/directives/anyCreature_ForkValidate_Directive.md, header). Three directives: ForkValidate, CreatureArtIntegration, GenerativeOrchestration. Drift: the seam and its test landed 2026-08-31 (`6446c222`, `01a49084`) while the directives kept bouncing Blocked (identity/`gh auth`, then the sandbox refusing a cross-repo `Set-Location`, 09-27 to 09-29); all three are now Superseded (`ed661316` 09-27, `bcec9b00` and `eee2edc6` 10-04). There is no registry entry and no docs/children.json child for it.
## Where it is now
- Studio side: ts/src/engine/creatureArt/{types,loader,index}.ts (32 lines), fixtures/wolf.png (347,341 bytes) and ts/tests/test_creatureArt.ts. Its only consumer is its own test (docs/ROADMAP.md:366).
- Outside the repo (observed 2026-10-03 by the scope agent, not re-checked): fork at C:\Github\anyCreature (origin rfd62794, upstream Ariescar), `out/delivery/hero.png` 228,387 bytes; the directive's expected 347,341 and `hero.jpg` do not match disk.
- No player-visible surface: nothing to load, play or screenshot.
- Roadmap item still open that depends on it: docs/ROADMAP.md:247 asks for docs/CREATURE_SYSTEM.md (artGen vs paperDoll vs creatureArt); not written.
- Contradiction to settle: docs/ROADMAP.md:288 says vector for anything composed or recoloured per player (creatures); this raster seam is the opposite lane.
- Pipeline cost, quality and the fork's licence were never measured (the run log records none).
## Player experience today vs the target
None; a player cannot encounter it. Best moment: n/a. Biggest turn-off: a docs/demos folder and three directives for something that is not a demo, which costs the controller attention every beat. Potential target: a raster portrait in a creature game (Chimera Wilds), but only if it beats the vector Paper Doll on cost.
## Verdict
PARK.
1. No game consumes it, and the one candidate (chimera_wilds) cannot be won yet (see its DIRECTION).
2. Every attempt died on infrastructure outside a worktree; more tries have no expected return.
3. The 32-line seam costs nothing parked; deleting it would lose the only raster path.
## Replan
- Phase 1 (S): close the bookkeeping. CUT the stale byte-size pre-flight text in the CreatureArt directive (numbers do not match disk). ADD one paragraph in docs/CREATURE_SYSTEM.md stating the seam is parked and why. Verify: `cd ts && npx vitest run test_creatureArt.ts` green; `grep -n parked docs/CREATURE_SYSTEM.md`.
- Phase 2 (M, only if Robert chooses a creature game): ADD one real consumer (chimera_wilds portrait) with fallback to the generated vector sprite (docs/ROADMAP.md:366). CUT the generative orchestration idea until a consumer exists (reason: no demand, unmeasured cost). Verify: Playwright screenshot shows the PNG; removing the file shows the fallback.
## First three directives
1. Creature_System_Doc - write docs/CREATURE_SYSTEM.md (artGen, paperDoll, creatureArt: owner, call path, public entry point; mark creatureArt parked); S; none.
2. CreatureArt_Fallback_To_Sprite - loader falls back to a generated sprite when the PNG is missing, test; S; after 1.
3. Chimera_Wilds_Portrait_Consumer - first real consumer; M; after chimera_wilds Phase 1 and Robert's go.
## Open question for Robert
Keep the C:\Github\anyCreature fork on disk? Recommended default: yes, parked with no spend; delete only if the creature lane is decided vector-only.
