# Publishing a Game

itch.io publishing (the `butler push`) is done by the self-contained
`itch_publisher` package in
[`packages/itch_publisher`](../packages/itch_publisher/README.md). It was
merged in from the former `RFD_IT_Publishing` repo with its history, and it
must never import studio code (enforced by
`tests/test_itch_publisher_boundary.py`) so it can be split back out later.

The studio-specific parts live outside the package:

- `publishing/games.yaml` — which games publish where (itch.io slug, channel,
  build folder). Keys match the `game_id`s in `ts/src/games/game-metadata.json`.
- `studio_mcp/publishing.py` — calls the package and passes a post-publish
  hook that marks the game `itch_published` and records `deployed_version`
  after a confirmed successful push. See
  [`PUBLISHING_CONTRACT.md`](PUBLISHING_CONTRACT.md) for the metadata shape.

To publish:

1. Build the game, e.g. `npm run build:shoal` in `ts/`. A push is refused when
   the build folder is older than the game's source.
2. Dry run — validates the metadata entry and prints the butler command:
   ```bash
   uv run python scripts/publish.py shoal
   ```
3. Push for real (run `butler login` once beforehand):
   ```bash
   uv run python scripts/publish.py shoal --execute
   ```

To compare source, deployed and live itch.io versions for every game:

```bash
uv run itch-publisher --config publishing/games.yaml report --metadata ts/src/games/game-metadata.json
```
