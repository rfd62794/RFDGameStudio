// new: ts/src/games/planetofgreed/gameLinks.ts

/**
 * Link target for another game from inside Planet of Greed. In the arcade app the games share one
 * page and switch with `?game=<id>`. A standalone build has no known arcade address, so it returns
 * null and the screen shows no link rather than a broken one.
 */
export function arcadeGameHref(mode: 'arcade' | 'standalone', currentHref: string, gameId: string): string | null {
  if (mode !== 'arcade') return null;
  const base = currentHref.split('?')[0].split('#')[0];
  return `${base}?game=${gameId}`;
}
