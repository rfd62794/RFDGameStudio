# Particle Sandbox saves: autosave the whole base, restore it on load, and pin the physics with a seeded golden test

**Depends on:** `Polish_Voidrift_Particle_Sandbox_TierA_Directive.md` and `Polish_Voidrift_Particle_Sandbox_Phone_Directive.md` merged (all three edit `App.tsx`; this run assumes their final text, including `TitleGate.tsx`).
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/voidrift_particle_sandbox/DIRECTION.md`, Phase 2 save half and Phase 3).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voidrift_particle_sandbox/DIRECTION.md`, `ts/src/games/voidrift_particle_sandbox/App.tsx`, `ts/src/games/voidrift_particle_sandbox/TitleGate.tsx` <!-- new: ts/src/games/voidrift_particle_sandbox/TitleGate.tsx -->,
`ts/src/games/voidrift_particle_sandbox/simulation/grid.ts` (lines 1-60 and `clearAll`), `ts/src/games/voidrift_particle_sandbox/simulation/buildingManager.ts` (lines 23-45 and 168-250),
`ts/src/engine/shared/persistence.ts`, `ts/src/engine/shared/seededRandom.ts`.

## 1. Why this exists

`DIRECTION.md`: "no localStorage anywhere in the game", and a closed tab loses the whole base. Measured: `grep -rn localStorage ts/src/games/voidrift_particle_sandbox` finds nothing.
The sandbox state is three typed arrays on `CellularGrid` (`materials`, `structureFlags`, `lifespan`, each 64,000 cells: `GRID_WIDTH` 320 x `GRID_HEIGHT` 200), plus `BuildingManager.buildings` (plain objects), `BuildingManager.pipes` (a `Map<string, PipeNode>`), and in `App.tsx` the tier, the reconstruction entities and the victory flag.
Phase 3 of the direction also asks for "a seeded grid-step golden test ... Verify: it passes before and after any later refactor": nothing today pins the physics against the original.
Design facts (do not change them):
- The grid is stored run-length encoded (`[value, count, ...]`) so a mostly empty 64,000-cell grid is a few hundred numbers, well inside localStorage limits.
- The save is a `{ v: 1, data }` envelope through `writeSave(KEY, value, { version })`; a wrong version, corrupt JSON or a grid that does not decode to exactly 64,000 cells reads back as "no save" and the starter factory is built instead.
- `grid.counts[0]` (vacuum) is bookkeeping that the live grid does not keep consistent and nothing reads; restore recomputes counts for every material, and the test compares counts from index 1.
- Pipe `flowParticles` are cosmetic and are dropped on save.
- To keep `App.tsx` under 600 lines this run also moves two existing blocks out of it, verbatim: the starter-factory placement and the Victory modal.

## 2. Scope

1. New modules `<!-- new: ts/src/games/voidrift_particle_sandbox/simulation/sandboxSave.ts -->`, `<!-- new: ts/src/games/voidrift_particle_sandbox/simulation/starterFactory.ts -->`, `<!-- new: ts/src/games/voidrift_particle_sandbox/components/VictoryModal.tsx -->`.
2. `ts/src/games/voidrift_particle_sandbox/App.tsx`, `TitleGate.tsx`, `ts/src/games/voidrift_particle_sandbox/simulation/buildingManager.ts` (one keyword).
3. New test `<!-- new: ts/tests/test_voidrift_particle_sandbox_save.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1: `sandboxSave.ts`**, exactly:
```
import { clearSave, loadSave, writeSave } from '../../../engine/shared/persistence';
import type { BuildingInstance, PipeNode } from '../types';
import type { CellularGrid } from './grid';
import type { BuildingManager } from './buildingManager';
import { TILES_X } from './routing';

export const SAVE_KEY = 'voidrift_particle_sandbox_save';
export const SAVE_VERSION = 1;
export const AUTOSAVE_INTERVAL_MS = 5000;

export interface SandboxSave {
  tier: number;
  hasWon: boolean;
  reconstructedIds: string[];
  grid: { materials: number[]; structureFlags: number[]; lifespan: number[] };
  buildings: BuildingInstance[];
  pipes: PipeNode[];
}

