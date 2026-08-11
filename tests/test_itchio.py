import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from targets.itchio import check_butler, push, load_game_config


class TestItchio(unittest.TestCase):
    
    def test_load_game_config_valid(self):
        """Returns correct dict for known game name"""
        config = load_game_config("antsim")
        self.assertEqual(config["itchio_slug"], "rfd62794/antsim")
        self.assertEqual(config["channel"], "html5")
        self.assertEqual(config["build_dir"], "build/web")
    
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
        result = push("antsim", dry_run=True)
        self.assertTrue(result)
        mock_run.assert_not_called()
    
    def test_itch_publish_sets_itch_published_on_real_success(self):
        """On a real, confirmed successful butler push (returncode 0),
        pipeline_stage is set to itch_published in game-metadata.json."""
        import targets.itchio as itchio_module
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"antsim": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(returncode=0, stdout="ok", stderr="")
                result = push("antsim")

            self.assertTrue(result)
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["antsim"]["pipeline_stage"], "itch_published")

    def test_itch_publish_does_not_set_stage_on_real_failure(self):
        """A failed butler push (nonzero returncode) must never advance
        pipeline_stage."""
        import targets.itchio as itchio_module
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"antsim": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="upload failed")
                result = push("antsim")

            self.assertFalse(result)
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["antsim"]["pipeline_stage"], "ai_studio")

    def test_itch_publish_dry_run_does_not_set_stage(self):
        """dry_run never touches real state -- pipeline_stage must be
        untouched even though push() returns True for a dry run."""
        import targets.itchio as itchio_module
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"antsim": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                result = push("antsim", dry_run=True)

            self.assertTrue(result)
            mock_run.assert_not_called()
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["antsim"]["pipeline_stage"], "ai_studio")

    def test_itch_publish_game_id_alias_voidrift_to_voiddrift(self):
        """games.yaml's 'voidrift' slug must map to game-metadata.json's
        real 'voiddrift' game_id (confirmed real naming mismatch)."""
        import targets.itchio as itchio_module
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp:
            metadata_path = Path(tmp) / "game-metadata.json"
            metadata_path.write_text(
                json.dumps({"voiddrift": {"pipeline_stage": "ai_studio"}}),
                encoding="utf-8",
            )
            with patch.object(itchio_module, "_GAME_METADATA_PATH", metadata_path), \
                 patch('targets.itchio.subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(returncode=0, stdout="ok", stderr="")
                result = push("voidrift")

            self.assertTrue(result)
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertEqual(data["voiddrift"]["pipeline_stage"], "itch_published")

    @patch('builtins.print')
    def test_list_games(self, mock_print):
        """CLI list command prints all game names from games.yaml"""
        from click.testing import CliRunner
        from publisher import cli
        
        runner = CliRunner()
        result = runner.invoke(cli, ['list'])
        
        self.assertEqual(result.exit_code, 0)
        self.assertIn("antsim", result.output)
        self.assertIn("voidrift", result.output)
        self.assertIn("greengap", result.output)


if __name__ == '__main__':
    unittest.main()
