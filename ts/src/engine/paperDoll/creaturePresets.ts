/**
 * Original Creature Archetype Presets
 *
 * New, original `SlotShapeMapping` + `BodyProportions` presets informed
 * by a visual-language research pass across creature archetype
 * categories. Each preset captures the silhouette and proportion
 * choices that distinguish one archetype at a glance — built entirely
 * from artGen's existing primitives (polygon, radialBurst, teardropFin,
 * irregularFragment, sigmoidBulge) and parameter choices.
 *
 * No SVG file, image asset, or any third-party creative work was
 * downloaded, copied, embedded, or referenced by file from any site
 * on the original reference list. Those sites were visual inspiration
 * only — informing genuinely new, original shape parameters, never
 * sourcing files.
 *
 * Design reasoning (traceable per preset):
 *
 *   insectoid: Angular, segmented, many-parted. radialBurst limbs
 *     read as multi-jointed insect legs; high-vertex polygon head
 *     suggests compound eye facets; irregularFragment chest with
 *     high irregularity reads as chitinous plating. Proportions:
 *     small head, wide shoulders, thin limbs (exoskeleton build).
 *
 *   mammalian: Rounded, bilaterally symmetric, visible muscle.
 *     sigmoidBulge limbs read as organic muscle curves; polygon
 *     head/chest with low irregularity reads as smooth fur/skin.
 *     Proportions: balanced, moderate muscle bulge.
 *
 *   reptilian: Elongated, low-slung, textured. teardropFin limbs
 *     read as splayed reptilian legs; irregularFragment head with
 *     moderate irregularity reads as scaly snout; polygon chest
 *     with high vertex count reads as scaled body. Proportions:
 *     wide hips, thin limbs, low muscle bulge.
 *
 *   avian: Beaked, winged, thin-legged. teardropFin arms read as
 *     wing shapes; low-vertex polygon head reads as beak-like;
 *     thin teardropFin legs read as avian legs. Proportions:
 *     big head, slim everything, very low muscle bulge.
 *
 *   behemoth: Massive, bulky, imposing. sigmoidBulge limbs with
 *     high width read as thick muscle; high-radius polygon chest
 *     reads as massive torso; irregularFragment head with low
 *     irregularity reads as thick-skulled. Proportions: buff,
 *     huge chest, massive limbs.
 *
 *   wraith: Ghostly, fragmented, asymmetric. irregularFragment
 *     for all parts reads as decaying/insubstantial; high
 *     irregularity on every slot reads as torn/dissolving edges.
 *     Proportions: slim, tiny head, very low muscle bulge.
 */

import type { BodyPlan, SlotShapeMapping, BodyProportions } from './types';
import { humanoidBilateral } from './bodyPlans/humanoidBilateral';
import { chimeraAsymmetric } from './bodyPlans/chimeraAsymmetric';

// ── Preset shape mappings (original, per archetype) ─────────────────

export const INSECTOID_SHAPES: SlotShapeMapping[] = [
  // Head: high-vertex polygon → compound eye facet suggestion
  { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 12, irregularity: 25, radius: 12 } },
  // Chest: irregularFragment with high irregularity → chitinous plating
  { slot: 'chest', primitive: 'irregularFragment', baseParams: { vertexCount: 9, irregularity: 70, radius: 19 } },
  // Limbs: radialBurst → multi-jointed insect legs
  { slot: 'left_arm', primitive: 'radialBurst', baseParams: { armCount: 6, radius: 16 } },
  { slot: 'right_arm', primitive: 'radialBurst', baseParams: { armCount: 6, radius: 16 } },
  { slot: 'left_leg', primitive: 'radialBurst', baseParams: { armCount: 5, radius: 14 } },
  { slot: 'right_leg', primitive: 'radialBurst', baseParams: { armCount: 5, radius: 14 } },
];

export const MAMMALIAN_SHAPES: SlotShapeMapping[] = [
  // Head: smooth polygon → rounded mammalian skull
  { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 7, irregularity: 8, radius: 14 } },
  // Chest: smooth polygon → rounded torso
  { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 6, radius: 18 } },
  // Limbs: sigmoidBulge → visible muscle curves
  { slot: 'left_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 14, widthEnd: 7, bulgeFactor: 0.45 } },
  { slot: 'right_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 14, widthEnd: 7, bulgeFactor: 0.45 } },
  { slot: 'left_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: 16, widthEnd: 8, bulgeFactor: 0.4 } },
  { slot: 'right_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: 16, widthEnd: 8, bulgeFactor: 0.4 } },
];

export const REPTILIAN_SHAPES: SlotShapeMapping[] = [
  // Head: irregularFragment with moderate irregularity → scaly snout
  { slot: 'head', primitive: 'irregularFragment', baseParams: { vertexCount: 5, irregularity: 35, radius: 16 } },
  // Chest: high-vertex polygon → scaled body surface
  { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 10, irregularity: 20, radius: 19 } },
  // Limbs: teardropFin → splayed, low-slung reptilian legs
  { slot: 'left_arm', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 40 } },
  { slot: 'right_arm', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 40 } },
  { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.65, angularity: 35 } },
  { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.65, angularity: 35 } },
];

