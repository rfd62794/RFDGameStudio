// config.ts — SlimeCoin game configuration

import React from 'react';
import type { GameConfig } from '../../engine/types';
import { SLIME_COIN_BLURB } from './blurb';

export const slimeCoinConfig: GameConfig = {
  gameId: 'slime_coin',
  order: 80,
  moreGames: true,
  label: 'SlimeCoin',
  description: SLIME_COIN_BLURB,
  color: '#a855f7',
  status: 'dev',
  // No `genre` — genuinely doesn't fit the curated 11-value taxonomy.
  // Real-time arcade coin-pusher physics has no honest match among
  // the existing values. Reported as a real taxonomy gap.
  tags: ['coin-pusher', 'real-time'],
  component: React.lazy(() => import('./App')),
};

export default slimeCoinConfig;
