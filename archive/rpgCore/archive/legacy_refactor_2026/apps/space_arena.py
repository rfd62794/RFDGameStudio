#!/usr/bin/env python3
"""
DGT Space Arena - ADR 129 Implementation
Tactical Space Combat with ATB System and Component Ships

Demonstrates the genetic ship-wright system with modular compositing
Final Fantasy-style Active Time Battle with visual effects
"""

import sys
import time
import argparse
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any
from queue import Queue, Empty

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger


class SpaceArenaDisplay:
    """Terminal-based tactical battle display"""
    
    def __init__(self, update_rate_hz: int = 2):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.battle_service = None
        
        logger.info("🚀 Space Arena Display initialized")
    
    def connect_to_services(self):
        """Connect to battle services"""
        try:
            from dgt_core.simulation.battle import battle_service
            from dgt_core.simulation.ship_genetics import ship_genetic_registry
            
            self.battle_service = battle_service
            self.ship_registry = ship_genetic_registry
            
            logger.info("🚀 Connected to battle services")
            return True
            
        except Exception as e:
            logger.error(f"🚀 Failed to connect to services: {e}")
            return False
    
    def start(self):
        """Start arena display"""
        if not self.battle_service:
            logger.error("🚀 No battle service connection")
            return False
        
        # Setup battle with sample ships
        if self._setup_battle():
            self.running = True
            logger.info("🚀 Space Arena Display started")
            return True
        
        return False
    
    def _setup_battle(self) -> bool:
        """Setup battle with sample ships"""
        # Generate diverse ship participants
        participants = []
        
        ship_templates = [
            {'id': 'alpha_1', 'name': 'Alpha Strike', 'template': 'light_fighter'},
            {'id': 'beta_1', 'name': 'Beta Defender', 'template': 'medium_cruiser'},
            {'id': 'gamma_1', 'name': 'Gamma Destroyer', 'template': 'heavy_battleship'},
            {'id': 'delta_1', 'name': 'Delta Ghost', 'template': 'stealth_scout'}
        ]
        
        for ship_data in ship_templates:
            genome = self.ship_registry.generate_random_ship(ship_data['template'])
            participants.append({
                'id': ship_data['id'],
                'name': ship_data['name'],
                'genome': genome
            })
        
        # Add some random ships
        for i in range(2):
            genome = self.ship_registry.generate_random_ship()
            participants.append({
                'id': f'random_{i+1}',
                'name': f'Random Ship {i+1}',
                'genome': genome
            })
        
        return self.battle_service.setup_battle(participants)
    
    def run(self):
        """Run arena display loop"""
        if not self.start():
            return False
        
        print("🚀 DGT SPACE ARENA")
        print("=" * 70)
        print("Tactical Space Combat with ATB System")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            while self.running:
                # Clear screen
                print("\033[2J\033[H", end="")
                
                # Display battle status
                self._display_battle_status()
                
                # Sleep for update rate
                time.sleep(1.0 / self.update_rate_hz)
                
        except KeyboardInterrupt:
            print("\n🚀 Arena display stopped by user")
        
        self.running = False
        logger.info("🚀 Space Arena Display stopped")
        return True
    
    def _display_battle_status(self):
        """Display battle status information"""
        print("🚀 TACTICAL SPACE COMBAT")
        print("=" * 70)
        print(f"Time: {time.strftime('%H:%M:%S')} | Battle: {'ACTIVE' if self.battle_service.battle_active else 'INACTIVE'}")
        print()
        
        # Get battle state
        battle_state = self.battle_service._get_battle_state()
        
        if not battle_state.get('battle_active', False):
            print("Battle not active")
            return
        
        # Display battle info
        print("⚔️ BATTLE STATUS")
        print("-" * 40)
        print(f"Turn: {battle_state['current_turn']}")
        print(f"Duration: {battle_state['battle_time']:.1f}s")
        print(f"Arena: {battle_state['arena']['width']}x{battle_state['arena']['height']}")
        print()
        
        # Display participants
        print("🚀 PARTICIPANTS")
        print("-" * 40)
        
        for pid, participant in battle_state['participants'].items():
            status = participant['status']
            hp_percent = (participant['hp'] / participant['max_hp']) * 100
            shield_percent = (participant['shields'] / participant['max_shields']) * 100
            
            # Status indicator
            status_icon = "✓" if status == "ready" else "⏸" if status == "waiting" else "💀" if status == "defeated" else "🏃"
            
            print(f"{status_icon} {participant['name'][:15]:15} | HP: {hp_percent:5.1f}% | Shields: {shield_percent:5.1f}% | ATB: {participant['atb_progress']:5.1f}%")
            
            # Show ship type
            genome = participant['genome']
            ship_type = f"{genome['hull_type']} {genome['engine_type']} {genome['primary_weapon']}"
            print(f"   {'':16} Type: {ship_type}")
        
        print()
        
        # Display recent battle log
        battle_log = self.battle_service.get_battle_log(5)
        if battle_log:
            print("⚔️ COMBAT LOG")
            print("-" * 40)
            for log_entry in battle_log[-5:]:
                action = log_entry.get('action', 'unknown')
                source = log_entry.get('source', 'unknown')
                target = log_entry.get('target', 'unknown')
                result = log_entry.get('result', 'unknown')
                
                print(f"  {source[:8]:8} → {target[:8]:8} | {action[:8]:8} | {result}")
        
        print()
        
        # Display controls
        print("🎮 CONTROLS")
        print("-" * 40)
        print("Space: Auto-battle mode active")
        print("Ctrl+C: Exit arena")
        print()


