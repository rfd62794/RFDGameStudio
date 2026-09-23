import React from 'react';
import type { GameConfig } from '../../engine/types';

// Deliberately NOT imported in registry.ts — this is a full, working project
// that exists in the repo but is intentionally unlisted from the public arcade.
// It is reachable directly via its lazy-loaded component but not surfaced in
// the game selector UI.
const config: GameConfig = {
  gameId: 'early_learning_buddy',
  label: 'Early Learning Buddy',
  description: 'A voice-powered learning companion for young learners — practice letters, numbers, and words with speech recognition, fuzzy matching, and AI-generated story beats.',
  color: '#f59e0b',
  status: 'dev',
  component: React.lazy(() => import('./App')),
};

export default config;
