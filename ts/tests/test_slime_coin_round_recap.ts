// new: ts/tests/test_slime_coin_round_recap.ts
/**
 * Round recap: the end-of-round summary that makes a lost round legible.
 * (a) buildRoundRecap turns the Lua end_round result into display data,
 * (b) the real Lua records which synergies fired and returns shortfall/surplus,
 * (c) RoundRecap renders the headline and the fired list (or the empty line).
 * The Lua halves never run physics ticks — end_round is called directly.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadGame, call } from '../src/engine/runtime';
import { LuaExecutor } from '../src/engine/executor';
import type { GameSession } from '../src/engine/types';
import { buildRoundRecap, type EndRoundResult } from '../src/games/slime_coin/utils/roundRecap';
import RoundRecap from '../src/games/slime_coin/components/RoundRecap';

type Row = Record<string, unknown>;

function lua(session: GameSession, fn: string, ...args: unknown[]): Row {
  return (call(session, fn, ...args) as Row[])[0];
}

const HELPER = `
function test_seed_recap(score, id, n)
  GAME_STATE.score = score
  GAME_STATE.synergy_fired[id] = n
end`;

function sessionWithHelper(): GameSession {
  const base = loadGame('slime_coin', 42);
  const executor = new LuaExecutor(base.files.logic + '\n' + HELPER, 42, base.files.engineSource);
  return { ...base, executor };
}

describe('buildRoundRecap', () => {
  it('cleared round: positive margin, headline says how much to spare, fired sorted by count', () => {
    const recap = buildRoundRecap({
      round: 3, score: 260, target: 225, target_met: true,
      synergy_fired: { zombie_slime: 2, double_crystal_tokens: 5 },
      shortfall: 0, surplus: 35,
    });
    expect(recap.round).toBe(3);
    expect(recap.score).toBe(260);
    expect(recap.target).toBe(225);
    expect(recap.targetMet).toBe(true);
    expect(recap.margin).toBe(35);
    expect(recap.headline).toContain('35');
    expect(recap.fired).toEqual([
      { label: 'Mirror and crystal double tokens', count: 5 },
      { label: 'Zombie Slime chip', count: 2 },
    ]);
  });

  it('missed round: negative margin, headline says short by how much', () => {
    const recap = buildRoundRecap({
      round: 6, score: 300, target: 400, target_met: false,
      synergy_fired: {}, shortfall: 100, surplus: 0,
    });
    expect(recap.targetMet).toBe(false);
    expect(recap.margin).toBe(-100);
    expect(recap.headline).toContain('100');
    expect(recap.fired).toEqual([]);
  });

  it('exact tie: target met, margin 0, headline says exactly', () => {
    const recap = buildRoundRecap({
      round: 1, score: 100, target: 100, target_met: true,
      synergy_fired: {}, shortfall: 0, surplus: 0,
    });
    expect(recap.targetMet).toBe(true);
    expect(recap.margin).toBe(0);
    expect(recap.headline.toLowerCase()).toContain('exactly');
  });

  it('empty synergy_fired yields an empty fired list', () => {
    const recap = buildRoundRecap({ round: 1, score: 0, target: 100, target_met: false });
    expect(recap.fired).toEqual([]);
  });

  it('an unknown synergy id is shown raw, never dropped', () => {
    const recap = buildRoundRecap({
      round: 1, score: 0, target: 100, target_met: false,
      synergy_fired: { mystery_synapse: 3 },
    });
    expect(recap.fired).toEqual([{ label: 'mystery_synapse', count: 3 }]);
  });
});

describe('end_round on the real Lua', () => {
  it('after init_game: synergy_fired empty, shortfall is the target at score 0, surplus 0', () => {
    const session = loadGame('slime_coin', 42);
    lua(session, 'init_game', {});
    const res = lua(session, 'end_round');
    expect(res.synergy_fired).toEqual([]);
    expect(res.shortfall).toBe(res.target);
    expect(res.surplus).toBe(0);
    expect(res.round).toBe(1);
    expect(res.score).toBe(0);
    expect(res.target_met).toBe(false);
    expect((res.offered_cards as unknown[]).length).toBe(3);
  });

  it('echoes synergy_fired counts and score written into GAME_STATE', () => {
    const session = sessionWithHelper();
    lua(session, 'init_game', {});
    lua(session, 'test_seed_recap', 140, 'zombie_slime', 2);
    lua(session, 'test_seed_recap', 140, 'crystal_burst', 1);
    const res = lua(session, 'end_round');
    expect(res.synergy_fired).toEqual({ zombie_slime: 2, crystal_burst: 1 });
    expect(res.score).toBe(140);
    expect(res.shortfall).toBe(0);
    expect(res.surplus).toBe(40);
    const recap = buildRoundRecap(res as unknown as EndRoundResult);
    expect(recap.fired).toEqual([
      { label: 'Zombie Slime chip', count: 2 },
      { label: 'Crystal Burst chip', count: 1 },
    ]);
  });

  it('start_round clears synergy_fired for the new round', () => {
    const session = sessionWithHelper();
    lua(session, 'init_game', {});
    lua(session, 'test_seed_recap', 50, 'zombie_slime', 4);
    lua(session, 'start_round', 2);
    const res = lua(session, 'end_round');
    expect(res.synergy_fired).toEqual([]);
  });
});

describe('RoundRecap rendering', () => {
  it('renders headline, score-of-target and the fired list', () => {
    const recap = buildRoundRecap({
      round: 4, score: 250, target: 200, target_met: true,
      synergy_fired: { zombie_slime: 2 },
    });
    const html = renderToStaticMarkup(createElement(RoundRecap, { recap }));
    expect(html).toContain(recap.headline);
    expect(html).toContain('Score 250 of target 200');
    expect(html).toContain('Zombie Slime chip');
    expect(html).not.toContain('No synergies fired this round');
  });

  it('renders the empty-list wording when nothing fired', () => {
    const recap = buildRoundRecap({
      round: 2, score: 50, target: 150, target_met: false,
      synergy_fired: {},
    });
    const html = renderToStaticMarkup(createElement(RoundRecap, { recap }));
    expect(html).toContain('No synergies fired this round');
    expect(html).toContain('Score 50 of target 150');
  });
});
