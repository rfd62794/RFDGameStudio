"""
Cockpit Body - Glass/Grid Modular Dashboard
Tkinter-based framed dashboards for IT Management or complex Sim stats
"""

import time
import tkinter as tk
from tkinter import ttk
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import sys
from pathlib import Path

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger

from .dispatcher import DisplayBody, RenderPacket, HUDData

@dataclass
class MeterConfig:
    """Configuration for a cockpit meter"""
    name: str
    min_value: float = 0.0
    max_value: float = 100.0
    units: str = ""
    color: str = "blue"
    width: int = 200
    height: int = 20

@dataclass
class LabelConfig:
    """Configuration for a cockpit label"""
    name: str
    text: str = ""
    font: str = "Arial"
    font_size: int = 10
    color: str = "black"
    width: int = 150
    height: int = 25

class CockpitBody(DisplayBody):
    """Cockpit display body using Tkinter for modular dashboard layout"""
    
    def __init__(self):
        super().__init__("Cockpit")
        self.root: Optional[tk.Tk] = None
        self.main_frame: Optional[ttk.Frame] = None
        self.meters: Dict[str, ttk.Progressbar] = {}
        self.labels: Dict[str, ttk.Label] = {}
        self.meter_configs: Dict[str, MeterConfig] = {}
        self.label_configs: Dict[str, LabelConfig] = {}
        
        # Layout configuration
        self.grid_rows = 4
        self.grid_cols = 3
        self.cell_padding = 10
        
        # Update rate (30Hz for cockpit)
        self.update_interval = 1.0 / 30.0
        self.last_update = 0.0
        
    def _setup(self):
        """Setup Tkinter root and dashboard layout"""
        # Create main window
        self.root = tk.Tk()
        self.root.title("🎮 DGT Cockpit Dashboard")
        self.root.resizable(False, False)
        
        # Configure style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Create main frame with padding
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Create grid layout
        self._create_grid_layout()
        
        # Add default instruments
        self._add_default_instruments()
        
        logger.info("🪟 Cockpit body setup complete")
    
    def _create_grid_layout(self):
        """Create the grid layout for instruments"""
        # Create title
        title_label = ttk.Label(
            self.main_frame, 
            text="🎭 DGT Cockpit Dashboard", 
            font=('Arial', 14, 'bold')
        )
        title_label.grid(row=0, column=0, columnspan=self.grid_cols, pady=(0, 10))
        
        # Create grid cells
        for row in range(1, self.grid_rows + 1):
            for col in range(self.grid_cols):
                cell_frame = ttk.LabelFrame(
                    self.main_frame, 
                    text=f"Cell {row}-{col}",
                    padding="5"
                )
                cell_frame.grid(
                    row=row, 
                    column=col, 
                    padx=self.cell_padding, 
                    pady=self.cell_padding,
                    sticky=(tk.W, tk.E, tk.N, tk.S)
                )
                
                # Store reference for later use
                setattr(self, f"cell_{row}_{col}", cell_frame)
    
    def _add_default_instruments(self):
        """Add default meters and labels to the dashboard"""
        # Default meters
        default_meters = [
            MeterConfig("fps", 0, 60, "FPS", "green"),
            MeterConfig("cpu", 0, 100, "%", "blue"),
            MeterConfig("memory", 0, 100, "%", "yellow"),
            MeterConfig("entities", 0, 1000, "", "cyan"),
            MeterConfig("render_time", 0, 100, "ms", "red"),
            MeterConfig("packets", 0, 100, "/s", "magenta"),
        ]
        
        # Place meters in grid
        meter_positions = [
            (1, 0), (1, 1), (1, 2),
            (2, 0), (2, 1), (2, 2)
        ]
        
        for meter_config, (row, col) in zip(default_meters, meter_positions):
            self.add_meter(meter_config, row, col)
        
        # Default labels
        default_labels = [
            LabelConfig("status", "📡 System Ready", font_size=12),
            LabelConfig("mode", "🎭 Terminal Mode", font_size=10),
            LabelConfig("time", "🕐 00:00:00", font_size=10),
        ]
        
        # Place labels in bottom row
        label_positions = [(3, 0), (3, 1), (3, 2)]
        
        for label_config, (row, col) in zip(default_labels, label_positions):
            self.add_label(label_config, row, col)
    
    def add_meter(self, config: MeterConfig, row: int, col: int) -> bool:
        """Add a meter to the dashboard"""
        try:
            cell_frame = getattr(self, f"cell_{row}_{col}", None)
            if not cell_frame:
                logger.error(f"❌ Invalid cell position: {row}-{col}")
                return False
            
            # Update cell title
            cell_frame.config(text=config.name.replace('_', ' ').title())
            
            # Create meter
            meter = ttk.Progressbar(
                cell_frame,
                orient='horizontal',
                length=config.width,
                mode='determinate',
                maximum=config.max_value
            )
            meter.pack(pady=5)
            
            # Create value label
            value_label = ttk.Label(
                cell_frame,
                text=f"0 {config.units}",
                font=('Arial', 9)
            )
            value_label.pack()
            
            # Store references
            self.meters[config.name] = meter
            self.meter_configs[config.name] = config
            
            # Store value label reference
            setattr(self, f"{config.name}_label", value_label)
            
            logger.debug(f"📊 Added meter: {config.name} at {row}-{col}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add meter {config.name}: {e}")
            return False
    
    def add_label(self, config: LabelConfig, row: int, col: int) -> bool:
        """Add a label to the dashboard"""
        try:
            cell_frame = getattr(self, f"cell_{row}_{col}", None)
            if not cell_frame:
                logger.error(f"❌ Invalid cell position: {row}-{col}")
                return False
            
            # Update cell title
            cell_frame.config(text=config.name.replace('_', ' ').title())
            
            # Create label
            label = ttk.Label(
                cell_frame,
                text=config.text,
                font=(config.font, config.font_size)
            )
            label.pack(pady=10)
            
            # Store references
            self.labels[config.name] = label
            self.label_configs[config.name] = config
            
            logger.debug(f"📝 Added label: {config.name} at {row}-{col}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add label {config.name}: {e}")
            return False
    
    def _render_packet(self, packet: RenderPacket):
        """Render packet to cockpit dashboard"""
        # Rate limiting
        current_time = time.time()
        if current_time - self.last_update < self.update_interval:
            return
        self.last_update = current_time
        
        # Update meters from packet data
        self._update_meters(packet)
        
        # Update labels from packet data
        self._update_labels(packet)
        
        # Update HUD
        self._update_hud(packet.hud)
        
        # Update window
        if self.root:
            self.root.update_idletasks()
    
    def _update_meters(self, packet: RenderPacket):
        """Update meters from packet data"""
        # Extract meter data from packet metadata
        meter_data = packet.metadata.get('meters', {})
        
        for meter_name, value in meter_data.items():
            if meter_name in self.meters:
                config = self.meter_configs[meter_name]
                
                # Clamp value to range
                clamped_value = max(config.min_value, min(config.max_value, float(value)))
                
                # Update progress bar
                self.meters[meter_name]['value'] = clamped_value
                
                # Update value label
                value_label = getattr(self, f"{meter_name}_label", None)
                if value_label:
                    value_label.config(text=f"{clamped_value:.1f} {config.units}")
    
    def _update_labels(self, packet: RenderPacket):
        """Update labels from packet data"""
        # Extract label data from packet metadata
        label_data = packet.metadata.get('labels', {})
        
        for label_name, text in label_data.items():
            if label_name in self.labels:
                self.labels[label_name].config(text=str(text))
    
    def _update_hud(self, hud: HUDData):
        """Update HUD display"""
        # Update status label with first HUD line
        if hud.line_1 and "status" in self.labels:
            self.labels["status"].config(text=f"📍 {hud.line_1}")
        
        # Update mode label
        if "mode" in self.labels:
            mode_text = f"🎭 {self.current_mode.upper() if hasattr(self, 'current_mode') else 'ACTIVE'}"
            self.labels["mode"].config(text=mode_text)
        
        # Update time label
        if "time" in self.labels:
            timestamp_str = time.strftime("%H:%M:%S", time.localtime())
            self.labels["time"].config(text=f"🕐 {timestamp_str}")
    
    def update_meter(self, name: str, value: float) -> bool:
        """Convenience method to update a single meter"""
        if name not in self.meters:
            return False
        
        config = self.meter_configs[name]
        clamped_value = max(config.min_value, min(config.max_value, float(value)))
        
        self.meters[name]['value'] = clamped_value
        
        value_label = getattr(self, f"{name}_label", None)
        if value_label:
            value_label.config(text=f"{clamped_value:.1f} {config.units}")
        
        return True
    
    def update_label(self, name: str, text: str) -> bool:
        """Convenience method to update a single label"""
        if name not in self.labels:
            return False
        
        self.labels[name].config(text=str(text))
        return True
    
    def _cleanup(self):
        """Cleanup Tkinter resources"""
        if self.root:
            try:
                self.root.quit()
                self.root.destroy()
            except:
                pass
            self.root = None
        
        self.meters.clear()
        self.labels.clear()
        self.meter_configs.clear()
        self.label_configs.clear()
    
    def run(self):
        """Run the cockpit dashboard (blocking)"""
        if self.root and self.is_initialized:
            try:
                self.root.mainloop()
            except KeyboardInterrupt:
                logger.info("🛑 Cockpit dashboard stopped by user")
    
    def update(self):
        """Non-blocking update"""
        if self.root and self.is_initialized:
            try:
                self.root.update()
            except tk.TclError:
                logger.warning("⚠️ Tkinter update failed, window may be closed")

# Factory function
def create_cockpit_body() -> CockpitBody:
    """Create and initialize a cockpit body"""
    body = CockpitBody()
    if not body.initialize():
        logger.error("❌ Failed to create cockpit body")
        return None
    return body
