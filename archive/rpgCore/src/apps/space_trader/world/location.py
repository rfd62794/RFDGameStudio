from typing import List, Dict
from pydantic import BaseModel, Field

class Location(BaseModel):
    """Represents a single node in the Space Trader map."""
    id: str
    name: str
    description: str
    connections: List[str] = Field(default_factory=list)
    faction: str
    market: Dict[str, float] = Field(default_factory=dict)
    
    def is_accessible(self) -> bool:
        """Determines if the player can safely dock and interact."""
        return self.id != "deadrock"
