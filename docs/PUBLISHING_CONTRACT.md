# `game-metadata.json` Publish Contract

This documents the real, confirmed shape `ts/src/games/game-metadata.json`
must have for the itch.io publish flow to work. It is derived from reading:

- `studio_mcp/publishing.py` (`mark_itch_published`, the post-publish hook
  passed to `itch_publisher.push`)
- `packages/itch_publisher/src/itch_publisher/itchio.py` (`push`, which calls
  the hook only after a confirmed successful `butler push`)
- `publishing/games.yaml`
- `studio_mcp/game_metadata.py` (`generate_game_metadata`,
  `advance_pipeline_stage`, `record_deployed_version`), which generates and
  updates this file

**Correction to a common assumption:** the itch.io push does **not** read
`game-metadata.json` to decide how to deploy a game. Deployment parameters
(`build_dir`, `itchio_slug`, `channel`) come entirely from
`publishing/games.yaml`. `game-metadata.json` is **write-back only** in the
publish direction: after a real, confirmed successful `butler push`,
`itch_publisher.push` calls the studio's `mark_itch_published` hook, which sets
`pipeline_stage: "itch_published"` (and `deployed_version`, when the build has
a `VERSION` file) on the matching entry, purely for pipeline-stage tracking. A
hook failure is printed but never reported as a publish failure, and a missing
entry is ignored — the field exists for status reporting
(`scripts/pipeline_status.py`), not for gating deploys.

## Required shape

`game-metadata.json` is a single JSON object, keyed by `game_id`. Each entry
is itself a JSON object. The fields below are what `studio_mcp/game_metadata.py`
actually writes; `pipeline_stage` is the one field the publish write-back
depends on.

| Field | Type | Purpose | Example (from `shoal`) |
|---|---|---|---|
| `created` | `string` (ISO 8601, or `""`) | Earliest git commit date touching the game's paths | `"2026-07-10T23:02:49-04:00"` |
| `last_updated` | `string` (ISO 8601, or `""`) | Most recent git commit date touching the game's paths | `"2026-07-28T22:40:50-04:00"` |
| `version` | `string` | Contents of the game's `VERSION` file, or `"0.1.0"` default | `"2.31.0"` |
| `tracked` | `boolean` | Whether git history was actually found for this game | `true` |
| `pipeline_stage` | `string`, one of `"ai_studio"` \| `"website_collection"` \| `"itch_published"` | Where the game sits in the AI Studio → website → itch.io sequence; the field `mark_itch_published` writes to after a real push | `"itch_published"` |
| `pipeline_flag` *(optional)* | `string` | Free-text flag for a real, live-confirmed regression (e.g. a broken itch.io push); reported separately by `scripts/pipeline_status.py`, never absorbed into `pipeline_stage` | *(not present on any current entry)* |

`pipeline_stage` defaults to `"ai_studio"` when generated fresh
(`studio_mcp/game_metadata.py`'s `_DEFAULT_PIPELINE_STAGE`), and a regression
from `itch_published` back to `website_collection` is refused by
`advance_pipeline_stage`. Re-publishing to itch.io after already being
`itch_published` is allowed (not a regression).

## `game_id` naming

Keys in `publishing/games.yaml` are the same `game_id`s used in
`game-metadata.json` and `studio_mcp/game_metadata.py:GAME_PATHS`, so no alias
table is needed. VoidDrift's key is `voiddrift`; only its itch.io slug keeps
the old spelling, `rdug627/voidrift`.

A game listed in `publishing/games.yaml` without a `game-metadata.json` entry
can still be pushed with `itch-publisher` directly, but `scripts/publish.py`'s
validation and the `pipeline_stage` write-back both need an entry to exist.

## Example: a full, valid entry

```json
"shoal": {
  "created": "2026-07-10T23:02:49-04:00",
  "last_updated": "2026-07-28T22:40:50-04:00",
  "version": "2.31.0",
  "tracked": true,
  "pipeline_stage": "itch_published"
}
```
