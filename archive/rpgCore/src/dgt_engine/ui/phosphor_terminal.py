"""
Phosphor Terminal - ADR 187: CRT-Style Display for Sovereign Scout
Canvas-based bitmap terminal with phosphor glow, scanlines, and energy-based effects

This terminal provides:
- CRT-style phosphor glow and color bleed
- Scanline overlay for authentic retro look
- Energy-based brownout and flicker effects
- Typewriter animation for story drips
- Physical response to ship systems
"""

import tkinter as tk
import time
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from pathlib import Path
import sys

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from loguru import logger

@dataclass
class PhosphorConfig:
    """Configuration for phosphor terminal effects"""
    # Display settings
    width: int = 80
    height: int = 24
    char_width: int = 8
    char_height: int = 16
    
    # CRT effects
    phosphor_color: str = "#00FF00"  # Classic terminal green
    phosphor_glow: str = "#00FF00"  # Glow color
    scanline_intensity: float = 0.3  # Scanline darkness
    flicker_rate: float = 0.05      # Random flicker probability
    
    # Animation settings
    typewriter_speed: float = 0.05  # Seconds per character
    phosphor_decay: float = 0.95     # Afterimage decay rate
    
    # Energy-based effects
    brownout_threshold: float = 25.0  # Energy level for brownout
    glitch_threshold: float = 10.0   # Energy level for glitches

