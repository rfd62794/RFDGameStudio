/**
 * Chimera Asymmetric Body Plan (upgraded with BoneNode schema)
 *
 * Real, second target — for Chimera Wilds' randomly-assembled, less-
 * uniform six-part figures. Same six slots as humanoid_bilateral, but
 * wired into a more creature-like, less bilaterally-symmetric
 * arrangement:
 *
 *   - Head is offset to one side (predator lean)
 *   - Arms are at different heights (asymmetric limbs)
 *   - Legs are splayed wider (creature stance)
 *   - Rougher shape primitives (irregularFragment, radialBurst) instead
 *     of the cleaner polygon/teardropFin used for humanoids
 *
 * Upgraded to the BoneNode schema (#1) with length, restAngle, side,
 * and region fields for true FK rotation accumulation (#3), painter's
 * algorithm Z-ordering (#5), and biological scaling (#6).
 *
 * The underlying composition engine is identical — only the data
 * (BodyPlan) changes. This is the real reuse pattern.
 */

import type { BodyPlan } from '../types';

export const chimeraAsymmetric: BodyPlan = {
  id: 'chimera_asymmetric',
  root: 'chest',
  nodes: [
    {
      slot: 'chest',
      parentSlot: null,
      length: 0,
      restAngle: 0,
      offset: { x: 50, y: 52 },
      angle: 0,
      side: 'center',
      region: 'torso',
    },
    {
      slot: 'head',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: 8, y: -20 }, // offset right — predator lean
      angle: 0.25,
      side: 'center',
      region: 'head',
    },
    {
      slot: 'left_arm',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: -20, y: -8 },
      angle: -0.5, // wider outward angle
      side: 'left',
      region: 'arm',
    },
    {
      slot: 'right_arm',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: 16, y: 2 }, // lower than left — asymmetric
      angle: 0.6,
      side: 'right',
      region: 'arm',
    },
    {
      slot: 'left_leg',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: -14, y: 22 },
      angle: -0.35, // splayed wider
      side: 'left',
      region: 'leg',
    },
    {
      slot: 'right_leg',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: 14, y: 22 },
      angle: 0.35,
      side: 'right',
      region: 'leg',
    },
  ],
  // Back-to-front: legs behind, then arms, then torso, then head
  renderOrder: ['left_leg', 'right_leg', 'left_arm', 'right_arm', 'chest', 'head'],
  shapeMappings: [
    {
      slot: 'head',
      primitive: 'irregularFragment', // rougher, more creature-like
      baseParams: { vertexCount: 7, irregularity: 50, radius: 15 },
    },
    {
      slot: 'chest',
      primitive: 'irregularFragment',
      baseParams: { vertexCount: 8, irregularity: 40, radius: 20 },
    },
    {
      slot: 'left_arm',
      primitive: 'radialBurst', // spiky, organic limbs
      baseParams: { armCount: 4, radius: 18 },
    },
    {
      slot: 'right_arm',
      primitive: 'radialBurst',
      baseParams: { armCount: 5, radius: 20 }, // different arm count — asymmetric
    },
    {
      slot: 'left_leg',
      primitive: 'irregularFragment',
      baseParams: { vertexCount: 6, irregularity: 55, radius: 16 },
    },
    {
      slot: 'right_leg',
      primitive: 'irregularFragment',
      baseParams: { vertexCount: 7, irregularity: 65, radius: 18 }, // rougher
    },
  ],
};
