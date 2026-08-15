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
      primitive: 'ellipse',
      // rx 7, ry 8: slightly taller than wide (human head is oval)
      // After torsoHead scaling (1.2x): effective rx=8.4, ry=9.6
      baseParams: { rx: 7, ry: 8 },
    },
    {
      slot: 'chest',
      primitive: 'sigmoidBulge',
      // Chest as a wide, short sigmoid bulge — shoulders wider than waist
      // widthStart (shoulders) > widthEnd (waist) creates torso taper
      // After torsoChest scaling (1.6x): effective 28.8 → 14.4
      baseParams: { widthStart: 18, widthEnd: 9, segments: 8, bulgeFactor: 0.3 },
    },
    {
      slot: 'left_arm',
      primitive: 'sigmoidBulge',
      // Arm as a tapered limb: wider at shoulder, narrower at wrist
      // After Kleiber (0.855) + jointBuffer (1.3): widthStart ≈ 11.1
      // After Kleiber (0.855) + limbEndTaper (0.55): widthEnd ≈ 3.8
      baseParams: { widthStart: 10, widthEnd: 8, segments: 6, bulgeFactor: 0.4 },
    },
    {
      slot: 'right_arm',
      primitive: 'sigmoidBulge',
      baseParams: { widthStart: 10, widthEnd: 8, segments: 6, bulgeFactor: 0.4 },
    },
    {
      slot: 'left_leg',
      primitive: 'sigmoidBulge',
      // Leg as a tapered limb: wider at hip, narrower at ankle
      // After Kleiber (1.319) + jointBuffer (1.3): widthStart ≈ 18.8
      // After Kleiber (1.319) + limbEndTaper (0.55): widthEnd ≈ 7.3
      baseParams: { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 },
    },
    {
      slot: 'right_leg',
      primitive: 'sigmoidBulge',
      baseParams: { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 },
    },
  ],
};
