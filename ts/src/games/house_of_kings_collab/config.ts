import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'house_of_kings_collab',
  label: 'House of Kings: Collab',
  description: 'A server-authoritative collaborative kingdom management game with Firebase backend — duration-based task tiers, exponential economy, house festivals, and real-time Firestore sync. Zero-trust client security with server-side Admin SDK writes.',
  color: '#f59e0b',
  status: 'dev',
  genre: 'cooperative',
  tags: ['kingdom-management', 'firebase-backed'],
  component: React.lazy(() => import('./App')),
};

export default config;
