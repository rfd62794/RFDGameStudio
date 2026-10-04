# anycreature scope analysis (2026-10-03, Sonnet scope agent, not a game: two Blocked directives, ForkValidate and CreatureArtIntegration)
Direction: validate an offline creature-art pipeline (Ariescar/anyCreature: Node compile, Python deliver step) and wire pre-generated PNGs into the studio through a thin `creatureArt` seam; no runtime generation, no game chosen (docs/directives/anyCreature_ForkValidate_Directive.md:29-58; anyCreature_CreatureArtIntegration_Directive.md:23-79).
Working (read-only look outside the worktree, to be re-handed by the controller):
- The fork already exists: C:\Github\anyCreature has origin rfd62794/anyCreature and upstream Ariescar/anyCreature (git remote -v), node_modules, out/_setup*, out/wolf.glb and out/delivery/{hero.png 228,387 bytes, wolf.glb, wolf_viewer.html, upload/}; harness/deliver.py exists, harness/hero.mjs does not; no scripts/ dir.
- The studio half is already on main: ts/src/engine/creatureArt/{types,loader,index}.ts, fixtures/wolf.png (347,341 bytes) and ts/tests/test_creatureArt.ts:58 (asserts 347,341).
Rough (why both are Blocked):
- ForkValidate stopped at `gh auth status` and needs `gh repo fork` under Robert's identity, a clone outside the worktree, and running unvetted setup.sh/cli.js/deliver.py (log line 149).
- CreatureArt stopped at `Set-Location C:\Github\anyCreature` (log line 231: sandbox allows the worktree only); it needs a new script in the fork and a live cross-repo write.
- Stale facts: pre-flight expects out\hero.png 347,341 and out\hero.jpg 40,920 (CreatureArt:15-17), but the fork holds out/delivery/hero.png 228,387 and no hero.jpg; hero.mjs is cited at CreatureArt:87,114 (queue log line 228 already says fix it).
Class: rework - change how each directive executes (evidence handed in, no outside access); keep the goals.
Worktree-only rewrite of ForkValidate: the controller hands in, as files under the worktree, the `git remote -v` output, `out/_setup.checks.json`, `out/wolf.checks.json`, the `out/delivery` listing with sizes and any recorded timings; the agent writes only a report (docs/state/anycreature-forkvalidate-report.md) and a copy of hero.png if Robert wants it kept. Drops: gh auth, fork, clone, setup.sh, cli.js, deliver.py, installs. Cost/time figures stay "not recorded" unless the controller supplies them.
Worktree-only rewrite of CreatureArtIntegration: replace hero.mjs with `python3 harness/deliver.py <tmp>.glb <tmp-dir> <name>` then copy `<tmp-dir>/hero.png` (deliver.py docstring: stamped GLB, viewer, hero, upload pack; local out/delivery/hero.png confirms); the seam, fixture and test already exist, so the agent only verifies them with `cd ts && npx vitest run test_creatureArt.ts` and `git diff` on artGen/. The export script is handed in or drafted as text for Robert to place in the fork; its live demo runs outside the worktree by the controller or Robert, output pasted back.
Out of scope: rewriting the directive files, forking under Robert's identity from a worktree run, running third-party scripts, installs, choosing a game, GenerativeOrchestration directive (separate), publish.mjs.
Dependencies / risks: the sizes above are observations of the live disk, not facts to trust later; byte-size anchors differ (228,387 vs 347,341) so the fixture test must keep using the committed wolf.png.
Effort: S
Open question for Robert: none

## Update 2026-10-04 (Robert approved all direction recommendations)
N/A as a demo: anycreature is a pipeline, not a game, so the polish tiers do not apply. Verdict PARK (see DIRECTION.md). No code or fork is deleted; `docs/CREATURE_SYSTEM.md` records that the creatureArt seam is parked.
