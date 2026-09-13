"""
Faction System - territorial simulation and causality.
Ported and decoupled from dgt_engine for shared use.
"""

import sqlite3
import random
import json
import os
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
from loguru import logger

class FactionRelation(Enum):
    ALLIED = "allied"
    NEUTRAL = "neutral"
    HOSTILE = "hostile"
    WAR = "war"

class FactionType(Enum):
    MILITARY = "military"
    RELIGIOUS = "religious"
    ECONOMIC = "economic"
    ISOLATIONIST = "isolationist"

@dataclass
class Faction:
    id: str
    name: str
    type: FactionType
    color: Any  # Can be Tuple (R,G,B) or name
    home_base: Tuple[int, int]
    current_power: float
    territories: List[Tuple[int, int]]
    relations: Dict[str, FactionRelation]
    expansion_rate: float
    aggression_level: float
    last_action_turn: int = 0

@dataclass
class FactionConflict:
    aggressor: str
    defender: str
    coordinate: Tuple[int, int]
    start_turn: int
    end_turn: Optional[int] = None
    outcome: Optional[str] = None

class FactionManager:
    """
    Manages faction simulation, territorial expansion, and persistence (in-memory).
    """
    def __init__(self):
        self.factions: Dict[str, Faction] = {}
        self.territories: Dict[Tuple[int, int], str] = {} # {coord: faction_id}
        self.conflicts: List[FactionConflict] = []
        
        # Sim params
        self.expansion_chance = 0.3
        
    def register_faction(self, faction: Faction):
        self.factions[faction.id] = faction
        self.claim_territory(faction.id, faction.home_base, 1.0, 0)

    def claim_territory(self, faction_id: str, coord: Tuple[int, int], strength: float, turn: int):
        self.territories[coord] = faction_id
        
        if faction_id in self.factions:
            if coord not in self.factions[faction_id].territories:
                self.factions[faction_id].territories.append(coord)

    def get_owner(self, coord: Tuple[int, int]) -> Optional[str]:
        return self.territories.get(coord)

    def simulate_step(self, current_turn: int, world_bounds: Optional[Tuple[int, int, int, int]] = None, connection_graph: Optional[Dict[Tuple[int, int], List[Tuple[int, int]]]] = None):
        """Perform one simulation tick."""
        for fid, faction in self.factions.items():
            if random.random() < self.expansion_chance * faction.expansion_rate:
                self._expand_faction(faction, current_turn, world_bounds, connection_graph)

    def _expand_faction(self, faction: Faction, turn: int, bounds: Optional[Tuple[int, int, int, int]], connection_graph: Optional[Dict[Tuple[int, int], List[Tuple[int, int]]]]):
        if not faction.territories:
            return
            
        # Try to expand from a random existing territory
        origin = random.choice(faction.territories)
        
        if connection_graph:
            adj = connection_graph.get(origin, [])
        else:
            offsets = [(0,1), (0,-1), (1,0), (-1,0)]
            adj = [(origin[0] + dx, origin[1] + dy) for dx, dy in offsets]
            
        # Session 025: Behavior-aware expansion
        # Sort targets based on aggression
        def expansion_priority(target):
            owner = self.get_owner(target)
            if owner is None:
                return 1 # Neutral is priority 1
            if owner == faction.id:
                return 10 # Already owned, no priority
            
            # Hostile territory
            rel = faction.relations.get(owner, FactionRelation.NEUTRAL)
            if rel in [FactionRelation.HOSTILE, FactionRelation.WAR]:
                # Aggressive factions (Red) prioritize conflict (priority 0)
                # Defensive factions (Blue) deprioritize conflict (priority 2)
                return 0 if faction.aggression_level > 0.6 else 2
            return 1.5 # Neutral/Other is lower priority

        adj = sorted(adj, key=expansion_priority)
        # Add slight randomness to equal priorities
        random.shuffle(adj)
        adj = sorted(adj, key=expansion_priority)
        
        for target in adj:
            tx, ty = target
            
            # Check bounds if provided
            if bounds:
                min_x, min_y, max_x, max_y = bounds
                if not (min_x <= tx <= max_x and min_y <= ty <= max_y):
                    continue
            
            owner = self.get_owner(target)
            
            if owner is None:
                # Claim neutral
                self.claim_territory(faction.id, target, 0.5, turn)
                logger.info(f"🚩 Faction {faction.name} claimed neutral territory {target}")
                return # Expand only once per roll
            elif owner != faction.id:
                # Potential conflict
                rel = faction.relations.get(owner, FactionRelation.NEUTRAL)
                if rel in [FactionRelation.HOSTILE, FactionRelation.WAR]:
                    if random.random() < faction.aggression_level * faction.current_power:
                        self.claim_territory(faction.id, target, 0.4, turn)
                        logger.warning(f"⚔️ Faction {faction.name} seized {owner}'s territory at {target}!")
                        return 
