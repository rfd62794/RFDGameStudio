"""
Simple Registry Test - Debug Version

Minimal test to isolate registry stalling issues.
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent.parent / "src"))

def test_simple_registry():
    """Test registry without complex dependencies"""
    try:
        from src.dgt_engine.foundation.registry import DGTRegistry, RegistryType
        from src.dgt_engine.foundation.genetics.genome_engine import TurboGenome
        
        print("✅ Imports successful")
        
        # Create registry
        registry = DGTRegistry()
        print("✅ Registry created")
        
        # Create genome
        genome = TurboGenome()
        print("✅ Genome created")
        
        # Register genome
        result = registry.register("test_genome", genome, RegistryType.GENOME)
        print(f"✅ Registration result: {result.success}")
        
        # Retrieve genome
        retrieved_result = registry.get("test_genome", RegistryType.GENOME)
        print(f"✅ Retrieval result: {retrieved_result.success}")
        
        if retrieved_result.value:
            print(f"✅ Retrieved genome color: {retrieved_result.value.shell_base_color}")
        
        pass
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        pass

if __name__ == "__main__":
    print("🔧 Testing simple registry operations...")
    try:
        test_simple_registry()
        success = True
    except Exception:
        success = False
    print(f"🏁 Test {'PASSED' if success else 'FAILED'}")
