/**
 * Paper Doll / Composite Character Rendering Module
 *
 * Composes independent body-part shapes into one correctly-layered
 * figure, styled from artGen's existing shape primitives.
 *
 * Two real consumers:
 *   - Mutant Battle Ball: roster cards, match view, Workshop/Shop tabs
 *   - Chimera Wilds: encounter view chimera figure
 *
 * Usage:
 *   import { renderFigureSvg, humanoidBilateral } from '../engine/paperDoll';
 *   const svg = renderFigureSvg({
 *     bodyPlan: humanoidBilateral,
 *     parts: mutant.parts,  // Record<slot, Part | null>
 *     colors: { head: '#3b82f6', chest: '#3b82f6', ... },
 *     seed: 42,
 *   });
 */

export type {
  AttachmentNode,
  BodyPlan,
  SlotShapeMapping,
  ResolvedAttachment,
  ComposedPart,
  CompositionInput,
  PartForComposition,
} from './types';

export { resolveAttachments } from './attachmentGraph';
export { composeFigure, renderFigureSvg } from './composer';
export { humanoidBilateral } from './bodyPlans/humanoidBilateral';
export { chimeraAsymmetric } from './bodyPlans/chimeraAsymmetric';
