import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'voidrift_particle_sandbox',
  order: 260,
  source: { kind: 'example', slug: 'voidrift-redux-particle-sandbox' },
  label: 'VoidRift Particle Sandbox',
  description: 'Cellular-automata material sandbox and factory builder on a 64,000-cell grid — catch asteroid debris with collectors, pipe it through processors, and climb four tiers to the Reconstruction finale.',
  color: '#7ab8d4',
  status: 'dev',
  tags: ['cellular-automata', 'factory', 'sandbox'],
  component: React.lazy(() => import('./App')),
};

export default config;
