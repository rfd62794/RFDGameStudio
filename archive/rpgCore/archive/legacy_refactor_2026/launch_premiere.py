#!/usr/bin/env python3
"""
Launch Premiere - ADR 105: The Volume 2 Finale
Showcase the complete Intelligent Preview pipeline with 10 random harvested assets
"""

import sys
import os
import random
import time
from pathlib import Path
from typing import List, Dict, Any

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import directly without relative imports
try:
    from tools.asset_ingestor_intelligent import create_asset_ingestor_intelligent
    from tools.optimized_image_processor import OptimizedImageProcessor
    from tools.asset_models import HarvestedAsset, AssetMetadata, AssetType, MaterialType, SpriteSlice
    from graphics.ppu_intelligent_preview import IntelligentPreviewBridge, PreviewMode
    
    # Full-featured demo
    class PremiereShowcase:
        """Volume 2 Finale Showcase - Dancing Assets Demo"""
        self.root.geometry("1200x800")
        self.root.configure(bg='#1a1a1a')
        
        # Initialize components
        self.image_processor = OptimizedImageProcessor(enable_profiling=True)
        self.showcase_assets: List[HarvestedAsset] = []
        
        # Performance tracking
        self.start_time = time.time()
        self.frame_count = 0
        
        # Setup showcase UI
        self._setup_showcase_ui()
        
        # Generate showcase assets
        self._generate_showcase_assets()
        
        logger.info("🎬 Premiere Showcase initialized")
    
    def _setup_showcase_ui(self) -> None:
        """Setup the premiere showcase UI"""
        # Title header
        title_frame = tk.Frame(self.root, bg='#1a1a1a')
        title_frame.pack(fill=tk.X, padx=20, pady=(20, 10))
        
        title_label = tk.Label(
            title_frame,
            text="🏆 DGT Volume 2 Premiere - Intelligent Preview Showcase",
            font=("Arial", 20, "bold"),
            fg='#00ff00',
            bg='#1a1a1a'
        )
        title_label.pack()
        
        subtitle_label = tk.Label(
            title_frame,
            text="Watch harvested assets come to life with vectorized processing",
            font=("Arial", 12),
            fg='#888888',
            bg='#1a1a1a'
        )
        subtitle_label.pack()
        
        # Main content area
        content_frame = tk.Frame(self.root, bg='#1a1a1a')
        content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Left panel - Asset grid
        self._setup_asset_grid(content_frame)
        
        # Right panel - Live preview and analysis
        self._setup_preview_panel(content_frame)
        
        # Bottom panel - Performance metrics
        self._setup_metrics_panel()
    
    def _setup_asset_grid(self, parent: tk.Frame) -> None:
        """Setup asset grid display"""
        grid_frame = tk.Frame(parent, bg='#2a2a2a', relief=tk.RAISED, bd=2)
        grid_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        grid_label = tk.Label(
            grid_frame,
            text="🌾 Harvested Assets Grid",
            font=("Arial", 14, "bold"),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        grid_label.pack(pady=10)
        
        # Canvas for asset grid
        self.grid_canvas = tk.Canvas(
            grid_frame,
            width=600,
            height=600,
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
            text="🔮 Intelligent Preview",
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
        mode_combo = tk.ttk.Combobox(
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
        self.preview_bridge = IntelligentPreviewBridge(self.preview_canvas, (256, 256))
        
        # Analysis display
        analysis_frame = tk.Frame(preview_frame, bg='#2a2a2a')
        analysis_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.analysis_text = tk.Text(
            analysis_frame,
            width=35,
            height=8,
            bg='#0a0a0a',
            fg='#00ff00',
            font=("Courier", 9),
            relief=tk.FLAT
        )
        self.analysis_text.pack()
        
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
    
    def _setup_metrics_panel(self) -> None:
        """Setup performance metrics panel"""
        metrics_frame = tk.Frame(self.root, bg='#2a2a2a', relief=tk.RAISED, bd=2)
        metrics_frame.pack(fill=tk.X, padx=20, pady=(0, 20))
        
        metrics_label = tk.Label(
            metrics_frame,
            text="📊 Performance Metrics",
            font=("Arial", 12, "bold"),
            fg='#00ff00',
            bg='#2a2a2a'
        )
        metrics_label.pack(side=tk.LEFT, padx=10, pady=5)
        
        self.metrics_label = tk.Label(
            metrics_frame,
            text="Initializing...",
            font=("Courier", 10),
            fg='#ffffff',
            bg='#2a2a2a'
        )
        self.metrics_label.pack(side=tk.LEFT, padx=20, pady=5)
    
    def _generate_showcase_assets(self) -> None:
        """Generate 10 random harvested assets for showcase"""
        logger.info("🎲 Generating showcase assets...")
        
        # Material types for variety
        materials = [
            MaterialType.ORGANIC,
            MaterialType.WOOD,
            MaterialType.STONE,
            MaterialType.METAL,
            MaterialType.WATER,
            MaterialType.FIRE,
            MaterialType.CRYSTAL,
            MaterialType.VOID
        ]
        
        # Asset types
        asset_types = [AssetType.OBJECT, AssetType.ACTOR]
        
        # Generate 10 random assets
        for i in range(10):
            # Random material and type
            material = random.choice(materials)
            asset_type = random.choice(asset_types)
            
            # Create sprite slice
            sprite_slice = SpriteSlice(
                sheet_name="premiere_showcase",
                grid_x=i % 4,
                grid_y=i // 4,
                pixel_x=(i % 4) * 16,
                pixel_y=(i // 4) * 16,
                width=16,
                height=16,
                asset_id=f"premiere_asset_{i:02d}",
                palette=self._generate_random_palette(material)
            )
            
            # Create metadata with intelligent properties
            tags = ["showcase", "premiere", material.value]
            if random.random() > 0.7:  # 30% chance of animation
                tags.append("animated")
            if random.random() > 0.5:  # 50% chance of collision
                tags.append("collision")
            
            metadata = AssetMetadata(
                asset_id=f"premiere_asset_{i:02d}",
                asset_type=asset_type,
                material_id=material,
                description=f"Premiere showcase {material.value} {asset_type.value}",
                tags=tags,
                collision="collision" in tags,
                interaction_hooks=["on_click"] if random.random() > 0.6 else [],
                d20_checks={}
            )
            
            # Create harvested asset
            asset = HarvestedAsset(
                sprite_slice=sprite_slice,
                metadata=metadata
            )
            
            self.showcase_assets.append(asset)
        
        # Display assets in grid
        self._display_asset_grid()
        
        # Show first asset
        if self.showcase_assets:
            self._show_asset(self.showcase_assets[0])
        
        logger.info(f"✅ Generated {len(self.showcase_assets)} showcase assets")
    
    def _generate_random_palette(self, material: MaterialType) -> List[str]:
        """Generate random palette based on material"""
        base_colors = {
            MaterialType.ORGANIC: ["#2d5a27", "#3a6b35", "#4b7845", "#5c8745"],
            MaterialType.WOOD: ["#5d4037", "#6b5447", "#7b6557", "#8b7667"],
            MaterialType.STONE: ["#757575", "#858585", "#959595", "#a5a5a5"],
            MaterialType.METAL: ["#9e9e9e", "#aeaeae", "#bebebe", "#cecece"],
            MaterialType.WATER: ["#4682b4", "#6495ed", "#87cefa", "#b0e0e6"],
            MaterialType.FIRE: ["#ff4500", "#ff6347", "#ff8c00", "#ffd700"],
            MaterialType.CRYSTAL: ["#9370db", "#ba55d3", "#da70d6", "#ee82ee"],
            MaterialType.VOID: ["#000000", "#1a1a1a", "#2a2a2a", "#3a3a3a"]
        }
        
        colors = base_colors.get(material, base_colors[MaterialType.ORGANIC])
        return random.sample(colors, min(len(colors), 4))
    
    def _display_asset_grid(self) -> None:
        """Display assets in a grid layout"""
        self.grid_canvas.delete("all")
        
        # Grid layout
        cols = 4
        rows = 3
        cell_size = 60
        padding = 10
        
        for i, asset in enumerate(self.showcase_assets):
            row = i // cols
            col = i % cols
            
            x = padding + col * (cell_size + padding)
            y = padding + row * (cell_size + padding)
            
            # Draw asset background
            color = self._get_material_color(asset.metadata.material_id)
            self.grid_canvas.create_rectangle(
                x, y, x + cell_size, y + cell_size,
                fill=color,
                outline='#00ff00' if asset == (self.current_asset if hasattr(self, 'current_asset') else None) else '#444444',
                width=2 if asset == (self.current_asset if hasattr(self, 'current_asset') else None) else 1,
                tags=f"asset_{i}"
            )
            
            # Draw asset icon
            self._draw_asset_icon(self.grid_canvas, x + cell_size//2, y + cell_size//2, asset)
            
            # Draw asset ID
            self.grid_canvas.create_text(
                x + cell_size//2,
                y + cell_size + 5,
                text=asset.asset_id.replace("premiere_", ""),
                fill='#ffffff',
                font=("Arial", 8),
                tags=f"asset_{i}"
            )
            
            # Bind click event
            self.grid_canvas.tag_bind(f"asset_{i}", "<Button-1>", lambda e, a=asset: self._show_asset(a))
        
        # Update grid info
        self.grid_info_label.config(text=f"Displaying {len(self.showcase_assets)} assets")
    
    def _draw_asset_icon(self, canvas: tk.Canvas, x: int, y: int, asset: HarvestedAsset) -> None:
        """Draw simple icon representation of asset"""
        size = 20
        
        if asset.metadata.asset_type == AssetType.ACTOR:
            # Draw circle for actors
            canvas.create_oval(
                x - size//2, y - size//2,
                x + size//2, y + size//2,
                fill='#ffffff',
                outline=''
            )
        else:
            # Draw square for objects
            canvas.create_rectangle(
                x - size//2, y - size//2,
                x + size//2, y + size//2,
                fill='#ffffff',
                outline=''
            )
        
        # Add animation indicator
        if "animated" in asset.metadata.tags:
            canvas.create_text(
                x + size//2 - 2, y - size//2 + 2,
                text="🎬",
                font=("Arial", 8),
                fill='#ffff00'
            )
        
        # Add collision indicator
        if asset.metadata.collision:
            canvas.create_text(
                x - size//2 + 2, y - size//2 + 2,
                text="🚫",
                font=("Arial", 8),
                fill='#ff0000'
            )
    
    def _get_material_color(self, material: MaterialType) -> str:
        """Get display color for material"""
        material_colors = {
            MaterialType.ORGANIC: '#2d5a27',
            MaterialType.WOOD: '#5d4037',
            MaterialType.STONE: '#757575',
            MaterialType.METAL: '#9e9e9e',
            MaterialType.WATER: '#4682b4',
            MaterialType.FIRE: '#ff4500',
            MaterialType.CRYSTAL: '#9370db',
            MaterialType.VOID: '#000000'
        }
        return material_colors.get(material, '#808080')
    
    def _show_asset(self, asset: HarvestedAsset) -> None:
        """Show specific asset in preview"""
        self.current_asset = asset
        
        # Update preview bridge
        self.preview_bridge.set_asset(asset)
        
        # Update display
        self._on_preview_mode_change(None)
        
        # Update analysis
        self._update_analysis_display(asset)
        
        # Update grid selection
        self._display_asset_grid()
        
        logger.debug(f"Showing asset: {asset.asset_id}")
    
    def _show_random_asset(self) -> None:
        """Show random asset"""
        if self.showcase_assets:
            asset = random.choice(self.showcase_assets)
            self._show_asset(asset)
    
    def _on_preview_mode_change(self, event) -> None:
        """Handle preview mode change"""
        if not self.preview_bridge:
            return
        
        mode_map = {
            "original": PreviewMode.ORIGINAL,
            "dgtified": PreviewMode.DGTIFIED,
            "kinetic": PreviewMode.KINETIC
        }
        
        selected_mode = self.preview_mode_var.get()
        if selected_mode in mode_map:
            self.preview_bridge.display_preview(mode_map[selected_mode])
    
    def _update_analysis_display(self, asset: HarvestedAsset) -> None:
        """Update analysis display for asset"""
        analysis = self.preview_bridge.get_analysis_summary()
        
        # Format analysis text
        analysis_text = f"""🔍 Asset Analysis
═══════════════════════════
ID: {asset.asset_id}
Type: {asset.metadata.asset_type.value}
Material: {asset.metadata.material_id.value}
Tags: {', '.join(asset.metadata.tags)}

🧠 Intelligent Analysis
═══════════════════════════
Shadow: {'✅ Yes' if analysis.get('has_shadow') else '❌ No'}
Confidence: {analysis.get('shadow_confidence', 0):.1%}
Animated: {'✅ Yes' if analysis.get('is_animated') else '❌ No'}
Frames: {analysis.get('animation_frames', 1)}

⚡ Performance
═══════════════════════════
Operations: {self.image_processor.get_performance_summary().get('total_operations', 0)}
Preview Modes: {len(analysis.get('preview_modes', []))}
"""
        
        self.analysis_text.delete(1.0, tk.END)
        self.analysis_text.insert(1.0, analysis_text)
    
    def _start_animation(self) -> None:
        """Start animation loop"""
        if self.preview_bridge:
            self.preview_bridge.start_animation()
    
    def _stop_animation(self) -> None:
        """Stop animation loop"""
        if self.preview_bridge:
            self.preview_bridge.stop_animation()
    
    def _update_metrics(self) -> None:
        """Update performance metrics display"""
        elapsed = time.time() - self.start_time
        
        # Get performance summary
        perf_summary = self.image_processor.get_performance_summary()
        
        metrics_text = (
            f"Runtime: {elapsed:.1f}s | "
            f"Assets: {len(self.showcase_assets)} | "
            f"Operations: {perf_summary.get('total_operations', 0)} | "
            f"FPS: {self.frame_count / max(elapsed, 0.1):.1f}"
        )
        
        self.metrics_label.config(text=metrics_text)
        
        # Schedule next update
        self.root.after(100, self._update_metrics)
        self.frame_count += 1
    
    def run(self) -> None:
        """Run the premiere showcase"""
        logger.info("🎬 Starting DGT Volume 2 Premiere Showcase")
        
        # Start metrics updates
        self._update_metrics()
        
        # Start with kinetic animation
        self.root.after(1000, self._start_animation)
        
        # Auto-cycle through assets
        self._auto_cycle_assets()
        
        # Run the main loop
        self.root.mainloop()
    
    def _auto_cycle_assets(self) -> None:
        """Automatically cycle through assets"""
        if self.showcase_assets:
            # Show next asset
            current_index = 0
            if hasattr(self, 'current_asset') and self.current_asset in self.showcase_assets:
                current_index = self.showcase_assets.index(self.current_asset)
            
            next_index = (current_index + 1) % len(self.showcase_assets)
            self._show_asset(self.showcase_assets[next_index])
        
        # Schedule next cycle
        self.root.after(3000, self._auto_cycle_assets)  # Change every 3 seconds


def main():
    """Main entry point for premiere showcase"""
    print("🎬 DGT Volume 2 Premiere - Intelligent Preview Showcase")
    print("=" * 60)
    print("🏆 Volume 2 Finale Features:")
    print("  ✅ SOLID Architecture Implementation")
    print("  ✅ Vectorized Numpy Image Processing")
    print("  ✅ Intelligent Preview with 2Hz Animation")
    print("  ✅ Shadow Heuristic Detection")
    print("  ✅ Animation Tagging System")
    print("  ✅ Pydantic v2 Data Validation")
    print("  ✅ Comprehensive Error Handling")
    print("  ✅ Performance Profiling")
    print("")
    print("🎮 What You'll See:")
    print("  • 10 randomly generated harvested assets")
    print("  • Real-time DGT-ified preview with dithering")
    print("  • 2Hz kinetic sway animation")
    print("  • Intelligent shadow detection")
    print("  • Performance metrics tracking")
    print("  • Auto-cycling through assets")
    print("")
    print("🚀 Launching Premiere Showcase...")
    
    # Create and run showcase
    showcase = PremiereShowcase()
    showcase.run()


if __name__ == "__main__":
    main()
