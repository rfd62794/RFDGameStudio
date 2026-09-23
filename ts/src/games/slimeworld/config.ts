import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slimeworldConfig: GameConfig = {
  gameId:      'slimeworld',
  label:       'SlimeWorld',
  description: 'Breed, dispatch, and conquer planet nodes with slime specimens. Color/shape/accent genetics, territory claims, garrison mechanics.',
  color:       '#22c55e',
  status:      'stable',
  genre:       'creature-collector',
  tags:        ['territory-control', 'genetics'],
  component:   React.lazy(() => import('./App')),
};