/** Run-length encode as [value, count, value, count, ...]. */
export function rleEncode(data: ArrayLike<number>): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    const value = data[i];
    let run = 1;
    while (i + run < data.length && data[i + run] === value) run++;
    out.push(value, run);
    i += run;
  }
  return out;
}

/** Returns null when the pairs do not decode to exactly `length` values. */
export function rleDecode(pairs: number[], length: number): number[] | null {
  if (!Array.isArray(pairs) || pairs.length % 2 !== 0) return null;
  const out: number[] = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const value = pairs[i];
    const run = pairs[i + 1];
    if (!Number.isInteger(run) || run < 1 || out.length + run > length) return null;
    for (let k = 0; k < run; k++) out.push(value);
  }
  return out.length === length ? out : null;
}

export function snapshotSandbox(
  grid: CellularGrid,
  mgr: BuildingManager,
  tier: number,
  reconstructedIds: string[],
  hasWon: boolean
): SandboxSave {
  return {
    tier,
    hasWon,
    reconstructedIds: [...reconstructedIds],
    grid: {
      materials: rleEncode(grid.materials),
      structureFlags: rleEncode(grid.structureFlags),
      lifespan: rleEncode(grid.lifespan),
    },
    buildings: JSON.parse(JSON.stringify(mgr.buildings)) as BuildingInstance[],
    pipes: (JSON.parse(JSON.stringify([...mgr.pipes.values()])) as PipeNode[]).map((p) => ({
      ...p,
      flowParticles: [],
    })),
  };
}

export function isValidSave(value: unknown): value is SandboxSave {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<SandboxSave>;
  return (
    typeof v.tier === 'number' &&
    typeof v.hasWon === 'boolean' &&
    Array.isArray(v.reconstructedIds) &&
    typeof v.grid === 'object' && v.grid !== null &&
    Array.isArray(v.grid.materials) &&
    Array.isArray(v.grid.structureFlags) &&
    Array.isArray(v.grid.lifespan) &&
    Array.isArray(v.buildings) &&
    Array.isArray(v.pipes)
  );
}

/** Applies a save to the grid and manager. Returns false (nothing changed) when any part does not decode. */
export function applySandboxSave(grid: CellularGrid, mgr: BuildingManager, save: SandboxSave): boolean {
  const total = grid.materials.length;
  const materials = rleDecode(save.grid.materials, total);
  const flags = rleDecode(save.grid.structureFlags, total);
  const life = rleDecode(save.grid.lifespan, total);
  if (!materials || !flags || !life) return false;

  grid.materials.set(materials);
  grid.structureFlags.set(flags);
  grid.lifespan.set(life);
  grid.counts.fill(0);
  for (let i = 0; i < total; i++) grid.counts[grid.materials[i]]++;
  grid.dirty.fill(1);

  mgr.clearAll();
  let maxId = 0;
  for (const b of save.buildings) {
    mgr.buildings.push(b);
    maxId = Math.max(maxId, b.id);
    for (let dy = 0; dy < b.tileH; dy++) {
      for (let dx = 0; dx < b.tileW; dx++) {
        mgr.buildingTileGrid[(b.tileY + dy) * TILES_X + (b.tileX + dx)] = b.id;
      }
    }
  }
  for (const p of save.pipes) {
    mgr.pipes.set(mgr.getTileKey(p.tileX, p.tileY), p);
    mgr.pipeTileGrid[p.tileY * TILES_X + p.tileX] = 1;
  }
  mgr.nextBuildingId = maxId + 1;
  return true;
}

export function saveSandbox(
  grid: CellularGrid,
  mgr: BuildingManager,
  tier: number,
  reconstructedIds: string[],
  hasWon: boolean
): void {
  writeSave(SAVE_KEY, snapshotSandbox(grid, mgr, tier, reconstructedIds, hasWon), { version: SAVE_VERSION });
}

export function loadSandboxSave(): SandboxSave | null {
  const save = loadSave<SandboxSave>(SAVE_KEY, { version: SAVE_VERSION });
  return isValidSave(save) ? save : null;
}

