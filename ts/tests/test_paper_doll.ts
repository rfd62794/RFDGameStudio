// @vitest-environment node
//
// Paper Doll / Composite Character Rendering Module — Tests
//
// Verifies:
//   1. Attachment graph resolution — parent-child offsets produce correct
//      absolute positions
//   2. Layer composition — parts are ordered back-to-front by zOrder
//   3. Shape generation — artGen primitives are consumed correctly
//   4. Both body plans produce valid composed figures
//   5. Real consumer wiring — MBB and Chimera Wilds use the module
//   6. No regression — existing floor holds
//

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveAttachments,
  composeFigure,
  renderFigureSvg,
  humanoidBilateral,
  chimeraAsymmetric,
} from '../src/engine/paperDoll/index';
import type { CompositionInput, PartForComposition } from '../src/engine/paperDoll/types';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

// ── Test fixtures ────────────────────────────────────────────────────

function makePart(id: string, slot: string): PartForComposition {
  return { id, name: id, slot: slot as PartForComposition['slot'] };
}

function makeFullParts(): Record<string, PartForComposition | null> {
  return {
    head: makePart('p_head', 'head'),
    chest: makePart('p_chest', 'chest'),
    left_arm: makePart('p_la', 'left_arm'),
    right_arm: makePart('p_ra', 'right_arm'),
    left_leg: makePart('p_ll', 'left_leg'),
    right_leg: makePart('p_rl', 'right_leg'),
  };
}

function makeFullColors(): Record<string, string> {
  return {
    head: '#3b82f6',
    chest: '#3b82f6',
    left_arm: '#3b82f6',
    right_arm: '#3b82f6',
    left_leg: '#3b82f6',
    right_leg: '#3b82f6',
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('test_attachment_graph_resolution', () => {
  it('Root node resolves to its offset with angle 0', () => {
    const attachments = resolveAttachments(humanoidBilateral);
    const root = attachments.find(a => a.slot === 'chest');
    expect(root).toBeDefined();
    expect(root!.x).toBe(50);
    expect(root!.y).toBe(50);
    expect(root!.angle).toBe(0);
  });

  it('Child nodes resolve relative to parent position + rotated offset', () => {
    const attachments = resolveAttachments(humanoidBilateral);
    const head = attachments.find(a => a.slot === 'head');
    expect(head).toBeDefined();
    // Head offset is {0, -22} from chest at {50, 50} with angle 0
    // So head should be at {50, 28}
    expect(head!.x).toBeCloseTo(50, 1);
    expect(head!.y).toBeCloseTo(28, 1);
    expect(head!.angle).toBeCloseTo(0, 2);
  });

  it('All 6 slots are resolved for humanoidBilateral', () => {
    const attachments = resolveAttachments(humanoidBilateral);
    expect(attachments.length).toBe(6);
    const slots = attachments.map(a => a.slot).sort();
    expect(slots).toEqual(['chest', 'head', 'left_arm', 'left_leg', 'right_arm', 'right_leg']);
  });

  it('All 6 slots are resolved for chimeraAsymmetric', () => {
    const attachments = resolveAttachments(chimeraAsymmetric);
    expect(attachments.length).toBe(6);
    const slots = attachments.map(a => a.slot).sort();
    expect(slots).toEqual(['chest', 'head', 'left_arm', 'left_leg', 'right_arm', 'right_leg']);
  });

  it('Chimera head is offset asymmetrically (not centered like humanoid)', () => {
    const humanAtt = resolveAttachments(humanoidBilateral);
    const chimeraAtt = resolveAttachments(chimeraAsymmetric);
    const humanHead = humanAtt.find(a => a.slot === 'head')!;
    const chimeraHead = chimeraAtt.find(a => a.slot === 'head')!;
    // Humanoid head is centered (x=50), chimera head is offset right
    expect(humanHead.x).toBeCloseTo(50, 1);
    expect(chimeraHead.x).toBeGreaterThan(50); // offset right
  });

  it('zOrder is assigned from renderOrder', () => {
    const attachments = resolveAttachments(humanoidBilateral);
    const leg = attachments.find(a => a.slot === 'left_leg')!;
    const head = attachments.find(a => a.slot === 'head')!;
    // renderOrder: legs first (zOrder 0), head last (zOrder 5)
    expect(leg.zOrder).toBeLessThan(head.zOrder);
  });
});

describe('test_layer_composition', () => {
  it('Composed parts are ordered back-to-front by zOrder', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    expect(composed.length).toBe(6);
    // Verify zOrder is ascending
    for (let i = 1; i < composed.length; i++) {
      expect(composed[i].zOrder).toBeGreaterThanOrEqual(composed[i - 1].zOrder);
    }
  });

  it('Each composed part contains an SVG <g> element with transform', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    for (const part of composed) {
      expect(part.svg).toContain('<g transform=');
      expect(part.svg).toContain('</g>');
    }
  });

  it('renderFigureSvg produces a complete SVG document', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const svg = renderFigureSvg(input, 100, 100);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('width="100"');
    expect(svg).toContain('height="100"');
  });
});

