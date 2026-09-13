"""
Chronos Engine - The Quest & Progression Pillar

The fifth and final pillar that acts as the Dungeon Master for the RPG Core.
Manages quest logic, character progression, and task coordination between
the Voyager and the World Engine.

Key Features:
- Quest Stack with priority-based task management
- Character progression (XP, levels, inventory)
- Fact Engine for knowledge tracking
- Task spawner integration with World Engine chunks
- Deterministic persistence for procedural side quests
"""

import time
import asyncio
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
from collections import deque
import random

from loguru import logger

from engines.kernel.state import (
    GameState, InterestPoint, validate_position, BiomeType, InterestType
)
from engines.kernel.config import ChronosConfig, SystemConfig
from narrative.persona import PersonaEngine, FactionType


class QuestType(Enum):
    """Types of quests in the system"""
    MAIN_THREAD = "main_thread"  # Persistent, seed-based landmarks
    SIDE_TASK = "side_task"      # Volatile, chunk-generated tasks
    EVENT = "event"             # Time-limited occurrences
    DISCOVERY = "discovery"     # Interest Point triggered


class QuestStatus(Enum):
    """Quest status states"""
    AVAILABLE = "available"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class TaskPriority(Enum):
    """Quest priority levels"""
    CRITICAL = 0    # Main quest always takes priority
    HIGH = 1
    MEDIUM = 2
    LOW = 3


@dataclass
class Quest:
    """Individual quest or task"""
    quest_id: str
    title: str
    description: str
    quest_type: QuestType
    status: QuestStatus = QuestStatus.AVAILABLE
    priority: TaskPriority = TaskPriority.MEDIUM
    target_position: Optional[Tuple[int, int]] = None
    required_level: int = 1
    rewards: Dict[str, Any] = field(default_factory=dict)
    requirements: Dict[str, Any] = field(default_factory=dict)
    time_limit: Optional[float] = None
    chunk_seed: Optional[str] = None  # For procedural persistence
    created_time: float = field(default_factory=time.time)
    started_time: Optional[float] = None
    completed_time: Optional[float] = None
    
    def is_expired(self) -> bool:
        """Check if quest has expired"""
        if self.time_limit is None or self.started_time is None:
            return False
        return time.time() - self.started_time > self.time_limit
    
    def can_accept(self, character_level: int) -> bool:
        """Check if character can accept this quest"""
        return (self.status == QuestStatus.AVAILABLE and 
                character_level >= self.required_level and
                not self.is_expired())


@dataclass
class CharacterStats:
    """Character progression and statistics"""
    level: int = 1
    experience: int = 0
    experience_to_next: int = 100
    health: int = 100
    max_health: int = 100
    mana: int = 50
    max_mana: int = 50
    
    # Core stats
    strength: int = 10
    dexterity: int = 10
    intelligence: int = 10
    wisdom: int = 10
    
    def add_experience(self, amount: int) -> bool:
        """Add experience and handle level ups"""
        self.experience += amount
        
        while self.experience >= self.experience_to_next:
            self.experience -= self.experience_to_next
            return self.level_up()
        
        return False
    
    def level_up(self) -> bool:
        """Level up character"""
        self.level += 1
        self.experience_to_next = int(self.experience_to_next * 1.5)
        
        # Increase stats
        self.max_health += 10
        self.health = self.max_health
        self.max_mana += 5
        self.mana = self.max_mana
        
        # Random stat increases
        self.strength += random.randint(0, 2)
        self.dexterity += random.randint(0, 2)
        self.intelligence += random.randint(0, 2)
        self.wisdom += random.randint(0, 2)
        
        logger.info(f"⬆️ Character leveled up to {self.level}")
        return True


@dataclass
class Fact:
    """Knowledge entry about world interactions"""
    fact_id: str
    subject: str
    relationship: str
    object: str
    context: Dict[str, Any] = field(default_factory=dict)
    discovered_time: float = field(default_factory=time.time)
    importance: float = 1.0  # 0.0 to 1.0


