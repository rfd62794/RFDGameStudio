// logic/physics.ts — pure coin-pusher board simulation.
//
// Extracted from the AI Studio example's CoinPusherGame render loop as pure
// functions over plain data: no DOM, no rendering, no ambient clock or
// randomness — `nowMs` and `rng` are injected so tests are deterministic.
// Rendering-side effects (sounds, particles, floating texts) are surfaced as
// BoardEvents for the caller to map.

import type { ActiveCoin, BoardObject, LevelSettings } from '../types';
import { COIN_TYPES } from '../data';
import { recordFall } from './combo';
import { spawnBirdCoin, spawnTowerBurst } from './coins';

export const BOARD_HEIGHT = 500;
export const FALL_LINE_Y = 458;
export const PUSHER_MIN_Y = 20;
export const PUSHER_STROKE = 55;
export const GUTTER_SHIELD_FRAMES = 60 * 15;
export const BIRD_DROP_INTERVAL_MS = 450;
export const BIRD_SPEED = 3.5;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  size: number;
}

export interface BoardState {
  coins: ActiveCoin[];
  objects: BoardObject[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  pusherY: number;
  pusherDirection: number; // 1 = down, -1 = up
  time: number;
  screenshake: number;
  gutterShieldTimer: number; // in frames
  // Coin bird flight state
  birdActive: boolean;
  birdX: number;
  birdY: number;
  birdDirection: number;
  birdDropsLeft: number;
  birdLastDropTime: number;
  // Drag/hover placement state
  hoverX: number | null;
  // Timestamp trackers for combo window
  recentFalls: number[];
}

export function createBoardState(): BoardState {
  return {
    coins: [],
    objects: [],
    particles: [],
    floatingTexts: [],
    pusherY: 30,
    pusherDirection: 1,
    time: 0,
    screenshake: 0,
    gutterShieldTimer: 0,
    birdActive: false,
    birdX: 0,
    birdY: 50,
    birdDirection: 1,
    birdDropsLeft: 0,
    birdLastDropTime: 0,
    hoverX: null,
    recentFalls: [],
  };
}

// One discrete thing the caller should turn into chrome (sound, particles,
// floating text, or a React callback). Emitted in the same order the original
// loop produced its effects.
export type BoardEvent =
  | { type: 'coin_scored'; coin: ActiveCoin }
  | { type: 'coin_guttered'; coin: ActiveCoin }
  | { type: 'pocket_effect'; kind: string; x: number }
  | { type: 'combo'; count: number; x: number; y: number }
  | { type: 'score_pop'; x: number; y: number; text: string; color: string; size: number }
  | { type: 'bird_drop'; x: number; y: number }
  | { type: 'tower_collapsed'; x: number; y: number }
  | { type: 'shield_off' }
  | { type: 'bumper_hit'; x: number; y: number }
  | { type: 'peg_hit'; x: number; y: number }
  | { type: 'multiplier_hit'; x: number; y: number }
  | { type: 'tower_hit'; x: number; y: number };

export interface StepResult {
  events: BoardEvent[];
  activeCoins: number;
  isSettled: boolean;
}

export function pusherYAt(time: number, pusherSpeed: number): number {
  return PUSHER_MIN_Y + (Math.sin(time * pusherSpeed) + 1) * 0.5 * PUSHER_STROKE;
}

// Where a fully-landed coin ends up: 'gutter' when past either gutter edge
// (unless the shield is live), otherwise 'score'.
export function classifyFall(
  coin: ActiveCoin,
  level: LevelSettings,
  gutterShieldActive: boolean
): 'gutter' | 'score' {
  if (gutterShieldActive) return 'score';
  if (coin.x < level.gutterWidth || coin.x > level.boardWidth - level.gutterWidth) {
    return 'gutter';
  }
  return 'score';
}

// TNT blast: shove every coin within radius outwards, biased downwards.
export function applyExplosion(coins: ActiveCoin[], x: number, y: number): void {
  const explosionRadius = 160;
  for (const c of coins) {
    const dx = c.x - x;
    const dy = c.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < explosionRadius && dist > 1) {
      const forceFactor = 1 - dist / explosionRadius;
      const angle = Math.atan2(dy, dx);
      const kickPower = forceFactor * 14;
      c.vx += Math.cos(angle) * kickPower;
      c.vy += Math.sin(angle) * kickPower + 2;
    }
  }
}

// Magnet pulse: pull every coin toward the lower central shelf.
export function applyMagnetPulse(coins: ActiveCoin[], boardWidth: number): void {
  const targetX = boardWidth / 2;
  const targetY = 440;
  for (const c of coins) {
    const dx = targetX - c.x;
    const dy = targetY - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) {
      c.vx += (dx / dist) * 4.5;
      c.vy += (dy / dist) * 7.5;
    }
  }
}

