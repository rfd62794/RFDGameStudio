import React from 'react';
import type { GameConfig } from '../../engine/types';

export const horseRacingConfig: GameConfig = {
  gameId:      'horse_racing',
  order: 50,
  label:       'Derby Sim',
  description: 'Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking.',
  color:       '#f59e0b',   // amber
  status:      'stable',
  genre:       'racing',
  tags:        ['breeding', 'betting'],
  component:   React.lazy(() => import('./App')),
};

export default horseRacingConfig;
