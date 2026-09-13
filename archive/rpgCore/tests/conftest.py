import sys
import os
from pathlib import Path

# Add src to python path to allow imports from game_engine
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path.resolve()))
