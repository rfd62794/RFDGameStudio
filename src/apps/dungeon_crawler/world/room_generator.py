import random
from .room import Room
from .floor import Floor

class RoomGenerator:
    """Generates procedural floors with a directed path to a boss."""

    def generate(self, depth: int, seed: int | None = None) -> Floor:
        if seed is not None:
            random.seed(seed)
            
        floor = Floor(depth)
        
        # Calculate room count scaling with depth (simple formula)
        combat_rooms_count = random.randint(3, 5) + (depth // 2)
        
        # Generate the main path: entrance -> combat_1 -> ... -> boss
        main_path_ids = [f"room_{i}" for i in range(combat_rooms_count)]
        boss_id = "boss_room"
        entrance_id = "entrance"
        
        floor.rooms[entrance_id] = Room(id=entrance_id, room_type="rest", revealed=True, cleared=True)
        
        prev_id = entrance_id
        for i, room_id in enumerate(main_path_ids):
            room = Room(id=room_id, room_type="combat")
            # Connect forward and backward
            room.connections.append(prev_id)
            floor.rooms[prev_id].connections.append(room_id)
            floor.rooms[room_id] = room
            prev_id = room_id
            
        # Connect to boss
        boss = Room(id=boss_id, room_type="boss")
        boss.connections.append(prev_id)
        floor.rooms[prev_id].connections.append(boss_id)
        floor.rooms[boss_id] = boss
        
        # Add optional branches off the main path
        optional_types = ["treasure", "rest", "merchant"]
        branch_count = random.randint(1, 2)
        
        for i in range(branch_count):
            branch_id = f"branch_{i}"
            branch_origin_idx = random.randint(0, len(main_path_ids) - 1)
            origin_id = main_path_ids[branch_origin_idx]
            
            room_type = random.choice(optional_types)
            branch = Room(id=branch_id, room_type=room_type)
            branch.connections.append(origin_id)
            floor.rooms[origin_id].connections.append(branch_id)
            floor.rooms[branch_id] = branch

        # Set the current room to the entrance explicitly
        # and reveal its immediate neighbors
        floor.current_room_id = entrance_id
        for conn_id in floor.rooms[entrance_id].connections:
            floor.rooms[conn_id].reveal()

        return floor
