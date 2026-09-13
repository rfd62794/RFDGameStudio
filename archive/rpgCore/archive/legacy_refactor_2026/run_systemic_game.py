"""
Volume 2 Premiere: Object-Aware Autonomous Voyager
The first true "Systemic Interaction" session

This script demonstrates the complete integration of:
- Pure Tkinter PPU (ADR 075)
- Object DNA System (assets/objects.yaml)
- Mind-Object Bridge (DDEngine with D20 resolution)
- Object-Aware Voyager (prioritizes interactions over movement)

Expected log output:
🎲 Voyager encountered [Iron Chest] at (12, 10). Attempting [Lockpick] (DC 20)...
🎯 Roll: 15 + 0 = 15 vs DC 20 -> FAILURE
"""

import sys
import os
import asyncio
import time
from typing import Optional

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

from core.system_config import create_default_config
from engines.world import WorldEngine, WorldEngineFactory
from engines.mind import DDEngine, DDEngineFactory
from actors.voyager import Voyager, VoyagerFactory
from utils.asset_loader import AssetLoader

class SystemicGameSession:
    """Complete systemic game session with Object-Aware Voyager"""
    
    def __init__(self, seed: str = "VOLUME_2_PREMIERE"):
        self.seed = seed
        
        # Create configuration
        self.config = create_default_config(seed)
        
        # Initialize engines
        self.world_engine = WorldEngineFactory.create_world(self.config.world)
        self.dd_engine = DDEngineFactory.create_engine(self.config.mind)
        self.voyager = VoyagerFactory.create_voyager(self.config.voyager, self.dd_engine)
        
        # Inject dependencies
        self.dd_engine.world_engine = self.world_engine
        self.voyager.dd_engine = self.dd_engine
        
        # Disable quest mode for Object-Aware demo
        self.voyager.quest_mode = False
        
        # Asset system
        self.asset_loader = AssetLoader()
        from utils.asset_loader import ObjectRegistry
        self.object_registry = ObjectRegistry(self.asset_loader)
        
        print(f"🎬 Volume 2 Premiere Session Initialized")
        print(f"🌍 Seed: {seed}")
        print(f"📦 Objects: {len(self.asset_loader.get_spawnable_objects())}")
        print(f"🧠 Mind Engine: Object-Aware D20 System Ready")
    
    def spawn_test_objects(self) -> None:
        """Spawn test objects for Voyager interaction"""
        # Spawn test objects for Voyager interaction
        test_objects = [
            ('iron_chest', (12, 10)),    # High priority container
            ('wooden_door', (10, 12)),   # Medium priority barrier
            ('campfire', (11, 9)),       # Low priority hazard
            ('ancient_ruins', (13, 11)), # High priority mysterious
            ('crystal', (9, 10)),       # High priority magical
        ]
        
        for object_id, position in test_objects:
            spawned_obj = self.object_registry.spawn_object(object_id, position)
            if spawned_obj:
                print(f"🏗️ Spawned {object_id} at {position}")
                # Also register in DDEngine's object registry
                self.dd_engine.object_registry.world_objects[position] = spawned_obj
            else:
                print(f"❌ Failed to spawn {object_id}")
    
    async def run_systemic_session(self) -> None:
        """Run the complete systemic interaction session"""
        print("\n" + "="*60)
        print("🎬 VOLUME 2 PREMIERE: OBJECT-AWARE VOYAGER SESSION")
        print("="*60)
        
        # Spawn test objects
        self.spawn_test_objects()
        
        # Pre-generate world chunks
        await self.world_engine.pre_generate_chunks((10, 25))
        
        # Get Voyager starting position
        start_pos = (10, 10)
        self.voyager.current_position = start_pos
        
        print(f"\n🚶 Voyager starting at {start_pos}")
        print(f"🎯 Object-Aware mode: PRIORITIZING interactions over movement")
        print(f"🔍 Scanning for nearby objects with D20 interactions...")
        
        # Run interaction sequence
        await self._run_interaction_sequence()
        
        print("\n" + "="*60)
        print("🏆 VOLUME 2 PREMIERE SESSION COMPLETE")
        print("="*60)
    
    async def _run_interaction_sequence(self) -> None:
        """Run the interaction sequence with Object-Aware Voyager"""
        interaction_count = 0
        max_interactions = 10
        
        while interaction_count < max_interactions:
            print(f"\n--- Turn {interaction_count + 1} ---")
            
            # Get current game state
            game_state = self.dd_engine.get_current_state()
            game_state.player_position = self.voyager.current_position
            
            # Generate next intent (Object-Aware)
            intent = await self.voyager.generate_next_intent(game_state)
            
            if not intent:
                print("🤷 Voyager has no intent - ending session")
                break
            
            print(f"💭 Voyager intent: {intent.intent_type}")
            
            if intent.intent_type == "interaction":
                # Process interaction through DDEngine
                success = await self.dd_engine.submit_intent(intent)
                
                if success:
                    # Process the command queue
                    processed = await self.dd_engine.process_queue()
                    
                    if processed > 0:
                        # Get the result
                        history = self.dd_engine.get_command_history(1)
                        if history:
                            result = history[0]
                            print(f"📜 Result: {result.message}")
                            
                            # Update Voyager position if interaction moved them
                            if hasattr(result, 'new_state') and result.new_state.player_position:
                                self.voyager.current_position = result.new_state.player_position
                                print(f"📍 Voyager now at {self.voyager.current_position}")
                
                interaction_count += 1
                
            elif intent.intent_type == "movement":
                # Process movement
                success = await self.dd_engine.submit_intent(intent)
                
                if success:
                    processed = await self.dd_engine.process_queue()
                    
                    if processed > 0:
                        history = self.dd_engine.get_command_history(1)
                        if history:
                            result = history[0]
                            print(f"📜 Movement: {result.message}")
                            
                            # Update Voyager position
                            if hasattr(result, 'new_state') and result.new_state.player_position:
                                self.voyager.current_position = result.new_state.player_position
                                print(f"📍 Voyager now at {self.voyager.current_position}")
            
            # Small delay for readability
            await asyncio.sleep(0.5)
        
        print(f"\n📊 Session Summary: {interaction_count} interactions processed")
        
        # Show final statistics
        await self._show_session_stats()
    
    async def _show_session_stats(self) -> None:
        """Show session statistics"""
        print("\n📊 SESSION STATISTICS")
        print("-" * 40)
        
        # DDEngine stats
        history = self.dd_engine.get_command_history(100)
        interaction_results = [r for r in history if 'interaction' in r.message.lower()]
        successful_interactions = [r for r in interaction_results if r.success]
        
        print(f"🎲 Total Commands: {len(history)}")
        print(f"🤝 Interactions: {len(interaction_results)}")
        print(f"✅ Successful: {len(successful_interactions)}")
        print(f"❌ Failed: {len(interaction_results) - len(successful_interactions)}")
        
        # Object registry stats
        spawned_objects = len(self.object_registry.objects)
        print(f"📦 Spawned Objects: {spawned_objects}")
        
        # Voyager stats
        nav_stats = self.voyager.get_navigation_stats()
        print(f"🧭 Navigation Stats: {nav_stats}")

async def main():
    """Main entry point for Volume 2 premiere"""
    print("🎬 Initializing Volume 2 Premiere...")
    
    # Create and run session
    session = SystemicGameSession("VOLUME_2_PREMIERE")
    await session.run_systemic_session()

if __name__ == "__main__":
    print("🎬 Volume 2 Premiere: Object-Aware Autonomous Voyager")
    print("=" * 60)
    print("🎯 Demonstrating: Pure Tkinter PPU + Object DNA + Mind Bridge")
    print("=" * 60)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Session interrupted by user")
    except Exception as e:
        print(f"\n💥 Session error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🎬 Volume 2 Premiere session ended")
