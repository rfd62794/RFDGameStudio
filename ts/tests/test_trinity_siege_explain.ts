// new: ts/tests/test_trinity_siege_explain.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UnitShape, type DuelLog } from '../../examples/trinity-siege/src/types';
import { explainDuel, counterTo } from '../../examples/trinity-siege/src/explain';

const duel = (over: Partial<DuelLog>): DuelLog => ({
  id: 'x', attackerShape: UnitShape.CIRCLE, attackerInitialStrength: 3,
  defenderShape: UnitShape.TRIANGLE, defenderInitialStrength: 3, defenderHasWall: false,
  attackerEffectiveStrength: 1.5, defenderEffectiveStrength: 4.5, outcome: 'defender_wins',
  attackerRemainingStrength: 0, defenderRemainingStrength: 1, ...over,
});

describe('trinity_siege explainDuel', () => {
  it('counterTo is the shape that beats it', () => {
    expect(counterTo(UnitShape.CIRCLE)).toBe(UnitShape.TRIANGLE);
    expect(counterTo(UnitShape.SQUARE)).toBe(UnitShape.CIRCLE);
    expect(counterTo(UnitShape.TRIANGLE)).toBe(UnitShape.SQUARE);
  });
  it('says why a counter won', () => {
    expect(explainDuel(duel({}))).toBe('Triangle counters Circle, so your defender won easily.');
  });
  it('mentions the wall when it helped', () => {
    expect(explainDuel(duel({ defenderHasWall: true }))).toContain('The wall doubled its strength.');
  });
  it('tells the player which shape to build after a loss to a counter', () => {
    const d = duel({ attackerShape: UnitShape.CIRCLE, defenderShape: UnitShape.SQUARE, outcome: 'attacker_wins' });
    expect(explainDuel(d)).toBe('Circle counters Square. Next time put a Triangle here.');
  });
  it('handles a draw and a same-shape result in plain words', () => {
    expect(explainDuel(duel({ outcome: 'both_die' }))).toBe('Evenly matched: both fell.');
    const same = duel({ attackerShape: UnitShape.SQUARE, defenderShape: UnitShape.SQUARE, outcome: 'attacker_wins' });
    expect(explainDuel(same)).toContain('Same shape');
  });
  it('is wired into WaveLog.tsx', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../../examples/trinity-siege/src/components/WaveLog.tsx'), 'utf8');
    expect(src).toContain('explainDuel(duel)');
    expect(src).toContain('from "../explain"');
  });
  it('App.tsx shows no MVP wording', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../../examples/trinity-siege/src/App.tsx'), 'utf8');
    expect(src).not.toMatch(/\bMVP\b/);
  });
});
