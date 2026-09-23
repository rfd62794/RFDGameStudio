from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict
from src.shared.genetics.genome import SlimeGenome

class TeamRole(Enum):
    DUNGEON  = "dungeon"
    RACING   = "racing"
    CONQUEST = "conquest"
    UNASSIGNED = "unassigned"

@dataclass
class RosterEntry:
    """Reference layer entry - points to Creature but stores team-specific state"""
    slime_id: str  # Reference to Creature in Garden
    team: TeamRole = TeamRole.UNASSIGNED
    locked: bool = False  # True when on active mission
    
    # Note: All other data (name, genome, level, HP, etc.) comes from Creature
    # This eliminates duplication and ensures single source of truth

@dataclass  
class Team:
    role: TeamRole
    slots: int = 4
    members: list[RosterEntry] = field(default_factory=list)
    
    def is_full(self) -> bool:
        return len(self.members) >= self.slots
    
    def assign(self, slime_id: str) -> bool:
        """Assign creature by slime_id reference"""
        if self.is_full():
            return False
        
        # Check if creature already assigned to a team
        # This would require access to Roster to check other teams
        # For now, we'll assume caller handles this check
        entry = RosterEntry(slime_id=slime_id, team=self.role)
        self.members.append(entry)
        return True
    
    def remove(self, slime_id: str) -> bool:
        """Remove creature by slime_id reference"""
        member = next(
            (s for s in self.members if s.slime_id == slime_id), 
            None
        )
        if not member or member.locked:
            return False
        member.team = TeamRole.UNASSIGNED
        self.members = [
            s for s in self.members 
            if s.slime_id != slime_id
        ]
        return True