// Coin-to-coin, wall, and board-object collision resolution. Mutates the
// arrays in place and returns hit events for the caller to render/sound.
export function resolveCollisions(
  coins: ActiveCoin[],
  objects: BoardObject[],
  gutterShieldActive: boolean,
  boardWidth: number,
  gutterWidth: number
): BoardEvent[] {
  const events: BoardEvent[] = [];
  const iterations = 6;
  const topLimit = 10;

  for (let iter = 0; iter < iterations; iter++) {
    // Coin-to-coin
    for (let i = 0; i < coins.length; i++) {
      for (let j = i + 1; j < coins.length; j++) {
        const c1 = coins[i];
        const c2 = coins[j];

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = c1.radius + c2.radius;

        if (dist < minDist) {
          const actualDist = dist === 0 ? 0.1 : dist;
          const overlap = minDist - actualDist;

          const nx = dx / actualDist;
          const ny = dy / actualDist;

          const totalMass = c1.mass + c2.mass;
          const ratio1 = c2.mass / totalMass;
          const ratio2 = c1.mass / totalMass;

          c1.x -= nx * overlap * ratio1;
          c1.y -= ny * overlap * ratio1;
          c2.x += nx * overlap * ratio2;
          c2.y += ny * overlap * ratio2;

          const kx = c1.vx - c2.vx;
          const ky = c1.vy - c2.vy;
          const impulse = (2 * (nx * kx + ny * ky)) / totalMass;

          c1.vx -= impulse * c2.mass * nx * 0.35;
          c1.vy -= impulse * c2.mass * ny * 0.35;
          c2.vx += impulse * c1.mass * nx * 0.35;
          c2.vy += impulse * c1.mass * ny * 0.35;
        }
      }
    }

    // Coin limits and board objects
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];

      let leftBound = 0;
      let rightBound = boardWidth;

      if (c.y < 165) {
        leftBound = gutterWidth;
        rightBound = boardWidth - gutterWidth;
      } else {
        leftBound = gutterShieldActive ? 0 : gutterWidth - 10;
        rightBound = gutterShieldActive ? boardWidth : boardWidth - gutterWidth + 10;
      }

      if (c.x - c.radius < leftBound) {
        c.x = leftBound + c.radius;
        c.vx = -c.vx * 0.15;
      }
      if (c.x + c.radius > rightBound) {
        c.x = rightBound - c.radius;
        c.vx = -c.vx * 0.15;
      }
      if (c.y - c.radius < topLimit) {
        c.y = topLimit + c.radius;
        c.vy = -c.vy * 0.15;
      }

      for (const obj of objects) {
        const dx = c.x - obj.x;
        const dy = c.y - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = c.radius + obj.radius;

        if (dist < minDist) {
          const actualDist = dist === 0 ? 0.1 : dist;
          const overlap = minDist - actualDist;
          const nx = dx / actualDist;
          const ny = dy / actualDist;

          c.x += nx * overlap;
          c.y += ny * overlap;

          let bounce = 0.45;
          if (obj.type === 'bumper') {
            bounce = 1.8;
            obj.pulseTimer = 10;
            events.push({ type: 'bumper_hit', x: obj.x, y: obj.y });
          } else if (obj.type === 'multiplier') {
            bounce = 0.6;
            obj.pulseTimer = 8;
            const baseCoinType = COIN_TYPES.find(ct => ct.id === c.typeId);
            if (baseCoinType && c.value === baseCoinType.value) {
              c.value *= 2;
              c.glow = true;
              c.scale = (c.scale || 1.0) * 1.15;
              events.push({ type: 'multiplier_hit', x: c.x, y: c.y });
            }
          } else if (obj.type === 'tower') {
            bounce = 0.1;
            if (obj.health && obj.health > 0) {
              obj.health -= 1;
              obj.pulseTimer = 6;
              events.push({ type: 'tower_hit', x: obj.x, y: obj.y });
            }
          } else {
            bounce = 0.75;
            events.push({ type: 'peg_hit', x: obj.x, y: obj.y });
          }

          const dotProduct = c.vx * nx + c.vy * ny;
          c.vx = (c.vx - 2 * dotProduct * nx) * bounce;
          c.vy = (c.vy - 2 * dotProduct * ny) * bounce;
        }
      }
    }
  }

  return events;
}

