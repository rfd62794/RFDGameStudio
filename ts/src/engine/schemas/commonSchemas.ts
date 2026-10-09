// NEW: shared Zod pieces for game data.yaml schemas, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { z } from 'zod';

export const nonEmptyString = z.string().min(1);

export const positiveNumber = z.number().positive();

export const nameList = z.array(nonEmptyString).nonempty();

export const gameBlock = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    version: z.string(),
    studio: nonEmptyString,
  })
  .passthrough();
