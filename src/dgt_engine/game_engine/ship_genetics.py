"""
DGT Ship Genetics - ADR 129 Implementation
Component-based genetic system for modular spaceship design

Maps TurboShells genetic traits to ship systems and components
Supports modular compositing and tactical combat mechanics
"""

import random
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import hashlib

from pydantic import BaseModel, Field, validator, ConfigDict
from loguru import logger

print("DEBUG: Importing apps.rpg.logic.ship_genetics")
import sys; sys.stdout.flush()


class HullType(str, Enum):
    """Ship hull classification"""
    LIGHT = "light"
    MEDIUM = "medium"
    HEAVY = "heavy"
    STEALTH = "stealth"


class WeaponType(str, Enum):
    """Weapon system classifications"""
    LASER = "laser"
    PLASMA = "plasma"
    MISSILE = "missile"
    RAILGUN = "railgun"
    PARTICLE = "particle"


class EngineType(str, Enum):
    """Engine system classifications"""
    ION = "ion"
    FUSION = "fusion"
    ANTIMATTER = "antimatter"
    SOLAR = "solar"
    WARP = "warp"


@dataclass
class ShipComponent:
    """Individual ship component with genetic properties"""
    component_id: str
    component_type: str
    base_stats: Dict[str, float]
    genetic_modifiers: Dict[str, float]
    sprite_asset: str
    color_tint: Tuple[int, int, int]
    durability: float = 100.0
    
    def get_effective_stat(self, stat_name: str) -> float:
        """Calculate effective stat with genetic modifiers"""
        base = self.base_stats.get(stat_name, 1.0)
        modifier = self.genetic_modifiers.get(stat_name, 1.0)
        return base * modifier


