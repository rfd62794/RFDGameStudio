"""test_loader.py — Tests for studio.loader"""

import textwrap
from pathlib import Path

import pytest

from studio.loader import LoaderError, load_game_files


@pytest.fixture()
def game_dir(tmp_path: Path) -> Path:
    """Return a tmp_path pre-populated with minimal valid three-file game."""
    game = tmp_path / "test_game"
    game.mkdir()

    (game / "data.yaml").write_text(
        textwrap.dedent("""\
            meta:
              game_id: test_game
              version: "0.1"
              description: "Minimal test game"
            constants:
              race: {field_size: 4}
              breeding: {max_generation: 5}
              stats: {min_value: 1, max_value: 100}
              betting: {house_take: 0.1}
            schemas:
              horse:
                description: "A horse"
                fields:
                  id: {type: string, description: "ID"}
            tables:
              coat_colors:
                values: [bay, grey]
        """),
        encoding="utf-8",
    )
    (game / "ui.yaml").write_text(
        "meta:\n  game_id: test_game\ntabs: []\n", encoding="utf-8"
    )
    (game / "logic.lua").write_text(
        "function noop() return 42 end\n", encoding="utf-8"
    )
    return tmp_path


class TestLoadGameFiles:
    def test_loads_all_three_files(self, game_dir: Path) -> None:
        result = load_game_files("test_game", games_root=game_dir)
        assert set(result.keys()) == {"data", "ui", "lua"}

    def test_data_is_dict(self, game_dir: Path) -> None:
        result = load_game_files("test_game", games_root=game_dir)
        assert isinstance(result["data"], dict)

    def test_ui_is_dict(self, game_dir: Path) -> None:
        result = load_game_files("test_game", games_root=game_dir)
        assert isinstance(result["ui"], dict)

    def test_lua_is_string(self, game_dir: Path) -> None:
        result = load_game_files("test_game", games_root=game_dir)
        assert isinstance(result["lua"], str)
        assert "noop" in result["lua"]

    def test_missing_game_dir_raises(self, tmp_path: Path) -> None:
        with pytest.raises(LoaderError, match="not found"):
            load_game_files("nonexistent", games_root=tmp_path)

    def test_missing_data_yaml_raises(self, game_dir: Path) -> None:
        (game_dir / "test_game" / "data.yaml").unlink()
        with pytest.raises(LoaderError, match="data.yaml"):
            load_game_files("test_game", games_root=game_dir)

    def test_missing_ui_yaml_raises(self, game_dir: Path) -> None:
        (game_dir / "test_game" / "ui.yaml").unlink()
        with pytest.raises(LoaderError, match="ui.yaml"):
            load_game_files("test_game", games_root=game_dir)

    def test_missing_logic_lua_raises(self, game_dir: Path) -> None:
        (game_dir / "test_game" / "logic.lua").unlink()
        with pytest.raises(LoaderError, match="logic.lua"):
            load_game_files("test_game", games_root=game_dir)

    def test_malformed_data_yaml_raises(self, game_dir: Path) -> None:
        (game_dir / "test_game" / "data.yaml").write_text(
            "key: [unclosed", encoding="utf-8"
        )
        with pytest.raises(LoaderError, match="parse"):
            load_game_files("test_game", games_root=game_dir)
