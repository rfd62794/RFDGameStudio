import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slitherRogueConfig: GameConfig = {
  gameId:      'slither_rogue',
  label:       'Snake Roguelike',
  description: 'Slither.io meets roguelike. Steal segments, collect evolution cards, dominate the arena.',
  color:       '#34d399',   // green
  status:      'beta',
  component:   React.lazy(() => import('./App')),
};
