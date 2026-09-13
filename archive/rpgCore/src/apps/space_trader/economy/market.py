from typing import Dict, List
from src.apps.space_trader.economy.cargo import CargoHold
from src.apps.space_trader.economy.price_model import PriceModel

class Market:
    """Handles standard marketplace exchange queries and validation."""
    
    def __init__(self, price_model: PriceModel):
        self.price_model = price_model
        
    def get_listings(self, location_id: str) -> List[Dict]:
        """Provides current buy and sell quotes for a given location."""
        loc = self.price_model.graph.get(location_id)
        if not loc:
            return []
            
        listings = []
        for good in loc.market.keys():
            listings.append({
                "good": good,
                "buy_price": self.price_model.get_price(location_id, good, "buy"),
                "sell_price": self.price_model.get_price(location_id, good, "sell")
            })
        return listings
        
    def buy(self, location_id: str, good: str, quantity: int, cargo: CargoHold, credits: int) -> Dict:
        """Attempts to purchase goods from the market to add to cargo."""
        loc = self.price_model.graph.get(location_id)
        if not loc or good not in loc.market:
            return {"success": False, "message": f"{good} is not sold here.", "credits": credits}
            
        unit_price = self.price_model.get_price(location_id, good, "buy")
        total_cost = unit_price * quantity
        
        if credits < total_cost:
            return {"success": False, "message": "Insufficient credits.", "credits": credits}
            
        if not cargo.add(good, quantity):
            return {"success": False, "message": "Insufficient cargo space.", "credits": credits}
            
        return {
            "success": True, 
            "message": f"Bought {quantity} {good} for {total_cost} cr.", 
            "credits": credits - total_cost
        }
        
    def sell(self, location_id: str, good: str, quantity: int, cargo: CargoHold, credits: int) -> Dict:
        """Attempts to sell inventory goods back to the market."""
        loc = self.price_model.graph.get(location_id)
        if not loc or good not in loc.market:
            return {"success": False, "message": f"{good} has no demand here.", "credits": credits}
            
        if quantity <= 0 or not cargo.remove(good, quantity):
            return {"success": False, "message": "Insufficient goods in cargo.", "credits": credits}

        unit_price = self.price_model.get_price(location_id, good, "sell")
        total_revenue = unit_price * quantity
        
        return {
            "success": True, 
            "message": f"Sold {quantity} {good} for {total_revenue} cr.", 
            "credits": credits + total_revenue
        }
