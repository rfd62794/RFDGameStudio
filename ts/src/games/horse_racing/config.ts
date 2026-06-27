import React from 'react';
import type { GameConfig } from '../../engine/types';

export const horseRacingConfig: GameConfig = {
  gameId:      'horse_racing',
  label:       'Derby Sim',
  description: 'Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking.',
  color:       '#f59e0b',   // amber
  status:      'stable',
  component:   React.lazy(() => import('./App')),
};
