import React from 'react';
import type { GameRendererProps } from '../../engine/types';
import CharacterViewer from '../../standalone/character_viewer/CharacterViewer';

/**
 * Arcade wrapper for the Character Viewer.
 *
 * The real tool lives at ts/src/standalone/character_viewer/CharacterViewer.tsx
 * and remains fully intact and reachable via its original dev-only path:
 *   http://localhost:5173/src/standalone/character_viewer/index.html
 *
 * This wrapper exists solely to bridge the arcade's GameRendererProps
 * contract (which requires a `session` prop) to the viewer's no-props
 * signature. It does not modify the viewer's functionality.
 */
export default function CharacterViewerApp(_props: GameRendererProps): React.ReactElement {
  return <CharacterViewer />;
}
