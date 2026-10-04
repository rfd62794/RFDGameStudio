# Shoal: headless run test, and tests that check behaviour instead of source text (Size S)

**Depends on:** none. **Why Shoal:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `shoal` (Tier C showcase, the only `stable` demo).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/shoal/DIRECTION.md` (Replan item 2), `ts/tests/test_shoal_chrome_polish.ts`, `ts/src/games/shoal/components/TitleScreen.tsx`,
`ts/src/games/shoal/simulation/shoalSimulation.ts` (lines 693-733, the public API), `ts/tests/test_button.tsx` (the pattern for rendering a component in a test).

## 1. Why this exists

Shoal is the arcade's only `stable` game, but two of its checks do not check behaviour:

- `ts/tests/test_shoal_chrome_polish.ts` reads `App.tsx`, `TitleScreen.tsx` and `ReefPrimer.tsx` as text and asserts that strings appear
  (for example `expect(appSource).toContain('Seed a New Reef')`). Those tests pass while the screen is broken. Four blocks do this today:
  `describe('Shoal polish — title screen')`, `describe('Shoal polish — first-run tutorial')`, the test
  `it('App wires event sounds to the render-state diff and a mute toggle')`, and `describe('Shoal polish — end state')`.
- Nothing runs the simulation for a long time and checks it stays sane (Tier B item B4 in `docs/superpowers/specs/2026-10-03-demo-polish-standard.md`).

Measured on origin/main `d3084de0` (2026-10-04) by running the simulation for 2,000 ticks of `dt = 0.05` on the four title-screen scenarios, seeds 1, 42 and 7:

```
balanced 1  {"fish":86,"sharks":0,"algae":31,"chunks":6}   minLife 59
balanced 42 {"fish":90,"sharks":0,"algae":47,"chunks":11}  minLife 58
balanced 7  {"fish":79,"sharks":0,"algae":38,"chunks":4}   minLife 52
sparse 1    {"fish":68,"sharks":0,"algae":42,"chunks":0}   minLife 30
sparse 42   {"fish":60,"sharks":0,"algae":50,"chunks":1}   minLife 26
sparse 7    {"fish":70,"sharks":0,"algae":29,"chunks":0}   minLife 32
frenzy 1    {"fish":79,"sharks":0,"algae":58,"chunks":4}   minLife 43
frenzy 42   {"fish":73,"sharks":0,"algae":44,"chunks":7}   minLife 41
frenzy 7    {"fish":74,"sharks":0,"algae":42,"chunks":2}   minLife 33
lush 1      {"fish":97,"sharks":0,"algae":68,"chunks":0}   minLife 68
lush 42     {"fish":99,"sharks":0,"algae":60,"chunks":4}   minLife 72
lush 7      {"fish":99,"sharks":0,"algae":75,"chunks":0}   minLife 67
doom (1 fish, 8 sharks, 0 algae hubs, seed 3) {"fish":0,"sharks":0,"algae":16,"chunks":0}
```

Meaning: fish always survive, no count is negative, extinction is reachable. A finding the run must NOT fix, only report: in all 12 runs every shark is gone by tick 2,000
(100 simulated seconds), so a reef left alone ends fish-only. That may be intended (sharks starve without prey) or a balance issue; it is Robert's call, so the test does not assert on shark counts at the end.

## 2. Scope

1. New test `<!-- new: ts/tests/test_shoal_headless.ts -->`: a headless run per scenario plus extinction and survival checks.
2. New test `<!-- new: ts/tests/test_shoal_title_render.tsx -->`: renders the title screen and clicks its buttons.
3. Edit `ts/tests/test_shoal_chrome_polish.ts`: cut the four source-text blocks, the two file reads and the now-unused imports; keep every other test unchanged.

## 3. The work

**Step 1: create `ts/tests/test_shoal_headless.ts`** with exactly this content (the first line is the new-file marker):

```ts
// new: ts/tests/test_shoal_headless.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createShoalSimulation } from '../src/games/shoal/simulation/shoalSimulation';
import type { RenderState } from '../src/games/shoal/types';

