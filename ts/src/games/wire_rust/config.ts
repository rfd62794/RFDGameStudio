import React from 'react';
import type { GameConfig } from '../../engine/types';

export const wire_rustConfig: GameConfig = {
  gameId: 'wire_rust',
  order: 110,
  label: 'Wire & Rust',
  description: 'Turn-based deck builder with component chemistry reskinned as scrap-part synergies.',
  color: '#e0f2fe',
  status: 'dev',
  genre: 'roguelike',
  tags: ['deck-building', 'chemistry'],
  component: React.lazy(() => import('./App')),
};

export default wire_rustConfig;
