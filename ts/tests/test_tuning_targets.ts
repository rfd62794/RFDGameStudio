// new: ts/tests/test_tuning_targets.ts
import { describe, it, expect } from 'vitest';
import { TUNING_REGISTRY } from '../src/games/tuning-registry';
import { runRows, checkTargets } from '../src/engine/tuning/sweep';

describe('tuning registry', () => {
  it('registry is an object', () => {
    expect(typeof TUNING_REGISTRY).toBe('object');
  });

  for (const tuning of Object.values(TUNING_REGISTRY)) {
    if (tuning.simulate) {
      it(
        `${tuning.gameId} targets hold at defaults`,
        () => {
          const rows = runRows(tuning, null, [], 200);
          for (const r of checkTargets(tuning, rows)) {
            expect(
              r.pass,
              `${r.target.id}: band ${r.target.min}..${r.target.max}, measured ${r.value}`
            ).toBe(true);
          }
        },
        60000
      );
    }

    it(`${tuning.gameId} knob keys are unique and namespaced`, () => {
      const keys = tuning.knobs.map(k => k.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const key of keys) expect(key.startsWith(`${tuning.gameId}.`)).toBe(true);
    });

    for (const knob of tuning.knobs) {
      it(`${tuning.gameId} knob ${knob.key} is well-formed`, () => {
        expect(knob.min).toBeLessThanOrEqual(knob.default);
        expect(knob.default).toBeLessThanOrEqual(knob.max);
        expect(knob.step).toBeGreaterThan(0);
        expect(knob.affects.length).toBeGreaterThan(0);
      });
    }
  }
});
