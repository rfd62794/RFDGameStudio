"""
RosterSyncService - Single point of truth for slime add/remove operations
Keeps Roster and EntityRegistry in sync automatically
"""

from typing import Optional
from loguru import logger

from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.state.entity_registry import EntityRegistry


class RosterSyncService:
    """
    Single point of entry for all slime add/remove operations.
    Keeps Roster and EntityRegistry in sync automatically.
    """

    def __init__(self, roster: Roster, registry: EntityRegistry):
        self.roster = roster
        self.registry = registry

    def add_slime(self, slime: RosterSlime) -> bool:
        """
        Add slime to both systems atomically.
        Returns True if added successfully.
        """
        try:
            # Validate slime using template (hard rejection now enabled)
            from src.shared.genetics.entity_template import SlimeEntityTemplate
            errors = SlimeEntityTemplate.validate(slime)
            if errors:
                logger.error(
                    f"Rejecting slime {slime.slime_id}: "
                    f"{errors}"
                )
                return False
            
            self.roster.add_slime(slime)
            self.registry.register(slime)
            logger.debug(f"Added slime {slime.slime_id} to both roster and registry")
            return True
        except Exception as e:
            logger.error(f"Failed to add slime {slime.slime_id}: {e}")
            # Rollback if partial failure
            self._rollback_add(slime)
            return False

    def remove_slime(self, slime_id: str) -> bool:
        """
        Remove slime from both systems.
        Returns True if removed successfully.
        """
        try:
            # Find the entry first to get team info
            entry = None
            for e in self.roster.entries:
                if e.slime_id == slime_id:
                    entry = e
                    break
            
            if not entry:
                logger.warning(f"Slime {slime_id} not found in roster entries")
                return False
            
            if entry.locked:
                logger.warning(f"Cannot remove locked slime {slime_id}")
                return False
            
            # Remove from entries
            self.roster.entries.remove(entry)
            
            # Remove from team if not unassigned
            if entry.team != TeamRole.UNASSIGNED and entry.team in self.roster.teams:
                self.roster.teams[entry.team].remove(slime_id)
            
            # Remove from _roster_slimes dict
            if slime_id in self.roster._roster_slimes:
                del self.roster._roster_slimes[slime_id]
            
            # Remove from registry
            self.registry.unregister(slime_id)
            
            logger.debug(f"Removed slime {slime_id} from both roster and registry")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove slime {slime_id}: {e}")
            return False

    def sync_from_roster(self) -> int:
        """
        Rebuild EntityRegistry from Roster.
        Called on startup after save load.
        Returns count of synced slimes.
        """
        # Clear existing registry
        self.registry._entities.clear()
        
        count = 0
        for slime in self.roster.slimes:
            self.registry.register(slime)
            count += 1
        
        logger.info(f"Synced {count} slimes from roster to registry")
        return count

    def is_synced(self) -> bool:
        """
        Verify both systems agree.
        Used in tests and debug checks.
        """
        roster_ids = set(self.roster._roster_slimes.keys())
        registry_ids = set(self.registry._entities.keys())
        return roster_ids == registry_ids

    def _rollback_add(self, slime: RosterSlime) -> None:
        """Attempt to rollback partial add failure"""
        try:
            # Try to remove from roster entries
            self.roster.remove_creature(slime.slime_id)
        except Exception:
            pass
        try:
            # Try to remove from roster _roster_slimes
            if slime.slime_id in self.roster._roster_slimes:
                del self.roster._roster_slimes[slime.slime_id]
        except Exception:
            pass
        try:
            # Try to remove from registry
            self.registry.unregister(slime.slime_id)
        except Exception:
            pass
