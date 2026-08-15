/**
 * Humanoid Bilateral Body Plan
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
 * Offsets are in the figure's local coordinate space (0-100 viewBox).
 * The root (chest) is at center. Head is above. Arms are to the sides.
 * Legs are below.
 */

import type { BodyPlan } from '../types';

export const humanoidBilateral: BodyPlan = {
  id: 'humanoid_bilateral',
  root: 'chest',
  nodes: [
    {
      slot: 'chest',
      parentSlot: null,
      offset: { x: 50, y: 50 },
      angle: 0,
    },
    {
      slot: 'head',
      parentSlot: 'chest',
      offset: { x: 0, y: -22 },
      angle: 0,
    },
    {
      slot: 'left_arm',
      parentSlot: 'chest',
      offset: { x: -18, y: -5 },
      angle: -0.3, // slight outward angle
    },
    {
      slot: 'right_arm',
      parentSlot: 'chest',
      offset: { x: 18, y: -5 },
      angle: 0.3,
    },
    {
      slot: 'left_leg',
      parentSlot: 'chest',
      offset: { x: -10, y: 20 },
      angle: -0.15,
    },
    {
      slot: 'right_leg',
      parentSlot: 'chest',
      offset: { x: 10, y: 20 },
      angle: 0.15,
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
