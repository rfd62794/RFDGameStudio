import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua,
  luaSlimeToTs,
  type LabState,
  type Slime,
  type SlimeColor,
  type SlimePattern,
} from '../src/games/slimeworld/types';
import { initialState } from '../src/games/slimeworld/App';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

const slimedexSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/SlimeDexTab.tsx'),
  'utf8'
);

function buildColorSpecs(data: Record<string, unknown>): Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> {
  const specs: Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> = {};
  const cultures = data['cultures'] as Record<string, Record<string, unknown>>;
  if (cultures) {
    for (const key of Object.keys(cultures)) {
      const c = cultures[key];
      const color = c['color'] as string;
      specs[color] = { base_stats: c['base_stats'] as Record<string, number>, growth: c['growth'] as Record<string, number> };
    }
  }
  const neutralTraits = data['neutral_traits'] as Record<string, Record<string, unknown>>;
  if (neutralTraits) {
    const gray = neutralTraits['gray'];
    if (gray) specs['Gray'] = { base_stats: gray['base_stats'] as Record<string, number>, growth: gray['growth'] as Record<string, number> };
  }
  return specs;
}

const colorSpecs = buildColorSpecs(session.files.data as Record<string, unknown>);
const colorTargets = (session.files.data as Record<string, unknown>)['color_targets'];
const shapeTargets = (session.files.data as Record<string, unknown>)['shape_targets'];

function makeSlime(id: string, color: SlimeColor): Slime {
  return {
    id, name: `Slime-${id}`, color, pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100,
    hue: color === 'Red' ? 0 : color === 'Blue' ? 300 : 0,
    saturation: 100, diffusionRatio: 20, amplitude: 40,
    accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
}

function makeState(slimes: Slime[], overrides: Partial<LabState> = {}): LabState {
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes, contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false,
    cultureRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    ...overrides,
  };
}

function breed(parentAId: string, parentBId: string, state: LabState): Slime {
  const value = call(session, 'initiate_breeding', stateToLua(state), parentAId, parentBId, 0, colorTargets, null, shapeTargets, null, colorSpecs);
  const [raw, error] = value as [Record<string, unknown> | null, string | null];
  if (!raw || error) throw new Error(error ?? 'Breeding failed');
  return luaSlimeToTs(raw);
}

function simulateStateUpdate(previous: LabState, child: Slime): LabState {
  const filteredSlimes = child.consumedSlimeId
    ? previous.slimes.filter(s => s.id !== child.consumedSlimeId)
    : previous.slimes;
  const newColorCodex = { ...(previous.colorCodex ?? {}), [child.color]: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>;
  const newPatternCodex = { ...(previous.patternCodex ?? {}), [child.pattern]: { discovered: true } } as Record<SlimePattern, { discovered: boolean }>;
  return {
    ...previous,
    credits: Math.max(0, previous.credits - 10),
    slimes: [...filteredSlimes, child],
    colorCodex: newColorCodex,
    patternCodex: newPatternCodex,
  };
}

describe('Splicing Roster Bloat + SlimeDex Discovery', () => {

  // ── Bug 1: Consumed parent must be removed from roster ───────────────────

  it('test_breeding_removes_consumed_parent_from_roster', () => {
    const s1 = makeSlime('s1', 'Red');
    const s2 = makeSlime('s2', 'Blue');
    const state = makeState([s1, s2]);
    const child = breed('s1', 's2', state);

    expect(child.consumedSlimeId).toBe('s2');

    const next = simulateStateUpdate(state, child);
    const ids = next.slimes.map(s => s.id);

    expect(ids).toContain(child.id);
    expect(ids).not.toContain('s2');
    expect(next.slimes.length).toBe(2);
  });

  it('test_breeding_without_consumption_keeps_both_parents', () => {
    const s1 = makeSlime('s1', 'Red');
    const s2 = makeSlime('s2', 'Blue');
    const state = makeState([s1, s2]);

    const fakeChild: Slime = {
      ...makeSlime('child_1', 'Purple'),
      consumedSlimeId: null,
    };

    const next = simulateStateUpdate(state, fakeChild);
    const ids = next.slimes.map(s => s.id);

    expect(ids).toContain('s1');
    expect(ids).toContain('s2');
    expect(ids).toContain('child_1');
    expect(next.slimes.length).toBe(3);
  });

  it('test_roster_cap_enforced_correctly_after_fix', () => {
    let state = makeState([
      makeSlime('s1', 'Red'),
      makeSlime('s2', 'Blue'),
    ], { rosterCap: 5 });

    for (let i = 0; i < 4; i++) {
      const ids = state.slimes.map(s => s.id);
      const parentA = ids[0];
      const parentB = ids[ids.length - 1];
      const child = breed(parentA, parentB, state);
      state = simulateStateUpdate(state, child);
    }

    expect(state.slimes.length).toBeLessThanOrEqual(state.rosterCap);
    expect(state.slimes.length).toBe(2);
  });

  // ── Bug 2: colorCodex / patternCodex initialization and update ───────────

  it('test_initial_color_codex_reflects_starter_slimes', () => {
    const init = initialState(session);
    expect(init.colorCodex).toBeDefined();
    expect(init.patternCodex).toBeDefined();

    for (const slime of init.slimes) {
      expect(init.colorCodex?.[slime.color]?.discovered).toBe(true);
      expect(init.patternCodex?.[slime.pattern]?.discovered).toBe(true);
    }
  });

  it('test_breeding_new_color_updates_color_codex', () => {
    const s1 = makeSlime('s1', 'Red');
    const s2 = makeSlime('s2', 'Blue');
    const state = makeState([s1, s2], {
      colorCodex: { Red: { discovered: true }, Blue: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>,
      patternCodex: { Solid: { discovered: true } } as Record<SlimePattern, { discovered: boolean }>,
    });

    const child = breed('s1', 's2', state);
    const next = simulateStateUpdate(state, child);

    expect(next.colorCodex?.[child.color]?.discovered).toBe(true);
  });

  it('test_breeding_repeat_color_does_not_duplicate_or_error', () => {
    const s1 = makeSlime('s1', 'Red');
    const s2 = makeSlime('s2', 'Blue');
    const state = makeState([s1, s2], {
      colorCodex: { Red: { discovered: true }, Blue: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>,
      patternCodex: { Solid: { discovered: true } } as Record<SlimePattern, { discovered: boolean }>,
    });

    const child = breed('s1', 's2', state);
    const next1 = simulateStateUpdate(state, child);
    const next2 = simulateStateUpdate(next1, { ...child, id: 'child_2', consumedSlimeId: null });

    expect(next2.colorCodex?.[child.color]?.discovered).toBe(true);
    expect(Object.keys(next2.colorCodex ?? {}).filter(k => next2.colorCodex?.[k as SlimeColor]?.discovered).length).toBe(
      Object.keys(next1.colorCodex ?? {}).filter(k => next1.colorCodex?.[k as SlimeColor]?.discovered).length
    );
  });

  // ── UI field wiring confirmation ─────────────────────────────────────────

  it('test_slimedex_ui_reads_the_correct_real_field', () => {
    expect(slimedexSource).toContain('state.colorCodex');
    expect(slimedexSource).toContain('state.patternCodex');
    expect(slimedexSource).toContain('?.discovered');

    expect(appSource).toContain('colorCodex');
    expect(appSource).toContain('patternCodex');
    expect(appSource).toContain('consumedSlimeId');
    expect(appSource).toContain('filteredSlimes');
  });
});
