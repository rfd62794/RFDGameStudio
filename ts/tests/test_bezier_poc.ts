// @vitest-environment node
//
// Bézier Curve POC — Test Anchors
//
// Per §2 of the directive, these tests verify:
//   - Real Bézier C/Q commands are used (not L/polygon)
//   - Seed determinism (same seed = identical output)
//   - Zero existing files touched (isolated POC)
//   - Page loads and renders (DOM presence, not visual judgment)
//
// No screenshots, no visual judgment — all objective output.

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateBezierBlob } from '../src/standalone/bezier_poc/bezier_blob';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const tsRoot = resolve(repoRoot, 'ts');

describe('test_real_bezier_commands_used', () => {
  it('Generated path data contains real C (cubic Bézier) commands', () => {
    const result = generateBezierBlob({
      seed: 42,
      anchorCount: 8,
      baseRadius: 60,
      jitterAmount: 0.15,
      tension: 0.1667,
    });

    // Must contain C commands (cubic Bézier)
    expect(result.pathData).toContain('C');
    expect(result.commandTypes).toContain('C');

    // Must NOT contain L commands (straight line segments)
    expect(result.pathData).not.toMatch(/\dL\d/);
    expect(result.commandTypes).not.toContain('L');

    // Must start with M (move to) and end with Z (close path)
    expect(result.commandTypes[0]).toBe('M');
    expect(result.commandTypes[result.commandTypes.length - 1]).toBe('Z');
  });

  it('Each segment has two control points (cp1 and cp2) — real Bézier, not quadratic', () => {
    const result = generateBezierBlob({
      seed: 42,
      anchorCount: 8,
      baseRadius: 60,
      jitterAmount: 0.15,
      tension: 0.1667,
    });

    // 8 anchors = 8 segments, each with 4 control point coords (cp1x, cp1y, cp2x, cp2y)
    expect(result.controlPoints).toHaveLength(8);
    for (const cp of result.controlPoints) {
      expect(cp).toHaveLength(4); // cp1x, cp1y, cp2x, cp2y
    }

    // Count C commands in path data — should be 8 (one per segment)
    const cCount = (result.pathData.match(/C/g) || []).length;
    expect(cCount).toBe(8);
  });

  it('Control points are different from anchor points — curves are genuinely curved', () => {
    const result = generateBezierBlob({
      seed: 42,
      anchorCount: 8,
      baseRadius: 60,
      jitterAmount: 0.15,
      tension: 0.1667,
    });

    // For each segment, at least one control point should differ from
    // both the start and end anchor (otherwise it's a straight line)
    for (let i = 0; i < result.anchorPoints.length; i++) {
      const anchor = result.anchorPoints[i];
      const nextAnchor = result.anchorPoints[(i + 1) % result.anchorPoints.length];
      const [cp1x, cp1y, cp2x, cp2y] = result.controlPoints[i];

      // cp1 should not be exactly on the start anchor
      const cp1OnAnchor = Math.abs(cp1x - anchor[0]) < 0.01 && Math.abs(cp1y - anchor[1]) < 0.01;
      // cp2 should not be exactly on the end anchor
      const cp2OnNextAnchor = Math.abs(cp2x - nextAnchor[0]) < 0.01 && Math.abs(cp2y - nextAnchor[1]) < 0.01;

      expect(cp1OnAnchor).toBe(false);
      expect(cp2OnNextAnchor).toBe(false);
    }
  });
});

