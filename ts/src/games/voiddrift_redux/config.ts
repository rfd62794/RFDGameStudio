import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'voiddrift_redux',
  label: 'VoidDrift Redux',
  description: 'A TS-native reimagining of the Rust/Bevy VoidDrift — idle space mining at the edge of a black hole. Real Mining/Hauler FSM states, the Aluminum/H3Gas resource chain, tap-to-dispatch interaction, and fragment-drift orbital simulation.',
  color: '#22d3ee',
  status: 'dev',
  component: React.lazy(() => import('./App')),
};

export default config;
