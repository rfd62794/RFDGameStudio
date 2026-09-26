import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, luaPetitionToTs, type LabState, type Slime } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const petitionConfig = data['petition'] as Record<string, unknown>;

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

const economySource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/EconomyTab.tsx'),
  'utf8'
);

function makeMinimalState(overrides: Partial<LabState> = {}): LabState {
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
    wildsUnlocked: false, hasAutoFeeder: false, colorRelationships: {} as Record<Slime['color'], number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    petitions: [],
    ...overrides,
  };
}

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

function stateWithPetitions(): LabState {
  const state = makeMinimalState();
  const [advanceResult] = call(session, 'advance_cycle', stateToLua(state));
  const adv = advanceResult as Record<string, unknown>;
  const petitions = (adv['petitions'] as Array<Record<string, unknown>>).map(luaPetitionToTs);
  return {
    ...state,
    cycle: Number(adv['cycle'] ?? state.cycle + 1),
    credits: Number(adv['credits'] ?? state.credits),
    petitions,
  };
}

describe('SlimeWorld Petition Decline', () => {
  it('test_data_yaml_carries_petition_discovered_target_ratio', () => {
    expect(petitionConfig).toBeTruthy();
    expect(Number(petitionConfig['discovered_target_ratio'])).toBe(0.8);
  });

  it('test_stateToLua_carries_codex_maps_for_petition_pools', () => {
    const state = makeMinimalState({
      colorCodex: { Red: { discovered: true }, Purple: { discovered: true } },
      shapeCodex: { Triangle: true },
    });
    const lua = stateToLua(state);
    expect(lua['color_codex']).toEqual({ Red: { discovered: true }, Purple: { discovered: true } });
    expect(lua['shape_codex']).toEqual({ Triangle: true });
  });

  it('test_decline_petition_removes_and_regenerates_immediately', () => {
    const state = stateWithPetitions();
    expect(state.petitions!.length).toBeGreaterThanOrEqual(1);
    const declinedId = state.petitions![0].id;

    const [raw, error] = luaResult(
      call(session, 'decline_petition', stateToLua(state), declinedId, petitionConfig)
    );
    expect(error).toBeNull();
    expect(raw).toBeTruthy();
    expect(raw!['declined_id']).toBe(declinedId);

    const petitions = (raw!['petitions'] as Array<Record<string, unknown>>).map(luaPetitionToTs);
    expect(petitions.length).toBe(3);
    expect(petitions.find(p => p.id === declinedId)).toBeUndefined();
    expect(petitions.every(p => p.source === 'wanderer')).toBe(true);
    expect(petitions.every(p => p.expiresCycle > state.cycle)).toBe(true);
  });

  it('test_decline_petition_unknown_id_errors', () => {
    const state = stateWithPetitions();
    const [raw, error] = luaResult(
      call(session, 'decline_petition', stateToLua(state), 'missing_petition', petitionConfig)
    );
    expect(raw).toBeNull();
    expect(error).toBe('Petition not found');
  });

  it('test_advance_cycle_accepts_petition_config_arg', () => {
    const state = makeMinimalState();
    const [raw] = call(session, 'advance_cycle', stateToLua(state), undefined, petitionConfig);
    const result = raw as Record<string, unknown>;
    expect(result).toBeTruthy();
    const petitions = result['petitions'] as Array<Record<string, unknown>>;
    expect(petitions.length).toBeGreaterThanOrEqual(1);
  });

  it('test_economytab_renders_decline_button', () => {
    expect(economySource).toContain('handleDeclinePetition');
    expect(economySource).toContain('Decline');
  });

  it('test_app_wires_decline_petition', () => {
    expect(appSource).toContain("'decline_petition'");
    expect(appSource).toContain('handleDeclinePetition');
    expect(appSource).toContain("data['petition']");
  });
});
