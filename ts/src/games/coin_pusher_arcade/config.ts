// config.ts — Coin Pusher Arcade game configuration

import React from 'react';
import type { GameConfig } from '../../engine/types';

export const coinPusherArcadeConfig: GameConfig = {
  gameId: 'coin_pusher_arcade',
  label: 'Coin Pusher Arcade',
  description: 'Physics-driven coin pusher cabinet — drop tokens, build combos, spin the reward wheel, and clear pressure levels',
  color: '#ec4899',
  status: 'dev',
  // No `genre` — same taxonomy gap as slime_coin: real-time physics
  // coin-pushers have no honest match in the curated PrimaryGenre list.
  tags: ['coin-pusher', 'physics', 'real-time'],
  source: { kind: 'example', slug: 'coin-pusher-arcade' },
  component: React.lazy(() => import('./App')),
};
