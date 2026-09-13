from .room import Room

class Floor:
    def __init__(self, depth: int):
        self.rooms: dict[str, Room] = {}
        self.current_room_id: str | None = None
        self.depth: int = depth

    def move_to(self, room_id: str) -> bool:
        """Attempts to move to a given room. Returns True if successful."""
        if room_id not in self.rooms:
            return False
            
        target = self.rooms[room_id]
        current = self.get_current_room()
        
        # Entrance check
        if current is None:
            self.current_room_id = room_id
            target.reveal()
            for conn_id in target.connections:
                if conn_id in self.rooms:
                    self.rooms[conn_id].reveal()
            return True

        if target.id in current.connections and target.is_accessible():
            self.current_room_id = room_id
            # Reveal neighbors of the new room automatically
            for conn_id in target.connections:
                if conn_id in self.rooms:
                    self.rooms[conn_id].reveal()
            return True
        return False

    def get_current_room(self) -> Room | None:
        if not self.current_room_id:
            return None
        return self.rooms.get(self.current_room_id)

    def get_revealed_rooms(self) -> list[Room]:
        return [room for room in self.rooms.values() if room.revealed]

    def is_complete(self) -> bool:
        """Returns True if the boss room exists and is cleared."""
        boss_room = next((r for r in self.rooms.values() if r.room_type == 'boss'), None)
        return boss_room is not None and boss_room.cleared
