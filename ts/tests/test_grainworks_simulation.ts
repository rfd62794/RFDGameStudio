import { describe, it, expect } from 'vitest';
import { MaterialType, MATERIAL_DEFS, RECONSTRUCTION_ENTITIES } from '../src/games/grainworks/types';
import {
  CellularGrid,
  GRID_HEIGHT,
  GRID_WIDTH,
  ASTEROID_ZONE_HEIGHT,
} from '../src/games/grainworks/simulation/grid';
import {
  BuildingManager,
  computeRoute,
  TILES_X,
  TILES_Y,
} from '../src/games/grainworks/simulation/buildings';
import { AsteroidManager } from '../src/games/grainworks/simulation/asteroids';
import { BUILDING_DEFS, BUILDING_TILE } from '../src/games/grainworks/simulation/buildingDefs';

const def = (id: string) => BUILDING_DEFS.find((b) => b.id === id)!;

describe('GrainWorks — cellular grid', () => {
  it('allocates the full 320x200 grid with bedrock terrain', () => {
    const grid = new CellularGrid();
    expect(grid.materials.length).toBe(GRID_WIDTH * GRID_HEIGHT);
    expect(GRID_WIDTH * GRID_HEIGHT).toBe(64000);
    // Bottom two rows are bedrock (structure flag 1)
    expect(grid.structureFlags[grid.getIndex(10, GRID_HEIGHT - 1)]).toBe(1);
  });

  it('setCell/getMaterial/isInBounds round-trip correctly', () => {
    const grid = new CellularGrid();
    expect(grid.isInBounds(0, 0)).toBe(true);
    expect(grid.isInBounds(-1, 0)).toBe(false);
    expect(grid.isInBounds(GRID_WIDTH, 0)).toBe(false);
    grid.setCell(50, 100, MaterialType.LIQUID);
    expect(grid.getMaterial(50, 100)).toBe(MaterialType.LIQUID);
    // Out-of-bounds reads report SOLID, writes are rejected
    expect(grid.getMaterial(-5, -5)).toBe(MaterialType.SOLID);
    expect(grid.setCell(-1, 0, MaterialType.DUST)).toBe(false);
  });

  it('conserves material counts across simulation steps', () => {
    const grid = new CellularGrid();
    const before = grid.counts[MaterialType.DUST];
    grid.setCell(160, 100, MaterialType.DUST);
    expect(grid.counts[MaterialType.DUST]).toBe(before + 1);
    for (let i = 0; i < 20; i++) {
      grid.step();
    }
    // Dust settles on bedrock but is never destroyed
    expect(grid.counts[MaterialType.DUST]).toBe(before + 1);
  });
});

describe('GrainWorks — building placement', () => {
  it('rejects non-collector placement inside the asteroid zone', () => {
    const grid = new CellularGrid();
    const mgr = new BuildingManager();
    const check = mgr.canPlaceBuilding(grid, def('container_solid'), 10, 3);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('Asteroid Zone');
  });

  it('places a container on a valid tile and finds it again', () => {
    const grid = new CellularGrid();
    const mgr = new BuildingManager();
    const check = mgr.canPlaceBuilding(grid, def('container_solid'), 10, 10);
    expect(check.valid).toBe(true);

    const placed = mgr.placeBuilding(grid, def('container_solid'), 10, 10);
    expect(placed).not.toBeNull();
    const found = mgr.getBuildingAt(10, 10);
    expect(found).not.toBeNull();
    expect(found!.buildingId).toBe('container_solid');
    expect(found!.capacity).toBe(500);
  });

  it('routes a pipe line through empty tiles', () => {
    const mgr = new BuildingManager();
    const route = computeRoute({ tx: 10, ty: 10 }, { tx: 10, ty: 14 }, true, mgr);
    expect(route.length).toBe(5);
    expect(route[0]).toEqual({ tx: 10, ty: 10 });
    expect(route[route.length - 1]).toEqual({ tx: 10, ty: 14 });
  });

  it('stops a route at an occupied tile', () => {
    const grid = new CellularGrid();
    const mgr = new BuildingManager();
    mgr.placeBuilding(grid, def('container_solid'), 10, 12);
    const route = computeRoute({ tx: 10, ty: 10 }, { tx: 10, ty: 14 }, true, mgr);
    // Route halts before the tile occupied by the container
    expect(route.length).toBe(2);
  });
});

