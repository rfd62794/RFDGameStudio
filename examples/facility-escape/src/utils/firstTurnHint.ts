/** Three plain lines shown once, before the player's first move in Room 1. */
export const FIRST_TURN_HINT: readonly string[] = [
  'Guards show their next move before you act.',
  'Stay out of their sightline.',
  'Reach the exit at the top-right.',
];

export function shouldShowFirstTurnHint(roomNumber: number, turnCount: number): boolean {
  return roomNumber === 1 && turnCount === 0;
}
