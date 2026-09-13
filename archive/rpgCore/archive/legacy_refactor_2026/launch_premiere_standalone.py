#!/usr/bin/env python3
"""
Launch Premiere Standalone - ADR 105: Volume 2 Finale (Minimal Dependencies)
Standalone demo showcasing the Intelligent Preview concept
"""

import sys
import os
import random
import time
from pathlib import Path
from typing import List, Dict, Any
from enum import Enum

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk, ImageDraw
import numpy as np
from loguru import logger


class AssetType(Enum):
    """Asset type enumeration"""
    OBJECT = "object"
    ACTOR = "actor"


class MaterialType(Enum):
    """Material type enumeration"""
    ORGANIC = "organic"
    WOOD = "wood"
    STONE = "stone"
    METAL = "metal"
    WATER = "water"
    FIRE = "fire"
    CRYSTAL = "crystal"
    VOID = "void"


class PreviewMode(Enum):
    """Preview display modes"""
    ORIGINAL = "original"
    DGTIFIED = "dgtified"
    KINETIC = "kinetic"


class MockAsset:
    """Mock asset for standalone demo"""
    
    def __init__(self, asset_id: str, material: MaterialType, asset_type: AssetType):
        self.asset_id = asset_id
        self.material = material
        self.asset_type = asset_type
        self.tags = ["showcase", "premiere", material.value]
        self.collision = random.random() > 0.5
        self.animated = random.random() > 0.7
        
        if self.animated:
            self.tags.append("animated")
        if self.collision:
            self.tags.append("collision")


