// NEW: Zod schema for games/choke_point/data.yaml, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { z } from 'zod';
import { gameBlock, nonEmptyString } from './commonSchemas';

const towerSchema = z
  .object({
    type: nonEmptyString,
    name: nonEmptyString,
    cost: z.number(),
    hp: z.number(),
  })
  .passthrough();

const waveEnemySchema = z
  .object({
    type: nonEmptyString,
    spawn_turn: z.number(),
    spawn_y: z.number(),
    hp: z.number(),
  })
  .passthrough();

export const chokePointDataSchema = z
  .object({
    game: gameBlock,
    constants: z.record(z.string(), z.number()),
    towers: z.record(z.string(), towerSchema),
    waves: z.record(
      z.string(),
      z.object({ enemies: z.array(waveEnemySchema) }).passthrough()
    ),
  })
  .passthrough();
