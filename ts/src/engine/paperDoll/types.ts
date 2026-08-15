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
 * Pattern sources (ported from ChimeraLab investigation, August 2026):
 *   - SkeletonManifest data shape ← bone_manifest.py
 *   - BodyProportions ← proportion_presets.py
 *   - True FK rotation accumulation ← fk_solver.py
 *   - Hierarchical color resolution ← color_utils.py
 *   - Painter's algorithm Z-ordering ← body_renderer.py
 *   - Biological scaling formulas ← skeleton.rs::get_body_contours
 *   - Sigmoid muscle bulge shape ← body_renderer.py::get_sigmoid_polygon
 *   - Posture-blend interpolation ← skeleton_presets.py
 */

import type { PartSlot } from '../shared/partSlots';

// ── #1: SkeletonManifest Data Shape (from bone_manifest.py) ────────
//
// Replaces the flat AttachmentNode with a more rigorous BoneNode schema:
// each slot has a named bone with a parent, length, and rest angle.
// The ordered hierarchy is the single source of truth for FK traversal.
//
// The offset field is retained for backward compatibility — existing
// body plans that specify explicit offsets still work. When length and
// restAngle are provided, the FK solver uses the real rotation-
// accumulation formula instead of offset rotation.

export interface BoneNode {
  slot: PartSlot;
  parentSlot: PartSlot | null; // null only for the root
  // FK rotation-accumulation fields (from ChimeraLab's BoneNode):
  length: number;       // bone length in local units (0 for root)
  restAngle: number;    // rest pose angle in radians (relative to parent)
  // Offset-based fields (retained for backward compat + explicit positioning):
  offset: { x: number; y: number };
  angle: number;        // local rotation offset (added to restAngle in FK mode)
  // Side classification for painter's algorithm Z-ordering (#5):
  side: 'left' | 'right' | 'center';
  // Region classification for biological scaling (#6):
  region: 'spine' | 'head' | 'arm' | 'leg' | 'torso';
}

// Legacy alias for backward compatibility with existing consumers
export interface AttachmentNode {
  slot: PartSlot;
  parentSlot: PartSlot | null;
  offset: { x: number; y: number };
  angle: number;
}

// ── Body Plan ────────────────────────────────────────────────────────
//
// A Body Plan defines the bone hierarchy + render order + shape
// mapping for one class of figure. New body plans are authored as
// data, not engineered as code.

export interface SlotShapeMapping {
  slot: PartSlot;
  primitive: 'polygon' | 'radialBurst' | 'teardropFin' | 'irregularFragment' | 'sigmoidBulge' | 'ellipse';
  baseParams: Record<string, number>; // primitive-specific, e.g. vertexCount
}

export interface BodyPlan {
  id: string; // e.g. "humanoid_bilateral", "chimera_asymmetric"
  root: PartSlot;
  nodes: BoneNode[]; // one per slot, root included with offset {0,0}
  renderOrder: PartSlot[]; // explicit back-to-front z-order
  shapeMappings: SlotShapeMapping[]; // one per slot
}

// ── #2: BodyProportions (from proportion_presets.py) ───────────────
//
// 12 float multipliers (1.0 = normal) that scale per-region attachment
// offsets at composition time. Ported directly from ChimeraLab's
// BodyProportions dataclass.

export interface BodyProportions {
  // Head & Neck
  headSize: number;
  neckWidth: number;
  // Torso
  shoulderWidth: number;
  chestWidth: number;
  waistWidth: number;
  hipWidth: number;
  // Arms
  upperArmWidth: number;
  forearmWidth: number;
  handSize: number;
  // Legs
  thighWidth: number;
  calfWidth: number;
  footSize: number;
  // Overall scale
  muscleBulge: number; // How pronounced muscle curves are
  // Display name
  name: string;
}

// ── #4: Hierarchical Color Resolution (from color_utils.py) ────────
//
// A genetics-style color map where colors are resolved by walking a
// priority-ordered key list. This is the real Brand/Cyber-Organic/
// Quality-tier styling system.

export type ColorGenetics = Record<string, string>;

// ── #6: Biological Scaling Constants (from skeleton.rs) ────────────
//
// Named, flagged-tunable constants ported from ChimeraLab's
// get_body_contours. These are the real numbers, not re-derived.

export const BIOLOGICAL_SCALING = {
  // Kleiber's Law exponent: thickness = base * length^0.75
  kleiberExponent: 0.75,
  // Joint buffer: elbows/knees get 1.3x radius to look like sockets
  jointBuffer: 1.3,
  // Taper: limb ends (wrists/ankles) taper to 0.55x
  limbEndTaper: 0.55,
  // Torso hourglass multipliers (hips → waist → chest → neck → head)
  torsoHips: 1.5,
  torsoWaist: 1.0,
  torsoChest: 1.6,
  torsoNeck: 0.6,
  torsoHead: 1.2,
  // Sigmoid bulge: 40% of base width peaks at t=0.5
  bulgeFactor: 0.4,
  // Default segments for sigmoid polygon
  bulgeSegments: 6,
} as const;

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
  side: 'left' | 'right' | 'center'; // for painter's algorithm
  region: 'spine' | 'head' | 'arm' | 'leg' | 'torso'; // for biological scaling
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
  side: 'left' | 'right' | 'center';
  region: 'spine' | 'head' | 'arm' | 'leg' | 'torso';
  svg: string; // the complete SVG element string for this part
}

// ── Composition Input ────────────────────────────────────────────────
//
// What a consumer passes to the composer. Parts is a record of slot →
// Part (or null for empty slots). Colors is a record of slot → fill
// color string. The colorFor callback pattern from ArtGenConfig is the
// real way to derive colors — consumers can use artGen's existing
// ArtGenConfig.colorFor or provide a simple lookup.
//
// New optional fields (all backward-compatible — existing consumers
// that don't pass them get the same behavior as before):
//   - proportions: per-region body scaling (#2)
//   - genetics: hierarchical color resolution (#4)
//   - postureWeight: LERP between two body plans (#8)
//   - postureBlendPlan: the second body plan for posture blending (#8)

export interface CompositionInput {
  bodyPlan: BodyPlan;
  parts: Record<string, PartForComposition | null>;
  colors: Record<string, string>; // slot → fill color
  seed?: number; // for deterministic shape jitter
  // #2: BodyProportions — scales per-region offsets at composition time
  proportions?: BodyProportions;
  // #4: ColorGenetics — hierarchical color resolution (overrides flat colors)
  genetics?: ColorGenetics;
  // #8: Posture-blend — LERP between bodyPlan and postureBlendPlan
  postureWeight?: number; // 0 = bodyPlan, 1 = postureBlendPlan
  postureBlendPlan?: BodyPlan; // second plan for posture blending
}

// A minimal Part shape for composition — the real Part type has more
// fields (stats, price) but the composer only needs id, name, and slot.
export interface PartForComposition {
  id: string;
  name: string;
  slot: PartSlot;
}