class StandalonePreview:
    """Standalone preview implementation"""
    
    def __init__(self, canvas: tk.Canvas, size: Tuple[int, int] = (256, 256)):
        self.canvas = canvas
        self.size = size
        self.current_asset: Optional[MockAsset] = None
        self.animation_frame = 0
        self.is_animating = False
        self.animation_loop_id = None
        
    def set_asset(self, asset: MockAsset) -> None:
        """Set current asset for preview"""
        self.current_asset = asset
        self.animation_frame = 0
        
    def display_preview(self, mode: PreviewMode) -> None:
        """Display preview in specified mode"""
        if not self.current_asset:
            return
        
        if mode == PreviewMode.ORIGINAL:
            self._display_original()
        elif mode == PreviewMode.DGTIFIED:
            self._display_dgtified()
        elif mode == PreviewMode.KINETIC:
            self._display_kinetic()
            self.start_animation()
    
    def _display_original(self) -> None:
        """Display original asset"""
        self._draw_asset_base(self.current_asset, animate=False)
    
    def _display_dgtified(self) -> None:
        """Display DGT-ified asset with effects"""
        self._draw_asset_dgtified(self.current_asset)
    
    def _display_kinetic(self) -> None:
        """Display animated asset"""
        self._draw_asset_animated(self.current_asset)
    
    def _draw_asset_base(self, asset: MockAsset, animate: bool = False) -> None:
        """Draw base asset representation"""
        self.canvas.delete("all")
        
        # Calculate center position
        cx, cy = self.size[0] // 2, self.size[1] // 2
        size = 80
        
        # Apply animation offset if needed
        if animate and asset.animated:
            sway = int(10 * np.sin(2 * np.pi * self.animation_frame / 20))
            cx += sway
        
        # Draw based on asset type
        if asset.asset_type == AssetType.ACTOR:
            # Draw circle for actors
            self.canvas.create_oval(
                cx - size//2, cy - size//2,
                cx + size//2, cy + size//2,
                fill=self._get_material_color(asset.material),
                outline='#ffffff',
                width=2
            )
        else:
            # Draw square for objects
            self.canvas.create_rectangle(
                cx - size//2, cy - size//2,
                cx + size//2, cy + size//2,
                fill=self._get_material_color(asset.material),
                outline='#ffffff',
                width=2
            )
        
        # Draw shadow if collision
        if asset.collision:
            shadow_offset = size // 4
            self.canvas.create_oval(
                cx - size//3, cy + size//2 - shadow_offset//2,
                cx + size//3, cy + size//2 + shadow_offset//2,
                fill='#000000',
                outline='',
                stipple='gray50'
            )
        
        # Draw asset ID
        self.canvas.create_text(
            cx, cy + size//2 + 20,
            text=asset.asset_id.replace("premiere_", ""),
            fill='#ffffff',
            font=("Arial", 12, "bold")
        )
    
    def _draw_asset_dgtified(self, asset: MockAsset) -> None:
        """Draw DGT-ified asset with dithering"""
        self._draw_asset_base(asset, animate=False)
        
        # Add dithering effect
        cx, cy = self.size[0] // 2, self.size[1] // 2
        size = 80
        
        # Create dither pattern
        for i in range(0, size, 4):
            for j in range(0, size, 4):
                if (i + j) % 8 == 0:
                    x = cx - size//2 + i
                    y = cy - size//2 + j
                    self.canvas.create_rectangle(
                        x, y, x + 4, y + 4,
                        fill=self._get_dither_color(asset.material),
                        outline=''
                    )
    
    def _draw_asset_animated(self, asset: MockAsset) -> None:
        """Draw animated asset"""
        self._draw_asset_base(asset, animate=True)
        
        # Add animation indicators
        if asset.animated:
            cx, cy = self.size[0] // 2, self.size[1] // 2
            size = 80
            
            # Pulsing effect
            pulse = int(5 * np.sin(2 * np.pi * self.animation_frame / 10))
            
            self.canvas.create_oval(
                cx - size//2 - pulse, cy - size//2 - pulse,
                cx + size//2 + pulse, cy + size//2 + pulse,
                outline='#ffff00',
                width=2
            )
    
    def _get_material_color(self, material: MaterialType) -> str:
        """Get display color for material"""
        colors = {
            MaterialType.ORGANIC: '#2d5a27',
            MaterialType.WOOD: '#5d4037',
            MaterialType.STONE: '#757575',
            MaterialType.METAL: '#9e9e9e',
            MaterialType.WATER: '#4682b4',
            MaterialType.FIRE: '#ff4500',
            MaterialType.CRYSTAL: '#9370db',
            MaterialType.VOID: '#000000'
        }
        return colors.get(material, '#808080')
    
    def _get_dither_color(self, material: MaterialType) -> str:
        """Get dither color for material"""
        dither_colors = {
            MaterialType.ORGANIC: '#3a6b35',
            MaterialType.WOOD: '#6b5447',
            MaterialType.STONE: '#858585',
            MaterialType.METAL: '#aeaeae',
            MaterialType.WATER: '#6495ed',
            MaterialType.FIRE: '#ff8c00',
            MaterialType.CRYSTAL: '#ba55d3',
            MaterialType.VOID: '#1a1a1a'
        }
        return dither_colors.get(material, '#999999')
    
    def start_animation(self) -> None:
        """Start animation loop"""
        if self.is_animating or not self.current_asset or not self.current_asset.animated:
            return
        
        self.is_animating = True
        self._animate_frame()
    
    def _animate_frame(self) -> None:
        """Animate single frame"""
        if not self.is_animating:
            return
        
        self.animation_frame += 1
        self._display_kinetic()
        
        # Schedule next frame (2Hz = 500ms)
        self.animation_loop_id = self.canvas.after(500, self._animate_frame)
    
    def stop_animation(self) -> None:
        """Stop animation"""
        self.is_animating = False
        if self.animation_loop_id:
            self.canvas.after_cancel(self.animation_loop_id)
            self.animation_loop_id = None


