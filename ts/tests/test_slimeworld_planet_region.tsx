import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

describe('SlimeWorld Planet Region Generation', () => {
  it('test_generate_planet_region_returns_8_nodes', () => {
    const region = generatePlanetRegion();
    expect(region.nodes.length).toBe(8);

    const expectedIds = [
      'node_solitude', 'node_feral', 'node_rust', 'node_sulphur',
      'node_wetlands', 'node_jungle', 'node_abyss', 'node_twilight'
    ];
    for (const id of expectedIds) {
      expect(region.nodes.some(n => n.id === id)).toBe(true);
    }
  });

  it('test_generate_planet_region_capitol_ownership', () => {
    const region = generatePlanetRegion();
    const byId = (id: string) => region.nodes.find(n => n.id === id)!;

    expect(byId('node_solitude').ownerColor).toBe('Red');
    expect(byId('node_abyss').ownerColor).toBe('Blue');
    expect(byId('node_twilight').ownerColor).toBe('Purple');
    expect(byId('node_rust').ownerColor).toBe('Orange');
    expect(byId('node_feral').ownerColor).toBe('Green');

    expect(byId('node_sulphur').ownerColor).toBeNull();
    expect(byId('node_jungle').ownerColor).toBeNull();
    expect(byId('node_wetlands').ownerColor).toBeNull();

    const capitols = region.nodes.filter(n => n.isCapitol);
    expect(capitols.length).toBe(5);
    const neutral = region.nodes.filter(n => !n.isCapitol);
    expect(neutral.length).toBe(3);
  });

  it('test_generate_planet_region_starting_pressure', () => {
    const region = generatePlanetRegion();
    const byId = (id: string) => region.nodes.find(n => n.id === id)!;

    expect(byId('node_sulphur').pressure).toEqual({ Red: 15, Blue: 25 });
    expect(byId('node_jungle').pressure).toEqual({ Red: 35, Blue: 10 });
    expect(byId('node_wetlands').pressure).toEqual({ Purple: 20, Orange: 15, Green: 10 });

    expect(byId('node_solitude').pressure).toEqual({});
    expect(byId('node_abyss').pressure).toEqual({});
  });

  it('test_generate_planet_region_capitols_discovered_frontier_fogged', () => {
    const region = generatePlanetRegion();
    for (const node of region.nodes) {
      expect(node.discovered).toBe(node.isCapitol);
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

  it('test_app_initial_state_has_real_planet_region', () => {
    expect(appSource).toContain('generatePlanetRegion()');
    expect(appSource).not.toMatch(/planetRegion:\s*null/);
  });

  it('test_missions_tab_renders_map_not_placeholder', () => {
    const region = generatePlanetRegion();
    expect(region).toBeTruthy();
    expect(region.nodes.length).toBe(8);

    const hasRealNodes = region.nodes.every(n =>
      n.cellShape && n.labelX !== undefined && n.labelY !== undefined
    );
    expect(hasRealNodes).toBe(true);

    const missionsSource = readFileSync(
      resolve(import.meta.dirname, '../src/games/slimeworld/components/MissionsTab.tsx'),
      'utf8'
    );
    expect(missionsSource).toContain('state.planetRegion');
    expect(missionsSource).toContain('Unexplored Region');
    expect(missionsSource).toContain('cellShape');
  });
});
