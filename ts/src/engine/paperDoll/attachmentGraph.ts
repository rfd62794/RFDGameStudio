/**
 * Attachment Graph Resolver
 *
 * Resolves a BodyPlan's parent-child attachment graph into absolute
 * per-slot positions and angles. Each node's position is computed from
 * its parent's resolved position + the node's offset, rotated by the
 * parent's resolved angle. This is the piece that makes the module
 * genuinely reusable — a different BodyPlan wires the same slots into
 * a different arrangement without changing the resolution logic.
 */

import type { PartSlot } from '../shared/partSlots';
import type { AttachmentNode, BodyPlan, ResolvedAttachment } from './types';

/**
 * Resolve all attachments in a BodyPlan to absolute positions/angles.
 *
 * The resolution is iterative (BFS from root) to avoid recursion depth
 * issues with deeply nested graphs. Each node's absolute position is:
 *   parentX + (offset.x * cos(parentAngle) - offset.y * sin(parentAngle))
 *   parentY + (offset.x * sin(parentAngle) + offset.y * cos(parentAngle))
 * And its absolute angle is parentAngle + node.angle.
 *
 * @param bodyPlan The body plan to resolve
 * @returns Array of resolved attachments, one per slot, with zOrder
 */
export function resolveAttachments(bodyPlan: BodyPlan): ResolvedAttachment[] {
  const nodeMap = new Map<PartSlot, AttachmentNode>();
  for (const node of bodyPlan.nodes) {
    nodeMap.set(node.slot, node);
  }

  const resolved = new Map<PartSlot, ResolvedAttachment>();
  const queue: PartSlot[] = [bodyPlan.root];

  // Resolve root first (offset is {0,0}, angle is 0)
  const rootNode = nodeMap.get(bodyPlan.root)!;
  resolved.set(bodyPlan.root, {
    slot: bodyPlan.root,
    x: rootNode.offset.x,
    y: rootNode.offset.y,
    angle: rootNode.angle,
    zOrder: bodyPlan.renderOrder.indexOf(bodyPlan.root),
  });

  // BFS through the graph
  while (queue.length > 0) {
    const currentSlot = queue.shift()!;
    const parentResolved = resolved.get(currentSlot)!;

    // Find all children of this node
    for (const node of bodyPlan.nodes) {
      if (node.parentSlot === currentSlot && !resolved.has(node.slot)) {
        const parentAngle = parentResolved.angle;
        const cos = Math.cos(parentAngle);
        const sin = Math.sin(parentAngle);

        // Rotate the offset by the parent's angle, then add parent position
        const absX = parentResolved.x + (node.offset.x * cos - node.offset.y * sin);
        const absY = parentResolved.y + (node.offset.x * sin + node.offset.y * cos);
        const absAngle = parentAngle + node.angle;

        resolved.set(node.slot, {
          slot: node.slot,
          x: absX,
          y: absY,
          angle: absAngle,
          zOrder: bodyPlan.renderOrder.indexOf(node.slot),
        });
        queue.push(node.slot);
      }
    }
  }

  return Array.from(resolved.values());
}
