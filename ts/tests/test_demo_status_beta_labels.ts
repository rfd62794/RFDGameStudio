import { describe, it, expect } from 'vitest';
import slimeworld from '../src/games/slimeworld/config';
import horseRacing from '../src/games/horse_racing/config';
import { GAME_REGISTRY } from '../src/games/registry';

describe('public status labels (Tier B evidence not yet recorded)', () => {
  it('slimeworld is labelled beta', () => {
    expect(slimeworld.status).toBe('beta');
  });

  it('horse_racing is labelled beta', () => {
    expect(horseRacing.status).toBe('beta');
  });

  it('shoal is the only game labelled stable', () => {
    const stable = GAME_REGISTRY.filter(g => g.status === 'stable').map(g => g.gameId);
    expect(stable).toEqual(['shoal']);
  });
});
