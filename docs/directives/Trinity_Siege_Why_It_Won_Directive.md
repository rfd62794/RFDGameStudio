# trinity_siege: say why each duel went the way it did (S)

**Depends on:** none (it only adds a new module and one line in `WaveLog.tsx`; the combat tests are independent).
**Read first** (everything this run needs is pasted below; these are the files to open):
`examples/trinity-siege/src/components/WaveLog.tsx` (the duel list, search for `Duel result`), `examples/trinity-siege/src/types.ts` (`DuelLog`, `SHAPE_MATRIX`, `UnitShape`), `examples/trinity-siege/src/App.tsx` (the header badge and the manual footer), `docs/demos/trinity_siege/DIRECTION.md` (Replan step 2).

## 1. Why this exists

After each resolve the log shows maths ("Attacker: 3 * 1.0 lean * 1.5 shape = 4.5 eff") but never the one sentence a player wants: why did my defender win or lose, and what should I build next. Five waves of a lookup table give "no sense of why a counter beat a shape".
Measured on origin/main `889dd21e`: `WaveLog.tsx` renders, per duel, the participants, the maths and `Outcome: Defender Wins!` / `Attacker Wins!` / `Mutual Destruction`. The header badge in `App.tsx` reads `Wave Defense MVP` (line 456) and the manual footer `MVP Ruleset version 1.0` (line 517): developer words. (A how-to-play manual already exists, so no separate first-wave hint is added.)

## 2. Scope

1. New module `<!-- new: examples/trinity-siege/src/explain.ts -->`: `explainDuel` and `counterTo`, pure, no React.
2. `examples/trinity-siege/src/components/WaveLog.tsx`: one import and one line.
3. `examples/trinity-siege/src/App.tsx`: two string edits.
4. New test `<!-- new: ts/tests/test_trinity_siege_explain.ts -->`.

## 3. The work

`WaveLog.tsx` and `App.tsx` use CRLF; keep it.

**Step 1: `explain.ts`.** Create it with exactly:

```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// One plain sentence per duel: why it went the way it did. Pure, no React.
import { DuelLog, SHAPE_MATRIX, UnitShape } from "./types";

const SHAPES = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE];

/** The shape that beats `shape` (SHAPE_MATRIX[x][shape] > 1). */
export function counterTo(shape: UnitShape): UnitShape {
  return SHAPES.find(s => SHAPE_MATRIX[s][shape] > 1.0) ?? shape;
}

export function explainDuel(d: DuelLog): string {
  const defEdge = SHAPE_MATRIX[d.defenderShape][d.attackerShape]; // >1 = defender's shape counters
  const wall = d.defenderHasWall ? " The wall doubled its strength." : "";
  if (d.outcome === "both_die") {
    return "Evenly matched: both fell.";
  }
  if (d.outcome === "defender_wins") {
    if (defEdge > 1) return `${d.defenderShape} counters ${d.attackerShape}, so your defender won easily.${wall}`;
    if (defEdge < 1) return `${d.attackerShape} counters ${d.defenderShape}, but your defender was strong enough to win.${wall}`;
    return `Same shape, and your defender was stronger.${wall}`;
  }
  if (defEdge < 1) {
    return `${d.attackerShape} counters ${d.defenderShape}. Next time put a ${counterTo(d.attackerShape)} here.`;
  }
  if (defEdge > 1) return `Your ${d.defenderShape} had the edge, but the attacker was much stronger. Add more defenders or a wall.`;
  return `Same shape, and the attacker was stronger. Add a wall or another defender.`;
}
```

**Step 2: `WaveLog.tsx`.** Add `import { explainDuel } from "../explain";` directly under the closing `} from "../types";` of the types import. Directly above the line `{/* Duel result */}` add:
```tsx
                            <p className="mt-1 text-[10px] font-sans text-slate-300 leading-snug">{explainDuel(duel)}</p>
```

**Step 3: `App.tsx`.** Change `>Wave Defense MVP<` to `>Wave Defense<` (header badge), and `MVP Ruleset version 1.0` to `Trinity Siege` (manual footer). Nothing else.

**Step 4: test.** Create `ts/tests/test_trinity_siege_explain.ts` with exactly:

