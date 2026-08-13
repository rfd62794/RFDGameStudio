/**
 * Generic procedural art primitives.
 *
 * These functions are the genuinely reusable parts extracted from the
 * working Dissonance Depths card/relic/enemy generator and from the existing
 * procedural polygon generator. They know about shapes, gradients, and
 * borders — they do not know about any game's specific entities.
 */

import type {
  BorderSpec,
  BorderStyle,
  GradientBackgroundSpec,
  IrregularFragmentSpec,
  PolygonSpec,
  RadialBurstSpec,
  ShapeRenderSpec,
  SpikyStarSpec,
  TeardropFinSpec,
} from './types';
import { mulberry32 } from './seededRandom';

/**
 * Render a rectangular background filled with either a single radial
 * gradient or a two-color linear gradient, depending on the supplied
 * ColorSource.
 */
export function renderGradientBackground(spec: GradientBackgroundSpec): string {
  const { width, height, gradientId, color, surface } = spec;

  if (typeof color === 'string') {
    return (
      `<radialGradient id="${gradientId}" cx="50%" cy="50%" r="70%">` +
      `<stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>` +
      `<stop offset="100%" stop-color="${surface}" stop-opacity="1"/></radialGradient>` +
      `<rect width="${width}" height="${height}" fill="url(#${gradientId})"/>`
    );
  }

  const primary = color.primary;
  const secondary = color.secondary ?? primary;
  return (
    `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="${primary}" stop-opacity="0.45"/>` +
    `<stop offset="100%" stop-color="${secondary}" stop-opacity="0.45"/></linearGradient>` +
    `<rect width="${width}" height="${height}" fill="url(#${gradientId})"/>`
  );
}

/**
 * Render a rectangular border in one of the generic styles: solid, thick,
 * glow, or dashed. The glow style emits its own SVG filter definition.
 */
export function renderBorder(spec: BorderSpec): string {
  const { width, height, color, style, id, rx = 8 } = spec;
  const w = width - 4;
  const h = height - 4;
  const x = 2;
  const y = 2;
  const base = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${color}"`;

  if (style === 'solid') {
    return `${base} stroke-width="2"/>`;
  }

  if (style === 'thick') {
    return `${base} stroke-width="4"/>`;
  }

  if (style === 'dashed') {
    return `${base} stroke-width="4" stroke-dasharray="6 4"/>`;
  }

  // 'glow'
  const filterId = id ? `glow-${id}` : 'glow';
  const filter =
    `<filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feGaussianBlur stdDeviation="3" result="blur"/>` +
    `<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  return (
    filter +
    `<rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="${rx}" ` +
    `fill="none" stroke="${color}" stroke-width="6" filter="url(#${filterId})"/>`
  );
}

/**
 * Generate a deterministic polygon point cloud from a seed.
 *
 * Extracted from the existing procedural SVG component — the same
 * algorithm, just made game-agnostic by accepting parameters instead of a
 * domain object.
 */
export function renderPolygonPoints(spec: PolygonSpec): string {
  const { vertexCount, irregularity, seed, radius = 40, center = 50 } = spec;
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / vertexCount;
  const rng = mulberry32(seed);
  const irrFactor = irregularity / 100;

  for (let i = 0; i < vertexCount; i++) {
    const baseAngle = i * angleStep;
    const angleJitter = (rng() - 0.5) * irrFactor * angleStep * 0.5;
    const radiusJitter = 1 + (rng() - 0.5) * irrFactor * 0.6;
    const angle = baseAngle + angleJitter;
    const r = radius * radiusJitter;
    points.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

/**
 * Render a spiky star / silhouette polygon suitable for a circular portrait.
 * This is the generalization of Dissonance's enemy-silhouette generator.
 */
export function renderSpikyStar(spec: SpikyStarSpec): string {
  const { radius, fill, stroke, strokeWidth, center = 50, points = 8 } = spec;
  const coords: string[] = [];
  const outer = radius;
  const inner = radius * 0.45;
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    const x = center + rad * Math.cos(angle);
    const y = center + rad * Math.sin(angle);
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `<polygon points="${coords.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
}

/**
 * Render a small icon shape from the generic shape library.
 */
