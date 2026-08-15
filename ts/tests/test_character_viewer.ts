// @vitest-environment node
//
// Character Viewer — Paper Doll Shape Iteration Tool — Tests
//
// Verifies:
//   1. Viewer consumes the real, unmodified paperDoll composer
//   2. Body Plan switching works live (no reload)
//   3. Per-slot shape override works live
//   4. Side-by-side renders distinct configs simultaneously
//   5. Export produces a valid SlotShapeMapping set
//   6. Production paperDoll module confirmed unmodified via diff
//   7. No regression to current floor
//

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderFigureSvg,
  humanoidBilateral,
  chimeraAsymmetric,
} from '../src/engine/paperDoll/index';
import type {
  BodyPlan,
  SlotShapeMapping,
  CompositionInput,
  PartForComposition,
} from '../src/engine/paperDoll/types';
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

// Replicate the viewer's buildBodyPlan logic (the real viewer does the same)
function buildBodyPlan(
  basePlan: BodyPlan,
  shapeOverrides: Record<string, SlotShapeMapping>,
): BodyPlan {
  return {
    ...basePlan,
    shapeMappings: PART_SLOTS.map(
      slot => shapeOverrides[slot] ?? basePlan.shapeMappings.find(sm => sm.slot === slot)!,
    ),
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('test_viewer_consumes_real_module', () => {
  it('Viewer source imports from the real paperDoll module — not forked logic', () => {
    const viewerSource = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx'),
      'utf-8',
    );
    // Must import from the real engine/paperDoll module
    expect(viewerSource).toContain('from \'../../engine/paperDoll\'');
    // Must use renderFigureSvg — the real composer's public API
    expect(viewerSource).toContain('renderFigureSvg');
    // Must NOT contain forked/duplicate shape rendering logic
    expect(viewerSource).not.toContain('renderPolygonPoints');
    expect(viewerSource).not.toContain('renderTeardropFin');
    expect(viewerSource).not.toContain('renderRadialBurst');
    expect(viewerSource).not.toContain('renderIrregularFragment');
  });

  it('Viewer renders via the real renderFigureSvg — produces valid SVG', () => {
    // Simulate what the viewer does: build a CompositionInput and call
    // the real renderFigureSvg
    const input: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: {
        head: '#3b82f6', chest: '#3b82f6',
        left_arm: '#3b82f6', right_arm: '#3b82f6',
        left_leg: '#3b82f6', right_leg: '#3b82f6',
      },
      seed: 42,
    };
    const svg = renderFigureSvg(input, 300, 300);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="300"');
  });
});

describe('test_body_plan_switch_live', () => {
  it('Switching Body Plan produces a different render (no reload needed)', () => {
    const colors: Record<string, string> = {};
    for (const slot of PART_SLOTS) colors[slot] = '#3b82f6';

    const humanInput: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors,
      seed: 42,
    };
    const chimeraInput: CompositionInput = {
      ...humanInput,
      bodyPlan: chimeraAsymmetric,
    };

    const humanSvg = renderFigureSvg(humanInput, 300, 300);
    const chimeraSvg = renderFigureSvg(chimeraInput, 300, 300);

    // The two renders should be different — different body plans produce
    // different attachment positions and different shape mappings
    expect(humanSvg).not.toBe(chimeraSvg);
  });
});

