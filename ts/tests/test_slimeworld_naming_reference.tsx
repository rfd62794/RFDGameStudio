import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua, luaNodeToTs, luaFavorToTs, type LabState, type Slime, type PlanetNode, type SlimeColor,
} from '../src/games/slimeworld/types';
import { CULTURE_COLOR_STRAIN_REFERENCE } from '../src/games/slimeworld/namingReference';
import { COLOR_SPECS } from '../src/games/slimeworld/gameLogic';

const session = loadGame('slimeworld');

const favorsLuaSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/favors.lua'),
  'utf8'
);
const territoryLuaSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/territory.lua'),
  'utf8'
);
const logicLuaSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/logic.lua'),
  'utf8'
);
const typesSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/types.ts'),
  'utf8'
);
const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);
const missionsSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/MissionsTab.tsx'),
  'utf8'
);
const dataYamlSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/data.yaml'),
  'utf8'
);

function makeMinimalState(): LabState {
  const slime: Slime = {
    id: 's1', name: 'Test Slime', color: 'Red', pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [slime], contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false, colorRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    petitions: [],
  };
}

function makeNode(id: string, ownerColor: SlimeColor, pressure: Partial<Record<SlimeColor, number>>, neighbors: string[] = [], isCapitol = false): PlanetNode {
  return {
    id, name: id, cellShape: '', labelX: 0, labelY: 0, neighbors,
    ownerColor, pressure, strength: 0.5, isCapitol, isSupplied: true,
    distanceFromCenter: 50, discovered: true, garrisonSlimeId: null,
  };
}

describe('SlimeWorld Color/Culture/Strain Naming Correction', () => {
  // §3.1: Grep-based — confirm zero real (non-comment) references to the
  // old field names remain anywhere in .lua/.ts/.tsx
  it('test_no_functional_code_references_old_culture_field_name', () => {
    // The old state field name `culture_relationships` / `cultureRelationships`
    // must be fully gone from real, functional code (favors.lua, territory.lua,
    // types.ts, App.tsx, MissionsTab.tsx). Reference-only mentions in comments
    // explaining the rename (e.g. this test file, naming_reference.lua) don't count.
    const functionalSources: Array<[string, string]> = [
      ['favors.lua', favorsLuaSource],
      ['territory.lua', territoryLuaSource],
      ['logic.lua', logicLuaSource],
      ['types.ts', typesSource],
      ['App.tsx', appSource],
      ['MissionsTab.tsx', missionsSource],
    ];
    for (const [name, source] of functionalSources) {
      expect(source, `${name} should not reference culture_relationships`).not.toMatch(/culture_relationships/);
      expect(source, `${name} should not reference cultureRelationships`).not.toMatch(/cultureRelationships/);
    }
    // favor.culture / Favor.culture (the old field name) must be gone too
    expect(favorsLuaSource).not.toMatch(/favor\.culture\b/);
    expect(favorsLuaSource).not.toMatch(/\bculture\s*=\s*node\.owner_color/);
    expect(typesSource).not.toMatch(/\bculture:\s*SlimeColor/);
    expect(missionsSource).not.toMatch(/favor\.culture\b/);
    // data.yaml's lab seed key is renamed too
    expect(dataYamlSource).not.toMatch(/culture_relationships/);
  });

  // §3.2: Real bridge test — favor generation behaves identically after rename
  it('test_favor_generation_unchanged_after_rename', () => {
    const state = makeMinimalState();
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        makeNode('n1', 'Red', { Blue: 50 }, ['n_cap']),
        makeNode('n2', 'Blue', { Red: 10 }, []),
      ],
      generatedAt: Date.now(),
    };
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    expect(result).toBeTruthy();
    const favors = result['favors'];
    expect(Array.isArray(favors)).toBe(true);
    const favorArray = favors as Array<Record<string, unknown>>;
    // n1 has Blue pressure of 50 (>= 20 threshold) — should generate a favor
    expect(favorArray.length).toBeGreaterThanOrEqual(1);
    const favor = luaFavorToTs(favorArray[0]);
    // Behavior is identical: favor targets n1, owned by Red, pressured by Blue
    expect(favor.nodeId).toBe('n1');
    expect(favor.ownerColor).toBe('Red');
    expect(favor.pressureColor).toBe('Blue');
    expect(favor.pressureAmount).toBeGreaterThanOrEqual(20);
    // The raw Lua field is now owner_color, not culture
    expect(favorArray[0]['owner_color']).toBe('Red');
    expect(favorArray[0]['culture']).toBeUndefined();
  });

  // §3.3: Real bridge test — Fealty threshold logic (100%, FEALTY_THRESHOLD)
  // still works identically post-rename
  it('test_color_relationships_rename_preserves_fealty_threshold_logic', () => {
    const state = makeMinimalState();
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        makeNode('n1', 'Red', { Blue: 50 }, ['n_cap']),
      ],
      generatedAt: Date.now(),
    };
    // Set color_relationships to 100 for Red — should trigger Fealty
    state.colorRelationships = { Red: 100 } as Record<SlimeColor, number>;
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    const region = result['planet_region'] as Record<string, unknown>;
    const nodeArray = region['nodes'] as Array<Record<string, unknown>>;
    const n1Node = nodeArray.find(n => n['id'] === 'n1');
    expect(n1Node).toBeTruthy();
    const node = luaNodeToTs(n1Node!);
    // Fealty threshold logic (100%) still locks the node identically
    expect(node.fealtyLocked).toBe(true);
    expect(node.playerAligned).toBe(true);
    expect(node.ownerColor).toBe('Red');
    // The raw Lua state key is now color_relationships
    expect(result['color_relationships']).toBeTruthy();
    expect(result['culture_relationships']).toBeUndefined();
  });

  // §3.4: Confirm the six real entries in the new reference table actually
  // match data.yaml's real current culture->color mapping and gameLogic.ts's
  // real Strain names — catches future drift.
  it('test_reference_table_matches_real_data_yaml', () => {
    const data = session.files.data as Record<string, unknown>;
    const cultures = data['cultures'] as Record<string, Record<string, unknown>>;
    expect(cultures).toBeTruthy();

    // Every entry in the reference table must match a real culture in data.yaml
    for (const entry of CULTURE_COLOR_STRAIN_REFERENCE) {
      const realCulture = cultures[entry.culture];
      expect(realCulture, `culture key "${entry.culture}" should exist in data.yaml`).toBeTruthy();
      expect(realCulture['color'], `${entry.culture}'s color should match reference`).toBe(entry.color);
      // Strain name should match gameLogic.ts's COLOR_SPECS[color].specialty
      expect(COLOR_SPECS[entry.color].specialty, `${entry.color}'s strain should match reference`).toBe(entry.strain);
    }

    // Every real culture in data.yaml must be represented in the reference table
    const realCultureKeys = Object.keys(cultures);
    const referenceCultureKeys = CULTURE_COLOR_STRAIN_REFERENCE.map(e => e.culture);
    for (const key of realCultureKeys) {
      expect(referenceCultureKeys, `real culture "${key}" should be represented in the reference table`).toContain(key);
    }
    expect(referenceCultureKeys.length).toBe(realCultureKeys.length);

    // Cross-check directly against the raw data.yaml text (not just the parsed session data)
    const rawYaml = yaml.load(dataYamlSource) as Record<string, unknown>;
    const rawCultures = rawYaml['cultures'] as Record<string, Record<string, unknown>>;
    for (const entry of CULTURE_COLOR_STRAIN_REFERENCE) {
      expect(rawCultures[entry.culture]['color']).toBe(entry.color);
    }
  });
});