export function clearSandboxSave(): void {
  clearSave(SAVE_KEY);
}
```
**Step 2: `starterFactory.ts`**, exactly (this is the existing starter block of `App.tsx`'s mount effect, moved verbatim into a function):
```
import type { CellularGrid } from './grid';
import type { BuildingManager } from './buildingManager';
import { BUILDING_DEFS } from './buildingDefs';

/** The factory every new sandbox starts with: Collector -> Pipe -> Compressor -> Solid Bin. */
export function placeStarterFactory(grid: CellularGrid, bMgr: BuildingManager): void {
  // Starter setup: Collector -> Pipe -> Compressor -> Solid Bin
  // Collector: 2x2 at tile (19, 4) -> spans CA (152..168, 32..48)
  const collectorDef = BUILDING_DEFS.find((b) => b.id === 'collector_dust')!;
  bMgr.placeBuilding(grid, collectorDef, 19, 4);

  // Pipes connecting downward
  const pipeDef = BUILDING_DEFS.find((b) => b.id === 'pipe')!;
  bMgr.placeBuilding(grid, pipeDef, 19, 6, 'DOWN');
  bMgr.placeBuilding(grid, pipeDef, 19, 7, 'DOWN');

  // Compressor: 3x3 at tile (19, 8)
  const compressorDef = BUILDING_DEFS.find((b) => b.id === 'processor_compressor')!;
  bMgr.placeBuilding(grid, compressorDef, 19, 8);

  // Pipes from compressor to solid container
  bMgr.placeBuilding(grid, pipeDef, 19, 11, 'DOWN');
  bMgr.placeBuilding(grid, pipeDef, 19, 12, 'DOWN');

  // Solid Bin: 2x3 at tile (19, 13)
  const solidBinDef = BUILDING_DEFS.find((b) => b.id === 'container_solid')!;
  bMgr.placeBuilding(grid, solidBinDef, 19, 13);
}
```
**Step 3: `VictoryModal.tsx`**, exactly (the existing Victory modal JSX of `App.tsx`, moved verbatim into a component):
```
import React from 'react';
import { Award } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ isOpen, onContinue }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#11192e] to-[#0a0f1d] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 text-center shadow-2xl shadow-amber-500/20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/40 animate-bounce">
          <Award className="w-8 h-8 text-slate-950" />
        </div>
        <h2 className="text-xl font-bold text-amber-300 tracking-wide">
          RECONSTRUCTION COMPLETE
        </h2>
        <p className="text-sm font-serif italic text-amber-100/90 leading-relaxed bg-[#0b101f] p-4 rounded-xl border border-amber-500/30">
          "The first things exist again. The universe remembers."
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          All five primeval constructs have been resurrected through complete automation loops,
          reactions, and refining conduits. You may continue freely experimenting with infinite
          cellular automata physics in the sandbox.
        </p>
        <button
          id="btn-continue-endless"
          onClick={onContinue}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 transition cursor-pointer"
        >
          Continue Endless Sandbox
        </button>
      </div>
    </div>
  );
};
```
**Step 4: `buildingManager.ts`.** Change `  private nextBuildingId = 1;` to `  public nextBuildingId = 1;` (restore must set it). Nothing else in that file.

**Step 5: `TitleGate.tsx`.** After `import App from './App';` add `import { clearSandboxSave } from './simulation/sandboxSave';`, and make the Restart handler clear the save first:
```
      onRestart={() => {
        clearSandboxSave();
        setRunKey((k) => k + 1);
        setScreen('title');
      }}
