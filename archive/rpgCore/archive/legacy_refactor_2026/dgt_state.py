"""
DGT State - Simple game state management
KISS Principle: Hold what we need for gameplay
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class TileType(Enum):
    """Simple tile types"""
    EMPTY = "empty"
    BARRIER = "barrier"
    INTERACTIVE = "interactive"
    ACTOR = "actor"


@dataclass
class Tile:
    """Single tile in the world"""
    x: int
    y: int
    tile_type: TileType
    sprite_id: str
    is_barrier: bool = False
    interaction_id: Optional[str] = None
    description: str = ""


@dataclass
class Voyager:
    """Player character state"""
    x: int
    y: int
    sprite_id: str = "voyager"
    
    def get_position(self) -> Tuple[int, int]:
        """Get current position"""
        return (self.x, self.y)
    
    def set_position(self, x: int, y: int) -> None:
        """Set new position"""
        self.x = x
        self.y = y


class DGTState:
    """Simple game state - the bicycle engine"""
    
    def __init__(self):
        # World state
        self.world_width: int = 20
        self.world_height: int = 15
        self.tiles: Dict[Tuple[int, int], Tile] = {}
        
        # Player state
        self.voyager: Voyager = Voyager(10, 7)  # Start in center
        
        # Game state
        self.running: bool = True
        self.message: str = "Welcome to DGT! Use WASD to move, E to interact"
        
        # Initialize world
        self._create_starter_world()
    
    def _create_starter_world(self) -> None:
        """Create a simple starter world"""
        # Clear world
        self.tiles.clear()
        
        # Add some barriers (walls/trees)
        barriers = [
            (5, 5), (5, 6), (5, 7), (5, 8),  # Vertical wall
            (15, 5), (15, 6), (15, 7), (15, 8),  # Another wall
            (8, 3), (9, 3), (10, 3), (11, 3),  # Horizontal wall
            (8, 11), (9, 11), (10, 11), (11, 11),  # Another horizontal
        ]
        
        for x, y in barriers:
            self.tiles[(x, y)] = Tile(
                x=x, y=y,
                tile_type=TileType.BARRIER,
                sprite_id="tree",
                is_barrier=True,
                description="A dense tree that blocks movement"
            )
        
        # Add interactive object
        self.tiles[(12, 9)] = Tile(
            x=12, y=9,
            tile_type=TileType.INTERACTIVE,
            sprite_id="iron_lockbox",
            is_barrier=False,
            interaction_id="lockbox",
            description="An iron lockbox with a complex lock"
        )
        
        # Add some decorative objects
        decorations = [
            (3, 3, "rock", False),
            (17, 12, "bush", False),
            (7, 10, "flower", False),
            (13, 4, "mushroom", False),
        ]
        
        for x, y, sprite_id, is_barrier in decorations:
            self.tiles[(x, y)] = Tile(
                x=x, y=y,
                tile_type=TileType.EMPTY,
                sprite_id=sprite_id,
                is_barrier=is_barrier,
                description=f"A {sprite_id} in the world"
            )
    
    def get_tile(self, x: int, y: int) -> Optional[Tile]:
        """Get tile at position"""
        if 0 <= x < self.world_width and 0 <= y < self.world_height:
            return self.tiles.get((x, y))
        return None
    
    def is_barrier(self, x: int, y: int) -> bool:
        """Check if position has a barrier"""
        tile = self.get_tile(x, y)
        return tile.is_barrier if tile else False
    
    def can_move_to(self, x: int, y: int) -> bool:
        """Check if voyager can move to position"""
        # Check world bounds
        if not (0 <= x < self.world_width and 0 <= y < self.world_height):
            return False
        
        # Check barriers
        return not self.is_barrier(x, y)
    
    def move_voyager(self, dx: int, dy: int) -> bool:
        """Move voyager by delta"""
        new_x = self.voyager.x + dx
        new_y = self.voyager.y + dy
        
        if self.can_move_to(new_x, new_y):
            self.voyager.set_position(new_x, new_y)
            self.message = f"Moved to ({new_x}, {new_y})"
            return True
        else:
            self.message = f"Cannot move to ({new_x}, {new_y}) - Blocked!"
            return False
    
    def get_interactable_at(self, x: int, y: int) -> Optional[Tile]:
        """Get interactive tile adjacent to position"""
        # Check all 4 directions
        for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            check_x, check_y = x + dx, y + dy
            tile = self.get_tile(check_x, check_y)
            if tile and tile.tile_type == TileType.INTERACTIVE:
                return tile
        return None
    
    def interact(self) -> str:
        """Interact with nearby object"""
        voyager_x, voyager_y = self.voyager.get_position()
        interactable = self.get_interactable_at(voyager_x, voyager_y)
        
        if interactable:
            if interactable.interaction_id == "lockbox":
                # Simulate D20 roll
                import random
                roll = random.randint(1, 20)
                success = roll >= 15  # DC 15
                
                if success:
                    result = f"🎲 D20 Roll: {roll} - SUCCESS! The lockbox opens!"
                    self.message = result
                    return result
                else:
                    result = f"🎲 D20 Roll: {roll} - FAIL! The lock remains closed."
                    self.message = result
                    return result
            else:
                result = f"Interacted with {interactable.sprite_id}"
                self.message = result
                return result
        else:
            result = "Nothing to interact with nearby"
            self.message = result
            return result
    
    def get_world_state(self) -> Dict:
        """Get current world state for rendering"""
        return {
            'voyager': self.voyager,
            'tiles': list(self.tiles.values()),
            'world_width': self.world_width,
            'world_height': self.world_height,
            'message': self.message
        }