class PremiereShowcaseStandalone:
    """Standalone Volume 2 Finale Showcase"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🎬 DGT Volume 2 Premiere - Standalone Showcase")
        self.root.geometry("1000x700")
        self.root.configure(bg='#1a1a1a')
        
        # Initialize components
        self.showcase_assets: List[MockAsset] = []
        self.current_asset_index = 0
        
        # Performance tracking
        self.start_time = time.time()
        self.frame_count = 0
        
        # Setup showcase UI
        self._setup_showcase_ui()
        
        # Generate showcase assets
        self._generate_showcase_assets()
        
        logger.info("🎬 Standalone Premiere Showcase initialized")
    
    def _setup_showcase_ui(self) -> None:
        """Setup the premiere showcase UI"""
        # Title header
        title_frame = tk.Frame(self.root, bg='#1a1a1a')
        title_frame.pack(fill=tk.X, padx=20, pady=(20, 10))
        
        title_label = tk.Label(
            title_frame,
            text="🏆 DGT Volume 2 Premiere - Standalone Showcase",
            font=("Arial", 18, "bold"),
            fg='#00ff00',
            bg='#1a1a1a'
        )
        title_label.pack()
        
        subtitle_label = tk.Label(
            title_frame,
            text="Volume 2 Finale - Intelligent Preview Concept Demo",
            font=("Arial", 11),
            fg='#888888',
            bg='#1a1a1a'
        )
        subtitle_label.pack()
        
        # Main content area
        content_frame = tk.Frame(self.root, bg='#1a1a1a')
        content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Left panel - Asset grid
        self._setup_asset_grid(content_frame)
        
        # Right panel - Live preview
        self._setup_preview_panel(content_frame)
        
        # Bottom panel - Controls and metrics
        self._setup_controls_panel()
    
    def _setup_asset_grid(self, parent: tk.Frame) -> None:
        """Setup asset grid display"""
        grid_frame = tk.Frame(parent, bg='#2a2a2a', relief=tk.RAISED, bd=2)
        grid_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        grid_label = tk.Label(
            grid_frame,
            text="🌾 Showcase Assets",
            font=("Arial", 14, "bold"),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        grid_label.pack(pady=10)
        
        # Canvas for asset grid
        self.grid_canvas = tk.Canvas(
            grid_frame,
            width=500,
            height=500,
            bg='#0a0a0a',
            highlightthickness=0
        )
        self.grid_canvas.pack(padx=10, pady=10)
        
        # Grid info
        self.grid_info_label = tk.Label(
            grid_frame,
            text="Loading assets...",
            font=("Arial", 10),
            fg='#888888',
            bg='#2a2a2a'
        )
        self.grid_info_label.pack(pady=(0, 10))
    
    def _setup_preview_panel(self, parent: tk.Frame) -> None:
        """Setup preview panel"""
        preview_frame = tk.Frame(parent, bg='#2a2a2a', relief=tk.RAISED, bd=2)
        preview_frame.pack(side=tk.RIGHT, fill=tk.BOTH, padx=(10, 0))
        
        preview_label = tk.Label(
            preview_frame,
            text="🔮 Preview Demo",
            font=("Arial", 14, "bold"),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        preview_label.pack(pady=10)
        
        # Preview mode selector
        mode_frame = tk.Frame(preview_frame, bg='#2a2a2a')
        mode_frame.pack(pady=5)
        
        tk.Label(
            mode_frame,
            text="Mode:",
            font=("Arial", 10),
            fg='#ffffff',
            bg='#2a2a2a'
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        self.preview_mode_var = tk.StringVar(value="kinetic")
        mode_combo = ttk.Combobox(
            mode_frame,
            textvariable=self.preview_mode_var,
            values=["original", "dgtified", "kinetic"],
            state="readonly",
            width=15
        )
        mode_combo.pack(side=tk.LEFT)
        mode_combo.bind("<<ComboboxSelected>>", self._on_preview_mode_change)
        
        # Preview canvas
        self.preview_canvas = tk.Canvas(
            preview_frame,
            width=300,
            height=300,
            bg='#0a0a0a',
            highlightthickness=2,
            highlightbackground='#00ff00'
        )
        self.preview_canvas.pack(padx=10, pady=10)
        
        # Initialize preview bridge
        self.preview_bridge = StandalonePreview(self.preview_canvas, (256, 256))
        
        # Asset info display
        info_frame = tk.Frame(preview_frame, bg='#2a2a2a')
        info_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.info_text = tk.Text(
            info_frame,
            width=35,
            height=8,
            bg='#0a0a0a',
            fg='#00ff00',
            font=("Courier", 9),
            relief=tk.FLAT
        )
        self.info_text.pack()
        
        # Control buttons
        control_frame = tk.Frame(preview_frame, bg='#2a2a2a')
        control_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Button(
            control_frame,
            text="🎲 Random Asset",
            command=self._show_random_asset,
            bg='#3a3a3a',
            fg='#ffffff',
            activebackground='#4a4a4a'
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        tk.Button(
            control_frame,
            text="▶️ Start Animation",
            command=self._start_animation,
            bg='#3a3a3a',
            fg='#ffffff',
            activebackground='#4a4a4a'
        ).pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            control_frame,
            text="⏸️ Stop Animation",
            command=self._stop_animation,
            bg='#3a3a3a',
            fg='#ffffff',
            activebackground='#4a4a4a'
        ).pack(side=tk.LEFT, padx=5)
    
    def _setup_controls_panel(self) -> None:
        """Setup controls and metrics panel"""
        controls_frame = tk.Frame(self.root, bg='#2a2a2a', relief=tk.RAISED, bd=2)
        controls_frame.pack(fill=tk.X, padx=20, pady=(0, 20))
        
        metrics_label = tk.Label(
            controls_frame,
            text="📊 Standalone Demo Metrics",
            font=("Arial", 12, "bold"),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        metrics_label.pack(side=tk.LEFT, padx=10, pady=5)
        
        self.metrics_label = tk.Label(
            controls_frame,
            text="Initializing...",
            font=("Courier", 10),
            fg='#ffffff',
            bg='#2a2a2a'
        )
        self.metrics_label.pack(side=tk.LEFT, padx=20, pady=5)
        
        # Volume 2 status
        status_label = tk.Label(
            controls_frame,
            text="🏆 Volume 2: Content Factory - COMPLETE",
            font=("Arial", 11, "bold"),
            fg='#ffff00',
            bg='#2a2a2a'
        )
        status_label.pack(side=tk.RIGHT, padx=10, pady=5)
    
    def _generate_showcase_assets(self) -> None:
        """Generate 10 random showcase assets"""
        logger.info("🎲 Generating standalone showcase assets...")
        
        materials = list(MaterialType)
        asset_types = list(AssetType)
        
        for i in range(10):
            material = random.choice(materials)
            asset_type = random.choice(asset_types)
            
            asset = MockAsset(
                asset_id=f"premiere_asset_{i:02d}",
                material=material,
                asset_type=asset_type
            )
            
            self.showcase_assets.append(asset)
        
        # Display assets in grid
        self._display_asset_grid()
        
        # Show first asset
        if self.showcase_assets:
            self._show_asset(self.showcase_assets[0])
        
        logger.info(f"✅ Generated {len(self.showcase_assets)} showcase assets")
    
    def _display_asset_grid(self) -> None:
        """Display assets in a grid layout"""
        self.grid_canvas.delete("all")
        
        cols = 4
        rows = 3
        cell_size = 50
        padding = 8
        
        for i, asset in enumerate(self.showcase_assets):
            row = i // cols
            col = i % cols
            
            x = padding + col * (cell_size + padding)
            y = padding + row * (cell_size + padding)
            
            # Draw asset background
            color = self._get_material_color(asset.material)
            outline_color = '#00ff00' if i == self.current_asset_index else '#444444'
            outline_width = 2 if i == self.current_asset_index else 1
            
            self.grid_canvas.create_rectangle(
                x, y, x + cell_size, y + cell_size,
                fill=color,
                outline=outline_color,
                width=outline_width,
                tags=f"asset_{i}"
            )
            
            # Draw asset icon
            self._draw_asset_icon(self.grid_canvas, x + cell_size//2, y + cell_size//2, asset)
            
            # Draw asset ID
            self.grid_canvas.create_text(
                x + cell_size//2,
                y + cell_size + 5,
                text=str(i),
                fill='#ffffff',
                font=("Arial", 8),
                tags=f"asset_{i}"
            )
            
            # Bind click event
            self.grid_canvas.tag_bind(f"asset_{i}", "<Button-1>", lambda e, idx=i: self._show_asset_by_index(idx))
        
        self.grid_info_label.config(text=f"Displaying {len(self.showcase_assets)} assets")
    
    def _draw_asset_icon(self, canvas: tk.Canvas, x: int, y: int, asset: MockAsset) -> None:
        """Draw simple icon representation"""
        size = 15
        
        if asset.asset_type == AssetType.ACTOR:
            canvas.create_oval(
                x - size//2, y - size//2,
                x + size//2, y + size//2,
                fill='#ffffff',
                outline=''
            )
        else:
            canvas.create_rectangle(
                x - size//2, y - size//2,
                x + size//2, y + size//2,
                fill='#ffffff',
                outline=''
            )
        
        # Add indicators
        if asset.animated:
            canvas.create_text(
                x + size//2 - 3, y - size//2 + 3,
                text="🎬",
                font=("Arial", 6),
                fill='#ffff00'
            )
        
        if asset.collision:
            canvas.create_text(
                x - size//2 + 3, y - size//2 + 3,
                text="🚫",
                font=("Arial", 6),
                fill='#ff0000'
            )
    
    def _get_material_color(self, material: MaterialType) -> str:
        """Get display color for material"""
        colors = {
            MaterialType.ORGANIC: '#2d5a27',
            MaterialType.WOOD: '#5d4037',
            MaterialType.STONE: '#757575',
            MaterialType.METAL: '#9e9e9e',
            MaterialType.WATER: '#4682b4',
            MaterialType.FIRE: '#ff4500',
            MaterialType.CRYSTAL: '#9370db',
            MaterialType.VOID: '#000000'
        }
        return colors.get(material, '#808080')
    
    def _show_asset(self, asset: MockAsset) -> None:
        """Show specific asset"""
        if asset in self.showcase_assets:
            self.current_asset_index = self.showcase_assets.index(asset)
        
        self.preview_bridge.set_asset(asset)
        self._on_preview_mode_change(None)
        self._update_info_display(asset)
        self._display_asset_grid()
    
    def _show_asset_by_index(self, index: int) -> None:
        """Show asset by index"""
        if 0 <= index < len(self.showcase_assets):
            self._show_asset(self.showcase_assets[index])
    
    def _show_random_asset(self) -> None:
        """Show random asset"""
        if self.showcase_assets:
            asset = random.choice(self.showcase_assets)
            self._show_asset(asset)
    
    def _on_preview_mode_change(self, event) -> None:
        """Handle preview mode change"""
        mode_map = {
            "original": PreviewMode.ORIGINAL,
            "dgtified": PreviewMode.DGTIFIED,
            "kinetic": PreviewMode.KINETIC
        }
        
        selected_mode = self.preview_mode_var.get()
        if selected_mode in mode_map:
            self.preview_bridge.display_preview(mode_map[selected_mode])
    
    def _update_info_display(self, asset: MockAsset) -> None:
        """Update asset info display"""
        info_text = f"""Asset Information