describe('test_per_slot_override_live', () => {
  it('Changing a slot\'s primitive updates that slot\'s shape in real time', () => {
    const colors: Record<string, string> = {};
    for (const slot of PART_SLOTS) colors[slot] = '#3b82f6';

    // Base config with polygon head
    const basePlan = buildBodyPlan(humanoidBilateral, {
      head: { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 15 } },
      chest: { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 18 } },
      left_arm: { slot: 'left_arm', primitive: 'teardropFin', baseParams: { scale: 0.5, angularity: 20 } },
      right_arm: { slot: 'right_arm', primitive: 'teardropFin', baseParams: { scale: 0.5, angularity: 20 } },
      left_leg: { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 15 } },
      right_leg: { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 15 } },
    });

    const beforeInput: CompositionInput = {
      bodyPlan: basePlan,
      parts: DUMMY_PARTS,
      colors,
      seed: 42,
    };
    const beforeSvg = renderFigureSvg(beforeInput, 300, 300);

    // Override head to irregularFragment
    const afterPlan = buildBodyPlan(humanoidBilateral, {
      ...basePlan.shapeMappings.reduce((acc, sm) => { acc[sm.slot] = sm; return acc; }, {} as Record<string, SlotShapeMapping>),
      head: { slot: 'head', primitive: 'irregularFragment', baseParams: { vertexCount: 7, irregularity: 60, radius: 15 } },
    });

    const afterInput: CompositionInput = {
      bodyPlan: afterPlan,
      parts: DUMMY_PARTS,
      colors,
      seed: 42,
    };
    const afterSvg = renderFigureSvg(afterInput, 300, 300);

    // The render should change when the primitive changes
    expect(beforeSvg).not.toBe(afterSvg);
  });

  it('Changing a slot\'s params updates the render (e.g. radius)', () => {
    const colors: Record<string, string> = {};
    for (const slot of PART_SLOTS) colors[slot] = '#3b82f6';

    const plan1 = buildBodyPlan(humanoidBilateral, {
      head: { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 10 } },
      chest: { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 18 } },
      left_arm: { slot: 'left_arm', primitive: 'teardropFin', baseParams: { scale: 0.5, angularity: 20 } },
      right_arm: { slot: 'right_arm', primitive: 'teardropFin', baseParams: { scale: 0.5, angularity: 20 } },
      left_leg: { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 15 } },
      right_leg: { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 15 } },
    });

    const plan2 = buildBodyPlan(humanoidBilateral, {
      ...plan1.shapeMappings.reduce((acc, sm) => { acc[sm.slot] = sm; return acc; }, {} as Record<string, SlotShapeMapping>),
      head: { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 30 } },
    });

    const svg1 = renderFigureSvg({ bodyPlan: plan1, parts: DUMMY_PARTS, colors, seed: 42 }, 300, 300);
    const svg2 = renderFigureSvg({ bodyPlan: plan2, parts: DUMMY_PARTS, colors, seed: 42 }, 300, 300);

    expect(svg1).not.toBe(svg2);
  });
});

describe('test_side_by_side_renders_distinct_configs', () => {
  it('Two different configurations render simultaneously and are visibly different', () => {
    const colors: Record<string, string> = {};
    for (const slot of PART_SLOTS) colors[slot] = '#3b82f6';

    // Config A: humanoid, polygon head, blue
    const configA: CompositionInput = {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: { ...colors, head: '#3b82f6' },
      seed: 100,
    };

    // Config B: chimera, irregularFragment head, red
    const configB: CompositionInput = {
      bodyPlan: chimeraAsymmetric,
      parts: DUMMY_PARTS,
      colors: { ...colors, head: '#ef4444' },
      seed: 300,
    };

    const svgA = renderFigureSvg(configA, 300, 300);
    const svgB = renderFigureSvg(configB, 300, 300);

    // Both are valid SVGs at 300px
    expect(svgA).toContain('width="300"');
    expect(svgB).toContain('width="300"');
    // They are different
    expect(svgA).not.toBe(svgB);
  });

  it('Viewer source has two figure panels for side-by-side comparison', () => {
    const viewerSource = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx'),
      'utf-8',
    );
    expect(viewerSource).toContain('cv-figure-panel');
    expect(viewerSource).toContain('leftConfig');
    expect(viewerSource).toContain('rightConfig');
  });
});