class SpaceArenaPPU:
    """PPU visual battle renderer"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.running = False
        self.battle_service = None
        self.ship_compositor = None
        
        logger.info("🚀 Space Arena PPU initialized")
    
    def connect_to_services(self):
        """Connect to battle and rendering services"""
        try:
            from dgt_core.simulation.battle import battle_service
            from dgt_core.simulation.ship_genetics import ship_genetic_registry
            
            self.battle_service = battle_service
            self.ship_registry = ship_genetic_registry
            
            # Try to initialize component renderer, but don't fail if it doesn't exist
            try:
                from dgt_core.engines.body.ship_compositor import ship_compositor
                self.ship_compositor = ship_compositor
                logger.info("🚀 Connected to ship compositor")
            except ImportError:
                logger.warning("🚀 Ship compositor not available - using simplified rendering")
                self.ship_compositor = None
            
            logger.info("🚀 Connected to PPU services")
            return True
            
        except Exception as e:
            logger.error(f"🚀 Failed to connect to services: {e}")
            return False
    
    def start(self):
        """Start PPU rendering"""
        if not self.battle_service:
            logger.error("🚀 No battle service connection")
            return False
        
        self.running = True
        logger.info("🚀 Space Arena PPU started")
        return True
    
    def run(self):
        """Run PPU rendering loop"""
        if not self.start():
            return False
        
        print("🚀 SPACE ARENA PPU")
        print("=" * 50)
        print("Visual tactical combat display...")
        print("Close window to stop")
        print()
        
        try:
            frame_count = 0
            
            while self.running:
                # Get battle state
                battle_state = self.battle_service._get_battle_state()
                
                if battle_state.get('battle_active', False):
                    # Create simplified visual state
                    visual_state = self._create_simplified_visualization(battle_state)
                    
                    # Display frame info
                    if frame_count % 30 == 0:  # Every second at 30 FPS
                        print(f"🚀 Battle Frame: {frame_count} | Active Participants: {len([p for p in battle_state['participants'].values() if p['status'] not in ['defeated', 'escaped']])}")
                
                frame_count += 1
                time.sleep(1.0 / 30.0)
                
        except KeyboardInterrupt:
            print("\n🚀 PPU stopped by user")
        
        self.running = False
        logger.info("🚀 Space Arena PPU stopped")
        return True
    
    def _create_simplified_visualization(self, battle_state: Dict[str, Any]) -> Dict[str, Any]:
        """Create simplified battle visualization state"""
        entities = []
        
        # Create ship entities
        for pid, participant in battle_state['participants'].items():
            if participant['status'] not in ['defeated', 'escaped']:
                # Create simple ship representation
                entity = {
                    'id': pid,
                    'type': 'ship',
                    'x': int(participant['position'][0]),
                    'y': int(participant['position'][1]),
                    'hp_percent': (participant['hp'] / participant['max_hp']) * 100,
                    'shield_percent': (participant['shields'] / participant['max_shields']) * 100,
                    'atb_progress': participant['atb_progress'],
                    'status': participant['status'],
                    'ship_type': f"{participant['genome']['hull_type']} {participant['genome']['engine_type']}"
                }
                
                entities.append(entity)
        
        # Create background
        background = {
            'id': 'space_arena',
            'type': 'baked',
            'color': (10, 10, 30)  # Dark space blue
        }
        
        # Create HUD
        hud_lines = [
            "SPACE ARENA - TACTICAL COMBAT",
            f"Turn: {battle_state['current_turn']} | Time: {battle_state['battle_time']:.1f}s",
            f"Active Ships: {len([e for e in entities if e['status'] not in ['defeated', 'escaped']])}"
        ]
        
        return {
            'width': 800,
            'height': 600,
            'entities': entities,
            'background': background,
            'hud': {
                f'line_{i}': line for i, line in enumerate(hud_lines)
            },
            'effects': {
                'ambient_light': 0.3,
                'particle_count': 20,
                'space_debris': True
            },
            'frame': {
                'count': 0,  # Will be updated by caller
                'fps': 30.0
            }
        }
    
    def _process_vfx_queue(self, vfx_queue: Queue):
        """Process visual effects queue"""
        try:
            while not vfx_queue.empty():
                vfx_data = vfx_queue.get_nowait()
                logger.debug(f"🚀 Processing VFX: {vfx_data}")
                
                # Create VFX entity
                vfx_entity = {
                    'id': f"vfx_{vfx_data['id']}",
                    'type': 'vfx',
                    'x': vfx_data['x'],
                    'y': vfx_data['y'],
                    'vfx_type': vfx_data['type'],
                    'duration': vfx_data.get('duration', 1.0),
                    'color': vfx_data.get('color', (255, 255, 255))
                }
                
                logger.debug(f"🚀 Created VFX: {vfx_entity}")
                
        except Empty:
            pass


class SpaceArenaSystem:
    """Coordinated space arena system"""
    
    def __init__(self, update_rate_hz: int = 30):
        self.update_rate_hz = update_rate_hz
        self.arena_display = None
        self.ppu_display = None
        
        logger.info("🚀 Space Arena System initialized")
    
    def start_arena(self) -> bool:
        """Start coordinated arena system"""
        print("🚀 DGT SPACE ARENA")
        print("=" * 80)
        print("Tactical Space Combat with ATB System")
        print("Coordinated: Terminal Display + PPU Visualization")
        print()
        
        # Initialize components
        self.arena_display = SpaceArenaDisplay(update_rate_hz=2)
        self.ppu_display = SpaceArenaPPU(update_rate_hz=self.update_rate_hz)
        
        # Connect services
        if not self.arena_display.connect_to_services():
            print("❌ Failed to connect arena display")
            return False
        
        if not self.ppu_display.connect_to_services():
            print("❌ Failed to connect PPU display")
            return False
        
        # Start arena display in background thread
        arena_thread = threading.Thread(target=self.arena_display.run, daemon=True)
        arena_thread.start()
        
        # Run PPU in main thread
        try:
            print("🚀 Space Arena Active")
            print("Terminal: Battle status and combat log")
            print("PPU: Visual tactical combat display")
            print()
            print("The ATB battle system is now active!")
            print("Ships will automatically engage in tactical combat.")
            print()
            print("Press Ctrl+C to stop the Space Arena")
            print()
            
            # Run PPU (or simulation)
            self.ppu_display.run()
            
        except KeyboardInterrupt:
            print("\n🚀 Space Arena stopped by user")
        
        finally:
            # Cleanup
            self.stop()
        
        return True
    
    def stop(self):
        """Stop arena system"""
        logger.info("🚀 Stopping Space Arena...")
        
        if self.arena_display:
            self.arena_display.running = False
        
        if self.ppu_display:
            self.ppu_display.running = False
        
        if self.arena_display.battle_service:
            self.arena_display.battle_service.cleanup_battle()
        
        logger.info("🚀 Space Arena stopped")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="DGT Space Arena")
    parser.add_argument('--fps', type=int, default=30, help="PPU update rate in Hz")
    parser.add_argument('--verbose', action='store_true', help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    # Create and run space arena
    arena = SpaceArenaSystem(update_rate_hz=args.fps)
    
    try:
        success = arena.start_arena()
        if not success:
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
