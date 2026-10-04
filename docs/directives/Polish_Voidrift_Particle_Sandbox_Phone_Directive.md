# Particle Sandbox on phones: touch input, stacked layout, and a build panel that starts with only the Tier 1 tools

**Depends on:** `Polish_Voidrift_Particle_Sandbox_TierA_Directive.md` merged (it adds `TitleGate.tsx`, the `onRestart` prop and `test_voidrift_particle_sandbox_tier_a.ts`; this run edits the same `App.tsx` and `Header` neighbours).
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/voidrift_particle_sandbox/DIRECTION.md`, Phase 2).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voidrift_particle_sandbox/DIRECTION.md`, `ts/src/games/voidrift_particle_sandbox/App.tsx`, `ts/src/games/voidrift_particle_sandbox/hooks/useCanvasInput.ts`,
`ts/src/games/voidrift_particle_sandbox/components/BuildPanel.tsx`, `ts/src/games/voidrift_particle_sandbox/components/ReconstructionCatalog.tsx` (line 22), `ts/src/games/voidrift_particle_sandbox/simulation/buildingDefs.ts` (the `unlockedAtTier` lines).

## 1. Why this exists

`DIRECTION.md` names two cheap-to-fix risks for the Particle Sandbox: "a cold-start wall and phone input". Measured in the code on origin/main `d3084de0`:
- Phone layout: the build panel is a fixed 320 px column beside the canvas (`App.tsx`: `<div className="w-80 h-full flex flex-col relative z-20">`, and `BuildPanel.tsx` root `<div className="w-80 ...">`). At 390 px wide that leaves the canvas about 70 px.
- Phone input: the canvas listens only for mouse events (`App.tsx`: `onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`). A finger drag fires no mouse-move events, so painting and placing by dragging do not work, and the page can scroll under the finger. Panning is Alt-drag or middle-click only (`useCanvasInput.ts`), which a phone does not have.
- Cold start: all 15 building cards are shown across the category tabs, 5 of them locked behind a lock overlay (`BuildPanel.tsx`: `isLocked = def.unlockedAtTier > currentTier`). `buildingDefs.ts` has 10 tools at Tier 1 and 5 at Tier 2 and 3 (`collector_universal`, `processor_condenser`, `processor_separator` at 2; `processor_plasma_forge`, `processor_catalyst_chamber` at 3).
This run: stack the panel under the canvas below 768 px; use pointer events with `touch-action: none`; add a "Move" tool for dragging the view; show only unlocked tools; and add a first-goal card.

## 2. Scope

1. New modules `<!-- new: ts/src/games/voidrift_particle_sandbox/components/buildPanelVisibility.ts -->` and `<!-- new: ts/src/games/voidrift_particle_sandbox/components/FirstGoalCard.tsx -->`.
2. `ts/src/games/voidrift_particle_sandbox/components/BuildPanel.tsx`, `components/ReconstructionCatalog.tsx`, `hooks/useCanvasInput.ts`, `App.tsx`.
3. New test `<!-- new: ts/tests/test_voidrift_particle_sandbox_phone.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them). `App.tsx` is about 582 lines and the cap is 600: the edits below add about 10; do not add more.

**Step 1: `buildPanelVisibility.ts`**, exactly:
```
import type { BuildingDef } from '../types';

/** A tool is shown only once the player has reached the tier that unlocks it. */
export function isUnlocked(def: Pick<BuildingDef, 'unlockedAtTier'>, currentTier: number): boolean {
  return def.unlockedAtTier <= currentTier;
}

export function unlockedDefs<T extends Pick<BuildingDef, 'unlockedAtTier'>>(
  defs: readonly T[],
  currentTier: number
): T[] {
  return defs.filter((d) => isUnlocked(d, currentTier));
}
```
**Step 2: `FirstGoalCard.tsx`**, exactly (plain, inviting copy: it states the real Tier 1 goal, 100 Structural Solid, from `buildPanelHelpers.tsx` `getGoalData`):
```
import React from 'react';

interface FirstGoalCardProps {
  onDismiss: () => void;
}

