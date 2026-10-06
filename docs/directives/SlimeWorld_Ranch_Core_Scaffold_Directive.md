# SlimeWorld ranch M0 step 1: the pure-logic core (plorts, feeding, market pricing, mixing recipes, save), no UI (Size M)

**Depends on:** none. This run only ADDS files; it edits no existing file. **Why SlimeWorld:** Robert's 2026-10-05 decision that SlimeWorld is a Slime Rancher-style ranch game (`docs/demos/slimeworld/DIRECTION.md`: "The design", "Slimes, traits, plorts", "The Hub", "Engineering approach", "First three directives" item 1, "What happens to the existing code": build the ranch in a NEW directory, edit nothing in the old tree).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/slimeworld/DIRECTION.md` (sections "Slimes, traits, plorts", "The Hub", "Engineering approach", "NOT list"), `ts/src/engine/shared/persistence.ts` (whole file, 53 lines: `loadSave`, `writeSave`, `clearSave`), `ts/src/engine/shared/seededRandom.ts` (`mulberry32`).

## 1. Why this exists

The direction replaces the old territory game with a ranch game (forage, lure, feed, collect plorts, sell, upgrade, unlock). Nothing of the ranch exists yet. Its first piece is the rules, built as small pure TypeScript modules with an injectable random source, so every later step (foraging, Hub screens, balance run) stands on tested rules. Facts that fix the shape:

- The old game lives in `ts/src/games/slimeworld/` (App.tsx, gameLogic.ts, planetRegion.ts, components/, ...) and must not be touched: it is the territory game that is leaving. The ranch goes in a new subdirectory, `ts/src/games/slimeworld/ranch/`, which no existing file imports.
- New save key `slimeworld_ranch_save`; the old `slimeworld_save` is never read or written by ranch code.
- Rules are plain TS data plus pure functions (KISS); not Lua. Random choices take an injected `Rng` (a function returning [0, 1)); tests use `mulberry32` from `ts/src/engine/shared/seededRandom.ts`. No ranch file calls `Math.random`, `Date.now` or `performance.now`.
- The old game's market uses flood decay: `price = floor(tier_value x level_scale x max(0.3, 1 - recent_same_color_sales x 0.12))` (`games/slimeworld/data.yaml` lines 52-59: `flood_decay_per_sale: 0.12`, `flood_multiplier_floor: 0.3`, `flood_window_cycles: 5`). The ranch copies the formula, but the window is counted in Hub actions (the direction: "restored by action count, not time").
- Persistence: `loadSave(key, { version })` returns `null` for a missing key, malformed JSON or a version mismatch, and never throws; `writeSave(key, value, { version })` and `clearSave(key)` never throw.

This run was prototyped end to end: every file and both test files below pass (32 tests) and `cd ts && npx tsc --noEmit` is clean.

Two design points the direction leaves open are resolved here as PROPOSED defaults and each lives in ONE place, so Robert can change it cheaply: (a) parents are consumed by a mix (open question 10) in `mixing.ts`; (b) the wording "plorts are the single currency" conflicts with "sell plorts for their price", so sale proceeds are tracked as `plortCredit` (one field, set in `market.ts`). Do not "fix" either; report them.

## 2. Scope

New files only, all under `ts/src/games/slimeworld/ranch/` plus two tests:

1. `data/constants.ts`, `data/fruit.ts`, `data/species.ts`, `data/recipes.ts` (data, no logic beyond lookups).
2. `model/types.ts`, `model/state.ts`, `model/slimes.ts`, `model/feeding.ts`, `model/mixing.ts`, `model/market.ts` (one job each).
3. `save/ranchSave.ts` (localStorage via the shared persistence helpers).
4. `debug/describeRanch.ts` (the debug harness: a plain-text dump, no React, no DOM).
5. Tests `ts/tests/test_slimeworld_ranch_rules.ts` and `ts/tests/test_slimeworld_ranch_save.ts`.

## 3. The work

Create each file with exactly the content shown. Create parent directories as needed (writing the file creates them).

**`ts/src/games/slimeworld/ranch/model/types.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/model/types.ts
/** Injectable random source: a function returning a number in [0, 1). Ranch code never reads a global random or clock source. */
export type Rng = () => number;

export type Affinity = 'none' | 'meadow' | 'frost' | 'fire' | 'cave';
export type SlimeSize = 'S' | 'M' | 'L';
export type ZoneId = 'meadow' | 'frost';

export interface Traits {
  /** Index into the ranch colour palette (a small integer; the palette itself is a later UI concern). */
  colorIndex: number;
  size: SlimeSize;
  affinity: Affinity;
}

/** How many fruit of each element this slime has been fed since it was caught or mixed. */
export type Lean = Partial<Record<Affinity, number>>;

export interface Slime {
  id: string;
  speciesId: string;
  traits: Traits;
  lean: Lean;
}

export interface SaleRecord {
  speciesId: string;
  atAction: number;
}

export interface RanchState {
  /** Slimes carried home, at most PEN_CAPACITY. */
  pen: Slime[];
  /** Fruit in the basket or Hub, by fruit id. */
  fruit: Record<string, number>;
  /** Plorts owned, by species id (one plort type per species). */
  plorts: Record<string, number>;
  /** Species ids ever owned: the collection grid fills from this. */
  collection: string[];
  /** Proceeds of selling plorts. PROPOSED name: Robert's "plorts are the single currency" wording is unresolved. */
  plortCredit: number;
  /** Hub actions taken (feed, mix, sell). The only clock: nothing here uses real time. */
  actionCount: number;
  /** Recent sales, for flood-decay pricing. */
  sales: SaleRecord[];
  /** Counter for new slime ids. */
  nextId: number;
}

/** Every rule function returns a new state or a plain reason; none throws and none mutates its input. */
export type RuleResult<T> = ({ ok: true } & T) | { ok: false; reason: string };
```

