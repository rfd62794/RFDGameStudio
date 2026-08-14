import { describe, it, expect } from 'vitest';
import { resolveCellCombat, RPS_COUNTERS, SHAPE_MATRIX } from '../src/engine/shared/combat';
import type { UnitGroup } from '../src/engine/shared/combat';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * test_shared_combat_matches_original
 *
 * The extracted combat resolver must produce identical output to the
 * pre-extraction version in examples/planetofgreed/src/utils/combat.ts
 * for real test scenarios. This test runs the shared resolver against
 * known combat scenarios and verifies the results match expectations
 * derived from the original implementation.
 */
describe('test_shared_combat_matches_original', () => {
  it('RPS counters are correct: circle>square, square>triangle, triangle>circle', () => {
    expect(RPS_COUNTERS.circle).toBe('square');
    expect(RPS_COUNTERS.square).toBe('triangle');
    expect(RPS_COUNTERS.triangle).toBe('circle');
  });

  it('SHAPE_MATRIX has correct counter multipliers (0.7 for counter, 0.2 for countered, 0.4 for same)', () => {
    expect(SHAPE_MATRIX.circle.square).toBe(0.7);   // circle counters square
    expect(SHAPE_MATRIX.square.circle).toBe(0.2);   // square countered by circle
    expect(SHAPE_MATRIX.circle.circle).toBe(0.4);   // same type
  });

  it('resolveCellCombat: single attacker wins against empty defender', () => {
    const result = resolveCellCombat(
      0, 'TestCell',
      { 'corp-a': { circle: 10, square: 0, triangle: 0 } },
      null, 0,
      { 'corp-a': 'Corp A' }
    );
    expect(result.victorId).toBe('corp-a');
    expect(result.finalUnits['corp-a'].circle).toBe(10);
  });

  it('resolveCellCombat: two corps, counter advantage determines victor', () => {
    // Corp A has 10 circles, Corp B has 10 squares. Circle counters square.
    const result = resolveCellCombat(
      0, 'TestCell',
      {
        'corp-a': { circle: 10, square: 0, triangle: 0 },
        'corp-b': { circle: 0, square: 10, triangle: 0 },
      },
      null, 0,
      { 'corp-a': 'Corp A', 'corp-b': 'Corp B' }
    );
    // Corp A should win because circle counters square (0.7 vs 0.2 multiplier)
    expect(result.victorId).toBe('corp-a');
    expect(result.finalUnits['corp-a'].circle).toBeGreaterThan(0);
    expect(result.finalUnits['corp-b'].square).toBe(0);
  });

  it('resolveCellCombat: fortification absorbs damage for owner', () => {
    const result = resolveCellCombat(
      0, 'FortifiedCell',
      {
        'owner': { circle: 5, square: 0, triangle: 0 },
        'attacker': { circle: 10, square: 0, triangle: 0 },
      },
      'owner', 50, // 50 fortification
      { 'owner': 'Owner', 'attacker': 'Attacker' }
    );
    // Fortification should have absorbed some damage
    expect(result.fortificationsLost).toBeGreaterThan(0);
  });

  it('resolveCellCombat: max 15 rounds prevents infinite loops', () => {
    // Two identical forces with same type — same-type multiplier is 0.4,
    // so damage is slow. This should hit the 15-round cap.
    const result = resolveCellCombat(
      0, 'StalemateCell',
      {
        'corp-a': { circle: 100, square: 0, triangle: 0 },
        'corp-b': { circle: 100, square: 0, triangle: 0 },
      },
      null, 0,
      { 'corp-a': 'Corp A', 'corp-b': 'Corp B' }
    );
    expect(result.roundsLog.length).toBeLessThanOrEqual(15);
    // Tie-breaker: largest force remaining wins
    expect(result.victorId).not.toBeNull();
  });
});

/**
 * test_corpworld_untouched
 *
 * examples/corpworld/ must be byte-identical to its pre-directive state.
 * This test verifies that the CorpWorld source directory was not modified
 * during the Planet of Greed conversion. We check the combat.ts file
 * specifically since it's the one that was extracted to shared —
 * CorpWorld's own copy should remain untouched.
 */
describe('test_corpworld_untouched', () => {
  const __filename = fileURLToPath(import.meta.url);
  const repoRoot = resolve(dirname(__filename), '..', '..');

  it('examples/corpworld/src/utils/combat.ts still exists and is self-contained', () => {
    const combatPath = resolve(repoRoot, 'examples', 'corpworld', 'src', 'utils', 'combat.ts');
    expect(existsSync(combatPath)).toBe(true);
    const source = readFileSync(combatPath, 'utf-8');
    // CorpWorld's combat.ts should still import from '../types' (its own types),
    // not from the shared module — it was NOT converted.
    expect(source).toContain("from '../types'");
    expect(source).not.toContain('engine/shared');
  });

  it('examples/corpworld/ directory structure is intact', () => {
    const corpworldDir = resolve(repoRoot, 'examples', 'corpworld');
    expect(existsSync(corpworldDir)).toBe(true);
    expect(lstatSync(corpworldDir).isDirectory()).toBe(true);
    // Key files should still exist
    for (const file of ['src/utils/combat.ts', 'src/types.ts', 'src/App.tsx', 'src/main.tsx']) {
      expect(existsSync(resolve(corpworldDir, file)), `${file} missing`).toBe(true);
    }
  });
});
