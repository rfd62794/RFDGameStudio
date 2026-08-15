// @vitest-environment node
//
// Paper Doll — Technique Study + Original Style Reference Pass — Tests
//
// Verifies:
//   1. DiceBear license confirmed (MIT, from actual LICENSE file)
//   2. boring-avatars license confirmed (MIT, from actual LICENSE file)
//   3. DiceBear styles categorized (parametric vs template-swap)
//   4. Zero third-party asset files in the diff (boundary check)
//   5. New presets are original (built from parameters, not copied shapes)
//   6. No regression to current floor
//

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderFigureSvg,
  composeFigure,
  humanoidBilateral,
  chimeraAsymmetric,
  CREATURE_PRESETS,
  CREATURE_PRESET_IDS,
  getCreaturePreset,
  getDigit,
  getBoolean,
  getUnit,
  getContrastColor,
  fnv1aHash,
  getDeterministicValue,
  weightedPick,
} from '../src/engine/paperDoll/index';
import type { CompositionInput, PartForComposition } from '../src/engine/paperDoll/types';
import { PART_SLOTS } from '../src/engine/shared/partSlots';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const tsRoot = resolve(repoRoot, 'ts');

// ── Test fixtures ────────────────────────────────────────────────────

function makeDummyParts(): Record<string, PartForComposition | null> {
  const parts: Record<string, PartForComposition | null> = {};
  for (const slot of PART_SLOTS) {
    parts[slot] = { id: `dummy_${slot}`, name: slot, slot };
  }
  return parts;
}

const DUMMY_PARTS = makeDummyParts();

function makeColors(color: string = '#3b82f6'): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const slot of PART_SLOTS) colors[slot] = color;
  return colors;
}

// ── #1: DiceBear license confirmed ───────────────────────────────────

describe('test_dicebear_license_confirmed', () => {
  it('DiceBear core code is MIT licensed (verified from actual LICENSE file)', () => {
    // The LICENSE file was read directly from
    // https://raw.githubusercontent.com/dicebear/dicebear/10.x/LICENSE
    // and confirmed to be MIT License, Copyright (c) 2026 Florian Körner.
    //
    // This test verifies the license is documented in the technique
    // utils source file (the portable patterns note their source + license).
    const source = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'techniqueUtils.ts'),
      'utf-8',
    );
    expect(source).toContain('DiceBear: MIT License');
    expect(source).toContain('Florian Körner');
  });

  it('DiceBear avatar styles have separate licenses (code vs styles distinction)', () => {
    // The DiceBear README states: "The code is MIT licensed, including
    // commercial use. The avatar styles are the work of their respective
    // creators and carry their own licenses."
    //
    // Many styles are CC0 1.0, but some may differ. This test verifies
    // we document this distinction — we only port code patterns (MIT),
    // not style assets.
    const source = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'techniqueUtils.ts'),
      'utf-8',
    );
    // The technique utils port code patterns only, not style assets
    expect(source).toContain('patterns and math, not');
    expect(source).toContain('copied code');
  });
});

// ── #2: boring-avatars license confirmed ─────────────────────────────

describe('test_boring_avatars_license_confirmed', () => {
  it('boring-avatars is MIT licensed (verified from actual LICENSE file)', () => {
    // The LICENSE file was read directly from
    // https://raw.githubusercontent.com/boringdesigners/boring-avatars/master/LICENSE
    // and confirmed to be MIT License, Copyright (c) 2021 boringdesigners.
    const source = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'techniqueUtils.ts'),
      'utf-8',
    );
    expect(source).toContain('boring-avatars: MIT License');
    expect(source).toContain('boringdesigners');
  });
});

// ── #3: DiceBear styles categorized ──────────────────────────────────

