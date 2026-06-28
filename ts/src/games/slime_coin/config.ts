// config.ts — SlimeCoin game configuration

import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slimeCoinConfig: GameConfig = {
  gameId: 'slime_coin',
  label: 'SlimeCoin',
  description: 'Real-time coin pusher with shooter, two-layer board, and chip synergies',
  color: '#a855f7',
  status: 'dev',
  component: React.lazy(() => import('./App')),
};
