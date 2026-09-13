import sys
import argparse
import pygame
from src.apps.space_trader.session import SpaceTraderSession

def print_status(session: SpaceTraderSession):
    loc = session.graph.get(session.ship.location_id)
    print("\n" + "="*40)
    print(f" LOCATION : {loc.name} ({loc.faction.title()})")
    print(f" DESC     : {loc.description}")
    print(f" CREDITS  : {session.ship.credits} cr")
    print(f" FUEL     : {session.ship.fuel} / {session.ship.max_fuel}")
    print(f" CARGO    : {session.ship.cargo.space_used()} / {session.ship.cargo.capacity}")
    if session.ship.cargo.contents:
        for item, qty in session.ship.cargo.contents.items():
            print(f"            - {qty}x {item}")
    print("="*40)

def print_market(session: SpaceTraderSession):
    listings = session.market.get_listings(session.ship.location_id)
    if not listings:
        print("\n [ Market Closed / No Goods Available ]")
        return
        
    print("\n--- LOCAL MARKET ---")
    print(f"{'GOOD':<10} | {'BUY FOR':<10} | {'SELL FOR':<10}")
    print("-" * 35)
    for l in listings:
        print(f"{l['good'].title():<10} | {l['buy_price']:<10} | {l['sell_price']:<10}")
        
def print_map(session: SpaceTraderSession) -> list[str]:
    loc = session.graph.get(session.ship.location_id)
    print("\n--- NAVIGATION MAP ---")
    print(f"Current: {loc.name} ({loc.faction.title()})")
    print("Reachable:")
    neighbors = session.graph.neighbors(loc.id)
    ordered_ids = []
    
    for i, n in enumerate(neighbors):
        num_str = f"[{i+1}]"
        # Extract faction string formatting
        fac_str = f"— {n.faction.title()}"
        risk_str = f"— {session.get_risk_level(n.id)}"
        print(f"  {num_str} {n.name:<18} {fac_str:<15} {risk_str}")
        ordered_ids.append(n.id)
        
    print("Fuel cost: 1 per jump")
    return ordered_ids

def run_repl(session: SpaceTraderSession):
    print("Initializing Space Trader REPL...")
    print("\n[ SYSTEM ONLINE ]")
    
    map_ids = [] # Cache the last map order for aliases

    while True:
        print_status(session)
        print("\nCOMMANDS: [status, map, market, buy <good> <qty>, sell <good> <qty>, travel <node_id_or_number>, refuel, quit]")
        cmd_input = input(">> ").strip().lower()
        
        parts = cmd_input.split()
        if not parts:
            continue
            
        cmd = parts[0]
        
        if cmd == "quit":
            print("Shutting down... Fly safe.")
            break
        elif cmd == "status":
            continue
        elif cmd == "market":
            print_market(session)
        elif cmd == "map":
            map_ids = print_map(session)
        elif cmd == "refuel":
            cost = (session.ship.max_fuel - session.ship.fuel) * 5
            if cost == 0:
                print("Fuel tanks already full.")
            elif session.ship.credits >= cost:
                session.ship.credits -= cost
                session.ship.fuel = session.ship.max_fuel
                print(f"Refueled for {cost} cr.")
            else:
                print(f"Cannot afford fuel (need {cost} cr).")
        elif cmd == "buy" and len(parts) == 3:
            good = parts[1]
            try:
                qty = int(parts[2])
                res = session.market.buy(session.ship.location_id, good, qty, session.ship.cargo, session.ship.credits)
                session.ship.credits = res["credits"]
                print("\n-> " + res["message"])
            except ValueError:
                print("Invalid quantity.")
        elif cmd == "sell" and len(parts) == 3:
            good = parts[1]
            try:
                qty = int(parts[2])
                res = session.market.sell(session.ship.location_id, good, qty, session.ship.cargo, session.ship.credits)
                session.ship.credits = res["credits"]
                print("\n-> " + res["message"])
            except ValueError:
                print("Invalid quantity.")
        elif cmd == "travel" and len(parts) == 2:
            target = parts[1]
            
            # Check for number alias
            if target.isdigit():
                idx = int(target) - 1
                if 0 <= idx < len(map_ids):
                    target = map_ids[idx]
                else:
                    print("Invalid map index. Type 'map' to see active numbers.")
                    continue
                    
            res = session.ship.travel(target, session.graph, session.encounter_system)
            print("\n-> " + res["message"])
            if res.get("encounter"):
                print("!!! ALERT !!! " + res["encounter"]["message"])
            
            # Reseed economy params on travel
            session.price_model.update_daily()
            
            # Clear map alias cache on move
            map_ids = []
            
        else:
            print("Unknown command format.")

def main():
    parser = argparse.ArgumentParser(description="rpgCore Space Trader")
    parser.add_argument("--terminal", action="store_true", help="Launch in text REPL mode instead of graphical Pygame mode.")
    args, _ = parser.parse_known_args()
    
    session = SpaceTraderSession()
    
    if args.terminal:
        run_repl(session)
    else:
        # Launch Pygame Scene
        from src.apps.space_trader.ui.scene_space_trader import SpaceTraderScene
        from src.shared.engine.scene_manager import SceneManager
        
        manager = SceneManager(width=1024, height=768, title="Space Trader", fps=60)
        manager.register("trader", SpaceTraderScene)
        manager.run("trader", session=session)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down... Fly safe.")
        sys.exit(0)
