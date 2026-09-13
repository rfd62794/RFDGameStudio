"""
Unified Tri-Modal Graphics Engine
Production implementation consolidating all graphics/display components

This module provides the formal unified engine that brings together:
- Tri-Modal Display Suite (Terminal, Cockpit, PPU)
- SimplePPU Direct-Line protocol
- Legacy Graphics Engine compatibility
- Universal packet enforcement (ADR 122)
"""

import time
import asyncio
from typing import Dict, Any, Optional, Union, List
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import sys

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger

# Import tri-modal components
try:
    from src.body.dispatcher import DisplayDispatcher, DisplayMode, RenderPacket, HUDData, RenderLayer
    from src.body.terminal import create_terminal_body
    from src.body.cockpit import create_cockpit_body
    from src.body.ppu import create_ppu_body
    from src.body.simple_ppu import SimplePPU, RenderDTO
    TRI_MODAL_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Tri-Modal Display Suite not available: {e}")
    TRI_MODAL_AVAILABLE = False
    # Define fallback types
    DisplayDispatcher = None
    DisplayMode = None
    RenderPacket = None
    HUDData = None
    RenderLayer = None
    create_terminal_body = None
    create_cockpit_body = None
    create_ppu_body = None
    SimplePPU = None
    RenderDTO = None

# Import legacy components
try:
    from src.dgt_core.engines.body.graphics_engine import GraphicsEngine, RenderFrame
    from src.dgt_core.view.graphics.legacy_adapter import LegacyGraphicsEngineAdapter
    LEGACY_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Legacy Graphics Engine not available: {e}")
    LEGACY_AVAILABLE = False
    GraphicsEngine = None
    RenderFrame = None
    LegacyGraphicsEngineAdapter = None

@dataclass
class UnifiedEngineConfig:
    """Configuration for Unified Tri-Modal Graphics Engine"""
    # Primary display mode
    default_mode: Optional[DisplayMode] = None
    
    # Component enablement
    enable_tri_modal: bool = True
    enable_legacy: bool = True
    enable_simple_ppu: bool = True
    
    # Performance settings
    performance_tracking: bool = True
    universal_packet_enforcement: bool = True  # ADR 122
    
    # Display-specific settings
    terminal_update_rate: float = 10.0  # Hz
    cockpit_update_rate: float = 30.0   # Hz
    ppu_update_rate: float = 60.0      # Hz
    
    # SimplePPU settings
    simple_ppu_scale: int = 4
    simple_ppu_fps: int = 60
    
    def __post_init__(self):
        # Set default mode if not specified
        if self.default_mode is None and TRI_MODAL_AVAILABLE:
            self.default_mode = DisplayMode.TERMINAL