```

**Step 6: `App.tsx`, five edits.**
1. After `import { FirstGoalCard } from './components/FirstGoalCard';` add:
```
import { VictoryModal } from './components/VictoryModal';
import { placeStarterFactory } from './simulation/starterFactory';
import {
  AUTOSAVE_INTERVAL_MS,
  applySandboxSave,
  loadSandboxSave,
  saveSandbox,
} from './simulation/sandboxSave';
```
and remove `Award` from the `lucide-react` import (it moves with the modal): `import { ZoomIn, ZoomOut, Maximize2, Sparkles, Hammer } from 'lucide-react';`.
2. In the mount effect, replace everything from the comment `    // Starter setup: Collector -> Pipe -> Compressor -> Solid Bin` through the line `    bMgr.placeBuilding(grid, solidBinDef, 19, 13);` (the whole starter block, which Step 2 moved) with:
```
    // A saved sandbox replaces the starter factory
    const saved = loadSandboxSave();
    if (saved && applySandboxSave(grid, bMgr, saved)) {
      setCurrentTier(saved.tier);
      setHasWon(saved.hasWon);
      setReconstructionEntities(
        RECONSTRUCTION_ENTITIES.map((e) =>
          saved.reconstructedIds.includes(e.id) ? { ...e, reconstructed: true } : e
        )
      );
    } else {
      placeStarterFactory(grid, bMgr);
    }
```
Leave `// Perform initial dynamic sizing and viewport centering` and the code after it as it is.
3. Directly above the line `  useSimulationLoop({` add:
```
  // Autosave every 5 s and when the tab is hidden or closed
  const saveStateRef = useRef({ tier: currentTier, ids: [] as string[], won: hasWon });
  saveStateRef.current = {
    tier: currentTier,
    ids: reconstructionEntities.filter((e) => e.reconstructed).map((e) => e.id),
    won: hasWon,
  };
  useEffect(() => {
    const save = () => {
      const s = saveStateRef.current;
      saveSandbox(gridRef.current, buildingMgrRef.current, s.tier, s.ids, s.won);
    };
    const interval = setInterval(save, AUTOSAVE_INTERVAL_MS);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', save);
    };
  }, []);

```
4. Replace the whole `{/* Victory Modal */} {isVictoryModalOpen && ( ... )}` block (from the comment `        {/* Victory Modal */}` up to, not including, `        {/* Field Manual & Reaction Codex Modal */}`) with the single line:
```
        <VictoryModal isOpen={isVictoryModalOpen} onContinue={() => setIsVictoryModalOpen(false)} />
```
followed by a blank line.
5. Nothing else. `handleResetGrid` (Clear) is unchanged: the autosave simply saves the cleared state.

