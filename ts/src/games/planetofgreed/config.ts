import React from 'react';
import type { GameConfig } from '../../engine/types';

export const planetofgreedConfig: GameConfig = {
  gameId: 'planetofgreed',
  label: 'Planet of Greed',
  description: 'A cold-corporate land-grab on a newly-discovered planet — Voronoi-tessellated territory, six-culture wheel politics, deterministic Circle/Square/Triangle combat with elimination-transfer fragment system. Forked from CorpWorld with wheel-aware AI bias and Rank-1 ending trigger.',
  color: '#ef4444',
  status: 'dev',
  component: React.lazy(() => import('./App')),
};
