// <!-- new: ts/tests/test_voidrift_particle_sandbox_tiles_materials.ts -->
// Guards the CA-cell <-> building-tile coordinate contract (snapToTile /
// tileToCA over the 40x25 tile grid of 8x8 cells) and the MATERIAL_DEFS
// catalog (12 entries keyed by MaterialType, sane colors/rgb/tiers, and the
// isEmissive flag set matching EMISSIVE_MATERIALS). Pure functions: no stubs.
import { describe, it, expect } from 'vitest';
import {
  MaterialType,
  MATERIAL_DEFS,
} from '../src/games/voidrift_particle_sandbox/types';
import {
  snapToTile,
  tileToCA,
  TILES_X,
  TILES_Y,
} from '../src/games/voidrift_particle_sandbox/simulation/routing';
import { BUILDING_TILE } from '../src/games/voidrift_particle_sandbox/simulation/buildingDefs';
import { EMISSIVE_MATERIALS } from '../src/games/voidrift_particle_sandbox/simulation/flowParticles';

describe('VoidRift Particle Sandbox — snapToTile / tileToCA', () => {
  it('maps CA coordinates to 8x8 building tiles and back', () => {
    expect(snapToTile(17, 33)).toEqual({ tx: 2, ty: 4 });
    expect(tileToCA(2, 4)).toEqual({ x: 16, y: 32 });
    expect(snapToTile(tileToCA(7, 9).x, tileToCA(7, 9).y)).toEqual({ tx: 7, ty: 9 });
  });

  it('clamps out-of-range CA coordinates to the tile grid edges', () => {
    expect(snapToTile(-5, 9999)).toEqual({ tx: 0, ty: 24 });
    expect(TILES_X).toBe(40);
    expect(TILES_Y).toBe(25);
    expect(BUILDING_TILE).toBe(8);
  });

  it('round-trips every corner tile and an interior tile', () => {
    const tiles = [
      { tx: 0, ty: 0 },
      { tx: TILES_X - 1, ty: 0 },
      { tx: 0, ty: TILES_Y - 1 },
      { tx: TILES_X - 1, ty: TILES_Y - 1 },
      { tx: 7, ty: 9 },
    ];
    for (const t of tiles) {
      const ca = tileToCA(t.tx, t.ty);
      expect(snapToTile(ca.x, ca.y)).toEqual(t);
    }
  });

  it('keeps the same tile up to BUILDING_TILE - 1 and advances at BUILDING_TILE', () => {
    const ca = tileToCA(7, 9);
    expect(snapToTile(ca.x + BUILDING_TILE - 1, ca.y + BUILDING_TILE - 1)).toEqual({
      tx: 7,
      ty: 9,
    });
    expect(snapToTile(ca.x + BUILDING_TILE, ca.y)).toEqual({ tx: 8, ty: 9 });
    expect(snapToTile(ca.x, ca.y + BUILDING_TILE)).toEqual({ tx: 7, ty: 10 });
    // Last row/column clamps instead of advancing past the edge.
    const edge = tileToCA(TILES_X - 1, TILES_Y - 1);
    expect(snapToTile(edge.x + BUILDING_TILE, edge.y + BUILDING_TILE)).toEqual({
      tx: TILES_X - 1,
      ty: TILES_Y - 1,
    });
  });
});

describe('VoidRift Particle Sandbox — MATERIAL_DEFS catalog', () => {
  const defs = Object.values(MATERIAL_DEFS);

  it('has exactly 12 entries keyed 0..11 with def.id matching its key', () => {
    const keys = Object.keys(MATERIAL_DEFS)
      .map(Number)
      .sort((a, b) => a - b);
    expect(keys).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const [key, def] of Object.entries(MATERIAL_DEFS)) {
      expect(def.id).toBe(Number(key));
    }
  });

  it('names are non-empty and unique', () => {
    const names = defs.map((d) => d.name);
    for (const name of names) {
      expect(name.length).toBeGreaterThan(0);
    }
    expect(new Set(names).size).toBe(names.length);
  });

  it('color is a #rrggbb hex string and rgb holds the same bytes', () => {
    for (const def of defs) {
      expect(def.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(def.rgb.length).toBe(3);
      for (const channel of def.rgb) {
        expect(Number.isInteger(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
      expect(def.rgb).toEqual([
        parseInt(def.color.slice(1, 3), 16),
        parseInt(def.color.slice(3, 5), 16),
        parseInt(def.color.slice(5, 7), 16),
      ]);
    }
  });

  it('unlockedAtTier is at least 1 where defined', () => {
    for (const def of defs) {
      if (def.unlockedAtTier !== undefined) {
        expect(def.unlockedAtTier).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('the isEmissive flag set equals EMISSIVE_MATERIALS', () => {
    const emissiveIds = new Set(defs.filter((d) => d.isEmissive).map((d) => d.id));
    expect(emissiveIds.size).toBe(4);
    expect(emissiveIds).toEqual(EMISSIVE_MATERIALS);
  });

  it('MaterialType has exactly 12 numeric enum values', () => {
    const numericValues = Object.values(MaterialType).filter(
      (v) => typeof v === 'number'
    );
    expect(numericValues.length).toBe(12);
  });
});
