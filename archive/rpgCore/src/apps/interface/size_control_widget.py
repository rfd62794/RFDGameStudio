"""
Size Control Widget - Dynamic Gameplay Size Options
Provides UI controls for changing render panel size configurations
"""

import tkinter as tk
from tkinter import ttk
from typing import List, Dict, Any, Callable, Optional
from loguru import logger

from engines.view.render_panel import RenderPanel


class SizeControlWidget:
    """Widget for controlling render panel size and scaling"""
    
    def __init__(self, parent_frame: tk.Widget, render_panel: RenderPanel, 
                 on_size_change: Optional[Callable[[str], None]] = None):
        self.parent_frame = parent_frame
        self.render_panel = render_panel
        self.on_size_change = on_size_change
        
        # Create frame
        self.frame = ttk.LabelFrame(parent_frame, text="Game Size Options", padding=10)
        self.frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Size selection
        self.size_var = tk.StringVar(value="standard")
        self.available_sizes = render_panel.get_available_sizes()
        
        # Create controls
        self._create_controls()
        
        logger.info("📏 SizeControlWidget initialized")
    
    def _create_controls(self) -> None:
        """Create size control widgets"""
        # Size selection dropdown
        size_frame = ttk.Frame(self.frame)
        size_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(size_frame, text="Game Size:").pack(side=tk.LEFT, padx=5)
        
        self.size_combo = ttk.Combobox(size_frame, textvariable=self.size_var, 
                                      values=self.available_sizes, state="readonly")
        self.size_combo.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        # Bind selection change
        self.size_combo.bind('<<ComboboxSelected>>', self._on_size_change)
        
        # Current size info
        self.info_frame = ttk.Frame(self.frame)
        self.info_frame.pack(fill=tk.X, pady=5)
        
        self.info_label = ttk.Label(self.info_frame, text="")
        self.info_label.pack(side=tk.LEFT)
        
        # Apply button
        self.apply_button = ttk.Button(self.frame, text="Apply Size", command=self._apply_size)
        self.apply_button.pack(side=tk.RIGHT, padx=5)
        
        # Update initial info
        self._update_info()
    
    def _on_size_change(self, event) -> None:
        """Handle size selection change"""
        selected_size = self.size_var.get()
        self._update_info()
        logger.debug(f"Size selection changed to: {selected_size}")
    
    def _update_info(self) -> None:
        """Update size information display"""
        try:
            size_info = self.render_panel.get_current_size_info()
            info_text = f"{size_info['size_name']} - {size_info['world_width']}x{size_info['world_height']} (Scale: {size_info['scale_factor']}x)"
            self.info_label.config(text=info_text)
        except Exception as e:
            logger.error(f"Failed to update size info: {e}")
            self.info_label.config(text="Size info unavailable")
    
    def _apply_size(self) -> None:
        """Apply selected size configuration"""
        try:
            selected_size = self.size_var.get()
            
            # Change render panel size
            result = self.render_panel.change_size(selected_size)
            
            if result.success:
                logger.info(f"📏 Size changed to: {selected_size}")
                
                # Notify parent if callback provided
                if self.on_size_change:
                    self.on_size_change(selected_size)
                
                # Update info display
                self._update_info()
            else:
                logger.error(f"Failed to change size: {result.error}")
                
        except Exception as e:
            logger.error(f"Error applying size change: {e}")
    
    def set_size(self, size_option: str) -> bool:
        """Set size programmatically"""
        try:
            if size_option not in self.available_sizes:
                logger.error(f"Unknown size option: {size_option}")
                return False
            
            self.size_var.set(size_option)
            self._apply_size()
            return True
            
        except Exception as e:
            logger.error(f"Error setting size: {e}")
            return False
    
    def get_current_size(self) -> str:
        """Get currently selected size"""
        return self.size_var.get()
    
    def get_available_sizes(self) -> List[str]:
        """Get list of available sizes"""
        return self.available_sizes.copy()


def create_size_control_widget(parent_frame: tk.Widget, render_panel: RenderPanel,
                              on_size_change: Optional[Callable[[str], None]] = None) -> SizeControlWidget:
    """Create a size control widget"""
    return SizeControlWidget(parent_frame, render_panel, on_size_change)
