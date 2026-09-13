"""
Tri-Modal Engine - Unified Body Engine with Legacy Adapter
ADR 120: Tri-Modal Rendering Bridge - Production Implementation
ADR 122: Universal Packet Enforcement - Strict POPO/JSON data passing
"""

import time
from typing import Dict, Any, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import sys

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from loguru import logger
from foundation.types import Result

# Import tri-modal components
try:
    # Use body.dispatcher for the main dispatcher
    from body.dispatcher import DisplayDispatcher, DisplayMode, RenderPacket
    from .terminal import create_terminal_body
    from .cockpit import create_cockpit_body
    from .unified_ppu import create_unified_ppu as create_ppu_body
    TRI_MODAL_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Tri-Modal Display Suite not available: {e}")
    TRI_MODAL_AVAILABLE = False
    # Define fallback types to prevent NameError
    DisplayDispatcher = None
    DisplayMode = None
    RenderPacket = None
    create_terminal_body = None
    create_cockpit_body = None
    create_ppu_body = None

# Import legacy adapter
from .legacy_adapter import LegacyGraphicsEngineAdapter

@dataclass
class EngineConfig:
    """Configuration for Tri-Modal Engine"""
    default_mode: Optional[DisplayMode] = None
    enable_legacy: bool = True
    auto_register_bodies: bool = True
    performance_tracking: bool = True
    universal_packet_enforcement: bool = True  # ADR 122
    
    def __post_init__(self):
        # Set default mode if not specified
        if self.default_mode is None and TRI_MODAL_AVAILABLE:
            self.default_mode = DisplayMode.TERMINAL

