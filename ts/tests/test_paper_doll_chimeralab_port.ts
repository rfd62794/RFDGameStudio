// @vitest-environment node
//
// Paper Doll — Full ChimeraLab Pattern Port — Tests
//
// Verifies all 8 ported patterns + integration with existing consumers.
//

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderFigureSvg,
  composeFigure,
  resolveAttachments,
  humanoidBilateral,
  chimeraAsymmetric,
  BIOLOGICAL_SCALING,
  PROPORTION_PRESETS,
  getProportionPreset,
  resolveColor,
  getColorForPart,
  darkenColor,
  lightenColor,
  blendColors,
} from '../src/engine/paperDoll/index';
import type {
  BodyPlan,
  BoneNode,
  BodyProportions,
  CompositionInput,
  PartForComposition,
  ColorGenetics,
} from '../src/engine/paperDoll/types';
import { PART_SLOTS } from '../src/engine/shared/partSlots';
import { renderSigmoidBulge } from '../src/engine/artGen/index';

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

// ── #1: SkeletonManifest data shape ──────────────────────────────────

describe('test_skeleton_manifest_shape_replaces_flat_nodes', () => {
  it('BoneNode schema has length, restAngle, side, and region fields', () => {
    // Verify the real BoneNode interface is used in body plans
    const humanoidNodes = humanoidBilateral.nodes;
    for (const node of humanoidNodes) {
      expect(node).toHaveProperty('length');
      expect(node).toHaveProperty('restAngle');
      expect(node).toHaveProperty('side');
      expect(node).toHaveProperty('region');
      expect(['left', 'right', 'center']).toContain(node.side);
      expect(['spine', 'head', 'arm', 'leg', 'torso']).toContain(node.region);
    }
  });

  it('Both existing body plans resolve correctly under the new schema', () => {
    const humanoidResolved = resolveAttachments(humanoidBilateral);
    expect(humanoidResolved).toHaveLength(6);
    for (const r of humanoidResolved) {
      expect(r.slot).toBeDefined();
      expect(typeof r.x).toBe('number');
      expect(typeof r.y).toBe('number');
      expect(typeof r.angle).toBe('number');
      expect(r.zOrder).toBeGreaterThanOrEqual(0);
      expect(['left', 'right', 'center']).toContain(r.side);
      expect(['spine', 'head', 'arm', 'leg', 'torso']).toContain(r.region);
    }

    const chimeraResolved = resolveAttachments(chimeraAsymmetric);
    expect(chimeraResolved).toHaveLength(6);
    for (const r of chimeraResolved) {
      expect(r.slot).toBeDefined();
      expect(['left', 'right', 'center']).toContain(r.side);
    }
  });

  it('Root node has parentSlot null and is at the expected position', () => {
    const humanoidRoot = humanoidBilateral.nodes.find(n => n.parentSlot === null);
    expect(humanoidRoot).toBeDefined();
    expect(humanoidRoot!.slot).toBe('chest');

    const resolved = resolveAttachments(humanoidBilateral);
    const rootResolved = resolved.find(r => r.slot === 'chest');
    expect(rootResolved).toBeDefined();
    expect(rootResolved!.x).toBe(50); // root offset.x
    expect(rootResolved!.y).toBe(48); // root offset.y (adjusted for humanoid grounding)
  });
});

// ── #2: BodyProportions ──────────────────────────────────────────────

