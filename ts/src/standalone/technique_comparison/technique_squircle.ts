/**
 * Technique 5: Superellipse / Squircle
 *
 * The real parametric superellipse formula: |x/a|^n + |y/b|^n = 1
 * Applied to head and torso. n=2 is a standard ellipse, n=4 is a
 * squircle (between ellipse and rectangle), n>6 approaches rectangle.
 *
 * Family: Smooth-procedural-vector
 */

import { FILL, STROKE, STROKE_WIDTH } from './shared';

function generateSuperellipsePath(
  cx: number, cy: number, a: number, b: number, n: number, segments: number,
): string {
  const fmt = (x: number) => x.toFixed(2);
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    // Superellipse parametric form
    const x = cx + Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n) * a;
    const y = cy + Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n) * b;
    points.push([x, y]);
  }
  // Use cubic Bézier for smooth curves between points
  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${fmt(points[i][0])},${fmt(points[i][1])}`;
  }
  d += ' Z';
  // Actually, for a superellipse with enough segments, L commands produce
  // a smooth-enough result. But let's use Q for genuine smoothness.
  // Rebuild with quadratic Bézier through midpoints
  d = `M${fmt((points[0][0] + points[points.length - 1][0]) / 2)},${fmt((points[0][1] + points[points.length - 1][1]) / 2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr[0] + next[0]) / 2;
    const midY = (curr[1] + next[1]) / 2;
    d += ` Q${fmt(curr[0])},${fmt(curr[1])} ${fmt(midX)},${fmt(midY)}`;
  }
  d += ' Z';
  return d;
}

export function renderSquircle(): string {
  // Head: squircle with n=2.5 (slightly squircle, not pure ellipse)
  const head = generateSuperellipsePath(100, 35, 14, 16, 2.5, 48);
  // Torso: squircle with n=3 (more rectangular, like a chest)
  const torso = generateSuperellipsePath(100, 82, 24, 28, 3, 48);
  // Arms: squircle with n=2.2 (close to ellipse, slightly squircle)
  const leftArm = generateSuperellipsePath(72, 80, 8, 16, 2.2, 32);
  const rightArm = generateSuperellipsePath(128, 80, 8, 16, 2.2, 32);
  // Legs: squircle with n=2.3
  const leftLeg = generateSuperellipsePath(90, 130, 9, 18, 2.3, 32);
  const rightLeg = generateSuperellipsePath(110, 130, 9, 18, 2.3, 32);

  return [head, torso, leftArm, rightArm, leftLeg, rightLeg]
    .map(d => `<path d="${d}" fill="${FILL}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>`)
    .join('');
}

export const techniqueInfo = {
  id: 'squircle',
  name: '5. Superellipse / Squircle',
  family: 'Smooth-procedural-vector',
  description: 'Real parametric formula |x/a|^n + |y/b|^n = 1. n=2 is ellipse, n=4 is squircle, n>6 approaches rectangle. Torso uses n=3 for chest structure.',
};