export const FirstGoalCard: React.FC<FirstGoalCardProps> = ({ onDismiss }) => (
  <div
    id="first-goal-card"
    className="absolute left-3 right-3 bottom-3 md:right-auto md:max-w-sm z-10 bg-[#0c101d]/95 border border-cyan-700/60 rounded-xl p-3 text-xs text-slate-200 shadow-xl"
  >
    <div className="font-semibold text-cyan-300 mb-1">Your first goal: collect 100 Structural Solid</div>
    <p className="text-slate-300 leading-relaxed">
      Debris drifts down from the top. The collector catches it, the compressor squeezes it into solid, and the bin keeps it.
      Want it faster? Open the brush and paint some dust above the collector.
    </p>
    <button
      id="first-goal-dismiss"
      onClick={onDismiss}
      className="mt-2 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
    >
      Got it
    </button>
  </div>
);
```
**Step 3: `BuildPanel.tsx`, seven edits.**
1. After `import { getGoalData, renderCardGraphic } from './buildPanelHelpers';` add `import { unlockedDefs } from './buildPanelVisibility';`.
2. In the `lucide-react` import list, after `  Paintbrush,` add `  Move,`.
3. `export type ToolMode = 'BUILD' | 'DEMOLISH' | 'PAINT';` becomes `export type ToolMode = 'BUILD' | 'DEMOLISH' | 'PAINT' | 'PAN';`.
4. Replace the four `const collectors/containers/conduits/processors = BUILDING_DEFS.filter(...)` statements with:
```
  const available = unlockedDefs(BUILDING_DEFS, currentTier);
  const collectors = available.filter((b) => b.category === BuildingCategory.COLLECTOR);
  const containers = available.filter((b) => b.category === BuildingCategory.CONTAINER);
  const conduits = available.filter(
    (b) => b.category === BuildingCategory.PIPE || b.category === BuildingCategory.WALL
  );
  const processors = available.filter((b) => b.category === BuildingCategory.PROCESSOR);
