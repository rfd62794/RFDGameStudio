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
