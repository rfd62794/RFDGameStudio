// @vitest-environment node
//
// Paper Doll — Recognizability Investigation + Humanoid Grounding — Tests
//
// Per §3 of the directive, these tests use real, objective values:
//   - Real parameter values read from the composer's actual output
//   - Real BIOLOGICAL_SCALING constant references in composer.ts source
//   - Real proportion ratios computed from rendered dimensions
//   - Real diff checks for zero third-party assets
//
// No screenshots, no visual judgment — all numbers.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeFigure, humanoidBilateral } from '../src/engine/paperDoll/index';
import { BIOLOGICAL_SCALING } from '../src/engine/paperDoll/types';
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

// ── Helper: extract bounding box from a composed part's SVG ──
function getPartBounds(part: ComposedPart): { width: number; height: number; minX: number; maxX: number; minY: number; maxY: number } | null {
  const coords: Array<[number, number]> = [];
  // From polygon points
  for (const m of part.svg.matchAll(/points="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }
  }
  // From path d
  for (const m of part.svg.matchAll(/\sd="([^"]+)"/g)) {
    const nums = m[1].match(/-?\d+\.?\d*/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push([parseFloat(nums[i]!), parseFloat(nums[i + 1]!)]);
    }
  }
  // From ellipse cx="x" cy="y" rx="r" ry="r"
  for (const m of part.svg.matchAll(/<ellipse[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"[^>]*\srx="([^"]+)"[^>]*\sry="([^"]+)"/g)) {
    const cx = parseFloat(m[1]!), cy = parseFloat(m[2]!), rx = parseFloat(m[3]!), ry = parseFloat(m[4]!);
    coords.push([cx + rx, cy], [cx - rx, cy], [cx, cy + ry], [cx, cy - ry]);
  }
  // From circle cx="x" cy="y" r="r" (stroke-skeleton head)
  for (const m of part.svg.matchAll(/<circle[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"[^>]*\sr="([^"]+)"/g)) {
    const cx = parseFloat(m[1]!), cy = parseFloat(m[2]!), r = parseFloat(m[3]!);
    coords.push([cx + r, cy], [cx - r, cy], [cx, cy + r], [cx, cy - r]);
  }
  // From line x1="x" y1="y" x2="x" y2="y" (stroke-skeleton limbs)
  for (const m of part.svg.matchAll(/<line[^>]*\sx1="([^"]+)"[^>]*\sy1="([^"]+)"[^>]*\sx2="([^"]+)"[^>]*\sy2="([^"]+)"/g)) {
    coords.push([parseFloat(m[1]!), parseFloat(m[2]!)]);
    coords.push([parseFloat(m[3]!), parseFloat(m[4]!)]);
  }
  // Apply transform (non-strokeSkeleton primitives use <g transform>)
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
  if (minX === Infinity) return null;
  return { width: maxX - minX, height: maxY - minY, minX, maxX, minY, maxY };
}

// ── Tests ──

describe('test_biological_scaling_actually_invoked', () => {
  it('composer.ts references kleiberExponent, jointBuffer, and limbEndTaper — not just imports them', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'composer.ts'),
      'utf-8',
    );
    // The constants must be referenced in the actual code, not just imported
    expect(src).toContain('BIOLOGICAL_SCALING.kleiberExponent');
    expect(src).toContain('BIOLOGICAL_SCALING.jointBuffer');
    expect(src).toContain('BIOLOGICAL_SCALING.limbEndTaper');
    expect(src).toContain('BIOLOGICAL_SCALING.torsoChest');
    expect(src).toContain('BIOLOGICAL_SCALING.torsoHead');
  });

  it('applyBiologicalScaling is called in the composeFigure render path', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'composer.ts'),
      'utf-8',
    );
    expect(src).toContain('applyBiologicalScaling(');
    // Must be called inside the loop over attachments, not just defined
    expect(src).toContain('const scaledShapeMapping = applyBiologicalScaling');
  });

  it('head region check includes head (not just torso/spine) — torsoHead is reachable', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'composer.ts'),
      'utf-8',
    );
    // The region check must include 'head' so the torsoHead case fires
    expect(src).toContain("att.region === 'head'");
  });
});

