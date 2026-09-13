"""
DGT Body - Tri-Modal Display Suite
Unified Display Interface (UDI) for Terminal, Cockpit, and PPU rendering
ADR 120: Tri-Modal Rendering Bridge
ADR 122: Universal Packet Enforcement
"""

from typing import Optional

# Define exports for lazy loading
_DISPATCHER_EXPORTS = {
    "DisplayDispatcher", "DisplayMode", "RenderPacket"
}

_UNIFIED_PPU_EXPORTS = {
    "UnifiedPPU", "PPUBody", "create_unified_ppu", "create_ppu_body"
}

_TERMINAL_EXPORTS = {
    "TerminalBody", "create_terminal_body"
}

_COCKPIT_EXPORTS = {
    "CockpitBody", "create_cockpit_body"
}

_TRI_MODAL_ENGINE_EXPORTS = {
    "TriModalEngine", "BodyEngine", "EngineConfig", "create_tri_modal_engine"
}

_LEGACY_ADAPTER_EXPORTS = {
    "LegacyGraphicsEngineAdapter", "create_legacy_engine"
}

_GRAPHICS_ENGINE_EXPORTS = {
    "GraphicsEngine", "RenderFrame", "TileBank", "Viewport", "RenderLayer", 
    "GraphicsEngineFactory", "GraphicsEngineSync"
}

# Unified set of all exports
__all__ = sorted(
    _DISPATCHER_EXPORTS | 
    _UNIFIED_PPU_EXPORTS | 
    _TERMINAL_EXPORTS | 
    _COCKPIT_EXPORTS | 
    _TRI_MODAL_ENGINE_EXPORTS | 
    _LEGACY_ADAPTER_EXPORTS | 
    _GRAPHICS_ENGINE_EXPORTS |
    {"TRI_MODAL_AVAILABLE"}
)

def __getattr__(name: str):
    """Lazy-load submodule symbols on first access."""
    if name in _DISPATCHER_EXPORTS:
        from . import dispatcher as _mod
        return getattr(_mod, name)

    if name in _UNIFIED_PPU_EXPORTS:
        from . import unified_ppu as _mod
        return getattr(_mod, name)
        
    if name in _TERMINAL_EXPORTS:
        from . import terminal as _mod
        return getattr(_mod, name)

    if name in _COCKPIT_EXPORTS:
        from . import cockpit as _mod
        return getattr(_mod, name)

    if name in _TRI_MODAL_ENGINE_EXPORTS:
        from . import tri_modal_engine as _mod
        return getattr(_mod, name)

    if name in _LEGACY_ADAPTER_EXPORTS:
        from . import legacy_adapter as _mod
        return getattr(_mod, name)

    if name in _GRAPHICS_ENGINE_EXPORTS:
        from . import graphics_engine as _mod
        return getattr(_mod, name)
    
    if name == "TRI_MODAL_AVAILABLE":
        try:
            from .dispatcher import TRI_MODAL_AVAILABLE
            return TRI_MODAL_AVAILABLE
        except ImportError:
            return False

    raise AttributeError(f"module 'engines.body' has no attribute {name!r}")
