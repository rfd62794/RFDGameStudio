import { NUM_SECTORS, SOIL_STABILITY_TICKS, type WorldState } from './types';

export type GoalStatus = 'playing' | 'won' | 'lost';

export interface GoalProgress {
  status: GoalStatus;
  /** Sectors holding a Monument. */
  monuments: number;
  /** Sectors whose four tiles have all held steady for the full stability time. */
  settledSectors: number;
  sectors: number;
}

/**
 * The goal: raise a Monument in every sector and let the whole ring settle.
 * Lost only if every tile has been drained to tier 0 in every element (nothing left to grow).
 * Pure: reads tiles and sectors only.
 */
export function evaluate_goal(world: Pick<WorldState, 'tiles' | 'sectors'>): GoalProgress {
  const monuments = world.sectors.filter((s) => s.structure.type === 'Monument').length;
  const settledSectors = world.sectors.filter((s) =>
    s.tile_indices.every((idx) => (world.tiles[idx]?.ticks_stable ?? 0) >= SOIL_STABILITY_TICKS),
  ).length;
  const sectors = NUM_SECTORS;

  let status: GoalStatus = 'playing';
  if (monuments >= sectors && settledSectors >= sectors) {
    status = 'won';
  } else if (world.tiles.length > 0 && world.tiles.every((t) => t.tiers.every((v) => v === 0))) {
    status = 'lost';
  }
  return { status, monuments, settledSectors, sectors };
}

/** The one line under the header. Plain player language. */
export function goalLine(p: GoalProgress): string {
  return `Goal: raise a Monument in every sector and let the ring settle. Monuments ${p.monuments} of ${p.sectors}, settled sectors ${p.settledSectors} of ${p.sectors}.`;
}

export const WIN_TITLE = 'Your ring is in balance';
export const WIN_BODY = 'Every sector holds a Monument and the whole ring has settled. Well done. Want to try again with a fresh world?';
export const LOSE_TITLE = 'The ring has gone quiet';
export const LOSE_BODY = 'Every tile has been drained, so nothing is left to grow. It happens to every world builder. Start fresh and try again.';
