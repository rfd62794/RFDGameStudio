"""
Launch Movie - Observer View for Autonomous Movie System
ADR 080: The "Head-On" Graphics Integration

This launcher opens the Tkinter window and bridges the Autonomous Core
with the Native Tkinter PPU to visualize the Voyager's journey through the Forest Gate.

Usage:
    python launch_movie.py --seed FOREST_GATE_001 --graphics
"""

import os
import sys
# Import modular components (ADR 084)
from actors.navigator import PathfindingNavigator
from actors.intent_engine import IntentEngine
from actors.shell import VoyagerShell
import argparse
import asyncio
import time
from typing import Optional

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from core.system_config import create_default_config
from engines.world import WorldEngine, WorldEngineFactory
from engines.mind import DDEngine, DDEngineFactory
from actors.voyager import Voyager, VoyagerFactory
from utils.asset_loader import AssetLoader
from graphics.ppu_tk_native import NativeTkinterPPU
from graphics.ppu_modes import PPUMode, CombatPositions
from engines.mind.combat_resolver import CombatResolver

class ObserverView:
    """Observer View that bridges Autonomous Core with Graphics"""
    
    def __init__(self, seed: str = "FOREST_GATE_001", enable_graphics: bool = True):
        self.seed = seed
        self.enable_graphics = enable_graphics
        self.running = True
        self.session_log = []
        
        # Initialize modular components (ADR 084)
        self.navigator = PathfindingNavigator(world_size=(50, 50))
        self.intent_engine = None  # Will be initialized after object registry
        self.voyager_shell = VoyagerShell(start_position=(25, 25))
        
        # Initialize core systems
        self.config = create_default_config(seed=self.seed)
        self.world_engine = WorldEngineFactory.create_world(self.config.world)
        self.asset_loader = None
        self.ppu = None
        self.root = None
        self.console_text = None
        
        # Initialize systems
        self._initialize_systems()
        
        # Initialize remaining systems after _initialize_systems
        self.dd_engine = DDEngineFactory.create_engine(self.config.mind)
        self.voyager = VoyagerFactory.create_voyager(self.config.voyager, self.dd_engine)
        
        # Inject dependencies
        self.dd_engine.world_engine = self.world_engine
        self.voyager.dd_engine = self.dd_engine
        
        # Combat system
        self.combat_resolver = CombatResolver(f"{self.seed}_combat")
        
        # Session state
        self.running = False
        self.current_mode = "OVERWORLD"
        
        print(f"🎬 Observer View Initialized")
        print(f"🌍 Seed: {self.seed}")
        print(f"🎨 Graphics: {'Enabled' if self.enable_graphics else 'Disabled'}")
        print(f"🧠 Mind Engine: Object-Aware D20 System Ready")
    
    def _initialize_systems(self) -> None:
        """Initialize all system components"""
        try:
            # Initialize asset loader
            self.asset_loader = AssetLoader()
            
            # Initialize intent engine after asset loader
            self.intent_engine = IntentEngine(self.world_engine.object_registry)
            
            # Initialize graphics if enabled
            if self.enable_graphics:
                self._init_graphics()
            else:
                self.log_event("⚠️ Graphics disabled")
        except Exception as e:
            self.log_event(f"💥 System initialization failed: {e}")
            self.enable_graphics = False
    
    def _init_graphics(self) -> None:
        """Initialize Tkinter graphics window"""
        try:
            import tkinter as tk
            from rich.console import Console
            from rich.text import Text
            
            self.root = tk.Tk()
            self.root.title(f"🎬 Autonomous Movie System - {self.seed}")
            self.root.geometry("640x576")
            self.root.configure(bg="black")
            
            # Create canvas for PPU
            self.canvas = tk.Canvas(
                self.root,
                width=160 * 4,  # 4x scaling
                height=144 * 4,
                bg="black",
                highlightthickness=0
            )
            self.canvas.pack(padx=10, pady=10)
            
            # Initialize PPU
            self.ppu = NativeTkinterPPU(self.canvas, self.asset_loader)
            
            # Create console overlay
            console_frame = tk.Frame(self.root, bg="black")
            console_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
            
            self.console_text = tk.Text(
                console_frame,
                height=10,
                bg="black",
                fg="green",
                font=("Courier", 8),
                wrap=tk.WORD
            )
            self.console_text.pack(fill=tk.BOTH, expand=True)
            
            # Add scrollbars
            scrollbar = tk.Scrollbar(console_frame, command=self.console_text.yview)
            scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
            self.console_text.config(yscrollcommand=scrollbar.set)
            
            print("🎨 Tkinter graphics initialized")
            
        except ImportError as e:
            print(f"⚠️ Graphics disabled: {e}")
            self.enable_graphics = False
    
    def log_event(self, message: str, level: str = "INFO") -> None:
        """Log an event to the console overlay"""
        timestamp = time.strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] {level}: {message}"
        
        self.session_log.append(formatted_message)
        
        # Also print to console
        print(formatted_message)
        
        # Update GUI in main thread
        if self.enable_graphics and hasattr(self, 'console_text'):
            try:
                # Schedule GUI update in main thread
                self.root.after(0, self._update_console_gui, formatted_message)
            except Exception as e:
                print(f"⚠️ GUI update error: {e}")
    
    def _update_console_gui(self, message: str) -> None:
        """Update console GUI from main thread"""
        try:
            if hasattr(self, 'console_text'):
                import tkinter as tk
                self.console_text.insert(tk.END, message + "\n")
                self.console_text.see(tk.END)
                self.root.update_idletasks()
        except Exception as e:
            print(f"⚠️ Console GUI update error: {e}")
    
    def spawn_forest_objects(self) -> None:
        """Spawn forest objects for the Voyager to discover"""
        # Get available objects from asset loader
        available_objects = list(self.asset_loader.registry.keys())
        
        # Use hardcoded objects if registry is empty
        if not available_objects:
            available_objects = ['crystal', 'iron_chest', 'wooden_door', 'tree', 'bush', 'animated_flower']
        
        # Select some objects to spawn
        spawn_objects = []
        for obj_id in available_objects:
            if obj_id in ['crystal', 'iron_chest', 'wooden_door', 'tree', 'bush', 'animated_flower']:
                spawn_objects.append((obj_id, (12 + len(spawn_objects), 10)))
        
        self.log_event("🏗️ Spawning Forest Objects...")
        self.log_event(f"📦 Available objects: {available_objects[:5]}...")
        
        for object_id, position in spawn_objects:
            # Create object definition manually if not in registry
            if not self.asset_loader.get_asset_definition(object_id):
                guardian_def = type('AssetDef', (), {
                    'asset_id': object_id,
                    'characteristics': type('Characteristics', (), {
                        'material': object_id,
                        'tags': ['interactive'],
                        'integrity': 50,
                        'd20_checks': {
                            'examine': {'difficulty': 5, 'skill': 'nature', 'success': 'observe'}
                        }
                    })()
                })()
            else:
                guardian_def = self.asset_loader.get_asset_definition(object_id)
            
            # Create object for world
            obj = type('WorldObject', (), {
                'asset_id': object_id,
                'position': position,
                'characteristics': guardian_def.characteristics
            })()
            
            # Register in DDEngine's object registry
            self.dd_engine.object_registry.world_objects[position] = obj
            self.log_event(f"🏗️ Spawned {object_id} at {position}")
            
            # Update graphics if enabled
            if self.enable_graphics and self.ppu:
                self._render_overworld_object(obj)
    
    def _render_overworld_object(self, obj) -> None:
        """Render an object in overworld mode"""
        if not self.ppu:
            return
        
        # Get sprite for object
        sprite = self.asset_loader.get_object_sprite(obj.asset_id)
        if sprite:
            # Convert to PhotoImage if needed
            try:
                from PIL import ImageTk
                if not isinstance(sprite, ImageTk.PhotoImage):
                    photo = ImageTk.PhotoImage(sprite)
                else:
                    photo = sprite
                
                # Create sprite reference
                if not hasattr(self.ppu, '_object_sprite_refs'):
                    self.ppu._object_sprite_refs = []
                self.ppu._object_sprite_refs.append(photo)
                
                # Draw on canvas
                x = obj.position[0] * 4 * 8  # 4x scale * tile size
                y = obj.position[1] * 4 * 8
                
                self.ppu.canvas.create_image(
                    x, y,
                    image=photo,
                    anchor="center",
                    tags=f"object_{obj.asset_id}"
                )
                
            except Exception as e:
                self.log_event(f"⚠️ Failed to render {obj.asset_id}: {e}")
    
    def run(self) -> None:
        """Run the observer view"""
        if self.enable_graphics:
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            
            # Start autonomous session in a thread
            import threading
            self.session_thread = threading.Thread(target=self._run_session_thread)
            self.session_thread.daemon = True
            self.session_thread.start()
            
            # Run Tkinter main loop
            self.root.mainloop()
        else:
            # Run headless
            asyncio.run(self.run_autonomous_session())
    
    def _run_session_thread(self) -> None:
        """Run autonomous session in a thread"""
        try:
            # Create new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Run the session
            loop.run_until_complete(self.run_autonomous_session())
        except Exception as e:
            self.log_event(f"💥 Session thread error: {e}")
    
    async def run_autonomous_session(self) -> None:
        """Run the autonomous movie session"""
        self.running = True
        self.log_event("🎬 Starting Autonomous Movie Session")
        self.log_event("=" * 50)
        
        # Spawn objects
        self.spawn_forest_objects()
        
        # Initialize Voyager position (center of world)
        self.voyager.current_position = (25, 25)  # Center of 50x50 world
        
        # Disable quest mode for object-aware behavior
        if hasattr(self.voyager, 'quest_mode'):
            self.voyager.quest_mode = False
        
        # Also disable legacy script for true object-aware behavior
        if hasattr(self.voyager, 'follow_legacy_script'):
            self.voyager.follow_legacy_script = lambda: None
        
        self.log_event(f"🚶 Voyager starting at {self.voyager.current_position}")
        self.log_event("🎯 Object-Aware mode: PRIORITIZING interactions over movement")
        
        # Main session loop
        session_turns = 0
        max_turns = 100
        
        while self.running and session_turns < max_turns:
            session_turns += 1
            self.log_event(f"\n--- Turn {session_turns} ---")
            
            # Generate Voyager intent
            game_state = self._create_game_state()
            intent = await self.voyager.generate_next_intent(game_state)
            
            if intent:
                self.log_event(f"💭 Voyager intent: {intent.intent_type}")
                
                # Validate movement bounds
                if intent.intent_type == "movement" and hasattr(intent, 'target_position'):
                    target = intent.target_position
                    if 0 <= target[0] < 50 and 0 <= target[1] < 50:
                        await self._process_movement_intent(intent)
                    else:
                        self.log_event(f"⚠️ Invalid movement target {target} - staying in bounds")
                elif intent.intent_type == "interaction":
                    await self._process_interaction_intent(intent)
                else:
                    self.log_event(f"🔄 Processing {intent.intent_type} intent")
            else:
                self.log_event("⚠️ No intent generated")
            
            # Update graphics
            if self.enable_graphics and self.ppu:
                self._update_graphics()
            
            # Small delay for readability
            await asyncio.sleep(0.5)
        
        self.log_event("🎬 Autonomous Movie Session Completed")
        self.log_event("=" * 50)
    
    def _create_game_state(self):
        """Create current game state for Voyager"""
        # Simplified game state
        return type('GameState', (), {
            'player_position': self.voyager.current_position,
            'turn_count': 0
        })()
    
    async def _process_interaction_intent(self, intent) -> None:
        """Process interaction intent"""
        self.log_event(f"🎯 Processing interaction: {intent.interaction_type} at {intent.target_position}")
        
        # Get object at position
        obj = self.dd_engine.object_registry.get_object_at(intent.target_position)
        if obj and obj.characteristics:
            char = obj.characteristics
            
            # Check for D20 checks
            if hasattr(char, 'd20_checks') and char.d20_checks:
                check_data = char.d20_checks.get(intent.interaction_type)
                if check_data:
                    # Simulate D20 roll
                    import random
                    random.seed(self.seed + hash(intent.target_position))
                    roll = random.randint(1, 20)
                    difficulty = check_data.get('difficulty', 10)
                    skill = check_data.get('skill', 'none')
                    
                    self.log_event(f"🎲 Voyager encountered {obj.asset_id} at {intent.target_position}")
                    self.log_event(f"🎲 Attempting {intent.interaction_type} (DC {difficulty}) with {skill}")
                    self.log_event(f"🎯 Roll: {roll} vs DC {difficulty} -> {'SUCCESS' if roll >= difficulty else 'FAILURE'}")
                    
                    if roll >= difficulty:
                        self.log_event(f"✅ Successfully {intent.interaction_type} {obj.asset_id}!")
                    else:
                        self.log_event(f"❌ Failed to {intent.interaction_type} {obj.asset_id}!")
                else:
                    self.log_event(f"⚠️ No D20 check data for {intent.interaction_type}")
            else:
                self.log_event(f"⚠️ No D20 checks for {obj.asset_id}")
        else:
            self.log_event(f"⚠️ No object found at {intent.target_position}")
    
    async def _process_movement_intent(self, intent) -> None:
        """Process movement intent"""
        self.log_event(f"🚶 Moving to {intent.target_position}")
        self.voyager.current_position = intent.target_position
        
        # Check for combat encounter
        if intent.target_position == (15, 10):  # Forest Guardian position
            await self._start_forest_gate_battle()
    
    async def _start_forest_gate_battle(self) -> None:
        """Start Forest Gate battle with screen flash transition"""
        self.log_event("⚔️ FOREST GUARDIAN ENCOUNTER!")
        self.log_event("🎬 Screen flash → COMBAT mode")
        
        # Switch to combat mode
        if self.enable_graphics and self.ppu:
            self.ppu.set_mode(PPUMode.COMBAT)
            self.current_mode = "COMBAT"
        
        # Get combatants
        voyager_def = self._create_voyager_combat_def()
        guardian_def = self.asset_loader.get_asset_definition('forest_guardian')
        
        if not guardian_def:
            self.log_event("❌ Guardian not found for battle")
            return
        
        # Start combat
        self.combat_resolver.start_combat(
            self.voyager.current_position,
            (15, 10),
            voyager_def,
            guardian_def
        )
        
        # Resolve combat
        combat_log = self.combat_resolver.resolve_combat()
        
        # Display combat log
        self.log_event("📜 COMBAT LOG:")
        for round_result in combat_log:
            self.log_event(f"  {round_result.message}")
            if round_result.hit:
                if round_result.critical:
                    self.log_event(f"    💥 CRITICAL HIT! {round_result.damage} damage!")
                else:
                    self.log_event(f"    ⚔️ Hit for {round_result.damage} damage!")
        
        # Show results
        summary = self.combat_resolver.get_combat_summary()
        voyager = self.combat_resolver.combatants.get('voyager')
        guardian = self.combat_resolver.combatants.get('guardian')
        
        self.log_event(f"🏆 Battle Results:")
        self.log_event(f"🎯 Winner: {summary['winner'].title()}")
        self.log_event(f"📊 Rounds: {summary['rounds_completed']}")
        self.log_event(f"🚶 Final Voyager HP: {voyager.current_hp}/{voyager.max_hp}")
        self.log_event(f"🛡️ Final Guardian HP: {guardian.current_hp}/{guardian.max_hp}")
        
        if summary['winner'] == 'voyager':
            self.log_event("✅ The Forest Gate opens! Voyager may pass!")
        else:
            self.log_event("❌ Voyager defeated! The Forest Gate remains closed.")
        
        # Return to overworld
        if self.enable_graphics and self.ppu:
            self.ppu.set_mode(PPUMode.OVERWORLD)
            self.current_mode = "OVERWORLD"
    
    def _create_voyager_combat_def(self):
        """Create Voyager combat definition"""
        from utils.asset_loader import AssetDefinition, AssetType, ObjectCharacteristics
        
        return AssetDefinition(
            asset_id="voyager",
            asset_type=AssetType.ACTOR,
            characteristics=ObjectCharacteristics(
                material="flesh",
                state="ready",
                rarity=1.0,
                integrity=100,
                tags=["organic", "humanoid", "hero"],
                combat_stats={
                    "hp": 30,
                    "str": 8,
                    "def": 6,
                    "initiative": 12
                }
            )
        )
    
    def _update_graphics(self) -> None:
        """Update graphics display"""
        if not self.ppu:
            return
        
        try:
            # Clear canvas
            self.ppu.canvas.delete("all")
            
            if self.current_mode == "OVERWORLD":
                # Render overworld view
                self._render_overworld()
            elif self.current_mode == "COMBAT":
                # Render combat view
                self._render_combat()
            
            # Add animated flowers
            self._add_animated_flowers()
            
            # Update window
            if self.root:
                self.root.update()
                
        except Exception as e:
            self.log_event(f"⚠️ Graphics update error: {e}")
    
    def _add_animated_flowers(self) -> None:
        """Add animated flowers to the scene"""
        try:
            # Add some animated flowers around the world
            flower_positions = [
                (15, 15), (35, 20), (20, 30), (30, 25), (25, 35)
            ]
            
            for i, pos in enumerate(flower_positions):
                entity_id = f"flower_{i}"
                if not self.ppu.animation_manager.has_animation(entity_id):
                    self.ppu.register_entity_animation(entity_id, pos, "wind_sway")
        except Exception as e:
            self.log_event(f"⚠️ Flower animation error: {e}")
    
    def _render_overworld(self) -> None:
        """Render overworld view"""
        # Draw background
        self.ppu.canvas.configure(bg="#1a3a1a")
        
        # Draw grid
        for x in range(0, 20):
            for y in range(0, 18):
                color = "#2a5a2a" if (x + y) % 2 == 0 else "#1a4a1a"
                self.ppu.canvas.create_rectangle(
                    x * 32, y * 32, (x + 1) * 32, (y + 1) * 32,
                    fill=color, outline=""
                )
        
        # Draw Voyager
        voyager_x = self.voyager.current_position[0] * 32
        voyager_y = self.voyager.current_position[1] * 32
        self.ppu.canvas.create_oval(
            voyager_x - 8, voyager_y - 8, voyager_x + 8, voyager_y + 8,
            fill="#0066cc", outline="#0088ff"
        )
        
        # Re-render objects
        for pos, obj in self.dd_engine.object_registry.world_objects.items():
            self._render_overworld_object(obj)
    
    def _render_combat(self) -> None:
        """Render combat view"""
        # Get combat positions
        positions = CombatPositions.get_combat_positions()
        
        # Draw combat background
        self.ppu.canvas.configure(bg="#2a2a2a")
        
        # Draw ground line
        ground_y = 100 * 4
        self.ppu.canvas.create_line(
            0, ground_y, 640, ground_y,
            fill="#4a4a4a", width=2
        )
        
        # Draw combatants
        voyager_x = positions["voyager"][0] * 4
        voyager_y = positions["voyager"][1] * 4
        guardian_x = positions["guardian"][0] * 4
        guardian_y = positions["guardian"][1] * 4
        
        # Voyager (blue diamond)
        self.ppu.canvas.create_polygon(
            voyager_x, voyager_y - 16,
            voyager_x + 16, voyager_y,
            voyager_x, voyager_y + 16,
            voyager_x - 16, voyager_y,
            fill="#0066cc", outline="#0088ff"
        )
        
        # Guardian (gray diamond)
        self.ppu.canvas.create_polygon(
            guardian_x, guardian_y - 16,
            guardian_x + 16, guardian_y,
            guardian_x, guardian_y + 16,
            guardian_x - 16, guardian_y,
            fill="#666666", outline="#888888"
        )
        
        # Draw combat HUD
        self._draw_combat_hud()
    
    def _draw_combat_hud(self) -> None:
        """Draw combat HUD"""
        hud_top = 112 * 4
        
        # HP bars
        self.ppu.canvas.create_text(
            40, hud_top + 16,
            text="Voyager: 30/30",
            fill="#0066cc", font=("Arial", 10, "bold")
        )
        
        self.ppu.canvas.create_text(
            360, hud_top + 16,
            text="Guardian: 50/50",
            fill="#cc6600", font=("Arial", 10, "bold")
        )
        
        # Status
        self.ppu.canvas.create_text(
            200, hud_top + 32,
            text="BATTLE IN PROGRESS",
            fill="#ffffff", font=("Arial", 12, "bold")
        )
    
    def run(self) -> None:
        """Run the observer view"""
        if self.enable_graphics:
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            
            # Start autonomous session in a thread
            import threading
            self.session_thread = threading.Thread(target=self._run_session_thread)
            self.session_thread.daemon = True
            self.session_thread.start()
            
            # Run Tkinter main loop
            self.root.mainloop()
        else:
            # Run headless
            asyncio.run(self.run_autonomous_session())
    
    def on_closing(self):
        """Handle window closing"""
        self.running = False
        if self.root:
            self.root.destroy()

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Launch Autonomous Movie Observer View")
    parser.add_argument("--seed", default="FOREST_GATE_001", help="Seed for deterministic generation")
    parser.add_argument("--graphics", action="store_true", default=True, help="Enable graphics display")
    parser.add_argument("--headless", action="store_true", help="Run without graphics")
    
    args = parser.parse_args()
    
    if args.headless:
        args.graphics = False
    
    # Create and run observer view
    observer = ObserverView(args.seed, args.graphics)
    observer.run()

if __name__ == "__main__":
    print("🎬 Autonomous Movie System - Observer View")
    print("=" * 50)
    print("🎬 Launching Forest Gate Premiere with Graphics Integration")
    print("=" * 50)
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Observer View interrupted by user")
    except Exception as e:
        print(f"\n💥 Observer View error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🎬 Observer View ended")
