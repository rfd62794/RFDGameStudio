"""
Test Modular Voyager Components
ADR 084: Actor-Intent Decoupling Test
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from actors.navigator import PathfindingNavigator
from actors.intent_engine import IntentEngine
from actors.shell import VoyagerShell
from engines.world import WorldEngine, WorldEngineFactory
from core.system_config import create_default_config

def test_modular_components():
    """Test the deconstructed Voyager components"""
    print("🧪 Testing Modular Voyager Components...")
    
    # Test Navigator
    print("🧭 Testing PathfindingNavigator...")
    navigator = PathfindingNavigator(world_size=(50, 50))
    print(f"✅ Navigator initialized: {navigator.world_size}")
    
    # Test Voyager Shell
    print("🚶 Testing VoyagerShell...")
    shell = VoyagerShell(start_position=(25, 25))
    print(f"✅ Shell initialized at: {shell.current_position}")
    
    # Test Intent Engine
    print("🧠 Testing IntentEngine...")
    config = create_default_config(seed="TEST_MODULAR")
    world_engine = WorldEngineFactory.create_world(config.world)
    intent_engine = IntentEngine(world_engine.object_registry)
    print(f"✅ Intent Engine initialized")
    
    # Test Modular Interaction
    print("🔄 Testing Modular Interaction...")
    
    # Simulate object detection
    nearby_objects = shell.get_nearby_objects(world_engine.object_registry, radius=5)
    print(f"📊 Found {len(nearby_objects)} nearby objects")
    
    # Simulate movement
    shell.update_position((26, 26))
    print(f"🚶 Shell moved to: {shell.current_position}")
    
    # Test idle state
    shell.update_idle_state()
    print(f"😴 Shell idle state: {shell.is_idle}")
    
    print("🎉 All modular components working!")

if __name__ == "__main__":
    test_modular_components()
