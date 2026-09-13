"""
Token Compactor: Context Minifier for LLM Optimization

Enterprise-grade tooling for handling 2048 token context limits.
Strips GameState down to narrative-essential information for the Chronicler.

Usage:
    from foundation.utils import ContextManager
    compact = ContextManager.minify_context(game_state, intent_id)

ROI: Reduces 1,500-token JSON blocks to 200-token narrative prompts.
"""

import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

from loguru import logger
from foundation.protocols import WorldStateSnapshot, EntityStateProtocol


@dataclass
class NarrativeContext:
    """Compact narrative representation for LLM consumption."""
    location: str
    environment: List[str]
    npcs: List[Dict[str, str]]  # name, state, description
    items: List[str]
    social_context: List[str]  # relationship summaries
    recent_actions: List[str]  # last 3 actions
    active_goals: List[str]  # goal descriptions
    player_state: str  # HP, gold summary


class ContextManager:
    """
    Minifies game state for efficient LLM context usage.
    
    This is your "Token Compactor" - converts verbose game state
    into compact narrative prompts that fit within context limits.
    """
    
    # Keywords that indicate narrative importance
    NARRATIVE_KEYWORDS = [
        "hostile", "charmed", "dead", "distracted",
        "wounded", "friendly", "suspicious", "aggressive"
    ]
    
    # Maximum tokens for different context sections
    SECTION_LIMITS = {
        "location": 50,
        "npcs": 100,
        "environment": 50,
        "social": 80,
        "goals": 60,
        "recent": 80,
        "player": 30
    }
    
    @classmethod
    def minify_context(
        cls, 
        game_state: GameState, 
        intent_id: Optional[str] = None,
        max_tokens: int = 512
    ) -> str:
        """
        Convert full GameState to compact narrative context.
        
        Args:
            game_state: Full game state
            intent_id: Current action intent (for relevance filtering)
            max_tokens: Maximum tokens for output
            
        Returns:
            Compact narrative string
        """
        narrative = cls._build_narrative_context(game_state, intent_id)
        
        # Token count estimation (rough: 1 token ≈ 4 characters)
        estimated_tokens = len(narrative) // 4
        
        if estimated_tokens > max_tokens:
            logger.warning(f"Context too large: {estimated_tokens} tokens (limit: {max_tokens})")
            narrative = cls._aggressive_minify(narrative, max_tokens)
        
        return narrative
    
    @classmethod
    def _build_narrative_context(cls, game_state: GameState, intent_id: Optional[str]) -> str:
        """Build comprehensive narrative context."""
        context_parts = []
        
        # Location
        room = game_state.rooms.get(game_state.current_room)
        if room:
            location_desc = f"You are in {room.name}. {room.description}"
            context_parts.append(location_desc)
        
        # Environment tags (only important ones)
        if room and room.tags:
            important_tags = cls._filter_important_tags(room.tags, intent_id)
            if important_tags:
                context_parts.append(f"Environment: {', '.join(important_tags)}")
        
        # NPCs (narrative-focused)
        if room and room.npcs:
            npc_descriptions = cls._minify_npcs(room.npcs, intent_id)
            if npc_descriptions:
                context_parts.append(f"NPCs: {npc_descriptions}")
        
        # Items (only notable ones)
        if room and room.items:
            notable_items = cls._filter_notable_items(room.items, intent_id)
            if notable_items:
                context_parts.append(f"Notable items: {', '.join(notable_items)}")
        
        # Social context
        social_context = cls._minify_social_graph(game_state)
        if social_context:
            context_parts.append(f"Relationships: {social_context}")
        
        # Active goals
        if game_state.goal_stack:
            goal_descriptions = [g.description for g in game_state.goal_stack[:3]]  # Top 3
            context_parts.append(f"Objectives: {'; '.join(goal_descriptions)}")
        
        # Player state (compact)
        player_status = cls._minify_player_state(game_state.player)
        context_parts.append(f"Your status: {player_status}")
        
        return " ".join(context_parts)
    
    @classmethod
    def _filter_important_tags(cls, tags: List[str], intent_id: Optional[str]) -> List[str]:
        """Filter tags to only narrative-relevant ones."""
        important_tags = []
        
        for tag in tags:
            # Always include narrative keywords
            if any(keyword in tag.lower() for keyword in cls.NARRATIVE_KEYWORDS):
                important_tags.append(tag)
                continue
            
            # Include intent-relevant tags
            if intent_id:
                intent_relevance = {
                    "stealth": ["dimly_lit", "hidden", "shadows"],
                    "combat": ["crowded", "confined", "open"],
                    "charm": ["quiet", "formal", "social"],
                    "investigate": ["cluttered", "detailed", "organized"]
                }
                
                relevant_tags = intent_relevance.get(intent_id.lower(), [])
                if any(rel in tag.lower() for rel in relevant_tags):
                    important_tags.append(tag)
                    continue
            
            # Include unique/rare tags
            if len(tag.split()) > 1:  # Multi-word tags are usually important
                important_tags.append(tag)
        
        return important_tags[:5]  # Limit to 5 most important
    
    @classmethod
    def _minify_npcs(cls, npcs: List[NPC], intent_id: Optional[str]) -> str:
        """Create compact NPC descriptions."""
        npc_descriptions = []
        
        for npc in npcs:
            # Always include state if it's narrative-relevant
            state_info = ""
            if npc.state in cls.NARRATIVE_KEYWORDS:
                state_info = f" ({npc.state})"
            
            # Include description if it's short and relevant
            desc_info = ""
            if len(npc.description.split()) <= 8:  # Short descriptions only
                desc_info = f": {npc.description}"
            
            npc_desc = f"{npc.name}{state_info}{desc_info}"
            npc_descriptions.append(npc_desc)
        
        return ", ".join(npc_descriptions)
    
    @classmethod
    def _filter_notable_items(cls, items: List[str], intent_id: Optional[str]) -> List[str]:
        """Filter items to only notable ones."""
        notable_items = []
        
        # Keywords that make items notable
        notable_keywords = [
            "weapon", "sword", "dagger", "key", "treasure", "chest",
            "document", "map", "book", "scroll", "magic", "rare"
        ]
        
        for item in items:
            item_lower = item.lower()
            if any(keyword in item_lower for keyword in notable_keywords):
                notable_items.append(item)
        
        return notable_items[:3]  # Limit to 3 most notable
    
    @classmethod
    def _minify_social_graph(cls, game_state: GameState) -> str:
        """Create compact social relationship summary."""
        local_rels = game_state.social_graph.get(game_state.current_room, {})
        
        if not local_rels:
            return ""
        
        relationship_summaries = []
        
        for npc_id, relationship in local_rels.items():
            # Only include significant relationships
            if abs(relationship.disposition) >= 10 or relationship.tags:
                parts = []
                
                # Disposition
                if relationship.disposition >= 20:
                    parts.append("friendly")
                elif relationship.disposition <= -20:
                    parts.append("hostile")
                elif relationship.disposition >= 10:
                    parts.append("positive")
                elif relationship.disposition <= -10:
                    parts.append("negative")
                
                # Important tags
                important_tags = [
                    tag for tag in relationship.tags 
                    if tag in cls.NARRATIVE_KEYWORDS or len(tag.split()) == 1
                ]
                parts.extend(important_tags[:2])  # Max 2 tags
                
                if parts:
                    relationship_summaries.append(f"{npc_id}: {', '.join(parts)}")
        
        return "; ".join(relationship_summaries)
    
    @classmethod
    def _minify_player_state(cls, player) -> str:
        """Create compact player status."""
        status_parts = []
        
        # Health status
        hp_percent = player.hp / player.max_hp
        if hp_percent >= 0.8:
            status_parts.append("healthy")
        elif hp_percent >= 0.5:
            status_parts.append("wounded")
        elif hp_percent >= 0.2:
            status_parts.append("injured")
        else:
            status_parts.append("critical")
        
        # Wealth status
        if player.gold >= 100:
            status_parts.append("wealthy")
        elif player.gold >= 50:
            status_parts.append("comfortable")
        elif player.gold >= 10:
            status_parts.append("modest")
        else:
            status_parts.append("poor")
        
        return ", ".join(status_parts)
    
    @classmethod
    def _aggressive_minify(cls, narrative: str, max_tokens: int) -> str:
        """Aggressively trim context to fit token limit."""
        target_chars = max_tokens * 4  # Rough token-to-char ratio
        
        if len(narrative) <= target_chars:
            return narrative
        
        # Split into sentences
        sentences = narrative.split(". ")
        
        # Keep most important sentences first
        important_sentences = []
        remaining_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Prioritize sentences with narrative keywords
            if any(keyword in sentence.lower() for keyword in cls.NARRATIVE_KEYWORDS):
                important_sentences.append(sentence)
            else:
                remaining_sentences.append(sentence)
        
        # Build compact narrative
        compact_parts = important_sentences
        
        # Add remaining sentences until we hit the limit
        current_length = len(". ".join(compact_parts))
        
        for sentence in remaining_sentences:
            if current_length + len(sentence) + 2 <= target_chars:
                compact_parts.append(sentence)
                current_length += len(sentence) + 2
            else:
                break
        
        return ". ".join(compact_parts) + "."
    
    @classmethod
    def estimate_tokens(cls, text: str) -> int:
        """Estimate token count for text."""
        # Rough estimation: 1 token ≈ 4 characters
        return len(text) // 4
    
    @classmethod
    def create_action_summary(
        cls, 
        action: str, 
        intent_id: str, 
        success: bool, 
        target: Optional[str] = None
    ) -> str:
        """Create compact action summary for history tracking."""
        parts = [f"You {action}"]
        
        if target:
            parts.append(f"the {target}")
        
        parts.append(f"({intent_id})")
        
        if success:
            parts.append("- SUCCESS")
        else:
            parts.append("- FAILED")
        
        return " ".join(parts)


# Export for use by engine and narrator
__all__ = ["ContextManager", "NarrativeContext"]
