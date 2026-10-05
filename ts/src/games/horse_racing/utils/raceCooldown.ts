/** Races at the start of a career that need no rest, so a first visit reaches a result quickly. */
export const FREE_FIRST_RACES = 3;

/** Rest time (ms) after a race, given how many races are already in the history. */
export function raceCooldownFor(racesAlreadyRun: number, cooldownMs: number): number {
  return racesAlreadyRun < FREE_FIRST_RACES ? 0 : cooldownMs;
}
