# `game-metadata.json` Publish Contract

This documents the real, confirmed shape `ts/src/games/game-metadata.json`
must have for the itch.io publish flow to work. It is derived from reading:

- `RFD_IT_Publishing/targets/itchio.py` (`_mark_itch_published`, lines 22–39;
  `_GAME_METADATA_PATH` / `_GAME_ID_ALIASES`, lines 13–19)
- `RFD_IT_Publishing/publisher.py` (`deploy` command, lines 13–37)
- `RFD_IT_Publishing/config/games.yaml`
- `studio_mcp/game_metadata.py` (`generate_game_metadata`,
  `advance_pipeline_stage`), which is what actually generates this file in
  RFDGameStudio

**Correction to a common assumption:** `publisher.py deploy` does **not**
read `game-metadata.json` to decide how to deploy a game. Deployment
parameters (`build_dir`, `itchio_slug`, `channel`) come entirely from
`RFD_IT_Publishing/config/games.yaml`, which is edited independently in that
repo. `game-metadata.json` is **write-back only** in the publish direction:
after a real, confirmed successful `butler push`, `targets/itchio.py`'s
`_mark_itch_published` opens `game-metadata.json` and sets
`pipeline_stage: "itch_published"` on the matching entry, purely for
pipeline-stage tracking. It never raises and never blocks a real push if the
write fails or the entry is missing — the field exists for status reporting
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
| `pipeline_stage` | `string`, one of `"ai_studio"` \| `"website_collection"` \| `"itch_published"` | Where the game sits in the AI Studio → website → itch.io sequence; the field `_mark_itch_published` writes to after a real push | `"itch_published"` |
| `pipeline_flag` *(optional)* | `string` | Free-text flag for a real, live-confirmed regression (e.g. a broken itch.io push); reported separately by `scripts/pipeline_status.py`, never absorbed into `pipeline_stage` | *(not present on any current entry)* |

`pipeline_stage` defaults to `"ai_studio"` when generated fresh
(`studio_mcp/game_metadata.py`'s `_DEFAULT_PIPELINE_STAGE`), and a regression
from `itch_published` back to `website_collection` is refused by
`advance_pipeline_stage`. Re-publishing to itch.io after already being
`itch_published` is allowed (not a regression).

## `game_id` naming: two different key sets

The `game_id` used in `game-metadata.json` (and in this repo's
`studio_mcp/game_metadata.py:GAME_PATHS`) is not always the same string as
the `game_name` key used in `RFD_IT_Publishing/config/games.yaml`. Only one
mismatch is currently known and aliased in code
(`targets/itchio.py:_GAME_ID_ALIASES`):

| `game-metadata.json` (`game_id`) | `games.yaml` (`game_name`) |
|---|---|
| `voiddrift` | `voidrift` |

Every other overlapping key (`brewfield`, `shoal`, `chimera_wilds`,
`mutant_battle_ball`, `scrapcrawl`, `slime_coin`) is identical in both
files. `games.yaml` also lists `antsim`, `greengap`, `slimeworld`, and
`dissonance` — none of which currently have a `game-metadata.json` entry
(they are not present in `studio_mcp/game_metadata.py:GAME_PATHS`). Publishing
those games today happens outside this pipeline-stage-tracking path; the
`butler push` itself is unaffected (it never depended on `game-metadata.json`
in the first place), but no `pipeline_stage` write-back or
`publish_validator` pass is possible for them until an entry exists.

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
