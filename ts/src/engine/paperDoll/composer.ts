/**
 * Paper Doll Composer
 *
 * The real composition function: takes a BodyPlan + parts + colors and
 * produces one ordered set of positioned, styled SVG shapes. Consumes
 * artGen's real shape primitives directly — no duplication.
 *
 * Shape primitives consumed:
 *   - renderPolygonPoints + <polygon> wrapper (for head, torso)
 *   - renderTeardropFin (for limbs — elongated, directional)
 *   - renderRadialBurst (for creature-like parts)
 *   - renderIrregularFragment (for rough, organic parts)
 *
 * The composer wraps each shape in a <g> transform that places it at
 * the resolved position and rotates it to the resolved angle. The
 * output is ordered by zOrder (back-to-front) so the caller can simply
 * concatenate the SVG strings.
 */

import {
  renderPolygonPoints,
  renderTeardropFin,
  renderRadialBurst,
  renderIrregularFragment,
} from '../artGen/index';
import type { PartSlot } from '../shared/partSlots';
import type { CompositionInput, ComposedPart, ResolvedAttachment, SlotShapeMapping } from './types';
import { resolveAttachments } from './attachmentGraph';

/**
 * Compose a complete figure from a BodyPlan + parts + colors.
 *
 * @param input The composition input (body plan, parts, colors, seed)
 * @returns Array of composed parts, ordered back-to-front by zOrder
 */
export function composeFigure(input: CompositionInput): ComposedPart[] {
  const { bodyPlan, parts, colors, seed = 0 } = input;
  const attachments = resolveAttachments(bodyPlan);
  const shapeMap = new Map<PartSlot, SlotShapeMapping>();
  for (const sm of bodyPlan.shapeMappings) {
    shapeMap.set(sm.slot, sm);
  }

  const composed: ComposedPart[] = [];

  for (const att of attachments) {
    const part = parts[att.slot];
    const color = colors[att.slot] ?? '#888888';
    const shapeMapping = shapeMap.get(att.slot);

    if (!shapeMapping) continue;

    // Generate the shape SVG using artGen's real primitives
    const shapeSvg = renderShapeForSlot(shapeMapping, color, seed, att);

    composed.push({
      slot: att.slot,
      partId: part?.id ?? null,
      partName: part?.name ?? 'empty',
      zOrder: att.zOrder,
      x: att.x,
      y: att.y,
      angle: att.angle,
      svg: shapeSvg,
    });
  }

  // Sort back-to-front by zOrder
  composed.sort((a, b) => a.zOrder - b.zOrder);
  return composed;
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
 * @param input The composition input
 * @param width SVG width (default 100)
 * @param height SVG height (default 100)
 * @returns Complete SVG string
 */
export function renderFigureSvg(input: CompositionInput, width: number = 100, height: number = 100): string {
  const composed = composeFigure(input);
  const parts = composed.map(c => c.svg).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts}</svg>`;
}

// ── Helpers ──────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