class ShipGenome(BaseModel):
    """Genetic blueprint for modular spaceship construction"""
    
    # === Hull Systems (4 traits) ===
    hull_type: HullType = Field(default=HullType.MEDIUM, description="Ship hull classification")
    plating_density: float = Field(default=1.0, ge=0.5, le=2.0, description="Armor plating density")
    shield_frequency: float = Field(default=1.0, ge=0.5, le=2.0, description="Shield frequency tuning")
    structural_integrity: float = Field(default=1.0, ge=0.5, le=2.0, description="Structural integrity factor")
    
    # === Engine Systems (4 traits) ===
    thruster_output: float = Field(default=1.0, ge=0.5, le=3.0, description="Thruster power output")
    fuel_efficiency: float = Field(default=1.0, ge=0.5, le=3.0, description="Fuel efficiency rating")
    engine_type: EngineType = Field(default=EngineType.ION, description="Engine classification")
    cooling_capacity: float = Field(default=1.0, ge=0.5, le=2.0, description="Cooling system capacity")
    
    # === Weapon Systems (4 traits) ===
    primary_weapon: WeaponType = Field(default=WeaponType.LASER, description="Primary weapon type")
    weapon_damage: float = Field(default=1.0, ge=0.5, le=3.0, description="Weapon damage modifier")
    fire_rate: float = Field(default=1.0, ge=0.5, le=3.0, description="Weapon fire rate")
    targeting_system: float = Field(default=1.0, ge=0.5, le=2.0, description="Targeting system accuracy")
    
    # === Combat Systems (3 traits) ===
    initiative: float = Field(default=1.0, ge=0.5, le=3.0, description="Combat initiative/speed")
    evasion: float = Field(default=1.0, ge=0.5, le=3.0, description="Evasion capability")
    critical_chance: float = Field(default=1.0, ge=0.5, le=2.0, description="Critical hit chance")
    
    # === Meta Properties ===
    generation: int = Field(default=0, ge=0, description="Generation number")
    mutation_rate: float = Field(default=0.1, ge=0.0, le=1.0, description="Mutation rate")
    ship_signature: Optional[str] = Field(default=None, description="Unique ship hash")
    
    model_config = ConfigDict(validate_assignment=True, use_enum_values=True)
    
    @validator('ship_signature', pre=True, always=True)
    def generate_signature(cls, v, values):
        """Generate unique ship signature from genetic data"""
        if v is not None:
            return v
        
        # Create deterministic hash from genetic values
        genetic_string = f"{values.get('hull_type', 'medium')}-{values.get('thruster_output', 1.0)}-{values.get('weapon_damage', 1.0)}-{values.get('initiative', 1.0)}"
        return hashlib.md5(genetic_string.encode()).hexdigest()[:12]
    
    def calculate_combat_stats(self) -> Dict[str, float]:
        """Calculate combat-ready stats from genetic blueprint"""
        return {
            'armor_class': 10 + (self.plating_density * 5) + (self.structural_integrity * 3),
            'shield_capacity': 50 + (self.shield_frequency * 25),
            'speed': self.thruster_output * self.fuel_efficiency,
            'initiative': self.initiative * 10,
            'evasion': self.evasion * 15,
            'weapon_damage': self.weapon_damage * 20,
            'fire_rate': self.fire_rate * 2,
            'critical_chance': self.critical_chance * 0.1,
            'accuracy': self.targeting_system * 0.8
        }
    
    def calculate_atb_speed(self) -> float:
        """Calculate Active Time Battle fill speed"""
        base_speed = self.initiative * self.thruster_output
        engine_bonus = {
            EngineType.WARP: 1.5,
            EngineType.ANTIMATTER: 1.3,
            EngineType.FUSION: 1.1,
            EngineType.ION: 1.0,
            EngineType.SOLAR: 0.8
        }.get(self.engine_type, 1.0)
        
        return base_speed * engine_bonus
    
    def get_components(self) -> List[ShipComponent]:
        """Generate ship components from genetic blueprint"""
        components = []
        
        # Frame Component (Hull)
        frame_stats = {
            'armor': self.plating_density,
            'durability': self.structural_integrity,
            'mass': 1.0 / self.thruster_output
        }
        
        frame = ShipComponent(
            component_id=f"frame_{self.ship_signature[:8]}",
            component_type="frame",
            base_stats=frame_stats,
            genetic_modifiers={'armor': self.plating_density, 'durability': self.structural_integrity},
            sprite_asset=f"hull_{self.hull_type.value}",
            color_tint=self._get_hull_color()
        )
        components.append(frame)
        
        # Engine Component
        engine_stats = {
            'thrust': self.thruster_output,
            'efficiency': self.fuel_efficiency,
            'heat_dissipation': self.cooling_capacity
        }
        
        engine = ShipComponent(
            component_id=f"engine_{self.ship_signature[8:16]}",
            component_type="engine",
            base_stats=engine_stats,
            genetic_modifiers={'thrust': self.thruster_output, 'efficiency': self.fuel_efficiency},
            sprite_asset=f"engine_{self.engine_type.value}",
            color_tint=self._get_engine_color()
        )
        components.append(engine)
        
        # Weapon Component
        weapon_stats = {
            'damage': self.weapon_damage,
            'fire_rate': self.fire_rate,
            'accuracy': self.targeting_system
        }
        
        weapon = ShipComponent(
            component_id=f"weapon_{self.ship_signature[4:12]}",
            component_type="weapon",
            base_stats=weapon_stats,
            genetic_modifiers={'damage': self.weapon_damage, 'accuracy': self.targeting_system},
            sprite_asset=f"weapon_{self.primary_weapon.value}",
            color_tint=self._get_weapon_color()
        )
        components.append(weapon)
        
        return components
    
    def _get_hull_color(self) -> Tuple[int, int, int]:
        """Get hull color based on genetic traits"""
        base_colors = {
            HullType.LIGHT: (200, 200, 220),    # Light gray
            HullType.MEDIUM: (150, 150, 180),   # Medium gray
            HullType.HEAVY: (100, 100, 140),   # Dark gray
            HullType.STEALTH: (50, 50, 80),     # Very dark gray
        }
        
        base = base_colors.get(self.hull_type, (150, 150, 180))
        
        # Modify based on plating density
        modifier = int((self.plating_density - 1.0) * 50)
        return tuple(max(0, min(255, c + modifier)) for c in base)
    
    def _get_engine_color(self) -> Tuple[int, int, int]:
        """Get engine color based on type and output"""
        base_colors = {
            EngineType.ION: (100, 200, 255),      # Blue
            EngineType.FUSION: (255, 200, 100),    # Yellow
            EngineType.ANTIMATTER: (255, 100, 255), # Magenta
            EngineType.SOLAR: (255, 255, 100),     # Bright yellow
            EngineType.WARP: (200, 100, 255)       # Purple
        }
        
        base = base_colors.get(self.engine_type, (100, 200, 255))
        
        # Modify based on thruster output
        intensity = min(1.0, self.thruster_output / 2.0)
        return tuple(int(c * (0.5 + intensity * 0.5)) for c in base)
    
    def _get_weapon_color(self) -> Tuple[int, int, int]:
        """Get weapon color based on type and damage"""
        base_colors = {
            WeaponType.LASER: (255, 100, 100),     # Red
            WeaponType.PLASMA: (255, 150, 50),     # Orange
            WeaponType.MISSILE: (200, 200, 200),   # Silver
            WeaponType.RAILGUN: (150, 255, 150),   # Green
            WeaponType.PARTICLE: (255, 100, 255)   # Magenta
        }
        
        base = base_colors.get(self.primary_weapon, (255, 100, 100))
        
        # Modify based on weapon damage
        intensity = min(1.0, self.weapon_damage / 2.0)
        return tuple(int(c * (0.7 + intensity * 0.3)) for c in base)
    
    def mutate(self, intensity: float = 0.1) -> 'ShipGenome':
        """Apply mutations to create genetic variation"""
        mutations = {
            'plating_density': random.gauss(1.0, intensity),
            'shield_frequency': random.gauss(1.0, intensity),
            'structural_integrity': random.gauss(1.0, intensity),
            'thruster_output': random.gauss(1.0, intensity),
            'fuel_efficiency': random.gauss(1.0, intensity),
            'cooling_capacity': random.gauss(1.0, intensity),
            'weapon_damage': random.gauss(1.0, intensity),
            'fire_rate': random.gauss(1.0, intensity),
            'targeting_system': random.gauss(1.0, intensity),
            'initiative': random.gauss(1.0, intensity),
            'evasion': random.gauss(1.0, intensity),
            'critical_chance': random.gauss(1.0, intensity)
        }
        
        # Apply mutations with constraints
        new_data = self.model_dump()
        for trait, mutation in mutations.items():
            if trait in new_data and isinstance(new_data[trait], (int, float)):
                new_value = new_data[trait] * mutation
                
                # Apply field constraints
                if trait in ['plating_density', 'shield_frequency', 'structural_integrity', 'cooling_capacity']:
                    new_value = max(0.5, min(2.0, new_value))
                elif trait in ['thruster_output', 'fuel_efficiency', 'weapon_damage', 'fire_rate', 'initiative', 'evasion']:
                    new_value = max(0.5, min(3.0, new_value))
                elif trait in ['targeting_system', 'critical_chance']:
                    new_value = max(0.5, min(2.0, new_value))
                
                new_data[trait] = new_value
        
        # Occasionally change enum types
        if random.random() < self.mutation_rate:
            if random.random() < 0.3:
                new_data['hull_type'] = random.choice(list(HullType))
            if random.random() < 0.3:
                new_data['engine_type'] = random.choice(list(EngineType))
            if random.random() < 0.3:
                new_data['primary_weapon'] = random.choice(list(WeaponType))
        
        # Increment generation
        new_data['generation'] = self.generation + 1
        new_data['ship_signature'] = None  # Will be regenerated
        
        return ShipGenome(**new_data)
    
    def crossover(self, other: 'ShipGenome') -> 'ShipGenome':
        """Create offspring through genetic crossover"""
        child_data = {}
        
        # Numeric traits - 50% chance from each parent
        numeric_traits = [
            'plating_density', 'shield_frequency', 'structural_integrity',
            'thruster_output', 'fuel_efficiency', 'cooling_capacity',
            'weapon_damage', 'fire_rate', 'targeting_system',
            'initiative', 'evasion', 'critical_chance'
        ]
        
        for trait in numeric_traits:
            if random.random() < 0.5:
                child_data[trait] = getattr(self, trait)
            else:
                child_data[trait] = getattr(other, trait)
        
        # Enum traits - 50% chance from each parent
        enum_traits = ['hull_type', 'engine_type', 'primary_weapon']
        for trait in enum_traits:
            if random.random() < 0.5:
                child_data[trait] = getattr(self, trait)
            else:
                child_data[trait] = getattr(other, trait)
        
        # Meta properties
        child_data['generation'] = max(self.generation, other.generation) + 1
        child_data['mutation_rate'] = (self.mutation_rate + other.mutation_rate) / 2
        child_data['ship_signature'] = None  # Will be regenerated
        
        return ShipGenome(**child_data)
    
    def calculate_fitness(self) -> float:
        """Calculate overall fitness score for selection"""
        stats = self.calculate_combat_stats()
        
        # Weight different aspects
        weights = {
            'armor_class': 0.15,
            'shield_capacity': 0.10,
            'speed': 0.20,
            'initiative': 0.20,
            'evasion': 0.10,
            'weapon_damage': 0.15,
            'fire_rate': 0.05,
            'critical_chance': 0.05
        }
        
        fitness = 0.0
        for stat, weight in weights.items():
            normalized_value = min(1.0, stats.get(stat, 0) / 100.0)  # Normalize to 0-1
            fitness += normalized_value * weight
        
        return fitness


