import React from 'react';
import type { GameConfig } from '../../engine/types';

export const chimeraWildsConfig: GameConfig = {
  gameId: 'chimera_wilds',
  label: 'Chimera Wilds',
  description: 'Face a single randomly-assembled six-part enemy in a one-roll D20 encounter',
  color: '#14b8a6',
  status: 'dev',
  component: React.lazy(() => import('./App')),
};
