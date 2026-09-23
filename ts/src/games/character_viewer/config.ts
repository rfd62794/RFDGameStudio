import React from 'react';
import type { GameConfig } from '../../engine/types';

export const characterViewerConfig: GameConfig = {
  gameId:      'character_viewer',
  label:       'Character Viewer',
  description: 'Assemble and preview creature designs — live shape controls, side-by-side comparison, and exportable configs. A sandbox tool, not a competitive game.',
  color:       '#a78bfa',
  status:      'tool',
  // No `genre` — a studio sandbox tool, not a game; the taxonomy
  // doesn't apply.
  tags:        ['sandbox-tool', 'creature-design'],
  component:   React.lazy(() => import('./App')),
};
