// new: ts/tests/test_tuning_apply_mode.ts
import { describe, expect, it } from 'vitest';
import type { KnobDef } from '../src/engine/tuning';
import { changedKeys, knobApplyMode, requiredApplyMode } from '../src/engine/tuning/applyMode';

function knob(partial: Partial<KnobDef>): KnobDef {
  return {
    key: 'game.knob',
    label: 'Knob',
    group: 'G',
    min: 0,
    max: 10,
    step: 1,
    default: 5,
    affects: 'feel',
    source: { kind: 'const', file: 'f.ts', name: 'K' },
    ...partial,
  };
}

describe('knobApplyMode', () => {
  it('a knob without applies is reload', () => {
    expect(knobApplyMode(knob({}))).toBe('reload');
  });

  it('returns the declared mode', () => {
    expect(knobApplyMode(knob({ applies: 'live' }))).toBe('live');
    expect(knobApplyMode(knob({ applies: 'next-run' }))).toBe('next-run');
    expect(knobApplyMode(knob({ applies: 'reload' }))).toBe('reload');
  });
});

describe('changedKeys', () => {
  it('detects changed, added and removed keys', () => {
    const before = { a: 1, b: 2, c: 3 };
    const after = { b: 9, c: 3, d: 4 };
    expect([...changedKeys(before, after)].sort()).toEqual(['a', 'b', 'd']);
  });

  it('equal maps give []', () => {
    expect(changedKeys({ a: 1, b: 2 }, { a: 1, b: 2 })).toEqual([]);
    expect(changedKeys({}, {})).toEqual([]);
  });
});

describe('requiredApplyMode', () => {
  const knobs = [
    knob({ key: 'game.live', applies: 'live' }),
    knob({ key: 'game.next', applies: 'next-run' }),
    knob({ key: 'game.slow' }),
  ];

  it('empty change is null', () => {
    expect(requiredApplyMode([], knobs)).toBeNull();
  });

  it('strongest mode wins', () => {
    expect(requiredApplyMode(['game.live', 'game.next'], knobs)).toBe('next-run');
    expect(requiredApplyMode(['game.live', 'game.slow'], knobs)).toBe('reload');
    expect(requiredApplyMode(['game.live'], knobs)).toBe('live');
  });

  it('a key with no KnobDef counts as reload', () => {
    expect(requiredApplyMode(['game.live', 'game.unknown'], knobs)).toBe('reload');
  });
});