═══════════════════════════
ID: {asset.asset_id}
Type: {asset.asset_type.value}
Material: {asset.material.value}
Tags: {', '.join(asset.tags)}

Demo Features
═══════════════════════════
Animated: {'Yes' if asset.animated else 'No'}
Collision: {'Yes' if asset.collision else 'No'}
Shadow: {'Auto' if asset.collision else 'None'}

Standalone Demo
═══════════════════════════
Mode: {self.preview_mode_var.get()}
Framework: Pure Python + Tkinter
Dependencies: Minimal
Status: Volume 2 Complete
"""
        
        self.info_text.delete(1.0, tk.END)
        self.info_text.insert(1.0, info_text)
    
    def _start_animation(self) -> None:
        """Start animation"""
        self.preview_bridge.start_animation()
    
    def _stop_animation(self) -> None:
        """Stop animation"""
        self.preview_bridge.stop_animation()
    
    def _update_metrics(self) -> None:
        """Update metrics display"""
        elapsed = time.time() - self.start_time
        
        metrics_text = (
            f"Runtime: {elapsed:.1f}s | "
            f"Assets: {len(self.showcase_assets)} | "
            f"Current: {self.current_asset_index + 1}/{len(self.showcase_assets)} | "
            f"FPS: {self.frame_count / max(elapsed, 0.1):.1f}"
        )
        
        self.metrics_label.config(text=metrics_text)
        
        # Schedule next update
        self.root.after(100, self._update_metrics)
        self.frame_count += 1
    
    def _auto_cycle_assets(self) -> None:
        """Automatically cycle through assets"""
        if self.showcase_assets:
            next_index = (self.current_asset_index + 1) % len(self.showcase_assets)
            self._show_asset_by_index(next_index)
        
        # Schedule next cycle
        self.root.after(3000, self._auto_cycle_assets)
    
    def run(self) -> None:
        """Run the standalone showcase"""
        logger.info("🎬 Starting DGT Volume 2 Standalone Showcase")
        
        # Start metrics updates
        self._update_metrics()
        
        # Start animation after 1 second
        self.root.after(1000, self._start_animation)
        
        # Auto-cycle through assets
        self._auto_cycle_assets()
        
        # Run the main loop
        self.root.mainloop()


def main():
    """Main entry point for standalone premiere"""
    print("🎬 DGT Volume 2 Premiere - Standalone Showcase")
    print("=" * 60)
    print("🏆 Volume 2 Finale Features (Standalone):")
    print("  ✅ SOLID Architecture Concept")
    print("  ✅ Intelligent Preview Demo")
    print("  ✅ 2Hz Animation System")
    print("  ✅ Shadow Detection Logic")
    print("  ✅ Material-Based Rendering")
    print("  ✅ Minimal Dependencies")
    print("")
    print("🎮 What You'll See:")
    print("  • 10 showcase assets with different materials")
    print("  • Three preview modes: Original, DGT-ified, Kinetic")
    print("  • 2Hz animation for animated assets")
    print("  • Auto-cycling through assets")
    print("  • Standalone demo with minimal dependencies")
    print("")
    print("🚀 Launching Standalone Premiere...")
    
    # Create and run showcase
    showcase = PremiereShowcaseStandalone()
    showcase.run()


if __name__ == "__main__":
    main()
