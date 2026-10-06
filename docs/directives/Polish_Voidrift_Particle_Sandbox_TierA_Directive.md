# Particle Sandbox Tier A: a title screen, a Restart button, no blocking pop-up, and a build script

**Depends on:** none.
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/voidrift_particle_sandbox/DIRECTION.md`, Phase 1).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voidrift_particle_sandbox/DIRECTION.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, A3 and A7),
`ts/src/games/voidrift_particle_sandbox/App.tsx`, `ts/src/games/voidrift_particle_sandbox/config.ts`, `ts/src/games/voidrift_particle_sandbox/components/Header.tsx`,
`ts/src/ui/components/TitleScreen.tsx` (props only), `ts/src/standalone/succession/entry.tsx`, `ts/vite.succession.config.ts`, `ts/tests/test_voidrift_particle_sandbox_registry.ts`.

## 1. Why this exists

The Particle Sandbox (`voidrift_particle_sandbox`, status `dev`) is a falling-sand toy that grows into a small factory game: 12 materials, collectors, pipes, processors, four tiers. It is the most shareable member of the VoidDrift family and is brand new and tested.
Its front door is missing (`docs/demos/voidrift_particle_sandbox/DIRECTION.md`): no title screen (a player is dropped cold onto a grid; onboarding is only a Help button), a blocking `window.confirm` reset, and no `build:voidrift_particle_sandbox` script.
Measured in `ts/src/games/voidrift_particle_sandbox/App.tsx` on origin/main `d3084de0`: the reset handler reads `if (window.confirm('Reset the simulation sandbox and clear all materials and structures?')) {` (a browser pop-up blocks inside an iframe and is ugly on a phone), and the header's reset is an icon-only button (`Header.tsx`, `title="Reset Simulation Canvas"`).
`App.tsx` is 580 lines and the repo rule is 600, so the title screen goes in a new wrapper module, not into `App.tsx`.

## 2. Scope

Copied from `docs/demos/voidrift_particle_sandbox/DIRECTION.md` Phase 1: "CUT: `window.confirm` reset (blocks in iframes). ADD: TitleScreen with a one-line pitch, an in-game Restart button, `build:voidrift_particle_sandbox`."

1. New module `<!-- new: ts/src/games/voidrift_particle_sandbox/TitleGate.tsx -->` (title screen, and Restart returns to it).
2. `ts/src/games/voidrift_particle_sandbox/config.ts`: lazy-load `./TitleGate` instead of `./App`.
3. `ts/src/games/voidrift_particle_sandbox/App.tsx`: accept `onRestart`, drop `window.confirm`.
4. `ts/src/games/voidrift_particle_sandbox/components/Header.tsx`: a text Restart button and a two-tap Clear.
5. New files `<!-- new: ts/vite.voidrift_particle_sandbox.config.ts -->`, `<!-- new: ts/src/standalone/voidrift_particle_sandbox/entry.tsx -->`, `<!-- new: ts/src/standalone/voidrift_particle_sandbox/index.html -->`, and one line in `ts/package.json`.
6. New test `<!-- new: ts/tests/test_voidrift_particle_sandbox_tier_a.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1: `TitleGate.tsx`**, exactly (player-facing copy is deliberately plain and inviting: no phase names, ids or "prototype"):
```
import { useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { TitleScreen } from '../../ui/components';
import App from './App';

export default function TitleGate(props: GameRendererProps) {
  const [screen, setScreen] = useState<'title' | 'play'>('title');
  const [runKey, setRunKey] = useState<number>(0);

  if (screen === 'title') {
    return (
      <GameShell
        gameLabel="VoidRift Particle Sandbox"
        gameId="voidrift_particle_sandbox"
        phase="PARTICLE SANDBOX"
        className="bg-[#070913] text-slate-200 font-sans"
      >
        <TitleScreen
          title="Particle Sandbox"
          tagline="Drop it. Catch it. Build on it."
          pitch="Sand, gas and glowing crystals fall through a tiny space station. Catch the debris, pipe it through machines, and grow a little factory that remembers the universe."
          menuItems={[
            {
              id: 'sandbox-start',
              label: 'Start Building',
              variant: 'primary',
              onClick: () => setScreen('play'),
            },
          ]}
        />
      </GameShell>
    );
  }

  return (
    <App
      key={runKey}
      {...props}
      onRestart={() => {
        setRunKey((k) => k + 1);
        setScreen('title');
      }}
    />
  );
}
```
**Step 2: `config.ts`.** Change `component: React.lazy(() => import('./App')),` to `component: React.lazy(() => import('./TitleGate')),`. Nothing else in that file.

**Step 3: `App.tsx`, three edits.**
1. Replace the line `export default function App(_props: GameRendererProps) {` with:
```
export type AppProps = GameRendererProps & { onRestart?: () => void };

export default function App({ onRestart }: AppProps) {
```
2. Replace the whole `handleResetGrid` (the one that begins `if (window.confirm(`) with this version, which keeps every statement but drops the blocking pop-up (Header now asks for a second tap instead):
```
  const handleResetGrid = () => {
    gridRef.current.clearAll();
    buildingMgrRef.current.clearAll();
    setStoredCounts({});
    setSelectedBuilding(null);
    setFilterPopupPos(null);
  };
```
3. In the `<Header ... />` element, directly after the line `          onResetGrid={handleResetGrid}` add the line `          onRestart={onRestart}`.

**Step 4: `Header.tsx`, four edits.**
1. `import React from 'react';` becomes `import React, { useEffect, useState } from 'react';`.
2. In `interface HeaderProps`, directly after `  onResetGrid: () => void;` add `  onRestart?: () => void;`.
3. In the destructured parameter list, directly after `  onResetGrid,` add `  onRestart,`. Then, as the first statements inside the component body (before `const keyMaterials = [`), add:
```
  const [clearArmed, setClearArmed] = useState<boolean>(false);
  useEffect(() => {
    if (!clearArmed) return;
    const timer = setTimeout(() => setClearArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [clearArmed]);
  const handleClearClick = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    setClearArmed(false);
    onResetGrid();
  };

```
4. Replace the final reset button (the `<button onClick={onResetGrid} ... title="Reset Simulation Canvas"> <RefreshCw .../> </button>`) with:
```
        <button
          id="btn-clear-canvas"
          onClick={handleClearClick}
          className="px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded border border-transparent hover:border-slate-700 transition flex items-center gap-1"
          title="Clear the canvas and every building"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {clearArmed ? 'Tap again to clear' : 'Clear'}
        </button>

        {onRestart && (
          <button
            id="btn-restart"
            onClick={onRestart}
            className="px-2 py-1 text-[11px] font-mono text-cyan-300 hover:bg-slate-800 rounded border border-slate-700 transition"
            title="Start over from the title screen"
          >
            Restart
          </button>
        )}
```

**Step 5: build script.** Mirror `succession` (built and checked once before this directive was written: `built in 4.25s`, exit 0, `assets/index-DgYJF5Lr.js 317.68 kB`).
- `ts/vite.voidrift_particle_sandbox.config.ts`:
```
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig('voidrift_particle_sandbox');
```
- `ts/src/standalone/voidrift_particle_sandbox/entry.tsx`:
```
import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/voidrift_particle_sandbox/TitleGate';
import type { GameSession } from '../../engine/types';

const session: GameSession = {
  gameId: 'voidrift_particle_sandbox',
  files: {
    gameId: 'voidrift_particle_sandbox',
    data: {},
    ui: {},
    logic: '',
    engineSource: '',
  },
  executor: {
    call: () => [],
  },
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
```
- `ts/src/standalone/voidrift_particle_sandbox/index.html`:
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidRift Particle Sandbox</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./entry.tsx"></script>
  </body>
</html>
```
- `ts/package.json`: add this line directly after the existing `"build:choke_point": ...` line (line 21), keeping the trailing comma:
```
    "build:voidrift_particle_sandbox": "vite build --config vite.voidrift_particle_sandbox.config.ts",
```
The build writes `ts/dist-voidrift_particle_sandbox/` (gitignored `dist*/`): do not commit it.

**Step 6: test**, exactly `ts/tests/test_voidrift_particle_sandbox_tier_a.ts`:
```
import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import TitleGate from '../src/games/voidrift_particle_sandbox/TitleGate';
import type { GameSession } from '../src/engine/types';

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');
const GAME = 'src/games/voidrift_particle_sandbox';

const session: GameSession = {
  gameId: 'voidrift_particle_sandbox',
  files: { gameId: 'voidrift_particle_sandbox', data: {}, ui: {}, logic: '', engineSource: '' },
  executor: { call: () => [] },
};

describe('VoidRift Particle Sandbox Tier A', () => {
  it('opens on a title screen with a one-line pitch and a Start Building button', async () => {
    const container = document.createElement('div');
    const reactRoot = createRoot(container);
    await act(async () => {
      reactRoot.render(React.createElement(TitleGate, { session }));
    });
    expect(container.textContent).toContain('Particle Sandbox');
    expect(container.textContent).toContain('Drop it. Catch it. Build on it.');
    const start = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Start Building')
    );
    expect(start).toBeTruthy();
    reactRoot.unmount();
  });

  it('is lazy-loaded through the title gate', () => {
    expect(read(`${GAME}/config.ts`)).toContain("import('./TitleGate')");
  });

  it('no longer blocks on window.confirm', () => {
    expect(read(`${GAME}/App.tsx`)).not.toContain('window.confirm');
  });

  it('Header has a text Restart button and a two-step Clear', () => {
    const header = read(`${GAME}/components/Header.tsx`);
    expect(header).toContain('id="btn-restart"');
    expect(header).toContain('Tap again to clear');
    expect(read(`${GAME}/App.tsx`)).toContain('onRestart={onRestart}');
  });

  it('Restart remounts the game and returns to the title', () => {
    const gate = read(`${GAME}/TitleGate.tsx`);
    expect(gate).toContain('setRunKey((k) => k + 1);');
    expect(gate).toContain("setScreen('title');");
    expect(gate).toContain('key={runKey}');
  });

  it('keeps App.tsx under 600 lines', () => {
    expect(read(`${GAME}/App.tsx`).split('\n').length).toBeLessThanOrEqual(600);
  });

  it('has the standalone files and the build script', () => {
    expect(existsSync(resolve(root, 'vite.voidrift_particle_sandbox.config.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voidrift_particle_sandbox/entry.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voidrift_particle_sandbox/index.html'))).toBe(true);
    expect(read('src/standalone/voidrift_particle_sandbox/entry.tsx')).toContain(
      "'../../games/voidrift_particle_sandbox/TitleGate'"
    );
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    expect(scripts['build:voidrift_particle_sandbox']).toBe(
      'vite build --config vite.voidrift_particle_sandbox.config.ts'
    );
  });
});
```

## 4. What NOT to do

- No change to the simulation (`simulation/*.ts`), the build panel, the input hook or the renderer.
- No progressive build panel, no phone input work, no saves, no seeded test (the next two directives).
- Do not rename labels or ids (a separate naming directive owns that); the title copy above uses the current label on purpose.
- Do not add or edit the `window.confirm` anywhere else, do not edit existing tests (`test_voidrift_particle_sandbox_*.ts` must keep passing unchanged; the registry test checks that `App.tsx` mounts `GameShell` and stays under 600 lines).
- No Lua, no engine changes, no shared-component edits, no deploys, no protected repos, no player-layer or cloud saves.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline, before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_voidrift_particle_sandbox_registry.ts test_voidrift_particle_sandbox_simulation.ts test_voidrift_particle_sandbox_flow.ts test_voidrift_particle_sandbox_reactions.ts test_voidrift_particle_sandbox_tiles_materials.ts
```
Real tail: `Test Files  5 passed (5)` / `Tests  56 passed (56)`.

After editing, the same command with the new file added:
```
cd ts && npx vitest run test_voidrift_particle_sandbox_tier_a.ts test_voidrift_particle_sandbox_registry.ts test_voidrift_particle_sandbox_simulation.ts test_voidrift_particle_sandbox_flow.ts test_voidrift_particle_sandbox_reactions.ts test_voidrift_particle_sandbox_tiles_materials.ts
```
Expected `Test Files  6 passed (6)` / `Tests  63 passed (63)` (7 new). Real prototype tail for the new file plus the registry file: `Test Files  2 passed (2)` / `Tests  15 passed (15)`. React prints an `act(...)` deprecation warning from the new test; that is expected and not a failure.
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool): `App.tsx` contains no `window.confirm`; `config.ts` contains `import('./TitleGate')` once; `App.tsx` is 580 lines or fewer plus the few added here (the test asserts at most 600).

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

- [ ] A fresh load shows the title screen; "Start Building" enters the sandbox; "Restart" in the header returns to the title with a fresh sandbox; "Clear" needs a second tap and never opens a browser pop-up.
- [ ] The three standalone files exist and `ts/package.json` has `build:voidrift_particle_sandbox`.
- [ ] The six-file test command passes (real tail pasted) and `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the Scope list changed; the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files and the real test counts. Evidence second: the real tails.
**Controller finish (after merge):** `cd ts && npm run build:voidrift_particle_sandbox` must exit 0 (the sandbox refuses `npm run build:*`), then desktop and 390-wide screenshots of the title screen and the sandbox.
Recommended action: review, merge, then the phone-input directive (`Polish_Voidrift_Particle_Sandbox_Phone_Directive.md`).

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`.

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
