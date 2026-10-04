// new: ts/tests/test_slither_rogue_run_tip.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runTip } from '../src/games/slither_rogue/utils/runTip';

describe('slither_rogue runTip', () => {
  it('nudges a player who ate nothing', () => {
    expect(runTip({ score: 0, peakLength: 5, currentLength: 5, evolutionsCount: 0 })).toMatch(/fruit/i);
  });
  it('points a player with no evolution toward the cards', () => {
    expect(runTip({ score: 6, peakLength: 9, currentLength: 9, evolutionsCount: 0 })).toMatch(/evolution card/i);
  });
  it('mentions the Shield card when rivals took more than half the tail', () => {
    expect(runTip({ score: 20, peakLength: 30, currentLength: 12, evolutionsCount: 3 })).toMatch(/Shield/);
  });
  it('is encouraging otherwise, and never says died, dead or failed', () => {
    const tips = [
      runTip({ score: 20, peakLength: 30, currentLength: 28, evolutionsCount: 3 }),
      runTip({ score: 0, peakLength: 5, currentLength: 5, evolutionsCount: 0 }),
      runTip({ score: 20, peakLength: 30, currentLength: 12, evolutionsCount: 3 }),
    ];
    for (const t of tips) expect(t).not.toMatch(/\b(died|dead|death|failed|fail)\b/i);
    expect(tips[0]).toMatch(/^Nice run/);
  });
  it('is wired into the game-over card', () => {
    const modal = readFileSync(resolve(import.meta.dirname, '../src/games/slither_rogue/components/GameOverModal.tsx'), 'utf8');
    const app = readFileSync(resolve(import.meta.dirname, '../src/games/slither_rogue/App.tsx'), 'utf8');
    expect(modal).toContain("from '../utils/runTip'");
    expect(modal).toContain('runTip({');
    expect(app).toContain('currentLength={currentLength}');
  });
});