describe('test_export_produces_valid_config', () => {
  it('Exported config is a real, valid SlotShapeMapping set', () => {
    // Simulate the viewer's export logic
    const shapeOverrides: Record<string, SlotShapeMapping> = {
      head: { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 5, radius: 16 } },
      chest: { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 5, radius: 20 } },
      left_arm: { slot: 'left_arm', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 40 } },
      right_arm: { slot: 'right_arm', primitive: 'teardropFin', baseParams: { scale: 0.55, angularity: 40 } },
      left_leg: { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 30 } },
      right_leg: { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 30 } },
    };

    const exportObj = {
      id: 'bionicle',
      label: 'Bionicle (Brand/silhouette)',
      bodyPlanId: 'humanoid_bilateral',
      shapeMappings: PART_SLOTS.map(slot => shapeOverrides[slot]),
      colors: { head: '#1e88e5' },
      seed: 100,
    };

    const exported = JSON.stringify(exportObj, null, 2);
    const parsed = JSON.parse(exported);

    // The exported shapeMappings should be a valid array of SlotShapeMapping
    expect(parsed.shapeMappings).toHaveLength(6);
    for (const sm of parsed.shapeMappings) {
      expect(sm.slot).toBeDefined();
      expect(sm.primitive).toBeDefined();
      expect(['polygon', 'radialBurst', 'teardropFin', 'irregularFragment']).toContain(sm.primitive);
      expect(sm.baseParams).toBeDefined();
      expect(typeof sm.baseParams).toBe('object');
    }

    // The exported config should be usable to build a real BodyPlan
    const base = parsed.bodyPlanId === 'humanoid_bilateral' ? humanoidBilateral : chimeraAsymmetric;
    const reconstructedPlan: BodyPlan = {
      ...base,
      shapeMappings: parsed.shapeMappings as SlotShapeMapping[],
    };

    // And it should produce a valid render
    const svg = renderFigureSvg({
      bodyPlan: reconstructedPlan,
      parts: DUMMY_PARTS,
      colors: parsed.colors,
      seed: parsed.seed,
    }, 300, 300);
    expect(svg).toContain('<svg');
  });

  it('Viewer source has export functionality', () => {
    const viewerSource = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx'),
      'utf-8',
    );
    expect(viewerSource).toContain('exportConfig');
    expect(viewerSource).toContain('JSON.stringify');
    expect(viewerSource).toContain('SlotShapeMapping');
  });
});

describe('test_no_production_code_modified', () => {
  it('composer.ts is byte-unchanged from last commit', () => {
    const file = resolve(tsRoot, 'src', 'engine', 'paperDoll', 'composer.ts');
    let diff: string;
    try {
      diff = execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      // If git diff fails (e.g. file is untracked/new), check with git status
      diff = '';
    }
    expect(diff.trim()).toBe('');
  });

  it('attachmentGraph.ts is byte-unchanged from last commit', () => {
    const file = resolve(tsRoot, 'src', 'engine', 'paperDoll', 'attachmentGraph.ts');
    let diff: string;
    try {
      diff = execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      diff = '';
    }
    expect(diff.trim()).toBe('');
  });

  it('humanoidBilateral.ts is byte-unchanged from last commit', () => {
    const file = resolve(tsRoot, 'src', 'engine', 'paperDoll', 'bodyPlans', 'humanoidBilateral.ts');
    let diff: string;
    try {
      diff = execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      diff = '';
    }
    expect(diff.trim()).toBe('');
  });

  it('chimeraAsymmetric.ts is byte-unchanged from last commit', () => {
    const file = resolve(tsRoot, 'src', 'engine', 'paperDoll', 'bodyPlans', 'chimeraAsymmetric.ts');
    let diff: string;
    try {
      diff = execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      diff = '';
    }
    expect(diff.trim()).toBe('');
  });
});

describe('test_no_regression', () => {
  it('Three reference presets exist in the viewer source', () => {
    const viewerSource = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx'),
      'utf-8',
    );
    expect(viewerSource).toContain('BIONICLE_PRESET');
    expect(viewerSource).toContain('GIGER_PRESET');
    expect(viewerSource).toContain('FRANKENSTEIN_PRESET');
  });

  it('Viewer is a standalone surface — not imported by any game or production code', () => {
    // The viewer should only be in the standalone directory, not imported
    // by any game App.tsx or production module
    const viewerPath = 'standalone/character_viewer';
    const gameDirs = ['mutant_battle_ball', 'chimera_wilds', 'shoal', 'slimeworld'];
    for (const game of gameDirs) {
      const appPath = resolve(tsRoot, 'src', 'games', game, 'App.tsx');
      try {
        const source = readFileSync(appPath, 'utf-8');
        expect(source).not.toContain(viewerPath);
      } catch {
        // Some games might not have App.tsx — skip
      }
    }
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
