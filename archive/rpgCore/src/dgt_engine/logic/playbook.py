"""
Playbook - The Script for Theater Architecture

Defines the linear sequence of beacons and scenes that the Voyager follows.
This is the "script" that determines the narrative flow.

ADR 051: Theater-Driven Narrative Controller
- Stores deterministic waypoints for the "Tavern Voyage"
- Contains scene transition cues and narrative tags
- Ensures repeatable, scripted performances
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum

from loguru import logger


class SceneType(Enum):
    """Types of scenes in the playbook."""
    FOREST_EDGE = "forest_edge"
    TOWN_GATE = "town_gate"
    TOWN_SQUARE = "town_square"
    TAVERN_ENTRY = "tavern_entry"
    TAVERN_INTERIOR = "tavern_interior"


@dataclass
class Act:
    """A single act in the playbook script."""
    act_number: int
    target_position: Tuple[int, int]
    scene_type: SceneType
    scene_description: str
    on_arrival_cue: str
    narrative_tags: List[str]
    is_complete: bool = False
    
    def mark_complete(self) -> None:
        """Mark this act as complete."""
        self.is_complete = True
        logger.debug(f"🎭 Act {self.act_number} '{self.scene_type.value}' marked complete")


class Playbook:
    """
    The Script - Linear sequence of narrative acts.
    
    Stores the deterministic waypoints that guide the Voyager through
    the "Tavern Voyage" scenario.
    """
    
    def __init__(self):
        """Initialize the playbook with the Tavern Voyage script."""
        self.acts: List[Act] = []
        self.current_act_index: int = 0
        self.is_performance_complete: bool = False
        
        self._load_tavern_voyage_script()
        logger.info("📖 Playbook initialized with 'Tavern Voyage' script")
    
    def _load_tavern_voyage_script(self) -> None:
        """Load the pre-baked Tavern Voyage scenario."""
        script = [
            {
                "act_number": 1,
                "target": (10, 25),  # Forest edge position
                "scene": SceneType.FOREST_EDGE,
                "description": "The dense forest gives way to a well-worn path leading to iron gates",
                "cue": "cue_forest_to_gate",
                "tags": ["forest", "journey", "approach", "iron_frame_visible"]
            },
            {
                "act_number": 2,
                "target": (10, 20),  # Town gate position
                "scene": SceneType.TOWN_GATE,
                "description": "Massive iron gates stand open, revealing the bustling town square within",
                "cue": "cue_gate_to_square",
                "tags": ["gate", "transition", "city_entrance", "iron_frame"]
            },
            {
                "act_number": 3,
                "target": (10, 10),  # Town square center
                "scene": SceneType.TOWN_SQUARE,
                "description": "The town square buzzes with activity. A tavern sign creaks in the breeze",
                "cue": "cue_square_to_tavern",
                "tags": ["square", "social", "tavern_visible", "destination"]
            },
            {
                "act_number": 4,
                "target": (20, 10),  # Tavern door position
                "scene": SceneType.TAVERN_ENTRY,
                "description": "Heavy wooden tavern door beckons with warmth and promise of rest",
                "cue": "cue_tavern_entrance",
                "tags": ["tavern", "entrance", "hospitality", "final_destination"]
            },
            {
                "act_number": 5,
                "target": (25, 30),  # Tavern interior position
                "scene": SceneType.TAVERN_INTERIOR,
                "description": "The dim warmth of the taproom envelops you, firelight dancing on rough-hewn tables",
                "cue": "cue_performance_complete",
                "tags": ["interior", "warmth", "firelight", "story_complete"]
            }
        ]
        
        # Create Act objects from script
        for act_data in script:
            act = Act(
                act_number=act_data["act_number"],
                target_position=act_data["target"],
                scene_type=act_data["scene"],
                scene_description=act_data["description"],
                on_arrival_cue=act_data["cue"],
                narrative_tags=act_data["tags"]
            )
            self.acts.append(act)
        
        logger.info(f"📝 Loaded {len(self.acts)} acts for Tavern Voyage")
    
    def get_current_act(self) -> Optional[Act]:
        """Get the current active act."""
        if 0 <= self.current_act_index < len(self.acts):
            return self.acts[self.current_act_index]
        return None
    
    def get_next_act(self) -> Optional[Act]:
        """Get the next act in the sequence."""
        next_index = self.current_act_index + 1
        if next_index < len(self.acts):
            return self.acts[next_index]
        return None
    
    def advance_to_next_act(self) -> bool:
        """Advance to the next act in the script."""
        current_act = self.get_current_act()
        if current_act and not current_act.is_complete:
            logger.warning(f"🎭 Current act {current_act.act_number} not yet complete")
            return False
        
        self.current_act_index += 1
        
        if self.current_act_index >= len(self.acts):
            self.is_performance_complete = True
            logger.info("🎬 Playbook performance complete!")
            return False
        
        next_act = self.get_current_act()
        if next_act:
            logger.info(f"🎭 Advanced to Act {next_act.act_number}: {next_act.scene_type.value}")
            return True
        
        return False
    
    def mark_current_act_complete(self) -> None:
        """Mark the current act as complete."""
        current_act = self.get_current_act()
        if current_act:
            current_act.mark_complete()
            logger.info(f"✅ Act {current_act.act_number} '{current_act.scene_type.value}' completed")
    
    def get_target_position(self) -> Optional[Tuple[int, int]]:
        """Get the target position for the current act."""
        current_act = self.get_current_act()
        return current_act.target_position if current_act else None
    
    def get_arrival_cue(self) -> Optional[str]:
        """Get the arrival cue for the current act."""
        current_act = self.get_current_act()
        return current_act.on_arrival_cue if current_act else None
    
    def get_narrative_tags(self) -> List[str]:
        """Get narrative tags for the current act."""
        current_act = self.get_current_act()
        return current_act.narrative_tags if current_act else []
    
    def get_scene_description(self) -> Optional[str]:
        """Get the scene description for the current act."""
        current_act = self.get_current_act()
        return current_act.scene_description if current_act else None
    
    def reset_performance(self) -> None:
        """Reset the entire performance for a new run."""
        for act in self.acts:
            act.is_complete = False
        
        self.current_act_index = 0
        self.is_performance_complete = False
        
        logger.info("🔄 Playbook performance reset")
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get a summary of the current performance state."""
        completed_acts = [act for act in self.acts if act.is_complete]
        current_act = self.get_current_act()
        
        return {
            "total_acts": len(self.acts),
            "completed_acts": len(completed_acts),
            "current_act_number": current_act.act_number if current_act else None,
            "current_scene": current_act.scene_type.value if current_act else None,
            "performance_complete": self.is_performance_complete,
            "progress_percentage": (len(completed_acts) / len(self.acts)) * 100 if self.acts else 0
        }


# Factory for creating pre-configured playbooks
class PlaybookFactory:
    """Factory for creating different scenario playbooks."""
    
    @staticmethod
    def create_tavern_voyage() -> Playbook:
        """Create the Tavern Voyage playbook."""
        return Playbook()
    
    @staticmethod
    def create_empty_playbook() -> Playbook:
        """Create an empty playbook for custom scenarios."""
        playbook = Playbook()
        playbook.acts.clear()
        logger.info("📖 Empty playbook created")
        return playbook
