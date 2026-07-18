import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

describe('SlimeWorld Planet Region Generation (20-Node)', () => {
  it('test_generate_planet_region_returns_20_nodes', () => {
    const region = generatePlanetRegion();
    expect(region.nodes.length).toBe(20);

    const expectedIds = [
      'node_ember', 'node_marsh', 'node_gale', 'node_tundra', 'node_crystal', 'node_tide',
      'node_frontier_a', 'node_frontier_b', 'node_frontier_c', 'node_frontier_d', 'node_frontier_e', 'node_frontier_f',
      'node_mid_a', 'node_mid_b', 'node_mid_c', 'node_mid_d', 'node_mid_e', 'node_mid_f', 'node_mid_g', 'node_mid_h'
    ];
    for (const id of expectedIds) {
      expect(region.nodes.some(n => n.id === id)).toBe(true);
    }
  });

  it('test_generate_planet_region_six_capitols_distinct_colors', () => {
    const region = generatePlanetRegion();
    const byId = (id: string) => region.nodes.find(n => n.id === id)!;

    expect(byId('node_ember').ownerColor).toBe('Red');
    expect(byId('node_marsh').ownerColor).toBe('Orange');
    expect(byId('node_gale').ownerColor).toBe('Yellow');
    expect(byId('node_tundra').ownerColor).toBe('Green');
    expect(byId('node_crystal').ownerColor).toBe('Purple');
    expect(byId('node_tide').ownerColor).toBe('Blue');

    const capitols = region.nodes.filter(n => n.isCapitol);
    expect(capitols.length).toBe(6);
    const colors = capitols.map(c => c.ownerColor);
    expect(new Set(colors).size).toBe(6);
  });

  it('test_generate_planet_region_frontier_pressure_values', () => {
    const region = generatePlanetRegion();
    const byId = (id: string) => region.nodes.find(n => n.id === id)!;

    expect(byId('node_frontier_a').pressure).toEqual({ Red: 15, Orange: 15 });
    expect(byId('node_frontier_b').pressure).toEqual({ Yellow: 15, Green: 15 });
    expect(byId('node_frontier_c').pressure).toEqual({ Purple: 15, Blue: 15 });
    expect(byId('node_frontier_d').pressure).toEqual({ Red: 10, Blue: 15, Yellow: 10 });
    expect(byId('node_frontier_e').pressure).toEqual({ Orange: 10, Green: 15 });
    expect(byId('node_frontier_f').pressure).toEqual({ Yellow: 10, Purple: 15 });
  });

  it('test_generate_planet_region_midpoint_pressure_values', () => {
    const region = generatePlanetRegion();
    const byId = (id: string) => region.nodes.find(n => n.id === id)!;

    expect(byId('node_mid_a').pressure).toEqual({ Red: 20 });
    expect(byId('node_mid_b').pressure).toEqual({ Orange: 20 });
    expect(byId('node_mid_c').pressure).toEqual({ Yellow: 20 });
    expect(byId('node_mid_d').pressure).toEqual({ Green: 20 });
    expect(byId('node_mid_e').pressure).toEqual({ Purple: 20 });
    expect(byId('node_mid_f').pressure).toEqual({ Blue: 20 });
    expect(byId('node_mid_g').pressure).toEqual({ Red: 10, Blue: 10 });
    expect(byId('node_mid_h').pressure).toEqual({ Yellow: 10, Orange: 10 });
  });

  it('test_generate_planet_region_non_capitols_undiscovered', () => {
    const region = generatePlanetRegion();
    const nonCapitols = region.nodes.filter(n => !n.isCapitol);
    expect(nonCapitols.length).toBe(14);
    for (const node of nonCapitols) {
      expect(node.discovered).toBe(false);
      expect(node.ownerColor).toBeNull();
      expect(node.strength).toBe(0);
      expect(node.isSupplied).toBe(false);
    }
    const capitols = region.nodes.filter(n => n.isCapitol);
    for (const node of capitols) {
      expect(node.discovered).toBe(true);
    }
  });

  it('test_generate_planet_region_polygon_shapes_valid', () => {
    const region = generatePlanetRegion();
    for (const node of region.nodes) {
      expect(node.cellShape).toBeTruthy();
      expect(node.cellShape.startsWith('M ')).toBe(true);
      expect(node.cellShape).toContain('Z');
      expect(node.cellShape.length).toBeGreaterThan(20);
    }
  });

  it('test_missions_tab_renders_full_map', () => {
    const region = generatePlanetRegion();
    expect(region).toBeTruthy();
    expect(region.nodes.length).toBe(20);

    const hasRealNodes = region.nodes.every(n =>
      n.cellShape && n.labelX !== undefined && n.labelY !== undefined
    );
    expect(hasRealNodes).toBe(true);

    expect(appSource).toContain('generatePlanetRegion()');
    expect(appSource).not.toMatch(/planetRegion:\s*null/);

    const missionsSource = readFileSync(
      resolve(import.meta.dirname, '../src/games/slimeworld/components/MissionsTab.tsx'),
      'utf8'
    );
    expect(missionsSource).toContain('state.planetRegion');
    expect(missionsSource).toContain('cellShape');
  });
});
