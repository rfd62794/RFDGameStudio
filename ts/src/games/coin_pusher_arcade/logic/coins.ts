// logic/coins.ts — pure spawn factories and board setup.
//
// Coin/object construction pulled out of the example's component so every
// spawn is a pure function taking an injectable rng (tests stay
// deterministic); instance ids are rng-derived rather than clock-based.

import type { ActiveCoin, BoardObject, CoinType, LevelSettings } from '../types';
import { COIN_TYPES } from '../data';

function makeId(prefix: string, rng: () => number): string {
  return `${prefix}-${Math.floor(rng() * 1e12).toString(36)}`;
}

export function pickCoinType(unlocked: CoinType[], rng: () => number): CoinType {
  const pool = unlocked.length > 0 ? unlocked : COIN_TYPES.slice(0, 3);
  return pool[Math.floor(rng() * pool.length)];
}

function coinFromType(type: CoinType, x: number, y: number, vx: number, vy: number, id: string): ActiveCoin {
  return {
    id,
    typeId: type.id,
    x,
    y,
    vx,
    vy,
    radius: type.radius,
    color: type.color,
    borderColor: type.borderColor,
    textColor: type.textColor,
    mass: type.mass,
    value: type.value,
    glow: type.glow,
    scale: 1,
    alpha: 1,
  };
}

// Pocket coin specs keyed by pocketCoinToDrop typeId — the same table the
// example inlined per type.
const POCKET_SPECS: Record<
  string,
  { radius: number; mass: number; value: number; color: string; borderColor: string; textColor: string }
> = {
  tnt: { radius: 18, mass: 2.5, value: 0, color: '#dc2626', borderColor: '#7f1d1d', textColor: '#ffffff' },
  magnet: { radius: 16, mass: 1.5, value: 0, color: '#4f46e5', borderColor: '#1e1b4b', textColor: '#ffffff' },
  double_drop: { radius: 16, mass: 2.0, value: 2, color: '#14b8a6', borderColor: '#115e59', textColor: '#ffffff' },
  giga_gold: { radius: 35, mass: 10.0, value: 50, color: '#fbbf24', borderColor: '#78350f', textColor: '#78350f' },
};

export function spawnDropCoin(type: CoinType, x: number, rng: () => number): ActiveCoin {
  return coinFromType(type, x, 15, (rng() - 0.5) * 1.0, 2.5, makeId('coin', rng));
}

export function spawnPocketCoin(typeId: string, x: number, rng: () => number): ActiveCoin | null {
  const spec = POCKET_SPECS[typeId];
  if (!spec) return null;
  const vx = typeId === 'giga_gold' ? (rng() - 0.5) * 0.5 : (rng() - 0.5) * 1.5;
  const vy = typeId === 'giga_gold' ? 2 : 3;
  return {
    id: makeId(typeId, rng),
    typeId,
    x,
    y: 20,
    vx,
    vy,
    radius: spec.radius,
    color: spec.color,
    borderColor: spec.borderColor,
    textColor: spec.textColor,
    mass: spec.mass,
    value: spec.value,
    isPocket: true,
    pocketTypeId: typeId,
    scale: 1,
    alpha: 1,
    glow: true,
  };
}

const BIRD_COIN_SPEC = { radius: 14, mass: 1.0, value: 1, color: '#fbbf24', borderColor: '#b45309', textColor: '#78350f' };

export function spawnBirdCoin(x: number, y: number, rng: () => number): ActiveCoin {
  return {
    id: makeId('bird-coin', rng),
    typeId: 'gold',
    x,
    y,
    vx: (rng() - 0.5) * 1.5,
    vy: 2.5,
    radius: BIRD_COIN_SPEC.radius,
    color: BIRD_COIN_SPEC.color,
    borderColor: BIRD_COIN_SPEC.borderColor,
    textColor: BIRD_COIN_SPEC.textColor,
    mass: BIRD_COIN_SPEC.mass,
    value: BIRD_COIN_SPEC.value,
    scale: 1,
    alpha: 1,
  };
}

