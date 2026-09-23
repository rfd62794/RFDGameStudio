import pygame
import math
import random
from typing import List, Optional, Any
from loguru import logger

from src.shared.engine.scene_templates.combat_scene import CombatSceneBase
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.spec import UISpec
from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
from src.shared.combat.d20_resolver import D20Resolver
from src.shared.combat.turn_order import TurnOrderManager
from src.shared.rendering.slime_renderer import render_slime_from_genome, SlimeRenderer
from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed

class DungeonUnit:
    """Wrapper for combatants."""
    def __init__(self, id: str, name: str, stats: dict, side: str, entity: Optional[Any] = None):
        self.id = id
        self.name = name
        self.stats = stats # hp, max_hp, attack, defense, speed, stance
        self.side = side
        self.entity = entity # Original Slime or Hero entity

class DungeonCombatScene(CombatSceneBase):
    def on_combat_enter(self, **kwargs):
        self.session = kwargs.get("session")
        self.roster = kwargs.get("roster")
        self.team = kwargs.get("team")
        
        if not self.session:
            # Fallback for direct testing
            self.session = DungeonSession()
            self.session.start_run()
        
        if not self.roster:
            # Fallback for direct testing
            from src.shared.teams.roster import Roster
            self.roster = Roster()
        
        if not self.team:
            # Fallback for direct testing
            from src.shared.teams.roster import TeamRole
            self.team = self.roster.get_dungeon_team()
            
        self.slime_renderer = SlimeRenderer()
        
        # 1. Setup Units - Use full dungeon team
        self.party = []
        if self.team and self.team.members:
            # Add all team members to party
            for team_member in self.team.members:
                # Get the RosterSlime directly from roster
                slime = self.roster._roster_slimes.get(team_member.slime_id)
                if slime and slime.alive:
                    # Use stat_block if available, fallback to genome
                    if hasattr(slime, 'stat_block') and slime.stat_block:
                        stats = {
                            "hp": slime.stat_block.hp,
                            "max_hp": slime.stat_block.hp,
                            "attack": slime.stat_block.atk,
                            "defense": 2,
                            "speed": slime.stat_block.spd,
                            "stance": "Aggressive"
                        }
                    else:
                        # Fallback to genome stats
                        from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed
                        stats = {
                            "hp": calculate_hp(slime.genome, slime.level),
                            "max_hp": calculate_hp(slime.genome, slime.level),
                            "attack": calculate_attack(slime.genome, slime.level),
                            "defense": 2,
                            "speed": calculate_speed(slime.genome, slime.level),
                            "stance": "Aggressive"
                        }
                    
                    self.party.append(DungeonUnit(f"party_{len(self.party)}", slime.name, stats, "party", slime))
        
        # Fallback to hero if no team members
        if not self.party:
            hero = self.session.hero
            if hasattr(hero, 'stat_block') and hero.stat_block:
                hero_stats = {
                    "hp": hero.stat_block.hp,
                    "max_hp": hero.stat_block.hp,
                    "attack": hero.stat_block.atk,
                    "defense": 2,
                    "speed": hero.stat_block.spd,
                    "stance": "Aggressive"
                }
            elif hasattr(hero, 'genome'):
                # Hero has genome (RosterSlime case)
                from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed
                hero_stats = {
                    "hp": calculate_hp(hero.genome, hero.level),
                    "max_hp": calculate_hp(hero.genome, hero.level),
                    "attack": calculate_attack(hero.genome, hero.level),
                    "defense": 2,
                    "speed": calculate_speed(hero.genome, hero.level),
                    "stance": "Aggressive"
                }
            else:
                # Hero is a basic Hero class with stats dict
                hero_stats = {
                    "hp": hero.stats["hp"],
                    "max_hp": hero.stats["max_hp"],
                    "attack": hero.stats["attack"],
                    "defense": hero.stats["defense"],
                    "speed": hero.stats["speed"],
                    "stance": "Aggressive"
                }
            
            self.party.append(DungeonUnit("hero", hero.name, hero_stats, "party", hero))
        
        # Read squad from session.active_zone
        # Same object that path rendered
        # Guaranteed match
        zone = self.session.active_zone
        self.enemy_squad = zone.squad if zone else None
        
        # Clear existing enemies but maintain list size
        for i in range(5):
            self.enemies[i] = None
        
        if self.enemy_squad and hasattr(self.enemy_squad, 'members'):
            # Debug: Print received squad info
            print(f"[DEBUG] Combat scene - Received squad: {self.enemy_squad.name}")
            for i, member in enumerate(self.enemy_squad.members):
                print(f"[DEBUG]   Member {i}: {member.name}, genome colors: {member.genome.base_color}")
            
            # Use pre-generated squad
            for i, enemy in enumerate(self.enemy_squad.members):
                if i >= 4: break
                stats = {
                    "hp": enemy.current_hp,
                    "max_hp": enemy.max_hp,
                    "attack": enemy.level * 2 + 3,
                    "defense": 2,
                    "speed": enemy.level + 2,
                    "stance": "Aggressive"
                }
                # Mock enemy entity for renderer
                class MockEnemy:
                    def __init__(self, genome, level):
                        self.genome = genome
                        self.level = level
                        class Kinematics:
                            def __init__(self): self.position = pygame.Vector2(0,0)
                        self.kinematics = Kinematics()
                
                mock_enemy = MockEnemy(enemy.genome, enemy.level)
                self.enemies[i] = DungeonUnit(f"enemy_{i}", enemy.name, stats, "enemy", mock_enemy)
        else:
            # Fallback - create random enemies
            for i in range(3):
                from src.shared.genetics import generate_random
                genome = generate_random()
                
                class MockEnemy:
                    def __init__(self, g):
                        self.genome = g
                        self.level = 1
                        class Kinematics:
                            def __init__(self): self.position = pygame.Vector2(0,0)
                        self.kinematics = Kinematics()
                
                mock_enemy = MockEnemy(genome)
                stats = {"hp":20, "max_hp":20, "attack":4, "defense":2, "speed":5, "stance":"Aggressive"}
                self.enemies[i] = DungeonUnit(f"enemy_{i}", f"Wild Slime {i}", stats, "enemy", mock_enemy)
        
        # Load team from session
        self.team = self.session.team
        
        for i, slime in enumerate(self.team):
            if i >= 4: break
            slot_idx = i + 1
            stats = {
                "hp": slime.current_hp,
                "max_hp": slime.max_hp,
                "attack": calculate_attack(slime.genome),
                "defense": 2,
                "speed": calculate_speed(slime.genome),
                "stance": "Aggressive"
            }
            # Mocking slime entity for renderer
            class MockSlime:
                def __init__(self, genome, level):
                    self.genome = genome
                    self.level = level
                    class Kinematics:
                        def __init__(self): self.position = pygame.Vector2(0,0)
                    self.kinematics = Kinematics()
            
            mock_slime = MockSlime(slime.genome, slime.level)
            self.party[slot_idx] = DungeonUnit(f"party_{slot_idx}", slime.name, stats, "party", mock_slime)
        
        # 3. Setup Turn Order
        self.session.turn_manager.reset()
        
        # Add hero to turn order if present
        hero_unit = next((unit for unit in self.party if unit.id == "hero"), None)
        if hero_unit:
            self.session.turn_manager.add_combatant("hero", hero_unit.stats["speed"])
        
        for unit in self.party:
            if unit and unit.id != "hero":
                self.session.turn_manager.add_combatant(unit.id, unit.stats["speed"])
        
        for unit in self.enemies:
            if unit:
                self.session.turn_manager.add_combatant(unit.id, unit.stats["speed"])
        
        self.add_log("Combat started!")
        self._next_turn()

    def _setup_action_buttons(self):
        # Evenly space 4 buttons in bottom bar
        p = self.spec.padding_md
        bw, bh = self.bottom_rect.width, self.bottom_rect.height
        btn_w = (bw - (5 * p)) // 4
        btn_h = bh - 24
        btn_y = self.bottom_rect.y + 12
        
        self.btn_attack = Button("Attack", pygame.Rect(p, btn_y, btn_w, btn_h), self._handle_player_attack, self.spec, variant="primary")
        self.action_panel.add_child(self.btn_attack)
        
        self.btn_ability = Button("Ability", pygame.Rect(2*p + btn_w, btn_y, btn_w, btn_h), lambda: self.add_log("Locked"), self.spec, variant="secondary", enabled=False)
        self.action_panel.add_child(self.btn_ability)
        
        self.btn_item = Button("Item", pygame.Rect(3*p + 2*btn_w, btn_y, btn_w, btn_h), lambda: self.add_log("Empty"), self.spec, variant="secondary", enabled=False)
        self.action_panel.add_child(self.btn_item)
        
        self.btn_flee = Button("Flee", pygame.Rect(4*p + 3*btn_w, btn_y, btn_w, btn_h), self._handle_flee, self.spec, variant="danger")
        self.action_panel.add_child(self.btn_flee)

    def _next_turn(self):
        self.active_actor_id = self.session.turn_manager.next_turn()
        order = self.session.turn_manager.get_order()
        
        def get_name(eid):
            for unit in (self.party + self.enemies):
                if unit and unit.id == eid: return unit.name
            return eid

        if order:
            self.turn_label_active.set_text(f"Turn: {get_name(order[0])}")
            if len(order) > 1:
                self.turn_label_next.set_text(f"Next: {get_name(order[1])}")
        
        can_act = (self.active_actor_id == "hero" or (self.active_actor_id and self.active_actor_id.startswith("party_")))
        self.btn_attack.enabled = can_act
        self.btn_flee.enabled = can_act
        
        if self.active_actor_id and self.active_actor_id.startswith("enemy_"):
            self._enemy_turn()

    def handle_event(self, event: pygame.event.Event) -> None:
        super().handle_event(event) # Handle action buttons
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = pygame.mouse.get_pos()
            # Check for clicking on enemy/party slots to set target
            slot_h = (self.party_rect.height // 5) - self.spec.margin_sm
            
            # Party slots (LHS)
            for i in range(5):
                slot_rect = pygame.Rect(self.party_rect.x, self.party_rect.y + i*(slot_h + self.spec.margin_sm), self.party_rect.width, slot_h)
                if slot_rect.collidepoint(mouse_pos):
                    if self.party[i]: 
                        self.target_actor_id = self.party[i].id
                        self.add_log(f"Targeting {self.party[i].name}")
                        return
                    
            # Enemy slots (RHS)
            for i in range(5):
                slot_rect = pygame.Rect(self.enemy_rect.x, self.enemy_rect.y + i*(slot_h + self.spec.margin_sm), self.enemy_rect.width, slot_h)
                if slot_rect.collidepoint(mouse_pos):
                    if self.enemies[i]:
                        self.target_actor_id = self.enemies[i].id
                        self.add_log(f"Targeting {self.enemies[i].name}")
                        return

    def _draw_unit_slot(self, surface: pygame.Surface, x: int, y: int, w: int, h: int, entity: Optional[DungeonUnit], side: str):
        super()._draw_unit_slot(surface, x, y, w, h, entity, side)
        
        if entity and entity.entity:
            if hasattr(entity.entity, "genome"):
                # Use shared renderer
                render_slime_from_genome(
                    surface, entity.entity.genome,
                    x + w // 2, y + h // 3 + 4,
                    radius=20
                )
            elif hasattr(entity.entity, "kinematics"):
                old_pos = entity.entity.kinematics.position.copy()
                entity.entity.kinematics.position.x = x + w // 2
                entity.entity.kinematics.position.y = y + h // 3 + 4
                self.slime_renderer.render(surface, entity.entity)
                entity.entity.kinematics.position = old_pos

    def _handle_player_attack(self):
        attacker = next((u for u in self.party if u and u.id == self.active_actor_id), None)
        if not attacker: return

        # Use explicitly selected target or fallback to first alive enemy
        target = None
        if self.target_actor_id:
            target = next((e for e in self.enemies if e and e.id == self.target_actor_id and e.stats["hp"] > 0), None)
            
        if not target:
            target = next((e for e in self.enemies if e and e.stats["hp"] > 0), None)
            
        if not target: return
        
        self.target_actor_id = target.id # Stick to chosen target
        atk_mod = attacker.stats["attack"]
        resolver = D20Resolver()
        roll_res = resolver.ability_check(modifier=atk_mod, difficulty_class=10 + target.stats["defense"])
        
        if roll_res.success:
            damage = atk_mod + 2
            target.stats["hp"] -= damage
            self.add_log(f"{attacker.name} HITS for {damage}!")
            self.trigger_flash((255, 100, 100))
        else:
            self.add_log(f"{attacker.name} MISSES!")
            self.trigger_flash((255, 255, 255))
            
        if target.stats["hp"] <= 0:
            target.stats["hp"] = 0
            # Check if all enemies defeated
            if all(not e or e.stats["hp"] <= 0 for e in self.enemies):
                self._handle_victory()
            else:
                self.add_log(f"{target.name} defeated!")
                self._next_turn()
        else:
            self._next_turn()

    def _enemy_turn(self):
        attacker = next((u for u in self.enemies if u and u.id == self.active_actor_id), None)
        if not attacker: 
            self._next_turn()
            return

        valid_targets = [u for u in self.party if u and u.stats["hp"] > 0]
        if not valid_targets: return
        
        hero_unit = next((u for u in valid_targets if u.id == "hero"), None)
        target = hero_unit if hero_unit else random.choice(valid_targets)
        
        resolver = D20Resolver()
        roll_res = resolver.ability_check(modifier=3, difficulty_class=10 + target.stats["defense"])
        
        if roll_res.success:
            damage = attacker.stats["attack"] + 1
            target.stats["hp"] -= damage
            self.add_log(f"{attacker.name} HITS {target.name} for {damage}!")
            self.trigger_flash((200, 0, 0))
        else:
            self.add_log("Slime MISSES!")
            self.trigger_flash((200, 200, 200))
            
        if target.id == "hero" and target.stats["hp"] <= 0:
            target.stats["hp"] = 0
            self._handle_defeat()
        elif target.stats["hp"] <= 0:
            target.stats["hp"] = 0
            self.add_log(f"{target.name} has fallen!")
            rs = next((s for s in self.session.party_slimes if s.name == target.name), None)
            if rs: rs.alive = False
            self._next_turn()
        else:
            self._next_turn()

    def _handle_victory(self):
        self.add_log("Victory!")
        self._sync_back_hp()
        if self.session:
            self.session.last_combat_result = "victory"
        # Return to active path with combat result
        self.context.manager.back(combat_result="victory")

    def _handle_defeat(self):
        self.add_log("Hero has fallen...")
        if self.session:
            self.session.end_run(cause="Killed in combat")
            self.session.last_combat_result = "defeat"
        # Return to active path with combat result
        self.context.manager.back(combat_result="defeat")

    def _handle_flee(self):
        self.add_log("Fleeing...")
        self._sync_back_hp()
        if self.session:
            self.session.last_combat_result = "flee"
        self.context.manager.back(combat_result="flee")

    def _sync_back_hp(self):
        """Copies combat HP back to roster slimes."""
        for unit in self.party:
            if unit and unit.id.startswith("party_"):
                # Find matching team member by name
                rs = next((s for s in self.team.members if s.name == unit.name), None)
                if rs:
                    slime = self.roster._roster_slimes.get(rs.slime_id)
                    if slime:
                        slime.current_hp = float(unit.stats["hp"])
                        if slime.current_hp <= 0:
                            slime.alive = False
                        # Update roster entry too
                        roster_entry = self.roster.get_entry(rs.slime_id)
                        if roster_entry:
                            roster_entry.alive = False
