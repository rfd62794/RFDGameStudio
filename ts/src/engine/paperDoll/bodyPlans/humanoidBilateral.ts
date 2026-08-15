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
      offset: { x: 50, y: 50 },
      angle: 0,
      side: 'center',
      region: 'torso',
    },
    {
      slot: 'head',
      parentSlot: 'chest',
      length: 0, // uses offset positioning
      restAngle: 0,
      offset: { x: 0, y: -22 },
      angle: 0,
      side: 'center',
      region: 'head',
    },
    {
      slot: 'left_arm',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: -18, y: -5 },
      angle: -0.3, // slight outward angle
      side: 'left',
      region: 'arm',
    },
    {
      slot: 'right_arm',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: 18, y: -5 },
      angle: 0.3,
      side: 'right',
      region: 'arm',
    },
    {
      slot: 'left_leg',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: -10, y: 20 },
      angle: -0.15,
      side: 'left',
      region: 'leg',
    },
    {
      slot: 'right_leg',
      parentSlot: 'chest',
      length: 0,
      restAngle: 0,
      offset: { x: 10, y: 20 },
      angle: 0.15,
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
      baseParams: { vertexCount: 8, irregularity: 15, radius: 14 },
    },
    {
      slot: 'chest',
      primitive: 'polygon',
      baseParams: { vertexCount: 6, irregularity: 10, radius: 18 },
    },
    {
      slot: 'left_arm',
      primitive: 'teardropFin',
      baseParams: { scale: 0.5, angularity: 20 },
    },
    {
      slot: 'right_arm',
      primitive: 'teardropFin',
      baseParams: { scale: 0.5, angularity: 20 },
    },
    {
      slot: 'left_leg',
      primitive: 'teardropFin',
      baseParams: { scale: 0.55, angularity: 15 },
    },
    {
      slot: 'right_leg',
      primitive: 'teardropFin',
      baseParams: { scale: 0.55, angularity: 15 },
    },
  ],
};