**`ts/src/games/slimeworld/ranch/data/constants.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/data/constants.ts
import type { Affinity } from '../model/types';

/** Tunable numbers, all PROPOSED starting values from docs/demos/slimeworld/DIRECTION.md. */
export const PEN_CAPACITY = 4;

/** Mutation: base chance per mix, plus a bonus per fruit of the leaning element, capped. */
export const BASE_MUTATION_CHANCE = 0.05;
export const MUTATION_PER_FRUIT = 0.2;
export const MUTATION_CAP = 0.85;
/** Affinities a mix may mutate toward when no fruit leaning applies (M0 has two zones). */
export const MUTABLE_AFFINITIES: readonly Affinity[] = ['meadow', 'frost'];

/** Flood decay, copied from the old game's data.yaml market block (flood_decay_per_sale etc.), window counted in Hub actions not cycles. */
export const FLOOD_DECAY_PER_SALE = 0.12;
export const FLOOD_MULTIPLIER_FLOOR = 0.3;
export const FLOOD_WINDOW_ACTIONS = 5;

/** The palette has this many colour slots; species and mixes pick indexes below it. */
export const PALETTE_SIZE = 12;

/** New key: the old slimeworld_save is never read or written by ranch code. */
export const RANCH_SAVE_KEY = 'slimeworld_ranch_save';
export const RANCH_SAVE_VERSION = 1;
```

**`ts/src/games/slimeworld/ranch/data/fruit.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/data/fruit.ts
import type { Affinity, ZoneId } from '../model/types';

export interface FruitDef {
  id: string;
  name: string;
  zone: ZoneId;
  /** The element this fruit pushes mutation toward when fed before a mix. */
  element: Affinity;
}

/** Working titles from the direction doc; M0 ships the Meadow and Frost zones. */
export const FRUIT: readonly FruitDef[] = [
  { id: 'sunfruit', name: 'Sunfruit', zone: 'meadow', element: 'meadow' },
  { id: 'berry', name: 'Berry', zone: 'meadow', element: 'meadow' },
  { id: 'honeybell', name: 'Honeybell', zone: 'meadow', element: 'meadow' },
  { id: 'icepear', name: 'Icepear', zone: 'frost', element: 'frost' },
  { id: 'snowberry', name: 'Snowberry', zone: 'frost', element: 'frost' },
  { id: 'glacier_plum', name: 'Glacier Plum', zone: 'frost', element: 'frost' },
];

export function fruitById(id: string): FruitDef | undefined {
  return FRUIT.find((f) => f.id === id);
}
```

**`ts/src/games/slimeworld/ranch/data/species.ts`**

```ts
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
```

**`ts/src/games/slimeworld/ranch/data/recipes.ts`**

```ts
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
```

**`ts/src/games/slimeworld/ranch/model/state.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/model/state.ts
import type { RanchState } from './types';

/** A fresh ranch: empty pen, empty pockets, nothing discovered, no sales. */
export function newRanchState(): RanchState {
  return {
    pen: [],
    fruit: {},
    plorts: {},
    collection: [],
    plortCredit: 0,
    actionCount: 0,
    sales: [],
    nextId: 1,
  };
}

/** Add fruit to the basket (the Foraging trip, a later step, will call this). Returns a new state. */
export function addFruit(state: RanchState, fruitId: string, count: number): RanchState {
  if (count <= 0) return state;
  return { ...state, fruit: { ...state.fruit, [fruitId]: (state.fruit[fruitId] ?? 0) + count } };
}
```

**`ts/src/games/slimeworld/ranch/model/slimes.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/model/slimes.ts
import { PEN_CAPACITY } from '../data/constants';
import { speciesById } from '../data/species';
import type { RanchState, Rng, RuleResult, Slime, SlimeSize } from './types';

const SIZES: readonly SlimeSize[] = ['S', 'M', 'L'];

/** Mark a species as discovered (the collection grid). Pure. */
export function discover(collection: readonly string[], speciesId: string): string[] {
  return collection.includes(speciesId) ? [...collection] : [...collection, speciesId];
}

/** Catch a wild slime into the pen: species defaults for colour and affinity, size from the rng. */
export function catchSlime(state: RanchState, speciesId: string, rng: Rng): RuleResult<{ state: RanchState; slime: Slime }> {
  const species = speciesById(speciesId);
  if (!species) return { ok: false, reason: `unknown species ${speciesId}` };
  if (state.pen.length >= PEN_CAPACITY) return { ok: false, reason: 'pen is full' };
  const slime: Slime = {
    id: `slime-${state.nextId}`,
    speciesId,
    traits: {
      colorIndex: species.colorIndex,
      size: SIZES[Math.floor(rng() * SIZES.length)],
      affinity: species.affinity,
    },
    lean: {},
  };
  return {
    ok: true,
    slime,
    state: {
      ...state,
      pen: [...state.pen, slime],
      collection: discover(state.collection, speciesId),
      nextId: state.nextId + 1,
    },
  };
}
```

