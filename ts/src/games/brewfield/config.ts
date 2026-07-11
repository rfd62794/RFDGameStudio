import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'brewfield',
  label: 'Brewfield',
  description: 'A turn-based potions-brewing roguelike — Element × Component combinations, a living Residue field, Wa-Tor-inspired trophic chemistry.',
  color: '#84cc16',
  status: 'stable',
  component: React.lazy(() => import('./App')),
};

export default config;
