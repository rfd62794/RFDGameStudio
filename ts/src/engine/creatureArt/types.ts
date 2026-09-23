/**
 * Generic seam for pre-generated 3D-compiled creature art.
 *
 * Unlike artGen, this module draws nothing live. anyCreature's compile
 * and render steps run offline, in the anyCreature sibling repo, and
 * produce static PNGs. This module only resolves an entity to its
 * pre-generated asset path — the same way any other sprite reference
 * works. Per ADR-005/ADR-014, this module carries no vocabulary tied to
 * any specific game.
 */
export interface CreatureArtConfig<TEntity> {
  assetPathFor: (entity: TEntity) => string;
  fallbackPathFor?: (entity: TEntity) => string;
}
