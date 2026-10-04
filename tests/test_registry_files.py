# new: Phase 1 D1.1b -- the Python mirror of the glob registry.
from __future__ import annotations

from pathlib import Path

from studio_mcp.demos.registry_files import ORDER_STEP, excluded_folders, next_order, registry_games, uses_glob
from studio_mcp.paths import REPO_ROOT

GAMES = REPO_ROOT / "ts" / "src" / "games"

REGISTRY = """import type { GameConfig } from '../engine/types';
export const GAME_REGISTRY: GameConfig[] = collectConfigs(
  import.meta.glob<{ default: GameConfig }>(
    ['./*/config.ts', '!./skipped/config.ts'],
    { eager: true },
  ),
);
"""


def make_games(tmp_path: Path) -> Path:
    games = tmp_path / "games"
    (games).mkdir()
    (games / "registry.ts").write_text(REGISTRY, encoding="utf-8")
    for folder, order in (("beta", 20), ("alpha", 20), ("first", 10), ("skipped", 5)):
        (games / folder).mkdir()
        (games / folder / "config.ts").write_text(
            f"const config = {{\n  gameId:   '{folder}',\n  order: {order},\n}};\nexport default config;\n", encoding="utf-8")
    (games / "noorder").mkdir()
    (games / "noorder" / "config.ts").write_text("const config = { gameId: 'noorder' };\nexport default config;\n", encoding="utf-8")
    return games


def test_uses_glob_and_excluded_folders() -> None:
    assert uses_glob(REGISTRY)
    assert not uses_glob("import a from './a/config';\n")
    assert excluded_folders(REGISTRY) == {"skipped"}


def test_registry_games_sorts_by_order_then_id_and_skips_excluded(tmp_path: Path) -> None:
    rows = registry_games(make_games(tmp_path))
    assert [r["id"] for r in rows] == ["first", "alpha", "beta", "noorder"]
    assert rows[-1]["order"] is None


def test_next_order_is_highest_plus_step(tmp_path: Path) -> None:
    games = make_games(tmp_path)
    assert next_order(games) == 20 + ORDER_STEP


def test_real_registry_matches_the_typescript_registry() -> None:
    ids = [r["id"] for r in registry_games(GAMES)]
    assert len(ids) == 36
    assert ids[:3] == ["dissonance", "slimeworld", "shoal"]
    assert ids[-1] == "kingmaker_squads"
    assert "brewfield" not in ids and "early_learning_buddy" not in ids
