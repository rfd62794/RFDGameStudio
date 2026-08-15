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
 * The offset fields are retained (length=0) for backward compatibility
 * — existing consumers that pass CompositionInput without the new
 * optional fields get the same visual result as before.
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
    {
      slot: 'head',
      primitive: 'polygon',
      // radius 7: head is ~1/5 of body height (stylized human ratio)
      // After torsoHead scaling (1.2x): effective radius = 8.4
      baseParams: { vertexCount: 7, irregularity: 8, radius: 7 },
    },
    {
      slot: 'chest',
      primitive: 'polygon',
      // radius 11: shoulders ~2x head width (standard human ratio)
      // After torsoChest scaling (1.6x): effective radius = 17.6
      baseParams: { vertexCount: 6, irregularity: 8, radius: 11 },
    },
    {
      slot: 'left_arm',
      primitive: 'teardropFin',
      // scale 0.65: after Kleiber (0.855) + joint/taper (0.925) = 0.514 effective
      // Arm length ~3.5 head heights (standard human)
      baseParams: { scale: 0.65, angularity: 25 },
    },
    {
      slot: 'right_arm',
      primitive: 'teardropFin',
      baseParams: { scale: 0.65, angularity: 25 },
    },
    {
      slot: 'left_leg',
      primitive: 'teardropFin',
      // scale 0.50: after Kleiber (1.319) + joint/taper (0.925) = 0.610 effective
      // Leg length ~4 head heights (standard human)
      baseParams: { scale: 0.50, angularity: 18 },
    },
    {
      slot: 'right_leg',
      primitive: 'teardropFin',
      baseParams: { scale: 0.50, angularity: 18 },
    },
  ],
};
