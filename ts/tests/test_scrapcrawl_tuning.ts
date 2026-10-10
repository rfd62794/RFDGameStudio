// new: ts/tests/test_scrapcrawl_tuning.ts
import { describe, it, expect } from 'vitest';
import { tuned, withOverrides } from '../src/engine/tuning';
import { runRows, checkTargets } from '../src/engine/tuning/sweep';
import tuning from '../src/games/scrapcrawl/tuning';
import { simulateRun } from '../src/games/scrapcrawl/utils/simulateRun';
import { newRun, applyFight, PLAYER_MAX_HP, LOSS_DAMAGE } from '../src/games/scrapcrawl/utils/runEnd';

describe('scrapcrawl tuning', () => {
  it('knob defaults equal the exported consts', () => {
    const def = (key: string) => tuning.knobs.find(k => k.key === key)?.default;
    expect(def('scrapcrawl.player_max_hp')).toBe(PLAYER_MAX_HP);
    expect(def('scrapcrawl.loss_damage')).toBe(LOSS_DAMAGE);
  });

  it('with no overrides the tuned values are the shipped numbers', () => {
    expect(tuned('scrapcrawl.loss_damage')).toBe(2);
    expect(newRun().hp).toBe(10);
  });

  it('withOverrides changes what newRun and applyFight use', () => {
    const lost = withOverrides({ 'scrapcrawl.loss_damage': 4 }, () =>
      applyFight(newRun(), {}, 'x', false)
    );
    expect(lost.hp).toBe(PLAYER_MAX_HP - 4);
    const fresh = withOverrides({ 'scrapcrawl.player_max_hp': 14 }, () => newRun());
    expect(fresh.maxHp).toBe(14);
    expect(fresh.hp).toBe(14);
  });

  it('targets hold at defaults over 200 runs per scenario', () => {
    const rows = runRows(tuning, null, [], 200);
    for (const row of rows) {
      console.log('TUNE ' + row.scenario + ' ' + JSON.stringify(row.metrics));
    }
    for (const r of checkTargets(tuning, rows)) {
      expect(
        r.pass,
        `${r.target.id}: band ${r.target.min}..${r.target.max}, measured ${r.value}`
      ).toBe(true);
    }
  }, 60000);

  it('loss_damage 4 lowers the unarmed win rate over seeds 5000..5099', () => {
    const unarmedRate = () => {
      let wins = 0;
      for (let i = 0; i < 100; i++) {
        if (simulateRun(5000 + i, false).outcome === 'won') wins++;
      }
      return wins / 100;
    };
    const atDefault = unarmedRate();
    const atFour = withOverrides({ 'scrapcrawl.loss_damage': 4 }, unarmedRate);
    console.log('TUNE unarmed default=' + atDefault.toFixed(3) + ' loss_damage=4 -> ' + atFour.toFixed(3));
    expect(atFour).toBeLessThan(atDefault);
  }, 60000);
});
