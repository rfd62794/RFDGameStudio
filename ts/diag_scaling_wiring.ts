/**
 * diag_scaling_wiring.ts — Real, objective evidence of whether biological
 * scaling is actually wired into the composer's live render path.
 *
 * Calls composeFigure() with a real humanoidBilateral input and reports:
 *   - Resolved attachment positions (from attachmentGraph)
 *   - Shape params BEFORE and AFTER applyBiologicalScaling
 *   - Which BIOLOGICAL_SCALING constants are actually referenced
 *   - Real proportion ratios (head/body, limb/torso, etc.)
 *
 * Usage: npx tsx diag_scaling_wiring.ts
 */
import { composeFigure, humanoidBilateral } from './src/engine/paperDoll/index';
import { BIOLOGICAL_SCALING } from './src/engine/paperDoll/types';
import { PART_SLOTS } from './src/engine/shared/partSlots';
import type { CompositionInput, PartForComposition } from './src/engine/paperDoll/types';

// ── Build a real CompositionInput (same as Character Viewer's BIONICLE preset) ──
function makeDummyParts(): Record<string, PartForComposition | null> {
  const parts: Record<string, PartForComposition | null> = {};
  for (const slot of PART_SLOTS) {
    parts[slot] = { id: `dummy_${slot}`, name: slot, slot };
  }
  return parts;
}

const input: CompositionInput = {
  bodyPlan: humanoidBilateral,
  parts: makeDummyParts(),
  colors: {
    head: '#1e88e5', chest: '#1e88e5',
    left_arm: '#1e88e5', right_arm: '#1e88e5',
    left_leg: '#1e88e5', right_leg: '#1e88e5',
  },
  seed: 100,
};

// ── Compose and extract real numbers ──
const composed = composeFigure(input);

console.log('═══════════════════════════════════════════════════════════════');
console.log('  BIOLOGICAL SCALING WIRING DIAGNOSTIC');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Report BIOLOGICAL_SCALING constants
console.log('── BIOLOGICAL_SCALING constants (defined in types.ts) ──');
console.log(`  kleiberExponent: ${BIOLOGICAL_SCALING.kleiberExponent}`);
console.log(`  jointBuffer:     ${BIOLOGICAL_SCALING.jointBuffer}`);
console.log(`  limbEndTaper:    ${BIOLOGICAL_SCALING.limbEndTaper}`);
console.log(`  torsoHips:       ${BIOLOGICAL_SCALING.torsoHips}`);
console.log(`  torsoWaist:      ${BIOLOGICAL_SCALING.torsoWaist}`);
console.log(`  torsoChest:      ${BIOLOGICAL_SCALING.torsoChest}`);
console.log(`  torsoNeck:       ${BIOLOGICAL_SCALING.torsoNeck}`);
console.log(`  torsoHead:       ${BIOLOGICAL_SCALING.torsoHead}`);
console.log(`  bulgeFactor:     ${BIOLOGICAL_SCALING.bulgeFactor}`);
console.log(`  bulgeSegments:   ${BIOLOGICAL_SCALING.bulgeSegments}`);

// 2. Check which constants are actually referenced in composer.ts
const fs = await import('node:fs');
const composerSrc = fs.readFileSync('./src/engine/paperDoll/composer.ts', 'utf-8');
console.log('\n── Which constants are actually referenced in composer.ts ──');
const constants = ['kleiberExponent', 'jointBuffer', 'limbEndTaper', 'torsoHips', 'torsoWaist', 'torsoChest', 'torsoNeck', 'torsoHead', 'bulgeFactor', 'bulgeSegments'];
for (const c of constants) {
  const used = composerSrc.includes(`BIOLOGICAL_SCALING.${c}`);
  console.log(`  BIOLOGICAL_SCALING.${c.padEnd(18)} ${used ? 'REFERENCED' : 'NOT REFERENCED'}`);
}

// 3. Report resolved positions
console.log('\n── Resolved attachment positions (from composeFigure output) ──');
for (const part of composed) {
  console.log(`  ${part.slot.padEnd(12)} pos=(${part.x.toFixed(1)}, ${part.y.toFixed(1)})  angle=${part.angle.toFixed(3)}  region=${part.region}  side=${part.side}  zOrder=${part.zOrder}`);
}

// 4. Report shape params from the body plan (before scaling)
console.log('\n── Shape params from humanoidBilateral (BEFORE scaling) ──');
for (const sm of humanoidBilateral.shapeMappings) {
  console.log(`  ${sm.slot.padEnd(12)} ${sm.primitive.padEnd(18)} params=${JSON.stringify(sm.baseParams)}`);
}

