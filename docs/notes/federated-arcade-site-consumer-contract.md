# Federated arcade — site consumer contract

**Date:** 2026-10-11
**Producer:** `ts/tools/export-arcade-manifest.ts` → `ts/src/games/arcade-manifest.json`
**Consumer:** `RFD_IT_Services_Site` sync pipeline (`data/arcade.json`) — site roadmap M12/M13.
**Source decision:** `docs/notes/2026-10-11-federated-identity-handoff.md`, roadmap M10.

This note documents the optional relationship fields added to the arcade
manifest for the Office-Blog-Arcade federation. The fields are authored in
Studio source (`GameConfig` in `ts/src/engine/types.ts`, one per
`ts/src/games/<id>/config.ts`) and flow unchanged through
`buildArcadeManifest` (`ts/src/arcade-manifest/buildManifest.ts`) into each
`games[]` entry of the exported manifest.

## Fields

All three fields are optional on each manifest game entry.

| Field | Type | Meaning |
|---|---|---|
| `relatedGames` | `string[]` | gameIds of related games, in authored order. Each id is validated against the authoritative catalog (the exported registry) at manifest build time. |
| `studioStoryUrl` | `string` | An exact Studio story URL (e.g. a studio-status thread page on rfditservices.com) when one exists. Authored verbatim; the Studio does not derive it. |
| `devlogUrl` | `string` | An exact Blog/devlog URL when one exists. Authored verbatim; the Studio does not derive it. |

## Validation rules

- Every id in `relatedGames` must equal a `gameId` present in the same
  manifest's `games[]` array (the authoritative catalog the export was
  built from). An unknown id fails the export deterministically:
  `Error: <gameId>.relatedGames references unknown gameId '<id>'` from
  `buildArcadeManifest`, before any manifest is written.
- `studioStoryUrl` and `devlogUrl` carry authored exact destinations.
  They are never constructed from titles, slugs or tags.

## Absence means no relationship

When a field is absent from a manifest entry there is **no relationship** —
never a guessed fallback. Consumers must not substitute a link derived from
a game's title, `devlogTag`, tags or any other field. A missing
`relatedGames` means "no related games are declared", not "unknown". The
same rule applies to the source side: a relationship is only exported when
it was authored in the game's `config.ts` with a verified destination.

## Example manifest entry

One game entry (trimmed — omitted existing fields are unchanged; elided
with `…`):

```json
{
  "gameId": "planetofgreed",
  "label": "Planet of Greed",
  "status": "dev",
  "genre": "colony-4x",
  "tags": ["territory-control", "culture-politics"],
  "devlogTag": "planetofgreed",
  "relatedGames": ["corpworld", "kingmaker_squads"],
  "leaderboards": [],
  "saves": false,
  "version": "0.1.0",
  "statusReport": null,
  "devlog": [ "…" ]
}
```

`corpworld` and `kingmaker_squads` are themselves entries in the same
manifest (origin projects with `supersededBy: "planetofgreed"`), so a
consumer can resolve each `relatedGames` id to a real destination entry.

As of 2026-10-11 the authored fixtures are:

| Game | `relatedGames` |
|---|---|
| `planetofgreed` | `corpworld`, `kingmaker_squads` |
| `slimeworld` | `slimegarden`, `slimebreeder` |
| `dissonance` | `dissonance_prototype` |
| `voiddrift_redux` | `voiddrift` |

No `studioStoryUrl` or `devlogUrl` is authored yet — the schema is live
and optional; a field is added only when an exact destination is verified.
Tests: `ts/tests/test_arcade_manifest_relationships.ts`.