**`ts/src/games/slimeworld/ranch/model/feeding.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/model/feeding.ts
import { fruitById } from '../data/fruit';
import type { RanchState, RuleResult } from './types';

/**
 * Feed one fruit to a slime in the pen: the fruit is spent, the slime yields exactly one plort of
 * its species (instant, no timer), and the slime leans toward the fruit's element for its next mix.
 * Counts as one Hub action.
 */
export function feedSlime(state: RanchState, slimeId: string, fruitId: string): RuleResult<{ state: RanchState }> {
  const slime = state.pen.find((s) => s.id === slimeId);
  if (!slime) return { ok: false, reason: `no slime ${slimeId} in the pen` };
  const fruit = fruitById(fruitId);
  if (!fruit) return { ok: false, reason: `unknown fruit ${fruitId}` };
  if ((state.fruit[fruitId] ?? 0) < 1) return { ok: false, reason: `no ${fruitId} to feed` };

  const lean = { ...slime.lean, [fruit.element]: (slime.lean[fruit.element] ?? 0) + 1 };
  return {
    ok: true,
    state: {
      ...state,
      fruit: { ...state.fruit, [fruitId]: state.fruit[fruitId] - 1 },
      plorts: { ...state.plorts, [slime.speciesId]: (state.plorts[slime.speciesId] ?? 0) + 1 },
      pen: state.pen.map((s) => (s.id === slimeId ? { ...s, lean } : s)),
      actionCount: state.actionCount + 1,
    },
  };
}
```

**`ts/src/games/slimeworld/ranch/model/mixing.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/model/mixing.ts
import {
  BASE_MUTATION_CHANCE,
  MUTABLE_AFFINITIES,
  MUTATION_CAP,
  MUTATION_PER_FRUIT,
} from '../data/constants';
import { findRecipe } from '../data/recipes';
import { speciesById } from '../data/species';
import { discover } from './slimes';
import type { Affinity, Lean, RanchState, Rng, RuleResult, Slime } from './types';

/** Fruit of each mutable element fed to both parents combined. */
function combinedLean(a: Lean, b: Lean): Array<{ element: Affinity; count: number }> {
  return MUTABLE_AFFINITIES.map((element) => ({
    element,
    count: (a[element] ?? 0) + (b[element] ?? 0),
  }));
}

/** Chance the child's affinity mutates: base, plus a bonus per leaning fruit, capped. Pure. */
export function mutationChance(leaningFruit: number): number {
  return Math.min(MUTATION_CAP, BASE_MUTATION_CHANCE + MUTATION_PER_FRUIT * leaningFruit);
}

/**
 * Mix two slimes from the pen by the recipe table. Both parents are consumed (PROPOSED rule, open
 * question 10 in the direction doc). Each trait comes from one parent at 50/50; then the affinity may
 * mutate toward the element the parents were fed most (ties go to the first in MUTABLE_AFFINITIES),
 * or toward a random mutable element when no fruit leaning applies. Mutation changes traits only,
 * never the species. Rng call order is fixed: colour, size, affinity, mutation roll, then (only for
 * an unleaned mutation) the element pick.
 */
export function mixSlimes(
  state: RanchState,
  slimeIdA: string,
  slimeIdB: string,
  rng: Rng
): RuleResult<{ state: RanchState; child: Slime; mutated: boolean }> {
  if (slimeIdA === slimeIdB) return { ok: false, reason: 'pick two different slimes' };
  const a = state.pen.find((s) => s.id === slimeIdA);
  const b = state.pen.find((s) => s.id === slimeIdB);
  if (!a || !b) return { ok: false, reason: 'both slimes must be in the pen' };
  const recipe = findRecipe(a.speciesId, b.speciesId);
  if (!recipe) return { ok: false, reason: `no recipe for ${a.speciesId} + ${b.speciesId}` };
  const species = speciesById(recipe.result);
  if (!species) return { ok: false, reason: `recipe result ${recipe.result} is not a species` };

  const pick = <T>(x: T, y: T): T => (rng() < 0.5 ? x : y);
  const traits = {
    colorIndex: pick(a.traits.colorIndex, b.traits.colorIndex),
    size: pick(a.traits.size, b.traits.size),
    affinity: pick(a.traits.affinity, b.traits.affinity),
  };

  const leans = combinedLean(a.lean, b.lean);
  const dominant = leans.reduce((best, cur) => (cur.count > best.count ? cur : best), leans[0]);
  const mutated = rng() < mutationChance(dominant.count);
  if (mutated) {
    traits.affinity =
      dominant.count > 0
        ? dominant.element
        : MUTABLE_AFFINITIES[Math.floor(rng() * MUTABLE_AFFINITIES.length)];
  }

  const child: Slime = { id: `slime-${state.nextId}`, speciesId: species.id, traits, lean: {} };
  return {
    ok: true,
    child,
    mutated,
    state: {
      ...state,
      pen: [...state.pen.filter((s) => s.id !== a.id && s.id !== b.id), child],
      collection: discover(state.collection, species.id),
      actionCount: state.actionCount + 1,
      nextId: state.nextId + 1,
    },
  };
}
```

