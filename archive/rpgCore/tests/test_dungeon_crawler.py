import pytest
from src.apps.dungeon_crawler.world.room import Room
from src.apps.dungeon_crawler.world.floor import Floor
from src.apps.dungeon_crawler.world.room_generator import RoomGenerator
from src.apps.dungeon_crawler.hub.the_room import TheRoom
from src.apps.dungeon_crawler.entities.hero import Hero
from src.apps.dungeon_crawler.entities.enemy import Enemy
from src.shared.items.item import Item
from src.shared.items.loot_table import LootTable
from src.shared.combat.turn_order import TurnOrderManager

def test_turn_order_by_speed():
    mgr = TurnOrderManager()
    mgr.add_combatant("slow", 2)
    mgr.add_combatant("fast", 8)
    mgr.add_combatant("mid", 5)
    
    assert mgr.next_turn() == "fast"
    assert mgr.next_turn() == "mid"
    assert mgr.next_turn() == "slow"
    assert mgr.next_turn() == "fast"  # loops around

def test_turn_order_remove_combatant():
    mgr = TurnOrderManager()
    mgr.add_combatant("a", 10)
    mgr.add_combatant("b", 5)
    mgr.add_combatant("c", 1)
    
    # turn is A
    assert mgr.next_turn() == "a"
    
    # kill B before its turn
    mgr.remove_combatant("b")
    
    # next turn should skip B and go to C
    assert mgr.next_turn() == "c"

def test_room_generator_has_boss():
    gen = RoomGenerator()
    floor = gen.generate(1, seed=42)
    boss_rooms = [r for r in floor.rooms.values() if r.room_type == "boss"]
    assert len(boss_rooms) == 1

def test_room_generator_has_entrance():
    gen = RoomGenerator()
    floor = gen.generate(1, seed=42)
    assert "entrance" in floor.rooms
    assert floor.rooms["entrance"].room_type == "rest"
    assert floor.rooms["entrance"].revealed is True

def test_floor_movement():
    floor = Floor(1)
    r1 = Room("entrance", "rest", connections=["r2"], revealed=True, cleared=True)
    r2 = Room("r2", "combat", connections=["entrance"], revealed=False, cleared=False)
    
    floor.rooms["entrance"] = r1
    floor.rooms["r2"] = r2
    floor.move_to("entrance") # Entry
    
    assert r2.revealed is True # R2 revealed because it's connected to current
    
    # Move to r2
    success = floor.move_to("r2")
    assert success is True
    assert floor.current_room_id == "r2"

def test_hero_level_up():
    hero = Hero("Tester", "fighter")
    base_hp = hero.stats["max_hp"]
    base_atk = hero.stats["attack"]
    
    hero.gain_xp(100) # Level 1 -> 2 requires 100
    assert hero.level == 2
    assert hero.stats["max_hp"] > base_hp
    assert hero.stats["attack"] > base_atk
    assert hero.stats["hp"] == hero.stats["max_hp"] # heals on level up

def test_the_room_chest_deposit_withdraw():
    hub = TheRoom()
    item = Item("sword_1", "Sword", "desc", "weapon", "weapon")
    hub.deposit(item)
    
    assert len(hub.chest) == 1
    
    withdrawn = hub.withdraw("sword_1")
    assert withdrawn is item
    assert len(hub.chest) == 0

def test_escape_rope_consumed_on_use():
    hub = TheRoom()
    assert hub.has_escape_rope is True
    
    # Simulation of use handled in REPL logic, but we test the restock logic here
    hub.has_escape_rope = False
    
    success = hub.restock_escape_rope(cost=50, gold=100)
    assert success is True
    assert hub.has_escape_rope is True
    
    # Can't afford
    hub.has_escape_rope = False
    success = hub.restock_escape_rope(cost=50, gold=10)
    assert success is False
    assert hub.has_escape_rope is False

def test_stance_starts_aggressive():
    enemy = Enemy("test_enemy", "Slime", "tactical", {"hp": 10, "attack": 10}, LootTable())
    assert enemy.stance_controller.current.value == "aggressive"

def test_stance_transitions_defensive_at_half_hp():
    enemy = Enemy("test_enemy", "Slime", "tactical", {"max_hp": 10, "hp": 10, "attack": 10}, LootTable())
    
    enemy.stats["hp"] = 5
    changed = enemy.evaluate_stance()
    
    assert changed is True
    assert enemy.stance_controller.current.value == "defensive"

def test_stance_mindless_flees_at_quarter_hp():
    enemy = Enemy("test_enemy", "Slime", "mindless", {"max_hp": 10, "hp": 10, "attack": 10}, LootTable())
    
    enemy.stats["hp"] = 2
    changed = enemy.evaluate_stance()
    
    assert changed is True
    assert enemy.stance_controller.current.value == "fleeing"

def test_stance_tactical_never_flees():
    enemy = Enemy("test_enemy", "Slime", "tactical", {"max_hp": 10, "hp": 10, "attack": 10}, LootTable())
    
    # 1 HP is well below 25%
    enemy.stats["hp"] = 1
    enemy.evaluate_stance()
    
    assert enemy.stance_controller.current.value == "defensive"

def test_stance_modifiers_affect_effective_stat():
    enemy = Enemy("test_enemy", "Slime", "tactical", {"max_hp": 10, "hp": 10, "attack": 10}, LootTable())
    
    # Aggressive attack normally
    assert enemy.get_effective_stat("attack") == 12
    
    # Drop HP to trigger defensive
    enemy.stats["hp"] = 5
    enemy.evaluate_stance()
    
    # Defensive attack
    assert enemy.get_effective_stat("attack") == 8

def test_enemy_stance_evaluation_on_damage():
    enemy = Enemy("test_enemy", "Slime", "tactical", {"max_hp": 10, "hp": 10, "attack": 10}, LootTable())
    
    # Taking damage manually
    enemy.stats["hp"] -= 6
    
    # Should transition to defensive
    changed = enemy.evaluate_stance()
    assert changed is True
    assert enemy.stance_controller.current.value == "defensive"
