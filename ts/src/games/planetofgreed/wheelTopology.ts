import { CultureId } from './types';

// The six Cultures in real hue-order wheel sequence (Design.md v0.2 §5):
// Ember -> Marsh -> Gale -> Tundra -> Crystal -> Tide -> (back to Ember).
// This array's order IS the wheel order. Index 0-5.
//
// Opposite = 3 positions apart on the ring:
//   Ember(0) <-> Tundra(3)   -- the locked "Fault Line" rival pair
//   Marsh(1) <-> Crystal(4)  -- new, derived from the ring order
//   Gale(2)  <-> Tide(5)     -- new, derived from the ring order
// Adjacent = ring neighbors (index +/- 1, wrapping).
export const WHEEL_ORDER: readonly CultureId[] = [
  'ember',
  'marsh',
  'gale',
  'tundra',
  'crystal',
  'tide',
] as const;

const WHEEL_INDEX: { [K in CultureId]: number } = {
  ember: 0,
  marsh: 1,
  gale: 2,
  tundra: 3,
  crystal: 4,
  tide: 5,
};

// Returns the culture directly opposite `culture` on the six-culture ring
// (index + 3) % 6. Symmetric: getOpposite(getOpposite(c)) === c.
export function getOpposite(culture: CultureId): CultureId {
  return WHEEL_ORDER[(WHEEL_INDEX[culture] + 3) % 6];
}

// Returns the two cultures immediately adjacent to `culture` on the ring
// (index - 1 and index + 1, wrapping). Order: [counter-clockwise, clockwise]
// -- i.e. the culture one step earlier in WHEEL_ORDER, then one step later.
export function getAdjacent(culture: CultureId): [CultureId, CultureId] {
  const i = WHEEL_INDEX[culture];
  return [
    WHEEL_ORDER[(i - 1 + 6) % 6],
    WHEEL_ORDER[(i + 1) % 6],
  ];
}
