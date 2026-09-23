#!/usr/bin/env python3
"""Debug script to check agent registration order"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.tools.apj.agents.agent_registry import AgentRegistry

def main():
    print("=== DEBUG: Registration Order ===")
    
    # Create a fresh registry
    registry = AgentRegistry()
    
    # Call the fallback registration directly
    print("Calling _register_fallback_specialists() directly...")
    registry._register_fallback_specialists()
    
    print("\nRegistered agents after direct fallback:")
    for name, metadata in registry.get_all_agents().items():
        if metadata.specialty not in [None, 'None']:
            print(f"  {name}: {metadata.specialty} ({metadata.agent_type.value})")
    
    print(f"\nTotal specialists registered: {len([a for a in registry.get_all_agents().values() if a.agent_type.value == 'specialist' and a.specialty not in [None, 'None']])}")

if __name__ == "__main__":
    main()
