// Quick diagnostic: generate SVG with the fix and verify viewBox
import { renderFigureSvg, humanoidBilateral, chimeraAsymmetric } from './src/engine/paperDoll/index';
import { PART_SLOTS } from './src/engine/shared/partSlots';
import * as fs from 'fs';

function makeDummyParts() {
  const parts: Record<string, any> = {};
  for (const slot of PART_SLOTS) parts[slot] = { id: `dummy_${slot}`, name: slot, slot };
  return parts;
}

const DUMMY_PARTS = makeDummyParts();
const colors: Record<string, string> = {};
for (const slot of PART_SLOTS) colors[slot] = '#3b82f6';

// Test 1: humanoidBilateral at 300x300 (what the viewer does)
const svg1 = renderFigureSvg(
  { bodyPlan: humanoidBilateral, parts: DUMMY_PARTS, colors, seed: 42 },
  300, 300
);
fs.writeFileSync('tmp/diag_humanoid_300.svg', svg1);
console.log('=== humanoidBilateral 300x300 ===');
console.log('viewBox:', svg1.match(/viewBox="([^"]+)"/)?.[1]);
console.log('width:', svg1.match(/width="(\d+)"/)?.[1]);
console.log('height:', svg1.match(/height="(\d+)"/)?.[1]);
console.log('preserveAspectRatio:', svg1.match(/preserveAspectRatio="([^"]+)"/)?.[1]);

// Test 2: chimeraAsymmetric at 300x300
const svg2 = renderFigureSvg(
  { bodyPlan: chimeraAsymmetric, parts: DUMMY_PARTS, colors, seed: 42 },
  300, 300
);
fs.writeFileSync('tmp/diag_chimera_300.svg', svg2);
console.log('\n=== chimeraAsymmetric 300x300 ===');
console.log('viewBox:', svg2.match(/viewBox="([^"]+)"/)?.[1]);

// Test 3: 100x100 (default)
const svg3 = renderFigureSvg(
  { bodyPlan: humanoidBilateral, parts: DUMMY_PARTS, colors, seed: 42 },
  100, 100
);
fs.writeFileSync('tmp/diag_humanoid_100.svg', svg3);
console.log('\n=== humanoidBilateral 100x100 ===');
console.log('viewBox:', svg3.match(/viewBox="([^"]+)"/)?.[1]);

// Test 4: with large radius (edge case)
const largeColors = { ...colors };
const largePlan = {
  ...humanoidBilateral,
  shapeMappings: PART_SLOTS.map(slot => ({
    slot,
    primitive: 'polygon' as const,
    baseParams: { vertexCount: 6, irregularity: 10, radius: 40 },
  })),
};
const svg4 = renderFigureSvg(
  { bodyPlan: largePlan, parts: DUMMY_PARTS, colors: largeColors, seed: 42 },
  300, 300
);
fs.writeFileSync('tmp/diag_large_radius.svg', svg4);
console.log('\n=== large radius (40) 300x300 ===');
console.log('viewBox:', svg4.match(/viewBox="([^"]+)"/)?.[1]);

console.log('\nSVG files saved to tmp/ for visual inspection');
