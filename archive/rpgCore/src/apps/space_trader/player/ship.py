from typing import Dict, Optional
from src.apps.space_trader.economy.cargo import CargoHold
from src.apps.space_trader.world.location_graph import LocationGraph
from src.apps.space_trader.world.encounter import EncounterSystem

class PlayerShip:
    """Tracking structure for the player's core state and progression."""
    
    def __init__(self, start_loc: str = "port_kelvin"):
        self.credits: int = 500
        self.cargo: CargoHold = CargoHold(10)
        self.fuel: int = 10
        self.max_fuel: int = 10
        self.location_id: str = start_loc
        
        self.faction_standing: Dict[str, int] = {
            "industrial": 0,
            "neutral": 0,
            "outlaw": 0,
            "corporate": 0
        }
        
    def upgrade_cargo(self, cost: int) -> bool:
        if self.credits >= cost:
            self.credits -= cost
            self.cargo.capacity += 5
            return True
        return False
        
    def upgrade_fuel(self, cost: int) -> bool:
        if self.credits >= cost:
            self.credits -= cost
            self.max_fuel += 5
            self.fuel = self.max_fuel
            return True
        return False
        
    def travel(self, to_id: str, graph: LocationGraph, encounter_system: Optional[EncounterSystem] = None) -> Dict:
        """Handles movement and encounter risks between nodes."""
        current_loc = graph.get(self.location_id)
        target_loc = graph.get(to_id)
        
        if not current_loc or not target_loc:
            return {"success": False, "message": "Invalid destination."}
            
        if to_id not in current_loc.connections:
            return {"success": False, "message": "Destination is not connected to current sector."}
            
        if self.fuel < 1:
            return {"success": False, "message": "Insufficient fuel."}
            
        # Expend Fuel
        self.fuel -= 1
        
        # Roll for encounter
        if encounter_system:
            enc = encounter_system.roll_encounter(self.location_id, to_id, self.faction_standing)
            if enc:
                self.location_id = to_id
                return {"success": True, "message": f"Arrived at {target_loc.name}.", "encounter": enc}
                
        self.location_id = to_id
        return {"success": True, "message": f"Arrived safely at {target_loc.name}.", "encounter": None}
