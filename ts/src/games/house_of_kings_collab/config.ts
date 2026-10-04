import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'house_of_kings_collab',
  order: 280,
  moreGames: true,
  label: 'House of Kings: Collab',
  description: 'Architecture showcase, not a hosted game: a server-authoritative kingdom builder on Firebase, with daily server-side evaluation and festivals. Google sign-in is required to play, and it needs its own backend, so you may only see the sign-in screen.',
  color: '#f59e0b',
  status: 'dev',
  genre: 'cooperative',
  tags: ['kingdom-management', 'firebase-backed'],
  component: React.lazy(() => import('./App')),
};

export default config;
