import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slimeworldConfig: GameConfig = {
  gameId:      'slimeworld',
  label:       'SlimeWorld',
  description: 'Breed, dispatch, and conquer planet nodes with slime specimens. Color/shape/accent genetics, territory claims, garrison mechanics.',
  color:       '#22c55e',
  status:      'stable',
  component:   React.lazy(() => import('./App')),
};
