import React from 'react';
import type { GameConfig } from '../../engine/types';

export const horseRacingConfig: GameConfig = {
  gameId: 'horse_racing',
  label: 'Derby Sim',
  description: 'Horse racing, breeding, and betting',
  component: React.lazy(() => import('./App')),
};
