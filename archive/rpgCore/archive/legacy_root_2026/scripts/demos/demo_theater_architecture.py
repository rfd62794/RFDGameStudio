#!/usr/bin/env python3
"""
Grand Premiere: Theater Architecture Demo

Demonstrates the complete "Stage Show" experience with the refactored
Theater Architecture. The Voyager follows the Playbook's "Blocking"
as the StageManager swaps the world around them.

This demo shows:
- Playbook (The Script): Linear sequence of acts and cues
- StageManager (The Stagehand): World state mutations  
- TheaterDirector (The Director): Observer and cue coordinator
- Voyager (The Actor): Pure movement execution
"""

import sys
import time
from typing import Tuple

# Add src to path for imports
sys.path.append('src')

from src.logic.playbook import PlaybookFactory
from src.core.stage_manager import StageManagerFactory
from src.core.theater_director import TheaterDirectorFactory
from src.logic.pathfinding import NavigationFactory


class VoyagerActor:
    """
    The Actor - Purely executes the "Blocking" (Movement).
    
    In the Theater Architecture, the Voyager no longer makes decisions.
    It simply follows the path provided by the navigation system.
    """
    
    def __init__(self):
        self.position: Tuple[int, int] = (10, 25)  # Start at forest edge
        self.is_moving: bool = False
        
        print("🎭 Voyager Actor initialized - ready for blocking instructions")
    
    def move_to_position(self, target_position: Tuple[int, int]) -> bool:
        """
        Move to a target position (simplified movement).
        
        Args:
            target_position: The position to move to
            
        Returns:
            True if movement successful
        """
        print(f"🚶 Voyager moving from {self.position} → {target_position}")
        
        # Simulate movement time
        time.sleep(0.5)
        
        self.position = target_position
        print(f"✅ Voyager arrived at {self.position}")
        return True
    
    def get_current_position(self) -> Tuple[int, int]:
        """Get current position."""
        return self.position


