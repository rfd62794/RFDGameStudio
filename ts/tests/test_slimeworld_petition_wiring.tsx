import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, luaPetitionToTs, type LabState, type Slime, type Petition } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

const economySource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/EconomyTab.tsx'),
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
    wildsUnlocked: false, hasAutoFeeder: false, cultureRelationships: {} as Record<Slime['color'], number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    petitions: [],
  };
}

function luaResult(value: unknown): [Record<string, unknown> | null, string | null] {
  if (Array.isArray(value)) return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] ?? null) as string | null];
  return [value as Record<string, unknown> | null, null];
}

describe('SlimeWorld Petition Wiring', () => {
  it('test_createInitialState_seeds_empty_petitions', () => {
    expect(appSource).toContain('petitions: []');
  });

  it('test_handleAdvanceCycle_parses_real_petitions', () => {
    const state = makeMinimalState();
    const raw = call(session, 'advance_cycle', stateToLua(state));
    expect(raw).toBeTruthy();
    const result = raw as Record<string, unknown>;
    const petitions = result['petitions'];
    expect(Array.isArray(petitions)).toBe(true);
    const petitionArray = petitions as Array<Record<string, unknown>>;
    expect(petitionArray.length).toBeGreaterThanOrEqual(1);

    const petition = luaPetitionToTs(petitionArray[0]);
    expect(petition.source).toBe('wanderer');
    expect(petition.id).toBeTruthy();
    expect(petition.expiresCycle).toBeGreaterThan(1);
    expect(petition.payoutMultiplier).toBeGreaterThan(0);
  });

  it('test_handleFulfillPetition_real_success', () => {
    const state = makeMinimalState();
    const advanceResult = call(session, 'advance_cycle', stateToLua(state)) as Record<string, unknown>;
    const petitions = advanceResult['petitions'] as Array<Record<string, unknown>>;
    expect(petitions.length).toBeGreaterThanOrEqual(1);

    const updatedState: LabState = {
      ...state,
      cycle: Number(advanceResult['cycle'] ?? state.cycle + 1),
      credits: Number(advanceResult['credits'] ?? state.credits),
      petitions: petitions.map(luaPetitionToTs),
    };

    const petition = updatedState.petitions![0];

    if (petition.requestedColor && petition.requestedColor !== 'Red') {
      const matchingSlime: Slime = {
        ...state.slimes[0],
        id: 's_match', color: petition.requestedColor,
        hue: petition.requestedColor === 'Blue' ? 300 : petition.requestedColor === 'Green' ? 180 : 0,
      };
      updatedState.slimes = [...updatedState.slimes, matchingSlime];
    }

    const fulfillRaw = call(session, 'fulfill_petition', stateToLua(updatedState), petition.id, updatedState.slimes[0].id);
    const [result, error] = luaResult(fulfillRaw);
    expect(error).toBeNull();
    expect(result).toBeTruthy();
    expect(Number(result!['payout'])).toBeGreaterThan(0);
    expect(result!['fulfilled_slime_id']).toBe(updatedState.slimes[0].id);
  });

  it('test_handleFulfillPetition_real_failure', () => {
    const state = makeMinimalState();
    const advanceResult = call(session, 'advance_cycle', stateToLua(state)) as Record<string, unknown>;
    const petitions = advanceResult['petitions'] as Array<Record<string, unknown>>;
    expect(petitions.length).toBeGreaterThanOrEqual(1);

    const updatedState: LabState = {
      ...state,
      cycle: Number(advanceResult['cycle'] ?? state.cycle + 1),
      credits: Number(advanceResult['credits'] ?? state.credits),
      petitions: petitions.map(luaPetitionToTs),
    };

    const petition = updatedState.petitions![0];

    if (petition.requestedColor && petition.requestedColor !== 'Blue') {
      const wrongSlime: Slime = {
        ...state.slimes[0],
        id: 's_wrong', color: 'Blue' as Slime['color'], hue: 300,
      };
      updatedState.slimes = [...updatedState.slimes, wrongSlime];

      const fulfillRaw = call(session, 'fulfill_petition', stateToLua(updatedState), petition.id, 's_wrong');
      const [result, error] = luaResult(fulfillRaw);
      expect(error).toBeTruthy();
      expect(result).toBeNull();
    } else {
      const fulfillRaw = call(session, 'fulfill_petition', stateToLua(updatedState), petition.id, 'nonexistent_slime');
      const [result, error] = luaResult(fulfillRaw);
      expect(error).toBeTruthy();
      expect(result).toBeNull();
    }
  });

  it('test_economytab_renders_real_petitions', () => {
    expect(economySource).toContain('Wanderer Petitions');
    expect(economySource).toContain('handleFulfillPetition');
    expect(economySource).toContain('confirmPetitionFulfill');
    expect(economySource).toContain('state.petitions');
    expect(economySource).toContain('requestedColor');
    expect(economySource).toContain('expiresCycle');
  });
});
