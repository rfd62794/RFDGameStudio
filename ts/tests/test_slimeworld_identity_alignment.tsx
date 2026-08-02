import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua, luaNodeToTs, nodeToLua, type LabState, type Slime, type PlanetNode, type SlimeColor,
} from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

const territorySource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/territory.lua'),
  'utf8'
);

const favorsSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/favors.lua'),
  'utf8'
);

const codexSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/codex.lua'),
  'utf8'
);

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

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
    wildsUnlocked: false, hasAutoFeeder: false, cultureRelationships: {} as Record<SlimeColor, number>,
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

function makeStrongSlime(color: SlimeColor): Slime {
  return {
    id: 's1', name: 'Strong', color, pattern: 'Solid', level: 10, xp: 0,
    stats: { hp: 200, atk: 50, def: 50, agi: 50, int: 50, chm: 50 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
}

describe('SlimeWorld Identity Alignment Directive', () => {
  // §3.1: Force claim sets player_aligned=true AND owner_color=Gray (erasure stays)
  it('test_force_claim_sets_player_aligned_and_gray', () => {
    const node = makeNode('n1', 'Red', { Blue: 30 });
    const slime = makeStrongSlime('Red');
    const [result] = luaResult(call(session, 'resolve_force_claim', nodeToLua(node), [slime], true, 0));
    expect(result).toBeTruthy();
    expect(result!['success']).toBe(true);
    const updated = result!['updated_node'] as Record<string, unknown>;
    expect(updated['owner_color']).toBe('Gray');
    expect(updated['player_aligned']).toBe(true);
  });

  // §3.2: Bribe claim sets player_aligned=true AND owner_color=Gray (erasure stays)
  it('test_bribe_claim_sets_player_aligned_and_gray', () => {
    const node = makeNode('n1', 'Red', { Blue: 30 });
    const [result] = luaResult(call(session, 'resolve_bribe_claim', nodeToLua(node), 500, true, 0));
    expect(result).toBeTruthy();
    expect(result!['success']).toBe(true);
    const updated = result!['updated_node'] as Record<string, unknown>;
    expect(updated['owner_color']).toBe('Gray');
    expect(updated['player_aligned']).toBe(true);
  });

  // §3.3: Convert claim preserves owner_color (no Gray overwrite) and sets player_aligned=true
  it('test_convert_claim_preserves_owner_color', () => {
    const node = makeNode('n1', 'Blue', { Red: 30 });
    const slime = makeStrongSlime('Red');
    const [result] = luaResult(call(session, 'resolve_convert_claim', nodeToLua(node), [slime], 80, true, 0));
    expect(result).toBeTruthy();
    expect(result!['success']).toBe(true);
    const updated = result!['updated_node'] as Record<string, unknown>;
    expect(updated['owner_color']).toBe('Blue');
    expect(updated['player_aligned']).toBe(true);
  });

  // §3.4: Fealty transition preserves owner_color and sets player_aligned=true
  it('test_fealty_transition_preserves_owner_color', () => {
    const state = makeMinimalState();
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        makeNode('n1', 'Red', { Blue: 50 }, ['n_cap']),
      ],
      generatedAt: Date.now(),
    };
    state.cultureRelationships = { Red: 100 } as Record<SlimeColor, number>;
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    const region = result['planet_region'] as Record<string, unknown>;
    const nodeArray = region['nodes'] as Array<Record<string, unknown>>;
    const n1Node = nodeArray.find(n => n['id'] === 'n1');
    expect(n1Node).toBeTruthy();
    const node = luaNodeToTs(n1Node!);
    expect(node.fealtyLocked).toBe(true);
    expect(node.playerAligned).toBe(true);
    expect(node.ownerColor).toBe('Red');
  });

  // §3.5: Any player_aligned node (regardless of owner_color) produces no new Favor
  it('test_player_aligned_node_stops_generating_favors', () => {
    const state = makeMinimalState();
    const alignedNode = makeNode('n1', 'Red', { Blue: 50 });
    alignedNode.playerAligned = true;
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        alignedNode,
      ],
      generatedAt: Date.now(),
    };
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    const favors = result['favors'] as Array<Record<string, unknown>>;
    // No favor should be generated for n1 (player_aligned, even though owner_color=Red and Blue pressure=50)
    const favorForN1 = favors?.find(f => f['node_id'] === 'n1');
    expect(favorForN1).toBeUndefined();
  });

  // §3.6: player_aligned node excluded from pressure contest
  it('test_player_aligned_node_excluded_from_pressure_contest', () => {
    const state = makeMinimalState();
    const alignedNode = makeNode('n1', 'Red', { Blue: 50 }, ['n2']);
    alignedNode.playerAligned = true;
    state.planetRegion = {
      nodes: [
        alignedNode,
        makeNode('n2', 'Blue', {}, ['n1']),
      ],
      generatedAt: Date.now(),
    };
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    const region = result['planet_region'] as Record<string, unknown>;
    const nodeArray = region['nodes'] as Array<Record<string, unknown>>;
    const n1 = luaNodeToTs(nodeArray[0]);
    // player_aligned node should have pressure cleared (like fealty_locked)
    expect(n1.playerAligned).toBe(true);
    expect(Object.keys(n1.pressure).length).toBe(0);
  });

  // §3.7: No remaining Gray-based control checks in the codebase
  it('test_no_remaining_gray_based_control_checks', () => {
    // favors.lua: the gate should check player_aligned, not owner_color ~= "Gray"
    expect(favorsSource).toContain('player_aligned');
    expect(favorsSource).not.toContain('owner_color ~= "Gray"');

    // territory.lua: claim_grudge_color should check player_aligned, not owner_color ~= "Gray"
    expect(territorySource).toContain('player_aligned');
    expect(territorySource).not.toContain('owner_color ~= "Gray"');

    // codex.lua: pressure sim should exclude player_aligned nodes
    expect(codexSource).toContain('player_aligned');

    // The only remaining "Gray" references in territory.lua should be genuine color logic
    // (dominant_color fallback, pressure color filtering)
    const grayLines = territorySource.split('\n').filter(l => l.includes('"Gray"'));
    for (const line of grayLines) {
      // These are genuine color logic: fallback for empty party, pressure color filtering, intentional Gray erasure by Force/Bribe, or default color in convert_target_color
      expect(line).toMatch(/dominant_color|color ~= "Gray"|or "Gray"|owner_color = "Gray"|target_color = "Gray"/);
    }
  });
});
