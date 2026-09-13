# ECS Extensions Architecture Specification

**Document Version**: 1.0  
**Date**: 2026-03-02  
**Status**: Implementation-Ready Specification  
**Target**: Phase 4A/4B Implementation after BreedingSystem

---

## Overview

This specification defines four architectural patterns that extend the current ECS design to provide:

1. **Procedure Pattern** - Serializable world state changes with audit trails
2. **Slime Entity Template** - Canonical slime construction with validation
3. **Stat Block** - Computed stats layer between genome and gameplay
4. **Zone Inventory System** - Typed slot containers for garden management

These patterns are designed to be backward compatible with existing systems while providing a foundation for future features like equipment, traits, and advanced gameplay mechanics.

---

## PATTERN 1 — PROCEDURE PATTERN

### Purpose

Every meaningful world state change is authored as a serializable Procedure object rather than applied directly. This enables audit trails, crash recovery, undo/replay functionality, and deterministic state management.

### Core Components

#### WorldProcedure (Base Class)

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any
from src.shared.engine.scene_context import SceneContext

@dataclass
class ProcedureResult:
    success: bool
    message: str
    side_effects: list[str]

class WorldProcedure(ABC):
    procedure_type: str  # canonical name
    timestamp: float     # game tick
    
    @abstractmethod
    def apply(self, context: SceneContext) -> ProcedureResult:
        """Apply the procedure and return result"""
        pass

    **Note**: See `/docs/engine/SDD/DELTA_PERSISTENCE.md` for architectural precedent. This pattern was previously designed as ADR_058 in the DGT Platform. The core insight — world state as a sequence of deltas rather than snapshots — is preserved in the current Procedure spec.
    
    @classmethod
    def from_dict(cls, data: dict) -> 'WorldProcedure':
        """Deserialize procedure from saved data"""
        # Factory method to reconstruct concrete procedures
        procedure_class = PROCEDURE_REGISTRY[data['procedure_type']]
        return procedure_class._deserialize_data(data['timestamp'], data['data'])
    
    @classmethod
    @abstractmethod
    def _deserialize_data(cls, timestamp: float, data: dict) -> 'WorldProcedure':
        """Deserialize procedure-specific data"""
        pass
```

#### Concrete Procedure Specifications

##### SlimeAddedProcedure
```python
@dataclass
class SlimeAddedProcedure(WorldProcedure):
    procedure_type = "slime_added"
    slime_data: dict  # Serialized RosterSlime
    
    def apply(self, context: SceneContext) -> ProcedureResult:
        success = context.roster_sync.add_slime_from_data(self.slime_data)
        return ProcedureResult(
            success=success,
            message=f"Added slime {self.slime_data.get('slime_id', 'unknown')}",
            side_effects=["roster_updated", "registry_updated"]
        )
```

##### SlimeRemovedProcedure
```python
@dataclass
class SlimeRemovedProcedure(WorldProcedure):
    procedure_type = "slime_removed"
    slime_id: str
    reason: str
    
    def apply(self, context: SceneContext) -> ProcedureResult:
        success = context.roster_sync.remove_slime(self.slime_id)
        return ProcedureResult(
            success=success,
            message=f"Removed slime {self.slime_id} ({self.reason})",
            side_effects=["roster_updated", "registry_updated"]
        )
```

##### SlimeLeveledUpProcedure
```python
@dataclass
class SlimeLeveledUpProcedure(WorldProcedure):
    procedure_type = "slime_leveled_up"
    slime_id: str
    new_level: int
    
    def apply(self, context: SceneContext) -> ProcedureResult:
        slime = context.roster.get_slime(self.slime_id)
        if slime:
            slime.genome.level = self.new_level
            return ProcedureResult(
                success=True,
                message=f"{slime.name} reached level {self.new_level}",
                side_effects=["slime_updated"]
            )
        return ProcedureResult(
            success=False,
            message=f"Slime {self.slime_id} not found",
            side_effects=[]
        )
```

##### SlimeBreedProcedure
```python
@dataclass
class SlimeBreedProcedure(WorldProcedure):
    procedure_type = "slime_breed"
    parent_a_id: str
    parent_b_id: str
    offspring_data: dict
    
    def apply(self, context: SceneContext) -> ProcedureResult:
        parent_a = context.roster.get_slime(self.parent_a_id)
        parent_b = context.roster.get_slime(self.parent_b_id)
        
        if not parent_a or not parent_b:
            return ProcedureResult(
                success=False,
                message="Parent slimes not found",
                side_effects=[]
            )
        
        # Use BreedingSystem to create offspring
        from src.shared.genetics.breeding_system import BreedingSystem
        offspring_genome = BreedingSystem.breed(parent_a, parent_b)
        
        if offspring_genome:
            # Create follow-up procedure to add offspring
            add_procedure = SlimeAddedProcedure(
                timestamp=self.timestamp,
                slime_data=self.offspring_data
            )
            return add_procedure.apply(context)
        
        return ProcedureResult(
            success=False,
            message="Breeding failed",
            side_effects=[]
        )
