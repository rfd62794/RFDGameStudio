import cmd
import os
import json
import logging
import random
import argparse
import sys
from pathlib import Path

from apps.dungeon_crawler.world.room_generator import RoomGenerator
from apps.dungeon_crawler.world.floor import Floor
from apps.dungeon_crawler.hub.the_room import TheRoom
from apps.dungeon_crawler.entities.hero import Hero
from apps.dungeon_crawler.entities.enemy import Enemy
from shared.items.item import Item
from shared.items.loot_table import LootTable
from shared.combat.turn_order import TurnOrderManager
from shared.combat.d20_resolver import D20Resolver

from shared.engine.scene_manager import SceneManager
from apps.dungeon_crawler.ui.dungeon_session import DungeonSession
from apps.dungeon_crawler.ui.scene_the_room import TheRoomScene

logging.basicConfig(level=logging.ERROR) # Suppress normal engine logs in REPL

class DungeonCrawlerREPL(cmd.Cmd):
    intro = "Welcome to the Dungeon Crawler REPL.\nType 'help' or '?' to list commands.\n"
    prompt = "\n(Crawler) "
    
    def __init__(self):
        super().__init__()
        self.state = "HUB" # HUB, CRAWLING, COMBAT, LOOTING
        self.hub = TheRoom()
        self.hero = Hero("Wanderer", "fighter") # Default for demo
        self.floor: Floor | None = None
        self.room_generator = RoomGenerator()
        self.turn_manager = TurnOrderManager()
        self.resolver = D20Resolver()
        self.enemies_db: dict[str, dict] = {}
        
        # Current encouter state
        self.current_enemies: list[Enemy] = []
        self.current_loot: list[Item] = []
        
        self.load_enemy_db()
        self.enter_hub()

    def load_enemy_db(self):
        path = Path("assets/demos/dungeon_crawler/enemies.json")
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for enemy_data in data.get("enemies", []):
                    self.enemies_db[enemy_data["id"]] = enemy_data

    # --- State Transitions ---

    def enter_hub(self):
        self.state = "HUB"
        self.floor = None
        self.prompt = "\n(HUB) "
        print("\n" + "="*40)
        print(self.hub.flavor_text)
        print("="*40)
        
    def start_crawl(self, depth: int = 1):
        self.state = "CRAWLING"
        self.floor = self.room_generator.generate(depth)
        self.prompt = f"\n(FLOOR {self.floor.depth}) "
        print(f"\n--- Descending to Floor {depth} ---")
        self.look_around()

    def enter_combat(self):
        self.state = "COMBAT"
        room = self.floor.get_current_room()
        self.prompt = f"\n(COMBAT - {room.id}) "
        print(f"\n⚔️ AMBUSH in {room.id} ⚔️")
        
        # Spawn 1-2 random enemies
        if not self.enemies_db:
            print("No enemies found in DB! Skipping combat...")
            room.clear()
            self.state = "CRAWLING"
            self.prompt = f"\n(FLOOR {self.floor.depth}) "
            return
            
        spawn_count = random.randint(1, 2)
        self.current_enemies.clear()
        
        for i in range(spawn_count):
            enemy_template = random.choice(list(self.enemies_db.values()))
            
            # Build basic loot table from weights
            lt = LootTable()
            weights = enemy_template.get("loot_weight", {})
            if weights.get("gold", 0) > 0:
                gold_bag = Item(id="gold_bag", name="Bag of Gold", description="Shiny coins", item_type="consumable", slot="none", value=random.randint(5, 15)*self.floor.depth)
                lt.add_entry(gold_bag, weights["gold"])
            if weights.get("item", 0) > 0: # Mock generic item
                sword = Item(id=f"sword_{i}", name="Rusty Sword", description="A poor weapon", item_type="weapon", slot="weapon", stat_modifiers={"attack": 2}, value=5, identified=False)
                lt.add_entry(sword, weights["item"])
                
            enemy = Enemy(
                id_str=f"{enemy_template['id']}_{i}",
                name=enemy_template['name'],
                tier=enemy_template['tier'],
                stats=enemy_template['stats'],
                loot_table=lt
            )
            self.current_enemies.append(enemy)
            print(f"A {enemy.name} appears!")

        # Setup turn order
        self.turn_manager.reset()
        self.turn_manager.add_combatant(self.hero.name, self.hero.effective_stat("speed"))
        for enemy in self.current_enemies:
            self.turn_manager.add_combatant(enemy.id, enemy.stats.get("speed", 0))

    def enter_looting(self):
        self.state = "LOOTING"
        self.prompt = "\n(LOOTING) "
        print("\n--- COMBAT WON ---")
        self.floor.get_current_room().clear()
        
        # Gather loot
        self.current_loot.clear()
        for enemy in self.current_enemies:
            loot = enemy.get_loot(depth=self.floor.depth)
            if loot:
                self.current_loot.append(loot)
                
        if not self.current_loot:
            print("The enemies carried nothing.")
            self.end_looting()
        else:
            print("Loot dropped:")
            for i, item in enumerate(self.current_loot):
                print(f"  [{i}] {item.display_name}")
            print("Type 'take <id>' or 'leave'")

    def end_looting(self):
        self.current_loot.clear()
        self.current_enemies.clear()
        self.state = "CRAWLING"
        self.prompt = f"\n(FLOOR {self.floor.depth}) "
        print("Returning to exploration...")
        self.look_around()

    def die(self):
        print("\n💀 YOU DIED 💀")
        print("You are dragged back to The Room by an unknown force.")
        print("You lost all unbanked loot and gold in your backpack.")
        self.hero.stats["hp"] = self.hero.stats["max_hp"] # Revive
        self.hero.inventory.backpack.clear() # Lose unbanked loot
        self.hero.inventory.gold = 0 # Lose current run gold
        self.enter_hub()


    # --- General Commands ---

    def do_status(self, arg):
        """Show hero stats."""
        h = self.hero
        print(f"\n{h.name} - Level {h.level} {h.class_type.capitalize()}")
        print(f"HP: {h.stats.get('hp')}/{h.stats.get('max_hp')} | MP: {h.stats.get('mp')}/{h.stats.get('max_mp')}")
        print(f"ATK: {h.effective_stat('attack')} | DEF: {h.effective_stat('defense')} | SPD: {h.effective_stat('speed')} | MAG: {h.effective_stat('magic')}")
        print(f"XP: {h.xp}/{h.level*100} | Gold: {h.inventory.get_gold()}")

    def do_inventory(self, arg):
        """Show equipped items and backpack."""
        inv = self.hero.inventory
        print("\n--- Equipped ---")
        for slot, item in inv.slots.items():
            name = item.display_name if item else "Empty"
            print(f"  {slot.capitalize()}: {name}")
            
        print(f"\n--- Backpack ({len(inv.backpack)}/{inv.capacity}) ---")
        for i, item in enumerate(inv.backpack):
            print(f"  [{i}] {item.display_name}")

    def do_quit(self, arg):
        """Exit the game."""
        print("Leaving the dungeon...")
        return True

    # --- HUB Commands ---

    def do_descend(self, arg):
        """HUB: Descend into the dungeon."""
        if self.state != "HUB":
            print("You can only descend from The Room.")
            return
        
        depth = 1
        if arg.isdigit():
            depth = int(arg)
        self.start_crawl(depth)

    def do_chest(self, arg):
        """HUB: View chest contents."""
        if self.state != "HUB":
            print("The chest is in The Room.")
            return
            
        print(f"\n--- Chest ({len(self.hub.chest)} items) ---")
        for i, item in enumerate(self.hub.chest):
            print(f"  [{i}] {item.display_name}")

    # --- CRAWLING Commands ---

    def do_look(self, arg):
        """CRAWLING: Look around current room."""
        if self.state != "CRAWLING":
            print("Not applicable right now.")
            return
        self.look_around()

    def look_around(self):
        room = self.floor.get_current_room()
        print(f"\nYou are in: {room.id} ({room.room_type.upper()})")
        if room.room_type == "combat" and not room.cleared:
            print("The room feels hostile. Type 'fight' to engage!")
        elif room.room_type == "boss" and not room.cleared:
            print("A massive presence looms. Type 'fight' to engage!")
        elif room.room_type == "boss" and room.cleared:
            print("The boss is dead. Type 'ascend' to return to The Room safely.")
        else:
            print("The room is clear.")
            
        print("Connected rooms:")
        for conn_id in room.connections:
            r = self.floor.rooms[conn_id]
            status = " (Cleared)" if r.cleared else ""
            print(f"  -> {conn_id} [{r.room_type.upper()}]{status}")

    def do_move(self, arg):
        """CRAWLING: Move to connected room (e.g. 'move room_1')."""
        if self.state != "CRAWLING":
            print("Cannot move right now.")
            return
            
        room = self.floor.get_current_room()
        if not room.cleared and room.room_type in ("combat", "boss"):
            print("You must clear the room before leaving!")
            return
            
        if not arg:
            print("Move where?")
            return
            
        if self.floor.move_to(arg):
            self.look_around()
        else:
            print("Cannot move there.")

    def do_fight(self, arg):
        """CRAWLING: Engage enemies in hostile rooms."""
        if self.state != "CRAWLING":
            print("Not exploring.")
            return
            
        room = self.floor.get_current_room()
        if room.cleared or room.room_type not in ("combat", "boss"):
            print("Nothing to fight here.")
            return
            
        self.enter_combat()

    def do_escape(self, arg):
        """CRAWLING: Use escape rope."""
        if self.state != "CRAWLING":
            print("Can only escape from dungeon exploration.")
            return
            
        if self.hub.has_escape_rope:
            print("\nYou hurl the Escape Rope. It latches onto darkness and pulls you up!")
            self.hub.has_escape_rope = False
            self.hero.inventory.backpack.clear() # Lose unbanked loot
            self.hero.inventory.gold = 0 # Lose run gold
            print("You lost all unbanked items and gold, but safely returned.")
            self.enter_hub()
        else:
            print("You don't have an Escape Rope!")

    def do_ascend(self, arg):
        """CRAWLING: Extract at boss room to keep loot."""
        if self.state != "CRAWLING":
            print("Not applicable.")
            return
            
        room = self.floor.get_current_room()
        if room.room_type == "boss" and room.cleared:
            print("\nYou ascend the stairs in triumph.")
            # Bank gold (in this basic version we implicitly keep the gold as we don't zero it)
            # We also keep backpack. Realistically we'd move backpack to chest, but keeping on person is fine for phase 1
            print("You securely return to The Room with your loot intact.")
            self.enter_hub()
        else:
            print("You can only ascend from a cleared boss room.")

    # --- COMBAT Commands ---

    def do_attack(self, arg):
        """COMBAT: Attack target (e.g. 'attack slime_0'). If no target, auto-targets first enemy."""
        if self.state != "COMBAT":
            print("You are not in combat.")
            return

        active_id = self.turn_manager.next_turn()
        if not active_id:
            print("No one acts.")
            return
            
        if active_id != self.hero.name:
            print(f"\n{active_id} goes first! (Enemies don't attack in Phase 1 stub)")
            # Cycle through enemies until Hero's turn
            while active_id != self.hero.name:
                active_id = self.turn_manager.next_turn()
            print("Now it's your turn.")

        if not self.current_enemies:
            print("No enemies left.")
            self.enter_looting()
            return
            
        target = self.current_enemies[0]
        if arg:
            found = [e for e in self.current_enemies if e.id == arg]
            if found:
                target = found[0]

        # Simple D20 Resolution
        roll = self.resolver.roll_standard()
        atk = self.hero.effective_stat("attack")
        defense = target.stats.get("defense", 0)
        
        result = self.resolver.resolve_attack(roll, atk, defense)
        print(f"\nYou attack {target.name} [Roll: {roll} + {atk} ATK vs {defense} DEF]")
        
        if result.is_hit:
            dmg = max(1, atk) # Stub damage calc
            if result.is_critical:
                dmg *= 2
                print("CRITICAL HIT!")
            target.stats["hp"] -= dmg
            print(f"Dealt {dmg} damage. ({target.stats['hp']} HP remaining)")
            
            if not target.is_alive():
                print(f"{target.name} dies!")
                self.turn_manager.remove_combatant(target.id)
                self.current_enemies.remove(target)
                
                # Check for encounter end
                if not self.current_enemies:
                    self.enter_looting()
        else:
            print("Miss!")

    # --- LOOTING Commands ---

    def do_take(self, arg):
        """LOOTING: Take loot by index (e.g. 'take 0' or 'take all')."""
        if self.state != "LOOTING":
            print("Not looting.")
            return
            
        if arg == "all":
            for item in self.current_loot[:]:
                if item.id == "gold_bag":
                    self.hero.inventory.add_gold(item.value)
                    self.current_loot.remove(item)
                    print(f"Took {item.value} gold.")
                elif self.hero.inventory.add_to_backpack(item):
                    self.current_loot.remove(item)
                    print(f"Took {item.display_name}.")
                else:
                    print(f"Backpack full! Left {item.display_name}.")
            if not self.current_loot:
                self.end_looting()
            return

        if not arg.isdigit() or int(arg) >= len(self.current_loot):
            print("Invalid index.")
            return
            
        idx = int(arg)
        item = self.current_loot[idx]
        if item.id == "gold_bag":
            self.hero.inventory.add_gold(item.value)
            self.current_loot.pop(idx)
            print(f"Took {item.value} gold.")
        elif self.hero.inventory.add_to_backpack(item):
            self.current_loot.pop(idx)
            print(f"Took {item.display_name}.")
        else:
            print("Backpack full!")

        if not self.current_loot:
            self.end_looting()

    def do_leave(self, arg):
        """LOOTING: Leave remaining items and finish looting."""
        if self.state != "LOOTING":
            print("Not looting.")
            return
        self.end_looting()

