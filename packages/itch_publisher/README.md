# itch-publisher

Push HTML5 game builds to [itch.io](https://itch.io) with
[butler](https://itch.io/docs/butler/).

Self-contained: it depends only on `click` and `PyYAML` and knows nothing about
the project that uses it. It currently lives inside a larger repository as a
uv workspace package and can be split back out into its own repository (see
below). Formerly the `RFD_IT_Publishing` repo; its history is preserved here.

## Setup

1. Install butler and run `butler login` once (butler stores the credentials).
2. Install the package: `uv sync` from the workspace root, or
   `pip install -e packages/itch_publisher`.

## Registry (`games.yaml`)

```yaml
games:
  shoal:
    itchio_slug: user/shoal                       # itch.io user/project
    channel: html5                                # butler channel
    build_dir: ../ts/dist-shoal                   # folder that gets pushed
    source_dir: ../ts/src/games/shoal             # optional: refuse stale builds
    version_file: ../ts/src/games/shoal/VERSION   # optional: --userversion
```

Relative paths resolve from the folder containing `games.yaml`. The registry
path comes from `--config`, then `$ITCH_PUBLISHER_CONFIG`, then `./games.yaml`.

## Command line

```bash
itch-publisher --config games.yaml list
itch-publisher --config games.yaml deploy shoal --dry-run
itch-publisher --config games.yaml deploy shoal
itch-publisher --config games.yaml report --metadata metadata.json
```

A push is refused when `build_dir` is older than `source_dir`. `report`
compares each game's source, deployed and live itch.io versions; the optional
metadata file is JSON keyed by game name with `version` / `deployed_version`.

## Library

```python
from itch_publisher import push

def record_release(game_name: str, version: str | None) -> None:
    ...  # e.g. update your own release metadata

push("shoal", config_path="games.yaml", dry_run=False, on_published=record_release)
```

`on_published` runs only after a confirmed successful push. If it raises, the
error is printed and the push still counts as successful.

## Tests

```bash
uv run --package itch-publisher pytest packages/itch_publisher/tests
```

## Splitting back out

The package's history is preserved under its folder, so it can become its own
repository again:

```bash
git subtree split --prefix=packages/itch_publisher -b itch-publisher-split
```

Push that branch to a new repository, then make the host project depend on it
by git URL or PyPI version instead of `{ workspace = true }`.