```

##### ResourceChangedProcedure
```python
@dataclass
class ResourceChangedProcedure(WorldProcedure):
    procedure_type = "resource_changed"
    resource: str
    delta: int
    source: str
    
    def apply(self, context: SceneContext) -> ProcedureResult:
        context.game_session.add_resource(self.resource, self.delta)
        return ProcedureResult(
            success=True,
            message=f"Resource {self.resource} changed by {self.delta} from {self.source}",
            side_effects=["session_updated"]
        )
```

##### SlimeDispatchedProcedure
```python
@dataclass
class SlimeDispatchedProcedure(WorldProcedure):
    procedure_type = "slime_dispatched"
    slime_id: str
    zone_type: str
    return_tick: int
    
    def apply(self, context: SceneContext) -> ProcedureResult:
        dispatch_record = context.dispatch_system.create_dispatch(
            self.slime_id, self.zone_type, self.return_tick
        )
        return ProcedureResult(
            success=bool(dispatch_record),
            message=f"Dispatched {self.slime_id} to {self.zone_type}",
            side_effects=["dispatch_created", "slime_unavailable"]
        )
```

##### DispatchResolvedProcedure
```python
@dataclass
class DispatchResolvedProcedure(WorldProcedure):
    procedure_type = "dispatch_resolved"
    dispatch_id: str
    outcome: dict
    
    def apply(self, context: SceneContext) -> ProcedureResult:
        result = context.dispatch_system.resolve_dispatch(self.dispatch_id, self.outcome)
        return ProcedureResult(
            success=result.success,
            message=f"Resolved dispatch {self.dispatch_id}",
            side_effects=["dispatch_completed", "resources_gained", "slime_returned"]
        )
```

#### ProcedureLog

```python
from collections import deque
from typing import List, Optional

