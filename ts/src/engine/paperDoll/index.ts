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
 *
 * Upgraded patterns (August 2026, ported from ChimeraLab):
 *   #1 SkeletonManifest data shape (BoneNode schema)
 *   #2 BodyProportions (12 multipliers + 8 presets)
 *   #3 True FK rotation accumulation
 *   #4 Hierarchical color resolution
 *   #5 Painter's algorithm Z-ordering
 *   #6 Biological scaling formulas
 *   #7 Sigmoid muscle bulge shape
 *   #8 Posture-blend interpolation
 */

export type {
  BoneNode,
  AttachmentNode,
  BodyPlan,
  SlotShapeMapping,
  BodyProportions,
  ColorGenetics,
  ResolvedAttachment,
  ComposedPart,
  CompositionInput,
  PartForComposition,
} from './types';

export { BIOLOGICAL_SCALING } from './types';
export { resolveAttachments } from './attachmentGraph';
export { composeFigure, renderFigureSvg } from './composer';
export { humanoidBilateral } from './bodyPlans/humanoidBilateral';
export { chimeraAsymmetric } from './bodyPlans/chimeraAsymmetric';

// #2: BodyProportions presets
export {
  PROPORTION_PRESETS,
  PROPORTION_PRESET_ORDER,
  getProportionPreset,
  getNextProportionPreset,
  NORMAL_PROPORTIONS,
} from './proportionPresets';

// #4: Hierarchical color resolution
export {
  resolveColor,
  getColorForPart,
  DEFAULT_COLOR_GENETICS,
  blendColors,
  lightenColor,
  darkenColor,
} from './colorResolution';

// Technique study (August 2026, from DiceBear + boring-avatars)
export {
  getDigit,
  getBoolean,
  getUnit,
  getContrastColor,
  fnv1aHash,
  getDeterministicValue,
  weightedPick,
} from './techniqueUtils';

// Original creature archetype presets (from style reference pass)
export {
  CREATURE_PRESETS,
  CREATURE_PRESET_IDS,
  getCreaturePreset,
  type CreaturePreset,
} from './creaturePresets';
