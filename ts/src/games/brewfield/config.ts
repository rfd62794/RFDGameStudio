import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'brewfield',
  label: 'Brewfield',
  description: 'A turn-based potions-brewing roguelike — Element × Component combinations, a living Residue field, Wa-Tor-inspired trophic chemistry.',
  color: '#84cc16',
  // RETIRED 2026-09-20, confirmed by Robert: superseded by Dissonance Depths,
  // source kept read-only. This said 'stable' for a month after
  // docs/state/StatusBoard.md recorded the retirement, which is how a retired
  // game stayed listed as publishable.
  status: 'retired',
  component: React.lazy(() => import('./App')),
};

export default config;
