"""
Historian: Deep Time Simulator for Sedimentary World Generation

Phase 5: Narrative Archaeology Engine
Pre-generates 1,000 years of world history before player arrival.

ADR 020: The Historian Utility & Sedimentary World-Gen Implementation
"""

import sqlite3
import random
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime, timedelta
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from loguru import logger
from dgt_engine.foundation.protocols import WorldStateSnapshot, EntityStateProtocol


class WorldEvent(Enum):
    """Types of world events that can occur during epochs."""
    PROSPERITY = "prosperity"
    CONFLICT = "conflict"
    DISASTER = "disaster"
    DISCOVERY = "discovery"
    DECLINE = "decline"
    RENAISSANCE = "renaissance"
    PLAGUE = "plague"
    WAR = "war"
    ECONOMIC_BOOM = "economic_boom"
    MAGIC_SURGE = "magic_surge"
    RELIGIOUS_UPHEAVAL = "religious_upheaval"


class Faction(Enum):
    """Major factions that shape world history."""
    NOBILITY = "nobility"
    CLERGY = "clergy"
    MERCHANTS = "merchants"
    PEASANTRY = "peasantry"
    OUTLAWS = "outlaws"
    WIZARDS = "wizards"
    ANCIENTS = "ancients"


@dataclass
class HistoricalTag:
    """A historical tag that persists in the world."""
    coordinate: Tuple[int, int]
    tag: str
    epoch: int
    event_type: WorldEvent
    faction: Optional[Faction]
    description: str
    intensity: float  # 0.0 to 1.0
    decay_rate: float  # How quickly the tag fades over time
    world_state: Dict[str, Any]  # World state at time of tag creation


@dataclass
class Epoch:
    """A 100-year chunk of world history."""
    number: int
    start_year: int
    end_year: int
    dominant_event: WorldEvent
    dominant_faction: Optional[Faction]
    population_trend: float  # Population change multiplier
    tags_created: List[HistoricalTag]
    world_state: Dict[str, Any]


@dataclass
class WorldSeed:
    """Seed configuration for world generation."""
    founding_vector: Dict[str, str]  # e.g., {"resource": "gold", "climate": "cold"}
    starting_population: int
    initial_factions: List[Faction]
    location_name: str
    coordinates: Tuple[int, int]  # Center coordinates
    radius: int  # Initial settlement radius


