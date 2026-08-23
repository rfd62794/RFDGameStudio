import React from 'react';
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'succession',
  label: 'Succession',
  description: 'A persuasion and court-intrigue sim — whisper rumors, present evidence, and deliver indictments to sway court figures. Rival AI counters your moves, contradictions expose lies, and your origin shapes the epilogue.',
  shortDescription: 'Whisper rumors, present evidence, and deliver indictments to sway court figures against a rival AI.',
  longDescription: 'A persuasion and court-intrigue sim — whisper rumors, present evidence, and deliver indictments to sway court figures. Rival AI counters your moves with value-aware theme selection, contradictions expose lies via diminishing returns on repeated claims, and your origin (bastard scion, disgraced knight, merchant banker) shapes both your starting economics and the epilogue. Real, measured balance work across three origins ensures every origin has genuine wins and losses.',
  color: '#a78bfa',
  status: 'dev',
  genre: 'narrative-persuasion',
  tags: ['court-intrigue', 'rival-ai'],
  patchNotesPath: 'succession/PATCH_NOTES_v0.2.0.md',
  component: React.lazy(() => import('./App')),
};

export default config;
