import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, type LabState, type Slime, type SlimeColor } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

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
    logs: [], activeMediation: null, activeExploration: null, planetRegion: {
      nodes: [
        { id: 'n_cap', name: 'n_cap', cellShape: '', labelX: 0, labelY: 0, neighbors: ['n1'],
          ownerColor: 'Red', pressure: {}, strength: 0.5, isCapitol: true, isSupplied: true,
          distanceFromCenter: 50, discovered: true, garrisonSlimeId: null },
        { id: 'n1', name: 'n1', cellShape: '', labelX: 0, labelY: 0, neighbors: ['n_cap'],
          ownerColor: 'Red', pressure: { Blue: 50 } as Partial<Record<SlimeColor, number>>, strength: 0.5, isCapitol: false, isSupplied: true,
          distanceFromCenter: 50, discovered: true, garrisonSlimeId: null },
      ],
      generatedAt: Date.now(),
    },
    wildsUnlocked: false, hasAutoFeeder: false, cultureRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], petitions: [],
  };
}

describe('Debug', () => {
  it('debug_advance_cycle', () => {
    const state = makeMinimalState();
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    console.log('favors:', JSON.stringify(result['favors']));
    console.log('culture_relationships:', JSON.stringify(result['culture_relationships']));
    const region = result['planet_region'] as Record<string, unknown>;
    const nodes = region['nodes'] as Array<Record<string, unknown>>;
    for (const n of nodes) {
      console.log('node:', n['id'], 'owner:', n['owner_color'], 'pressure:', JSON.stringify(n['pressure']), 'supplied:', n['is_supplied'], 'fealty:', n['fealty_locked']);
    }
    const logs = result['logs'] as Array<Record<string, unknown>>;
    if (logs) {
      for (const l of logs) {
        console.log('log:', l['text']);
      }
    }
    expect(true).toBe(true);
  });
});
