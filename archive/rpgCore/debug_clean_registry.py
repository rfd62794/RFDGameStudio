#!/usr/bin/env python3
"""Debug script with clean registry"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.tools.apj.agents.agent_registry import AgentRegistry

def main():
    print("=== DEBUG: Clean Registry Test ===")
    
    # Create a completely fresh registry
    registry = AgentRegistry()
    
    print("Before initialization:")
    agents_before = list(registry.get_all_agents().keys())
    print(f"  Agents: {agents_before}")
    
    print("\nCalling initialize_specialists()...")
    registry.initialize_specialists()
    
    print("\nAfter initialization:")
    specialist_agents = {name: metadata for name, metadata in registry.get_all_agents().items() 
                        if metadata.agent_type.value == 'specialist' and metadata.specialty not in [None, 'None']}
    
    for name, metadata in specialist_agents.items():
        print(f"  {name}: {metadata.specialty}")
    
    print(f"\nTotal specialists: {len(specialist_agents)}")
    
    # Check for specific specialists
    expected_specialists = [
        "Documentation Specialist",
        "Architecture Specialist", 
        "Genetics System Specialist",
        "UI Systems Specialist",
        "Code Quality Specialist",
        "Testing Specialist",
        "Integration Specialist",
        "Debugging Specialist"
    ]
    
    print("\nChecking expected specialists:")
    for specialist in expected_specialists:
        found = specialist in specialist_agents
        print(f"  {specialist}: {'✓ FOUND' if found else '✗ MISSING'}")

if __name__ == "__main__":
    main()
