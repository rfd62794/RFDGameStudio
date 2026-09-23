/**
 * Shared L1 test fixture: createStarterPair
 *
 * Formalizes the makeStarter() + pair pattern from the first-breed
 * unlock test. Creates a valid pair of same-color starter slimes
 * suitable for testing breeding flows — the two most common L1 test
 * building blocks for SlimeWorld.
 */
import { loadGame, call } from '../../src/engine/runtime';
import { luaSlimeToTs, type Slime, type SlimeColor } from '../../src/games/slimeworld/types';
import { buildColorSpecs, SEED_SHAPE_DEFAULTS } from '../../src/games/slimeworld/App';

const HUES: Record<SlimeColor, number> = { Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300, Gray: 0 };

/**
 * Creates a single valid starter slime of the given color, using the
 * real Lua create_seed_slime call and TS-side field defaults. Identical
 * to the proven makeStarter() helper from the first-breed unlock test.
 */
export function createStarter(
  session: ReturnType<typeof loadGame>,
  color: SlimeColor,
  id: string,
  name: string,
): Slime {
  const data = session.files.data as Record<string, unknown>;
  const colorSpecs = buildColorSpecs(data);
  const [raw] = call(session, 'create_seed_slime', color, 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
  if (!raw) throw new Error(`create_seed_slime returned null for ${color}`);
  const lua = luaSlimeToTs(raw);
  const shapeDefaults = SEED_SHAPE_DEFAULTS[color] ?? { vertexCount: 4, irregularity: 10 };
  return {
    ...lua,
    id,
    name,
    diffusionRatio: lua.diffusionRatio || 20,
    amplitude: lua.amplitude || 40,
    accentHue: lua.accentHue || HUES[color],
    vertexCount: lua.vertexCount || shapeDefaults.vertexCount,
    irregularity: lua.irregularity || shapeDefaults.irregularity,
    createdAt: 1,
    stage: 'Hatchling',
  } as Slime;
}

/**
 * Creates a valid pair of same-color starter slimes — the standard
 * setup for breeding tests. Returns [parentA, parentB].
 */
export function createStarterPair(
  session: ReturnType<typeof loadGame>,
  color: SlimeColor,
): [Slime, Slime] {
  return [
    createStarter(session, color, 'starter_0', `Specimen-${color}-Alpha`),
    createStarter(session, color, 'starter_1', `Specimen-${color}-Beta`),
  ];
}
