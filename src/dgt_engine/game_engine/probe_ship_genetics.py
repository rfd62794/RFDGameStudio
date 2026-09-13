
import sys
import os
from pathlib import Path

# Add src to sys.path
src_path = Path(__file__).resolve().parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))
    
print(f"Proping ship_genetics.py from {src_path}...")
sys.stdout.flush()

try:
    print("Attempting import...")
    sys.stdout.flush()
    from apps.space import ship_genetics
    print("✅ Successfully imported apps.space.ship_genetics")
except Exception as e:
    print(f"❌ Failed to import ship_genetics: {e}")
    import traceback
    traceback.print_exc()

print("Probe complete.")