**Step 7: test**, exactly `ts/tests/test_voidrift_particle_sandbox_save.ts`. The golden digest `1b3f7a91` is the real value from running the starter world with a `mulberry32(12345)` stand-in for `Math.random` for 200 steps (it was stable across repeated runs):
```
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import { MaterialType } from '../src/games/voidrift_particle_sandbox/types';
import { CellularGrid } from '../src/games/voidrift_particle_sandbox/simulation/grid';
import { BuildingManager } from '../src/games/voidrift_particle_sandbox/simulation/buildings';
import { placeStarterFactory } from '../src/games/voidrift_particle_sandbox/simulation/starterFactory';
import {
  SAVE_KEY,
  SAVE_VERSION,
  applySandboxSave,
  clearSandboxSave,
  loadSandboxSave,
  rleDecode,
  rleEncode,
  saveSandbox,
  snapshotSandbox,
} from '../src/games/voidrift_particle_sandbox/simulation/sandboxSave';

const GAME = resolve(import.meta.dirname, '../src/games/voidrift_particle_sandbox');

beforeEach(() => {
  localStorage.clear();
  const rand = mulberry32(12345);
  vi.spyOn(Math, 'random').mockImplementation(rand);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function fnv1a(data: ArrayLike<number>): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data[i] & 0xff;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function seededWorld(): { grid: CellularGrid; mgr: BuildingManager } {
  const grid = new CellularGrid();
  const mgr = new BuildingManager();
  placeStarterFactory(grid, mgr);
  for (let x = 140; x < 180; x++) {
    for (let y = 10; y < 14; y++) grid.setCell(x, y, MaterialType.DUST);
  }
  return { grid, mgr };
}

describe('VoidRift Particle Sandbox golden determinism', () => {
  it('200 seeded steps of the starter world give a fixed material digest', () => {
    const { grid } = seededWorld();
    for (let i = 0; i < 200; i++) grid.step();
    expect(fnv1a(grid.materials)).toBe('1b3f7a91');
  });
});

describe('VoidRift Particle Sandbox run-length coding', () => {
  it('round-trips and rejects bad lengths', () => {
    const data = Uint8Array.from([0, 0, 0, 5, 5, 1, 0, 0]);
    const pairs = rleEncode(data);
    expect(pairs).toEqual([0, 3, 5, 2, 1, 1, 0, 2]);
    expect(rleDecode(pairs, 8)).toEqual(Array.from(data));
    expect(rleDecode(pairs, 9)).toBeNull();
    expect(rleDecode([1], 1)).toBeNull();
    expect(rleDecode([1, 0], 0)).toBeNull();
  });
});

describe('VoidRift Particle Sandbox save and restore', () => {
  it('restores grid, buildings and pipes exactly', () => {
    const a = seededWorld();
    for (let i = 0; i < 100; i++) a.grid.step();
    saveSandbox(a.grid, a.mgr, 2, ['void_bloom'], false);

    const save = loadSandboxSave();
    expect(save).not.toBeNull();
    expect(save!.tier).toBe(2);
    expect(save!.reconstructedIds).toEqual(['void_bloom']);

    const b = { grid: new CellularGrid(), mgr: new BuildingManager() };
    expect(applySandboxSave(b.grid, b.mgr, save!)).toBe(true);
    expect(fnv1a(b.grid.materials)).toBe(fnv1a(a.grid.materials));
    expect(fnv1a(b.grid.structureFlags)).toBe(fnv1a(a.grid.structureFlags));
    expect(Array.from(b.grid.counts).slice(1)).toEqual(Array.from(a.grid.counts).slice(1));
    expect(b.mgr.buildings.map((x) => x.buildingId)).toEqual(a.mgr.buildings.map((x) => x.buildingId));
    expect(b.mgr.pipes.size).toBe(a.mgr.pipes.size);
    expect(Array.from(b.mgr.buildingTileGrid)).toEqual(Array.from(a.mgr.buildingTileGrid));
    expect(Array.from(b.mgr.pipeTileGrid)).toEqual(Array.from(a.mgr.pipeTileGrid));
    expect(b.mgr.nextBuildingId).toBe(a.mgr.nextBuildingId);
  });

  it('a restored world keeps simulating without throwing', () => {
    const a = seededWorld();
    saveSandbox(a.grid, a.mgr, 1, [], false);
    const b = { grid: new CellularGrid(), mgr: new BuildingManager() };
    applySandboxSave(b.grid, b.mgr, loadSandboxSave()!);
    expect(() => {
      for (let i = 0; i < 100; i++) b.grid.step();
    }).not.toThrow();
  });

  it('stores a versioned envelope', () => {
    const a = seededWorld();
    saveSandbox(a.grid, a.mgr, 1, [], false);
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as { v: number };
    expect(raw.v).toBe(SAVE_VERSION);
    expect(SAVE_KEY).toBe('voidrift_particle_sandbox_save');
  });

  it('returns null for missing, corrupt or wrong-version saves, and false for a bad grid', () => {
    expect(loadSandboxSave()).toBeNull();
    localStorage.setItem(SAVE_KEY, '{broken');
    expect(loadSandboxSave()).toBeNull();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 999, data: {} }));
    expect(loadSandboxSave()).toBeNull();

    const a = seededWorld();
    const snap = snapshotSandbox(a.grid, a.mgr, 1, [], false);
    snap.grid.materials = [0, 1];
    const target = new CellularGrid();
    const before = fnv1a(target.materials);
    expect(applySandboxSave(target, new BuildingManager(), snap)).toBe(false);
    expect(fnv1a(target.materials)).toBe(before);
  });

  it('clearSandboxSave removes the save', () => {
    const a = seededWorld();
    saveSandbox(a.grid, a.mgr, 1, [], false);
    clearSandboxSave();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});

describe('VoidRift Particle Sandbox save wiring', () => {
  const app = readFileSync(resolve(GAME, 'App.tsx'), 'utf8');

  it('restores a save before falling back to the starter factory', () => {
    expect(app).toContain('if (saved && applySandboxSave(grid, bMgr, saved)) {');
    expect(app).toContain('placeStarterFactory(grid, bMgr);');
  });

  it('autosaves on an interval and on pagehide, and cleans up', () => {
    expect(app).toContain('setInterval(save, AUTOSAVE_INTERVAL_MS)');
    expect(app).toContain("addEventListener('pagehide', save)");
    expect(app).toContain("removeEventListener('pagehide', save)");
  });

  it('Restart clears the save', () => {
    expect(readFileSync(resolve(GAME, 'TitleGate.tsx'), 'utf8')).toContain('clearSandboxSave();');
  });

  it('keeps App.tsx under 600 lines', () => {
    expect(app.split('\n').length).toBeLessThanOrEqual(600);
  });
});
```

