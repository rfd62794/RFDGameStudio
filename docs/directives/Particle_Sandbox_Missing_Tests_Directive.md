# VoidRift Particle Sandbox: add the missing rule, flow, routing and material tests (tests only)

## Read first

`docs/directives/Port_Voidrift_Particle_Sandbox_Directive.md` (line 111 only: the original item 9),
`ts/tests/test_voidrift_particle_sandbox_simulation.ts` (all 183 lines: the 14 existing logic tests, to avoid
duplicating them), `ts/src/games/voidrift_particle_sandbox/simulation/grid.ts` (lines 56-310 and 394-470),
`ts/src/games/voidrift_particle_sandbox/types.ts` (lines 1-31, 194-230, 338-373), `ts/src/games/voidrift_particle_sandbox/simulation/routing.ts`
(lines 1-22), `ts/src/games/voidrift_particle_sandbox/simulation/flowParticles.ts` (all 85 lines),
`ts/src/games/voidrift_particle_sandbox/simulation/buildingFlow.ts` (lines 124-240), `ts/src/games/voidrift_particle_sandbox/simulation/buildingManager.ts`
(lines 220-275), `ts/tests/test_voiddrift_redux_engine.ts` (line 31: the existing `Math.random` stub style).
Everything you need is quoted or summarised below; do not search for anything else.

## 1. Why this exists

The original port directive (`docs/directives/Port_Voidrift_Particle_Sandbox_Directive.md`, line 111, item 9)
asked for pure-logic tests: `MATERIAL_DEFS` covering all 12 `MaterialType` values with matching ids, the
`snapToTile`/`tileToCA` round trip, route computation, and cellular-automata behaviour. What shipped is 22 tests
in two files (`ts/tests/test_voidrift_particle_sandbox_simulation.ts`, 14 tests, and
`ts/tests/test_voidrift_particle_sandbox_registry.ts`, 8 tests). They cover grid allocation, count conservation for one dust cell,
building placement, filters, asteroids and building defs, but NOT: per-material reaction and step rules,
`flowParticles` through a pipeline, the `snapToTile`/`tileToCA` round trip (`ts/tests/test_voidrift_particle_sandbox_simulation.ts` imports neither),
or a check that `MATERIAL_DEFS` covers all 12 materials (it is only used for a filter lookup).

The behaviour to pin was measured on origin/main `77fdba94d78ca1f5b00b360e7329ce845fe130ca` with the stub values given below.
Facts (all from reading the source, and the numbered ones from a real run):

1. `CellularGrid.step()` (grid.ts line 125) scans bottom-to-top; per cell it runs `checkReactions` first, then
   the material's update. `Math.random()` is used for scan direction, reaction rolls (`Math.random() < reaction.probability`),
   dust/slurry/liquid sideways choices and plasma drift. Stubbing it with `vi.spyOn(Math, 'random').mockReturnValue(v)`
   makes a step deterministic. `setCell` keeps `grid.counts[material]` in step (grid.ts lines 69-96).
2. The reaction table `MATERIAL_REACTIONS` (types.ts lines 194-230): GAS+PLASMA -> VOID_CRYSTAL (p 0.08),
   LIQUID+DUST -> MINERAL_SLURRY (0.15), PLASMA+LIQUID -> REACTIVE_VAPOR (0.12), GAS+LIQUID -> CONDENSATE (0.05),
   REACTIVE_VAPOR+VOID_CRYSTAL -> LUMINITE (0.06). With the stub at `0.01`, placing the two inputs side by side
   (`setCell(100, 100, a)` and `setCell(101, 100, b)`) and calling `step()` once turns BOTH cells into the output:
   measured `grid.counts[output] === 2` for all five pairs. With the stub at `0.99` GAS+PLASMA produced no
   VOID_CRYSTAL.
