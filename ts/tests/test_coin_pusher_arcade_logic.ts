import { describe, expect, it } from 'vitest';
import {
  COIN_TYPES,
  LEVEL_SETTINGS,
  POCKET_COIN_TYPES,
  WHEEL_REWARDS,
} from '../src/games/coin_pusher_arcade/data';
import {
  createBoardState,
  classifyFall,
  pusherYAt,
  resolveCollisions,
  applyExplosion,
  applyMagnetPulse,
  stepBoard,
  FALL_LINE_Y,
  PUSHER_MIN_Y,
  PUSHER_STROKE,
} from '../src/games/coin_pusher_arcade/logic/physics';
import {
  clampDropX,
  pickCoinType,
  setupBoard,
  settleBoard,
  spawnBirdCoin,
  spawnDropCoin,
  spawnPocketCoin,
  spawnTowerBurst,
} from '../src/games/coin_pusher_arcade/logic/coins';
import { recordFall } from '../src/games/coin_pusher_arcade/logic/combo';
import {
  pickDraftChoices,
  pickWheelIndex,
  pickWheelReward,
  wheelRotationFor,
} from '../src/games/coin_pusher_arcade/logic/wheel';
import type { ActiveCoin, BoardObject } from '../src/games/coin_pusher_arcade/types';

// Deterministic LCG so every rng-injected call is reproducible.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const LEVEL = LEVEL_SETTINGS[0]; // level 1: 440 wide, gutter 35

function makeCoin(overrides: Partial<ActiveCoin> = {}): ActiveCoin {
  return {
    id: 'test-coin',
    typeId: 'gold',
    x: 220,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 14,
    color: '#fbbf24',
    borderColor: '#b45309',
    textColor: '#78350f',
    mass: 1,
    value: 1,
    scale: 1,
    alpha: 1,
    ...overrides,
  };
}