export function renderShape(spec: ShapeRenderSpec): string {
  const { shape, color, cx = 50, cy = 50, scale = 1 } = spec;
  const transform = scale === 1 ? `translate(${cx},${cy})` : `translate(${cx},${cy}) scale(${scale})`;

  switch (shape) {
    case 'blade':
      return (
        `<g transform="${transform}" stroke="${color}" stroke-width="5" stroke-linecap="round" fill="none">` +
        `<path d="M-25,-20 L25,0 L-25,20"/>` +
        `<line x1="-25" y1="0" x2="25" y2="0"/>` +
        `</g>`
      );

    case 'cross':
      return (
        `<g transform="${transform}" stroke="${color}" stroke-width="6" stroke-linecap="round">` +
        `<line x1="0" y1="-22" x2="0" y2="22"/>` +
        `<line x1="-22" y1="0" x2="22" y2="0"/>` +
        `</g>`
      );

    case 'shield':
      return (
        `<g transform="${transform}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round">` +
        `<path d="M0,-35 C25,-35 40,-15 40,15 C40,45 0,70 0,70 C0,70 -40,45 -40,15 C-40,-15 -25,-35 0,-35 Z"/>` +
        `</g>`
      );

    case 'spiral':
      return (
        `<g transform="${transform}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round">` +
        `<path d="M-18,-18 C0,-30 18,-18 12,0 C6,18 -12,24 -20,10 C-24,0 -12,-12 0,-12"/>` +
        `<circle cx="0" cy="0" r="6" fill="${color}"/>` +
        `</g>`
      );

    case 'coin':
      return (
        `<g transform="${transform}">` +
        `<circle cx="0" cy="0" r="28" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<text x="0" y="12" text-anchor="middle" fill="${color}" font-size="26" font-family="monospace">$</text>` +
        `</g>`
      );

    case 'heart': {
      const path =
        'M0,18 C15,5 25,15 25,30 C25,48 0,62 0,62 C0,62 -25,48 -25,30 C-25,15 -15,5 0,18 Z';
      return (
        `<g transform="${transform}">` +
        `<path d="${path}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>` +
        `<line x1="0" y1="18" x2="0" y2="48" stroke="${color}" stroke-width="5" stroke-linecap="round"/>` +
        `<line x1="-12" y1="33" x2="12" y2="33" stroke="${color}" stroke-width="5" stroke-linecap="round"/>` +
        `</g>`
      );
    }

    case 'eye':
      return (
        `<g transform="${transform}">` +
        `<ellipse cx="0" cy="0" rx="34" ry="26" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<circle cx="0" cy="0" r="10" fill="${color}"/>` +
        `<circle cx="16" cy="-6" r="4" fill="${color}"/>` +
        `</g>`
      );

    case 'gear': {
      const teeth = 8;
      let rects = '';
      for (let i = 0; i < teeth; i++) {
        const angle = i * 45;
        rects += `<rect x="-4" y="${-42}" width="8" height="12" fill="${color}" transform="rotate(${angle} 0 0)"/>`;
      }
      return (
        `<g transform="${transform}">` +
        rects +
        `<circle cx="0" cy="0" r="20" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<circle cx="0" cy="0" r="8" fill="${color}"/>` +
        `</g>`
      );
    }

    case 'dice': {
      const offsets = [-16, 0, 16];
      let circles = '';
      for (const dx of offsets) {
        for (const dy of offsets) {
          circles += `<circle cx="${dx}" cy="${dy}" r="5" fill="${color}"/>`;
        }
      }
      return (
        `<g transform="${transform}">` +
        `<rect x="-30" y="-30" width="60" height="60" rx="6" fill="none" stroke="${color}" stroke-width="5"/>` +
        circles +
        `</g>`
      );
    }

    case 'link':
      return (
        `<g transform="${transform}">` +
        `<circle cx="-18" cy="0" r="14" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<circle cx="18" cy="0" r="14" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<line x1="-4" y1="0" x2="4" y2="0" stroke="${color}" stroke-width="5" stroke-linecap="round"/>` +
        `</g>`
      );

    case 'starburst':
      return renderSpikyStar({
        radius: 35,
        fill: color,
        stroke: color,
        strokeWidth: 3,
        center: 0,
        points: 8,
      });

    default:
      // Safe fallback for unknown shapes: a simple diamond.
      return (
        `<g transform="${transform}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round">` +
        `<path d="M0,-25 L25,0 L0,25 L-25,0 Z"/>` +
        `</g>`
      );
  }
}

/**
 * Render a teardrop/fin silhouette — the fish/shark body family.
 * scale: base size multiplier (1 = standard fish, 1.4 = shark).
 * angularity: 0-100, higher = sharper/more predatory.
 * dorsalFin: adds a triangular dorsal fin (shark trait).
 * seed: deterministic jitter for organic variation.
 */
