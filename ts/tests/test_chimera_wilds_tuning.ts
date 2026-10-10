// new: ts/tests/test_chimera_wilds_tuning.ts
import { describe, it, expect } from 'vitest';
import { loadGame } from '../src/engine/runtime';
import { withOverrides } from '../src/engine/tuning';
import { runRows, checkTargets } from '../src/engine/tuning/sweep';
import tuning from '../src/games/chimera_wilds/tuning';

const N = 300;

function winRate(): number {
  let wins = 0;
  for (let seed = 5000; seed < 5000 + N; seed += 1) {
    wins += tuning.simulate!({ seed, scenario: 'default' }).won;
  }
  return wins / N;
}

describe('chimera_wilds tuning', () => {
  it('knob defaults equal the live YAML baseline_player values', () => {
    const data = loadGame('chimera_wilds').files.data as Record<string, unknown>;
    const baseline = data['baseline_player'] as { power: number; endurance: number };
    const byKey = Object.fromEntries(tuning.knobs.map(k => [k.key, k.default]));
    expect(byKey['chimera_wilds.baseline_player.power']).toBe(baseline.power);
    expect(byKey['chimera_wilds.baseline_player.endurance']).toBe(baseline.endurance);
  });

  it('overriding the baseline lowers the seeded win rate', () => {
    const defaults = winRate();
    const lowered = withOverrides(
      {
        'chimera_wilds.baseline_player.power': 70,
        'chimera_wilds.baseline_player.endurance': 70,
      },
      winRate
    );
    console.log(`SIM default=${defaults.toFixed(3)} overridden70=${lowered.toFixed(3)}`);
    expect(defaults).toBeGreaterThanOrEqual(0.35);
    expect(defaults).toBeLessThanOrEqual(0.65);
    expect(lowered).toBeLessThan(defaults);
  }, 60000);

  it('targets hold at defaults', () => {
    const rows = runRows(tuning, null, [], N);
    for (const r of checkTargets(tuning, rows)) {
      expect(r.pass, `${r.target.id}: measured ${r.value}`).toBe(true);
    }
  }, 60000);
});
