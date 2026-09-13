"""
World Factory: Procedural World Generation with Historical Layers

Phase 5: Narrative Archaeology Engine Implementation
Generates worlds with sedimentary history layers from the Historian.

ADR 020: The Historian Utility & Sedimentary World-Gen Implementation
"""

import random
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from loguru import logger
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate, WorldChunk
from dgt_engine.foundation.utils.historian import Historian, WorldSeed, Faction

from dgt_engine.engine.game_state import Room, NPC, GameState


class LocationTemplate(BaseModel):
    """Template for generating locations."""
    name: str
    description: str
    environment_tags: List[str]
    initial_npcs: List[str]


class WorldFactory:
    """
    Factory for creating dynamic world content with historical layers.
    
    Generates worlds that feel like they have centuries of history
    by combining procedural generation with sedimentary historical tags.
    """
    
    def __init__(self, world_ledger: WorldLedger):
        """Initialize the factory with world ledger and historian."""
        self.world_ledger = world_ledger
        self.historian = Historian(world_ledger)
        self.blueprints = self._load_blueprints()
        self.location_templates = self._load_location_templates()
        self.historical_seeds = self._load_historical_seeds()
        
        logger.info("World Factory initialized with historical layer support")
    
    def _load_blueprints(self) -> Dict[str, Dict[str, Any]]:
        """Load procedural generation blueprints."""
        return {
            "tavern": {
                "name": "The Rusty Flagon",
                "description": "A dimly lit tavern filled with the smell of ale and roasted meat.",
                "base_tags": ["indoor", "social", "safe"],
                "npc_chance": 0.8,
                "possible_npcs": ["bartender", "guard", "merchant", "bard"],
                "item_chance": 0.3,
                "possible_items": ["coin", "mug", "knife"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "forest": {
                "name": "Dense Forest",
                "description": "Tall trees block out most of the sunlight. The air is thick with the smell of pine.",
                "base_tags": ["outdoor", "nature", "wild"],
                "npc_chance": 0.4,
                "possible_npcs": ["bandit", "hermit", "hunter", "animal"],
                "item_chance": 0.2,
                "possible_items": ["stick", "berry", "feather"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "plaza": {
                "name": "Town Plaza",
                "description": "A bustling open square surrounded by shops and stalls.",
                "base_tags": ["outdoor", "social", "urban"],
                "npc_chance": 0.9,
                "possible_npcs": ["merchant", "guard", "noble", "child"],
                "item_chance": 0.4,
                "possible_items": ["coin", "fruit", "craft"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "cave": {
                "name": "Dark Cave",
                "description": "A natural cave entrance beckons from the rocky hillside.",
                "base_tags": ["indoor", "dark", "dangerous"],
                "npc_chance": 0.6,
                "possible_npcs": ["goblin", "bear", "hermit", "bat"],
                "item_chance": 0.5,
                "possible_items": ["gem", "bone", "torch"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "shrine": {
                "name": "Ancient Shrine",
                "description": "Weathered stone pillars mark this sacred place.",
                "base_tags": ["outdoor", "sacred", "quiet"],
                "npc_chance": 0.3,
                "possible_npcs": ["priest", "pilgrim", "guardian"],
                "item_chance": 0.6,
                "possible_items": ["holy_water", "relic", "incense"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            }
        }
    
    def create_world_with_history(
        self, 
        center_coord: Coordinate, 
        world_seed: Optional[WorldSeed] = None,
        epochs: int = 10,
        radius: int = 5
    ) -> Dict[str, Any]:
        """
        Create a world with deep time simulation.
        
        Args:
            center_coord: Center coordinate for world generation
            world_seed: Optional seed for world generation
            epochs: Number of epochs to simulate
            radius: Initial settlement radius
            
        Returns:
            Dictionary with world information
        """
        if world_seed is None:
            world_seed = self._generate_random_seed(center_coord)
        
        logger.info(f"Creating world with {epochs} epochs of history for {world_seed.location_name}")
        
        # Simulate deep time
        simulated_epochs = self.historian.simulate_deep_time(world_seed, epochs)
        
        # Create initial settlement area
        settlement_chunks = self._create_settlement_area(center_coord, radius, world_seed)
        
        # Apply historical layers to chunks
        for coord_tuple, chunk in settlement_chunks.items():
            coord = Coordinate(coord_tuple[0], coord_tuple[1], 0)
            self.world_ledger.add_historical_tags_to_chunk(chunk, coord)
        
        return {
            "world_seed": world_seed,
            "simulated_epochs": simulated_epochs,
            "settlement_chunks": settlement_chunks,
            "total_chunks": len(settlement_chunks),
            "historical_summary": self.historian.get_historical_summary()
        }
    
    def _generate_random_seed(self, center_coord: Coordinate) -> WorldSeed:
        """Generate a random world seed."""
        # Random founding vector
        resources = ["gold", "silver", "iron", "wood", "grain"]
        climates = ["temperate", "cold", "arid", "tropical", "continental"]
        factions = [Faction.NOBILITY, Faction.CLERGY, Faction.MERCHANTS]
        
        return WorldSeed(
            founding_vector={
                "resource": random.choice(resources),
                "climate": random.choice(climates),
                "faction": random.choice(factions).value
            },
            starting_population=random.randint(50, 500),
            initial_factions=random.sample(factions, k=2),
            location_name=f"Settlement_{center_coord.x}_{center_coord.y}",
            coordinates=center_coord,
            radius=random.randint(3, 8)
        )
    
    def _load_historical_seeds(self) -> Dict[str, WorldSeed]:
        """Load predefined historical world seeds."""
        return {
            "river_valley": WorldSeed(
                founding_vector={
                    "resource": "water",
                    "climate": "temperate",
                    "faction": "merchants"
                },
                starting_population=200,
                initial_factions=[Faction.MERCHANTS, Faction.PEASANTRY],
                location_name="River Valley",
                coordinates=(0, 0),
                radius=4
            ),
            "mountain_pass": WorldSeed(
                founding_vector={
                    "resource": "iron",
                    "climate": "cold",
                    "faction": "nobility"
                },
                starting_population=100,
                initial_factions=[Faction.NOBILITY, Faction.CLERGY],
                location_name="Mountain Pass",
                coordinates=(10, 10),
                radius=3
            ),
            "coastal_town": WorldSeed(
                founding_vector={
                    "resource": "fish",
                    "climate": "temperate",
                    "faction": "merchants"
                },
                starting_population=300,
                initial_factions=[Faction.MERCHANTS, Faction.PEASANTRY],
                location_name="Tundra Town",
                coordinates=(0, 10),
                radius=5
            ),
            "frontier_outpost": WorldSeed(
                founding_vector={
                    "resource": "wood",
                    "climate": "arid",
                    "faction": "outlaws"
                },
                starting_population=50,
                initial_factions=[Faction.OUTLAWS, Faction.PEASANTRY],
                location_name="Frontier Outpost",
                coordinates=(-5, -5),
                radius=2
            )
        }
    
    def _create_settlement_area(self, center_coord: Coordinate, radius: int, world_seed: WorldSeed) -> Dict[Tuple[int, int], WorldChunk]:
        """Create the initial settlement area with procedural generation."""
        settlement_chunks = {}
        
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                if dx == 0 and dy == 0:
                    continue  # Skip center coordinate for now
                
                coord = Coordinate(center_coord.x + dx, center_coord.y + dy, 0)
                
                # Generate chunk with historical context
                chunk = self.world_ledger.get_chunk(coord, 0)
                
                # Add historical tags from historian
                self.world_ledger.add_historical_tags_to_chunk(chunk, coord)
                
                # Add world seed influence to blueprint selection
                blueprint_name = self._select_blueprint_with_influence(chunk, world_seed)
                if blueprint_name and blueprint_name in self.blueprints:
                    blueprint = self.blueprints[blueprint_name]
                    chunk.name = blueprint["name"]
                    chunk.description = blueprint["description"]
                    chunk.tags.extend(blueprint["base_tags"])
                
                settlement_chunks[(coord.x, coord.y)] = chunk
        
        return settlement_chunks
    
    def _select_blueprint_with_influence(self, chunk: WorldChunk, world_seed: WorldSeed) -> Optional[str]:
        """Select blueprint based on world seed influence."""
        # Simple heuristic: match resource and climate preferences
        resource = world_seed.founding_vector.get("resource", "gold")
        climate = world_seed.founding_vector.get("climate", "temperate")
        faction = world_seed.founding_vector.get("faction", "merchants")
        
        # Blueprint preferences based on founding vector
        blueprint_preferences = {
            ("gold", "temperate", "merchants"): "tavern",
            ("iron", "cold", "nobility"): "fortress",
            ("fish", "temperate", "merchants"): "market",
            ("wood", "arid", "outlaws"): "camp",
            ("grain", "temperate", "peasantry"): "farm",
        }
        
        key = (resource, climate, faction)
        return blueprint_preferences.get(key)
    
    def _load_location_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load location templates for special locations."""
        return {
            "ancient_ruins": {
                "name": "Ancient Ruins",
                "description": " crumbling stone structures from a forgotten age",
                "base_tags": ["ancient", "ruined", "mysterious"],
                "npc_chance": 0.3,
                "possible_npcs": ["ghost", "specter", "ancient_guard"],
                "item_chance": 0.6,
                "possible_items": ["ancient_artifact", "rare_gem", "old_coin"]
            },
            "magical_site": {
                "name": "Magical Site",
                "description": "a place where the veil between worlds is thin",
                "base_tags": ["magical", "enchanted", "dangerous"],
                "npc_chance": 0.2,
                "possible_npcs": ["wizard", "elemental", "spirit"],
                "item_chance": 0.4,
                "possible_items": ["mana_crystal", "enchanted_item", "scroll"]
            },
            "battlefield": {
                "name": "Ancient Battlefield",
                "description": "the ground is still stained with the blood of ancient battles",
                "base_tags": ["battleground", "haunted", "scarred"],
                "npc_chance": 0.1,
                "possible_npcs": ["ghost_soldier", "wraith", "specter"],
                "item_chance": 0.8,
                "possible_items": ["broken_sword", "rusty_armor", "battle_standard"]
            }
        }
    
    def get_historical_context_for_chunk(self, coord: Coordinate) -> List[str]:
        """
        Get historical context for a chunk for narrative generation.
        
        Args:
            coord: Coordinate of the chunk
            
        Returns:
            List of historical descriptions
        """
        tags = self.world_ledger.get_historical_tags(coord)
        
        # Convert tags to descriptions
        context = []
        for tag in tags:
            if tag["intensity"] > 0.3:  # Only show significant tags
                context.append(tag["description"])
        
        return context
    
    def create_location_with_history(
        self, 
        coord: Coordinate, 
        template_name: str,
        current_turn: int = 0
    ) -> WorldChunk:
        """
        Create a location with historical context.
        
        Args:
            coord: Coordinate for the location
            template_name: Name of the location template
            current_turn: Current world turn
            
        Returns:
            WorldChunk with historical tags applied
        """
        # Generate base chunk
        chunk = self.world_ledger.get_chunk(coord, current_turn)
        
        # Apply template if specified
        if template_name in self.location_templates:
            template = self.location_templates[template_name]
            chunk.name = template["name"]
            chunk.description = template["description"]
            chunk.tags.extend(template["base_tags"])
        
        # Add historical tags
        self.world_ledger.add_historical_tags_to_chunk(chunk, coord)
        
        return chunk
    
    def get_location(self, location_id: str) -> Optional[Room]:
        """
        Get a Room object from location template.
        
        Args:
            location_id: Template identifier
            
        Returns:
            Room object or None if not found
        """
        # Define location templates inline for now
        templates = {
            "tavern": LocationTemplate(
                name="The Rusty Flagon",
                description="A dimly lit tavern filled with the smell of ale and roasted meat. Rowdy patrons fill the wooden tables.",
                environment_tags=["Sticky Floors", "Rowdy Crowd", "Dimly Lit"],
                initial_npcs=["Bartender", "Guard"],
                props=["wooden table", "beer mug", "chair"],
                connections={"north": "town_square", "east": "alley"}
            ),
            "town_square": LocationTemplate(
                name="Town Square",
                description="A bustling town square with a fountain in the center. Merchants hawk their wares from colorful stalls.",
                environment_tags=["Crowded", "Noisy", "Open Space"],
                initial_npcs=["Merchant", "Town Crier"],
                props=["fountain", "market stall", "notice board"],
                connections={"south": "tavern", "west": "temple", "east": "market"}
            ),
            "alley": LocationTemplate(
                name="Dark Alley",
                description="A narrow, shadowy alley between buildings. The air smells of refuse and damp stone.",
                environment_tags=["Dimly Lit", "Confined", "Hidden"],
                initial_npcs=["Thug"],
                props=["dumpster", "broken crate", "graffiti"],
                connections={"west": "tavern", "north": "rooftop"}
            ),
            "temple": LocationTemplate(
                name="Temple of Wisdom",
                description="A serene temple with high vaulted ceilings. Sunlight streams through stained glass windows.",
                environment_tags=["Quiet", "Sacred", "Well-lit"],
                initial_npcs=["Priest", "Acolyte"],
                props=["altar", "candles", "holy book"],
                connections={"east": "town_square", "north": "crypt"}
            ),
            "dungeon_entrance": LocationTemplate(
                name="Dungeon Entrance",
                description="A heavy stone doorway leads into darkness below. Ancient runes are carved into the archway.",
                environment_tags=["Dark", "Damp", "Ancient"],
                initial_npcs=["Doorwarden"],
                props=["iron door", "torch sconce", "runic inscription"],
                connections={"up": "surface", "down": "dungeon_hall"}
            ),
            "dungeon_hall": LocationTemplate(
                name="Dungeon Hall",
                description="A long stone hallway with dripping water echoing in the distance. Cobwebs hang from the ceiling.",
                environment_tags=["Dark", "Echoing", "Confined"],
                initial_npcs=["Skeleton Guard"],
                props=["stone pillar", "rusty chains", "bones"],
                connections={"up": "dungeon_entrance", "east": "treasure_room", "west": "cell_block"}
            ),
            "forest_path": LocationTemplate(
                name="Forest Path",
                description="A winding path through dense forest. Sunlight filters through the canopy above.",
                environment_tags=["Natural", "Cover", "Uneven Ground"],
                initial_npcs=["Forest Ranger"],
                props=["ancient tree", "mossy rock", "bird nest"],
                connections={"north": "clearing", "south": "cave_entrance"}
            ),
            "clearing": LocationTemplate(
                name="Forest Clearing",
                description="An open clearing in the forest surrounded by tall trees. A small stream bubbles nearby.",
                environment_tags=["Open", "Natural", "Peaceful"],
                initial_npcs=["Hermit"],
                props=["campfire", "cooking pot", "bedroll"],
                connections={"south": "forest_path", "east": "ruins"}
            )
        }
        
        template = templates.get(location_id)
        if not template:
            logger.warning(f"Location template not found: {location_id}")
            return None
        
        # Create NPCs
        npcs = []
        for npc_name in template.initial_npcs:
            npcs.append(NPC(name=npc_name))
        
        # Create Room
        room = Room(
            name=template.name,
            description=template.description,
            npcs=npcs,
            items=template.props,
            exits=template.connections,
            tags=template.environment_tags
        )
        
        return room
    
    def _load_scenarios(self) -> Dict[str, Dict]:
        """Load pre-configured scenario blueprints."""
        return {
            "heist": {
                "act_name": "The Silent Heist",
                "sequence": [
                    {
                        "id": "tavern",
                        "name": "The Rusty Flagon",
                        "description": "A dimly lit tavern where you meet your contact.",
                        "tags": ["Sticky Floors", "Rowdy Crowd"],
                        "npcs": [
                            {"name": "Bartender", "description": "A burly man who knows things"},
                            {"name": "Shadow Contact", "description": "A mysterious figure in the corner"}
                        ],
                        "objectives": [
                            {"id": "meet_contact", "description": "Meet with the shadow contact", "required_intent": "charm", "target_tags": ["contact"]}
                        ]
                    },
                    {
                        "id": "alley",
                        "name": "Planning Alley",
                        "description": "A dark alley perfect for planning the heist.",
                        "tags": ["Dimly Lit", "Hidden"],
                        "npcs": [
                            {"name": "Shadow Contact", "description": "Your contact with the plan"}
                        ],
                        "objectives": [
                            {"id": "get_plan", "description": "Learn the heist details", "required_intent": "investigate", "target_tags": ["plan"]}
                        ]
                    },
                    {
                        "id": "target_house",
                        "name": "Target Estate",
                        "description": "The wealthy merchant's estate you're targeting.",
                        "tags": ["Well-guarded", "Locked"],
                        "npcs": [
                            {"name": "Guard", "description": "A vigilant guard protecting the estate"}
                        ],
                        "objectives": [
                            {"id": "infiltrate", "description": "Gain entry to the estate", "required_intent": "stealth"},
                            {"id": "secure_loot", "description": "Find and secure the treasure", "required_intent": "investigate", "target_tags": ["treasure"]}
                        ]
                    }
                ]
            },
            
            "peace": {
                "act_name": "The Diplomatic Mission",
                "sequence": [
                    {
                        "id": "temple",
                        "name": "Temple of Wisdom",
                        "description": "A sacred temple where negotiations begin.",
                        "tags": ["Quiet", "Sacred"],
                        "npcs": [
                            {"name": "High Priest", "description": "Leader of the temple council"},
                            {"name": "Temple Guard", "description": "A solemn guardian of the sacred space"}
                        ],
                        "objectives": [
                            {"id": "audience", "description": "Request audience with the High Priest", "required_intent": "charm", "target_tags": ["priest"]}
                        ]
                    },
                    {
                        "id": "town_square",
                        "name": "Town Square",
                        "description": "The public square where tensions run high.",
                        "tags": ["Crowded", "Tense"],
                        "npcs": [
                            {"name": "Angry Mob", "description": "Citizens demanding justice"},
                            {"name": "Town Crier", "description": "Spreading news through the square"}
                        ],
                        "objectives": [
                            {"id": "calm_crowd", "description": "Address the crowd's concerns", "required_intent": "charm", "target_tags": ["mob"]}
                        ]
                    }
                ]
            }
        }
    
    def load_scenario(self, scenario_id: str, game_state: GameState):
        """
        Load a scenario blueprint into the game state.
        
        Args:
            scenario_id: Scenario identifier
            game_state: Game state to modify
        """
        scenario = self.scenarios.get(scenario_id)
        if not scenario:
            logger.error(f"Scenario not found: {scenario_id}")
            return
        
        logger.info(f"Loading scenario: {scenario.get('act_name', 'Unnamed')}")
        
        sequence = scenario.get("sequence", [])
        for i, entry in enumerate(sequence):
            loc_id = entry["id"]
            
            # Create linear exits
            exits = {}
            if i < len(sequence) - 1:
                exits["forward"] = sequence[i + 1]["id"]
            if i > 0:
                exits["back"] = sequence[i - 1]["id"]
            
            # Create NPCs
            npcs = []
            for n_def in entry.get("npcs", []):
                npcs.append(NPC(name=n_def["name"], description=n_def["description"]))
            
            # Create Room
            room = Room(
                name=entry["name"],
                description=entry["description"],
                npcs=npcs,
                tags=entry["tags"],
                exits=exits
            )
            
            game_state.rooms[loc_id] = room
            
            # Generate goals from objectives
            for obj_def in entry.get("objectives", []):
                from objective_factory import create_goal_from_blueprint
                goal = create_goal_from_blueprint(obj_def)
                game_state.goal_stack.append(goal)
        
        # Set starting location
        if sequence:
            game_state.current_room = sequence[0]["id"]
    
    def persist_social_graph(self, old_location: str, new_location: str, game_state: GameState):
        """
        Handle social graph persistence during room transitions.
        
        Args:
            old_location: Previous location ID
            new_location: New location ID  
            game_state: Game state containing social graph
        """
        # Social graph is already location-scoped in GameState
        # This method exists for future enhancement if needed
        logger.debug(f"Social graph persisted from {old_location} to {new_location}")
    
    def generate_dynamic_location(self, environment_type: str, location_id: str) -> Room:
        """
        Generate a location dynamically based on environment type.
        
        Args:
            environment_type: "urban", "dungeon", or "wilderness"
            location_id: Unique identifier for the location
            
        Returns:
            Generated Room object
        """
        # This is a placeholder for future procedural generation
        # For now, return a basic room
        return Room(
            name=f"Generated {environment_type.title()} Location",
            description=f"A procedurally generated {environment_type} location.",
            tags=[environment_type],
            exits={},
            npcs=[],
            items=[]
        )


# Export for use by engine
__all__ = ["WorldFactory"]
