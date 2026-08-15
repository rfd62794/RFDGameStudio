/**
 * Humanoid Bilateral Body Plan (upgraded with BoneNode schema)
 *
 * Real, first target — matches Mutant Battle Ball's actual six slots
 * (head, chest, left_arm, right_arm, left_leg, right_leg) and their
 * real gameplay meaning. The attachment graph is a bilateral humanoid:
 *
 *       head
 *        |
 *      chest (root)
 *      /    \
 *  left_arm  right_arm
 *      |
 *  left_leg  right_leg
 *
 * Upgraded to the BoneNode schema (#1) with length, restAngle, side,
 * and region fields for true FK rotation accumulation (#3), painter's
 * algorithm Z-ordering (#5), and biological scaling (#6).
 *
 * RENDERING TECHNIQUE (August 2026 — production winner):
 * Uses the strokeSkeleton primitive — thick stroked paths along each
 * bone segment with round linecaps, plus SDF/smooth-min joint blend
 * circles at shoulders/hips. This replaces the old ellipse/sigmoidBulge
 * fill-primitive approach. The stroke IS the body — no fill-shape math.
 * Joint blend circles merge adjacent stroke segments into one smooth
 * mass at connection points, eliminating visible sharp line junctions.
 */

import type { BodyPlan } from '../types';

export const humanoidBilateral: BodyPlan = {
  id: 'humanoid_bilateral',
  root: 'chest',
  nodes: [
    {
      slot: 'chest',
      parentSlot: null,
      length: 0, // root — uses offset positioning
      restAngle: 0,
      offset: { x: 50, y: 48 },
      angle: 0,
      side: 'center',
      region: 'torso',
    },
    {
      slot: 'head',
      parentSlot: 'chest',
      length: 0, // uses offset positioning
      restAngle: 0,
      offset: { x: 0, y: -30 }, // raised to create neck space
      angle: 0,
      side: 'center',
      region: 'head',
    },
    {
      slot: 'left_arm',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: -16, y: -3 }, // shoulders slightly narrower, hang from shoulder line
      angle: -0.35, // slightly more outward angle for natural hang
      side: 'left',
      region: 'arm',
    },
    {
      slot: 'right_arm',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: 16, y: -3 },
      angle: 0.35,
      side: 'right',
      region: 'arm',
    },
    {
      slot: 'left_leg',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: -8, y: 28 }, // lower for hip joint, narrower stance
      angle: -0.12,
      side: 'left',
      region: 'leg',
    },
    {
      slot: 'right_leg',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: 8, y: 28 },
      angle: 0.12,
      side: 'right',
      region: 'leg',
    },
  ],
  // Back-to-front: legs behind, then arms, then torso, then head on top
  renderOrder: ['left_leg', 'right_leg', 'left_arm', 'right_arm', 'chest', 'head'],
  shapeMappings: [
    // Stroke-skeleton rendering: each part is a stroked line from
    // its parent's position to its own position. widthProximal =
    // stroke width at the joint (thicker), widthDistal = stroke
    // width at the extremity (thinner). jointBlendRadius = radius
    // of the SDF smooth-min blend circle at the connection point.
    {
      slot: 'head',
      primitive: 'strokeSkeleton',
      // Head: stroked circle, widthProximal = radius, widthDistal = stroke width
      baseParams: { widthProximal: 10, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 },
    },
    {
      slot: 'chest',
      primitive: 'strokeSkeleton',
      // Torso: thick stroked vertical line (spine), wider at shoulders
      baseParams: { widthProximal: 20, widthDistal: 14, jointBlendRadius: 12, jointBlendK: 5 },
    },
    {
      slot: 'left_arm',
      primitive: 'strokeSkeleton',
      // Arm: stroked line from shoulder to hand, tapered
      baseParams: { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 },
    },
    {
      slot: 'right_arm',
      primitive: 'strokeSkeleton',
      baseParams: { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 },
    },
    {
      slot: 'left_leg',
      primitive: 'strokeSkeleton',
      // Leg: stroked line from hip to foot, tapered
      baseParams: { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 },
    },
    {
      slot: 'right_leg',
      primitive: 'strokeSkeleton',
      baseParams: { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 },
    },
  ],
};
