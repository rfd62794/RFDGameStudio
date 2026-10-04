// new: ts/tests/test_trinity_siege_combat.ts
//
// Unit tests for the embed's combat table (examples/trinity-siege/src/combat.ts), imported
// directly like test_systemic_extract_restart.ts does. No rendering.
import { describe, it, expect } from 'vitest';
import {
  UnitShape, Race, SHAPE_MATRIX, RACE_LEAN, MAX_WAVES, LIVES_STARTING,
  type Unit, type OrcUnit,
} from '../../examples/trinity-siege/src/types';
import { selectBestDefender, resolvePaired } from '../../examples/trinity-siege/src/combat';

const SHAPES = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE];
const COUNTER: Record<UnitShape, UnitShape> = {
  [UnitShape.CIRCLE]: UnitShape.TRIANGLE,   // Triangle beats Circle
  [UnitShape.SQUARE]: UnitShape.CIRCLE,     // Circle beats Square
  [UnitShape.TRIANGLE]: UnitShape.SQUARE,   // Square beats Triangle
};

const defender = (id: string, shape: UnitShape, strength = 3): Unit => ({
  id, shape, race: Race.PLAYER, baseStrength: strength, currentStrength: strength, lane: 0, segment: 1,
});
const attacker = (id: string, shape: UnitShape, strength = 3): OrcUnit => ({ id, shape, baseStrength: strength });

describe('trinity_siege shape matrix', () => {
  it('is a rock-paper-scissors cycle: each shape beats one, loses to one, ties itself', () => {
    for (const s of SHAPES) {
      expect(SHAPE_MATRIX[s][s]).toBe(1.0);
      const wins = SHAPES.filter(o => SHAPE_MATRIX[s][o] > 1.0);
      const losses = SHAPES.filter(o => SHAPE_MATRIX[s][o] < 1.0);
      expect(wins).toHaveLength(1);
      expect(losses).toHaveLength(1);
    }
  });
  it('is symmetric: if A hits B for 1.5, B hits A for 0.5', () => {
    for (const a of SHAPES) for (const b of SHAPES) {
      expect(SHAPE_MATRIX[a][b] + SHAPE_MATRIX[b][a]).toBe(2.0);
    }
  });
  it('race lean stays in a sane band and neither side gets a free edge', () => {
    for (const v of Object.values(RACE_LEAN)) {
      expect(v).toBeGreaterThanOrEqual(0.5);
      expect(v).toBeLessThanOrEqual(1.5);
    }
    expect(RACE_LEAN.PLAYER).toBe(RACE_LEAN.ORC);
  });
});

describe('trinity_siege selectBestDefender', () => {
  it('picks the counter-shape defender', () => {
    for (const a of SHAPES) {
      const pool = SHAPES.map((s, i) => defender('d' + i, s));
      const idx = selectBestDefender(a, pool);
      expect(pool[idx].shape).toBe(COUNTER[a]);
    }
  });
  it('returns 0 for a single defender', () => {
    expect(selectBestDefender(UnitShape.CIRCLE, [defender('d', UnitShape.CIRCLE)])).toBe(0);
  });
});

describe('trinity_siege resolvePaired', () => {
  it('an undefended lane is breached', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.CIRCLE)], [], false);
    expect(r.breached).toBe(true);
    expect(r.victory).toBe(false);
  });
  it('equal strength, same shape: both fall, defenders hold (victory)', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.SQUARE)], [defender('d', UnitShape.SQUARE)], false);
    expect(r.duels[0].outcome).toBe('both_die');
    expect(r.victory).toBe(true);
  });
  it('the counter shape wins and survives with strength left', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.CIRCLE)], [defender('d', UnitShape.TRIANGLE)], false);
    expect(r.duels[0].outcome).toBe('defender_wins');
    expect(r.victory).toBe(true);
    expect(r.survivingDefenders![0].currentStrength).toBeGreaterThan(0);
  });
  it('the wrong shape loses and the lane is breached', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.CIRCLE)], [defender('d', UnitShape.SQUARE)], false);
    expect(r.duels[0].outcome).toBe('attacker_wins');
    expect(r.breached).toBe(true);
  });
  it('a wall doubles the defender: a same-shape defender beats an equal attacker', () => {
    const open = resolvePaired(0, [attacker('a', UnitShape.SQUARE)], [defender('d', UnitShape.SQUARE)], false);
    const walled = resolvePaired(0, [attacker('a', UnitShape.SQUARE)], [defender('d', UnitShape.SQUARE)], true);
    expect(open.duels[0].defenderEffectiveStrength).toBe(3);
    expect(walled.duels[0].defenderEffectiveStrength).toBe(6);
    expect(walled.duels[0].outcome).toBe('defender_wins');
  });
});

describe('trinity_siege a wave-5 sized attack is winnable', () => {
  it('five mixed attackers (3 + floor(4/2) = 5, the wave-5 size) fall to five counter-shaped defenders', () => {
    const shapes = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE, UnitShape.CIRCLE, UnitShape.SQUARE];
    const attackers = shapes.map((s, i) => attacker('a' + i, s));
    const defenders = shapes.map((s, i) => defender('d' + i, COUNTER[s]));
    const r = resolvePaired(0, attackers, defenders, false);
    expect(r.victory).toBe(true);
    expect(r.breached).toBe(false);
  });
  it('the run length constants are the ones the README promises (5 waves, 15 lives)', () => {
    expect(MAX_WAVES).toBe(5);
    expect(LIVES_STARTING).toBe(15);
  });
});
