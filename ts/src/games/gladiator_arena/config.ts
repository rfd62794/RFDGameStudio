import React from 'react';
import type { GameConfig } from '../../engine/types';

export const gladiatorArenaConfig: GameConfig = {
  gameId:      'gladiator_arena',
  label:       'Gladiator Arena',
  description: 'Assemble cyber-organic gladiator frames. Manage your roster across a 5-tier champion ladder. Turn-based tactical combat with continuous anatomy damage, Blood Bowl recoil, and agent-driven decision AI.',
  color:       '#f59e0b',
  status:      'dev',
  component:   React.lazy(() => import('./App')),
};