class Historian:
    """
    Deep Time Simulator for sedimentary world generation.
    
    Pre-generates centuries of history before player arrival,
    creating a layered archaeological foundation for the world.
    """
    
    def __init__(self, world_ledger: WorldLedger, db_path: str = "data/historian.sqlite"):
        """Initialize the historian with world ledger."""
        self.world_ledger = world_ledger
        self.db_path = db_path
        
        # Create database directory
        import os
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self._initialize_database()
        
        # World event templates
        self.event_templates = self._initialize_event_templates()
        
        logger.info("Historian initialized for deep time simulation")
    
    def _initialize_database(self):
        """Initialize SQLite database for historical data."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS world_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    epoch_number INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    coordinate TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    faction TEXT,
                    description TEXT NOT NULL,
                    intensity REAL DEFAULT 0.5,
                    decay_rate REAL DEFAULT 0.1,
                    world_state TEXT
                )
            """)
            
            # Add indexes for performance
            conn.execute("CREATE INDEX IF NOT EXISTS idx_coordinate ON world_history(coordinate)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_epoch ON world_history(epoch_number)")
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS epoch_summary (
                    epoch_number INTEGER PRIMARY KEY,
                    start_year INTEGER NOT NULL,
                    end_year INTEGER NOT NULL,
                    dominant_event TEXT NOT NULL,
                    dominant_faction TEXT,
                    population_trend REAL,
                    tags_created INTEGER,
                    summary TEXT
                )
            """)
            
            conn.commit()
    
    def _initialize_event_templates(self) -> Dict[WorldEvent, Dict[str, Any]]:
        """Initialize templates for world events."""
        return {
            WorldEvent.PROSPERITY: {
                "probability": 0.3,
                "duration": (50, 150),  # years
                "population_multiplier": (1.2, 2.0),
                "tags": ["prosperous", "thriving", "expanding"],
                "factions": [Faction.MERCHANTS, Faction.NOBILITY],
                "intensity_range": (0.6, 0.9),
                "decay_rate": 0.05
            },
            WorldEvent.CONFLICT: {
                "probability": 0.4,
                "duration": (10, 50),
                "population_multiplier": (0.7, 0.9),
                "tags": ["war-torn", "battleground", "scarred"],
                "factions": [Faction.NOBILITY, Faction.OUTLAWS],
                "intensity_range": (0.7, 1.0),
                "decay_rate": 0.02
            },
            WorldEvent.DISASTER: {
                "probability": 0.2,
                "duration": (5, 20),
                "population_multiplier": (0.3, 0.6),
                "tags": ["ruined", "abandoned", "devastated"],
                "factions": None,
                "intensity_range": (0.8, 1.0),
                "decay_rate": 0.01
            },
            WorldEvent.PLAGUE: {
                "probability": 0.15,
                "duration": (5, 15),
                "population_multiplier": (0.4, 0.7),
                "tags": ["plague-scarred", "abandoned", "haunted"],
                "factions": [Faction.PEASANTRY, Faction.CLERGY],
                "intensity_range": (0.6, 0.9),
                "decay_rate": 0.03
            },
            WorldEvent.ECONOMIC_BOOM: {
                "probability": 0.25,
                "duration": (20, 60),
                "population_multiplier": (1.3, 1.8),
                "tags": ["prosperous", "trade-hub", "wealthy"],
                "factions": [Faction.MERCHANTS],
                "intensity_range": (0.5, 0.8),
                "decay_rate": 0.08
            },
            WorldEvent.MAGIC_SURGE: {
                "probability": 0.1,
                "duration": (30, 100),
                "population_multiplier": (0.8, 1.2),
                "tags": ["magical", "enchanted", "otherworldly"],
                "factions": [Faction.WIZARDS],
                "intensity_range": (0.7, 1.0),
                "decay_rate": 0.04
            },
            WorldEvent.RENAISSANCE: {
                "probability": 0.15,
                "duration": (40, 80),
                "population_multiplier": (1.1, 1.5),
                "tags": ["renewed", "rebuilt", "hopeful"],
                "factions": [Faction.CLERGY, Faction.NOBILITY],
                "intensity_range": (0.4, 0.7),
                "decay_rate": 0.06
            }
        }
    
    def simulate_deep_time(self, world_seed: WorldSeed, epochs: int = 10) -> List[Epoch]:
        """
        simulate centuries of world history.
        
        Args:
            world_seed: Seed configuration for world generation
            epochs: Number of 100-year epochs to simulate
            
        Returns:
            List of epochs with their historical events
        """
        logger.info(f"Simulating {epochs * 100} years of deep time for {world_seed.location_name}")
        
        current_year = 0
        simulated_epochs = []
        
        # Initialize world state
        world_state = {
            "population": world_seed.starting_population,
            "factions": {faction.value: 1.0 for faction in world_seed.initial_factions},
            "resources": world_seed.founding_vector.copy(),
            "climate": world_seed.founding_vector.get("climate", "temperate"),
            "prosperity": 0.5,
            "stability": 0.7
        }
        
        for epoch_num in range(1, epochs + 1):
            epoch_start = current_year
            epoch_end = current_year + 100
            
            # Determine dominant event for this epoch
            dominant_event = self._determine_dominant_event(world_state)
            
            # Simulate the epoch
            epoch = self._simulate_epoch(
                epoch_num, 
                epoch_start, 
                epoch_end, 
                dominant_event, 
                world_state,
                world_seed
            )
            
            # Update world state for next epoch
            world_state = self._update_world_state(world_state, epoch)
            
            # Save epoch summary
            self._save_epoch_summary(epoch)
            
            simulated_epochs.append(epoch)
            current_year = epoch_end
        
        logger.info(f"Completed simulation of {epochs * 100} years with {len(simulated_epochs)} epochs")
        return simulated_epochs
    
    def _determine_dominant_event(self, world_state: Dict[str, Any]) -> WorldEvent:
        """Determine the dominant event for the next epoch based on world state."""
        # Calculate probabilities based on world state
        event_probabilities = {}
        
        for event, template in self.event_templates.items():
            base_prob = template["probability"]
            
            # Modify probability based on world state
            if event == WorldEvent.PROSPERITY:
                if world_state["prosperity"] > 0.7:
                    base_prob *= 1.5
                elif world_state["stability"] < 0.3:
                    base_prob *= 0.5
            
            elif event == WorldEvent.CONFLICT:
                if world_state["stability"] < 0.4:
                    base_prob *= 2.0
                elif world_state["prosperity"] > 0.8:
                    base_prob *= 0.3
            
            elif event == WorldEvent.DISASTER:
                if world_state["stability"] < 0.2:
                    base_prob *= 1.8
                elif world_state["stability"] > 0.8:
                    base_prob *= 0.5
            
            elif event == WorldEvent.PLAGUE:
                if world_state["population"] > 1000:
                    base_prob *= 1.5
                elif world_state.get("climate") == "cold":
                    base_prob *= 1.2
            
            event_probabilities[event] = base_prob
        
        # Normalize probabilities
        total_prob = sum(event_probabilities.values())
        if total_prob > 0:
            event_probabilities = {k: v/total_prob for k, v in event_probabilities.items()}
        else:
            # Fallback to equal probabilities if all are 0
            event_probabilities = {event: 1.0/len(self.event_templates) for event in self.event_templates}
        
        # Choose event
        rand = random.random()
        cumulative = 0
        for event, prob in event_probabilities.items():
            cumulative += prob
            if rand <= cumulative:
                return event
        
        return WorldEvent.PROSPERITY  # Default
    
    def _simulate_epoch(
        self, 
        epoch_num: int, 
        start_year: int, 
        end_year: int, 
        dominant_event: WorldEvent,
        world_state: Dict[str, Any],
        world_seed: WorldSeed
    ) -> Epoch:
        """Simulate a single epoch of world history."""
        
        template = self.event_templates[dominant_event]
        
        # Calculate event parameters
        duration = random.randint(*template["duration"])
        population_multiplier = random.uniform(*template["population_multiplier"])
        
        # Determine dominant faction
        dominant_faction = None
        if template["factions"]:
            # Choose faction with highest influence
            faction_influence = {
                faction: world_state["factions"].get(faction.value, 0) 
                for faction in template["factions"]
            }
            if faction_influence:  # Check if dictionary is not empty
                dominant_faction = max(faction_influence, key=faction_influence.get)
        
        # Create historical tags
        tags_created = []
        
        # Generate tags for the settlement area
        num_tags = random.randint(3, 8)
        for _ in range(num_tags):
            tag = random.choice(template["tags"])
            
            # Random position within settlement radius
            angle = random.uniform(0, 2 * math.pi)
            distance = random.uniform(0, world_seed.radius)
            
            tag_x = int(world_seed.coordinates[0] + distance * math.cos(angle))
            tag_y = int(world_seed.coordinates[1] + distance * math.sin(angle))
            
            historical_tag = HistoricalTag(
                coordinate=(tag_x, tag_y),
                tag=f"[TAG: {tag.title()}]",
                epoch=epoch_num,
                event_type=dominant_event,
                faction=dominant_faction,
                description=self._generate_tag_description(tag, dominant_event, dominant_faction),
                intensity=random.uniform(*template["intensity_range"]),
                decay_rate=template["decay_rate"],
                world_state=world_state.copy()
            )
            
            tags_created.append(historical_tag)
            
            # Save to database
            self._save_historical_tag(historical_tag)
        
        # Create epoch object
        epoch = Epoch(
            number=epoch_num,
            start_year=start_year,
            end_year=end_year,
            dominant_event=dominant_event,
            dominant_faction=dominant_faction,
            population_trend=population_multiplier,
            tags_created=tags_created,
            world_state=world_state.copy()
        )
        
        return epoch
    
    def _generate_tag_description(self, tag: str, event: WorldEvent, faction: Optional[Faction]) -> str:
        """Generate a description for a historical tag."""
        faction_name = faction.value if faction else "unknown"
        
        descriptions = {
            "prosperous": f"During a time of great prosperity, {faction_name} influence led to {tag} being established",
            "war-torn": f"The great wars of this era left {tag} as a scarred reminder of conflict",
            "ruined": f"Devastating events during this period led to the {tag} being abandoned",
            "plague-scarred": f"The great plague left {tag} haunted and avoided",
            "magical": f"Unusual magical phenomena during this era created {tag}",
            "renewed": f"After a period of decline, {tag} was renewed with hope",
            "thriving": f"During this prosperous time, {tag} became a thriving center",
            "expanding": f"As the settlement grew, {tag} was established on the frontier",
            "battleground": f"This area became a battleground, marked by {tag}",
            "abandoned": f"Due to tragic circumstances, {tag} was abandoned",
            "devastated": f"Devastating events left {tag} in ruins",
            "haunted": f"Supernatural events left {tag} haunted by locals",
            "enchanted": f"Magical energies made {tag} enchanted and mysterious",
            "rebuilt": f"After destruction, {tag} was rebuilt with new purpose",
            "hopeful": f"Renewal and hope led to {tag} being established",
            "trade-hub": f"Commercial success made {tag} a center of trade",
            "wealthy": f"Economic prosperity made {tag} known for its wealth"
        }
        
        return descriptions.get(tag, f"Historical {tag} from an unknown era")
    
    def _update_world_state(self, world_state: Dict[str, Any], epoch: Epoch) -> Dict[str, Any]:
        """Update world state based on epoch outcomes."""
        new_state = world_state.copy()
        
        # Update population with minimum bound
        new_population = int(world_state["population"] * epoch.population_trend)
        new_state["population"] = max(0, new_population)
        
        # Update faction influence
        if epoch.dominant_faction:
            faction_key = epoch.dominant_faction.value
            new_state["factions"][faction_key] = world_state["factions"].get(faction_key, 0) + 1.0
        
        # Update prosperity and stability based on event type
        if epoch.dominant_event == WorldEvent.PROSPERITY:
            new_state["prosperity"] = min(1.0, world_state["prosperity"] + 0.2)
            new_state["stability"] = min(1.0, world_state["stability"] + 0.1)
        elif epoch.dominant_event == WorldEvent.CONFLICT:
            new_state["prosperity"] = max(0.0, world_state["prosperity"] - 0.3)
            new_state["stability"] = max(0.0, world_state["stability"] - 0.4)
        elif epoch.dominant_event == WorldEvent.DISASTER:
            new_state["prosperity"] = max(0.0, world_state["prosperity"] - 0.5)
            new_state["stability"] = max(0.0, world_state["stability"] - 0.6)
        elif epoch.dominant_event == WorldEvent.RENAISSANCE:
            new_state["prosperity"] = min(1.0, world_state["prosperity"] + 0.3)
            new_state["stability"] = min(1.0, world_state["stability"] + 0.2)
        
        return new_state
    
    def _save_historical_tag(self, tag: HistoricalTag):
        """Save a historical tag to the database."""
        try:
            # Save to world_ledger database for consistency
            with sqlite3.connect(self.world_ledger.save_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO historical_tags (
                        coordinate, tag, epoch, event_type, faction,
                        description, intensity, decay_rate, world_state
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"{tag.coordinate[0]},{tag.coordinate[1]}",
                    tag.tag,
                    tag.epoch,
                    tag.event_type.value,
                    tag.faction.value if tag.faction else None,
                    tag.description,
                    tag.intensity,
                    tag.decay_rate,
                    json.dumps(tag.world_state)
                ))
                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Failed to save historical tag: {e}")
    
    def _save_epoch_summary(self, epoch: Epoch):
        """Save epoch summary to database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO epoch_summary (
                    epoch_number, start_year, end_year, dominant_event,
                    dominant_faction, population_trend, tags_created, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                epoch.number,
                epoch.start_year,
                epoch.end_year,
                epoch.dominant_event.value,
                epoch.dominant_faction.value if epoch.dominant_faction else None,
                epoch.population_trend,
                len(epoch.tags_created),
                f"Epoch {epoch.number}: {epoch.dominant_event.value.title()} with {len(epoch.tags_created)} historical tags"
            ))
            conn.commit()
    
    def get_historical_context(self, coord: Coordinate, current_year: int) -> List[str]:
        """
        Get historical context for a coordinate.
        
        Args:
            coord: Coordinate to check
            current_year: Current world year
            
        Returns:
            List of historical descriptions
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT description, intensity, decay_rate, year
                FROM world_history
                WHERE coordinate = ?
                ORDER BY year DESC
            """, (f"{coord.x},{coord.y}",))
            
            context = []
            current_year_float = float(current_year)
            
            for row in cursor.fetchall():
                description, intensity, decay_rate, year = row
                
                # Calculate decay based on time passed
                years_passed = current_year_float - year
                decayed_intensity = intensity * (decay_rate ** years_passed)
                
                # Only include if still visible
                if decayed_intensity > 0.1:
                    context.append(description)
            
            return context
    
    def get_historical_summary(self) -> Dict[str, Any]:
        """Get summary of world history."""
        with sqlite3.connect(self.db_path) as conn:
            # Count total tags
            tag_count = conn.execute("SELECT COUNT(*) FROM world_history").fetchone()[0]
            
            # Get epoch summaries
            cursor = conn.execute("""
                SELECT epoch_number, dominant_event, dominant_faction, tags_created, summary
                FROM epoch_summary
                ORDER BY epoch_number
            """).fetchall()
            
            # Get event distribution
            cursor = conn.execute("""
                SELECT event_type, COUNT(*) FROM world_history GROUP BY event_type
            """).fetchall()
            
            return {
                "total_tags": tag_count,
                "epochs": cursor,
                "event_distribution": dict(cursor)
            }


# Export for use by game engine
__all__ = ["Historian", "WorldSeed", "Epoch", "HistoricalTag", "WorldEvent", "Faction"]
