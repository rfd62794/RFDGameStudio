import React from 'react';
import type { GameConfig } from '../../engine/types';

export const mutantBattleBallConfig: GameConfig = {
  gameId:      'mutant_battle_ball',
  label:       'Mutant Battle Ball',
  description: 'Assemble mutants from parts. Field a 2v2 squad. Reach the end zone. Salvage the fallen.',
  color:       '#f87171',
  status:      'dev',
  component:   React.lazy(() => import('./App')),
};
