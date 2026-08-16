/**
 * Technique 6: SDF + Smooth-Min Blending
 *
 * Real signed-distance-field primitives (circle SDF, capsule SDF)
 * combined via the smooth-minimum (smin) function. The SDF field
 * is sampled on a grid and rendered as colored pixels, with the
 * shape boundary at SDF=0. This is likely close to what ChimeraLab's
 * contour generation actually does internally.
 *
 * Family: Smooth-procedural-vector
 */

import { FILL } from './shared';

// ── SDF primitives ──
function sdCircle(px: number, py: number, cx: number, cy: number, r: number): number {
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) - r;
}

function sdCapsule(px: number, py: number, ax: number, ay: number, bx: number, by: number, r: number): number {
  const pa = [px - ax, py - ay];
  const ba = [bx - ax, by - ay];
  const h = Math.max(0, Math.min(1, (pa[0] * ba[0] + pa[1] * ba[1]) / (ba[0] ** 2 + ba[1] ** 2)));
  const dx = pa[0] - ba[0] * h;
  const dy = pa[1] - ba[1] * h;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

// ── Smooth minimum (polynomial smin) ──
function smin(a: number, b: number, k: number): number {
  const h = Math.max(0, Math.min(0.5, 0.5 - 0.5 * (b - a) / k));
  return (1 - 2 * h) * a + 2 * h * b + k * h * h;
}

function smin3(a: number, b: number, c: number, k: number): number {
  return smin(smin(a, b, k), c, k);
}

export function renderSDF(): string {
  const resolution = 80; // 80x80 grid in a 200x200 viewBox
  const cellSize = 200 / resolution;
  const blendK = 8; // smooth-min blend radius

  // Build the combined SDF for a humanoid figure
  function combinedSDF(px: number, py: number): number {
    const head = sdCircle(px, py, 100, 35, 13);
    const torso = sdCapsule(px, py, 100, 48, 100, 105, 20);
    const leftArm = sdCapsule(px, py, 82, 55, 68, 95, 8);
    const rightArm = sdCapsule(px, py, 118, 55, 132, 95, 8);
    const leftLeg = sdCapsule(px, py, 92, 105, 87, 155, 9);
    const rightLeg = sdCapsule(px, py, 108, 105, 113, 155, 9);
    // Combine all with smooth-min
    const body = smin3(torso, leftArm, rightArm, blendK);
    const lower = smin3(body, leftLeg, rightLeg, blendK);
    return smin(lower, head, blendK);
  }

  // Render as SVG rects — each cell colored by SDF value
  // Inside (SDF < 0) = fill color, outside = transparent
  // Near boundary (|SDF| < cellSize) = anti-aliased
  let rects = '';
  for (let gy = 0; gy < resolution; gy++) {
    for (let gx = 0; gx < resolution; gx++) {
      const px = (gx + 0.5) * cellSize;
      const py = (gy + 0.5) * cellSize;
      const d = combinedSDF(px, py);
      if (d < 0) {
        // Inside — full opacity
        rects += `<rect x="${(gx * cellSize).toFixed(1)}" y="${(gy * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="${FILL}"/>`;
      } else if (d < cellSize) {
        // Near boundary — anti-aliased
        const alpha = 1 - d / cellSize;
        rects += `<rect x="${(gx * cellSize).toFixed(1)}" y="${(gy * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="${FILL}" fill-opacity="${alpha.toFixed(2)}"/>`;
      }
    }
  }
  return rects;
}

export const techniqueInfo = {
  id: 'sdf',
  name: '6. SDF + Smooth-Min Blending',
  family: 'Smooth-procedural-vector',
  description: 'Real signed-distance-field primitives (circle, capsule) combined via polynomial smin. Body parts blend smoothly at joints. Rendered as grid pixels with anti-aliasing.',
};
