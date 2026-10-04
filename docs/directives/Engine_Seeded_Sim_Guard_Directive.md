# Engine: a guard test that stops new bare Math.random / Date.now in sim-core code

**Read first:** `docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md` (sections a, e E0),
`ts/src/engine/shared/seededRandom.ts` (mulberry32, hashStringToSeed).

## 1. Why this exists

Determinism is per game and unenforced. In sim-core scope (`ts/src/engine/shared/**`
excluding `sfx/` and `components/`, plus `ts/src/games/*/simulation/**`) there are 119
bare `Math.random` / `Date.now` / `performance.now` uses in 17 files. Real output from
`cd ts && grep -rcE "Math\.random|Date\.now|performance\.now" src/engine/shared src/games/*/simulation --include=*.ts | grep -v ":0$" | grep -v sfx/`
at origin/main `cc793954`:

```
src/engine/shared/anatomy/anatomyModule.ts:5
src/engine/shared/sportsSim/BallSystem.ts:4
src/engine/shared/sportsSim/CombatSystem.ts:6
src/engine/shared/sportsSim/DisposalSystem.ts:10
src/engine/shared/sportsSim/GameEngine.ts:8
src/games/gladiator_arena/simulation/balanceHarness.ts:2
src/games/gladiator_arena/simulation/championLadder.ts:6
src/games/gladiator_arena/simulation/combatEngine.ts:6
src/games/gladiator_arena/simulation/forgeEconomy.ts:10
src/games/mutant_battle_ball/simulation/mbbSimulation.ts:1
src/games/mutant_battle_ball/simulation/mbbTick.ts:1
src/games/shoal/simulation/shoalSimulation.ts:1
src/games/voiddrift_redux/simulation/engine.ts:33
src/games/voidrift_particle_sandbox/simulation/asteroids.ts:7
src/games/voidrift_particle_sandbox/simulation/flowParticles.ts:3
src/games/voidrift_particle_sandbox/simulation/grid.ts:15
src/games/voidrift_particle_sandbox/simulation/renderer.ts:1
```

We do not fix these here. We freeze them: the count per file may only go down.

## 2. Scope (in order)

1. NEW `ts/tests/seeded_sim_guard.baseline.json` (first line is not allowed in JSON, so the
   marker lives in the key `"_note": "GUARD BASELINE: counts may only shrink; lower a number when you remove a use"`): a map (the `_note` key is ignored by the test) of repo-relative path (forward slashes, relative to `ts/`) to allowed count, containing exactly the 17 files and counts above.
2. NEW `ts/tests/test_seeded_sim_guard.ts` (first line comment `// NEW: seeded-sim guard, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md`).

## 3. The work

The test, using `node:fs` and `node:path` only (no new dependency):
- Walk the scope directories listed above (from `process.cwd()` = `ts/` when vitest runs there; resolve with `path.resolve(__dirname, '..')`). Include `.ts` and `.tsx`, skip `sfx/`, `components/`, `node_modules`.
- Count regex matches of `/\bMath\.random\b|\bDate\.now\b|\bperformance\.now\b/g` per file after removing `//` line comments and `/* */` blocks (simple strip is enough).
- Test 1 "no new violations": for every file with count > 0, the baseline must have that file and `count <= baseline[file]`; failure message names the file and says: `use mulberry32 from engine/shared/seededRandom (inject rng) or pass the clock in`.
- Test 2 "baseline can only shrink": every baseline entry must still exist as a file and `baseline[file] >= count`; when `count < baseline[file]` fail with `lower ts/tests/seeded_sim_guard.baseline.json to <count>` (this forces the ratchet down).
- Test 3 "baseline is real": the baseline has no entry with count 0 or a missing file.
Do NOT edit any sim file.

## 4. What NOT to do

- Do not replace any `Math.random` in any game, and do not touch the 17 files.
- Do not widen the scope to `App.tsx`, UI or `sfx/` (cosmetic randomness is allowed).
- Do not add dependencies, ESLint rules or hooks. Do not touch `scripts/check.ps1`.
- No build or vite-node commands.

## 5. Verification

- `cd ts && npx vitest run test_seeded_sim_guard.ts` : 3 tests pass.
- Negative check, in your head only, not as a file: the message text must be what a developer needs. Do not create scratch files to prove it.
- `cd ts && npx tsc --noEmit` : exit 0.
- `git status` shows only the 2 new files; `git diff --stat` empty for tracked files.

## 6. Rules for this run

- The run is NON-INTERACTIVE. Any tool call needing confirmation is rejected and the run ends mid-task. Install, download or fetch nothing; read nothing outside the working directory. Do not search, glob or hunt: if something expected is missing, stop and write that in the Status row.
- Sandbox needs only `cd ts && npx vitest run <bare filename>`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`, and edits. No build, vite-node, or python commands.
- Never commit to main/master, never push, never deploy. Work on branch `directive/engine-seeded-sim-guard`; Robert merges.
- Create no scratch or debug files (deleting is denied in the sandbox). If one is unavoidable it goes under `.devin-scratch/` and stays.
- Do not hand-write a Queue block. If a tool call is genuinely blocked, stop and write why in the Status row.

## 7. Completion criteria

- The two new files exist with the marker comments; 3 tests pass; tsc exit 0.
- Status row: done = branch committed, tests green, verification output pasted in the Status log.

## 8. Report

Test output tail, the baseline total (must read 119), and anything surprising in the walk (files with zero count that were excluded).

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 17:33 · robert-claude-laptop · none → Queued
<!-- queue:end -->
