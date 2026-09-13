from src.apps.space_trader.world.location_graph import LocationGraph
from src.apps.space_trader.economy.price_model import PriceModel
from src.apps.space_trader.economy.market import Market
from src.apps.space_trader.world.encounter import EncounterSystem
from src.apps.space_trader.player.ship import PlayerShip

class SpaceTraderSession:
    """Wraps the core state models into a single context object."""
    def __init__(self):
        self.graph = LocationGraph()
        self.price_model = PriceModel(self.graph)
        self.market = Market(self.price_model)
        self.encounter_system = EncounterSystem()
        self.ship = PlayerShip()
        
    def get_risk_level(self, loc_id: str) -> str:
        """Categorizes travel risk to a destination."""
        if loc_id in ["drifters_wake", "deadrock"]:
            return "HIGH RISK"
        elif loc_id == "the_fringe":
            return "MEDIUM RISK"
        return "LOW RISK"