export function renderTeardropFin(spec: TeardropFinSpec): string {
  const { scale, angularity, dorsalFin, seed = 0 } = spec;
  const rng = mulberry32(seed);
  const ang = angularity / 100; // 0..1
  const jitter = (range: number) => (rng() - 0.5) * range;

  // Body: teardrop pointing right (+x). Narrower tail at back.
  const bodyLen = 40 * scale;
  const bodyHeight = 25 * scale * (1 - ang * 0.3); // angular = narrower
  const tailLen = 20 * scale * (1 + ang * 0.2);
  const tailSpread = 12 * scale * (1 + ang * 0.3);

  // Slight organic jitter on control points
  const jx = jitter(2 * scale);
  const jy = jitter(2 * scale);

  const body = (
    `<path d="M${bodyLen + jx},0 ` +
    `C${bodyLen * 0.5},${bodyHeight} ${-bodyLen * 0.2},${bodyHeight * 0.8} ${-bodyLen * 0.3},${jy} ` +
    `C${-bodyLen * 0.2},${-bodyHeight * 0.8} ${bodyLen * 0.5},${-bodyHeight} ${bodyLen + jx},0 Z" ` +
    `fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>`
  );

  // Tail: triangle at the back
  const tail = (
    `<path d="M${-bodyLen * 0.3},${jy} ` +
    `L${-bodyLen * 0.3 - tailLen},${tailSpread} ` +
    `L${-bodyLen * 0.3 - tailLen},${-tailSpread} Z" ` +
    `fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>`
  );

  let dorsal = '';
  if (dorsalFin) {
    const finHeight = 18 * scale * (1 + ang * 0.3);
    const finBase = bodyLen * 0.15;
    dorsal = (
      `<path d="M${finBase - 5},${-bodyHeight * 0.5} ` +
      `L${finBase + 5},${-bodyHeight * 0.5 - finHeight} ` +
      `L${finBase + 15},${-bodyHeight * 0.5} Z" ` +
      `fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>`
    );
  }

  return `<g>${body}${tail}${dorsal}</g>`;
}

/**
 * Render a radial burst shape — arms/spokes radiating from center.
 * Used for algae (arm count varies by growth stage) and debris.
 * seed: deterministic arm-length jitter for organic variation.
 */