class QuestStack:
    """Priority-based quest management system"""
    
    def __init__(self):
        self.quests: Dict[str, Quest] = {}
        self.active_quest: Optional[str] = None
        self.completed_quests: List[str] = []
        
    def add_quest(self, quest: Quest) -> bool:
        """Add quest to stack"""
        if quest.quest_id in self.quests:
            logger.warning(f"⚠️ Quest {quest.quest_id} already exists")
            return False
        
        self.quests[quest.quest_id] = quest
        logger.info(f"📜 Quest added: {quest.title}")
        return True
    
    def get_highest_priority_quest(self, character_level: int) -> Optional[Quest]:
        """Get highest priority available quest"""
        available_quests = [
            quest for quest in self.quests.values()
            if quest.can_accept(character_level)
        ]
        
        if not available_quests:
            return None
        
        # Sort by priority (lower number = higher priority)
        available_quests.sort(key=lambda q: q.priority.value)
        return available_quests[0]
    
    def activate_quest(self, quest_id: str, character_level: int) -> bool:
        """Activate a quest"""
        if quest_id not in self.quests:
            return False
        
        quest = self.quests[quest_id]
        if not quest.can_accept(character_level):
            return False
        
        quest.status = QuestStatus.ACTIVE
        quest.started_time = time.time()
        self.active_quest = quest_id
        
        logger.info(f"🎯 Quest activated: {quest.title}")
        return True
    
    def complete_quest(self, quest_id: str, rewards: Optional[Dict[str, Any]] = None) -> bool:
        """Complete a quest"""
        if quest_id not in self.quests:
            return False
        
        quest = self.quests[quest_id]
        quest.status = QuestStatus.COMPLETED
        quest.completed_time = time.time()
        
        if rewards:
            quest.rewards.update(rewards)
        
        self.completed_quests.append(quest_id)
        if self.active_quest == quest_id:
            self.active_quest = None
        
        logger.info(f"✅ Quest completed: {quest.title}")
        return True
    
    def get_current_objective(self) -> Optional[Tuple[int, int]]:
        """Get current active quest objective position"""
        if not self.active_quest or self.active_quest not in self.quests:
            return None
        
        quest = self.quests[self.active_quest]
        return quest.target_position


class FactEngine:
    """Knowledge tracking system"""
    
    def __init__(self):
        self.facts: Dict[str, Fact] = {}
        self.relationships: Dict[str, List[str]] = {}
    
    def add_fact(self, fact: Fact) -> bool:
        """Add a fact to the knowledge base"""
        if fact.fact_id in self.facts:
            return False
        
        self.facts[fact.fact_id] = fact
        
        # Update relationship graph
        subject_key = f"{fact.subject}_{fact.relationship}"
        if subject_key not in self.relationships:
            self.relationships[subject_key] = []
        self.relationships[subject_key].append(fact.object)
        
        logger.debug(f"🧠 Fact learned: {fact.subject} {fact.relationship} {fact.object}")
        return True
    
    def get_facts_about(self, subject: str) -> List[Fact]:
        """Get all facts about a subject"""
        return [fact for fact in self.facts.values() if fact.subject == subject]
    
    def knows_about(self, subject: str, relationship: str = None) -> bool:
        """Check if character knows about a subject/relationship"""
        if relationship:
            key = f"{subject}_{relationship}"
            return key in self.relationships
        else:
            return any(fact.subject == subject for fact in self.facts.values())