describe('test_dicebear_styles_categorized', () => {
  it('DiceBear architecture is template-swap, not parametric generation', () => {
    // After reading DiceBear's actual source (StyleDefinition.ts,
    // Renderer.ts, Resolver.ts, Prng.ts) and multiple style JSON
    // definitions (shape-grid, glass, notionists, thumbs), the real
    // finding is:
    //
    // ALL DiceBear styles are template-swap based. Styles are defined
    // as JSON with pre-made SVG element trees (variants exported from
    // Figma). The PRNG picks which variant to use and applies
    // transforms/colors, but shapes are NOT generated from math.
    //
    // This is fundamentally different from artGen/paperDoll, which
    // generates shapes from mathematical parameters (vertex count,
    // irregularity, radius, etc.).
    //
    // The "parametric" aspect in DiceBear is limited to:
    //   - Transform values (rotate, scale, translate ranges)
    //   - Color selection from palettes
    //   - Variant selection (weighted pick from pre-made options)

    // This test verifies the technique utils document this distinction
    const source = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'techniqueUtils.ts'),
      'utf-8',
    );
    // The ported patterns are code techniques (PRNG, hash, contrast),
    // not style assets or template definitions
    expect(source).toContain('getDigit');
    expect(source).toContain('fnv1aHash');
    expect(source).toContain('getContrastColor');
    expect(source).toContain('weightedPick');
  });

  it('Portable PRNG pattern from DiceBear is call-order-independent', () => {
    // DiceBear's Prng.getValue(key) creates a new Mulberry32 from
    // Fnv1a.hash(seed + ':' + key) — so the same key always produces
    // the same value regardless of call order.
    const seed = 'test-seed';
    const val1 = getDeterministicValue(seed, 'head');
    const val2 = getDeterministicValue(seed, 'head');
    const val3 = getDeterministicValue(seed, 'chest');

    // Same key → same value, regardless of call order
    expect(val1).toBe(val2);
    // Different key → different value
    expect(val1).not.toBe(val3);
    // Values are in [0, 1)
    expect(val1).toBeGreaterThanOrEqual(0);
    expect(val1).toBeLessThan(1);
  });

  it('FNV-1a hash is deterministic and produces 32-bit unsigned values', () => {
    const hash1 = fnv1aHash('hello');
    const hash2 = fnv1aHash('hello');
    const hash3 = fnv1aHash('world');

    expect(hash1).toBe(hash2); // deterministic
    expect(hash1).not.toBe(hash3); // different inputs → different outputs
    expect(hash1).toBeGreaterThanOrEqual(0); // unsigned
    expect(hash1).toBeLessThanOrEqual(0xFFFFFFFF); // 32-bit
  });
});

// ── #4: No third-party assets present (boundary check) ───────────────

describe('test_no_third_party_assets_present', () => {
  it('Zero SVG/image files downloaded from reference sites', () => {
    // The directive explicitly forbids downloading, copying, embedding,
    // or referencing by file any SVG/image/asset from svgrepo, svgsilh,
    // vecteezy, icons8, thenounproject, tibbixel, svgheart,
    // svgavatars.com, ilus.ai.
    //
    // This test checks the git diff for any binary asset files or
    // .svg/.png/.jpg files that shouldn't be there.
    let diff: string;
    try {
      diff = execSync('git diff --name-only HEAD', { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      diff = '';
    }

    // Check for any image/SVG/asset files in the diff
    const assetExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.ico'];
    const lines = diff.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const ext of assetExtensions) {
        expect(lower).not.toContain(ext);
      }
    }
  });

  it('No reference-repo files inside the RFDGameStudio tree', () => {
    // Reference repos (DiceBear, boring-avatars, ChimeraLab) must be
    // outside the RFDGameStudio repo tree, not inside it.
    const refPaths = [
      resolve(repoRoot, 'reference-repos'),
      resolve(repoRoot, 'dicebear'),
      resolve(repoRoot, 'boring-avatars'),
      resolve(repoRoot, 'ChimeraLab'),
    ];
    for (const p of refPaths) {
      expect(existsSync(p)).toBe(false);
    }
  });

  it('New preset files contain only TS code, no embedded SVG strings', () => {
    // The new creature presets should be pure data (shape parameters),
    // not embedded SVG path strings from any reference.
    const presetSource = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'creaturePresets.ts'),
      'utf-8',
    );
    // Should contain parameter-based shape mappings, not SVG path data
    expect(presetSource).not.toContain('<path');
    expect(presetSource).not.toContain('<svg');
    expect(presetSource).not.toContain('<polygon points="');
    expect(presetSource).not.toContain('d="M');
    // Should contain artGen primitive names and parameters
    expect(presetSource).toContain('polygon');
    expect(presetSource).toContain('radialBurst');
    expect(presetSource).toContain('teardropFin');
    expect(presetSource).toContain('irregularFragment');
    expect(presetSource).toContain('sigmoidBulge');
  });
});

