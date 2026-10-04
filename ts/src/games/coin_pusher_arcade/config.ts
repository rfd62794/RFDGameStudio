import React from 'react';
import type { GameConfig } from '../../engine/types';
export const coinPusherArcadeConfig: GameConfig = {
  gameId: 'coin_pusher_arcade',
  order: 200,
  source: { kind: 'example', slug: 'coin-pusher-arcade' },
  label: 'Coin Pusher Arcade',
  description: 'Arcade-style coin pusher: drops, combos, a reward wheel, special pocket coins, pressure levels and meta-progression.',
  color: '#f59e0b',
  status: 'dev',
  tags: ['coin-pusher', 'arcade'],
  component: React.lazy(() => import('./App')),
};

export default coinPusherArcadeConfig;
