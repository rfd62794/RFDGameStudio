import json
from typing import Dict, List, Optional
from collections import deque
from src.apps.space_trader.world.location import Location

class LocationGraph:
    """Manages the network of space trader locations loaded from JSON."""
    def __init__(self, json_path: str = "assets/demos/space_trader/locations.json"):
        self.locations: Dict[str, Location] = {}
        self._load(json_path)
        
    def _load(self, path: str):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for loc_data in data.get("locations", []):
                loc = Location(**loc_data)
                self.locations[loc.id] = loc

    def get(self, loc_id: str) -> Optional[Location]:
        return self.locations.get(loc_id)

    def neighbors(self, loc_id: str) -> List[Location]:
        loc = self.get(loc_id)
        if not loc:
            return []
        
        neighbor_nodes = []
        for n_id in loc.connections:
            n_loc = self.get(n_id)
            if n_loc:
                neighbor_nodes.append(n_loc)
        return neighbor_nodes

    def path(self, from_id: str, to_id: str) -> List[str]:
        """Simple BFS pathfinding returning a list of node IDs."""
        if from_id not in self.locations or to_id not in self.locations:
            return []
            
        queue = deque([(from_id, [from_id])])
        visited = {from_id}
        
        while queue:
            current_id, current_path = queue.popleft()
            
            if current_id == to_id:
                return current_path
                
            loc = self.get(current_id)
            for neighbor_id in loc.connections:
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    queue.append((neighbor_id, current_path + [neighbor_id]))
                    
        return []