describe('GrainWorks — material filters and storage', () => {
  it('updateFilter denies and resetFilterToDefaults restores a socket material', () => {
    const grid = new CellularGrid();
    const mgr = new BuildingManager();
    mgr.placeBuilding(grid, def('container_solid'), 10, 10);
    const b = mgr.getBuildingAt(10, 10)!;
    const socketId = b.sockets[0].id;

    const compatible = Object.values(MATERIAL_DEFS)
      .filter((m) => m.isSolid)
      .map((m) => m.id);
    expect(compatible.length).toBeGreaterThan(0);
    const mat = compatible[0];

    expect(b.filter.allowed[socketId].has(mat)).toBe(true);
    mgr.updateFilter(b.id.toString(), socketId, mat, false);
    expect(b.filter.allowed[socketId].has(mat)).toBe(false);
    mgr.resetFilterToDefaults(b.id.toString());
    expect(b.filter.allowed[socketId].has(mat)).toBe(true);
  });

  it('reports stored material totals and consumes them', () => {
    const grid = new CellularGrid();
    const mgr = new BuildingManager();
    const placed = mgr.placeBuilding(grid, def('container_solid'), 10, 10) as { id: number };
    const b = mgr.getBuildingAt(10, 10)!;
    b.buffer[MaterialType.STRUCTURAL_SOLID] = 42;

    expect(mgr.getMaterialTotalInContainers(MaterialType.STRUCTURAL_SOLID)).toBe(42);
    expect(mgr.consumeMaterialFromContainers(MaterialType.STRUCTURAL_SOLID, 40)).toBe(true);
    expect(mgr.getMaterialTotalInContainers(MaterialType.STRUCTURAL_SOLID)).toBe(2);
    expect(mgr.consumeMaterialFromContainers(MaterialType.STRUCTURAL_SOLID, 5)).toBe(false);
    expect(placed.id).toBeGreaterThan(0);
  });
});

describe('GrainWorks — asteroids and catalog', () => {
  it('setTier drives asteroid spawn rate and tier', () => {
    const aMgr = new AsteroidManager();
    aMgr.setTier(4);
    expect(aMgr.config.tier).toBe(4);
    expect(aMgr.config.spawnRate).toBe(100);
  });

  it('meteor shower deposits materials in the asteroid impact zone', () => {
    const grid = new CellularGrid();
    const aMgr = new AsteroidManager();
    aMgr.spawnMeteorShower(grid, 60);

    let found = 0;
    for (let y = 0; y < ASTEROID_ZONE_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid.materials[grid.getIndex(x, y)] !== MaterialType.VACUUM) found++;
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('ships the five reconstruction entities with material requirements', () => {
    expect(RECONSTRUCTION_ENTITIES.length).toBe(5);
    for (const e of RECONSTRUCTION_ENTITIES) {
      expect(e.reconstructed).toBe(false);
      expect(Object.keys(e.requirements).length).toBeGreaterThan(0);
    }
  });
});

describe('GrainWorks — building defs', () => {
  it('defines unique ids with costs, tiers, and sockets', () => {
    const ids = BUILDING_DEFS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BUILDING_DEFS) {
      expect(b.cost).toBeGreaterThanOrEqual(0);
      expect(b.unlockedAtTier).toBeGreaterThanOrEqual(1);
      expect(b.tileW).toBeGreaterThan(0);
      expect(b.tileH).toBeGreaterThan(0);
    }
  });

  it('aligns tile dims with CA footprint via BUILDING_TILE', () => {
    expect(BUILDING_TILE).toBe(8);
    expect(TILES_X).toBe(40);
    expect(TILES_Y).toBe(25);
    for (const b of BUILDING_DEFS) {
      expect(b.width).toBe(b.tileW * BUILDING_TILE);
      expect(b.height).toBe(b.tileH * BUILDING_TILE);
    }
  });
});