@dataclass
class Roster:
    """Team composition reference layer - points to Creatures in Garden"""
    entries: list[RosterEntry] = field(default_factory=list)
    teams: dict[TeamRole, Team] = field(default_factory=lambda: {
        TeamRole.DUNGEON: Team(role=TeamRole.DUNGEON, slots=4),
        TeamRole.RACING:  Team(role=TeamRole.RACING,  slots=1),
    })
    
    # Reference to Garden for creature lookups
    _garden_ref: Optional[object] = None  # Will be set by GardenState
    
    def set_garden_reference(self, garden_state):
        """Set reference to GardenState for creature lookups"""
        self._garden_ref = garden_state
    
    def get_creature(self, slime_id: str):
        """Get creature from Garden by slime_id"""
        if self._garden_ref:
            return self._garden_ref.get_creature(slime_id)
        return None
    
    def add_creature(self, slime_id: str):
        """Add creature reference to roster"""
        # Check if already exists
        for entry in self.entries:
            if entry.slime_id == slime_id:
                return  # Already in roster
        
        entry = RosterEntry(slime_id=slime_id)
        self.entries.append(entry)
    
    def remove_creature(self, slime_id: str) -> bool:
        """Remove creature reference from roster"""
        for i, entry in enumerate(self.entries):
            if entry.slime_id == slime_id:
                if not entry.locked:
                    # Remove from any team first
                    self.teams[entry.team].remove(slime_id)
                    del self.entries[i]
                    return True
        return False
    
    def get_dungeon_team(self) -> Team:
        """Get dungeon team with creature references"""
        return self.teams[TeamRole.DUNGEON]
    
    def get_racing_team(self) -> Team:
        """Get racing team with creature references"""
        return self.teams[TeamRole.RACING]
    
    def unassigned(self) -> list[str]:
        """Get slime_ids of unassigned creatures"""
        assigned_ids = set(entry.slime_id for entry in self.entries 
                         if entry.team != TeamRole.UNASSIGNED)
        all_ids = set(entry.slime_id for entry in self.entries)
        return list(all_ids - assigned_ids)
    
    def get_team_creatures(self, role: TeamRole) -> list:
        """Get actual Creature objects for a team"""
        team = self.teams.get(role)
        if not team or not self._garden_ref:
            return []
        
        creatures = []
        for entry in team.members:
            creature = self.get_creature(entry.slime_id)
            if creature:
                creatures.append(creature)
        return creatures
    
    def to_dict(self) -> dict:
        """Serialize roster references (not full creature data)"""
        return {
            "entries": [
                {
                    "slime_id": entry.slime_id,
                    "team": entry.team.value,
                    "locked": entry.locked
                }
                for entry in self.entries
            ]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Roster":
        """Restore roster references"""
        roster = cls()
        for e_data in data.get("entries", []):
            entry = RosterEntry(
                slime_id=e_data["slime_id"],
                team=TeamRole(e_data["team"]),
                locked=e_data.get("locked", False)
            )
            roster.entries.append(entry)
            
            # Add to appropriate team
            if entry.team != TeamRole.UNASSIGNED:
                roster.teams[entry.team].members.append(entry)
        
        return roster

    # === Legacy compatibility methods (deprecated) ===
    @property
    def slimes(self) -> list:
        """Legacy compatibility - expose creature references as slimes"""
        # This would need to return RosterSlime-like objects for compatibility
        # For now, return empty list to break old code explicitly
        return []

# Legacy RosterSlime class for backward compatibility
@dataclass
class RosterSlime:
    """DEPRECATED: Use Creature + RosterEntry instead"""
    slime_id: str
    name: str
    genome: SlimeGenome
    team: TeamRole = TeamRole.UNASSIGNED
    locked: bool = False
    alive: bool = True
    generation: int = 1
    level: int = 1
    experience: int = 0
    breeding_lock_level: int = 0
    current_hp: float = -1.0
    
    @classmethod
    def from_creature(cls, creature, team=TeamRole.UNASSIGNED, locked=False):
        """Create legacy RosterSlime from Creature"""
        return cls(
            slime_id=creature.slime_id,
            name=creature.name,
            genome=creature.genome,
            team=team,
            locked=locked,
            alive=creature.alive,
            generation=creature.generation,
            level=creature.level,
            experience=creature.experience,
            breeding_lock_level=creature.breeding_lock_level,
            current_hp=creature.current_hp
        )

# Extend Roster class with legacy methods
@dataclass
class Roster:
    """Team composition reference layer - points to Creatures in Garden"""
    entries: list[RosterEntry] = field(default_factory=list)
    teams: dict[TeamRole, Team] = field(default_factory=lambda: {
        TeamRole.DUNGEON: Team(role=TeamRole.DUNGEON, slots=4),
        TeamRole.RACING:  Team(role=TeamRole.RACING,  slots=1),
    })
    
    # Reference to Garden for creature lookups
    _garden_ref: Optional[object] = None  # Will be set by GardenState
    
    def set_garden_reference(self, garden_state):
        """Set reference to GardenState for creature lookups"""
        self._garden_ref = garden_state
    
    def get_creature(self, slime_id: str):
        """Get creature from Garden by slime_id"""
        if self._garden_ref:
            return self._garden_ref.get_creature(slime_id)
        return None
    
    def add_creature(self, slime_id: str):
        """Add creature reference to roster"""
        # Check if already exists
        for entry in self.entries:
            if entry.slime_id == slime_id:
                return  # Already in roster
        
        entry = RosterEntry(slime_id=slime_id)
        self.entries.append(entry)
    
    def remove_creature(self, slime_id: str) -> bool:
        """Remove creature reference from roster"""
        for i, entry in enumerate(self.entries):
            if entry.slime_id == slime_id:
                if not entry.locked:
                    # Remove from any team first
                    self.teams[entry.team].remove(slime_id)
                    del self.entries[i]
                    return True
        return False
    
    def get_dungeon_team(self) -> Team:
        """Get dungeon team with creature references"""
        return self.teams[TeamRole.DUNGEON]
    
    def get_racing_team(self) -> Team:
        """Get racing team with creature references"""
        return self.teams[TeamRole.RACING]
    
    def unassigned(self) -> list[str]:
        """Get slime_ids of unassigned creatures"""
        assigned_ids = set(entry.slime_id for entry in self.entries 
                         if entry.team != TeamRole.UNASSIGNED)
        all_ids = set(entry.slime_id for entry in self.entries)
        return list(all_ids - assigned_ids)
    
    def get_team_creatures(self, role: TeamRole) -> list:
        """Get actual Creature objects for a team"""
        team = self.teams.get(role)
        if not team or not self._garden_ref:
            return []
        
        creatures = []
        for entry in team.members:
            creature = self.get_creature(entry.slime_id)
            if creature:
                creatures.append(creature)
        return creatures
    
    def to_dict(self) -> dict:
        """Serialize roster references (not full creature data)"""
        return {
            "entries": [
                {
                    "slime_id": entry.slime_id,
                    "team": entry.team.value,
                    "locked": entry.locked
                }
                for entry in self.entries
            ]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Roster":
        """Restore roster references"""
        roster = cls()
        for e_data in data.get("entries", []):
            entry = RosterEntry(
                slime_id=e_data["slime_id"],
                team=TeamRole(e_data["team"]),
                locked=e_data.get("locked", False)
            )
            roster.entries.append(entry)
            
            # Add to appropriate team
            if entry.team != TeamRole.UNASSIGNED:
                roster.teams[entry.team].members.append(entry)
        
        return roster

    # === Legacy compatibility methods (deprecated) ===
    @property
    def slimes(self) -> list[RosterSlime]:
        """Legacy compatibility - convert entries to RosterSlime objects"""
        roster_slimes = []
        for entry in self.entries:
            creature = self.get_creature(entry.slime_id)
            if creature:
                roster_slime = RosterSlime.from_creature(
                    creature, 
                    team=entry.team, 
                    locked=entry.locked
                )
                roster_slimes.append(roster_slime)
        return roster_slimes
    
    def add_slime(self, slime: RosterSlime):
        """Legacy compatibility - convert RosterSlime to entry"""
        # Add creature reference if not exists
        self.add_creature(slime.slime_id)
        
        # Update team assignment
        for entry in self.entries:
            if entry.slime_id == slime.slime_id:
                entry.team = slime.team
                entry.locked = slime.locked
                # Add to team if not unassigned
                if slime.team != TeamRole.UNASSIGNED:
                break
    
    def unassigned(self) -> list[RosterSlime]:
        return [s for s in self.slimes 
                if s.team == TeamRole.UNASSIGNED
                and s.alive]
    
    def to_dict(self) -> dict:
        return {
            "slimes": [
                {
                    "slime_id": s.slime_id,
                    "name": s.name,
                    "team": s.team.value,
                    "locked": s.locked,
                    "alive": s.alive,
                    "genome": {
                        "shape": s.genome.shape,
                        "size": s.genome.size,
                        "base_color": s.genome.base_color,
                        "pattern": s.genome.pattern,
                        "pattern_color": s.genome.pattern_color,
                        "accessory": s.genome.accessory,
                        "curiosity": s.genome.curiosity,
                        "energy": s.genome.energy,
                        "affection": s.genome.affection,
                        "shyness": s.genome.shyness,
                        "cultural_base": s.genome.cultural_base.value,
                        "base_hp": s.genome.base_hp,
                        "base_atk": s.genome.base_atk,
                        "base_spd": s.genome.base_spd,
                        "generation": s.genome.generation
                    },
                    "level": s.level,
                    "experience": s.experience,
                    "breeding_lock_level": s.breeding_lock_level,
                    "current_hp": s.current_hp
                }
                for s in self.slimes
            ]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Roster":
        roster = cls()
        for s in data.get("slimes", []):
            g_data = s["genome"]
            # Cast culture string back to Enum with migration support
            from src.shared.genetics.cultural_base import CulturalBase
            
            culture_value = g_data.get("cultural_base", "void")
            # Handle old culture names during migration
            culture_aliases = {
                'marsh': 'marsh',
                'tundra': 'tundra',
                'varied': 'void'
            }
            culture_value = culture_aliases.get(culture_value, culture_value)
            
            try:
                g_data["cultural_base"] = CulturalBase(culture_value)
            except ValueError:
                # Fallback to void if culture is invalid
                g_data["cultural_base"] = CulturalBase.VOID
            
            # Ensure base stats exist (for backward compatibility if needed)
            if "base_hp" not in g_data: g_data["base_hp"] = 20.0
            if "base_atk" not in g_data: g_data["base_atk"] = 5.0
            if "base_spd" not in g_data: g_data["base_spd"] = 5.0
            if "generation" not in g_data: g_data["generation"] = 1
            
            genome = SlimeGenome(**g_data)
            rs = RosterSlime(
                slime_id=s["slime_id"],
                name=s["name"],
                genome=genome,
                team=TeamRole(s["team"]),
                locked=s["locked"],
                alive=s["alive"],
                level=s.get("level", 1),
                experience=s.get("experience", 0),
                breeding_lock_level=s.get("breeding_lock_level", 0),
                current_hp=s.get("current_hp", -1.0),
                generation=s.get("generation", 1)
            )
            roster.slimes.append(rs)
            if rs.team != TeamRole.UNASSIGNED:
                roster.teams[rs.team].members.append(rs)
        return roster