3. With the stub at `0.5` and one `step()` on an otherwise empty grid (measured): DUST at (100, 50) ends at
   (100, 51); VOID_CRYSTAL at (100, 50) ends at (100, 51); MINERAL_SLURRY at (100, 50) ends at (100, 51); LIQUID at
   (100, 50) ends at (100, 51); PLASMA at (100, 50) ends at (100, 47) (it rises three cells); a PLASMA cell created
   with `setCell(100, 50, MaterialType.PLASMA, 0, 1)` (customLife 1) becomes GAS at (100, 50) (lifespan expiry,
   grid.ts lines 394-402).
4. Pipes: `new BuildingManager().placePipeRoute(grid, computeRoute({ tx: 10, ty: 10 }, { tx: 13, ty: 10 }, true, mgr), 'RIGHT')`
   returns 4 `PipeNode`s, all `direction === 'RIGHT'` (measured). With `pipes[0].buffer.push({ material: MaterialType.LIQUID, amount: 3 })`
   and `updatePipes(mgr, grid)` (from `buildingFlow.ts`) called repeatedly, measured per call: total buffer amount
   per pipe `[2,0,0,0]` then `[1,0,0,0]` then `[0,0,0,0]`, and `grid.counts[MaterialType.LIQUID]` rising by 1, 2, 3
   in step (the last pipe spills one unit per call into the open grid at tile (14, 10)); a fourth call changes
   nothing (stays 3).
5. Flow particles (`flowParticles.ts`): for a RIGHT pipe with `buffer = [{ material: MaterialType.GAS, amount: 50 }]`
   and `maxBuffer` 100, `updatePipeFlowParticles(pipe, 0)` spawns 3 particles (`Math.round(0.5 * 6)`), each with
   `material === MaterialType.GAS`, `progress === 0`, `localX === 0`; a following `updatePipeFlowParticles(pipe, 0.1)`
   (stub 0.5) leaves 3 particles with `progress` 0.105 (`0.1 * 0.7 * 1.5`, speed `max(0.3, 1 - 0.5 * 0.6) = 0.7`),
   `localX` equal to `progress`, `speed === 0.7` (measured). With `pipe.buffer = []` and `dt = 10` every particle
   passes progress 1 and is dropped: `flowParticles.length === 0` (measured). `hasWarning = true` makes the speed
   `0.1` for existing particles on the next update (from the code, line 175).
6. Tiles (`routing.ts`): `snapToTile(17, 33)` is `{ tx: 2, ty: 4 }`; `tileToCA(2, 4)` is `{ x: 16, y: 32 }`;
   `snapToTile(-5, 9999)` clamps to `{ tx: 0, ty: 24 }`; `snapToTile(tileToCA(7, 9).x, tileToCA(7, 9).y)` is `{ tx: 7, ty: 9 }`
   (all measured). `TILES_X` is 40 and `TILES_Y` is 25, `BUILDING_TILE` is 8.
7. `MATERIAL_DEFS` (types.ts lines 31-190) is a `Record<MaterialType, MaterialDef>` with 12 entries; four have
   `isEmissive: true` (PLASMA, VOID_CRYSTAL, REACTIVE_VAPOR, LUMINITE), the same four members as `EMISSIVE_MATERIALS`
   in `flowParticles.ts` lines 3-8.

## 2. Scope

Tests only. In scope, exactly these three new files (all under `ts/tests/`):

- `ts/tests/test_voidrift_particle_sandbox_reactions.ts` <!-- new: ts/tests/test_voidrift_particle_sandbox_reactions.ts -->
- `ts/tests/test_voidrift_particle_sandbox_flow.ts` <!-- new: ts/tests/test_voidrift_particle_sandbox_flow.ts -->
- `ts/tests/test_voidrift_particle_sandbox_tiles_materials.ts` <!-- new: ts/tests/test_voidrift_particle_sandbox_tiles_materials.ts -->

Out of scope: every file under `ts/src/games/voidrift_particle_sandbox/` (do NOT change the game code), the two
existing test files (do not edit them), the registry, `examples/`, and any other demo.

## 3. The work

