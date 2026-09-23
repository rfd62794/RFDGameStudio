"""
DGT Asset Ingestor - ADR 094: The Automated Harvesting Protocol
Low-code tool for converting sprite sheets to SovereignRegistry assets
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
import yaml
import numpy as np
from typing import List, Tuple, Dict, Optional, Any
from dataclasses import dataclass
from loguru import logger
import re
import os
import sys

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from assets.sovereign_schema import create_sovereign_object, export_to_raw_file

@dataclass
class SpriteSlice:
    """Represents a single sliced sprite from the sheet"""
    sheet_name: str
    grid_x: int
    grid_y: int
    pixel_x: int
    pixel_y: int
    width: int
    height: int
    image: Image.Image
    asset_id: str
    palette: List[str]
    grayscale_image: Optional[Image.Image] = None

@dataclass
class AssetMetadata:
    """Metadata for harvested asset"""
    asset_id: str
    asset_type: str  # 'actor' or 'object'
    material_id: str
    description: str
    tags: List[str]
    collision: bool
    interaction_hooks: List[str]
    d20_checks: Dict[str, Any]

class AssetIngestor:
    """Low-code asset ingestor for automated sprite harvesting"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🎨 DGT Asset Ingestor - Automated Harvesting")
        self.root.geometry("1200x800")
        
        # Core properties
        self.spritesheet_path: Optional[Path] = None
        self.spritesheet_image: Optional[Image.Image] = None
        self.tile_size = 16
        self.grid_cols = 0
        self.grid_rows = 0
        
        # UI Components
        self.canvas: Optional[tk.Canvas] = None
        self.selection_rect: Optional[int] = None
        self.selection_start: Optional[Tuple[int, int]] = None
        self.selection_end: Optional[Tuple[int, int]] = None
        
        # Harvested sprites
        self.harvested_sprites: List[SpriteSlice] = []
        self.selected_sprite: Optional[SpriteSlice] = None
        
        # UI State
        self.grayscale_mode = False
        self.show_grid = True
        self.zoom_level = 2.0
        
        # Material presets
        self.material_presets = {
            'organic': {'color': '#2d5a27', 'tags': ['animated', 'organic']},
            'wood': {'color': '#5d4037', 'tags': ['flammable', 'barrier']},
            'stone': {'color': '#757575', 'tags': ['heavy', 'durable']},
            'metal': {'color': '#9e9e9e', 'tags': ['valuable', 'secure']},
            'water': {'color': '#4682b4', 'tags': ['fluid', 'passable']},
            'fire': {'color': '#ff4500', 'tags': ['elemental', 'dangerous']},
            'crystal': {'color': '#9370db', 'tags': ['magical', 'resonant']},
            'void': {'color': '#000000', 'tags': ['empty', 'background']}
        }
        
        self._build_ui()
        logger.info("🎨 DGT Asset Ingestor initialized")
    
    def _build_ui(self) -> None:
        """Build the main UI"""
        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Title
        title_label = ttk.Label(
            main_frame,
            text="🎨 DGT Asset Ingestor - Automated Harvesting",
            font=("Arial", 16, "bold")
        )
        title_label.pack(pady=(0, 10))
        
        # Control panel
        control_frame = ttk.LabelFrame(main_frame, text="🎮 Controls", padding=10)
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # File controls
        file_frame = ttk.Frame(control_frame)
        file_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(file_frame, text="📁 Load Spritesheet", command=self._load_spritesheet).pack(side=tk.LEFT, padx=(0, 5))
        
        self.file_label = ttk.Label(file_frame, text="No spritesheet loaded")
        self.file_label.pack(side=tk.LEFT, padx=(10, 0))
        
        # View controls
        view_frame = ttk.Frame(control_frame)
        view_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(view_frame, text="🔍 Zoom In", command=self._zoom_in).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(view_frame, text="🔍 Zoom Out", command=self._zoom_out).pack(side=tk.LEFT, padx=(0, 5))
        
        self.grid_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(view_frame, text="📐 Show Grid", variable=self.grid_var, 
                       command=self._toggle_grid).pack(side=tk.LEFT, padx=(10, 5))
        
        self.grayscale_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(view_frame, text="⚫ Grayscale Mode", variable=self.grayscale_var,
                       command=self._toggle_grayscale).pack(side=tk.LEFT, padx=(0, 5))
        
        # Harvesting controls
        harvest_frame = ttk.LabelFrame(control_frame, text="🌾 Harvesting", padding=5)
        harvest_frame.pack(fill=tk.X, pady=(5, 0))
        
        button_frame = ttk.Frame(harvest_frame)
        button_frame.pack(fill=tk.X)
        
        ttk.Button(button_frame, text="✂️ Slice Grid", command=self._slice_grid).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="🎯 Bake Selection", command=self._bake_selection).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="📝 Generate Meta", command=self._generate_meta).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="💾 Export All", command=self._export_all).pack(side=tk.LEFT, padx=(0, 5))
        
        # Main content area
        content_frame = ttk.Frame(main_frame)
        content_frame.pack(fill=tk.BOTH, expand=True)
        
        # Canvas for spritesheet display
        canvas_frame = ttk.LabelFrame(content_frame, text="🖼️ Spritesheet View", padding=5)
        canvas_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        self.canvas = tk.Canvas(
            canvas_frame,
            width=600,
            height=400,
            bg='white',
            highlightthickness=1
        )
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        # Bind mouse events for selection
        self.canvas.bind("<Button-1>", self._on_canvas_click)
        self.canvas.bind("<B1-Motion>", self._on_canvas_drag)
        self.canvas.bind("<ButtonRelease-1>", self._on_canvas_release)
        
        # Properties panel
        props_frame = ttk.LabelFrame(content_frame, text="📋 Properties", padding=10)
        props_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(0, 0))
        
        # Asset type selection
        ttk.Label(props_frame, text="Asset Type:").pack(anchor=tk.W, pady=(0, 2))
        self.asset_type_var = tk.StringVar(value="object")
        asset_type_combo = ttk.Combobox(
            props_frame,
            textvariable=self.asset_type_var,
            values=["object", "actor"],
            state="readonly"
        )
        asset_type_combo.pack(fill=tk.X, pady=(0, 10))
        
        # Material selection
        ttk.Label(props_frame, text="Material:").pack(anchor=tk.W, pady=(0, 2))
        self.material_var = tk.StringVar(value="organic")
        material_combo = ttk.Combobox(
            props_frame,
            textvariable=self.material_var,
            values=list(self.material_presets.keys()),
            state="readonly"
        )
        material_combo.pack(fill=tk.X, pady=(0, 10))
        
        # Description
        ttk.Label(props_frame, text="Description:").pack(anchor=tk.W, pady=(0, 2))
        self.description_var = tk.StringVar()
        ttk.Entry(props_frame, textvariable=self.description_var, width=30).pack(fill=tk.X, pady=(0, 10))
        
        # Tags
        ttk.Label(props_frame, text="Tags (comma separated):").pack(anchor=tk.W, pady=(0, 2))
        self.tags_var = tk.StringVar()
        ttk.Entry(props_frame, textvariable=self.tags_var, width=30).pack(fill=tk.X, pady=(0, 10))
        
        # Collision
        self.collision_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(props_frame, text="🚫 Has Collision", variable=self.collision_var).pack(anchor=tk.W, pady=(0, 5))
        
        # Interaction hooks
        ttk.Label(props_frame, text="Interaction Hooks:").pack(anchor=tk.W, pady=(10, 2))
        self.interaction_var = tk.StringVar()
        ttk.Entry(props_frame, textvariable=self.interaction_var, width=30).pack(fill=tk.X, pady=(0, 10))
        
        # Status
        self.status_label = ttk.Label(props_frame, text="Ready to harvest", foreground="green")
        self.status_label.pack(pady=(20, 0))
        
        # Harvested sprites list
        list_frame = ttk.LabelFrame(main_frame, text="🌾 Harvested Sprites", padding=5)
        list_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.sprites_listbox = tk.Listbox(list_frame, height=4)
        self.sprites_listbox.pack(fill=tk.X)
        self.sprites_listbox.bind("<<ListboxSelect>>", self._on_sprite_select)
    
    def _load_spritesheet(self) -> None:
        """Load spritesheet from file"""
        file_path = filedialog.askopenfilename(
            title="Select Spritesheet",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            self.spritesheet_path = Path(file_path)
            self.spritesheet_image = Image.open(file_path)
            
            # Update UI
            self.file_label.config(text=f"Loaded: {self.spritesheet_path.name}")
            self.status_label.config(text="Spritesheet loaded successfully", foreground="green")
            
            # Calculate grid dimensions
            self.grid_cols = self.spritesheet_image.width // self.tile_size
            self.grid_rows = self.spritesheet_image.height // self.tile_size
            
            # Display spritesheet
            self._display_spritesheet()
            
            logger.info(f"Loaded spritesheet: {self.spritesheet_path.name} ({self.grid_cols}x{self.grid_rows})")
            
        except Exception as e:
            logger.error(f"Failed to load spritesheet: {e}")
            messagebox.showerror("Error", f"Failed to load spritesheet: {e}")
    
    def _display_spritesheet(self) -> None:
        """Display spritesheet on canvas"""
        if not self.spritesheet_image:
            return
        
        # Clear canvas
        self.canvas.delete("all")
        
        # Calculate display size
        display_width = int(self.spritesheet_image.width * self.zoom_level)
        display_height = int(self.spritesheet_image.height * self.zoom_level)
        
        # Resize image for display
        display_image = self.spritesheet_image.resize(
            (display_width, display_height),
            Image.Resampling.NEAREST
        )
        
        # Apply grayscale if enabled
        if self.grayscale_mode:
            display_image = ImageOps.grayscale(display_image)
        
        # Convert to PhotoImage
        import io
        import base64
        
        # Convert PIL Image to PhotoImage
        buffer = io.BytesIO()
        display_image.save(buffer, format='PNG')
        buffer.seek(0)
        
        self.photo = tk.PhotoImage(data=buffer.getvalue())
        
        # Display on canvas
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo, tags="spritesheet")
        
        # Draw grid if enabled
        if self.show_grid:
            self._draw_grid()
        
        # Update canvas scroll region
        self.canvas.config(scrollregion=self.canvas.bbox("all"))
    
    def _draw_grid(self) -> None:
        """Draw grid overlay on canvas"""
        if not self.spritesheet_image:
            return
        
        grid_size = int(self.tile_size * self.zoom_level)
        
        # Draw vertical lines
        for x in range(0, self.spritesheet_image.width + 1, self.tile_size):
            display_x = int(x * self.zoom_level)
            self.canvas.create_line(
                display_x, 0,
                display_x, int(self.spritesheet_image.height * self.zoom_level),
                fill='red', width=1, tags="grid"
            )
        
        # Draw horizontal lines
        for y in range(0, self.spritesheet_image.height + 1, self.tile_size):
            display_y = int(y * self.zoom_level)
            self.canvas.create_line(
                0, display_y,
                int(self.spritesheet_image.width * self.zoom_level), display_y,
                fill='red', width=1, tags="grid"
            )
    
    def _toggle_grid(self) -> None:
        """Toggle grid display"""
        self.show_grid = self.grid_var.get()
        self._display_spritesheet()
    
    def _toggle_grayscale(self) -> None:
        """Toggle grayscale mode"""
        self.grayscale_mode = self.grayscale_var.get()
        self._display_spritesheet()
    
    def _zoom_in(self) -> None:
        """Zoom in on spritesheet"""
        self.zoom_level = min(self.zoom_level * 1.5, 8.0)
        self._display_spritesheet()
    
    def _zoom_out(self) -> None:
        """Zoom out on spritesheet"""
        self.zoom_level = max(self.zoom_level / 1.5, 1.0)
        self._display_spritesheet()
    
    def _on_canvas_click(self, event) -> None:
        """Handle canvas click for selection"""
        if not self.spritesheet_image:
            return
        
        self.selection_start = (event.x, event.y)
        self.selection_end = (event.x, event.y)
        
        # Remove old selection
        if self.selection_rect:
            self.canvas.delete(self.selection_rect)
        
        # Create new selection rectangle
        self.selection_rect = self.canvas.create_rectangle(
            event.x, event.y, event.x, event.y,
            outline='blue', width=2, tags="selection"
        )
    
    def _on_canvas_drag(self, event) -> None:
        """Handle canvas drag for selection"""
        if not self.selection_start:
            return
        
        self.selection_end = (event.x, event.y)
        
        # Update selection rectangle
        if self.selection_rect:
            self.canvas.coords(
                self.selection_rect,
                self.selection_start[0], self.selection_start[1],
                event.x, event.y
            )
    
    def _on_canvas_release(self, event) -> None:
        """Handle canvas release for selection"""
        if not self.selection_start or not self.selection_end:
            return
        
        # Calculate selection bounds
        x1, y1 = self.selection_start
        x2, y2 = self.selection_end
        
        # Ensure proper ordering
        x1, x2 = min(x1, x2), max(x1, x2)
        y1, y2 = min(y1, y2), max(y1, y2)
        
        # Convert to sprite coordinates
        sprite_x1 = int(x1 / self.zoom_level)
        sprite_y1 = int(y1 / self.zoom_level)
        sprite_x2 = int(x2 / self.zoom_level)
        sprite_y2 = int(y2 / self.zoom_level)
        
        # Snap to grid
        sprite_x1 = (sprite_x1 // self.tile_size) * self.tile_size
        sprite_y1 = (sprite_y1 // self.tile_size) * self.tile_size
        sprite_x2 = ((sprite_x2 // self.tile_size) + 1) * self.tile_size
        sprite_y2 = ((sprite_y2 // self.tile_size) + 1) * self.tile_size
        
        # Update selection rectangle
        if self.selection_rect:
            self.canvas.coords(
                self.selection_rect,
                sprite_x1 * self.zoom_level,
                sprite_y1 * self.zoom_level,
                sprite_x2 * self.zoom_level,
                sprite_y2 * self.zoom_level
            )
        
        # Store selection bounds
        self.selection_start = (sprite_x1, sprite_y1)
        self.selection_end = (sprite_x2, sprite_y2)
        
        logger.debug(f"Selection: {sprite_x1},{sprite_y1} to {sprite_x2},{sprite_y2}")
    
    def _slice_grid(self) -> None:
        """Slice spritesheet into grid tiles"""
        if not self.spritesheet_image:
            messagebox.showwarning("Warning", "Please load a spritesheet first")
            return
        
        self.harvested_sprites.clear()
        
        # Slice the entire grid
        for y in range(self.grid_rows):
            for x in range(self.grid_cols):
                sprite_x = x * self.tile_size
                sprite_y = y * self.tile_size
                
                # Extract sprite
                sprite_image = self.spritesheet_image.crop((
                    sprite_x, sprite_y,
                    sprite_x + self.tile_size,
                    sprite_y + self.tile_size
                ))
                
                # Generate asset ID
                asset_id = f"{self.spritesheet_path.stem}_{x:02d}_{y:02d}"
                
                # Extract palette
                palette = self._extract_palette(sprite_image)
                
                # Create sprite slice
                sprite_slice = SpriteSlice(
                    sheet_name=self.spritesheet_path.stem,
                    grid_x=x,
                    grid_y=y,
                    pixel_x=sprite_x,
                    pixel_y=sprite_y,
                    width=self.tile_size,
                    height=self.tile_size,
                    image=sprite_image,
                    asset_id=asset_id,
                    palette=palette
                )
                
                self.harvested_sprites.append(sprite_slice)
        
        # Update UI
        self._update_sprites_list()
        self.status_label.config(text=f"Sliced {len(self.harvested_sprites)} sprites", foreground="green")
        
        logger.info(f"Sliced {len(self.harvested_sprites)} sprites from grid")
    
    def _extract_palette(self, image: Image.Image) -> List[str]:
        """Extract 4 most frequent colors from image"""
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get color histogram
        colors = image.getcolors(maxcolors=256 * 256 * 256)
        
        # Sort by frequency and get top 4
        sorted_colors = sorted(colors, key=lambda x: x[0], reverse=True)
        
        # Extract hex colors
        palette = []
        for count, (r, g, b) in sorted_colors[:4]:
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            palette.append(hex_color)
        
        return palette
    
    def _bake_selection(self) -> None:
        """Bake selected sprite to DGT DNA"""
        if not self.selection_start or not self.selection_end:
            messagebox.showwarning("Warning", "Please select a sprite first")
            return
        
        # Find sprite in selection
        selected_sprite = None
        for sprite in self.harvested_sprites:
            if (sprite.pixel_x >= self.selection_start[0] and 
                sprite.pixel_y >= self.selection_start[1] and
                sprite.pixel_x + sprite.width <= self.selection_end[0] and
                sprite.pixel_y + sprite.height <= self.selection_end[1]):
                selected_sprite = sprite
                break
        
        if not selected_sprite:
            messagebox.showwarning("Warning", "No sprite found in selection")
            return
        
        self.selected_sprite = selected_sprite
        
        # Update UI with sprite info
        self.description_var.set(f"Harvested from {selected_sprite.sheet_name}")
        self.tags_var.set("harvested,imported")
        
        # Apply grayscale if enabled
        if self.grayscale_mode:
            selected_sprite.grayscale_image = ImageOps.grayscale(selected_sprite.image)
        else:
            selected_sprite.grayscale_image = selected_sprite.image
        
        self.status_label.config(text=f"Baked sprite: {selected_sprite.asset_id}", foreground="green")
        
        logger.info(f"Baked sprite: {selected_sprite.asset_id}")
    
    def _generate_meta(self) -> None:
        """Generate metadata for selected sprite"""
        if not self.selected_sprite:
            messagebox.showwarning("Warning", "Please bake a sprite first")
            return
        
        # Create metadata
        metadata = AssetMetadata(
            asset_id=self.selected_sprite.asset_id,
            asset_type=self.asset_type_var.get(),
            material_id=self.material_var.get(),
            description=self.description_var.get(),
            tags=[tag.strip() for tag in self.tags_var.get().split(',') if tag.strip()],
            collision=self.collision_var.get(),
            interaction_hooks=[hook.strip() for hook in self.interaction_var.get().split(',') if hook.strip()],
            d20_checks={}
        )
        
        # Generate YAML
        yaml_data = {
            'asset_id': metadata.asset_id,
            'asset_type': metadata.asset_type,
            'material_id': metadata.material_id,
            'description': metadata.description,
            'tags': metadata.tags,
            'collision': metadata.collision,
            'interaction_hooks': metadata.interaction_hooks,
            'd20_checks': metadata.d20_checks,
            'palette': self.selected_sprite.palette,
            'source_sheet': self.selected_sprite.sheet_name,
            'grid_position': [self.selected_sprite.grid_x, self.selected_sprite.grid_y]
        }
        
        # Show YAML in dialog
        yaml_text = yaml.dump(yaml_data, default_flow_style=False, sort_keys=False)
        
        dialog = tk.Toplevel(self.root)
        dialog.title("Generated Metadata")
        dialog.geometry("500x400")
        
        text_widget = tk.Text(dialog, wrap=tk.WORD)
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        text_widget.insert(tk.END, yaml_text)
        
        ttk.Button(dialog, text="Close", command=dialog.destroy).pack(pady=10)
        
        self.status_label.config(text="Metadata generated", foreground="green")
        
        logger.info(f"Generated metadata for {metadata.asset_id}")
    
    def _export_all(self) -> None:
        """Export all harvested sprites to assets folder"""
        if not self.harvested_sprites:
            messagebox.showwarning("Warning", "No sprites to export")
            return
        
        # Choose export directory
        export_dir = filedialog.askdirectory(title="Export Directory")
        if not export_dir:
            return
        
        export_path = Path(export_dir)
        
        try:
            # Export images
            images_dir = export_path / "images"
            images_dir.mkdir(exist_ok=True)
            
            # Export YAML
            yaml_data = {}
            
            for sprite in self.harvested_sprites:
                # Save image
                image_path = images_dir / f"{sprite.asset_id}.png"
                
                # Use grayscale if enabled
                export_image = sprite.grayscale_image if sprite.grayscale_image else sprite.image
                export_image.save(image_path)
                
                # Create YAML entry
                yaml_data[sprite.asset_id] = {
                    'sprite_id': sprite.asset_id,
                    'asset_type': 'object',  # Default to object
                    'material_id': 'organic',  # Default to organic
                    'description': f"Harvested from {sprite.sheet_name}",
                    'tags': ['harvested', 'imported'],
                    'collision': False,
                    'palette': sprite.palette,
                    'source_sheet': sprite.sheet_name,
                    'grid_position': [sprite.grid_x, sprite.grid_y]
                }
            
            # Save YAML
            yaml_path = export_path / "harvested_assets.yaml"
            with open(yaml_path, 'w') as f:
                yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)
            
            messagebox.showinfo("Export Complete", f"Exported {len(self.harvested_sprites)} sprites to {export_path}")
            self.status_label.config(text=f"Exported {len(self.harvested_sprites)} sprites", foreground="green")
            
            logger.info(f"Exported {len(self.harvested_sprites)} sprites to {export_path}")
            
        except Exception as e:
            logger.error(f"Export failed: {e}")
            messagebox.showerror("Export Error", f"Failed to export: {e}")
    
    def _update_sprites_list(self) -> None:
        """Update the sprites listbox"""
        self.sprites_listbox.delete(0, tk.END)
        
        for sprite in self.harvested_sprites:
            self.sprites_listbox.insert(tk.END, f"{sprite.asset_id} ({sprite.grid_x},{sprite.grid_y})")
    
    def _on_sprite_select(self, event) -> None:
        """Handle sprite selection from list"""
        selection = self.sprites_listbox.curselection()
        if not selection:
            return
        
        index = selection[0]
        if index < len(self.harvested_sprites):
            self.selected_sprite = self.harvested_sprites[index]
            self.status_label.config(text=f"Selected: {self.selected_sprite.asset_id}", foreground="blue")
    
    def run(self) -> None:
        """Run the asset ingestor"""
        logger.info("🎨 Starting DGT Asset Ingestor")
        self.root.mainloop()

# Factory function
def create_asset_ingestor() -> AssetIngestor:
    """Create asset ingestor instance"""
    return AssetIngestor()

if __name__ == "__main__":
    ingestor = create_asset_ingestor()
    ingestor.run()
