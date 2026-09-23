import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua, luaNodeToTs, type LabState, type Slime, type PlanetNode, type SlimeColor,
} from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);
const missionsSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/MissionsTab.tsx'),
  'utf8'
);
const alertBoxSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/AlertBox.tsx'),
  'utf8'
);
const logicSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/logic.lua'),
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

describe('SlimeWorld Wire Fealty Transition + Achievement Moment', () => {
  // §3.1: Real, mandatory bridge test — drive color_relationships to 100%
  // through the actual stateToLua->executor->state-sync path, confirm the
  // real narrative log entry fires and App.tsx's alert filter would surface it
  it('test_fealty_transition_triggers_alert_real_bridge', () => {
    const state = makeMinimalState();
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        makeNode('n1', 'Red', { Blue: 50 }, ['n_cap']),
      ],
      generatedAt: Date.now(),
    };
    state.colorRelationships = { Red: 100 } as Record<SlimeColor, number>;
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    expect(result).toBeTruthy();

    const logs = Array.isArray(result['logs']) ? (result['logs'] as Array<Record<string, unknown>>) : [];
    const fealtyLog = logs.find(l =>
      String(l['type'] ?? '') === 'system' &&
      String(l['text'] ?? '').startsWith('FEALTY:')
    );
    expect(fealtyLog).toBeTruthy();
    expect(String(fealtyLog!['text'])).toContain('sworn permanent loyalty');
    expect(String(fealtyLog!['text'])).toContain('Red');

    // Confirm App.tsx wires the FEALTY alert trigger onto the existing AlertBox,
    // matching the real Stray/Refugee pattern (extend, don't rebuild)
    expect(appSource).toContain("l.type === 'system' && l.text.startsWith('FEALTY:')");
    expect(appSource).toContain('fealtyAlerts');
    expect(appSource).toContain('setActiveAlerts');
    // AlertBox itself is untouched — remains generic
    expect(alertBoxSource).not.toContain('FEALTY');
  });

  // §3.2: Real narrative text differs meaningfully from the Stray/Refugee
  // alert text — proves this isn't a copy-pasted generic message
  it('test_fealty_alert_text_distinct_from_stray_alert', () => {
    const fealtyLine = logicSource.split('\n').find(l => l.includes('text = "FEALTY:'));
    const strayLine = logicSource.split('\n').find(l => l.includes('STRAY DETECTION'));
    expect(fealtyLine).toBeTruthy();
    expect(strayLine).toBeTruthy();
    // Fealty's real text emphasizes permanence and quiet payoff
    expect(fealtyLine).toContain('permanent loyalty');
    expect(fealtyLine).toContain('joined your domain');
    // Stray's text is an alarm-toned containment event, not a loyalty payoff
    expect(strayLine).toContain('fled the conflict zone');
    expect(strayLine).not.toContain('permanent');
    // No shared sentence fragments between the two
    expect(fealtyLine).not.toContain('containment');
    expect(strayLine).not.toContain('domain');
  });

  // §3.3: fealty_locked/player_aligned are actually set on the real node
  // post-transition, and a subsequent pressure-sim cycle correctly excludes
  // it (regression check against codex.lua's existing exclusion logic)
  it('test_fealty_node_locked_permanently_after_transition', () => {
    const state = makeMinimalState();
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        makeNode('n1', 'Red', { Blue: 50 }, ['n_cap']),
      ],
      generatedAt: Date.now(),
    };
    state.colorRelationships = { Red: 100 } as Record<SlimeColor, number>;
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    const region = result['planet_region'] as Record<string, unknown>;
    const nodeArray = region['nodes'] as Array<Record<string, unknown>>;
    const n1Raw = nodeArray.find(n => n['id'] === 'n1');
    expect(n1Raw).toBeTruthy();
    const n1 = luaNodeToTs(n1Raw!);
    expect(n1.fealtyLocked).toBe(true);
    expect(n1.playerAligned).toBe(true);
    expect(n1.ownerColor).toBe('Red');

    // Run a second cycle with heavy Blue pressure injected — a fealty-locked
    // node must be excluded from the pressure simulation and stay locked
    const updatedState: LabState = {
      ...state,
      cycle: Number(result['cycle'] ?? state.cycle + 1),
      planetRegion: {
        nodes: [
          luaNodeToTs(nodeArray.find(n => n['id'] === 'n_cap')!),
          { ...n1, pressure: { Blue: 100 } },
        ],
        generatedAt: Date.now(),
      },
    };
    const [raw2] = call(session, 'advance_cycle', stateToLua(updatedState));
    const result2 = raw2 as Record<string, unknown>;
    const region2 = result2['planet_region'] as Record<string, unknown>;
    const nodeArray2 = region2['nodes'] as Array<Record<string, unknown>>;
    const n1After = luaNodeToTs(nodeArray2.find(n => n['id'] === 'n1')!);
    expect(n1After.fealtyLocked).toBe(true);
    expect(n1After.ownerColor).toBe('Red');
    expect(Object.keys(n1After.pressure).length).toBe(0);
  });

  // §3.4: A color at 99% does not incorrectly trigger — proves the
  // threshold check itself wasn't broken by the wiring
  it('test_no_transition_below_threshold', () => {
    const state = makeMinimalState();
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        makeNode('n1', 'Red', { Blue: 50 }, ['n_cap']),
      ],
      generatedAt: Date.now(),
    };
    state.colorRelationships = { Red: 99 } as Record<SlimeColor, number>;
    const [raw] = call(session, 'advance_cycle', stateToLua(state));
    const result = raw as Record<string, unknown>;
    const logs = Array.isArray(result['logs']) ? (result['logs'] as Array<Record<string, unknown>>) : [];
    const fealtyLog = logs.find(l => String(l['text'] ?? '').startsWith('FEALTY:'));
    expect(fealtyLog).toBeUndefined();

    const region = result['planet_region'] as Record<string, unknown>;
    const nodeArray = region['nodes'] as Array<Record<string, unknown>>;
    const n1 = luaNodeToTs(nodeArray.find(n => n['id'] === 'n1')!);
    expect(n1.fealtyLocked).toBeFalsy();
  });

  // §3.5: MissionsTab's existing Favor display/disposal flow still works
  // unchanged after this directive
  it('test_existing_favor_ui_unaffected', () => {
    expect(missionsSource).toContain('pendingDisposalFavorId');
    expect(missionsSource).toContain('disposalConfirmSlimeId');
    expect(missionsSource).toContain('Confirm Disposal');
    expect(missionsSource).toContain('favor.ownerColor');
    expect(appSource).toContain('handleDisposeSlime');
    expect(appSource).toContain('resolve_disposal');
  });
});
