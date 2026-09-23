import React from 'react';
import type { GameConfig } from '../../engine/types';

export const roleSymbolViewerConfig: GameConfig = {
  gameId:      'role_symbol_viewer',
  label:       'Role Symbol Viewer',
  description: 'Preview of the shared person generator v1 — all five archetypal role symbols (ruler, warrior, cleric, merchant, scholar) rendered as native SVG, with deterministic seed-driven variation. A studio tool, not a game.',
  color:       '#f59e0b',
  status:      'tool',
  // No `genre` — a studio sandbox tool, not a game; the taxonomy
  // doesn't apply.
  tags:        ['sandbox-tool', 'svg-preview'],
  component:   React.lazy(() => import('./App')),
};
