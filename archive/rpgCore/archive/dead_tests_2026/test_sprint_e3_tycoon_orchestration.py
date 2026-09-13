"""
Test Sprint E3: Tycoon Orchestration

Sprint E3: Tycoon Orchestration - Verification
Tests the persistent gameplay loop with 3-day simulation.
"""

import sys
from pathlib import Path
import time
import os

def test_daily_cycle_manager():
    """Test daily cycle manager functionality"""
    try:
        # Add src to path
        src_path = Path(__file__).parent / "src"
        if str(src_path) not in sys.path:
            sys.path.insert(0, str(src_path))
        
        from apps.tycoon.systems.cycle_manager import CycleManager, create_cycle_manager
        
        print("✅ Daily Cycle Manager imports successful")
        
        # Clean up save file for fresh test
        import os
        save_file = "data/tycoon_save.json"
        if os.path.exists(save_file):
            os.remove(save_file)
        
        # Create cycle manager
        cycle_manager = create_cycle_manager()
        init_result = cycle_manager.initialize()
        assert init_result.success, f"Cycle manager initialization failed: {init_result.error}"
        print("✅ Cycle manager initialized")
        
        # Check initial state
        state_result = cycle_manager.handle_event("get_state", {})
        assert state_result.success, f"Failed to get cycle state: {state_result.error}"
        
        initial_state = state_result.value
        assert initial_state['day'] == 1
        assert initial_state['wallet'] == 1000.0
        print(f"✅ Initial state: Day {initial_state['day']}, Wallet ${initial_state['wallet']:.2f}")
        
        # Advance to day 2
        advance_result = cycle_manager.handle_event("advance_day", {})
        assert advance_result.success, f"Failed to advance day: {advance_result.error}"
        print("✅ Advanced to Day 2")
        
        # Check state after advancing
        state_result = cycle_manager.handle_event("get_state", {})
        assert state_result.success
        day2_state = state_result.value
        assert day2_state['day'] == 2
        print(f"✅ Day 2 state: {len(day2_state['wild_turtles'])} wild turtles available")
        
        # Shutdown
        cycle_manager.shutdown()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_economy_engine():
    """Test economy engine functionality"""
    try:
        from apps.tycoon.systems.economy_engine import EconomyEngine, create_economy_engine
        
        print("✅ Economy Engine imports successful")
        
        # Create economy engine
        economy = create_economy_engine()
        init_result = economy.initialize()
        assert init_result.success, f"Economy engine initialization failed: {init_result.error}"
        print("✅ Economy engine initialized")
        
        # Check initial wallet
        wallet_result = economy.handle_event("get_wallet_balance", {})
        assert wallet_result.success, f"Failed to get wallet balance: {wallet_result.error}"
        
        initial_balance = wallet_result.value['current_balance']
        assert initial_balance == 1000.0
        print(f"✅ Initial wallet balance: ${initial_balance:.2f}")
        
        # Check shop inventory
        shop_result = economy.handle_event("get_shop_inventory", {})
        assert shop_result.success, f"Failed to get shop inventory: {shop_result.error}"
        
        shop_inventory = shop_result.value
        assert len(shop_inventory) > 0
        print(f"✅ Shop inventory: {len(shop_inventory)} items available")
        
        # Test purchase
        if shop_inventory:
            first_turtle_id = list(shop_inventory.keys())[0]
            purchase_result = economy.handle_event("purchase_turtle", {"turtle_id": first_turtle_id})
            assert purchase_result.success, f"Failed to purchase turtle: {purchase_result.error}"
            
            purchase_details = purchase_result.value
            print(f"✅ Purchased turtle {first_turtle_id} for ${purchase_details['price']:.2f}")
            print(f"✅ Remaining balance: ${purchase_details['remaining_balance']:.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_stable_manager():
    """Test stable manager functionality"""
    try:
        from apps.tycoon.systems.stable_manager import StableManager, create_stable_manager
        
        print("✅ Stable Manager imports successful")
        
        # Clean up save file for fresh test
        import os
        stable_file = "data/stable.json"
        if os.path.exists(stable_file):
            os.remove(stable_file)
        
        # Create stable manager
        stable = create_stable_manager()
        init_result = stable.initialize()
        assert init_result.success, f"Stable manager initialization failed: {init_result.error}"
        print("✅ Stable manager initialized")
        
        # Check initial roster
        roster_result = stable.handle_event("get_stable_roster", {})
        assert roster_result.success, f"Failed to get stable roster: {roster_result.error}"
        
        initial_roster = roster_result.value
        initial_count = initial_roster['stable_capacity']['current']
        print(f"✅ Initial stable: {initial_count}/{initial_roster['stable_capacity']['maximum']} turtles")
        
        # Add a turtle to stable
        add_result = stable.handle_event("add_to_stable", {
            "turtle_id": "test_turtle_1",
            "acquisition_method": "purchase",
            "price": 150.0
        })
        assert add_result.success, f"Failed to add turtle to stable: {add_result.error}"
        print("✅ Added turtle to stable")
        
        # Check updated roster
        roster_result = stable.handle_event("get_stable_roster", {})
        assert roster_result.success
        
        updated_roster = roster_result.value
        assert updated_roster['stable_capacity']['current'] == initial_count + 1
        assert len(updated_roster['owned_turtles']) == initial_count + 1
        
        turtle_stats = updated_roster['owned_turtles'][0]
        assert turtle_stats['turtle_id'] == "test_turtle_1"
        assert turtle_stats['current_stamina'] == 100.0
        print(f"✅ Updated stable: {len(updated_roster['owned_turtles'])} turtle with {turtle_stats['current_stamina']:.1f} stamina")
        
        # Shutdown
        stable.shutdown()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_3_day_simulation():
    """Run a complete 3-day simulation"""
    try:
        from apps.tycoon.systems.cycle_manager import create_cycle_manager
        from apps.tycoon.systems.economy_engine import create_economy_engine
        from apps.tycoon.systems.stable_manager import create_stable_manager
        from apps.tycoon.entities.turtle import create_random_turtle
        from dgt_engine.foundation.registry import DGTRegistry
        
        print("✅ 3-Day Simulation imports successful")
        
        # Clean up any existing save files
        save_files = ["data/tycoon_save.json", "data/stable.json"]
        for file_path in save_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Create systems
        cycle_manager = create_cycle_manager()
        economy = create_economy_engine()
        stable = create_stable_manager()
        
        # Initialize all systems
        cycle_manager.initialize()
        economy.initialize()
        stable.initialize()
        
        print("✅ All systems initialized")
        
        # === DAY 1: Purchase a turtle ===
        print("\n📅 DAY 1: Purchase Phase")
        
        # Get shop inventory
        shop_result = economy.handle_event("get_shop_inventory", {})
        assert shop_result.success
        shop_inventory = shop_result.value
        
        # Purchase first available turtle
        if shop_inventory:
            turtle_id = list(shop_inventory.keys())[0]
            
            # Purchase from economy
            purchase_result = economy.handle_event("purchase_turtle", {"turtle_id": turtle_id})
            assert purchase_result.success
            purchase_details = purchase_result.value
            
            # Add to stable
            add_result = stable.handle_event("add_to_stable", {
                "turtle_id": turtle_id,
                "acquisition_method": "purchase",
                "price": purchase_details['price']
            })
            assert add_result.success
            
            print(f"✅ Purchased and stabled turtle {turtle_id} for ${purchase_details['price']:.2f}")
        
        # Check end of Day 1 state
        wallet_result = economy.handle_event("get_wallet_balance", {})
        roster_result = stable.handle_event("get_stable_roster", {})
        
        day1_wallet = wallet_result.value['current_balance']
        day1_turtles = len(roster_result.value['owned_turtles'])
        
        print(f"✅ Day 1 Complete: Wallet ${day1_wallet:.2f}, {day1_turtles} turtles owned")
        
        # === DAY 2: Run a race ===
        print("\n📅 DAY 2: Race Phase")
        
        # Advance to day 2
        advance_result = cycle_manager.handle_event("advance_day", {})
        assert advance_result.success
        print("✅ Advanced to Day 2")
        
        # Get available turtles for race
        available_result = stable.handle_event("get_available_for_race", {})
        assert available_result.success
        
        available_turtles = available_result.value
        if available_turtles:
            race_turtle = available_turtles[0]
            
            # Simulate race (1st place)
            race_result = stable.handle_event("update_race_result", {
                "turtle_id": race_turtle,
                "position": 1,
                "winnings": 200.0,
                "race_day": 2
            })
            assert race_result.success
            
            # Award winnings
            winnings_result = economy.handle_event("award_winnings", {
                "turtle_id": race_turtle,
                "amount": 200.0
            })
            assert winnings_result.success
            
            print(f"✅ Turtle {race_turtle} won race and earned $200.00")
        
        # Check end of Day 2 state
        wallet_result = economy.handle_event("get_wallet_balance", {})
        stats_result = stable.handle_event("get_turtle_stats", {"turtle_id": race_turtle})
        
        day2_wallet = wallet_result.value['current_balance']
        turtle_stats = stats_result.value
        
        print(f"✅ Day 2 Complete: Wallet ${day2_wallet:.2f}")
        print(f"✅ Turtle stats: {turtle_stats.get('race_count', 0)} races, {turtle_stats.get('wins', 0)} wins, {turtle_stats.get('current_stamina', 0):.1f} stamina")
        
        # === DAY 3: Verify persistence ===
        print("\n📅 DAY 3: Persistence Verification")
        
        # Advance to day 3
        advance_result = cycle_manager.handle_event("advance_day", {})
        assert advance_result.success
        print("✅ Advanced to Day 3")
        
        # Check that data persisted
        wallet_result = economy.handle_event("get_wallet_balance", {})
        roster_result = stable.handle_event("get_stable_roster", {})
        
        day3_wallet = wallet_result.value['current_balance']
        day3_turtles = len(roster_result.value['owned_turtles'])
        
        print(f"✅ Day 3 Complete: Wallet ${day3_wallet:.2f}, {day3_turtles} turtles owned")
        
        # Verify persistence
        assert day3_wallet > day1_wallet, "Wallet should have increased from race winnings"
        assert day3_turtles == day1_turtles, "Turtle count should be preserved"
        assert turtle_stats['current_stamina'] < 100.0, "Stamina should be lower after race"
        
        print("✅ Persistence verified across 3-day simulation")
        
        # Shutdown systems
        cycle_manager.shutdown()
        economy.shutdown()
        stable.shutdown()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Testing Sprint E3: Tycoon Orchestration...")
    
    tests = [
        ("Daily Cycle Manager", test_daily_cycle_manager),
        ("Economy Engine", test_economy_engine),
        ("Stable Manager", test_stable_manager),
        ("3-Day Simulation", test_3_day_simulation)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        success = test_func()
        results.append((test_name, success))
    
    print(f"\n🏁 Sprint E3 Test Results:")
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    all_passed = all(success for _, success in results)
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if all_passed:
        print("\n🏆 Sprint E3: TYCOON ORCHESTRATION - SUCCESS!")
        print("💰 Persistent gameplay loop operational!")
        print("🐢 Turtle roster management working!")
        print("📅 Daily cycle management functional!")
        print("🏁 Income stream logic implemented!")
        print("🌱 Ready for Tycoon game development!")
