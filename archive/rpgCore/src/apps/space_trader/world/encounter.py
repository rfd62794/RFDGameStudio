import random
from typing import Optional, Dict

class EncounterSystem:
    """Stubs out travel risks between nodes."""
    
    ENCOUNTER_TYPES = ["pirates", "distress_signal", "customs"]
    
    def roll_encounter(self, from_id: str, to_id: str, faction_standing: Dict[str, int]) -> Optional[Dict]:
        """Rolls for a random encounter during travel."""
        # Risk increases when heading to the fringe or deadrock
        risk_chance = 0.15
        if to_id in ["the_fringe", "deadrock"] or from_id in ["the_fringe", "deadrock"]:
            risk_chance = 0.40
            
        if random.random() < risk_chance:
            encounter_type = random.choice(self.ENCOUNTER_TYPES)
            return {"type": encounter_type, "message": f"You encountered {encounter_type} en route from {from_id} to {to_id}!"}
            
        return None