// 5. Extract actual rendered dimensions from the SVG
console.log('\n── Actual rendered dimensions (parsed from SVG output) ──');
for (const part of composed) {
  // Extract all coordinate pairs from the SVG
  const coords: Array<[number, number]> = [];
  for (const m of part.svg.matchAll(/points="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }
  }
  for (const m of part.svg.matchAll(/\sd="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }
  }

  // Apply transform
  const transformMatch = part.svg.match(/translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)/);
  if (!transformMatch) continue;
  const tx = parseFloat(transformMatch[1]);
  const ty = parseFloat(transformMatch[2]);
  const angleRad = (parseFloat(transformMatch[3]) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [lx, ly] of coords) {
    const gx = tx + lx * cos - ly * sin;
    const gy = ty + lx * sin + ly * cos;
    if (gx < minX) minX = gx;
    if (gx > maxX) maxX = gx;
    if (gy < minY) minY = gy;
    if (gy > maxY) maxY = gy;
  }

  if (minX !== Infinity) {
    const width = maxX - minX;
    const height = maxY - minY;
    console.log(`  ${part.slot.padEnd(12)} width=${width.toFixed(1)}  height=${height.toFixed(1)}  bounds=(${minX.toFixed(1)},${minY.toFixed(1)}) to (${maxX.toFixed(1)},${maxY.toFixed(1)})`);
  }
}

// 6. Compute proportion ratios
console.log('\n── Proportion ratios (current figure vs standard human) ──');
const headPart = composed.find(p => p.slot === 'head')!;
const chestPart = composed.find(p => p.slot === 'chest')!;
const leftArmPart = composed.find(p => p.slot === 'left_arm')!;
const leftLegPart = composed.find(p => p.slot === 'left_leg')!;

// Helper to get bounding box
function getBounds(svg: string, partX: number, partY: number) {
  const coords: Array<[number, number]> = [];
  for (const m of svg.matchAll(/points="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
  }
  for (const m of svg.matchAll(/\sd="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
  }
  const tm = svg.match(/translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)/);
  if (!tm) return null;
  const tx = parseFloat(tm[1]), ty = parseFloat(tm[2]);
  const a = (parseFloat(tm[3]) * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [lx, ly] of coords) {
    const gx = tx + lx * c - ly * s;
    const gy = ty + lx * s + ly * c;
    if (gx < minX) minX = gx; if (gx > maxX) maxX = gx;
    if (gy < minY) minY = gy; if (gy > maxY) maxY = gy;
  }
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

const headBounds = getBounds(headPart.svg, headPart.x, headPart.y);
const chestBounds = getBounds(chestPart.svg, chestPart.x, chestPart.y);
const armBounds = getBounds(leftArmPart.svg, leftArmPart.x, leftArmPart.y);
const legBounds = getBounds(leftLegPart.svg, leftLegPart.x, leftLegPart.y);

if (headBounds && chestBounds && armBounds && legBounds) {
  const headHeight = headBounds.height;
  const chestWidth = chestBounds.width;
  const armLength = armBounds.width; // teardropFin is wider than tall
  const legLength = legBounds.width;

  // Total figure height: head top to leg bottom
  const figTop = headBounds.minY;
  const figBottom = legBounds.maxY;
  const totalHeight = figBottom - figTop;

  console.log(`  headHeight:       ${headHeight.toFixed(1)} units`);
  console.log(`  chestWidth:       ${chestWidth.toFixed(1)} units`);
  console.log(`  armLength:        ${armLength.toFixed(1)} units`);
  console.log(`  legLength:        ${legLength.toFixed(1)} units`);
  console.log(`  totalHeight:      ${totalHeight.toFixed(1)} units (head top to leg bottom)`);
  console.log();
  console.log(`  headHeight/totalHeight:  ${(headHeight/totalHeight).toFixed(3)}  (standard human: ~0.13 = 1/7.5)`);
  console.log(`  chestWidth/headHeight:   ${(chestWidth/headHeight).toFixed(3)}  (standard human: ~2.0 for shoulders)`);
  console.log(`  armLength/legLength:      ${(armLength/legLength).toFixed(3)}  (standard human: ~0.83)`);
  console.log(`  armLength/totalHeight:    ${(armLength/totalHeight).toFixed(3)}  (standard human: ~0.44)`);
  console.log(`  legLength/totalHeight:    ${(legLength/totalHeight).toFixed(3)}  (standard human: ~0.53)`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  Done.');
console.log('═══════════════════════════════════════════════════════════════');