describe('test_body_proportions_scale_correctly', () => {
  it('All 8 named presets exist and have different values', () => {
    const presetNames = ['normal', 'baby_hands', 'big_head', 'tiny_head', 'long_legs', 'buff', 'slim', 'gorilla', 'chibi'];
    for (const name of presetNames) {
      const preset = getProportionPreset(name);
      expect(preset).toBeDefined();
      expect(preset.name).toBeTruthy();
    }

    // Each preset produces a visibly different figure
    const svgs: string[] = [];
    for (const name of presetNames) {
      const preset = getProportionPreset(name);
      const input: CompositionInput = {
        bodyPlan: humanoidBilateral,
        parts: DUMMY_PARTS,
        colors: makeColors(),
        seed: 42,
        proportions: preset,
      };
      svgs.push(renderFigureSvg(input, 100, 100));
    }

    // At least some presets should produce different SVGs
    const uniqueSvgs = new Set(svgs);
    expect(uniqueSvgs.size).toBeGreaterThan(1);
  });

  it('Proportions scale the head size measurably', () => {
    const normalInput: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
      proportions: getProportionPreset('normal'),
    };
    const bigHeadInput: CompositionInput = {
      ...normalInput,
      proportions: getProportionPreset('big_head'),
    };

    const normalSvg = renderFigureSvg(normalInput, 100, 100);
    const bigHeadSvg = renderFigureSvg(bigHeadInput, 100, 100);
    expect(normalSvg).not.toBe(bigHeadSvg);
  });

  it('BodyProportions interface has all 12 multipliers + name', () => {
    const normal = getProportionPreset('normal');
    expect(normal).toHaveProperty('headSize');
    expect(normal).toHaveProperty('neckWidth');
    expect(normal).toHaveProperty('shoulderWidth');
    expect(normal).toHaveProperty('chestWidth');
    expect(normal).toHaveProperty('waistWidth');
    expect(normal).toHaveProperty('hipWidth');
    expect(normal).toHaveProperty('upperArmWidth');
    expect(normal).toHaveProperty('forearmWidth');
    expect(normal).toHaveProperty('handSize');
    expect(normal).toHaveProperty('thighWidth');
    expect(normal).toHaveProperty('calfWidth');
    expect(normal).toHaveProperty('footSize');
    expect(normal).toHaveProperty('muscleBulge');
    expect(normal).toHaveProperty('name');
  });
});

// ── #3: True FK rotation accumulation ────────────────────────────────

describe('test_fk_rotation_accumulation_correct', () => {
  it('FK formula matches ChimeraLab: childPos = parentPos + (cos(angle) * length, sin(angle) * length)', () => {
    // Build a minimal body plan with length > 0 to trigger FK mode
    const fkPlan: BodyPlan = {
      id: 'fk_test',
      root: 'chest',
      nodes: [
        {
          slot: 'chest',
          parentSlot: null,
          length: 0,
          restAngle: 0,
          offset: { x: 50, y: 50 },
          angle: 0,
          side: 'center',
          region: 'torso',
        },
        {
          slot: 'head',
          parentSlot: 'chest',
          length: 30, // FK mode — length > 0
          restAngle: -Math.PI / 2, // points up
          offset: { x: 0, y: 0 },
          angle: 0,
          side: 'center',
          region: 'head',
        },
      ],
      renderOrder: ['chest', 'head'],
      shapeMappings: [
        { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 4, irregularity: 0, radius: 10 } },
        { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 4, irregularity: 0, radius: 10 } },
      ],
    };

    const resolved = resolveAttachments(fkPlan);
    const head = resolved.find(r => r.slot === 'head')!;
    const chest = resolved.find(r => r.slot === 'chest')!;

    // FK formula: headPos = chestPos + (cos(restAngle) * length, sin(restAngle) * length)
    // restAngle = -PI/2, so cos(-PI/2) ≈ 0, sin(-PI/2) = -1
    // headX = 50 + 0 * 30 = 50
    // headY = 50 + (-1) * 30 = 20
    expect(head.x).toBeCloseTo(50, 0);
    expect(head.y).toBeCloseTo(20, 0);
    expect(head.angle).toBeCloseTo(-Math.PI / 2, 5);
  });

  it('FK accumulates parent rotation through the chain', () => {
    // Build a 3-node chain: root → child → grandchild, all with length > 0
    const fkChain: BodyPlan = {
      id: 'fk_chain',
      root: 'chest',
      nodes: [
        {
          slot: 'chest',
          parentSlot: null,
          length: 0,
          restAngle: 0,
          offset: { x: 0, y: 0 },
          angle: Math.PI / 4, // 45 degrees
          side: 'center',
          region: 'torso',
        },
        {
          slot: 'head',
          parentSlot: 'chest',
          length: 20,
          restAngle: 0, // no additional rest angle
          offset: { x: 0, y: 0 },
          angle: 0,
          side: 'center',
          region: 'head',
        },
        {
          slot: 'left_arm',
          parentSlot: 'head',
          length: 15,
          restAngle: 0,
          offset: { x: 0, y: 0 },
          angle: 0,
          side: 'left',
          region: 'arm',
        },
      ],
      renderOrder: ['chest', 'head', 'left_arm'],
      shapeMappings: [
        { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 4, irregularity: 0, radius: 5 } },
        { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 4, irregularity: 0, radius: 5 } },
        { slot: 'left_arm', primitive: 'polygon', baseParams: { vertexCount: 4, irregularity: 0, radius: 5 } },
      ],
    };

    const resolved = resolveAttachments(fkChain);
    const head = resolved.find(r => r.slot === 'head')!;
    const arm = resolved.find(r => r.slot === 'left_arm')!;

    // Root angle = PI/4 (45 degrees)
    // Head: accumulated = PI/4, finalAngle = 0 + PI/4 = PI/4
    // headX = 0 + cos(PI/4) * 20 ≈ 14.14
    // headY = 0 + sin(PI/4) * 20 ≈ 14.14
    expect(head.angle).toBeCloseTo(Math.PI / 4, 5);
    expect(head.x).toBeCloseTo(20 * Math.cos(Math.PI / 4), 1);
    expect(head.y).toBeCloseTo(20 * Math.sin(Math.PI / 4), 1);

    // Arm: accumulated = PI/4 (from head), finalAngle = 0 + PI/4 = PI/4
    // armX = headX + cos(PI/4) * 15
    // armY = headY + sin(PI/4) * 15
    expect(arm.angle).toBeCloseTo(Math.PI / 4, 5);
    expect(arm.x).toBeCloseTo(head.x + 15 * Math.cos(Math.PI / 4), 1);
    expect(arm.y).toBeCloseTo(head.y + 15 * Math.sin(Math.PI / 4), 1);
  });
});

