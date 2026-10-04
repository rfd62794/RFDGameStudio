// NEW: Zod schema for games/chimera_wilds/data.yaml, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { z } from 'zod';
import { gameBlock, nameList, nonEmptyString } from './commonSchemas';

const partSchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    slot: nonEmptyString,
    accuracy: z.number(),
    endurance: z.number(),
    power: z.number(),
    speed: z.number(),
    price: z.number(),
  })
  .passthrough();

export const chimeraWildsDataSchema = z
  .object({
    game: gameBlock,
    part_slots: nameList,
    parts: z.array(partSchema).nonempty(),
    baseline_player: z
      .object({
        power: z.number(),
        endurance: z.number(),
      })
      .passthrough(),
  })
  .passthrough();
