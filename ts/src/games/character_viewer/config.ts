import React from 'react';
import type { GameConfig } from '../../engine/types';

export const characterViewerConfig: GameConfig = {
  gameId:      'character_viewer',
  label:       'Character Viewer',
  description: 'Assemble and preview creature designs — live shape controls, side-by-side comparison, and exportable configs. A sandbox tool, not a competitive game.',
  color:       '#a78bfa',
  status:      'tool',
  component:   React.lazy(() => import('./App')),
};
