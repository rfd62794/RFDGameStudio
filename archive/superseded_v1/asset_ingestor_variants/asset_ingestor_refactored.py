"""
Asset Ingestor Refactored - SOLID architecture implementation
ADR 098: Clean Architecture Asset Processing
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageOps
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from loguru import logger
import io
import base64

from .asset_models import (
    HarvestedAsset, AssetMetadata, AssetType, MaterialType,
    GridConfiguration, AssetExportConfig, ProcessingResult
)
from .image_processor import ImageProcessor, ImageProcessingError
from .asset_exporter import SovereignAssetExporter, AssetExportError


class AssetIngestorUI:
    """UI component for asset ingestor - Single Responsibility Principle"""
    
    def __init__(self, root: tk.Tk, controller: 'AssetIngestorController'):
        self.root = root
        self.controller = controller
        self._setup_ui()
        logger.debug("AssetIngestorUI initialized")
    
    def _setup_ui(self) -> None:
        """Setup the user interface"""
        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Title
        title_label = ttk.Label(
            main_frame,
            text="🎨 DGT Asset Ingestor - SOLID Architecture",
            font=("Arial", 16, "bold")
        )
        title_label.pack(pady=(0, 10))
        
        # Control panel
        control_frame = ttk.LabelFrame(main_frame, text="🎮 Controls", padding=10)
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # File controls
        self._setup_file_controls(control_frame)
        
        # View controls
        self._setup_view_controls(control_frame)
        
        # Harvesting controls
        self._setup_harvesting_controls(control_frame)
        
        # Main content area
        content_frame = ttk.Frame(main_frame)
        content_frame.pack(fill=tk.BOTH, expand=True)
        
        # Canvas and properties panel
        self._setup_content_area(content_frame)
        
        # Status and list areas
        self._setup_status_areas(main_frame)
    
    def _setup_file_controls(self, parent: ttk.Frame) -> None:
        """Setup file loading controls"""
        file_frame = ttk.Frame(parent)
        file_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(
            file_frame, 
            text="📁 Load Spritesheet", 
            command=self.controller.load_spritesheet
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        self.file_label = ttk.Label(file_frame, text="No spritesheet loaded")
        self.file_label.pack(side=tk.LEFT, padx=(10, 0))
    
    def _setup_view_controls(self, parent: ttk.Frame) -> None:
        """Setup view manipulation controls"""
        view_frame = ttk.Frame(parent)
        view_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(
            view_frame, 
            text="🔍 Zoom In", 
            command=self.controller.zoom_in
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        ttk.Button(
            view_frame, 
            text="🔍 Zoom Out", 
            command=self.controller.zoom_out
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        self.grid_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            view_frame, 
            text="📐 Show Grid", 
            variable=self.grid_var, 
            command=self.controller.toggle_grid
        ).pack(side=tk.LEFT, padx=(10, 5))
        
        self.grayscale_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            view_frame, 
            text="⚫ Grayscale Mode", 
            variable=self.grayscale_var,
            command=self.controller.toggle_grayscale
        ).pack(side=tk.LEFT, padx=(0, 5))
    
    def _setup_harvesting_controls(self, parent: ttk.Frame) -> None:
        """Setup asset harvesting controls"""
        harvest_frame = ttk.LabelFrame(parent, text="🌾 Harvesting", padding=5)
        harvest_frame.pack(fill=tk.X, pady=(5, 0))
        
        button_frame = ttk.Frame(harvest_frame)
        button_frame.pack(fill=tk.X)
        
        ttk.Button(
            button_frame, 
            text="✂️ Slice Grid", 
            command=self.controller.slice_grid
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        ttk.Button(
            button_frame, 
            text="🎯 Bake Selection", 
            command=self.controller.bake_selection
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        ttk.Button(
            button_frame, 
            text="📝 Generate Meta", 
            command=self.controller.generate_meta
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        ttk.Button(
            button_frame, 
            text="💾 Export All", 
            command=self.controller.export_all
        ).pack(side=tk.LEFT, padx=(0, 5))
    
    def _setup_content_area(self, parent: ttk.Frame) -> None:
        """Setup main content area with canvas and properties"""
        # Canvas for spritesheet display
        canvas_frame = ttk.LabelFrame(parent, text="🖼️ Spritesheet View", padding=5)
        canvas_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        self.canvas = tk.Canvas(
            canvas_frame,
            width=600,
            height=400,
            bg='white',
            highlightthickness=1
        )
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        # Bind mouse events
        self.canvas.bind("<Button-1>", self._on_canvas_click)
        self.canvas.bind("<B1-Motion>", self._on_canvas_drag)
        self.canvas.bind("<ButtonRelease-1>", self._on_canvas_release)
        
        # Properties panel
        self._setup_properties_panel(parent)
    
    def _setup_properties_panel(self, parent: ttk.Frame) -> None:
        """Setup properties panel"""
        props_frame = ttk.LabelFrame(parent, text="📋 Properties", padding=10)
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
            values=["organic", "wood", "stone", "metal", "water", "fire", "crystal", "void"],
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
        ttk.Checkbutton(
            props_frame, 
            text="🚫 Has Collision", 
            variable=self.collision_var
        ).pack(anchor=tk.W, pady=(0, 5))
        
        # Interaction hooks
        ttk.Label(props_frame, text="Interaction Hooks:").pack(anchor=tk.W, pady=(10, 2))
        self.interaction_var = tk.StringVar()
        ttk.Entry(props_frame, textvariable=self.interaction_var, width=30).pack(fill=tk.X, pady=(0, 10))
        
        # Status
        self.status_label = ttk.Label(props_frame, text="Ready to harvest", foreground="green")
        self.status_label.pack(pady=(20, 0))
    
    def _setup_status_areas(self, parent: ttk.Frame) -> None:
        """Setup status and list areas"""
        # Harvested sprites list
        list_frame = ttk.LabelFrame(parent, text="🌾 Harvested Sprites", padding=5)
        list_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.sprites_listbox = tk.Listbox(list_frame, height=4)
        self.sprites_listbox.pack(fill=tk.X)
        self.sprites_listbox.bind("<<ListboxSelect>>", self._on_sprite_select)
    
    def _on_canvas_click(self, event) -> None:
        """Handle canvas click"""
        self.controller.handle_canvas_click(event)
    
    def _on_canvas_drag(self, event) -> None:
        """Handle canvas drag"""
        self.controller.handle_canvas_drag(event)
    
    def _on_canvas_release(self, event) -> None:
        """Handle canvas release"""
        self.controller.handle_canvas_release(event)
    
    def _on_sprite_select(self, event) -> None:
        """Handle sprite selection from list"""
        selection = self.sprites_listbox.curselection()
        if selection:
            index = selection[0]
            self.controller.select_sprite_by_index(index)
    
    def update_file_label(self, text: str) -> None:
        """Update file label"""
        self.file_label.config(text=text)
    
    def update_status(self, text: str, color: str = "green") -> None:
        """Update status label"""
        self.status_label.config(text=text, foreground=color)
    
    def update_sprites_list(self, sprites: List[str]) -> None:
        """Update sprites listbox"""
        self.sprites_listbox.delete(0, tk.END)
        for sprite in sprites:
            self.sprites_listbox.insert(tk.END, sprite)
    
    def display_image(self, image: Image.Image) -> None:
        """Display image on canvas"""
        # Convert PIL Image to PhotoImage
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        
        self.photo = tk.PhotoImage(data=buffer.getvalue())
        
        # Clear canvas and display image
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo, tags="spritesheet")
        
        # Update canvas scroll region
        self.canvas.config(scrollregion=self.canvas.bbox("all"))
    
    def draw_grid_overlay(self, grid_size: int, image_width: int, image_height: int) -> None:
        """Draw grid overlay on canvas"""
        # Draw vertical lines
        for x in range(0, image_width + 1, grid_size):
            self.canvas.create_line(
                x, 0, x, image_height,
                fill='red', width=1, tags="grid"
            )
        
        # Draw horizontal lines
        for y in range(0, image_height + 1, grid_size):
            self.canvas.create_line(
                0, y, image_width, y,
                fill='red', width=1, tags="grid"
            )
    
    def clear_grid(self) -> None:
        """Clear grid overlay"""
        self.canvas.delete("grid")
    
    def create_selection_rect(self, x1: int, y1: int, x2: int, y2: int) -> None:
        """Create/update selection rectangle"""
        self.canvas.delete("selection")
        self.canvas.create_rectangle(
            x1, y1, x2, y2,
            outline='blue', width=2, tags="selection"
        )
    
    def get_ui_state(self) -> Dict[str, Any]:
        """Get current UI state"""
        return {
            'asset_type': self.asset_type_var.get(),
            'material': self.material_var.get(),
            'description': self.description_var.get(),
            'tags': self.tags_var.get(),
            'collision': self.collision_var.get(),
            'interaction_hooks': self.interaction_var.get(),
            'show_grid': self.grid_var.get(),
            'grayscale_mode': self.grayscale_var.get()
        }
    
    def set_ui_state(self, state: Dict[str, Any]) -> None:
        """Set UI state from dictionary"""
        self.asset_type_var.set(state.get('asset_type', 'object'))
        self.material_var.set(state.get('material', 'organic'))
        self.description_var.set(state.get('description', ''))
        self.tags_var.set(state.get('tags', ''))
        self.collision_var.set(state.get('collision', False))
        self.interaction_var.set(state.get('interaction_hooks', ''))
        self.grid_var.set(state.get('show_grid', True))
        self.grayscale_var.set(state.get('grayscale_mode', False))


class AssetIngestorController:
    """Controller component - mediates between UI and business logic"""
    
    def __init__(self, ui: AssetIngestorUI):
        self.ui = ui
        self.image_processor = ImageProcessor()
        self.exporter = SovereignAssetExporter(self.image_processor)
        
        # State
        self.spritesheet_path: Optional[Path] = None
        self.spritesheet_image: Optional[Image.Image] = None
        self.harvested_assets: List[HarvestedAsset] = []
        self.selected_asset: Optional[HarvestedAsset] = None
        
        # UI state
        self.selection_start: Optional[Tuple[int, int]] = None
        self.selection_end: Optional[Tuple[int, int]] = None
        self.zoom_level = 2.0
        self.tile_size = 16
        
        logger.debug("AssetIngestorController initialized")
    
    def load_spritesheet(self) -> None:
        """Load spritesheet from file"""
        file_path = filedialog.askopenfilename(
            title="Select Spritesheet",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            self.spritesheet_path = Path(file_path)
            self.spritesheet_image = self.image_processor.load_image(self.spritesheet_path)
            
            # Update UI
            self.ui.update_file_label(f"Loaded: {self.spritesheet_path.name}")
            self.ui.update_status("Spritesheet loaded successfully")
            
            # Display spritesheet
            self._display_spritesheet()
            
            logger.info(f"Loaded spritesheet: {self.spritesheet_path.name}")
            
        except ImageProcessingError as e:
            logger.error(f"Failed to load spritesheet: {e}")
            messagebox.showerror("Error", f"Failed to load spritesheet: {e}")
        except Exception as e:
            logger.error(f"Unexpected error loading spritesheet: {e}")
            messagebox.showerror("Error", f"Unexpected error: {e}")
    
    def _display_spritesheet(self) -> None:
        """Display spritesheet on canvas"""
        if not self.spritesheet_image:
            return
        
        # Resize for display
        display_image = self.image_processor.resize_for_display(
            self.spritesheet_image, self.zoom_level
        )
        
        # Apply grayscale if enabled
        ui_state = self.ui.get_ui_state()
        if ui_state['grayscale_mode']:
            display_image = self.image_processor.convert_to_grayscale(display_image)
        
        # Display image
        self.ui.display_image(display_image)
        
        # Draw grid if enabled
        if ui_state['show_grid']:
            grid_size = int(self.tile_size * self.zoom_level)
            self.ui.draw_grid_overlay(
                grid_size,
                display_image.width,
                display_image.height
            )
    
    def zoom_in(self) -> None:
        """Zoom in on spritesheet"""
        self.zoom_level = min(self.zoom_level * 1.5, 8.0)
        self._display_spritesheet()
    
    def zoom_out(self) -> None:
        """Zoom out on spritesheet"""
        self.zoom_level = max(self.zoom_level / 1.5, 1.0)
        self._display_spritesheet()
    
    def toggle_grid(self) -> None:
        """Toggle grid display"""
        self._display_spritesheet()
    
    def toggle_grayscale(self) -> None:
        """Toggle grayscale mode"""
        self._display_spritesheet()
    
    def slice_grid(self) -> None:
        """Slice spritesheet into grid tiles"""
        if not self.spritesheet_image:
            messagebox.showwarning("Warning", "Please load a spritesheet first")
            return
        
        try:
            # Calculate grid dimensions
            cols, rows = self.image_processor.calculate_grid_dimensions(
                self.spritesheet_image, self.tile_size
            )
            
            # Create grid configuration
            grid_config = GridConfiguration(
                tile_size=self.tile_size,
                grid_cols=cols,
                grid_rows=rows,
                auto_detect=False
            )
            
            # Slice the grid
            sprite_slices = self.image_processor.slice_grid(
                self.spritesheet_image, 
                grid_config, 
                self.spritesheet_path.stem
            )
            
            # Convert to harvested assets (without metadata initially)
            self.harvested_assets.clear()
            for sprite_slice in sprite_slices:
                # Create default metadata
                metadata = AssetMetadata(
                    asset_id=sprite_slice.asset_id,
                    asset_type=AssetType.OBJECT,
                    material_id=MaterialType.ORGANIC,
                    description=f"Harvested from {sprite_slice.sheet_name}",
                    tags=["harvested", "imported"],
                    collision=False,
                    interaction_hooks=[],
                    d20_checks={}
                )
                
                asset = HarvestedAsset(
                    sprite_slice=sprite_slice,
                    metadata=metadata
                )
                self.harvested_assets.append(asset)
            
            # Update UI
            self._update_sprites_list()
            self.ui.update_status(f"Sliced {len(self.harvested_assets)} sprites")
            
            logger.info(f"Sliced {len(self.harvested_assets)} sprites from grid")
            
        except ImageProcessingError as e:
            logger.error(f"Failed to slice grid: {e}")
            messagebox.showerror("Error", f"Failed to slice grid: {e}")
        except Exception as e:
            logger.error(f"Unexpected error slicing grid: {e}")
            messagebox.showerror("Error", f"Unexpected error: {e}")
    
    def handle_canvas_click(self, event) -> None:
        """Handle canvas click for selection"""
        if not self.spritesheet_image:
            return
        
        self.selection_start = (event.x, event.y)
        self.selection_end = (event.x, event.y)
        
        # Create selection rectangle
        self.ui.create_selection_rect(event.x, event.y, event.x, event.y)
    
    def handle_canvas_drag(self, event) -> None:
        """Handle canvas drag for selection"""
        if not self.selection_start:
            return
        
        self.selection_end = (event.x, event.y)
        
        # Update selection rectangle
        if self.selection_start and self.selection_end:
            self.ui.create_selection_rect(
                self.selection_start[0], self.selection_start[1],
                event.x, event.y
            )
    
    def handle_canvas_release(self, event) -> None:
        """Handle canvas release for selection"""
        if not self.selection_start or not self.selection_end:
            return
        
        # Calculate selection bounds
        x1, y1 = self.selection_start
        x2, y2 = self.selection_end
        
        # Ensure proper ordering
        x1, x2 = min(x1, x2), max(x1, x2)
        y1, y2 = min(y1, y2), max(y1, y2)
        
        # Convert to sprite coordinates and snap to grid
        sprite_x1 = (int(x1 / self.zoom_level) // self.tile_size) * self.tile_size
        sprite_y1 = (int(y1 / self.zoom_level) // self.tile_size) * self.tile_size
        sprite_x2 = ((int(x2 / self.zoom_level) // self.tile_size) + 1) * self.tile_size
        sprite_y2 = ((int(y2 / self.zoom_level) // self.tile_size) + 1) * self.tile_size
        
        # Update selection rectangle
        self.ui.create_selection_rect(
            sprite_x1 * self.zoom_level,
            sprite_y1 * self.zoom_level,
            sprite_x2 * self.zoom_level,
            sprite_y2 * self.zoom_level
        )
        
        # Store selection bounds
        self.selection_start = (sprite_x1, sprite_y1)
        self.selection_end = (sprite_x2, sprite_y2)
    
    def bake_selection(self) -> None:
        """Bake selected sprite with metadata"""
        if not self.selection_start or not self.selection_end:
            messagebox.showwarning("Warning", "Please select a sprite first")
            return
        
        # Find asset in selection
        selected_asset = None
        for asset in self.harvested_assets:
            sprite = asset.sprite_slice
            if (sprite.pixel_x >= self.selection_start[0] and 
                sprite.pixel_y >= self.selection_start[1] and
                sprite.pixel_x + sprite.width <= self.selection_end[0] and
                sprite.pixel_y + sprite.height <= self.selection_end[1]):
                selected_asset = asset
                break
        
        if not selected_asset:
            messagebox.showwarning("Warning", "No sprite found in selection")
            return
        
        # Update asset metadata from UI
        ui_state = self.ui.get_ui_state()
        selected_asset.metadata.asset_type = AssetType(ui_state['asset_type'])
        selected_asset.metadata.material_id = MaterialType(ui_state['material'])
        selected_asset.metadata.description = ui_state['description']
        selected_asset.metadata.tags = [tag.strip() for tag in ui_state['tags'].split(',') if tag.strip()]
        selected_asset.metadata.collision = ui_state['collision']
        selected_asset.metadata.interaction_hooks = [hook.strip() for hook in ui_state['interaction_hooks'].split(',') if hook.strip()]
        
        self.selected_asset = selected_asset
        
        self.ui.update_status(f"Baked sprite: {selected_asset.asset_id}")
        logger.info(f"Baked sprite: {selected_asset.asset_id}")
    
    def generate_meta(self) -> None:
        """Generate metadata for selected sprite"""
        if not self.selected_asset:
            messagebox.showwarning("Warning", "Please bake a sprite first")
            return
        
        # Generate YAML data
        yaml_data = self.exporter._convert_assets_to_yaml([self.selected_asset])
        
        # Show YAML in dialog
        import yaml
        yaml_text = yaml.dump(yaml_data, default_flow_style=False, sort_keys=False)
        
        dialog = tk.Toplevel(self.ui.root)
        dialog.title("Generated Metadata")
        dialog.geometry("500x400")
        
        text_widget = tk.Text(dialog, wrap=tk.WORD)
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        text_widget.insert(tk.END, yaml_text)
        
        ttk.Button(dialog, text="Close", command=dialog.destroy).pack(pady=10)
        
        self.ui.update_status("Metadata generated")
        logger.info(f"Generated metadata for {self.selected_asset.asset_id}")
    
    def export_all(self) -> None:
        """Export all harvested assets"""
        if not self.harvested_assets:
            messagebox.showwarning("Warning", "No assets to export")
            return
        
        # Choose export directory
        export_dir = filedialog.askdirectory(title="Export Directory")
        if not export_dir:
            return
        
        try:
            # Create export configuration
            config = AssetExportConfig(
                export_directory=Path(export_dir),
                include_grayscale=self.ui.get_ui_state()['grayscale_mode'],
                yaml_filename="harvested_assets.yaml",
                image_subdirectory="images"
            )
            
            # Validate configuration
            errors = self.exporter.validate_export_config(config)
            if errors:
                messagebox.showerror("Configuration Error", "\n".join(errors))
                return
            
            # Export assets
            result = self.exporter.export_assets(self.harvested_assets, config)
            
            if result.success:
                messagebox.showinfo(
                    "Export Complete", 
                    f"Exported {result.assets_processed} assets to {config.export_directory}"
                )
                self.ui.update_status(f"Exported {result.assets_processed} assets")
            else:
                error_msg = "Export failed:\n" + "\n".join(result.errors)
                messagebox.showerror("Export Error", error_msg)
                self.ui.update_status("Export failed", "red")
            
        except Exception as e:
            logger.error(f"Export failed: {e}")
            messagebox.showerror("Export Error", f"Failed to export: {e}")
    
    def select_sprite_by_index(self, index: int) -> None:
        """Select sprite by list index"""
        if 0 <= index < len(self.harvested_assets):
            self.selected_asset = self.harvested_assets[index]
            self.ui.update_status(f"Selected: {self.selected_asset.asset_id}", "blue")
    
    def _update_sprites_list(self) -> None:
        """Update the sprites listbox"""
        sprite_names = [
            f"{asset.asset_id} ({asset.sprite_slice.grid_x},{asset.sprite_slice.grid_y})"
            for asset in self.harvested_assets
        ]
        self.ui.update_sprites_list(sprite_names)


class AssetIngestorSOLID:
    """Main application class - SOLID architecture implementation"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🎨 DGT Asset Ingestor - SOLID Architecture")
        self.root.geometry("1200x800")
        
        # Initialize components
        self.controller = AssetIngestorController(None)  # Will be set after UI creation
        self.ui = AssetIngestorUI(self.root, self.controller)
        
        # Set controller's UI reference
        self.controller.ui = self.ui
        
        logger.info("🎨 DGT Asset Ingestor (SOLID) initialized")
    
    def run(self) -> None:
        """Run the application"""
        logger.info("🎨 Starting DGT Asset Ingestor (SOLID)")
        self.root.mainloop()


# Factory function
def create_asset_ingestor_solid() -> AssetIngestorSOLID:
    """Create SOLID asset ingestor instance"""
    return AssetIngestorSOLID()


if __name__ == "__main__":
    ingestor = create_asset_ingestor_solid()
    ingestor.run()
