import { describe, it, expect } from 'vitest';
import { loadGame } from '../src/engine/runtime';

describe('ScrapCrawl craft reproduction', () => {
  it('crafts beatStick tier 1 in TS runtime', () => {
    const session = loadGame('scrapcrawl', 42);
    const data = session.files.data;
    const player = session.executor.call('init_player') as Record<string, unknown>;
    player.scrap = 10;
    console.log('tierCost keys', Object.keys((data as any).catalog.beatStick.tierCost));
    const ok = session.executor.call('can_craft', data, player, 'beatStick', 1);
    console.log('can_craft', ok);
    const next = session.executor.call('craft', data, player, 'beatStick', 1);
    console.log('craft result', JSON.stringify(next));
    expect((next as any).scrap).toBe(0);
  });
});
