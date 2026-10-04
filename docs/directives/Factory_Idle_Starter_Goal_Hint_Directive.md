# Factory Idle: a one-line first-step hint and a starter goal (serve 5 customers)

**Depends on:** Factory_Idle_Autosave_And_Reset_Factory_Directive.md (it adds `engine/persistence.ts` and the `useRef` in `App.tsx` this run uses)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/factory_idle/DIRECTION.md` (Replan item 3), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (B1),
`docs/directives/Factory_Idle_Autosave_And_Reset_Factory_Directive.md` (the files this run builds on), `examples/factory-idle-precision-armory-phase2/src/App.tsx` (lines 1-30 and 120-140 only).

## 1. Why this exists

A new player lands on Factory Idle with nothing telling them what is happening or what to do (no hint text anywhere in the example; no goal or win state: `docs/demos/factory_idle/DIRECTION.md`).
The direction note suggested a hint "Place a spawner, belt it to an assembler". That is stale: `getInitialGameState()` already places a starter line (power generator, two spawners,
conveyors, an assembly fitter and a storefront packer; `PRESET_FACTORIES[0]` in `engine/recipes.ts` is applied to sector A at `engine/gameReducer.ts` lines 73-85), the factory is running
from the first second, and a customer is already waiting. So the honest first step is "your line is running: serve customers". Robert's decision (2026-10-04, all recommendations approved): a one-line,
dismissible hint plus a starter goal ("serve 5 customers"), polish standard B1. The count already exists: `state.metrics.fulfilledOrders` (`engine/gameReducer.ts` line 1073 increments it on each sale to a waiting customer).

## 2. Scope

1. New `<!-- new: examples/factory-idle-precision-armory-phase2/src/engine/starterGoal.ts -->` (pure functions) and `<!-- new: examples/factory-idle-precision-armory-phase2/src/components/StarterGoalBanner.tsx -->`.
2. `examples/factory-idle-precision-armory-phase2/src/App.tsx`: render the banner under the header.
3. New test `<!-- new: ts/tests/test_factory_idle_starter_goal.ts -->`.

## 3. The work

New files use CRLF like the rest of the example. This run needs `engine/persistence.ts` (it exports the `StorageLike` type) from the Autosave directive; if that file does not exist, STOP and write why in the Status row.

**Step 1: `engine/starterGoal.ts`.** Create with exactly:

```ts
// new: examples/factory-idle-precision-armory-phase2/src/engine/starterGoal.ts
import type { GameMetrics } from '../types';
import type { StorageLike } from './persistence';

/** The first goal: serve this many customers. */
export const STARTER_GOAL_TARGET = 5;
export const HINT_DISMISSED_KEY = 'factory_idle_hint_dismissed';

export interface StarterGoalProgress {
  served: number;
  target: number;
  done: boolean;
}

export function starterGoalProgress(metrics: Pick<GameMetrics, 'fulfilledOrders'>): StarterGoalProgress {
  const served = Math.max(0, Math.floor(metrics.fulfilledOrders));
  return { served: Math.min(served, STARTER_GOAL_TARGET), target: STARTER_GOAL_TARGET, done: served >= STARTER_GOAL_TARGET };
}

/** The one line shown to a new player. Friendly and specific; names no controls the player has not seen. */
export function starterHint(progress: StarterGoalProgress): string {
  if (progress.done) {
    return `Nice work! You served ${progress.target} customers. Keep your line running, and spend your research points on the next unlock.`;
  }
  return `Your starter line is already running and stocking the shelf. Serve ${progress.target} customers to meet your first goal (${progress.served} so far).`;
}

export function isHintDismissed(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(HINT_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissHint(storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(HINT_DISMISSED_KEY, '1');
  } catch {
    /* the hint just shows again next visit */
  }
}
```

**Step 2: `components/StarterGoalBanner.tsx`.** Create with exactly:

```tsx
// new: examples/factory-idle-precision-armory-phase2/src/components/StarterGoalBanner.tsx
import React from 'react';
import { starterGoalProgress, starterHint } from '../engine/starterGoal';
import type { GameMetrics } from '../types';

interface StarterGoalBannerProps {
  metrics: Pick<GameMetrics, 'fulfilledOrders'>;
  onDismiss: () => void;
}

export const StarterGoalBanner: React.FC<StarterGoalBannerProps> = ({ metrics, onDismiss }) => {
  const progress = starterGoalProgress(metrics);
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 px-4 py-2 text-xs bg-amber-950/60 border-b border-amber-800/70 text-amber-100"
    >
      <span>{starterHint(progress)}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 px-2 py-0.5 rounded border border-amber-700 text-amber-200 hover:bg-amber-900/60"
      >
        Got it
      </button>
    </div>
  );
};
```

**Step 3: `App.tsx`.** After the Autosave directive, `App.tsx` imports `loadState, saveState, clearSave` from `./engine/persistence` and has `const stateRef = useRef(state);`. Three edits:
1. After the line `import { loadState, saveState, clearSave, type StorageLike } from './engine/persistence';` add
```
import { isHintDismissed, dismissHint } from './engine/starterGoal';
import { StarterGoalBanner } from './components/StarterGoalBanner';
```
2. Directly before the line `  const stateRef = useRef(state);` add `  const [hintDismissed, setHintDismissed] = useState(() => isHintDismissed(browserStorage()));`.
3. Directly after the closing `/>` of the `<Header ... />` element (the line after `        onOpenRecipes={() => setIsRecipeModalOpen(true)}`), add a blank line and:
```
      {!hintDismissed && (
        <StarterGoalBanner
          metrics={state.metrics}
          onDismiss={() => { dismissHint(browserStorage()); setHintDismissed(true); }}
        />
      )}