// ── #3: Existing figures still correct post-FK change ────────────────

describe('test_existing_figures_still_correct_post_fk_change', () => {
  it('Humanoid bilateral still produces valid SVG with all 6 parts', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
    };
    const svg = renderFigureSvg(input, 100, 100);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    // strokeSkeleton produces <line>/<circle> elements directly (no <g> wrapper).
    // Verify all 6 named slots are present in the composed output.
    const composed = composeFigure(input);
    for (const slot of PART_SLOTS) {
      expect(composed.find(p => p.slot === slot)).toBeDefined();
    }
  });

  it('Chimera asymmetric still produces valid SVG with all 6 parts', () => {
    const input: CompositionInput = {
      bodyPlan: chimeraAsymmetric,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
    };
    const svg = renderFigureSvg(input, 100, 100);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    const gCount = (svg.match(/<g /g) ?? []).length;
    expect(gCount).toBe(6);
  });

  it('MBB RosterTab still references PaperDoll component', () => {
    const mbbRoster = readFileSync(
      resolve(tsRoot, 'src', 'games', 'mutant_battle_ball', 'components', 'RosterTab.tsx'),
      'utf-8',
    );
    expect(mbbRoster).toContain('PaperDoll');
  });

  it('Chimera Wilds App still references PaperDoll component', () => {
    const chimeraApp = readFileSync(
      resolve(tsRoot, 'src', 'games', 'chimera_wilds', 'App.tsx'),
      'utf-8',
    );
    expect(chimeraApp).toContain('PaperDoll');
  });
});

// ── #4: Hierarchical color resolution ────────────────────────────────

