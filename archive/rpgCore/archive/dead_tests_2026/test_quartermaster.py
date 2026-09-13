"""
Test script for Quartermaster Logic (v1.2 - Inventory Integration)
"""
import sys
import os

# Add src to path
sys.path.append(r"c:\Github\rpgCore\src")

from quartermaster import Quartermaster
from loot_system import Item

def test_sticky_floors():
    """Verify Sticky Floors logic."""
    print("Testing 'Sticky Floors' logic...")
    qm = Quartermaster()
    
    # Test case: Finesse with Sticky Floors
    outcome = qm.calculate_outcome(
        intent_id="finesse",
        room_tags=["Sticky Floors"],
        base_difficulty=10
    )
    
    if "Sticky floors hindered movement" in outcome.narrative_context:
        print("PASS: Sticky floors noticed for Finesse.")
    else:
        print(f"FAIL: Sticky floors ignored. Context: {outcome.narrative_context}")

def test_inventory_bonus():
    """Verify Inventory Item logic."""
    print("\nTesting Inventory Integration...")
    qm = Quartermaster()
    
    # Create item: Magic Ring (+2 Charisma)
    magic_ring = Item(
        name="Ring of Charm",
        description="Shiny",
        target_stat="charisma",
        modifier_value=2,
        stat_bonus="+2 Charisma"
    )
    
    # Test Charm action with Ring
    outcome = qm.calculate_outcome(
        intent_id="charm",
        room_tags=[],
        player_stats={"charisma": 0},
        inventory_items=[magic_ring]
    )
    
    if "Item: Ring of Charm (+2)" in outcome.narrative_context:
        print("PASS: Magic Ring bonus applied.")
    else:
         print(f"FAIL: Magic Ring ignored. Context: {outcome.narrative_context}")

    # Test Force action (Ring shouldn't help)
    outcome_force = qm.calculate_outcome(
        intent_id="force",
        room_tags=[],
        player_stats={"strength": 0},
        inventory_items=[magic_ring]
    )
    
    if "Item: Ring of Charm" not in outcome_force.narrative_context:
        print("PASS: Magic Ring correctly ignored for Force.")
    else:
        print(f"FAIL: Magic Ring applied to wrong stat. Context: {outcome_force.narrative_context}")

def main():
    test_sticky_floors()
    test_inventory_bonus()

if __name__ == "__main__":
    main()
