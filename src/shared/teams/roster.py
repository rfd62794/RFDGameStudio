from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, TYPE_CHECKING, List
from src.shared.genetics.genome import SlimeGenome

if TYPE_CHECKING:
    pass

class TeamMembersList(list):
    """Custom list that handles legacy RosterSlime containment checks and removal"""
    def __contains__(self, slime_or_id):
        """Check if slime is in team (legacy compatibility)"""
        if hasattr(slime_or_id, 'slime_id'):
            slime_id = slime_or_id.slime_id
        else:
            slime_id = slime_or_id
        
        return any(member.slime_id == slime_id for member in self)
    
    def remove(self, slime_or_id):
        """Remove slime from team (legacy compatibility)"""
        if hasattr(slime_or_id, 'slime_id'):
            slime_id = slime_or_id.slime_id
        else:
            slime_id = slime_or_id
        
        # Find and remove the entry
        for i, member in enumerate(self):
            if member.slime_id == slime_id:
                super().remove(member)
                return
        
        # If not found as entry, try to remove as-is for compatibility
        try:
            super().remove(slime_or_id)
        except ValueError:
            pass  # Silently fail for compatibility
    
    def __getitem__(self, index):
        """Get item by index - return RosterSlime for legacy compatibility"""
        entry = super().__getitem__(index)
        # Try to get the RosterSlime from the roster through multiple paths
        if hasattr(self, '_team_ref') and self._team_ref:
            # Try through team -> roster
            if hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
                return self._team_ref._roster_ref._roster_slimes.get(entry.slime_id)
            # Try through direct roster access if team has roster reference
            if hasattr(self._team_ref, '_roster_ref') and hasattr(self._team_ref._roster_ref, '_roster_slimes'):
                return self._team_ref._roster_ref._roster_slimes.get(entry.slime_id)
        return entry

class TeamRole(Enum):
    DUNGEON  = "dungeon"
    RACING   = "racing"
    CONQUEST = "conquest"
    UNASSIGNED = "unassigned"

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
    
    # Stat XP fields (new for six-stat system)
    vit_xp: int = 0
    pwr_xp: int = 0
    agi_xp: int = 0
    mnd_xp: int = 0
    res_xp: int = 0
    chm_xp: int = 0
    
    def __post_init__(self):
        if self.current_hp < 0:
            from src.shared.teams.stat_calculator import calculate_hp
            self.current_hp = float(calculate_hp(self.genome, self.level))
    
    def _sync_to_roster_entry(self, roster):
        """Sync this RosterSlime's state to the corresponding RosterEntry"""
        for entry in roster.entries:
            if entry.slime_id == self.slime_id:
                entry.locked = self.locked
                entry.team = self.team
                break
    
    @property
    def max_hp(self) -> int:
        from src.shared.teams.stat_calculator import calculate_hp
        return calculate_hp(self.genome, self.level)
    
    @property
    def is_elder(self) -> bool:
        return self.level >= 10
    
    @property
    def can_breed(self) -> bool:
        """Min level 3 required, and must be above last bred level (drain mechanic)."""
        return self.level >= 3 and self.level > self.breeding_lock_level

    @property
    def xp_to_next_level(self) -> int:
        return 5 + (self.level * 2)

    @property
    def stat_block(self) -> 'StatBlock':
        """
        Computed stats for this slime.
        Derived from genome on access.
        No caching — always fresh.
        """
        from src.shared.stats.stat_block import StatBlock
        return StatBlock.from_genome(self.genome)

    def gain_exp(self, amount: int) -> bool:
        """Adds exp and returns True if leveled up."""
        self.experience += amount
        leveled_up = False
        while self.experience >= self.xp_to_next_level:
            self.experience -= self.xp_to_next_level
            self.level += 1
            leveled_up = True
        return leveled_up
    
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
            current_hp=creature.current_hp,
            vit_xp=getattr(creature, 'vit_xp', 0),
            pwr_xp=getattr(creature, 'pwr_xp', 0),
            agi_xp=getattr(creature, 'agi_xp', 0),
            mnd_xp=getattr(creature, 'mnd_xp', 0),
            res_xp=getattr(creature, 'res_xp', 0),
            chm_xp=getattr(creature, 'chm_xp', 0)
        )

