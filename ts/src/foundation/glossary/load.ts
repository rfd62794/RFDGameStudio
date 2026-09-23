import { parseGlossary } from './validate';
import type { LoadResult } from './schema';

// Paths are relative to THIS file (ts/src/foundation/glossary/load.ts); ../../../../ is the repo root.
// eager + ?raw embeds every glossary as a string at build time, same as loader.ts does for Lua.
const RAW = import.meta.glob('../../../../games/*/glossary.yaml', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const BY_GAME: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([file, text]) => [file.split('/').slice(-2)[0], text]),
);

const cache = new Map<string, LoadResult>();

/** The parsed glossary for a game, or null when the game has no glossary.yaml. */
export function getGlossary(gameId: string): LoadResult | null {
  const raw = BY_GAME[gameId];
  if (raw === undefined) return null;
  let result = cache.get(gameId);
  if (!result) {
    result = parseGlossary(raw);
    cache.set(gameId, result);
  }
  return result;
}

/** Every game id that ships a glossary.yaml. */
export function glossaryGameIds(): string[] {
  return Object.keys(BY_GAME).sort();
}