// The four title-screen scenarios (ts/src/games/shoal/components/TitleScreen.tsx SCENARIOS).
const SCENARIOS = [
  { name: 'balanced', fish: 60, sharks: 8, hubs: 6 },
  { name: 'sparse', fish: 30, sharks: 4, hubs: 4 },
  { name: 'frenzy', fish: 50, sharks: 16, hubs: 5 },
  { name: 'lush', fish: 70, sharks: 4, hubs: 10 },
];

const TICKS = 2000;
const DT = 0.05;

function runReef(seed: number, fish: number, sharks: number, hubs: number): RenderState[] {
  const sim = createShoalSimulation();
  sim.initGame(seed, { initialFish: fish, initialSharks: sharks, initialAlgaeHubs: hubs });
  const frames: RenderState[] = [];
  for (let i = 0; i < TICKS; i++) frames.push(sim.tickGame(DT, null));
  return frames;
}

function expectSane(frames: RenderState[]): void {
  for (const rs of frames) {
    const { fish_count, shark_count, algae_count, chunk_count } = rs.stats;
    for (const n of [fish_count, shark_count, algae_count, chunk_count]) {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
    }
    for (const c of [...rs.fish, ...rs.sharks]) {
      expect(Number.isFinite(c.x)).toBe(true);
      expect(Number.isFinite(c.depth)).toBe(true);
    }
  }
}

describe('Shoal headless run', () => {
  for (const s of SCENARIOS) {
    it(`${s.name}: ${TICKS} ticks, no NaN, no negative counts, fish survive`, () => {
      const frames = runReef(42, s.fish, s.sharks, s.hubs);
      expect(frames).toHaveLength(TICKS);
      expectSane(frames);
      expect(frames[TICKS - 1].stats.fish_count).toBeGreaterThan(0);
    }, 60000);
  }

  it('extinction is reachable: one fish, eight sharks, no algae ends with no life', () => {
    const frames = runReef(3, 1, 8, 0);
    expectSane(frames);
    const last = frames[TICKS - 1].stats;
    expect(last.fish_count + last.shark_count).toBe(0);
  });

  it('survival is reachable: the balanced reef still has fish at the end', () => {
    const last = runReef(42, 60, 8, 6)[TICKS - 1].stats;
    expect(last.fish_count + last.shark_count).toBeGreaterThan(0);
  });
});
```

**Step 2: create `ts/tests/test_shoal_title_render.tsx`** with exactly this content:

```tsx
// new: ts/tests/test_shoal_title_render.tsx
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

vi.mock('../src/games/shoal/components/ReefPreview', () => ({
  default: () => null,
}));

import TitleScreen from '../src/games/shoal/components/TitleScreen';

async function renderTitle(onStart: (c: unknown) => void, onHowToPlay: () => void) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <TitleScreen session={undefined as never} onStart={onStart} onHowToPlay={onHowToPlay} />,
    );
  });
  return { container, root };
}

function buttonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(text),
  );
  if (!found) throw new Error(`no button containing "${text}"`);
  return found as HTMLButtonElement;
}

describe('Shoal title screen (rendered)', () => {
  it('Start Reef starts the Balanced scenario with a null seed', async () => {
    const onStart = vi.fn();
    const { container, root } = await renderTitle(onStart, () => {});
    await act(async () => {
      buttonByText(container, 'Start Reef').click();
    });
    expect(onStart).toHaveBeenCalledWith({
      initial_fish: 60,
      initial_sharks: 8,
      initial_algae_hubs: 6,
      seed: null,
    });
    root.unmount();
  });

  it('picking Feeding Frenzy changes what Start Reef starts', async () => {
    const onStart = vi.fn();
    const { container, root } = await renderTitle(onStart, () => {});
    await act(async () => {
      buttonByText(container, 'Feeding Frenzy').click();
    });
    await act(async () => {
      buttonByText(container, 'Start Reef').click();
    });
    expect(onStart).toHaveBeenCalledWith({
      initial_fish: 50,
      initial_sharks: 16,
      initial_algae_hubs: 5,
      seed: null,
    });
    root.unmount();
  });

  it("Today's Reef passes the daily seed and How to Play opens the primer", async () => {
    const onStart = vi.fn();
    const onHowToPlay = vi.fn();
    const { container, root } = await renderTitle(onStart, onHowToPlay);
    await act(async () => {
      buttonByText(container, "Today's Reef").click();
    });
    expect(onStart.mock.calls[0][0]).toMatchObject({ seed: 'daily' });
    await act(async () => {
      buttonByText(container, 'How to Play').click();
    });
    expect(onHowToPlay).toHaveBeenCalledTimes(1);
    root.unmount();
  });
});
```

**Step 3: edit `ts/tests/test_shoal_chrome_polish.ts`.** The file has CRLF line endings; keep them. Do all of this in one pass:

- Delete the two import lines `import { readFileSync } from 'node:fs';` and `import { resolve } from 'node:path';`.
- Replace the header comment (the `/** ... */` block that starts `test_shoal_chrome_polish` and says "Component wiring is asserted at source level") with:

```ts
/**
 * test_shoal_chrome_polish
 *
 * Behaviour tests for the Shoal chrome: the pure reef-event detector and the
 * Web Audio engine. Title-screen behaviour lives in test_shoal_title_render.tsx
 * and the simulation in test_shoal_headless.ts.
 */