## 4. What NOT to do

- Do not change any file under `simulation/` other than adding `sandboxSave.ts`, `starterFactory.ts` and the one keyword in `buildingManager.ts`. In particular do not touch `grid.ts` or replace `Math.random` in the game (the test stubs it).
- Do not change the golden digest to make a test pass: if it differs on your run, stop and write the real value and the command in the Status row.
- No cloud saves, no accounts, no leaderboards, no sharing links, no player-layer work: localStorage only.
- No UI beyond what is described (no "Continue" button, no save slots).
- No Lua, no engine changes, no shared-component edits, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline with the two earlier directives merged (prototype state):
```
cd ts && npx vitest run test_voidrift_particle_sandbox_phone.ts test_voidrift_particle_sandbox_tier_a.ts test_voidrift_particle_sandbox_registry.ts test_voidrift_particle_sandbox_simulation.ts test_voidrift_particle_sandbox_flow.ts
```
Expected `Test Files  5 passed (5)` / `Tests  48 passed (48)`.

After editing:
```
cd ts && npx vitest run test_voidrift_particle_sandbox_save.ts test_voidrift_particle_sandbox_phone.ts test_voidrift_particle_sandbox_tier_a.ts test_voidrift_particle_sandbox_registry.ts test_voidrift_particle_sandbox_simulation.ts test_voidrift_particle_sandbox_flow.ts
```
Expected `Test Files  6 passed (6)` / `Tests  59 passed (59)` (11 new). Real prototype tail for the whole particle family (8 files): `Test Files  8 passed (8)` / `Tests  82 passed (82)`; the golden test took about 340 ms.
Also run the two remaining family files once, unchanged: `cd ts && npx vitest run test_voidrift_particle_sandbox_reactions.ts test_voidrift_particle_sandbox_tiles_materials.ts` (expected `Tests  23 passed (23)`).
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool): `App.tsx` contains `placeStarterFactory(grid, bMgr);` once and no `Award`; `App.tsx` is at most 600 lines (the registry test also checks this).

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

- [ ] The three new modules exist as pasted; `App.tsx`, `TitleGate.tsx` and `buildingManager.ts` have exactly the edits above.
- [ ] Reload restores grid, buildings, pipes, tier and reconstruction progress (covered by the round-trip test); a corrupt or missing save builds the starter factory.
- [ ] The six-file command and the two-file command pass (real tails pasted) and `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the Scope list changed; the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files and real test counts, and the golden digest that your run printed. Evidence second: the real tails.
**Controller finish (after merge):** `cd ts && npm run build:voidrift_particle_sandbox`, then in a browser: build a pipe, wait 6 seconds, reload, confirm the base is back; press Restart, confirm a fresh starter factory.
Recommended action: review, merge.

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
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-voidrift-particle-sandbox-save-go-bef8b0 |
| Base branch | - |
| Base commit | 457d32c999d5d30b10d53b5b5b5d6bb6aca1f1d1 |

**Status log**
- 2026-10-04 13:29 · robert-claude-laptop · none → Queued
- 2026-10-08 17:48 · robert-claude-laptop · Queued → Approved — dispatch deferred to work-tower
- 2026-10-08 17:51 · robert-claude-laptop · assignee devin-tower -> devin-any — reassigned to the devin-any pool: Robert meant the Home Tower
- 2026-10-08 17:55 · devin (delegated) · Queued → Approved — under delegate.band-normal, delegate.rate-limit
- 2026-10-08 18:17 · dispatcher · Approved → In progress — dispatched devin on hometower in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voidrift-particle-sandbox-save-go-bef8b0; lane=strong; model=default; persona=steady-builder; agent_id=01M4ESGC3DW7Q7EBCK8KNZ9CH0
- 2026-10-08 18:18 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voidrift-particle-sandbox-save-go-bef8b0; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
