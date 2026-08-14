import { describe, it, expect } from 'vitest';
import { PartSlot, Part, PartsBySlot, PART_SLOTS } from '../src/engine/shared/partSlots';
import type { Part as ChimeraPart } from '../src/games/chimera_wilds/types';
import type { Part as MBBPart, MutantParts } from '../src/games/mutant_battle_ball/types';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * test_part_type_reconciliation_safe
 *
 * The reconciled stricter type (PartSlot typed union, required price)
 * must not break any real existing Chimera Wilds or Mutant Battle Ball
 * data/usage. This test verifies:
 *   1. The shared Part type is structurally compatible with both games' usage
 *   2. All real Chimera Wilds part data in data.yaml has valid slots and prices
 *   3. The PART_SLOTS constant matches both games' slot lists
 *   4. MutantParts is a valid alias for PartsBySlot
 */

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

describe('test_part_type_reconciliation_safe', () => {
  it('shared PartSlot has exactly 6 slots matching both games', () => {
    expect(PART_SLOTS).toEqual(['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg']);
    expect(PART_SLOTS.length).toBe(6);
  });

  it('shared Part is structurally compatible with Chimera Wilds Part', () => {
    // Chimera Wilds' Part is now a re-export of the shared Part.
    // A shared Part must be assignable to a Chimera Wilds Part and vice versa.
    const sharedPart: Part = {
      id: 'test', name: 'Test', slot: 'head',
      accuracy: 1, endurance: 2, power: 3, speed: 4, price: 50,
    };
    const chimeraPart: ChimeraPart = sharedPart;
    expect(chimeraPart.id).toBe('test');
    expect(chimeraPart.slot).toBe('head');
    expect(chimeraPart.price).toBe(50);
  });

  it('shared Part is structurally compatible with MBB Part', () => {
    const sharedPart: Part = {
      id: 'test', name: 'Test', slot: 'chest',
      accuracy: 1, endurance: 2, power: 3, speed: 4, price: 75,
    };
    const mbbPart: MBBPart = sharedPart;
    expect(mbbPart.id).toBe('test');
    expect(mbbPart.slot).toBe('chest');
    expect(mbbPart.price).toBe(75);
  });

  it('MutantParts is a valid alias for PartsBySlot', () => {
    const parts: PartsBySlot = {
      head: null, chest: null, left_arm: null,
      right_arm: null, left_leg: null, right_leg: null,
    };
    const mutantParts: MutantParts = parts;
    expect(mutantParts.head).toBeNull();
    expect(mutantParts.chest).toBeNull();
  });

  it('all real Chimera Wilds parts in data.yaml have valid slots and prices', () => {
    // Read the data.yaml and verify every part has a valid PartSlot and a price.
    // This confirms the stricter type (required price, typed slot) is safe.
    const dataPath = resolve(repoRoot, 'games', 'chimera_wilds', 'data.yaml');
    const data = readFileSync(dataPath, 'utf-8');

    // Count parts with slot and price fields
    const slotMatches = data.match(/^(\s+)slot:\s*(\w+)/gm) || [];
    const priceMatches = data.match(/^(\s+)price:\s*(\d+)/gm) || [];

    expect(slotMatches.length).toBeGreaterThan(0);
    expect(priceMatches.length).toBe(slotMatches.length);

    // Verify all slot values are valid PartSlot values
    const validSlots = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
    for (const match of slotMatches) {
      const slot = match.split(':')[1].trim();
      expect(validSlots).toContain(slot);
    }
  });

  it('Chimera Wilds App.tsx SLOTS array matches shared PART_SLOTS', () => {
    const appSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'chimera_wilds', 'App.tsx'),
      'utf-8'
    );
    // The SLOTS array in App.tsx should contain all 6 PartSlot values
    expect(appSource).toContain("'head'");
    expect(appSource).toContain("'chest'");
    expect(appSource).toContain("'left_arm'");
    expect(appSource).toContain("'right_arm'");
    expect(appSource).toContain("'left_leg'");
    expect(appSource).toContain("'right_leg'");
  });
});
