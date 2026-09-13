import pytest
from src.apps.space_trader.world.location_graph import LocationGraph
from src.apps.space_trader.economy.price_model import PriceModel
from src.apps.space_trader.economy.cargo import CargoHold
from src.apps.space_trader.economy.market import Market
from src.apps.space_trader.player.ship import PlayerShip
from src.apps.space_trader.world.encounter import EncounterSystem

@pytest.fixture
def graph():
    return LocationGraph()

@pytest.fixture
def price_model(graph):
    return PriceModel(graph)

def test_location_graph_loads(graph):
    assert len(graph.locations) == 7
    assert graph.get("port_kelvin").name == "Port Kelvin"

def test_location_connections_valid(graph):
    port = graph.get("port_kelvin")
    assert "the_shallows" in port.connections
    assert "ironmere_station" in port.connections
    # Deadrock should not have any safe connections leading TO it (path logic handles this normally, but let's just test connections exist)
    deadrock = graph.get("deadrock")
    assert "drifters_wake" in deadrock.connections

def test_price_model_variance_in_range(price_model):
    base_val = 100
    varied_val = price_model.apply_variance(base_val)
    # Variance is coded as 0.8 + (0.0 to 0.4) = 0.8 to 1.2
    assert 80 <= varied_val <= 120

def test_cargo_add_and_remove():
    cargo = CargoHold(10)
    assert cargo.add("ore", 5) == True
    assert cargo.space_used() == 5
    assert cargo.remove("ore", 2) == True
    assert cargo.space_used() == 3
    assert cargo.remove("ore", 5) == False # Not enough stock
    assert cargo.space_used() == 3

def test_cargo_capacity_enforced():
    cargo = CargoHold(5)
    assert cargo.add("food", 3) == True
    assert cargo.add("tech", 3) == False # Exceeds capacity
    assert cargo.space_used() == 3

def test_market_buy_reduces_credits(price_model):
    market = Market(price_model)
    cargo = CargoHold(10)
    
    # Force variance to 1.0 for deterministic testing
    price_model.daily_variance = 1.0
    
    # Port Kelvin tech: base 250, market mult 1.1 -> 275. Buy action * 1.10 -> 302.5 -> ceil(302.5) = 303
    res = market.buy("port_kelvin", "tech", 1, cargo, 500)
    assert res["success"] == True
    assert res["credits"] == 500 - 303
    assert cargo.space_used() == 1

def test_market_sell_increases_credits(price_model):
    market = Market(price_model)
    cargo = CargoHold(10)
    cargo.add("food", 2)
    
    price_model.daily_variance = 1.0
    
    # Default food base = 80. The Shallows MULT = 0.5. 80 * 0.5 = 40. Sell action * 0.90 -> 36.
    res = market.sell("the_shallows", "food", 2, cargo, 100)
    assert res["success"] == True
    assert res["credits"] == 100 + (36 * 2)
    assert cargo.space_used() == 0

def test_ship_travel_costs_fuel(graph):
    ship = PlayerShip("port_kelvin")
    assert ship.fuel == 10
    
    res = ship.travel("the_shallows", graph)
    assert res["success"] == True
    assert ship.fuel == 9
    assert ship.location_id == "the_shallows"

def test_ship_travel_blocked_without_fuel(graph):
    ship = PlayerShip("port_kelvin")
    ship.fuel = 0
    
    res = ship.travel("the_shallows", graph)
    assert res["success"] == False
    assert ship.location_id == "port_kelvin"

def test_encounter_roll_returns_valid_type():
    sys = EncounterSystem()
    
    # We'll just run it a few times and ensure any non-None return is a known type
    found_types = set()
    for _ in range(100):
        res = sys.roll_encounter("the_fringe", "deadrock", {})
        if res:
            found_types.add(res["type"])
            
    assert found_types.issubset(set(EncounterSystem.ENCOUNTER_TYPES))

from src.apps.space_trader.session import SpaceTraderSession
from src.apps.space_trader.run_space_trader import print_map

def test_map_command_shows_neighbors():
    session = SpaceTraderSession()
    session.ship.location_id = "port_kelvin"
    
    # print_map returns the list of reachable IDs in order
    map_ids = print_map(session)
    
    # Port Kelvin connects to Shallows and Ironmere
    assert len(map_ids) == 2
    assert "the_shallows" in map_ids
    assert "ironmere_station" in map_ids

def test_travel_by_number_alias():
    session = SpaceTraderSession()
    session.ship.location_id = "port_kelvin"
    
    map_ids = print_map(session)
    
    # Simulate user typing "travel 1"
    target_idx = 0
    target_id = map_ids[target_idx]
    
    res = session.ship.travel(target_id, session.graph, session.encounter_system)
    
    assert res["success"] == True
    assert session.ship.location_id == target_id
    assert session.ship.fuel == 9
