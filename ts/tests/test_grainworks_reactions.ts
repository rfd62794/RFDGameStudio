// <!-- new: ts/tests/test_grainworks_reactions.ts -->
// Guards the MATERIAL_REACTIONS table (all five pairs fire on adjacent inputs,
// and do not fire when the roll exceeds the probability) and the per-material
// CellularGrid.step() movement/expiry rules (falls, plasma rise, plasma
// lifespan, bedrock rest). Math.random is stubbed so every step is deterministic.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MaterialType } from '../src/games/grainworks/types';
import {
  CellularGrid,
  GRID_HEIGHT,
} from '../src/games/grainworks/simulation/grid';

afterEach(() => {
  vi.restoreAllMocks();
});

function stepPair(a: MaterialType, b: MaterialType): CellularGrid {
  const grid = new CellularGrid();
  grid.setCell(100, 100, a);
  grid.setCell(101, 100, b);
  grid.step();
  return grid;
}

function stepSingle(material: MaterialType, x = 100, y = 50, customLife = 0): CellularGrid {
  const grid = new CellularGrid();
  grid.setCell(x, y, material, 0, customLife);
  grid.step();
  return grid;
}

describe('GrainWorks — material reactions (stub 0.01)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
  });

  it('GAS + PLASMA -> VOID_CRYSTAL converts both cells', () => {
    const grid = stepPair(MaterialType.GAS, MaterialType.PLASMA);
    expect(grid.counts[MaterialType.VOID_CRYSTAL]).toBe(2);
    expect(grid.counts[MaterialType.GAS]).toBe(0);
    expect(grid.counts[MaterialType.PLASMA]).toBe(0);
  });

  it('LIQUID + DUST -> MINERAL_SLURRY converts both cells', () => {
    const grid = stepPair(MaterialType.LIQUID, MaterialType.DUST);
    expect(grid.counts[MaterialType.MINERAL_SLURRY]).toBe(2);
    expect(grid.counts[MaterialType.LIQUID]).toBe(0);
    expect(grid.counts[MaterialType.DUST]).toBe(0);
  });

  it('PLASMA + LIQUID -> REACTIVE_VAPOR converts both cells', () => {
    const grid = stepPair(MaterialType.PLASMA, MaterialType.LIQUID);
    expect(grid.counts[MaterialType.REACTIVE_VAPOR]).toBe(2);
    expect(grid.counts[MaterialType.PLASMA]).toBe(0);
    expect(grid.counts[MaterialType.LIQUID]).toBe(0);
  });

  it('GAS + LIQUID -> CONDENSATE converts both cells', () => {
    const grid = stepPair(MaterialType.GAS, MaterialType.LIQUID);
    expect(grid.counts[MaterialType.CONDENSATE]).toBe(2);
    expect(grid.counts[MaterialType.GAS]).toBe(0);
    expect(grid.counts[MaterialType.LIQUID]).toBe(0);
  });

  it('REACTIVE_VAPOR + VOID_CRYSTAL -> LUMINITE converts both cells', () => {
    const grid = stepPair(MaterialType.REACTIVE_VAPOR, MaterialType.VOID_CRYSTAL);
    expect(grid.counts[MaterialType.LUMINITE]).toBe(2);
    expect(grid.counts[MaterialType.REACTIVE_VAPOR]).toBe(0);
    expect(grid.counts[MaterialType.VOID_CRYSTAL]).toBe(0);
  });
});

describe('GrainWorks — reaction probability gate (stub 0.99)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  it('GAS + PLASMA produces no VOID_CRYSTAL when the roll misses', () => {
    const grid = stepPair(MaterialType.GAS, MaterialType.PLASMA);
    expect(grid.counts[MaterialType.VOID_CRYSTAL]).toBe(0);
    expect(grid.counts[MaterialType.GAS]).toBe(1);
    expect(grid.counts[MaterialType.PLASMA]).toBe(1);
  });
});

describe('GrainWorks — per-material step rules (stub 0.5)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('DUST falls one cell per step', () => {
    const grid = stepSingle(MaterialType.DUST);
    expect(grid.getMaterial(100, 51)).toBe(MaterialType.DUST);
    expect(grid.getMaterial(100, 50)).toBe(MaterialType.VACUUM);
    expect(grid.counts[MaterialType.DUST]).toBe(1);
  });

  it('VOID_CRYSTAL settles one cell when suspended', () => {
    const grid = stepSingle(MaterialType.VOID_CRYSTAL);
    expect(grid.getMaterial(100, 51)).toBe(MaterialType.VOID_CRYSTAL);
    expect(grid.getMaterial(100, 50)).toBe(MaterialType.VACUUM);
    expect(grid.counts[MaterialType.VOID_CRYSTAL]).toBe(1);
  });

  it('MINERAL_SLURRY falls one cell per step', () => {
    const grid = stepSingle(MaterialType.MINERAL_SLURRY);
    expect(grid.getMaterial(100, 51)).toBe(MaterialType.MINERAL_SLURRY);
    expect(grid.getMaterial(100, 50)).toBe(MaterialType.VACUUM);
    expect(grid.counts[MaterialType.MINERAL_SLURRY]).toBe(1);
  });

  it('LIQUID falls one cell per step', () => {
    const grid = stepSingle(MaterialType.LIQUID);
    expect(grid.getMaterial(100, 51)).toBe(MaterialType.LIQUID);
    expect(grid.getMaterial(100, 50)).toBe(MaterialType.VACUUM);
    expect(grid.counts[MaterialType.LIQUID]).toBe(1);
  });

  it('PLASMA rises three cells in one step', () => {
    const grid = stepSingle(MaterialType.PLASMA);
    expect(grid.getMaterial(100, 47)).toBe(MaterialType.PLASMA);
    expect(grid.getMaterial(100, 50)).toBe(MaterialType.VACUUM);
    expect(grid.counts[MaterialType.PLASMA]).toBe(1);
  });

  it('short-lived PLASMA (customLife 1) expires into GAS in place', () => {
    const grid = stepSingle(MaterialType.PLASMA, 100, 50, 1);
    expect(grid.getMaterial(100, 50)).toBe(MaterialType.GAS);
    expect(grid.counts[MaterialType.PLASMA]).toBe(0);
    expect(grid.counts[MaterialType.GAS]).toBe(1);
  });

  it('DUST resting on the bedrock floor stays put', () => {
    const grid = stepSingle(MaterialType.DUST, 100, GRID_HEIGHT - 3);
    expect(grid.getMaterial(100, GRID_HEIGHT - 3)).toBe(MaterialType.DUST);
    expect(grid.counts[MaterialType.DUST]).toBe(1);
  });
});