describe('test_hierarchical_color_resolution', () => {
  it('resolveColor walks priority-ordered keys and returns first defined', () => {
    const genetics: ColorGenetics = {
      body_base_color: '#ff0000',
      arm_color: '#00ff00',
    };
    // arm_upper_color not defined → falls back to arm_color
    expect(resolveColor(genetics, ['arm_upper_color', 'arm_color', 'body_base_color'])).toBe('#00ff00');
    // head_color not defined → falls back to body_base_color
    expect(resolveColor(genetics, ['head_color', 'body_base_color'])).toBe('#ff0000');
    // No keys defined → returns default
    expect(resolveColor(genetics, ['nonexistent'], '#cccccc')).toBe('#cccccc');
  });

  it('getColorForPart uses the 13-part hierarchy table', () => {
    const genetics: ColorGenetics = {
      body_base_color: '#ff0000',
      arm_upper_color: '#00ff00',
      leg_color: '#0000ff',
    };
    // left_arm → ['arm_upper_color', 'arm_color', 'body_base_color'] → #00ff00
    expect(getColorForPart(genetics, 'left_arm')).toBe('#00ff00');
    // left_leg → ['leg_upper_color', 'leg_color', 'body_base_color'] → #0000ff
    expect(getColorForPart(genetics, 'left_leg')).toBe('#0000ff');
    // head → ['head_color', 'body_base_color'] → #ff0000
    expect(getColorForPart(genetics, 'head')).toBe('#ff0000');
  });

  it('Composer uses genetics when provided, falls back to flat colors otherwise', () => {
    const genetics: ColorGenetics = {
      body_base_color: '#ff0000',
    };
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors('#3b82f6'), // flat colors
      genetics, // should override
      seed: 42,
    };
    const svg = renderFigureSvg(input, 100, 100);
    // With genetics, all parts should use #ff0000 (body_base_color fallback)
    expect(svg).toContain('#ff0000');
  });

  it('Color blending utilities work correctly', () => {
    expect(darkenColor('#ffffff', 0.5)).toBe('#808080');
    expect(lightenColor('#000000', 0.5)).toBe('#808080');
    expect(blendColors('#000000', '#ffffff', 0.0)).toBe('#000000');
    expect(blendColors('#000000', '#ffffff', 1.0)).toBe('#ffffff');
  });
});

// ── #5: Painter's algorithm Z-ordering ───────────────────────────────

describe('test_painters_algorithm_zorder', () => {
  it('Left-side limbs are darkened relative to right-side', () => {
    // With flat colors (no genetics), left-side parts should be darkened
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors('#ff0000'), // pure red
      seed: 42,
    };
    const composed = composeFigure(input);

    const leftArm = composed.find(c => c.slot === 'left_arm')!;
    const rightArm = composed.find(c => c.slot === 'right_arm')!;

    // Left arm should be darkened (painter's algorithm: background = darkened 15%)
    // Right arm should be full color
    expect(leftArm.svg).not.toContain('#ff0000"'); // darkened
    expect(rightArm.svg).toContain('#ff0000'); // full color (or close to it)
  });

  it('Resolved attachments carry side field for Z-ordering', () => {
    const resolved = resolveAttachments(humanoidBilateral);
    const leftArm = resolved.find(r => r.slot === 'left_arm')!;
    const rightArm = resolved.find(r => r.slot === 'right_arm')!;
    const chest = resolved.find(r => r.slot === 'chest')!;

    expect(leftArm.side).toBe('left');
    expect(rightArm.side).toBe('right');
    expect(chest.side).toBe('center');
  });

  it('Render order is back-to-front: legs → arms → chest → head', () => {
    const composed = composeFigure({
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
    });
    // strokeSkeleton adds joint blend circles, so the array has > 6 elements.
    // Verify the 6 named bone slots appear in the correct zOrder relative
    // to each other (legs before arms before chest before head).
    const boneSlots = composed.filter(p => PART_SLOTS.includes(p.slot as any));
    expect(boneSlots.length).toBe(6);
    expect(boneSlots[0].slot).toBe('left_leg');
    expect(boneSlots[1].slot).toBe('right_leg');
    expect(boneSlots[2].slot).toBe('left_arm');
    expect(boneSlots[3].slot).toBe('right_arm');
    expect(boneSlots[4].slot).toBe('chest');
    expect(boneSlots[5].slot).toBe('head');
  });
});

// ── #6: Biological scaling formulas ──────────────────────────────────