**`ts/src/games/slimeworld/ranch/model/market.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/model/market.ts
import {
  FLOOD_DECAY_PER_SALE,
  FLOOD_MULTIPLIER_FLOOR,
  FLOOD_WINDOW_ACTIONS,
} from '../data/constants';
import { speciesById } from '../data/species';
import type { RanchState, RuleResult, SaleRecord } from './types';

/** Sales of this species inside the window, counted in Hub actions (never in real time). */
export function recentSales(sales: readonly SaleRecord[], speciesId: string, actionCount: number): number {
  return sales.filter((s) => s.speciesId === speciesId && s.atAction > actionCount - FLOOD_WINDOW_ACTIONS).length;
}

/** Flood multiplier: max(floor, 1 - recent same-type sales x decay). Same formula as the old game's economy. */
export function floodMultiplier(recent: number): number {
  return Math.max(FLOOD_MULTIPLIER_FLOOR, 1 - recent * FLOOD_DECAY_PER_SALE);
}

/** The price of one plort of this species right now, or undefined for an unknown species. */
export function plortPrice(state: RanchState, speciesId: string): number | undefined {
  const species = speciesById(speciesId);
  if (!species) return undefined;
  return Math.floor(species.plortValue * floodMultiplier(recentSales(state.sales, speciesId, state.actionCount)));
}

/**
 * Sell up to `quantity` plorts of one species. Each unit is priced after the sales before it, so
 * dumping many of one type lowers the price within the batch. The whole batch is one Hub action.
 * Proceeds go to plortCredit.
 */
export function sellPlorts(
  state: RanchState,
  speciesId: string,
  quantity: number
): RuleResult<{ state: RanchState; sold: number; earned: number }> {
  if (!speciesById(speciesId)) return { ok: false, reason: `unknown species ${speciesId}` };
  const owned = state.plorts[speciesId] ?? 0;
  const sold = Math.min(owned, Math.floor(quantity));
  if (sold < 1) return { ok: false, reason: `no ${speciesId} plorts to sell` };

  const action = state.actionCount + 1;
  let working: RanchState = { ...state, actionCount: action };
  let earned = 0;
  for (let i = 0; i < sold; i += 1) {
    earned += plortPrice(working, speciesId) ?? 0;
    working = { ...working, sales: [...working.sales, { speciesId, atAction: action }] };
  }
  return {
    ok: true,
    sold,
    earned,
    state: {
      ...working,
      plorts: { ...state.plorts, [speciesId]: owned - sold },
      plortCredit: state.plortCredit + earned,
    },
  };
}
```

**`ts/src/games/slimeworld/ranch/save/ranchSave.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/save/ranchSave.ts
import { clearSave, loadSave, writeSave } from '../../../../engine/shared/persistence';
import { RANCH_SAVE_KEY, RANCH_SAVE_VERSION } from '../data/constants';
import { newRanchState } from '../model/state';
import type { RanchState } from '../model/types';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNumberRecord(v: unknown): v is Record<string, number> {
  return isRecord(v) && Object.values(v).every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0);
}

/** Shape check for a loaded save. Anything that fails it is treated as no save, never repaired by guessing. */
export function isRanchState(v: unknown): v is RanchState {
  if (!isRecord(v)) return false;
  return (
    Array.isArray(v.pen) &&
    v.pen.every(
      (s) =>
        isRecord(s) &&
        typeof s.id === 'string' &&
        typeof s.speciesId === 'string' &&
        isRecord(s.traits) &&
        isRecord(s.lean)
    ) &&
    isNumberRecord(v.fruit) &&
    isNumberRecord(v.plorts) &&
    Array.isArray(v.collection) &&
    v.collection.every((c) => typeof c === 'string') &&
    typeof v.plortCredit === 'number' &&
    v.plortCredit >= 0 &&
    typeof v.actionCount === 'number' &&
    Array.isArray(v.sales) &&
    typeof v.nextId === 'number'
  );
}

export function saveRanch(state: RanchState): void {
  writeSave(RANCH_SAVE_KEY, state, { version: RANCH_SAVE_VERSION });
}

/** The saved ranch, or a fresh one when there is no save, it is malformed, or its version is stale. Never throws. */
export function loadRanch(): RanchState {
  const saved = loadSave<unknown>(RANCH_SAVE_KEY, { version: RANCH_SAVE_VERSION });
  return isRanchState(saved) ? saved : newRanchState();
}

/** The labelled Reset: forget the ranch save and return a fresh state. */
export function resetRanch(): RanchState {
  clearSave(RANCH_SAVE_KEY);
  return newRanchState();
}
```

**`ts/src/games/slimeworld/ranch/debug/describeRanch.ts`**

