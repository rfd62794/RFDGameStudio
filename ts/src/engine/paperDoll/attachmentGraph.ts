/**
 * Attachment Graph Resolver (upgraded with true FK rotation accumulation)
 *
 * Resolves a BodyPlan's parent-child bone hierarchy into absolute
 * per-slot positions and angles.
 *
 * #3: True FK rotation accumulation (from fk_solver.py)
 *   Replaces the previous position-only offset rotation with the real
 *   formula: childPos = parentPos + (cos(restAngle + accumulatedAngle)
 *   * length, sin(...) * length). When a BoneNode has length > 0, the
 *   FK solver uses this formula. When length is 0, it falls back to
 *   the offset-based resolution for backward compatibility.
 *
 * #2: BodyProportions scaling
 *   Applies per-region proportion multipliers to offsets/lengths before
 *   resolution.
 *
 * #8: Posture-blend interpolation (from skeleton_presets.py)
 *   LERPs resolved positions between two BodyPlans based on postureWeight.
 */

import type { PartSlot } from '../shared/partSlots';
import type {
  BoneNode,
  BodyPlan,
  BodyProportions,
  ResolvedAttachment,
} from './types';

// ── #2: Proportion multipliers per slot ─────────────────────────────
//
// Maps each slot to the relevant BodyProportions multiplier.

function getProportionMultiplier(slot: PartSlot, proportions: BodyProportions): number {
  switch (slot) {
    case 'head': return proportions.headSize;
    case 'chest': return proportions.chestWidth;
    case 'left_arm': return proportions.upperArmWidth;
    case 'right_arm': return proportions.upperArmWidth;
    case 'left_leg': return proportions.thighWidth;
    case 'right_leg': return proportions.thighWidth;
    default: return 1.0;
  }
}

// ── #8: LERP utilities (from skeleton_presets.py) ───────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Main resolver ────────────────────────────────────────────────────

/**
 * Resolve all attachments in a BodyPlan to absolute positions/angles.
 *
 * Uses true FK rotation accumulation (#3) when BoneNode.length > 0:
 *   childPos = parentPos + (cos(restAngle + accumulated) * length,
 *                            sin(restAngle + accumulated) * length)
 *
 * Falls back to offset-based resolution when length is 0 (backward
 * compatibility with existing body plans that use explicit offsets).
 *
 * @param bodyPlan The body plan to resolve
 * @param proportions Optional BodyProportions for per-region scaling (#2)
 * @param postureWeight Optional 0-1 blend weight (#8)
 * @param blendPlan Optional second body plan for posture blending (#8)
 * @returns Array of resolved attachments, one per slot, with zOrder
 */
export function resolveAttachments(
  bodyPlan: BodyPlan,
  proportions?: BodyProportions,
  postureWeight?: number,
  blendPlan?: BodyPlan,
): ResolvedAttachment[] {
  // #8: If posture blending is requested, resolve both plans and LERP
  if (blendPlan && postureWeight !== undefined && postureWeight > 0 && postureWeight < 1) {
    const resolvedA = resolveSinglePlan(bodyPlan, proportions);
    const resolvedB = resolveSinglePlan(blendPlan, proportions);
    return blendResolved(resolvedA, resolvedB, postureWeight, bodyPlan.renderOrder);
  }
  // At postureWeight = 0, use bodyPlan; at 1, use blendPlan
  const activePlan = (blendPlan && postureWeight === 1) ? blendPlan : bodyPlan;
  return resolveSinglePlan(activePlan, proportions);
}

function resolveSinglePlan(
  bodyPlan: BodyPlan,
  proportions?: BodyProportions,
): ResolvedAttachment[] {
  const nodeMap = new Map<PartSlot, BoneNode>();
  for (const node of bodyPlan.nodes) {
    nodeMap.set(node.slot, node);
  }

  const resolved = new Map<PartSlot, ResolvedAttachment>();
  const queue: PartSlot[] = [bodyPlan.root];

  // Resolve root first
  const rootNode = nodeMap.get(bodyPlan.root)!;
  const rootPropMult = proportions ? getProportionMultiplier(bodyPlan.root, proportions) : 1.0;
  resolved.set(bodyPlan.root, {
    slot: bodyPlan.root,
    x: rootNode.offset.x * rootPropMult,
    y: rootNode.offset.y * rootPropMult,
    angle: rootNode.restAngle + rootNode.angle,
    zOrder: bodyPlan.renderOrder.indexOf(bodyPlan.root),
    side: rootNode.side,
    region: rootNode.region,
  });

  // BFS through the graph
  while (queue.length > 0) {
    const currentSlot = queue.shift()!;
    const parentResolved = resolved.get(currentSlot)!;

    // Find all children of this node
    for (const node of bodyPlan.nodes) {
      if (node.parentSlot === currentSlot && !resolved.has(node.slot)) {
        const propMult = proportions ? getProportionMultiplier(node.slot, proportions) : 1.0;

        // #3: True FK rotation accumulation
        // When length > 0, use the real FK formula from fk_solver.py:
        //   finalAngle = restAngle + accumulatedRotation
        //   childPos = parentPos + (cos(finalAngle) * length,
        //                            sin(finalAngle) * length)
        //
        // When length is 0, fall back to offset-based resolution
        // (rotate offset by parent's angle, add parent position).
        let absX: number;
        let absY: number;
        let absAngle: number;

        const accumulatedRotation = parentResolved.angle;
        const localRotation = node.angle;
        const finalAngle = node.restAngle + accumulatedRotation + localRotation;

        if (node.length > 0) {
          // #3: Real FK formula
          const scaledLength = node.length * propMult;
          absX = parentResolved.x + Math.cos(finalAngle) * scaledLength;
          absY = parentResolved.y + Math.sin(finalAngle) * scaledLength;
          absAngle = finalAngle;
        } else {
          // Backward-compatible offset-based resolution
          const parentAngle = parentResolved.angle;
          const cos = Math.cos(parentAngle);
          const sin = Math.sin(parentAngle);
          const scaledOffset = {
            x: node.offset.x * propMult,
            y: node.offset.y * propMult,
          };
          absX = parentResolved.x + (scaledOffset.x * cos - scaledOffset.y * sin);
          absY = parentResolved.y + (scaledOffset.x * sin + scaledOffset.y * cos);
          absAngle = parentAngle + node.angle;
        }

        resolved.set(node.slot, {
          slot: node.slot,
          x: absX,
          y: absY,
          angle: absAngle,
          zOrder: bodyPlan.renderOrder.indexOf(node.slot),
          side: node.side,
          region: node.region,
        });
        queue.push(node.slot);
      }
    }
  }

  return Array.from(resolved.values());
}

// ── #8: Posture-blend LERP ──────────────────────────────────────────

function blendResolved(
  resolvedA: ResolvedAttachment[],
  resolvedB: ResolvedAttachment[],
  weight: number,
  renderOrder: PartSlot[],
): ResolvedAttachment[] {
  const mapB = new Map<PartSlot, ResolvedAttachment>();
  for (const r of resolvedB) {
    mapB.set(r.slot, r);
  }

  return resolvedA.map(a => {
    const b = mapB.get(a.slot);
    if (!b) return a; // slot only in plan A — keep as-is

    return {
      slot: a.slot,
      x: lerp(a.x, b.x, weight),
      y: lerp(a.y, b.y, weight),
      angle: lerp(a.angle, b.angle, weight),
      zOrder: renderOrder.indexOf(a.slot),
      side: a.side,
      region: a.region,
    };
  });
}
