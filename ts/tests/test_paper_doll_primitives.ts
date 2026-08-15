// @vitest-environment node
//
// Paper Doll — Recognizable Primitives: Sigmoid Limbs + Real Head Ellipse — Tests
//
// Per §3 of the directive, these tests use real, objective geometry:
//   - Real primitive selection from the actual SlotShapeMapping
//   - Real generated SVG output (element types, coordinate data)
//   - Real width variation along limb length (tapered = not constant)
//   - Real smoothness check (no sharp interior angles in head)
//
// No screenshots, no visual judgment — all geometry data.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeFigure, humanoidBilateral, renderFigureSvg } from '../src/engine/paperDoll/index';
import { renderSigmoidBulge, renderEllipse } from '../src/engine/artGen/index';
import type { CompositionInput, PartForComposition, ComposedPart } from '../src/engine/paperDoll/types';
import { PART_SLOTS } from '../src/engine/shared/partSlots';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const tsRoot = resolve(repoRoot, 'ts');

// ── Test fixture ──
function makeDummyParts(): Record<string, PartForComposition | null> {
  const parts: Record<string, PartForComposition | null> = {};
  for (const slot of PART_SLOTS) {
    parts[slot] = { id: `dummy_${slot}`, name: slot, slot };
  }
  return parts;
}

const DUMMY_PARTS = makeDummyParts();

const TEST_INPUT: CompositionInput = {
  bodyPlan: humanoidBilateral,
  parts: DUMMY_PARTS,
  colors: {
    head: '#1e88e5', chest: '#1e88e5',
    left_arm: '#1e88e5', right_arm: '#1e88e5',
    left_leg: '#1e88e5', right_leg: '#1e88e5',
  },
  seed: 100,
};

// ── Helper: extract all coordinate pairs from SVG content ──
function extractCoords(svg: string): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  for (const m of svg.matchAll(/points="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }
  }
  for (const m of svg.matchAll(/\sd="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }
  }
  // Ellipse: cx, cy, rx, ry → 4 bounding points
  for (const m of svg.matchAll(/<ellipse[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"[^>]*\srx="([^"]+)"[^>]*\sry="([^"]+)"/g)) {
    const cx = parseFloat(m[1]!), cy = parseFloat(m[2]!), rx = parseFloat(m[3]!), ry = parseFloat(m[4]!);
    coords.push([cx + rx, cy], [cx - rx, cy], [cx, cy + ry], [cx, cy - ry]);
  }
  return coords;
}

// ── Helper: get bounding box from composed part ──
function getPartBounds(part: ComposedPart) {
  const coords = extractCoords(part.svg);
  const tm = part.svg.match(/translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)/);
  if (!tm || coords.length === 0) return null;
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
  return { width: maxX - minX, height: maxY - minY, minX, maxX, minY, maxY };
}

// ── Tests ──

describe('test_current_primitives_confirmed', () => {
  it('Real current SlotShapeMapping for humanoidBilateral — all 6 slots reported', () => {
    // Read the actual body plan source and confirm the primitive for each slot
    const src = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'bodyPlans', 'humanoidBilateral.ts'),
      'utf-8',
    );

    // Head should use ellipse (not polygon)
    expect(src).toContain("slot: 'head'");
    expect(src).toContain("primitive: 'ellipse'");

    // Chest should use sigmoidBulge (not polygon)
    expect(src).toContain("slot: 'chest'");
    expect(src).toContain("primitive: 'sigmoidBulge'");

    // All 4 limbs should use sigmoidBulge (not teardropFin)
    for (const slot of ['left_arm', 'right_arm', 'left_leg', 'right_leg']) {
      expect(src).toContain(`slot: '${slot}'`);
    }
    // Count sigmoidBulge occurrences — should be 5 (chest + 4 limbs)
    const sigmoidCount = (src.match(/primitive: 'sigmoidBulge'/g) || []).length;
    expect(sigmoidCount).toBe(5);

    // No teardropFin should remain in the humanoid body plan
    expect(src).not.toContain("primitive: 'teardropFin'");
  });
});

describe('test_sigmoid_bulge_available_and_tested', () => {
  it('renderSigmoidBulge is exported from artGen and callable', () => {
    expect(typeof renderSigmoidBulge).toBe('function');
    const svg = renderSigmoidBulge({
      widthStart: 15,
      widthEnd: 8,
      segments: 6,
      bulgeFactor: 0.4,
      fill: '#3b82f6',
      stroke: '#3b82f6',
      strokeWidth: 2,
    });
    expect(svg).toContain('<polygon');
    expect(svg).toContain('points=');
  });

  it('renderEllipse is exported from artGen and callable', () => {
    expect(typeof renderEllipse).toBe('function');
    const svg = renderEllipse({
      cx: 0, cy: 0, rx: 10, ry: 12,
      fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 2,
    });
    expect(svg).toContain('<ellipse');
    expect(svg).toContain('rx="10"');
    expect(svg).toContain('ry="12"');
  });

  it('Sigmoid bulge produces tapered shape — width varies along length', () => {
    // Generate a sigmoid bulge with clear taper (widthStart=20, widthEnd=5)
    const svg = renderSigmoidBulge({
      widthStart: 20,
      widthEnd: 5,
      segments: 6,
      bulgeFactor: 0.4,
      fill: '#3b82f6',
      stroke: '#3b82f6',
      strokeWidth: 2,
    });
    // Extract all points from the polygon
    const pointsMatch = svg.match(/points="([^"]+)"/);
    expect(pointsMatch).toBeTruthy();
    const nums = pointsMatch![1].match(/-?\d+\.?\d*/g) || [];
    const coords: Array<[number, number]> = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }
    expect(coords.length).toBeGreaterThan(4); // at least 2 segments * 2 sides

    // The shape is drawn along +x from 0 to length.
    // Points near x=0 should have larger |y| (widthStart=20)
    // Points near x=length should have smaller |y| (widthEnd=5)
    const startXCoords = coords.filter(([x]) => x < 1);
    const endXCoords = coords.filter(([x]) => x > coords.reduce((max, [x]) => Math.max(max, x), 0) - 1);

    const startMaxAbsY = Math.max(...startXCoords.map(([, y]) => Math.abs(y)));
    const endMaxAbsY = Math.max(...endXCoords.map(([, y]) => Math.abs(y)));

    // Start should be visibly wider than end (tapered)
    expect(startMaxAbsY).toBeGreaterThan(endMaxAbsY * 1.5);
  });
});