describe('test_shape_generation', () => {
  it('Polygon primitive produces <polygon> elements', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    const head = composed.find(c => c.slot === 'head')!;
    // humanoidBilateral maps head to 'polygon'
    expect(head.svg).toContain('<polygon');
  });

  it('TeardropFin primitive produces <path> elements (body+tail)', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    const arm = composed.find(c => c.slot === 'left_arm')!;
    // humanoidBilateral maps arms to 'teardropFin'
    expect(arm.svg).toContain('<path');
  });

  it('IrregularFragment primitive produces <polygon> elements (for chimera)', () => {
    const input: CompositionInput = {
      bodyPlan: chimeraAsymmetric,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    const head = composed.find(c => c.slot === 'head')!;
    // chimeraAsymmetric maps head to 'irregularFragment'
    expect(head.svg).toContain('<polygon');
  });

  it('RadialBurst primitive produces <polygon> elements (for chimera arms)', () => {
    const input: CompositionInput = {
      bodyPlan: chimeraAsymmetric,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    const arm = composed.find(c => c.slot === 'left_arm')!;
    // chimeraAsymmetric maps left_arm to 'radialBurst'
    expect(arm.svg).toContain('<polygon');
  });

  it('Colors from the input appear in the rendered SVG', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: { ...makeFullColors(), head: '#ff0000' },
      seed: 42,
    };
    const composed = composeFigure(input);
    const head = composed.find(c => c.slot === 'head')!;
    expect(head.svg).toContain('#ff0000');
  });

  it('Deterministic seed produces identical output across calls', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const svg1 = renderFigureSvg(input);
    const svg2 = renderFigureSvg(input);
    expect(svg1).toBe(svg2);
  });

  it('Different seeds produce different output (shape jitter varies)', () => {
    const input1: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 1,
    };
    const input2: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 999,
    };
    const svg1 = renderFigureSvg(input1);
    const svg2 = renderFigureSvg(input2);
    expect(svg1).not.toBe(svg2);
  });
});

describe('test_both_body_plans_produce_valid_figures', () => {
  it('humanoidBilateral produces a 6-part figure with correct shape types', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    expect(composed.length).toBe(6);

    // Verify shape types match the body plan's mappings
    const head = composed.find(c => c.slot === 'head')!;
    expect(head.svg).toContain('<polygon'); // polygon primitive

    const arm = composed.find(c => c.slot === 'left_arm')!;
    expect(arm.svg).toContain('<path'); // teardropFin primitive
  });

  it('chimeraAsymmetric produces a 6-part figure with correct shape types', () => {
    const input: CompositionInput = {
      bodyPlan: chimeraAsymmetric,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const composed = composeFigure(input);
    expect(composed.length).toBe(6);

    // chimera uses irregularFragment and radialBurst (both produce <polygon>)
    const head = composed.find(c => c.slot === 'head')!;
    expect(head.svg).toContain('<polygon'); // irregularFragment

    const arm = composed.find(c => c.slot === 'left_arm')!;
    expect(arm.svg).toContain('<polygon'); // radialBurst
  });

  it('The two body plans produce visually different figures', () => {
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: makeFullParts(),
      colors: makeFullColors(),
      seed: 42,
    };
    const humanSvg = renderFigureSvg(input);
    const chimeraSvg = renderFigureSvg({ ...input, bodyPlan: chimeraAsymmetric });
    expect(humanSvg).not.toBe(chimeraSvg);
  });
});

