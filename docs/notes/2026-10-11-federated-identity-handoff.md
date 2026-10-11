# Federated identity handoff — Studio source contract

**Date:** 2026-10-11  
**Source of decision:** `RFD_IT_Services_Site/docs/DIRECTION.md`, approved by Robert.

## Boundary

RFDGameStudio owns authoritative game identity, play paths, publication metadata, per-game return behavior and source relationships. RFD_IT_Services_Site owns Hugo presentation, Arcade gallery/cabinet behavior, cross-site navigation and final Office-Blog-Arcade journey validation. RFD_Blog_Engine owns WordPress presentation and article metadata.

Do not copy Hugo or WordPress concerns into the game runtime. Do not hand-edit the site's generated `data/arcade.json`. Data required by the Arcade must originate here and flow through `ts/tools/export-arcade-manifest.ts` and the existing site sync pipeline.

## New optional relationship contract

The site roadmap M12/M13 needs exact Game → Related Game or Studio/Blog Story paths. The Studio side should design optional source fields for:

- related game ids, validated against the authoritative registry/catalog;
- an exact Studio story URL when one exists;
- an exact Blog/devlog URL when one exists.

Names are not fixed by this note; the design phase chooses the smallest schema consistent with the existing manifest. Missing relationships remain absent. Never guess from titles, slugs or shared tags. Preserve every existing id, play URL, badge and publication contract.

## Sequencing

1. Site M7 reconciles current media/generated state.
2. Site M8 locks the federation specification.
3. Studio M10.1 designs the source/manifest relationship schema.
4. Studio M10.2 implements export and tests without deploying.
5. Site M12 consumes the exported fields for Arcade related paths.
6. Site M13 validates representative cross-site journeys using deterministic fixtures.

## Existing roadmap interaction

The site explicitly defers collectibles, wheel, shards and cross-game scoring until basic discovery/return paths are coherent. Studio M4 collectible work remains valid but must not be pulled forward by this handoff. This contract is relationship metadata only; it does not alter gameplay, registry membership or publishing status.
