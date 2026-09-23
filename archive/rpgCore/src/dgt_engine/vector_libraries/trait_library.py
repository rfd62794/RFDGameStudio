"""
Trait Library: Vectorized NPC/Location DNA

Formalized vector system for procedural personality and environment generation.
Replaces hardcoded descriptions with mathematical trait combinations.

ADR 016: Vector-Driven State Implementation
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum
import random

from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from loguru import logger


class TraitCategory(Enum):
    """Categories of traits for systematic organization."""
    PERSONALITY = "personality"  # Core personality traits
    BEHAVIOR = "behavior"      # Action tendencies
    SOCIAL = "social"         # Social interaction style
    PROFESSION = "profession"  # Job/role indicators
    PHYSICAL = "physical"     # Physical characteristics
    MOTIVATION = "motivation"  # Driving forces


@dataclass
class Trait:
    """A single vectorized trait with game mechanics impact."""
    name: str
    description: str
    category: TraitCategory
    vector: np.ndarray  # 384-dim embedding
    dc_modifiers: Dict[str, int]  # intent -> DC modification
    relationship_modifiers: Dict[str, int]  # faction -> rep modifier
    narrative_keywords: List[str]  # Keywords for Chronicler consistency
    
    def __post_init__(self):
        """Validate trait data."""
        if self.vector.shape[0] != 384:
            raise ValueError(f"Trait {self.name} must have 384-dim vector, got {self.vector.shape}")


class TraitLibrary:
    """
    Comprehensive library of vectorized traits for procedural generation.
    
    This is the "DNA" system that creates unique NPCs and locations through
    mathematical trait combinations rather than hardcoded descriptions.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize trait library with sentence transformer."""
        self.model = SentenceTransformer(model_name)
        self.traits: Dict[str, Trait] = {}
        self._initialize_traits()
    
    def _initialize_traits(self):
        """Initialize the comprehensive trait library."""
        # Personality Traits (Core identity)
        personality_traits = [
            ("stoic", "Emotionally resilient, rarely shows feelings", {"combat": 2, "intimidate": 2}, {"law": 1}, ["calm", "unflappable"]),
            ("greedy", "Obsessed with wealth and material gain", {"charm": -3, "bribe": -5}, {"underworld": 2}, ["wealth", "coins", "profit"]),
            ("paranoid", "Suspicious of everyone and everything", {"investigate": 3, "stealth": 2}, {"law": -1}, ["suspicious", "watchful", "cautious"]),
            ("charismatic", "Naturally persuasive and likable", {"charm": 5, "persuade": 4}, {"underworld": 1}, ["charming", "persuasive", "likable"]),
            ("aggressive", "Quick to anger and confrontation", {"combat": 3, "intimidate": 3}, {"law": -2}, ["aggressive", "hostile", "confrontational"]),
            ("cautious", "Careful and risk-averse", {"stealth": 2, "investigate": 2}, {"law": 1}, ["careful", "wary", "deliberate"]),
            ("curious", "Eager to learn and explore", {"investigate": 3, "search": 2}, {}, ["curious", "inquisitive", "exploring"]),
            ("honorable", "Strong moral code and principles", {"charm": 2, "persuade": 1}, {"law": 3}, ["honorable", "principled", "moral"]),
            ("cunning", "Clever and manipulative", {"charm": 3, "deceive": 4}, {"underworld": 2}, ["cunning", "manipulative", "clever"]),
            ("brave", "Faces danger without hesitation", {"combat": 2, "force": 2}, {"law": 1}, ["brave", "courageous", "fearless"]),
            ("lazy", "Avoids work and effort", {"combat": -2, "athletics": -3}, {}, ["lazy", "unmotivated", "slothful"])
        ]
        
        # Behavior Traits (Action tendencies)
        behavior_traits = [
            ("talkative", "Loves to chat and tell stories", {"charm": 2, "distract": 2}, {}, ["talkative", "chatty", "storyteller"]),
            ("quiet", "Speaks only when necessary", {"stealth": 2, "investigate": 1}, {}, ["quiet", "silent", "reserved"]),
            ("helpful", "Eager to assist others", {"charm": 1, "persuade": 1}, {"law": 1}, ["helpful", "assisting", "cooperative"]),
            ("selfish", "Prioritizes own needs above others", {"charm": -2, "persuade": -2}, {"underworld": 1}, ["selfish", "self-centered", "greedy"]),
            ("honest", "Cannot lie or deceive effectively", {"deceive": -5, "charm": -1}, {"law": 2}, ["honest", "truthful", "sincere"]),
            ("deceptive", "Skilled at lying and misdirection", {"deceive": 4, "charm": 2}, {"underworld": 2}, ["deceptive", "lying", "misleading"]),
            ("observant", "Notices small details others miss", {"investigate": 3, "perception": 2}, {}, ["observant", "detail-oriented", "perceptive"]),
            ("forgetful", "Struggles to remember information", {"investigate": -2, "search": -1}, {}, ["forgetful", "absent-minded", "distracted"]),
            ("patient", "Willing to wait for the right moment", {"stealth": 2, "finesse": 1}, {}, ["patient", "waiting", "deliberate"]),
            ("impulsive", "Acts without thinking", {"combat": 1, "force": 1}, {"law": -1}, ["impulsive", "rash", "reckless"]),
            ("methodical", "Systematic and organized", {"investigate": 2, "search": 1}, {"law": 1}, ["methodical", "systematic", "organized"])
        ]
        
        # Social Traits (Interaction style)
        social_traits = [
            ("friendly", "Warm and approachable", {"charm": 2, "persuade": 1}, {"law": 1}, ["friendly", "warm", "approachable"]),
            ("intimidating", "Frightening presence", {"intimidate": 4, "force": 2}, {"law": -1}, ["intimidating", "frightening", "menacing"]),
            ("diplomatic", "Skilled at negotiation and compromise", {"charm": 3, "persuade": 3}, {"law": 2}, ["diplomatic", "negotiating", "compromising"]),
            ("rude", "Deliberately offensive", {"charm": -3, "persuade": -2}, {"law": -1}, ["rude", "offensive", "impolite"]),
            ("respectful", "Shows deference to authority", {"charm": 1, "persuade": 1}, {"law": 2}, ["respectful", "deferential", "polite"]),
            ("insulting", "Uses belittling language", {"intimidate": 2, "force": 1}, {"law": -2}, ["insulting", "belittling", "disrespectful"]),
            ("flirtatious", "Uses romantic charm", {"charm": 2, "persuade": 1}, {}, ["flirtatious", "charming", "romantic"]),
            ("formal", "Uses proper etiquette", {"charm": 1, "persuade": 1}, {"law": 1}, ["formal", "proper", "etiquette"]),
            ("casual", "Informal and relaxed", {"charm": 0, "persuade": 0}, {}, ["casual", "informal", "relaxed"]),
            ("authoritative", "Commands respect", {"intimidate": 2, "force": 1}, {"law": 1}, ["authoritative", "commanding", "dominant"]),
            ("submissive", "Yields to others", {"charm": -1, "persuade": -1}, {}, ["submissive", "yielding", "passive"])
        ]
        
        # Profession Traits (Job/role indicators)
        profession_traits = [
            ("merchant", "Skilled in trade and negotiation", {"charm": 2, "persuade": 2}, {"underworld": 1}, ["trade", "negotiation", "business"]),
            ("guard", "Trained in protection and enforcement", {"combat": 2, "intimidate": 1}, {"law": 2}, ["protection", "security", "enforcement"]),
            ("scholar", "Knowledgeable and academic", {"investigate": 3, "search": 2}, {"clergy": 1}, ["knowledge", "academic", "learning"]),
            ("thief", "Skilled in stealth and subterfuge", {"stealth": 4, "finesse": 3}, {"underworld": 3}, ["stealth", "subterfuge", "criminal"]),
            ("healer", "Knowledgeable in medicine", {"investigate": 1, "charm": 1}, {"clergy": 2}, ["medicine", "healing", "care"]),
            ("noble", "High social standing and influence", {"charm": 2, "persuade": 3}, {"law": 2}, ["nobility", "influence", "privilege"]),
            ("commoner", "Average citizen with basic skills", {}, {}, ["common", "average", "ordinary"]),
            ("artisan", "Skilled craftsperson", {"investigate": 1, "finesse": 1}, {"law": 1}, ["craft", "skilled", "trade"]),
            ("bard", "Entertainer and storyteller", {"charm": 3, "distract": 2}, {}, ["entertainment", "storytelling", "music"]),
            ("cleric", "Religious authority", {"charm": 2, "persuade": 2}, {"clergy": 3}, ["religious", "spiritual", "holy"]),
            ("outlaw", "Living outside the law", {"stealth": 2, "force": 1}, {"law": -3, "underworld": 2}, ["criminal", "fugitive", "wanted"])
        ]
        
        # Physical Traits (Physical characteristics)
        physical_traits = [
            ("strong", "Physically powerful", {"combat": 3, "force": 4, "athletics": 3}, {}, ["strong", "powerful", "muscular"]),
            ("fast", "Quick and agile", {"stealth": 2, "finesse": 3, "athletics": 2}, {}, ["fast", "quick", "agile"]),
            ("tall", "Above average height", {"intimidate": 1, "force": 1}, {}, ["tall", "lofty", "towering"]),
            ("short", "Below average height", {"stealth": 1, "finesse": 1}, {}, ["short", "small", "petite"]),
            ("old", "Advanced in age", {"charm": 1, "persuade": 1}, {}, ["old", "elderly", "aged"]),
            ("young", "Youthful and energetic", {"athletics": 2, "force": 1}, {}, ["young", "youthful", "energetic"]),
            ("scarred", "Visible marks of past violence", {"intimidate": 2, "force": 1}, {"underworld": 1}, ["scarred", "marked", "battle-worn"]),
            ("well_dressed", "Expensive and clean attire", {"charm": 2, "persuade": 2}, {"law": 1}, ["expensive", "clean", "fashionable"]),
            ("poorly_dressed", "Cheap and worn clothing", {"charm": -1, "persuade": -1}, {"underworld": 1}, ["cheap", "worn", "poor"]),
            ("armed", "Carrying visible weapons", {"intimidate": 3, "force": 2}, {"law": 0}, ["armed", "weaponized", "dangerous"]),
            ("injured", "Currently wounded or hurt", {"combat": -2, "athletics": -2}, {}, ["wounded", "injured", "hurt"])
        ]
        
        # Motivation Traits (Driving forces)
        motivation_traits = [
            ("revenge_seeking", "Driven by vengeance", {"combat": 2, "intimidate": 2}, {"law": -2}, ["revenge", "vengeance", "payback"]),
            ("wealth_seeking", "Motivated by material gain", {"bribe": -3, "charm": -1}, {"underworld": 2}, ["wealth", "profit", "riches"]),
            ("power_seeking", "Desires control and authority", {"intimidate": 2, "force": 1}, {"law": -1}, ["power", "control", "authority"]),
            ("knowledge_seeking", "Craves information and learning", {"investigate": 3, "search": 2}, {"clergy": 1}, ["knowledge", "learning", "information"]),
            ("justice_seeking", "Driven by fairness and order", {"charm": 1, "persuade": 1}, {"law": 3}, ["justice", "fairness", "order"]),
            ("freedom_seeking", "Values independence above all", {"combat": 1, "force": 1}, {"law": -1}, ["freedom", "independence", "autonomy"]),
            ("fame_seeking", "Wants recognition and glory", {"charm": 2, "persuade": 1}, {}, ["fame", "recognition", "glory"]),
            ("survival_seeking", "Motivated by basic needs", {"stealth": 2, "investigate": 1}, {}, ["survival", "needs", "basic"]),
            ("love_seeking", "Driven by emotional connection", {"charm": 3, "persuade": 2}, {}, ["love", "emotion", "connection"]),
            ("adventure_seeking", "Craves excitement and danger", {"combat": 1, "force": 1}, {}, ["adventure", "excitement", "danger"]),
            ("peace_seeking", "Desires tranquility and safety", {"combat": -2, "force": -2}, {"law": 1}, ["peace", "tranquility", "safety"])
        ]
        
        # Combine all traits
        all_traits = (
            personality_traits + behavior_traits + social_traits + 
            profession_traits + physical_traits + motivation_traits
        )
        
        # Create Trait objects with vectors
        for trait_data in all_traits:
            name, description, dc_mods, rel_mods, keywords = trait_data
            
            # Determine category
            category = self._determine_category(name, description)
            
            # Generate vector embedding
            vector = self.model.encode(
                f"{name}: {description}",
                convert_to_numpy=True
            )
            
            trait = Trait(
                name=name,
                description=description,
                category=category,
                vector=vector,
                dc_modifiers=dc_mods,
                relationship_modifiers=rel_mods,
                narrative_keywords=keywords
            )
            
            self.traits[name] = trait
        
        logger.info(f"Initialized {len(self.traits)} vectorized traits")
    
    def _determine_category(self, name: str, description: str) -> TraitCategory:
        """Determine trait category based on name and description."""
        name_lower = name.lower()
        desc_lower = description.lower()
        
        # Personality traits (core identity)
        if any(word in name_lower for word in ["stoic", "greedy", "paranoid", "charismatic", "aggressive", "cautious", "curious", "honorable", "cunning", "brave", "lazy"]):
            return TraitCategory.PERSONALITY
        
        # Behavior traits (action tendencies)
        if any(word in name_lower for word in ["talkative", "quiet", "helpful", "selfish", "honest", "deceptive", "observant", "forgetful", "patient", "impulsive", "methodical"]):
            return TraitCategory.BEHAVIOR
        
        # Social traits (interaction style)
        if any(word in name_lower for word in ["friendly", "intimidating", "diplomatic", "rude", "respectful", "insulting", "flirtatious", "formal", "casual", "authoritative", "submissive"]):
            return TraitCategory.SOCIAL
        
        # Profession traits (job/role)
        if any(word in name_lower for word in ["merchant", "guard", "scholar", "thief", "healer", "noble", "commoner", "artisan", "bard", "cleric", "outlaw"]):
            return TraitCategory.PROFESSION
        
        # Physical traits (characteristics)
        if any(word in name_lower for word in ["strong", "fast", "tall", "short", "old", "young", "scarred", "well_dressed", "poorly_dressed", "armed", "injured"]):
            return TraitCategory.PHYSICAL
        
        # Motivation traits (driving forces)
        if any(word in name_lower for word in ["revenge_seeking", "wealth_seeking", "power_seeking", "knowledge_seeking", "justice_seeking", "freedom_seeking", "fame_seeking", "survival_seeking", "love_seeking", "adventure_seeking", "peace_seeking"]):
            return TraitCategory.MOTIVATION
        
        # Default to personality
        return TraitCategory.PERSONALITY
    
    def get_trait(self, name: str) -> Optional[Trait]:
        """Get a trait by name."""
        return self.traits.get(name)
    
    def get_traits_by_category(self, category: TraitCategory) -> List[Trait]:
        """Get all traits in a specific category."""
        return [trait for trait in self.traits.values() if trait.category == category]
    
    def get_random_traits(self, count: int, categories: Optional[List[TraitCategory]] = None) -> List[Trait]:
        """
        Get random traits, optionally filtered by category.
        
        Args:
            count: Number of traits to select
            categories: Optional list of categories to filter by
            
        Returns:
            List of randomly selected traits
        """
        available_traits = list(self.traits.values())
        
        if categories:
            available_traits = [t for t in available_traits if t.category in categories]
        
        if len(available_traits) < count:
            logger.warning(f"Only {len(available_traits)} traits available, requested {count}")
            count = len(available_traits)
        
        return random.sample(available_traits, count)
    
    def find_similar_traits(self, query_vector: np.ndarray, top_k: int = 5) -> List[Tuple[Trait, float]]:
        """
        Find traits most similar to a query vector.
        
        Args:
            query_vector: Vector to compare against
            top_k: Number of similar traits to return
            
        Returns:
            List of (trait, similarity_score) tuples
        """
        similarities = []
        
        for trait in self.traits.values():
            # Calculate cosine similarity
            similarity = np.dot(query_vector, trait.vector) / (
                np.linalg.norm(query_vector) * np.linalg.norm(trait.vector)
            )
            similarities.append((trait, similarity))
        
        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]
    
    def calculate_trait_combination_modifiers(self, traits: List[Trait], intent_id: str) -> Dict[str, int]:
        """
        Calculate combined DC modifiers from multiple traits.
        
        Args:
            traits: List of traits to combine
            intent_id: Intent to calculate modifiers for
            
        Returns:
            Dictionary of combined modifiers
        """
        combined_modifiers = {}
        
        for trait in traits:
            intent_mod = trait.dc_modifiers.get(intent_id, 0)
            if intent_mod != 0:
                combined_modifiers[trait.name] = intent_mod
        
        return combined_modifiers
    
    def generate_trait_description(self, traits: List[Trait]) -> str:
        """
        Generate a coherent description from trait combination.
        
        Args:
            traits: List of traits to describe
            
        Returns:
            Natural language description
        """
        if not traits:
            return "An ordinary individual with no notable characteristics."
        
        # Sort traits by category for coherent description
        personality = [t for t in traits if t.category == TraitCategory.PERSONALITY]
        behavior = [t for t in traits if t.category == TraitCategory.BEHAVIOR]
        social = [t for t in traits if t.category == TraitCategory.SOCIAL]
        profession = [t for t in traits if t.category == TraitCategory.PROFESSION]
        physical = [t for t in traits if t.category == TraitCategory.PHYSICAL]
        motivation = [t for t in traits if t.category == TraitCategory.MOTIVATION]
        
        description_parts = []
        
        # Start with profession if available
        if profession:
            description_parts.append(f"A {profession[0].name.lower()}")
        
        # Add personality
        if personality:
            desc = personality[0].description.lower()
            description_parts.append(f"who is {desc}")
        
        # Add physical characteristics
        if physical:
            physical_desc = ", ".join([t.name.replace("_", " ") for t in physical])
            description_parts.append(f"with {physical_desc}")
        
        # Add behavior
        if behavior:
            behavior_desc = behavior[0].description.lower()
            description_parts.append(f"They tend to be {behavior_desc}")
        
        # Add social style
        if social:
            social_desc = social[0].description.lower()
            description_parts.append(f"and {social_desc}")
        
        # Add motivation if available
        if motivation:
            motivation_desc = motivation[0].description.lower()
            description_parts.append(f"Driven by {motivation_desc}")
        
        # Combine into coherent description
        if len(description_parts) <= 2:
            return " ".join(description_parts) + "."
        else:
            return " ".join(description_parts[:-1]) + ", and " + description_parts[-1] + "."
    
    def get_trait_vector(self, trait_names: List[str]) -> np.ndarray:
        """
        Get combined vector representation of multiple traits.
        
        Args:
            trait_names: List of trait names to combine
            
        Returns:
            Combined vector (average of trait vectors)
        """
        vectors = []
        for name in trait_names:
            trait = self.get_trait(name)
            if trait:
                vectors.append(trait.vector)
        
        if not vectors:
            # Return zero vector if no traits found
            return np.zeros(384)
        
        # Return average vector
        return np.mean(vectors, axis=0)


# Export for use by baker and world factory
__all__ = ["TraitLibrary", "Trait", "TraitCategory"]
