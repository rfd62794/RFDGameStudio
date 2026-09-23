#!/usr/bin/env python3
"""
Fixed version of run_game.py with isometric view support
"""

import sys
import os
import argparse
import time
import random
from pathlib import Path

from loguru import logger

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate
from game_state import GameState, PlayerStats, Goal
from logic.faction_system import FactionSystem
from logic.orientation import OrientationManager
from ui.dashboard import UnifiedDashboard, DashboardLayout
from chronos import ChronosEngine
from utils.historian import Historian, WorldSeed
from ui.renderer_3d import ASCIIDoomRenderer
from ui.iso_renderer import IsometricRenderer
from d20_core import D20Resolver


class SyntheticRealityDirector:
    """
    The Director's Chair - orchestrates the complete Synthetic Reality Console.
    
    Manages the hand-off between Historian, Arbiter, and Voyager to create
    a cohesive cinematic experience.
    """
    
    def __init__(self, auto_mode: bool = False, demo_mode: bool = False, view_mode: str = "doom"):
        """Initialize the Director with all systems."""
        self.auto_mode = auto_mode
        self.demo_mode = demo_mode
        self.view_mode = view_mode  # "doom" or "iso"
        
        # Core systems
        self.world_ledger = WorldLedger()
        self.faction_system = FactionSystem(self.world_ledger)
        self.chronos = ChronosEngine(self.world_ledger)
        self.historian = Historian(self.world_ledger)
        self.d20_resolver = D20Resolver(self.faction_system)
        
        # Presentation systems
        self.dashboard = UnifiedDashboard(self.world_ledger, self.faction_system)
        
        # Initialize renderer based on view mode
        if view_mode == "iso":
            self.renderer = IsometricRenderer(self.world_ledger, faction_system=self.faction_system)
        else:
            self.renderer = ASCIIDoomRenderer(self.world_ledger)
        
        self.orientation_manager = OrientationManager()
        
        # Game state
        self.game_state = None
        self.current_scene = None
        
        # Cinematic settings
        self.scene_duration = 2.0  # seconds per scene
        self.auto_turn_delay = 0.5  # seconds per auto turn
        
        logger.info(f"Director initialized - Auto: {auto_mode}, Demo: {demo_mode}, View: {view_mode}")
    
    def bake_world(self) -> bool:
        """Phase 1: World Baking - Create the sedimentary world with 1,000-year history."""
        print("🌍 DIRECTOR: Baking the Synthetic Reality World...")
        print("=" * 60)
        
        try:
            # Create factions
            faction_configs = [
                {
                    "id": "legion",
                    "name": "The Iron Legion",
                    "type": "military",
                    "color": "red",
                    "home_base": [0, 0],
                    "current_power": 0.8,
                    "relations": {"cult": "hostile", "traders": "neutral"},
                    "goals": ["expand_territory", "defend_borders"],
                    "expansion_rate": 0.2,
                    "aggression_level": 0.9
                },
                {
                    "id": "cult",
                    "name": "The Shadow Cult",
                    "type": "religious",
                    "color": "purple",
                    "home_base": [10, 10],
                    "current_power": 0.6,
                    "relations": {"legion": "hostile", "traders": "neutral"},
                    "goals": ["convert_followers", "establish_shrines"],
                    "expansion_rate": 0.1,
                    "aggression_level": 0.7
                },
                {
                    "id": "traders",
                    "name": "The Merchant Guild",
                    "type": "economic",
                    "color": "gold",
                    "home_base": [-5, -5],
                    "current_power": 0.7,
                    "relations": {"legion": "neutral", "cult": "neutral"},
                    "goals": ["establish_trade_routes", "accumulate_wealth"],
                    "expansion_rate": 0.3,
                    "aggression_level": 0.3
                }
            ]
            
            factions = self.faction_system.create_factions(faction_configs)
            print(f"   ✅ Created {len(factions)} factions")
            
            # Simulate faction history
            print("⚔️  Simulating Faction Wars...")
            for turn in range(0, 100, 10):
                self.faction_system.simulate_factions(turn)
            print("   ✅ 100 years of faction history simulated")
            
            # Initialize world chunks around starting area
            print("🏗️  Initializing World Chunks...")
            for x in range(-10, 11):
                for y in range(-10, 11):
                    coord = Coordinate(x, y, 0)
                    chunk = self.world_ledger.get_chunk(coord, 0)
            print("   ✅ 441 world chunks initialized")
            
            print("🎬 DIRECTOR: World baking complete!")
            return True
            
        except Exception as e:
            print(f"❌ DIRECTOR: World baking failed: {e}")
            logger.error(f"World baking failed: {e}")
            return False
    
    def instantiate_avatar(self) -> bool:
        """Phase 2: Avatar Instantiation - Create the player character with legacy context."""
        print("\n👤 DIRECTOR: Instantiating Avatar...")
        print("=" * 60)
        
        try:
            # Create player with legacy context
            player = PlayerStats(
                name="Synthetic Voyager",
                attributes={"strength": 12, "dexterity": 14, "constitution": 13, "intelligence": 11, "wisdom": 10, "charisma": 12},
                hp=100,
                max_hp=100,
                gold=100
            )
            
            # Create game state
            self.game_state = GameState(player=player)
            self.game_state.position = Coordinate(0, 0, 0)
            self.game_state.player_angle = 0.0
            self.game_state.world_time = 0
            
            # Set initial reputation based on world history
            self.game_state.reputation = {
                "law": 10,
                "underworld": 0,
                "clergy": 5,
                "legion": 25,
                "cult": -10,
                "traders": 15
            }
            
            # Create initial goal
            goal = Goal(
                id="explore_the_world",
                description="Explore the synthetic reality and uncover its secrets",
                target_tags=["exploration", "discovery", "knowledge"],
                method_weights={"explore": 0.8, "investigate": 0.6, "talk": 0.4},
                type="medium",
                reward_gold=100
            )
            
            self.game_state.goal_stack.append(goal)
            
            # Initialize orientation
            self.orientation_manager.set_position(0, 0, 0)
            
            print("   ✅ Avatar instantiated with legacy context")
            print("   ✅ Initial reputation set based on world history")
            print("   ✅ Exploration goal established")
            
            print("🎬 DIRECTOR: Avatar instantiation complete!")
            return True
            
        except Exception as e:
            print(f"❌ DIRECTOR: Avatar instantiation failed: {e}")
            logger.error(f"Avatar instantiation failed: {e}")
            return False
    
    def start_rendering_loop(self) -> bool:
        """Phase 3: Rendering Loop - Start the first-person journey."""
        print("\n🎮 DIRECTOR: Starting Rendering Loop...")
        print("=" * 60)
        
        try:
            # Initialize dashboard
            self.dashboard.update_layout(DashboardLayout.RAYCAST_DOMINANT)
            
            # Calculate initial perception range
            wisdom = self.game_state.player.attributes.get("wisdom", 10)
            intelligence = self.game_state.player.attributes.get("intelligence", 10)
            perception_range = max(5, (wisdom + intelligence) // 2)
            
            print(f"   ✅ Dashboard initialized with raycast-dominant layout")
            print(f"   ✅ Perception range: {perception_range} (WIS: {wisdom}, INT: {intelligence})")
            print(f"   ✅ 3D renderer ready: {self.renderer.width}x{self.renderer.height} viewport")
            
            print("🎬 DIRECTOR: Rendering loop ready!")
            return True
            
        except Exception as e:
            print(f"❌ DIRECTOR: Rendering loop failed to start: {e}")
            logger.error(f"Rendering loop failed: {e}")
            return False
    
    def render_cinematic_scene(self, scene_name: str, description: str, duration: float = None):
        """Render a cinematic scene with 3D view and narration."""
        if duration is None:
            duration = self.scene_duration
        
        # Get current NPC mood for threat indicators (only for Doom mode)
        current_npc_mood = None
        threat_mode = False
        
        if self.view_mode == "doom":
            faction = self.faction_system.get_faction_at_coordinate(self.game_state.position)
            if faction:
                current_npc_mood = self.dashboard.conversation_engine.calculate_npc_mood(
                    "Guard", self.game_state.reputation, 
                    (self.game_state.position.x, self.game_state.position.y)
                )
                threat_mode = current_npc_mood in ["hostile", "unfriendly"]
                self.renderer.set_threat_mode(threat_mode)
        
        # Calculate perception range
        wisdom = self.game_state.player.attributes.get("wisdom", 10)
        intelligence = self.game_state.player.attributes.get("intelligence", 10)
        perception_range = max(5, (wisdom + intelligence) // 2)
        
        # Render based on view mode
        if self.view_mode == "iso":
            # Isometric rendering
            try:
                frame = self.renderer.render_frame(self.game_state)
                frame_str = self.renderer.get_frame_as_string(frame)
            except Exception as e:
                print(f"Error rendering isometric frame: {e}")
                # Fallback to simple text
                frame_str = f"Isometric view error: {e}"
            
            # Get adjacent entities for dialogue activation
            try:
                adjacent_entities = self.renderer.get_adjacent_entities(self.game_state)
            except Exception as e:
                print(f"Error getting adjacent entities: {e}")
                adjacent_entities = []
            
            print(f"\n🎬 [bold cyan]SCENE: {scene_name}[/bold cyan]")
            print(f"📝 {description}")
            print("-" * 60)
            
            # Show isometric view
            print("🗺️ [bold green]ISOMETRIC VIEW:[/bold green]")
            print(frame_str)
            
            # Show status
            print(f"📍 Position: ({self.game_state.position.x}, {self.game_state.position.y})")
            print(f"🧭 Facing: {self.orientation_manager.get_facing_direction()}")
            print(f"👁️  Perception: {perception_range}")
            
            # Show adjacent entities
            if adjacent_entities:
                print(f"👥 Nearby: {len(adjacent_entities)} entities")
                for entity in adjacent_entities:
                    print(f"   - {entity.description}")
            
            # Check for dialogue activation
            if len(adjacent_entities) > 0:
                print(f"💬 [bold yellow]DIALOGUE ACTIVATED[/bold yellow]")
                print("   NPCs are nearby. Use 'talk' to interact.")
            
        else:
            # Doom-style raycasting rendering
            frame = self.renderer.render_frame(
                self.game_state, 
                self.game_state.player_angle, 
                perception_range,
                current_npc_mood
            )
            
            frame_str = self.renderer.get_frame_as_string(frame)
            
            print(f"\n🎬 [bold cyan]SCENE: {scene_name}[/bold cyan]")
            print(f"📝 {description}")
            print("-" * 60)
            
            # Show 3D view
            print("🎮 [bold green]3D VIEWPORT:[/bold green]")
            print(frame_str)
            
            # Show status
            print(f"📍 Position: ({self.game_state.position.x}, {self.game_state.position.y})")
            print(f"🧭 Facing: {self.orientation_manager.get_facing_direction()}")
            print(f"👁️  Perception: {perception_range}")
            
            if current_npc_mood:
                print(f"😊 NPC Mood: {current_npc_mood}")
        
        # Wait for scene duration
        if not self.auto_mode:
            input("\n[Press Enter to continue...]")
        else:
            time.sleep(duration)
    
    def execute_auto_journey(self):
        """Execute the automated cinematic journey."""
        print("\n🚀 DIRECTOR: Starting Automated Cinematic Journey...")
        print("=" * 60)
        
        # Scene 1: The Beginning
        self.render_cinematic_scene(
            "The Awakening",
            "You awaken in a world shaped by 1,000 years of history. The Iron Legion controls the north, the Shadow Cult lurks in the east, and the Merchant Guild trades in the west."
        )
        
        # Scene 2: First Steps
        self.game_state.player_angle = 90  # Face east
        new_pos = self.orientation_manager.move_forward()
        self.game_state.position = Coordinate(new_pos.x, new_pos.y, 0)
        
        self.render_cinematic_scene(
            "First Steps",
            "You take your first steps into this synthetic reality. The ground beneath your feet holds the echoes of countless stories."
        )
        
        # Scene 3: Historical Discovery
        self.game_state.player_angle = 0  # Face north
        for i in range(3):
            new_pos = self.orientation_manager.move_forward()
            self.game_state.position = Coordinate(new_pos.x, new_pos.y, 0)
        
        self.render_cinematic_scene(
            "Historical Discovery",
            "You discover ancient ruins from the Great War of Epoch 3. The stones whisper stories of fallen heroes and forgotten kingdoms."
        )
        
        # Scene 4: Faction Encounter
        self.game_state.player_angle = 90  # Face east
        for i in range(5):
            new_pos = self.orientation_manager.move_forward()
            self.game_state.position = Coordinate(new_pos.x, new_pos.y, 0)
        
        self.render_cinematic_scene(
            "Faction Encounter",
            "You encounter a patrol from the Iron Legion. Their disciplined formation speaks of centuries of military tradition."
        )
        
        # Scene 5: Dialogue
        npc_response = self.dashboard.handle_player_action(
            "Greetings, I come in peace.",
            self.game_state
        )
        
        if npc_response:
            self.render_cinematic_scene(
                "First Contact",
                f"The Legion guard responds: '{npc_response.text}' Their mood is {npc_response.mood}."
            )
        else:
            self.render_cinematic_scene(
                "First Contact",
                "The Legion guard watches you cautiously, hand resting on their weapon."
            )
        
        # Scene 6: World Evolution
        print("\n⏰ DIRECTOR: Advancing world time...")
        events = self.chronos.advance_time(50)
        self.game_state.world_time = 50
        
        self.render_cinematic_scene(
            "Time Passes",
            f"Fifty turns pass. The world evolves around you. {len(events)} events occurred while you traveled."
        )
        
        # Scene 7: The Journey Continues
        self.game_state.player_angle = 180  # Face south
        for i in range(3):
            new_pos = self.orientation_manager.move_forward()
            self.game_state.position = Coordinate(new_pos.x, new_pos.y, 0)
        
        self.render_cinematic_scene(
            "The Journey Continues",
            "Your journey through this synthetic reality has just begun. The world holds countless secrets waiting to be discovered."
        )
        
        # Final scene
        self.render_cinematic_scene(
            "The Director's Cut",
            "The Synthetic Reality Console demonstrates the perfect fusion of deterministic D&D rules and living world simulation. The Iron Frame has proven that high performance and deep narrative can coexist."
        )
    
    def run(self):
        """Main director run method."""
        print("🎬 SYNTHETIC REALITY CONSOLE - DIRECTOR'S CHAIR")
        print("=" * 60)
        print("Initializing all seven phases of engineering...")
        
        # Phase 1: World Baking
        if not self.bake_world():
            return False
        
        # Phase 2: Avatar Instantiation
        if not self.instantiate_avatar():
            return False
        
        # Phase 3: Rendering Loop
        if not self.start_rendering_loop():
            return False
        
        # Execute based on mode
        if self.demo_mode:
            print("Demo mode not implemented yet")
        elif self.auto_mode:
            self.execute_auto_journey()
        else:
            print("Interactive mode not implemented yet")
        
        print("\n🎬 DIRECTOR: Session complete. The Synthetic Reality Console stands ready.")
        return True


def main():
    """Main entry point for the Synthetic Reality Console."""
    parser = argparse.ArgumentParser(
        description="Synthetic Reality Console - Director's Chair",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_game.py --auto          # Automated cinematic journey
  python run_game.py --interactive    # Interactive gameplay
  python run_game.py --demo          # Demo mode with pre-configured scenes
        """
    )
    
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Run automated cinematic journey"
    )
    
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Run interactive gameplay mode"
    )
    
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run demo mode with pre-configured scenes"
    )
    
    parser.add_argument(
        "--view",
        choices=["doom", "iso"],
        default="doom",
        help="Rendering mode: doom (first-person) or iso (isometric 2.5D)"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    else:
        logger.remove()
        logger.add(sys.stderr, level="INFO")
    
    # Default to interactive if no mode specified
    if not any([args.auto, args.interactive, args.demo]):
        args.interactive = True
    
    # Create and run director
    director = SyntheticRealityDirector(
        auto_mode=args.auto,
        demo_mode=args.demo,
        view_mode=args.view
    )
    
    try:
        success = director.run()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n🎬 DIRECTOR: Session interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ DIRECTOR: Critical error: {e}")
        logger.error(f"Critical error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
