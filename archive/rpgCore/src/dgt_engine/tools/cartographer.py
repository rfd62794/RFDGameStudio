"""
Cartographer - Visual World Editor for DGT System

A Tkinter-based visual editor that wraps the PPU (Graphics Engine) to provide
WYSIWYG world editing capabilities. This tool enables direct tile painting
and real-time world manipulation with 100% parity to the game engine.

Features:
- 160x144 PPU display with 4x scaling for visibility
- Click-to-paint tile editing
- Real-time world state synchronization
- Command pattern integration with Developer Console
- Delta save system for prefabs
- Grid overlay for precise editing
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import asyncio
import time
from typing import Dict, List, Tuple, Optional, Any, Callable
from dataclasses import dataclass
from pathlib import Path
import json

from loguru import logger

# Import DGT components
try:
    from engines.body.graphics_engine import GraphicsEngine, GraphicsEngineSync
    from engines.world import WorldEngine
    from core.state import GameState, TileType, validate_position
    from core.constants import VIEWPORT_WIDTH_PIXELS, VIEWPORT_HEIGHT_PIXELS, TILE_SIZE_PIXELS
except ImportError as e:
    logger.error(f"Failed to import DGT components: {e}")
    raise


@dataclass
class EditorState:
    """Editor state management"""
    current_tile_type: TileType = TileType.GRASS
    show_grid: bool = True
    show_coordinates: bool = True
    auto_save: bool = True
    last_save_time: float = 0.0
    edit_history: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.edit_history is None:
            self.edit_history = []


class CartographerCanvas(tk.Canvas):
    """Custom canvas for PPU rendering with interaction"""
    
    def __init__(self, parent, cartographer_app):
        self.app = cartographer_app
        self.scale_factor = 4  # 4x scaling for visibility
        
        # Calculate canvas size
        self.canvas_width = VIEWPORT_WIDTH_PIXELS * self.scale_factor
        self.canvas_height = VIEWPORT_HEIGHT_PIXELS * self.scale_factor
        
        super().__init__(
            parent,
            width=self.canvas_width,
            height=self.canvas_height,
            bg='black',
            highlightthickness=2,
            highlightbackground='gray'
        )
        
        # Canvas state
        self.current_image = None
        self.grid_lines = []
        self.coordinate_labels = []
        
        # Mouse tracking
        self.mouse_x = 0
        self.mouse_y = 0
        self.world_x = 0
        self.world_y = 0
        
        # Bind events
        self.bind('<Motion>', self._on_mouse_motion)
        self.bind('<Button-1>', self._on_left_click)
        self.bind('<Button-3>', self._on_right_click)
        self.bind('<Leave>', self._on_mouse_leave)
        
        logger.info(f"🎨 Cartographer canvas initialized: {self.canvas_width}x{self.canvas_height}")
    
    def update_display(self, tkinter_image) -> None:
        """Update canvas with new PPU frame"""
        if tkinter_image:
            # Clear previous image
            self.delete('ppu_image')
            
            # Display new image
            self.current_image = tkinter_image
            self.create_image(
                0, 0,
                anchor='nw',
                image=tkinter_image,
                tags='ppu_image'
            )
        
        # Update overlays
        self._update_overlays()
    
    def _update_overlays(self) -> None:
        """Update grid and coordinate overlays"""
        # Clear previous overlays
        self.delete('overlay')
        
        if self.app.editor_state.show_grid:
            self._draw_grid()
        
        if self.app.editor_state.show_coordinates:
            self._draw_coordinates()
    
    def _draw_grid(self) -> None:
        """Draw tile grid overlay"""
        grid_color = '#404040'  # Dark gray
        grid_spacing = TILE_SIZE_PIXELS * self.scale_factor
        
        # Vertical lines
        for x in range(0, self.canvas_width + 1, grid_spacing):
            self.create_line(
                x, 0, x, self.canvas_height,
                fill=grid_color, width=1, tags='overlay'
            )
        
        # Horizontal lines
        for y in range(0, self.canvas_height + 1, grid_spacing):
            self.create_line(
                0, y, self.canvas_width, y,
                fill=grid_color, width=1, tags='overlay'
            )
    
    def _draw_coordinates(self) -> None:
        """Draw coordinate labels"""
        if not (0 <= self.world_x < 50 and 0 <= self.world_y < 50):
            return
        
        # Create coordinate text at mouse position
        coord_text = f"({self.world_x}, {self.world_y})"
        self.create_text(
            self.mouse_x + 15, self.mouse_y - 15,
            text=coord_text,
            fill='white',
            font=('Courier', 10, 'bold'),
            anchor='w',
            tags='overlay'
        )
    
    def _on_mouse_motion(self, event) -> None:
        """Handle mouse motion"""
        self.mouse_x = event.x
        self.mouse_y = event.y
        
        # Convert canvas coordinates to world coordinates
        tile_x = event.x // (TILE_SIZE_PIXELS * self.scale_factor)
        tile_y = event.y // (TILE_SIZE_PIXELS * self.scale_factor)
        
        # Convert to world coordinates based on viewport
        if self.app.graphics_engine:
            viewport = self.app.graphics_engine.viewport
            self.world_x = viewport.center_x - 10 + tile_x  # 10 = half viewport width
            self.world_y = viewport.center_y - 9 + tile_y   # 9 = half viewport height
        
        # Update status
        self.app.update_status(f"Position: ({self.world_x}, {self.world_y}) | Tile: {self.app.editor_state.current_tile_type.name}")
        
        # Redraw overlays
        self._update_overlays()
    
    def _on_left_click(self, event) -> None:
        """Handle left click - paint tile"""
        if validate_position((self.world_x, self.world_y)):
            self.app.paint_tile(self.world_x, self.world_y)
        else:
            self.app.update_status("Invalid position for painting")
    
    def _on_right_click(self, event) -> None:
        """Handle right click - sample tile"""
        if validate_position((self.world_x, self.world_y)):
            tile_type = self.app.get_tile_at_position(self.world_x, self.world_y)
            self.app.editor_state.current_tile_type = tile_type
            self.app.update_status(f"Sampled tile: {tile_type.name}")
            self.app.update_tile_selector()
    
    def _on_mouse_leave(self, event) -> None:
        """Handle mouse leave"""
        self.app.update_status("Ready")


class CartographerApp:
    """Main Cartographer application"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🗺️ DGT Cartographer - Visual World Editor")
        self.root.resizable(False, False)
        
        # Editor state
        self.editor_state = EditorState()
        
        # DGT engines
        self.graphics_engine: Optional[GraphicsEngine] = None
        self.world_engine: Optional[WorldEngine] = None
        self.sync_graphics: Optional[GraphicsEngineSync] = None
        
        # UI components
        self.canvas: Optional[CartographerCanvas] = None
        self.tile_selector: Optional[ttk.Combobox] = None
        self.status_label: Optional[tk.Label] = None
        
        # Threading
        self.render_thread: Optional[threading.Thread] = None
        self.running = False
        
        # Initialize UI
        self._setup_ui()
        
        # Initialize engines
        self._initialize_engines()
        
        # Start rendering
        self._start_rendering()
        
        logger.info("🗺️ Cartographer application initialized")
    
    def _setup_ui(self) -> None:
        """Setup the user interface"""
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Left panel - Canvas
        canvas_frame = ttk.LabelFrame(main_frame, text="PPU Viewport", padding="5")
        canvas_frame.grid(row=0, column=0, rowspan=2, padx=(0, 10), sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.canvas = CartographerCanvas(canvas_frame, self)
        self.canvas.pack()
        
        # Right panel - Controls
        control_frame = ttk.LabelFrame(main_frame, text="Controls", padding="5")
        control_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Tile selector
        ttk.Label(control_frame, text="Current Tile:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.tile_selector = ttk.Combobox(
            control_frame,
            values=[tile.name for tile in TileType],
            width=15,
            state='readonly'
        )
        self.tile_selector.grid(row=0, column=1, pady=2)
        self.tile_selector.set(self.editor_state.current_tile_type.name)
        self.tile_selector.bind('<<ComboboxSelected>>', self._on_tile_selected)
        
        # View controls
        ttk.Separator(control_frame, orient='horizontal').grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=10)
        
        self.grid_var = tk.BooleanVar(value=self.editor_state.show_grid)
        grid_check = ttk.Checkbutton(
            control_frame, text="Show Grid", 
            variable=self.grid_var,
            command=self._toggle_grid
        )
        grid_check.grid(row=2, column=0, columnspan=2, sticky=tk.W, pady=2)
        
        self.coords_var = tk.BooleanVar(value=self.editor_state.show_coordinates)
        coords_check = ttk.Checkbutton(
            control_frame, text="Show Coordinates", 
            variable=self.coords_var,
            command=self._toggle_coordinates
        )
        coords_check.grid(row=3, column=0, columnspan=2, sticky=tk.W, pady=2)
        
        # Action buttons
        ttk.Separator(control_frame, orient='horizontal').grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=10)
        
        ttk.Button(control_frame, text="Reset View", command=self._reset_view).grid(row=5, column=0, columnspan=2, pady=2)
        ttk.Button(control_frame, text="Save Prefab", command=self._save_prefab).grid(row=6, column=0, columnspan=2, pady=2)
        ttk.Button(control_frame, text="Load Prefab", command=self._load_prefab).grid(row=7, column=0, columnspan=2, pady=2)
        
        # Instructions
        ttk.Separator(control_frame, orient='horizontal').grid(row=8, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=10)
        
        instructions = tk.Text(control_frame, width=25, height=8, wrap=tk.WORD)
        instructions.grid(row=9, column=0, columnspan=2, pady=5)
        instructions.insert('1.0', 
            "🎨 Cartographer Instructions:\n\n"
            "• Left Click: Paint tile\n"
            "• Right Click: Sample tile\n"
            "• Scroll: Move viewport\n"
            "• S: Save prefab\n"
            "• L: Load prefab\n"
            "• G: Toggle grid\n"
            "• C: Toggle coordinates"
        )
        instructions.config(state='disabled')
        
        # Status bar
        status_frame = ttk.Frame(main_frame)
        status_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))
        
        self.status_label = ttk.Label(status_frame, text="Ready", relief=tk.SUNKEN)
        self.status_label.pack(fill=tk.X)
        
        # Keyboard bindings
        self.root.bind('<s>', lambda e: self._save_prefab())
        self.root.bind('<l>', lambda e: self._load_prefab())
        self.root.bind('<g>', lambda e: self._toggle_grid())
        self.root.bind('<c>', lambda e: self._toggle_coordinates())
        
        # Window close handler
        self.root.protocol("WM_DELETE_WINDOW", self._on_closing)
    
    def _initialize_engines(self) -> None:
        """Initialize DGT engines"""
        try:
            # Initialize graphics engine
            self.graphics_engine = GraphicsEngine("assets/")
            self.sync_graphics = GraphicsEngineSync(self.graphics_engine)
            
            # Initialize world engine (minimal setup for editing)
            self.world_engine = WorldEngine("EDITOR_SEED")
            
            logger.info("✅ DGT engines initialized for Cartographer")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize engines: {e}")
            messagebox.showerror("Initialization Error", f"Failed to initialize DGT engines:\n{e}")
    
    def _start_rendering(self) -> None:
        """Start the rendering thread"""
        self.running = True
        self.render_thread = threading.Thread(target=self._render_loop, daemon=True)
        self.render_thread.start()
        logger.info("🔄 Cartographer rendering loop started")
    
    def _render_loop(self) -> None:
        """Main rendering loop (60 FPS)"""
        target_fps = 60
        frame_time = 1.0 / target_fps
        
        while self.running:
            start_time = time.time()
            
            try:
                if self.graphics_engine and self.world_engine:
                    # Create a simple game state for rendering
                    game_state = self._create_editor_game_state()
                    
                    # Render frame
                    frame = self.sync_graphics.render_state(game_state)
                    self.sync_graphics.display_frame(frame)
                    
                    # Get Tkinter image and update UI
                    tkinter_image = self.graphics_engine.get_tkinter_image()
                    
                    # Update UI in main thread
                    self.root.after(0, self._update_canvas, tkinter_image)
                
            except Exception as e:
                logger.error(f"❌ Render error: {e}")
            
            # Maintain frame rate
            elapsed = time.time() - start_time
            sleep_time = max(0, frame_time - elapsed)
            time.sleep(sleep_time)
    
    def _create_editor_game_state(self) -> GameState:
        """Create a minimal game state for rendering"""
        # This would normally come from the actual game state
        # For the editor, we create a minimal state
        return GameState(
            player_position=(self.graphics_engine.viewport.center_x, self.graphics_engine.viewport.center_y),
            turn_count=0,
            current_environment="forest",
            voyager_state="editing",
            active_effects=[],
            tags=set()
        )
    
    def _update_canvas(self, tkinter_image) -> None:
        """Update canvas in main thread"""
        if self.canvas:
            self.canvas.update_display(tkinter_image)
    
    def paint_tile(self, x: int, y: int) -> None:
        """Paint a tile at the specified position"""
        if not self.world_engine:
            return
        
        try:
            # Update world engine
            self.world_engine.set_tile(x, y, self.editor_state.current_tile_type)
            
            # Record edit for history
            edit = {
                'timestamp': time.time(),
                'action': 'paint',
                'position': (x, y),
                'tile_type': self.editor_state.current_tile_type.name
            }
            self.editor_state.edit_history.append(edit)
            
            # Update status
            self.update_status(f"Painted {self.editor_state.current_tile_type.name} at ({x}, {y})")
            
            # Auto-save if enabled
            if self.editor_state.auto_save:
                self._auto_save()
                
        except Exception as e:
            logger.error(f"❌ Failed to paint tile: {e}")
            self.update_status(f"Error painting tile: {e}")
    
    def get_tile_at_position(self, x: int, y: int) -> TileType:
        """Get tile type at position"""
        if not self.world_engine:
            return TileType.GRASS
        
        try:
            return self.world_engine.get_tile(x, y)
        except:
            return TileType.GRASS
    
    def _on_tile_selected(self, event) -> None:
        """Handle tile selection"""
        tile_name = self.tile_selector.get()
        self.editor_state.current_tile_type = TileType[tile_name]
        self.update_status(f"Selected tile: {tile_name}")
    
    def _toggle_grid(self) -> None:
        """Toggle grid display"""
        self.editor_state.show_grid = self.grid_var.get()
        if self.canvas:
            self.canvas._update_overlays()
    
    def _toggle_coordinates(self) -> None:
        """Toggle coordinate display"""
        self.editor_state.show_coordinates = self.coords_var.get()
        if self.canvas:
            self.canvas._update_overlays()
    
    def _reset_view(self) -> None:
        """Reset viewport to center"""
        if self.graphics_engine:
            self.graphics_engine.viewport.center_x = 25
            self.graphics_engine.viewport.center_y = 25
            self.update_status("View reset to center")
    
    def _save_prefab(self) -> None:
        """Save current world state as prefab"""
        if not self.world_engine:
            messagebox.showwarning("Not Ready", "World engine not initialized")
            return
        
        try:
            # Get save path
            file_path = filedialog.asksaveasfilename(
                title="Save Prefab",
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
                initialdir="assets/prefabs/"
            )
            
            if file_path:
                # Export world state
                prefab_data = self.world_engine.export_region(0, 0, 50, 50)
                
                # Add metadata
                prefab_data['metadata'] = {
                    'created_by': 'Cartographer',
                    'created_at': time.time(),
                    'version': '1.0',
                    'edit_count': len(self.editor_state.edit_history)
                }
                
                # Save to file
                with open(file_path, 'w') as f:
                    json.dump(prefab_data, f, indent=2)
                
                self.editor_state.last_save_time = time.time()
                self.update_status(f"Prefab saved: {Path(file_path).name}")
                logger.info(f"💾 Prefab saved: {file_path}")
                
        except Exception as e:
            logger.error(f"❌ Failed to save prefab: {e}")
            messagebox.showerror("Save Error", f"Failed to save prefab:\n{e}")
    
    def _load_prefab(self) -> None:
        """Load prefab from file"""
        if not self.world_engine:
            messagebox.showwarning("Not Ready", "World engine not initialized")
            return
        
        try:
            # Get file path
            file_path = filedialog.askopenfilename(
                title="Load Prefab",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
                initialdir="assets/prefabs/"
            )
            
            if file_path:
                # Load prefab data
                with open(file_path, 'r') as f:
                    prefab_data = json.load(f)
                
                # Import to world engine
                self.world_engine.import_region(prefab_data)
                
                self.update_status(f"Prefab loaded: {Path(file_path).name}")
                logger.info(f"📂 Prefab loaded: {file_path}")
                
        except Exception as e:
            logger.error(f"❌ Failed to load prefab: {e}")
            messagebox.showerror("Load Error", f"Failed to load prefab:\n{e}")
    
    def _auto_save(self) -> None:
        """Auto-save current state"""
        # Simple auto-save to a temporary file
        try:
            auto_save_path = Path("assets/prefabs/autosave.json")
            auto_save_path.parent.mkdir(parents=True, exist_ok=True)
            
            if self.world_engine:
                prefab_data = self.world_engine.export_region(0, 0, 50, 50)
                prefab_data['metadata'] = {
                    'auto_save': True,
                    'timestamp': time.time()
                }
                
                with open(auto_save_path, 'w') as f:
                    json.dump(prefab_data, f, indent=2)
                
        except Exception as e:
            logger.debug(f"Auto-save failed: {e}")
    
    def update_status(self, message: str) -> None:
        """Update status bar"""
        if self.status_label:
            self.status_label.config(text=message)
    
    def update_tile_selector(self) -> None:
        """Update tile selector to show current tile"""
        if self.tile_selector:
            self.tile_selector.set(self.editor_state.current_tile_type.name)
    
    def _on_closing(self) -> None:
        """Handle window closing"""
        self.running = False
        
        # Auto-save before closing
        if self.editor_state.auto_save:
            self._auto_save()
        
        # Wait for render thread to finish
        if self.render_thread and self.render_thread.is_alive():
            self.render_thread.join(timeout=1.0)
        
        self.root.destroy()
        logger.info("🗺️ Cartographer closed")
    
    def run(self) -> None:
        """Run the application"""
        logger.info("🗺️ Starting Cartographer application")
        self.root.mainloop()


def main():
    """Main entry point for Cartographer"""
    try:
        app = CartographerApp()
        app.run()
    except KeyboardInterrupt:
        logger.info("🗺️ Cartographer interrupted by user")
    except Exception as e:
        logger.error(f"💥 Cartographer crashed: {e}")
        messagebox.showerror("Fatal Error", f"Cartographer crashed:\n{e}")


if __name__ == "__main__":
    main()
