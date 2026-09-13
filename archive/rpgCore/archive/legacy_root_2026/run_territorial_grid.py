"""
Quick-launch script for the Slime Clan Territorial Grid Prototype.

Usage:
    python run_territorial_grid.py
    # or, using uv:
    uv run run_territorial_grid.py
"""

import sys
from pathlib import Path

# Ensure src is on the path regardless of working directory
sys.path.insert(0, str(Path(__file__).parent / "src"))

from apps.slime_clan.territorial_grid import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
