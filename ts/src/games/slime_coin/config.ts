// config.ts — SlimeCoin game configuration

import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slimeCoinConfig: GameConfig = {
  gameId: 'slime_coin',
  label: 'SlimeCoin',
  description: 'Real-time coin pusher with shooter, two-layer board, and chip synergies',
  color: '#a855f7',
  status: 'dev',
  // No `genre` — genuinely doesn't fit the curated 11-value taxonomy.
  // Real-time arcade coin-pusher physics has no honest match among
  // the existing values. Reported as a real taxonomy gap.
  tags: ['coin-pusher', 'real-time'],
  component: React.lazy(() => import('./App')),
};
