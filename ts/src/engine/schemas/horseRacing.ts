// NEW: Zod schema for games/horse_racing/data.yaml, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { z } from 'zod';
import { gameBlock, nameList, nonEmptyString, positiveNumber } from './commonSchemas';

const coatColorSchema = z
  .object({
    name: nonEmptyString,
    body: nonEmptyString,
    mane: nonEmptyString,
    socks: nonEmptyString,
    weight: z.number(),
  })
  .passthrough();

const raceClassSchema = z
  .object({
    name: nonEmptyString,
    stat_min: z.number(),
    stat_max: z.number(),
    entry_fee: z.number(),
    fee: z.number(),
    prize_pool: z.number(),
    prize_split: z.array(z.number()),
  })
  .passthrough();

const raceDistanceSchema = z
  .object({
    meters: positiveNumber,
    label: nonEmptyString,
    stat_weights: z.record(z.string(), z.number()),
  })
  .passthrough();

const horseEntrySchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    gender: nonEmptyString,
    generation: z.number(),
    speed: z.number(),
    stamina: z.number(),
    acceleration: z.number(),
    temperament: z.number(),
    price: z.number(),
  })
  .passthrough();

export const horseRacingDataSchema = z
  .object({
    game: gameBlock,
    stable: z
      .object({
        starting_funds: z.number(),
        starting_slots: z.number(),
        max_slots: z.number(),
        unlock_cost_per_slot: z.number(),
        starter_horse_cost: z.number(),
        starter_min_stat: z.number(),
        starter_max_stat: z.number(),
        race_cooldown_ms: z.number(),
        breed_cooldown_ms: z.number(),
      })
      .passthrough(),
    betting: z
      .object({
        place_odds_multiplier: z.number(),
        place_odds_min: z.number(),
        show_odds_multiplier: z.number(),
        show_odds_min: z.number(),
      })
      .passthrough(),
    race: z
      .object({
        overround: z.number(),
        field_size: z.number(),
        npc_pool_size: z.number(),
        prize_splits: z
          .object({ first: z.number(), second: z.number(), third: z.number() })
          .passthrough(),
      })
      .passthrough(),
    horse: z
      .object({ fields: z.record(z.string(), z.unknown()) })
      .passthrough(),
    coat_colors: z.array(coatColorSchema).nonempty(),
    silk_colors: nameList,
    race_classes: z.array(raceClassSchema).nonempty(),
    race_distances: z.array(raceDistanceSchema).nonempty(),
    name_prefixes: nameList,
    name_suffixes: nameList,
    race_venues: nameList,
    race_types: nameList,
    starter_horses: z.array(horseEntrySchema).nonempty(),
  })
  .passthrough();
