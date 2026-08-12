# Publishing a Game

This repo does not deploy games. Publishing (the `butler push` to itch.io)
is owned by a sibling repo, `RFD_IT_Publishing`, and lives entirely there —
this repo has no deploy logic and does not shell out to itch.io directly.

The interface between the two repos is
`ts/src/games/game-metadata.json`. `RFD_IT_Publishing` writes a
`pipeline_stage` update into it after a real, confirmed successful push;
it never reads it to decide *how* to deploy (that config lives in
`RFD_IT_Publishing/config/games.yaml`, in the other repo). See
[`PUBLISHING_CONTRACT.md`](PUBLISHING_CONTRACT.md) for the full, verified
shape of that file.

To publish:

1. Confirm your game's entry passes `studio/publish_validator.py`:
   ```bash
   python -c "from studio.publish_validator import validate_publish_metadata; validate_publish_metadata('shoal')"
   ```
2. Run `python scripts/publish.py {game_id}` — it validates the entry, then
   prints the real `RFD_IT_Publishing` command that performs the push (and
   will run it directly with `--execute`, if that repo is found at the
   expected path).

`scripts/publish.py` and this document only validate and point at the real
publish command. All Butler/itch.io logic — credentials, the actual push,
`config/games.yaml` — stays in `RFD_IT_Publishing`, unchanged.