```ts
// new: ts/src/games/slimeworld/ranch/debug/describeRanch.ts
import { ALL_SPECIES, speciesById } from '../data/species';
import { plortPrice } from '../model/market';
import type { RanchState } from '../model/types';

/**
 * The debug harness for step 1: a plain-text dump of a ranch, one line per fact. No React, no DOM.
 * Tests and a human at a console use it to see what the rules did; real screens come in later steps.
 */
export function describeRanch(state: RanchState): string[] {
  const lines: string[] = [];
  lines.push(`actions ${state.actionCount}, plortCredit ${state.plortCredit}`);
  lines.push(`collection ${state.collection.length}/${ALL_SPECIES.length}`);
  for (const slime of state.pen) {
    const name = speciesById(slime.speciesId)?.name ?? slime.speciesId;
    lines.push(
      `pen ${slime.id} ${name} size ${slime.traits.size} affinity ${slime.traits.affinity} color ${slime.traits.colorIndex}`
    );
  }
  for (const [speciesId, count] of Object.entries(state.plorts)) {
    if (count > 0) lines.push(`plort ${speciesId} x${count} at ${plortPrice(state, speciesId)} each`);
  }
  for (const [fruitId, count] of Object.entries(state.fruit)) {
    if (count > 0) lines.push(`fruit ${fruitId} x${count}`);
  }
  return lines;
}
```

**`ts/tests/test_slimeworld_ranch_rules.ts`**

