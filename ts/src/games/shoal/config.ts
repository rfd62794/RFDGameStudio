import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'shoal',
  label: 'Shoal',
  description: 'A continuous steering-based reef ecosystem — fish graze, sharks hunt, and algae rises and sinks with the pressure of grazing.',
  color: '#3b82f6',
  status: 'stable',
  component: React.lazy(() => import('./App')),
};

export default config;
