/**
 * Technique 3: Stroke-Based Skeleton Render
 *
 * Reuses the real FK bone-chain concept: define bone points and
 * draw thick stroked paths between them with stroke-linecap="round".
 * No fill-shape math at all — the stroke IS the body.
 *
 * Family: Smooth-procedural-vector
 */

import { FILL, STROKE } from './shared';

export function renderStrokeSkeleton(): string {
  // Bone points for a humanoid figure
  // Each bone is a line from point A to point B with a thickness
  const bones: Array<{ x1: number; y1: number; x2: number; y2: number; w: number }> = [
    // Spine: neck to hip
    { x1: 100, y1: 50, x2: 100, y2: 105, w: 18 },
    // Shoulders: left to right
    { x1: 75, y1: 55, x2: 125, y2: 55, w: 12 },
    // Left arm: shoulder to hand
    { x1: 75, y1: 55, x2: 62, y2: 95, w: 9 },
    // Right arm
    { x1: 125, y1: 55, x2: 138, y2: 95, w: 9 },
    // Left leg: hip to foot
    { x1: 90, y1: 105, x2: 85, y2: 155, w: 11 },
    // Right leg
    { x1: 110, y1: 105, x2: 115, y2: 155, w: 11 },
  ];

  const paths = bones.map(b =>
    `<line x1="${b.x1}" y1="${b.y1}" x2="${b.x2}" y2="${b.y2}" ` +
    `stroke="${FILL}" stroke-width="${b.w}" stroke-linecap="round"/>`
  ).join('');

  // Head as a stroked circle (no fill, just thick stroke)
  const head = `<circle cx="100" cy="35" r="12" fill="none" stroke="${FILL}" stroke-width="8"/>`;

  return head + paths;
}

export const techniqueInfo = {
  id: 'stroke',
  name: '3. Stroke-Based Skeleton',
  family: 'Smooth-procedural-vector',
  description: 'Thick stroked paths with round linecaps. No fill-shape math — the stroke IS the body. Reuses FK bone-chain data directly.',
};
