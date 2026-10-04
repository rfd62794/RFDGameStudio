// new: ts/tests/test_tuning_store.ts
import { describe, it, expect, afterEach } from 'vitest';
import {
  devTuningEnabled,
  tuningStorageKey,
  readDevOverrides,
  getOverrides,
  withOverrides,
  defineKnob,
  tuned,
} from '../src/engine/tuning';
import { applyDataOverrides } from '../src/engine/tuning';
import { loadGame } from '../src/engine/runtime';

afterEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('tuning store', () => {
  it('devTuningEnabled is true only for ?dev=1', () => {
    expect(devTuningEnabled('?dev=1')).toBe(true);
    expect(devTuningEnabled('')).toBe(false);
    expect(devTuningEnabled('?dev=0')).toBe(false);
    expect(devTuningEnabled('?dev=true')).toBe(false);
    expect(devTuningEnabled('?game=x')).toBe(false);
  });

  it('ignores stored overrides without ?dev=1 (production gate)', () => {
    localStorage.setItem(
      tuningStorageKey('chimera_wilds'),
      JSON.stringify({ 'chimera_wilds.baseline_player.power': 50 })
    );
    window.history.pushState({}, '', '/');
    const session = loadGame('chimera_wilds');
    const baseline = session.files.data['baseline_player'] as { power: number; endurance: number };
    expect(baseline.power).toBe(90);
    expect(getOverrides('chimera_wilds')).toEqual({});
  });

  it('applies stored overrides with ?dev=1', () => {
    localStorage.setItem(
      tuningStorageKey('chimera_wilds'),
      JSON.stringify({ 'chimera_wilds.baseline_player.power': 50 })
    );
    window.history.pushState({}, '', '/?dev=1');
    const session = loadGame('chimera_wilds');
    const baseline = session.files.data['baseline_player'] as { power: number; endurance: number };
    expect(baseline.power).toBe(50);
    expect(baseline.endurance).toBe(85);
  });

  it('withOverrides applies in-process and restores afterwards', () => {
    window.history.pushState({}, '', '/');
    const scoped = withOverrides(
      { 'chimera_wilds.baseline_player.power': 80 },
      () => loadGame('chimera_wilds')
    );
    expect((scoped.files.data['baseline_player'] as { power: number }).power).toBe(80);
    const after = loadGame('chimera_wilds');
    expect((after.files.data['baseline_player'] as { power: number }).power).toBe(90);
    expect(() =>
      withOverrides({ 'chimera_wilds.baseline_player.power': 80 }, () => {
        throw new Error('boom');
      })
    ).toThrow('boom');
    const afterThrow = loadGame('chimera_wilds');
    expect((afterThrow.files.data['baseline_player'] as { power: number }).power).toBe(90);
  });

  it('readDevOverrides skips bad JSON, non-finite values, and other games', () => {
    const search = '?dev=1';
    localStorage.setItem(tuningStorageKey('chimera_wilds'), '{not json');
    expect(readDevOverrides('chimera_wilds', search)).toEqual({});
    localStorage.setItem(
      tuningStorageKey('chimera_wilds'),
      JSON.stringify({
        'chimera_wilds.good': 7,
        'chimera_wilds.notNumber': 'x',
        'chimera_wilds.notFinite': null,
        'other_game.good': 3,
      })
    );
    expect(readDevOverrides('chimera_wilds', search)).toEqual({ 'chimera_wilds.good': 7 });
  });

  it('applyDataOverrides walks dotted paths and skips non-numeric or missing leaves', () => {
    const data: Record<string, unknown> = { waves: { 1: { enemies: [{ hp: 4 }] } }, name: 'x' };
    const applied = applyDataOverrides(data, 'g', {
      'g.waves.1.enemies.0.hp': 9,
      'g.name': 5,
      'g.nope.deep': 5,
    });
    const waves = data['waves'] as Record<string, unknown>;
    const wave = waves['1'] as Record<string, unknown>;
    const enemies = wave['enemies'] as { hp: number }[];
    expect(enemies[0].hp).toBe(9);
    expect(data['name']).toBe('x');
    expect(applied).toEqual(['g.waves.1.enemies.0.hp']);
  });

  it('defineKnob returns the default, clamps overrides, and tuned throws on unknown keys', () => {
    const knob = defineKnob({
      key: 't.x',
      label: 'Test knob',
      group: 'Test',
      min: 1,
      max: 5,
      step: 1,
      default: 2,
      affects: 'test',
      source: { kind: 'const', file: 'f', name: 'X' },
    });
    expect(knob.get()).toBe(2);
    expect(withOverrides({ 't.x': 9 }, () => knob.get())).toBe(5);
    expect(() => tuned('t.unknown')).toThrow('unknown knob: t.unknown');
  });
});