```ts
// new: ts/tests/test_slimeworld_ranch_rules.ts
import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import { ALL_SPECIES, LARGO_SPECIES, NATIVE_SPECIES, speciesById } from '../src/games/slimeworld/ranch/data/species';
import { RECIPES, findRecipe } from '../src/games/slimeworld/ranch/data/recipes';
import { FRUIT, fruitById } from '../src/games/slimeworld/ranch/data/fruit';
import { PEN_CAPACITY, PALETTE_SIZE } from '../src/games/slimeworld/ranch/data/constants';
import { addFruit, newRanchState } from '../src/games/slimeworld/ranch/model/state';
import { catchSlime } from '../src/games/slimeworld/ranch/model/slimes';
import { feedSlime } from '../src/games/slimeworld/ranch/model/feeding';
import { mixSlimes, mutationChance } from '../src/games/slimeworld/ranch/model/mixing';
import { floodMultiplier, plortPrice, recentSales, sellPlorts } from '../src/games/slimeworld/ranch/model/market';
import { describeRanch } from '../src/games/slimeworld/ranch/debug/describeRanch';
import type { RanchState } from '../src/games/slimeworld/ranch/model/types';

function caught(state: RanchState, speciesId: string, seed = 1): RanchState {
  const r = catchSlime(state, speciesId, mulberry32(seed));
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

describe('ranch data integrity', () => {
  it('has 6 native species, 15 Largo species and 15 recipes', () => {
    expect(NATIVE_SPECIES).toHaveLength(6);
    expect(LARGO_SPECIES).toHaveLength(15);
    expect(RECIPES).toHaveLength(15);
  });

  it('species ids are unique and every colour index fits the palette', () => {
    const ids = ALL_SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of ALL_SPECIES) expect(s.colorIndex).toBeLessThan(PALETTE_SIZE);
  });

  it('every preferred fruit exists', () => {
    for (const s of ALL_SPECIES) expect(fruitById(s.preferredFruit), s.id).toBeDefined();
    expect(FRUIT).toHaveLength(6);
  });

  it('every recipe joins two different natives to a Largo species, and each pair has exactly one recipe', () => {
    const nativeIds = NATIVE_SPECIES.map((s) => s.id);
    const largoIds = LARGO_SPECIES.map((s) => s.id);
    const seen = new Set<string>();
    for (const r of RECIPES) {
      expect(nativeIds).toContain(r.a);
      expect(nativeIds).toContain(r.b);
      expect(r.a).not.toBe(r.b);
      expect(largoIds).toContain(r.result);
      const key = [r.a, r.b].sort().join('+');
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(15);
  });

  it('a Largo plort is worth round((a + b) / 2) + 4', () => {
    for (const r of RECIPES) {
      const a = speciesById(r.a)!.plortValue;
      const b = speciesById(r.b)!.plortValue;
      expect(speciesById(r.result)!.plortValue, r.result).toBe(Math.round((a + b) / 2) + 4);
    }
  });

  it('findRecipe ignores order and refuses a same-species pair', () => {
    expect(findRecipe('pip', 'bloom')?.result).toBe('largo_pip_bloom');
    expect(findRecipe('bloom', 'pip')?.result).toBe('largo_pip_bloom');
    expect(findRecipe('pip', 'pip')).toBeUndefined();
  });
});

describe('catching and the pen', () => {
  it('a caught slime joins the pen, fills the collection and takes the species defaults', () => {
    const s = caught(newRanchState(), 'pip');
    expect(s.pen).toHaveLength(1);
    expect(s.pen[0].speciesId).toBe('pip');
    expect(s.pen[0].traits.affinity).toBe('meadow');
    expect(s.collection).toEqual(['pip']);
    expect(s.nextId).toBe(2);
  });

  it('is deterministic for a seed and never mutates the input state', () => {
    const start = newRanchState();
    const a = catchSlime(start, 'dew', mulberry32(9));
    const b = catchSlime(start, 'dew', mulberry32(9));
    expect(a).toEqual(b);
    expect(start.pen).toHaveLength(0);
  });

  it('refuses an unknown species and a full pen without changing anything', () => {
    expect(catchSlime(newRanchState(), 'nope', mulberry32(1)).ok).toBe(false);
    let s = newRanchState();
    for (let i = 0; i < PEN_CAPACITY; i += 1) s = caught(s, 'pip', i + 1);
    const full = catchSlime(s, 'bloom', mulberry32(1));
    expect(full).toEqual({ ok: false, reason: 'pen is full' });
  });
});

describe('feeding', () => {
  it('spends one fruit, yields exactly one plort of the slime species, and counts as a Hub action', () => {
    let s = caught(newRanchState(), 'pip');
    s = addFruit(s, 'sunfruit', 2);
    const r = feedSlime(s, s.pen[0].id, 'sunfruit');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.fruit.sunfruit).toBe(1);
    expect(r.state.plorts.pip).toBe(1);
    expect(r.state.actionCount).toBe(1);
    expect(r.state.pen[0].lean.meadow).toBe(1);
  });

  it('refuses with no fruit, an unknown fruit or an unknown slime', () => {
    const s = caught(newRanchState(), 'pip');
    expect(feedSlime(s, s.pen[0].id, 'sunfruit').ok).toBe(false);
    expect(feedSlime(addFruit(s, 'sunfruit', 1), 'slime-99', 'sunfruit').ok).toBe(false);
    expect(feedSlime(addFruit(s, 'sunfruit', 1), s.pen[0].id, 'moonroot').ok).toBe(false);
  });

  it('never leaves a negative resource across a long feeding run', () => {
    let s = addFruit(caught(newRanchState(), 'pip'), 'sunfruit', 5);
    for (let i = 0; i < 20; i += 1) {
      const r = feedSlime(s, s.pen[0].id, 'sunfruit');
      if (r.ok) s = r.state;
    }
    expect(s.fruit.sunfruit).toBe(0);
    expect(s.plorts.pip).toBe(5);
  });
});

describe('market flood-decay pricing', () => {
  it('floodMultiplier is 1 with no sales, falls 0.12 per sale and never below 0.3', () => {
    expect(floodMultiplier(0)).toBe(1);
    expect(floodMultiplier(1)).toBeCloseTo(0.88, 10);
    expect(floodMultiplier(3)).toBeCloseTo(0.64, 10);
    expect(floodMultiplier(50)).toBe(0.3);
  });

  it('the base price is the plort value', () => {
    expect(plortPrice(newRanchState(), 'pip')).toBe(10);
    expect(plortPrice(newRanchState(), 'nope')).toBeUndefined();
  });

  it('selling a batch prices each unit after the sales before it, and credits the proceeds', () => {
    const s = { ...newRanchState(), plorts: { hoar: 3 } };
    const r = sellPlorts(s, 'hoar', 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 20 x 1.0 = 20, 20 x 0.88 = 17.6 -> 17, 20 x 0.76 = 15.2 -> 15
    expect(r.earned).toBe(20 + 17 + 15);
    expect(r.state.plortCredit).toBe(52);
    expect(r.state.plorts.hoar).toBe(0);
    expect(r.state.actionCount).toBe(1);
  });

  it('the flood fades with Hub actions, not with time', () => {
    let s: RanchState = { ...newRanchState(), plorts: { pip: 1 } };
    const sold = sellPlorts(s, 'pip', 1);
    if (!sold.ok) throw new Error(sold.reason);
    s = sold.state;
    expect(recentSales(s.sales, 'pip', s.actionCount)).toBe(1);
    expect(plortPrice(s, 'pip')).toBe(8); // 10 x 0.88 = 8.8 -> 8
    s = { ...s, actionCount: s.actionCount + 5 };
    expect(recentSales(s.sales, 'pip', s.actionCount)).toBe(0);
    expect(plortPrice(s, 'pip')).toBe(10);
  });

  it('refuses to sell what is not owned and caps the quantity at what is owned', () => {
    expect(sellPlorts(newRanchState(), 'pip', 1).ok).toBe(false);
    const r = sellPlorts({ ...newRanchState(), plorts: { pip: 2 } }, 'pip', 99);
    expect(r.ok && r.sold).toBe(2);
  });
});

describe('mixing', () => {
  function twoInPen(a: string, b: string): RanchState {
    return caught(caught(newRanchState(), a, 3), b, 4);
  }

  it('mutationChance is the base, +0.2 per leaning fruit, capped at 0.85', () => {
    expect(mutationChance(0)).toBeCloseTo(0.05, 10);
    expect(mutationChance(2)).toBeCloseTo(0.45, 10);
    expect(mutationChance(10)).toBe(0.85);
  });

  it('turns two natives into the recipe species and consumes both parents', () => {
    const s = twoInPen('pip', 'flurry');
    const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(5));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.child.speciesId).toBe('largo_pip_flurry');
    expect(r.state.pen).toHaveLength(1);
    expect(r.state.pen[0].id).toBe(r.child.id);
    expect(r.state.collection).toContain('largo_pip_flurry');
    expect(r.state.actionCount).toBe(1);
  });

  it('each trait comes from one of the two parents when nothing mutates', () => {
    const s = twoInPen('pip', 'flurry');
    for (let seed = 1; seed <= 40; seed += 1) {
      const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(seed));
      if (!r.ok || r.mutated) continue;
      const [a, b] = s.pen;
      expect([a.traits.colorIndex, b.traits.colorIndex]).toContain(r.child.traits.colorIndex);
      expect([a.traits.size, b.traits.size]).toContain(r.child.traits.size);
      expect([a.traits.affinity, b.traits.affinity]).toContain(r.child.traits.affinity);
    }
  });

  it('refuses a same-species pair, a missing slime and the same slime twice, changing nothing', () => {
    const same = twoInPen('pip', 'pip');
    expect(mixSlimes(same, same.pen[0].id, same.pen[1].id, mulberry32(1)).ok).toBe(false);
    const s = twoInPen('pip', 'bloom');
    expect(mixSlimes(s, s.pen[0].id, 'slime-99', mulberry32(1)).ok).toBe(false);
    expect(mixSlimes(s, s.pen[0].id, s.pen[0].id, mulberry32(1)).ok).toBe(false);
    expect(s.pen).toHaveLength(2);
  });

  it('feeding frost fruit before a mix makes a frost child far more often than not feeding', () => {
    function frostRate(fed: boolean): number {
      let hits = 0;
      const runs = 400;
      for (let seed = 1; seed <= runs; seed += 1) {
        let s = twoInPen('pip', 'bloom'); // both meadow
        if (fed) {
          s = addFruit(s, 'icepear', 4);
          for (const slime of [...s.pen]) {
            for (let i = 0; i < 2; i += 1) {
              const f = feedSlime(s, slime.id, 'icepear');
              if (f.ok) s = f.state;
            }
          }
        }
        const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(seed));
        if (r.ok && r.child.traits.affinity === 'frost') hits += 1;
      }
      return hits / runs;
    }
    expect(frostRate(true)).toBeGreaterThan(0.7); // 4 fruit -> 0.85 cap
    expect(frostRate(false)).toBeLessThan(0.1); // base 0.05, half of which is a frost pick
  });

  it('mutation changes traits only: the child species is always the recipe result', () => {
    const s = twoInPen('dew', 'sleet');
    for (let seed = 1; seed <= 60; seed += 1) {
      const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(seed));
      expect(r.ok && r.child.speciesId).toBe('largo_dew_sleet');
    }
  });

  it('is deterministic for a seed', () => {
    const s = twoInPen('bloom', 'hoar');
    const a = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(77));
    const b = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(77));
    expect(a).toEqual(b);
  });
});

describe('debug harness', () => {
  it('describeRanch prints the pen, collection, plorts with prices and fruit', () => {
    let s = addFruit(caught(newRanchState(), 'pip'), 'sunfruit', 1);
    const fed = feedSlime(s, s.pen[0].id, 'sunfruit');
    if (!fed.ok) throw new Error(fed.reason);
    s = fed.state;
    const lines = describeRanch(s);
    expect(lines[0]).toBe('actions 1, plortCredit 0');
    expect(lines[1]).toBe('collection 1/21');
    expect(lines.some((l) => l.startsWith('pen slime-1 Pip'))).toBe(true);
    expect(lines).toContain('plort pip x1 at 10 each');
  });
});
```

