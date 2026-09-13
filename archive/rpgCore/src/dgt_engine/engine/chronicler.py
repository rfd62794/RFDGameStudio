"""
Chronicler - The Movie Subtitle Generator

Translates D&D Engine state changes into 8-bit typewriter-style dialogue.
The LLM component that generates narrative subtitles for the autonomous movie.
"""

import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from loguru import logger


@dataclass
class SubtitleEvent:
    """Subtitle event for the movie"""
    timestamp: float
    text: str
    duration: float = 3.0
    style: str = "typewriter"
    
    def is_expired(self) -> bool:
        """Check if subtitle has expired"""
        return time.time() - self.timestamp > self.duration


class Chronicler:
    """The Movie Subtitle Generator
    
    Translates D&D Engine state changes into 8-bit typewriter-style dialogue.
    """
    
    def __init__(self):
        self.active_subtitles: List[SubtitleEvent] = []
        self.subtitle_history: List[SubtitleEvent] = []
        self.last_state_hash: str = ""
        
        # Narrative templates for different events
        self.narrative_templates = {
            "position_change": [
                "The Voyager moves {direction} toward {landmark}.",
                "Step by step, the path unfolds ahead.",
                "The journey continues through the {terrain}.",
                "Each step brings new discoveries."
            ],
            "interaction": [
                "The Voyager {action} the {target}.",
                "A moment of significance unfolds.",
                "The world responds to the Voyager's will.",
                "Destiny calls at this crossroads."
            ],
            "environment_change": [
                "The landscape shifts to {new_env}.",
                "New horizons reveal themselves.",
                "The world transforms before our eyes.",
                "Nature's embrace welcomes the traveler."
            ],
            "milestone": [
                "The Voyager has reached {location}!",
                "A milestone in the grand journey.",
                "History is made in this moment.",
                "The saga continues to unfold."
            ]
        }
        
        logger.info("📝 Chronicler initialized - Movie subtitle generator ready")
    
    def observe_state_change(self, old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Optional[str]:
        """Observe state change and generate subtitle if significant"""
        # Create state hash to detect changes
        new_hash = self._create_state_hash(new_state)
        
        if new_hash == self.last_state_hash:
            return None  # No significant change
        
        self.last_state_hash = new_hash
        
        # Analyze the change
        change_type = self._analyze_change(old_state, new_state)
        
        if change_type:
            subtitle = self._generate_subtitle(change_type, old_state, new_state)
            self.add_subtitle(subtitle)
            return subtitle
        
        return None
    
    def add_subtitle(self, text: str, duration: float = 3.0, style: str = "typewriter") -> None:
        """Add a subtitle event"""
        subtitle = SubtitleEvent(
            timestamp=time.time(),
            text=text,
            duration=duration,
            style=style
        )
        
        self.active_subtitles.append(subtitle)
        self.subtitle_history.append(subtitle)
        
        logger.debug(f"📝 Subtitle added: {text}")
    
    def get_current_subtitles(self) -> List[str]:
        """Get currently active subtitles"""
        # Remove expired subtitles
        self.active_subtitles = [
            subtitle for subtitle in self.active_subtitles 
            if not subtitle.is_expired()
        ]
        
        return [subtitle.text for subtitle in self.active_subtitles]
    
    def get_subtitle_history(self, limit: int = 50) -> List[str]:
        """Get recent subtitle history"""
        recent_history = self.subtitle_history[-limit:] if len(self.subtitle_history) > limit else self.subtitle_history
        return [subtitle.text for subtitle in recent_history]
    
    def _create_state_hash(self, state: Dict[str, Any]) -> str:
        """Create hash of state for change detection"""
        key_elements = {
            "player_position": state.get("player_position", (0, 0)),
            "turn_count": state.get("turn_count", 0),
            "current_environment": state.get("current_environment", "unknown"),
            "player_health": state.get("player_health", 100)
        }
        
        # Simple hash (in production, use proper hashing)
        hash_str = f"{key_elements['player_position']}-{key_elements['turn_count']}-{key_elements['current_environment']}"
        return hash_str
    
    def _analyze_change(self, old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Optional[str]:
        """Analyze the type of change that occurred"""
        old_pos = old_state.get("player_position", (0, 0))
        new_pos = new_state.get("player_position", (0, 0))
        
        old_env = old_state.get("current_environment", "unknown")
        new_env = new_state.get("current_environment", "unknown")
        
        old_turn = old_state.get("turn_count", 0)
        new_turn = new_state.get("turn_count", 0)
        
        # Check for environment change
        if old_env != new_env:
            return "environment_change"
        
        # Check for position change
        if old_pos != new_pos:
            # Check if it's a milestone position
            if self._is_milestone_position(new_pos):
                return "milestone"
            else:
                return "position_change"
        
        # Check for turn increment (interaction)
        if new_turn > old_turn and old_pos == new_pos:
            return "interaction"
        
        return None
    
    def _is_milestone_position(self, position: tuple) -> bool:
        """Check if position is a milestone"""
        milestone_positions = [
            (10, 25),  # Forest edge
            (10, 20),  # Town gate
            (10, 10),  # Town square
            (20, 10),  # Tavern entrance
            (25, 30),  # Tavern interior
        ]
        
        return position in milestone_positions
    
    def _generate_subtitle(self, change_type: str, old_state: Dict[str, Any], new_state: Dict[str, Any]) -> str:
        """Generate subtitle text based on change type"""
        templates = self.narrative_templates.get(change_type, ["The journey continues."])
        
        # Get context information
        old_pos = old_state.get("player_position", (0, 0))
        new_pos = new_state.get("player_position", (0, 0))
        
        # Determine direction
        direction = self._get_direction(old_pos, new_pos)
        
        # Determine terrain/landmark
        landmark = self._get_landmark_name(new_pos)
        terrain = self._get_terrain_name(new_pos)
        
        # Get environment info
        new_env = new_state.get("current_environment", "unknown")
        
        # Select template and fill in variables
        import random
        template = random.choice(templates)
        
        try:
            subtitle = template.format(
                direction=direction,
                landmark=landmark,
                terrain=terrain,
                new_env=new_env.replace("_", " ").title(),
                location=landmark,
                action="interacts with",
                target="the mysterious object"
            )
        except KeyError:
            # Fallback if template has unexpected variables
            subtitle = "The Voyager continues the journey."
        
        return subtitle
    
    def _get_direction(self, old_pos: tuple, new_pos: tuple) -> str:
        """Get direction of movement"""
        dx = new_pos[0] - old_pos[0]
        dy = new_pos[1] - old_pos[1]
        
        if abs(dx) > abs(dy):
            return "east" if dx > 0 else "west"
        elif dy != 0:
            return "south" if dy > 0 else "north"
        else:
            return "forward"
    
    def _get_landmark_name(self, position: tuple) -> str:
        """Get landmark name for position"""
        landmarks = {
            (10, 25): "the forest edge",
            (10, 20): "the town gate",
            (10, 10): "the town square",
            (20, 10): "the tavern entrance",
            (25, 30): "the tavern interior"
        }
        
        return landmarks.get(position, "an unknown location")
    
    def _get_terrain_name(self, position: tuple) -> str:
        """Get terrain name for position"""
        # Simple terrain classification based on position
        x, y = position
        
        if y > 30:
            return "the mountain region"
        elif y > 20:
            return "the forest depths"
        elif y > 10:
            return "the grasslands"
        else:
            return "the southern plains"
    
    def clear_expired_subtitles(self) -> None:
        """Clear expired subtitles"""
        self.active_subtitles = [
            subtitle for subtitle in self.active_subtitles 
            if not subtitle.is_expired()
        ]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get chronicler statistics"""
        return {
            "active_subtitles": len(self.active_subtitles),
            "total_subtitles": len(self.subtitle_history),
            "average_duration": sum(s.duration for s in self.subtitle_history) / len(self.subtitle_history) if self.subtitle_history else 0,
            "last_subtitle_time": self.subtitle_history[-1].timestamp if self.subtitle_history else 0
        }


# Factory for creating Chronicler instances
class ChroniclerFactory:
    """Factory for creating Chronicler instances"""
    
    @staticmethod
    def create_chronicler() -> Chronicler:
        """Create a Chronicler with default configuration"""
        return Chronicler()
    
    @staticmethod
    def create_movie_chronicler() -> Chronicler:
        """Create a Chronicler optimized for movie generation"""
        chronicler = Chronicler()
        
        # Add movie-specific templates
        chronicler.narrative_templates["movie_intro"] = [
            "Our story begins in the realm of adventure.",
            "A hero's journey unfolds before us.",
            "The chronicle of the Voyager starts now.",
            "In a world of mystery and wonder..."
        ]
        
        chronicler.narrative_templates["movie_outro"] = [
            "And so the tale continues...",
            "The Voyager's legend grows.",
            "History remembers this day.",
            "The saga will be told for generations."
        ]
        
        return chronicler
