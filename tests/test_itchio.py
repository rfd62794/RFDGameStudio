import json
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from targets.itchio import check_butler, load_game_config, push, _is_dist_stale, _read_version


def _utime(path: Path, mtime: float) -> None:
    os.utime(path, times=(mtime, mtime))


class TestItchio(unittest.TestCase):

    def test_load_game_config_valid(self):
        """Returns correct dict for known game name"""
        config = load_game_config("shoal")
        self.assertEqual(config["itchio_slug"], "rdug627/shoal")
        self.assertEqual(config["channel"], "html5")
        self.assertIn("dist-shoal", config["build_dir"])

    def test_load_game_config_invalid(self):
        """Raises KeyError for unknown game name"""
        with self.assertRaises(KeyError):
            load_game_config("nonexistent_game")

    @patch('targets.itchio.subprocess.run')
    def test_check_butler_missing(self, mock_run):
        """Returns False when butler not on PATH (mock subprocess)"""
        mock_run.side_effect = FileNotFoundError()
        result = check_butler()
        self.assertFalse(result)

    @patch('targets.itchio.subprocess.run')
    def test_push_dry_run(self, mock_run):
        """Dry run prints correct butler command, does not execute"""
        result = push("shoal", dry_run=True)
        self.assertTrue(result)
        mock_run.assert_not_called()

    def test_itch_publish_sets_itch_published_on_real_success(self):
        """On a real, confirmed successful butler push (returncode 0),
        pipeline_stage is set to itch_published in game-metadata.json."""
        import targets.itchio as itchio_module

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"shoal": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch.object(itchio_module, "_is_dist_stale", return_value=False), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(returncode=0, stdout="ok", stderr="")
                result = push("shoal")

            self.assertTrue(result)
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["shoal"]["pipeline_stage"], "itch_published")

    def test_itch_publish_does_not_set_stage_on_real_failure(self):
        """A failed butler push (nonzero returncode) must never advance
        pipeline_stage."""
        import targets.itchio as itchio_module

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"shoal": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch.object(itchio_module, "_is_dist_stale", return_value=False), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="upload failed")
                result = push("shoal")

            self.assertFalse(result)
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["shoal"]["pipeline_stage"], "ai_studio")

    def test_itch_publish_dry_run_does_not_set_stage(self):
        """dry_run never touches real state -- pipeline_stage must be
        untouched even though push() returns True for a dry run."""
        import targets.itchio as itchio_module

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"shoal": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch.object(itchio_module, "_is_dist_stale", return_value=False), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                result = push("shoal", dry_run=True)

            self.assertTrue(result)
            mock_run.assert_not_called()
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["shoal"]["pipeline_stage"], "ai_studio")

    def test_itch_publish_game_id_alias_voidrift_to_voiddrift(self):
        """games.yaml's 'voidrift' slug must map to game-metadata.json's
        real 'voiddrift' game_id (confirmed real naming mismatch)."""
        import targets.itchio as itchio_module

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"voiddrift": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            dist_dir = Path(tmp) / "dist"
            dist_dir.mkdir()
            fake_config = {
                "itchio_slug": "rdug627/voidrift",
                "channel": "html5",
                "build_dir": str(dist_dir),
                "source_dir": str(Path(tmp) / "src"),
            }
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch.object(itchio_module, "load_game_config", return_value=fake_config), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(returncode=0, stdout="ok", stderr="")
                result = push("voidrift")

            self.assertTrue(result)
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["voiddrift"]["pipeline_stage"], "itch_published")

    @patch('builtins.print')
    def test_list_games(self, mock_print):
        """CLI list command prints real game names from games.yaml"""
        from click.testing import CliRunner
        from publisher import cli

        runner = CliRunner()
        result = runner.invoke(cli, ['list'])

        self.assertEqual(result.exit_code, 0)
        self.assertIn("shoal", result.output)
        self.assertIn("voidrift", result.output)
        self.assertIn("slimeworld", result.output)
        self.assertNotIn("antsim", result.output)
        self.assertNotIn("greengap", result.output)

    def test_is_dist_stale_true_when_source_newer(self):
        """dist older than source -> True"""
        with tempfile.TemporaryDirectory() as tmp:
            dist_dir = Path(tmp) / "dist"
            source_dir = Path(tmp) / "src"
            dist_dir.mkdir()
            source_dir.mkdir()
            (dist_dir / "old.txt").write_text("old", encoding="utf-8")
            (source_dir / "new.txt").write_text("new", encoding="utf-8")
            # Ensure source is newer by setting mtimes explicitly.
            now = time.time()
            _utime(dist_dir / "old.txt", now - 10)
            _utime(source_dir / "new.txt", now)
            self.assertTrue(_is_dist_stale(dist_dir, source_dir))

    def test_is_dist_stale_false_when_dist_newer(self):
        """dist newer than source -> False"""
        with tempfile.TemporaryDirectory() as tmp:
            dist_dir = Path(tmp) / "dist"
            source_dir = Path(tmp) / "src"
            dist_dir.mkdir()
            source_dir.mkdir()
            (dist_dir / "new.txt").write_text("new", encoding="utf-8")
            (source_dir / "old.txt").write_text("old", encoding="utf-8")
            now = time.time()
            _utime(dist_dir / "new.txt", now)
            _utime(source_dir / "old.txt", now - 10)
            self.assertFalse(_is_dist_stale(dist_dir, source_dir))

    def test_itchio_push_fails_on_stale_dist(self):
        """push() returns False when build_dir is older than source_dir."""
        import targets.itchio as itchio_module

        with tempfile.TemporaryDirectory() as tmp:
            dist_dir = Path(tmp) / "dist"
            source_dir = Path(tmp) / "src"
            dist_dir.mkdir()
            source_dir.mkdir()
            (dist_dir / "index.html").write_text("built", encoding="utf-8")
            (source_dir / "main.ts").write_text("source", encoding="utf-8")
            now = time.time()
            _utime(dist_dir / "index.html", now - 10)
            _utime(source_dir / "main.ts", now)

            fake_config = {
                "itchio_slug": "rdug627/shoal",
                "channel": "html5",
                "build_dir": str(dist_dir),
                "source_dir": str(source_dir),
            }
            with patch.object(itchio_module, "load_game_config", return_value=fake_config), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                result = push("shoal")

            self.assertFalse(result)
            mock_run.assert_not_called()

    def test_itchio_push_passes_userversion(self):
        """Successful push constructs a butler command with --userversion."""
        import targets.itchio as itchio_module

        with tempfile.TemporaryDirectory() as tmp:
            dist_dir = Path(tmp) / "dist"
            source_dir = Path(tmp) / "src"
            version_file = Path(tmp) / "VERSION"
            dist_dir.mkdir()
            source_dir.mkdir()
            version_file.write_text("2.31.0", encoding="utf-8")
            (dist_dir / "index.html").write_text("built", encoding="utf-8")
            (source_dir / "main.ts").write_text("source", encoding="utf-8")
            # Make dist newer so freshness check passes.
            now = time.time()
            _utime(dist_dir / "index.html", now)
            _utime(source_dir / "main.ts", now - 10)

            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(json.dumps({"shoal": {"pipeline_stage": "ai_studio"}}), encoding="utf-8")

            fake_config = {
                "itchio_slug": "rdug627/shoal",
                "channel": "html5",
                "build_dir": str(dist_dir),
                "source_dir": str(source_dir),
                "version_file": str(version_file),
            }
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch.object(itchio_module, "load_game_config", return_value=fake_config), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(returncode=0, stdout="ok", stderr="")
                result = push("shoal")

            self.assertTrue(result)
            args = mock_run.call_args[0][0]
            self.assertIn("--userversion", args)
            self.assertIn("2.31.0", args)
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["shoal"]["deployed_version"], "2.31.0")


if __name__ == '__main__':
    unittest.main()
