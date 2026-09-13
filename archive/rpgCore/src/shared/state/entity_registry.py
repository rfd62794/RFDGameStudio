"""
Entity Registry - Shared slime access across scenes

Provides a simple, non-singleton registry that scenes can query
to access slime objects without creating global state.
"""

from typing import Dict, List, Optional
from src.shared.teams.roster import Roster, RosterSlime, TeamRole


class EntityRegistry:
    """
    Simple registry for sharing slime objects between scenes.
    
    NOT a singleton - passed explicitly to scenes that need it.
    Owned by the top-level app/scene manager.
    """
    
    def __init__(self):
        self._entities: Dict[str, RosterSlime] = {}
    
    def register(self, slime: RosterSlime) -> None:
        """Register a slime in the registry"""
        self._entities[slime.slime_id] = slime
    
    def get(self, slime_id: str) -> Optional[RosterSlime]:
        """Get a slime by ID"""
        return self._entities.get(slime_id)
    
    def get_team(self, team_role: str) -> List[RosterSlime]:
        """Get all slimes assigned to a team"""
        team_slimes = []
        for slime in self._entities.values():
            if slime.team.value == team_role:
                team_slimes.append(slime)
        return team_slimes
    
    def all(self) -> List[RosterSlime]:
        """Get all registered slimes"""
        return list(self._entities.values())
    
    def unregister(self, slime_id: str) -> None:
        """Remove a slime from the registry"""
        self._entities.pop(slime_id, None)
    
    @classmethod
    def from_roster(cls, roster: Roster) -> "EntityRegistry":
        """Create registry populated from existing Roster"""
        registry = cls()
        
        # Register all slimes from roster (old format)
        for slime in roster.slimes:
            registry.register(slime)
        
        return registry