describe('data integrity (ported constants)', () => {
  it('has unique ids across COIN_TYPES, POCKET_COIN_TYPES, and WHEEL_REWARDS', () => {
    for (const list of [COIN_TYPES, POCKET_COIN_TYPES, WHEEL_REWARDS]) {
      const ids = list.map(item => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('keeps LEVEL_SETTINGS levels ascending with widening boards', () => {
    for (let i = 1; i < LEVEL_SETTINGS.length; i++) {
      expect(LEVEL_SETTINGS[i].level).toBeGreaterThan(LEVEL_SETTINGS[i - 1].level);
      expect(LEVEL_SETTINGS[i].pushTarget).toBeGreaterThan(LEVEL_SETTINGS[i - 1].pushTarget);
      expect(LEVEL_SETTINGS[i].boardWidth).toBeGreaterThan(LEVEL_SETTINGS[i - 1].boardWidth);
      expect(LEVEL_SETTINGS[i].comboWindowMs).toBeLessThan(LEVEL_SETTINGS[i - 1].comboWindowMs);
    }
  });
});

describe('coin factories (logic/coins)', () => {
  it('pickCoinType selects deterministically from the unlocked pool', () => {
    const pool = COIN_TYPES.slice(0, 3);
    expect(pickCoinType(pool, () => 0)).toBe(pool[0]);
    expect(pickCoinType(pool, () => 0.999)).toBe(pool[2]);
    // Empty pool falls back to the first three coin types (as the example did)
    const fallback = pickCoinType([], () => 0.5);
    expect(COIN_TYPES.slice(0, 3)).toContainEqual(fallback);
  });

  it('spawnDropCoin drops at y=15 with type stats copied', () => {
    const coin = spawnDropCoin(COIN_TYPES[0], 220, () => 0.5);
    expect(coin.typeId).toBe('gold');
    expect(coin.x).toBe(220);
    expect(coin.y).toBe(15);
    expect(coin.vy).toBe(2.5);
    expect(coin.radius).toBe(COIN_TYPES[0].radius);
    expect(coin.value).toBe(COIN_TYPES[0].value);
    expect(coin.vx).toBe(0); // (0.5 - 0.5) * 1.0
    expect(coin.isPocket).toBeUndefined();
  });

  it('spawnPocketCoin builds each pocket type with its spec', () => {
    const tnt = spawnPocketCoin('tnt', 200, () => 0.5)!;
    expect(tnt.isPocket).toBe(true);
    expect(tnt.pocketTypeId).toBe('tnt');
    expect(tnt.radius).toBe(18);
    expect(tnt.mass).toBe(2.5);
    expect(tnt.value).toBe(0);
    expect(tnt.y).toBe(20);
    expect(tnt.glow).toBe(true);

    const giga = spawnPocketCoin('giga_gold', 200, () => 0.5)!;
    expect(giga.radius).toBe(35);
    expect(giga.mass).toBe(10.0);
    expect(giga.value).toBe(50);
    expect(giga.vy).toBe(2); // giga uses the slower drop speed

    expect(spawnPocketCoin('unknown_type', 200, () => 0.5)).toBeNull();
  });

  it('spawnBirdCoin produces standard gold spec coins', () => {
    const coin = spawnBirdCoin(100, 60, () => 0.5);
    expect(coin.typeId).toBe('gold');
    expect(coin.radius).toBe(14);
    expect(coin.mass).toBe(1.0);
    expect(coin.value).toBe(1);
    expect(coin.x).toBe(100);
    expect(coin.y).toBe(60);
  });

  it('spawnTowerBurst emits 12-15 gold coins', () => {
    const burst = spawnTowerBurst(220, 260, lcg(1));
    expect(burst.length).toBeGreaterThanOrEqual(12);
    expect(burst.length).toBeLessThanOrEqual(15);
    for (const c of burst) {
      expect(c.typeId).toBe('gold');
      expect(c.value).toBe(1);
    }
  });
});

describe('board setup & clamping (logic/coins)', () => {
  it('setupBoard spawns level-scaled pegs and starting coins', () => {
    const { coins, objects } = setupBoard(LEVEL, COIN_TYPES.slice(0, 3), lcg(7));
    expect(objects).toHaveLength(5 + LEVEL.level * 2); // 7 pegs on level 1
    expect(coins).toHaveLength(LEVEL.startingCoinsCount);
    expect(objects.every(o => o.type === 'peg' && o.radius === 6)).toBe(true);
    const margin = LEVEL.gutterWidth + 25;
    for (const c of coins) {
      expect(c.x).toBeGreaterThanOrEqual(margin);
      expect(c.x).toBeLessThanOrEqual(LEVEL.boardWidth - margin);
      expect(c.y).toBeGreaterThanOrEqual(190);
      expect(c.y).toBeLessThanOrEqual(400);
    }
  });

  it('settleBoard zeroes velocities and keeps coins inside the shelf', () => {
    const { coins } = setupBoard(LEVEL, COIN_TYPES.slice(0, 3), lcg(3));
    settleBoard(coins, LEVEL);
    for (const c of coins) {
      expect(c.vx).toBe(0);
      expect(c.vy).toBe(0);
      expect(c.x - c.radius).toBeGreaterThanOrEqual(LEVEL.gutterWidth + 5 - 0.001);
      expect(c.x + c.radius).toBeLessThanOrEqual(LEVEL.boardWidth - LEVEL.gutterWidth - 5 + 0.001);
      expect(c.y).toBeGreaterThanOrEqual(190);
      expect(c.y).toBeLessThanOrEqual(450);
    }
  });

  it('clampDropX clamps into the drop channel (gutter + 15 padding)', () => {
    const pad = LEVEL.gutterWidth + 15; // 50 on level 1
    expect(clampDropX(10, LEVEL)).toBe(pad);
    expect(clampDropX(LEVEL.boardWidth - 5, LEVEL)).toBe(LEVEL.boardWidth - pad);
    expect(clampDropX(220, LEVEL)).toBe(220);
  });
});

describe('fall classification & pusher (logic/physics)', () => {
  it('classifyFall scores center-edge coins and gutters side-lane coins', () => {
    const coin = makeCoin({ x: 220 });
    expect(classifyFall(coin, LEVEL, false)).toBe('score');
    expect(classifyFall(makeCoin({ x: 10 }), LEVEL, false)).toBe('gutter');
    expect(classifyFall(makeCoin({ x: LEVEL.boardWidth - 5 }), LEVEL, false)).toBe('gutter');
    // Gutter shield converts gutter lanes into scores
    expect(classifyFall(makeCoin({ x: 10 }), LEVEL, true)).toBe('score');
  });

  it('pusherYAt sweeps inside [minY, minY + stroke]', () => {
    for (let t = 0; t < 400; t += 0.5) {
      const y = pusherYAt(t, LEVEL.pusherSpeed);
      expect(y).toBeGreaterThanOrEqual(PUSHER_MIN_Y - 1e-9);
      expect(y).toBeLessThanOrEqual(PUSHER_MIN_Y + PUSHER_STROKE + 1e-9);
    }
  });
});

describe('combo window (logic/combo)', () => {
  it('counts falls inside the window and expires old ones', () => {
    let r = recordFall([], 1000, 2000);
    expect(r.combo).toBe(1);
    r = recordFall(r.falls, 1500, 2000);
    expect(r.combo).toBe(2);
    r = recordFall(r.falls, 2900, 2000);
    expect(r.combo).toBe(3); // 1000 is exactly inside <= window
    // Now advance past the window: falls at 1000 and 1500 expire
    r = recordFall(r.falls, 4900, 2000);
    expect(r.combo).toBe(2); // only 2900 + 4900 remain
    expect(r.falls).toEqual([2900, 4900]);
  });
});

describe('stepBoard simulation (logic/physics)', () => {
  it('emits coin_scored and removes a fully-faded coin at the front edge', () => {
    const state = createBoardState();
    state.coins.push(makeCoin({ x: 220, y: FALL_LINE_Y + 20, alpha: 0.04 }));
    const { events } = stepBoard(state, LEVEL, 1000, lcg(5));
    const scored = events.filter(e => e.type === 'coin_scored');
    expect(scored).toHaveLength(1);
    expect(state.coins).toHaveLength(0);
  });

  it('emits coin_guttered for a faded coin in a gutter lane', () => {
    const state = createBoardState();
    state.coins.push(makeCoin({ x: 10, y: FALL_LINE_Y + 20, alpha: 0.04 }));
    const { events } = stepBoard(state, LEVEL, 1000, lcg(5));
    expect(events.filter(e => e.type === 'coin_guttered')).toHaveLength(1);
    expect(events.filter(e => e.type === 'coin_scored')).toHaveLength(0);
  });

  it('gutter shield turns a gutter fall into a score and expires with an event', () => {
    const state = createBoardState();
    state.gutterShieldTimer = 100;
    state.coins.push(makeCoin({ x: 10, y: FALL_LINE_Y + 20, alpha: 0.04 }));
    const { events } = stepBoard(state, LEVEL, 1000, lcg(5));
    expect(events.filter(e => e.type === 'coin_scored')).toHaveLength(1);
    expect(state.gutterShieldTimer).toBe(99);

    state.gutterShieldTimer = 1;
    const { events: expiry } = stepBoard(state, LEVEL, 1000, lcg(5));
    expect(expiry.filter(e => e.type === 'shield_off')).toHaveLength(1);
    expect(state.gutterShieldTimer).toBe(0);
  });

  it('emits a combo event when a third fall lands inside the window', () => {
    const state = createBoardState();
    state.recentFalls = [900, 950];
    state.coins.push(makeCoin({ x: 220, y: FALL_LINE_Y + 20, alpha: 0.04 }));
    const { events } = stepBoard(state, LEVEL, 1000, lcg(5));
    const combo = events.filter(e => e.type === 'combo');
    expect(combo).toHaveLength(1);
    expect(combo[0]).toMatchObject({ type: 'combo', count: 3 });
    expect(state.recentFalls).toEqual([900, 950, 1000]);
  });

  it('emits a score_pop (not combo) for isolated scores', () => {
    const state = createBoardState();
    state.coins.push(makeCoin({ x: 220, y: FALL_LINE_Y + 20, alpha: 0.04 }));
    const { events } = stepBoard(state, LEVEL, 1000, lcg(5));
    const pops = events.filter(e => e.type === 'score_pop');
    expect(pops).toHaveLength(1);
    expect(pops[0]).toMatchObject({ text: '+1' });
  });

  it('pocket TNT lands: explosion shoves coins and shakes the screen', () => {
    const state = createBoardState();
    const victim = makeCoin({ id: 'victim', x: 230, y: 320 });
    state.coins.push(victim);
    state.coins.push(
      makeCoin({
        id: 'tnt',
        x: 220,
        y: FALL_LINE_Y + 20,
        alpha: 0.04,
        isPocket: true,
        pocketTypeId: 'tnt',
        value: 0,
      })
    );
    const { events } = stepBoard(state, LEVEL, 1000, lcg(5));
    expect(events.filter(e => e.type === 'pocket_effect' && e.kind === 'tnt')).toHaveLength(1);
    expect(state.screenshake).toBeGreaterThan(10); // set to 18, decays 0.88x same frame
    // The blast kicked the victim coin
    expect(Math.abs(victim.vx) + Math.abs(victim.vy)).toBeGreaterThan(0);
  });

  it('collapses a spent tower into a gold burst', () => {
    const state = createBoardState();
    const tower: BoardObject = {
      id: 'tower-1',
      type: 'tower',
      x: 220,
      y: 260,
      radius: 32,
      color: '#f97316',
      health: 0,
    };
    state.objects.push(tower);
    const { events } = stepBoard(state, LEVEL, 1000, lcg(9));
    expect(events.filter(e => e.type === 'tower_collapsed')).toHaveLength(1);
    expect(state.objects).toHaveLength(0);
    expect(state.coins.length).toBeGreaterThanOrEqual(12);
    expect(state.coins.every(c => c.typeId === 'gold')).toBe(true);
    expect(state.screenshake).toBeGreaterThan(5); // set to 10, decays 0.88x same frame
  });

  it('coin bird drops coins while sweeping the board', () => {
    const state = createBoardState();
    state.birdActive = true;
    state.birdX = LEVEL.gutterWidth + 30;
    state.birdDropsLeft = 3;
    state.birdLastDropTime = 0;
    const { events } = stepBoard(state, LEVEL, 10_000, lcg(4));
    expect(events.filter(e => e.type === 'bird_drop')).toHaveLength(1);
    expect(state.birdDropsLeft).toBe(2);
    expect(state.coins).toHaveLength(1);
    expect(state.coins[0].typeId).toBe('gold');
  });

  it('reports settled state from coin speed and bird activity', () => {
    const state = createBoardState();
    const empty = stepBoard(state, LEVEL, 1000, lcg(5));
    expect(empty.isSettled).toBe(true);
    expect(empty.activeCoins).toBe(0);

    // Any live coin counts as active: gravity alone injects ~0.11 vy,
    // which exceeds the 0.08 speed threshold (same as the example's loop).
    state.coins.push(makeCoin({ x: 220, y: 300 }));
    const moving = stepBoard(state, LEVEL, 1000, lcg(5));
    expect(moving.isSettled).toBe(false);
    expect(moving.activeCoins).toBeGreaterThan(0);
  });
});

describe('collision resolution (logic/physics)', () => {
  it('bumper hits bounce hard, pulse, and emit an event', () => {
    const bumper: BoardObject = {
      id: 'b1',
      type: 'bumper',
      x: 220,
      y: 300,
      radius: 20,
      color: '#ec4899',
    };
    const coin = makeCoin({ x: 250, y: 300, vx: -3 });
    const events = resolveCollisions([coin], [bumper], false, LEVEL.boardWidth, LEVEL.gutterWidth);
    expect(events.filter(e => e.type === 'bumper_hit')).toHaveLength(1);
    expect(bumper.pulseTimer).toBeGreaterThan(0);
    expect(coin.vx).toBeGreaterThan(0); // reflected rightwards
  });

  it('multiplier pad doubles a base-value coin exactly once', () => {
    const pad: BoardObject = {
      id: 'm1',
      type: 'multiplier',
      x: 220,
      y: 300,
      radius: 18,
      color: '#eab308',
      multiplier: 2,
    };
    const coin = makeCoin({ x: 240, y: 300, value: 1 }); // base gold value
    const events = resolveCollisions([coin], [pad], false, LEVEL.boardWidth, LEVEL.gutterWidth);
    expect(events.filter(e => e.type === 'multiplier_hit').length).toBeGreaterThan(0);
    expect(coin.value).toBe(2);
    expect(coin.glow).toBe(true);
  });

  it('tower objects absorb hits and lose health', () => {
    const tower: BoardObject = {
      id: 't1',
      type: 'tower',
      x: 220,
      y: 300,
      radius: 32,
      color: '#f97316',
      health: 3,
    };
    const coin = makeCoin({ x: 260, y: 300, vx: -2 });
    const events = resolveCollisions([coin], [tower], false, LEVEL.boardWidth, LEVEL.gutterWidth);
    expect(events.filter(e => e.type === 'tower_hit').length).toBeGreaterThan(0);
    expect(tower.health).toBeLessThan(3);
  });

  it('applyExplosion radiates coins away from the blast', () => {
    const coins = [makeCoin({ x: 200, y: 300 }), makeCoin({ x: 1000, y: 900 })];
    applyExplosion(coins, 220, 320);
    expect(coins[0].vx).toBeLessThan(0); // pushed left, away from x=220
    expect(coins[0].vy).toBeLessThan(0); // pushed up, away from y=320 (plus +2 bias)
    expect(coins[1].vx).toBe(0); // out of radius
  });

  it('applyMagnetPulse pulls coins toward the front center', () => {
    const coins = [makeCoin({ x: 60, y: 200 })];
    applyMagnetPulse(coins, LEVEL.boardWidth);
    expect(coins[0].vx).toBeGreaterThan(0); // toward center
    expect(coins[0].vy).toBeGreaterThan(0); // toward the front edge
  });
});

describe('reward wheel (logic/wheel)', () => {
  it('pickWheelIndex stays in range and honors rng', () => {
    expect(pickWheelIndex(5, () => 0)).toBe(0);
    expect(pickWheelIndex(5, () => 0.999)).toBe(4);
  });

  it('pickWheelReward is null on an empty pool and deterministic otherwise', () => {
    expect(pickWheelReward([], lcg(1))).toBeNull();
    const pick = pickWheelReward(WHEEL_REWARDS, () => 0)!;
    expect(pick).not.toBeNull();
    expect(pick!.index).toBe(0);
    expect(pick!.reward).toBe(WHEEL_REWARDS[0]);
  });

  it('wheelRotationFor lands the chosen slice under the top pointer', () => {
    const count = WHEEL_REWARDS.length; // 5 slices of 72deg
    const slice = 360 / count;
    const rot = wheelRotationFor(1, count, () => 0);
    // 5 full spins + offset centering slice 1 at the top pointer
    expect(rot).toBe(5 * 360 + (360 - slice - slice / 2));
    // rng controls the extra 5–7 full spins only; the slice offset is fixed
    const rot2 = wheelRotationFor(0, count, () => 0.999);
    const extra = 360 - slice / 2;
    expect(rot2 - extra).toBeGreaterThanOrEqual(5 * 360);
    expect(rot2 - extra).toBeLessThan(7 * 360);
  });

  it('pickDraftChoices returns up to 3 distinct unlocked pocket coins', () => {
    const all = pickDraftChoices(POCKET_COIN_TYPES, lcg(11));
    expect(all.length).toBe(3);
    expect(new Set(all.map(c => c.id)).size).toBe(all.length);
    for (const c of all) {
      expect(POCKET_COIN_TYPES).toContainEqual(c);
    }
    // Fewer than 3 unlocked → returns all of them
    const two = pickDraftChoices(POCKET_COIN_TYPES.slice(0, 2), lcg(11));
    expect(two).toHaveLength(2);
  });
});
