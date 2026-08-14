import { describe, it, expect } from 'vitest';
import { getRelation } from '../src/engine/shared/wheelRelation';
import { getRelation as brewfieldGetRelation, ELEMENT_ORDER } from '../src/games/brewfield/gameLogic';

/**
 * test_get_relation_dissonance_equivalent
 *
 * The shared getRelation must produce identical classifications to
 * Dissonance's inline Lua logic (combat.lua lines 65-106) for every
 * real element pair, using Dissonance's element order.
 *
 * Dissonance's Lua logic:
 *   ELEMENTS = { "ember", "ash", "spark", "cinder" }
 *   diff == 1 or diff == 3 -> adjacent
 *   diff == 2              -> opposed
 *   i1 == i2               -> same
 *   no el2                 -> single
 */
describe('test_get_relation_dissonance_equivalent', () => {
  const dissonanceElements = ['ember', 'ash', 'spark', 'cinder'];

  it('classifies all same-element pairs as "same"', () => {
    for (const el of dissonanceElements) {
      expect(getRelation(el, el, dissonanceElements)).toBe('same');
    }
  });

  it('classifies opposite pairs as "opposed" (diff == 2)', () => {
    // ember(0) <-> spark(2), ash(1) <-> cinder(3)
    expect(getRelation('ember', 'spark', dissonanceElements)).toBe('opposed');
    expect(getRelation('spark', 'ember', dissonanceElements)).toBe('opposed');
    expect(getRelation('ash', 'cinder', dissonanceElements)).toBe('opposed');
    expect(getRelation('cinder', 'ash', dissonanceElements)).toBe('opposed');
  });

  it('classifies adjacent pairs as "adjacent" (diff == 1 or 3)', () => {
    // ember(0)-ash(1), ash(1)-spark(2), spark(2)-cinder(3), cinder(3)-ember(0)
    expect(getRelation('ember', 'ash', dissonanceElements)).toBe('adjacent');
    expect(getRelation('ash', 'ember', dissonanceElements)).toBe('adjacent');
    expect(getRelation('ash', 'spark', dissonanceElements)).toBe('adjacent');
    expect(getRelation('spark', 'ash', dissonanceElements)).toBe('adjacent');
    expect(getRelation('spark', 'cinder', dissonanceElements)).toBe('adjacent');
    expect(getRelation('cinder', 'spark', dissonanceElements)).toBe('adjacent');
    // Wrap: ember(0)-cinder(3), diff=3
    expect(getRelation('ember', 'cinder', dissonanceElements)).toBe('adjacent');
    expect(getRelation('cinder', 'ember', dissonanceElements)).toBe('adjacent');
  });

  it('classifies single/null elements as "single"', () => {
    expect(getRelation('ember', null, dissonanceElements)).toBe('single');
    expect(getRelation(null, 'ember', dissonanceElements)).toBe('single');
    expect(getRelation(null, null, dissonanceElements)).toBe('single');
    expect(getRelation('ember', undefined, dissonanceElements)).toBe('single');
  });

  it('classifies unknown elements as "single"', () => {
    expect(getRelation('ember', 'unknown', dissonanceElements)).toBe('single');
    expect(getRelation('unknown', 'ember', dissonanceElements)).toBe('single');
  });
});

/**
 * test_get_relation_brewfield_unchanged
 *
 * Brewfield's behavior must be provably unchanged post-extraction.
 * The shared getRelation (called with Brewfield's ELEMENT_ORDER) must
 * produce identical results to Brewfield's exported getRelation for
 * every real element pair.
 */
describe('test_get_relation_brewfield_unchanged', () => {
  const brewfieldElements = ELEMENT_ORDER; // ['fire', 'air', 'water', 'earth']

  it('Brewfield getRelation delegates to shared getRelation identically', () => {
    for (const el1 of brewfieldElements) {
      for (const el2 of brewfieldElements) {
        expect(brewfieldGetRelation(el1, el2)).toBe(
          getRelation(el1, el2, brewfieldElements)
        );
      }
    }
  });

  it('Brewfield opposite pairs: fire-water, air-earth (diff == 2)', () => {
    expect(brewfieldGetRelation('fire', 'water')).toBe('opposed');
    expect(brewfieldGetRelation('water', 'fire')).toBe('opposed');
    expect(brewfieldGetRelation('air', 'earth')).toBe('opposed');
    expect(brewfieldGetRelation('earth', 'air')).toBe('opposed');
  });

  it('Brewfield adjacent pairs (diff == 1 or 3)', () => {
    expect(brewfieldGetRelation('fire', 'air')).toBe('adjacent');
    expect(brewfieldGetRelation('air', 'water')).toBe('adjacent');
    expect(brewfieldGetRelation('water', 'earth')).toBe('adjacent');
    expect(brewfieldGetRelation('earth', 'fire')).toBe('adjacent');
  });

  it('Brewfield same pairs', () => {
    for (const el of brewfieldElements) {
      expect(brewfieldGetRelation(el, el)).toBe('same');
    }
  });
});
