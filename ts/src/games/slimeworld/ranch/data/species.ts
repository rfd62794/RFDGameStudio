// new: ts/src/games/slimeworld/ranch/data/species.ts
import type { Affinity, ZoneId } from '../model/types';

export interface SpeciesDef {
  id: string;
  name: string;
  /** Native species belong to a zone; mixed (Largo) species have no zone. */
  zone: ZoneId | null;
  /** Affinity a freshly met slime of this species starts with. */
  affinity: Affinity;
  colorIndex: number;
  preferredFruit: string;
  /** Base sale price of one plort of this species. */
  plortValue: number;
}

/** The six native slimes of the Meadow and Frost zones (working titles from the direction doc). */
export const NATIVE_SPECIES: readonly SpeciesDef[] = [
  { id: 'pip', name: 'Pip', zone: 'meadow', affinity: 'meadow', colorIndex: 0, preferredFruit: 'sunfruit', plortValue: 10 },
  { id: 'bloom', name: 'Bloom', zone: 'meadow', affinity: 'meadow', colorIndex: 1, preferredFruit: 'berry', plortValue: 12 },
  { id: 'dew', name: 'Dew', zone: 'meadow', affinity: 'meadow', colorIndex: 2, preferredFruit: 'honeybell', plortValue: 14 },
  { id: 'flurry', name: 'Flurry', zone: 'frost', affinity: 'frost', colorIndex: 3, preferredFruit: 'icepear', plortValue: 16 },
  { id: 'sleet', name: 'Sleet', zone: 'frost', affinity: 'frost', colorIndex: 4, preferredFruit: 'snowberry', plortValue: 18 },
  { id: 'hoar', name: 'Hoar', zone: 'frost', affinity: 'frost', colorIndex: 5, preferredFruit: 'glacier_plum', plortValue: 20 },
];

/** Mixed species: one per unordered pair of the six natives (15), plortValue = round((a + b) / 2) + 4. PROPOSED starter set for Robert to review. */
export const LARGO_SPECIES: readonly SpeciesDef[] = [
  { id: 'largo_pip_bloom', name: 'Pip-Bloom Largo', zone: null, affinity: 'meadow', colorIndex: 6, preferredFruit: 'sunfruit', plortValue: 15 },
  { id: 'largo_pip_dew', name: 'Pip-Dew Largo', zone: null, affinity: 'meadow', colorIndex: 7, preferredFruit: 'sunfruit', plortValue: 16 },
  { id: 'largo_pip_flurry', name: 'Pip-Flurry Largo', zone: null, affinity: 'meadow', colorIndex: 8, preferredFruit: 'sunfruit', plortValue: 17 },
  { id: 'largo_pip_sleet', name: 'Pip-Sleet Largo', zone: null, affinity: 'meadow', colorIndex: 9, preferredFruit: 'sunfruit', plortValue: 18 },
  { id: 'largo_pip_hoar', name: 'Pip-Hoar Largo', zone: null, affinity: 'meadow', colorIndex: 10, preferredFruit: 'sunfruit', plortValue: 19 },
  { id: 'largo_bloom_dew', name: 'Bloom-Dew Largo', zone: null, affinity: 'meadow', colorIndex: 11, preferredFruit: 'berry', plortValue: 17 },
  { id: 'largo_bloom_flurry', name: 'Bloom-Flurry Largo', zone: null, affinity: 'meadow', colorIndex: 6, preferredFruit: 'berry', plortValue: 18 },
  { id: 'largo_bloom_sleet', name: 'Bloom-Sleet Largo', zone: null, affinity: 'meadow', colorIndex: 7, preferredFruit: 'berry', plortValue: 19 },
  { id: 'largo_bloom_hoar', name: 'Bloom-Hoar Largo', zone: null, affinity: 'meadow', colorIndex: 8, preferredFruit: 'berry', plortValue: 20 },
  { id: 'largo_dew_flurry', name: 'Dew-Flurry Largo', zone: null, affinity: 'meadow', colorIndex: 9, preferredFruit: 'honeybell', plortValue: 19 },
  { id: 'largo_dew_sleet', name: 'Dew-Sleet Largo', zone: null, affinity: 'meadow', colorIndex: 10, preferredFruit: 'honeybell', plortValue: 20 },
  { id: 'largo_dew_hoar', name: 'Dew-Hoar Largo', zone: null, affinity: 'meadow', colorIndex: 11, preferredFruit: 'honeybell', plortValue: 21 },
  { id: 'largo_flurry_sleet', name: 'Flurry-Sleet Largo', zone: null, affinity: 'frost', colorIndex: 6, preferredFruit: 'icepear', plortValue: 21 },
  { id: 'largo_flurry_hoar', name: 'Flurry-Hoar Largo', zone: null, affinity: 'frost', colorIndex: 7, preferredFruit: 'icepear', plortValue: 22 },
  { id: 'largo_sleet_hoar', name: 'Sleet-Hoar Largo', zone: null, affinity: 'frost', colorIndex: 8, preferredFruit: 'snowberry', plortValue: 23 },
];

export const ALL_SPECIES: readonly SpeciesDef[] = [...NATIVE_SPECIES, ...LARGO_SPECIES];

export function speciesById(id: string): SpeciesDef | undefined {
  return ALL_SPECIES.find((s) => s.id === id);
}
