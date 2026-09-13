"""
DGT Render DTO - ADR 168
Data Transfer Object for decoupling PPU from Entity Logic
"""

from dataclasses import dataclass

@dataclass
class RenderDTO:
    """Simple data packet for PPU rendering"""
    id: str
    x: float
    y: float
    sprite_id: str
    layer: int = 1
    color: str = "#FFFFFF"
    visible: bool = True
