import React from 'react';
import type { GameConfig } from '../../engine/types';

export const chokePointConfig: GameConfig = {
  gameId: 'choke_point',
  label: 'Choke Point',
  description: 'Turn-based tactical grid defense. Preview enemy movement and attacks, and deploy perfect blockers.',
  color: '#f87171',
  status: 'dev',
  genre: 'tower-defense',
  tags: ['turn-based', 'tactical'],
  component: React.lazy(() => import('./App')),
};
