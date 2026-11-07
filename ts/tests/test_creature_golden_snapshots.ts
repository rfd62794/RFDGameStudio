// @vitest-environment node
//
// Creature Golden Snapshots — roadmap M5.2
//
// Renders a fixed set of creature configurations through the public
// renderFigureSvg at 200x200 and compares each result byte-for-byte
// with a committed golden .svg under tests/golden/creature/. Any diff
// is either an intended change — re-bless in the same commit and say
// why in the commit message — or a regression in the renderer.
//
// Re-bless: UPDATE_GOLDEN=1 npx vitest run test_creature_golden_snapshots.ts
// (run from ts/). A missing golden file is a failure, never an
// auto-create, once BLESS_MISSING is false.

import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderFigureSvg,
  humanoidBilateral,
  CREATURE_PRESETS,
  PROPORTION_PRESETS,
  PROPORTION_PRESET_ORDER,
  type CreaturePreset,
} from '../src/engine/paperDoll/index';
import type {
  BodyPlan,
  SlotShapeMapping,
  CompositionInput,
  PartForComposition,
} from '../src/engine/paperDoll/types';
import { PART_SLOTS } from '../src/engine/shared/partSlots';

// Set UPDATE_GOLDEN=1 to re-bless; a missing golden is a failure.
const BLESS_MISSING = false;

const __filename = fileURLToPath(import.meta.url);
const GOLDEN_DIR = join(dirname(__filename), 'golden', 'creature');
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === '1';
const FIGURE_SIZE = 200;
const FIXED_COLOR = '#3b82f6';

// ── Fixtures (same dummy-parts pattern as test_character_viewer.ts) ──

function makeDummyParts(): Record<string, PartForComposition | null> {
  const parts: Record<string, PartForComposition | null> = {};
  for (const slot of PART_SLOTS) {
    parts[slot] = { id: `dummy_${slot}`, name: slot, slot };
  }
  return parts;
}

const DUMMY_PARTS = makeDummyParts();

const FIXED_COLORS: Record<string, string> = {};
for (const slot of PART_SLOTS) FIXED_COLORS[slot] = FIXED_COLOR;

// Same shape-override logic the Character Viewer uses (buildBodyPlan).
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

// ── The fixed golden set: 15 cases ──────────────────────────────────

interface GoldenCase {
  fileName: string;
  input: CompositionInput;
}

function creatureCase(preset: CreaturePreset, seed: number): GoldenCase {
  const overrides: Record<string, SlotShapeMapping> = {};
  for (const sm of preset.shapes) overrides[sm.slot] = sm;
  return {
    fileName: `${preset.id}_seed${seed}.svg`,
    input: {
      bodyPlan: buildBodyPlan(preset.bodyPlan, overrides),
      parts: DUMMY_PARTS,
      colors: FIXED_COLORS,
      seed,
      proportions: preset.proportions,
    },
  };
}

// First, middle and last entries of PROPORTION_PRESET_ORDER.
const PROPORTION_CASE_NAMES = [
  PROPORTION_PRESET_ORDER[0],
  PROPORTION_PRESET_ORDER[Math.floor(PROPORTION_PRESET_ORDER.length / 2)],
  PROPORTION_PRESET_ORDER[PROPORTION_PRESET_ORDER.length - 1],
];

function proportionCase(name: string): GoldenCase {
  return {
    fileName: `proportion_${name}_seed42.svg`,
    input: {
      bodyPlan: humanoidBilateral,
      parts: DUMMY_PARTS,
      colors: FIXED_COLORS,
      seed: 42,
      proportions: PROPORTION_PRESETS[name],
    },
  };
}

const CASES: GoldenCase[] = [
  ...CREATURE_PRESETS.flatMap(preset => [42, 1337].map(seed => creatureCase(preset, seed))),
  ...PROPORTION_CASE_NAMES.map(proportionCase),
];

// ── Golden compare / bless ──────────────────────────────────────────

const normalise = (s: string): string => s.replace(/\r\n/g, '\n');

function renderCase(c: GoldenCase): string {
  return normalise(renderFigureSvg(c.input, FIGURE_SIZE, FIGURE_SIZE));
}

function writeGolden(goldenPath: string, content: string): void {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  writeFileSync(goldenPath, content, 'utf-8');
}

function checkAgainstGolden(fileName: string, actual: string): void {
  const goldenPath = join(GOLDEN_DIR, fileName);
  if (UPDATE_GOLDEN) {
    writeGolden(goldenPath, actual);
    return;
  }
  if (!existsSync(goldenPath)) {
    if (BLESS_MISSING) {
      writeGolden(goldenPath, actual);
      return;
    }
    throw new Error(
      `Missing golden file: ${goldenPath}. ` +
      `Re-bless with UPDATE_GOLDEN=1 npx vitest run test_creature_golden_snapshots.ts (from ts/).`,
    );
  }
  const expected = normalise(readFileSync(goldenPath, 'utf-8'));
  expect(
    actual,
    `Golden mismatch: ${goldenPath}. If the change is intended, re-bless with ` +
    `UPDATE_GOLDEN=1 npx vitest run test_creature_golden_snapshots.ts (from ts/) ` +
    `and commit the updated file; otherwise this is a renderer regression.`,
  ).toBe(expected);
}

// ── Tests ───────────────────────────────────────────────────────────

describe('creature golden snapshots (M5.2)', () => {
  for (const c of CASES) {
    it(`matches golden ${c.fileName}`, () => {
      checkAgainstGolden(c.fileName, renderCase(c));
    });
  }

  it('renders the same input twice byte-identically (no hidden randomness)', () => {
    for (const c of CASES) {
      expect(renderCase(c), `non-deterministic render: ${c.fileName}`).toBe(renderCase(c));
    }
  });

  it('produces 15 pairwise-distinct outputs (no preset collapses to another)', () => {
    expect(CASES).toHaveLength(15);
    const outputs = CASES.map(renderCase);
    expect(new Set(outputs).size).toBe(CASES.length);
  });
});