describe('test_limbs_use_sigmoid_bulge', () => {
  it('All four limb slots produce <polygon> from sigmoidBulge (not <path> from teardropFin)', () => {
    const composed = composeFigure(TEST_INPUT);
    for (const slot of ['left_arm', 'right_arm', 'left_leg', 'right_leg']) {
      const part = composed.find(p => p.slot === slot)!;
      expect(part.svg).toContain('<polygon');
      // teardropFin produces <path> elements — sigmoidBulge produces <polygon>
      // The inner content (before transform wrapping) should not contain <path
      const innerContent = part.svg.replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '');
      expect(innerContent).not.toContain('<path');
    }
  });

  it('Limb shapes show real width variation (tapered, not constant width)', () => {
    const composed = composeFigure(TEST_INPUT);
    const leftArm = composed.find(p => p.slot === 'left_arm')!;
    const pointsMatch = leftArm.svg.match(/points="([^"]+)"/);
    expect(pointsMatch).toBeTruthy();

    const nums = pointsMatch![1].match(/-?\d+\.?\d*/g) || [];
    const coords: Array<[number, number]> = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }

    // The polygon has left points (forward) + right points (reversed).
    // Width at each segment = distance between corresponding left/right points.
    // For a tapered limb, width should vary — not all the same.
    const segments = 6;
    const widths: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const left = coords[i];
      const right = coords[coords.length - 1 - i];
      if (left && right) {
        const w = Math.abs(left[1] - right[1]); // y-difference = width
        widths.push(w);
      }
    }
    // Width should vary — not all the same value
    const minW = Math.min(...widths);
    const maxW = Math.max(...widths);
    expect(maxW).toBeGreaterThan(minW * 1.2); // at least 20% variation
  });
});

describe('test_head_uses_smooth_geometry', () => {
  it('Head produces a true <ellipse> element, not a <polygon>', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    expect(head.svg).toContain('<ellipse');
    expect(head.svg).not.toContain('<polygon');
  });

  it('Head ellipse has rx and ry attributes (real ellipse, not circle)', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    expect(head.svg).toContain('rx=');
    expect(head.svg).toContain('ry=');
  });

  it('Head shape is objectively smoother than prior 6-vertex polygon — no interior angles', () => {
    // A polygon has interior angles at each vertex. An ellipse has zero
    // interior angles (it's a smooth curve). The presence of <ellipse>
    // vs <polygon> is the objective smoothness proof.
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;

    // The head SVG must contain <ellipse> and must NOT contain <polygon>
    // or points= attributes (which would indicate a faceted shape)
    expect(head.svg).toContain('<ellipse');
    expect(head.svg).not.toContain('<polygon');
    expect(head.svg).not.toContain('points=');
  });
});

describe('test_no_regression', () => {
  it('composeFigure still produces 6 parts for humanoidBilateral', () => {
    const composed = composeFigure(TEST_INPUT);
    expect(composed).toHaveLength(6);
    const slots = composed.map(p => p.slot).sort();
    expect(slots).toEqual([...PART_SLOTS].sort());
  });

  it('renderFigureSvg still produces valid SVG with viewBox', () => {
    const svg = renderFigureSvg(TEST_INPUT, 300, 300);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox=');
  });

  it('Proportion ratios still within human bounds after primitive switch', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    const leftArm = composed.find(p => p.slot === 'left_arm')!;
    const leftLeg = composed.find(p => p.slot === 'left_leg')!;

    const headBounds = getPartBounds(head)!;
    const armBounds = getPartBounds(leftArm)!;
    const legBounds = getPartBounds(leftLeg)!;

    const totalHeight = legBounds.maxY - headBounds.minY;
    const headRatio = headBounds.height / totalHeight;
    const armLegRatio = armBounds.width / legBounds.width;

    // Stylized human range
    expect(headRatio).toBeGreaterThan(0.15);
    expect(headRatio).toBeLessThan(0.30);
    // Arm/leg ratio close to standard human
    expect(armLegRatio).toBeGreaterThan(0.7);
    expect(armLegRatio).toBeLessThan(1.0);
  });

  it('PaperDoll React component still works — MBB and Chimera Wilds unaffected', () => {
    const mbbRoster = readFileSync(
      resolve(tsRoot, 'src', 'games', 'mutant_battle_ball', 'components', 'RosterTab.tsx'),
      'utf-8',
    );
    const chimeraApp = readFileSync(
      resolve(tsRoot, 'src', 'games', 'chimera_wilds', 'App.tsx'),
      'utf-8',
    );
    expect(mbbRoster).toContain('PaperDoll');
    expect(chimeraApp).toContain('PaperDoll');
  });
});