# Global ship genetic registry
class ShipGeneticRegistry:
    """Registry for ship genetic templates and variations"""
    
    def __init__(self):
        self.templates = {}
        self._initialize_templates()
        
        logger.info("🚀 Ship Genetic Registry initialized")
    
    def _initialize_templates(self):
        """Initialize base ship templates"""
        # Light Fighter
        self.templates['light_fighter'] = ShipGenome(
            hull_type=HullType.LIGHT,
            plating_density=0.8,
            thruster_output=2.5,
            weapon_damage=1.8,
            initiative=2.2,
            engine_type=EngineType.ION,
            primary_weapon=WeaponType.LASER
        )
        
        # Medium Cruiser
        self.templates['medium_cruiser'] = ShipGenome(
            hull_type=HullType.MEDIUM,
            plating_density=1.2,
            thruster_output=1.5,
            weapon_damage=1.5,
            initiative=1.2,
            engine_type=EngineType.FUSION,
            primary_weapon=WeaponType.PLASMA
        )
        
        # Heavy Battleship
        self.templates['heavy_battleship'] = ShipGenome(
            hull_type=HullType.HEAVY,
            plating_density=1.8,
            thruster_output=0.8,
            weapon_damage=2.5,
            initiative=0.8,
            engine_type=EngineType.ANTIMATTER,
            primary_weapon=WeaponType.RAILGUN
        )
        
        # Stealth Scout
        self.templates['stealth_scout'] = ShipGenome(
            hull_type=HullType.STEALTH,
            plating_density=0.6,
            thruster_output=1.8,
            weapon_damage=1.2,
            initiative=2.0,
            evasion=2.5,
            engine_type=EngineType.SOLAR,
            primary_weapon=WeaponType.PARTICLE
        )
    
    def generate_random_ship(self, template_name: Optional[str] = None) -> ShipGenome:
        """Generate a random ship from template or completely random"""
        if template_name and template_name in self.templates:
            base = self.templates[template_name]
            return base.mutate(intensity=0.3)
        else:
            # Completely random ship
            return ShipGenome(
                hull_type=random.choice(list(HullType)),
                plating_density=random.uniform(0.5, 2.0),
                shield_frequency=random.uniform(0.5, 2.0),
                structural_integrity=random.uniform(0.5, 2.0),
                thruster_output=random.uniform(0.5, 3.0),
                fuel_efficiency=random.uniform(0.5, 3.0),
                engine_type=random.choice(list(EngineType)),
                cooling_capacity=random.uniform(0.5, 2.0),
                primary_weapon=random.choice(list(WeaponType)),
                weapon_damage=random.uniform(0.5, 3.0),
                fire_rate=random.uniform(0.5, 3.0),
                targeting_system=random.uniform(0.5, 2.0),
                initiative=random.uniform(0.5, 3.0),
                evasion=random.uniform(0.5, 3.0),
                critical_chance=random.uniform(0.5, 2.0),
                generation=0,
                mutation_rate=random.uniform(0.05, 0.2)
            )
    
    def get_template_names(self) -> List[str]:
        """Get available template names"""
        return list(self.templates.keys())


# Global ship genetic registry instance
ship_genetic_registry = ShipGeneticRegistry()
