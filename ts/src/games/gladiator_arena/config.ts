import React from 'react';
import type { GameConfig } from '../../engine/types';

export const gladiatorArenaConfig: GameConfig = {
  gameId:      'gladiator_arena',
  order: 240,
  moreGames: true,
  label:       'Gladiator Arena',
  description: 'Build cyber-organic gladiator frames, manage your roster and climb a five-tier champion ladder. You never swing the sword: you decide what it is attached to. Bouts play out on their own, with real wounds, repairs and a rematch always waiting.',
  color:       '#f59e0b',
  status:      'dev',
  genre:       'combat-arena',
  tags:        ['roster-management', 'tactical-combat'],
  component:   React.lazy(() => import('./App')),
};

export default gladiatorArenaConfig;