@dataclass
class RosterEntry:
    """Reference layer entry - points to Creature but stores team-specific state"""
    slime_id: str  # Reference to Creature in Garden
    team: TeamRole = TeamRole.UNASSIGNED
    locked: bool = False  # True when on active mission
    alive: bool = True  # Combat/mission status
    
    # Note: All other data (name, genome, level, HP, etc.) comes from Creature
    # This eliminates duplication and ensures single source of truth
    
    @property
    def name(self) -> str:
        """Legacy compatibility - get name from roster's stored RosterSlime"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.name
        return f"Creature_{self.slime_id}"
    
    @property
    def is_elder(self) -> bool:
        """Check if this slime is elder (level >= 10)"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.level >= 10
        return False
    
    @property
    def level(self) -> int:
        """Get slime level from roster's stored RosterSlime"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.level
        return 1
    
    @property
    def genome(self):
        """Get slime genome from roster's stored RosterSlime"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.genome
        return None
    
    @property
    def generation(self) -> int:
        """Get slime generation from roster's stored RosterSlime"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.generation
        return 1
    
    @property
    def experience(self) -> int:
        """Get slime experience from roster's stored RosterSlime"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.experience
        return 0
    
    @property
    def xp_to_next_level(self) -> int:
        """Get slime XP to next level from roster's stored RosterSlime"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.xp_to_next_level
        return 100
    
    @property
    def can_breed(self) -> bool:
        """Get slime breeding status from roster's stored RosterSlime"""
        if hasattr(self, '_team_ref') and self._team_ref and hasattr(self._team_ref, '_roster_ref') and self._team_ref._roster_ref:
            roster_slime = self._team_ref._roster_ref._roster_slimes.get(self.slime_id)
            if roster_slime:
                return roster_slime.can_breed
        return False

