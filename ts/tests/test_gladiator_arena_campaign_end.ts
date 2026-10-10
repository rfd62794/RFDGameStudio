import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARENA_TIERS } from '../src/games/gladiator_arena/simulation/championLadder';
import {
  CAMPAIGN_COMPLETE_BODY,
  CAMPAIGN_COMPLETE_TITLE,
  isFinalChampion,
} from '../src/games/gladiator_arena/utils/campaignEnd';

const viewSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/gladiator_arena/components/ArenaCombatView.tsx'),
  'utf8'
);

describe('gladiator_arena end of the ladder', () => {
  it('the ladder has five tiers and the last champion is the final one', () => {
    expect(ARENA_TIERS).toHaveLength(5);
    expect(isFinalChampion('tier5-champion')).toBe(true);
    expect(isFinalChampion(ARENA_TIERS[4].champion.id)).toBe(true);
  });

  it('no other champion or opponent counts as the final one', () => {
    for (const tier of ARENA_TIERS.slice(0, 4)) {
      expect(isFinalChampion(tier.champion.id)).toBe(false);
    }
    for (const opponent of ARENA_TIERS[4].opponents) {
      expect(isFinalChampion(opponent.id)).toBe(false);
    }
  });

  it('the end card copy is warm, short and says the ladder stays open', () => {
    expect(CAMPAIGN_COMPLETE_TITLE).toContain('Grand Champion');
    expect(CAMPAIGN_COMPLETE_BODY).toContain('ladder stays open');
    expect(CAMPAIGN_COMPLETE_BODY.length).toBeLessThan(200);
  });

  it('the result modal shows the end card only for a victory over the final champion', () => {
    expect(viewSource).toContain('isVictory && isFinalChampion(activeBout.opponent.id)');
    expect(viewSource).toContain('id="campaign-complete-card"');
  });
});
