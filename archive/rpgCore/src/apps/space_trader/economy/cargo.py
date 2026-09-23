from typing import Dict

class CargoHold:
    """Manages limited inventory bounds for the player ship."""
    def __init__(self, capacity: int = 10):
        self.capacity = capacity
        self.contents: Dict[str, int] = {}
        
    def space_used(self) -> int:
        return sum(self.contents.values())
        
    def space_remaining(self) -> int:
        return self.capacity - self.space_used()
        
    def add(self, good: str, quantity: int) -> bool:
        """Adds goods if there's sufficient space. False otherwise."""
        if quantity <= 0:
            return False
            
        if self.space_remaining() < quantity:
            return False
            
        if good not in self.contents:
            self.contents[good] = 0
        self.contents[good] += quantity
        return True
        
    def remove(self, good: str, quantity: int) -> bool:
        """Removes goods if sufficient stock exists. False otherwise."""
        if quantity <= 0:
            return False
            
        if good not in self.contents or self.contents[good] < quantity:
            return False
            
        self.contents[good] -= quantity
        if self.contents[good] == 0:
            del self.contents[good]
        return True