class UnifiedGraphicsEngine:
    """
    Unified Tri-Modal Graphics Engine
    
    This engine consolidates all graphics/display components into a single
    cohesive system with three primary rendering modes:
    
    1. TERMINAL: Rich CLI output for headless monitoring
    2. COCKPIT: Tkinter dashboard for management interfaces  
    3. PPU: Game Boy-style rendering for games and embedded displays
    
    Additionally provides:
    - SimplePPU Direct-Line protocol integration
    - Legacy Graphics Engine compatibility
    - Universal packet enforcement
    - Performance monitoring and optimization
    """
    
    def __init__(self, config: Optional[UnifiedEngineConfig] = None):
        self.config = config or UnifiedEngineConfig()
        
        # Core components
        self.dispatcher: Optional[DisplayDispatcher] = None
        self.legacy_adapter: Optional[LegacyGraphicsEngineAdapter] = None
        self.simple_ppu: Optional[SimplePPU] = None
        
        # State tracking
        self.is_initialized = False
        self.current_mode: Optional[DisplayMode] = None
        self.performance_stats: Dict[str, Any] = {}
        
        # Performance tracking
        self.render_times: List[float] = []
        self.last_render_time = 0.0
        
        # Initialize components based on configuration
        self._initialize_components()
        
        logger.info(f"🎭 Unified Graphics Engine initialized")
        logger.info(f"   Tri-Modal: {self.config.enable_tri_modal and TRI_MODAL_AVAILABLE}")
        logger.info(f"   Legacy: {self.config.enable_legacy and LEGACY_AVAILABLE}")
        logger.info(f"   SimplePPU: {self.config.enable_simple_ppu and SimplePPU is not None}")
        logger.info(f"   Default Mode: {self.config.default_mode.value if self.config.default_mode else 'None'}")
    
    def _initialize_components(self):
        """Initialize all engine components"""
        # Initialize tri-modal dispatcher
        if self.config.enable_tri_modal and TRI_MODAL_AVAILABLE:
            self._init_tri_modal_dispatcher()
        
        # Initialize legacy adapter
        if self.config.enable_legacy and LEGACY_AVAILABLE:
            self._init_legacy_adapter()
        
        # Initialize SimplePPU
        if self.config.enable_simple_ppu and SimplePPU:
            self._init_simple_ppu()
    
    def _init_tri_modal_dispatcher(self):
        """Initialize tri-modal display dispatcher"""
        try:
            self.dispatcher = DisplayDispatcher(default_mode=self.config.default_mode)
            
            # Register display bodies
            if create_terminal_body:
                terminal_body = create_terminal_body()
                if terminal_body:
                    self.dispatcher.register_body(DisplayMode.TERMINAL, terminal_body)
            
            if create_cockpit_body:
                cockpit_body = create_cockpit_body()
                if cockpit_body:
                    self.dispatcher.register_body(DisplayMode.COCKPIT, cockpit_body)
            
            if create_ppu_body:
                ppu_body = create_ppu_body()
                if ppu_body:
                    self.dispatcher.register_body(DisplayMode.PPU, ppu_body)
            
            logger.info("🎭 Tri-Modal Display Dispatcher initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize tri-modal dispatcher: {e}")
            self.dispatcher = None
    
    def _init_legacy_adapter(self):
        """Initialize legacy graphics engine adapter"""
        try:
            self.legacy_adapter = LegacyGraphicsEngineAdapter()
            logger.info("📊 Legacy Graphics Engine Adapter initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize legacy adapter: {e}")
            self.legacy_adapter = None
    
    def _init_simple_ppu(self):
        """Initialize SimplePPU for Direct-Line protocol"""
        try:
            self.simple_ppu = SimplePPU("Unified Engine - SimplePPU")
            if self.simple_ppu.initialize():
                logger.info("🎯 SimplePPU initialized for Direct-Line protocol")
            else:
                self.simple_ppu = None
                logger.warning("⚠️ SimplePPU initialization failed")
        except Exception as e:
            logger.error(f"❌ Failed to initialize SimplePPU: {e}")
            self.simple_ppu = None
    
    def render(self, packet_data: Dict[str, Any], mode: Optional[DisplayMode] = None) -> bool:
        """
        Universal render method supporting multiple input formats
        
        Args:
            packet_data: Universal packet data (dict, RenderPacket, or RenderDTO)
            mode: Target display mode (uses default if None)
        
        Returns:
            True if rendering successful
        """
        start_time = time.time()
        
        if not self.is_initialized:
            self.is_initialized = True
        
        # Validate packet data if enforcement enabled
        if self.config.universal_packet_enforcement:
            if not self._validate_packet_data(packet_data):
                logger.error("❌ Packet data validation failed - must be POPO/JSON-serializable")
                return False
        
        # Determine rendering path based on input type and mode
        success = False
        
        # Handle SimplePPU RenderDTO
        if isinstance(packet_data, RenderDTO) and self.simple_ppu:
            success = self._render_simple_ppu(packet_data)
        
        # Handle Universal RenderPacket
        elif isinstance(packet_data, RenderPacket) and self.dispatcher:
            success = self._render_tri_modal(packet_data, mode)
        
        # Handle dict packet data
        elif isinstance(packet_data, dict):
            if self.dispatcher:
                success = self._render_dict_packet(packet_data, mode)
            elif self.legacy_adapter:
                success = self._render_legacy(packet_data)
        
        # Track performance
        render_time = time.time() - start_time
        self.render_times.append(render_time)
        if len(self.render_times) > 100:  # Keep last 100 renders
            self.render_times.pop(0)
        
        self.last_render_time = render_time
        
        return success
    
    def _validate_packet_data(self, packet_data: Any) -> bool:
        """Validate packet data is POPO/JSON-serializable (ADR 122)"""
        try:
            import json
            json.dumps(packet_data)
            return True
        except (TypeError, ValueError) as e:
            logger.error(f"❌ Packet data contains non-serializable objects: {e}")
            return False
    
    def _render_simple_ppu(self, dto: RenderDTO) -> bool:
        """Render using SimplePPU Direct-Line protocol"""
        try:
            self.simple_ppu.render(dto)
            return True
        except Exception as e:
            logger.error(f"❌ SimplePPU rendering failed: {e}")
            return False
    
    def _render_tri_modal(self, packet: RenderPacket, mode: Optional[DisplayMode] = None) -> bool:
        """Render using tri-modal display dispatcher"""
        try:
            target_mode = mode or self.config.default_mode
            if not target_mode:
                logger.warning("⚠️ No target mode specified for tri-modal rendering")
                return False
            
            # Override mode if packet specifies different mode
            if packet.mode != target_mode:
                target_mode = packet.mode
            
            # Render packet
            return self.dispatcher.render(packet)
            
        except Exception as e:
            logger.error(f"❌ Tri-modal rendering failed: {e}")
            return False
    
    def _render_dict_packet(self, packet_data: Dict[str, Any], mode: Optional[DisplayMode] = None) -> bool:
        """Render dict packet data using tri-modal dispatcher"""
        try:
            target_mode = mode or self.config.default_mode
            if not target_mode:
                logger.warning("⚠️ No target mode specified for dict packet rendering")
                return False
            
            # Convert dict to render packet
            packet = self._dict_to_packet(packet_data, target_mode)
            return self.dispatcher.render(packet)
            
        except Exception as e:
            logger.error(f"❌ Dict packet rendering failed: {e}")
            return False
    
    def _render_legacy(self, packet_data: Dict[str, Any]) -> bool:
        """Render using legacy graphics engine adapter"""
        try:
            if self.legacy_adapter:
                return self.legacy_adapter.render_packet(packet_data)
            else:
                logger.warning("⚠️ Legacy adapter not available")
                return False
        except Exception as e:
            logger.error(f"❌ Legacy rendering failed: {e}")
            return False
    
    def _dict_to_packet(self, packet_data: Dict[str, Any], mode: DisplayMode) -> RenderPacket:
        """Convert dict packet data to RenderPacket"""
        # Extract layers from packet data
        layers = []
        
        if 'entities' in packet_data:
            for i, entity in enumerate(packet_data['entities']):
                layer = RenderLayer(
                    depth=entity.get('depth', i),
                    type=entity.get('type', 'dynamic'),
                    id=entity.get('id', f'entity_{i}'),
                    x=entity.get('x'),
                    y=entity.get('y'),
                    effect=entity.get('effect'),
                    metadata=entity
                )
                layers.append(layer)
        
        # Add background layer
        if 'background' in packet_data:
            bg = packet_data['background']
            layers.insert(0, RenderLayer(
                depth=-1,
                type='baked',
                id=bg.get('id', 'background'),
                x=0, y=0,
                metadata=bg
            ))
        
        # Extract HUD data
        hud_data = HUDData()
        if 'hud' in packet_data:
            hud = packet_data['hud']
            hud_data.line_1 = hud.get('line_1', '')
            hud_data.line_2 = hud.get('line_2', '')
            hud_data.line_3 = hud.get('line_3', '')
            hud_data.line_4 = hud.get('line_4', '')
            hud_data.metadata = hud
        
        return RenderPacket(
            mode=mode,
            layers=layers,
            hud=hud_data,
            metadata=packet_data
        )
    
    def set_mode(self, mode: DisplayMode) -> bool:
        """Switch primary display mode"""
        if self.dispatcher:
            success = self.dispatcher.set_mode(mode)
            if success:
                self.current_mode = mode
                logger.info(f"🎭 Switched to {mode.value} mode")
            return success
        else:
            logger.warning("⚠️ Tri-modal dispatcher not available")
            return False
    
    def get_mode(self) -> Optional[DisplayMode]:
        """Get current display mode"""
        if self.dispatcher:
            return self.dispatcher.current_mode
        return self.current_mode
    
    def update_performance_stats(self) -> Dict[str, Any]:
        """Update and return comprehensive performance statistics"""
        stats = {
            'engine_type': 'unified_tri_modal',
            'timestamp': time.time(),
            'components': {
                'tri_modal_available': TRI_MODAL_AVAILABLE,
                'legacy_available': LEGACY_AVAILABLE,
                'simple_ppu_available': self.simple_ppu is not None,
                'dispatcher_active': self.dispatcher is not None,
                'legacy_adapter_active': self.legacy_adapter is not None,
                'simple_ppu_active': self.simple_ppu is not None,
            },
            'performance': {
                'last_render_time_ms': self.last_render_time * 1000,
                'avg_render_time_ms': sum(self.render_times) / len(self.render_times) if self.render_times else 0,
                'render_count': len(self.render_times),
                'fps': 1.0 / self.last_render_time if self.last_render_time > 0 else 0,
            },
            'configuration': {
                'default_mode': self.config.default_mode.value if self.config.default_mode else None,
                'universal_packet_enforcement': self.config.universal_packet_enforcement,
                'performance_tracking': self.config.performance_tracking,
            }
        }
        
        # Get dispatcher stats
        if self.dispatcher:
            dispatcher_stats = self.dispatcher.get_performance_stats()
            stats['dispatcher'] = dispatcher_stats
        
        # Get legacy adapter stats
        if self.legacy_adapter:
            try:
                legacy_stats = self.legacy_adapter.get_performance_stats()
                stats['legacy_adapter'] = legacy_stats
            except:
                stats['legacy_adapter'] = {}
        
        self.performance_stats = stats
        return stats
    
    def create_render_dto(self, player_physics: Any, entities: List[Dict[str, Any]] = None, 
                          game_state: str = "ACTIVE", time_remaining: float = 60.0) -> RenderDTO:
        """
        Convenience method to create RenderDTO for SimplePPU
        
        Args:
            player_physics: Player physics component
            entities: List of entity dictionaries
            game_state: Current game state
            time_remaining: Time remaining in seconds
        
        Returns:
            RenderDTO for SimplePPU rendering
        """
        if not RenderDTO:
            logger.error("❌ RenderDTO not available")
            return None
        
        return RenderDTO(
            player_physics=player_physics,
            asteroids=entities or [],
            portal=None,
            game_state=game_state,
            time_remaining=time_remaining
        )
    
    def create_universal_packet(self, mode: DisplayMode, entities: List[Dict[str, Any]] = None,
                               hud_lines: List[str] = None, metadata: Dict[str, Any] = None) -> RenderPacket:
        """
        Convenience method to create universal render packet
        
        Args:
            mode: Target display mode
            entities: List of entity dictionaries
            hud_lines: HUD line text (up to 4 lines)
            metadata: Additional packet metadata
        
        Returns:
            RenderPacket for tri-modal rendering
        """
        if not RenderPacket or not RenderLayer or not HUDData:
            logger.error("❌ RenderPacket components not available")
            return None
        
        # Create layers from entities
        layers = []
        if entities:
            for i, entity in enumerate(entities):
                layer = RenderLayer(
                    depth=entity.get('depth', i),
                    type=entity.get('type', 'dynamic'),
                    id=entity.get('id', f'entity_{i}'),
                    x=entity.get('x'),
                    y=entity.get('y'),
                    effect=entity.get('effect'),
                    metadata=entity
                )
                layers.append(layer)
        
        # Create HUD data
        hud_data = HUDData()
        if hud_lines:
            for i, line in enumerate(hud_lines[:4]):
                setattr(hud_data, f'line_{i+1}', line)
        
        return RenderPacket(
            mode=mode,
            layers=layers,
            hud=hud_data,
            metadata=metadata or {}
        )
    
    def cleanup(self):
        """Cleanup all engine resources"""
        logger.info("🧹 Unified Graphics Engine cleanup started")
        
        # Cleanup tri-modal dispatcher
        if self.dispatcher:
            self.dispatcher.cleanup()
            self.dispatcher = None
        
        # Cleanup legacy adapter
        if self.legacy_adapter:
            self.legacy_adapter.cleanup()
            self.legacy_adapter = None
        
        # Cleanup SimplePPU
        if self.simple_ppu:
            self.simple_ppu.stop()
            self.simple_ppu = None
        
        # Clear performance data
        self.render_times.clear()
        self.performance_stats.clear()
        
        logger.info("✅ Unified Graphics Engine cleanup complete")

