"""
Persona Engine - The Social Soul Pillar

The sixth and final pillar that manages all non-player entities,
their behaviors, faction relationships, and social interactions.
This turns static quest markers into living NPCs with persistent
social memory and deterministic personality traits.

Key Features:
- NPC Registry with deterministic personality generation
- Faction Standing system for group relationships
- Social Delta persistence for emotional states
- Daily routines and mood variations
- LLM integration for dialogue generation
- Meta-sprite data for visual representation
"""

import time
import asyncio
import hashlib
import random
from typing import Dict, List, Tuple, Optional, Any, Set
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict

from loguru import logger

from dgt_engine.systems.kernel.state.validation import validate_position


class PersonalityTrait(Enum):
    """Core personality traits for NPCs"""
    FRIENDLY = "friendly"
    HOSTILE = "hostile"
    NEUTRAL = "neutral"
    CURIOUS = "curious"
    CAUTIOUS = "cautious"
    GREEDY = "greedy"
    GENEROUS = "generous"
    HONEST = "honest"
    DECEITFUL = "deceitful"
    BRAVE = "brave"
    COWARDLY = "cowardly"


class FactionType(Enum):
    """Major factions in the world"""
    PLAYER = "player"
    TOWN = "town"
    GUARD = "guard"
    MERCHANT = "merchant"
    CULTIST = "cultist"
    GOBLIN = "goblin"
    BANDIT = "bandit"
    NOBLE = "noble"
    PEASANT = "peasant"
    MYSTIC = "mystic"


class SocialRelation(Enum):
    """Types of social relationships"""
    ALLIED = "allied"      # +100 standing
    FRIENDLY = "friendly"  # +50 standing
    NEUTRAL = "neutral"    # 0 standing
    SUSPICIOUS = "suspicious"  # -25 standing
    HOSTILE = "hostile"    # -50 standing
    ENEMY = "enemy"        # -100 standing


class MoodState(Enum):
    """Current emotional states"""
    HAPPY = "happy"
    CONTENT = "content"
    NEUTRAL = "neutral"
    ANNOYED = "annoyed"
    ANGRY = "angry"
    FEARFUL = "fearful"
    EXCITED = "excited"
    WORRIED = "worried"
    SAD = "sad"


@dataclass
class PersonalityProfile:
    """Deterministic personality profile for NPCs"""
    name: str
    base_traits: List[PersonalityTrait]
    primary_faction: FactionType
    confidence: float = 0.5  # 0.0 to 1.0
    talkativeness: float = 0.5  # 0.0 to 1.0
    generosity: float = 0.5  # 0.0 to 1.0
    courage: float = 0.5  # 0.0 to 1.0
    tags: Set[str] = field(default_factory=set)  # Quest and behavior tags
    
    def add_tag(self, tag: str) -> None:
        """Add tag to personality"""
        self.tags.add(tag)
    
    def has_tag(self, tag: str) -> bool:
        """Check if personality has tag"""
        return tag in self.tags
    
    def remove_tag(self, tag: str) -> None:
        """Remove tag from personality"""
        self.tags.discard(tag)
    
    def get_trait_value(self, trait: PersonalityTrait) -> float:
        """Get numerical value for a trait"""
        trait_values = {
            PersonalityTrait.FRIENDLY: 0.8,
            PersonalityTrait.HOSTILE: -0.8,
            PersonalityTrait.NEUTRAL: 0.0,
            PersonalityTrait.CURIOUS: 0.6,
            PersonalityTrait.CAUTIOUS: -0.3,
            PersonalityTrait.GREEDY: -0.4,
            PersonalityTrait.GENEROUS: 0.7,
            PersonalityTrait.HONEST: 0.9,
            PersonalityTrait.DECEITFUL: -0.7,
            PersonalityTrait.BRAVE: 0.8,
            PersonalityTrait.COWARDLY: -0.6
        }
        return trait_values.get(trait, 0.0)


