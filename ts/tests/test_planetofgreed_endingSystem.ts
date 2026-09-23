import { describe, it, expect } from 'vitest';
import { checkEnding, TOTAL_FRAGMENTS } from '../src/games/planetofgreed/endingSystem';
import { Corporation, CultureId } from '../src/games/planetofgreed/types';

const PLAYER_ID = 'player-vanguard';

function makeCorp(id: string, cultureId: CultureId, rank: number, fragments: string[], isPlayer = false): Corporation {
  return {
    id,
    name: id,
    color: '#000000',
    borderColor: '#000000',
    bgClass: '',
    textClass: '',
    isPlayer,
    cultureId,
    treasury: 0,
    scoutedCells: {},
    rank,
    fragments,
  };
}

describe('endingSystem', () => {
  it('test_ending_triggers_at_rank_1: player reaching Rank 1 at any Annual Report fires the event', () => {
    const player = makeCorp(PLAYER_ID, 'ember', 1, ['ember'], true);
    const ai1 = makeCorp('ai-marsh', 'marsh', 2, ['marsh']);
    const ai2 = makeCorp('ai-gale', 'gale', 3, ['gale']);
    const corps = [player, ai1, ai2];

    const event = checkEnding(corps, PLAYER_ID);
    expect(event).not.toBeNull();
    expect(event!.type).toBe('ENDING_TRIGGERED');
  });

  it('test_ending_not_triggered_by_ai_rank_1: an AI House reaching Rank 1 does not fire the player ending event', () => {
    // An AI House is Rank 1; the player is Rank 2. No ending fires.
    const player = makeCorp(PLAYER_ID, 'ember', 2, ['ember'], true);
    const ai1 = makeCorp('ai-marsh', 'marsh', 1, ['marsh']); // AI at rank 1
    const ai2 = makeCorp('ai-gale', 'gale', 3, ['gale']);
    const corps = [ai1, player, ai2];

    const event = checkEnding(corps, PLAYER_ID);
    expect(event).toBeNull();
  });

  it('test_ending_reports_correct_fragment_count: event payload fragmentCount matches the player House actual fragments array length at trigger time', () => {
    // Player at Rank 1 with 4 fragments (own + 3 inherited). Payload must
    // report fragmentCount=4, total=6.
    const player = makeCorp(PLAYER_ID, 'ember', 1, ['ember', 'marsh', 'gale', 'tundra'], true);
    const ai1 = makeCorp('ai-marsh', 'marsh', 2, []);
    const ai2 = makeCorp('ai-gale', 'gale', 3, []);
    const corps = [player, ai1, ai2];

    const event = checkEnding(corps, PLAYER_ID);
    expect(event).not.toBeNull();
    expect(event!.fragmentCount).toBe(player.fragments.length);
    expect(event!.fragmentCount).toBe(4);
    expect(event!.total).toBe(TOTAL_FRAGMENTS);
    expect(event!.total).toBe(6);

    // Also confirm the full-fragment case (6/6) reports correctly.
    const fullPlayer = makeCorp(PLAYER_ID, 'ember', 1,
      ['ember', 'marsh', 'gale', 'tundra', 'crystal', 'tide'], true);
    const fullEvent = checkEnding([fullPlayer], PLAYER_ID);
    expect(fullEvent!.fragmentCount).toBe(6);
    expect(fullEvent!.total).toBe(6);
  });
});
