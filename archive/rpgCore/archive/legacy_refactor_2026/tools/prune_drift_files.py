#!/usr/bin/env python3
"""
Auto-generated drift code pruning script.

WARNING: This will permanently delete files!
Review the output first before running.
"""

import os
import shutil
from pathlib import Path

def main():
    print("Pruning drift code files...")

    # Prune: run_game.py
    file_path = Path("C:\Github\rpgCore\run_game.py")
    if file_path.exists():
        print(f"Deleting: {file_path}")
        # file_path.unlink()  # Uncomment to actually delete
    else:
        print(f"File not found: {file_path}")

    # Prune: game_loop.py
    file_path = Path("C:\Github\rpgCore\src\game_loop.py")
    if file_path.exists():
        print(f"Deleting: {file_path}")
        # file_path.unlink()  # Uncomment to actually delete
    else:
        print(f"File not found: {file_path}")

    print("Pruning complete")

if __name__ == '__main__':
    main()