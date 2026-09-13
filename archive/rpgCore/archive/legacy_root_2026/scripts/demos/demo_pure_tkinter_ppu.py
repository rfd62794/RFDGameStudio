"""
Pure Tkinter PPU Demo - Showcasing Native Raster Pipeline
ADR 075: Eliminate PIL dependencies, use native tk.PhotoImage and Canvas layering

This demo demonstrates:
1. Pure Tkinter PPU with native PhotoImage sprites
2. Enhanced object DNA with D20 interaction system
3. Canvas-based layering without PIL compositing
4. Performance monitoring and entity management
"""

import sys
import os
import tkinter as tk
from tkinter import ttk
import time
import random
from loguru import logger

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Try new tri-modal engine first, fallback to legacy
try:
    from engines.body import PPUBody, create_ppu_body, DisplayMode
    TRI_MODAL_ENGINE = True
except ImportError:
    # Fallback to legacy graphics
    from graphics.ppu_tk_native import NativeTkinterGameWindow, RenderEntity, RenderLayer
    TRI_MODAL_ENGINE = False

from utils.asset_loader import AssetLoader

class PureTkinterDemo:
    """Demo application showcasing Pure Tkinter PPU with Object DNA"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Pure Tkinter PPU Demo - Enhanced Object DNA")
        self.root.resizable(False, False)
        
        # Create main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Create PPU window (tri-modal or legacy)
        if TRI_MODAL_ENGINE:
            self.ppu_body = create_ppu_body()
            if self.ppu_body:
                self.ppu_window = self.ppu_body  # Use body as interface
                logger.info("🎭 Using Tri-Modal PPU Body")
            else:
                logger.warning("⚠️ Failed to create PPU body, falling back to legacy")
                self.ppu_window = NativeTkinterGameWindow("Pure Tkinter PPU")
                TRI_MODAL_ENGINE = False
        else:
            self.ppu_window = NativeTkinterGameWindow("Pure Tkinter PPU")
        
        # Asset loader for object DNA
        self.asset_loader = AssetLoader()
        
        # Demo state
        self.demo_objects = []
        self.selected_object = None
        self.animation_frame = 0
        
        # Create UI controls
        self._create_ui(main_frame)
        
        # Initialize demo scene
        self._initialize_demo_scene()
        
        # Start animation loop
        self._animate()
        
        print("🎮 Pure Tkinter PPU Demo initialized")
    
    def _create_ui(self, parent):
        """Create demo UI controls"""
        # Info panel
        info_frame = ttk.LabelFrame(parent, text="System Information", padding="10")
        info_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        ttk.Label(info_frame, text="🎨 Pure Tkinter PPU - No PIL Dependencies").grid(row=0, column=0, sticky=tk.W)
        ttk.Label(info_frame, text="🧬 Enhanced Object DNA with D20 System").grid(row=1, column=0, sticky=tk.W)
        ttk.Label(info_frame, text="📊 Native PhotoImage Sprites + Canvas Layering").grid(row=2, column=0, sticky=tk.W)
        
        # Object selector
        selector_frame = ttk.LabelFrame(parent, text="Object DNA Viewer", padding="10")
        selector_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        
        ttk.Label(selector_frame, text="Select Object:").grid(row=0, column=0, sticky=tk.W)
        
        self.object_var = tk.StringVar()
        object_names = sorted([obj.asset_id for obj in self.asset_loader.get_spawnable_objects()])
        self.object_combo = ttk.Combobox(selector_frame, textvariable=self.object_var, values=object_names, width=20)
        self.object_combo.grid(row=0, column=1, padx=5)
        self.object_combo.bind('<<ComboboxSelected>>', self._on_object_selected)
        
        # Object details
        self.details_text = tk.Text(selector_frame, width=40, height=12, wrap=tk.WORD)
        self.details_text.grid(row=1, column=0, columnspan=2, pady=5)
        
        # Controls
        control_frame = ttk.LabelFrame(parent, text="Demo Controls", padding="10")
        control_frame.grid(row=1, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5, padx=5)
        
        ttk.Button(control_frame, text="Add Random Object", command=self._add_random_object).grid(row=0, column=0, pady=2)
        ttk.Button(control_frame, text="Clear Scene", command=self._clear_scene).grid(row=1, column=0, pady=2)
        ttk.Button(control_frame, text="Animate Voyager", command=self._animate_voyager).grid(row=2, column=0, pady=2)
        ttk.Button(control_frame, text="Show Performance", command=self._show_performance).grid(row=3, column=0, pady=2)
        
        # Performance display
        self.perf_label = ttk.Label(control_frame, text="Ready", font=('Courier', 10))
        self.perf_label.grid(row=4, column=0, pady=10)
    
    def _initialize_demo_scene(self):
        """Initialize demo scene with some objects"""
        # Add background tiles
        for x in range(20):
            for y in range(18):
                tile_type = random.choice(['grass', 'stone', 'dirt'])
                entity = RenderEntity(
                    (x, y),
                    f'tile_{tile_type}',
                    RenderLayer.BACKGROUND
                )
                self.ppu_window.ppu.add_entity(entity)
        
        # Add some initial objects
        initial_objects = [
            ('object_tree', (3, 3)),
            ('object_boulder', (7, 5)),
            ('object_chest', (12, 8)),
            ('object_campfire', (15, 10)),
            ('actor_voyager', (10, 10))
        ]
        
        for sprite_id, pos in initial_objects:
            layer = RenderLayer.FRINGE if sprite_id.startswith('object_') else RenderLayer.ACTORS
            entity = RenderEntity(pos, sprite_id, layer)
            canvas_id = self.ppu_window.ppu.add_entity(entity)
            self.demo_objects.append({'entity': entity, 'canvas_id': canvas_id})
        
        print("🎨 Demo scene initialized with background and objects")
    
    def _on_object_selected(self, event):
        """Handle object selection from combo box"""
        object_name = self.object_var.get()
        if not object_name:
            return
        
        obj_def = self.asset_loader.get_asset_definition(object_name)
        if obj_def and obj_def.characteristics:
            char = obj_def.characteristics
            
            # Format object DNA details
            details = f"📦 {object_name.upper()}\n"
            details += f"{'='*30}\n"
            details += f"Material: {char.material}\n"
            details += f"State: {char.state}\n"
            details += f"Integrity: {char.integrity}\n"
            details += f"Rarity: {char.rarity:.2f}\n\n"
            
            details += f"Tags: {', '.join(char.tags[:4])}\n\n"
            
            if hasattr(char, 'resistances'):
                details += f"Resistances: {', '.join(char.resistances)}\n"
            
            if hasattr(char, 'weaknesses'):
                details += f"Weaknesses: {', '.join(char.weaknesses)}\n"
            
            if hasattr(char, 'd20_checks') and char.d20_checks:
                details += f"\nD20 Interactions:\n"
                for check_name, check_data in char.d20_checks.items():
                    details += f"  • {check_name}: DC {check_data['difficulty']} ({check_data['skill']})\n"
            
            if obj_def.metadata:
                details += f"\nMetadata:\n"
                for key, value in obj_def.metadata.items():
                    details += f"  • {key}: {value}\n"
            
            # Update details display
            self.details_text.delete(1.0, tk.END)
            self.details_text.insert(1.0, details)
    
    def _add_random_object(self):
        """Add a random object to the scene"""
        spawnable_objects = self.asset_loader.get_spawnable_objects()
        if not spawnable_objects:
            return
        
        obj_def = random.choice(spawnable_objects)
        
        # Find random position
        pos = (random.randint(0, 19), random.randint(0, 17))
        
        # Create entity
        entity = RenderEntity(pos, obj_def.asset_id, RenderLayer.FRINGE)
        canvas_id = self.ppu_window.ppu.add_entity(entity)
        
        self.demo_objects.append({'entity': entity, 'canvas_id': canvas_id})
        
        # Update selector
        self.object_var.set(obj_def.asset_id)
        self._on_object_selected(None)
        
        print(f"➕ Added {obj_def.asset_id} at {pos}")
    
    def _clear_scene(self):
        """Clear all demo objects (keep background)"""
        # Remove all demo objects
        for obj_data in self.demo_objects:
            self.ppu_window.ppu.remove_entity(obj_data['entity'].world_pos)
        
        self.demo_objects.clear()
        
        # Keep only Voyager
        voyager_entity = RenderEntity((10, 10), 'actor_voyager', RenderLayer.ACTORS)
        canvas_id = self.ppu_window.ppu.add_entity(voyager_entity)
        self.demo_objects.append({'entity': voyager_entity, 'canvas_id': canvas_id})
        
        print("🧹 Scene cleared (background preserved)")
    
    def _animate_voyager(self):
        """Animate Voyager movement"""
        if not self.demo_objects:
            return
        
        # Find Voyager
        voyager_data = None
        for obj_data in self.demo_objects:
            if obj_data['entity'].sprite_id == 'actor_voyager':
                voyager_data = obj_data
                break
        
        if not voyager_data:
            return
        
        # Random movement
        current_pos = voyager_data['entity'].world_pos
        new_x = max(0, min(19, current_pos[0] + random.randint(-2, 2)))
        new_y = max(0, min(17, current_pos[1] + random.randint(-2, 2)))
        new_pos = (new_x, new_y)
        
        # Update position
        self.ppu_window.ppu.update_entity_position(current_pos, new_pos)
        voyager_data['entity'].world_pos = new_pos
        
        print(f"🚶 Voyager moved from {current_pos} to {new_pos}")
    
    def _show_performance(self):
        """Show performance statistics"""
        stats = self.ppu_window.ppu.get_performance_stats()
        
        perf_info = f"Performance Stats:\n"
        perf_info += f"FPS: {stats['fps']:.1f}\n"
        perf_info += f"Avg FPS: {stats['avg_fps']:.1f}\n"
        perf_info += f"Entities: {stats['entities']}\n"
        perf_info += f"Sprites: {stats['sprites']}\n"
        
        self.perf_label.config(text=perf_info)
        
        print(f"📊 {perf_info}")
    
    def _animate(self):
        """Animation loop"""
        self.animation_frame += 1
        
        # Update performance display every 30 frames
        if self.animation_frame % 30 == 0:
            stats = self.ppu_window.ppu.get_performance_stats()
            self.perf_label.config(text=f"FPS: {stats['fps']:.1f} | Entities: {stats['entities']}")
        
        # Schedule next animation
        self.root.after(16, self._animate)  # ~60 FPS
    
    def run(self):
        """Run the demo"""
        print("🎮 Starting Pure Tkinter PPU Demo...")
        print("📋 Features:")
        print("  • Pure Tkinter PPU (no PIL)")
        print("  • Native PhotoImage sprites")
        print("  • Enhanced Object DNA system")
        print("  • D20 interaction framework")
        print("  • Canvas-based layering")
        print("  • Performance monitoring")
        print("\n🎯 Try the controls to explore the system!")
        
        self.ppu_window.run()

if __name__ == "__main__":
    demo = PureTkinterDemo()
    demo.run()