describe('test_real_consumer_wiring', () => {
  it('MBB RosterTab imports and uses PaperDoll with humanoidBilateral', () => {
    const rosterSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'RosterTab.tsx'),
      'utf-8'
    );
    expect(rosterSource).toContain('PaperDoll');
    expect(rosterSource).toContain('humanoidBilateral');
  });

  it('MBB WorkshopTab imports and uses PaperDoll with humanoidBilateral', () => {
    const workshopSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'WorkshopTab.tsx'),
      'utf-8'
    );
    expect(workshopSource).toContain('PaperDoll');
    expect(workshopSource).toContain('humanoidBilateral');
  });

  it('Chimera Wilds App imports and uses PaperDoll with chimeraAsymmetric', () => {
    const chimeraSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'chimera_wilds', 'App.tsx'),
      'utf-8'
    );
    expect(chimeraSource).toContain('PaperDoll');
    expect(chimeraSource).toContain('chimeraAsymmetric');
  });

  it('PaperDoll module consumes artGen primitives — not duplicating shape logic', () => {
    const composerSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'composer.ts'),
      'utf-8'
    );
    // Must import from artGen, not reimplement
    expect(composerSource).toContain('from \'../artGen/index\'');
    expect(composerSource).toContain('renderPolygonPoints');
    expect(composerSource).toContain('renderTeardropFin');
    expect(composerSource).toContain('renderRadialBurst');
    expect(composerSource).toContain('renderIrregularFragment');
  });

  it('PaperDoll module uses the shared PartSlot type — not redefining it', () => {
    const typesSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'types.ts'),
      'utf-8'
    );
    expect(typesSource).toContain('from \'../shared/partSlots\'');
    expect(typesSource).not.toMatch(/type PartSlot\s*=/);
  });
});

describe('test_no_regression', () => {
  it('PaperDoll module is a pure rendering layer — does not modify Part data', () => {
    const composerSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'composer.ts'),
      'utf-8'
    );
    // Should not contain any stat modification logic
    expect(composerSource).not.toMatch(/\.accuracy\s*=/);
    expect(composerSource).not.toMatch(/\.endurance\s*=/);
    expect(composerSource).not.toMatch(/\.power\s*=/);
    expect(composerSource).not.toMatch(/\.speed\s*=/);
  });

  it('Both body plans use the same 6 slots as the shared PartSlot type', () => {
    const humanSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'bodyPlans', 'humanoidBilateral.ts'),
      'utf-8'
    );
    const chimeraSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'bodyPlans', 'chimeraAsymmetric.ts'),
      'utf-8'
    );
    const expectedSlots = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
    for (const slot of expectedSlots) {
      expect(humanSource).toContain(slot);
      expect(chimeraSource).toContain(slot);
    }
  });

  it('No cross-game imports — PaperDoll is engine-level, not game-level', () => {
    const moduleFiles = [
      'ts/src/engine/paperDoll/types.ts',
      'ts/src/engine/paperDoll/attachmentGraph.ts',
      'ts/src/engine/paperDoll/composer.ts',
      'ts/src/engine/paperDoll/index.ts',
      'ts/src/engine/paperDoll/bodyPlans/humanoidBilateral.ts',
      'ts/src/engine/paperDoll/bodyPlans/chimeraAsymmetric.ts',
    ];
    for (const file of moduleFiles) {
      const source = readFileSync(resolve(repoRoot, file), 'utf-8');
      expect(source).not.toContain('games/mutant_battle_ball');
      expect(source).not.toContain('games/chimera_wilds');
      expect(source).not.toContain('games/shoal');
    }
  });
});
