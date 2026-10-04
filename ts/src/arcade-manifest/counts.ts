/** Generated game counts. The site reads these; no number is typed into copy. */
export interface ManifestCounts {
  /** Every game in the registry export. */
  total: number;
  /** Games a player can be shown: status is not 'retired' and not 'tool'. A missing status counts as 'dev'. */
  published: number;
  /** One entry per status that occurs; a missing status is counted under 'dev'. Keys are sorted alphabetically. */
  byStatus: Record<string, number>;
}

export function computeCounts(games: ReadonlyArray<{ status?: string }>): ManifestCounts {
  const tally = new Map<string, number>();
  let published = 0;
  for (const g of games) {
    const status = g.status ?? 'dev';
    tally.set(status, (tally.get(status) ?? 0) + 1);
    if (status !== 'retired' && status !== 'tool') published++;
  }
  const byStatus: Record<string, number> = {};
  for (const key of [...tally.keys()].sort()) byStatus[key] = tally.get(key)!;
  return { total: games.length, published, byStatus };
}
