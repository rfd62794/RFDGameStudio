/**
 * Technique 2: Goo/Metaball SVG Filter
 *
 * Overlapping circles rendered through feGaussianBlur + feColorMatrix
 * to create a "gooey" merge effect at joints. The filter threshold
 * causes adjacent shapes to visually blend into one organic mass.
 *
 * Family: Smooth-procedural-vector
 */

import { FILL, STROKE } from './shared';

export function renderMetaball(): string {
  // Unique filter ID to avoid collisions
  const filterId = 'goo-filter';
  const filter = `
    <filter id="${filterId}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
      <feColorMatrix in="blur" mode="matrix" values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 18 -7
      " result="goo"/>
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
  `;

  // Overlapping circles for head, torso, arms, legs
  // Positioned so they overlap at joints — the filter merges them
  const circles = [
    // head
    `<circle cx="100" cy="35" r="14" fill="${FILL}"/>`,
    // torso (overlaps head at neck)
    `<circle cx="100" cy="75" r="22" fill="${FILL}"/>`,
    // left arm (overlaps torso at shoulder)
    `<circle cx="74" cy="78" r="10" fill="${FILL}"/>`,
    `<circle cx="68" cy="92" r="8" fill="${FILL}"/>`,
    // right arm
    `<circle cx="126" cy="78" r="10" fill="${FILL}"/>`,
    `<circle cx="132" cy="92" r="8" fill="${FILL}"/>`,
    // left leg (overlaps torso at hip)
    `<circle cx="90" cy="120" r="11" fill="${FILL}"/>`,
    `<circle cx="88" cy="140" r="9" fill="${FILL}"/>`,
    // right leg
    `<circle cx="110" cy="120" r="11" fill="${FILL}"/>`,
    `<circle cx="112" cy="140" r="9" fill="${FILL}"/>`,
  ].join('');

  return `<defs>${filter}</defs><g filter="url(#${filterId})">${circles}</g>`;
}

export const techniqueInfo = {
  id: 'metaball',
  name: '2. Goo/Metaball SVG Filter',
  family: 'Smooth-procedural-vector',
  description: 'feGaussianBlur + feColorMatrix threshold. Overlapping circles merge at joints into one organic shape. Joints blend automatically.',
};
