/**
 * Technique 10: Flat vs Shaded Comparison
 *
 * Confirmed: ChimeraLab's shading system (calculateShadeFactor,
 * edge-lighting) was never ported or wired into anything here.
 * Every technique above uses flat color only.
 *
 * This comparison shows the CURRENT primitive (sigmoidBulge, from
 * the prior directive) in flat color vs with a simple SVG radial
 * gradient shading applied — demonstrating that flat color alone
 * may be doing real damage to every technique equally.
 *
 * Family: Comparison check (not a new technique)
 */

import { FILL, STROKE } from './shared';

// ── Generate a sigmoid bulge shape (same algorithm as composer) ──
function sigmoidBulgePath(widthStart: number, widthEnd: number, segments: number, bulgeFactor: number): string {
  const avgWidth = (widthStart + widthEnd) / 2;
  const length = avgWidth * 3;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const cx = length * t;
    const baseW = widthStart * (1 - t) + widthEnd * t;
    const bulge = Math.sin(t * Math.PI) * baseW * bulgeFactor;
    const w = (baseW + bulge) * 0.5;
    left.push(`${(cx + w).toFixed(1)},0`);
    right.push(`${(cx - w).toFixed(1)},0`);
  }
  return 'M' + [...left, ...right.reverse()].join(' L') + ' Z';
}

export function renderShadingComparison(): string {
  // Two side-by-side figures: flat (left) vs shaded (right)
  const parts = [
    { d: sigmoidBulgePath(15, 9, 6, 0.4), x: 50, y: 80, rot: -20 },
    { d: sigmoidBulgePath(15, 9, 6, 0.4), x: 50, y: 80, rot: 20 },
    { d: sigmoidBulgePath(18, 9, 8, 0.3), x: 50, y: 65, rot: 0 },
    { d: sigmoidBigmoidPath(11, 10, 6, 0.35), x: 42, y: 105, rot: -7 },
    { d: sigmoidBulgePath(11, 10, 6, 0.35), x: 58, y: 105, rot: 7 },
  ];

  function sigmoidBigmoidPath(a: number, b: number, c: number, d: number) {
    return sigmoidBulgePath(a, b, c, d);
  }

  // Flat version (left side, offset x by -50)
  let flatSvg = '';
  for (const p of parts) {
    flatSvg += `<g transform="translate(${p.x - 50},${p.y}) rotate(${p.rot})"><path d="${p.d}" fill="${FILL}" stroke="${STROKE}" stroke-width="1.5"/></g>`;
  }
  // Head (flat)
  flatSvg += `<circle cx="0" cy="35" r="12" fill="${FILL}" stroke="${STROKE}" stroke-width="1.5" transform="translate(0,0)"/>`;

  // Shaded version (right side, offset x by +50)
  // Uses SVG radial gradient for volumetric shading
  const gradId = 'shade-grad';
  const gradient = `
    <radialGradient id="${gradId}" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#6ba3f8"/>
      <stop offset="60%" stop-color="${FILL}"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </radialGradient>
  `;
  let shadedSvg = '';
  for (const p of parts) {
    shadedSvg += `<g transform="translate(${p.x + 50},${p.y}) rotate(${p.rot})"><path d="${p.d}" fill="url(#${gradId})" stroke="${STROKE}" stroke-width="1.5"/></g>`;
  }
  // Head (shaded)
  shadedSvg += `<circle cx="100" cy="35" r="12" fill="url(#${gradId})" stroke="${STROKE}" stroke-width="1.5"/>`;

  return `<defs>${gradient}</defs>
    <text x="0" y="15" font-size="9" font-family="monospace" fill="#666">FLAT (current)</text>
    ${flatSvg}
    <text x="100" y="15" font-size="9" font-family="monospace" fill="#666">SHADED (gradient)</text>
    ${shadedSvg}`;
}

export const techniqueInfo = {
  id: 'shading',
  name: '10. Flat vs Shaded (comparison check)',
  family: 'Comparison check',
  description: 'ChimeraLab shading was never ported. Left: current flat color. Right: simple radial gradient. Flat color may damage all techniques equally.',
};
