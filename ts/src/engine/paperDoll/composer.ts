/**
 * Paper Doll Composer (upgraded with ChimeraLab patterns)
 *
 * The real composition function: takes a BodyPlan + parts + colors and
 * produces one ordered set of positioned, styled SVG shapes. Consumes
 * artGen's real shape primitives directly — no duplication.
 *
 * Upgraded patterns (ported from ChimeraLab, August 2026):
 *   #4: Hierarchical color resolution (color_utils.py) — when
 *       CompositionInput.genetics is provided, colors are resolved
 *       via the priority-ordered hierarchy table instead of the flat
 *       slot→color lookup.
 *   #5: Painter's algorithm Z-ordering (body_renderer.py) — 3-layer
 *       side-aware depth: background limbs (opposite side, darkened
 *       ~15%) → foreground limbs (near side, full color) → torso/head
 *       overlay. Uses the resolved `side` field from the attachment
 *       graph, not slot naming alone.
 *   #6: Biological scaling (skeleton.rs) — applies Kleiber's Law
 *       (thickness = base * length^0.75), joint buffer (1.3x), taper
 *       (0.55x at limb ends), and torso hourglass multipliers to
 *       shape parameters at composition time.
 *   #7: Sigmoid muscle bulge (body_renderer.py) — new fifth primitive
 *       alongside polygon/radialBurst/teardropFin/irregularFragment.
 *
 * Shape primitives consumed:
 *   - renderPolygonPoints + <polygon> wrapper (for head, torso)
 *   - renderTeardropFin (for limbs — elongated, directional)
 *   - renderRadialBurst (for creature-like parts)
 *   - renderIrregularFragment (for rough, organic parts)
 *   - renderSigmoidBulge (for organic muscle-shaped limbs — #7)
 */

import {
  renderPolygonPoints,
  renderTeardropFin,
  renderRadialBurst,
  renderIrregularFragment,
  renderSigmoidBulge,
} from '../artGen/index';
import type { PartSlot } from '../shared/partSlots';
import type {
  CompositionInput,
  ComposedPart,
  ResolvedAttachment,
  SlotShapeMapping,
  BodyProportions,
  BoneNode,
} from './types';
import { BIOLOGICAL_SCALING } from './types';
import { resolveAttachments } from './attachmentGraph';
import { getColorForPart, darkenColor } from './colorResolution';

/**
 * Compose a complete figure from a BodyPlan + parts + colors.
 *
 * @param input The composition input (body plan, parts, colors, seed,
 *              proportions, genetics, postureWeight, postureBlendPlan)
 * @returns Array of composed parts, ordered back-to-front by zOrder
 */
export function composeFigure(input: CompositionInput): ComposedPart[] {
  const {
    bodyPlan,
    parts,
    colors,
    seed = 0,
    proportions,
    genetics,
    postureWeight,
    postureBlendPlan,
  } = input;

  // Resolve attachments with proportions + posture blending
  const attachments = resolveAttachments(
    bodyPlan,
    proportions,
    postureWeight,
    postureBlendPlan,
  );

  const shapeMap = new Map<PartSlot, SlotShapeMapping>();
  for (const sm of bodyPlan.shapeMappings) {
    shapeMap.set(sm.slot, sm);
  }

  // Build node map for parent-relative offset lookup (biological scaling)
  const nodeMap = new Map<PartSlot, BoneNode>();
  for (const node of bodyPlan.nodes) {
    nodeMap.set(node.slot, node);
  }

  const composed: ComposedPart[] = [];

  for (const att of attachments) {
    const part = parts[att.slot];
    const shapeMapping = shapeMap.get(att.slot);

    if (!shapeMapping) continue;

    // #4: Hierarchical color resolution
    // When genetics is provided, use the priority-ordered hierarchy.
    // Otherwise, fall back to the flat slot→color lookup.
    let color: string;
    if (genetics) {
      color = getColorForPart(genetics, att.slot);
    } else {
      color = colors[att.slot] ?? '#888888';
    }

    // #5: Painter's algorithm — darken background-side limbs
    if (att.side === 'left') {
      color = darkenColor(color, 0.15);
    }

    // #6: Biological scaling — adjust shape params based on region
    // Pass the node's parent-relative offset so Kleiber's Law uses
    // actual limb length, not absolute position from origin.
    const node = nodeMap.get(att.slot);
    const limbOffset = node ? Math.sqrt(node.offset.x ** 2 + node.offset.y ** 2) : 0;
    const scaledShapeMapping = applyBiologicalScaling(shapeMapping, att, proportions, limbOffset);

    // Generate the shape SVG using artGen's real primitives
    const shapeSvg = renderShapeForSlot(scaledShapeMapping, color, seed, att);

    composed.push({
      slot: att.slot,
      partId: part?.id ?? null,
      partName: part?.name ?? 'empty',
      zOrder: att.zOrder,
      x: att.x,
      y: att.y,
      angle: att.angle,
      side: att.side,
      region: att.region,
      svg: shapeSvg,
    });
  }

  // Sort back-to-front by zOrder
  composed.sort((a, b) => a.zOrder - b.zOrder);
  return composed;
}

