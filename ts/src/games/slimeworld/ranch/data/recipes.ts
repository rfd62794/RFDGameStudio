// new: ts/src/games/slimeworld/ranch/data/recipes.ts
export interface Recipe {
  a: string;
  b: string;
  /** Species id of the mixed slime. Mixing never invents a species outside this table. */
  result: string;
}

/** Largo-style recipes as data: A + B = C, order does not matter, same-species pairs have no recipe. */
export const RECIPES: readonly Recipe[] = [
  { a: 'pip', b: 'bloom', result: 'largo_pip_bloom' },
  { a: 'pip', b: 'dew', result: 'largo_pip_dew' },
  { a: 'pip', b: 'flurry', result: 'largo_pip_flurry' },
  { a: 'pip', b: 'sleet', result: 'largo_pip_sleet' },
  { a: 'pip', b: 'hoar', result: 'largo_pip_hoar' },
  { a: 'bloom', b: 'dew', result: 'largo_bloom_dew' },
  { a: 'bloom', b: 'flurry', result: 'largo_bloom_flurry' },
  { a: 'bloom', b: 'sleet', result: 'largo_bloom_sleet' },
  { a: 'bloom', b: 'hoar', result: 'largo_bloom_hoar' },
  { a: 'dew', b: 'flurry', result: 'largo_dew_flurry' },
  { a: 'dew', b: 'sleet', result: 'largo_dew_sleet' },
  { a: 'dew', b: 'hoar', result: 'largo_dew_hoar' },
  { a: 'flurry', b: 'sleet', result: 'largo_flurry_sleet' },
  { a: 'flurry', b: 'hoar', result: 'largo_flurry_hoar' },
  { a: 'sleet', b: 'hoar', result: 'largo_sleet_hoar' },
];

/** The recipe for two species, in either order, or undefined. */
export function findRecipe(speciesA: string, speciesB: string): Recipe | undefined {
  return RECIPES.find(
    (r) => (r.a === speciesA && r.b === speciesB) || (r.a === speciesB && r.b === speciesA)
  );
}
