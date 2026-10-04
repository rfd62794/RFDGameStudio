// NEW: data.yaml schema registry + validateGameData, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { z } from 'zod';
import { chimeraWildsDataSchema } from './chimeraWilds';
import { chokePointDataSchema } from './chokePoint';
import { horseRacingDataSchema } from './horseRacing';

export const dataSchemas: Record<string, z.ZodTypeAny> = {
  chimera_wilds: chimeraWildsDataSchema,
  choke_point: chokePointDataSchema,
  horse_racing: horseRacingDataSchema,
};

export function validateGameData(
  gameId: string,
  parsed: unknown
): { ok: true } | { ok: false; issues: string[] } {
  const schema = dataSchemas[gameId];
  if (!schema) return { ok: true };

  const result = schema.safeParse(parsed);
  if (result.success) return { ok: true };

  return {
    ok: false,
    issues: result.error.issues.map(
      (issue) =>
        `games/${gameId}/data.yaml: ${issue.path.join('.')}: ${issue.message}`
    ),
  };
}
