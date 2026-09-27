import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua, SLIME_EXPLICIT_LUA_FIELDS,
  type LabState, type Slime, type SlimeColor,
} from '../src/games/slimeworld/types';
import { buildColorSpecs, SEED_SHAPE_DEFAULTS } from '../src/games/slimeworld/App';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const colorTargets = data['color_targets'] as Array<Record<string, unknown>>;
const shapeTargets = data['shape_targets'] as Array<Record<string, unknown>>;
const accentTargets = data['accent_targets'] as Array<Record<string, unknown>>;
const regionLocks = data['region_locks'] as Array<Record<string, unknown>>;
const regentRewards = data['regent_rewards'] as Record<string, unknown>;
const colorSpecs = buildColorSpecs(data);

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

function makeStarter(color: SlimeColor, id: string): Slime {
  const [raw] = call(session, 'create_seed_slime', color, 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
  if (!raw) throw new Error(`create_seed_slime returned null for ${color}`);
  return {
    id, name: id, color, pattern: 'Solid', level: 1, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, hue: color === 'Yellow' ? 120 : color === 'Blue' ? 300 : 0,
    saturation: 100, diffusionRatio: 20, amplitude: 40,
    accentHue: 0, vertexCount: SEED_SHAPE_DEFAULTS[color].vertexCount,
    irregularity: SEED_SHAPE_DEFAULTS[color].irregularity, createdAt: 1,
  };
}

function makeState(starters: Slime[], overrides: Partial<LabState> = {}): LabState {
  return {
    cycle: 1, credits: 100, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: starters, contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null,
    planetRegion: generatePlanetRegion(), wildsUnlocked: false, hasAutoFeeder: false,
    colorRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {},
    targetRegentInventory: {}, petitions: [], regionUnlocks: {},
    ...overrides,
  };
}

function breed(starters: Slime[], activeTargetRegent: string | null, state?: LabState) {
  const luaState = stateToLua(state ?? makeState(starters));
  return call(
    session, 'initiate_breeding', luaState, starters[0].id, starters[1].id, 0,
    colorTargets, activeTargetRegent, shapeTargets, null, colorSpecs,
    regionLocks, accentTargets, regentRewards,
  );
}

type Award = { inventory: string; key: string; amount: number; name: string; reason: string; node_id?: string };

function awardsOf(raw: Record<string, unknown>): Award[] {
  return ((raw['regent_awards'] ?? []) as Award[]);
}

describe('SlimeWorld Regent discovery awards', () => {
  it('data.yaml carries the ported DISCOVERY_REGENT_REWARDS curve', () => {
    expect(regentRewards).toBeTruthy();
    expect(regentRewards['tier_curve']).toEqual([0, 5, 15, 40, 100]);
    expect(regentRewards['color_tier_rank']).toMatchObject({ guild: 2, rival: 3, arc_triad: 4, skip_triad: 5 });
    expect(regentRewards['accent_tier']).toMatchObject({ accent_metallic: 5 });
  });

  it('first guided breed emits target, pattern and unlock awards', () => {
    const starters = [makeStarter('Red', 's0'), makeStarter('Red', 's1')];
    const [raw, error] = luaResult(breed(starters, 'guild_ember_marsh'));
    expect(error).toBeNull();
    expect(raw).not.toBeNull();

    expect(raw!['matched_target_id']).toBe('guild_ember_marsh');
    expect(raw!['matched_accent_target_ids']).toEqual(['accent_polka']);
    expect(raw!['region_unlocks']).toContain('node_frontier_a');

    const awards = awardsOf(raw!);
    expect(awards).toContainEqual(expect.objectContaining({
      inventory: 'target', key: 'guild_ember_marsh', amount: 5, reason: 'discovery',
    }));
    expect(awards).toContainEqual(expect.objectContaining({
      inventory: 'pattern', key: 'Polka', amount: 5, reason: 'discovery',
    }));
    expect(awards).toContainEqual(expect.objectContaining({
      inventory: 'color', key: 'Red', amount: 5, reason: 'region_unlock', node_id: 'node_frontier_a',
    }));
    // Tier-1 Triangle is recorded as a match but earns nothing.
    expect(awards.find(a => a.key === 'shape_triangle')).toBeUndefined();
  });

  it('repeat breed suppresses already-codexed matches', () => {
    const starters = [makeStarter('Red', 's0'), makeStarter('Red', 's1')];
    const state = makeState(starters, {
      colorTargetCodex: { guild_ember_marsh: true },
      shapeTargetCodex: { shape_triangle: true },
      accentTargetCodex: { accent_polka: true },
      regionUnlocks: { node_frontier_a: true },
    });
    const [raw, error] = luaResult(breed(starters, 'guild_ember_marsh', state));
    expect(error).toBeNull();
    expect(awardsOf(raw!)).toHaveLength(0);
  });

  it('stateToLua carries the codex maps Lua needs for first-match checks', () => {
    const state = makeState([], {
      colorTargetCodex: { guild_ember_marsh: true },
      shapeTargetCodex: { shape_star: true },
      accentTargetCodex: { accent_polka: true },
    });
    const lua = stateToLua(state);
    expect(lua['color_target_codex']).toEqual({ guild_ember_marsh: true });
    expect(lua['shape_target_codex']).toEqual({ shape_star: true });
    expect(lua['accent_target_codex']).toEqual({ accent_polka: true });
  });

  it('new child fields are registered in the explicit field alarm', () => {
    expect(SLIME_EXPLICIT_LUA_FIELDS.has('matched_accent_target_ids')).toBe(true);
    expect(SLIME_EXPLICIT_LUA_FIELDS.has('regent_awards')).toBe(true);
  });

  it('App.tsx wires regent_rewards, applies awards and logs them', () => {
    expect(appSource).toContain("data['regent_rewards']");
    expect(appSource).toContain("raw['regent_awards']");
    expect(appSource).toContain('matchedAccentTargetIds');
    expect(appSource).toContain('accentTargetCodex');
    expect(appSource).toContain('targetRegentInventory');
    expect(appSource).toContain('DISCOVERY:');
  });
});
