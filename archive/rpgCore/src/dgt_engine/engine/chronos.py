"""
Chronos Engine: Time-Based World Evolution

Phase 3: Persistent World Implementation
Handles asynchronous state drifting and world clock progression.

ADR 017: Spatial-Temporal Coordinate System Implementation
"""

import sqlite3
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import random
from datetime import datetime

from loguru import logger
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate, WorldChunk
from dgt_engine.engine.game_state import GameState, NPC
from dgt_engine.logic.faction_system import FactionSystem


@dataclass
class WorldEvent:
    """A time-based world event."""
    turn: int
    coordinate: Coordinate
    event_type: str
    description: str
    impact: Dict[str, Any]


class ChronosEngine:
    """
    Time-based world evolution engine.
    
    Processes state changes based on turn progression and maintains
    world persistence across time gaps.
    """
    
    def __init__(self, world_ledger: WorldLedger):
        """Initialize the Chronos engine with world ledger."""
        self.world_ledger = world_ledger
        self.world_clock = 0  # Global turn counter
        self.event_history: List[WorldEvent] = []
        
        # World evolution parameters
        self.drift_interval = 10  # Process drift every 10 turns (1 in-game day)
        self.max_drift_events = 5  # Maximum drift events per interval
        
        # Initialize faction system
        self.faction_system = FactionSystem(world_ledger)
        
        logger.info("Chronos Engine initialized for world evolution with faction system")

    def initialize_main_quest(self, quest_path: List[Tuple[int, int]]):
        """
        Initialize the main quest line with key locations.
        
        Args:
            quest_path: List of coordinates for the main quest path
        """
        self.quest_path = [Coordinate(x, y, 0) for x, y in quest_path]
        logger.info(f"Main quest initialized with {len(self.quest_path)} steps")
    
    def advance_time(self, delta_turns: int) -> List[WorldEvent]:
        """
        Advance world time and process evolution events.
        
        Args:
            delta_turns: Number of turns to advance
            
        Returns:
            List of world events that occurred
        """
        events = []
        old_clock = self.world_clock
        self.world_clock += delta_turns
        
        logger.info(f"Advancing world time from turn {old_clock} to {self.world_clock}")
        
        # Process world drift for each interval
        for turn in range(old_clock + 1, self.world_clock + 1):
            if turn % self.drift_interval == 0:
                interval_events = self._process_world_drift(turn)
                events.extend(interval_events)
        
        # Limit events to prevent overwhelming the player
        if len(events) > self.max_drift_events:
            events = events[-self.max_drift_events:]
        
        self.event_history.extend(events)
        
        # Process faction dynamics
        faction_events = self.process_factions(self.world_clock)
        events.extend(faction_events)
        
        return events
    
    def _process_world_drift(self, turn: int) -> List[WorldEvent]:
        """
        Process world evolution for a specific turn.
        
        Args:
            turn: Current turn number
            
        Returns:
            List of world events that occurred
        """
        events = []
        
        # Get all discovered chunks to process
        discovered_coords = self._get_discovered_coordinates()
        
        for coord in discovered_coords:
            chunk = self.world_ledger.get_chunk(coord, turn)
            
            # Process NPC state drift
            npc_events = self._process_npc_drift(chunk, turn)
            events.extend(npc_events)
            
            # Process environmental drift
            env_events = self._process_environmental_drift(chunk, turn)
            events.extend(env_events)
            
            # Process social drift
            social_events = self._process_social_drift(chunk, turn)
            events.extend(social_events)
        
        return events
    
    def process_factions(self, current_turn: int) -> List[Dict[str, Any]]:
        """
        Process faction dynamics and conflicts.
        
        Args:
            current_turn: Current world turn
            
        Returns:
            List of faction events that occurred
        """
        faction_events = []
        
        # Simulate faction dynamics
        new_conflicts = self.faction_system.simulate_factions(current_turn)
        
        # Convert conflicts to world events
        for conflict in new_conflicts:
            event = WorldEvent(
                turn=current_turn,
                coordinate=Coordinate(conflict.coordinate[0], conflict.coordinate[1], 0),
                event_type="faction_conflict",
                description=f"Faction conflict: {conflict.aggressor} vs {conflict.defender}",
                impact={
                    "aggressor": conflict.aggressor,
                    "defender": conflict.defender,
                    "coordinate": conflict.coordinate,
                    "outcome": conflict.outcome
                }
            )
            
            faction_events.append({
                "turn": current_turn,
                "type": "faction_conflict",
                "description": f"Faction conflict: {conflict.aggressor} vs {conflict.defender} at ({conflict.coordinate[0]}, {conflict.coordinate[1]})",
                "impact": {
                    "aggressor": conflict.aggressor,
                    "defender": conflict.defender,
                    "coordinate": conflict.coordinate,
                    "outcome": conflict.outcome
                }
            })
            
            self.event_history.append(event)
        
        # Process faction expansion
        for faction_id, faction in self.faction_system.factions.items():
            if current_turn - faction.last_action_turn >= 10:
                # Check for recent expansion
                if len(faction.territories) > len(faction.territories) - 5:
                    expansion_event = WorldEvent(
                        turn=current_turn,
                        coordinate=Coordinate(faction.territories[-1][0], faction.territories[-1][1], 0),
                        event_type="faction_expansion",
                        description=f"{faction.name} expanded territory",
                        impact={
                            "faction": faction_id,
                            "new_territory": faction.territories[-1],
                            "total_territories": len(faction.territories)
                        }
                    )
                    
                    faction_events.append({
                        "turn": current_turn,
                        "type": "faction_expansion",
                        "description": f"{faction.name} expanded to ({faction.territories[-1][0]}, {faction.territories[-1][1]})",
                        "impact": {
                            "faction": faction_id,
                            "new_territory": faction.territories[-1],
                            "total_territories": len(faction.territories)
                        }
                    })
                    
                    self.event_history.append(expansion_event)
        
        logger.info(f"Processed factions for turn {current_turn}: {len(faction_events)} events")
        return faction_events
    
    def _get_discovered_coordinates(self) -> List[Coordinate]:
        """Get all coordinates that have been discovered by players."""
        # This would typically come from player data
        # For now, return a few example coordinates
        return [
            Coordinate(0, 0, self.world_clock),  # Tavern
            Coordinate(0, 10, self.world_clock),  # Plaza
            Coordinate(5, -5, self.world_clock),  # Cave
        ]
    
    def _process_npc_drift(self, chunk: WorldChunk, turn: int) -> List[WorldEvent]:
        """Process NPC state changes over time."""
        events = []
        
        for i, npc in enumerate(chunk.npcs):
            original_state = npc.get("state", "neutral")
            original_disposition = npc.get("disposition", 0)
            
            # NPC state drift logic
            new_state, new_disposition = self._calculate_npc_evolution(
                npc, chunk, turn
            )
            
            # Only create event if state changed
            if new_state != original_state or new_disposition != original_disposition:
                event = WorldEvent(
                    turn=turn,
                    coordinate=Coordinate(*chunk.coordinate),
                    event_type="npc_evolution",
                    description=f"{npc['name']} evolved from {original_state} to {new_state}",
                    impact={
                        "npc_index": i,
                        "old_state": original_state,
                        "new_state": new_state,
                        "old_disposition": original_disposition,
                        "new_disposition": new_disposition
                    }
                )
                
                events.append(event)
                
                # Update the chunk
                chunk.npcs[i]["state"] = new_state
                chunk.npcs[i]["disposition"] = new_disposition
                chunk.last_modified = turn
                
                self.world_ledger.update_chunk(
                    Coordinate(*chunk.coordinate),
                    {"npcs": chunk.npcs},
                    turn
                )
        
        return events
    
    def _calculate_npc_evolution(
        self, npc: Dict[str, Any], chunk: WorldChunk, turn: int
    ) -> Tuple[str, int]:
        """Calculate how an NPC evolves over time."""
        current_state = npc.get("state", "neutral")
        disposition = npc.get("disposition", 0)
        
        # State transition probabilities
        state_transitions = {
            "neutral": {
                "hostile": 0.1,  # 10% chance to become hostile
                "friendly": 0.05,  # 5% chance to become friendly
                "charmed": 0.02,  # 2% chance to become charmed
            },
            "hostile": {
                "neutral": 0.15,  # 15% chance to calm down
                "fleeing": 0.1,  # 10% chance to flee
            },
            "friendly": {
                "neutral": 0.1,  # 10% chance to become neutral
                "charmed": 0.05,  # 5% chance to become charmed
            },
            "charmed": {
                "neutral": 0.2,  # 20% chance to wear off
                "friendly": 0.1,  # 10% chance to become friendly
            }
        }
        
        # Check for state transition
        transitions = state_transitions.get(current_state, {})
        for new_state, probability in transitions.items():
            if random.random() < probability:
                current_state = new_state
                break
        
        # Disposition drift (gradual movement toward neutral)
        if disposition > 0:
            disposition = max(0, disposition - 1)  # Move toward neutral
        elif disposition < 0:
            disposition = min(0, disposition + 1)  # Move toward neutral
        
        # Environmental influences
        if "dangerous" in chunk.tags:
            disposition -= 1  # Dangerous places make NPCs more hostile
        elif "safe" in chunk.tags:
            disposition += 1  # Safe places make NPCs more friendly
        
        return current_state, disposition
    
    def _process_environmental_drift(self, chunk: WorldChunk, turn: int) -> List[WorldEvent]:
        """Process environmental changes over time."""
        events = []
        
        # Fire spread and extinguishing
        if "on_fire" in chunk.environmental_state:
            fire_age = turn - chunk.environmental_state["on_fire"]
            
            if fire_age > 5:  # Fire burns out after 5 turns
                chunk.environmental_state.pop("on_fire", None)
                chunk.tags = [tag for tag in chunk.tags if tag != "on_fire"]
                chunk.tags.append("burnt")
                
                event = WorldEvent(
                    turn=turn,
                    coordinate=Coordinate(*chunk.coordinate),
                    event_type="environmental_change",
                    description=f"Fire at {chunk.name} has burned out",
                    impact={"environmental_state": chunk.environmental_state}
                )
                events.append(event)
        
        # Weather changes
        if turn % 20 == 0:  # Weather changes every 20 turns
            weather_options = ["clear", "rainy", "foggy", "windy"]
            new_weather = random.choice(weather_options)
            old_weather = chunk.environmental_state.get("weather", "clear")
            
            if new_weather != old_weather:
                chunk.environmental_state["weather"] = new_weather
                
                event = WorldEvent(
                    turn=turn,
                    coordinate=Coordinate(*chunk.coordinate),
                    event_type="weather_change",
                    description=f"Weather at {chunk.name} changed from {old_weather} to {new_weather}",
                    impact={"weather": new_weather}
                )
                events.append(event)
        
        return events
    
    def _process_social_drift(self, chunk: WorldChunk, turn: int) -> List[WorldEvent]:
        """Process social relationship changes over time."""
        events = []
        
        # NPC interactions when player is not present
        if len(chunk.npcs) > 1:
            # Random NPC interactions
            for i in range(len(chunk.npcs)):
                for j in range(i + 1, len(chunk.npcs)):
                    npc1, npc2 = chunk.npcs[i], chunk.npcs[j]
                    
                    # Check if NPCs should interact
                    if random.random() < 0.1:  # 10% chance per turn
                        interaction = self._generate_npc_interaction(npc1, npc2, chunk)
                        
                        if interaction:
                            event = WorldEvent(
                                turn=turn,
                                coordinate=Coordinate(*chunk.coordinate),
                                event_type="npc_interaction",
                                description=f"{npc1['name']} and {npc2['name']} {interaction}",
                                impact={"npc1_index": i, "npc2_index": j}
                            )
                            events.append(event)
        
        return events
    
    def _generate_npc_interaction(
        self, npc1: Dict[str, Any], npc2: Dict[str, Any], chunk: WorldChunk
    ) -> Optional[str]:
        """Generate a description of NPC interaction."""
        interactions = [
            "had a brief conversation",
            "argued about politics",
            "shared a drink",
            "exchanged stories",
            "played a game of cards",
            "helped each other with a task"
        ]
        
        return random.choice(interactions)
    
    def calculate_time_gap_evolution(
        self, player_death_turn: int, current_turn: int
    ) -> List[WorldEvent]:
        """
        Calculate world evolution for a player returning after a long absence.
        
        Args:
            player_death_turn: Turn when player last played
            current_turn: Current world turn
            
        Returns:
            List of major world events that occurred
        """
        time_gap = current_turn - player_death_turn
        
        if time_gap < 10:
            return []  # No significant changes for short gaps
        
        logger.info(f"Calculating {time_gap} turn time gap evolution")
        
        # Simulate world evolution for the time gap
        events = []
        
        # Major events that could happen over long periods
        major_events = [
            ("political_uprising", "A political uprising changed the local government"),
            ("monster_migration", "Monsters migrated into the area"),
            ("economic_boom", "A trade boom brought prosperity to the region"),
            ("natural_disaster", "A natural disaster reshaped the landscape"),
            ("new_settlement", "A new settlement was founded nearby"),
            ("war_declaration", "War was declared between factions"),
        ]
        
        # Generate major events based on time gap
        num_major_events = min(time_gap // 50, 3)  # One major event per 50 turns, max 3
        
        for i in range(num_major_events):
            event_type, description = random.choice(major_events)
            
            # Pick a random discovered location
            discovered_coords = self._get_discovered_coordinates()
            if discovered_coords:
                event_coord = random.choice(discovered_coords)
                
                event = WorldEvent(
                    turn=player_death_turn + (i + 1) * (time_gap // (num_major_events + 1)),
                    coordinate=event_coord,
                    event_type=event_type,
                    description=description,
                    impact={"time_gap_event": True}
                )
                events.append(event)
        
        return events
    
    def get_world_summary(self, turn: Optional[int] = None) -> Dict[str, Any]:
        """
        Get a summary of the current world state.
        
        Args:
            turn: Optional turn to get summary for (defaults to current)
            
        Returns:
            World state summary
        """
        if turn is None:
            turn = self.world_clock
        
        summary = {
            "world_clock": turn,
            "total_events": len(self.event_history),
            "discovered_locations": len(self._get_discovered_coordinates()),
            "recent_events": []
        }
        
        # Get recent events (last 10)
        recent_events = [e for e in self.event_history if e.turn <= turn][-10:]
        summary["recent_events"] = [
            {
                "turn": e.turn,
                "location": f"({e.coordinate.x}, {e.coordinate.y})",
                "type": e.event_type,
                "description": e.description
            }
            for e in recent_events
        ]
        
        return summary


# Export for use by game engine
__all__ = ["ChronosEngine", "WorldEvent"]
