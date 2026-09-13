
import sys
import os
from pathlib import Path

# Add src to sys.path
src_path = Path(__file__).resolve().parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))
    
print(f"Proping models.py from {src_path}...")

try:
    from engines.kernel import models
    print("✅ Successfully imported engines.kernel.models")
    print(f"AssetRegistry: {models.asset_registry.assets_dir}")
except Exception as e:
    print(f"❌ Failed to import models: {e}")
    import traceback
    traceback.print_exc()

print("Probe complete.")
