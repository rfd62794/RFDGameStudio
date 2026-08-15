import React from 'react';
import type { GameRendererProps } from '../../engine/types';
import TechniqueShowcase from '../../standalone/technique_showcase/TechniqueShowcase';

/**
 * Arcade wrapper for the Technique Showcase.
 *
 * The real tool lives at ts/src/standalone/technique_showcase/TechniqueShowcase.tsx
 * and renders all Paper Doll techniques side by side through the real
 * production composer with per-panel interactive controls.
 */
export default function TechniqueShowcaseApp(_props: GameRendererProps): React.ReactElement {
  return <TechniqueShowcase />;
}
