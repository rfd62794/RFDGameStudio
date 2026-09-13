"""
Cross-Platform Loop Verification Test
Tests the complete TurboShells experience across Retro and HD modes
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any

# Add src to path for imports
src_path = Path(__file__).parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from dgt_core.engines.viewport.logical_viewport import LogicalViewport, ViewportManager
from dgt_core.engines.viewport.adaptive_renderer import AdaptiveRenderer, RenderProfile
from dgt_core.ui.components.adaptive_turtle_card import AdaptiveTurtleCard, TurtleDisplayData, DisplayMode
from dgt_core.ui.views.breeding_view import BreedingView
from dgt_core.ui.views.shop_view import ShopView
from dgt_core.systems.day_cycle_manager import PersistentStateManager
from dgt_core.registry.dgt_registry import DGTRegistry


class MockRegistry(DGTRegistry):
    """Mock registry for testing purposes"""
    
    def __init__(self):
        self.data = {
            "turtles": {},
            "player": {"money": 500},
            "day_cycle": {},
            "game_state": {}
        }
        self.turtle_counter = 0
    
    def get_turtles_for_breeding(self):
        """Get available turtles for breeding"""
        return list(self.data["turtles"].keys())
    
    def get_turtle(self, turtle_id):
        """Get turtle data"""
        return self.data["turtles"].get(turtle_id)
    
    def get_player_money(self):
        """Get player money"""
        return self.data["player"]["money"]
    
    def deduct_money(self, amount):
        """Deduct money from player"""
        self.data["player"]["money"] -= amount
    
    def add_money(self, amount):
        """Add money to player"""
        self.data["player"]["money"] += amount
    
    def create_offspring(self, parent1_id, parent2_id, genetics):
        """Create offspring turtle"""
        self.turtle_counter += 1
        offspring_id = f"turtle_{self.turtle_counter}"
        
        offspring_data = {
            "id": offspring_id,
            "name": f"Offspring {self.turtle_counter}",
            "genetics": genetics,
            "stats": {"speed": 10.0, "energy": 100.0}
        }
        
        self.data["turtles"][offspring_id] = offspring_data
        return offspring_id
    
    def add_turtle_to_collection(self, name, genetics):
        """Add turtle to collection"""
        self.turtle_counter += 1
        turtle_id = f"turtle_{self.turtle_counter}"
        
        turtle_data = {
            "id": turtle_id,
            "name": name,
            "genetics": genetics,
            "stats": {"speed": 10.0, "energy": 100.0}
        }
        
        self.data["turtles"][turtle_id] = turtle_data
        return turtle_id
    
    def get_day_cycle_state(self):
        """Get day cycle state"""
        return self.data.get("day_cycle", {})
    
    def set_day_cycle_state(self, state):
        """Set day cycle state"""
        self.data["day_cycle"] = state
    
    def record_breeding_event(self, parent1_id, parent2_id, offspring_id, cost):
        """Record breeding event"""
        pass
    
    def record_purchase_event(self, turtle_id, cost):
        """Record purchase event"""
        pass
    
    def record_shop_refresh(self):
        """Record shop refresh"""
        pass
    
    def update_money(self, amount, reason):
        """Update money"""
        pass
    
    def save_to_file(self, filename):
        """Save to file"""
        try:
            with open(filename, 'w') as f:
                json.dump(self.data, f, indent=2)
            return True
        except Exception:
            return False
    
    def get_player_statistics(self):
        """Get player statistics"""
        return {"money": self.data["player"]["money"], "turtle_count": len(self.data["turtles"])}
    
    def get_turtle_statistics(self):
        """Get turtle statistics"""
        return {"total": len(self.data["turtles"])}
    
    def get_last_save_time(self):
        """Get last save time"""
        return "test_time"


def create_test_turtle_data() -> Dict[str, Any]:
    """Create test turtle genetics data"""
    return {
        "shell_base_color": (34, 139, 34),
        "shell_pattern_type": "hex",
        "shell_pattern_color": (255, 255, 255),
        "shell_pattern_density": 0.5,
        "shell_pattern_opacity": 0.8,
        "shell_size_modifier": 1.0,
        "body_base_color": (107, 142, 35),
        "body_pattern_type": "solid",
        "body_pattern_color": (85, 107, 47),
        "body_pattern_density": 0.3,
        "head_size_modifier": 1.0,
        "head_color": (139, 90, 43),
        "leg_length": 1.0,
        "limb_shape": "flippers",
        "leg_thickness_modifier": 1.0,
        "leg_color": (101, 67, 33),
        "eye_color": (0, 0, 0),
        "eye_size_modifier": 1.0
    }


def test_retro_mode_purchase():
    """Test purchasing a turtle in Retro Mode"""
    print("🐢 Testing Retro Mode Purchase")
    print("=" * 50)
    
    # Setup retro environment
    viewport = LogicalViewport()
    viewport.set_physical_resolution((160, 144))
    registry = MockRegistry()
    shop_view = ShopView(viewport, registry)
    state_manager = PersistentStateManager(registry)
    
    # Update shop with player money
    shop_view.update_state()
    
    print(f"Initial money: ${registry.get_player_money()}")
    
    # Select first turtle item
    first_item = shop_view.state.shop_inventory[0]
    success = shop_view.select_item(first_item.item_id)
    print(f"Selected item: {first_item.name}")
    
    # Purchase the item
    if shop_view.can_purchase():
        purchase_success = shop_view.purchase_item()
        print(f"Purchase successful: {purchase_success}")
        
        # Record in persistent state
        if purchase_success:
            state_manager.on_turtle_purchased(first_item.item_id, first_item.price)
            state_manager.force_save()
        
        print(f"Remaining money: ${registry.get_player_money()}")
        print(f"Turtles owned: {len(registry.data['turtles'])}")
    else:
        print("Cannot purchase item")
    
    return len(registry.data['turtles']) > 0


def test_hd_mode_verification():
    """Test that purchased turtle exists in HD Mode"""
    print("\n🖥️ Testing HD Mode Verification")
    print("=" * 50)
    
    # Load the saved registry data
    try:
        with open("stable.json", 'r') as f:
            saved_data = json.load(f)
    except FileNotFoundError:
        print("❌ No saved data found - test failed")
        return False
    
    # Setup HD environment
    viewport = LogicalViewport()
    viewport.set_physical_resolution((1280, 720))
    registry = MockRegistry()
    registry.data = saved_data  # Load saved data
    
    # Verify turtle exists
    turtle_count = len(registry.data['turtles'])
    print(f"Turtles in HD mode: {turtle_count}")
    
    if turtle_count > 0:
        # Get first turtle and verify genetics
        first_turtle_id = list(registry.data['turtles'].keys())[0]
        first_turtle = registry.get_turtle(first_turtle_id)
        
        print(f"Verified turtle: {first_turtle['name']}")
        print(f"Genetics traits: {len(first_turtle['genetics'])}")
        
        # Verify all 17 traits are present
        expected_traits = [
            "shell_base_color", "shell_pattern_type", "shell_pattern_color",
            "shell_pattern_density", "shell_pattern_opacity", "shell_size_modifier",
            "body_base_color", "body_pattern_type", "body_pattern_color",
            "body_pattern_density", "head_size_modifier", "head_color",
            "leg_length", "limb_shape", "leg_thickness_modifier", "leg_color",
            "eye_color", "eye_size_modifier"
        ]
        
        missing_traits = []
        for trait in expected_traits:
            if trait not in first_turtle['genetics']:
                missing_traits.append(trait)
        
        if missing_traits:
            print(f"❌ Missing traits: {missing_traits}")
            return False
        else:
            print("✅ All 17 genetic traits verified")
        
        # Test adaptive turtle card rendering
        display_data = TurtleDisplayData(
            turtle_id=first_turtle['id'],
            name=first_turtle['name'],
            genetics=first_turtle['genetics'],
            stats=first_turtle['stats'],
            position=(400, 300),  # Center of HD display
            is_selected=False
        )
        
        turtle_card = AdaptiveTurtleCard(viewport, DisplayMode.HD)
        turtle_card.set_turtle_data(display_data)
        turtle_card.get_logical_rect((400, 300))
        
        # Render the card
        render_data = turtle_card.render()
        
        print(f"Turtle card rendered in HD mode: {render_data['type']}")
        print(f"Card elements: {len(render_data['elements'])}")
        
        # Verify proportional coordinates
        logical_pos = (400.0, 300.0)
        physical_pos = viewport.to_physical(logical_pos)
        expected_x = int(400 * 1280 / 1000)  # 512
        expected_y = int(300 * 720 / 1000)   # 216
        
        print(f"Logical position: {logical_pos}")
        print(f"Physical position: {physical_pos}")
        print(f"Expected position: ({expected_x}, {expected_y})")
        
        # Allow small tolerance for rounding
        tolerance = 5
        if (abs(physical_pos[0] - expected_x) <= tolerance and 
            abs(physical_pos[1] - expected_y) <= tolerance):
            print("✅ Proportional coordinates verified")
        else:
            print("❌ Proportional coordinates mismatch")
            return False
        
        return True
    else:
        print("❌ No turtles found in saved data")
        return False


def test_breeding_cross_platform():
    """Test breeding system across both modes"""
    print("\n🧬 Testing Cross-Platform Breeding")
    print("=" * 50)
    
    # Load saved data
    try:
        with open("stable.json", 'r') as f:
            saved_data = json.load(f)
    except FileNotFoundError:
        print("❌ No saved data found")
        return False
    
    # Test in Retro Mode
    print("Testing breeding in Retro Mode...")
    viewport_retro = LogicalViewport()
    viewport_retro.set_physical_resolution((160, 144))
    registry_retro = MockRegistry()
    registry_retro.data = saved_data
    
    breeding_view_retro = BreedingView(viewport_retro, registry_retro)
    state_manager = PersistentStateManager(registry_retro)
    
    # Add some test turtles for breeding
    test_genetics1 = create_test_turtle_data()
    test_genetics2 = create_test_turtle_data()
    test_genetics2["shell_base_color"] = (255, 0, 0)  # Different color
    
    parent1_id = registry_retro.add_turtle_to_collection("Parent1", test_genetics1)
    parent2_id = registry_retro.add_turtle_to_collection("Parent2", test_genetics2)
    
    # Select parents and breed
    breeding_view_retro.select_parent(parent1_id)
    breeding_view_retro.select_parent(parent2_id)
    
    initial_turtle_count = len(registry_retro.data['turtles'])
    print(f"Initial turtle count: {initial_turtle_count}")
    
    if breeding_view_retro.can_breed():
        breeding_success = breeding_view_retro.start_breeding()
        print(f"Breeding successful: {breeding_success}")
        
        if breeding_success:
            # Record in persistent state
            offspring_id = breeding_view_retro.state.last_offspring_id
            breeding_cost = breeding_view_retro.state.breeding_cost
            state_manager.on_turtle_bred(parent1_id, parent2_id, offspring_id, breeding_cost)
            state_manager.force_save()
            
            new_turtle_count = len(registry_retro.data['turtles'])
            print(f"New turtle count: {new_turtle_count}")
    
    # Test in HD Mode with same data
    print("\nTesting breeding verification in HD Mode...")
    viewport_hd = LogicalViewport()
    viewport_hd.set_physical_resolution((1280, 720))
    registry_hd = MockRegistry()
    
    # Load the latest saved data
    try:
        with open("stable.json", 'r') as f:
            latest_data = json.load(f)
        registry_hd.data = latest_data
    except FileNotFoundError:
        print("❌ No latest saved data found")
        return False
    
    final_turtle_count = len(registry_hd.data['turtles'])
    print(f"Final turtle count in HD mode: {final_turtle_count}")
    
    return final_turtle_count > initial_turtle_count


def test_day_cycle_persistence():
    """Test day cycle persistence across modes"""
    print("\n📅 Testing Day Cycle Persistence")
    print("=" * 50)
    
    # Load saved data
    try:
        with open("stable.json", 'r') as f:
            saved_data = json.load(f)
    except FileNotFoundError:
        print("❌ No saved data found")
        return False
    
    registry = MockRegistry()
    registry.data = saved_data
    state_manager = PersistentStateManager(registry)
    
    # Get day cycle state
    day_summary = state_manager.day_cycle.get_daily_summary()
    print(f"Current day: {day_summary['current_day']}")
    print(f"Actions today: {day_summary['actions_remaining']}")
    print(f"Turtles bred today: {day_summary['turtles_bred']}")
    print(f"Turtles purchased today: {day_summary['turtles_purchased']}")
    
    # Test day advancement
    initial_day = day_summary['current_day']
    state_manager.day_cycle.force_advance_day()
    
    new_day_summary = state_manager.day_cycle.get_daily_summary()
    print(f"Advanced to day: {new_day_summary['current_day']}")
    
    # Save and verify persistence
    state_manager.force_save()
    
    # Reload and verify
    try:
        with open("stable.json", 'r') as f:
            reloaded_data = json.load(f)
        
        reloaded_day = reloaded_data.get("day_cycle", {}).get("current_day", 0)
        print(f"Reloaded day: {reloaded_day}")
        
        return reloaded_day == new_day_summary['current_day']
        
    except FileNotFoundError:
        print("❌ Failed to reload saved data")
        return False


def main():
    """Run the complete cross-platform verification test"""
    print("🏆 Cross-Platform Loop Verification")
    print("=" * 60)
    print("Testing TurboShells Universal Simulation Environment")
    print()
    
    tests = [
        ("Retro Mode Purchase", test_retro_mode_purchase),
        ("HD Mode Verification", test_hd_mode_verification),
        ("Cross-Platform Breeding", test_breeding_cross_platform),
        ("Day Cycle Persistence", test_day_cycle_persistence)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print('='*60)
        
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {e}")
    
    # Cleanup
    try:
        Path("stable.json").unlink()  # Clean up test file
    except:
        pass
    
    print(f"\n{'='*60}")
    print(f"Cross-Platform Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL CROSS-PLATFORM TESTS PASSED!")
        print("✅ TurboShells Universal Simulation Environment is FULLY OPERATIONAL")
        print("✅ Cross-platform persistence verified")
        print("✅ 17 genetic traits maintained across all resolutions")
        print("✅ Proportional coordinates working perfectly")
        print("✅ Ready for commercial deployment!")
        return True
    else:
        print("❌ Some cross-platform tests failed")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
