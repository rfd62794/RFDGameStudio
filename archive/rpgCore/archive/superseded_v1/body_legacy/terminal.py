"""
Terminal Body - Rich-based Console Display with Phosphor CRT Effects
High-speed, low-overhead data logs and headless monitoring with retro aesthetics
"""

import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
import sys
from pathlib import Path

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent))

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.live import Live
    from rich.layout import Layout
    from rich.text import Text
    from rich.align import Align
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from loguru import logger

# Import phosphor terminal for CRT effects
try:
    from src.ui.phosphor_terminal import PhosphorTerminal, PhosphorConfig
    PHOSPHOR_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Phosphor Terminal not available: {e}")
    PHOSPHOR_AVAILABLE = False

from .dispatcher import DisplayBody, RenderPacket, HUDData

class TerminalBody(DisplayBody):
    """Terminal display body with Rich console and Phosphor CRT effects"""
    
    def __init__(self, use_phosphor: bool = True):
        super().__init__("Terminal")
        self.use_phosphor = use_phosphor and PHOSPHOR_AVAILABLE
        
        # Rich console components
        self.console = Console() if RICH_AVAILABLE else None
        self.live_display: Optional[Live] = None
        self.current_layout: Optional[Layout] = None
        
        # Phosphor terminal components
        self.phosphor_terminal: Optional[PhosphorTerminal] = None
        self.root_window: Optional[Any] = None
        
        # Shared configuration
        self.update_interval = 0.1  # 10Hz for terminal
        self.last_update = 0.0
        
        # Story drip state
        self.story_queue = []
        self.current_story = ""
        
        logger.info(f"📟 TerminalBody initialized - Phosphor: {self.use_phosphor}, Rich: {RICH_AVAILABLE}")
        
    def _setup(self):
        """Setup terminal display (Rich or Phosphor)"""
        if self.use_phosphor and PHOSPHOR_AVAILABLE:
            self._setup_phosphor()
        elif RICH_AVAILABLE:
            self._setup_rich()
        else:
            logger.warning("⚠️ Neither Rich nor Phosphor available, terminal body disabled")
    
    def _setup_phosphor(self):
        """Setup Phosphor CRT terminal"""
        try:
            import tkinter as tk
            
            # Create root window for phosphor terminal
            self.root_window = tk.Tk()
            self.root_window.title("📟 Sovereign Scout Terminal")
            self.root_window.resizable(False, False)
            
            # Create phosphor terminal
            config = PhosphorConfig(
                width=80,
                height=24,
                phosphor_color="#00FF00",
                scanline_intensity=0.3,
                flicker_rate=0.05,
                typewriter_speed=0.05
            )
            
            self.phosphor_terminal = PhosphorTerminal(self.root_window, config)
            
            logger.info("✅ Phosphor CRT terminal setup complete")
            
        except Exception as e:
            logger.error(f"❌ Failed to setup Phosphor terminal: {e}")
            self.use_phosphor = False
            # Fallback to Rich if available
            if RICH_AVAILABLE:
                self._setup_rich()
    
    def _setup_rich(self):
        """Setup Rich console display"""
        # Create console with optimized settings
        self.console = Console(
            width=120,
            file=None,  # Use stdout
            legacy_windows=False,
            force_terminal=True,
            force_interactive=False
        )
        
        # Create layout for structured display
        self.current_layout = Layout()
        self.current_layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=3)
        )
        
        self.current_layout["body"].split_row(
            Layout(name="main", ratio=3),
            Layout(name="sidebar", ratio=1)
        )
        
        logger.info("🖥️ Rich terminal setup complete")
    
    def _render_packet(self, packet: RenderPacket):
        """Render packet to terminal (Phosphor or Rich)"""
        # Rate limiting for terminal updates
        current_time = time.time()
        if current_time - self.last_update < self.update_interval:
            return
        self.last_update = current_time
        
        if self.use_phosphor and self.phosphor_terminal:
            self._render_phosphor(packet)
        elif self.console and self.current_layout:
            self._render_rich(packet)
    
    def _render_phosphor(self, packet: RenderPacket):
        """Render packet to Phosphor CRT terminal"""
        if not self.phosphor_terminal:
            return
        
        # Extract story from packet metadata
        story_text = packet.metadata.get('story', '')
        if story_text and story_text != self.current_story:
            self.current_story = story_text
            self.phosphor_terminal.write_story_drip(story_text, typewriter=True)
        
        # Update energy level if provided
        energy = packet.metadata.get('energy')
        if energy is not None:
            self.phosphor_terminal.set_energy_level(energy)
        
        # Update terminal display
        self.phosphor_terminal.update()
        
        # Update root window if available
        if self.root_window:
            try:
                self.root_window.update()
            except:
                pass  # Window may be closed
    
    def _render_rich(self, packet: RenderPacket):
        """Render packet to Rich console"""
        # Build terminal display
        self._build_display(packet)
        
        # Update live display
        if self.live_display:
            self.live_display.update(self.current_layout)
        else:
            # Start live display for continuous updates
            self.live_display = Live(
                self.current_layout,
                console=self.console,
                refresh_per_second=10,
                transient=False
            )
            self.live_display.start()
    
    def _build_display(self, packet: RenderPacket):
        """Build the terminal layout from packet data"""
        # Header
        header_text = Text("🎭 DGT Terminal Monitor", style="bold blue")
        header_text.append(f" | Mode: {packet.mode.value}", style="dim")
        self.current_layout["header"].update(
            Panel(Align.center(header_text), style="blue")
        )
        
        # Main content
        main_content = self._build_main_content(packet)
        self.current_layout["main"].update(main_content)
        
        # Sidebar
        sidebar_content = self._build_sidebar(packet)
        self.current_layout["sidebar"].update(sidebar_content)
        
        # Footer with HUD
        footer_content = self._build_footer(packet.hud)
        self.current_layout["footer"].update(footer_content)
    
    def _build_main_content(self, packet: RenderPacket) -> Panel:
        """Build main content area"""
        if packet.layers:
            # Create table for layers/entities
            table = Table(title="🎮 Render Layers", show_header=True, header_style="bold magenta")
            table.add_column("Depth", style="cyan", width=6)
            table.add_column("Type", style="green", width=10)
            table.add_column("ID", style="yellow", width=20)
            table.add_column("Position", style="blue", width=12)
            table.add_column("Effect", style="red", width=10)
            
            for layer in packet.layers:
                pos_str = f"({layer.x},{layer.y})" if layer.x is not None else "N/A"
                effect_str = layer.effect or "None"
                
                table.add_row(
                    str(layer.depth),
                    layer.type,
                    layer.id,
                    pos_str,
                    effect_str
                )
            
            return Panel(table, title="📊 Main Display", border_style="blue")
        else:
            return Panel(
                Text("No layers to display", style="dim italic"),
                title="📊 Main Display",
                border_style="blue"
            )
    
    def _build_sidebar(self, packet: RenderPacket) -> Panel:
        """Build sidebar with metadata and stats"""
        sidebar_content = []
        
        # Packet metadata
        if packet.metadata:
            sidebar_content.append("📦 Packet Metadata:")
            for key, value in packet.metadata.items():
                if isinstance(value, (str, int, float, bool)):
                    sidebar_content.append(f"  {key}: {value}")
                else:
                    sidebar_content.append(f"  {key}: {type(value).__name__}")
        
        # Performance info
        sidebar_content.append("")
        sidebar_content.append("⚡ Performance:")
        sidebar_content.append(f"  Render Time: {self.last_render_time*1000:.2f}ms")
        sidebar_content.append(f"  Frame Count: {self.render_count}")
        
        # Timestamp
        timestamp_str = time.strftime("%H:%M:%S", time.localtime(packet.timestamp))
        sidebar_content.append("")
        sidebar_content.append(f"🕐 Time: {timestamp_str}")
        
        sidebar_text = Text("\n".join(sidebar_content), style="dim")
        return Panel(sidebar_text, title="📈 Sidebar", border_style="green")
    
    def _build_footer(self, hud: HUDData) -> Panel:
        """Build footer with HUD information"""
        hud_lines = []
        if hud.line_1:
            hud_lines.append(f"📍 {hud.line_1}")
        if hud.line_2:
            hud_lines.append(f"🎯 {hud.line_2}")
        if hud.line_3:
            hud_lines.append(f"⚡ {hud.line_3}")
        if hud.line_4:
            hud_lines.append(f"🔧 {hud.line_4}")
        
        if not hud_lines:
            hud_lines.append("📡 Ready for data...")
        
        hud_text = Text(" | ".join(hud_lines), style="bold yellow")
        return Panel(
            Align.center(hud_text),
            style="yellow",
            border_style="yellow"
        )
    
    def _cleanup(self):
        """Cleanup terminal display"""
        if self.live_display:
            self.live_display.stop()
            self.live_display = None
        
        if self.phosphor_terminal:
            self.phosphor_terminal = None
        
        if self.root_window:
            try:
                self.root_window.quit()
                self.root_window.destroy()
            except:
                pass
            self.root_window = None
        
        if self.console:
            self.console.print("🧹 Phosphor Terminal stopped", style="dim")
    
    def render_table(self, title: str, data: Dict[str, Any], style: str = "default") -> bool:
        """Convenience method to render a table"""
        if not self.console:
            return False
        
        table = Table(title=title, show_header=True)
        table.add_column("Key", style="cyan")
        table.add_column("Value", style="green")
        
        for key, value in data.items():
            table.add_row(str(key), str(value))
        
        self.console.print(table)
        return True
    
    def render_progress(self, title: str, tasks: Dict[str, float]) -> bool:
        """Convenience method to render progress bars"""
        if not self.console:
            return False
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True
        ) as progress:
            for task_name, completion in tasks.items():
                progress.add_task(task_name, total=100.0, completed=completion * 100)
        
        return True
    
    def log_message(self, message: str, level: str = "info") -> bool:
        """Log a message to the terminal"""
        if not self.console:
            return False
        
        styles = {
            "info": "blue",
            "warning": "yellow", 
            "error": "red",
            "success": "green",
            "debug": "dim"
        }
        
        style = styles.get(level, "default")
        self.console.print(f"📝 {message}", style=style)
        return True

# Factory function
def create_terminal_body() -> TerminalBody:
    """Create and initialize a terminal body"""
    body = TerminalBody()
    if not body.initialize():
        logger.error("❌ Failed to create terminal body")
        return None
    return body
