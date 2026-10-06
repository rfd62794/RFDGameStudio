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