export function renderRadialBurst(spec: RadialBurstSpec): string {
  const {
    armCount,
    radius,
    innerRadius = radius * 0.3,
    fill,
    stroke,
    strokeWidth = 2,
    center = 50,
    seed = 0,
  } = spec;
  const rng = mulberry32(seed);
  const coords: string[] = [];
  const total = armCount * 2;

  for (let i = 0; i < total; i++) {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const baseRad = isOuter ? radius : innerRadius;
    // Jitter outer arm lengths for organic look
    const rad = isOuter ? baseRad * (0.85 + rng() * 0.3) : baseRad;
    const x = center + rad * Math.cos(angle);
    const y = center + rad * Math.sin(angle);
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return `<polygon points="${coords.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
}

/**
 * Render an irregular fragment — small polygon for debris/flesh-chunks.
 * Uses the same polygon algorithm as renderPolygonPoints but returns a
 * complete <polygon> element with fill/stroke.
 */
export function renderIrregularFragment(spec: IrregularFragmentSpec): string {
  const {
    seed,
    vertexCount = 7,
    irregularity = 60,
    radius = 30,
    center = 50,
    fill,
    stroke,
    strokeWidth = 2,
  } = spec;
  const points = renderPolygonPoints({ vertexCount, irregularity, seed, radius, center });
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
}

// ---------------------------------------------------------------------------
// Canvas 2D path generators — for consumers that render to <canvas> instead
// of SVG (e.g. Shoal). These produce drawing commands on a CanvasRenderingContext2D
// using the same algorithms as the SVG counterparts above.
// ---------------------------------------------------------------------------

/**
 * Draw a polygon onto a canvas 2D context using the same algorithm as
 * renderPolygonPoints. The caller sets fillStyle/strokeStyle before calling.
 * Does NOT call fill()/stroke() — caller decides whether to fill, stroke, or both.
 */
export function canvasPolygonPath(
  ctx: CanvasRenderingContext2D,
  spec: PolygonSpec,
  offsetX = 0,
  offsetY = 0
): void {
  const { vertexCount, irregularity, seed, radius = 40, center = 50 } = spec;
  const angleStep = (2 * Math.PI) / vertexCount;
  const rng = mulberry32(seed);
  const irrFactor = irregularity / 100;

  ctx.beginPath();
  for (let i = 0; i < vertexCount; i++) {
    const baseAngle = i * angleStep;
    const angleJitter = (rng() - 0.5) * irrFactor * angleStep * 0.5;
    const radiusJitter = 1 + (rng() - 0.5) * irrFactor * 0.6;
    const angle = baseAngle + angleJitter;
    const r = radius * radiusJitter;
    const x = offsetX + center + r * Math.cos(angle) - center;
    const y = offsetY + center + r * Math.sin(angle) - center;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Draw a teardrop/fin silhouette onto a canvas 2D context.
 * Same shape family as renderTeardropFin. Caller sets fillStyle/strokeStyle.
 * (x, y) is the center of the body. The shape points right (+x) before rotation.
 */
export function canvasTeardropFinPath(
  ctx: CanvasRenderingContext2D,
  spec: TeardropFinSpec,
  x: number,
  y: number
): void {
  const { scale, angularity, dorsalFin, seed = 0 } = spec;
  const rng = mulberry32(seed);
  const ang = angularity / 100;
  const jitter = (range: number) => (rng() - 0.5) * range;

  const bodyLen = 40 * scale;
  const bodyHeight = 25 * scale * (1 - ang * 0.3);
  const tailLen = 20 * scale * (1 + ang * 0.2);
  const tailSpread = 12 * scale * (1 + ang * 0.3);
  const jx = jitter(2 * scale);
  const jy = jitter(2 * scale);

  ctx.beginPath();
  // Body
  ctx.moveTo(x + bodyLen + jx, y);
  ctx.bezierCurveTo(
    x + bodyLen * 0.5, y + bodyHeight,
    x - bodyLen * 0.2, y + bodyHeight * 0.8,
    x - bodyLen * 0.3, y + jy
  );
  ctx.bezierCurveTo(
    x - bodyLen * 0.2, y - bodyHeight * 0.8,
    x + bodyLen * 0.5, y - bodyHeight,
    x + bodyLen + jx, y
  );
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(x - bodyLen * 0.3, y + jy);
  ctx.lineTo(x - bodyLen * 0.3 - tailLen, y + tailSpread);
  ctx.lineTo(x - bodyLen * 0.3 - tailLen, y - tailSpread);
  ctx.closePath();
  ctx.fill();

  if (dorsalFin) {
    const finHeight = 18 * scale * (1 + ang * 0.3);
    const finBase = bodyLen * 0.15;
    ctx.beginPath();
    ctx.moveTo(x + finBase - 5, y - bodyHeight * 0.5);
    ctx.lineTo(x + finBase + 5, y - bodyHeight * 0.5 - finHeight);
    ctx.lineTo(x + finBase + 15, y - bodyHeight * 0.5);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draw a radial burst onto a canvas 2D context.
 * Same shape family as renderRadialBurst. Caller sets fillStyle/strokeStyle.
 */
export function canvasRadialBurstPath(
  ctx: CanvasRenderingContext2D,
  spec: RadialBurstSpec,
  x: number,
  y: number
): void {
  const {
    armCount,
    radius,
    innerRadius = radius * 0.3,
    strokeWidth = 2,
    seed = 0,
  } = spec;
  const rng = mulberry32(seed);
  const total = armCount * 2;

  ctx.beginPath();
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const baseRad = isOuter ? radius : innerRadius;
    const rad = isOuter ? baseRad * (0.85 + rng() * 0.3) : baseRad;
    const px = x + rad * Math.cos(angle);
    const py = y + rad * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  if (strokeWidth > 0) {
    ctx.stroke();
  }
}

/**
 * Draw an irregular fragment onto a canvas 2D context.
 * Same shape family as renderIrregularFragment. Caller sets fillStyle/strokeStyle.
 */
export function canvasIrregularFragmentPath(
  ctx: CanvasRenderingContext2D,
  spec: IrregularFragmentSpec,
  x: number,
  y: number
): void {
  const {
    seed,
    vertexCount = 7,
    irregularity = 60,
    radius = 30,
    strokeWidth = 2,
  } = spec;
  // canvasPolygonPath uses center=50 default; we offset so the polygon
  // centers at (x, y). Pass center=0 and offset by (x, y).
  canvasPolygonPath(ctx, { vertexCount, irregularity, seed, radius, center: 0 }, x, y);
  ctx.fill();
  if (strokeWidth > 0) {
    ctx.stroke();
  }
}

/**
 * SVG-to-canvas bridge: render an SVG string to a canvas via an Image.
 * Returns a Promise that resolves when the image is drawn. Useful for
 * consumers that want to use SVG-generated art in a canvas context.
 * The SVG must be self-contained (no external references).
 */
export function svgToCanvas(
  ctx: CanvasRenderingContext2D,
  svgString: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to canvas'));
    };
    img.src = url;
  });
}

/** Helper to map a BorderStyle to a stroke width and dash array. */
export function borderStyleAttributes(style: BorderStyle): {
  strokeWidth: number;
  dashArray?: string;
  filter?: string;
} {
  switch (style) {
    case 'solid':
      return { strokeWidth: 2 };
    case 'thick':
      return { strokeWidth: 4 };
    case 'dashed':
      return { strokeWidth: 4, dashArray: '6 4' };
    case 'glow':
      return { strokeWidth: 6, filter: 'url(#glow)' };
    default:
      return { strokeWidth: 2 };
  }
}
