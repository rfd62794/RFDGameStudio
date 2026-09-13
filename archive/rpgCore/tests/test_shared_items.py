from src.shared.items.item import Item
from src.shared.items.inventory import Inventory
from src.shared.items.loot_table import LootTable

def test_item_unidentified_hides_stats():
    item = Item("sword_1", "Flaming Sword", "Burns stuff", "weapon", "weapon", {"attack": 10}, identified=False)
    assert item.display_name == "Unidentified Item"
    assert item.display_stats == {}
    
def test_item_identify_reveals_stats():
    item = Item("sword_1", "Flaming Sword", "Burns stuff", "weapon", "weapon", {"attack": 10}, identified=False)
    item.identify()
    
    assert item.display_name == "Flaming Sword"
    assert item.display_stats == {"attack": 10}

def test_inventory_equip_and_displace():
    inv = Inventory()
    sword1 = Item("s1", "Sword", "", "weapon", "weapon", {"attack": 2})
    sword2 = Item("s2", "Better Sword", "", "weapon", "weapon", {"attack": 5})
    
    displaced1 = inv.equip(sword1)
    assert displaced1 is None
    assert inv.slots["weapon"] is sword1
    
    displaced2 = inv.equip(sword2)
    assert displaced2 is sword1
    assert inv.slots["weapon"] is sword2

def test_inventory_stat_total_sums_equipped():
    inv = Inventory()
    sword = Item("s1", "Sword", "", "weapon", "weapon", {"attack": 3, "speed": 1})
    helm = Item("h1", "Helm", "", "armor", "head", {"defense": 2, "speed": -1})
    
    inv.equip(sword)
    inv.equip(helm)
    
    assert inv.get_stat_total("attack") == 3
    assert inv.get_stat_total("defense") == 2
    assert inv.get_stat_total("speed") == 0

def test_inventory_gold_management():
    inv = Inventory()
    assert inv.get_gold() == 0
    
    inv.add_gold(100)
    assert inv.get_gold() == 100
    
    success = inv.spend_gold(40)
    assert success is True
    assert inv.get_gold() == 60
    
    failed = inv.spend_gold(100)
    assert failed is False
    assert inv.get_gold() == 60

def test_inventory_capacity_enforced():
    inv = Inventory(capacity=2)
    i1 = Item("1", "A", "", "consumable", "none")
    i2 = Item("2", "B", "", "consumable", "none")
    i3 = Item("3", "C", "", "consumable", "none")
    
    assert inv.add_to_backpack(i1) is True
    assert inv.add_to_backpack(i2) is True
    assert inv.add_to_backpack(i3) is False  # Full
    
    assert len(inv.backpack) == 2

def test_loot_table_rolls_valid_item():
    lt = LootTable()
    item_template = Item("test_item", "Test", "", "weapon", "weapon")
    lt.add_entry(item_template, 1.0)
    
    rolled = lt.roll(depth=1)
    assert rolled is not None
    assert rolled.id == "test_item"
    assert rolled is not item_template  # Should be a new instance
