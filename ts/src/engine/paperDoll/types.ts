/**
 * Paper Doll / Composite Character Rendering Module — Type Definitions
 *
 * Composes independent body-part shapes into one correctly-layered
 * figure, styled from artGen's existing shape primitives and the
 * ArtGenConfig color callback pattern.
 *
 * Two real consumers on day one:
 *   - Mutant Battle Ball: roster cards, match view, Workshop/Shop tabs
 *   - Chimera Wilds: encounter view chimera figure
 *
 * Both already share the exact same six-slot Part/PartSlot system
 * (ts/src/engine/shared/partSlots.ts). This module is a pure rendering
 * layer on top of that data — it does not modify Part stat data.
 *
 * Built per Path A of the design review: composition layer first,
 * Brand/Cyber-Organic/Quality styling deferred to a separate directive
 * once that system's Design.md exists.
 */

import type { PartSlot } from '../shared/partSlots';

// ── Attachment Graph ─────────────────────────────────────────────────
//
// Rather than a hardcoded human skeleton, each body-part slot is a node
// in a parent-child graph, with a data-defined offset and angle relative
// to its parent. One root slot anchors the figure; every other slot's
// position is computed from its parent, not hand-placed per character.

export interface AttachmentNode {
  slot: PartSlot;
  parentSlot: PartSlot | null; // null only for the root
  offset: { x: number; y: number };
  angle: number; // relative to parent's resolved angle, in radians
}

// ── Body Plan ────────────────────────────────────────────────────────
//
// A Body Plan defines the attachment graph + render order + shape
// mapping for one class of figure. New body plans are authored as data,
// not engineered as code.

export interface SlotShapeMapping {
  slot: PartSlot;
  primitive: 'polygon' | 'radialBurst' | 'teardropFin' | 'irregularFragment';
  baseParams: Record<string, number>; // primitive-specific, e.g. vertexCount
}

export interface BodyPlan {
  id: string; // e.g. "humanoid_bilateral", "chimera_asymmetric"
  root: PartSlot;
  nodes: AttachmentNode[]; // one per slot, root included with offset {0,0}
  renderOrder: PartSlot[]; // explicit back-to-front z-order
  shapeMappings: SlotShapeMapping[]; // one per slot
}

// ── Resolved Attachment ──────────────────────────────────────────────
//
// The output of the attachment graph resolver: each slot's final
// absolute position and angle in the figure's local coordinate space.

export interface ResolvedAttachment {
  slot: PartSlot;
  x: number;
  y: number;
  angle: number; // absolute, in radians
  zOrder: number; // index into renderOrder
}

// ── Composed Part ────────────────────────────────────────────────────
//
// The output of the composer: one fully-positioned, styled shape ready
// to render. The SVG string is the actual shape markup from artGen's
// primitives, wrapped in a <g> transform that places it at the resolved
// position and angle.

export interface ComposedPart {
  slot: PartSlot;
  partId: string | null; // null if slot is empty
  partName: string;
  zOrder: number;
  x: number;
  y: number;
  angle: number;
  svg: string; // the complete SVG element string for this part
}

// ── Composition Input ────────────────────────────────────────────────
//
// What a consumer passes to the composer. Parts is a record of slot →
// Part (or null for empty slots). Colors is a record of slot → fill
// color string. The colorFor callback pattern from ArtGenConfig is the
// real way to derive colors — consumers can use artGen's existing
// ArtGenConfig.colorFor or provide a simple lookup.

export interface CompositionInput {
  bodyPlan: BodyPlan;
  parts: Record<string, PartForComposition | null>;
  colors: Record<string, string>; // slot → fill color
  seed?: number; // for deterministic shape jitter
}

// A minimal Part shape for composition — the real Part type has more
// fields (stats, price) but the composer only needs id, name, and slot.
export interface PartForComposition {
  id: string;
  name: string;
  slot: PartSlot;
}
