/**
 * Element-wheel relation classification.
 *
 * Extracted from Brewfield's gameLogic.ts (where it was a standalone
 * exported function) and confirmed identical in algorithm to
 * Dissonance's inline Lua logic in combat.lua. The function classifies
 * the relationship between two elements on an ordered wheel:
 *
 *   - 'same'      — both elements are identical
 *   - 'opposed'   — elements are half-way around the wheel (index diff = wheelSize/2)
 *   - 'adjacent'  — elements are neighbors on the wheel (any other index diff)
 *   - 'single'    — one or both elements are not in the wheel order
 *
 * The element order is a parameter, so this works for any wheel size:
 *   - Dissonance: 4 elements (ember, ash, spark, cinder) — diff 2 = opposed
 *   - Brewfield:  4 elements (fire, air, water, earth)   — diff 2 = opposed
 *
 * Dissonance's Lua version also checks diff 3 for adjacency (4-element
 * wrap), which this function handles correctly because abs(diff) for a
 * 4-element wheel can only be 1, 2, or 3 — and only 2 is opposed, so
 * 1 and 3 both fall through to 'adjacent'.
 */

export type WheelRelation = 'same' | 'adjacent' | 'opposed' | 'single';

/**
 * Classify the relationship between two elements on an ordered wheel.
 *
 * @param el1 First element (or null/undefined for single-element cards)
 * @param el2 Second element (or null/undefined for single-element cards)
 * @param elementOrder The ordered array of elements defining the wheel.
 *                     Index 0 is the first position; the wheel wraps.
 * @returns The relation classification: 'same' | 'adjacent' | 'opposed' | 'single'
 */
export function getRelation(
  el1: string | null | undefined,
  el2: string | null | undefined,
  elementOrder: string[],
): WheelRelation {
  if (!el1 || !el2) return 'single';
  if (el1 === el2) return 'same';
  const idx1 = elementOrder.indexOf(el1);
  const idx2 = elementOrder.indexOf(el2);
  if (idx1 === -1 || idx2 === -1) return 'single';
  const diff = Math.abs(idx1 - idx2);
  const wheelSize = elementOrder.length;
  // Opposed = half-way around the wheel (only well-defined for even wheel sizes)
  if (wheelSize % 2 === 0 && diff === wheelSize / 2) return 'opposed';
  return 'adjacent';
}
