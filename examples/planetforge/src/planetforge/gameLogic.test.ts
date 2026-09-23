import { describe, it, expect } from 'vitest';
import {
  RING_SIZE,
  makeWorldState,
  makeTileState,
  selectHarvestTarget,
  soilUpgradeTarget,
  updateSectorSoil,
  SOIL_STABILITY_TICKS,
  attemptConstructMonument,
  type DemandProfile,
  type SectorZone,
  type TileState,
  type ResourceLedger,
} from './gameLogic';

describe('yield and scan selection', () => {
  it('selects the highest-yield tile within radius under a food-weighted demand', () => {
    const world = makeWorldState();
    world.tiles[2].aspectSlots[0] = 'LushFlora';   // 2 food, 2 material
    world.tiles[5].aspectSlots[0] = 'MineralVein';  // out of radius 3 from origin 0

    const foodDemand: DemandProfile = { weightFood: 5, weightEnergy: 1, weightMaterial: 1 };
    const target = selectHarvestTarget(world, 0, 3, foodDemand);
    expect(target).toBe(2);
  });
});

describe('sector soil upgrade', () => {
  function stableTile(): TileState {
    const t = makeTileState();
    t.ticksStable = SOIL_STABILITY_TICKS;
    return t;
  }
  function unstableTile(): TileState {
    const t = makeTileState();
    t.ticksStable = SOIL_STABILITY_TICKS - 1;
    return t;
  }

  it('upgrades only when all four tiles in the sector are stable', () => {
    const tiles: TileState[] = Array.from({ length: RING_SIZE }, () => stableTile());
    tiles[3] = unstableTile();

    const sector: SectorZone = {
      sectorId: 0,
      soilProfile: 'BarrenRock',
      structure: { kind: 'None' },
      tileIndices: [0, 1, 2, 3],
    };

    expect(updateSectorSoil(sector, tiles)).toBe(false);
    expect(sector.soilProfile).toBe('BarrenRock');

    tiles[3].ticksStable = SOIL_STABILITY_TICKS;
    expect(updateSectorSoil(sector, tiles)).toBe(true);
    expect(sector.soilProfile).toBe('Clay');
  });

  it('VolcanicAsh recovers to Clay rather than being a dead end', () => {
    expect(soilUpgradeTarget('VolcanicAsh')).toBe('Clay');
  });
});

describe('monument construction', () => {
  it('requires full resource cost and an empty structure slot', () => {
    const sector: SectorZone = {
      sectorId: 0,
      soilProfile: 'FertileLoam',
      structure: { kind: 'None' },
      tileIndices: [0, 1, 2, 3],
    };
    let ledger: ResourceLedger = { food: 5, energy: 5, material: 5 }; // short on food and material

    expect(attemptConstructMonument(sector, ledger)).toBe(false);
    expect(sector.structure.kind).toBe('None');

    ledger = { food: 20, energy: 20, material: 20 };
    expect(attemptConstructMonument(sector, ledger)).toBe(true);
    expect(sector.structure.kind).toBe('Monument');

    // second attempt fails — slot occupied
    expect(attemptConstructMonument(sector, ledger)).toBe(false);
  });
});