# Factory functions for easy instantiation
def create_unified_engine(config: Optional[UnifiedEngineConfig] = None) -> UnifiedGraphicsEngine:
    """Create Unified Graphics Engine with default configuration"""
    return UnifiedGraphicsEngine(config)

def create_miyoo_engine() -> UnifiedGraphicsEngine:
    """Create engine optimized for Miyoo Mini deployment"""
    config = UnifiedEngineConfig(
        default_mode=DisplayMode.PPU if TRI_MODAL_AVAILABLE else None,
        enable_tri_modal=True,
        enable_legacy=False,  # Disable legacy for embedded
        enable_simple_ppu=True,
        simple_ppu_scale=1,  # 1x scale for 160x144 native
        simple_ppu_fps=30,    # 30 FPS for battery optimization
        ppu_update_rate=30.0
    )
    return UnifiedGraphicsEngine(config)

def create_development_engine() -> UnifiedGraphicsEngine:
    """Create engine optimized for development"""
    config = UnifiedEngineConfig(
        default_mode=DisplayMode.TERMINAL if TRI_MODAL_AVAILABLE else None,
        enable_tri_modal=True,
        enable_legacy=True,
        enable_simple_ppu=True,
        performance_tracking=True,
        universal_packet_enforcement=True
    )
    return UnifiedGraphicsEngine(config)

def create_production_engine() -> UnifiedGraphicsEngine:
    """Create engine optimized for production deployment"""
    config = UnifiedEngineConfig(
        default_mode=DisplayMode.COCKPIT if TRI_MODAL_AVAILABLE else None,
        enable_tri_modal=True,
        enable_legacy=True,
        enable_simple_ppu=False,  # Disable SimplePPU for production
        performance_tracking=True,
        universal_packet_enforcement=True
    )
    return UnifiedGraphicsEngine(config)

# Export main components
__all__ = [
    'UnifiedGraphicsEngine', 'UnifiedEngineConfig',
    'create_unified_engine', 'create_miyoo_engine',
    'create_development_engine', 'create_production_engine',
    'TRI_MODAL_AVAILABLE', 'LEGACY_AVAILABLE'
]