```
(`const materialsList = Object.values(MATERIAL_DEFS);` stays as it is. The locked-card overlay code below becomes unreachable at runtime; leave it, do not delete code in this run.)
5. Root element class: `<div className="w-80 bg-[#0c101d] border-l border-[#1f293d] flex flex-col h-full ...` becomes `<div className="w-full md:w-80 bg-[#0c101d] border-t md:border-t-0 md:border-l border-[#1f293d] flex flex-col h-full ...` (keep the rest of that class string as it is).
6. Directly above the comment `{/* Demolish Mode Button */}` add:
```
          {/* Pan Mode Button (touch devices have no middle-click or Alt-drag) */}
          <button
            id="tool-pan"
            onClick={() => {
              onSetToolMode(toolMode === 'PAN' ? 'BUILD' : 'PAN');
              onSelectBuildingDef(null);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              toolMode === 'PAN'
                ? 'bg-slate-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Move the view: drag to pan"
          >
            <Move className="w-4 h-4" />
          </button>

```
7. In the bottom hint, after the branch `: toolMode === 'DEMOLISH' ? 'Demolish Mode: Click to dismantle'` add the branch `: toolMode === 'PAN' ? 'Move Mode: drag to move the view'` (before the final `: 'Select an item to place →'`).

**Step 4: `ReconstructionCatalog.tsx` line 22.** Change `<div className="w-80 bg-[#0d121f] border-l border-[#1f293d] ...` to `<div className="w-full md:w-80 bg-[#0d121f] border-t md:border-t-0 md:border-l border-[#1f293d] ...` (rest unchanged).

**Step 5: `useCanvasInput.ts`.** In `handleMouseDown`, directly after the line `    if (e.button === 0) {` of the "Left Click Action" block and before `const coords = screenToGrid(e.clientX, e.clientY);`, add:
```
      if (toolMode === 'PAN') {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        return;
      }
```
(The handlers keep their names and their `React.MouseEvent` types: a pointer event is a mouse event.)

**Step 6: `App.tsx`, six edits.**
1. After `import { HelpModal } from './components/HelpModal';` add `import { FirstGoalCard } from './components/FirstGoalCard';`.
2. After `  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);` add `  const [goalCardDismissed, setGoalCardDismissed] = useState<boolean>(false);`.
3. `<div className="flex-1 flex overflow-hidden relative">` (the main area under the header) becomes `<div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">`.
4. The canvas container `className="flex-1 relative bg-[#04060c] overflow-hidden flex items-center justify-center"` becomes `className="flex-1 min-h-[220px] relative bg-[#04060c] overflow-hidden flex items-center justify-center"`.
5. Replace the five mouse props on `<canvas>` and its class with:
```
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                handleMouseDown(e);
              }}
              onPointerMove={handleMouseMove}
              onPointerUp={handleMouseUp}
              onPointerCancel={handleMouseUp}
              onPointerLeave={handleMouseLeave}
              onContextMenu={(e) => e.preventDefault()}
              onWheel={handleWheel}
              className="w-full h-full cursor-crosshair block touch-none"
```
6. Directly above the comment `{/* Material Routing Filter Popup */}` add:
```
            {currentTier === 1 && !goalCardDismissed && (storedCounts[MaterialType.STRUCTURAL_SOLID] || 0) === 0 && (
              <FirstGoalCard onDismiss={() => setGoalCardDismissed(true)} />
            )}

```
and change the sidebar wrapper `<div className="w-80 h-full flex flex-col relative z-20">` to `<div className="w-full md:w-80 h-72 md:h-full flex flex-col relative z-20">`.

**Step 7: test**, exactly `ts/tests/test_voidrift_particle_sandbox_phone.ts`:
```
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDING_DEFS } from '../src/games/voidrift_particle_sandbox/simulation/buildingDefs';
import { isUnlocked, unlockedDefs } from '../src/games/voidrift_particle_sandbox/components/buildPanelVisibility';

const GAME = resolve(import.meta.dirname, '../src/games/voidrift_particle_sandbox');
const read = (rel: string) => readFileSync(resolve(GAME, rel), 'utf8');

describe('VoidRift Particle Sandbox progressive build panel', () => {
  it('shows only the 10 Tier 1 tools at Tier 1', () => {
    const shown = unlockedDefs(BUILDING_DEFS, 1).map((d) => d.id);
    expect(shown).toHaveLength(10);
    expect(shown).toContain('collector_dust');
    expect(shown).toContain('processor_compressor');
    expect(shown).not.toContain('collector_universal');
    expect(shown).not.toContain('processor_condenser');
    expect(shown).not.toContain('processor_plasma_forge');
  });

  it('reveals everything by Tier 3', () => {
    expect(unlockedDefs(BUILDING_DEFS, 3)).toHaveLength(BUILDING_DEFS.length);
    expect(isUnlocked({ unlockedAtTier: 2 }, 1)).toBe(false);
    expect(isUnlocked({ unlockedAtTier: 2 }, 2)).toBe(true);
  });

  it('BuildPanel filters its lists through unlockedDefs', () => {
    const panel = read('components/BuildPanel.tsx');
    expect(panel).toContain('const available = unlockedDefs(BUILDING_DEFS, currentTier);');
  });
});

describe('VoidRift Particle Sandbox phone input and layout', () => {
  it('uses pointer events with touch-action none on the canvas', () => {
    const app = read('App.tsx');
    for (const handler of ['onPointerDown', 'onPointerMove', 'onPointerUp', 'onPointerCancel', 'onPointerLeave']) {
      expect(app, handler).toContain(handler);
    }
    expect(app).not.toContain('onMouseDown=');
    expect(app).toContain('touch-none');
  });

  it('has a Pan tool that drags the view', () => {
    expect(read('components/BuildPanel.tsx')).toContain("'BUILD' | 'DEMOLISH' | 'PAINT' | 'PAN'");
    expect(read('components/BuildPanel.tsx')).toContain('id="tool-pan"');
    expect(read('hooks/useCanvasInput.ts')).toContain("if (toolMode === 'PAN') {");
  });

  it('stacks the panel under the canvas on phones and beside it from md up', () => {
    const app = read('App.tsx');
    expect(app).toContain('flex-1 flex flex-col md:flex-row overflow-hidden relative');
    expect(app).toContain('w-full md:w-80 h-72 md:h-full');
    expect(read('components/BuildPanel.tsx')).toContain('w-full md:w-80');
    expect(read('components/ReconstructionCatalog.tsx')).toContain('w-full md:w-80');
  });

  it('shows a dismissible first-goal card at Tier 1 before any solid is stored', () => {
    const app = read('App.tsx');
    expect(app).toContain('currentTier === 1 && !goalCardDismissed');
    const card = read('components/FirstGoalCard.tsx');
    expect(card).toContain('Your first goal: collect 100 Structural Solid');
    expect(card).toContain('id="first-goal-dismiss"');
  });

  it('keeps App.tsx under 600 lines', () => {
    expect(read('App.tsx').split('\n').length).toBeLessThanOrEqual(600);
  });
});
```

## 4. What NOT to do

- No change to the simulation (`simulation/*.ts`), the renderer, `useSimulationLoop.ts`, or building/tier rules: tools unlock exactly as before; this run only hides locked ones.
- No saves (next directive), no title or Restart work (done), no new tools or materials.
- Do not delete the locked-card overlay code, and do not rename the mouse handler functions.
- The two-finger pinch zoom is NOT in scope; the existing zoom buttons and mouse wheel stay the zoom controls.
- Do not edit existing tests. No Lua, no engine changes, no shared-component edits, no deploys, no protected repos, no player-layer work.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline with the Tier A directive merged (prototype state):
```
cd ts && npx vitest run test_voidrift_particle_sandbox_tier_a.ts test_voidrift_particle_sandbox_registry.ts test_voidrift_particle_sandbox_simulation.ts test_voidrift_particle_sandbox_flow.ts
```
Expected `Test Files  4 passed (4)` / `Tests  40 passed (40)`.

After editing:
```
cd ts && npx vitest run test_voidrift_particle_sandbox_phone.ts test_voidrift_particle_sandbox_tier_a.ts test_voidrift_particle_sandbox_registry.ts test_voidrift_particle_sandbox_simulation.ts test_voidrift_particle_sandbox_flow.ts
```
Real prototype tail: `Test Files  5 passed (5)` / `Tests  48 passed (48)` (8 new).
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool): `App.tsx` contains no `onMouseDown=`; `BuildPanel.tsx` contains `const available = unlockedDefs(BUILDING_DEFS, currentTier);` once.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`), `cd ts && npx tsc --noEmit`, `uv run python --version` and (only where a Verification section names it) `uv run pytest tests/test_wire_rust.py -q`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files under `ts/` and `docs/` use CRLF line endings in the worktree; keep them (the Edit tool preserves them). New files may use either; git normalizes line endings on commit.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] At Tier 1 the build panel shows exactly 10 tools and no locked cards; at Tier 3 it shows all 15.
- [ ] Below 768 px the build panel sits under the canvas; from 768 px up it sits beside it as before.
- [ ] The canvas uses pointer events with `touch-none`; a Move tool pans by dragging.
- [ ] A dismissible first-goal card shows at Tier 1 until the first Structural Solid is stored.
- [ ] The five-file test command passes (real tail pasted) and `cd ts && npx tsc --noEmit` prints nothing; `App.tsx` is at most 600 lines.
- [ ] No file outside the Scope list changed; the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files and the real test counts. Evidence second: the real tails.
**Controller finish (after merge):** build (`cd ts && npm run build:voidrift_particle_sandbox`), then a Playwright pass at 390x844 touch emulation: title screen, drag to paint dust, Move tool pan, the panel stacked below the canvas. Two screenshots, yes/no on "primary action reachable, no horizontal scroll" (polish standard A4). Say plainly that touch behaviour is verified by that reviewer pass, not by this run.
Recommended action: review, merge, then the save and golden-test directive.

## Sandbox needs

none

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
- 2026-10-04 13:26 · robert-claude-laptop · none → Queued
<!-- queue:end -->