export function spawnTowerBurst(x: number, y: number, rng: () => number): ActiveCoin[] {
  const numSpawn = 12 + Math.floor(rng() * 4);
  const burst: ActiveCoin[] = [];
  for (let i = 0; i < numSpawn; i++) {
    const angle = (i / numSpawn) * Math.PI * 2 + (rng() - 0.5) * 0.2;
    const dist = 10 + rng() * 20;
    burst.push({
      id: makeId(`tower-gold-${i}`, rng),
      typeId: 'gold',
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: Math.cos(angle) * (1.5 + rng() * 2.5),
      vy: Math.sin(angle) * (1.5 + rng() * 2.5) + 1.0,
      radius: BIRD_COIN_SPEC.radius,
      color: BIRD_COIN_SPEC.color,
      borderColor: BIRD_COIN_SPEC.borderColor,
      textColor: BIRD_COIN_SPEC.textColor,
      mass: BIRD_COIN_SPEC.mass,
      value: BIRD_COIN_SPEC.value,
      scale: 1,
      alpha: 1,
    });
  }
  return burst;
}

// Initial board: the default pegs plus the pre-filled lower shelf.
export function setupBoard(
  level: LevelSettings,
  unlockedCoins: CoinType[],
  rng: () => number
): { coins: ActiveCoin[]; objects: BoardObject[] } {
  const objects: BoardObject[] = [];
  const coins: ActiveCoin[] = [];

  const numPegs = 5 + level.level * 2;
  for (let i = 0; i < numPegs; i++) {
    objects.push({
      id: `peg-${i}`,
      type: 'peg',
      x: level.boardWidth * 0.15 + rng() * (level.boardWidth * 0.7),
      y: 160 + rng() * 100,
      radius: 6,
      color: '#94a3b8',
    });
  }

  for (let i = 0; i < level.startingCoinsCount; i++) {
    const type = pickCoinType(unlockedCoins, rng);
    const margin = level.gutterWidth + 25;
    const rx = margin + rng() * (level.boardWidth - margin * 2);
    const ry = 190 + rng() * 210;
    coins.push(coinFromType(type, rx, ry, 0, 0, makeId(`start-coin-${i}`, rng)));
  }

  return { coins, objects };
}

// The example's 50-step pre-settle: light gravity + positional-only
// resolution inside wall clamps, then velocities zeroed.
export function settleBoard(coins: ActiveCoin[], level: LevelSettings): void {
  const iterations = 5;
  for (let step = 0; step < 50; step++) {
    for (const c of coins) {
      c.vy += 0.12;
      c.vx *= 0.82;
      c.vy *= 0.82;
    }

    for (let iter = 0; iter < iterations; iter++) {
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
            c1.x -= nx * overlap * (c2.mass / totalMass);
            c1.y -= ny * overlap * (c2.mass / totalMass);
            c2.x += nx * overlap * (c1.mass / totalMass);
            c2.y += ny * overlap * (c1.mass / totalMass);
          }
        }
      }

      for (const c of coins) {
        const leftWall = level.gutterWidth + 5;
        const rightWall = level.boardWidth - level.gutterWidth - 5;
        if (c.x - c.radius < leftWall) c.x = leftWall + c.radius;
        if (c.x + c.radius > rightWall) c.x = rightWall - c.radius;
        if (c.y < 190) c.y = 190;
        if (c.y > 450) c.y = 450;
      }
    }
  }

  for (const c of coins) {
    c.vx = 0;
    c.vy = 0;
  }
}

// Drop-channel clamp used by both the hover guide and the drop itself.
export function clampDropX(x: number, level: LevelSettings): number {
  const padding = level.gutterWidth + 15;
  if (x < padding) return padding;
  if (x > level.boardWidth - padding) return level.boardWidth - padding;
  return x;
}
