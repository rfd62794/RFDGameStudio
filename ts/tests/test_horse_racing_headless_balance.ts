import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { isBetWin } from '../src/games/horse_racing/utils/bets';

const session = loadGame('horse_racing');
const data = session.files.data as Record<string, unknown>;
const stable = data['stable'] as Record<string, number>;
const raceCfg = data['race'] as Record<string, number>;

type Horse = Record<string, unknown>;
type Participant = { horse: Horse; odds: number };
type Outcome = { oddsSum: number; fieldSize: number; ranks: number[]; myRank: number; myOdds: number };

function starter(): Horse {
  const starters = data['starter_horses'] as Horse[];
  return { ...starters[0], player_owned: true };
}

function oneRace(horse: Horse): Outcome {
  const [race, err] = call(session, 'create_race', horse, data) as [Record<string, unknown> | null, string | null];
  if (!race || err) throw new Error(`create_race failed: ${err}`);
  const participants = Object.values(race['participants'] as Record<string, Participant>);
  const distance = race['distance'] as number;
  const results = Object.values(
    call(session, 'simulate_race', participants, { distance })[0] as Record<string, { rank: number; horse_id: string }>
  );
  return {
    oddsSum: participants.reduce((sum, p) => sum + 1 / p.odds, 0),
    fieldSize: participants.length,
    ranks: results.map(r => r.rank).sort((a, b) => a - b),
    myRank: results.find(r => r.horse_id === (horse['id'] as string))?.rank ?? 99,
    myOdds: participants[0].odds,
  };
}

describe('horse_racing headless balance (60 simulated races)', () => {
  const RACES = 60;
  const horse = starter();
  const outcomes: Outcome[] = Array.from({ length: RACES }, () => oneRace(horse));

  it('every race has a full field and ranks 1..N with no gaps or ties', () => {
    for (const o of outcomes) {
      expect(o.fieldSize).toBe(raceCfg['field_size']);
      expect(o.ranks).toEqual(Array.from({ length: o.fieldSize }, (_, i) => i + 1));
    }
  });

  it('the book keeps the house edge: implied probabilities sum near the configured overround', () => {
    const target = raceCfg['overround'];
    for (const o of outcomes) {
      expect(o.oddsSum).toBeGreaterThan(target - 0.07);
      expect(o.oddsSum).toBeLessThan(target + 0.07);
    }
  });

  it('a flat 20-unit Win bet never produces negative or non-finite funds', () => {
    let funds = stable['starting_funds'];
    for (const o of outcomes) {
      const bet = Math.min(20, funds);
      funds -= bet;
      if (isBetWin('Win', o.myRank)) funds += bet * o.myOdds;
      expect(Number.isFinite(funds)).toBe(true);
      expect(funds).toBeGreaterThanOrEqual(0);
    }
  });

  it('going all-in every race reaches bankruptcy (funds under 50) within the run', () => {
    let funds = stable['starting_funds'];
    let wentBankrupt = false;
    for (const o of outcomes) {
      if (funds < 50) { wentBankrupt = true; break; }
      const bet = funds;
      funds -= bet;
      if (isBetWin('Win', o.myRank)) funds += bet * o.myOdds;
    }
    expect(wentBankrupt || funds < 50).toBe(true);
  });
});