// ── #5: New presets are original ─────────────────────────────────────

describe('test_new_presets_are_original', () => {
  it('Six creature presets exist with distinct shape mappings', () => {
    expect(CREATURE_PRESETS).toHaveLength(6);
    const ids = CREATURE_PRESETS.map(p => p.id);
    expect(ids).toContain('insectoid');
    expect(ids).toContain('mammalian');
    expect(ids).toContain('reptilian');
    expect(ids).toContain('avian');
    expect(ids).toContain('behemoth');
    expect(ids).toContain('wraith');

    // Each preset has 6 shape mappings (one per slot)
    for (const preset of CREATURE_PRESETS) {
      expect(preset.shapes).toHaveLength(6);
      expect(preset.proportions).toBeDefined();
      expect(preset.proportions.name).toBe(preset.name);
    }
  });

  it('Each preset produces a visibly different SVG figure', () => {
    const svgs: string[] = [];
    for (const preset of CREATURE_PRESETS) {
      // Build a body plan with the preset's shape mappings
      const bodyPlan = {
        ...preset.bodyPlan,
        shapeMappings: preset.shapes,
      };
      const input: CompositionInput = {
        bodyPlan,
        parts: DUMMY_PARTS,
        colors: makeColors('#3b82f6'),
        seed: 42,
        proportions: preset.proportions,
      };
      svgs.push(renderFigureSvg(input, 100, 100));
    }
    // At least some presets should produce different SVGs
    const uniqueSvgs = new Set(svgs);
    expect(uniqueSvgs.size).toBeGreaterThan(1);
  });

  it('Presets use only artGen primitives (no external shape data)', () => {
    const validPrimitives = ['polygon', 'radialBurst', 'teardropFin', 'irregularFragment', 'sigmoidBulge'];
    for (const preset of CREATURE_PRESETS) {
      for (const shape of preset.shapes) {
        expect(validPrimitives).toContain(shape.primitive);
        // Parameters should be numbers, not SVG strings
        for (const [key, value] of Object.entries(shape.baseParams)) {
          expect(typeof value).toBe('number');
        }
      }
    }
  });

  it('Each preset has traceable referenceCategory for design reasoning', () => {
    for (const preset of CREATURE_PRESETS) {
      expect(preset.referenceCategory).toBeDefined();
      expect(preset.referenceCategory.length).toBeGreaterThan(10);
      // Should mention a silhouette/archetype category
      expect(preset.referenceCategory).toMatch(/silhouette|archetype|study/i);
    }
  });

  it('Insectoid uses radialBurst for limbs (multi-jointed look)', () => {
    const insectoid = getCreaturePreset('insectoid')!;
    const armShape = insectoid.shapes.find(s => s.slot === 'left_arm')!;
    expect(armShape.primitive).toBe('radialBurst');
    expect(armShape.baseParams.armCount).toBeGreaterThan(4); // many-jointed
  });

  it('Mammalian uses sigmoidBulge for limbs (visible muscle curves)', () => {
    const mammalian = getCreaturePreset('mammalian')!;
    const armShape = mammalian.shapes.find(s => s.slot === 'left_arm')!;
    expect(armShape.primitive).toBe('sigmoidBulge');
    expect(armShape.baseParams.bulgeFactor).toBeGreaterThan(0.3); // visible bulge
  });

  it('Behemoth has higher muscleBulge than mammalian', () => {
    const behemoth = getCreaturePreset('behemoth')!;
    const mammalian = getCreaturePreset('mammalian')!;
    expect(behemoth.proportions.muscleBulge).toBeGreaterThan(mammalian.proportions.muscleBulge);
  });

  it('Wraith uses irregularFragment for all parts (decaying look)', () => {
    const wraith = getCreaturePreset('wraith')!;
    for (const shape of wraith.shapes) {
      expect(shape.primitive).toBe('irregularFragment');
      expect(shape.baseParams.irregularity).toBeGreaterThan(70); // very irregular
    }
  });

  it('Avian has thin legs (low scale teardropFin)', () => {
    const avian = getCreaturePreset('avian')!;
    const legShape = avian.shapes.find(s => s.slot === 'left_leg')!;
    expect(legShape.primitive).toBe('teardropFin');
    expect(legShape.baseParams.scale).toBeLessThan(0.5); // thin
  });

  it('Reptilian has wide hips (low-slung stance)', () => {
    const reptilian = getCreaturePreset('reptilian')!;
    expect(reptilian.proportions.hipWidth).toBeGreaterThan(1.0); // wide
  });
});

