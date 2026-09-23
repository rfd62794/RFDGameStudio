import math
import enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set

import pygame
from loguru import logger

from src.shared.engine.scene_manager import Scene
from src.shared.world.faction import FactionManager
from src.apps.slime_clan.factions import get_slime_factions
from src.apps.slime_clan.colony import Colony, ColonyManager
from src.apps.slime_clan.constants import *
from src.apps.slime_clan.ui.overworld_ui import (
    draw_overworld_hud, render_overworld_map, draw_end_day_button,
    draw_interaction_panel, render_defection_moment, draw_game_over_overlay,
    draw_launch_banner, draw_node_labels
)

@dataclass
class MapNode:
    id: str
    name: str
    x: int
    y: int
    coord: tuple[int, int]
    node_type: NodeType
    connections: List[str] = field(default_factory=list)

class OverworldScene(Scene):
    """Strategic node map. Click RED/CONTESTED nodes to launch battles."""

    def on_enter(self, **kwargs) -> None:
        self.colony_manager = kwargs.get("colony_manager")
        if self.colony_manager is None:
            self.colony_manager = ColonyManager(NodeType)
            # Create default colonies
            self.colony_manager.create_colony("home", "Crash Site", 100, 240, (0, 2), NodeType.SHIP_PARTS, ["node_1"], faction="CLAN_BLUE")
            self.colony_manager.create_colony("node_1", "Scrap Yard", 250, 150, (1, 2), NodeType.RESOURCE, ["home", "node_2", "node_3"])
            self.colony_manager.create_colony("node_2", "Northern Wastes", 400, 100, (2, 1), NodeType.STRONGHOLD, ["node_1", "ashfen", "node_4"])
            self.colony_manager.create_colony("node_3", "Eastern Front", 400, 300, (2, 3), NodeType.RECRUITMENT, ["node_1", "rootward", "node_4"])
            self.colony_manager.create_colony("node_4", "Deep Red Core", 550, 200, (3, 2), NodeType.RESOURCE, ["node_2", "node_3"])
            self.colony_manager.create_colony("ashfen", "The Ashfen Tribe", 325, 100, (1, 1), NodeType.RECRUITMENT, ["node_2"], faction="CLAN_YELLOW")
            self.colony_manager.create_colony("rootward", "The Rootward Tribe", 325, 300, (1, 3), NodeType.RECRUITMENT, ["node_3"], faction="CLAN_YELLOW")
        
        self.nodes = self.colony_manager 

        self.day = kwargs.get("day", 1)
        self.actions_remaining = kwargs.get("actions_remaining", 3)
        self.actions_per_day = 3
        self.resources = kwargs.get("resources", 0)
        self.ship_parts = kwargs.get("ship_parts", 0)
        self.secured_part_nodes = set(kwargs.get("secured_part_nodes", []))
        self.stronghold_bonus = kwargs.get("stronghold_bonus", False)
        self.player_units = kwargs.get("player_units", [])

        self.defection_queue = []
        self.current_defection = None
        self.defection_timer = 0.0
        
        self.tribe_state = kwargs.get("tribe_state", {
            "ashfen": {"approaches": 0, "dispersed": False},
            "rootward": {"approaches": 0, "dispersed": False}
        })
        self.selected_unbound_node: Optional[Any] = None

        self.faction_manager = kwargs.get("faction_manager")
        if self.faction_manager is None:
            factions = get_slime_factions()
            self.faction_manager = FactionManager()
            for f in factions:
                self.faction_manager.register_faction(f)
            for colony in self.colony_manager.values():
                if colony.faction:
                    self.faction_manager.claim_territory(colony.faction, colony.coord, 1.0, 0)
            self.faction_manager.claim_territory("CLAN_RED", (3, 2), 1.0, 0)
            self.faction_manager.claim_territory("CLAN_RED", (2, 3), 0.8, 0)
            self.faction_manager.claim_territory("CLAN_BLUE", (1, 2), 0.8, 0)

        self.connection_graph = {}
        for node in self.colony_manager.values():
            self.connection_graph[node.coord] = [self.colony_manager[conn_id].coord for conn_id in node.connections]

        battle_node_id = kwargs.get("battle_node_id")
        battle_won = kwargs.get("battle_won")
        if battle_node_id and battle_node_id in self.colony_manager:
            node = self.colony_manager[battle_node_id]
            if battle_won:
                logger.info(f"🏆 Blue secured {node.name}!")
                self.faction_manager.claim_territory("CLAN_BLUE", node.coord, 1.0, 0)
                blue_lost = kwargs.get("blue_lost", False)
                if not blue_lost:
                    best_col = None
                    min_dist = 999
                    for col in self.colony_manager.values():
                        if col.faction is None and col.id != node.id:
                            d = abs(col.x - node.x) + abs(col.y - node.y)
                            if d < min_dist:
                                min_dist = d
                                best_col = col
                    if best_col:
                        for u in best_col.units:
                            self.colony_manager.modify_sympathy(u, 3, "flawless victory", best_col)
                for conn_id in node.connections:
                    neighbor = self.colony_manager.get_colony(conn_id)
                    if neighbor and neighbor.faction == "CLAN_YELLOW":
                        for u in neighbor.units:
                            self.colony_manager.modify_sympathy(u, 5, "protecting neighbors", neighbor)
                if node.node_type == NodeType.SHIP_PARTS and node.id not in self.secured_part_nodes:
                    self.ship_parts += 2
                    self.secured_part_nodes.add(node.id)
            else:
                logger.info(f"💀 Red held {node.name}.")
                self.faction_manager.claim_territory("CLAN_RED", node.coord, 1.0, 0)
                best_col = None
                min_dist = 999
                for col in self.colony_manager.values():
                    if col.faction == "CLAN_RED" and col.id != node.id:
                        d = abs(col.x - node.x) + abs(col.y - node.y)
                        if d < min_dist:
                            min_dist = d
                            best_col = col
                if best_col:
                    for u in best_col.units:
                        self.colony_manager.modify_sympathy(u, -3, "player retreat", best_col)

        self.game_over = kwargs.get("game_over", None)
        self.font = pygame.font.Font(None, 24)

    def on_exit(self) -> None:
        pass

    def handle_events(self, events: list[pygame.event.Event]) -> None:
        for event in events:
            if event.type == pygame.QUIT:
                self.request_quit()
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                self.request_quit()
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if self.selected_unbound_node:
                    if self._check_interaction_click(event.pos):
                        return
                    else:
                        self.selected_unbound_node = None
                if self.ship_parts >= 5 and not self.game_over:
                    self.game_over = "SURVIVOR"
                    return
                if self._check_end_day_click(event.pos):
                    return
                self._handle_click(event.pos)

    def _check_end_day_click(self, pos: tuple[int, int]) -> bool:
        bx, by, bw, bh = WINDOW_WIDTH - 140, WINDOW_HEIGHT - 60, 120, 40
        if bx <= pos[0] <= bx + bw and by <= pos[1] <= by + bh:
            self._end_day()
            return True
        return False

    def _end_day(self) -> None:
        self.faction_manager.simulate_step(self.day, connection_graph=self.connection_graph)
        for tid in ["ashfen", "rootward"]:
            # Handle Dispersed legacy check just in case, though we are removing it mostly
            if self.tribe_state[tid].get("dispersed", False): continue
            
            node = self.nodes[tid]
            colony = self.colony_manager.get_colony(tid)
            if not colony: continue
            
            # Check for Re-Emergence or Decay if already hidden
            if colony.hidden:
                colony.hidden_turns += 1
                
                # Check for adjacent player nodes to emerge
                player_adj = False
                for conn_id in node.connections:
                    if self.faction_manager.get_owner(self.nodes[conn_id].coord) == "CLAN_BLUE":
                        player_adj = True
                        break
                        
                if player_adj:
                    colony.hidden = False
                    colony.hidden_turns = 0
                    logger.info(f"The {colony.name} returns to their camp. They remember you.")
                    for u in colony.units:
                        self.colony_manager.modify_sympathy(u, 5, "the astronaut freed their lands", colony)
                elif colony.hidden_turns > 10:
                    # Decay sympathy over prolonged hiding
                    for u in colony.units:
                        self.colony_manager.modify_sympathy(u, -2, "prolonged isolation", colony)
            
            # Check for Hiding if not hidden
            else:
                hostile_adj = 0
                total_adj = len(node.connections)
                for conn_id in node.connections:
                    conn_node = self.nodes[conn_id]
                    owner = self.faction_manager.get_owner(conn_node.coord)
                    if owner in ["CLAN_RED", "CLAN_BLUE"]:
                        hostile_adj += 1
                        
                if hostile_adj >= total_adj:
                    colony.hidden = True
                    logger.info(f"The {colony.name} has gone into hiding. The war has come too close.")
        bonus = 0
        for node in self.nodes.values():
            if self.faction_manager.get_owner(node.coord) == "CLAN_BLUE":
                if node.node_type == NodeType.RESOURCE:
                    bonus += 1
        if bonus > 0:
            self.resources += bonus
        self.day += 1
        self.actions_remaining = self.actions_per_day
        self.colony_manager.apply_passive_decay(self.day)
        self.defection_queue = self.colony_manager.check_defections()
        if self.defection_queue:
            self._process_next_defection()

    def _process_next_defection(self):
        if self.defection_queue:
            self.current_defection = self.defection_queue.pop(0)
            self.defection_timer = 2000.0
            self.player_units.append(self.current_defection["unit"])

    def _handle_click(self, pos: tuple[int, int]) -> None:
        mx, my = pos
        for node in self.nodes.values():
            dist = math.hypot(mx - node.x, my - node.y)
            if dist <= NODE_RADIUS:
                owner = self.faction_manager.get_owner(node.coord)
                if self.actions_remaining <= 0:
                    return
                if owner == "CLAN_RED" or (not owner and node.id != "home"):
                    for conn_id in node.connections:
                        neighbor = self.colony_manager.get_colony(conn_id)
                        if neighbor and neighbor.faction is None:
                            for u in neighbor.units:
                                self.colony_manager.modify_sympathy(u, -10, "collateral fear", neighbor)
                    self.actions_remaining -= 1
                    stronghold_bonus = (node.node_type == NodeType.STRONGHOLD)
                    from src.apps.slime_clan.scenes.battle_field_scene import BattleFieldScene
                    kwargs = self.context.resources.copy()
                    kwargs.update({
                        "region": node.name,
                        "difficulty": "NORMAL",
                        "node_id": node.id,
                        "nodes": self.nodes,
                        "colony_manager": self.colony_manager,
                        "faction_manager": self.faction_manager,
                        "day": self.day,
                        "actions_remaining": self.actions_remaining,
                        "resources": self.resources,
                        "ship_parts": self.ship_parts,
                        "secured_part_nodes": list(self.secured_part_nodes),
                        "stronghold_bonus": stronghold_bonus,
                        "tribe_state": self.tribe_state,
                        "player_units": self.player_units
                    })
                    self.context.manager.switch_to(BattleFieldScene(**kwargs))
                elif owner == "CLAN_YELLOW":
                    if not self.tribe_state.get(node.id, {}).get("dispersed", False):
                        self.selected_unbound_node = node
                return

    def _check_interaction_click(self, pos: tuple[int, int]) -> bool:
        mx, my = pos
        pw, ph = 300, 180
        px, py = (WINDOW_WIDTH - pw) // 2, (WINDOW_HEIGHT - ph) // 2
        nid = self.selected_unbound_node.id
        approaches = self.tribe_state[nid]["approaches"]
        colony = self.colony_manager.get_colony(nid)
        
        btns = []
        if colony and colony.hidden:
            btns = [("Offer Scrap", (px + 90, py + 110, 120, 30))]
        else:
            btns = [("Observe", (px + 20, py + 110, 120, 30)), ("Approach", (px + 160, py + 110, 120, 30)), ("Offer Scrap", (px + 20, py + 145, 120, 30))]
            if approaches >= 3 and colony and colony.units:
                btns.append(("Recruit...", (px + 160, py + 145, 120, 30)))
                
        for label, rect in btns:
            r = pygame.Rect(rect)
            if r.collidepoint(mx, my):
                if label == "Offer Scrap":
                    if self.actions_remaining > 0 and self.resources >= 2:
                        self.actions_remaining -= 1
                        self.resources -= 2
                        if colony:
                            colony.last_action_day = self.day
                            for u in colony.units:
                                self.colony_manager.modify_sympathy(u, 10, "gift of scrap", colony)
                        self.selected_unbound_node = None
                        return True
                    return True
                if self.actions_remaining <= 0 and label not in ["Wait", "Recruit..."]:
                    return True
                if label == "Observe":
                    self.actions_remaining -= 1
                elif label == "Approach":
                    self.actions_remaining -= 1
                    self.tribe_state[nid]["approaches"] += 1
                    if colony:
                        for u in colony.units:
                            self.colony_manager.modify_sympathy(u, 5, "direct approach", colony)
                elif label == "Recruit...":
                    if colony and colony.units:
                        selected_unit = max(colony.units, key=lambda u: getattr(u, "sympathy", 0))
                        colony.units.remove(selected_unit)
                        self.player_units.append(selected_unit)
                self.selected_unbound_node = None
                return True
        return False

    def handle_event(self, event: pygame.event.Event) -> None:
        pass  # stub — scene not yet active

    def tick(self, dt_ms: float) -> None:
        if self.current_defection:
            self.defection_timer -= dt_ms
            if self.defection_timer <= 0:
                self.current_defection = None
                self._process_next_defection()
            return

        if self.game_over: return
        red_count = sum(1 for n in self.nodes.values() if n.id != "home" and self.faction_manager.get_owner(n.coord) == "CLAN_RED")
        blue_count = sum(1 for n in self.nodes.values() if n.id != "home" and self.faction_manager.get_owner(n.coord) == "CLAN_BLUE")
        if blue_count >= 4: self.game_over = "WIN"
        elif red_count >= 3: self.game_over = "LOSS"

    def render(self, surface: pygame.Surface) -> None:
        render_overworld_map(surface, self.font, self.colony_manager.colonies, self.faction_manager, self.actions_remaining, self.tribe_state)
        
        # Rendering labels
        for node in self.colony_manager.values():
            owner = self.faction_manager.get_owner(node.coord)
            type_label = NODE_TYPE_LABELS[node.node_type]
            type_color = (120, 120, 120)
            
            if node.hidden:
                type_label = "They have gone into hiding."
                type_color = (150, 150, 100)
            elif node.node_type == NodeType.RECRUITMENT and owner == "CLAN_BLUE":
                type_label = "Unbound tribe nearby"
                type_color = (100, 200, 100)
            elif owner == "CLAN_YELLOW":
                nid = node.id
                approaches = self.tribe_state.get(nid, {}).get("approaches", 0)
                if approaches >= 3:
                    type_label = "The tribe is considering you. Return tomorrow."
                    type_color = (255, 255, 150)
                else:
                    type_label = "They watch you from the treeline."
                    type_color = (200, 200, 100)
                    
            draw_node_labels(surface, self.font, node, type_label, type_color)

        draw_overworld_hud(surface, self.font, self.day, self.actions_remaining, self.actions_per_day, self.resources, self.ship_parts, len(self.player_units))
        draw_end_day_button(surface, self.font)
        
        if self.ship_parts >= 5 and not self.game_over:
            draw_launch_banner(surface, self.font)
            
        if self.game_over:
            draw_game_over_overlay(surface, self.font, self.game_over)
            
        if self.selected_unbound_node:
            nid = self.selected_unbound_node.id
            approaches = self.tribe_state[nid]["approaches"]
            colony = self.colony_manager.get_colony(nid)
            pw, ph = 300, 180
            px, py = (WINDOW_WIDTH - pw) // 2, (WINDOW_HEIGHT - ph) // 2
            
            btns = []
            if colony and colony.hidden:
                btns = [("Offer Scrap", (px + 90, py + 110, 120, 30))]
                draw_interaction_panel(surface, self.font, "Abandoned Camp", approaches, btns, is_hidden=True)
            else:
                btns = [
                    ("Observe", (px + 20, py + 110, 120, 30)),
                    ("Approach", (px + 160, py + 110, 120, 30)),
                    ("Offer Scrap", (px + 20, py + 145, 120, 30))
                ]
                if approaches >= 3 and colony and colony.units:
                    btns.append(("Recruit...", (px + 160, py + 145, 120, 30)))
                draw_interaction_panel(surface, self.font, self.selected_unbound_node.name, approaches, btns)
            
        if self.current_defection:
            render_defection_moment(surface, self.font, self.current_defection["unit"].name, self.current_defection["from_colony"])
