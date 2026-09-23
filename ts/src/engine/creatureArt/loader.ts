import type { CreatureArtConfig } from './types';

/**
 * Resolve an entity to its pre-generated creature art asset path.
 *
 * Real existence check left to the caller's own asset-loading
 * convention (matches how other sprite references work in this
 * studio) — this function resolves the path, it does not assume
 * how a given renderer confirms the file exists.
 */
export function resolveCreatureArt<TEntity>(
  entity: TEntity,
  config: CreatureArtConfig<TEntity>,
): string {
  return config.assetPathFor(entity);
}