class GrandPremiere:
    """
    The Grand Premiere - Complete Theater Architecture demonstration.
    
    Orchestrates the entire "Tavern Voyage" performance from start to finish.
    """
    
    def __init__(self):
        """Initialize the Grand Premiere with all components."""
        print("🎬 Initializing Grand Premiere...")
        
        # Create the complete production
        self.director, self.playbook, self.stage_manager = TheaterDirectorFactory.create_tavern_voyage_director()
        
        # Create the Voyager actor
        self.voyager = VoyagerActor()
        
        # Create navigation system for pathfinding (if needed)
        self.navigation_system = NavigationFactory.create_navigation_system(50, 50)
        
        # Wire up the components
        self.director.set_navigation_system(self.navigation_system)
        self.stage_manager.set_navigation_system(self.navigation_system)
        
        print("✅ Grand Premiere initialized - all components ready")
    
    def run_performance(self) -> bool:
        """
        Run the complete Tavern Voyage performance.
        
        Returns:
            True if performance completed successfully
        """
        print("\n🎭 ============== GRAND PREMIERE BEGINS ================")
        print("📖 Script: 'Tavern Voyage' - A Journey from Forest to Comfort")
        print("🎬 Director: Observing and coordinating cues")
        print("🛠️ Stage Manager: Handling world mutations")
        print("🚶 Voyager: Following the blocking script")
        print("=" * 50)
        
        # Begin the performance
        success = self.director.begin_performance()
        if not success:
            print("❌ Failed to begin performance")
            return False
        
        # Run through all acts
        act_count = 0
        while not self.playbook.is_performance_complete:
            act_count += 1
            
            print(f"\n🎭 ============== ACT {act_count} ================")
            
            # Get current act information
            current_act = self.playbook.get_current_act()
            if not current_act:
                print("❌ No current act available")
                break
            
            print(f"📖 Scene: {current_act.scene_type.value}")
            print(f"🎯 Target: {current_act.target_position}")
            print(f"📝 Description: {current_act.scene_description}")
            
            # Move Voyager to target position
            print(f"\n🚶 Voyager executing blocking...")
            success = self.voyager.move_to_position(current_act.target_position)
            
            if not success:
                print(f"❌ Voyager failed to reach target: {current_act.target_position}")
                break
            
            # Director observes actor position and executes cues
            print(f"\n🎬 Director observing actor at mark...")
            status = self.director.observe_actor_position(self.voyager.get_current_position())
            
            print(f"📊 Director Status: {status.current_state.value}")
            if status.last_cue_executed:
                print(f"🎭 Cue Executed: {status.last_cue_executed}")
            
            # Show active effects
            active_effects = self.stage_manager.get_active_effects()
            if active_effects:
                print(f"✨ Active Effects: {[effect.effect_type for effect in active_effects]}")
            
            # Brief pause between acts
            time.sleep(1)
            
            # Safety check to prevent infinite loop
            if act_count > 10:
                print("⚠️ Safety limit reached - ending performance")
                break
        
        # Performance complete
        print(f"\n🎬 ============== PERFORMANCE COMPLETE ================")
        print(f"📊 Total Acts: {act_count}")
        
        # Get final summary
        summary = self.director.get_performance_summary()
        print(f"📈 Progress: {summary['playbook']['progress_percentage']:.1f}%")
        print(f"🎭 Final State: {summary['director']['state']}")
        
        if summary['director']['performance_time_seconds']:
            print(f"⏱️ Performance Time: {summary['director']['performance_time_seconds']:.2f}s")
        
        print("=" * 50)
        
        return self.playbook.is_performance_complete
    
    def show_component_details(self):
        """Show detailed information about each component."""
        print("\n🔍 ============== COMPONENT DETAILS ================")
        
        # Playbook details
        print(f"\n📖 Playbook (The Script):")
        print(f"   Total Acts: {len(self.playbook.acts)}")
        for i, act in enumerate(self.playbook.acts):
            status = "✅" if act.is_complete else "⏳"
            print(f"   {status} Act {act.act_number}: {act.scene_type.value} → {act.target_position}")
        
        # Stage Manager details
        print(f"\n🛠️ Stage Manager (The Stagehand):")
        print(f"   Registered Cue Handlers: {len(self.stage_manager.cue_handlers)}")
        for cue_type in self.stage_manager.cue_handlers.keys():
            print(f"   🎭 {cue_type.value}")
        
        # Director details
        print(f"\n🎬 Theater Director (The Observer):")
        print(f"   Current State: {self.director.current_state.value}")
        current_target = self.director.get_current_target()
        print(f"   Current Target: {current_target}")
        
        # Voyager details
        print(f"\n🚶 Voyager (The Actor):")
        print(f"   Current Position: {self.voyager.get_current_position()}")
        print(f"   Is Moving: {self.voyager.is_moving}")
        
        print("=" * 50)


def main():
    """Main entry point for the Grand Premiere demo."""
    print("🎭 Theater Architecture - Grand Premiere Demo")
    print("=" * 50)
    print("Demonstrating SRP-compliant separation of concerns:")
    print("• Playbook: The Script (linear narrative sequence)")
    print("• StageManager: The Stagehand (world state mutations)")
    print("• TheaterDirector: The Director (observation and cues)")
    print("• Voyager: The Actor (pure movement execution)")
    print("=" * 50)
    
    try:
        # Create and run the Grand Premiere
        premiere = GrandPremiere()
        
        # Show component details
        premiere.show_component_details()
        
        # Run the performance
        success = premiere.run_performance()
        
        if success:
            print("\n🎉 Grand Premiere SUCCESSFUL! 🎉")
            print("✨ The Voyager completed the Tavern Voyage script")
            print("🏆 Theater Architecture delivers flawless, repeatable performance!")
        else:
            print("\n❌ Grand Premiere FAILED")
            print("🔧 Check component integration and try again")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"\n💥 Grand Premiere CRASHED: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