```ts
// new: ts/tests/test_trinity_siege_explain.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UnitShape, type DuelLog } from '../../examples/trinity-siege/src/types';
import { explainDuel, counterTo } from '../../examples/trinity-siege/src/explain';

const duel = (over: Partial<DuelLog>): DuelLog => ({
  id: 'x', attackerShape: UnitShape.CIRCLE, attackerInitialStrength: 3,
  defenderShape: UnitShape.TRIANGLE, defenderInitialStrength: 3, defenderHasWall: false,
  attackerEffectiveStrength: 1.5, defenderEffectiveStrength: 4.5, outcome: 'defender_wins',
  attackerRemainingStrength: 0, defenderRemainingStrength: 1, ...over,
});

describe('trinity_siege explainDuel', () => {
  it('counterTo is the shape that beats it', () => {
    expect(counterTo(UnitShape.CIRCLE)).toBe(UnitShape.TRIANGLE);
    expect(counterTo(UnitShape.SQUARE)).toBe(UnitShape.CIRCLE);
    expect(counterTo(UnitShape.TRIANGLE)).toBe(UnitShape.SQUARE);
  });
  it('says why a counter won', () => {
    expect(explainDuel(duel({}))).toBe('Triangle counters Circle, so your defender won easily.');
  });
  it('mentions the wall when it helped', () => {
    expect(explainDuel(duel({ defenderHasWall: true }))).toContain('The wall doubled its strength.');
  });
  it('tells the player which shape to build after a loss to a counter', () => {
    const d = duel({ attackerShape: UnitShape.CIRCLE, defenderShape: UnitShape.SQUARE, outcome: 'attacker_wins' });
    expect(explainDuel(d)).toBe('Circle counters Square. Next time put a Triangle here.');
  });
  it('handles a draw and a same-shape result in plain words', () => {
    expect(explainDuel(duel({ outcome: 'both_die' }))).toBe('Evenly matched: both fell.');
    const same = duel({ attackerShape: UnitShape.SQUARE, defenderShape: UnitShape.SQUARE, outcome: 'attacker_wins' });
    expect(explainDuel(same)).toContain('Same shape');
  });
  it('is wired into WaveLog.tsx', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../../examples/trinity-siege/src/components/WaveLog.tsx'), 'utf8');
    expect(src).toContain('explainDuel(duel)');
    expect(src).toContain('from "../explain"');
  });
  it('App.tsx shows no MVP wording', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../../examples/trinity-siege/src/App.tsx'), 'utf8');
    expect(src).not.toMatch(/MVP/);
  });
});
```

## 4. What NOT to do

- No change to `combat.ts`, `types.ts`, game rules, balance or wave generation. The sentence is derived from the existing `DuelLog` and `SHAPE_MATRIX` only.
- Do not remove the maths lines or the Outcome line: the new sentence is added above them.
- No new dependency, no TS-native rewrite. Edits live in `examples/trinity-siege/src` only (an AI Studio re-export would overwrite them: keep the diff small).
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04): `cd ts && npx vitest run test_trinity_siege_explain.ts` fails to load (0 tests; `explain.ts` does not exist).

After editing:
```
cd ts && npx vitest run test_trinity_siege_explain.ts test_trinity_siege_blurb.ts
```
Real tail from a prototype of exactly these edits (2026-10-04, with the combat test beside it): `Test Files  3 passed (3)` / `Tests  22 passed (22)` (7 explain, 12 combat, 3 blurb; the combat file exists only after `Trinity_Siege_Combat_Tests_Directive`, so without it expect `Test Files  2 passed (2)` / `Tests  10 passed (10)`).

The example app has no `node_modules` in a fresh worktree, so its own build cannot run here; the tests are the gate.

**Controller finish (after merge):** rebuild the embed; screenshot a resolve log (the new sentence) and take a 390x844 phone screenshot (re-measure the old 370 vs 358 px overflow).

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `npm run build:*`, `vite-node` or
  `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge, see Controller finish).
  Do not use `npx tsc` as a check: in a fresh worktree it reports unrelated errors about the gitignored `game-metadata.json`.
- Do not run `git merge origin/main`. If you need to know whether main moved, use `git fetch origin` then `git rev-list --count HEAD..origin/main`.
- Files you edit use CRLF line endings; keep them (the Edit tool preserves them). New files may use either; use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `explain.ts` exists as pasted; `WaveLog.tsx` renders `explainDuel(duel)` per duel; `App.tsx` no longer says `MVP`.
- [ ] `cd ts && npx vitest run test_trinity_siege_explain.ts test_trinity_siege_blurb.ts` passes (real tail pasted).
- [ ] No file outside the four in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the sentence shapes as shipped (counter won / wrong shape lost with a "put a X here" tip / draw / same shape). Evidence second: the real vitest tail. Say plainly that the screenshot of the resolve log and the phone re-measure are NOT done by this run.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/trinity-why-won |
| Base branch | - |

**Status log**
- 2026-10-04 13:29 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review: explain.ts + WaveLog p line + App.tsx MVP->name (both strings); verbatim test uses /\bMVP\b/ source escapes (spec file's literal 0x08 bytes would not match); `npx vitest run test_trinity_siege_explain.ts test_trinity_siege_blurb.ts` Test Files 2 passed (2) / Tests 10 passed (10); no tsc per spec; screenshot/phone re-measure NOT done (controller finish)
<!-- queue:end -->
