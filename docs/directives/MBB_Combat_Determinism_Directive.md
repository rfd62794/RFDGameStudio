# Make MBB combat obey the seed it is already given

## 1. Why this exists

`ts/tests/test_mbb_match_rendering_point_cap_symmetry.ts` fails at random and **blocks the
pre-push hook**, so pushing an unrelated branch fails for reasons that have nothing to do
with it. That is how this was found on 2026-09-21: pushing a Python-only branch
(`directive/rfdgamestudio-seed-shoal-tests`, 70 seed lines in `tests/test_shoal.py`) was
rejected with `FAILED: TypeScript tests (exit 1)`.

Measured, three consecutive runs of that one file:

```
run 1  [point cap] cap=3 ended at tick 305, cap=5 ended at tick 566   PASS
run 2  [point cap] cap=3 ended at tick 406, cap=5 ended at tick 565   FAIL
       AssertionError: expected 10 to be less than or equal to 8
run 3  [point cap] cap=3 ended at tick 305, cap=5 ended at tick 467   PASS
```

Note run 2 failed a **different** assertion than the one the full-suite run failed
(`expected 314 to be greater than or equal to 406`). At least two assertions in this file
are non-deterministic, so widening one tolerance will not fix it.

The cause is not the test. The simulation accepts a seed and then ignores it:

- `src/games/mutant_battle_ball/simulation/mbbSimulation.ts:60-61` resolves the seed and
  builds the PRNG:
  ```ts
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2147483647);
  const prng = makePrng(resolvedSeed);
  ```
  and stores it on the match state (line 99). `mbbTick.ts:359,386` uses it correctly as
  `st.prng()`.
- `src/engine/shared/sportsSim/CombatSystem.ts` does not. It calls `Math.random()` at
  **lines 40, 41, 51 (twice), 109, 145, 146** — eight calls — so every combat resolution is
  unseeded no matter what seed the caller passed.

The test file even documents this at line 614: *"CombatSystem uses Math.random()
(non-deterministic)"*, and line 648: *"The old deterministic PRNG produced perfect
symmetry."* Someone already widened the tolerances to live with it. It still flakes.

## 2. Scope

In, in this order:

1. `ts/src/engine/shared/sportsSim/CombatSystem.ts` — the eight `Math.random()` calls.
2. `ts/src/engine/shared/sportsSim/GameEngine.ts:391` — one `executeAttack` call site.
3. `ts/src/games/mutant_battle_ball/simulation/mbbCombat.ts:65,155` — two call sites.
4. `ts/src/games/mutant_battle_ball/simulation/mbbTick.ts` — where `st.prng` is already in
   hand and has to be passed down.

**Out of scope, do not touch:** `anatomyModule.ts`, `chimeraAnimationEngine.ts`,
`executor.ts` or any other `Math.random()` in the tree. They have the same smell and are a
separate job. Do not touch `seededRandom.ts` — its header forbids changing the algorithm,
and nothing here needs it changed.

## 3. The work

Thread the existing PRNG into `CombatSystem` as an explicit parameter. Do not create a new
PRNG, do not read a global, do not add a module-level singleton — a hidden RNG is the same
bug in a new place.

`CombatSystem.executeAttack` currently ends its parameter list with `tick: number`. Add one
more:

```ts
public static executeAttack(
  attacker: Player,
  target: Player,
  ball: Ball,
  rules: CombatRules,
  tick: number,
  rng: () => number
): CombatResult {
```

Replace each `Math.random()` in that method with `rng()`. The scatter and velocity
expressions keep their shape exactly — only the source of the number changes:

```ts
attacker.velocity = { x: (rng() - 0.5) * 3, y: (rng() - 0.5) * 3 };
```

Then pass it at each call site. `mbbTick.ts` already holds `st.prng`, so it flows
`st.prng` into the `mbbCombat.ts` helpers and on into `executeAttack`. Add the parameter to
the `mbbCombat.ts` helpers the same way rather than reaching for the state object inside
them.

`GameEngine.ts:391` is the one call site outside MBB. If no seeded PRNG is available there,
pass `Math.random` **explicitly** at that call site and leave a one-line comment saying so.
That keeps the non-determinism visible at the boundary instead of buried six frames down —
and it is a finding worth reporting, not something to fix here.

**Make no change to any test's assertions or tolerances.** If a test still fails after the
threading is done, that is the finding; report it, do not widen it.

## 4. What NOT to do

- **Do not weaken, widen, skip or delete an assertion** to get a green number. The
  tolerances in this file were already widened once, and that is why this took so long to
  notice. If determinism does not fix a test, say so.
- **Do not change the mulberry32 algorithm or `seededRandom.ts`.** Its header requires
  byte-identical output for a fixed seed across artGen, SlimeVisual and Planet of Greed.
- **Do not fix `Math.random()` anywhere outside the four files in section 2.**
- **Do not add a module-level or singleton RNG.** Pass it.
- **Do not reorder RNG draws.** Two `rng()` calls on one line must stay in the same order,
  or a fixed seed produces a different sequence and the whole point is lost.
- **Do not run the full `npx vitest run`** until the end — it takes over 40 seconds.

## 5. Verification

Determinism first. The same seed must produce the same result every time:

```bash
cd ts && npx vitest run tests/test_mbb_match_rendering_point_cap_symmetry.ts
```

Run it **five times** and paste the `[point cap] cap=3 ended at tick ..., cap=5 ended at
tick ...` line from each. All five must be **identical**. Today they are 305/566, 406/565
and 305/467 — three different answers from the same test.

Then the file must pass all five times, not once.

Then the suite, once:

```bash
cd ts && npx vitest run
```

Baseline to beat: **1 failed | 138 passed | 1 skipped** files, **1 failed | 1643 passed |
30 skipped** tests. Expected after: 0 failed. Anything newly failing is a regression you
caused.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected
  outright and the run ends mid-task. Do not install, download or fetch anything. Do not
  read outside this working directory, and do not use a memory or web tool. Do not search
  or glob for a file that is missing — stop and write that in the Status row.
- **The test command for this repo's TypeScript is `cd ts && npx vitest run <file>`.**
  `ts/node_modules` is junctioned into the worktree, so the dependencies are already there;
  never let npx try to download anything.
- **Committing may fail.** As of 2026-09-21 `DirectiveQueueMCP/devin_rules.json` grants no
  `git commit`, so the call is rejected and the run ends even though the work is finished.
  If that happens it is not your fault and there is nothing to work around: leave the work
  in the worktree and it will be committed by hand. Do not retry it another way.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never
  deploy.** Only Robert merges.
- Update this directive's Status row when you finish or stop partway.

## 7. Completion criteria

- [ ] All eight `Math.random()` calls in `CombatSystem.ts` take their number from an `rng`
      parameter instead.
- [ ] Every call site passes a real seeded PRNG, except `GameEngine.ts:391` if none exists
      there, which passes `Math.random` explicitly with a comment.
- [ ] Five consecutive runs of the point-cap test print an identical `[point cap]` line.
- [ ] Five consecutive runs of the point-cap test pass.
- [ ] `npx vitest run` shows 0 failed, against the 1-failed baseline above.
- [ ] No assertion, tolerance or skip was changed; `seededRandom.ts` untouched.

## 8. Report

State: the five `[point cap]` lines verbatim; the final suite numbers; whether
`GameEngine.ts:391` had a seeded PRNG available or needed the explicit `Math.random`; and
any test that still flakes after threading, since that means a second unseeded source
exists and naming it is the most useful thing this run can produce.