@dataclass  
class Team:
    role: TeamRole
    slots: int = 4
    members: TeamMembersList = field(default_factory=TeamMembersList)
    
    def is_full(self) -> bool:
        return len(self.members) >= self.slots
    
    def assign(self, slime_or_id) -> bool:
        """Assign creature by slime_id reference or RosterSlime object (legacy)"""
        if self.is_full():
            return False
        
        # Handle both RosterSlime objects and slime_id strings
        if hasattr(slime_or_id, 'slime_id'):
            slime_id = slime_or_id.slime_id
            # Update the RosterSlime object's team for legacy compatibility
            slime_or_id.team = self.role
            
            # Add RosterSlime to roster if not already there
            if hasattr(self, '_roster_ref') and self._roster_ref:
                if slime_id not in self._roster_ref._roster_slimes:
                    self._roster_ref.add_slime(slime_or_id)
                    return True  # Successfully added new slime
                else:
                    # Check if already assigned to this team
                    for entry in self._roster_ref.entries:
                        if entry.slime_id == slime_id and entry.team == self.role:
                            return False  # Already assigned to this team
                    # Update existing entry to this team
                    for entry in self._roster_ref.entries:
                        if entry.slime_id == slime_id:
                            entry.team = self.role
                            entry._team_ref = self  # Set back-reference
                            if entry not in self.members:
                                self.members.append(entry)
                            return True
        else:
            slime_id = slime_or_id
        
        # Check if already in team
        for member in self.members:
            if member.slime_id == slime_id:
                return False  # Already assigned
        
        entry = RosterEntry(slime_id=slime_id, team=self.role)
        entry._team_ref = self  # Set back-reference for legacy compatibility
        self.members.append(entry)
        return True
    
    def __contains__(self, slime_or_id) -> bool:
        """Check if slime is in team (legacy compatibility)"""
        if hasattr(slime_or_id, 'slime_id'):
            slime_id = slime_or_id.slime_id
        else:
            slime_id = slime_or_id
        
        return any(member.slime_id == slime_id for member in self.members)
    
    def remove(self, slime_id: str) -> bool:
        """Remove creature by slime_id reference"""
        member = next(
            (s for s in self.members if s.slime_id == slime_id), 
            None
        )
        if not member:
            return False
        
        # Check if creature is locked - check current RosterSlime state
        if hasattr(self, '_roster_ref') and self._roster_ref:
            # Find the RosterSlime in the roster's slimes list
            for roster_slime in self._roster_ref.slimes:
                if roster_slime.slime_id == slime_id and roster_slime.locked:
                    return False
        
        # Fallback to entry state
        if member.locked:
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
    
    # Store original RosterSlime objects for legacy compatibility
    _roster_slimes: dict[str, RosterSlime] = field(default_factory=dict)
    
    # Reference to Garden for creature lookups
    _garden_ref: Optional[object] = None  # Will be set by GardenState
    
    def __post_init__(self):
        # Set back-reference from teams to roster
        for team in self.teams.values():
            team._roster_ref = self
    
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
            ],
            "teams": {
                role.value: {
                    "role": team.role.value,
                    "slots": team.slots,
                    "members": [
                        {
                            "slime_id": member.slime_id,
                            "team": member.team.value,
                            "locked": member.locked,
                            "alive": member.alive
                        }
                        for member in team.members
                    ]
                }
                for role, team in self.teams.items()
            }
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Roster":
        """Restore roster references - handle both legacy and new formats"""
        roster = cls()
        
        # Check if this is legacy format (contains "slimes") or new format (contains "entries")
        if "slimes" in data:
            # Legacy format - restore RosterSlime objects
            for s in data.get("slimes", []):
                g_data = s["genome"]
                # Cast culture string back to Enum with migration support
                from src.shared.genetics.cultural_base import CulturalBase
                
                culture_value = g_data.get("cultural_base", "void")
                # Culture validation is handled by enum casting below
                
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
                
                # Migrate culture_expression if missing
                g_data = Roster._migrate_genome(g_data)
                
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
                    generation=s.get("generation", 1),
                    vit_xp=s.get("vit_xp", 0),
                    pwr_xp=s.get("pwr_xp", 0),
                    agi_xp=s.get("agi_xp", 0),
                    mnd_xp=s.get("mnd_xp", 0),
                    res_xp=s.get("res_xp", 0),
                    chm_xp=s.get("chm_xp", 0)
                )
                
                # Validate loaded slime (warn-only for save data integrity)
                from src.shared.genetics.entity_template import SlimeEntityTemplate
                from loguru import logger
                errors = SlimeEntityTemplate.validate(rs)
                if errors:
                    logger.warning(
                        f"Loaded slime {rs.slime_id} has validation issues: {errors}"
                    )
                    # Do not reject loaded slimes - data integrity requires loading what exists
                
                roster.add_slime(rs)
                # Set back-reference for the entry that was created by add_slime
                for entry in roster.entries:
                    if entry.slime_id == rs.slime_id:
                        # Only set team_ref if not UNASSIGNED
                        if rs.team != TeamRole.UNASSIGNED and rs.team in roster.teams:
                            entry._team_ref = roster.teams[rs.team]
                        break
        else:
            # New format - restore entries only
            for e_data in data.get("entries", []):
                entry = RosterEntry(
                    slime_id=e_data["slime_id"],
                    team=TeamRole(e_data["team"]),
                    locked=e_data.get("locked", False)
                )
                roster.entries.append(entry)
                
                # Add to appropriate team and set back-reference
                if entry.team != TeamRole.UNASSIGNED:
                    entry._team_ref = roster.teams[entry.team]
                    roster.teams[entry.team].members.append(entry)
        
        # Restore teams data if available (new format)
        if "teams" in data:
            for role_name, team_data in data["teams"].items():
                role = TeamRole(role_name)
                if role in roster.teams:
                    team = roster.teams[role]
                    team.slots = team_data.get("slots", 4)
                    
                    # Clear existing members and restore from data
                    team.members.clear()
                    for member_data in team_data.get("members", []):
                        member_entry = RosterEntry(
                            slime_id=member_data["slime_id"],
                            team=TeamRole(member_data["team"]),
                            locked=member_data.get("locked", False),
                            alive=member_data.get("alive", True)
                        )
                        team.members.append(member_entry)
                        # Set back-reference
                        member_entry._team_ref = team
        
        # Set all back-references after loading (for both legacy and new formats)
        roster._set_back_references()
        return roster
    
    def _set_back_references(self):
        """Set back-references after loading (called from from_dict)"""
        # Set roster reference for teams
        for team in self.teams.values():
            team._roster_ref = self
        
        # Set team reference for entries (always set to ensure consistency)
        for entry in self.entries:
            if entry.team != TeamRole.UNASSIGNED:
                entry._team_ref = self.teams[entry.team]

    @staticmethod
    def _migrate_genome(genome_data: dict) -> dict:
        """
        Ensure culture_expression is populated.
        Runs on every slime loaded from save.
        """
        expr = genome_data.get('culture_expression', {})
        if not expr:
            # Derive from cultural_base
            base = genome_data.get('cultural_base', 'marsh')
            # Handle enum values and normalize key
            if hasattr(base, 'value'):
                base = base.value
            key = base.lower().replace('culturalbase.', '').strip()
            
            # Normalize key
            key = base.lower().replace('culturalbase.', '').strip()
            
            genome_data['culture_expression'] = {key: 1.0}
        return genome_data

    # === Legacy compatibility methods (deprecated) ===
    @property
    def slimes(self) -> list[RosterSlime]:
        """Legacy compatibility - return stored RosterSlime objects"""
        return list(self._roster_slimes.values())
    
    def add_slime(self, slime: RosterSlime):
        """Legacy compatibility - convert RosterSlime to entry"""
        # Add creature reference if not exists
        self.add_creature(slime.slime_id)
        
        # Store original RosterSlime for state preservation
        self._roster_slimes[slime.slime_id] = slime
        
        # Update team assignment and sync locked state
        for entry in self.entries:
            if entry.slime_id == slime.slime_id:
                entry.team = slime.team
                entry.locked = slime.locked
                # Add to team if not unassigned
                if slime.team != TeamRole.UNASSIGNED:
                    if slime.team not in self.teams:
                        self.teams[slime.team] = Team(role=slime.team)
                    if entry not in self.teams[slime.team].members:
                        self.teams[slime.team].members.append(entry)
                break
    
    def unassigned(self) -> list[RosterSlime]:
        """Legacy compatibility - return unassigned as RosterSlime objects"""
        return [s for s in self.slimes 
                if s.team == TeamRole.UNASSIGNED
                and s.alive]
    
    def to_dict(self) -> dict:
        """Legacy compatibility - serialize full RosterSlime data"""
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
                    "current_hp": s.current_hp,
                    "vit_xp": s.vit_xp,
                    "pwr_xp": s.pwr_xp,
                    "agi_xp": s.agi_xp,
                    "mnd_xp": s.mnd_xp,
                    "res_xp": s.res_xp,
                    "chm_xp": s.chm_xp
                }
                for s in self.slimes
            ]
        }
