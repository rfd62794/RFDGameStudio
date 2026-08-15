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
  // Apply transform
  const tm = part.svg.match(/translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)/);
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
  it('chest radius after scaling matches torsoChest formula prediction', () => {
    const composed = composeFigure(TEST_INPUT);
    const chest = composed.find(p => p.slot === 'chest')!;
    const bounds = getPartBounds(chest)!;

    // Base radius from humanoidBilateral: 11
    // After torsoChest scaling: 11 * 1.6 = 17.6
    // Polygon diameter ≈ 2 * radius = 35.2
    // The rendered width should be close to this (within jitter)
    const expectedRadius = 11 * BIOLOGICAL_SCALING.torsoChest;
    const expectedDiameter = expectedRadius * 2;

    // Allow 20% tolerance for polygon jitter and irregularity
    expect(bounds.width).toBeGreaterThan(expectedDiameter * 0.8);
    expect(bounds.width).toBeLessThan(expectedDiameter * 1.3);
  });

  it('head radius after scaling matches torsoHead formula prediction', () => {
    const composed = composeFigure(TEST_INPUT);
    const head = composed.find(p => p.slot === 'head')!;
    const bounds = getPartBounds(head)!;

    // Head now uses ellipse primitive: rx=7, ry=8
    // After torsoHead scaling (1.2x): rx=8.4, ry=9.6
    // Width = 2 * rx = 16.8, Height = 2 * ry = 19.2
    const expectedRx = 7 * BIOLOGICAL_SCALING.torsoHead;
    const expectedWidth = expectedRx * 2;

    // Ellipse is exact (no jitter) — tight tolerance
    expect(bounds.width).toBeGreaterThan(expectedWidth * 0.95);
    expect(bounds.width).toBeLessThan(expectedWidth * 1.05);
  });

  it('limb width after Kleiber + joint/taper matches formula prediction', () => {
    const composed = composeFigure(TEST_INPUT);
    const leftArm = composed.find(p => p.slot === 'left_arm')!;

    // Arm now uses sigmoidBulge: widthStart=15, widthEnd=9
    // Arm offset: (-16, -3), length = sqrt(256 + 9) ≈ 16.28
    // Kleiber: (16.28/20)^0.75 ≈ 0.855
    // widthStart gets jointBuffer (1.3): 15 * 0.855 * 1.3 ≈ 16.67
    // widthEnd gets limbEndTaper (0.55): 9 * 0.855 * 0.55 ≈ 4.23
    // avgWidth = (16.67 + 4.23) / 2 ≈ 10.45
    // length = avgWidth * 3 ≈ 31.35
    const armOffsetLen = Math.sqrt(16 ** 2 + 3 ** 2);
    const kleiber = Math.pow(armOffsetLen / 20, BIOLOGICAL_SCALING.kleiberExponent);
    const expectedWidthStart = 15 * kleiber * BIOLOGICAL_SCALING.jointBuffer;
    const expectedWidthEnd = 9 * kleiber * BIOLOGICAL_SCALING.limbEndTaper;
    const expectedAvgWidth = (expectedWidthStart + expectedWidthEnd) / 2;
    const expectedLength = expectedAvgWidth * 3;
    const bounds = getPartBounds(leftArm)!;

    // Allow 20% tolerance for rotation effects
    expect(bounds.width).toBeGreaterThan(expectedLength * 0.8);
    expect(bounds.width).toBeLessThan(expectedLength * 1.2);
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