class TriModalEngine:
    """
    Production Tri-Modal Engine with Universal Packet Enforcement
    
    This engine provides:
    - ADR 120: Tri-Modal Rendering Bridge implementation
    - ADR 122: Universal Packet Enforcement (POPO/JSON only)
    - Backward compatibility with legacy GraphicsEngine API
    - Seamless migration path for legacy code
    - Production-ready performance monitoring
    """
    
    def __init__(self, config: Optional[EngineConfig] = None):
        self.config = config or EngineConfig()
        self.legacy_adapter: Optional[LegacyGraphicsEngineAdapter] = None
        self.dispatcher: Optional[DisplayDispatcher] = None
        self.is_initialized = False
        self.performance_stats: Dict[str, Any] = {}
        
        # Initialize based on configuration
        if self.config.enable_legacy:
            self._init_legacy_adapter()
        
        if TRI_MODAL_AVAILABLE:
            self._init_tri_modal_dispatcher()
        
        logger.info(f"🎭 Tri-Modal Engine initialized (Legacy: {self.config.enable_legacy}, Tri-Modal: {TRI_MODAL_AVAILABLE})")
        logger.info(f"📦 Universal Packet Enforcement: {self.config.universal_packet_enforcement}")
    
    def _init_legacy_adapter(self):
        """Initialize legacy graphics engine adapter"""
        try:
            self.legacy_adapter = LegacyGraphicsEngineAdapter()
            logger.info("📊 Legacy GraphicsEngine Adapter initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize legacy adapter: {e}")
            self.legacy_adapter = None
    
    def _init_tri_modal_dispatcher(self):
        """Initialize tri-modal display dispatcher"""
        if not TRI_MODAL_AVAILABLE or not DisplayMode:
            return
        
        try:
            self.dispatcher = DisplayDispatcher(default_mode=self.config.default_mode)
            
            if self.config.auto_register_bodies:
                # Register display bodies
                terminal_body = create_terminal_body()
                if terminal_body:
                    self.dispatcher.register_body(DisplayMode.TERMINAL, terminal_body)
                
                cockpit_body = create_cockpit_body()
                if cockpit_body:
                    self.dispatcher.register_body(DisplayMode.COCKPIT, cockpit_body)
                
                ppu_body = create_ppu_body()
                if ppu_body:
                    self.dispatcher.register_body(DisplayMode.PPU, ppu_body)
            
            logger.info("🎭 Tri-Modal Display Dispatcher initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize tri-modal dispatcher: {e}")
            self.dispatcher = None
    
    def render(self, packet_data: Dict[str, Any], mode: Optional[DisplayMode] = None) -> bool:
        """
        Render Universal Packet using appropriate engine
        
        ADR 122: Enforces POPO/JSON-only data passing - no objects
        
        Args:
            packet_data: Universal packet data (must be POPO/JSON-serializable)
            mode: Target display mode (uses default if None)
        
        Returns:
            True if rendering successful
        """
        if not self.is_initialized:
            self.is_initialized = True
        
        # ADR 122: Validate packet data is serializable
        if self.config.universal_packet_enforcement:
            if not self._validate_packet_data(packet_data):
                logger.error("❌ Packet data validation failed - must be POPO/JSON-serializable")
                return False
        
        # Use tri-modal dispatcher if available
        if self.dispatcher:
            return self._render_tri_modal(packet_data, mode)
        
        # Fallback to legacy adapter
        elif self.legacy_adapter:
            return self._render_legacy(packet_data)
        
        logger.error("❌ No rendering engine available")
        return False
    
    def _validate_packet_data(self, packet_data: Dict[str, Any]) -> bool:
        """
        Validate packet data is POPO/JSON-serializable (ADR 122)
        
        Returns True if data is serializable, False otherwise
        """
        try:
            import json
            
            # Try to serialize to JSON
            json.dumps(packet_data)
            return True
            
        except (TypeError, ValueError) as e:
            logger.error(f"❌ Packet data contains non-serializable objects: {e}")
            return False
    
    def _render_tri_modal(self, packet_data: Dict[str, Any], mode: Optional[DisplayMode] = None) -> bool:
        """Render using tri-modal display dispatcher"""
        try:
            target_mode = mode or self.config.default_mode
            
            # Handle case where tri-modal is not available
            if not DisplayMode or not target_mode:
                logger.warning("⚠️ Tri-Modal DisplayMode not available")
                return False
            
            # Convert packet data to render packet
            packet = self._packet_data_to_packet(packet_data, target_mode)
            
            # Render packet
            return self.dispatcher.render(packet)
            
        except Exception as e:
            logger.error(f"❌ Tri-modal rendering failed: {e}")
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
    
    def _packet_data_to_packet(self, packet_data: Dict[str, Any], mode: DisplayMode) -> RenderPacket:
        """Convert packet data to tri-modal render packet"""
        # Extract entities from packet data
        layers = []
        
        if 'entities' in packet_data:
            for i, entity in enumerate(packet_data['entities']):
                layer = {
                    'depth': entity.get('depth', i),
                    'type': entity.get('type', 'dynamic'),
                    'id': entity.get('id', f'entity_{i}'),
                    'x': entity.get('x'),
                    'y': entity.get('y'),
                    'effect': entity.get('effect'),
                    'metadata': entity
                }
                layers.append(layer)
        
        # Add background layer
        if 'background' in packet_data:
            bg = packet_data['background']
            layers.insert(0, {
                'depth': -1,
                'type': 'baked',
                'id': bg.get('id', 'background'),
                'x': 0, 'y': 0,
                'metadata': bg
            })
        
        # Extract HUD data
        hud_data = packet_data.get('hud', {})
        
        return RenderPacket(
            mode=mode,
            layers=layers,
            hud=hud_data,
            metadata=packet_data
        )
    
    def set_mode(self, mode: DisplayMode) -> bool:
        """Switch display mode"""
        if self.dispatcher:
            return self.dispatcher.set_mode(mode)
        else:
            logger.warning("⚠️ Tri-modal dispatcher not available")
            return False
    
    def get_mode(self) -> Optional[DisplayMode]:
        """Get current display mode"""
        if self.dispatcher:
            return self.dispatcher.current_mode
        return None
    
    def update_performance_stats(self) -> Dict[str, Any]:
        """Update and return performance statistics"""
        stats = {
            'engine_type': 'tri_modal_production',
            'tri_modal_available': TRI_MODAL_AVAILABLE,
            'legacy_available': self.legacy_adapter is not None,
            'current_mode': self.dispatcher.current_mode.value if self.dispatcher else None,
            'universal_packet_enforcement': self.config.universal_packet_enforcement,
            'timestamp': time.time()
        }
        
        # Get dispatcher stats
        if self.dispatcher:
            dispatcher_stats = self.dispatcher.get_performance_stats()
            stats['dispatcher'] = dispatcher_stats
        
        # Get legacy adapter stats
        if self.legacy_adapter:
            legacy_stats = self.legacy_adapter.get_performance_stats()
            stats['legacy_adapter'] = legacy_stats
        
        self.performance_stats = stats
        return stats
    
    def cleanup(self):
        """Cleanup engine resources"""
        if self.dispatcher:
            self.dispatcher.cleanup()
        
        if self.legacy_adapter:
            self.legacy_adapter.cleanup()
        
        logger.info("🧹 Tri-Modal Engine cleaned up")
    
    def register_strategy(self, name: str, strategy) -> 'Result':
        """Register rendering strategy for compatibility"""
        try:
            # For now, just store the strategy
            if not hasattr(self, 'strategies'):
                self.strategies = {}
            self.strategies[name] = strategy
            return Result(success=True, value=None)
        except Exception as e:
            return Result(success=False, error=str(e))
    
    def render_frame(self, physics_state) -> 'Result':
        """Render frame using current strategy"""
        try:
            if self.dispatcher:
                # Use dispatcher to render
                return self.dispatcher.render_frame(physics_state)
            return Result(success=False, error="No dispatcher available")
        except Exception as e:
            return Result(success=False, error=str(e))
    
    def set_display_mode(self, mode) -> 'Result':
        """Set display mode"""
        try:
            if self.dispatcher:
                success = self.dispatcher.set_mode(mode)
                if success:
                    return Result(success=True, value=None)
                else:
                    return Result(success=False, error="Failed to set display mode")
            return Result(success=False, error="No dispatcher available")
        except Exception as e:
            return Result(success=False, error=str(e))
    
    def update_mfd_data(self, mfd_data: Dict[str, Any]) -> None:
        """Update MFD data for display"""
        if self.dispatcher:
            self.dispatcher.update_mfd_data(mfd_data)
    
    def shutdown(self) -> 'Result':
        """Shutdown engine"""
        try:
            self.cleanup()
            return Result(success=True, value=None)
        except Exception as e:
            return Result(success=False, error=str(e))

# Factory functions for easy migration
def create_tri_modal_engine(config: Optional[EngineConfig] = None) -> TriModalEngine:
    """Create Tri-Modal Engine with default configuration"""
    return TriModalEngine(config)

def create_legacy_engine() -> LegacyGraphicsEngineAdapter:
    """Create legacy graphics engine adapter"""
    return LegacyGraphicsEngineAdapter()

# Compatibility layer for existing code
class BodyEngine(TriModalEngine):
    """Backward-compatible BodyEngine class"""
    
    def __init__(self, use_tri_modal: bool = True, universal_packet_enforcement: bool = True):
        config = EngineConfig(
            enable_legacy=True,
            auto_register_bodies=use_tri_modal,
            universal_packet_enforcement=universal_packet_enforcement
        )
        super().__init__(config)

# Export main components
__all__ = [
    'TriModalEngine', 'BodyEngine', 'EngineConfig',
    'create_tri_modal_engine', 'create_legacy_engine',
    'TRI_MODAL_AVAILABLE'
]