```

- Delete the three constants `const appSource = readFileSync(...)`, `const titleSource = readFileSync(...)` and `const primerSource = readFileSync(...)` (each is a multi-line statement ending in `);`).
- Delete these four blocks whole: `describe('Shoal polish — title screen', ...)`, `describe('Shoal polish — first-run tutorial', ...)`, the single `it('App wires event sounds to the render-state diff and a mute toggle', ...)` inside the sound-engine describe, and `describe('Shoal polish — end state', ...)`.
- Keep `mkRs`, the reef-event-detection describe and every other test in the sound-engine describe exactly as they are.

Result: the file has 17 tests (it had 25; the 8 cut tests asserted source text only).

## 4. What NOT to do

- No change to any file under `ts/src/` (this run only touches tests). If the new tests need a source change to pass, STOP and write why in the Status row.
- Do not tune the simulation, change shark counts, or "fix" the shark finding above: report it.
- No Lua, no engine changes, no new dependencies, no snapshot files.
- Do not touch other `test_shoal_*` files, protected repos, `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.
- No deploys, no builds, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`; no Python file is changed).

Baseline before editing (verified 2026-10-04 on origin/main `d3084de0`):
```
cd ts && npx vitest run test_shoal_chrome_polish.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  25 passed (25)`.

After editing:
```
cd ts && npx vitest run test_shoal_headless.ts test_shoal_title_render.tsx test_shoal_chrome_polish.ts
```
Expected (verified with exactly these file contents): 3 files passed; 6 + 3 + 17 = 26 tests passed. The headless file takes about 20 to 40 seconds; that is normal (each scenario test has a 60 s limit).
Real tails seen on the prototype: headless `Tests  6 passed (6)`, title render `Tests  3 passed (3)`, chrome polish 17 tests. The React `act(...)` warnings in the stderr of the render test are expected and harmless.

Regression check, then the type check (clean before and after):
```
cd ts && npx vitest run test_shoal_new_reef_control.ts test_shoal_ts_native_migration.ts test_shoal_config.ts
```
Expected: `Test Files  3 passed (3)` / `Tests  54 passed (54)` (real tail on origin/main `d3084de0`; unchanged by this run).
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified 2026-10-04 with the new files in place; it needs the gitignored `ts/src/games/game-metadata.json`, which the dispatcher copies into the worktree).

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`) and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files marked CRLF keep CRLF (the Edit tool preserves it). New files may use either; use CRLF to match.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/tests/test_shoal_headless.ts` and `ts/tests/test_shoal_title_render.tsx` exist with the content above (real vitest tails pasted).
- [ ] `ts/tests/test_shoal_chrome_polish.ts` has no `readFileSync`, no `appSource`, `titleSource` or `primerSource`, and 17 passing tests (real tail pasted).
- [ ] The regression command and `cd ts && npx tsc --noEmit` pass (real tails pasted).
- [ ] No file outside the three in Scope changed (`git status` pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the three files and the real test counts. Evidence second: real tails of the vitest and tsc commands. Then state the shark finding plainly (sharks reached 0 by tick 2,000 in every scenario you ran;
quote your own run if it differs) and say it is Robert's call. Recommended action: review, merge. The primer line-count test and the "Seed a New Reef" wording are no longer asserted anywhere;
a Playwright smoke (controller, after merge) covers them.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:40 · robert-claude-laptop · none → Queued
<!-- queue:end -->
