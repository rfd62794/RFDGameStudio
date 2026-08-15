import React from 'react';
import type { GameConfig } from '../../engine/types';

export const techniqueShowcaseConfig: GameConfig = {
  gameId:      'technique_showcase',
  label:       'Technique Showcase',
  description: 'Side-by-side comparison of all Paper Doll rendering techniques through the real production composer. Each technique is an independent panel with its own sliders and color controls.',
  color:       '#10b981',
  status:      'tool',
  component:   React.lazy(() => import('./App')),
};
