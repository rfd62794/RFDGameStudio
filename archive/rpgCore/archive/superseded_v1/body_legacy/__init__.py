"""
DGT Body - Tri-Modal Display Suite
Unified Display Interface (UDI) for Terminal, Cockpit, and PPU rendering
"""

from .dispatcher import DisplayDispatcher, DisplayMode, RenderPacket
from .ppu import PPUBody
from .terminal import TerminalBody
from .cockpit import CockpitBody

__all__ = [
    'DisplayDispatcher',
    'DisplayMode', 
    'RenderPacket',
    'PPUBody',
    'TerminalBody',
    'CockpitBody',
]
