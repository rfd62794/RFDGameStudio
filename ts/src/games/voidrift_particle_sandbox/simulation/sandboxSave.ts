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
