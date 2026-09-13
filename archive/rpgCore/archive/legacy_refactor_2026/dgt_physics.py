"""
DGT Physics - Simple collision detection
KISS Principle: 10 lines of barrier checking
"""

from dgt_state import DGTState


def can_move_to(state: DGTState, new_x: int, new_y: int) -> bool:
    """Check if movement is allowed - the core physics engine"""
    # Check world bounds
    if not (0 <= new_x < state.world_width and 0 <= new_y < state.world_height):
        return False
    
    # Check if tile is a barrier
    return not state.is_barrier(new_x, new_y)


def check_collision(state: DGTState, x: int, y: int) -> bool:
    """Check collision at position"""
    return state.is_barrier(x, y)


def get_valid_moves(state: DGTState, x: int, y: int) -> list:
    """Get all valid moves from position"""
    valid_moves = []
    
    # Check all 4 directions
    for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        new_x, new_y = x + dx, y + dy
        if can_move_to(state, new_x, new_y):
            valid_moves.append((new_x, new_y))
    
    return valid_moves
