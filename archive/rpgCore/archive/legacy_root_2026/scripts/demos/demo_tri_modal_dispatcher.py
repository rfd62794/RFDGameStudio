"""
Tri-Modal Dispatcher Demo
Shows the DGT Display Suite rendering the same data across three different lenses
"""

import time
import random
import threading
from typing import Dict, Any
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from body.dispatcher import (
    DisplayDispatcher, DisplayMode, RenderPacket, 
    create_ppu_packet, create_terminal_packet, create_cockpit_packet
)
from body.terminal import create_terminal_body
from body.cockpit import create_cockpit_body
from body.ppu import create_ppu_body

class TriModalDemo:
    """Demo showcasing tri-modal display capabilities"""
    
    def __init__(self):
        self.dispatcher = DisplayDispatcher(default_mode=DisplayMode.TERMINAL)
        self.running = False
        self.demo_counter = 0
        self.current_mode = DisplayMode.TERMINAL
        
        # Demo data
        self.demo_entities = [
            {'id': 'player', 'x': 10, 'y': 10, 'effect': 'sway'},
            {'id': 'enemy', 'x': 15, 'y': 8, 'effect': 'pulse'},
            {'id': 'item', 'x': 5, 'y': 12, 'effect': 'flicker'},
            {'id': 'wall', 'x': 8, 'y': 6, 'effect': None},
        ]
        
        self.demo_meters = {
            'fps': 60.0,
            'cpu': 45.2,
            'memory': 67.8,
            'entities': len(self.demo_entities),
            'render_time': 12.5,
            'packets': 30.0,
        }
        
        self.demo_labels = {
            'status': '🎮 Demo Running',
            'mode': '🎭 Terminal Mode',
            'time': '🕐 Initializing...',
        }
        
    def initialize(self) -> bool:
        """Initialize all display bodies"""
        print("🚀 Initializing Tri-Modal Demo...")
        
        # Create and register terminal body
        terminal_body = create_terminal_body()
        if terminal_body:
            self.dispatcher.register_body(DisplayMode.TERMINAL, terminal_body)
            print("✅ Terminal body registered")
        else:
            print("❌ Failed to create terminal body")
            return False
        
        # Create and register cockpit body
        cockpit_body = create_cockpit_body()
        if cockpit_body:
            self.dispatcher.register_body(DisplayMode.COCKPIT, cockpit_body)
            print("✅ Cockpit body registered")
        else:
            print("❌ Failed to create cockpit body")
            return False
        
        # Create and register PPU body
        ppu_body = create_ppu_body()
        if ppu_body:
            self.dispatcher.register_body(DisplayMode.PPU, ppu_body)
            print("✅ PPU body registered")
        else:
            print("❌ Failed to create PPU body")
            return False
        
        # Set initial mode
        self.dispatcher.set_mode(DisplayMode.TERMINAL)
        
        print("🎯 All display bodies initialized!")
        return True
    
    def run_demo(self):
        """Run the demo with animated data"""
        if not self.initialize():
            return
        
        self.running = True
        print("🎬 Starting Tri-Modal Demo...")
        print("📋 Controls:")
        print("  • Press 'T' for Terminal mode")
        print("  • Press 'C' for Cockpit mode") 
        print("  • Press 'P' for PPU mode")
        print("  • Press 'S' to cycle through all modes")
        print("  • Press 'Q' to quit")
        print()
        
        # Start input thread
        input_thread = threading.Thread(target=self._handle_input, daemon=True)
        input_thread.start()
        
        # Start animation loop
        self._animation_loop()
    
    def _handle_input(self):
        """Handle keyboard input for mode switching"""
        while self.running:
            try:
                import sys
                if sys.stdin.isatty():
                    command = input("Enter command (T/C/P/S/Q): ").upper().strip()
                    
                    if command == 'T':
                        self.switch_mode(DisplayMode.TERMINAL)
                    elif command == 'C':
                        self.switch_mode(DisplayMode.COCKPIT)
                    elif command == 'P':
                        self.switch_mode(DisplayMode.PPU)
                    elif command == 'S':
                        self.cycle_modes()
                    elif command == 'Q':
                        self.running = False
                        break
                    else:
                        print("❌ Invalid command")
                else:
                    # Non-interactive mode - cycle through modes automatically
                    time.sleep(5)  # Wait 5 seconds
                    self.cycle_modes()
                    
            except (EOFError, KeyboardInterrupt):
                self.running = False
                break
            except Exception as e:
                print(f"❌ Input error: {e}")
                break
    
    def switch_mode(self, mode: DisplayMode):
        """Switch to a specific display mode"""
        if self.dispatcher.set_mode(mode):
            self.current_mode = mode
            mode_names = {
                DisplayMode.TERMINAL: "Terminal",
                DisplayMode.COCKPIT: "Cockpit", 
                DisplayMode.PPU: "PPU"
            }
            print(f"🎭 Switched to {mode_names[mode]} mode")
        else:
            print(f"❌ Failed to switch to {mode.value} mode")
    
    def cycle_modes(self):
        """Cycle through all display modes"""
        modes = [DisplayMode.TERMINAL, DisplayMode.COCKPIT, DisplayMode.PPU]
        current_index = modes.index(self.current_mode)
        next_index = (current_index + 1) % len(modes)
        self.switch_mode(modes[next_index])
    
    def _animation_loop(self):
        """Main animation loop"""
        last_update = time.time()
        update_interval = 1.0 / 30  # 30Hz updates
        
        while self.running:
            current_time = time.time()
            
            if current_time - last_update >= update_interval:
                self._update_demo_data()
                self._render_current_mode()
                last_update = current_time
            
            time.sleep(0.016)  # ~60Hz loop
    
    def _update_demo_data(self):
        """Update demo data with animations"""
        self.demo_counter += 1
        
        # Animate entities
        for entity in self.demo_entities:
            if entity['effect'] == 'sway':
                # Organic sway movement
                entity['x'] = 10 + int(time.time() * 2) % 3 - 1
            elif entity['effect'] == 'pulse':
                # Pulse effect (visual only)
                pass
            elif entity['effect'] == 'flicker':
                # Flicker visibility
                if random.random() > 0.7:
                    entity['x'] = random.randint(3, 17)
                    entity['y'] = random.randint(3, 15)
        
        # Animate meters
        self.demo_meters['fps'] = 55 + random.uniform(-5, 5)
        self.demo_meters['cpu'] = 40 + random.uniform(-10, 20)
        self.demo_meters['memory'] = 60 + random.uniform(-15, 25)
        self.demo_meters['render_time'] = 10 + random.uniform(-5, 10)
        self.demo_meters['packets'] = 25 + random.uniform(-10, 15)
        
        # Update labels
        self.demo_labels['time'] = f"🕐 {time.strftime('%H:%M:%S')}"
        self.demo_labels['mode'] = f"🎭 {self.current_mode.value.title()} Mode"
        
        if self.demo_counter % 60 == 0:  # Every 2 seconds
            status_messages = [
                "🎮 Demo Running",
                "📊 Processing Data",
                "🎨 Rendering Frames",
                "⚡ High Performance",
                "🔧 System Stable"
            ]
            self.demo_labels['status'] = random.choice(status_messages)
    
    def _render_current_mode(self):
        """Render data in current mode"""
        if self.current_mode == DisplayMode.TERMINAL:
            self._render_terminal()
        elif self.current_mode == DisplayMode.COCKPIT:
            self._render_cockpit()
        elif self.current_mode == DisplayMode.PPU:
            self._render_ppu()
    
    def _render_terminal(self):
        """Render in terminal mode"""
        # Create terminal packet with table data
        data = {
            'Demo Counter': self.demo_counter,
            'Active Entities': len(self.demo_entities),
            'Current Mode': self.current_mode.value,
            'FPS': f"{self.demo_meters['fps']:.1f}",
            'CPU Usage': f"{self.demo_meters['cpu']:.1f}%",
            'Memory': f"{self.demo_meters['memory']:.1f}%",
        }
        
        packet = create_terminal_packet(data, "🎮 Tri-Modal Demo Data")
        self.dispatcher.render(packet)
    
    def _render_cockpit(self):
        """Render in cockpit mode"""
        # Create cockpit packet with meters
        packet = create_cockpit_packet(self.demo_meters, self.demo_labels)
        self.dispatcher.render(packet)
    
    def _render_ppu(self):
        """Render in PPU mode"""
        # Create PPU packet with sprite layers
        layers = []
        
        # Add background
        layers.append({
            'depth': -1,
            'type': 'baked',
            'id': 'grass_bg',
            'x': 0, 'y': 0
        })
        
        # Add entities
        for entity in self.demo_entities:
            layers.append({
                'depth': 1,
                'type': 'dynamic',
                'id': entity['id'],
                'x': entity['x'],
                'y': entity['y'],
                'effect': entity['effect']
            })
        
        # HUD lines
        hud_lines = [
            f"DGT Demo - {self.current_mode.value.title()} Mode",
            f"Entities: {len(self.demo_entities)} | FPS: {self.demo_meters['fps']:.1f}",
            f"Counter: {self.demo_counter}",
            f"Time: {time.strftime('%H:%M:%S')}"
        ]
        
        packet = create_ppu_packet(layers, hud_lines)
        self.dispatcher.render(packet)
    
    def cleanup(self):
        """Cleanup demo resources"""
        print("🧹 Cleaning up demo...")
        self.running = False
        self.dispatcher.cleanup()
        print("✅ Demo cleanup complete")

def main():
    """Main entry point"""
    print("🎭 DGT Tri-Modal Display Suite Demo")
    print("=" * 50)
    
    demo = TriModalDemo()
    
    try:
        demo.run_demo()
    except KeyboardInterrupt:
        print("\n🛑 Demo interrupted by user")
    finally:
        demo.cleanup()
    
    print("👋 Demo ended. Thanks for trying the Tri-Modal Display Suite!")

if __name__ == "__main__":
    main()
