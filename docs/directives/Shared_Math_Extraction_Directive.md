# Shared math: extract `ts/src/engine/shared/math` (ADR-014)

**Read first:** `docs/superpowers/specs/2026-09-23-engine-shared-modules.md`,
`ts/src/engine/shared/seededRandom.ts` (module conventions),
`ts/src/engine/shared/index.ts` (export pattern),
`ts/src/games/mutant_battle_ball/simulation/mbbMath.ts`,
`ts/src/games/shoal/simulation/shoalSimulation.ts` (lines ~90-100: the
duplicated block), `docs/adr/ADR-014-shared-engine-modules-default.md`.

## 1. Why this exists

`clamp`, `dist2`, `distance`, `normalize`, `limitVector`, `lerp` are
byte-identical between `mbbMath.ts` and `shoalSimulation.ts`, and both files
carry the same LCG PRNG (`makePrng`/`prngFloat`/`prngInt`, deliberately
matching Lua `math.random` semantics for port parity — distinct from
`seededRandom`'s mulberry32). 29 game files do distance/vector math. This is
ADR-014's "real second use" many times over.

## 2. The work

### 2.1 New module `ts/src/engine/shared/math.ts`

Move (don't redesign) these, keeping signatures and semantics identical:

```
clamp(v, min, max)          lerp(a, b, t)           dist2(ax, ay, bx, by)
distance(ax, ay, bx, by)    normalize(vx, vy)        limitVector(vx, vy, max)
makePrng(seed)              prngFloat(prng, a, b)    prngInt(prng, a, b)
```

The LCG constants (`LCG_MOD`/`LCG_MULT`/`LCG_INC`, hi/lo split) move
byte-for-byte from `mbbMath.ts` — the Lua-parity comment comes too. Export
each; add `export * from './math';` to `shared/index.ts`.

### 2.2 Migrate the two proven consumers

- `mbbMath.ts`: delete the moved functions/PRNG, re-export from
  `engine/shared` (`export { clamp, ... } from '../../engine/shared'` — match
  the existing import depth style). Keep any mbb-only helpers local.
- `shoalSimulation.ts`: delete the duplicated block, import from
  `engine/shared`. Keep `wrap`/`wrapX`/`clampDepth` local (world-specific,
  below the bar).
- Check every importer of `mbbMath` still resolves (mbbSimulation.ts
  re-exports `makePrng`/`prngFloat`/`prngInt` through its barrel — preserve
  that re-export or update its callers).
- Grep `ts/src/games` for other inline copies of the same helpers
  (`grep -n "function dist2\|function clamp"`) and migrate any verbatim
  copies found; partial/variant implementations stay local.

### 2.3 Tests

New `ts/tests/` (or wherever vitest picks up shared-module tests — check how
existing shared modules are tested first and follow that location/pattern):
each function's behavior against known values, including `makePrng` producing
the same sequence as the old mbb implementation for a fixed seed (lock the
LCG constants in a test).

## 3. What NOT to do

- No behavior changes — extraction only. Do not "improve" the math.
- Do not move `wrap` (shoal-specific) or any game-specific helper.
- Do not touch `seededRandom`/`mulberry32` — the LCG is a separate tool for
  Lua-parity ports; document that distinction in a module comment if the file
  already uses header comments.
- No new dependencies; do not touch `engine/types.ts` (separate directive).

## 4. Completion criteria

- [ ] `cd ts && npx vitest run` — no new failures. Baseline recorded
      2026-09-23 on `main`: 3 failures, all in
      `tests/test_dual_target_deploy.ts` (ENOENT on stale `dist-shoal` asset
      hashes) — pre-existing, not yours to fix.
- [ ] `cd ts && npm run build` — tsc clean.
- [ ] `grep -rn "function dist2" ts/src/games` returns nothing.

## Sandbox needs

- Exec(npm run build)
- Exec(npx vitest)
- Exec(npm test)

## 5. Rules for this run

- NON-INTERACTIVE: confirmation-requiring tool calls end the run. No
  installs, downloads, fetches, or reads outside the worktree
  (`node_modules` is already installed).
- **Never use `git -C` / `git -c` / `git --git-dir` / `git --work-tree` —
  flag forms are denied by dispatch policy and a denial ends the run.** Run
  git with the worktree as your working directory.
- Branch `directive/rfdgs-shared-math-extraction-directive` from `main`.
  Never commit to `main`, never push.
- If a tool call is genuinely blocked, stop and write why in the Status row.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin-laptop |
| Branch | directive/rfdgamestudio-shared-math-extraction-directive |
| Base branch | directive/rfdgamestudio-shared-math-extraction-directive |
| Base commit | 60b8216926ba82f73458a265710b7c28c05f42de |

**Status log**
- 2026-09-23 11:08 · devin-overseer · none → Queued — spec docs/superpowers/specs/2026-09-23-engine-shared-modules.md; byte-identical dupes verified; awaiting Robert approval
- 2026-09-24 10:00 · devin-overseer (delegated) · Queued → Approved
- 2026-09-24 10:05 · dispatcher · Approved → In progress — dispatched devin-laptop on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-shared-math-extraction-directive; base origin/main (local main differs); copied ts/src/games/game-metadata.json; lane=strong; model=default
- 2026-09-24 10:36 · agentflow-tick · In progress → Blocked — process gone while the directive still reads In progress; the worktree holds uncommitted files; resume cap reached (2/2)
- 2026-09-24 12:51 · robert-claude-laptop · Blocked → Queued
- 2026-09-24 12:53 · robert-claude-laptop · Queued → Approved
- 2026-09-24 15:39 · robert-claude-laptop · Approved → In progress — Salvage finished on the laptop (Haiku agent, steps 1-5 of the salvage note); moving through In progress to Review.
- 2026-09-24 15:39 · robert-claude-laptop · In progress → Review — PR #30 merged to main as 70e7373e under the permanent safe-merge approval; vitest 1916 passed / 0 failed on Windows. Done is Robert's. [origin] spent: devin 2 min est. n/a
<!-- queue:end -->
