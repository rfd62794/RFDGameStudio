import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import { MaterialType } from '../src/games/grainworks/types';
import { CellularGrid } from '../src/games/grainworks/simulation/grid';
import { BuildingManager } from '../src/games/grainworks/simulation/buildings';
import { placeStarterFactory } from '../src/games/grainworks/simulation/starterFactory';
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
} from '../src/games/grainworks/simulation/sandboxSave';

const GAME = resolve(import.meta.dirname, '../src/games/grainworks');

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

describe('GrainWorks golden determinism', () => {
  it('200 seeded steps of the starter world give a fixed material digest', () => {
    const { grid } = seededWorld();
    for (let i = 0; i < 200; i++) grid.step();
    expect(fnv1a(grid.materials)).toBe('1b3f7a91');
  });
});

describe('GrainWorks run-length coding', () => {
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

describe('GrainWorks save and restore', () => {
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
    expect(SAVE_KEY).toBe('grainworks_save');
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

describe('GrainWorks save wiring', () => {
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
