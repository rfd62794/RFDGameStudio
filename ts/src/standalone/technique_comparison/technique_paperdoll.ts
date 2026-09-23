/**
 * Technique 8: True Paper-Doll Asset Swap
 *
 * ⚠️ STRATEGIC FORK — not just more shape math.
 *
 * Tests the *compositing feel* of real asset-authored body parts.
 * Uses simple inline-SVG placeholder "assets" (clearly throwaway,
 * not final art) composited via real positioning/coloring logic.
 * The question: does asset compositing read as more recognizable
 * than procedural shapes, even with crude placeholder art?
 *
 * Family: Strategic fork (asset-authoring commitment)
 */

import { FILL, STROKE, STROKE_WIDTH } from './shared';

// ── Placeholder "assets" — crude inline SVG drawings ──
// In a real paper-doll system, these would be authored art files.
// Here they're simple SVG shapes that read as "a drawing of a body part"
// rather than "a geometric primitive" — the key difference being
// intentional artistic shape, not mathematical formula.

function headAsset(color: string): string {
  // Crude head: oval + eyes + simple hair shape
  return `
    <ellipse cx="0" cy="0" rx="13" ry="15" fill="${color}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}"/>
    <circle cx="-5" cy="-2" r="2" fill="white"/><circle cx="-5" cy="-2" r="1" fill="#1e293b"/>
    <circle cx="5" cy="-2" r="2" fill="white"/><circle cx="5" cy="-2" r="1" fill="#1e293b"/>
    <path d="M-10,-10 Q0,-16 10,-10 L8,-8 Q0,-12 -8,-8 Z" fill="${STROKE}" opacity="0.6"/>
    <path d="M-3,5 Q0,7 3,5" stroke="${STROKE}" stroke-width="1" fill="none"/>
  `;
}

function torsoAsset(color: string): string {
  // Crude torso: shoulders wider than waist, simple shirt shape
  return `
    <path d="M-20,-15 Q-22,-10 -18,0 L-12,20 Q0,22 12,20 L18,0 Q22,-10 20,-15 Q10,-18 0,-18 Q-10,-18 -20,-15 Z"
      fill="${color}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}"/>
    <line x1="-15" y1="-10" x2="15" y2="-10" stroke="${STROKE}" stroke-width="0.5" opacity="0.3"/>
  `;
}

function armAsset(color: string, side: string): string {
  const s = side === 'left' ? -1 : 1;
  // Crude arm: tapered shape with hand
  return `
    <path d="M0,-15 Q${s * 4},0 ${s * 3},15 L${s * 6},18 Q${s * 8},20 ${s * 5},22 L${s * 2},20 Q0,10 0,-15 Z"
      fill="${color}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}"/>
  `;
}

function legAsset(color: string, side: string): string {
  const s = side === 'left' ? -1 : 1;
  // Crude leg: tapered with foot
  return `
    <path d="M${s * 2},0 Q${s * 4},15 ${s * 3},28 L${s * 6},30 Q${s * 8},32 ${s * 4},33 L${s * 1},30 Q0,15 0,0 Z"
      fill="${color}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}"/>
  `;
}

export function renderPaperDoll(): string {
  // Compositing logic: position assets at body plan locations
  // This is the real "paper doll" approach — assets are positioned,
  // colored, and z-ordered, not generated from math
  const parts: string[] = [];

  // Render order: back legs, back arm, torso, front arm, head
  parts.push(`<g transform="translate(88,108)">${legAsset(FILL, 'left')}</g>`);
  parts.push(`<g transform="translate(112,108)">${legAsset(FILL, 'right')}</g>`);
  parts.push(`<g transform="translate(76,60)">${armAsset(FILL, 'left')}</g>`);
  parts.push(`<g transform="translate(100,65)">${torsoAsset(FILL)}</g>`);
  parts.push(`<g transform="translate(124,60)">${armAsset(FILL, 'right')}</g>`);
  parts.push(`<g transform="translate(100,32)">${headAsset(FILL)}</g>`);

  return parts.join('');
}

export const techniqueInfo = {
  id: 'paperdoll',
  name: '8. True Paper-Doll Asset Swap ⚠️ STRATEGIC FORK',
  family: 'Strategic fork (asset-authoring)',
  description: 'Crude placeholder asset drawings composited via positioning logic. Tests compositing feel, not final art. Real commitment: requires authored assets for every part/variant.',
};
