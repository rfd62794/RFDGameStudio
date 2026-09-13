"""
Unified Creature Entity - Merger of Slime + RosterSlime
Primary identifier: slime_id (UUID-based)
Display name: mutable field, not identity marker
"""
import uuid
from dataclasses import dataclass, field
from typing import Optional, Tuple
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Kinematics, Vector2
from src.shared.teams.roster import TeamRole

@dataclass
class Creature:
    """Unified creature entity across all demos (Garden, Racing, Dungeon, Tower Defense)"""
    
    # Primary Identity (Immutable)
    slime_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Display (Mutable)
    name: str = "Unnamed"
    
    # Core Components
    genome: SlimeGenome = field(default_factory=lambda: SlimeGenome(
        shape="round", size="medium", base_color=(100, 100, 255),
        pattern="solid", pattern_color=(255, 255, 255), accessory="none",
        curiosity=0.5, energy=0.5, affection=0.5, shyness=0.5
    ))
    
    # Physics State
    kinematics: Kinematics = field(default_factory=lambda: Kinematics(
        position=Vector2(400, 300),
        velocity=Vector2(0, 0)
    ))
    
    # Progression (from RosterSlime)
    level: int = 1
    experience: int = 0
    breeding_lock_level: int = 0  # Cannot breed if level <= breeding_lock_level
    current_hp: float = -1.0  # -1 means calculate from genome
    alive: bool = True
    generation: int = 1
    
    # Stat XP fields (new)
    vit_xp: int = 0
    pwr_xp: int = 0
    agi_xp: int = 0
    mnd_xp: int = 0
    res_xp: int = 0
    chm_xp: int = 0
    
    # Team Assignment (from RosterSlime)
    team: TeamRole = TeamRole.UNASSIGNED
    locked: bool = False  # True when on active mission
    
    # Garden-specific state
    age: int = 0  # ticks lived
    mood: str = "happy"
    _target_pos: Optional[Vector2] = None
    _wander_timer: float = 0.0
    
    def __post_init__(self):
        """Initialize derived values"""
        if self.current_hp < 0:
            from src.shared.teams.stat_calculator import calculate_hp
            self.current_hp = float(calculate_hp(self.genome, self.level))
    
    # === Properties (from RosterSlime) ===
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
    
    # === Methods (merged from both classes) ===
    def gain_exp(self, amount: int) -> bool:
        """Adds exp and returns True if leveled up."""
        self.experience += amount
        leveled_up = False
        while self.experience >= self.xp_to_next_level:
            self.experience -= self.xp_to_next_level
            self.level += 1
            leveled_up = True
            # Recalculate HP on level up
            from src.shared.teams.stat_calculator import calculate_hp
            old_hp_pct = self.current_hp / self.max_hp
            self.current_hp = float(calculate_hp(self.genome, self.level))
            self.current_hp *= old_hp_pct  # Maintain HP percentage
        return leveled_up
    
    def update(self, dt: float, cursor_pos: Optional[Tuple[float, float]] = None) -> None:
        """Update creature state (from Slime.update)"""
        import random
        import math
        
        self.age += 1
        self._wander_timer -= dt
        
        target_force = Vector2(0, 0)
        
        # 1. Shyness: Retreat from cursor
        if cursor_pos:
            cursor_vec = Vector2(*cursor_pos)
            diff = self.kinematics.position - cursor_vec
            dist_to_cursor = diff.magnitude()
            
            if dist_to_cursor < 200.0:
                # Shy slimes retreat (Priority 1)
                if self.genome.shyness > 0.7:
                    retreat_dir = diff.normalize()
                    # Retreat faster if shy
                    target_force += retreat_dir * (self.genome.shyness * 400.0)
                
                # Affectionate slimes follow (if not too shy)
                elif self.genome.affection > 0.7:
                    if dist_to_cursor > 40.0: # Stop when close
                        follow_dir = (cursor_vec - self.kinematics.position).normalize()
                        target_force += follow_dir * (self.genome.affection * 200.0)

        # 2. Curiosity: Wander toward edges/random points
        if self._wander_timer <= 0:
            # High energy slimes change direction more often
            self._wander_timer = random.uniform(1.0, 3.0) / (0.5 + self.genome.energy)
            
            if self.genome.curiosity > 0.7:
                # Target points near edges or random
                if random.random() < 0.5:
                    self._target_pos = Vector2(random.choice([30, 770]), random.uniform(30, 570))
                else:
                    self._target_pos = Vector2(random.uniform(50, 750), random.uniform(50, 550))
            elif self.genome.energy > 0.3:
                # Random drift point
                self._target_pos = self.kinematics.position + Vector2(random.uniform(-100, 100), random.uniform(-100, 100))
            else:
                self._target_pos = None # Slow/Sleepy

        if self._target_pos:
            diff = self._target_pos - self.kinematics.position
            if diff.magnitude() > 10.0:
                dir_to_target = diff.normalize()
                # Energy affects force
                force_mag = 20.0 + (self.genome.energy * 80.0)
                target_force += dir_to_target * force_mag
            else:
                self._target_pos = None

        # Apply friction (Energy affects how "slippery" they are)
        friction = 0.92 + (self.genome.energy * 0.05)
        self.kinematics.velocity *= min(0.98, friction)
        
        # Apply force to velocity (simplistic integration)
        self.kinematics.velocity += target_force * dt
        
        # Clamp speed
        max_speed = 50.0 + (self.genome.energy * 150.0)
        speed = self.kinematics.velocity.magnitude()
        if speed > max_speed:
            self.kinematics.velocity = self.kinematics.velocity.normalize() * max_speed
        
        # Update position
        self.kinematics.update(dt)
        
        # Keep in bounds
        self._handle_bounds(800, 600)
        self._update_mood()
    
    def _handle_bounds(self, width: int, height: int):
        """Keep creature in bounds"""
        margin = 30
        if self.kinematics.position.x < margin:
            self.kinematics.position.x = margin
            self.kinematics.velocity.x *= -0.5
            self._target_pos = None
        elif self.kinematics.position.x > width - margin:
            self.kinematics.position.x = width - margin
            self.kinematics.velocity.x *= -0.5
            self._target_pos = None
            
        if self.kinematics.position.y < margin:
            self.kinematics.position.y = margin
            self.kinematics.velocity.y *= -0.5
            self._target_pos = None
        elif self.kinematics.position.y > height - margin:
            self.kinematics.position.y = height - margin
            self.kinematics.velocity.y *= -0.5
            self._target_pos = None

    def _update_mood(self) -> None:
        """Update mood based on genome traits"""
        if self.genome.energy < 0.3:
            self.mood = "Sleepy"
        elif self.genome.shyness > 0.7:
            self.mood = "Shy"
        elif self.genome.affection > 0.7:
            self.mood = "Playful"
        elif self.genome.curiosity > 0.7:
            self.mood = "Curious"
        else:
            self.mood = "Happy"

    def get_mood(self) -> str:
        return self.mood
    
    # === Serialization (for persistence) ===
    def to_dict(self) -> dict:
        """Serialize creature for persistence"""
        return {
            "slime_id": self.slime_id,
            "name": self.name,
            "genome": {
                "shape": self.genome.shape,
                "size": self.genome.size,
                "base_color": self.genome.base_color,
                "pattern": self.genome.pattern,
                "pattern_color": self.genome.pattern_color,
                "accessory": self.genome.accessory,
                "curiosity": self.genome.curiosity,
                "energy": self.genome.energy,
                "affection": self.genome.affection,
                "shyness": self.genome.shyness,
                "cultural_base": self.genome.cultural_base.value,
                "base_hp": self.genome.base_hp,
                "base_atk": self.genome.base_atk,
                "base_spd": self.genome.base_spd,
                "generation": self.genome.generation
            },
            "position": (self.kinematics.position.x, self.kinematics.position.y),
            "velocity": (self.kinematics.velocity.x, self.kinematics.velocity.y),
            "level": self.level,
            "experience": self.experience,
            "breeding_lock_level": self.breeding_lock_level,
            "current_hp": self.current_hp,
            "alive": self.alive,
            "generation": self.generation,
            "vit_xp": self.vit_xp,
            "pwr_xp": self.pwr_xp,
            "agi_xp": self.agi_xp,
            "mnd_xp": self.mnd_xp,
            "res_xp": self.res_xp,
            "chm_xp": self.chm_xp,
            "team": self.team.value,
            "locked": self.locked,
            "age": self.age
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Creature":
        """Restore creature from save data"""
        from src.shared.genetics.cultural_base import CulturalBase
        
        # Restore genome with migration support
        g_data = data["genome"]
        culture_value = g_data.get("cultural_base", "void")
        # Culture validation is handled by enum casting below
        
        try:
            g_data["cultural_base"] = CulturalBase(culture_value)
        except ValueError:
            # Fallback to void if culture is invalid
            g_data["cultural_base"] = CulturalBase.VOID
        genome = SlimeGenome(**g_data)
        
        # Create creature
        creature = cls(
            slime_id=data["slime_id"],
            name=data["name"],
            genome=genome,
            kinematics=Kinematics(
                position=Vector2(*data["position"]),
                velocity=Vector2(*data["velocity"])
            ),
            level=data.get("level", 1),
            experience=data.get("experience", 0),
            breeding_lock_level=data.get("breeding_lock_level", 0),
            current_hp=data.get("current_hp", -1.0),
            alive=data.get("alive", True),
            generation=data.get("generation", 1),
            vit_xp=data.get("vit_xp", 0),
            pwr_xp=data.get("pwr_xp", 0),
            agi_xp=data.get("agi_xp", 0),
            mnd_xp=data.get("mnd_xp", 0),
            res_xp=data.get("res_xp", 0),
            chm_xp=data.get("chm_xp", 0),
            team=TeamRole(data.get("team", "unassigned")),
            locked=data.get("locked", False),
            age=data.get("age", 0)
        )
        
        return creature