**`ts/tests/test_slimeworld_ranch_save.ts`**

```ts
// new: ts/tests/test_slimeworld_ranch_save.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import { RANCH_SAVE_KEY } from '../src/games/slimeworld/ranch/data/constants';
import { addFruit, newRanchState } from '../src/games/slimeworld/ranch/model/state';
import { catchSlime } from '../src/games/slimeworld/ranch/model/slimes';
import { isRanchState, loadRanch, resetRanch, saveRanch } from '../src/games/slimeworld/ranch/save/ranchSave';

beforeEach(() => {
  localStorage.clear();
});

function playedState() {
  const caught = catchSlime(newRanchState(), 'pip', mulberry32(2));
  if (!caught.ok) throw new Error(caught.reason);
  return addFruit(caught.state, 'sunfruit', 3);
}

describe('ranch save (localStorage)', () => {
  it('uses its own key, never the old game save key', () => {
    expect(RANCH_SAVE_KEY).toBe('slimeworld_ranch_save');
    saveRanch(playedState());
    expect(localStorage.getItem('slimeworld_ranch_save')).not.toBeNull();
    expect(localStorage.getItem('slimeworld_save')).toBeNull();
  });

  it('round-trips a played state exactly', () => {
    const state = playedState();
    saveRanch(state);
    expect(loadRanch()).toEqual(state);
  });

  it('returns a fresh ranch when there is no save', () => {
    expect(loadRanch()).toEqual(newRanchState());
  });

  it('returns a fresh ranch for malformed JSON, a wrong version, or a wrong shape', () => {
    localStorage.setItem(RANCH_SAVE_KEY, '{not json');
    expect(loadRanch()).toEqual(newRanchState());
    localStorage.setItem(RANCH_SAVE_KEY, JSON.stringify({ v: 99, data: playedState() }));
    expect(loadRanch()).toEqual(newRanchState());
    localStorage.setItem(RANCH_SAVE_KEY, JSON.stringify({ v: 1, data: { pen: 'x' } }));
    expect(loadRanch()).toEqual(newRanchState());
  });

  it('isRanchState rejects negative or non-numeric counts', () => {
    expect(isRanchState(newRanchState())).toBe(true);
    expect(isRanchState({ ...newRanchState(), plorts: { pip: -1 } })).toBe(false);
    expect(isRanchState({ ...newRanchState(), fruit: { berry: 'many' } })).toBe(false);
    expect(isRanchState({ ...newRanchState(), plortCredit: -5 })).toBe(false);
    expect(isRanchState(null)).toBe(false);
  });

  it('resetRanch clears the save and returns a fresh ranch', () => {
    saveRanch(playedState());
    expect(resetRanch()).toEqual(newRanchState());
    expect(localStorage.getItem(RANCH_SAVE_KEY)).toBeNull();
  });

  it('does not throw when localStorage is unavailable', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      expect(() => saveRanch(playedState())).not.toThrow();
      expect(loadRanch()).toEqual(newRanchState());
      expect(() => resetRanch()).not.toThrow();
    } finally {
      Object.defineProperty(window, 'localStorage', real);
    }
  });
});
```

