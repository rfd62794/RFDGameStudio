"""
SceneContext - Data carrier for scene-ECS interaction
"""

from dataclasses import dataclass, field
from typing import Optional, Any, List, TYPE_CHECKING

if TYPE_CHECKING:
    from src.shared.state.entity_registry import EntityRegistry
    from src.shared.session.game_session import GameSession
    from src.shared.dispatch.dispatch_system import DispatchSystem
    from src.shared.ui.theme import UITheme


@dataclass
class SceneContext:
    """
    ECS interaction context for scenes.
    
    Provides scenes with access to shared systems without
    requiring direct knowledge of implementation details.
    Acts as a facade over the ECS infrastructure.
    """
    entity_registry: Optional['EntityRegistry'] = None
    game_session: Optional['GameSession'] = None
    dispatch_system: Optional['DispatchSystem'] = None
    roster: Any = None
    theme: Optional['UITheme'] = None
    roster_sync: Optional['RosterSyncService'] = None
    
    def __post_init__(self):
        """Ensure roster is available in context for all scenes"""
        # Only load roster if none was provided
        if self.roster is None:
            from src.shared.teams.roster_save import load_roster
            self.roster = load_roster()
    
    # Convenience accessors
    def get_team(self, role: str) -> List[Any]:
        """Get team members by role"""
        if self.entity_registry and hasattr(self.entity_registry, 'get_team'):
            return self.entity_registry.get_team(role)
        elif self.roster and hasattr(self.roster, f'get_{role}_team'):
            team = getattr(self.roster, f'get_{role}_team')()
            return team.members if team else []
        return []
    
    def get_entity(self, entity_id: str) -> Any:
        """Get entity by ID"""
        if self.entity_registry:
            return self.entity_registry.get(entity_id)
        return None
    
    def add_resource(self, resource: str, amount: int) -> bool:
        """Add resources to game session"""
        if self.game_session and hasattr(self.game_session, 'resources'):
            current = self.game_session.resources.get(resource, 0)
            self.game_session.resources[resource] = current + amount
            return True
        return False
    
    def get_resource(self, resource: str) -> int:
        """Get resource amount from game session"""
        if self.game_session and hasattr(self.game_session, 'resources'):
            return self.game_session.resources.get(resource, 0)
        return 0
    
    def get_entities(self) -> List[Any]:
        """Get all entities from registry"""
        if self.entity_registry and hasattr(self.entity_registry, 'get_all'):
            return self.entity_registry.get_all()
        return []
    
    def create_entity(self, entity_type: str, **kwargs) -> Any:
        """Create entity through registry"""
        if self.entity_registry and hasattr(self.entity_registry, 'create'):
            return self.entity_registry.create(entity_type, **kwargs)
        return None
    
    def remove_entity(self, entity_id: str) -> bool:
        """Remove entity through registry"""
        if self.entity_registry and hasattr(self.entity_registry, 'remove'):
            return self.entity_registry.remove(entity_id)
        return False
    
    def save_roster(self) -> bool:
        """Save roster and session to file using SaveManager"""
        if self.roster and self.game_session:
            from src.shared.persistence.save_manager import SaveManager
            return SaveManager.save(self.roster, self.game_session)
        return False