@dataclass
class ProcedureLog:
    """Ordered list of all applied procedures"""
    procedures: deque[WorldProcedure] = deque(maxlen=500)
    
    def add_procedure(self, procedure: WorldProcedure) -> None:
        """Add a procedure to the log"""
        self.procedures.append(procedure)
    
    def get_recent_procedures(self, count: int = 10) -> List[WorldProcedure]:
        """Get the most recent procedures"""
        return list(self.procedures)[-count:]
    
    def to_dict(self) -> dict:
        """Serialize procedure log for saving"""
        return {
            'procedures': [proc.to_dict() for proc in self.procedures]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ProcedureLog':
        """Deserialize procedure log from saved data"""
        log = cls()
        for proc_data in data['procedures']:
            procedure = WorldProcedure.from_dict(proc_data)
            log.procedures.append(procedure)
        return log
```

### Integration Points

#### GameSession Integration
```python
@dataclass
class GameSession:
    # Existing fields...
    procedure_log: ProcedureLog = field(default_factory=ProcedureLog)
    
    def apply_procedure(self, procedure: WorldProcedure, context: SceneContext) -> ProcedureResult:
        """Apply a procedure and log it"""
        result = procedure.apply(context)
        self.procedure_log.add_procedure(procedure)
        return result
```

#### SaveManager Integration
```python
# In SaveManager.save()
session_data['procedure_log'] = game_session.procedure_log.to_dict()

# In SaveManager.load()
if 'procedure_log' in session_data:
    game_session.procedure_log = ProcedureLog.from_dict(session_data['procedure_log'])
```

### Test Anchors

1. **Procedure Serialization**: Each concrete procedure can serialize/deserialize correctly
2. **Procedure Application**: Each procedure produces expected side effects when applied
3. **ProcedureLog Ring Buffer**: Log maintains max 500 procedures, drops oldest when full
4. **ProcedureResult Validation**: All procedures return valid ProcedureResult objects
5. **Save/Restore**: ProcedureLog persists and restores correctly through SaveManager
6. **Procedure Registry**: Factory method correctly maps procedure_type to concrete class
7. **Side Effect Tracking**: Procedures accurately report their side effects
8. **Timestamp Ordering**: Procedures maintain chronological order in log

---

## PATTERN 2 — SLIME ENTITY TEMPLATE

### Purpose

A SlimeEntityTemplate declares the canonical component set every slime must carry. Construction enforces completeness. No more getattr() fallbacks for missing components — missing components are a construction error caught at creation time.

### Core Components

#### SlimeEntityTemplate

```python
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from src.shared.genetics.genome import SlimeGenome
from src.apps.slime_breeder.entities.slime import RosterSlime
from src.shared.dispatch.dispatch_system import DispatchRecord

@dataclass
class SlimeEntityTemplate:
    """Canonical template for slime entity construction"""
    
    # Required components (must be present)
    genome: SlimeGenome
    slime_id: str  # UUID
    name: str
    
    # Optional components (have defaults)
    team: Optional[str] = None
    dispatch_record: Optional[DispatchRecord] = None
    equipment_slots: Optional[Dict[str, Any]] = None  # Future equipment system
    stat_block: Optional[Dict[str, Any]] = None  # Will be StatBlock when implemented
    
    @classmethod
    def build(cls, genome: SlimeGenome, name: str, **kwargs) -> RosterSlime:
        """
        Canonical factory for all slime creation.
        Applies template, validates completeness,
        returns fully-formed RosterSlime.
        All slime creation goes through here.
        """
        import uuid
        
        slime_id = kwargs.get('slime_id', f"slime_{uuid.uuid4().hex[:8]}")
        
        # Create template instance
        template = cls(
            genome=genome,
            slime_id=slime_id,
            name=name,
            **{k: v for k, v in kwargs.items() if k in cls.__dataclass_fields__}
        )
        
        # Build RosterSlime from template
        slime = RosterSlime(
            slime_id=template.slime_id,
            name=template.name,
            genome=template.genome,
            team=template.team,
            generation=template.genome.generation
        )
        
        # Validate completeness
        validation_errors = cls.validate(slime)
        if validation_errors:
            raise ValueError(f"Invalid slime construction: {validation_errors}")
        
        return slime
    
    @classmethod  
    def validate(cls, slime: RosterSlime) -> List[str]:
        """
        Returns list of validation errors.
        Empty list = valid.
        Used in tests and debug mode.
        """
        errors = []
        
        # Required components
        if not slime.slime_id:
            errors.append("Missing slime_id")
        if not slime.name:
            errors.append("Missing name")
        if not slime.genome:
            errors.append("Missing genome")
        
        # Genome validation
        if slime.genome:
            required_genome_fields = [
                'shape', 'size', 'base_color', 'pattern', 
                'pattern_color', 'accessory', 'curiosity', 
                'energy', 'affection', 'shyness'
            ]
            for field in required_genome_fields:
                if not hasattr(slime.genome, field) or getattr(slime.genome, field) is None:
                    errors.append(f"Missing genome field: {field}")
        
        # ID format validation
        if slime.slime_id and not slime.slime_id.startswith('slime_'):
            errors.append("slime_id must start with 'slime_'")
        
        # Name validation
        if slime.name and (len(slime.name) < 1 or len(slime.name) > 50):
            errors.append("name must be 1-50 characters")
        
        return errors
    
    @classmethod
    def from_roster_slime(cls, slime: RosterSlime) -> 'SlimeEntityTemplate':
        """Create template from existing RosterSlime"""
        return cls(
            genome=slime.genome,
            slime_id=slime.slime_id,
            name=slime.name,
            team=slime.team,
            dispatch_record=getattr(slime, 'dispatch_record', None),
            equipment_slots=getattr(slime, 'equipment_slots', None),
            stat_block=getattr(slime, 'stat_block', None)
        )
```

### Migration Notes

#### RosterSyncService Integration
```python
# In RosterSyncService.add_slime()
def add_slime(self, slime: RosterSlime) -> bool:
    # Validate slime before adding
    validation_errors = SlimeEntityTemplate.validate(slime)
    if validation_errors:
        logger.error(f"Invalid slime rejected: {validation_errors}")
        return False
    
    # Continue with existing add logic...
```

#### BreedingSystem Integration
```python
# In BreedingSystem.breed()
def breed(cls, parent_a: RosterSlime, parent_b: RosterSlime, generation: int | None = None) -> Optional[RosterSlime]:
    # ... existing breeding logic ...
    
    # Create offspring using template
    offspring = SlimeEntityTemplate.build(
        genome=offspring_genome,
        name=f"{parent_a.name[:3]}{parent_b.name[:3]}-{random.randint(10, 99)}",
        generation=offspring_genome.generation
    )
    
    return offspring
```

#### Scene Integration
All slime creation points should use `SlimeEntityTemplate.build()`:
- BreedingScene offspring creation
- GardenScene slime creation
- Import/creation commands
- Test fixtures

### Test Anchors

1. **Template Build**: SlimeEntityTemplate.build() creates valid RosterSlime instances
2. **Required Field Validation**: Missing required components are caught and reported
3. **Genome Validation**: All required genome fields are validated
4. **ID Format Validation**: slime_id format is enforced
5. **Name Length Validation**: Name length constraints are enforced
6. **From RosterSlime**: Template can be created from existing RosterSlime
7. **RosterSyncService Integration**: Invalid slimes are rejected by sync service
8. **BreedingSystem Integration**: Offspring created through template validation

---

## PATTERN 3 — STAT BLOCK

### Purpose

Computed stats layer between raw genome values and final values used in gameplay. Scenes and systems read from StatBlock, never from raw genome fields. This enables equipment modifiers, culture bonuses, and lifecycle scaling.

### Core Components

#### StatBlock

```python
from dataclasses import dataclass, field
from typing import Dict, Any
from src.shared.genetics.genome import SlimeGenome

@dataclass
class StatBlock:
    """Computed stats layer between genome and gameplay"""
    
    # Base values (from genome)
    base_hp: float
    base_atk: float
    base_spd: float
    
    # Modifier layers (additive)
    equipment_hp: float = 0.0
    equipment_atk: float = 0.0
    equipment_spd: float = 0.0
    
    culture_hp: float = 0.0
    culture_atk: float = 0.0
    culture_spd: float = 0.0
    
    stage_modifier: float = 1.0
    
    # Computed finals (properties)
    @property
    def hp(self) -> int:
        return int((self.base_hp + self.equipment_hp + self.culture_hp) * self.stage_modifier)
    
    @property
    def atk(self) -> int:
        return int((self.base_atk + self.equipment_atk + self.culture_atk) * self.stage_modifier)
    
    @property
    def spd(self) -> int:
        return int((self.base_spd + self.equipment_spd + self.culture_spd) * self.stage_modifier)
    
    @classmethod
    def from_genome(cls, genome: SlimeGenome) -> 'StatBlock':
        """
        Build StatBlock from genome alone.
        Equipment modifiers default to 0.
        Culture modifiers derived from culture_expression weights.
        Stage modifier from lifecycle stage.
        """
        # Base stats from genome
        block = cls(
            base_hp=genome.base_hp,
            base_atk=genome.base_atk,
            base_spd=genome.base_spd
        )
        
        # Calculate culture modifiers
        culture_mods = block._calculate_culture_modifiers(genome.culture_expression)
        block.culture_hp = culture_mods['hp']
        block.culture_atk = culture_mods['atk']
        block.culture_spd = culture_mods['spd']
        
        # Calculate stage modifier
        block.stage_modifier = block._get_stage_modifier(genome.level)
        
        return block
    
    def _calculate_culture_modifiers(self, culture_expression: Dict[str, float]) -> Dict[str, float]:
        """Calculate stat modifiers based on culture expression weights"""
        
        # Culture stat weight constants
        CULTURE_WEIGHTS = {
            'ember': {'atk': 3.0, 'spd': 0.5, 'hp': 0.5},      # Aggressive, fast
            'gale': {'atk': 0.5, 'spd': 3.0, 'hp': 0.5},       # Swift, evasive
            'marsh': {'atk': 0.5, 'spd': 0.5, 'hp': 3.0},      # Tough, resilient
            'crystal': {'atk': 1.0, 'spd': 1.0, 'hp': 1.0},    # Balanced
            'tundra': {'atk': 0.5, 'spd': -1.0, 'hp': 2.0},    # Slow but tough
            'tide': {'atk': 2.0, 'spd': 2.0, 'hp': 0.5},       # Versatile
        }
        
        modifiers = {'hp': 0.0, 'atk': 0.0, 'spd': 0.0}
        
        for culture, weight in culture_expression.items():
            if culture in CULTURE_WEIGHTS and weight > 0.05:  # EXPRESSION_THRESHOLD
                culture_weights = CULTURE_WEIGHTS[culture]
                for stat in modifiers:
                    modifiers[stat] += weight * culture_weights[stat]
        
        return modifiers
    
    def _get_stage_modifier(self, level: int) -> float:
        """Calculate stage modifier based on slime level/lifecycle stage"""
        
        STAGE_MODIFIERS = {
            0: 0.6,   # Hatchling
            1: 0.8,   # Juvenile  
            2: 1.0,   # Young
            3: 1.2,   # Prime
            4: 1.1,   # Veteran
            5: 1.0,   # Elder (wisdom compensates decline)
        }
        
        # Cap at level 5 for elder
        capped_level = min(level, 5)
        return STAGE_MODIFIERS.get(capped_level, 1.0)
    
    def apply_equipment_modifier(self, stat: str, value: float) -> None:
        """Apply equipment modifier to specified stat"""
        if stat == 'hp':
            self.equipment_hp += value
        elif stat == 'atk':
            self.equipment_atk += value
        elif stat == 'spd':
            self.equipment_spd += value
    
    def reculture(self, new_culture_expression: Dict[str, float]) -> None:
        """Recalculate culture modifiers with new expression"""
        culture_mods = self._calculate_culture_modifiers(new_culture_expression)
        self.culture_hp = culture_mods['hp']
        self.culture_atk = culture_mods['atk']
        self.culture_spd = culture_mods['spd']
    
    def restage(self, new_level: int) -> None:
        """Update stage modifier for new level"""
        self.stage_modifier = self._get_stage_modifier(new_level)
```

### Culture Modifier Derivation

#### Culture Stat Weights
Each culture contributes differently to base stats:

- **ember**: +3.0 ATK, +0.5 SPD, +0.5 HP (aggressive, fast)
- **gale**: +0.5 ATK, +3.0 SPD, +0.5 HP (swift, evasive)  
- **marsh**: +0.5 ATK, +0.5 SPD, +3.0 HP (tough, resilient)
- **crystal**: +1.0 ATK, +1.0 SPD, +1.0 HP (balanced)
- **tundra**: +0.5 ATK, -1.0 SPD, +2.0 HP (slow but tough)
- **tide**: +2.0 ATK, +2.0 SPD, +0.5 HP (versatile)

#### Expression Threshold
Only cultures with expression weight > 0.05 contribute to modifiers. This prevents noise from minimal expression values.

#### Calculation Formula
```
modifier = expression_weight × culture_stat_weight
total_modifier = sum(all_culture_modifiers_for_stat)
```

### Stage Modifier Table

| Level | Stage        | Modifier | Description |
|-------|--------------|----------|-------------|
| 0     | Hatchling   | 0.6      | Developing, weak |
| 1     | Juvenile    | 0.8      | Growing, learning |
| 2     | Young       | 1.0      | Baseline performance |
| 3     | Prime       | 1.2      | Peak performance |
| 4     | Veteran     | 1.1      | Experienced, slight decline |
| 5+    | Elder       | 1.0      | Wisdom compensates physical decline |

### Integration Points

#### RosterSlime Integration
```python
# In RosterSlime class
@property
def stat_block(self) -> StatBlock:
    """Get or create stat block for this slime"""
    if not hasattr(self, '_stat_block') or self._stat_block is None:
        self._stat_block = StatBlock.from_genome(self.genome)
    return self._stat_block

@stat_block.setter
def stat_block(self, value: StatBlock) -> None:
    self._stat_block = value
```

#### Scene Integration
Scenes should read stats from `slime.stat_block.hp` instead of `slime.genome.base_hp`:

```python
# In combat scenes
def calculate_damage(self, attacker: RosterSlime, defender: RosterSlime) -> int:
    damage = attacker.stat_block.atk - defender.stat_block.hp // 10
    return max(1, damage)

# In UI displays
def render_slime_stats(self, slime: RosterSlime):
    hp_text = f"HP: {slime.stat_block.hp}"
    atk_text = f"ATK: {slime.stat_block.atk}"
    spd_text = f"SPD: {slime.stat_block.spd}"
```

#### Equipment Integration (Future)
```python
# When equipment is added
def apply_equipment(self, slime: RosterSlime, equipment: Equipment):
    slime.stat_block.apply_equipment_modifier('hp', equipment.hp_bonus)
    slime.stat_block.apply_equipment_modifier('atk', equipment.atk_bonus)
    slime.stat_block.apply_equipment_modifier('spd', equipment.spd_bonus)
```

### Test Anchors

1. **Base Stat Calculation**: StatBlock correctly calculates base stats from genome
2. **Culture Modifier Calculation**: Culture expression weights produce correct modifiers
3. **Expression Threshold**: Cultures below 0.05 threshold don't contribute
4. **Stage Modifier Application**: Level changes correctly update stage modifiers
5. **Equipment Modifier Application**: Equipment bonuses correctly modify stats
6. **Stat Property Computation**: Final hp/atk/spd properties calculate correctly
7. **Reculture Function**: Culture expression changes update modifiers correctly
8. **Restage Function**: Level changes update stage modifiers correctly

---

## PATTERN 4 — ZONE INVENTORY SYSTEM

### Purpose

Garden zones formalized as typed slot containers rather than ad-hoc dicts. Each zone has capacity, type constraints, and assignment rules enforced at the container level.

### Core Components

#### ZoneSlot

```python
from dataclasses import dataclass, field
from typing import List, Tuple, Optional
from src.apps.slime_breeder.entities.slime import RosterSlime

@dataclass
class ZoneSlot:
    """Typed slot container for garden zone management"""
    
    zone_type: str
    capacity: int
    allowed_stages: List[str] = field(default_factory=list)  # empty = all stages allowed
    current_occupants: List[str] = field(default_factory=list)  # slime_ids
    
    @property
    def is_full(self) -> bool:
        """Check if zone is at capacity"""
        return len(self.current_occupants) >= self.capacity
    
    @property  
    def available_capacity(self) -> int:
        """Get remaining capacity"""
        return self.capacity - len(self.current_occupants)
    
    def can_accept(self, slime: RosterSlime) -> Tuple[bool, str]:
        """Check if slime can be assigned to this zone"""
        # Check capacity
        if self.is_full:
            return False, f"{self.zone_type} zone is full"
        
        # Check stage constraints
        if self.allowed_stages:
            slime_stage = self._get_slime_stage(slime)
            if slime_stage not in self.allowed_stages:
                return False, f"{self.zone_type} zone doesn't allow {slime_stage} stage"
        
        # Check if already assigned
        if slime.slime_id in self.current_occupants:
            return False, f"Slime already assigned to {self.zone_type} zone"
        
        return True, "Can assign"
    
    def assign(self, slime_id: str) -> bool:
        """Assign slime to zone"""
        if slime_id not in self.current_occupants and not self.is_full:
            self.current_occupants.append(slime_id)
            return True
        return False
    
    def release(self, slime_id: str) -> bool:
        """Release slime from zone"""
        if slime_id in self.current_occupants:
            self.current_occupants.remove(slime_id)
            return True
        return False
    
    def get_occupants(self) -> List[str]:
        """Get list of occupant slime IDs"""
        return self.current_occupants.copy()
    
    def _get_slime_stage(self, slime: RosterSlime) -> str:
        """Get lifecycle stage name from slime level"""
        STAGE_MAP = {
            0: "Hatchling",
            1: "Juvenile", 
            2: "Young",
            3: "Prime",
            4: "Veteran",
            5: "Elder"
        }
        return STAGE_MAP.get(slime.genome.level, "Young")
    
    def to_dict(self) -> dict:
        """Serialize zone state"""
        return {
            'zone_type': self.zone_type,
            'capacity': self.capacity,
            'allowed_stages': self.allowed_stages,
            'current_occupants': self.current_occupants
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ZoneSlot':
        """Deserialize zone state"""
        return cls(
            zone_type=data['zone_type'],
            capacity=data['capacity'],
            allowed_stages=data.get('allowed_stages', []),
            current_occupants=data.get('current_occupants', [])
        )
```

#### Canonical Zone Definitions

```python
ZONE_DEFINITIONS = {
    'NURSERY': {
        'capacity': 4,
        'allowed_stages': ['Hatchling', 'Juvenile'],
        'purpose': 'growth_acceleration',
        'description': 'Young slimes develop faster in the nursery'
    },
    'TRAINING': {
        'capacity': 6,
        'allowed_stages': [],  # all stages allowed
        'purpose': 'stat_development',
        'description': 'Training ground for combat and skill development'
    },
    'FORAGING': {
        'capacity': 4,
        'allowed_stages': ['Young', 'Prime', 'Veteran', 'Elder'],
        'purpose': 'passive_resource_generation',
        'description': 'Mature slimes gather resources while idle'
    },
    'OUTPOST': {
        'capacity': 2,
        'allowed_stages': ['Prime', 'Veteran', 'Elder'],
        'purpose': 'territory_awareness',
        'dispatch_bonus': True,
        'description': 'Elite slimes provide dispatch bonuses and territory control'
    }
}
```

#### GardenZoneManager

```python
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from src.shared.session.game_session import GameSession

@dataclass
class GardenZoneManager:
    """Manages all garden zones and assignments"""
    
    zones: Dict[str, ZoneSlot] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize zones with canonical definitions"""
        for zone_name, zone_def in ZONE_DEFINITIONS.items():
            self.zones[zone_name] = ZoneSlot(
                zone_type=zone_name,
                capacity=zone_def['capacity'],
                allowed_stages=zone_def['allowed_stages']
            )
    
    def assign_to_zone(self, slime: RosterSlime, zone: str) -> Tuple[bool, str]:
        """Assign slime to specified zone"""
        if zone not in self.zones:
            return False, f"Zone {zone} does not exist"
        
        # Remove from current zone first
        current_zone = self.get_slime_zone(slime.slime_id)
        if current_zone:
            self.zones[current_zone].release(slime.slime_id)
        
        # Assign to new zone
        zone_slot = self.zones[zone]
        can_accept, reason = zone_slot.can_accept(slime)
        if can_accept:
            success = zone_slot.assign(slime.slime_id)
            return success, f"Assigned to {zone}" if success else "Assignment failed"
        else:
            return False, reason
    
    def get_zone_occupants(self, zone: str) -> List[str]:
        """Get list of slime IDs in specified zone"""
        if zone in self.zones:
            return self.zones[zone].get_occupants()
        return []
    
    def get_slime_zone(self, slime_id: str) -> Optional[str]:
        """Get zone where slime is currently assigned"""
        for zone_name, zone_slot in self.zones.items():
            if slime_id in zone_slot.current_occupants:
                return zone_name
        return None
    
    def get_zone_info(self, zone: str) -> Optional[Dict[str, any]]:
        """Get zone information including capacity and occupants"""
        if zone not in self.zones:
            return None
        
        zone_slot = self.zones[zone]
        zone_def = ZONE_DEFINITIONS[zone]
        
        return {
            'zone_type': zone,
            'capacity': zone_slot.capacity,
            'current_occupants': len(zone_slot.current_occupants),
            'available_capacity': zone_slot.available_capacity,
            'is_full': zone_slot.is_full,
            'allowed_stages': zone_slot.allowed_stages,
            'purpose': zone_def['purpose'],
            'description': zone_def['description']
        }
    
    def get_all_zones_info(self) -> Dict[str, Dict[str, any]]:
        """Get information for all zones"""
        return {zone: self.get_zone_info(zone) for zone in self.zones}
    
    def idle_resource_tick(self, dt: float, session: GameSession) -> Dict[str, int]:
        """
        Calculate passive resource generation from idle slimes.
        Foraging slimes generate food based on time and slime level.
        """
        resources_gained = {}
        
        foraging_zone = self.zones.get('FORAGING')
        if not foraging_zone:
            return resources_gained
        
        # Calculate resource generation
        for slime_id in foraging_zone.current_occupants:
            # Resource generation rate: base_rate * level_modifier * time
            base_rate = 1.0  # food per second
            level_modifier = 1.0 + (session.get_slime_level(slime_id) * 0.2)
            generation_rate = base_rate * level_modifier * dt
            
            food_gained = int(generation_rate)
            if food_gained > 0:
                resources_gained['food'] = resources_gained.get('food', 0) + food_gained
        
        # Add resources to session
        for resource, amount in resources_gained.items():
            session.add_resource(resource, amount)
        
        return resources_gained
    
    def validate_assignments(self, roster) -> List[str]:
        """Validate all zone assignments against roster"""
        errors = []
        
        for zone_name, zone_slot in self.zones.items():
            for slime_id in zone_slot.current_occupants:
                slime = roster.get_slime(slime_id)
                if not slime:
                    errors.append(f"Slime {slime_id} in {zone_name} not found in roster")
                    continue
                
                can_accept, reason = zone_slot.can_accept(slime)
                if not can_accept:
                    errors.append(f"Slime {slime_id} invalid in {zone_name}: {reason}")
        
        return errors
    
    def to_dict(self) -> dict:
        """Serialize zone manager state"""
        return {
            'zones': {name: zone.to_dict() for name, zone in self.zones.items()}
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'GardenZoneManager':
        """Deserialize zone manager state"""
        manager = cls()
        
        for zone_name, zone_data in data['zones'].items():
            manager.zones[zone_name] = ZoneSlot.from_dict(zone_data)
        
        return manager
```

### Integration Points

#### GameSession Integration
```python
@dataclass
class GameSession:
    # Existing fields...
    zone_manager: GardenZoneManager = field(default_factory=GardenZoneManager)
    
    def assign_slime_to_zone(self, slime_id: str, zone: str) -> Tuple[bool, str]:
        """Assign slime to zone through session"""
        slime = self.roster.get_slime(slime_id)
        if not slime:
            return False, "Slime not found"
        
        return self.zone_manager.assign_to_zone(slime, zone)
    
    def update(self, dt: float):
        """Update session including zone resource generation"""
        # Existing update logic...
        
        # Generate passive resources from zones
        resources = self.zone_manager.idle_resource_tick(dt, self)
        if resources:
            logger.info(f"Passive resources generated: {resources}")
```

#### SaveManager Integration
```python
# In SaveManager.save()
session_data['zone_manager'] = game_session.zone_manager.to_dict()

# In SaveManager.load()
if 'zone_manager' in session_data:
    game_session.zone_manager = GardenZoneManager.from_dict(session_data['zone_manager'])
```

#### Scene Integration
```python
# In GardenScene or similar
def handle_zone_assignment(self, slime: RosterSlime, target_zone: str):
    success, message = self.context.game_session.assign_slime_to_zone(slime.slime_id, target_zone)
    
    if success:
        self.show_message(f"{slime.name} assigned to {target_zone}")
    else:
        self.show_error(f"Failed to assign: {message}")
    
    self.refresh_zone_display()
```

### Test Anchors

1. **Zone Capacity Enforcement**: Zones reject assignments when full
2. **Stage Constraint Validation**: Zones reject slimes of disallowed stages
3. **Assignment Transfer**: Slimes move between zones correctly
4. **Resource Generation**: Foraging zone generates resources based on slime levels
5. **Zone Serialization**: Zone state persists and restores correctly
6. **Validation System**: Invalid assignments are detected and reported
7. **Zone Information Retrieval**: Zone info queries return correct data
8. **Idle Resource Calculation**: Resource generation rates calculate correctly

---

## IMPLEMENTATION SEQUENCE

### Phase 4A (Next after BreedingSystem)

#### 1. SlimeEntityTemplate
**Priority**: High  
**Affects**: RosterSyncService, BreedingSystem, all slime creation points  
**Dependencies**: None  
**Estimated Effort**: 2-3 days

**Implementation Steps**:
1. Create `src/shared/entities/slime_entity_template.py`
2. Implement `SlimeEntityTemplate` class with `build()` and `validate()` methods
3. Update `RosterSyncService.add_slime()` to call `validate()` before adding
4. Update `BreedingSystem.breed()` to use `build()` for offspring creation
5. Update all slime creation points to use `SlimeEntityTemplate.build()`
6. Add comprehensive tests for template validation and building

**Migration Notes**:
- Existing slimes in save files will continue to work (backward compatibility)
- New validation will catch future construction errors
- All new slime creation must go through template

#### 2. StatBlock
**Priority**: High  
**Affects**: UI display, dungeon combat, stat calculations  
**Dependencies**: SlimeEntityTemplate  
**Estimated Effort**: 3-4 days

**Implementation Steps**:
1. Create `src/shared/stats/stat_block.py`
2. Implement `StatBlock` class with culture and stage modifiers
3. Add `stat_block` property to `RosterSlime`
4. Update UI components to read from `slime.stat_block` instead of genome
5. Update combat scenes to use `stat_block` for damage calculations
6. Add tests for culture modifier calculations and stage scaling

**Migration Notes**:
- Existing code using genome stats will continue to work
- New code should prefer `stat_block` properties
- Gradual migration of stat usage points

#### 3. ZoneInventory
**Priority**: Medium  
**Affects**: Garden assignment, idle resource generation  
**Dependencies**: None  
**Estimated Effort**: 2-3 days

**Implementation Steps**:
1. Create `src/shared/zones/zone_slot.py` and `garden_zone_manager.py`
2. Implement `ZoneSlot` and `GardenZoneManager` classes
3. Add `zone_manager` to `GameSession`
4. Update garden scenes to use zone manager for assignments
5. Implement idle resource generation in game update loop
6. Add tests for zone capacity, constraints, and resource generation

**Migration Notes**:
- Existing garden assignment logic will be replaced
- Save format changes to include zone manager state
- UI updates to show zone information

### Phase 4B

#### 4. WorldProcedure Base + Concrete Types
**Priority**: Medium  
**Affects**: SaveManager, audit logging, state management  
**Dependencies**: All Phase 4A components  
**Estimated Effort**: 4-5 days

**Implementation Steps**:
1. Create `src/shared/procedures/world_procedure.py`
2. Implement base `WorldProcedure` class and `ProcedureResult`
3. Create concrete procedure classes for all major state changes
4. Add `ProcedureLog` to `GameSession`
5. Update all major state changes to use procedures
6. Update `SaveManager` to persist procedure log
7. Add tests for procedure serialization and application

**Migration Notes**:
- Existing state change logic will be wrapped in procedures
- New audit trail will be available
- Future undo/replay functionality enabled

#### 5. ProcedureLog in GameSession
**Priority**: Low  
**Affects**: Debugging, crash recovery, audit trails  
**Dependencies**: WorldProcedure system  
**Estimated Effort**: 1-2 days

**Implementation Steps**:
1. Integrate `ProcedureLog` into `GameSession` update loop
2. Add procedure logging to all state change points
3. Implement crash recovery using procedure log
4. Add debug tools for procedure inspection
5. Add tests for log persistence and recovery

### Phase 5 (When Equipment Arrives)

#### 6. Equipment Modifiers Feed StatBlock
**Priority**: Future  
**Affects**: Equipment system, stat calculations  
**Dependencies**: StatBlock, Equipment system  
**Estimated Effort**: 2-3 days

#### 7. ItemSlot System (From Fydar Concepts)
**Priority**: Future  
**Affects**: Inventory management, equipment  
**Dependencies**: Equipment system  
**Estimated Effort**: 3-4 days

#### 8. Trait/Buff Layer on StatBlock
**Priority**: Future  
**Affects**: Advanced gameplay, temporary effects  
**Dependencies**: StatBlock, effect system  
**Estimated Effort**: 2-3 days

---

## COMPATIBILITY NOTES

### Existing System Compatibility

All patterns are designed to be backward compatible with existing systems:

- **SlimeGenome**: No changes required, continues to work as data source
- **RosterSyncService**: Enhanced with validation, core functionality unchanged
- **EntityRegistry**: No changes required, continues to manage slime entities
- **SceneContext**: Enhanced with procedure application, core functionality unchanged
- **DispatchSystem**: No changes required, continues to manage dispatches
- **GameSession**: Enhanced with zone manager and procedure log, core functionality unchanged
- **SaveManager**: Enhanced to persist new state, existing save format supported

### Migration Strategy

1. **Gradual Implementation**: Each pattern can be implemented independently
2. **Backward Compatibility**: Existing save files and code continue to work
3. **Feature Flags**: New features can be enabled/disabled during development
4. **Test Coverage**: Comprehensive tests ensure no regressions
5. **Documentation**: All changes documented for future reference

### Performance Considerations

- **StatBlock**: Cached calculations, minimal overhead
- **ZoneInventory**: Simple list operations, O(1) capacity checks
- **Procedures**: Serialization overhead only during save/load
- **Templates**: Validation only during creation, no runtime overhead

---

## CONCLUSION

This specification provides a comprehensive roadmap for extending the ECS architecture with four powerful patterns that will:

1. **Improve Data Integrity**: Entity templates ensure complete, valid slime objects
2. **Enable Complex Gameplay**: Stat blocks support equipment, culture, and lifecycle effects
3. **Organize Garden Management**: Zone inventory provides structured, constraint-based assignments
4. **Provide Audit Trails**: Procedures enable debugging, crash recovery, and future undo functionality

The implementation sequence is designed to deliver value incrementally while maintaining system stability and backward compatibility. Each pattern builds on previous work, creating a solid foundation for future gameplay features.

The specification is implementation-ready, with detailed class designs, integration points, and test anchors that will allow an agent to write comprehensive tests before implementing the actual code.