```

**Step 4: the test.** Create `ts/tests/test_factory_idle_starter_goal.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_factory_idle_starter_goal.ts

import { describe, it, expect } from 'vitest';
import {
  STARTER_GOAL_TARGET, HINT_DISMISSED_KEY, starterGoalProgress, starterHint, isHintDismissed, dismissHint,
} from '../../examples/factory-idle-precision-armory-phase2/src/engine/starterGoal';
import type { StorageLike } from '../../examples/factory-idle-precision-armory-phase2/src/engine/persistence';

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

describe('test_factory_idle_starter_goal', () => {
  it('counts served customers up to the target and then reports done', () => {
    expect(starterGoalProgress({ fulfilledOrders: 0 })).toEqual({ served: 0, target: STARTER_GOAL_TARGET, done: false });
    expect(starterGoalProgress({ fulfilledOrders: 3 }).served).toBe(3);
    expect(starterGoalProgress({ fulfilledOrders: STARTER_GOAL_TARGET }).done).toBe(true);
    expect(starterGoalProgress({ fulfilledOrders: 99 })).toEqual({ served: STARTER_GOAL_TARGET, target: STARTER_GOAL_TARGET, done: true });
    expect(starterGoalProgress({ fulfilledOrders: -4 }).served).toBe(0);
  });

  it('the hint is plain, friendly player language', () => {
    const early = starterHint(starterGoalProgress({ fulfilledOrders: 2 }));
    expect(early).toContain('Serve 5 customers');
    expect(early).toContain('2 so far');
    expect(starterHint(starterGoalProgress({ fulfilledOrders: 5 }))).toContain('Nice work');
    for (const n of [0, 2, 5]) {
      const text = starterHint(starterGoalProgress({ fulfilledOrders: n }));
      expect(/reducer|dispatch|localStorage|TODO|debug/i.test(text)).toBe(false);
    }
  });

  it('remembers the dismissal and never throws without storage', () => {
    const storage = memoryStorage();
    expect(isHintDismissed(storage)).toBe(false);
    dismissHint(storage);
    expect(isHintDismissed(storage)).toBe(true);
    expect(storage.getItem(HINT_DISMISSED_KEY)).toBe('1');
    expect(isHintDismissed(null)).toBe(false);
    expect(() => dismissHint(null)).not.toThrow();
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(isHintDismissed(blocked)).toBe(false);
    expect(() => dismissHint(blocked)).not.toThrow();
  });
});
```

## 4. What NOT to do

- Do not edit `engine/gameReducer.ts`, `engine/persistence.ts` or any game rule: the goal only READS `metrics.fulfilledOrders`. The goal does not end the game, unlock anything or change balance.
- No second hint, no tutorial overlay, no modal, no sound. The banner is one line and one "Got it" button.
- Keep the player copy as written: no dev-speak, no weapon words (the reskin directive removes them elsewhere).
- No cloud saves, accounts or player layer. No Lua, no engine changes, no deploys, no protected repos. Do not touch `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_factory_idle_starter_goal.ts
```
Real tail from the prototype of these exact files (built on top of the Autosave directive's files): `Test Files  1 passed (1)` / `Tests  3 passed (3)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; none mentions `starterGoal`, `StarterGoalBanner` or `test_factory_idle_starter_goal`.

Source checks (Grep tool, one call each): `App.tsx` contains `StarterGoalBanner` twice (import and use) and `isHintDismissed` once in the `useState` line plus the import.

Controller step, not this run: the example's own type check and a screenshot at 1280x720 and 390x844 showing the banner (the prototype type-checked with 0 errors).

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts [<bare-filename>.ts]` (and `uv run pytest ...` where named below). Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use bare test filenames as filters (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index`, any `npm run build:*`, `vite-node`, or `git merge origin/main` (the sandbox refuses them).
- Match each file's existing line endings (the Edit tool preserves them); do not convert.
- `examples/` folders are AI Studio exports (untrusted code). New logic goes in small new modules; no file over 600 lines unless it already is (then do not grow it by more than the lines named here).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `engine/starterGoal.ts`, `components/StarterGoalBanner.tsx` and the test exist with the exact content above.
- [ ] `App.tsx` imports and renders the banner under the header; no other line of it changed.
- [ ] `cd ts && npx vitest run test_factory_idle_starter_goal.ts` passes (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing `game-metadata.json` errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed, whether any quoted line differed from the file, and whether `engine/persistence.ts` was present. Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then state plainly what was not run (example type check, screenshots at 1280x720 and 390x844) for the controller, and that deploying is Robert's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
<!-- queue:end -->