Each file: header comment saying what it guards, imports only from `vitest` and the game's own modules (use the
direct modules `../src/games/voidrift_particle_sandbox/simulation/grid`, `.../routing`, `.../flowParticles`,
`.../buildingFlow`, `.../buildingManager` and `../src/games/voidrift_particle_sandbox/types`), and
`afterEach(() => { vi.restoreAllMocks(); })` wherever `Math.random` is stubbed. Under 600 lines each (expect about 80-150).
Where a measured value in section 1 turns out different in your run, assert what the code does and say so in
the report; never loosen an assertion into a no-op.

1. `ts/tests/test_voidrift_particle_sandbox_reactions.ts` (stub `vi.spyOn(Math, 'random').mockReturnValue(v)`):
   - one `it` per reaction pair, five in all (fact 2, stub 0.01): after one `step()`, `counts[output] === 2` and the
     two input counts are 0; plus one no-reaction test (stub 0.99, GAS+PLASMA: `counts[VOID_CRYSTAL] === 0`);
   - at least the five movement rules of fact 3 (stub 0.5): DUST, VOID_CRYSTAL, MINERAL_SLURRY, LIQUID fall one cell;
     PLASMA rises three; short-lived PLASMA (customLife 1) becomes GAS (assert the cell material and the counts);
   - one bedrock test: DUST placed at `(100, GRID_HEIGHT - 3)` (on the structure-flagged bedrock rows) stays put
     after one step (if it does not, report what it does);
   - this makes at least 4 materials with deterministic outcomes as required; cover all of the above.
2. `ts/tests/test_voidrift_particle_sandbox_flow.ts` (stub 0.5):
   - the pipeline test of fact 4 (four-pipe route, three LIQUID units, `updatePipes` x4 with the per-call buffer
     totals and the conserved `grid.counts[LIQUID]` delta; assert `grid.counts[LIQUID] - before` equals units moved
     out of the pipes at each step, so total (in pipes + in grid) is 3 every call);
   - the flow-particle tests of fact 5: spawn count, material, `localX === progress` for RIGHT, progress step,
     drained buffer clears particles, `hasWarning` slows speed to 0.1;
   - `spawnFlowParticle` start positions by direction (from the code, lines 138-155): RIGHT starts at `localX` 0,
     LEFT at `localX` 1, DOWN at `localY` 0, UP at `localY` 1; an empty-buffer pipe uses `MaterialType.DUST`; and
     `EMISSIVE_MATERIALS` has exactly the four members of fact 7.
   Build `PipeNode`s from `BuildingManager.placePipeRoute` where a real pipeline is needed, and directly as plain
   objects typed as `PipeNode` (types.ts lines 362-373) for the direction tests.
3. `ts/tests/test_voidrift_particle_sandbox_tiles_materials.ts` (no stubs needed):
   - `snapToTile`/`tileToCA`: the exact values of fact 6; the round trip `snapToTile(tileToCA(tx, ty).x, tileToCA(tx, ty).y)`
     equals `{ tx, ty }` for the four corner tiles (0,0), (39,0), (0,24), (39,24) and an interior tile; adding
     `BUILDING_TILE - 1` to both coordinates still snaps to the same tile; adding `BUILDING_TILE` moves to the next
     tile (except at the last row/column, where it clamps);
   - `MATERIAL_DEFS`: exactly 12 entries whose numeric keys are 0..11 and every `def.id === Number(key)`; names
     non-empty and unique; `color` matches `/^#[0-9a-f]{6}$/i`; `rgb` has 3 integers in 0-255 and equals the bytes of
     `color` (it holds for the first rows read; if any of the 12 differs, report it instead of dropping the check);
     `unlockedAtTier` >= 1 where defined; the set of ids with `isEmissive === true` equals `EMISSIVE_MATERIALS`
     (import it from `flowParticles.ts`); `MaterialType` has 12 enum values (`Object.values(MaterialType).filter(v => typeof v === 'number').length`).

## 4. What NOT to do

- Do not change any game code, and do not edit the two existing test files.
- Do not use real randomness: any test that depends on `Math.random` must stub it (the one exception is the pure
  tile/material tests, which do not call it).
