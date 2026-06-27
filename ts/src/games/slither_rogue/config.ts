import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slitherRogueConfig: GameConfig = {
  gameId: 'slither_rogue',
  label: 'Snake Roguelike',
  description: 'Slither, mutate, steal segments',
  component: React.lazy(() => import('./App')),
};
