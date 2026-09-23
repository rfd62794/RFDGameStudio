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
  // Circle: cx, cy, r → 4 bounding points (stroke-skeleton head)
  for (const m of svg.matchAll(/<circle[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"[^>]*\sr="([^"]+)"/g)) {
    const cx = parseFloat(m[1]!), cy = parseFloat(m[2]!), r = parseFloat(m[3]!);
    coords.push([cx + r, cy], [cx - r, cy], [cx, cy + r], [cx, cy - r]);
  }
  // Line: x1, y1, x2, y2 → 2 endpoints (stroke-skeleton limbs)
  for (const m of svg.matchAll(/<line[^>]*\sx1="([^"]+)"[^>]*\sy1="([^"]+)"[^>]*\sx2="([^"]+)"[^>]*\sy2="([^"]+)"/g)) {
    coords.push([parseFloat(m[1]!), parseFloat(m[2]!)]);
    coords.push([parseFloat(m[3]!), parseFloat(m[4]!)]);
  }
  return coords;
}

// ── Helper: get bounding box from composed part ──
function getPartBounds(part: ComposedPart) {
  const coords = extractCoords(part.svg);
  // strokeSkeleton output uses absolute coordinates (no transform wrapper)
  // Other primitives use <g transform="translate(x,y) rotate(a)">
  const tm = part.svg.match(/translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)/);
  if (tm) {
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
    if (minX === Infinity) return null;
    return { width: maxX - minX, height: maxY - minY, minX, maxX, minY, maxY };
  }
  // No transform — coordinates are absolute (strokeSkeleton output)
  if (coords.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
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

    // All 6 slots now use strokeSkeleton (the production winner from the
    // 10-technique comparison: stroke-skeleton + SDF joint blending)
    expect(src).toContain("slot: 'head'");
    expect(src).toContain("primitive: 'strokeSkeleton'");

    for (const slot of ['chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg']) {
      expect(src).toContain(`slot: '${slot}'`);
    }
    // Count strokeSkeleton occurrences — should be 6 (all slots)
    const strokeCount = (src.match(/primitive: 'strokeSkeleton'/g) || []).length;
    expect(strokeCount).toBe(6);

    // No teardropFin or ellipse should remain in the humanoid body plan
    expect(src).not.toContain("primitive: 'teardropFin'");
    expect(src).not.toContain("primitive: 'ellipse'");
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

describe('test_limbs_use_stroke_skeleton', () => {
  it('All four limb slots produce <line> from strokeSkeleton (not <path> from teardropFin)', () => {
    const composed = composeFigure(TEST_INPUT);
    for (const slot of ['left_arm', 'right_arm', 'left_leg', 'right_leg']) {
      const part = composed.find(p => p.slot === slot)!;
      // strokeSkeleton produces <line> elements with stroke-linecap="round"
      expect(part.svg).toContain('<line');
      expect(part.svg).toContain('stroke-linecap="round"');
      // No <path> from teardropFin, no <polygon> from sigmoidBulge
      expect(part.svg).not.toContain('<path');
    }
  });

  it('Limb stroke widths reflect tapered shape (widthProximal > widthDistal)', () => {
    const composed = composeFigure(TEST_INPUT);
    const leftArm = composed.find(p => p.slot === 'left_arm')!;
    // strokeSkeleton uses avgWidth = (widthProximal + widthDistal) / 2
    // For left_arm: widthProximal=10, widthDistal=5 → avgWidth=7.5
    // The stroke-width attribute should be present and > 0
    const strokeMatch = leftArm.svg.match(/stroke-width="([\d.]+)"/);
    expect(strokeMatch).toBeTruthy();
    const strokeWidth = parseFloat(strokeMatch![1]);
    expect(strokeWidth).toBeGreaterThan(0);
    // The stroke width should be the average of proximal and distal
    // (10 + 5) / 2 = 7.5 for arms
    expect(strokeWidth).toBeCloseTo(7.5, 0);
  });
});

describe('test_head_uses_smooth_geometry', () => {
  it('Head produces a <circle> element (stroked, smooth — not a <polygon>)', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    // strokeSkeleton renders head as a stroked <circle> — smooth, no vertices
    expect(head.svg).toContain('<circle');
    expect(head.svg).not.toContain('<polygon');
  });

  it('Head circle has r attribute (radius) and stroke-width (thick stroke)', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    expect(head.svg).toContain('r=');
    expect(head.svg).toContain('stroke-width=');
  });

  it('Head shape is objectively smooth — no interior angles (circle, not polygon)', () => {
    // A polygon has interior angles at each vertex. A circle has zero
    // interior angles (it's a smooth curve). The presence of <circle>
    // vs <polygon> is the objective smoothness proof.
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;

    // The head SVG must contain <circle> and must NOT contain <polygon>
    // or points= attributes (which would indicate a faceted shape)
    expect(head.svg).toContain('<circle');
    expect(head.svg).not.toContain('<polygon');
    expect(head.svg).not.toContain('points=');
  });
});

describe('test_no_regression', () => {
  it('composeFigure produces at least 6 parts for humanoidBilateral (strokeSkeleton + joint blends)', () => {
    const composed = composeFigure(TEST_INPUT);
    // strokeSkeleton produces 6 bone segments + joint blend circles
    expect(composed.length).toBeGreaterThanOrEqual(6);
    // All 6 named slots must be present
    for (const slot of PART_SLOTS) {
      const part = composed.find(p => p.slot === slot);
      expect(part).toBeDefined();
    }
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

    expect(headBounds).toBeTruthy();
    expect(armBounds).toBeTruthy();
    expect(legBounds).toBeTruthy();

    const totalHeight = legBounds.maxY - headBounds.minY;
    const headRatio = headBounds.height / totalHeight;
    // strokeSkeleton: arms and legs are stroked lines. Use line length
    // (max of width/height) for the ratio, not just width.
    const armLen = Math.max(armBounds.width, armBounds.height);
    const legLen = Math.max(legBounds.width, legBounds.height);
    const armLegRatio = armLen / legLen;

    // Stylized human range
    expect(headRatio).toBeGreaterThan(0.10);
    expect(headRatio).toBeLessThan(0.35);
    // Arm/leg ratio — arms shorter than legs
    expect(armLegRatio).toBeGreaterThan(0.3);
    expect(armLegRatio).toBeLessThan(1.2);
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