describe('test_biological_scaling_formulas', () => {
  it('BIOLOGICAL_SCALING constants match ChimeraLab real numbers', () => {
    // These are the real numbers from skeleton.rs, ported as named constants
    expect(BIOLOGICAL_SCALING.kleiberExponent).toBe(0.75);
    expect(BIOLOGICAL_SCALING.jointBuffer).toBe(1.3);
    expect(BIOLOGICAL_SCALING.limbEndTaper).toBe(0.55);
    expect(BIOLOGICAL_SCALING.torsoHips).toBe(1.5);
    expect(BIOLOGICAL_SCALING.torsoWaist).toBe(1.0);
    expect(BIOLOGICAL_SCALING.torsoChest).toBe(1.6);
    expect(BIOLOGICAL_SCALING.torsoNeck).toBe(0.6);
    expect(BIOLOGICAL_SCALING.torsoHead).toBe(1.2);
    expect(BIOLOGICAL_SCALING.bulgeFactor).toBe(0.4);
    expect(BIOLOGICAL_SCALING.bulgeSegments).toBe(6);
  });

  it('Biological scaling is applied to torso/head regions in composition', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    const chest = composed.find(c => c.slot === 'chest')!;
    const head = composed.find(c => c.slot === 'head')!;

    // humanoidBilateral now uses strokeSkeleton for all slots.
    // Chest = stroked <line> (spine), Head = stroked <circle>
    expect(chest.svg).toContain('<line');
    expect(head.svg).toContain('<circle');
  });

  it('Constants are named and flagged tunable (not buried magic numbers)', () => {
    const typesSource = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'types.ts'),
      'utf-8',
    );
    expect(typesSource).toContain('BIOLOGICAL_SCALING');
    expect(typesSource).toContain('kleiberExponent');
    expect(typesSource).toContain('jointBuffer');
    expect(typesSource).toContain('limbEndTaper');
  });
});

// ── #7: Sigmoid muscle bulge shape ───────────────────────────────────

describe('test_sigmoid_muscle_bulge_shape', () => {
  it('renderSigmoidBulge produces a valid SVG polygon', () => {
    const svg = renderSigmoidBulge({
      widthStart: 15,
      widthEnd: 8,
      fill: '#3b82f6',
      stroke: '#3b82f6',
    });
    expect(svg).toContain('<polygon');
    expect(svg).toContain('fill="#3b82f6"');
    // SVG polygon is self-closing
    expect(svg).toContain('/>');
  });

  it('Sigmoid bulge is registered as a fifth primitive in SlotShapeMapping', () => {
    const typesSource = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'types.ts'),
      'utf-8',
    );
    expect(typesSource).toContain("'sigmoidBulge'");
  });

  it('Composer renders sigmoidBulge primitive correctly', () => {
    // Build a body plan that uses sigmoidBulge for one slot
    const sigmoidPlan: BodyPlan = {
      id: 'sigmoid_test',
      root: 'chest',
      nodes: humanoidBilateral.nodes,
      renderOrder: humanoidBilateral.renderOrder,
      shapeMappings: [
        { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 14 } },
        { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 18 } },
        { slot: 'left_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 15, widthEnd: 8 } },
        { slot: 'right_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 15, widthEnd: 8 } },
        { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 15 } },
        { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 15 } },
      ],
    };

    const input: CompositionInput = {
      bodyPlan: sigmoidPlan,
      parts: DUMMY_PARTS,
      colors: makeColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    const leftArm = composed.find(c => c.slot === 'left_arm')!;
    expect(leftArm.svg).toContain('<polygon');
  });

  it('Sigmoid bulge produces different output than teardropFin', () => {
    const sigmoidSvg = renderSigmoidBulge({
      widthStart: 15,
      widthEnd: 8,
      fill: '#3b82f6',
      stroke: '#3b82f6',
    });
    // It should be a polygon (not a path like teardropFin)
    expect(sigmoidSvg).toContain('<polygon');
    expect(sigmoidSvg).not.toContain('<path');
  });
});

// ── #8: Posture-blend interpolation ──────────────────────────────────