class ChronosEngine:
    """Quest & Progression Engine - The Dungeon Master Pillar"""
    
    def __init__(self, config: Optional[ChronosConfig] = None):
        self.config = config or ChronosConfig(seed="DEFAULT")
        self.quest_stack = QuestStack()
        self.character_stats = CharacterStats()
        self.fact_engine = FactEngine()
        
        # Persona Engine reference for NPC interactions
        self.persona_engine: Optional[PersonaEngine] = None
        self.world_engine = None  # Will be set via dependency injection
        
        # Task generation settings
        self.task_spawn_chance = 0.05  # 5% chance per chunk
        self.max_active_tasks = self.config.max_active_quests
        
        # Quest generation
        self.quest_templates = self._initialize_quest_templates()
        self.biome_quest_rules = self._initialize_biome_quest_rules()
        
        # Timing
        self.last_update_time = time.time()
        self.last_quest_generation = time.time()
        
        # Seed-based random generator
        self.random = random.Random(self.config.seed)
        
        logger.info(f"⏳ Chronos Engine initialized with seed: {self.config.seed}")
    
    # === FACADE INTERFACE ===
    
    async def get_current_objective(self) -> Optional[Tuple[int, int]]:
        """Get current highest priority objective position (Facade method)"""
        return self.quest_stack.get_current_objective()
    
    async def should_accept_quest(self, quest_id: str) -> bool:
        """Check if quest should be accepted (Facade method)"""
        if quest_id not in self.quest_stack.quests:
            return False
        
        quest = self.quest_stack.quests[quest_id]
        return quest.can_accept(self.character_stats.level)
    
    async def accept_quest(self, quest_id: str) -> bool:
        """Accept and activate a quest (Facade method)"""
        return self.quest_stack.activate_quest(quest_id, self.character_stats.level)
    
    async def complete_quest(self, quest_id: str, rewards: Optional[Dict[str, Any]] = None) -> bool:
        """Complete a quest and apply rewards (Facade method)"""
        if not self.quest_stack.complete_quest(quest_id, rewards):
            return False
        
        # Apply rewards to character
        if rewards:
            await self._apply_rewards(rewards)
        
        return True
    
    async def add_procedural_task(self, chunk_position: Tuple[int, int], chunk_seed: str) -> Optional[Quest]:
        """Add procedural task from chunk generation (Facade method)"""
        # Roll task spawn die
        if random.random() > self.task_spawn_chance:
            return None
        
        # Check task limit
        active_tasks = len([q for q in self.quest_stack.quests.values() 
                           if q.quest_type == QuestType.SIDE_TASK and q.status == QuestStatus.AVAILABLE])
        if active_tasks >= self.max_active_tasks:
            return None
        
        # Generate task
        task = await self._generate_procedural_task(chunk_position, chunk_seed)
        if task and self.quest_stack.add_quest(task):
            return task
        
        return None
    
    async def generate_npc_quest(self, npc_position: Tuple[int, int], quest_giver_type: str = "innkeeper") -> Optional[Quest]:
        """Generate quest from NPC interaction (Persona Bridge)"""
        if not self.persona_engine:
            return None
        
        # Get NPC at position
        npc = self.persona_engine.npc_registry.get_npc_at_position(npc_position)
        if not npc:
            return None
        
        # Get social response
        social_response = await self.persona_engine.get_social_response(npc.npc_id)
        willingness = social_response.get("will_help", 0.0)
        
        # Generate quest based on willingness and personality
        if willingness > 0.3:  # Willing to give quest
            quest_id = f"npc_quest_{npc.npc_id}_{int(time.time())}"
            
            # Select quest template based on NPC type
            templates = self.quest_templates.get("npc_quests", [])
            if templates:
                template = random.choice(templates)
                
                quest = Quest(
                    quest_id=quest_id,
                    title=f"{npc.personality.name}'s {template['title']}",
                    description=template['description'].format(name=npc.personality.name),
                    quest_type=QuestType.SIDE_TASK,
                    priority=TaskPriority.MEDIUM,
                    target_position=npc_position,
                    required_level=1,
                    rewards={
                        "experience": template.get("experience", 25),
                        "faction_standing": {
                            npc.personality.primary_faction.value: 5.0
                        }
                    }
                )
                
                if self.quest_stack.add_quest(quest):
                    logger.info(f"📜 NPC quest generated: {quest.title} from {npc.personality.name}")
                    return quest
        
        return None
    
    async def update_character_position(self, position: Tuple[int, int]) -> None:
        """Update character position and check for quest progress (Facade method)"""
        # Check if current quest objective reached
        current_objective = await self.get_current_objective()
        if current_objective and current_objective == position:
            await self._handle_objective_reached()
        
        # Update facts about location
        await self._update_location_facts(position)
    
    def get_character_stats(self) -> CharacterStats:
        """Get current character statistics (Facade method)"""
        return self.character_stats
    
    def get_active_quests(self) -> List[Quest]:
        """Get all active quests (Facade method)"""
        return [q for q in self.quest_stack.quests.values() if q.status == QuestStatus.ACTIVE]
    
    def get_available_quests(self) -> List[Quest]:
        """Get all available quests (Facade method)"""
        return [q for q in self.quest_stack.quests.values() 
                if q.can_accept(self.character_stats.level)]
    
    # === INTERNAL METHODS ===
    
    async def _apply_rewards(self, rewards: Dict[str, Any]) -> None:
        """Apply quest rewards to character"""
        if "experience" in rewards:
            leveled_up = self.character_stats.add_experience(rewards["experience"])
            if leveled_up:
                logger.info(f"🎉 Level up! Now level {self.character_stats.level}")
        
        if "health" in rewards:
            self.character_stats.health = min(
                self.character_stats.health + rewards["health"],
                self.character_stats.max_health
            )
        
        if "mana" in rewards:
            self.character_stats.mana = min(
                self.character_stats.mana + rewards["mana"],
                self.character_stats.max_mana
            )
        
        # Add fact about quest completion
        fact = Fact(
            fact_id=f"quest_completed_{int(time.time())}",
            subject="character",
            relationship="completed",
            object=f"quest_{self.quest_stack.active_quest}",
            importance=0.8
        )
        self.fact_engine.add_fact(fact)
    
    async def _handle_objective_reached(self) -> None:
        """Handle reaching current quest objective"""
        if not self.quest_stack.active_quest:
            return
        
        quest_id = self.quest_stack.active_quest
        quest = self.quest_stack.quests[quest_id]
        
        # Auto-complete simple location quests
        if quest.quest_type in [QuestType.MAIN_THREAD, QuestType.DISCOVERY]:
            rewards = {"experience": 50, "health": 20}
            await self.complete_quest(quest_id, rewards)
    
    async def _update_location_facts(self, position: Tuple[int, int]) -> None:
        """Update knowledge about visited locations"""
        fact_id = f"visited_{position[0]}_{position[1]}"
        if fact_id not in self.fact_engine.facts:
            fact = Fact(
                fact_id=fact_id,
                subject="character",
                relationship="visited",
                object=f"location_{position[0]}_{position[1]}",
                importance=0.3
            )
            self.fact_engine.add_fact(fact)
    
    async def _generate_procedural_task(self, chunk_position: Tuple[int, int], chunk_seed: str) -> Optional[Quest]:
        """Generate procedural side task for chunk"""
        # Use chunk seed for deterministic generation
        random.seed(f"{chunk_seed}_{chunk_position}")
        
        template = random.choice(self.quest_templates["side_tasks"])
        
        quest_id = f"task_{chunk_position[0]}_{chunk_position[1]}_{int(time.time())}"
        
        quest = Quest(
            quest_id=quest_id,
            title=template["title"],
            description=template["description"],
            quest_type=QuestType.SIDE_TASK,
            priority=TaskPriority.LOW,
            target_position=chunk_position,
            chunk_seed=chunk_seed,
            time_limit=300.0  # 5 minutes for side tasks
        )
        
        return quest
    
    def set_persona_engine(self, persona_engine: PersonaEngine) -> None:
        """Inject Persona Engine dependency for NPC interactions"""
        self.persona_engine = persona_engine
        logger.info("⏳ Persona Engine dependency injected for NPC quests")
    
    def set_world_engine(self, world_engine) -> None:
        """Inject World Engine dependency for interest point scanning"""
        self.world_engine = world_engine
        logger.info("⏳ World Engine dependency injected for objective generation")
    
    def _initialize_biome_quest_rules(self) -> Dict[BiomeType, List[str]]:
        """Initialize biome-based quest generation rules"""
        return {
            BiomeType.FOREST: [
                "gather_herbs", "hunt_creatures", "explore_ruins", "find_lost_path"
            ],
            BiomeType.TAVERN: [
                "speak_to_informant", "buy_drinks", "listen_to_rumors", "meet_mysterious_stranger"
            ],
            BiomeType.TOWN: [
                "visit_market", "meet_guild_master", "attend_town_meeting", "deliver_package"
            ],
            BiomeType.MOUNTAIN: [
                "climb_peak", "explore_cave", "find_minerals", "track_creature"
            ],
            BiomeType.DESERT: [
                "find_oasis", "explore_ruins", "follow_caravan", "survive_storm"
            ]
        }
    
    async def scan_world_for_objectives(self) -> List[Quest]:
        """Scan World Engine for high-value coordinates and generate quests"""
        if not self.world_engine:
            logger.warning("⚠️ World Engine not available for objective scanning")
            return []
        
        generated_quests = []
        
        try:
            # Get interest points from World Engine
            interest_points = await self.world_engine.get_interest_points()
            
            for ip in interest_points:
                # Skip if we already have a quest for this location
                if self._has_quest_at_position(ip.position):
                    continue
                
                # Generate biome-appropriate quest
                quest = await self._generate_biome_quest(ip)
                if quest:
                    generated_quests.append(quest)
                    self.quest_stack.add_quest(quest)
                    logger.info(f"🎯 Generated quest: {quest.title} at {ip.position}")
            
        except Exception as e:
            logger.error(f"💥 Failed to scan world for objectives: {e}")
        
        return generated_quests
    
    async def _generate_biome_quest(self, interest_point: InterestPoint) -> Optional[Quest]:
        """Generate a biome-appropriate quest for an interest point"""
        # Get tile at interest point to determine biome
        if not self.world_engine:
            return None
        
        try:
            tile = await self.world_engine.get_tile_at(interest_point.position)
            biome = tile.biome
            
            # Get quest types for this biome
            quest_types = self.biome_quest_rules.get(biome, ["explore"])
            quest_type = self.random.choice(quest_types)
            
            # Generate quest based on type and interest point
            quest_id = f"quest_{interest_point.position[0]}_{interest_point.position[1]}_{int(time.time())}"
            
            title, description = self._generate_quest_content(quest_type, interest_point)
            
            quest = Quest(
                quest_id=quest_id,
                title=title,
                description=description,
                quest_type=QuestType.DISCOVERY,
                priority=TaskPriority.MEDIUM,
                target_position=interest_point.position,
                time_limit=self.config.quest_timeout_seconds
            )
            
            return quest
            
        except Exception as e:
            logger.error(f"💥 Failed to generate biome quest: {e}")
            return None
    
    def _generate_quest_content(self, quest_type: str, interest_point: InterestPoint) -> Tuple[str, str]:
        """Generate title and description based on quest type and interest point"""
        content_templates = {
            "gather_herbs": (
                f"Gather Herbs at {interest_point.position}",
                f"Collect valuable herbs from the area around {interest_point.position}. The local alchemist needs them for potions."
            ),
            "speak_to_informant": (
                f"Meet Informant at {interest_point.position}",
                f"A mysterious informant has information at {interest_point.position}. Seek them out for valuable rumors."
            ),
            "explore_ruins": (
                f"Explore Ruins at {interest_point.position}",
                f"Ancient ruins at {interest_point.position} may contain valuable artifacts and knowledge."
            ),
            "visit_market": (
                f"Visit Market at {interest_point.position}",
                f"The market at {interest_point.position} has rare goods and potential trading opportunities."
            ),
            "climb_peak": (
                f"Climb Peak at {interest_point.position}",
                f"The peak at {interest_point.position} offers a commanding view and may hide ancient secrets."
            ),
            "find_oasis": (
                f"Find Oasis at {interest_point.position}",
                f"An oasis at {interest_point.position} provides refuge in the harsh desert."
            )
        }
        
        return content_templates.get(quest_type, (
            f"Explore {interest_point.position}",
            f"Discover what lies at {interest_point.position}."
        ))
    
    def _has_quest_at_position(self, position: Tuple[int, int]) -> bool:
        """Check if there's already a quest for this position"""
        for quest in self.quest_stack.quests.values():
            if quest.target_position == position:
                return True
        return False
    
    async def update_procedural_quests(self) -> None:
        """Periodically generate new procedural quests"""
        if not self.config.enable_procedural_quests:
            return
        
        current_time = time.time()
        if current_time - self.last_quest_generation < self.config.quest_generation_interval:
            return
        
        # Generate new quests from world interest points
        await self.scan_world_for_objectives()
        self.last_quest_generation = current_time
    
    def _initialize_quest_templates(self) -> Dict[str, List[Dict[str, str]]]:
        """Initialize quest templates for procedural generation"""
        return {
            "side_tasks": [
                {
                    "title": "Lost Item Recovery",
                    "description": "A traveler lost their valuable item nearby."
                },
                {
                    "title": "Herb Collection",
                    "description": "Local healer needs medicinal herbs from this area."
                },
                {
                    "title": "Creature Disturbance",
                    "description": "Strange creatures have been causing trouble."
                },
                {
                    "title": "Missing Person",
                    "description": "Someone went missing in this vicinity."
                },
                {
                    "title": "Ancient Relic",
                    "description": "Rumors of an ancient relic hidden nearby."
                }
            ],
            "npc_quests": [
                {
                    "title": "Cellar Cleanup",
                    "description": "{name} needs help clearing out rats from the cellar.",
                    "experience": 30
                },
                {
                    "title": "Delivery Service",
                    "description": "{name} needs a package delivered to the town square.",
                    "experience": 25
                },
                {
                    "title": "Information Gathering",
                    "description": "{name} wants to know what's happening outside town.",
                    "experience": 20
                },
                {
                    "title": "Guard Duty",
                    "description": "{name} needs someone to watch the entrance for a while.",
                    "experience": 35
                }
            ]
        }
    
    # === QUEST MANAGEMENT ===
    
    def initialize_main_quest(self, quest_positions: List[Tuple[int, int]]) -> None:
        """Initialize main thread quest with seed-based positions"""
        main_quest = Quest(
            quest_id="main_quest_tavern",
            title="The Tavern Mystery",
            description="Investigate the strange occurrences at the tavern.",
            quest_type=QuestType.MAIN_THREAD,
            priority=TaskPriority.CRITICAL,
            target_position=quest_positions[0] if quest_positions else (10, 25),
            required_level=1
        )
        
        self.quest_stack.add_quest(main_quest)
        logger.info("🏰 Main quest initialized: The Tavern Mystery")