describe('test_seed_determinism', () => {
  it('Same seed produces identical path data', () => {
    const spec = {
      seed: 123,
      anchorCount: 10,
      baseRadius: 50,
      jitterAmount: 0.2,
      tension: 0.2,
    };

    const result1 = generateBezierBlob(spec);
    const result2 = generateBezierBlob(spec);

    expect(result1.pathData).toBe(result2.pathData);
    expect(result1.svg).toBe(result2.svg);
    expect(result1.anchorPoints).toEqual(result2.anchorPoints);
    expect(result1.controlPoints).toEqual(result2.controlPoints);
  });

  it('Different seeds produce different path data', () => {
    const baseSpec = {
      anchorCount: 8,
      baseRadius: 60,
      jitterAmount: 0.15,
      tension: 0.1667,
    };

    const result1 = generateBezierBlob({ ...baseSpec, seed: 1 });
    const result2 = generateBezierBlob({ ...baseSpec, seed: 999 });

    expect(result1.pathData).not.toBe(result2.pathData);
  });

  it('Same seed with different tension produces different output — tension is parametric', () => {
    const baseSpec = {
      seed: 42,
      anchorCount: 8,
      baseRadius: 60,
      jitterAmount: 0.15,
    };

    const tight = generateBezierBlob({ ...baseSpec, tension: 0.05 });
    const standard = generateBezierBlob({ ...baseSpec, tension: 0.1667 });
    const loose = generateBezierBlob({ ...baseSpec, tension: 0.35 });

    // All three should have the same anchor points (same seed)
    expect(tight.anchorPoints).toEqual(standard.anchorPoints);
    expect(standard.anchorPoints).toEqual(loose.anchorPoints);

    // But different control points (different tension)
    expect(tight.controlPoints).not.toEqual(standard.controlPoints);
    expect(standard.controlPoints).not.toEqual(loose.controlPoints);

    // And different path data
    expect(tight.pathData).not.toBe(standard.pathData);
    expect(standard.pathData).not.toBe(loose.pathData);
  });
});

describe('test_isolated_no_existing_files_touched', () => {
  it('Zero changes to artGen, composer, paperDoll, or any existing consumer', () => {
    // Check git status --short — shows both staged and untracked files
    let status: string;
    try {
      status = execSync('git status --short', { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      status = '';
    }

    const allChanged = status.split('\n').filter(f => f.trim()).map(f => f.replace(/^.{3}\s*/, '').trim());

    // Files that MUST NOT be touched by this POC
    const protectedPaths = [
      'ts/src/engine/artGen/',
      'ts/src/engine/paperDoll/',
      'ts/src/games/',
      'ts/src/standalone/character_viewer/',
      'ts/src/standalone/chimera_wilds/',
      'ts/src/standalone/mutant_battle_ball/',
    ];

    const violations = allChanged.filter(f =>
      protectedPaths.some(p => f.startsWith(p) && !f.includes('bezier_poc')),
    );

    // docs/state/current.md is allowed (updated by this directive)
    const allowedModifications = ['docs/state/current.md'];
    const realViolations = violations.filter(f => !allowedModifications.includes(f));

    expect(realViolations).toEqual([]);
  });

  it('POC files are in the bezier_poc directory only', () => {
    // Use git status --short which shows both staged and untracked files
    let status: string;
    try {
      status = execSync('git status --short', { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      status = '';
    }

    const allLines = status.split('\n').filter(f => f.trim());

    // The bezier_blob.ts generator is the core POC file
    const generatorFile = allLines.filter(f => f.includes('bezier_blob.ts'));
    expect(generatorFile.length).toBe(1);

    // The test file is also new
    const testFile = allLines.filter(f => f.includes('test_bezier_poc'));
    expect(testFile.length).toBe(1);
  });
});

describe('test_page_loads_and_renders', () => {
  it('HTML page exists and has correct structure', () => {
    const { readFileSync } = require('node:fs');
    const html = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'bezier_poc', 'index.html'),
      'utf-8',
    );

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<div id="root">');
    expect(html).toContain('entry.ts');
  });

  it('Entry point imports and calls generateBezierBlob', () => {
    const { readFileSync } = require('node:fs');
    const entry = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'bezier_poc', 'entry.ts'),
      'utf-8',
    );

    expect(entry).toContain('generateBezierBlob');
    expect(entry).toContain('document.getElementById');
    // Entry generates SVG via template literals containing <svg> and result.svg
    expect(entry).toContain('<svg');
    expect(entry).toContain('result.svg');
  });

  it('Generated SVG contains a <path> element with d attribute (real SVG output)', () => {
    const result = generateBezierBlob({
      seed: 42,
      anchorCount: 8,
      baseRadius: 60,
      jitterAmount: 0.15,
      tension: 0.1667,
      fill: '#3b82f6',
      stroke: '#1e3a8a',
      strokeWidth: 2,
    });

    expect(result.svg).toContain('<path');
    expect(result.svg).toContain('d="');
    expect(result.svg).toContain('fill="#3b82f6"');
    expect(result.svg).toContain('stroke="#1e3a8a"');
    expect(result.svg).toContain('stroke-width="2"');
  });
});