@dataclass
class SocialState:
    """Current social and emotional state"""
    current_mood: MoodState = MoodState.NEUTRAL
    mood_intensity: float = 0.5  # 0.0 to 1.0
    last_interaction_time: float = field(default_factory=time.time)
    interaction_count: int = 0
    trust_level: float = 0.5  # 0.0 to 1.0
    
    def update_mood(self, new_mood: MoodState, intensity: float = 0.5):
        """Update mood with intensity"""
        self.current_mood = new_mood
        self.mood_intensity = intensity
        self.last_interaction_time = time.time()
        self.interaction_count += 1
    
    def decay_mood(self, decay_rate: float = 0.1):
        """Gradually return to neutral mood over time"""
        if self.current_mood != MoodState.NEUTRAL:
            time_since_interaction = time.time() - self.last_interaction_time
            if time_since_interaction > 300:  # 5 minutes
                self.mood_intensity *= (1 - decay_rate)
                if self.mood_intensity < 0.1:
                    self.current_mood = MoodState.NEUTRAL
                    self.mood_intensity = 0.5


@dataclass
class DailyRoutine:
    """Daily schedule for NPCs"""
    schedule: Dict[int, str] = field(default_factory=dict)  # hour -> activity
    current_activity: str = "idle"
    location_preference: Optional[Tuple[int, int]] = None
    
    def get_current_activity(self) -> str:
        """Get activity based on current time"""
        current_hour = int(time.time() // 3600) % 24
        return self.schedule.get(current_hour, "idle")


@dataclass
class NPC:
    """Non-Player Character with social simulation"""
    npc_id: str
    position: Tuple[int, int]
    personality: PersonalityProfile
    social_state: SocialState = field(default_factory=SocialState)
    daily_routine: DailyRoutine = field(default_factory=DailyRoutine)
    known_facts: Set[str] = field(default_factory=set)
    relationship_memory: Dict[str, float] = field(default_factory=dict)  # entity_id -> standing
    
    # Meta-sprite data for visual representation
    sprite_type: str = "human"
    sprite_color: Tuple[int, int, int] = (128, 128, 128)
    special_features: List[str] = field(default_factory=list)
    
    def get_social_response(self, player_standing: float) -> Tuple[MoodState, float]:
        """Calculate social response based on personality and player standing"""
        # Base response from personality
        base_response = 0.0
        if PersonalityTrait.FRIENDLY in self.personality.base_traits:
            base_response += 0.3
        if PersonalityTrait.HOSTILE in self.personality.base_traits:
            base_response -= 0.3
        if PersonalityTrait.CAUTIOUS in self.personality.base_traits:
            base_response -= 0.1
        
        # Modify by player standing
        total_response = base_response + (player_standing / 100.0)
        
        # Convert to mood
        if total_response > 0.5:
            return MoodState.HAPPY, min(1.0, total_response)
        elif total_response > 0.0:
            return MoodState.CONTENT, total_response + 0.5
        elif total_response > -0.5:
            return MoodState.NEUTRAL, 0.5
        else:
            return MoodState.ANNOYED, abs(total_response)
    
    def remember_interaction(self, entity_id: str, interaction_type: str, impact: float):
        """Remember social interaction with entity"""
        if entity_id not in self.relationship_memory:
            self.relationship_memory[entity_id] = 0.0
        
        self.relationship_memory[entity_id] += impact
        self.relationship_memory[entity_id] = max(-100, min(100, self.relationship_memory[entity_id]))
        
        # Update mood based on interaction
        if impact > 0:
            self.social_state.update_mood(MoodState.HAPPY, impact / 100.0)
        elif impact < -0.5:
            self.social_state.update_mood(MoodState.ANNOYED, abs(impact) / 100.0)


class FactionSystem:
    """Global faction relationship management"""
    
    def __init__(self):
        self.standing: Dict[Tuple[FactionType, FactionType], float] = defaultdict(float)
        self.reputation_history: List[Tuple[str, FactionType, FactionType, float, float]] = []
        
        # Initialize default relationships
        self._initialize_default_relationships()
    
    def _initialize_default_relationships(self):
        """Set up starting faction relationships"""
        # Player starts neutral with most factions
        for faction in FactionType:
            if faction != FactionType.PLAYER:
                self.standing[(FactionType.PLAYER, faction)] = 0.0
        
        # Faction vs faction relationships
        self.standing[(FactionType.TOWN, FactionType.GUARD)] = 50.0
        self.standing[(FactionType.TOWN, FactionType.MERCHANT)] = 25.0
        self.standing[(FactionType.GUARD, FactionType.BANDIT)] = -75.0
        self.standing[(FactionType.TOWN, FactionType.GOBLIN)] = -50.0
        self.standing[(FactionType.CULTIST, FactionType.MYSTIC)] = -100.0
    
    def get_standing(self, faction1: FactionType, faction2: FactionType) -> float:
        """Get standing between two factions"""
        return self.standing.get((faction1, faction2), 0.0)
    
    def modify_standing(self, faction1: FactionType, faction2: FactionType, change: float, reason: str = ""):
        """Modify standing between factions"""
        old_standing = self.get_standing(faction1, faction2)
        new_standing = old_standing + change
        new_standing = max(-100, min(100, new_standing))
        
        self.standing[(faction1, faction2)] = new_standing
        self.standing[(faction2, faction1)] = new_standing  # Symmetric relationships
        
        # Record history
        self.reputation_history.append((
            f"{time.time()}_{faction1.value}_{faction2.value}",
            faction1, faction2, old_standing, new_standing
        ))
        
        logger.info(f"🏛️ Faction standing changed: {faction1.value} ↔ {faction2.value}: {old_standing:.1f} → {new_standing:.1f} ({reason})")
    
    def get_relation_type(self, faction1: FactionType, faction2: FactionType) -> SocialRelation:
        """Get relationship type between factions"""
        standing = self.get_standing(faction1, faction2)
        
        if standing >= 75:
            return SocialRelation.ALLIED
        elif standing >= 25:
            return SocialRelation.FRIENDLY
        elif standing >= -25:
            return SocialRelation.NEUTRAL
        elif standing >= -50:
            return SocialRelation.SUSPICIOUS
        elif standing >= -75:
            return SocialRelation.HOSTILE
        else:
            return SocialRelation.ENEMY


class NPCRegistry:
    """Registry for all NPCs in the world"""
    
    def __init__(self):
        self.npcs: Dict[str, NPC] = {}
        self.position_index: Dict[Tuple[int, int], str] = {}
        self.faction_members: Dict[FactionType, List[str]] = defaultdict(list)
    
    def register_npc(self, npc: NPC) -> bool:
        """Register an NPC in the system"""
        if npc.npc_id in self.npcs:
            logger.warning(f"⚠️ NPC {npc.npc_id} already registered")
            return False
        
        self.npcs[npc.npc_id] = npc
        self.position_index[npc.position] = npc.npc_id
        self.faction_members[npc.personality.primary_faction].append(npc.npc_id)
        
        logger.info(f"👥 NPC registered: {npc.personality.name} at {npc.position}")
        return True
    
    def get_npc_at_position(self, position: Tuple[int, int]) -> Optional[NPC]:
        """Get NPC at specific position"""
        return self.npcs.get(self.position_index.get(position))
    
    def get_npcs_in_radius(self, center: Tuple[int, int], radius: int) -> List[NPC]:
        """Get all NPCs within radius"""
        npcs = []
        for npc in self.npcs.values():
            distance = abs(npc.position[0] - center[0]) + abs(npc.position[1] - center[1])
            if distance <= radius:
                npcs.append(npc)
        return npcs
    
    def get_faction_members(self, faction: FactionType) -> List[NPC]:
        """Get all members of a faction"""
        member_ids = self.faction_members.get(faction, [])
        return [self.npcs[npc_id] for npc_id in member_ids if npc_id in self.npcs]


class PersonaEngine:
    """Social Soul Pillar - NPC Behavior and Faction Management"""
    
    def __init__(self, world_seed: str = "WORLD_SEED"):
        self.world_seed = world_seed
        self.npc_registry = NPCRegistry()
        self.faction_system = FactionSystem()
        
        # Name generation parts
        self.first_names = ["Alaric", "Barnaby", "Cedric", "Dorian", "Eleanor", "Fiona", "Gareth", "Hilda"]
        self.last_names = ["Blackwood", "Copperfield", "Darkmere", "Elderwood", "Fairbreeze", "Goldmane"]
        self.titles = ["Barkeep", "Guard", "Merchant", "Innkeeper", "Scribe", "Captain"]
        
        # Social heartbeat timing
        self.last_social_update = time.time()
        self.social_update_interval = 60.0  # Update every minute
        
        logger.info("👥 Persona Engine initialized - Social Soul ready")
    
    # === FACADE INTERFACE ===
    
    async def generate_npc_at_position(self, position: Tuple[int, int], npc_type: str = "random") -> Optional[NPC]:
        """Generate deterministic NPC at position (Facade method)"""
        if not validate_position(position):
            return None
        
        # Generate deterministic personality from position and world seed
        seed_string = f"{self.world_seed}_npc_{position[0]}_{position[1]}_{npc_type}"
        seed_hash = hashlib.md5(seed_string.encode()).hexdigest()
        
        # Use seed for deterministic generation
        random.seed(seed_hash)
        
        # Generate personality
        personality = self._generate_personality(seed_hash, npc_type)
        
        # Create NPC
        npc_id = f"npc_{position[0]}_{position[1]}_{int(time.time())}"
        npc = NPC(
            npc_id=npc_id,
            position=position,
            personality=personality,
            sprite_type=self._determine_sprite_type(personality.primary_faction),
            sprite_color=self._generate_sprite_color(seed_hash),
            special_features=self._generate_special_features(seed_hash, npc_type)
        )
        
        # Register NPC
        if self.npc_registry.register_npc(npc):
            return npc
        
        return None
    
    async def get_social_response(self, npc_id: str, player_faction: FactionType = FactionType.PLAYER) -> Dict[str, Any]:
        """Get social response from NPC (Facade method)"""
        if npc_id not in self.npc_registry.npcs:
            return {"error": "NPC not found"}
        
        npc = self.npc_registry.npcs[npc_id]
        npc_faction = npc.personality.primary_faction
        
        # Get faction standing
        faction_standing = self.faction_system.get_standing(player_faction, npc_faction)
        
        # Get individual response
        mood, intensity = npc.get_social_response(faction_standing)
        
        return {
            "npc_name": npc.personality.name,
            "mood": mood.value,
            "intensity": intensity,
            "faction_standing": faction_standing,
            "faction_relation": self.faction_system.get_relation_type(player_faction, npc_faction).value,
            "dialogue_tone": self._determine_dialogue_tone(mood, npc.personality),
            "will_help": self._calculate_willingness_to_help(npc, faction_standing)
        }
    
    async def update_social_state(self, npc_id: str, interaction_type: str, impact: float) -> bool:
        """Update NPC social state after interaction (Facade method)"""
        if npc_id not in self.npc_registry.npcs:
            return False
        
        npc = self.npc_registry.npcs[npc_id]
        npc.remember_interaction("player", interaction_type, impact)
        
        # Update faction standing if significant impact
        if abs(impact) > 5.0:
            self.faction_system.modify_standing(
                FactionType.PLAYER, 
                npc.personality.primary_faction, 
                impact / 10.0,  # Scale down faction impact
                f"Interaction with {npc.personality.name}"
            )
        
        return True
    
    async def run_social_heartbeat(self) -> None:
        """Background social state updates (Facade method)"""
        current_time = time.time()
        
        if current_time - self.last_social_update < self.social_update_interval:
            return
        
        # Update all NPC moods (decay toward neutral)
        for npc in self.npc_registry.npcs.values():
            npc.social_state.decay_mood(0.05)
            
            # Update daily routine
            npc.daily_routine.current_activity = npc.daily_routine.get_current_activity()
        
        self.last_social_update = current_time
        logger.debug("👥 Social heartbeat completed")
    
    def get_npcs_in_area(self, center: Tuple[int, int], radius: int) -> List[Dict[str, Any]]:
        """Get NPCs in area for rendering (Facade method)"""
        npcs = self.npc_registry.get_npcs_in_radius(center, radius)
        
        return [
            {
                "npc_id": npc.npc_id,
                "name": npc.personality.name,
                "position": npc.position,
                "sprite_type": npc.sprite_type,
                "sprite_color": npc.sprite_color,
                "special_features": npc.special_features,
                "current_activity": npc.daily_routine.current_activity,
                "mood": npc.social_state.current_mood.value
            }
            for npc in npcs
        ]
    
    # === INTERNAL METHODS ===
    
    def _generate_personality(self, seed_hash: str, npc_type: str) -> PersonalityProfile:
        """Generate deterministic personality from seed"""
        random.seed(seed_hash)
        
        # Generate name
        if npc_type in ["innkeeper", "barkeep"]:
            name = f"{random.choice(self.titles)} {random.choice(self.last_names)}"
        else:
            name = f"{random.choice(self.first_names)} {random.choice(self.last_names)}"
        
        # Select faction based on type
        faction_map = {
            "innkeeper": FactionType.MERCHANT,
            "barkeep": FactionType.MERCHANT,
            "guard": FactionType.GUARD,
            "merchant": FactionType.MERCHANT,
            "patron": FactionType.PEASANT,
            "cultist": FactionType.CULTIST,
            "noble": FactionType.NOBLE
        }
        
        primary_faction = faction_map.get(npc_type, FactionType.PEASANT)
        
        # Generate traits
        all_traits = list(PersonalityTrait)
        num_traits = random.randint(2, 4)
        base_traits = random.sample(all_traits, num_traits)
        
        # Generate stats
        confidence = random.random()
        talkativeness = random.random()
        generosity = random.random()
        courage = random.random()
        
        # Generate tags based on type and traits
        tags = set()
        
        # Type-based tags
        if npc_type in ["innkeeper", "barkeep"]:
            tags.add("local")
            tags.add("service")
        elif npc_type == "guard":
            tags.add("authority")
            tags.add("lawful")
        elif npc_type == "merchant":
            tags.add("trader")
            tags.add("wealthy")
        
        # Trait-based tags
        if PersonalityTrait.GREEDY in base_traits:
            tags.add("greedy")
        if PersonalityTrait.GENEROUS in base_traits:
            tags.add("generous")
        if PersonalityTrait.HONEST in base_traits:
            tags.add("honest")
        if PersonalityTrait.DECEITFUL in base_traits:
            tags.add("deceitful")
        if PersonalityTrait.BRAVE in base_traits:
            tags.add("brave")
        if PersonalityTrait.COWARDLY in base_traits:
            tags.add("cowardly")
        
        return PersonalityProfile(
            name=name,
            base_traits=base_traits,
            primary_faction=primary_faction,
            confidence=confidence,
            talkativeness=talkativeness,
            generosity=generosity,
            courage=courage,
            tags=tags
        )
    
    def _determine_sprite_type(self, faction: FactionType) -> str:
        """Determine sprite type based on faction"""
        sprite_map = {
            FactionType.GUARD: "guard",
            FactionType.MERCHANT: "merchant",
            FactionType.NOBLE: "noble",
            FactionType.PEASANT: "peasant",
            FactionType.CULTIST: "mystic",
            FactionType.MYSTIC: "mystic",
            FactionType.BANDIT: "bandit",
            FactionType.GOBLIN: "goblin"
        }
        return sprite_map.get(faction, "human")
    
    def _generate_sprite_color(self, seed_hash: str) -> Tuple[int, int, int]:
        """Generate deterministic sprite color"""
        random.seed(seed_hash + "_color")
        return (
            random.randint(50, 200),
            random.randint(50, 200),
            random.randint(50, 200)
        )
    
    def _generate_special_features(self, seed_hash: str, npc_type: str) -> List[str]:
        """Generate special visual features"""
        random.seed(seed_hash + "_features")
        features = []
        
        if npc_type == "guard":
            if random.random() > 0.7:
                features.append("helmet")
            if random.random() > 0.8:
                features.append("armor")
        elif npc_type == "merchant":
            if random.random() > 0.6:
                features.append("apron")
            if random.random() > 0.8:
                features.append("glasses")
        
        return features
    
    def _determine_dialogue_tone(self, mood: MoodState, personality: PersonalityProfile) -> str:
        """Determine dialogue tone based on mood and personality"""
        tone_map = {
            MoodState.HAPPY: "cheerful",
            MoodState.CONTENT: "pleasant",
            MoodState.NEUTRAL: "neutral",
            MoodState.ANNOYED: "irritated",
            MoodState.ANGRY: "hostile",
            MoodState.FEARFUL: "nervous",
            MoodState.EXCITED: "enthusiastic",
            MoodState.WORRIED: "concerned",
            MoodState.SAD: "somber"
        }
        
        base_tone = tone_map.get(mood, "neutral")
        
        # Modify by personality
        if PersonalityTrait.DECEITFUL in personality.base_traits:
            return f"{base_tone}_evasive"
        elif PersonalityTrait.HONEST in personality.base_traits:
            return f"{base_tone}_direct"
        elif PersonalityTrait.CAUTIOUS in personality.base_traits:
            return f"{base_tone}_hesitant"
        
        return base_tone
    
    def _calculate_willingness_to_help(self, npc: NPC, faction_standing: float) -> float:
        """Calculate NPC's willingness to help the player"""
        base_willingness = 0.5
        
        # Personality influence
        if PersonalityTrait.GENEROUS in npc.personality.base_traits:
            base_willingness += 0.3
        if PersonalityTrait.GREEDY in npc.personality.base_traits:
            base_willingness -= 0.2
        if PersonalityTrait.HONEST in npc.personality.base_traits:
            base_willingness += 0.1
        
        # Faction standing influence
        faction_influence = faction_standing / 100.0
        base_willingness += faction_influence * 0.4
        
        # Current mood influence
        mood_influence = npc.social_state.mood_intensity - 0.5
        if npc.social_state.current_mood in [MoodState.HAPPY, MoodState.CONTENT]:
            base_willingness += mood_influence * 0.2
        elif npc.social_state.current_mood in [MoodState.ANNOYED, MoodState.ANGRY]:
            base_willingness -= mood_influence * 0.3
        
        return max(0.0, min(1.0, base_willingness))
    
    def seed_tavern_personas(self) -> None:
        """Seed the tavern with specific NPCs"""
        tavern_positions = [
            ((25, 30), "innkeeper"),
            ((26, 31), "patron"),
            ((24, 29), "patron"),
            ((27, 30), "merchant")
        ]
        
        for position, npc_type in tavern_positions:
            asyncio.create_task(self.generate_npc_at_position(position, npc_type))


# === FACTORY ===

class PersonaEngineFactory:
    """Factory for creating Persona Engine instances"""
    
    @staticmethod
    def create_engine(world_seed: str = "WORLD_SEED") -> PersonaEngine:
        """Create a Persona Engine with default configuration"""
        return PersonaEngine(world_seed)
    
    @staticmethod
    def create_test_engine() -> PersonaEngine:
        """Create a Persona Engine for testing"""
        engine = PersonaEngine("TEST_SEED")
        # Add test-specific configuration
        engine.social_update_interval = 5.0  # Faster updates for testing
        return engine


# === SYNCHRONOUS WRAPPER ===

class PersonaEngineSync:
    """Synchronous wrapper for Persona Engine (for compatibility)"""
    
    def __init__(self, persona_engine: PersonaEngine):
        self.persona_engine = persona_engine
        self._loop = asyncio.new_event_loop()
    
    def generate_npc_at_position(self, position: Tuple[int, int], npc_type: str = "random") -> Optional[NPC]:
        """Synchronous generate_npc_at_position"""
        return self._loop.run_until_complete(
            self.persona_engine.generate_npc_at_position(position, npc_type)
        )
    
    def get_social_response(self, npc_id: str, player_faction: FactionType = FactionType.PLAYER) -> Dict[str, Any]:
        """Synchronous get_social_response"""
        return self._loop.run_until_complete(
            self.persona_engine.get_social_response(npc_id, player_faction)
        )
    
    def update_social_state(self, npc_id: str, interaction_type: str, impact: float) -> bool:
        """Synchronous update_social_state"""
        return self._loop.run_until_complete(
            self.persona_engine.update_social_state(npc_id, interaction_type, impact)
        )