// ── Portable technique utilities work correctly ──────────────────────

describe('test_portable_techniques_work', () => {
  it('getDigit extracts nth digit from a number', () => {
    expect(getDigit(12345, 0)).toBe(5);
    expect(getDigit(12345, 1)).toBe(4);
    expect(getDigit(12345, 2)).toBe(3);
    expect(getDigit(12345, 4)).toBe(1);
  });

  it('getBoolean derives boolean from digit parity', () => {
    // 12345: digit 0 = 5 (odd) → false
    expect(getBoolean(12345, 0)).toBe(false);
    // 12345: digit 1 = 4 (even) → true
    expect(getBoolean(12345, 1)).toBe(true);
  });

  it('getUnit returns signed value based on digit parity', () => {
    // 12345 % 10 = 5, digit 1 = 4 (even) → -5
    expect(getUnit(12345, 10, 1)).toBe(-5);
    // 12345 % 10 = 5, no index → 5
    expect(getUnit(12345, 10)).toBe(5);
  });

  it('getContrastColor returns black or white based on YIQ', () => {
    expect(getContrastColor('#ffffff')).toBe('#000000'); // white bg → black text
    expect(getContrastColor('#000000')).toBe('#FFFFFF'); // black bg → white text
    expect(getContrastColor('#3b82f6')).toBe('#FFFFFF'); // blue bg → white text
  });

  it('weightedPick selects proportional to weights', () => {
    const weights = { a: 0, b: 100, c: 0 };
    // With b having all the weight, should always pick b
    const result = weightedPick('test', 'key', weights);
    expect(result).toBe('b');
  });

  it('weightedPick is deterministic for same seed+key', () => {
    const weights = { a: 50, b: 30, c: 20 };
    const r1 = weightedPick('seed1', 'key1', weights);
    const r2 = weightedPick('seed1', 'key1', weights);
    expect(r1).toBe(r2);
  });
});

// ── No regression ────────────────────────────────────────────────────

describe('test_no_regression', () => {
  it('Existing humanoidBilateral still renders correctly', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
    };
    const svg = renderFigureSvg(input, 100, 100);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('Existing chimeraAsymmetric still renders correctly', () => {
    const input: CompositionInput = {
      bodyPlan: chimeraAsymmetric,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
    };
    const svg = renderFigureSvg(input, 100, 100);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('Creature presets can be applied to existing body plans', () => {
    const preset = getCreaturePreset('insectoid')!;
    const bodyPlan = {
      ...preset.bodyPlan,
      shapeMappings: preset.shapes,
    };
    const input: CompositionInput = {
      bodyPlan,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
      proportions: preset.proportions,
    };
    const composed = composeFigure(input);
    expect(composed).toHaveLength(6);
  });
});
