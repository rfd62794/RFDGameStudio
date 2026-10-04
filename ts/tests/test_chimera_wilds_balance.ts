import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { mulberry32 } from '../src/engine/shared/seededRandom';

const SLOTS = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
type Part = { id: string; slot: string };

function pickParts(parts: Part[], rng: () => number): Part[] {
  return SLOTS.map(slot => {
    const options = parts.filter(p => p.slot === slot);
    return options[Math.floor(rng() * options.length)];
  });
}

describe('chimera_wilds balance (a fresh player can win)', () => {
  const session = loadGame('chimera_wilds');
  const data = session.files.data as Record<string, unknown>;
  const baseline = data['baseline_player'] as { power: number; endurance: number };
  const parts = data['parts'] as Part[];

  it('baseline player stats are the tuned values', () => {
    expect(baseline.power + baseline.endurance).toBe(175);
  });

  it('1,000 seeded encounters win between 35% and 65% of the time', () => {
    const rng = mulberry32(2026);
    let wins = 0;
    for (let i = 0; i < 1000; i += 1) {
      const [chimera] = call(session, 'generate_chimera', pickParts(parts, rng)) as [unknown];
      const roll = Math.floor(rng() * 20) + 1;
      const [result] = call(session, 'resolve_encounter', baseline.power, baseline.endurance, chimera, roll) as [{ won: boolean }];
      if (result.won) wins += 1;
    }
    const rate = wins / 1000;
    expect(rate).toBeGreaterThanOrEqual(0.35);
    expect(rate).toBeLessThanOrEqual(0.65);
  });
});
