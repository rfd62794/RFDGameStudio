import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'shoal',
  label: 'Shoal',
  description: 'A continuous steering-based reef ecosystem — fish graze, sharks hunt, and algae rises and sinks with the pressure of grazing.',
  color: '#3b82f6',
  status: 'stable',
  // No `genre` — genuinely doesn't fit the curated 11-value taxonomy.
  // Shoal is a continuous, no-player-agency ecosystem simulation
  // (watch, not manage) — none of management-sim/idle-incremental/
  // colony-4x honestly describe it. Reported as a real taxonomy gap
  // per the Arcade Metadata Expansion directive rather than forced.
  tags: ['ecosystem-sim', 'steering-based'],
  component: React.lazy(() => import('./App')),
};

export default config;
