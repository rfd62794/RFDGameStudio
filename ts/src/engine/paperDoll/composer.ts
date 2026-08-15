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
  renderEllipse,
} from '../artGen/index';
import type { PartSlot } from '../shared/partSlots';
import type {
  CompositionInput,
  ComposedPart,
  ResolvedAttachment,
  SlotShapeMapping,
  BodyProportions,
  BoneNode,
  JointBlendCircle,
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

  // Track which slots use strokeSkeleton for the post-processing pass
  const strokeSlots = new Set<PartSlot>();

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

    // Track strokeSkeleton slots for post-processing
    if (scaledShapeMapping.primitive === 'strokeSkeleton') {
      strokeSlots.add(att.slot);
    }

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

  // ── Stroke-Skeleton post-processing pass ──
  // For body plans that use the strokeSkeleton primitive, replace
  // the placeholder shapes with real stroked line segments along
  // the bone chain, and add SDF/smooth-min joint blend circles at
  // connection points. This is the production technique from the
  // side-by-side comparison: stroke-skeleton + joint blending.
  if (strokeSlots.size > 0) {
    const attachmentMap = new Map<PartSlot, ResolvedAttachment>();
    for (const att of attachments) {
      attachmentMap.set(att.slot, att);
    }
    const strokeResult = renderStrokeSkeletonPass(
      composed,
      strokeSlots,
      attachmentMap,
      nodeMap,
      shapeMap,
      colors,
      genetics,
      proportions,
    );
    // Replace strokeSkeleton parts with real stroke segments
    // and append joint blend circles
    return strokeResult;
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
  // Applied to radius-based primitives (polygon, irregularFragment,
  // ellipse) for slots in the torso/head/spine regions. The head slot
  // has region 'head' but still needs the torsoHead multiplier.
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

  // Ellipse primitive: apply hourglass multipliers to rx/ry
  if ('rx' in params) {
    const baseRx = params.rx;
    const baseRy = params.ry ?? baseRx;
    if (att.region === 'torso' || att.region === 'spine' || att.region === 'head') {
      switch (att.slot) {
        case 'chest':
          params.rx = baseRx * BIOLOGICAL_SCALING.torsoChest;
          params.ry = baseRy * BIOLOGICAL_SCALING.torsoChest;
          break;
        case 'head':
          params.rx = baseRx * BIOLOGICAL_SCALING.torsoHead;
          params.ry = baseRy * BIOLOGICAL_SCALING.torsoHead;
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
  // For sigmoidBulge limbs, thickness maps to widthStart/widthEnd.
  // We normalize against a reference length of 20 units so that a
  // standard humanoid limb gets multiplier ≈ 1.0. The joint buffer
  // (1.3x at joints) and limb taper (0.55x at ends) are applied:
  // widthStart gets the joint buffer (proximal = thicker at joint),
  // widthEnd gets the limb taper (distal = thinner at extremity).
  if ((att.region === 'arm' || att.region === 'leg') && limbLength) {
    const referenceLength = 20; // standard humanoid limb offset
    const kleiberMultiplier = Math.pow(
      limbLength / referenceLength,
      BIOLOGICAL_SCALING.kleiberExponent,
    );

    if ('scale' in params) {
      // teardropFin: single scale parameter
      const jointAndTaper =
        (BIOLOGICAL_SCALING.jointBuffer + BIOLOGICAL_SCALING.limbEndTaper) / 2;
      params.scale = params.scale * kleiberMultiplier * jointAndTaper;
    }

    if ('widthStart' in params && 'widthEnd' in params) {
      // sigmoidBulge: widthStart gets joint buffer, widthEnd gets taper
      params.widthStart = params.widthStart * kleiberMultiplier * BIOLOGICAL_SCALING.jointBuffer;
      params.widthEnd = params.widthEnd * kleiberMultiplier * BIOLOGICAL_SCALING.limbEndTaper;
    }
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

    case 'ellipse': {
      // True ellipse primitive — smooth <ellipse>, not polygon approximation
      const rx = shapeMapping.baseParams.rx ?? shapeMapping.baseParams.radius ?? 15;
      const ry = shapeMapping.baseParams.ry ?? shapeMapping.baseParams.radius ?? 15;
      shapeContent = renderEllipse({
        cx: 0,
        cy: 0,
        rx,
        ry,
        fill: color,
        stroke: color,
        strokeWidth: 2,
      });
      break;
    }

    case 'strokeSkeleton': {
      // Placeholder — the real stroke rendering happens in the
      // post-processing pass (renderStrokeSkeletonPass), which has
      // access to both parent and child positions. Here we just
      // emit an invisible marker so the composed part exists.
      shapeContent = `<circle cx="0" cy="0" r="0.01" fill="none" stroke="none"/>`;
      break;
    }

    default:
      shapeContent = `<circle cx="0" cy="0" r="20" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="2"/>`;
  }

  return `<g transform="${transform}">${shapeContent}</g>`;
}

// ── Stroke-Skeleton + SDF Joint Blending ────────────────────────────
//
// The production technique from the side-by-side comparison:
//   1. Render each bone segment as a thick stroked <line> with
//      stroke-linecap="round" — the stroke IS the body, no fill math.
//   2. At each joint (where a child bone connects to its parent),
//      add a filled <circle> whose radius is the SDF smooth-min
//      blend radius. This merges adjacent stroke segments into
//      one smooth mass at connection points, eliminating the
//      visible sharp line-junction look.
//
// The SDF smooth-min blend works by placing a circle at each joint
// with a radius slightly larger than the stroke width. The circle's
// fill color matches the stroke color, so it visually fills the
// gap between two stroke segments that meet at an angle, creating
// a smooth continuous mass instead of a sharp V junction.
//
// Geometric evidence of smoothness: at the joint point, the circle's
// boundary is C1-continuous (it's a circle), while two stroked lines
// meeting at an angle have only C0 continuity (a sharp corner). The
// circle replaces the corner with a smooth arc, and because its
// radius >= stroke width / 2, it fully covers the gap.

function renderStrokeSkeletonPass(
  composed: ComposedPart[],
  strokeSlots: Set<PartSlot>,
  attachmentMap: Map<PartSlot, ResolvedAttachment>,
  nodeMap: Map<PartSlot, BoneNode>,
  shapeMap: Map<PartSlot, SlotShapeMapping>,
  colors: Record<string, string>,
  genetics: Record<string, string> | undefined,
  proportions: BodyProportions | undefined,
): ComposedPart[] {
  const result: ComposedPart[] = [];
  const jointBlends: JointBlendCircle[] = [];

  for (const part of composed) {
    if (!strokeSlots.has(part.slot)) {
      // Not a strokeSkeleton slot — keep as-is
      result.push(part);
      continue;
    }

    const att = attachmentMap.get(part.slot)!;
    const node = nodeMap.get(part.slot)!;
    const shapeMapping = shapeMap.get(part.slot)!;

    // Resolve color (same logic as main loop)
    let color: string;
    if (genetics) {
      color = getColorForPart(genetics, part.slot);
    } else {
      color = colors[part.slot] ?? '#888888';
    }
    if (part.side === 'left') {
      color = darkenColor(color, 0.15);
    }

    // Get stroke parameters (after biological scaling was applied)
    const widthProximal = shapeMapping.baseParams.widthProximal ?? 12;
    const widthDistal = shapeMapping.baseParams.widthDistal ?? 6;
    const jointBlendRadius = shapeMapping.baseParams.jointBlendRadius ?? widthProximal * 0.65;
    const jointBlendK = shapeMapping.baseParams.jointBlendK ?? 4;

    // Get parent position
    const parentNode = nodeMap.get(node.parentSlot ?? '');
    const parentAtt = node.parentSlot ? attachmentMap.get(node.parentSlot) : null;

    if (part.slot === 'head') {
      // Head: render as a stroked circle (no fill, thick stroke)
      // The stroke gives it a rounded, organic look that matches
      // the stroke-skeleton aesthetic
      const headRadius = shapeMapping.baseParams.widthProximal ?? 10;
      const strokeWidth = shapeMapping.baseParams.widthDistal ?? 6;
      const svg = `<circle cx="${att.x.toFixed(1)}" cy="${att.y.toFixed(1)}" r="${headRadius.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${strokeWidth.toFixed(1)}"/>`;
      result.push({ ...part, svg });
    } else if (parentAtt && parentNode) {
      // Render as a stroked line from parent position to this position
      // Use a tapered stroke: we approximate by using the average width
      // (SVG <line> doesn't support tapered strokes, but the round
      // linecap + joint blend circle creates the visual effect)
      const avgWidth = (widthProximal + widthDistal) / 2;
      const px = parentAtt.x;
      const py = parentAtt.y;
      const cx = att.x;
      const cy = att.y;

      const svg = `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${color}" stroke-width="${avgWidth.toFixed(1)}" stroke-linecap="round"/>`;
      result.push({ ...part, svg });

      // Add joint blend circle at the connection point (this slot's
      // position = the distal end of the parent's bone). The circle
      // fills the gap where two stroke segments meet at an angle,
      // creating a smooth continuous mass.
      jointBlends.push({
        cx: cx,
        cy: cy,
        r: jointBlendRadius,
        color: color,
        blendK: jointBlendK,
      });

      // Also add a blend circle at the parent (proximal) end for
      // shoulders/hips — where multiple bones connect
      if (parentNode.region === 'torso') {
        // This is a shoulder or hip joint — add blend at parent
        jointBlends.push({
          cx: px,
          cy: py,
          r: jointBlendRadius * 1.1, // slightly larger for major joints
          color: genetics ? getColorForPart(genetics, parentNode.slot) : (colors[parentNode.slot] ?? color),
          blendK: jointBlendK,
        });
      }
    } else {
      // Root slot (chest) with no parent — render as a thick stroked
      // capsule (short line segment) to give the torso visual mass
      const torsoWidth = widthProximal;
      const torsoHeight = shapeMapping.baseParams.jointBlendRadius ?? torsoWidth * 0.8;
      // Render as a thick stroked vertical line (torso = spine)
      const svg = `<line x1="${att.x.toFixed(1)}" y1="${(att.y - torsoHeight).toFixed(1)}" x2="${att.x.toFixed(1)}" y2="${(att.y + torsoHeight).toFixed(1)}" stroke="${color}" stroke-width="${torsoWidth.toFixed(1)}" stroke-linecap="round"/>`;
      result.push({ ...part, svg });
    }
  }

  // Add joint blend circles as extra composed parts
  // They go at the same zOrder as the child bone so they render
  // on top of the stroke junction
  for (let i = 0; i < jointBlends.length; i++) {
    const jb = jointBlends[i];
    // Find the zOrder of the nearest stroke slot
    const nearestSlot = Array.from(strokeSlots).find(slot => {
      const att = attachmentMap.get(slot);
      return att && Math.abs(att.x - jb.cx) < 5 && Math.abs(att.y - jb.cy) < 5;
    });
    const zOrder = nearestSlot ? attachmentMap.get(nearestSlot)!.zOrder : 3;

    result.push({
      slot: `joint_blend_${i}` as PartSlot,
      partId: null,
      partName: 'joint_blend',
      zOrder: zOrder,
      x: jb.cx,
      y: jb.cy,
      angle: 0,
      side: 'center',
      region: 'torso',
      svg: `<circle cx="${jb.cx.toFixed(1)}" cy="${jb.cy.toFixed(1)}" r="${jb.r.toFixed(1)}" fill="${jb.color}" stroke="${jb.color}" stroke-width="0"/>`,
    });
  }

  // Sort back-to-front by zOrder
  result.sort((a, b) => a.zOrder - b.zOrder);
  return result;
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
//   - <circle cx="x" cy="y"> (fallback shape, joint blend circles)
//   - <line x1="x" y1="y" x2="x" y2="y"> (strokeSkeleton — absolute coords, no transform)
//   - <ellipse cx="x" cy="y" rx="r" ry="r"> (ellipse primitive)

function computeContentBounds(composed: ComposedPart[]): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const part of composed) {
    // Check if this is a strokeSkeleton part (absolute coords, no <g> wrapper)
    // StrokeSkeleton parts render <line> or <circle> with absolute coordinates
    const transformMatch = part.svg.match(/translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)/);

    if (transformMatch) {
      // Standard primitive with <g transform="translate(x,y) rotate(angle)">
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

      // From ellipse cx="x" cy="y" rx="r" ry="r"
      for (const m of innerContent.matchAll(/<ellipse[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"[^>]*\srx="([^"]+)"[^>]*\sry="([^"]+)"/g)) {
        const cx = parseFloat(m[1]!), cy = parseFloat(m[2]!), rx = parseFloat(m[3]!), ry = parseFloat(m[4]!);
        coords.push([cx + rx, cy], [cx - rx, cy], [cx, cy + ry], [cx, cy - ry]);
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
    } else {
      // StrokeSkeleton part — absolute coordinates, no transform wrapper
      // Parse <line x1="x" y1="y" x2="x" y2="y"> elements
      for (const m of part.svg.matchAll(/<line[^>]*\sx1="([^"]+)"[^>]*\sy1="([^"]+)"[^>]*\sx2="([^"]+)"[^>]*\sy2="([^"]+)"/g)) {
        const x1 = parseFloat(m[1]!), y1 = parseFloat(m[2]!);
        const x2 = parseFloat(m[3]!), y2 = parseFloat(m[4]!);
        // Include stroke width in bounds (approximate as ±half-width)
        const swMatch = part.svg.match(/stroke-width="([^"]+)"/);
        const sw = swMatch ? parseFloat(swMatch[1]) : 0;
        const pad = sw / 2;
        if (x1 - pad < minX) minX = x1 - pad;
        if (x1 + pad > maxX) maxX = x1 + pad;
        if (y1 - pad < minY) minY = y1 - pad;
        if (y1 + pad > maxY) maxY = y1 + pad;
        if (x2 - pad < minX) minX = x2 - pad;
        if (x2 + pad > maxX) maxX = x2 + pad;
        if (y2 - pad < minY) minY = y2 - pad;
        if (y2 + pad > maxY) maxY = y2 + pad;
      }

      // Parse <circle cx="x" cy="y" r="r"> elements (head, joint blends)
      for (const m of part.svg.matchAll(/<circle[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"[^>]*\sr="([^"]+)"/g)) {
        const cx = parseFloat(m[1]!), cy = parseFloat(m[2]!), r = parseFloat(m[3]!);
        // Include stroke width for stroked circles (head)
        const swMatch = part.svg.match(/stroke-width="([^"]+)"/);
        const sw = swMatch ? parseFloat(swMatch[1]) : 0;
        const totalR = r + sw / 2;
        if (cx - totalR < minX) minX = cx - totalR;
        if (cx + totalR > maxX) maxX = cx + totalR;
        if (cy - totalR < minY) minY = cy - totalR;
        if (cy + totalR > maxY) maxY = cy + totalR;
      }
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