class PhosphorTerminal:
    """Canvas-based CRT terminal with phosphor effects"""
    
    def __init__(self, parent: tk.Widget, config: Optional[PhosphorConfig] = None):
        self.config = config or PhosphorConfig()
        self.parent = parent
        
        # Terminal state
        self.buffer: List[List[str]] = [[' ' for _ in range(self.config.width)] for _ in range(self.config.height)]
        self.cursor_x = 0
        self.cursor_y = 0
        
        # Animation state
        self.typewriter_queue = []
        self.typewriter_index = 0
        self.last_typewriter_time = 0.0
        
        # Effects state
        self.energy_level = 100.0
        self.flicker_state = 1.0
        self.phosphor_afterimage: Dict[Tuple[int, int], float] = {}
        
        # Canvas components
        self.canvas: Optional[tk.Canvas] = None
        self.scanline_items: List[int] = []
        
        # Performance tracking
        self.render_count = 0
        self.last_render_time = 0.0
        
        self._create_canvas()
        logger.info("📟 Phosphor Terminal initialized with CRT effects")
    
    def _create_canvas(self):
        """Create the main terminal canvas"""
        # Calculate physical dimensions
        physical_width = self.config.width * self.config.char_width
        physical_height = self.config.height * self.config.char_height
        
        # Create canvas with dark background
        self.canvas = tk.Canvas(
            self.parent,
            width=physical_width,
            height=physical_height,
            bg='#000000',
            highlightthickness=2,
            highlightbackground='#333333'
        )
        self.canvas.pack(padx=5, pady=5)
        
        # Create scanline overlay
        self._create_scanlines()
        
        logger.info(f"✅ Phosphor canvas created: {physical_width}x{physical_height}")
    
    def _create_scanlines(self):
        """Create scanline overlay for CRT effect"""
        physical_height = self.config.height * self.config.char_height
        
        # Create horizontal scanlines
        for y in range(0, physical_height, 2):  # Every 2 pixels
            scanline = self.canvas.create_rectangle(
                0, y, self.config.width * self.config.char_width, y + 1,
                fill='#000000',
                outline='',
                stipple='gray50',
                tags='scanline'
            )
            self.scanline_items.append(scanline)
        
        logger.debug(f"📺 Created {len(self.scanline_items)} scanlines")
    
    def write_text(self, text: str, x: int = 0, y: int = 0, typewriter: bool = False):
        """Write text to terminal buffer"""
        if typewriter:
            self._queue_typewriter(text, x, y)
        else:
            self._write_direct(text, x, y)
    
    def _write_direct(self, text: str, x: int, y: int):
        """Write text directly to buffer"""
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if y + i < self.config.height:
                chars = list(line.ljust(self.config.width)[:self.config.width])
                for j, char in enumerate(chars):
                    if x + j < self.config.width:
                        self.buffer[y + i][x + j] = char
    
    def _queue_typewriter(self, text: str, x: int, y: int):
        """Queue text for typewriter effect"""
        self.typewriter_queue.append({
            'text': text,
            'x': x,
            'y': y,
            'start_time': time.time()
        })
    
    def clear(self):
        """Clear terminal buffer"""
        self.buffer = [[' ' for _ in range(self.config.width)] for _ in range(self.config.height)]
        self.cursor_x = 0
        self.cursor_y = 0
        self.typewriter_queue.clear()
        self.typewriter_index = 0
        self.phosphor_afterimage.clear()
    
    def set_energy_level(self, energy: float):
        """Set energy level for brownout effects"""
        self.energy_level = max(0, min(100, energy))
    
    def update(self) -> bool:
        """Update terminal display and effects"""
        try:
            # Update typewriter animation
            self._update_typewriter()
            
            # Update energy-based effects
            self._update_energy_effects()
            
            # Render terminal
            self._render_terminal()
            
            # Update scanlines
            self._update_scanlines()
            
            self.render_count += 1
            return True
            
        except tk.TclError:
            logger.warning("⚠️ Phosphor terminal canvas closed")
            return False
    
    def _update_typewriter(self):
        """Update typewriter animation"""
        if not self.typewriter_queue:
            return
        
        current_time = time.time()
        
        # Process each typewriter queue item
        for item in self.typewriter_queue:
            if current_time - item['start_time'] > self.last_typewriter_time:
                elapsed = current_time - item['start_time']
                chars_to_show = int(elapsed / self.config.typewriter_speed)
                
                if chars_to_show > self.typewriter_index:
                    # Show next character
                    text = item['text']
                    if self.typewriter_index < len(text):
                        char = text[self.typewriter_index]
                        x = item['x'] + self.typewriter_index
                        y = item['y']
                        
                        if 0 <= y < self.config.height and 0 <= x < self.config.width:
                            self.buffer[y][x] = char
                        
                        self.typewriter_index += 1
                        self.last_typewriter_time = elapsed
    
    def _update_energy_effects(self):
        """Update energy-based flicker and brownout"""
        # Random flicker
        if random.random() < self.config.flicker_rate:
            self.flicker_state = random.uniform(0.7, 1.0)
        else:
            self.flicker_state = 1.0
        
        # Energy-based effects
        if self.energy_level < self.config.brownout_threshold:
            # Brownout effect - reduce intensity
            energy_factor = self.energy_level / 100.0
            self.flicker_state *= energy_factor
    
    def _render_terminal(self):
        """Render terminal buffer to canvas"""
        # Clear previous text
        self.canvas.delete('text')
        self.canvas.delete('phosphor')
        
        # Calculate color based on energy and flicker
        base_color = self._apply_energy_effects(self.config.phosphor_color)
        
        # Render each character
        for y in range(self.config.height):
            for x in range(self.config.width):
                char = self.buffer[y][x]
                if char != ' ':
                    self._draw_character(x, y, char, base_color)
        
        # Apply phosphor decay to afterimages
        self._decay_phosphor()
    
    def _draw_character(self, x: int, y: int, char: str, color: str):
        """Draw a single character with phosphor glow"""
        px = x * self.config.char_width
        py = y * self.config.char_height
        
        # Check for phosphor afterimage
        pos = (x, y)
        if pos in self.phosphor_afterimage:
            # Draw afterimage with decay
            afterimage_intensity = self.phosphor_afterimage[pos]
            afterimage_color = self._adjust_color_intensity(color, afterimage_intensity)
            
            self.canvas.create_text(
                px + self.config.char_width // 2,
                py + self.config.char_height // 2,
                text=char,
                fill=afterimage_color,
                font=('Courier', self.config.char_height - 2, 'bold'),
                anchor='center',
                tags='phosphor'
            )
        
        # Draw main character
        self.canvas.create_text(
            px + self.config.char_width // 2,
            py + self.config.char_height // 2,
            text=char,
            fill=color,
            font=('Courier', self.config.char_height - 2, 'bold'),
            anchor='center',
            tags='text'
        )
        
        # Add phosphor afterimage
        self.phosphor_afterimage[pos] = 0.8  # Start with 80% intensity
    
    def _apply_energy_effects(self, color: str) -> str:
        """Apply energy-based color modifications"""
        if self.energy_level < self.config.brownout_threshold:
            # Brownout - shift towards amber/red
            energy_factor = self.energy_level / 100.0
            
            # Parse hex color
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            
            # Shift towards amber when energy is low
            r = int(r * (1 - energy_factor * 0.3) + 255 * energy_factor * 0.3)
            g = int(g * energy_factor)
            b = int(b * energy_factor * 0.2)
            
            # Apply flicker
            r = int(r * self.flicker_state)
            g = int(g * self.flicker_state)
            b = int(b * self.flicker_state)
            
            return f"#{r:02x}{g:02x}{b:02x}"
        
        return color
    
    def _adjust_color_intensity(self, color: str, intensity: float) -> str:
        """Adjust color intensity for phosphor effects"""
        r = int(color[1:3], 16)
        g = int(color[3:5], 16)
        b = int(color[5:7], 16)
        
        r = int(r * intensity)
        g = int(g * intensity)
        b = int(b * intensity)
        
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def _decay_phosphor(self):
        """Apply decay to phosphor afterimages"""
        decay_factor = self.config.phosphor_decay
        
        # Decay existing afterimages
        for pos in list(self.phosphor_afterimage.keys()):
            self.phosphor_afterimage[pos] *= decay_factor
            
            # Remove if too faint
            if self.phosphor_afterimage[pos] < 0.1:
                del self.phosphor_afterimage[pos]
    
    def _update_scanlines(self):
        """Update scanline intensity based on energy"""
        if self.energy_level < self.config.brownout_threshold:
            # Make scanlines more prominent during brownout
            intensity = int(255 * (1 - self.config.scanline_intensity * (1 - self.energy_level / 100)))
            scanline_color = f"#{intensity:02x}0000"
            
            for scanline in self.scanline_items:
                self.canvas.itemconfig(scanline, fill=scanline_color)
    
    def write_story_drip(self, story_text: str, typewriter: bool = True):
        """Write story drip with typewriter effect"""
        self.clear()
        
        # Split story into lines
        lines = story_text.split('\n')
        
        # Center story in terminal
        start_y = (self.config.height - len(lines)) // 2
        
        for i, line in enumerate(lines):
            if start_y + i < self.config.height:
                # Center line horizontally
                start_x = (self.config.width - len(line)) // 2
                self.write_text(line, start_x, start_y + i, typewriter)
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get terminal performance statistics"""
        return {
            'name': 'PhosphorTerminal',
            'render_count': self.render_count,
            'last_render_time_ms': self.last_render_time * 1000,
            'energy_level': self.energy_level,
            'flicker_state': self.flicker_state,
            'phosphor_afterimages': len(self.phosphor_afterimage),
            'typewriter_queue_size': len(self.typewriter_queue)
        }

# Factory function
def create_phosphor_terminal(parent: tk.Widget, config: Optional[PhosphorConfig] = None) -> PhosphorTerminal:
    """Create a phosphor terminal with CRT effects"""
    return PhosphorTerminal(parent, config)

# Export main components
__all__ = ['PhosphorTerminal', 'PhosphorConfig', 'create_phosphor_terminal']
