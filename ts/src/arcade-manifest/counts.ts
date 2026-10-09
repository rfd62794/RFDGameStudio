/** Generated game counts. The site reads these; no number is typed into copy. */
export interface ManifestCounts {
  /** Every game in the registry export. */
  total: number;
  /** Games a player can be shown: status is not 'retired' and not 'tool'. A missing status counts as 'dev'. */
  published: number;
  /** Published games that count as "N games" in copy: not an Origin entry (has `supersededBy`) and not tagged `showcase`. */
  playable: number;
  /** One entry per status that occurs; a missing status is counted under 'dev'. Keys are sorted alphabetically. */
  byStatus: Record<string, number>;
}

/** Tag that marks an architecture showcase: kept at its URL, left out of the `playable` count. */
export const SHOWCASE_TAG = 'showcase';

export function computeCounts(games: ReadonlyArray<{ status?: string; supersededBy?: string; tags?: readonly string[] }>): ManifestCounts {
  const tally = new Map<string, number>();
  let published = 0;
  let playable = 0;
  for (const g of games) {
    const status = g.status ?? 'dev';
    tally.set(status, (tally.get(status) ?? 0) + 1);
    if (status !== 'retired' && status !== 'tool') {
      published++;
      if (!g.supersededBy && !(g.tags ?? []).includes(SHOWCASE_TAG)) playable++;
    }
  }
  const byStatus: Record<string, number> = {};
  for (const key of [...tally.keys()].sort()) byStatus[key] = tally.get(key)!;
  return { total: games.length, published, playable, byStatus };
}
