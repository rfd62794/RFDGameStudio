"""
Tile Bank - Game Boy-Style Tile Pattern Management

Provides tile registry with bank switching, animation support, and collision flags.
Implements 8x8 pixel tile patterns organized into banks (up to 256 tiles per bank).

Features:
- Game Boy-style 8×8 tile patterns
- Multiple tile banks with fast switching
- Per-tile animation frame sequences
- Collision flag tracking
- Efficient tile lookup and retrieval
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result


class TileType(Enum):
    """Common tile types for quick classification"""
    EMPTY = "empty"
    SOLID = "solid"
    WATER = "water"
    GRASS = "grass"
    STONE = "stone"
    WOOD = "wood"
    SPIKE = "spike"
    LAVA = "lava"
    ICE = "ice"
    SAND = "sand"
    CUSTOM = "custom"


@dataclass
class TilePattern:
    """8x8 pixel tile pattern with animation and collision data"""
    pixels: List[List[Tuple[int, int, int]]]  # 8x8 RGB tuples
    tile_type: TileType = TileType.CUSTOM
    is_solid: bool = False  # Collision flag
    animation_frames: List[List[List[Tuple[int, int, int]]]] = field(default_factory=list)  # Additional frames
    frame_duration: float = 0.1  # Seconds per frame
    transparent_color: Optional[Tuple[int, int, int]] = None  # RGB for transparency

    def __post_init__(self):
        """Validate tile dimensions"""
        if len(self.pixels) != 8:
            raise ValueError(f"Tile height must be 8, got {len(self.pixels)}")
        for row in self.pixels:
            if len(row) != 8:
                raise ValueError(f"Tile width must be 8, got {len(row)}")

        for frame in self.animation_frames:
            if len(frame) != 8:
                raise ValueError(f"Animation frame height must be 8, got {len(frame)}")
            for row in frame:
                if len(row) != 8:
                    raise ValueError(f"Animation frame width must be 8, got {len(row)}")

    def get_frame(self, frame_index: int = 0) -> List[List[Tuple[int, int, int]]]:
        """Get specific animation frame (0 = base tile)"""
        if frame_index == 0:
            return self.pixels
        if 0 < frame_index <= len(self.animation_frames):
            return self.animation_frames[frame_index - 1]
        return self.pixels  # Fallback to base


def create_empty_tile() -> TilePattern:
    """Create an empty transparent tile"""
    pixels = [[(0, 0, 0) for _ in range(8)] for _ in range(8)]
    return TilePattern(pixels, TileType.EMPTY, is_solid=False, transparent_color=(0, 0, 0))


def create_solid_tile(color: Tuple[int, int, int] = (128, 128, 128)) -> TilePattern:
    """Create a solid-colored tile"""
    pixels = [[color for _ in range(8)] for _ in range(8)]
    return TilePattern(pixels, TileType.SOLID, is_solid=True)


def create_grass_tile() -> TilePattern:
    """Create a grass tile pattern"""
    # Simple grass tile: green base with darker spots
    green = (34, 139, 34)   # Forest green
    dark_green = (0, 100, 0)  # Dark green spots

    pixels = [
        [green, green, dark_green, green, green, green, dark_green, green],
        [green, green, green, green, green, green, green, green],
        [dark_green, green, green, green, dark_green, green, green, green],
        [green, green, green, green, green, green, green, green],
        [green, green, dark_green, green, green, green, dark_green, green],
        [green, green, green, green, green, green, green, green],
        [dark_green, green, green, green, dark_green, green, green, green],
        [green, green, green, green, green, green, green, green]
    ]
    return TilePattern(pixels, TileType.GRASS, is_solid=False)


def create_water_tile() -> TilePattern:
    """Create a water tile with animation"""
    base = [[(30, 144, 255) for _ in range(8)] for _ in range(8)]  # Dodger blue

    # Animation frame 1: wave effect
    frame1 = [
        [(50, 160, 255) for _ in range(8)],
        [(30, 144, 255) for _ in range(8)],
        [(50, 160, 255) for _ in range(8)],
        [(30, 144, 255) for _ in range(8)],
        [(50, 160, 255) for _ in range(8)],
        [(30, 144, 255) for _ in range(8)],
        [(50, 160, 255) for _ in range(8)],
        [(30, 144, 255) for _ in range(8)],
    ]

    return TilePattern(
        base,
        TileType.WATER,
        is_solid=False,
        animation_frames=[frame1],
        frame_duration=0.2
    )


class TileBank(BaseSystem):
    """
    Game Boy-style tile bank manager.
    Organizes tiles into banks (up to 256 tiles per bank).
    Supports fast bank switching and per-tile animation.
    """

    def __init__(self, config: Optional[SystemConfig] = None, max_banks: int = 4):
        super().__init__(config or SystemConfig(name="TileBank"))
        self.max_banks = max_banks
        self.banks: List[Dict[int, TilePattern]] = [
            {} for _ in range(max_banks)
        ]
        self.current_bank = 0
        self.tile_instances: Dict[str, Dict[str, Any]] = {}  # tile_id -> {time, etc}

        # Statistics
        self.total_tiles_rendered = 0
        self.total_bank_switches = 0

    def initialize(self) -> bool:
        """Initialize tile bank"""
        self.status = SystemStatus.RUNNING
        self._initialized = True

        # Initialize with default tiles
        self._init_default_tiles()
        return True

    def _init_default_tiles(self) -> None:
        """Create default tiles in bank 0"""
        bank = self.banks[0]
        bank[0] = create_empty_tile()
        bank[1] = create_solid_tile((128, 128, 128))  # Gray solid
        bank[2] = create_grass_tile()
        bank[3] = create_water_tile()
        bank[4] = create_solid_tile((180, 82, 45))    # Brown (wood)
        bank[5] = create_solid_tile((255, 69, 0))     # Red-orange (lava)
        bank[6] = create_solid_tile((255, 255, 255))  # White (ice)

    def tick(self, delta_time: float) -> None:
        """Update tile animations"""
        if self.status != SystemStatus.RUNNING:
            return

        # Update tile instance times
        for tile_id in list(self.tile_instances.keys()):
            self.tile_instances[tile_id]['time'] += delta_time

    def shutdown(self) -> None:
        """Shutdown tile bank"""
        for bank in self.banks:
            bank.clear()
        self.tile_instances.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process tile bank intents"""
        action = intent.get("action", "")

        if action == "register_tile":
            tile_id = intent.get("tile_id", 0)
            tile = intent.get("tile")
            bank_idx = intent.get("bank", self.current_bank)
            return self.register_tile(tile_id, tile, bank_idx)

        elif action == "switch_bank":
            bank_idx = intent.get("bank", 0)
            result = self.switch_bank(bank_idx)
            return {"success": result, "current_bank": self.current_bank}

        elif action == "get_tile":
            tile_id = intent.get("tile_id", 0)
            bank_idx = intent.get("bank", self.current_bank)
            tile = self.get_tile(tile_id, bank_idx)
            return {
                "success": tile is not None,
                "tile": tile,
                "tile_id": tile_id,
                "bank": bank_idx
            }

        elif action == "get_tile_count":
            bank_idx = intent.get("bank", self.current_bank)
            count = len(self.banks[bank_idx])
            return {"tile_count": count, "bank": bank_idx}

        else:
            return {"error": f"Unknown TileBank action: {action}"}

    def register_tile(self, tile_id: int, tile: TilePattern,
                     bank_idx: Optional[int] = None) -> Dict[str, Any]:
        """Register a tile in specified bank"""
        if bank_idx is None:
            bank_idx = self.current_bank

        if not 0 <= bank_idx < self.max_banks:
            return {"success": False, "error": f"Invalid bank index: {bank_idx}"}

        if not 0 <= tile_id < 256:
            return {"success": False, "error": f"Invalid tile ID: {tile_id}"}

        self.banks[bank_idx][tile_id] = tile
        return {"success": True, "tile_id": tile_id, "bank": bank_idx}

    def get_tile(self, tile_id: int,
                bank_idx: Optional[int] = None) -> Optional[TilePattern]:
        """Get tile from specified bank"""
        if bank_idx is None:
            bank_idx = self.current_bank

        if not 0 <= bank_idx < self.max_banks:
            return None

        return self.banks[bank_idx].get(tile_id)

    def switch_bank(self, bank_idx: int) -> bool:
        """Switch to different tile bank"""
        if not 0 <= bank_idx < self.max_banks:
            return False

        self.current_bank = bank_idx
        self.total_bank_switches += 1
        return True

    def get_tile_frame(self, tile_id: int, time: float = 0.0,
                      bank_idx: Optional[int] = None) -> Optional[List[List[Tuple[int, int, int]]]]:
        """Get current animation frame for tile"""
        tile = self.get_tile(tile_id, bank_idx)
        if not tile:
            return None

        if not tile.animation_frames:
            return tile.pixels

        # Calculate frame index based on time
        frame_index = int((time / tile.frame_duration) % (len(tile.animation_frames) + 1))
        return tile.get_frame(frame_index)

    def is_tile_solid(self, tile_id: int,
                     bank_idx: Optional[int] = None) -> bool:
        """Check if tile is solid (collision)"""
        tile = self.get_tile(tile_id, bank_idx)
        return tile.is_solid if tile else False

    def get_tile_type(self, tile_id: int,
                     bank_idx: Optional[int] = None) -> Optional[TileType]:
        """Get tile type classification"""
        tile = self.get_tile(tile_id, bank_idx)
        return tile.tile_type if tile else None

    def get_status(self) -> Dict[str, Any]:
        """Get tile bank status"""
        return {
            'status': self.status.name,
            'initialized': self._initialized,
            'current_bank': self.current_bank,
            'max_banks': self.max_banks,
            'tiles_in_current_bank': len(self.banks[self.current_bank]),
            'total_tiles_all_banks': sum(len(bank) for bank in self.banks),
            'tile_instances': len(self.tile_instances),
            'total_bank_switches': self.total_bank_switches,
            'total_tiles_rendered': self.total_tiles_rendered,
        }


# Factory functions
def create_default_tile_bank() -> TileBank:
    """Create default tile bank with 4 banks"""
    config = SystemConfig(name="TileBank")
    bank = TileBank(config, max_banks=4)
    bank.initialize()
    return bank


def create_large_tile_bank() -> TileBank:
    """Create large tile bank with 8 banks"""
    config = SystemConfig(name="LargeTileBank")
    bank = TileBank(config, max_banks=8)
    bank.initialize()
    return bank


def create_minimal_tile_bank() -> TileBank:
    """Create minimal tile bank with 2 banks"""
    config = SystemConfig(name="MinimalTileBank")
    bank = TileBank(config, max_banks=2)
    bank.initialize()
    return bank
