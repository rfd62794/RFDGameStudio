"""
Display Dispatcher - ADR 120: Tri-Modal Rendering Bridge
Routes Universal Render Packets to appropriate display body based on mode
"""

import time
from typing import Dict, Any, Optional, Union
from enum import Enum
from dataclasses import dataclass, field
from pathlib import Path
import sys

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent))

from pydantic import BaseModel, Field, ConfigDict
from loguru import logger

class DisplayMode(Enum):
    """Three display lenses for different environmental pressures"""
    TERMINAL = "terminal"  # Console/CLI - High-speed, low-overhead
    COCKPIT = "cockpit"    # Glass/Grid - Modular dashboards
    PPU = "ppu"           # Near-Gameboy - 60Hz dithered rendering

@dataclass
class RenderLayer:
    """Universal render layer specification"""
    depth: int
    type: str  # "baked", "dynamic", "effect"
    id: str
    x: Optional[int] = None
    y: Optional[int] = None
    effect: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass 
class HUDData:
    """Heads-up display data"""
    line_1: str = ""
    line_2: str = ""
    line_3: str = ""
    line_4: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

class RenderPacket(BaseModel):
    """Universal render packet for stateless rendering"""
    mode: DisplayMode
    layers: list[RenderLayer] = Field(default_factory=list)
    hud: HUDData = Field(default_factory=HUDData)
    timestamp: float = Field(default_factory=time.time)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = ConfigDict(arbitrary_types_allowed=True)

class DisplayBody:
    """Abstract base class for all display bodies"""
    
    def __init__(self, name: str):
        self.name = name
        self.is_initialized = False
        self.last_render_time = 0.0
        self.render_count = 0
        
    def initialize(self) -> bool:
        """Initialize the display body"""
        try:
            logger.info(f"🎭 Initializing {self.name} display body")
            self._setup()
            self.is_initialized = True
            logger.success(f"✅ {self.name} display body ready")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize {self.name}: {e}")
            return False
    
    def render(self, packet: RenderPacket) -> bool:
        """Render a universal packet"""
        if not self.is_initialized:
            logger.warning(f"⚠️ {self.name} not initialized, skipping render")
            return False
            
        try:
            start_time = time.time()
            self._render_packet(packet)
            self.last_render_time = time.time() - start_time
            self.render_count += 1
            
            if self.render_count % 60 == 0:  # Log every 60 frames
                logger.debug(f"📊 {self.name} render: {self.last_render_time*1000:.2f}ms")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ {self.name} render failed: {e}")
            return False
    
    def cleanup(self):
        """Cleanup resources"""
        try:
            self._cleanup()
            logger.info(f"🧹 {self.name} cleaned up")
        except Exception as e:
            logger.error(f"❌ {self.name} cleanup failed: {e}")
    
    # Abstract methods to be implemented by concrete bodies
    def _setup(self):
        """Setup display-specific resources"""
        raise NotImplementedError
    
    def _render_packet(self, packet: RenderPacket):
        """Render packet implementation"""
        raise NotImplementedError
    
    def _cleanup(self):
        """Cleanup display-specific resources"""
        raise NotImplementedError
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            'name': self.name,
            'initialized': self.is_initialized,
            'last_render_time_ms': self.last_render_time * 1000,
            'render_count': self.render_count,
            'avg_fps': 1.0 / self.last_render_time if self.last_render_time > 0 else 0,
        }

