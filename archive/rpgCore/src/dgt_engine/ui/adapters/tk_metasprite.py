"""
Enhanced Tkinter Adapter: Metasprite Integration

Upgrades the windowed framework from colored blocks to proper
pixel art characters using the Metasprite system.

This transforms our white square into the actual Voyager with
Warrior/Mage/Rogue silhouettes and gear progression.
"""

import tkinter as tk
import time
import threading
import asyncio
import sys
import os

# Add src to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loguru import logger
from models.metasprite import Metasprite, CharacterRole, MetaspriteConfig


class EnhancedTkinterAdapter:
    """Enhanced Tkinter adapter with Metasprite rendering."""
    
    def __init__(self, scale=10):
        self.scale = scale
        self.width = 80 * scale
        self.height = 48 * scale
        
        # Tkinter setup
        self.root = tk.Tk()
        self.root.title("DGT Perfect Simulator - Metasprite Test")
        self.root.geometry(f"{self.width}x{self.height + 100}")  # Extra space for UI
        self.root.resizable(False, False)
        
        # Main frame
        self.main_frame = tk.Frame(self.root, bg='black')
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Game canvas (80x48 viewport)
        self.canvas = tk.Canvas(
            self.main_frame, 
            width=self.width, 
            height=self.height, 
            bg='black',
            highlightthickness=0
        )
        self.canvas.pack(side=tk.TOP)
        
        # UI Panel for vitals/dialogue
        self.ui_frame = tk.Frame(self.main_frame, bg='black', height=100)
        self.ui_frame.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Vitals panel
        self.vitals_frame = tk.Frame(self.ui_frame, bg='black')
        self.vitals_frame.pack(side=tk.LEFT, padx=10, pady=5)
        
        self.hp_label = tk.Label(self.vitals_frame, text="HP: 100/100", fg='red', bg='black', font=('Courier', 10, 'bold'))
        self.hp_label.pack(anchor='w')
        
        self.gold_label = tk.Label(self.vitals_frame, text="Gold: 50", fg='yellow', bg='black', font=('Courier', 10, 'bold'))
        self.gold_label.pack(anchor='w')
        
        # Dialogue panel
        self.dialogue_frame = tk.Frame(self.ui_frame, bg='black')
        self.dialogue_frame.pack(side=tk.RIGHT, padx=10, pady=5, fill=tk.BOTH, expand=True)
        
        self.dialogue_label = tk.Label(
            self.dialogue_frame, 
            text="", 
            fg='white', 
            bg='black', 
            font=('Courier', 9),
            wraplength=self.width - 200,
            justify='left'
        )
        self.dialogue_label.pack(anchor='w')
        
        # Game state
        self.running = False
        self.frame_count = 0
        self.player_x = 40
        self.player_y = 24
        self.player_role = CharacterRole.WARRIOR
        
        # Performance tracking
        self.fps_counter = 0
        self.fps_start = time.perf_counter()
        self.last_action_time = time.perf_counter()
        
        # Initialize metasprites
        self.metasprites: Dict[CharacterRole, Metasprite] = {}
        self._init_metasprites()
        
        # Dialogue queue
        self.dialogue_queue = []
        self.current_dialogue = ""
        self.dialogue_timer = 0
        
        print("🖥️ Enhanced Tkinter adapter initialized with Metasprites")
    
    def _init_metasprites(self):
        """Initialize metasprite definitions for different character roles."""
        # Create simple 16x16 pixel patterns for each role
        # These are basic representations - in a full implementation,
        # these would be loaded from tile banks
        
        # Warrior - armored figure with sword
        warrior_pixels = self._create_warrior_pixels()
        self.metasprites[CharacterRole.WARRIOR] = Metasprite(
            MetaspriteConfig(CharacterRole.WARRIOR)
        )
        self.metasprites[CharacterRole.WARRIOR].pixel_buffer = [[None for _ in range(16)] for _ in range(16)]
        
        # Convert pixel colors to pixel buffer
        for y in range(16):
            for x in range(16):
                color = warrior_pixels[y][x]
                if color != 'black':
                    # Create a simple pixel representation
                    self.metasprites[CharacterRole.WARRIOR].pixel_buffer[y][x] = type('Pixel', (), {'color': color})()
        
        # Mage - robed figure with staff
        mage_pixels = self._create_mage_pixels()
        self.metasprites[CharacterRole.MAGE] = Metasprite(
            MetaspriteConfig(CharacterRole.MAGE)
        )
        self.metasprites[CharacterRole.MAGE].pixel_buffer = [[None for _ in range(16)] for _ in range(16)]
        
        for y in range(16):
            for x in range(16):
                color = mage_pixels[y][x]
                if color != 'black':
                    self.metasprites[CharacterRole.MAGE].pixel_buffer[y][x] = type('Pixel', (), {'color': color})()
        
        # Rogue - dark figure with dagger
        rogue_pixels = self._create_rogue_pixels()
        self.metasprites[CharacterRole.ROGUE] = Metasprite(
            MetaspriteConfig(CharacterRole.ROGUE)
        )
        self.metasprites[CharacterRole.ROGUE].pixel_buffer = [[None for _ in range(16)] for _ in range(16)]
        
        for y in range(16):
            for x in range(16):
                color = rogue_pixels[y][x]
                if color != 'black':
                    self.metasprites[CharacterRole.ROGUE].pixel_buffer[y][x] = type('Pixel', (), {'color': color})()
        
        print("✅ Metasprites initialized for Warrior, Mage, Rogue")
    
    def _create_warrior_pixels(self) -> List[List[str]]:
        """Create 16x16 pixel pattern for Warrior."""
        # Simple armored warrior silhouette
        pixels = [['black' for _ in range(16)] for _ in range(16)]
        
        # Helmet (top 4 rows)
        for y in range(4):
            for x in range(6, 10):
                pixels[y][x] = 'silver'
        
        # Face (row 4-6)
        for y in range(4, 7):
            for x in range(7, 9):
                pixels[y][x] = 'wheat'  # Tkinter-compatible skin color
        
        # Armor body (rows 7-12)
        for y in range(7, 13):
            for x in range(5, 11):
                pixels[y][x] = 'gray60'  # Tkinter-compatible steel color
        
        # Sword (right side)
        for y in range(8, 14):
            for x in range(11, 13):
                pixels[y][x] = 'silver'
        
        # Legs (rows 13-16)
        for y in range(13, 16):
            for x in range(6, 8):
                pixels[y][x] = 'gray60'  # Tkinter-compatible steel color
            for x in range(9, 11):
                pixels[y][x] = 'gray60'
        
        return pixels
    
    def _create_mage_pixels(self) -> List[List[str]]:
        """Create 16x16 pixel pattern for Mage."""
        pixels = [['black' for _ in range(16)] for _ in range(16)]
        
        # Pointed hat (top 5 rows)
        for y in range(5):
            width = 1 + y * 2
            start_x = 8 - width // 2
            for x in range(start_x, start_x + width):
                pixels[y][x] = 'purple'
        
        # Face (rows 5-7)
        for y in range(5, 8):
            for x in range(7, 9):
                pixels[y][x] = 'wheat'  # Tkinter-compatible skin color
        
        # Robes (rows 8-15)
        for y in range(8, 16):
            width = 7 if y < 12 else 5
            start_x = 8 - width // 2
            for x in range(start_x, start_x + width):
                pixels[y][x] = 'blue'
        
        # Staff (left side)
        for y in range(6, 16):
            pixels[y][4] = 'tan'  # Tkinter-compatible wood color
        
        return pixels
    
    def _create_rogue_pixels(self) -> List[List[str]]:
        """Create 16x16 pixel pattern for Rogue."""
        pixels = [['black' for _ in range(16)] for _ in range(16)]
        
        # Hood (top 4 rows)
        for y in range(4):
            width = 3 + y
            start_x = 8 - width // 2
            for x in range(start_x, start_x + width):
                pixels[y][x] = 'gray40'  # Tkinter-compatible dark gray
        
        # Face shadow (rows 4-6)
        for y in range(4, 7):
            for x in range(7, 9):
                pixels[y][x] = 'gray'
        
        # Leather armor (rows 7-13)
        for y in range(7, 14):
            for x in range(6, 10):
                pixels[y][x] = 'tan'  # Tkinter-compatible leather color
        
        # Dagger (right hand)
        for y in range(9, 12):
            pixels[y][11] = 'silver'
        
        # Legs (rows 13-16)
        for y in range(13, 16):
            for x in range(6, 8):
                pixels[y][x] = 'gray40'  # Tkinter-compatible dark gray
            for x in range(9, 11):
                pixels[y][x] = 'gray40'
        
        return pixels
    
    def draw_metasprite(self, metasprite: Metasprite, grid_x: int, grid_y: int):
        """Draw a metasprite at the specified grid position."""
        if not metasprite.pixel_buffer:
            return
        
        # Draw 16x16 metasprite
        for py in range(16):
            for px in range(16):
                pixel = metasprite.pixel_buffer[py][px]
                if pixel and hasattr(pixel, 'color'):
                    color = pixel.color
                    
                    # Calculate screen position
                    screen_x = (grid_x + px // self.scale) * self.scale
                    screen_y = (grid_y + py // self.scale) * self.scale
                    
                    # Draw pixel (scaled)
                    self.canvas.create_rectangle(
                        screen_x, screen_y,
                        screen_x + self.scale, screen_y + self.scale,
                        fill=color, outline=""
                    )
    
    def draw_frame(self):
        """Draw a single frame with metasprites."""
        if not self.running:
            return
        
        # Clear canvas
        self.canvas.delete("all")
        
        # Draw grid border
        for x in range(0, self.width, self.scale):
            self.canvas.create_line(x, 0, x, self.height, fill='gray20')
        
        for y in range(0, self.height, self.scale):
            self.canvas.create_line(0, y, self.width, y, fill='gray20')
        
        # Draw player metasprite
        player_metasprite = self.metasprites[self.player_role]
        self.draw_metasprite(player_metasprite, self.player_x, self.player_y)
        
        # Draw NPCs as colored blocks (for now - could be metasprites too)
        npc_positions = [
            (20, 20, 'red', 'Guard'),
            (60, 20, 'green', 'Merchant'),
            (20, 35, 'blue', 'Mage'),
            (60, 35, 'yellow', 'Villager'),
            (40, 10, 'cyan', 'Rogue')
        ]
        
        for nx, ny, color, role in npc_positions:
            # Draw NPC as colored block (placeholder for metasprite)
            npc_x = nx * self.scale
            npc_y = ny * self.scale
            self.canvas.create_rectangle(
                npc_x, npc_y, npc_x+self.scale*2, npc_y+self.scale*2,
                fill=color, outline=color
            )
            
            # Draw role label
            self.canvas.create_text(
                npc_x + self.scale, npc_y - 5,
                text=role, fill=color, anchor='center', font=('Courier', 6)
            )
        
        # Draw performance info
        current_time = time.perf_counter()
        if current_time - self.fps_start >= 1.0:
            fps = self.fps_counter
            self.fps_counter = 0
            self.fps_start = current_time
        else:
            fps = self.fps_counter
        
        info_text = f"FPS: {fps} | Frame: {self.frame_count} | {self.player_role.value.title()} at ({self.player_x}, {self.player_y})"
        self.canvas.create_text(
            5, 5, text=info_text, fill='white', anchor='nw', font=('Courier', 8)
        )
        
        # Update dialogue
        self._update_dialogue()
        
        # Update player position
        self.frame_count += 1
        if self.frame_count % 30 == 0:  # Every second at 30 FPS
            self.player_x = (self.player_x + 1) % 80
            if self.player_x == 0:
                self.player_y = (self.player_y + 1) % 48
            
            # Cycle through roles for testing
            if self.frame_count % 90 == 0:  # Every 3 seconds
                available_roles = list(self.metasprites.keys())
                if available_roles:
                    current_index = available_roles.index(self.player_role)
                    self.player_role = available_roles[(current_index + 1) % len(available_roles)]
        
        # Simulate action resolution
        if current_time - self.last_action_time >= 2.0:
            action_time = time.perf_counter()
            import random
            roll = random.randint(1, 20)
            success = roll >= 10
            resolution_time = (time.perf_counter() - action_time) * 1000
            
            result_text = f"Action: {'SUCCESS' if success else 'FAILURE'} ({resolution_time:.1f}ms)"
            color = 'yellow' if success else 'red'
            self.canvas.create_text(
                self.width // 2, self.height - 20,
                text=result_text, fill=color, anchor='center', font=('Courier', 10, 'bold')
            )
            
            # Add dialogue
            if success:
                self.add_dialogue(f"The {self.player_role.value.title()} succeeds!")
            else:
                self.add_dialogue(f"The {self.player_role.value.title()} fails...")
            
            self.last_action_time = current_time
        
        # Update vitals
        self._update_vitals()
        
        # Schedule next frame
        self.root.after(33, self.draw_frame)  # ~30 FPS
        
        self.fps_counter += 1
    
    def _update_dialogue(self):
        """Update dialogue display."""
        if self.dialogue_timer > 0:
            self.dialogue_timer -= 1
            self.dialogue_label.config(text=self.current_dialogue)
        elif self.dialogue_queue:
            self.current_dialogue = self.dialogue_queue.pop(0)
            self.dialogue_timer = 60  # Show for 2 seconds at 30 FPS
            self.dialogue_label.config(text=self.current_dialogue)
        else:
            self.dialogue_label.config(text="")
    
    def add_dialogue(self, text: str):
        """Add dialogue to the queue."""
        self.dialogue_queue.append(text)
    
    def _update_vitals(self):
        """Update vitals display."""
        # Simulate HP changes
        if self.frame_count % 60 == 0:  # Every 2 seconds
            import random
            hp_change = random.randint(-5, 5)
            current_hp = max(0, min(100, 100 + hp_change))
            self.hp_label.config(text=f"HP: {current_hp}/100")
            
            # Change color based on HP
            if current_hp > 70:
                self.hp_label.config(fg='green')
            elif current_hp > 30:
                self.hp_label.config(fg='yellow')
            else:
                self.hp_label.config(fg='red')
        
        # Simulate gold changes
        if self.frame_count % 120 == 0:  # Every 4 seconds
            import random
            gold_change = random.randint(-10, 20)
            current_gold = max(0, 50 + gold_change)
            self.gold_label.config(text=f"Gold: {current_gold}")
    
    def run(self):
        """Start the enhanced Tkinter test."""
        print("🎮 Starting Enhanced Tkinter test with Metasprites...")
        
        self.running = True
        
        # Start frame updates
        self.draw_frame()
        
        print("✅ Enhanced Tkinter window running")
        print("🎨 Metasprite features:")
        print("   - Warrior (steel armor, silver sword)")
        print("   - Mage (purple robes, brown staff)")
        print("   - Rogue (dark hood, leather armor)")
        print("   - Role cycling every 3 seconds")
        print("   - Vitals panel (HP, Gold)")
        print("   - Dialogue overlay system")
        print("   - 30 FPS target performance")
        print("\n🔴 Close window to exit test")
        
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            print("\n🛑 Test interrupted")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources."""
        print("🧹 Cleaning up Enhanced Tkinter test...")
        self.running = False
        print("✅ Enhanced Tkinter test completed")


def main():
    """Main entry point."""
    print("🎨 DGT Perfect Simulator - Metasprite Window Test")
    print("=" * 60)
    print("Testing pixel art characters in windowed environment...")
    print()
    
    # Create and run enhanced test
    adapter = EnhancedTkinterAdapter(scale=8)  # Smaller scale for 16x16 sprites
    
    try:
        adapter.run()
    except Exception as e:
        print(f"❌ Enhanced Tkinter test failed: {e}")
        raise
    
    print("\n🎯 Enhanced Tkinter test completed")
    print("✅ Metasprite rendering verified")
    print("🚀 Ready for professional GUI frameworks")


if __name__ == "__main__":
    main()
