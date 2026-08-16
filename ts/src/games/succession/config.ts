import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'succession',
  label: 'Succession',
  description: 'A persuasion and court-intrigue sim — whisper rumors, present evidence, and deliver indictments to sway court figures. Rival AI counters your moves, contradictions expose lies, and your origin shapes the epilogue.',
  color: '#a78bfa',
  status: 'dev',
  component: React.lazy(() => import('./App')),
};

export default config;