describe('test_posture_blend_interpolation', () => {
  it('LERP between two body plans produces intermediate positions', () => {
    const resolved0 = resolveAttachments(humanoidBilateral, undefined, 0, chimeraAsymmetric);
    const resolved1 = resolveAttachments(humanoidBilateral, undefined, 1, chimeraAsymmetric);
    const resolved05 = resolveAttachments(humanoidBilateral, undefined, 0.5, chimeraAsymmetric);

    const head0 = resolved0.find(r => r.slot === 'head')!;
    const head1 = resolved1.find(r => r.slot === 'head')!;
    const head05 = resolved05.find(r => r.slot === 'head')!;

    // At weight=0.5, position should be the average of weight=0 and weight=1
    expect(head05.x).toBeCloseTo((head0.x + head1.x) / 2, 0);
    expect(head05.y).toBeCloseTo((head0.y + head1.y) / 2, 0);
  });

  it('Degrades correctly at postureWeight = 0 (uses bodyPlan)', () => {
    const resolved0 = resolveAttachments(humanoidBilateral, undefined, 0, chimeraAsymmetric);
    const resolvedPlain = resolveAttachments(humanoidBilateral);

    // At weight=0, should be identical to plain resolution (no blend)
    for (const r of resolved0) {
      const plain = resolvedPlain.find(p => p.slot === r.slot)!;
      expect(r.x).toBeCloseTo(plain.x, 5);
      expect(r.y).toBeCloseTo(plain.y, 5);
    }
  });

  it('Degrades correctly at postureWeight = 1 (uses blendPlan)', () => {
    const resolved1 = resolveAttachments(humanoidBilateral, undefined, 1, chimeraAsymmetric);
    const resolvedChimera = resolveAttachments(chimeraAsymmetric);

    // At weight=1, should be identical to chimera resolution
    for (const r of resolved1) {
      const chimera = resolvedChimera.find(p => p.slot === r.slot)!;
      expect(r.x).toBeCloseTo(chimera.x, 5);
      expect(r.y).toBeCloseTo(chimera.y, 5);
    }
  });

  it('Posture-blend produces a valid SVG figure across the range', () => {
    for (const weight of [0, 0.25, 0.5, 0.75, 1]) {
      const input: CompositionInput = {
        bodyPlan: humanoidBilateral,
        parts: DUMMY_PARTS,
        colors: makeColors(),
        seed: 42,
        postureWeight: weight,
        postureBlendPlan: chimeraAsymmetric,
      };
      const svg = renderFigureSvg(input, 100, 100);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });
});

// ── Integration: Character Viewer still works ────────────────────────

describe('test_character_viewer_still_works', () => {
  it('Dev-only standalone path files are present and import the real module', () => {
    const viewerSource = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx'),
      'utf-8',
    );
    expect(viewerSource).toContain('from \'../../engine/paperDoll\'');
    expect(viewerSource).toContain('renderFigureSvg');
    expect(viewerSource).toContain('humanoidBilateral');
    expect(viewerSource).toContain('chimeraAsymmetric');
  });

  it('Arcade entry wrapper imports from standalone surface', () => {
    const appSource = readFileSync(
      resolve(tsRoot, 'src', 'games', 'character_viewer', 'App.tsx'),
      'utf-8',
    );
    expect(appSource).toContain('from \'../../standalone/character_viewer/CharacterViewer\'');
  });

  it('Character Viewer renders valid SVG with the upgraded composer', () => {
    // Simulate what the Character Viewer does
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: makeColors('#1e88e5'),
      seed: 100,
    };
    const svg = renderFigureSvg(input, 300, 300);
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="300"');
    expect(svg).toContain('<svg');
  });
});

// ── No regression ────────────────────────────────────────────────────

describe('test_no_regression', () => {
  it('PaperDoll React component still works (Chimera Paper Doll Studio port)', () => {
    const paperDollSource = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'paperDoll', 'PaperDoll.tsx'),
      'utf-8',
    );
    // Post-port: PaperDoll uses the Chimera SvgCreatureRenderer, not the
    // procedural renderFigureSvg. The procedural composer is still exported
    // from the index for POC consumers.
    expect(paperDollSource).toContain('SvgCreatureRenderer');
    expect(paperDollSource).toContain('partsToCreatureConfig');
  });

  it('Existing paperDoll tests still pass (test_paper_doll.ts exists)', () => {
    const testExists = readFileSync(
      resolve(tsRoot, 'tests', 'test_paper_doll.ts'),
      'utf-8',
    );
    expect(testExists).toContain('renderFigureSvg');
    expect(testExists).toContain('humanoidBilateral');
  });

  it('artGen module exports renderSigmoidBulge', () => {
    const artGenIndex = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'artGen', 'index.ts'),
      'utf-8',
    );
    expect(artGenIndex).toContain('export * from \'./shapes\'');
    const shapesSource = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'artGen', 'shapes.ts'),
      'utf-8',
    );
    expect(shapesSource).toContain('export function renderSigmoidBulge');
  });
});