// Advance the whole board one frame. Mutates `state`; returns the events for
// chrome/callbacks plus the settled/active bookkeeping the parent needs.
export function stepBoard(
  state: BoardState,
  level: LevelSettings,
  nowMs: number,
  rng: () => number
): StepResult {
  const events: BoardEvent[] = [];
  state.time += 0.03;

  // Pusher movement: sinusoidal sweep between PUSHER_MIN_Y and +STROKE.
  const prevPusherY = state.pusherY;
  state.pusherY = pusherYAt(state.time, level.pusherSpeed);
  const pusherMovingDown = state.pusherY > prevPusherY;

  // Gutter shield decay
  if (state.gutterShieldTimer > 0) {
    state.gutterShieldTimer--;
    if (state.gutterShieldTimer === 0) {
      events.push({ type: 'shield_off' });
    }
  }

  // Coin bird sweep
  if (state.birdActive) {
    state.birdX += BIRD_SPEED;
    if (
      state.birdDropsLeft > 0 &&
      state.birdX > level.gutterWidth + 20 &&
      state.birdX < level.boardWidth - level.gutterWidth - 20
    ) {
      if (nowMs - state.birdLastDropTime > BIRD_DROP_INTERVAL_MS) {
        state.birdLastDropTime = nowMs;
        state.birdDropsLeft--;
        const birdCoin = spawnBirdCoin(state.birdX, state.birdY + 10, rng);
        state.coins.push(birdCoin);
        events.push({ type: 'bird_drop', x: state.birdX, y: state.birdY + 10 });
      }
    }
    if (state.birdX > level.boardWidth + 50) {
      state.birdActive = false;
    }
  }

  // Coin integration + fall-off scoring
  const coins = state.coins;
  let activeCoinsCount = 0;

  state.coins = coins.filter(c => {
    const gravity = c.y < 160 ? 0.08 : 0.14;
    c.vy += gravity;
    c.vx *= 0.82;
    c.vy *= 0.82;
    c.x += c.vx;
    c.y += c.vy;

    const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
    if (speed > 0.08 || c.y < 160) {
      activeCoinsCount++;
    }

    // Pusher impact: coin edge above the pusher face gets shoved forward.
    if (c.y - c.radius < state.pusherY) {
      c.y = state.pusherY + c.radius;
      if (pusherMovingDown) {
        c.vy = Math.max(c.vy, level.pusherSpeed * 2.2);
      }
      activeCoinsCount++;
    }

    if (c.y > FALL_LINE_Y) {
      if (c.scale === undefined) c.scale = 1.0;
      if (c.alpha === undefined) c.alpha = 1.0;

      c.scale -= 0.05;
      c.alpha -= 0.05;
      c.vy += 0.4;

      if (c.alpha <= 0 || c.scale <= 0) {
        const landed = classifyFall(c, level, state.gutterShieldTimer > 0);

        if (landed === 'gutter') {
          events.push({ type: 'coin_guttered', coin: c });
        } else {
          events.push({ type: 'coin_scored', coin: c });

          if (c.isPocket) {
            if (c.pocketTypeId === 'tnt') {
              state.screenshake = 18;
              applyExplosion(state.coins, c.x, 320);
              events.push({ type: 'pocket_effect', kind: 'tnt', x: c.x });
            } else if (c.pocketTypeId === 'magnet') {
              state.screenshake = 6;
              applyMagnetPulse(state.coins, level.boardWidth);
              events.push({ type: 'pocket_effect', kind: 'magnet', x: c.x });
            } else if (c.pocketTypeId === 'double_drop') {
              events.push({ type: 'pocket_effect', kind: 'double_drop', x: c.x });
            } else if (c.pocketTypeId === 'giga_gold') {
              events.push({ type: 'pocket_effect', kind: 'giga_gold', x: c.x });
            }
          }

          const { falls, combo } = recordFall(state.recentFalls, nowMs, level.comboWindowMs);
          state.recentFalls = falls;

          if (combo >= 3) {
            events.push({ type: 'combo', count: combo, x: c.x, y: 430 });
          } else if (!c.isPocket) {
            events.push({
              type: 'score_pop',
              x: c.x,
              y: 440,
              text: `+${c.value}`,
              color: c.color,
              size: 14,
            });
          }
        }
        return false;
      }
    }

    return true;
  });

  // Board objects: pulse decay + tower collapse
  state.objects = state.objects.filter(obj => {
    if (obj.pulseTimer && obj.pulseTimer > 0) {
      obj.pulseTimer--;
    }
    if (obj.type === 'tower' && obj.health !== undefined && obj.health <= 0) {
      const burst = spawnTowerBurst(obj.x, obj.y, rng);
      for (const coin of burst) {
        state.coins.push(coin);
      }
      state.screenshake = 10;
      events.push({ type: 'tower_collapsed', x: obj.x, y: obj.y });
      return false;
    }
    return true;
  });

  // Collisions: coins vs coins, walls, and board objects
  events.push(
    ...resolveCollisions(
      state.coins,
      state.objects,
      state.gutterShieldTimer > 0,
      level.boardWidth,
      level.gutterWidth
    )
  );

  // Particles
  state.particles = state.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.rotation += p.rotSpeed;
    p.alpha -= p.decay;
    return p.alpha > 0;
  });

  // Floating texts
  state.floatingTexts = state.floatingTexts.filter(t => {
    t.y += t.vy;
    t.alpha -= 0.015;
    return t.alpha > 0;
  });

  // Screenshake decay
  if (state.screenshake > 0) {
    state.screenshake *= 0.88;
    if (state.screenshake < 0.2) state.screenshake = 0;
  }

  const isSettled = activeCoinsCount === 0 && !state.birdActive;
  return { events, activeCoins: activeCoinsCount, isSettled };
}
