#!/usr/bin/env python3
"""Debug script to check agent registration and routing"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.tools.apj.agents.agent_registry import AGENT_REGISTRY
from src.tools.apj.agents.specialist_executors import get_executor_for_agent

def main():
    print("=== DEBUG: Agent Registry ===")
    
    # Initialize specialists
    AGENT_REGISTRY.initialize_specialists()
    
    print("\nRegistered agents:")
    for name, metadata in AGENT_REGISTRY.get_all_agents().items():
        print(f"  {name}: {metadata.specialty} ({metadata.agent_type.value})")
    
    print("\n=== DEBUG: Executor Mapping ===")
    
    # Test executor lookup for each agent
    test_agents = [
        "Documentation Specialist",
        "Architecture Specialist", 
        "Genetics System Specialist",
        "UI Systems Specialist",
        "Integration Specialist",
        "Debugging Specialist",
        "Code Quality Specialist",
        "Testing Specialist"
    ]
    
    for agent_name in test_agents:
        executor = get_executor_for_agent(agent_name)
        print(f"  {agent_name}: {'FOUND' if executor else 'NOT FOUND'}")
        if executor:
            print(f"    -> {executor.__name__}")

if __name__ == "__main__":
    main()