export const AVIAN_SHAPES: SlotShapeMapping[] = [
  // Head: low-vertex polygon → beak-like angular head
  { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 4, irregularity: 5, radius: 13 } },
  // Chest: moderate polygon → feathered body
  { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 7, irregularity: 15, radius: 17 } },
  // Arms: teardropFin → wing shapes
  { slot: 'left_arm', primitive: 'teardropFin', baseParams: { scale: 0.7, angularity: 25 } },
  { slot: 'right_arm', primitive: 'teardropFin', baseParams: { scale: 0.7, angularity: 25 } },
  // Legs: thin teardropFin → avian legs
  { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.35, angularity: 10 } },
  { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.35, angularity: 10 } },
];

export const BEHEMOTH_SHAPES: SlotShapeMapping[] = [
  // Head: irregularFragment with low irregularity → thick-skulled
  { slot: 'head', primitive: 'irregularFragment', baseParams: { vertexCount: 6, irregularity: 20, radius: 17 } },
  // Chest: high-radius polygon → massive torso
  { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 8, radius: 24 } },
  // Limbs: sigmoidBulge with high width → thick muscle
  { slot: 'left_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 22, widthEnd: 12, bulgeFactor: 0.55 } },
  { slot: 'right_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 22, widthEnd: 12, bulgeFactor: 0.55 } },
  { slot: 'left_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: 24, widthEnd: 14, bulgeFactor: 0.5 } },
  { slot: 'right_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: 24, widthEnd: 14, bulgeFactor: 0.5 } },
];

export const WRAITH_SHAPES: SlotShapeMapping[] = [
  // All parts: irregularFragment with high irregularity → decaying/insubstantial
  { slot: 'head', primitive: 'irregularFragment', baseParams: { vertexCount: 8, irregularity: 80, radius: 10 } },
  { slot: 'chest', primitive: 'irregularFragment', baseParams: { vertexCount: 10, irregularity: 75, radius: 16 } },
  { slot: 'left_arm', primitive: 'irregularFragment', baseParams: { vertexCount: 6, irregularity: 85, radius: 12 } },
  { slot: 'right_arm', primitive: 'irregularFragment', baseParams: { vertexCount: 7, irregularity: 85, radius: 12 } },
  { slot: 'left_leg', primitive: 'irregularFragment', baseParams: { vertexCount: 6, irregularity: 80, radius: 11 } },
  { slot: 'right_leg', primitive: 'irregularFragment', baseParams: { vertexCount: 7, irregularity: 80, radius: 11 } },
];

// ── Preset proportions (original, per archetype) ────────────────────

export const INSECTOID_PROPORTIONS: BodyProportions = {
  headSize: 0.8,
  neckWidth: 0.7,
  shoulderWidth: 1.3,
  chestWidth: 1.1,
  waistWidth: 0.8,
  hipWidth: 1.0,
  upperArmWidth: 0.7,
  forearmWidth: 0.6,
  handSize: 0.6,
  thighWidth: 0.7,
  calfWidth: 0.6,
  footSize: 0.5,
  muscleBulge: 0.3, // exoskeleton — no visible muscle
  name: 'Insectoid',
};

export const MAMMALIAN_PROPORTIONS: BodyProportions = {
  headSize: 1.0,
  neckWidth: 1.0,
  shoulderWidth: 1.0,
  chestWidth: 1.0,
  waistWidth: 0.9,
  hipWidth: 1.0,
  upperArmWidth: 1.0,
  forearmWidth: 0.9,
  handSize: 1.0,
  thighWidth: 1.0,
  calfWidth: 0.9,
  footSize: 1.0,
  muscleBulge: 1.0, // moderate visible muscle
  name: 'Mammalian',
};

export const REPTILIAN_PROPORTIONS: BodyProportions = {
  headSize: 0.9,
  neckWidth: 0.8,
  shoulderWidth: 0.9,
  chestWidth: 0.95,
  waistWidth: 0.8,
  hipWidth: 1.2, // wide hips — low-slung stance
  upperArmWidth: 0.8,
  forearmWidth: 0.7,
  handSize: 0.7,
  thighWidth: 0.8,
  calfWidth: 0.7,
  footSize: 0.8,
  muscleBulge: 0.4, // low muscle — lean reptile
  name: 'Reptilian',
};

export const AVIAN_PROPORTIONS: BodyProportions = {
  headSize: 1.2, // big head relative to body
  neckWidth: 0.7,
  shoulderWidth: 0.9,
  chestWidth: 0.85,
  waistWidth: 0.7,
  hipWidth: 0.8,
  upperArmWidth: 0.8,
  forearmWidth: 0.7,
  handSize: 0.6,
  thighWidth: 0.6,
  calfWidth: 0.5,
  footSize: 0.7,
  muscleBulge: 0.2, // very low muscle — hollow bones
  name: 'Avian',
};

export const BEHEMOTH_PROPORTIONS: BodyProportions = {
  headSize: 1.1,
  neckWidth: 1.3,
  shoulderWidth: 1.5, // massive shoulders
  chestWidth: 1.4,
  waistWidth: 1.2,
  hipWidth: 1.3,
  upperArmWidth: 1.5,
  forearmWidth: 1.3,
  handSize: 1.4,
  thighWidth: 1.5,
  calfWidth: 1.3,
  footSize: 1.4,
  muscleBulge: 1.6, // huge muscle bulge
  name: 'Behemoth',
};

export const WRAITH_PROPORTIONS: BodyProportions = {
  headSize: 0.6, // tiny head
  neckWidth: 0.5,
  shoulderWidth: 0.8,
  chestWidth: 0.75,
  waistWidth: 0.6,
  hipWidth: 0.7,
  upperArmWidth: 0.7,
  forearmWidth: 0.6,
  handSize: 0.8, // long hands
  thighWidth: 0.65,
  calfWidth: 0.55,
  footSize: 0.6,
  muscleBulge: 0.1, // almost no muscle — spectral
  name: 'Wraith',
};

// ── Preset registry ─────────────────────────────────────────────────

export interface CreaturePreset {
  id: string;
  name: string;
  description: string;
  shapes: SlotShapeMapping[];
  proportions: BodyProportions;
  bodyPlan: BodyPlan;
  referenceCategory: string; // traceable design reasoning
}

export const CREATURE_PRESETS: CreaturePreset[] = [
  {
    id: 'insectoid',
    name: 'Insectoid',
    description: 'Angular, segmented, multi-jointed — exoskeleton build',
    shapes: INSECTOID_SHAPES,
    proportions: INSECTOID_PROPORTIONS,
    bodyPlan: humanoidBilateral,
    referenceCategory: 'insect/arthropod silhouette study — angular, radial, many-parted',
  },
  {
    id: 'mammalian',
    name: 'Mammalian',
    description: 'Rounded, bilaterally symmetric, visible muscle curves',
    shapes: MAMMALIAN_SHAPES,
    proportions: MAMMALIAN_PROPORTIONS,
    bodyPlan: humanoidBilateral,
    referenceCategory: 'mammal silhouette study — smooth, muscular, balanced',
  },
  {
    id: 'reptilian',
    name: 'Reptilian',
    description: 'Elongated, low-slung, textured — splayed stance',
    shapes: REPTILIAN_SHAPES,
    proportions: REPTILIAN_PROPORTIONS,
    bodyPlan: humanoidBilateral,
    referenceCategory: 'reptile silhouette study — elongated, scaly, low',
  },
  {
    id: 'avian',
    name: 'Avian',
    description: 'Beaked, winged, thin-legged — hollow-bone build',
    shapes: AVIAN_SHAPES,
    proportions: AVIAN_PROPORTIONS,
    bodyPlan: humanoidBilateral,
    referenceCategory: 'bird silhouette study — winged, thin, light',
  },
  {
    id: 'behemoth',
    name: 'Behemoth',
    description: 'Massive, bulky, imposing — thick muscle and bone',
    shapes: BEHEMOTH_SHAPES,
    proportions: BEHEMOTH_PROPORTIONS,
    bodyPlan: humanoidBilateral,
    referenceCategory: 'large mammal/mythical beast silhouette study — massive, imposing',
  },
  {
    id: 'wraith',
    name: 'Wraith',
    description: 'Ghostly, fragmented, asymmetric — decaying edges',
    shapes: WRAITH_SHAPES,
    proportions: WRAITH_PROPORTIONS,
    bodyPlan: chimeraAsymmetric, // asymmetric body plan suits the decaying look
    referenceCategory: 'ghostly/undead silhouette study — fragmented, insubstantial',
  },
];

export function getCreaturePreset(id: string): CreaturePreset | undefined {
  return CREATURE_PRESETS.find(p => p.id === id);
}

export const CREATURE_PRESET_IDS = CREATURE_PRESETS.map(p => p.id);