class DisplayDispatcher:
    """
    Tri-Modal Display Dispatcher
    Routes render packets to the appropriate display body based on mode
    """
    
    def __init__(self, default_mode: DisplayMode = DisplayMode.TERMINAL):
        self.default_mode = default_mode
        self.current_mode = default_mode
        self.bodies: Dict[DisplayMode, DisplayBody] = {}
        self.active_body: Optional[DisplayBody] = None
        self.packet_history: list[RenderPacket] = []
        self.max_history = 100
        
        logger.info(f"🎭 Display Dispatcher initialized with {default_mode.value} mode")
    
    def register_body(self, mode: DisplayMode, body: DisplayBody):
        """Register a display body for a specific mode"""
        self.bodies[mode] = body
        logger.info(f"📋 Registered {body.name} for {mode.value} mode")
        
        # Set as active if this is the current mode
        if mode == self.current_mode:
            self.active_body = body
    
    def set_mode(self, mode: DisplayMode) -> bool:
        """Switch display mode"""
        if mode not in self.bodies:
            logger.error(f"❌ No body registered for {mode.value} mode")
            return False
        
        # Cleanup current body
        if self.active_body:
            self.active_body.cleanup()
        
        # Switch to new mode
        self.current_mode = mode
        self.active_body = self.bodies[mode]
        
        # Initialize new body if needed
        if not self.active_body.is_initialized:
            if not self.active_body.initialize():
                logger.error(f"❌ Failed to initialize {mode.value} body")
                return False
        
        logger.success(f"🎭 Switched to {mode.value} mode")
        return True
    
    def render(self, packet: RenderPacket) -> bool:
        """Render a packet using the current mode"""
        # Store packet in history
        self.packet_history.append(packet)
        if len(self.packet_history) > self.max_history:
            self.packet_history.pop(0)
        
        # Override mode if packet specifies different mode
        if packet.mode != self.current_mode:
            if not self.set_mode(packet.mode):
                return False
        
        # Render with active body
        if self.active_body:
            return self.active_body.render(packet)
        else:
            logger.error("❌ No active display body")
            return False
    
    def render_state(self, state_data: Dict[str, Any], mode: Optional[DisplayMode] = None) -> bool:
        """Convenience method to render raw state data"""
        # Convert state to render packet
        packet = self._state_to_packet(state_data, mode or self.current_mode)
        return self.render(packet)
    
    def _state_to_packet(self, state: Dict[str, Any], mode: DisplayMode) -> RenderPacket:
        """Convert state data to render packet"""
        # Extract layers from state
        layers = []
        
        # Handle entities/objects
        if 'entities' in state:
            for i, entity in enumerate(state['entities']):
                layer = RenderLayer(
                    depth=i,
                    type="dynamic",
                    id=entity.get('id', f'entity_{i}'),
                    x=entity.get('x'),
                    y=entity.get('y'),
                    effect=entity.get('effect'),
                    metadata=entity
                )
                layers.append(layer)
        
        # Handle background
        if 'background' in state:
            bg = state['background']
            layers.append(RenderLayer(
                depth=-1,
                type="baked",
                id=bg.get('id', 'background'),
                metadata=bg
            ))
        
        # Handle HUD
        hud_data = HUDData()
        if 'hud' in state:
            hud = state['hud']
            hud_data.line_1 = hud.get('line_1', '')
            hud_data.line_2 = hud.get('line_2', '')
            hud_data.line_3 = hud.get('line_3', '')
            hud_data.line_4 = hud.get('line_4', '')
            hud_data.metadata = hud
        
        return RenderPacket(
            mode=mode,
            layers=layers,
            hud=hud_data,
            metadata=state
        )
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics for all bodies"""
        stats = {
            'dispatcher': {
                'current_mode': self.current_mode.value,
                'active_body': self.active_body.name if self.active_body else None,
                'registered_bodies': list(self.bodies.keys()),
                'packet_history_size': len(self.packet_history),
            },
            'bodies': {}
        }
        
        for mode, body in self.bodies.items():
            stats['bodies'][mode.value] = body.get_performance_stats()
        
        return stats
    
    def cleanup(self):
        """Cleanup all display bodies"""
        for body in self.bodies.values():
            body.cleanup()
        
        self.active_body = None
        logger.info("🧹 Display dispatcher cleaned up")

# Convenience functions for creating common packets
def create_ppu_packet(layers: list[Dict[str, Any]], hud_lines: list[str] = None) -> RenderPacket:
    """Create a PPU render packet"""
    render_layers = []
    for i, layer_data in enumerate(layers):
        render_layers.append(RenderLayer(
            depth=layer_data.get('depth', i),
            type=layer_data.get('type', 'dynamic'),
            id=layer_data['id'],
            x=layer_data.get('x'),
            y=layer_data.get('y'),
            effect=layer_data.get('effect'),
            metadata=layer_data
        ))
    
    hud = HUDData()
    if hud_lines:
        for i, line in enumerate(hud_lines[:4]):
            setattr(hud, f'line_{i+1}', line)
    
    return RenderPacket(mode=DisplayMode.PPU, layers=render_layers, hud=hud)

def create_terminal_packet(data: Dict[str, Any], title: str = "") -> RenderPacket:
    """Create a terminal render packet"""
    layers = [RenderLayer(
        depth=0,
        type="baked",
        id="console_data",
        metadata={'data': data, 'title': title}
    )]
    
    return RenderPacket(mode=DisplayMode.TERMINAL, layers=layers)

def create_cockpit_packet(meters: Dict[str, float], labels: Dict[str, str] = None) -> RenderPacket:
    """Create a cockpit render packet"""
    layers = [RenderLayer(
        depth=0,
        type="dynamic",
        id="cockpit_instruments",
        metadata={'meters': meters, 'labels': labels or {}}
    )]
    
    return RenderPacket(mode=DisplayMode.COCKPIT, layers=layers)
