import random
import math
from src.apps.space_trader.world.location_graph import LocationGraph

class PriceModel:
    """Manages the daily variance and local multipliers of goods."""
    
    BASE_PRICES = {
        "ore": 50,
        "food": 80,
        "tech": 250,
        "fuel": 20
    }
    
    def __init__(self, graph: LocationGraph):
        self.graph = graph
        self.daily_variance: float = 1.0
        self.update_daily()
        
    def update_daily(self):
        """Reseeds daily variance (±20%)."""
        # A simple variance between 0.8 and 1.2
        self.daily_variance = 0.8 + (random.random() * 0.4)
        
    def apply_variance(self, base_val: float) -> float:
        """Applies current daily variance to a price."""
        return base_val * self.daily_variance
        
    def get_price(self, location_id: str, good: str, action: str) -> float:
        """
        Calculates unit price. Buy actions are 10% more expensive than sell actions for margin.
        Uses the location's market modifier over the base price.
        """
        loc = self.graph.get(location_id)
        if not loc or good not in loc.market:
            return 0.0
            
        base = self.BASE_PRICES.get(good, 100)
        local_multiplier = loc.market[good]
        
        # Calculate raw local price
        raw_price = base * local_multiplier
        varied_price = self.apply_variance(raw_price)
        
        # Standard trader margins (buy 10% over, sell 10% under to simulate spread)
        if action == "buy":
            final_price = varied_price * 1.10
        elif action == "sell":
            final_price = varied_price * 0.90
        else:
            final_price = varied_price
            
        return math.ceil(final_price)