// ── #6: Biological Scaling ──────────────────────────────────────────
//
// Applies Kleiber's Law (thickness = base * length^0.75), joint buffer
// (1.3x at elbows/knees), taper (0.55x at limb ends), and torso
// hourglass multipliers to shape parameters.
//
// The real numbers from ChimeraLab's skeleton.rs::get_body_contours,
// ported as named, flagged-tunable constants (BIOLOGICAL_SCALING).

function applyBiologicalScaling(
  shapeMapping: SlotShapeMapping,
  att: ResolvedAttachment,
  proportions?: BodyProportions,
  limbLength?: number,
): SlotShapeMapping {
  const params = { ...shapeMapping.baseParams };

  // ── Torso hourglass multipliers ──
  // Applied to radius-based primitives (polygon, irregularFragment) for
  // slots in the torso/head/spine regions. The head slot has region
  // 'head' but still needs the torsoHead multiplier — include it
  // alongside 'torso' and 'spine'.
  if ('radius' in params) {
    const baseRadius = params.radius;
    if (att.region === 'torso' || att.region === 'spine' || att.region === 'head') {
      switch (att.slot) {
        case 'chest':
          params.radius = baseRadius * BIOLOGICAL_SCALING.torsoChest;
          break;
        case 'head':
          params.radius = baseRadius * BIOLOGICAL_SCALING.torsoHead;
          break;
        default:
          break;
      }
    }
  }

  // ── Kleiber's Law for limb thickness ──
  // thickness = base * length^kleiberExponent
  // For teardropFin limbs, "length" is the parent-relative offset
  // magnitude (the actual limb length), and "thickness" maps to scale.
  // We normalize against a reference length of 20 units so that a
  // standard humanoid limb gets multiplier ≈ 1.0. The joint buffer
  // (1.3x at joints) and limb taper (0.55x at ends) are averaged to
  // produce a net thickness multiplier that makes limbs look jointed.
  if ((att.region === 'arm' || att.region === 'leg') && 'scale' in params && limbLength) {
    const referenceLength = 20; // standard humanoid limb offset
    const kleiberMultiplier = Math.pow(
      limbLength / referenceLength,
      BIOLOGICAL_SCALING.kleiberExponent,
    );
    const jointAndTaper =
      (BIOLOGICAL_SCALING.jointBuffer + BIOLOGICAL_SCALING.limbEndTaper) / 2;
    params.scale = params.scale * kleiberMultiplier * jointAndTaper;
  }

  // ── Apply muscle bulge from proportions ──
  if (proportions && 'angularity' in params) {
    // Higher muscleBulge = more angular (more pronounced curves)
    params.angularity = params.angularity * proportions.muscleBulge;
  }

  return { ...shapeMapping, baseParams: params };
}

/**
 * Render one shape for one slot, positioned and rotated.
 *
 * Uses artGen's real shape primitives, then wraps the result in a <g>
 * transform that places it at the resolved position and angle.
 */
