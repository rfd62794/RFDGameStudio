import sys
from pathlib import Path

# Add src to path
_src = Path(__file__).resolve().parent / "src"
if str(_src) not in sys.path:
    sys.path.insert(0, str(_src))

print("Attempting import...")
try:
    from actors.asteroid_pilot import AsteroidPilot
    print("Import successful!")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
