import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nextStepAfterBout } from '../src/games/gladiator_arena/utils/resultNextStep';

const viewSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/gladiator_arena/components/ArenaCombatView.tsx'),
  'utf8'
);

describe('gladiator_arena bout result next step', () => {
  it('sends scarred frames to the Medbay', () => {
    expect(nextStepAfterBout({ isVictory: true, anyDamaged: true, anyScarred: true })).toContain('Medbay');
  });

  it('sends damaged frames to the Medbay, then on to the next bout', () => {
    const text = nextStepAfterBout({ isVictory: false, anyDamaged: true, anyScarred: false });
    expect(text).toContain('Medbay');
    expect(text).toContain('next bout');
  });

  it('after a clean win points to the ladder', () => {
    expect(nextStepAfterBout({ isVictory: true, anyDamaged: false, anyScarred: false })).toContain('ladder');
  });

  it('after a clean loss suggests trying again or the Forge', () => {
    const text = nextStepAfterBout({ isVictory: false, anyDamaged: false, anyScarred: false });
    expect(text).toContain('try again');
    expect(text).toContain('Forge');
  });

  it('every message is one short sentence block with no developer jargon', () => {
    for (const isVictory of [true, false]) {
      for (const anyDamaged of [true, false]) {
        for (const anyScarred of [true, false]) {
          const text = nextStepAfterBout({ isVictory, anyDamaged, anyScarred });
          expect(text.startsWith('Next: ')).toBe(true);
          expect(text.length).toBeLessThan(140);
        }
      }
    }
  });

  it('the result modal shows the next step above the Return button', () => {
    const stepIdx = viewSource.indexOf('id="bout-next-step"');
    expect(stepIdx).toBeGreaterThan(-1);
    expect(stepIdx).toBeLessThan(viewSource.indexOf('id="return-to-hq-btn"'));
  });
});
