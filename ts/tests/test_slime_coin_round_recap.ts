// @vitest-environment node
// new: ts/tests/test_slime_coin_round_recap.ts
/**
 * Slime Coin end-of-round recap. The Lua now records which synergies fired during
 * the round and end_round returns them plus shortfall/surplus; buildRoundRecap turns
 * that into a headline and a labeled list and RoundRecap renders it. Lua tables with
 * string keys arrive as plain objects through call(); an empty Lua table arrives as
 * an empty JS array.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadGame, call } from '../src/engine/runtime';
import { LuaExecutor } from '../src/engine/executor';
import type { GameSession } from '../src/engine/types';
import { buildRoundRecap, SYNERGY_LABELS } from '../src/games/slime_coin/utils/roundRecap';
import RoundRecap from '../src/games/slime_coin/components/RoundRecap';

type Row = Record<string, unknown>;

function lua(session: GameSession, fn: string, ...args: unknown[]): Row {
  return (call(session, fn, ...args) as Row[])[0];
}

function sessionWithRecapHelper(): GameSession {
  const base = loadGame('slime_coin', 42);
  const helper = `
function test_set_round_stats(score, fired_id, fired_count)
  GAME_STATE.score = score
  if fired_id ~= nil then
    GAME_STATE.synergy_fired[fired_id] = fired_count
  end
end`;
  const executor = new LuaExecutor(
    base.files.logic + '\n' + helper,
    42,
    base.files.engineSource,
  );
  const session: GameSession = { ...base, executor };
  call(session, 'init_game', {});
  return session;
}

describe('buildRoundRecap', () => {
  it('a cleared round reports the spare amount in the headline', () => {
    const recap = buildRoundRecap({ round: 3, score: 130, target: 100, target_met: true });
    expect(recap.round).toBe(3);
    expect(recap.score).toBe(130);
    expect(recap.target).toBe(100);
    expect(recap.targetMet).toBe(true);
    expect(recap.margin).toBe(30);
    expect(recap.headline).toContain('30');
  });

  it('a missed round reports how short it fell', () => {
    const recap = buildRoundRecap({ round: 6, score: 60, target: 100, target_met: false });
    expect(recap.targetMet).toBe(false);
    expect(recap.margin).toBe(-40);
    expect(recap.headline).toContain('40');
    expect(recap.headline.toLowerCase()).toContain('short');
  });

  it('an exact tie counts as met, has margin 0, and says "exactly"', () => {
    const recap = buildRoundRecap({ round: 2, score: 150, target: 150, target_met: true });
    expect(recap.targetMet).toBe(true);
    expect(recap.margin).toBe(0);
    expect(recap.headline.toLowerCase()).toContain('exactly');
  });

  it('an empty synergy table (empty Lua table, empty object, or missing) yields no fired rows', () => {
    for (const synergy_fired of [[], {}, undefined] as const) {
      const recap = buildRoundRecap({ round: 1, score: 0, target: 100, target_met: false, synergy_fired });
      expect(recap.fired).toEqual([]);
    }
  });

  it('labels known ids with player words, keeps unknown ids raw, and sorts by count then label', () => {
    const recap = buildRoundRecap({
      round: 4,
      score: 200,
      target: 100,
      target_met: true,
      synergy_fired: { crystal_burst: 1, zombie_slime: 3, weird_new_thing: 3, clear_area: 1 },
    });
    expect(recap.fired).toEqual([
      { label: 'Zombie Slime chip', count: 3 },
      { label: 'weird_new_thing', count: 3 },
      { label: 'Crystal Burst chip', count: 1 },
      { label: 'Void clears an area', count: 1 },
    ]);
    for (const [id, label] of Object.entries(SYNERGY_LABELS)) {
      expect(typeof id).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('end_round recap fields in the real Lua', () => {
  it('after init_game, end_round returns an empty synergy table, shortfall = target, surplus = 0', () => {
    const session = loadGame('slime_coin', 42);
    lua(session, 'init_game', {});
    const ended = lua(session, 'end_round');
    expect(ended.round).toBe(1);
    expect(ended.score).toBe(0);
    expect(ended.target).toBe(100);
    expect(ended.target_met).toBe(false);
    expect((ended.offered_cards as unknown[]).length).toBe(3);
    expect(ended.synergy_fired).toEqual([]);
    expect(ended.shortfall).toBe(100);
    expect(ended.surplus).toBe(0);
  });

  it('a bumped score and synergy_fired table are echoed by end_round, and start_round clears them', () => {
    const session = sessionWithRecapHelper();
    lua(session, 'test_set_round_stats', 250, 'zombie_slime', 4);
    const ended = lua(session, 'end_round');
    expect(ended.score).toBe(250);
    expect(ended.synergy_fired).toEqual({ zombie_slime: 4 });
    expect(ended.target_met).toBe(true);
    expect(ended.shortfall).toBe(0);
    expect(ended.surplus).toBe(150);

    lua(session, 'start_round', 2);
    const ended2 = lua(session, 'end_round');
    expect(ended2.round).toBe(2);
    expect(ended2.target).toBe(150);
    expect(ended2.synergy_fired).toEqual([]);
    expect(ended2.shortfall).toBe(0);
    expect(ended2.surplus).toBe(100);
  });
});

describe('RoundRecap component', () => {
  it('renders the headline, the score line, and each fired synergy', () => {
    const recap = buildRoundRecap({
      round: 5,
      score: 180,
      target: 150,
      target_met: true,
      synergy_fired: { zombie_slime: 2, convert_basic_to_zombie: 1 },
    });
    const html = renderToStaticMarkup(createElement(RoundRecap, { recap }));
    expect(html).toContain(recap.headline);
    expect(html).toContain('Score 180 of target 150');
    expect(html).toContain('Zombie Slime chip');
    expect(html).toContain('Zombie spreads');
    expect(html).not.toContain('No synergies fired this round');
  });

  it('renders the empty-state line when nothing fired', () => {
    const recap = buildRoundRecap({ round: 1, score: 10, target: 100, target_met: false });
    const html = renderToStaticMarkup(createElement(RoundRecap, { recap }));
    expect(html).toContain(recap.headline);
    expect(html).toContain('Score 10 of target 100');
    expect(html).toContain('No synergies fired this round');
  });
});
