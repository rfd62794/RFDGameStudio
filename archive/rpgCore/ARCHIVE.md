# rpgCore (archived)

**Retired and archived here on 2026-09-13.** rpgCore was the precursor to RFDGameStudio. It is kept for reference, refactoring and recovery — it is **not maintained**, not part of the studio build, and its tests are not expected to pass.

| | |
|---|---|
| Source repo | https://github.com/rfd62794/rpgCore (archived, read-only; full history of 3,627 commits lives there) |
| Source commit | `02aef64a223577f4cddc632cf5dac83d8eed3ef7` (2026-09-13) |
| Import | squashed `git subtree add` into `archive/rpgCore/` — one commit, no per-commit history here |
| Active development | 2026-02-05 → 2026-03-03 (one housekeeping commit 2026-07-02) |

## What it was

From its README: "One developer. One engine. Four distinct games." An "Orange Box"-style Python engine where shared systems drive several genres:

- **Slime Clan** — turn-based faction strategy (playable)
- **Last Appointment** — narrative dialogue; you are Death (playable)
- **TurboShells** — turtle breeding/racing management sim (in development)
- **Asteroids Roguelike** — real-time action roguelike (in development)

Layout: `src/shared/` (engine systems, UI, renderers), `src/apps/` (the games: asteroids, dungeon_crawler, last_appointment, slime_breeder, slime_clan, space, space_trader, tycoon), `src/launcher/` (manifest-driven launcher, `demos.json`). Python 3.12, pygame-ce, pydantic, pydantic-ai, numpy.

## State at archive time

- Tests: 1,003 passed, 65 failed, 54 errors. The failures are stale tests from an unfinished refactor (2026-02-27 → 2026-03-03): UI classes such as `StatsPanel` and `Label` gained an abstract `handle_event`, `DungeonCombatScene` requires `tick`, and scene constructors (`TowerDefenseScene`, `MainMenuScene`, `DungeonRoomScene`, ...) changed signatures.
- Its GitHub Actions workflows never passed (they targeted Python 3.14 and a `dgt_core` package that no longer existed) and were removed at retirement.

## Left out of this archive

Runtime and generated files were dropped after import (they remain in the source repo's history): `logs/`, `saves/`, `data/*.sqlite`, `traceback.txt`, `validation_output.log`, `session_start_test.txt`, `src_file_list.txt`, `docs/agents/inventory/symbol_map_cache.json`.

## Running it in isolation

Nothing in the studio imports this code, and the studio's pytest, uv workspace and TypeScript builds exclude it (enforced by `tests/test_archive_isolation.py`). To run it on its own:

```bash
cd archive/rpgCore
uv sync            # its own .venv, Python 3.12
uv run python game.py
uv run pytest      # expect the failures listed above
```

## Recovery index

How each rpgCore app relates to the studio, with the strength of the evidence found on 2026-09-13. Verify before reusing anything.

| rpgCore app | Studio counterpart | Evidence | Recovery notes |
|---|---|---|---|
| `slime_breeder` | SlimeWorld lineage — **unconfirmed** | Studio ADR-023 names a separate SlimeBreeder project (`examples/SlimeBreeder`) as a SlimeWorld origin; this app shares the concept, but no link to that code was found | Compare breeding/genetics systems with SlimeWorld before porting |
| `dungeon_crawler` | ScrapCrawl — **genre only** | ScrapCrawl is tagged `dungeon-crawl`; no code lineage found | Scene/combat systems are candidates for reference |
| `tycoon` | Call Center Tycoon — **name only** | Only the word "tycoon" matches | — |
| `slime_clan` | none | — | Playable faction strategy; standalone recovery candidate |
| `last_appointment` | none | — | Playable narrative dialogue game; standalone recovery candidate |
| `asteroids` | none | Studio matches are unrelated uses of "asteroid" | Real-time action testbed |
| `space`, `space_trader` | none | — | — |
| `src/shared/` engine | studio engine — **no lineage found** | — | UI components, scenes and renderers are reference material for studio engine work |