- No snapshot files, no timing-based assertions, no `setTimeout`.
- Do not duplicate the existing 14 tests (grid allocation, one-dust conservation, placement, filters, asteroids,
  building defs).

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_voidrift_particle_sandbox_reactions.ts test_voidrift_particle_sandbox_flow.ts test_voidrift_particle_sandbox_tiles_materials.ts test_voidrift_particle_sandbox_simulation.ts test_voidrift_particle_sandbox_registry.ts
```

Reference, run when this directive was written: `uv run python --version` gave `Python 3.12.12`; the harness-proof
command `cd ts && npx vitest run test_arcade_manifest.ts test_voiddrift_redux_chrome.ts` gave `Test Files  2 passed (2)`
and `Tests  14 passed (14)`. Run that proof command once first and paste its real tail, to confirm the form works in
your worktree. The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here;
`ts/tests/...` paths find none. The two existing sandbox files hold 22 tests, so the five-file run ends at
5 files and 22 + your new tests. A failure that also fails on a clean main is pre-existing: record it, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry
  another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects. The only allowed
  exceptions are the fixed `cd ts && npx vitest run ...` and `cd ts && npx tsc --noEmit -p .` lines in
  section 5. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not use a search, memory or
  web tool beyond the Read, Glob and Grep tools inside the worktree. Do not hunt: everything you need is
  quoted in this directive; if a quoted line or a cited path is not where it says, STOP and write why in
  the Status row.
- Work only on branch `directive/rfdgamestudio-particle-sandbox-missing-tests-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with `<!-- new: path -->` in your report (and, where the file type allows, in
  a header comment).
- New logic goes in small new modules (one job per file, SOLID/SRP/KISS); no file you create or grow may
  pass 600 lines; edit files that are already over 600 lines in place, same line count.
- Free models only wherever any model configuration is touched (none is expected).
- Do not run `agentflow lint` or any other `agentflow` CLI. Do NOT run `uv run python -m studio.demos index`
  (the sandbox refuses it, and none of the work here changes the demo registry, so none is needed).
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`; run git with the worktree as the
  working directory.
- If the pre-push hook (or any hook) fails on a test unrelated to your change, stop and write
  `ready for controller finish` in the Status row; do not bypass the hook.
- Done means (the Status row): you stopped at `Review` after committing on the directive branch, with one
  line in the log giving the test pass counts. You do not mark Done and you do not merge.

## 7. Completion criteria

- [ ] The three new test files exist, each under 600 lines, each marked new in its header comment.
- [ ] The five-file vitest line passes: 5 files, 22 + N tests, N at least 20 (5 reaction pairs + 1 no-reaction +
      6 movement/expiry/bedrock + pipeline + 5 flow-particle + direction/emissive + tile + 4-5 material checks).
- [ ] `git status` shows exactly three created files and nothing else; nothing under
      `ts/src/games/voidrift_particle_sandbox/` is modified.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass
      counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: which rules are now pinned, and any measured value in section 1 that differed from your run (with
the observed value). Then evidence: the real output tails of the proof command and the five-file vitest run. Then
one recommended action per open item. List every created file with `<!-- new: path -->`. State that no game code
was changed and that nothing was deployed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching protected repos; installing or fetching
  anything; editing `.gitignore` or any `dist`/`dist-*` directory; changing gameplay, rules, balance or art
  beyond what this directive names; touching any demo other than the one named in this directive; running
  `agentflow` commands or `uv run python -m studio.demos index`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-particle-sandbox-missing-tests-directive |
| Base branch | - |
| Base commit | 53dd42f99d76775e44a08febf15a6f1a76ea9e7f |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 · robert-claude-laptop · none → Queued — wave-1 review follow-up: item-9 tests missing from the particle sandbox port (reaction rules, flow, tile round trip, MATERIAL_DEFS)
- 2026-10-04 05:48 · robert-claude-laptop · Queued → Approved — lint override: all 3 errors are test files the run creates (reactions, flow, tiles_materials), each marked with a new-file marker; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 06:14 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-particle-sandbox-missing-tests-directive; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
