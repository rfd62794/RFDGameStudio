/**
 * Technique 1: Bézier Curve Paths
 *
 * Real cubic Bézier `C` commands via Catmull-Rom → Bézier conversion.
 * Generates an organic humanoid silhouette: head blob + torso blob +
 * two arm blobs + two leg blobs, each using cubic Bézier curves.
 *
 * Family: Smooth-procedural-vector
 */

import { mulberry32, FILL, STROKE, STROKE_WIDTH } from './shared';

interface Anchor { x: number; y: number; }

function generateBlobPath(
  cx: number, cy: number, baseRadius: number, jitter: number,
  anchorCount: number, tension: number, rng: () => number,
): string {
  const anchors: Anchor[] = [];
  for (let i = 0; i < anchorCount; i++) {
    const angle = (i / anchorCount) * 2 * Math.PI;
    const r = baseRadius * (1 + (rng() - 0.5) * 2 * jitter);
    anchors.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  const get = (i: number) => anchors[((i % anchorCount) + anchorCount) % anchorCount];
  const fmt = (n: number) => n.toFixed(2);
  let d = `M${fmt(anchors[0].x)},${fmt(anchors[0].y)}`;
  for (let i = 0; i < anchorCount; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C${fmt(cp1x)},${fmt(cp1y)} ${fmt(cp2x)},${fmt(cp2y)} ${fmt(p2.x)},${fmt(p2.y)}`;
  }
  return d + ' Z';
}

export function renderBezier(): string {
  const rng = mulberry32(42);
  const tension = 0.167;
  const parts = [
    // head
    generateBlobPath(100, 35, 16, 0.12, 8, tension, rng),
    // torso
    generateBlobPath(100, 80, 22, 0.10, 8, tension, rng),
    // left arm
    generateBlobPath(72, 78, 9, 0.15, 6, tension, rng),
    // right arm
    generateBlobPath(128, 78, 9, 0.15, 6, tension, rng),
    // left leg
    generateBlobPath(88, 130, 10, 0.12, 6, tension, rng),
    // right leg
    generateBlobPath(112, 130, 10, 0.12, 6, tension, rng),
  ];
  return parts.map(d =>
    `<path d="${d}" fill="${FILL}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>`
  ).join('');
}

export const techniqueInfo = {
  id: 'bezier',
  name: '1. Bézier Curve Paths',
  family: 'Smooth-procedural-vector',
  description: 'Real cubic Bézier C commands via Catmull-Rom conversion. Each body part is a closed organic blob with curved edges.',
};
