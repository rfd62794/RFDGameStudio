import json
import sys
import os
from pathlib import Path

# Add src to sys.path
project_root = Path(__file__).parent.parent
src_path = project_root / "src"
sys.path.insert(0, str(src_path))

def verify_sweeper():
    report_path = project_root / "scripts" / "sweeper_report_sprint2.json"
    if not report_path.exists():
        print("❌ Sweeper report not found")
        return
    
    with open(report_path, "r") as f:
        data = json.load(f)
    
    violations = len(data.get("tier_violations", []))
    cycles = len(data.get("circular_dependencies", []))
    modules = data.get("summary", {}).get("total_modules", 0)
    
    print(f"📊 Sweeper Stats:")
    print(f"  - Modules: {modules}")
    print(f"  - Tier Violations: {violations}")
    print(f"  - Circular Dependencies: {cycles}")
    
    if cycles == 0:
        print("  ✅ Circular dependencies resolved!")
    else:
        print(f"  ❌ {cycles} circular dependencies remain")

def verify_imports():
    print("\n🧪 Import Verification:")
    
    try:
        from actors.voyager_navigation import NavigationGoal, PathfindingNavigator
        print("  ✅ actors.voyager_navigation (Body) imported")
    except ImportError as e:
        print(f"  ❌ actors.voyager_navigation failed: {e}")

    try:
        from actors.voyager import Voyager
        print("  ✅ actors.voyager (Mind) imported")
    except ImportError as e:
        print(f"  ❌ actors.voyager failed: {e}")

    try:
        from engines.models.asset_schemas import AssetMetadata
        print("  ✅ engines.models.asset_schemas imported")
    except ImportError as e:
        print(f"  ❌ engines.models.asset_schemas failed: {e}")

    try:
        from tools.asset_models import AssetMetadata as DeprecatedMetadata
        print("  ✅ tools.asset_models (Shim) imported")
    except ImportError as e:
        print(f"  ❌ tools.asset_models shim failed: {e}")

    try:
        from foundation.interfaces.visuals import AnimationState, SpriteCoordinate
        print("  ✅ foundation.interfaces.visuals imported")
    except ImportError as e:
        print(f"  ❌ foundation.interfaces.visuals failed: {e}")

    try:
        # Check if cross-tier imports in animator work
        from logic.animator import KineticSpriteController
        print("  ✅ logic.animator imported (Visuals dependency works)")
    except ImportError as e:
        print(f"  ❌ logic.animator failed: {e}")

    try:
        # Check if virtual_ppu works with DI
        from ui.virtual_ppu import VirtualPPU
        print("  ✅ ui.virtual_ppu imported (Visuals dependency works)")
    except ImportError as e:
        print(f"  ❌ ui.virtual_ppu failed: {e}")

if __name__ == "__main__":
    verify_sweeper()
    verify_imports()