## 4. What NOT to do

- Edit NO existing file. Not `ts/src/games/slimeworld/App.tsx`, `config.ts`, `gameLogic.ts`, `types.ts`, `components/**`, not `ts/src/games/registry.ts`, not any `games/slimeworld/*.lua` or `*.yaml`, not `ts/vite.slimeworld.config.ts`, not `package.json`. `git diff --stat` must show only new files.
- No UI beyond the text harness: no React component, no CSS, no screen, no registry entry, no cover. Do not wire the ranch into the arcade or the build.
- Not in this step (they are later steps; do not pull forward): zone gates and the gate board, the foraging trip (trees, basket, lure, catch puzzle), the zone twist interface, zones 3 and 4 (Fire, Glowcaves), the phrase generator, upgrades, bait crafting, tutorial, sound, a Reset menu. Do not add combat, territory, regions, fealty, missions, dispatch or Biomass (the direction's NOT list).
- Do not call `Math.random`, `Date.now` or `performance.now` anywhere under `ranch/`. Do not name any directory `simulation` (the repo's seeded-sim guard scans those).
- Do not add real-time timers, a second currency, accounts, or network calls.
- Do not change a number in `data/constants.ts` or the species/recipe tables: they are PROPOSED values for Robert; tests assert them.
- No file over 300 lines (the direction's ceiling for ranch modules). No scratch or debug files in the repo.
- Do not run `npm run build:*`, `vite-node`, `agentflow` commands, or a browser.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified `Python 3.12.12`; no Python is changed).

Baseline before adding files (origin/main `9ffa6c56`, 2026-10-05):
```
cd ts && npx vitest run test_slimeworld
```
Real tail: `Test Files  26 passed (26)` / `Tests  150 passed (150)`.

After (verified on a prototype of exactly the files above):
```
cd ts && npx vitest run test_slimeworld_ranch
```
Expected: `Test Files  2 passed (2)` / `Tests  32 passed (32)` (25 rules, 7 save).
```
cd ts && npx vitest run test_slimeworld
```
Expected: `Test Files  28 passed (28)` / `Tests  182 passed (182)` (the 26 old files unchanged plus the 2 new).
```
cd ts && npx vitest run test_seeded_sim_guard.ts test_arcade_lineage.tsx test_four_doc_architecture.ts
```
Expected: `Test Files  3 passed (3)` / `Tests  36 passed (36)`.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename-or-prefix> [...]` and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use the bare test filename (or name prefix) as the filter. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- New files use CRLF to match the repo's TS files.
- SOLID/SRP/KISS (hard rule): one job per module as laid out above; pure functions that return a new state or `{ ok: false, reason }` and never throw or mutate their input.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge. If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] All 12 source files and 2 test files exist exactly as above; `git diff --stat` and `git status` show only new files.
- [ ] The four vitest commands in section 5 show the expected counts (real tails pasted) and `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] No `Math.random`, `Date.now` or `performance.now` under `ts/src/games/slimeworld/ranch/` (a Grep over that directory returns nothing).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the file list with line counts and the new test count. Evidence second: real tails of the vitest and tsc commands. Name the two PROPOSED defaults (parents consumed by a mix; `plortCredit` for sale proceeds) and the six native and 15 Largo names, because they are placeholders Robert will review. Next step it unblocks: the foraging loop directive (trees, basket, lure) and the Hub screens. Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing any existing file under `ts/src/games/slimeworld/` outside the new `ranch/` directory; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin-laptop |
| Branch | directive/rfdgamestudio-slimeworld-ranch-core-scaffold-directive |
| Base branch | - |
| Base commit | 6539e932787341ab3b859bfba052bcee89a4a646 |
| Head commit | 8c541d54be83657d761db4e8d3bb5cad36663f1a |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-05 22:02 · robert-claude-laptop · none → Queued — authored from DIRECTION.md (2026-10-05); queued only, not approved
- 2026-10-06 00:53 · devin-overseer (delegated) · Queued → Approved — lint override: all cited paths (ranch/data, model, save, debug + 2 test files) are create-targets this scaffold run produces - verified ts/src/games/slimeworld/ranch/ does not exist on main; demo_lists_snapshot cite is Forbidden-Actions boilerplate
- 2026-10-06 00:53 · dispatcher · Approved → In progress — dispatched devin-laptop on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimeworld-ranch-core-scaffold-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-06 00:54 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimeworld-ranch-core-scaffold-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-06 01:09 · devin · In progress → Review — 14 new files (12 ranch src + 2 tests), no edits. vitest ranch 2/32, test_slimeworld 28/182, guards 3/36, tsc clean. Commit 8c541d54 pushed. [origin] spent: devin 14 min est. n/a
<!-- queue:end -->
