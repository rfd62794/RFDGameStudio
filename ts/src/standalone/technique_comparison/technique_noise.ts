/**
 * Technique 4: Noise-Perturbed Smooth Outline
 *
 * A circle/ellipse boundary perturbed by fractal value noise (not
 * vertex-jittered polygon). The noise creates organic variation in
 * the radius while the outline remains smooth (interpolated between
 * noise samples). Uses quadratic Bézier for smooth connection.
 *
 * Family: Smooth-procedural-vector
 */

import { fractalNoise1D, FILL, STROKE, STROKE_WIDTH } from './shared';

export function renderNoiseOutline(): string {
  const cx = 100, cy = 80;
  const baseRx = 24, baseRy = 28;
  const sampleCount = 64; // high sample count for smooth outline
  const noiseScale = 3; // how many noise features around the perimeter
  const noiseAmp = 0.15; // 15% radius variation
  const seed = 42;

  // Sample points around the ellipse with noise-perturbed radius
  const points: Array<[number, number]> = [];
  for (let i = 0; i < sampleCount; i++) {
    const t = (i / sampleCount) * 2 * Math.PI;
    const noise = fractalNoise1D((i / sampleCount) * noiseScale, seed, 4);
    const rx = baseRx * (1 + (noise - 0.5) * 2 * noiseAmp);
    const ry = baseRy * (1 + (noise - 0.5) * 2 * noiseAmp);
    points.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }

  // Build smooth path using quadratic Bézier between midpoints
  // This creates a genuinely smooth curve, not a polygon
  const fmt = (n: number) => n.toFixed(2);
  const mid = (a: [number, number], b: [number, number]): [number, number] =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  let d = `M${fmt(mid(points[points.length - 1], points[0])[0])},${fmt(mid(points[points.length - 1], points[0])[1])}`;
  for (let i = 0; i < sampleCount; i++) {
    const curr = points[i];
    const next = points[(i + 1) % sampleCount];
    const midNext = mid(curr, next);
    // Q command: quadratic Bézier with curr as control point
    d += ` Q${fmt(curr[0])},${fmt(curr[1])} ${fmt(midNext[0])},${fmt(midNext[1])}`;
  }
  d += ' Z';

  // Also render a head as a noise-perturbed circle
  const headCx = 100, headCy = 35, headR = 14;
  const headPoints: Array<[number, number]> = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * 2 * Math.PI;
    const noise = fractalNoise1D((i / 48) * 4, seed + 500, 3);
    const r = headR * (1 + (noise - 0.5) * 2 * 0.08);
    headPoints.push([headCx + r * Math.cos(t), headCy + r * Math.sin(t)]);
  }
  let headD = `M${fmt(mid(headPoints[headPoints.length - 1], headPoints[0])[0])},${fmt(mid(headPoints[headPoints.length - 1], headPoints[0])[1])}`;
  for (let i = 0; i < 48; i++) {
    const curr = headPoints[i];
    const next = headPoints[(i + 1) % 48];
    const midNext = mid(curr, next);
    headD += ` Q${fmt(curr[0])},${fmt(curr[1])} ${fmt(midNext[0])},${fmt(midNext[1])}`;
  }
  headD += ' Z';

  return `<path d="${headD}" fill="${FILL}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="${FILL}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>`;
}

export const techniqueInfo = {
  id: 'noise',
  name: '4. Noise-Perturbed Smooth Outline',
  family: 'Smooth-procedural-vector',
  description: 'Fractal value noise perturbs the radius, quadratic Bézier connects midpoints for smoothness. Not vertex-jittered polygon.',
};
