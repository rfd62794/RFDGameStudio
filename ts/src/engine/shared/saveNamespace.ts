// NEW: namespaced save keys, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md

const KEY_PART = /^[a-z0-9_]+$/;

/**
 * Canonical localStorage key for a game save: rfd:<gameId>:<slot>:save.
 * Invalid parts are programmer errors, not runtime save errors, so they
 * throw instead of surfacing as null like persistence.ts reads do.
 */
export function saveKey(gameId: string, slot = 'main'): string {
  if (!KEY_PART.test(gameId)) {
    throw new Error(`saveKey: invalid gameId ${JSON.stringify(gameId)}`);
  }
  if (!KEY_PART.test(slot)) {
    throw new Error(`saveKey: invalid slot ${JSON.stringify(slot)}`);
  }
  return `rfd:${gameId}:${slot}:save`;
}