def main(args=None):
    parser = argparse.ArgumentParser(description="rpgCore — Dungeon Crawler")
    parser.add_argument("--terminal", action="store_true", help="Launch in terminal REPL mode")
    # Use parse_known_args to avoid crashing on launcher arguments like --run
    parsed_args, _ = parser.parse_known_args(args)

    if parsed_args.terminal:
        DungeonCrawlerREPL().cmdloop()
    else:
        # Launch Pygame UI
        session = DungeonSession()
        
        # Get the roster and team from the session
        from shared.teams.roster import TeamRole
        roster = session.roster
        team = roster.get_dungeon_team()
        
        # Local imports to avoid circular deps if they occur
        from apps.dungeon_crawler.ui.scene_dungeon_room import DungeonRoomScene
        from apps.dungeon_crawler.ui.scene_inventory import InventoryOverlay
        from apps.dungeon_crawler.ui.scene_dungeon_combat import DungeonCombatScene

        manager = SceneManager(width=800, height=600, title="rpgCore — Dungeon Crawler")
        manager.register("the_room", TheRoomScene)
        manager.register("dungeon_room", DungeonRoomScene)
        manager.register("inventory", InventoryOverlay)
        manager.register("dungeon_combat", DungeonCombatScene)
        
        manager.run("the_room", session=session, roster=roster, team=team)

if __name__ == "__main__":
    main()