# === FACTORY ===

class ChronosEngineFactory:
    """Factory for creating Chronos Engine instances"""
    
    @staticmethod
    def create_engine(config: Optional[ChronosConfig] = None) -> ChronosEngine:
        """Create a Chronos Engine with configuration"""
        return ChronosEngine(config)
    
    @staticmethod
    def create_test_engine() -> ChronosEngine:
        """Create a Chronos Engine for testing"""
        config = ChronosConfig(seed="TEST")
        config.quest_generation_interval = 5.0  # Faster generation for testing
        config.max_active_quests = 3
        return ChronosEngine(config)


# === SYNCHRONOUS WRAPPER ===

class ChronosEngineSync:
    """Synchronous wrapper for Chronos Engine (for compatibility)"""
    
    def __init__(self, chronos_engine: ChronosEngine):
        self.chronos_engine = chronos_engine
        self._loop = asyncio.new_event_loop()
    
    def get_current_objective(self) -> Optional[Tuple[int, int]]:
        """Synchronous get_current_objective"""
        return self._loop.run_until_complete(
            self.chronos_engine.get_current_objective()
        )
    
    def accept_quest(self, quest_id: str) -> bool:
        """Synchronous accept_quest"""
        return self._loop.run_until_complete(
            self.chronos_engine.accept_quest(quest_id)
        )
    
    def complete_quest(self, quest_id: str, rewards: Optional[Dict[str, Any]] = None) -> bool:
        """Synchronous complete_quest"""
        return self._loop.run_until_complete(
            self.chronos_engine.complete_quest(quest_id, rewards)
        )
