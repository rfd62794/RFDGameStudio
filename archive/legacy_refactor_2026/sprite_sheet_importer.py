"""
Sprite Sheet Import Tool - Professional Asset Import Utility
Interactive tool for loading and cutting sprite sheets into individual sprites
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk, ImageDraw
import json
import os
from typing import Dict, List, Tuple, Optional
from pathlib import Path
from loguru import logger


class SpriteSheetImporter:
    """Interactive sprite sheet importer with visual cutting tools"""
    
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("🎨 Sprite Sheet Import Tool")
        self.root.geometry("1200x800")
        self.root.configure(bg='#2a2a2a')
        
        # Core state
        self.sheet_image: Optional[Image.Image] = None
        self.sheet_photo: Optional[ImageTk.PhotoImage] = None
        self.output_dir = Path("assets/imported_sprites")
        
        # Grid settings
        self.grid_width = 16
        self.grid_height = 16
        self.grid_offset_x = 0
        self.grid_offset_y = 0
        self.show_grid = True
        
        # Selection state
        self.selection_start: Optional[Tuple[int, int]] = None
        self.selection_end: Optional[Tuple[int, int]] = None
        self.selection_rect: Optional[int] = None
        
        # Cut sprites storage
        self.cut_sprites: List[Dict] = []
        self.sprite_names: Dict[str, int] = {}  # name -> index
        
        # Zoom and pan
        self.zoom_level = 1.0
        self.canvas_offset_x = 0
        self.canvas_offset_y = 0
        
        # Setup UI
        self._setup_ui()
        self._setup_bindings()
        
        logger.info("🎨 Sprite Sheet Import Tool initialized")
    
    def _setup_ui(self) -> None:
        """Setup the user interface"""
        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left panel - Controls
        self._setup_control_panel(main_frame)
        
        # Right panel - Canvas
        self._setup_canvas_panel(main_frame)
        
        # Bottom panel - Sprite list
        self._setup_sprite_list_panel()
    
    def _setup_control_panel(self, parent: ttk.Frame) -> None:
        """Setup the control panel"""
        control_frame = ttk.LabelFrame(parent, text="🛠️ Controls", padding=10)
        control_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        
        # File operations
        ttk.Label(control_frame, text="📁 File Operations", font=('Arial', 10, 'bold')).pack(pady=(0, 5))
        
        ttk.Button(control_frame, text="Load Sprite Sheet", command=self._load_sprite_sheet).pack(fill=tk.X, pady=2)
        ttk.Button(control_frame, text="Save Configuration", command=self._save_config).pack(fill=tk.X, pady=2)
        ttk.Button(control_frame, text="Load Configuration", command=self._load_config).pack(fill=tk.X, pady=2)
        ttk.Button(control_frame, text="Export Sprites", command=self._export_sprites).pack(fill=tk.X, pady=2)
        
        ttk.Separator(control_frame, orient='horizontal').pack(fill=tk.X, pady=10)
        
        # Grid settings
        ttk.Label(control_frame, text="📐 Grid Settings", font=('Arial', 10, 'bold')).pack(pady=(0, 5))
        
        # Grid width
        ttk.Label(control_frame, text="Cell Width:").pack(anchor=tk.W)
        self.width_var = tk.IntVar(value=16)
        width_spin = ttk.Spinbox(control_frame, from_=1, to=256, textvariable=self.width_var, width=10)
        width_spin.pack(fill=tk.X, pady=2)
        width_spin.bind('<Return>', lambda e: self._update_grid())
        
        # Grid height
        ttk.Label(control_frame, text="Cell Height:").pack(anchor=tk.W)
        self.height_var = tk.IntVar(value=16)
        height_spin = ttk.Spinbox(control_frame, from_=1, to=256, textvariable=self.height_var, width=10)
        height_spin.pack(fill=tk.X, pady=2)
        height_spin.bind('<Return>', lambda e: self._update_grid())
        
        # Grid offset
        ttk.Label(control_frame, text="Offset X:").pack(anchor=tk.W)
        self.offset_x_var = tk.IntVar(value=0)
        offset_x_spin = ttk.Spinbox(control_frame, from_=0, to=100, textvariable=self.offset_x_var, width=10)
        offset_x_spin.pack(fill=tk.X, pady=2)
        offset_x_spin.bind('<Return>', lambda e: self._update_grid())
        
        ttk.Label(control_frame, text="Offset Y:").pack(anchor=tk.W)
        self.offset_y_var = tk.IntVar(value=0)
        offset_y_spin = ttk.Spinbox(control_frame, from_=0, to=100, textvariable=self.offset_y_var, width=10)
        offset_y_spin.pack(fill=tk.X, pady=2)
        offset_y_spin.bind('<Return>', lambda e: self._update_grid())
        
        # Show grid checkbox
        self.show_grid_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(control_frame, text="Show Grid", variable=self.show_grid_var, 
                       command=self._update_grid).pack(anchor=tk.W, pady=5)
        
        ttk.Separator(control_frame, orient='horizontal').pack(fill=tk.X, pady=10)
        
        # Zoom controls
        ttk.Label(control_frame, text="🔍 Zoom", font=('Arial', 10, 'bold')).pack(pady=(0, 5))
        
        zoom_frame = ttk.Frame(control_frame)
        zoom_frame.pack(fill=tk.X)
        
        ttk.Button(zoom_frame, text="Zoom In", command=self._zoom_in, width=8).pack(side=tk.LEFT, padx=2)
        ttk.Button(zoom_frame, text="Zoom Out", command=self._zoom_out, width=8).pack(side=tk.LEFT, padx=2)
        ttk.Button(zoom_frame, text="Reset", command=self._reset_view, width=8).pack(side=tk.LEFT, padx=2)
        
        # Zoom level display
        self.zoom_label = ttk.Label(control_frame, text="Zoom: 100%")
        self.zoom_label.pack(anchor=tk.W, pady=2)
        
        ttk.Separator(control_frame, orient='horizontal').pack(fill=tk.X, pady=10)
        
        # Selection info
        ttk.Label(control_frame, text="📏 Selection", font=('Arial', 10, 'bold')).pack(pady=(0, 5))
        
        self.selection_info = ttk.Label(control_frame, text="No selection")
        self.selection_info.pack(anchor=tk.W, pady=2)
        
        # Cut button
        self.cut_button = ttk.Button(control_frame, text="Cut Selected", command=self._cut_selection, 
                                    state=tk.DISABLED)
        self.cut_button.pack(fill=tk.X, pady=5)
        
        # Auto-cut button
        self.auto_cut_button = ttk.Button(control_frame, text="Auto-Cut Grid", command=self._auto_cut_grid, 
                                         state=tk.DISABLED)
        self.auto_cut_button.pack(fill=tk.X, pady=2)
        
        ttk.Separator(control_frame, orient='horizontal').pack(fill=tk.X, pady=10)
        
        # Instructions
        ttk.Label(control_frame, text="📖 Instructions", font=('Arial', 10, 'bold')).pack(pady=(0, 5))
        
        instructions = [
            "1. Load a sprite sheet",
            "2. Adjust grid settings",
            "3. Click and drag to select",
            "4. Cut selected sprites",
            "5. Export when done"
        ]
        
        for instruction in instructions:
            ttk.Label(control_frame, text=instruction, font=('Arial', 8)).pack(anchor=tk.W, pady=1)
    
    def _setup_canvas_panel(self, parent: ttk.Frame) -> None:
        """Setup the canvas panel"""
        canvas_frame = ttk.LabelFrame(parent, text="🖼️ Sprite Sheet", padding=5)
        canvas_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Canvas with scrollbars
        canvas_container = ttk.Frame(canvas_frame)
        canvas_container.pack(fill=tk.BOTH, expand=True)
        
        # Canvas
        self.canvas = tk.Canvas(canvas_container, bg='#1a1a1a', highlightthickness=0)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(canvas_container, orient=tk.VERTICAL, command=self.canvas.yview)
        h_scrollbar = ttk.Scrollbar(canvas_container, orient=tk.HORIZONTAL, command=self.canvas.xview)
        
        self.canvas.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Grid layout
        self.canvas.grid(row=0, column=0, sticky='nsew')
        v_scrollbar.grid(row=0, column=1, sticky='ns')
        h_scrollbar.grid(row=1, column=0, sticky='ew')
        
        canvas_container.grid_rowconfigure(0, weight=1)
        canvas_container.grid_columnconfigure(0, weight=1)
        
        # Status label
        self.status_label = ttk.Label(canvas_frame, text="No sprite sheet loaded", font=('Arial', 9))
        self.status_label.pack(pady=5)
    
    def _setup_sprite_list_panel(self) -> None:
        """Setup the sprite list panel"""
        list_frame = ttk.LabelFrame(self.root, text="📋 Cut Sprites", padding=5)
        list_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        # Listbox with scrollbar
        list_container = ttk.Frame(list_frame)
        list_container.pack(fill=tk.BOTH, expand=True)
        
        self.sprite_listbox = tk.Listbox(list_container, height=6, bg='#2a2a2a', fg='white', 
                                         selectmode=tk.SINGLE)
        sprite_scrollbar = ttk.Scrollbar(list_container, orient=tk.VERTICAL, command=self.sprite_listbox.yview)
        self.sprite_listbox.configure(yscrollcommand=sprite_scrollbar.set)
        
        self.sprite_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        sprite_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Sprite list buttons
        button_frame = ttk.Frame(list_frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="Rename", command=self._rename_sprite).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Delete", command=self._delete_sprite).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Clear All", command=self._clear_sprites).pack(side=tk.LEFT, padx=2)
    
    def _setup_bindings(self) -> None:
        """Setup keyboard and mouse bindings"""
        # Canvas mouse events
        self.canvas.bind('<Button-1>', self._on_canvas_click)
        self.canvas.bind('<B1-Motion>', self._on_canvas_drag)
        self.canvas.bind('<ButtonRelease-1>', self._on_canvas_release)
        self.canvas.bind('<MouseWheel>', self._on_mouse_wheel)
        
        # Keyboard shortcuts
        self.root.bind('<Control-o>', lambda e: self._load_sprite_sheet())
        self.root.bind('<Control-s>', lambda e: self._save_config())
        self.root.bind('<Control-e>', lambda e: self._export_sprites())
        self.root.bind('<Delete>', lambda e: self._delete_sprite())
        
        # Sprite list double-click
        self.sprite_listbox.bind('<Double-Button-1>', self._on_sprite_double_click)
    
    def _load_sprite_sheet(self) -> None:
        """Load a sprite sheet from file"""
        file_path = filedialog.askopenfilename(
            title="Select Sprite Sheet",
            filetypes=[
                ("Image files", "*.png *.jpg *.jpeg *.gif *.bmp"),
                ("PNG files", "*.png"),
                ("All files", "*.*")
            ]
        )
        
        if not file_path:
            return
        
        try:
            # Load image
            self.sheet_image = Image.open(file_path)
            logger.info(f"📄 Loaded sprite sheet: {file_path} ({self.sheet_image.size[0]}x{self.sheet_image.size[1]})")
            
            # Update canvas
            self._update_canvas()
            
            # Enable controls
            self.auto_cut_button.config(state=tk.NORMAL)
            
            # Update status
            self.status_label.config(text=f"Loaded: {os.path.basename(file_path)}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load sprite sheet:\n{e}")
            logger.error(f"⚠️ Error loading sprite sheet: {e}")
    
    def _update_canvas(self) -> None:
        """Update the canvas with the sprite sheet"""
        if not self.sheet_image:
            return
        
        # Apply zoom
        display_size = (
            int(self.sheet_image.size[0] * self.zoom_level),
            int(self.sheet_image.size[1] * self.zoom_level)
        )
        
        display_image = self.sheet_image.resize(display_size, Image.Resampling.NEAREST)
        self.sheet_photo = ImageTk.PhotoImage(display_image)
        
        # Clear canvas
        self.canvas.delete("all")
        
        # Draw image
        self.canvas.create_image(
            self.canvas_offset_x, self.canvas_offset_y,
            image=self.sheet_photo, anchor='nw', tags="sheet"
        )
        
        # Update scroll region
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        
        # Draw grid
        if self.show_grid:
            self._draw_grid()
        
        # Draw selection
        if self.selection_start and self.selection_end:
            self._draw_selection()
    
    def _draw_grid(self) -> None:
        """Draw grid lines on the canvas"""
        if not self.sheet_image:
            return
        
        # Calculate grid parameters
        cell_width = self.grid_width * self.zoom_level
        cell_height = self.grid_height * self.zoom_level
        offset_x = self.grid_offset_x * self.zoom_level + self.canvas_offset_x
        offset_y = self.grid_offset_y * self.zoom_level + self.canvas_offset_y
        
        # Draw vertical lines
        x = offset_x
        while x < offset_x + self.sheet_image.size[0] * self.zoom_level:
            self.canvas.create_line(x, offset_y, x, offset_y + self.sheet_image.size[1] * self.zoom_level,
                                   fill='#444444', tags="grid")
            x += cell_width
        
        # Draw horizontal lines
        y = offset_y
        while y < offset_y + self.sheet_image.size[1] * self.zoom_level:
            self.canvas.create_line(offset_x, y, offset_x + self.sheet_image.size[0] * self.zoom_level, y,
                                   fill='#444444', tags="grid")
            y += cell_height
    
    def _draw_selection(self) -> None:
        """Draw selection rectangle"""
        if not self.selection_start or not self.selection_end:
            return
        
        # Calculate rectangle coordinates
        x1 = min(self.selection_start[0], self.selection_end[0])
        y1 = min(self.selection_start[1], self.selection_end[1])
        x2 = max(self.selection_start[0], self.selection_end[0])
        y2 = max(self.selection_start[1], self.selection_end[1])
        
        # Draw selection rectangle
        self.selection_rect = self.canvas.create_rectangle(
            x1, y1, x2, y2,
            outline='#00ff00', width=2, tags="selection"
        )
        
        # Update selection info
        width = x2 - x1
        height = y2 - y1
        self.selection_info.config(text=f"Selection: {width}x{height} at ({x1}, {y1})")
    
    def _on_canvas_click(self, event) -> None:
        """Handle canvas click"""
        if not self.sheet_image:
            return
        
        # Start selection
        self.selection_start = (event.x, event.y)
        self.selection_end = None
        
        # Clear previous selection
        self.canvas.delete("selection")
    
    def _on_canvas_drag(self, event) -> None:
        """Handle canvas drag"""
        if not self.selection_start:
            return
        
        # Update selection
        self.selection_end = (event.x, event.y)
        
        # Redraw selection
        self.canvas.delete("selection")
        self._draw_selection()
    
    def _on_canvas_release(self, event) -> None:
        """Handle canvas release"""
        if not self.selection_start:
            return
        
        # Finalize selection
        self.selection_end = (event.x, event.y)
        
        # Enable cut button if we have a valid selection
        if self._has_valid_selection():
            self.cut_button.config(state=tk.NORMAL)
        else:
            self.cut_button.config(state=tk.DISABLED)
    
    def _on_mouse_wheel(self, event) -> None:
        """Handle mouse wheel for zooming"""
        if event.delta > 0:
            self._zoom_in()
        else:
            self._zoom_out()
    
    def _on_sprite_double_click(self, event) -> None:
        """Handle sprite double-click"""
        selection = self.sprite_listbox.curselection()
        if selection:
            self._rename_sprite()
    
    def _has_valid_selection(self) -> bool:
        """Check if current selection is valid"""
        if not self.selection_start or not self.selection_end:
            return False
        
        # Check minimum size
        x1, y1 = self.selection_start
        x2, y2 = self.selection_end
        width = abs(x2 - x1)
        height = abs(y2 - y1)
        
        return width >= 8 and height >= 8  # Minimum 8x8 pixels
    
    def _update_grid(self) -> None:
        """Update grid parameters"""
        self.grid_width = self.width_var.get()
        self.grid_height = self.height_var.get()
        self.grid_offset_x = self.offset_x_var.get()
        self.grid_offset_y = self.offset_y_var.get()
        self.show_grid = self.show_grid_var.get()
        
        # Redraw canvas
        self._update_canvas()
    
    def _zoom_in(self) -> None:
        """Zoom in"""
        if self.zoom_level < 4.0:
            self.zoom_level *= 1.2
            self._update_zoom_display()
            self._update_canvas()
    
    def _zoom_out(self) -> None:
        """Zoom out"""
        if self.zoom_level > 0.25:
            self.zoom_level /= 1.2
            self._update_zoom_display()
            self._update_canvas()
    
    def _reset_view(self) -> None:
        """Reset zoom and pan"""
        self.zoom_level = 1.0
        self.canvas_offset_x = 0
        self.canvas_offset_y = 0
        self._update_zoom_display()
        self._update_canvas()
    
    def _update_zoom_display(self) -> None:
        """Update zoom level display"""
        self.zoom_label.config(text=f"Zoom: {int(self.zoom_level * 100)}%")
    
    def _cut_selection(self) -> None:
        """Cut the selected area into a sprite"""
        if not self._has_valid_selection():
            return
        
        # Convert canvas coordinates to image coordinates
        x1 = min(self.selection_start[0], self.selection_end[0])
        y1 = min(self.selection_start[1], self.selection_end[1])
        x2 = max(self.selection_start[0], self.selection_end[0])
        y2 = max(self.selection_start[1], self.selection_end[1])
        
        # Convert to image coordinates (account for zoom and offset)
        img_x1 = int((x1 - self.canvas_offset_x) / self.zoom_level)
        img_y1 = int((y1 - self.canvas_offset_y) / self.zoom_level)
        img_x2 = int((x2 - self.canvas_offset_x) / self.zoom_level)
        img_y2 = int((y2 - self.canvas_offset_y) / self.zoom_level)
        
        # Ensure coordinates are within image bounds
        img_x1 = max(0, min(img_x1, self.sheet_image.size[0]))
        img_y1 = max(0, min(img_y1, self.sheet_image.size[1]))
        img_x2 = max(0, min(img_x2, self.sheet_image.size[0]))
        img_y2 = max(0, min(img_y2, self.sheet_image.size[1]))
        
        # Cut sprite
        sprite_image = self.sheet_image.crop((img_x1, img_y1, img_x2, img_y2))
        
        # Generate name
        sprite_name = f"sprite_{len(self.cut_sprites) + 1}"
        
        # Store sprite
        sprite_data = {
            'name': sprite_name,
            'image': sprite_image,
            'rect': (img_x1, img_y1, img_x2, img_y2),
            'size': (img_x2 - img_x1, img_y2 - img_y1)
        }
        
        self.cut_sprites.append(sprite_data)
        self.sprite_names[sprite_name] = len(self.cut_sprites) - 1
        
        # Update list
        self.sprite_listbox.insert(tk.END, f"{sprite_name} ({sprite_data['size'][0]}x{sprite_data['size'][1]})")
        
        # Clear selection
        self.canvas.delete("selection")
        self.selection_start = None
        self.selection_end = None
        self.cut_button.config(state=tk.DISABLED)
        self.selection_info.config(text="No selection")
        
        logger.info(f"✂️ Cut sprite: {sprite_name} at ({img_x1}, {img_y1})")
    
    def _auto_cut_grid(self) -> None:
        """Automatically cut sprites based on grid settings"""
        if not self.sheet_image:
            return
        
        # Clear existing sprites
        self.cut_sprites.clear()
        self.sprite_names.clear()
        self.sprite_listbox.delete(0, tk.END)
        
        # Calculate grid dimensions
        cell_width = self.grid_width
        cell_height = self.grid_height
        offset_x = self.grid_offset_x
        offset_y = self.grid_offset_y
        
        # Calculate number of cells
        sheet_width, sheet_height = self.sheet_image.size
        cols = (sheet_width - offset_x) // cell_width
        rows = (sheet_height - offset_y) // cell_height
        
        sprites_cut = 0
        
        # Cut each cell
        for row in range(rows):
            for col in range(cols):
                x1 = offset_x + col * cell_width
                y1 = offset_y + row * cell_height
                x2 = min(x1 + cell_width, sheet_width)
                y2 = min(y1 + cell_height, sheet_height)
                
                # Skip if cell is empty (optional - could add detection here)
                if x2 <= x1 or y2 <= y1:
                    continue
                
                # Cut sprite
                sprite_image = self.sheet_image.crop((x1, y1, x2, y2))
                sprite_name = f"sprite_{row}_{col}"
                
                sprite_data = {
                    'name': sprite_name,
                    'image': sprite_image,
                    'rect': (x1, y1, x2, y2),
                    'size': (x2 - x1, y2 - y1)
                }
                
                self.cut_sprites.append(sprite_data)
                self.sprite_names[sprite_name] = len(self.cut_sprites) - 1
                
                # Update list
                self.sprite_listbox.insert(tk.END, f"{sprite_name} ({sprite_data['size'][0]}x{sprite_data['size'][1]})")
                sprites_cut += 1
        
        logger.info(f"🍞 Auto-cut {sprites_cut} sprites from grid")
        messagebox.showinfo("Auto-Cut Complete", f"Cut {sprites_cut} sprites from the grid.")
    
    def _rename_sprite(self) -> None:
        """Rename selected sprite"""
        selection = self.sprite_listbox.curselection()
        if not selection:
            return
        
        index = selection[0]
        old_name = self.cut_sprites[index]['name']
        
        # Simple rename dialog
        dialog = tk.Toplevel(self.root)
        dialog.title("Rename Sprite")
        dialog.geometry("300x100")
        dialog.configure(bg='#2a2a2a')
        
        ttk.Label(dialog, text="New name:").pack(pady=10)
        
        name_var = tk.StringVar(value=old_name)
        entry = ttk.Entry(dialog, textvariable=name_var)
        entry.pack(pady=5)
        entry.select_range(0, tk.END)
        entry.focus()
        
        def do_rename():
            new_name = name_var.get().strip()
            if new_name and new_name != old_name:
                # Update sprite name
                self.cut_sprites[index]['name'] = new_name
                
                # Update name mapping
                del self.sprite_names[old_name]
                self.sprite_names[new_name] = index
                
                # Update listbox
                sprite = self.cut_sprites[index]
                self.sprite_listbox.delete(index)
                self.sprite_listbox.insert(index, f"{new_name} ({sprite['size'][0]}x{sprite['size'][1]})")
                
                logger.info(f"✏️ Renamed sprite: {old_name} -> {new_name}")
            
            dialog.destroy()
        
        ttk.Button(dialog, text="Rename", command=do_rename).pack(pady=10)
        
        # Bind Enter key
        entry.bind('<Return>', lambda e: do_rename())
    
    def _delete_sprite(self) -> None:
        """Delete selected sprite"""
        selection = self.sprite_listbox.curselection()
        if not selection:
            return
        
        index = selection[0]
        sprite_name = self.cut_sprites[index]['name']
        
        # Remove from storage
        del self.cut_sprites[index]
        del self.sprite_names[sprite_name]
        
        # Update listbox
        self.sprite_listbox.delete(index)
        
        # Update name mapping indices
        for i, sprite in enumerate(self.cut_sprites):
            self.sprite_names[sprite['name']] = i
        
        logger.info(f"🗑️ Deleted sprite: {sprite_name}")
    
    def _clear_sprites(self) -> None:
        """Clear all sprites"""
        if not self.cut_sprites:
            return
        
        if messagebox.askyesno("Clear All", "Delete all cut sprites?"):
            self.cut_sprites.clear()
            self.sprite_names.clear()
            self.sprite_listbox.delete(0, tk.END)
            
            logger.info("🗑️ Cleared all sprites")
    
    def _save_config(self) -> None:
        """Save current configuration to JSON"""
        if not self.cut_sprites:
            messagebox.showwarning("No Sprites", "No sprites to save.")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="Save Configuration",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            config = {
                'grid_width': self.grid_width,
                'grid_height': self.grid_height,
                'grid_offset_x': self.grid_offset_x,
                'grid_offset_y': self.grid_offset_y,
                'sprites': []
            }
            
            for sprite in self.cut_sprites:
                # Convert image to base64 for JSON storage (simplified - just save rect)
                sprite_config = {
                    'name': sprite['name'],
                    'rect': sprite['rect'],
                    'size': sprite['size']
                }
                config['sprites'].append(sprite_config)
            
            with open(file_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            logger.info(f"💾 Saved configuration: {file_path}")
            messagebox.showinfo("Success", f"Configuration saved to {file_path}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save configuration:\n{e}")
            logger.error(f"⚠️ Error saving configuration: {e}")
    
    def _load_config(self) -> None:
        """Load configuration from JSON"""
        file_path = filedialog.askopenfilename(
            title="Load Configuration",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            with open(file_path, 'r') as f:
                config = json.load(f)
            
            # Load grid settings
            self.width_var.set(config.get('grid_width', 16))
            self.height_var.set(config.get('grid_height', 16))
            self.offset_x_var.set(config.get('grid_offset_x', 0))
            self.offset_y_var.set(config.get('grid_offset_y', 0))
            
            self._update_grid()
            
            # Load sprites (if sheet is loaded)
            if self.sheet_image and 'sprites' in config:
                self.cut_sprites.clear()
                self.sprite_names.clear()
                self.sprite_listbox.delete(0, tk.END)
                
                for sprite_config in config['sprites']:
                    x1, y1, x2, y2 = sprite_config['rect']
                    sprite_image = self.sheet_image.crop((x1, y1, x2, y2))
                    
                    sprite_data = {
                        'name': sprite_config['name'],
                        'image': sprite_image,
                        'rect': sprite_config['rect'],
                        'size': sprite_config['size']
                    }
                    
                    self.cut_sprites.append(sprite_data)
                    self.sprite_names[sprite_data['name']] = len(self.cut_sprites) - 1
                    
                    # Update list
                    self.sprite_listbox.insert(tk.END, f"{sprite_data['name']} ({sprite_data['size'][0]}x{sprite_data['size'][1]})")
            
            logger.info(f"📂 Loaded configuration: {file_path}")
            messagebox.showinfo("Success", f"Configuration loaded from {file_path}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load configuration:\n{e}")
            logger.error(f"⚠️ Error loading configuration: {e}")
    
    def _export_sprites(self) -> None:
        """Export cut sprites to files"""
        if not self.cut_sprites:
            messagebox.showwarning("No Sprites", "No sprites to export.")
            return
        
        # Choose output directory
        output_dir = filedialog.askdirectory(title="Select Output Directory")
        if not output_dir:
            return
        
        try:
            output_path = Path(output_dir)
            output_path.mkdir(exist_ok=True)
            
            # Export each sprite
            for sprite in self.cut_sprites:
                sprite_file = output_path / f"{sprite['name']}.png"
                sprite['image'].save(sprite_file)
            
            # Create metadata file
            metadata = {
                'total_sprites': len(self.cut_sprites),
                'grid_settings': {
                    'width': self.grid_width,
                    'height': self.grid_height,
                    'offset_x': self.grid_offset_x,
                    'offset_y': self.grid_offset_y
                },
                'sprites': []
            }
            
            for sprite in self.cut_sprites:
                metadata['sprites'].append({
                    'name': sprite['name'],
                    'file': f"{sprite['name']}.png",
                    'rect': sprite['rect'],
                    'size': sprite['size']
                })
            
            metadata_file = output_path / "sprites_metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"📤 Exported {len(self.cut_sprites)} sprites to {output_path}")
            messagebox.showinfo("Export Complete", f"Exported {len(self.cut_sprites)} sprites to {output_path}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export sprites:\n{e}")
            logger.error(f"⚠️ Error exporting sprites: {e}")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = SpriteSheetImporter(root)
    root.mainloop()


if __name__ == "__main__":
    main()
