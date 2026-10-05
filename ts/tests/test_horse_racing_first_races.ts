import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FREE_FIRST_RACES, raceCooldownFor } from '../src/games/horse_racing/utils/raceCooldown';

const appSource = readFileSync(resolve(import.meta.dirname, '../src/games/horse_racing/App.tsx'), 'utf8');

describe('horse_racing quick first races', () => {
  it('the first three races need no rest', () => {
    expect(FREE_FIRST_RACES).toBe(3);
    for (const alreadyRun of [0, 1, 2]) {
      expect(raceCooldownFor(alreadyRun, 90000)).toBe(0);
    }
  });

  it('from the fourth race on, the configured rest applies', () => {
    expect(raceCooldownFor(3, 90000)).toBe(90000);
    expect(raceCooldownFor(40, 90000)).toBe(90000);
  });

  it('App uses the helper for race rest and the tutorial explains it', () => {
    expect(appSource).toContain('raceCooldownFor(gameState.race_history.length, raceCooldownMs)');
    expect(appSource).toContain('Your first three races need no rest');
  });

  it('breeding rest is unchanged', () => {
    expect(appSource).toContain('Date.now() + breedCooldownMs');
  });
});