function renderShapeForSlot(
  shapeMapping: SlotShapeMapping,
  color: string,
  seed: number,
  attachment: ResolvedAttachment,
): string {
  const { x, y, angle } = attachment;
  const angleDeg = (angle * 180) / Math.PI;
  const transform = `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`;

  let shapeContent: string;

  switch (shapeMapping.primitive) {
    case 'polygon': {
      const vertexCount = shapeMapping.baseParams.vertexCount ?? 6;
      const irregularity = shapeMapping.baseParams.irregularity ?? 20;
      const radius = shapeMapping.baseParams.radius ?? 25;
      const points = renderPolygonPoints({
        vertexCount,
        irregularity,
        seed: seed + hashString(attachment.slot),
        radius,
        center: 0,
      });
      shapeContent = `<polygon points="${points}" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
      break;
    }

    case 'teardropFin': {
      const scale = shapeMapping.baseParams.scale ?? 0.6;
      const angularity = shapeMapping.baseParams.angularity ?? 30;
      shapeContent = renderTeardropFin({
        scale,
        angularity,
        dorsalFin: false,
        seed: seed + hashString(attachment.slot),
      }).replace(/currentColor/g, color);
      break;
    }

    case 'radialBurst': {
      const armCount = shapeMapping.baseParams.armCount ?? 5;
      const radius = shapeMapping.baseParams.radius ?? 25;
      shapeContent = renderRadialBurst({
        armCount,
        radius,
        fill: color,
        stroke: color,
        strokeWidth: 2,
        center: 0,
        seed: seed + hashString(attachment.slot),
      });
      break;
    }

    case 'irregularFragment': {
      const vertexCount = shapeMapping.baseParams.vertexCount ?? 7;
      const irregularity = shapeMapping.baseParams.irregularity ?? 60;
      const radius = shapeMapping.baseParams.radius ?? 25;
      shapeContent = renderIrregularFragment({
        seed: seed + hashString(attachment.slot),
        vertexCount,
        irregularity,
        radius,
        center: 0,
        fill: color,
        stroke: color,
        strokeWidth: 2,
      });
      break;
    }

    case 'sigmoidBulge': {
      // #7: Sigmoid muscle bulge — new fifth primitive
      const widthStart = shapeMapping.baseParams.widthStart ?? 15;
      const widthEnd = shapeMapping.baseParams.widthEnd ?? 8;
      const bulgeFactor = shapeMapping.baseParams.bulgeFactor ?? BIOLOGICAL_SCALING.bulgeFactor;
      const segments = shapeMapping.baseParams.segments ?? BIOLOGICAL_SCALING.bulgeSegments;
      shapeContent = renderSigmoidBulge({
        widthStart,
        widthEnd,
        segments,
        bulgeFactor,
        fill: color,
        stroke: color,
        strokeWidth: 2,
      });
      break;
    }

    default:
      shapeContent = `<circle cx="0" cy="0" r="20" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="2"/>`;
  }

  return `<g transform="${transform}">${shapeContent}</g>`;
}

/**
 * Render a complete figure as a single SVG string.
 *
 * This is the convenience wrapper — it calls composeFigure and
 * concatenates the results into one SVG string with a viewBox.
 *
 * The viewBox is computed from the actual content bounding box, not
 * set to `0 0 width height`. This is critical: body plans are designed
 * in a 100×100 coordinate space (chest at 50,50, head at 50,28, etc.).
 * If the viewBox were `0 0 300 300` (matching a 300×300 display size),
 * the content would appear as a tiny cluster in the top-left corner.
 * Instead, the viewBox fits the actual content, and width/height only
 * control the display size. `preserveAspectRatio="xMidYMid meet"`
 * centers the content in the display area.
 *
 * @param input The composition input
 * @param width SVG display width (default 100)
 * @param height SVG display height (default 100)
 * @returns Complete SVG string
 */
export function renderFigureSvg(input: CompositionInput, width: number = 100, height: number = 100): string {
  const composed = composeFigure(input);
  const parts = composed.map(c => c.svg).join('');
  const bounds = computeContentBounds(composed);
  const viewBox = `${bounds.x.toFixed(1)} ${bounds.y.toFixed(1)} ${bounds.width.toFixed(1)} ${bounds.height.toFixed(1)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${parts}</svg>`;
}

// ── Content bounding box computation ────────────────────────────────
//
// Computes the actual bounding box of the composed SVG content by
// parsing coordinate pairs from each part's shape SVG and applying
// the part's transform (translate + rotate). This ensures the viewBox
// always fits the content regardless of body plan, shape parameters,
// or proportions scaling.
//
// Handles all shape primitives:
//   - <polygon points="x,y x,y ..."> (polygon, irregularFragment, radialBurst, sigmoidBulge)
//   - <path d="M x,y C x,y ..."> (teardropFin body/tail/dorsal)
//   - <circle cx="x" cy="y"> (fallback shape)

function computeContentBounds(composed: ComposedPart[]): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const part of composed) {
    // Parse the transform: translate(x,y) rotate(angle)
    const transformMatch = part.svg.match(/translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)/);
    if (!transformMatch) continue;

    const tx = parseFloat(transformMatch[1]);
    const ty = parseFloat(transformMatch[2]);
    const angleDeg = parseFloat(transformMatch[3]);
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Extract the inner SVG content (between <g> and </g>)
    const innerContent = part.svg.replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '');

    // Collect all local coordinate pairs from the shape content
    const coords: Array<[number, number]> = [];

    // From polygon points="x1,y1 x2,y2 ..."
    for (const m of innerContent.matchAll(/points="([^"]+)"/g)) {
      const nums = m[1].match(/-?\d+\.?\d*/g) || [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
      }
    }

    // From path d="M x,y C x,y x,y x,y ..."
    for (const m of innerContent.matchAll(/\sd="([^"]+)"/g)) {
      const nums = m[1].match(/-?\d+\.?\d*/g) || [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
      }
    }

    // From circle cx="x" cy="y" (fallback shape)
    for (const m of innerContent.matchAll(/<circle[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"/g)) {
      coords.push([parseFloat(m[1]!), parseFloat(m[2]!)]);
    }

    // Apply transform (rotate then translate) and update bounds
    for (const [lx, ly] of coords) {
      const gx = tx + lx * cos - ly * sin;
      const gy = ty + lx * sin + ly * cos;
      if (gx < minX) minX = gx;
      if (gx > maxX) maxX = gx;
      if (gy < minY) minY = gy;
      if (gy > maxY) maxY = gy;
    }
  }

  // Fallback if no coordinates were found
  if (minX === Infinity || maxX === -Infinity) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  // Add padding (10% of the largest dimension, minimum 5 units)
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const padding = Math.max(Math.max(contentWidth, contentHeight) * 0.1, 5);

  return {
    x: minX - padding,
    y: minY - padding,
    width: contentWidth + 2 * padding,
    height: contentHeight + 2 * padding,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