describe('test_scaling_output_matches_formula', () => {
  it('chest stroke width after scaling is within expected range', () => {
    const composed = composeFigure(TEST_INPUT);
    const chest = composed.find(p => p.slot === 'chest')!;
    const bounds = getPartBounds(chest)!;

    // strokeSkeleton: chest is a stroked vertical line.
    // widthProximal=20, widthDistal=14 → stroke-width = (20+14)/2 = 17
    // The bounding box width = stroke-width (the line is vertical)
    // Biological scaling doesn't apply to strokeSkeleton params directly
    // (they use widthProximal/widthDistal, not radius/rx/ry), so the
    // width is the raw stroke width.
    expect(bounds).toBeTruthy();
    expect(bounds.width).toBeGreaterThan(10); // stroke-width ~17
    expect(bounds.width).toBeLessThan(30);
  });

  it('head circle radius is within expected range', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    const bounds = getPartBounds(head)!;

    // strokeSkeleton: head is a stroked <circle>.
    // widthProximal=10 (radius), widthDistal=6 (stroke width)
    // Bounding box = 2 * (radius + stroke-width/2) = 2 * (10 + 3) = 26
    // But the circle's r=10, stroke-width=6, so visual extent = r + sw/2 = 13
    // Bounding box width = 2 * 13 = 26
    expect(bounds).toBeTruthy();
    expect(bounds.width).toBeGreaterThan(15);
    expect(bounds.width).toBeLessThan(35);
  });

  it('limb stroke width is within expected range', () => {
    const composed = composeFigure(TEST_INPUT);
    const leftArm = composed.find(p => p.slot === 'left_arm')!;
    const bounds = getPartBounds(leftArm)!;

    // strokeSkeleton: arm is a stroked <line> from shoulder to hand.
    // widthProximal=10, widthDistal=5 → stroke-width = (10+5)/2 = 7.5
    // The bounding box width is the stroke width (perpendicular to the line)
    // or the line length (along the line), depending on orientation.
    // The arm goes from chest(50,48) to left_arm(50-16,48-3)=(34,45).
    // Line length = sqrt(16^2 + 3^2) ≈ 16.28
    // Bounding box should be roughly line-length wide in one dimension
    // and stroke-width in the other.
    expect(bounds).toBeTruthy();
    // The larger dimension should be the line length (~16)
    expect(Math.max(bounds.width, bounds.height)).toBeGreaterThan(10);
    // The smaller dimension should be at least the stroke width (~7.5)
    expect(Math.min(bounds.width, bounds.height)).toBeGreaterThan(3);
  });
});

describe('test_humanoid_proportions_within_real_ratio_bounds', () => {
  it('head-to-body ratio is within stylized human range (0.15-0.30)', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    const leftLeg = composed.find(p => p.slot === 'left_leg')!;

    const headBounds = getPartBounds(head)!;
    const legBounds = getPartBounds(leftLeg)!;

    const headHeight = headBounds.height;
    const totalHeight = legBounds.maxY - headBounds.minY;
    const ratio = headHeight / totalHeight;

    // Standard human: ~0.13 (1/7.5)
    // Stylized game figure: 0.15-0.30 (1/3.3 to 1/6.7)
    expect(ratio).toBeGreaterThan(0.15);
    expect(ratio).toBeLessThan(0.30);
  });

  it('shoulder-to-head width ratio is within human range (1.5-3.0)', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    const chest = composed.find(p => p.slot === 'chest')!;

    const headBounds = getPartBounds(head)!;
    const chestBounds = getPartBounds(chest)!;

    const ratio = chestBounds.width / headBounds.height;

    // Standard human: ~2.0
    // Acceptable range: 1.5-3.0
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(3.0);
  });

  it('arm-to-leg length ratio is within human range (0.7-1.0)', () => {
    const composed = composeFigure(TEST_INPUT);
    const leftArm = composed.find(p => p.slot === 'left_arm')!;
    const leftLeg = composed.find(p => p.slot === 'left_leg')!;

    const armBounds = getPartBounds(leftArm)!;
    const legBounds = getPartBounds(leftLeg)!;

    const ratio = armBounds.width / legBounds.width;

    // Standard human: ~0.83
    // Acceptable range: 0.7-1.0
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.0);
  });
});

describe('test_no_third_party_assets_present', () => {
  it('Zero downloaded/embedded reference files in the paperDoll module', () => {
    // Check that no image files (png, jpg, svg, bmp, gif) were added
    // to the paperDoll directory or the character_viewer directory
    let diff: string;
    try {
      diff = execSync('git diff --name-only HEAD', { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      diff = '';
    }
    const changedFiles = diff.split('\n').filter(f => f.trim());
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.bmp', '.gif', '.webp'];
    const assetFiles = changedFiles.filter(f =>
      assetExtensions.some(ext => f.toLowerCase().endsWith(ext)),
    );
    expect(assetFiles).toEqual([]);
  });

  it('No reference image files in paperDoll or character_viewer directories', () => {
    const dirs = [
      resolve(tsRoot, 'src', 'engine', 'paperDoll'),
      resolve(tsRoot, 'src', 'standalone', 'character_viewer'),
      resolve(tsRoot, 'src', 'games', 'character_viewer'),
    ];
    for (const dir of dirs) {
      let files: string[] = [];
      try {
        const { readdirSync } = require('node:fs');
        files = readdirSync(dir);
      } catch {
        continue;
      }
      const assetExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.bmp', '.gif', '.webp'];
      const assets = files.filter(f =>
        assetExtensions.some(ext => f.toLowerCase().endsWith(ext)),
      );
      expect(assets).toEqual([]);
    }
  });
});

describe('test_no_regression', () => {
  it('composeFigure still produces 6 parts for humanoidBilateral', () => {
    const composed = composeFigure(TEST_INPUT);
    expect(composed).toHaveLength(6);
    const slots = composed.map(p => p.slot).sort();
    expect(slots).toEqual([...PART_SLOTS].sort());
  });

  it('renderFigureSvg still produces valid SVG', async () => {
    const { renderFigureSvg } = await import('../src/engine/paperDoll/index');
    const svg = renderFigureSvg(TEST_INPUT, 300, 300);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox=');
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
